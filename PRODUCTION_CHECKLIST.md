# Production Readiness Checklist

Use this checklist before your first production deployment.

## 🔐 Security

- [ ] JWT secrets are strong (min 32 chars, mix of upper/lower/numbers/symbols)
- [ ] Database password is strong and unique
- [ ] `.env.production` is in `.gitignore` (never commit secrets)
- [ ] SSH keys generated (ed25519 preferred)
- [ ] Public key added to server's `~/.ssh/authorized_keys`
- [ ] Private SSH key stored securely locally
- [ ] GitHub secrets configured (DEPLOY_KEY, DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT)
- [ ] Firewall configured (22, 80, 443 only for public)
- [ ] fail2ban installed and running on server
- [ ] SSL certificates obtained (Let's Encrypt free option available)
- [ ] Password authentication disabled on server (SSH keys only)
- [ ] CORS_ORIGIN set to actual production domain
- [ ] Rate limiting enabled (default: 100 req/s per IP)

## 🏗️ Infrastructure

- [ ] Production server provisioned (VPS, Cloud instance, etc.)
- [ ] Docker and Docker Compose installed on server
- [ ] `/opt/app` directory created and writable
- [ ] PostgreSQL data volume configured for persistence
- [ ] Log rotation configured (docker-compose.prod.yml has 10m/3 files)
- [ ] Nginx reverse proxy configured
- [ ] Health check endpoints working locally

## 📦 Code

- [ ] Code pushed to `main` branch
- [ ] All tests passing locally (`npm test`)
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented in `.env.production.example`
- [ ] Error handling implemented (try/catch blocks)
- [ ] Logging configured (JSON format for parsing)
- [ ] Analytics scheduler integrated and tested
- [ ] Database migrations reviewed and tested locally

## 🐳 Docker

- [ ] Dockerfile for backend optimized (multi-stage, Alpine base)
- [ ] Dockerfile for frontend created and tested
- [ ] Dockerfile for nginx reverse proxy created
- [ ] `.dockerignore` files configured to reduce image size
- [ ] Docker images build successfully
- [ ] Docker images pass security scans (Trivy)
- [ ] Image sizes reasonable:
  - Backend: ~400MB
  - Frontend: ~100MB
  - Analytics: ~300MB
  - Nginx: ~50MB

## 🗄️ Database

- [ ] Database migrations created and tested (`npm run prisma:migrate`)
- [ ] Schema includes all required fields
- [ ] Indexes created for frequently queried fields
- [ ] Foreign keys configured correctly
- [ ] Backup strategy planned (daily automatic backups)
- [ ] Database password meets security requirements
- [ ] Connection pooling configured (Prisma default: 10 connections)

## 🚀 GitHub Actions

- [ ] Backend CI/CD workflow created and tested
- [ ] Analytics CI/CD workflow created and tested
- [ ] Frontend CI/CD workflow created and tested
- [ ] Security scan workflow enabled
- [ ] All workflows trigger on correct branches (main, Backend)
- [ ] Docker image caching enabled (type=gha)
- [ ] Health checks in deploy workflow
- [ ] Deployment only on successful tests
- [ ] Secrets configured in GitHub repo

## 📊 Monitoring

- [ ] Health check endpoints implemented:
  - `/health/live` (backend)
  - `/health/ready` (backend)
  - `/health` (analytics)
- [ ] Structured logging configured (Pino JSON format)
- [ ] Error tracking planned (Sentry recommended)
- [ ] Performance monitoring planned (New Relic, Datadog)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Log aggregation planned (ELK, Graylog)

## 📝 Documentation

- [ ] `DEPLOYMENT.md` created with setup instructions
- [ ] `GITHUB_SECRETS.md` created with secret setup guide
- [ ] Environment variables documented in `.env.production.example`
- [ ] Backup/restore procedures documented
- [ ] Troubleshooting guide created
- [ ] Team has access to deployment documentation

## 🔄 Deployment Scripts

- [ ] `setup.sh` created for fresh server setup
- [ ] `deploy.sh` created for rolling updates
- [ ] `rollback.sh` created for emergency rollbacks
- [ ] Scripts are executable (`chmod +x *.sh`)
- [ ] Scripts tested locally in Docker containers
- [ ] Backup created before each deployment
- [ ] Health checks verified after deployment

## ✅ Pre-Deployment Tests

- [ ] Local development environment working
- [ ] Docker Compose dev stack working (`docker-compose up`)
- [ ] Docker Compose prod stack working locally (test deploy)
- [ ] Health checks passing on all services
- [ ] Database migrations apply without errors
- [ ] Frontend builds successfully
- [ ] API endpoints responding correctly
- [ ] Analytics service syncing with backend
- [ ] Scheduler job runs without errors
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Authentication flow complete
- [ ] Admin dashboard accessible

## 🌐 Domain & DNS

- [ ] Domain registered and accessible
- [ ] DNS A record points to server IP
- [ ] CNAME records created (api, analytics subdomain if needed)
- [ ] DNS propagation verified (check with `nslookup` or `dig`)
- [ ] TTL set appropriately (300-3600 seconds)

## 📞 Communication

- [ ] Team notified of deployment plan
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback contacts identified
- [ ] On-call person assigned
- [ ] Escalation procedures documented
- [ ] Status page created (optional)

## 🎯 Post-Deployment

- [ ] Services running and healthy
- [ ] Database migrations applied
- [ ] Super admin account created
- [ ] Test organization created
- [ ] End-to-end functionality tested
- [ ] Performance baseline recorded
- [ ] Monitoring dashboards set up
- [ ] Team trained on deployment procedures
- [ ] Documentation updated with actual URLs
- [ ] Incident response plan reviewed

## 📋 Rollback Readiness

- [ ] Database backup created pre-deployment
- [ ] Previous stable version tagged in Git
- [ ] Rollback procedure tested in test environment
- [ ] Rollback time estimated (should be < 5 minutes)
- [ ] Clear rollback trigger defined

---

## First-Time Server Setup

```bash
# 1. SSH into server
ssh -i deploy_key user@your-server.com

# 2. Run setup script (if available)
cd /tmp
curl -O https://raw.githubusercontent.com/your-repo/setup.sh
chmod +x setup.sh
./setup.sh https://github.com/your-repo.git

# 3. Manually verify everything started
docker-compose -f /opt/app/docker-compose.prod.yml ps
curl http://localhost:4000/health/live
```

## Automated Deployment

After first-time setup:

```bash
# Just push to main branch
git push origin main:main

# GitHub Actions handles: build, test, push, deploy, migrate, verify
```

## Emergency Rollback

```bash
# SSH into server
ssh -i deploy_key user@your-server.com

# Run rollback script
cd /opt/app
./rollback.sh

# Select backup to restore from
# Services restart automatically
```

---

## Key Contacts

- **DevOps Lead**: [name] - [email]
- **Database Admin**: [name] - [email]
- **On-Call**: [name] - [phone]
- **Hosting Support**: [provider] - [contact]

---

**Last Updated**: [Current Date]
**Deployment Status**: ☐ Not Started | ☐ In Progress | ☐ Complete
