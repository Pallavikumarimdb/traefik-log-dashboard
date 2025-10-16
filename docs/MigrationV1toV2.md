# Traefik Log Dashboard Migration Guide
## From v1.x (OTLP-based) to v2.x (Agent-based)

---

##  Overview

This guide will help you migrate from the OTLP-based architecture (v2.x) to the new agent-based architecture (v3.x).

### Key Changes

| Aspect | v1.x (Old) | v2.x (New) |
|--------|-----------|-----------|
| **Architecture** | Monolithic backend + frontend | Agent + Dashboard (decoupled) |
| **Backend Port** | 3001 | 5000 |
| **OTLP Support** |  Direct receiver (4317/4318) |  Removed (logs only) |
| **Authentication** | None |  Token-based |
| **Log Parsing** | Direct file watching | Position-tracked incremental |
| **Real-time Updates** | WebSocket | API polling |
| **Frontend** | React + Shadcn UI | Next.js 15 + Shadcn UI |
| **GeoIP Config** | Single DB path | Separate City + Country DBs |
| **Data Persistence** | In-memory only | Position tracking in `/data` |

---

## ⚠️ Breaking Changes

### 1. **OTLP Tracing Removed**
The new architecture focuses on log file parsing only. If you require OpenTelemetry tracing:
- Consider using dedicated OTLP collectors (Jaeger, Tempo, Grafana)
- The dashboard now provides log-based analytics only

### 2. **Port Changes**
```diff
- Backend: 3001 → Agent: 5000
- OTLP GRPC: 4317 (removed)
- OTLP HTTP: 4318 (removed)
  Frontend: 3000 (unchanged)
```

### 3. **Authentication Required**
Agent and dashboard now require token authentication:
```diff
- No authentication
+ Bearer token authentication between components
```

### 4. **Environment Variable Changes**
Complete restructuring of environment variables (see mapping table below).

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

# Set proper permissions
chmod 755 data/geoip data/positions
```

### Step 4: Download GeoIP Databases (Optional)

If using geolocation features:

```bash
# Option 1: Using MaxMind license key
export MAXMIND_LICENSE_KEY="your_license_key_here"

# Download databases
wget "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz" -O GeoLite2-City.tar.gz
wget "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz" -O GeoLite2-Country.tar.gz

# Extract
tar -xzf GeoLite2-City.tar.gz
tar -xzf GeoLite2-Country.tar.gz

# Move to data directory
mv GeoLite2-City_*/GeoLite2-City.mmdb data/geoip/
mv GeoLite2-Country_*/GeoLite2-Country.mmdb data/geoip/

# Cleanup
rm -rf GeoLite2-*.tar.gz GeoLite2-City_* GeoLite2-Country_*

# Option 2: Skip GeoIP
# Set TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=false in compose file
```

### Step 5: Create New Docker Compose File

Replace your old `docker-compose.yml` with the new configuration:

```yaml
# docker-compose.yml
services:
  # Traefik Log Dashboard Agent
  traefik-agent:
    image: hhftechnology/traefik-log-dashboard-agent:latest
    container_name: traefik-log-dashboard-agent
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - /path/to/traefik/logs:/logs:ro  # ⚠️ UPDATE THIS PATH
      - ./data/geoip:/geoip:ro
      - ./data/positions:/data
    environment:
      # Log Paths
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_ERROR_PATH=/logs/access.log
      
      # Authentication - GENERATE A STRONG TOKEN
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=YOUR_SECRET_TOKEN_HERE  # ⚠️ CHANGE THIS
      
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
      - traefik-network  # ⚠️ UPDATE TO YOUR NETWORK NAME

  # Traefik Log Dashboard - Next.js web UI
  traefik-dashboard:
    image: hhftechnology/traefik-log-dashboard:latest
    container_name: traefik-log-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Agent Configuration
      - AGENT_API_URL=http://traefik-agent:5000
      - AGENT_API_TOKEN=YOUR_SECRET_TOKEN_HERE  # ⚠️ MUST MATCH AGENT TOKEN
      
      # Node Environment
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      traefik-agent:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - traefik-network  # ⚠️ UPDATE TO YOUR NETWORK NAME

networks:
  traefik-network:  # ⚠️ UPDATE TO YOUR NETWORK NAME
    external: true
```

**Critical Configuration Updates:**
1. **Line 8**: Update log path to match your Traefik logs location
2. **Line 15**: Generate a strong authentication token
3. **Line 40**: Use the **same token** as the agent
4. **Lines 47, 58**: Update network name to match your setup

### Step 6: Generate Authentication Token

```bash
# Generate a secure random token
openssl rand -hex 32

