# Migration Guide: Traefik Log Dashboard V1 to V2

##  Overview

This guide will help you migrate from Traefik Log Dashboard V1.x (monolithic backend with OTLP tracing) to V2.x (multi-agent architecture with persistent database).

---

##  Key Changes in V2

### 1. **Architecture Overhaul**
```diff
- Monolithic backend (Node.js/Express)
+ Agent-based architecture (Go)
+ Multi-agent support with centralized dashboard
+ SQLite database for persistent agent configuration
```

### 2. **OpenTelemetry Removal**
```diff
- OTLP tracing support (gRPC/HTTP)
+ Log-based analytics only
```

If you require OpenTelemetry tracing:
- Consider using dedicated OTLP collectors (Jaeger, Tempo, Grafana)
- The dashboard now provides log-based analytics only

### 3. **Port Changes**
```diff
- Backend: 3001 → Agent: 5000
- OTLP GRPC: 4317 (removed)
- OTLP HTTP: 4318 (removed)
  Frontend: 3000 (unchanged)
```

### 4. **Authentication Required**
Agent and dashboard now require token authentication:
```diff
- No authentication
+ Bearer token authentication between components
```

### 5. **Database Introduction**
```diff
- In-memory/localStorage agent configuration
+ SQLite database for persistent agent storage
+ Protected environment agents
+ Agent status tracking with lastSeen timestamps
```

### 6. **Bug Fixes and Improvements**
- ✅ Fixed date handling (proper ISO string and Date object conversion)
- ✅ Enhanced error messages for delete operations
- ✅ Parallel fetching for improved performance
- ✅ Optimized state management
- ✅ Better agent status tracking
- ✅ Protected environment agents cannot be deleted from UI

---

##  Pre-Migration Checklist

- [ ] **Backup current setup**
  ```bash
  # Backup compose file and environment
  cp docker-compose.yml docker-compose.yml.backup
  cp .env .env.backup
  
  # Export current data if needed
  docker compose logs backend > backend-logs.txt
  ```

- [ ] **Review dependencies**
  - Ensure Traefik outputs JSON access logs
  - Confirm log file paths are accessible
  - Download MaxMind GeoIP databases if using geolocation

- [ ] **Plan downtime**
  - Estimate: 10-15 minutes for migration
  - Consider maintenance window for production

- [ ] **Remove OTLP from Traefik**
  - New version doesn't support OTLP
  - Update Traefik config to keep JSON logging only

- [ ] **Generate secure tokens**
  ```bash
  # Generate strong authentication tokens
  openssl rand -hex 32
  ```

---

##  Migration Steps

### Step 1: Stop Old Services

```bash
# Navigate to project directory
cd traefik-log-dashboard

# Stop all services
docker compose down

# Optional: Remove old images
docker rmi hhftechnology/traefik-log-dashboard-backend:latest
docker rmi hhftechnology/traefik-log-dashboard-frontend:latest
```

### Step 2: Update Traefik Configuration

**Remove OTLP tracing** from your Traefik configuration:

```yaml
# traefik.yml - REMOVE these sections:
# tracing:
#   otlp:
#     http:
#       endpoint: "http://traefik-dashboard-backend:4318/v1/traces"

# KEEP ONLY access logs:
accessLog:
  filePath: "/logs/access.log"
  format: json
  bufferingSize: 100
  
  fields:
    defaultMode: keep
    names:
      ClientUsername: drop
    headers:
      defaultMode: keep
      names:
        Authorization: drop
        Cookie: drop
```

**Apply changes:**
```bash
# Restart Traefik to apply config
docker compose restart traefik
```

### Step 3: Create New Directory Structure

```bash
# Create required directories
mkdir -p data/geoip
mkdir -p data/positions
mkdir -p data/dashboard  # NEW: For SQLite database

# Set proper permissions
chmod 755 data/geoip data/positions data/dashboard
chown -R 1001:1001 ./data/dashboard
```

### Step 4: Download GeoIP Databases (Optional)

If using geolocation features:

