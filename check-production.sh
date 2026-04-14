#!/bin/bash

# Production Deployment Status Check
# Run this to verify all production components are properly configured

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Production Deployment Status Check${NC}\n"

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

check_file() {
  local file=$1
  local description=$2
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} $description (missing: $file)"
    ((CHECKS_FAILED++))
  fi
}

check_docker_file() {
  local file=$1
  local description=$2
  if [ -f "$file" ]; then
    if grep -q "FROM" "$file"; then
      echo -e "${GREEN}✓${NC} $description"
      ((CHECKS_PASSED++))
    else
      echo -e "${RED}✗${NC} $description (invalid Dockerfile)"
      ((CHECKS_FAILED++))
    fi
  else
    echo -e "${RED}✗${NC} $description (missing)"
    ((CHECKS_FAILED++))
  fi
}

echo -e "${BLUE}📋 CI/CD Workflows${NC}"
check_file ".github/workflows/backend-ci.yml" "Backend CI workflow"
check_file ".github/workflows/backend-cd.yml" "Backend CD workflow"
check_file ".github/workflows/analytics-cd.yml" "Analytics CD workflow"
check_file ".github/workflows/frontend-cd.yml" "Frontend CD workflow"
check_file ".github/workflows/security-scan.yml" "Security scan workflow"

echo -e "\n${BLUE}🐳 Docker Configuration${NC}"
check_docker_file "backend/Dockerfile" "Backend Dockerfile"
check_docker_file "ethnic-fashion-saas/Dockerfile" "Frontend Dockerfile"
check_docker_file "Dockerfile.nginx" "Nginx Dockerfile"
check_file "docker-compose.prod.yml" "Production docker-compose"
check_file "nginx.conf" "Nginx configuration"

echo -e "\n${BLUE}📁 Deployment Scripts${NC}"
if [ -f "setup.sh" ]; then
  if grep -q "#!/bin/bash" "setup.sh"; then
    echo -e "${GREEN}✓${NC} Server setup script"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} Server setup script (not executable)"
    ((CHECKS_FAILED++))
  fi
else
  echo -e "${RED}✗${NC} Server setup script (missing)"
  ((CHECKS_FAILED++))
fi

check_file "deploy.sh" "Deployment script"
check_file "rollback.sh" "Rollback script"

echo -e "\n${BLUE}📚 Documentation${NC}"
check_file "PRODUCTION_READY.md" "Production status overview"
check_file "QUICKSTART.md" "Quick start guide"
check_file "PRODUCTION_CHECKLIST.md" "Pre-deployment checklist"
check_file "DEPLOYMENT.md" "Complete deployment guide"
check_file "GITHUB_SECRETS.md" "GitHub secrets setup"
check_file "MONITORING.md" "Monitoring & health checks"

echo -e "\n${BLUE}🔐 Security & Configuration${NC}"
check_file ".env.production.example" "Environment template"
check_file ".dockerignore" "Docker build optimization"
check_file "backend/.dockerignore" "Backend docker build optimization"

echo -e "\n${BLUE}📦 Application Configuration${NC}"
if grep -q "npm run prisma:deploy" "backend/package.json" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Database migration script configured"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Database migration script (check package.json)"
  ((CHECKS_WARNING++))
fi

if grep -q "analyticsOrgSync.scheduler" "backend/src/server.js" 2>/dev/null || \
   grep -q "startAnalyticsOrgReconciliation" "backend/src/server.js" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Analytics scheduler integrated"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Analytics scheduler (check server.js)"
  ((CHECKS_WARNING++))
fi

if grep -q "analyticsAvailable" "backend/prisma/schema.prisma" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Analytics tracking schema fields"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Analytics tracking schema (check schema.prisma)"
  ((CHECKS_WARNING++))
fi

echo -e "\n${BLUE}🔄 GitHub Configuration${NC}"
if [ -d ".github" ]; then
  echo -e "${GREEN}✓${NC} GitHub directory exists"
  ((CHECKS_PASSED++))
  
  if [ -d ".github/workflows" ]; then
    echo -e "${GREEN}✓${NC} Workflows directory configured"
    ((CHECKS_PASSED++))
  fi
else
  echo -e "${RED}✗${NC} GitHub directory (missing)"
  ((CHECKS_FAILED++))
fi

echo -e "\n${BLUE}📋 Summary${NC}"
TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

echo "✓ Passed:" $CHECKS_PASSED
if [ $CHECKS_FAILED -gt 0 ]; then
  echo -e "${RED}✗ Failed:${NC}" $CHECKS_FAILED
fi
if [ $CHECKS_WARNING -gt 0 ]; then
  echo -e "${YELLOW}⚠ Warnings:${NC}" $CHECKS_WARNING
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Checks: " $TOTAL

echo -e "\n${BLUE}🚀 Next Steps${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All checks passed! You're ready to deploy.${NC}\n"
  echo "1. Review PRODUCTION_CHECKLIST.md"
  echo "2. Configure GitHub Secrets (see GITHUB_SECRETS.md)"
  echo "3. Prepare production server (see DEPLOYMENT.md)"
  echo "4. Create .env.production from template"
  echo "5. Push code to deploy: git push origin main:main"
  echo ""
  echo "📖 More info: see QUICKSTART.md"
else
  echo -e "${RED}Please fix the failed checks before deploying${NC}\n"
  echo "Failed items must be resolved first."
  echo "Review PRODUCTION_READY.md for details."
fi

[ $CHECKS_FAILED -eq 0 ] && exit 0 || exit 1
