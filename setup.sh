#!/bin/bash

# Production Server Setup Script
# Run this on a fresh server to set up the application

set -e

echo "🚀 Starting production server setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y \
  curl \
  wget \
  git \
  docker.io \
  docker-compose \
  openssh-server \
  fail2ban \
  ufw

# Start Docker
echo "🐳 Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/app
sudo chown $(whoami) /opt/app
cd /opt/app

# Clone repository (update with your repo URL)
if [ -z "$1" ]; then
  echo "❌ Repository URL required as first argument"
  echo "Usage: ./setup.sh <repo-url>"
  exit 1
fi

echo "📥 Cloning repository..."
git clone "$1" .
git checkout main

# Setup environment variables
echo "🔐 Setting up environment file..."
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "⚠️  Edit .env.production with your values before continuing:"
  echo "   - DB_PASSWORD"
  echo "   - JWT_ACCESS_SECRET"
  echo "   - JWT_REFRESH_SECRET"
  echo "   - CORS_ORIGIN"
  echo "   - SUPER_ADMIN_PASSWORD"
  exit 1
fi

# Create required directories
echo "📂 Creating required directories..."
mkdir -p ./logs
mkdir -p ./ssl
mkdir -p ./backups

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

# Configure fail2ban
echo "🛡️  Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create Docker volumes
echo "💾 Creating Docker volumes..."
docker volume create postgres_data || true

# Start services
echo "🚀 Starting Docker services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
for i in {1..30}; do
  if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "healthy"; then
    echo "✓ PostgreSQL is healthy"
    break
  fi
  echo "Checking PostgreSQL... ($i/30)"
  sleep 2
done

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:deploy

# Create super admin
echo "📝 Creating super admin user..."
docker-compose -f docker-compose.prod.yml exec backend npm run bootstrap

# Setup SSL (Let's Encrypt)
echo "🔒 Setting up SSL certificate..."
echo "After setup, run:"
echo "  certbot certonly --standalone -d your-domain.com"
echo "  Then copy certs to ./ssl/"

# Create backup script
echo "📊 Creating backup script..."
cat > /opt/app/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="/opt/app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres saas_prod > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "✓ Backup completed: backup_$TIMESTAMP.sql.gz"
BACKUP_SCRIPT

chmod +x /opt/app/backup.sh

# Setup cron for daily backups
echo "⏰ Setting up daily backup cron..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/app/backup.sh") | crontab -

# Final checks
echo "✅ Running final checks..."
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🎉 Production server setup completed!"
echo ""
echo "Next steps:"
echo "1. Verify all services are healthy: docker-compose -f docker-compose.prod.yml ps"
echo "2. Configure SSL certificates"
echo "3. Update DNS records to point to this server"
echo "4. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Admin credentials:"
echo "  Email: $(grep SUPER_ADMIN_EMAIL .env.production | cut -d= -f2)"
echo ""
