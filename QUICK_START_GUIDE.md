# Quick Start Guide - Alerting & Historical Data

This guide will help you quickly set up and use the new alerting and historical data features.

---

## 1. Setting Up Discord Webhooks

### Step 1: Create Discord Webhook
1. Go to your Discord server
2. Right-click on a channel → **Edit Channel**
3. Go to **Integrations** → **Webhooks**
4. Click **New Webhook**
5. Copy the webhook URL

### Step 2: Add to Dashboard
1. Navigate to **Settings** → **Alerts** in your dashboard
2. Click **Webhooks** tab
3. Click **Add Webhook** (Coming soon: form modal)
4. Or use API directly:

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Discord Channel",
    "type": "discord",
    "url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL",
    "description": "Production alerts",
    "enabled": true
  }'
```

### Step 3: Test Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"webhook_id": "webhook-xxx"}'
```

You should see a test message appear in your Discord channel!

---

## 2. Setting Up Telegram Webhooks

### Step 1: Create Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token

### Step 2: Get Chat ID
1. Add your bot to a channel or group
2. Send a test message in that channel
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find the `chat.id` in the response

### Step 3: Create Webhook URL
Format: `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>`

### Step 4: Add to Dashboard
```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Telegram Alerts",
    "type": "telegram",
    "url": "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>",
    "description": "Team notifications",
    "enabled": true
  }'
```

---

## 3. Creating Alert Rules

### Example 1: Hourly Traffic Summary

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hourly Traffic Summary",
    "description": "Overview of traffic every hour",
    "enabled": true,
    "trigger_type": "interval",
    "interval": "1h",
    "webhook_ids": ["webhook-xxx"],
    "parameters": [
      {"parameter": "request_count", "enabled": true},
      {"parameter": "error_rate", "enabled": true},
      {"parameter": "response_time", "enabled": true},
      {"parameter": "top_ips", "enabled": true, "limit": 5},
      {"parameter": "top_locations", "enabled": true, "limit": 5}
    ]
  }'
```

### Example 2: High Error Rate Alert

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Error Rate",
    "description": "Alert when error rate exceeds threshold",
    "enabled": true,
    "trigger_type": "threshold",
    "webhook_ids": ["webhook-xxx"],
    "parameters": [
      {"parameter": "error_rate", "enabled": true, "threshold": 5.0},
      {"parameter": "top_status_codes", "enabled": true, "limit": 5},
      {"parameter": "top_routes", "enabled": true, "limit": 5}
    ]
  }'
```

### Example 3: Comprehensive Daily Report

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Report",
    "description": "Complete daily traffic analysis",
    "enabled": true,
    "trigger_type": "interval",
    "interval": "24h",
    "webhook_ids": ["webhook-discord", "webhook-telegram"],
    "parameters": [
      {"parameter": "request_count", "enabled": true},
      {"parameter": "error_rate", "enabled": true},
      {"parameter": "response_time", "enabled": true},
      {"parameter": "top_ips", "enabled": true, "limit": 10},
      {"parameter": "top_locations", "enabled": true, "limit": 10},
      {"parameter": "top_routes", "enabled": true, "limit": 10},
      {"parameter": "top_status_codes", "enabled": true, "limit": 5},
      {"parameter": "top_routers", "enabled": true, "limit": 5},
      {"parameter": "top_services", "enabled": true, "limit": 5}
    ]
  }'
```

---

## 4. Enabling Historical Data Storage

### Via UI
1. Navigate to **Settings** → **Historical Data**
2. Click **Enable** toggle
3. Set **Retention Period** (e.g., 90 days)
4. Set **Archive Interval** (e.g., 60 minutes)
5. Click **Save Configuration**

### Via API
```bash
curl -X PATCH http://localhost:3000/api/historical/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "retention_days": 90,
    "archive_interval": 60
  }'
```

---

## 5. Querying Historical Data

### Get Recent Data
```bash
curl "http://localhost:3000/api/historical/data?limit=100"
```

### Get Data for Specific Agent
```bash
curl "http://localhost:3000/api/historical/data?agent_id=agent-001&limit=50"
```

### Get Data for Date Range
```bash
curl "http://localhost:3000/api/historical/data?start_date=2025-10-01&end_date=2025-10-25"
```

### Export All Data
```bash
curl -X POST "http://localhost:3000/api/historical/data?action=export" \
  -H "Content-Type: application/json" \
  -d '{"query": {}}' \
  --output historical-data.json
