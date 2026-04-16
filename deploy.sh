#!/bin/bash

# Smart Deployment Script - Handles rolling updates and health checks

set -e

cd /opt/app

echo "🚀 Starting deployment..."

# Get current status
SERVICES=("postgres" "analytics" "backend" "frontend" "nginx")

echo "📊 Current service status:"
docker-compose -f docker-compose.prod.yml ps

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Pull latest images
echo "🐳 Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Backup database
echo "💾 Creating pre-deployment backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ./backups
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres saas_prod > "./backups/pre_deploy_$TIMESTAMP.sql"
gzip "./backups/pre_deploy_$TIMESTAMP.sql"
echo "✓ Backup saved: pre_deploy_$TIMESTAMP.sql.gz"

# Update services with rolling restart
echo "🔄 Deploying services..."

# 1. Migrate database
echo "   → Running database migrations..."
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:deploy

# 2. Update analytics
echo "   → Updating analytics service..."
docker-compose -f docker-compose.prod.yml up -d analytics
sleep 5

# 3. Update backend
echo "   → Updating backend service..."
docker-compose -f docker-compose.prod.yml up -d backend
sleep 5

# 4. Update frontend
echo "   → Updating frontend service..."
docker-compose -f docker-compose.prod.yml up -d frontend
sleep 5

# 5. Update nginx
echo "   → Updating nginx reverse proxy..."
docker-compose -f docker-compose.prod.yml up -d nginx
sleep 5

# Health checks
echo "✅ Running health checks..."
HEALTH_CHECKS_PASSED=0
HEALTH_CHECKS_FAILED=0

check_health() {
  local service=$1
  local url=$2
  local expected_code=$3
  
  if curl -sf "$url" -w '\n%{http_code}' 2>/dev/null | tail -n1 | grep -q "$expected_code"; then
    echo "  ✓ $service"
    ((HEALTH_CHECKS_PASSED++))
  else
    echo "  ✗ $service"
    ((HEALTH_CHECKS_FAILED++))
  fi
}

check_health "Backend" "http://localhost:4000/health/live" "200"
check_health "Analytics" "http://localhost:8000/health" "200"
check_health "Frontend" "http://localhost:3000" "200"

# Cleanup
echo "🧹 Cleaning up old Docker images..."
docker system prune -f

# Summary
echo ""
echo "📋 Deployment Summary:"
echo "  ✅ Health checks passed: $HEALTH_CHECKS_PASSED"
echo "  ❌ Health checks failed: $HEALTH_CHECKS_FAILED"
echo "  📅 Timestamp: $TIMESTAMP"
echo ""

if [ $HEALTH_CHECKS_FAILED -eq 0 ]; then
  echo "🎉 Deployment successful!"
  exit 0
else
  echo "⚠️  Deployment completed with warnings"
  echo "Backup available: ./backups/pre_deploy_$TIMESTAMP.sql.gz"
  exit 1
fi
