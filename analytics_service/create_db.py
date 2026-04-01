import asyncio
import asyncpg

async def create_db():
    conn = await asyncpg.connect(
        user='postgres',
        password='admin@123',
        host='localhost',
        port=5432,
        database='postgres'  # connect to default db first
    )
    # Check if analytics_db already exists
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = 'analytics_db'"
    )
    if not exists:
        await conn.execute('CREATE DATABASE analytics_db')
        print("✅ Created database: analytics_db")
    else:
        print("ℹ️  Database analytics_db already exists — skipping.")
    await conn.close()

asyncio.run(create_db())
