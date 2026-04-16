#!/usr/bin/env bash
set -euo pipefail

# Run analytics service locally on WSL/Linux without Docker.
# Usage:
#   cd analytics_service
#   chmod +x startup.sh
#   ./startup.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="python3"

cd "$ROOT_DIR"

echo "[1/5] Using global Python environment..."
command -v "$PYTHON_BIN" >/dev/null 2>&1 || { echo "python3 not found in PATH"; exit 1; }

echo "[2/5] Skipping dependency installation (using globally installed packages)..."

echo "[3/5] Loading environment variables..."
if [[ -f ".env" ]]; then
    while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
        line="${raw_line%$'\r'}"
        [[ -z "$line" || "$line" == \#* ]] && continue
        key="${line%%=*}"
        value="${line#*=}"
        export "$key=$value"
    done < .env
fi

: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_PASSWORD:=postgrespassword}"
: "${POSTGRES_SERVER:=localhost}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DB:=analytics}"
: "${ENVIRONMENT:=local}"
: "${SQLITE_DB_PATH:=$ROOT_DIR/analytics.db}"

export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_SERVER POSTGRES_PORT POSTGRES_DB ENVIRONMENT SQLITE_DB_PATH

if [[ -n "${DATABASE_URL:-}" ]]; then
    SAFE_DB_URL="${DATABASE_URL}"
    if [[ "$SAFE_DB_URL" == *"://"*"@"* ]]; then
        SAFE_DB_URL="${SAFE_DB_URL/@*/@***}"
    fi
    echo "Using DATABASE_URL: $SAFE_DB_URL"
else
    DB_URL="postgresql://${POSTGRES_USER}:***@${POSTGRES_SERVER}:${POSTGRES_PORT}/${POSTGRES_DB}"
    echo "Using database: $DB_URL"
fi

echo "[4/5] Waiting for PostgreSQL to be reachable..."
if ! "$PYTHON_BIN" - <<'PY'
import os
import socket
import time
from urllib.parse import urlparse

database_url = os.getenv("DATABASE_URL", "").strip()
if database_url:
    parsed = urlparse(database_url)
    host = parsed.hostname or os.getenv("POSTGRES_SERVER", "localhost")
    port = parsed.port or int(os.getenv("POSTGRES_PORT", "5432"))
else:
    host = os.getenv("POSTGRES_SERVER", "localhost")
    port = int(os.getenv("POSTGRES_PORT", "5432"))

deadline = time.time() + 45
last_err = None
while time.time() < deadline:
    s = socket.socket()
    s.settimeout(2)
    try:
        s.connect((host, port))
        s.close()
        print(f"PostgreSQL is reachable at {host}:{port}")
        break
    except Exception as exc:
        last_err = exc
        time.sleep(2)
else:
    raise SystemExit(f"Could not reach PostgreSQL at {host}:{port}. Last error: {last_err}")
PY
then
    SQLITE_PATH="${SQLITE_DB_PATH}"
    SQLITE_DIR="$(dirname "$SQLITE_PATH")"
    mkdir -p "$SQLITE_DIR"
    export DATABASE_URL="sqlite+aiosqlite:///$SQLITE_PATH"
    echo "PostgreSQL is unavailable. Falling back to SQLite at: $SQLITE_PATH"
fi

echo "[5/5] Ensuring database exists and applying schema/indexes..."
"$PYTHON_BIN" create_db.py
"$PYTHON_BIN" create_indexes.py

echo "Starting analytics API at http://0.0.0.0:8000 ..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
