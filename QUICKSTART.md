# Production Deployment Quick Start

## 1️⃣ Configure GitHub Secrets (5 minutes)

In your GitHub repo → Settings → Secrets and variables → Actions, add:

| Secret | Example |
|--------|---------|
| `DEPLOY_HOST` | `192.168.1.100` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_KEY` | (see below) |

**Generate SSH Key:**
```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
cat deploy_key.pub | ssh user@your-server.com "cat >> ~/.ssh/authorized_keys"
# Copy entire contents of 'deploy_key' file to DEPLOY_KEY secret
```

---

## 2️⃣ Prepare Production Server (10 minutes)

```bash
# SSH into your server
ssh user@your-server.com

# Run one-time setup
curl -O https://raw.githubusercontent.com/your-account/your-repo/main/setup.sh
chmod +x setup.sh
./setup.sh https://github.com/your-account/your-repo.git

# Edit production environment
nano /opt/app/.env.production
# Fill in: DB_PASSWORD, JWT secrets, SUPER_ADMIN_PASSWORD
```

---

## 3️⃣ First Deployment (fully automatic)

```bash
# On your computer, make a change and push
git add .
git commit -m "Deploy to production"
git push origin main:main

# Watch the GitHub Actions workflow
# -> Builds Docker images
# -> Pushes to registry
# -> Deploys to your server
# -> Runs migrations
# -> Verifies health checks
# ✅ DONE!
```

---

## 4️⃣ Verify Deployment

```bash
# Check service status
ssh user@your-server.com
docker-compose -f /opt/app/docker-compose.prod.yml ps

# Test API
curl https://your-domain.com/api/health/live
curl https://your-domain.com/api/health/ready
curl https://your-domain.com/analytics/health

# View logs
docker-compose -f /opt/app/docker-compose.prod.yml logs -f backend
```

---

## 5️⃣ Emergency Rollback (2 minutes)

If something breaks:

```bash
ssh user@your-server.com
cd /opt/app
./rollback.sh
# Select the backup from list
# ✅ Services restart with previous version
```

---

## Subsequent Deployments

**Fully automatic!** Just push to main:

```bash
git push origin main:main
# GitHub Actions handles everything
# Deployment takes ~5-10 minutes
```

---

## Key Features Configured

✅ **CI/CD Pipeline** - Auto-build, test, deploy on push
✅ **Database Migrations** - Auto-applied on deployment
✅ **Docker Multi-Stage** - Optimized Alpine images (~50MB-400MB)
✅ **Reverse Proxy** - Nginx load balancing with rate limiting
✅ **Health Checks** - Liveness & readiness probes
✅ **Auto-Rollback** - Database backup + restore
✅ **Monitoring** - Health endpoints + structured logging
✅ **Security** - SSL/TLS ready, secrets in env vars
✅ **Scheduler** - Daily analytics reconciliation
✅ **Networking** - Docker network isolation

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         GitHub Actions CI/CD                 │
│  (Build → Test → Push → Deploy → Verify)    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────┐
│      Production Server            │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │   Nginx (Reverse Proxy)    │   │
│ │   - Port 80/443            │   │
│ │   - Rate Limiting          │   │
│ └─────────────┬──────────────┘   │
│               │                  │
│  ┌────────────┼────────────┐    │
│  ▼            ▼            ▼    │
│ Backend   Frontend   Analytics   │
│ :4000     :3000      :8000       │
│               │                  │
│               ▼                  │
│         PostgreSQL 16            │
│         (with backups)           │
└──────────────────────────────────┘
```

---

## Environment Variables Template

See `.env.production.example` - copy and customize:
- Database credentials
- JWT secrets
- CORS origin
- Admin account
- Service URLs

---

## Monitoring

**Health Checks:**
- Backend: `GET /health/live`, `/health/ready`
- Analytics: `GET /health`
- Frontend: HTTP 200

**Logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f [service]
```

**Backups:**
- Automatic daily at 2 AM
- Stored in `/opt/app/backups/`

---

## Support

1. **Workflow not triggering?**
   - Check: branch is `main` or `Backend`
   - Check: file paths match (backend/**, .github/workflows/**)

2. **Deployment failing?**
   - Check GitHub Actions logs
   - Check server logs: `docker-compose logs -f`
   - Verify secrets are set correctly

3. **Service not healthy?**
   - Check logs: `docker-compose logs [service]`
   - Check port: `lsof -i :4000`
   - Check database: `docker-compose exec postgres pg_isready`

4. **Database issues?**
   - Verify migrations: `docker-compose exec backend npx prisma migrate status`
   - Check tables: `docker-compose exec postgres psql -U postgres saas_prod -l`

---

**Next Steps:** Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed documentation
