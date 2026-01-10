<div align="center">
    <h1>Traefik Log Dashboard</h1>
    <p>Comprehensive real-time analytics platform for Traefik reverse proxy logs</p>

[![Docker](https://img.shields.io/docker/pulls/hhftechnology/traefik-log-dashboard?style=flat-square)](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard)
[![Docker](https://img.shields.io/docker/pulls/hhftechnology/traefik-log-dashboard-agent?style=flat-square)](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard-agent)
![Stars](https://img.shields.io/github/stars/hhftechnology/traefik-log-dashboard?style=flat-square)
[![Discord](https://img.shields.io/discord/994247717368909884?logo=discord&style=flat-square)](https://discord.gg/HDCt9MjyMJ)
</div>

---
<img width="1906" height="787" alt="image" src="https://github.com/user-attachments/assets/31361bac-ee2a-4325-a74f-8da8eb6f36b8" />

<img width="1735" height="1798" alt="image" src="https://github.com/user-attachments/assets/644cd774-0fae-47b1-916e-80f9fed4590f" />

<img width="1735" height="1010" alt="image" src="https://github.com/user-attachments/assets/f724b0db-2d6f-49b3-8dba-ad9af010f894" />

<img width="1735" height="1715" alt="image" src="https://github.com/user-attachments/assets/8b899027-5f38-420d-a5db-825720be6819" />

<img width="1735" height="802" alt="image" src="https://github.com/user-attachments/assets/ac470f18-7307-4ab6-b442-6192a12842aa" />

<img width="1735" height="1200" alt="image" src="https://github.com/user-attachments/assets/97aa1bb4-c5f8-4b7e-b760-c4e10806cdec" />

<img width="1735" height="974" alt="image" src="https://github.com/user-attachments/assets/bc1e9f22-e8e6-42d6-9822-9acf3fff5cb7" />

<img width="1735" height="802" alt="image" src="https://github.com/user-attachments/assets/5693ca19-92b8-478c-b2a9-7de7e8dd1030" />

<img width="1735" height="1536" alt="image" src="https://github.com/user-attachments/assets/f0c86b42-7d7c-4ed0-9cad-5da6824b4f24" />

## Quick Start

Get started in under 5 minutes with Docker Compose:

### 1. Create Project Structure

```bash
mkdir -p traefik-dashboard/data/{logs,positions,dashboard}
cd traefik-dashboard
```

### 2. Create docker-compose.yml

```yaml
services:
  traefik-agent:
    image: hhftechnology/traefik-log-dashboard-agent:latest
    container_name: traefik-log-dashboard-agent
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - ./data/logs:/logs:ro
      - ./data/positions:/data
    environment:
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_ERROR_PATH=/logs/traefik.log
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=your_secure_token_here
      - TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING=true
      - TRAEFIK_LOG_DASHBOARD_LOG_FORMAT=json
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/logs/status"]
      interval: 2m
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - pangolin

  traefik-dashboard:
    image: hhftechnology/traefik-log-dashboard:latest
    container_name: traefik-log-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data/dashboard:/app/data
      - ./data/geoip:/geoip:ro  # MaxMind GeoIP databases
      - ./data/positions:/data
    environment:
      # Agent Configuration - REPLACE WITH YOUR TOKEN
      - AGENT_API_URL=http://traefik-agent:5000
      - AGENT_API_TOKEN=d41d8cd98f00b204e9800998ecf8427e
      - AGENT_NAME=Default Agent
      
      # Node Environment
      - NODE_ENV=production
      - PORT=3000
      
      # Display Configuration
      - NEXT_PUBLIC_SHOW_DEMO_PAGE=true
      - NEXT_PUBLIC_MAX_LOGS_DISPLAY=500
    depends_on:
      traefik-agent:
        condition: service_healthy
    networks:
      - pangolin

networks:
  pangolin:
    external: true
```

### 3. Generate Secure Token

```bash
openssl rand -hex 32
```

Update both `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN` and `AGENT_API_TOKEN` with this value.

### 4. Start Services

```bash
# Create network if it doesn't exist
docker network create traefik-network 2>/dev/null || true

# Start services
docker compose up -d
```

### 5. Access Dashboard

Open http://localhost:3000 in your browser.

---

## Key Features

- **Multi-Agent Architecture** - Manage multiple Traefik instances from a single dashboard
- **Interactive 3D Globe** - Geographic visualization with smooth map transitions
- **Automatic GeoIP** - IP geolocation works out of the box (no setup required)
- **Advanced Filtering** - Include/exclude modes, geographic and custom filters
- **Background Alerting** - Discord webhooks, daily summaries, threshold alerts
- **High Performance** - Go-based agent, optimized log parsing, position tracking
- **Terminal Dashboard** - Beautiful CLI with Bubble Tea (optional)

---

## Components

| Component | Description |
|-----------|-------------|
| **Agent** | Lightweight Go service that parses Traefik logs and exposes metrics via REST API |
| **Dashboard** | Next.js 15 web UI with real-time analytics, charts, and geographic visualization |
| **CLI** | Terminal-based dashboard using Bubble Tea (optional) |

---

## Environment Variables

### Agent

| Variable | Description | Default |
|----------|-------------|---------|
| `TRAEFIK_LOG_DASHBOARD_ACCESS_PATH` | Path to access log file/directory | `/var/log/traefik/access.log` |
| `TRAEFIK_LOG_DASHBOARD_ERROR_PATH` | Path to error log file/directory | `/var/log/traefik/traefik.log` |
| `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN` | Authentication token | Required |
| `TRAEFIK_LOG_DASHBOARD_SYSTEM_MONITORING` | Enable system monitoring | `true` |
| `TRAEFIK_LOG_DASHBOARD_LOG_FORMAT` | Log format (`json` or `common`) | `json` |
| `PORT` | Agent listen port | `5000` |

### Dashboard

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENT_API_URL` | URL to agent API | Required |
| `AGENT_API_TOKEN` | Authentication token (must match agent) | Required |
| `AGENT_NAME` | Display name for the agent | `Environment Agent` |
| `NEXT_PUBLIC_SHOW_DEMO_PAGE` | Show demo mode link | `true` |
| `NEXT_PUBLIC_MAX_LOGS_DISPLAY` | Max logs in table | `500` |

> **Note**: GeoIP is automatically handled by the dashboard using [geolite2-redist](https://www.npmjs.com/package/geolite2-redist). No configuration needed.

---

## Documentation

Full documentation available at: **[https://traefik-log-dashboard.hhf.technology](https://traefik-log-dashboard.hhf.technology)**

Or run locally:
```bash
cd docs && npm install && npm run dev
```

---

## Community & Support

- **Documentation**: [https://traefik-log-dashboard.hhf.technology](https://traefik-log-dashboard.hhf.technology)
- **Discord**: [Join our community](https://discord.gg/HDCt9MjyMJ)
- **GitHub Issues**: [Report bugs](https://github.com/hhftechnology/traefik-log-dashboard/issues)
- **Docker Hub**: [Agent](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard-agent) | [Dashboard](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard)

---

## License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the Traefik community**

⭐ Star this repo if you find it helpful!

[GitHub](https://github.com/hhftechnology/traefik-log-dashboard) | [Discord](https://discord.gg/HDCt9MjyMJ) | [Documentation](https://traefik-log-dashboard.hhf.technology)

</div>