```bash
cd data/geoip

# Download using MaxMind license key
wget "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=YOUR_KEY&suffix=tar.gz" -O GeoLite2-City.tar.gz

wget "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=YOUR_KEY&suffix=tar.gz" -O GeoLite2-Country.tar.gz

# Extract
tar -xzf GeoLite2-City.tar.gz --strip-components=1
tar -xzf GeoLite2-Country.tar.gz --strip-components=1

# Clean up
rm *.tar.gz

cd ../..
```

Sign up for free MaxMind account: https://www.maxmind.com/en/geolite2/signup

### Step 5: Generate Authentication Token

```bash
# Generate a cryptographically secure token
TOKEN=$(openssl rand -hex 32)
echo "Generated token: $TOKEN"
echo "⚠️  IMPORTANT: Save this token securely!"
```

### Step 6: Create New docker-compose.yml

Replace your old docker-compose.yml with:

```yaml
services:
  # Traefik Log Dashboard Agent
  traefik-agent:
    image: hhftechnology/traefik-log-dashboard-agent:dev-dashboard
    container_name: traefik-log-dashboard-agent
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - ./data/logs:/logs:ro                # Your Traefik logs
      - ./data/geoip:/geoip:ro             # GeoIP databases
      - ./data/positions:/data              # Position tracking
    environment:
      # Log Paths
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_ERROR_PATH=/logs/access.log
      
      # Authentication - REPLACE WITH YOUR TOKEN
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=YOUR_GENERATED_TOKEN_HERE
      
      # System Monitoring
      - TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING=true
      
      # GeoIP Configuration
      - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true
      - TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb
      - TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB=/geoip/GeoLite2-Country.mmdb
      
      # Log Format
      - TRAEFIK_LOG_DASHBOARD_LOG_FORMAT=json
      
      # Server Port
      - PORT=5000
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/logs/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - traefik-network

  # Traefik Log Dashboard - Next.js web UI
  traefik-dashboard:
    image: hhftechnology/traefik-log-dashboard:dev-dashboard
    container_name: traefik-log-dashboard
    restart: unless-stopped
    user: "1001:1001"
    ports:
      - "3000:3000"
    volumes:
      - ./data/dashboard:/app/data         # NEW: SQLite database storage
    environment:
      # Agent Configuration - REPLACE WITH YOUR TOKEN
      - AGENT_API_URL=http://traefik-agent:5000
      - AGENT_API_TOKEN=YOUR_GENERATED_TOKEN_HERE
      - AGENT_NAME=Default Agent           # Optional: Custom name
      
      # Node Environment
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      traefik-agent:
        condition: service_healthy
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true
```

** Important Configuration Notes:**

1. Replace `YOUR_GENERATED_TOKEN_HERE` with the token you generated in Step 5
2. Ensure both `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN` and `AGENT_API_TOKEN` use the **same token**
3. Update network name (`traefik-network`) to match your existing Traefik network
4. Adjust log paths (`./data/logs`) to point to your actual Traefik logs directory

### Step 7: Update Log Volume Paths

```bash
# If your Traefik logs are in a different location:
# Update the volume mount in docker-compose.yml
# Example:
# - /var/log/traefik:/logs:ro
# OR
# - /opt/traefik/logs:/logs:ro
```

### Step 8: Start New Services

```bash
# Pull latest images
docker compose pull

# Start services
docker compose up -d

# Watch logs to ensure successful startup
docker compose logs -f
```

### Step 9: Verify Migration

```bash
# Check agent health
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/logs/status

# Should return: {"status":"ok","logPath":"/logs/access.log",...}

# Check dashboard is accessible
curl http://localhost:3000

# Check database was created
ls -lh data/dashboard/agents.db
```

### Step 10: Access Dashboard

1. Open browser to http://localhost:3000
2. Verify agent connection status (should show green/online)
3. Check that logs are being displayed
4. Test GeoIP if enabled (geographic cards should populate)

---

##  Environment Variable Mapping

### Agent Variables

