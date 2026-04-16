import asyncio
import asyncpg
from urllib.parse import urlparse, unquote
from app.core.config import settings

async def create_db():
    db_url = settings.db_url
    if db_url.startswith("sqlite"):
        print("ℹ️  SQLite mode detected — skipping database creation step.")
        return

    if settings.DATABASE_URL:
        parsed = urlparse(settings.DATABASE_URL)
        db_user = parsed.username or settings.POSTGRES_USER
        db_pass = unquote(parsed.password or settings.POSTGRES_PASSWORD)
        db_host = parsed.hostname or settings.POSTGRES_SERVER
        db_port = parsed.port or int(settings.POSTGRES_PORT)
        db_name = (parsed.path or "/").lstrip("/") or settings.POSTGRES_DB
    else:
        db_user = settings.POSTGRES_USER
        db_pass = settings.POSTGRES_PASSWORD
        db_host = settings.POSTGRES_SERVER
        db_port = int(settings.POSTGRES_PORT)
        db_name = settings.POSTGRES_DB

    conn = await asyncpg.connect(
        user=db_user,
        password=db_pass,
        host=db_host,
        port=db_port,
        database="postgres"  # connect to default db first
    )

    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        db_name
    )
    if not exists:
        await conn.execute(f'CREATE DATABASE "{db_name}"')
        print(f"✅ Created database: {db_name}")
    else:
        print(f"ℹ️  Database {db_name} already exists — skipping.")
    await conn.close()

asyncio.run(create_db())
