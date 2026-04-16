# Monitoring & Health Checks Setup

## Health Check Endpoints

### Backend Health Checks

**Liveness Check** (Is the service running?)
```bash
curl http://localhost:4000/health/live       
# Response: 200 OK if service is accepting connections
```

**Readiness Check** (Is the service ready to handle requests?)
```bash
curl http://localhost:4000/health/ready
# Response: 200 OK if database is healthy and service is ready
```

### Analytics Health Check

```bash
curl http://localhost:8000/health
# Response: 200 OK if service is operational
```

### Frontend Health Check

```bash
curl http://localhost:3000
# Response: 200 OK if serving static files
```

### Combined Docker Health

```bash
docker-compose -f docker-compose.prod.yml ps
# Shows health status for all services
# Expected: "health: healthy" for postgres, backend, analytics
```

---

## Structured Logging

### Backend Logging

All backend logs are in JSON format (Pino):

```javascript
{
  "level": "info",
  "time": "2024-04-14T10:30:00Z",
  "pid": 1,
  "hostname": "backend",
  "req": {
    "method": "POST",
    "url": "/api/auth/register",
    "ip": "192.168.1.100"
  },
  "res": {
    "statusCode": 201,
    "responseTime": 145
  },
  "msg": "User registered successfully"
}
```

### View Logs

**Real-time logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Last 100 lines:**
```bash
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

**Specific service:**
```bash
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f analytics
docker-compose -f docker-compose.prod.yml logs -f nginx
```

**Since specific time:**
```bash
docker-compose -f docker-compose.prod.yml logs --since 1h backend
docker-compose -f docker-compose.prod.yml logs --since 10m analytics
```

---

## Log Aggregation Setup

### Option 1: Simple File-Based Logging

Logs are written to container logs (Docker default):
```bash
# Docker stores logs in
/var/lib/docker/containers/[container-id]/[container-id]-json.log
```

### Option 2: Sentry (Error Tracking)

Setup Sentry for error monitoring:

```javascript
// In backend/src/config/sentry.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});

export default Sentry;
```

Add to GitHub Secrets:
- `SENTRY_DSN`: Your Sentry project DSN

### Option 3: ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# Add to docker-compose.prod.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    discovery.type: single-node
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch

logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  depends_on:
    - elasticsearch
```

### Option 4: Datadog (APM + Monitoring)

```bash
# Add Datadog agent to docker-compose.prod.yml
datadog-agent:
  image: gcr.io/datadog-gke/agent:latest
  env:
    DD_API_KEY: ${{ secrets.DATADOG_API_KEY }}
    DD_APM_ENABLED: true
    DD_AGENT_HOST: datadog-agent
```

---

## Performance Monitoring

### Database Performance

Check slow queries:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres saas_prod << EOF
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
EOF
```

### Connection Pooling Stats

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres saas_prod << EOF
SELECT datname, usename, wait_event, wait_event_type, state 
FROM pg_stat_activity;
EOF
```

### API Response Times

Backend logs include `responseTime` in milliseconds:
```bash
docker-compose -f docker-compose.prod.yml logs backend | grep "responseTime" | \
  awk -F'"responseTime":' '{print $2}' | sort -n | \
  awk '{sum+=$1; count++} END {print "Average: " sum/count "ms"}'
```

---

## Resource Monitoring

### Docker Container Resources

```bash
# Real-time monitoring
docker stats --no-stream

# Specific container
docker stats backend postgres
```

### Disk Space

```bash
# Overall disk usage
df -h

# Docker disk usage
docker system df

# Database size
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d saas_prod -c \
  "SELECT pg_size_pretty(pg_database_size('saas_prod'))"
```

### Memory Usage

```bash
# Check container memory
docker ps --format "table {{.Names}}\t{{.MemoryUsage}}"

# Get limits
docker inspect backend | grep -A 5 "Memory"
```

---

## Alerting Setup

### Uptime Monitoring (UptimeRobot)

1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Add new monitor:
   - Type: **HTTP(s)**
   - URL: `https://your-domain.com/api/health/live`
   - Interval: **5 minutes**
   - Alert contacts: your@email.com

