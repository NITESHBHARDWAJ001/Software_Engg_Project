#!/usr/bin/env bash
set -euo pipefail

# Push analytics schema to an existing PostgreSQL database.
# Supports either DATABASE_URL or POSTGRES_* variables from .env.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="python3"

cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    line="${raw_line%$'\r'}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    export "$key=$value"
  done < .env
fi

: "${POSTGRES_SERVER:=localhost}"
: "${POSTGRES_PORT:=5432}"
: "${SQLITE_DB_PATH:=$ROOT_DIR/analytics.db}"

if ! "$PYTHON_BIN" - <<'PY'
import os
import socket

host = os.getenv("POSTGRES_SERVER", "localhost")
port = int(os.getenv("POSTGRES_PORT", "5432"))

s = socket.socket()
s.settimeout(2)
try:
  s.connect((host, port))
  print("PostgreSQL is reachable.")
except Exception:
  raise SystemExit(1)
finally:
  s.close()
PY
then
  SQLITE_PATH="${SQLITE_DB_PATH}"
  SQLITE_DIR="$(dirname "$SQLITE_PATH")"
  mkdir -p "$SQLITE_DIR"
  export DATABASE_URL="sqlite+aiosqlite:///$SQLITE_PATH"
  echo "PostgreSQL unavailable. Using SQLite fallback at: $SQLITE_PATH"
fi

echo "Applying analytics schema to target database..."
"$PYTHON_BIN" create_db.py
"$PYTHON_BIN" - <<'PY'
import asyncio
from app.db.database import engine
from app.models.models import Base

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Schema push complete.")

asyncio.run(main())
PY

"$PYTHON_BIN" create_indexes.py
echo "Indexes applied."