| V1.x Variable | V2.x Variable | Notes |
|--------------|---------------|-------|
| N/A (backend) | `TRAEFIK_LOG_DASHBOARD_ACCESS_PATH` | Path to Traefik access log |
| N/A (backend) | `TRAEFIK_LOG_DASHBOARD_ERROR_PATH` | Optional error log path |
| N/A | `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN` | **NEW**: Required authentication |
| N/A | `TRAEFIK_LOG_DASHBOARD_LOG_FORMAT` | Log format (json/common) |
| N/A | `TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING` | Enable system stats |
| N/A | `TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED` | Enable GeoIP lookups |
| N/A | `TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB` | Path to GeoLite2-City.mmdb |
| N/A | `TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB` | Path to GeoLite2-Country.mmdb |
| N/A | `PORT` | Agent listen port (default: 5000) |

### Dashboard Variables

| V1.x Variable | V2.x Variable | Notes |
|--------------|---------------|-------|
| `BACKEND_URL` | `AGENT_API_URL` | Changed from backend to agent |
| N/A | `AGENT_API_TOKEN` | **NEW**: Required authentication |
| N/A | `AGENT_NAME` | **NEW**: Name for environment agent |
| N/A | `DATABASE_PATH` | **NEW**: SQLite database location |
| `NODE_ENV` | `NODE_ENV` | Unchanged |
| `PORT` | `PORT` | Unchanged (default: 3000) |

---

##  Database Features (New in V2)

### Agent Database Schema

V2 introduces persistent SQLite storage:

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,                    -- agent-001, agent-002, etc.
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  token TEXT NOT NULL,
  location TEXT NOT NULL,                 -- 'on-site' or 'off-site'
  number INTEGER NOT NULL,
  status TEXT,                           -- 'online', 'offline', 'checking'
  last_seen TEXT,                        -- ISO timestamp
  description TEXT,
  tags TEXT,                             -- JSON array
  source TEXT NOT NULL DEFAULT 'manual', -- 'env' or 'manual'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Environment vs Manual Agents

**Environment Agents (source='env'):**
- Defined in docker-compose.yml via `AGENT_API_URL` and `AGENT_API_TOKEN`
- Automatically synced on dashboard startup
- **Cannot be deleted from UI** (protected with 🔒 icon)
- Can only be removed by updating docker-compose.yml and restarting

**Manual Agents (source='manual'):**
- Added through dashboard UI
- Fully editable and deletable
- Stored persistently in SQLite database

### Database Location

Default: `./data/dashboard/agents.db`

Custom location:
```yaml
traefik-dashboard:
  environment:
    - DATABASE_PATH=/custom/path/agents.db
```

---

##  Security Improvements

### 1. Authentication
```yaml
# All API endpoints now require authentication
Agent → Dashboard: Bearer token validation
```

### 2. Read-Only Log Mounts
```yaml
volumes:
  - /logs:/logs:ro  # Read-only prevents modifications
```

### 3. Network Isolation
```yaml
networks:
  traefik-network:
    external: true  # Use existing network
```

### 4. Health Checks
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "..."]
  # Ensures services are responsive
```

---

##  Bug Fixes in V2

### 1. Date Handling Fixed
**Issue**: lastSeen dates were not properly converted between ISO strings and Date objects

**Fix**: 
```typescript
// Proper handling of both Date objects and ISO strings
if (updates.lastSeen instanceof Date) {
  values.push(updates.lastSeen.toISOString());
} else if (typeof updates.lastSeen === 'string') {
  values.push(updates.lastSeen);
}
```

### 2. Enhanced Delete Error Messages
**Issue**: Generic "Failed to delete agent" error

**Fix**:
```typescript
// Specific error messages for different scenarios
if (errorMessage.includes('environment-sourced')) {
  toast.error('Cannot Delete Environment Agent', {
    description: 'This agent is configured in environment variables...'
  });
} else if (errorMessage.includes('not found')) {
  toast.error('Agent Not Found', {
    description: 'The agent you are trying to delete no longer exists.'
  });
}
```

### 3. Optimized State Management
**Issue**: Full page refresh on every agent operation

**Fix**:
```typescript
// Direct state updates instead of full refresh
setAgents(prev => prev.filter(a => a.id !== id));
```

### 4. Parallel Fetching
**Issue**: Sequential loading of agents and selected agent

**Fix**:
```typescript
// Fetch agents and selected agent in parallel
const [agentsData, selectedData] = await Promise.all([
  fetchAgents(),
  fetchSelectedAgent()
]);
```

### 5. Protected Environment Agents
**Issue**: Environment agents could be deleted, breaking configuration

**Fix**:
```typescript
// Check agent source before deletion
if (agent?.source === 'env') {
  throw new Error('Cannot delete environment-sourced agents');
}
```

---

##  Multi-Agent Setup (New Feature)

V2 supports monitoring multiple Traefik instances:

### Option 1: Additional Agents in docker-compose.yml

```yaml
services:
  traefik-agent-2:
    image: hhftechnology/traefik-log-dashboard-agent:dev-dashboard
    container_name: traefik-log-dashboard-agent-2
    ports:
      - "5001:5000"
    volumes:
      - ./data/logs2:/logs:ro
      - ./data/geoip:/geoip:ro
      - ./data/positions2:/data
    environment:
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=different_token_for_agent_2
      - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true
      - TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb
      - TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB=/geoip/GeoLite2-Country.mmdb
      - PORT=5000
    networks:
      - traefik-network
