#!/usr/bin/env bash
set -euo pipefail

# Verifies backend and analytics are healthy and backend's analytics target is reachable.
# Run from repo root or anywhere inside repo:
#   bash scripts/check_services_sync.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_BASE="${BACKEND_BASE_URL:-http://127.0.0.1:4000}"
ANALYTICS_HEALTH_URL="${ANALYTICS_HEALTH_URL:-http://127.0.0.1:8000/health}"
ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL:-}"

if [[ -z "$ANALYTICS_SERVICE_URL" && -f "backend/.env" ]]; then
  line="$(grep -E '^ANALYTICS_SERVICE_URL=' backend/.env | tail -n 1 || true)"
  if [[ -n "$line" ]]; then
    ANALYTICS_SERVICE_URL="${line#*=}"
    ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL%$'\r'}"
    ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL%\"}"
    ANALYTICS_SERVICE_URL="${ANALYTICS_SERVICE_URL#\"}"
  fi
fi

if [[ -z "$ANALYTICS_SERVICE_URL" ]]; then
  ANALYTICS_SERVICE_URL="http://127.0.0.1:8000/api/v1"
fi

check_url() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)"

  # In WSL, services running on Windows can fail with curl(7) but succeed via curl.exe.
  if [[ "$code" == "000" ]] && command -v curl.exe >/dev/null 2>&1; then
    code="$(curl.exe -s -o NUL -w "%{http_code}" "$url" || true)"
  fi

  if [[ "$code" != "200" ]]; then
    echo "[FAIL] $name -> $url (HTTP $code)"
    exit 1
  fi
  echo "[OK] $name -> $url"
}

echo "Checking backend live endpoint..."
check_url "backend live" "$BACKEND_BASE/health/live"

echo "Checking backend ready endpoint..."
check_url "backend ready" "$BACKEND_BASE/health/ready"

echo "Checking analytics health endpoint..."
check_url "analytics health" "$ANALYTICS_HEALTH_URL"

echo "Checking backend analytics target endpoint..."
check_url "analytics service root" "$ANALYTICS_SERVICE_URL/"

echo "All checks passed. Backend and analytics look in sync."
echo "Backend: $BACKEND_BASE"
echo "Analytics health: $ANALYTICS_HEALTH_URL"
echo "Backend analytics target: $ANALYTICS_SERVICE_URL"
