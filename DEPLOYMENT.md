# Production Deployment Guide

## Overview
This project uses GitHub Actions for CI/CD with automatic deployment to production. The deployment process includes:

1. **Build Phase**: Compile and containerize services
2. **Test Phase**: Verify Docker images and run health checks
3. **Database Migrations**: Automatically apply Prisma migrations
4. **Deploy Phase**: Deploy to production infrastructure
5. **Health Checks**: Verify all services are healthy

## Prerequisites

### Local Requirements
- Docker & Docker Compose
- Node.js 22+
- Git

### Server Requirements
- Docker & Docker Compose
- SSH access with key authentication
- Port 80/443 available (or reverse proxy configured)
- PostgreSQL running (via docker-compose)

## Setup Instructions

### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

```
DEPLOY_HOST        - IP/domain of production server
DEPLOY_USER        - SSH user (e.g., ubuntu, ec2-user)
DEPLOY_PORT        - SSH port (default: 22)
DEPLOY_KEY         - Private SSH key for deployment
```

Example GitHub Actions secret setup:
```bash
# Generate deploy key (on your local machine)
ssh-keygen -t ed25519 -f deploy_key -N ""

# Add public key to server (~/.ssh/authorized_keys)
cat deploy_key.pub | ssh user@host "cat >> ~/.ssh/authorized_keys"

# Add private key to GitHub (Settings > Secrets)
# Name: DEPLOY_KEY
# Value: (contents of deploy_key file)
```

### 2. Setup Production Server

```bash
# SSH into production server
ssh -i deploy_key user@your-server.com

# Create app directory
sudo mkdir -p /opt/app
sudo chown $(whoami) /opt/app

# Clone repository
cd /opt/app
git clone <your-repo> .

# Create environment file
cp .env.production.example .env.production
# Edit .env.production with your values
nano .env.production

# Ensure directories exist
mkdir -p ./logs
mkdir -p ./ssl  # For SSL certificates

# Start initial setup
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be healthy
docker-compose -f docker-compose.prod.yml logs -f postgres

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:deploy

# Create super admin
docker-compose -f docker-compose.prod.yml exec backend npm run bootstrap
```

### 3. Configure DNS and SSL

```bash
# DNS Records (update with your registrar)
A record   -> your-server-ip
CNAME api  -> your-server-ip
CNAME analytics -> your-server-ip
```

For SSL (using Let's Encrypt):
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot certonly --standalone -d your-domain.com -d api.your-domain.com

# Copy certificates to server
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/app/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/app/ssl/
sudo chown $(whoami) /opt/app/ssl/*
```

## Deployment Flow

### Automatic Deployment (On Push to Main)

```
Push to main branch
    ↓
GitHub Actions triggers backend-cd.yml
    ↓
Build Docker image
    ↓
Push to GitHub Container Registry (GHCR)
    ↓
Run container tests & health checks
    ↓
SSH to production server
    ↓
Pull latest image
    ↓
Run docker-compose up -d
    ↓
Auto-run Prisma migrations
    ↓
Health checks verify deployment
    ↓
Deployment complete!
```

### Manual Deployment

If you need to deploy without pushing code:

```bash
# Via GitHub Actions dispatch
# Go to Actions > [Workflow Name] > Run workflow

# Or manually on server
cd /opt/app
git pull
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:deploy
```

## Monitoring & Logs

### View Docker Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f analytics
docker-compose -f docker-compose.prod.yml logs -f postgres

# Stream only recent logs
docker-compose -f docker-compose.prod.yml logs --tail=100 -f
```

### Health Checks

```bash
# Backend
curl http://your-server:4000/health/live
curl http://your-server:4000/health/ready

# Analytics
curl http://your-server:8000/health

# PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Database Backup

```bash
# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U postgres saas_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres saas_prod < backup-file.sql
```

## Rollback Procedure

### If deployment fails:

```bash
# Check deployment status
docker-compose -f docker-compose.prod.yml ps

# Get previous working version
git log --oneline | head -5

# Checkout previous commit
git checkout <previous-commit-hash>

# Redeploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Verify health
curl http://your-server:4000/health/live
```

### Database Rollback

```bash
# If migrations fail, revert to previous backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres saas_prod < backup-file.sql

# Redeploy backend
docker-compose -f docker-compose.prod.yml up -d backend
```

## Environment-Specific Configuration

### Production (.env.production)
- NODE_ENV=production
- LOG_LEVEL=info
- Rate limiting enabled
- All validations enabled

### Staging
- Create separate DEPLOY_HOST secret: DEPLOY_HOST_STAGING
- Or use separate branch: staging
- Same process but with staging environment

## Troubleshooting

### Docker Image Pull Fails
```bash
# Authenticate with GHCR
docker login ghcr.io -u <username> -p <personal-access-token>

# Verify access
docker pull ghcr.io/your-repo/backend:latest
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d saas_prod -c "SELECT 1"

# Check environment variables
docker-compose -f docker-compose.prod.yml config | grep DATABASE_URL
```

### Health Check Failing
```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs backend

# Verify endpoints
curl -v http://localhost:4000/health/live

# Check database migrations
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate status
```

### Port Already in Use
```bash
# Check what's using port 4000
lsof -i :4000

# Or use Docker to find conflicts
docker-compose -f docker-compose.prod.yml logs
```

## Performance Tuning

### PostgreSQL
```bash
# Increase shared_buffers in docker-compose.prod.yml
# For 4GB RAM server: 1GB
# For 8GB RAM server: 2GB
```

### Nginx (Reverse Proxy)
- Worker processes: auto (uses all CPU cores)
- Keep-alive timeout: 65s
- Gzip compression: enabled
- Rate limiting: 100req/s per IP

### Application
- Connection pooling: Built-in via Prisma
- Session timeout: 15m access + 7d refresh
- Cache headers: 30 days for static assets

## Security Best Practices

1. **Never commit secrets** - Use .env.production (gitignored)
2. **Use strong passwords** - Min 16 chars, mixed case, numbers, symbols
3. **Enable SSH key authentication** - Disable password auth on server
4. **Use firewall rules** - Only allow ports 22, 80, 443
5. **Enable SSL/TLS** - Update nginx.conf with SSL configuration
6. **Regular backups** - Schedule nightly PostgreSQL backups
7. **Monitor logs** - Set up log aggregation/alerting
8. **Update dependencies** - Regular security updates via Dependabot

## Continuous Monitoring

### Set up alerts for:
- Failed deployments
- Health check failures
- Database errors
- High error rates
- Disk space usage

### Use:
- GitHub Actions notifications
- Email alerts
- Slack webhooks
- Datadog/New Relic for APM

## Support

For issues, check:
1. GitHub Actions logs: Actions tab
2. Server logs: `docker-compose logs`
3. Application logs: See Monitoring section
4. Backend docs: `/backend/docs`
