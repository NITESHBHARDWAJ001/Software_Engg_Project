#!/bin/bash

# Rollback Script - Quickly revert to previous known good state

set -e

cd /opt/app

echo "⚠️  ROLLBACK INITIATED"
echo ""

# List available backups
echo "📦 Available backups:"
ls -lh backups/ | tail -10

echo ""
read -p "Enter backup filename to restore from (e.g., pre_deploy_20240414_020000.sql.gz): " BACKUP_FILE

if [ ! -f "backups/$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: backups/$BACKUP_FILE"
  exit 1
fi

echo "⏸️  Stopping backend services..."
docker-compose -f docker-compose.prod.yml down -v backend frontend nginx

echo "📥 Restoring database..."
cd backups
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | docker-compose -f ../docker-compose.prod.yml exec -T postgres \
    psql -U postgres saas_prod
else
  docker-compose -f ../docker-compose.prod.yml exec -T postgres \
    psql -U postgres saas_prod < "$BACKUP_FILE"
fi
cd ..

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d backend frontend nginx

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "✅ Rollback complete!"
echo "Services status:"
docker-compose -f docker-compose.prod.yml ps
