<div align="center">
    <h1 align="center"><a href="https://github.com/hhftechnology/traefik-log-dashboard">Traefik Log Dashboard</a></h1>

![Stars](https://img.shields.io/github/stars/hhftechnology/traefik-log-dashboard?style=flat-square)
[![Discord](https://img.shields.io/discord/994247717368909884?logo=discord&style=flat-square)](https://discord.gg/HDCt9MjyMJ)
</div>

A comprehensive analytics platform for Traefik access logs with three deployment options: a Go-based API agent, a modern Next.js web dashboard, and a beautiful terminal-based CLI.

##  Features

- **Real-time Monitoring** - Live request tracking and metrics
- **Beautiful Dashboards** - Web UI and terminal TUI interfaces
- **Comprehensive Metrics** - Request rates, response times, status codes, error rates
- **Geographic Analytics** - Request distribution with GeoIP support
- **System Monitoring** - CPU, memory, and disk usage tracking
- **Flexible Deployment** - Agent API, web dashboard, or standalone CLI
- **Log Format Support** - JSON and Common Log Format (CLF)
- **Incremental Reading** - Efficient log parsing with position tracking
- **Gzip Support** - Compressed log file handling
- **Docker Ready** - Complete Docker Compose setup

##  Components

### 1. Traefik Log Dashboard Agent (Go)

Backend API service that parses Traefik logs and exposes metrics via REST endpoints.

**Features:**

- REST API with multiple endpoints
- Incremental log reading with position tracking
- Gzip compressed log support
- GeoIP lookups (MaxMind GeoLite2)
- System resource monitoring (gopsutil)
- Bearer token authentication
- Docker support

**Tech Stack:** Go 1.22, net/http, gopsutil, maxminddb

[→ Agent Documentation](./agent/README.md)

### 2. Traefik Log Dashboard (Next.js)

Modern web-based dashboard with interactive charts and real-time updates.

**Features:**

- 10+ interactive dashboard cards
- Real-time data visualization
- Chart.js and D3.js powered charts
- Geographic heat map
- Responsive design with Tailwind CSS 4
- Demo mode for testing
- API integration with agent

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Chart.js, D3.js

[→ Dashboard Documentation](./dashboard/README.md)

### 3. Traefik Log Dashboard CLI (Bubble Tea)

Beautiful terminal-based dashboard for analyzing logs in the terminal.

**Features:**

- Interactive TUI with Bubble Tea
- Multiple visualization cards
- Real-time updates
- Demo mode
- Direct log file reading
- Agent API integration
- Color-coded metrics

**Tech Stack:** Go 1.22, Bubble Tea, Bubbles, Lipgloss

[→ CLI Documentation](./cli/README.md)

##  Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/hhftechnology/traefik-log-dashboard.git
cd traefik-log-dashboard

# Start all services
docker-compose up -d

# Access the dashboard
open http://localhost:3000
```

### Individual Components

#### Agent Only

```bash
cd agent
make build
./bin/traefik-agent --log-file /var/log/traefik/access.log
```

#### Dashboard Only

```bash
cd dashboard
npm install
npm run dev
open http://localhost:3000
```

#### CLI Only

```bash
cd cli
make build
./bin/traefik-log-dashboard --demo
```

##  Dashboard Cards

Both the web dashboard and CLI include:

1. **Request Metrics** - Total requests, requests/sec, trends
2. **Response Time** - Average, P95, P99 percentiles
3. **Status Codes** - 2xx/3xx/4xx/5xx breakdown
4. **Top Routes** - Most requested endpoints
5. **Backends/Services** - Service performance
6. **Routers** - Router metrics
7. **Errors** - Recent error entries
8. **Timeline** - Request activity over time
9. **Geographic Map** - Request origins
10. **System Resources** - CPU, memory, disk usage

##  API Endpoints

The agent exposes the following REST endpoints:

```
GET /api/logs/access          - Access logs with filtering
GET /api/logs/error           - Error logs (4xx/5xx)
GET /api/logs/status          - Status code distribution
GET /api/logs/get             - Single log entry
GET /api/system/logs          - System log entries
GET /api/system/resources     - System resource stats
```

Authentication: `Authorization: Bearer <token>`

[→ Full API Documentation](./agent/README.md#api-endpoints)

##  Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Traefik Proxy                      │
│                 (generates logs)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Traefik Access Logs                     │
│         (JSON or Common Log Format)                  │
└────┬────────────────────────────────────────────┬───┘
     │                                             │
     ▼                                             ▼
┌─────────────────────────┐           ┌──────────────────────┐
│Traefik Log Dashboard CLI│           │ Traefik Log Dashboard│
│    (Terminal TUI)       │           │      Agent           │
│                         │           │   (Go REST API)      │
│  • Direct log reading   │◄──────────┤                      │
│  • Demo mode            │   HTTP    │  • Log parsing       │
│  • Bubble Tea UI        │           │  • Metrics           │
└─────────────────────────┘           │  • GeoIP             │
                                      │  • System stats      │
                                      └──────────┬───────────┘
                                                 │
                                                 ▼ HTTP/REST
                                      ┌──────────────────────┐
                                      │ Traefik Log Dashboard│
                                      │                      │
                                      │  (Next.js Web UI)    │
                                      │                      │
                                      │  • Chart.js charts   │
                                      │  • D3.js maps        │
                                      │  • Real-time updates │
                                      └──────────────────────┘
```

##  Docker Deployment

### Docker Compose

```yaml

services:
  traefik-log-dashboard-agent:
    build: ./agent
    ports:
      - "8080:8080"
    volumes:
      - /var/log/traefik:/logs:ro
    environment:
      - LOG_FILE=/logs/access.log

  traefik-log-dashboard:
    build: ./dashboard
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://traefik-log-dashboard-agent:8080
    depends_on:
      - traefik-agent
```

[→ Full Docker Compose Configuration](./docker-compose.yml)

## Requirements

### Agent

- Go 1.22 or later
- Traefik access logs (JSON or CLF format)
- Optional: MaxMind GeoLite2 database for GeoIP

### Dashboard

- Node.js 18 or later
- npm or yarn

### CLI

- Go 1.22 or later
- Terminal with 256 color support

## Configuration

### Agent Configuration

```bash
# Environment variables
export LOG_FILE=/var/log/traefik/access.log
export PORT=8080
export AUTH_TOKEN=your-secret-token
export GEOIP_DB=/path/to/GeoLite2-City.mmdb
```

### Dashboard Configuration

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_TOKEN=your-secret-token
```

### CLI Configuration

```bash
# Environment variables
export TRAEFIK_AGENT_URL=http://localhost:8080
export TRAEFIK_LOG_FILE=/var/log/traefik/access.log
export REFRESH_INTERVAL=5s
```

## Usage Examples

### Analyze logs from the last hour

```bash
# CLI
traefik-log-dashboard --file /var/log/traefik/access.log --period 1h

# Agent API
curl -H "Authorization: Bearer token" \
  "http://localhost:8080/api/logs/access?period=1h"
```

### Filter by status code

```bash
# Agent API
curl -H "Authorization: Bearer token" \
  "http://localhost:8080/api/logs/error?status=500&period=24h"
```

### Real-time monitoring

```bash
# CLI with live updates
traefik-log-dashboard --url http://localhost:8080 --refresh 5s

# Dashboard
# Open http://localhost:3000/dashboard (auto-refreshes)
```

## Demo Mode

All components support demo mode for testing without real logs:

```bash
# CLI
traefik-log-dashboard --demo

# Dashboard
# Visit http://localhost:3000/dashboard/demo

# Agent generates sample data automatically
```

## Supported Log Formats

### JSON Format (Recommended)

```json
{
  "ClientAddr": "192.168.1.100:54321",
  "RequestMethod": "GET",
  "RequestPath": "/api/users",
  "DownstreamStatus": 200,
  "Duration": 1234567,
  "OriginDuration": 1100000,
  "Overhead": 134567,
  "RouterName": "api-router",
  "ServiceName": "api-service",
  "ServiceURL": "http://backend:8000"
}
```

### Common Log Format

```
192.168.1.100 - - [10/Oct/2025:13:55:36 +0000] "GET /api/users HTTP/1.1" 200 1234
```

## Performance

- **Agent**: Parses 100k+ lines/second
- **Dashboard**: Handles 10k+ data points smoothly
- **CLI**: <10ms UI refresh, <5% CPU usage
- **Memory**: ~50MB per 1M log entries

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/hhftechnology/traefik-log-dashboard.git
cd traefik-log-dashboard

# Install dependencies
cd agent && make deps && cd ..
cd dashboard && npm install && cd ..
cd cli && make deps && cd ..
```

### Run Tests

```bash
# Agent tests
cd agent && make test

# Dashboard tests
cd dashboard && npm test

# CLI tests
cd cli && make test
```

### Build All Components

```bash
# Agent
cd agent && make build

# Dashboard
cd dashboard && npm run build

# CLI
cd cli && make build
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Traefik](https://traefik.io/) - Excellent cloud-native proxy
- [Bubble Tea](https://github.com/charmbracelet/bubbletea) - Amazing TUI framework
- [Next.js](https://nextjs.org/) - Powerful React framework
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [MaxMind](https://www.maxmind.com/) - GeoIP database

## Documentation

- [Agent Documentation](./agent/README.md)
- [Dashboard Documentation](./dashboard/README.md)
- [CLI Documentation](./cli/README.md)
- [API Reference](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)

## Links

- [GitHub Repository](https://github.com/hhftechnology/traefik-log-dashboard)
- [Issue Tracker](https://github.com/hhftechnology/traefik-log-dashboard/issues)
- [Discussions](https://github.com/hhftechnology/traefik-log-dashboard/discussions)

---

**Made with ❤️ for the Traefik community**

⭐ Star this repo if you find it helpful!