### GitHub Actions Notifications

1. Go to repo → Settings → Notifications
2. Choose notification method:
   - Email (default)
   - Slack (recommended)
   - Microsoft Teams
   - Custom webhook

### Slack Webhook for Deployments

```bash
# Get Slack webhook from:
# Slack → Admin → Custom Integrations → Incoming Webhooks

# Add to GitHub Secrets: SLACK_WEBHOOK_URL

# In workflow, add:
- name: Slack notification
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Deployment completed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Status*: ${{ job.status }}\n*Branch*: main\n*Commit*: ${{ github.sha }}"
            }
          }
        ]
      }
```

---

## Dashboards

### GitHub Actions Dashboard

https://github.com/your-repo/actions

Shows:
- Workflow status (pass/fail)
- Deployment history
- Execution time
- Real-time logs

### Database Dashboard

```bash
# Open Prisma Studio (local only)
npm run prisma:studio

# Or use pgAdmin for remote monitoring
docker run -d \
  --name pgadmin \
  -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4
# Access: http://localhost:5050
```

### Custom Monitoring Dashboard

Create a simple monitoring page:

```html
<!-- monitoring.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Deployment Monitor</title>
  <style>
    body { font-family: monospace; background: #f5f5f5; padding: 20px; }
    .service { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .healthy { border-left: 5px solid #4CAF50; }
    .unhealthy { border-left: 5px solid #f44336; }
    .status { font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Production Services</h1>
  
  <div id="dashboard"></div>
  
  <script>
    const services = [
      { name: 'Backend', url: 'https://your-domain.com/api/health/live' },
      { name: 'Analytics', url: 'https://your-domain.com/analytics/health' },
      { name: 'Frontend', url: 'https://your-domain.com' },
    ];
    
    async function checkHealth() {
      const dashboard = document.getElementById('dashboard');
      dashboard.innerHTML = '';
      
      for (const service of services) {
        const div = document.createElement('div');
        div.className = 'service';
        div.textContent = `${service.name}: Checking...`;
        dashboard.appendChild(div);
        
        try {
          const response = await fetch(service.url, { mode: 'no-cors' });
          if (response.ok) {
            div.className = 'service healthy';
            div.textContent = `${service.name}: ✓ Healthy`;
          } else {
            div.className = 'service unhealthy';
            div.textContent = `${service.name}: ✗ Unhealthy (${response.status})`;
          }
        } catch (error) {
          div.className = 'service unhealthy';
          div.textContent = `${service.name}: ✗ Error (${error.message})`;
        }
      }
    }
    
    checkHealth();
    setInterval(checkHealth, 30000); // Check every 30 seconds
  </script>
</body>
</html>
```

---

## Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time | > 500ms | > 2000ms |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| Disk Usage | > 80% | > 95% |
| Database Connections | > 80 | > 95 |

---

## Incident Response

### Service Down Checklist

1. **Check Status**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs --tail=50
   ```

2. **Quick Restart**
   ```bash
   docker-compose -f docker-compose.prod.yml restart [service]
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Health Check**
   ```bash
   curl http://localhost:4000/health/live
   ```

4. **If Still Failing**
   - Check database: `docker-compose logs postgres`
   - Check connectivity: `docker network inspect app_network`
   - Restart all: `docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d`

5. **Last Resort**
   ```bash
   cd /opt/app && ./rollback.sh
   ```

---

## Metrics to Track

Track these over time:

- Deployment success rate (target: > 99%)
- Mean time to recovery (MTTR, target: < 5 min)
- Mean time between failures (MTBF, target: > 7 days)
- API response time (target: < 200ms p95)
- Error rate (target: < 0.1%)
- Database query time (target: < 100ms p95)

---

## Weekly/Monthly Reviews

**Weekly:**
- Check deployment logs
- Review health check trends
- Check resource usage
- Look for patterns in errors

**Monthly:**
- Review performance metrics
- Analyze slow query logs
- Check database growth
- Plan capacity upgrades if needed