# Or use this
echo -n "my-secret-password" | md5sum | cut -d' ' -f1

# Example output: d41d8cd98f00b204e9800998ecf8427e
```

**Update both services with this token:**
- Agent: `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN`
- Dashboard: `AGENT_API_TOKEN`

### Step 7: Start New Services

```bash
# Pull latest images
docker compose pull

# Start services
docker compose up -d

# Check logs
docker compose logs -f

# Verify services are healthy
docker compose ps
```

### Step 8: Verify Migration

1. **Check Agent Health:**
   ```bash
   curl http://localhost:5000/api/logs/status
   # Expected: {"status":"ok","access_log":...}
   ```

2. **Check Dashboard:**
   ```bash
   # Open browser
   open http://localhost:3000
   
   # Or test with curl
   curl -I http://localhost:3000
   ```

3. **Test Authentication:**
   ```bash
   # Should fail without token
   curl http://localhost:5000/api/logs/access
   # Expected: 401 Unauthorized
   
   # Should succeed with token
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:5000/api/logs/access
   ```

4. **Check GeoIP (if enabled):**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:5000/api/location/status
   # Expected: {"enabled":true,"available":true,...}
   ```

---

## 🔧 Configuration Mapping

### Environment Variables

| v1.x (Old) | v2.x (New) | Notes |
|-----------|-----------|-------|
| `TRAEFIK_LOG_PATH` | `TRAEFIK_LOG_DASHBOARD_ACCESS_PATH` | Now separate access/error paths |
| `PORT` (3001) | `PORT` (5000) | Agent runs on 5000 |
| `FRONTEND_PORT` | `PORT` (3000) | Dashboard uses standard PORT |
| `USE_MAXMIND` | `TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED` | Boolean flag |
| `MAXMIND_DB_PATH` | `TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB` | Separate city DB |
| - | `TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB` | New: Country DB |
| `OTLP_ENABLED` | ❌ Removed | OTLP not supported |
| `OTLP_GRPC_PORT` | ❌ Removed | OTLP not supported |
| `OTLP_HTTP_PORT` | ❌ Removed | OTLP not supported |
| - | `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN` | New: Required auth |
| - | `TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING` | New: System metrics |
| - | `TRAEFIK_LOG_DASHBOARD_LOG_FORMAT` | New: json or clf |
| - | `AGENT_API_URL` | New: Dashboard → Agent URL |
| - | `AGENT_API_TOKEN` | New: Dashboard auth token |
| `GOGC` | - | Agent handles GC internally |
| `GOMEMLIMIT` | - | Agent handles memory internally |

### Docker Compose Services

| v2.x (Old) | v3.x (New) | Changes |
|-----------|-----------|---------|
| `backend` | `traefik-agent` | Renamed, port 5000 |
| `frontend` | `traefik-dashboard` | Renamed, Next.js based |
| - | - | Position tracking volume added |
| `maxmind-updater` | Manual | Run separately if needed |
| `sample-app` | ❌ Removed | Not in agent version |
| `traffic-generator` | ❌ Removed | Not in agent version |

---

##  Security Enhancements

The new version includes several security improvements:

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

##  Troubleshooting

### Issue: Agent Returns 401 Unauthorized

**Cause:** Token mismatch or missing Authorization header

**Solution:**
```bash
# Verify tokens match in both services
docker compose exec traefik-agent printenv | grep TOKEN
docker compose exec traefik-dashboard printenv | grep TOKEN

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
docker compose exec traefik-agent ls -la /logs

# Verify log format
docker compose exec traefik-agent head -1 /logs/access.log

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
docker compose exec traefik-dashboard wget -O- http://traefik-agent:5000/api/logs/status

# If fails, verify network:
docker network ls
docker network inspect traefik-network

# Ensure both services are on same network
```

### Issue: High Memory Usage

**Cause:** Large log files or many requests

**Solution:**
```yaml
# Add position tracking to reduce memory
# Already configured in new version via:
volumes:
  - ./data/positions:/data

# Agent only keeps recent logs in memory
# Older entries are tracked by position file
```

### Issue: Permission Denied on Position File

**Cause:** Container user can't write to /data

**Solution:**
```bash
# Fix permissions
sudo chown -R 1000:1000 data/positions
chmod 755 data/positions

# Or use bind mount with proper user
volumes:
  - ./data/positions:/data:rw
```

---

##  Rollback Procedure(Not advised)

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

---

##  Feature Comparison

### What's New in v2.x 