```

---

## 6. Available Alert Parameters

| Parameter | Description | Has Limit | Example |
|-----------|-------------|-----------|---------|
| `top_ips` | Top IP addresses by request count | ✅ | `{"parameter": "top_ips", "enabled": true, "limit": 5}` |
| `top_locations` | Top geographic locations | ✅ | `{"parameter": "top_locations", "enabled": true, "limit": 5}` |
| `top_routes` | Top routes with avg response time | ✅ | `{"parameter": "top_routes", "enabled": true, "limit": 10}` |
| `top_status_codes` | HTTP status code distribution | ✅ | `{"parameter": "top_status_codes", "enabled": true, "limit": 5}` |
| `top_user_agents` | Browser/client statistics | ✅ | `{"parameter": "top_user_agents", "enabled": true, "limit": 5}` |
| `top_routers` | Traefik router metrics | ✅ | `{"parameter": "top_routers", "enabled": true, "limit": 5}` |
| `top_services` | Backend service metrics | ✅ | `{"parameter": "top_services", "enabled": true, "limit": 5}` |
| `top_hosts` | Request host distribution | ✅ | `{"parameter": "top_hosts", "enabled": true, "limit": 5}` |
| `top_request_addresses` | Request address metrics | ✅ | `{"parameter": "top_request_addresses", "enabled": true, "limit": 5}` |
| `top_client_ips` | Client IP statistics | ✅ | `{"parameter": "top_client_ips", "enabled": true, "limit": 5}` |
| `error_rate` | Percentage of failed requests | ❌ | `{"parameter": "error_rate", "enabled": true}` |
| `response_time` | Avg, P95, P99 response times | ❌ | `{"parameter": "response_time", "enabled": true}` |
| `request_count` | Total request volume | ❌ | `{"parameter": "request_count", "enabled": true}` |

---

## 7. Alert Trigger Types

### Interval
Sends notifications at fixed time intervals.

**Supported Intervals:**
- `5m` - Every 5 minutes
- `15m` - Every 15 minutes
- `30m` - Every 30 minutes
- `1h` - Every hour
- `6h` - Every 6 hours
- `12h` - Every 12 hours
- `24h` - Daily

### Threshold (To be implemented)
Triggers when a metric crosses a specified threshold.

**Example:** Alert when error rate > 5%

### Event (To be implemented)
Triggers on specific events.

**Example:** Alert on any 5xx error

---

## 8. Managing Notifications

### View Notification History
```bash
curl "http://localhost:3000/api/webhooks"
```

### Enable/Disable Webhook
```bash
curl -X PATCH http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "webhook-xxx",
    "enabled": false
  }'
```

### Enable/Disable Alert Rule
```bash
curl -X PATCH http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "alert-xxx",
    "enabled": false
  }'
```

---

## 9. Database Files

The system creates two SQLite databases:

1. **Main Database:** `data/agents.db`
   - Agents, webhooks, alert rules, notification history

2. **Historical Database:** `data/historical.db`
   - Archived metrics data
   - Separate for better performance

Both databases are automatically created on first run.

---

## 10. Troubleshooting

### Webhook Not Receiving Notifications

1. **Check webhook status:**
   ```bash
   curl http://localhost:3000/api/webhooks
   ```
   Ensure `enabled: true`

2. **Test webhook:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/test \
     -H "Content-Type: application/json" \
     -d '{"webhook_id": "webhook-xxx"}'
   ```

3. **Check notification history:**
   View the response for error messages

4. **Verify webhook URL:**
   - Discord: Should start with `https://discord.com/api/webhooks/`
   - Telegram: Should include bot token and chat ID

### Historical Data Not Archiving

1. **Check if enabled:**
   ```bash
   curl http://localhost:3000/api/historical/config
   ```

2. **Verify archival service is running** (once implemented)

3. **Check database permissions** on `data/historical.db`

### Performance Issues

1. **Check database sizes:**
   ```bash
   ls -lh data/*.db
   ```

2. **Run cleanup:**
   ```bash
   curl -X POST "http://localhost:3000/api/historical/data?action=cleanup"
   ```

3. **Optimize databases:**
   ```bash
   sqlite3 data/agents.db "VACUUM;"
   sqlite3 data/historical.db "VACUUM;"
   ```

---

## 11. Example Discord Notification

When an alert triggers, you'll see a rich embed in Discord:

```
🚨 Hourly Traffic Summary

Alert triggered at 10/25/2025, 2:00:00 PM

Agent: Production Server

📈 Total Requests
1850

❌ Error Rate
3.20%

⏱️ Response Time
Avg: 125ms
P95: 250ms
P99: 500ms

🔝 Top 5 IPs
1. 192.168.1.100 - 150 requests
2. 10.0.0.50 - 120 requests
3. 172.16.0.25 - 95 requests
4. 203.0.113.5 - 80 requests
5. 198.51.100.10 - 75 requests

🌍 Top 5 Locations
1. New York, United States - 200 requests
2. London, United Kingdom - 150 requests
3. Berlin, Germany - 100 requests
4. Tokyo, Japan - 75 requests
5. Sydney, Australia - 50 requests

Traefik Log Dashboard
```

---

## Support

For issues or questions:
1. Check the implementation summary document
2. Review API responses for error messages
3. Check browser console and server logs
4. Verify database schema in `lib/db/` files
