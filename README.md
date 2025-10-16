<div align="center">
    <h1 align="center"><a href="https://github.com/hhftechnology/traefik-log-dashboard">Traefik Log Dashboard</a></h1>
</div>

A comprehensive analytics platform for Traefik access logs with three deployment options: a Go-based API agent, a modern Next.js web dashboard, and a beautiful terminal-based CLI.

<div align="center">

![Stars](https://img.shields.io/github/stars/hhftechnology/traefik-log-dashboard?style=flat-square)
[![Discord](https://img.shields.io/discord/994247717368909884?logo=discord&style=flat-square)](https://discord.gg/HDCt9MjyMJ)

**A comprehensive real-time analytics platform for Traefik reverse proxy logs**

</div>

---


##  Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Multi-Agent Setup](#multi-agent-setup)
- [GeoIP Database Setup](#geoip-database-setup)
- [Dashboard Cards Explained](#dashboard-cards-explained)
- [Filter Logs & API Usage](#filter-logs--api-usage)
- [Configuration](#configuration)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

---

## **MIGRATION GUIDE from V1 to V2**: [./docs/MigrationV1toV2.md](./docs/MigrationV1toV2.md)

##  Overview

Traefik Log Dashboard is a powerful analytics platform that provides real-time insights into your Traefik reverse proxy traffic. It consists of three components that work together:

1. **Agent** - Go-based backend API that parses logs and exposes metrics
2. **Dashboard** - Next.js web UI with interactive charts and real-time updates
3. **CLI** - Beautiful terminal-based dashboard (optional)

---
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7eb3bd6f-f195-4fbb-babc-140e4a37451f" />
---
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/cb97cf90-a670-4afc-8e92-17b39fb03c7b" />
---
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1c534efa-bfaf-4603-9b87-d69a736a8a67" />
---
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7e659846-db62-4825-bfe3-218081c66450" />
---
<img width="1735" height="1532" alt="image" src="https://github.com/user-attachments/assets/29a0df2a-3ff3-4204-ba06-7bc34f39f7c6" />
---
<img width="1735" height="810" alt="image" src="https://github.com/user-attachments/assets/94059cb8-dec7-49cc-9531-51270f314ba7" />

<img width="1877" height="7800" alt="image" src="https://github.com/user-attachments/assets/ba81077f-95b0-4a73-82ab-bb9e75d4c04a" />


##  Architecture

### Multi-Agent Architecture

The platform supports a **multi-agent architecture** where you can deploy multiple agent instances across different Traefik installations and aggregate their data through a single dashboard.

```
┌─────────────────────────────────────────────────────────────┐
│                     Traefik Instances                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Traefik #1   │  │ Traefik #2   │  │ Traefik #3   │       │
│  │ (Production) │  │ (Staging)    │  │ (Development)│       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │ Logs            │ Logs            │ Logs          │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Agent #1     │  │ Agent #2     │  │ Agent #3     │       │
│  │ Port: 5000   │  │ Port: 5001   │  │ Port: 5002   │       │
│  │ • Log Parser │  │ • Log Parser │  │ • Log Parser │       │
│  │ • GeoIP      │  │ • GeoIP      │  │ • GeoIP      │       │
│  │ • Metrics    │  │ • Metrics    │  │ • Metrics    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │ REST API        │ REST API        │ REST API
          └─────────────────┴─────────────────┴──────┐
                                                     │
                                                     ▼
                                          ┌─────────────────────┐
                                          │  Dashboard Web UI   │
                                          │                     │
                                          │  • Multi-agent mgmt │
                                          │  • Aggregated views │
                                          │  • Real-time charts │
                                          │  • Geographic maps  │
                                          └─────────────────────┘
```

### Component Breakdown

**Agent (Go)**
- Parses Traefik logs (JSON/CLF format)
- Exposes REST API endpoints
- Performs GeoIP lookups
- Monitors system resources
- Supports incremental log reading

**Dashboard (Next.js)**
- Connects to multiple agents
- Displays 15+ interactive cards
- Real-time data visualization
- Demo mode for testing
- Responsive design

**CLI (Optional)**
- Terminal-based dashboard
- Direct log file reading
- Agent API integration
- Bubble Tea TUI

---

##  Features

### Core Features

-  **Real-time Monitoring** - Live request tracking with auto-refresh
-  **Comprehensive Metrics** - Request rates, response times, status codes, error rates
-  **Geographic Analytics** - Request distribution with GeoIP support
-  **Interactive Charts** - Chart.js and D3.js powered visualizations
-  **System Monitoring** - CPU, memory, and disk usage tracking
-  **Multi-Agent Support** - Manage and monitor multiple Traefik instances
-  **Beautiful UI** - Modern responsive design with Tailwind CSS 4
-  **Advanced Filtering** - Filter logs by status code, time period, and more
-  **Multiple Log Formats** - JSON and Common Log Format (CLF) support
-  **Gzip Support** - Compressed log file handling
-  **Bearer Token Auth** - Secure API access

---

##  Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/hhftechnology/traefik-log-dashboard.git
cd traefik-log-dashboard

# Create data directories for GeoIP
mkdir -p ./data/geoip
mkdir -p ./data/positions

# Start services
docker-compose up -d

# Access the dashboard
open http://localhost:3000
```

### Docker Compose Configuration

```yaml
services:
  # Backend Agent - Parses logs and exposes API
  traefik-agent:
    image: hhftechnology/traefik-log-dashboard-agent:latest
    container_name: traefik-log-dashboard-agent
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      # Mount your Traefik log directory (read-only)
      - /root/config/traefik/logs:/logs:ro
      # Mount GeoIP databases (read-only)
      - ./data/geoip:/geoip:ro
      # Position tracking for incremental reads
      - ./data/positions:/data
    environment:
      # Log file paths
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_ERROR_PATH=/logs/access.log
      
      # Authentication (change this!)
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=d41d8cd98f00b204e9800998ecf8427e
      
      # Enable system monitoring
      - TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING=true
      
      # GeoIP Configuration
      - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true
      - TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb
      - TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB=/geoip/GeoLite2-Country.mmdb
      
      # Log format (json or clf)
      - TRAEFIK_LOG_DASHBOARD_LOG_FORMAT=json
      
      # Server port
      - PORT=5000
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/logs/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - pangolin

  # Frontend Dashboard - Web UI
  traefik-dashboard:
    image: hhftechnology/traefik-log-dashboard:latest
    container_name: traefik-log-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Agent connection
      - AGENT_API_URL=http://traefik-agent:5000
      - AGENT_API_TOKEN=d41d8cd98f00b204e9800998ecf8427e
      
      # Node environment
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
      - pangolin

networks:
  pangolin:
    external: true
```

---

##  Multi-Agent Setup

### Adding Multiple Agents

The dashboard supports managing multiple agent instances. Here's how to set up a multi-agent environment:

#### 1. Deploy Multiple Agents

Create a `docker-compose.multi-agent.yml`:

```yaml
services:
  # Production Agent
  traefik-agent-prod:
    image: hhftechnology/traefik-log-dashboard-agent:latest
    container_name: traefik-agent-prod
    ports:
      - "5000:5000"
    volumes:
      - /var/log/traefik/prod:/logs:ro
      - ./data/geoip:/geoip:ro
      - ./data/positions-prod:/data
    environment:
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=prod_token_here
      - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true
      - TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb

  # Staging Agent
  traefik-agent-staging:
    image: hhftechnology/traefik-log-dashboard-agent:latest
    container_name: traefik-agent-staging
    ports:
      - "5001:5000"
    volumes:
      - /var/log/traefik/staging:/logs:ro
      - ./data/geoip:/geoip:ro
      - ./data/positions-staging:/data
    environment:
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=staging_token_here
      - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true

  # Development Agent
  traefik-agent-dev:
    image: hhftechnology/traefik-log-dashboard-agent:latest
    container_name: traefik-agent-dev
    ports:
      - "5002:5000"
    volumes:
      - /var/log/traefik/dev:/logs:ro
      - ./data/geoip:/geoip:ro
      - ./data/positions-dev:/data
    environment:
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=dev_token_here

  # Single Dashboard
  traefik-dashboard:
    image: hhftechnology/traefik-log-dashboard:latest
    container_name: traefik-dashboard
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - traefik-agent-prod
      - traefik-agent-staging
      - traefik-agent-dev
```

#### 2. Configure Agents in Dashboard

Navigate to **Settings → Agents** in the dashboard and add your agents:

1. Click **"Add Agent"**
2. Enter agent details:
   - **Name**: Production
   - **URL**: http://traefik-agent-prod:5000
   - **Token**: prod_token_here
3. Click **"Save"**
4. Repeat for staging and development agents

#### 3. Switch Between Agents

Use the agent selector dropdown in the dashboard header to switch between different agent views.

---

##  GeoIP Database Setup

GeoIP functionality requires MaxMind GeoLite2 databases. Here's how to set them up:

### Step 1: Download GeoLite2 Databases

1. **Sign up for MaxMind account** (free):
   - Visit: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
   - Create a free account

2. **Download databases**:
   ```bash
   # Create directory
   mkdir -p ./data/geoip
   
   # Download GeoLite2-City (recommended)
   # Download GeoLite2-Country (fallback)
   ```

3. **Extract databases**:
   ```bash
   # Extract .tar.gz files
   tar -xzf GeoLite2-City.tar.gz
   tar -xzf GeoLite2-Country.tar.gz
   
   # Copy .mmdb files to data directory
   cp GeoLite2-City_*/GeoLite2-City.mmdb ./data/geoip/
   cp GeoLite2-Country_*/GeoLite2-Country.mmdb ./data/geoip/
   ```

### Step 2: Configure Agent

Update your agent environment variables:

```yaml
environment:
  # Enable GeoIP
  - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true
  
  # Database paths (inside container)
  - TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb
  - TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB=/geoip/GeoLite2-Country.mmdb
```

### Step 3: Mount Volume

Ensure the GeoIP directory is mounted:

```yaml
volumes:
  - ./data/geoip:/geoip:ro
```

### Step 4: Verify GeoIP Status

Check if GeoIP is working:

```bash
# Check agent logs
docker logs traefik-log-dashboard-agent

# You should see:
# GeoIP: Enabled
# GeoIP: Successfully initialized
```

### GeoIP Features

Once configured, you'll get:

- **Country-level geolocation** for all IP addresses
- **City-level geolocation** (if using City database)
- **Latitude/Longitude coordinates** for mapping
- **Private IP detection** (shows as "Private")
- **Geographic distribution card** showing top countries
- **Interactive world map** with request heatmap

### Updating GeoIP Databases

MaxMind updates databases regularly. Update them periodically:

```bash
# Download latest versions
# Extract new databases
# Replace old .mmdb files
# Restart agent
docker restart traefik-log-dashboard-agent
```

---

##  Dashboard Cards Explained

The dashboard displays 15+ interactive cards providing comprehensive insights:

### 1. **Request Metrics Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Total number of requests processed
- Requests per second rate
- Trend indicator (increase/decrease %)
- Sparkline showing request activity

**Use cases:**
- Monitor traffic volume
- Identify traffic spikes
- Track growth trends

**Metrics:**
```
Total Requests: 125,847
Rate: 42.3 req/s
Change: +15.2% ↑
```
</details>

### 2. **Response Time Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Average response time (mean)
- P95 percentile (95% of requests faster than this)
- P99 percentile (99% of requests faster than this)
- Response time distribution histogram

**Use cases:**
- Identify performance issues
- Track backend latency
- Set SLA targets

**Metrics:**
```
Average: 245ms
P95: 580ms
P99: 1,240ms
```
</details>

### 3. **Status Codes Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Distribution of HTTP status codes
- 2xx (Success) - Green
- 3xx (Redirects) - Blue
- 4xx (Client Errors) - Yellow
- 5xx (Server Errors) - Red
- Overall error rate percentage

**Use cases:**
- Monitor service health
- Identify error patterns
- Track success rate

**Metrics:**
```
2xx: 98,234 (78.1%)
3xx: 15,432 (12.3%)
4xx: 8,945 (7.1%)
5xx: 3,236 (2.5%)
Error Rate: 9.6%
```
</details>

### 4. **Status Code Distribution Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Visual pie chart of status code distribution
- Percentage breakdown
- Color-coded segments

**Use cases:**
- Quick visual health check
- Identify anomalies
- Report generation

</details>

### 5. **Request Timeline Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Time-series chart of request volume
- Request activity over time (last N minutes/hours)
- Peak request rate indicator
- Interactive chart with hover details

**Use cases:**
- Identify traffic patterns
- Spot unusual activity
- Capacity planning

**Features:**
- 20+ data points
- Smooth line chart
- Peak/min indicators
</details>

### 6. **Top Routes Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Most frequently requested paths
- Request count per route
- Average response time per route
- HTTP method (GET, POST, etc.)
- Percentage of total traffic

**Use cases:**
- Identify popular endpoints
- Optimize frequently used routes
- Plan caching strategy

**Example:**
```
#1 /api/users        15,234 (12.1%)  avg: 145ms  GET
#2 /api/products     12,847 (10.2%)  avg: 234ms  GET
#3 /auth/login        8,456 (6.7%)   avg: 456ms  POST
```
</details>

### 7. **Backend Services Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- List of backend services receiving traffic
- Request count per service
- Average response time
- Error rate per service
- Health status (Healthy/Warning/Critical)
- Service URL

**Health indicators:**
- 🟢 Healthy: Error rate < 5%
- 🟡 Warning: Error rate 5-10%
- 🔴 Critical: Error rate > 10%

**Use cases:**
- Monitor backend health
- Identify problematic services
- Balance traffic distribution

**Example:**
```
Service: api-backend
  Requests: 45,234 (36%)
  Avg Time: 234ms
  Error Rate: 2.3% 🟢
  URL: http://backend:8080
```
</details>

### 8. **Routers Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Traefik routers handling requests
- Request count per router
- Average response time
- Associated service
- Traffic distribution bars

**Use cases:**
- Monitor router performance
- Identify routing issues
- Optimize rule matching

**Example:**
```
#1 api-router → api-service
   15,234 requests  avg: 234ms
   [████████████████░░░░] 78%
```
</details>

### 9. **Top Client IPs Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Most active client IP addresses
- Request count per IP
- Percentage of total traffic
- Geographic location (if GeoIP enabled)

**Use cases:**
- Identify heavy users
- Detect potential DDoS
- Analyze traffic sources

**Example:**
```
#1 192.168.1.100  12,345 (9.8%)  🇺🇸 USA
#2 10.0.0.50       8,234 (6.5%)  🇬🇧 UK
#3 172.16.0.10     5,678 (4.5%)  🇩🇪 Germany
```
</details>

### 10. **Top Request Hosts Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Most requested hostnames/domains
- Request count per host
- Percentage breakdown

**Use cases:**
- Multi-tenant monitoring
- Virtual host analysis
- Traffic segmentation

**Example:**
```
#1 api.example.com     45,234 (36%)
#2 www.example.com     32,145 (25.6%)
#3 staging.example.com 15,234 (12.1%)
```
</details>

### 11. **Top Request Addresses Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Full client addresses (IP:Port)
- Request count
- Connection patterns

**Use cases:**
- Detailed client analysis
- Connection pooling insights
- Port usage patterns
</details>

### 12. **User Agents Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Browser/client type distribution
- Request count per user agent
- Percentage breakdown
- Parsed browser names (Chrome, Firefox, Safari, etc.)

**Use cases:**
- Browser compatibility planning
- Bot detection
- Client analytics

**Example:**
```
Chrome:  45,234 (36%)
Firefox: 23,456 (18.7%)
Safari:  18,234 (14.5%)
Bot:     12,345 (9.8%)
```
</details>

### 13. **Geographic Distribution Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Request distribution by country
- Top 10 countries by traffic
- Request count and percentage
- Country flags

**Requirements:**
- GeoIP database configured

**Use cases:**
- Geographic traffic analysis
- CDN planning
- Regional performance insights

**Example:**
```
🇺🇸 United States  34,567 (27.5%)
🇬🇧 United Kingdom 23,456 (18.6%)
🇩🇪 Germany        15,234 (12.1%)
```
</details>

### 14. **Interactive Geographic Map Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- World map with request heatmap
- Color-coded countries by traffic volume
- Interactive hover information
- Zoom and pan functionality

**Requirements:**
- GeoIP database with coordinates
- D3.js visualization

**Use cases:**
- Visual traffic distribution
- Presentations and reports
- Geographic insights
</details>

### 15. **Recent Errors Card**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Latest error entries (4xx and 5xx)
- Timestamp of error
- HTTP method and path
- Status code
- Router and service involved
- Error level (Warning/Error)

**Color coding:**
- 🟡 Warning: 4xx errors (client-side)
- 🔴 Error: 5xx errors (server-side)

**Use cases:**
- Real-time error monitoring
- Debugging issues
- Alert investigation

**Example:**
```
🔴 500 Internal Server Error
   2024-10-15 14:23:45
   POST /api/orders
   Router: api-router → backend-service
```
</details>

### 16. **System Resources Cards** (CPU, Memory, Disk)

<details>
<summary>Click to expand</summary>

**What it shows:**

**CPU Card:**
- Current CPU usage percentage
- Number of cores
- Health status

**Memory Card:**
- Memory usage percentage
- Used / Total memory
- Available memory

**Disk Card:**
- Disk usage percentage
- Used / Total space
- Available space

**Health indicators:**
- 🟢 Healthy: < 70%
- 🟡 Warning: 70-90%
- 🔴 Critical: > 90%

**Requirements:**
- `TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING=true`

**Use cases:**
- Server health monitoring
- Capacity planning
- Resource optimization
</details>

### 17. **Recent Logs Table**

<details>
<summary>Click to expand</summary>

**What it shows:**
- Detailed table of recent log entries
- Customizable columns
- Sortable fields
- Color-coded status codes
- Expandable for full details

**Default columns:**
- Timestamp
- Method
- Path
- Status
- Duration
- Client IP

**Optional columns:**
- Service Name
- Router Name
- Request Host
- User Agent
- Origin Duration
- Overhead
- And more...

**Use cases:**
- Detailed request inspection
- Debugging specific requests
- Log analysis
</details>

---

##  Filter Logs & API Usage

The agent exposes REST API endpoints with powerful filtering capabilities.

### API Endpoints

#### 1. Get Access Logs
```http
GET /api/logs/access
```

**Query Parameters:**
- `position` - Starting position for incremental read (default: 0)
- `lines` - Number of lines to read (default: 1000)
- `period` - Time period filter (e.g., `1h`, `24h`, `7d`)
- `status` - Filter by status code (e.g., `200`, `404`, `500`)

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  "http://localhost:5000/api/logs/access?period=1h&lines=500"
```

**Response:**
```json
{
  "logs": [...],
  "count": 500,
  "position": 12345
}
```

#### 2. Get Error Logs (4xx/5xx only)
```http
GET /api/logs/error
```

**Query Parameters:**
- `position` - Starting position
- `lines` - Number of lines (default: 100)
- `period` - Time period filter
- `status` - Specific status code filter

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  "http://localhost:5000/api/logs/error?status=500&period=24h"
```

#### 3. Get Status Distribution
```http
GET /api/logs/status
```

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  "http://localhost:5000/api/logs/status"
```

**Response:**
```json
{
  "total_requests": 125847,
  "status_2xx": 98234,
  "status_3xx": 15432,
  "status_4xx": 8945,
  "status_5xx": 3236,
  "error_rate": 9.6
}
```

#### 4. Get System Resources
```http
GET /api/system/resources
```

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  "http://localhost:5000/api/system/resources"
```

**Response:**
```json
{
  "cpu": {
    "usage_percent": 45.2,
    "cores": 8
  },
  "memory": {
    "total": 16384,
    "used": 8192,
    "usage_percent": 50.0
  },
  "disk": {
    "total": 500000,
    "used": 250000,
    "usage_percent": 50.0
  }
}
```

#### 5. Get Log File Sizes
```http
GET /api/system/logs
```

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  "http://localhost:5000/api/system/logs"
```

### Time Period Formats

Supported formats for `period` parameter:

- `15m` - Last 15 minutes
- `30m` - Last 30 minutes
- `1h` - Last 1 hour
- `3h` - Last 3 hours
- `6h` - Last 6 hours
- `12h` - Last 12 hours
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days

### Status Code Filtering

Filter by specific status codes or ranges:

```bash
# Specific status code
?status=404

# Success codes
?status=200

# All 4xx errors
?status=4xx

# All 5xx errors
?status=5xx

# Combine with period
?status=500&period=1h
```

### Incremental Log Reading

The agent tracks reading positions to efficiently handle large log files:

```bash
# First request - start from beginning
curl "http://localhost:5000/api/logs/access?lines=1000"
# Response includes: "position": 45678

# Next request - continue from last position
curl "http://localhost:5000/api/logs/access?position=45678&lines=1000"
```

Position tracking is stored in the `/data` volume.

---

##  Configuration

### Agent Environment Variables

```bash
# Server Configuration
PORT=5000                                    # Agent listening port

# Log Paths
TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log   # Access log file
TRAEFIK_LOG_DASHBOARD_ERROR_PATH=/logs/traefik.log   # Error log file

# Log Format
TRAEFIK_LOG_DASHBOARD_LOG_FORMAT=json       # json or clf

# System Monitoring
TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING=true # Enable system stats

# Authentication
TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=your_token  # Bearer token (required)

# GeoIP Configuration
TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true                    # Enable GeoIP
TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb       # City DB path
TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB=/geoip/GeoLite2-Country.mmdb # Country DB path
```

### Dashboard Environment Variables

```bash
# Agent Connection
AGENT_API_URL=http://traefik-agent:5000      # Agent API endpoint
AGENT_API_TOKEN=your_token                    # Authentication token

# Application
NODE_ENV=production                           # production or development
PORT=3000                                     # Dashboard port
```

### Traefik Configuration

Configure Traefik to output JSON logs:

**traefik.yml:**
```yaml
accessLog:
  filePath: "/var/log/traefik/access.log"
  format: json
  fields:
    defaultMode: keep
    headers:
      defaultMode: keep
```

**Or with CLI:**
```bash
--accesslog=true
--accesslog.filepath=/var/log/traefik/access.log
--accesslog.format=json
```

---

##  Performance

### Benchmarks

| Component | Metric | Performance |
|-----------|--------|-------------|
| **Agent** | Log parsing | 100,000+ lines/second |
| | Memory usage | ~50MB per 1M entries |
| | API response time | <50ms average |
| | CPU usage | <5% during normal operation |
| **Dashboard** | Data points | 10,000+ smoothly |
| | Update latency | <10ms UI refresh |
| | Memory usage | ~100MB in browser |
| **CLI** | UI refresh | <10ms |
| | CPU usage | <5% |

### Optimization Tips

**For Large Log Files:**
1. Use incremental reading with position tracking
2. Enable Gzip compression on log files
3. Rotate logs frequently
4. Use the `lines` parameter to limit response size

**For High Traffic:**
1. Increase refresh interval
2. Deploy multiple agent instances
3. Use reverse proxy caching
4. Enable log sampling in Traefik

**Memory Management:**
- Agent uses bounded memory buffers
- Position tracking prevents re-reading old logs
- Go garbage collection tuned for low latency

---

##  Troubleshooting

### Common Issues

#### 1. Dashboard Shows "Connection Error"

**Symptoms:**
- Red connection error banner
- No data displayed

**Solutions:**
```bash
# Check agent is running
docker ps | grep traefik-agent

# Check agent logs
docker logs traefik-log-dashboard-agent

# Verify agent is accessible
curl http://localhost:5000/api/logs/status

# Check authentication token matches
echo $AGENT_API_TOKEN
```

#### 2. GeoIP Not Working

**Symptoms:**
- Geographic cards show "No data"
- Countries show as empty

**Solutions:**
```bash
# Verify databases exist
ls -lh ./data/geoip/

# Check agent logs for GeoIP errors
docker logs traefik-log-dashboard-agent | grep GeoIP

# Verify environment variables
docker exec traefik-agent env | grep GEOIP

# Test GeoIP lookup
curl -H "Authorization: Bearer token" \
  "http://localhost:5000/api/location/status"
```

#### 3. No Logs Appearing

**Symptoms:**
- Dashboard shows zero requests
- All cards empty

**Solutions:**
```bash
# Verify log file path is correct
docker exec traefik-agent ls -lh /logs/

# Check log file permissions
docker exec traefik-agent cat /logs/access.log

# Verify log format matches configuration
head /path/to/traefik/access.log

# Check Traefik is generating logs
tail -f /path/to/traefik/access.log
```

#### 4. High Memory Usage

**Symptoms:**
- Agent consuming excessive memory
- Dashboard slow or unresponsive

**Solutions:**
```bash
# Reduce lines per request
AGENT_API_URL/api/logs/access?lines=100

# Enable log rotation in Traefik
# Reduce refresh interval in dashboard
# Clear browser cache

# Check for log file issues
du -sh /path/to/traefik/logs/*
```

#### 5. Authentication Failed

**Symptoms:**
- 401 Unauthorized errors
- Cannot access API

**Solutions:**
```bash
# Verify token is set
echo $TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN

# Test with curl
curl -H "Authorization: Bearer your_token" \
  http://localhost:5000/api/logs/status

# Check dashboard environment
docker exec traefik-dashboard env | grep TOKEN

# Restart services with correct token
docker-compose restart
```

### Getting Help

If you're still experiencing issues:

1. **Check Logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Enable Debug Mode:**
   ```yaml
   environment:
     - LOG_LEVEL=debug
   ```

3. **Join Discord:**
   - https://discord.gg/HDCt9MjyMJ

4. **Open GitHub Issue:**
   - https://github.com/hhftechnology/traefik-log-dashboard/issues
   - Include logs and configuration

---

##  Additional Resources

- **Agent Documentation**: [./agent/README.md](./agent/README.md)
- **Dashboard Documentation**: [./dashboard/README.md](./dashboard/README.md)
- **CLI Documentation**: [./cli/README.md](./cli/README.md)
- **API Reference**: [./docs/API.md](./docs/API.md)
- **Architecture Guide**: [./docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

##  Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##  License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

##  Acknowledgments

- [Traefik](https://traefik.io/) - Excellent cloud-native reverse proxy
- [Next.js](https://nextjs.org/) - Powerful React framework
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [D3.js](https://d3js.org/) - Data visualization library
- [MaxMind](https://www.maxmind.com/) - GeoIP database provider
- [Bubble Tea](https://github.com/charmbracelet/bubbletea) - TUI framework

---

<div align="center">

**Made with ❤️ for the Traefik community**

⭐ Star this repo if you find it helpful!

[GitHub](https://github.com/hhftechnology/traefik-log-dashboard) • [Discord](https://discord.gg/HDCt9MjyMJ) • [Issues](https://github.com/hhftechnology/traefik-log-dashboard/issues)

</div>