```

### Option 2: Add Agents via Dashboard UI

1. Navigate to **Settings → Agents**
2. Click **Add Agent**
3. Fill in details:
   - Name: "Production Server"
   - URL: http://agent-host:5000
   - Token: agent_authentication_token
   - Location: on-site/off-site
4. Click **Save**

---

##  Common Migration Issues

### Issue: Agent Returns 401 Unauthorized

**Cause:** Token mismatch or missing Authorization header

**Solution:**
```bash
# Verify tokens match in both services
docker exec traefik-agent env | grep AUTH_TOKEN
docker exec traefik-dashboard env | grep AGENT_API_TOKEN

# Update if different
docker compose down
# Edit docker-compose.yml with matching tokens
docker compose up -d
```

### Issue: No Logs Showing in Dashboard

**Cause:** Log path incorrect or logs not in JSON format

**Solution:**
```bash
# Check agent can read logs
docker exec traefik-agent ls -la /logs

# Verify log format is JSON
docker exec traefik-agent head -1 /logs/access.log

# Should be JSON like:
# {"ClientAddr":"192.168.1.1:12345","RequestMethod":"GET",...}

# If not JSON, update Traefik config:
# accessLog:
#   format: json
```

### Issue: GeoIP Not Working

**Cause:** Missing or corrupt database files

**Solution:**
```bash
# Check databases exist
ls -lh data/geoip/
# Should show GeoLite2-City.mmdb and GeoLite2-Country.mmdb

# Test GeoIP status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/location/status

# Re-download if needed (see Step 4)
```

### Issue: Dashboard Can't Connect to Agent

**Cause:** Network configuration or DNS issues

**Solution:**
```bash
# Check if agent is accessible from dashboard
docker exec traefik-dashboard wget -O- http://traefik-agent:5000/api/logs/status

# If fails, verify network:
docker network ls
docker network inspect traefik-network

# Ensure both services are on same network
```

### Issue: Database Locked Error

**Cause:** SQLite database locked by another process

**Solution:**
```bash
# Stop dashboard
docker compose stop traefik-dashboard

# Check for stale locks
ls -la data/dashboard/

# Remove lock files
rm data/dashboard/agents.db-shm
rm data/dashboard/agents.db-wal

# Restart dashboard
docker compose start traefik-dashboard
```
### Issue: Database not getting created
```bash
# 1. Stop the dashboard
docker compose down traefik-dashboard

# 2. Create and fix permissions
mkdir -p ./data/dashboard
sudo chown -R 1001:1001 ./data/dashboard

# 3. Restart
docker compose up -d traefik-dashboard

# 4. Check logs
docker compose logs -f traefik-dashboard
```
### Issue: Cannot Delete Agent from UI

**Cause:** Agent is environment-sourced (defined in docker-compose.yml)

**Solution:**
```bash
# Environment agents are protected and show 🔒 icon
# To remove:
# 1. Edit docker-compose.yml
# 2. Remove AGENT_API_URL and AGENT_API_TOKEN
# 3. Restart dashboard