-  Agent-based architecture (better scalability)
-  Token-based authentication
-  Position-tracked incremental log reading
-  Separate access and error log support
-  System resource monitoring
-  Next.js 15 with React 19 dashboard
-  Improved GeoIP with separate databases
-  Better health checks and monitoring

### What's Removed in v2.x ⚠️

-  OTLP tracing support (use dedicated collectors)
-  WebSocket real-time updates (replaced with API polling)
-  Sample app and traffic generator
-  MaxMind auto-updater (manual download)

### What's Changed in v2.x 

- Port 3001 → 5000 for backend/agent
- Single backend → Decoupled agent + dashboard
- React → Next.js 15 frontend
- Direct log watching → Position-tracked parsing
- No auth → Token required

---

##  Additional Resources

### Documentation
- [Agent API Reference](https://github.com/hhftechnology/traefik-log-dashboard/blob/main/agent/README.md)
- [Dashboard Configuration](https://github.com/hhftechnology/traefik-log-dashboard/blob/main/dashboard/README.md)
- [Architecture Overview](https://github.com/hhftechnology/traefik-log-dashboard/blob/main/docs/ARCHITECTURE.md)

### Support
- [GitHub Issues](https://github.com/hhftechnology/traefik-log-dashboard/issues)
- [Discord Community](https://discord.gg/HDCt9MjyMJ)
- [GitHub Discussions](https://github.com/hhftechnology/traefik-log-dashboard/discussions)

### MaxMind GeoIP
- [Sign up for free account](https://www.maxmind.com/en/geolite2/signup)
- [GeoLite2 Documentation](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
- [Database Updates](https://dev.maxmind.com/geoip/updating-databases)

---

##  Post-Migration Checklist

- [ ] Old services stopped and removed
- [ ] New docker-compose.yml configured
- [ ] Strong authentication token generated and set
- [ ] Log paths verified and accessible
- [ ] GeoIP databases downloaded (if using)
- [ ] Data directories created with proper permissions
- [ ] New services started successfully
- [ ] Health checks passing
- [ ] Dashboard accessible at http://localhost:3000
- [ ] Agent API responding at http://localhost:5000
- [ ] Authentication working correctly
- [ ] Logs appearing in dashboard
- [ ] GeoIP lookups working (if enabled)
- [ ] Old Traefik OTLP config removed
- [ ] Backups saved for rollback if needed
- [ ] Documentation updated with new endpoints
- [ ] Monitoring/alerting updated for new ports

---

##  Quick Migration Script

For automated migration (use with caution):

```bash
#!/bin/bash
set -e

echo " Starting Traefik Log Dashboard Migration..."

# Stop old services
echo " Stopping old services..."
docker compose down

# Backup
echo " Creating backups..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Create directories
echo " Creating directories..."
mkdir -p data/geoip data/positions
chmod 755 data/geoip data/positions

# Generate token
echo " Generating authentication token..."
TOKEN=$(openssl rand -hex 32)
echo "Generated token: $TOKEN"
echo "  IMPORTANT: Save this token securely!"

# Create new compose file
echo " Creating new docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
# ... paste the new docker-compose.yml content here ...
EOF

# Replace token placeholders
sed -i "s/YOUR_SECRET_TOKEN_HERE/$TOKEN/g" docker-compose.yml

echo " Migration preparation complete!"
echo ""
echo "Next steps:"
echo "1. Review docker-compose.yml"
echo "2. Update log paths and network names"
echo "3. Run: docker compose up -d"
echo "4. Access dashboard: http://localhost:3000"
echo ""
echo "Your authentication token: $TOKEN"
```

---

##  Best Practices

### Production Deployment

1. **Use Strong Tokens**
   ```bash
   # Generate cryptographically secure tokens
   openssl rand -hex 32
   ```

2. **Enable TLS/HTTPS**
   ```yaml
   # Use reverse proxy (Traefik, nginx) for HTTPS
   # Never expose agent directly to internet
   ```

3. **Set Resource Limits**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
   ```

4. **Monitor Health**
   ```bash
   # Set up monitoring for:
   # - http://localhost:5000/api/logs/status
   # - http://localhost:3000/
   ```

5. **Regular GeoIP Updates**
   ```bash
   # Update databases monthly
   # MaxMind updates GeoLite2 weekly
   ```

6. **Log Rotation**
   ```bash
   # Ensure Traefik logs are rotated
   # Prevents disk space issues
   ```

---

**Migration completed successfully? ⭐ Star the repo and join our [Discord](https://discord.gg/HDCt9MjyMJ)!**
