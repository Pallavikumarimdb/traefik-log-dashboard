<div align="center">
    <h1>Traefik Log Dashboard</h1>
    <p>Comprehensive real-time analytics platform for Traefik reverse proxy logs</p>

[![Docker](https://img.shields.io/docker/pulls/hhftechnology/traefik-log-dashboard?style=flat-square)](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard)
[![Docker](https://img.shields.io/docker/pulls/hhftechnology/traefik-log-dashboard-agent?style=flat-square)](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard-agent)
![Stars](https://img.shields.io/github/stars/hhftechnology/traefik-log-dashboard?style=flat-square)
[![Discord](https://img.shields.io/discord/994247717368909884?logo=discord&style=flat-square)](https://discord.gg/HDCt9MjyMJ)
</div>

---

## 📚 Full Documentation

**Visit our comprehensive documentation site:** [https://traefik-log-dashboard.docs.dev](https://traefik-log-dashboard.docs.dev)

Or explore the docs locally:
```bash
cd docs
npm install
npm run dev
```

---

## ⚡ Quick Start

Get started in under 5 minutes with Docker Compose:

### 1. Create Project Structure

```bash
mkdir -p traefik-dashboard/{data/{logs,geoip,positions,dashboard}}
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
      - ./data/geoip:/geoip:ro
      - ./data/positions:/data
    environment:
      - TRAEFIK_LOG_DASHBOARD_ACCESS_PATH=/logs/access.log
      - TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN=your_secure_token_here
      - TRAEFIK_LOG_DASHBOARD_GEOIP_ENABLED=true
      - TRAEFIK_LOG_DASHBOARD_GEOIP_CITY_DB=/geoip/GeoLite2-City.mmdb
      - TRAEFIK_LOG_DASHBOARD_GEOIP_COUNTRY_DB=/geoip/GeoLite2-Country.mmdb
    networks:
      - traefik-network

  traefik-dashboard:
    image: hhftechnology/traefik-log-dashboard:latest
    container_name: traefik-log-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data/dashboard:/app/data
    environment:
      - AGENT_API_URL=http://traefik-agent:5000
      - AGENT_API_TOKEN=your_secure_token_here
      - AGENT_NAME=Default Agent
    depends_on:
      - traefik-agent
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true
```

### 3. Generate Secure Token

```bash
openssl rand -hex 32
```

Update both `TRAEFIK_LOG_DASHBOARD_AUTH_TOKEN` and `AGENT_API_TOKEN` with this value.

### 4. Start Services

```bash
docker compose up -d
```

### 5. Access Dashboard

Open http://localhost:3000 in your browser.

---

## 🚀 Key Features

- ✅ **Multi-Agent Architecture** - Manage multiple Traefik instances
- ✅ **Interactive 3D Globe** - Geographic visualization with map transitions
- ✅ **Advanced Filtering** - Include/exclude modes, geographic filtering
- ✅ **Background Alerting** - Discord webhooks, daily summaries
- ✅ **Enhanced Security** - CVE-2025-55182 patches, rate limiting, request validation
- ✅ **High Performance** - Go-based agent, optimized log parsing
- ✅ **Terminal Dashboard** - Beautiful CLI with Bubble Tea

---

## 📦 Components

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **Agent** | Go-based log parser and API server | [docs/components/agent](./docs/content/docs/components/agent.mdx) |
| **Dashboard** | Next.js web UI with real-time analytics | [docs/components/dashboard](./docs/content/docs/components/dashboard.mdx) |
| **CLI** | Terminal-based dashboard (optional) | [docs/components/cli](./docs/content/docs/components/cli.mdx) |

---

## 📖 Documentation Links

- [Quick Start Guide](./docs/content/docs/quickstart.mdx)
- [Configuration](./docs/content/docs/configuration/index.mdx)
- [Features](./docs/content/docs/features.mdx)
- [Security](./docs/content/docs/security.mdx)
- [Troubleshooting](./docs/content/docs/troubleshooting.mdx)
- [Changelog](./docs/content/docs/changelog.mdx)

---

## 🔒 Security

**Latest Release (v2.3.0)** includes:
- CVE-2025-55182 security patches
- Comprehensive middleware protection
- Rate limiting and malicious pattern detection
- Enhanced error handling

See [Security Documentation](./docs/content/docs/security.mdx) for details.

---

## 💬 Community & Support

- **Documentation**: [https://traefik-log-dashboard.docs.dev](https://traefik-log-dashboard.docs.dev)
- **Discord**: [Join our community](https://discord.gg/HDCt9MjyMJ)
- **GitHub Issues**: [Report bugs](https://github.com/hhftechnology/traefik-log-dashboard/issues)
- **Docker Hub**: [Agent](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard-agent) | [Dashboard](https://hub.docker.com/r/hhftechnology/traefik-log-dashboard)

---

## 📜 License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the Traefik community**

[GitHub](https://github.com/hhftechnology/traefik-log-dashboard) • [Discord](https://discord.gg/HDCt9MjyMJ) • [Documentation](https://traefik-log-dashboard.docs.dev)

⭐ Star this repo if you find it helpful!

</div>