docker compose down
# Edit docker-compose.yml
docker compose up -d
```

### Issue: High Memory Usage

**Cause:** Large log files or many requests

**Solution:**
```yaml
# Enable log rotation in Traefik
# traefik.yml:
accessLog:
  filePath: "/logs/access.log"
  maxSize: 100  # MB
  maxBackups: 3
  maxAge: 7     # days

# Position tracking automatically prevents full file reads
# Agent only reads new entries since last position
```

---

##  Rollback Procedure

If you need to revert to v1.x:

```bash
# Stop new services
docker compose down

# Restore backups
cp docker-compose.yml.backup docker-compose.yml
cp .env.backup .env

# Pull old images (if removed)
docker pull hhftechnology/traefik-log-dashboard-backend:latest
docker pull hhftechnology/traefik-log-dashboard-frontend:latest

# Restore Traefik OTLP config
# Add back OTLP sections to traefik.yml
# tracing:
#   otlp:
#     http:
#       endpoint: "http://backend:4318/v1/traces"

# Restart old version
docker compose up -d

# Verify
curl http://localhost:3001/health
curl http://localhost:3000
```

** Note**: Rollback is NOT advised as v1.x is no longer maintained

---

##  Post-Migration Checklist

- [ ] Old services stopped and removed
- [ ] New docker-compose.yml configured with strong tokens
- [ ] Log paths verified and accessible
- [ ] GeoIP databases downloaded (if using)
- [ ] Data directories created with proper permissions
- [ ] SQLite database initialized (./data/dashboard/agents.db exists)
- [ ] New services started successfully
- [ ] Health checks passing
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Agent API responding at http://localhost:5000
- [ ] Authentication working correctly
- [ ] Logs appearing in dashboard
- [ ] GeoIP lookups working (if enabled)
- [ ] Environment agent showing in UI with 🔒 icon
- [ ] Manual agents can be added/edited/deleted
- [ ] Old Traefik OTLP config removed
- [ ] Backups saved for rollback if needed
- [ ] Documentation updated with new endpoints
- [ ] Monitoring/alerting updated for new ports

---

##  Feature Comparison

### What's New in v2.x 

- ✅ Multi-agent architecture (unlimited agents)
- ✅ Persistent SQLite database
- ✅ Protected environment agents
- ✅ Agent health monitoring with lastSeen timestamps
- ✅ Enhanced error messages
- ✅ Parallel data fetching
- ✅ Optimized state management
- ✅ Proper date handling
- ✅ Position-based log reading (memory efficient)
- ✅ Bearer token authentication
- ✅ Comprehensive API endpoints
- ✅ System resource monitoring

### What's Removed 

- ❌ OpenTelemetry/OTLP tracing support
- ❌ Monolithic backend architecture
- ❌ In-memory agent configuration

### Migration Benefits 

-  Better performance (Go vs Node.js)
-  Persistent agent configuration
-  Enhanced security with authentication
-  Support for multiple Traefik instances
-  Multiple bug fixes and stability improvements
-  Better user experience with proper error messages

---

##  Getting Help

If you encounter issues during migration:

1. **Check Logs:**
   ```bash
   docker compose logs -f
   docker compose logs traefik-agent
   docker compose logs traefik-dashboard
   ```

2. **Enable Debug Mode:**
   ```yaml
   environment:
     - LOG_LEVEL=debug
   ```

3. **Join Discord:**
   - https://discord.gg/HDCt9MjyMJ
   - Active community support
   - Migration assistance available

4. **Open GitHub Issue:**
   - https://github.com/hhftechnology/traefik-log-dashboard/issues
   - Include logs and configuration
   - Tag as "migration" or "v2"

5. **Review Documentation:**
   - [README.md](../README.md)


---

##  Migration Complete!

Congratulations! You've successfully migrated to Traefik Log Dashboard V2.

**Next Steps:**
1.  Star the repo on GitHub
2.  Join our Discord community
3.  Provide feedback on your migration experience
4.  Explore multi-agent features
5.  Set up GeoIP if not already enabled

**Enjoying V2? Help others migrate by:**
- Sharing your experience
- Contributing to documentation
- Reporting bugs
- Suggesting features

---

**Made with ❤️ by the HHF Technology Team**