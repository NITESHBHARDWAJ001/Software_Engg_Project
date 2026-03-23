# Developer Quick Start Guide - Ethnic Fashion SaaS Backend

A rapid setup guide for developers getting started with the Ethnic Fashion SaaS backend.

---

## 🚀 5-Minute Setup

### Prerequisites Check

```bash
# Node.js version
node --version
# ✓ Should be >= 22.0.0

# npm version
npm --version
# ✓ Should be >= 10.0.0

# PostgreSQL connection
psql --version
# ✓ Should be installed
```

### 1. Clone & Install

```bash
git clone <repo-url>
cd backend
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
# Database (create DB if not exists)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ethnic_fashion_db"

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET="your-32-character-access-secret-123"
JWT_REFRESH_SECRET="your-32-character-refresh-secret456"

# CORS (frontend URL)
CORS_ORIGIN="http://localhost:5173"

# Initial Super Admin
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="SecurePassword123!"

# Server
PORT=4000
NODE_ENV="development"
```

**Generate Secure Secrets:**

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate:dev -- --name init

# or reset (caution: deletes all data)
npm run prisma:reset
```

### 4. Start Development Server

```bash
npm run dev
# Server running on http://localhost:4000
```

### 5. Bootstrap Super Admin

```bash
npm run bootstrap
# Creates SUPER_ADMIN from env vars
```

---

## 📊 Project Structure

```
backend/
├── src/
│   ├── server.js              ← Entry point
│   ├── app.js                 ← Express app
│   ├── config/
│   │   ├── env.js             ← Environment validation
│   │   └── logger.js          ← Pino logger setup
│   ├── shared/
│   │   ├── http/
│   │   │   ├── httpError.js
│   │   │   └── response.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rbac.js
│   │   │   ├── tenant.js
│   │   │   ├── requestContext.js
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   └── db/
│   │       └── prisma.js
│   ├── modules/               ← Feature modules
│   │   ├── auth/             ← Login, refresh, logout
│   │   ├── customers/        ← Customer CRUD
│   │   ├── inventory/        ← Stock management
│   │   ├── finance/          ← Invoices, ledger
│   │   ├── organizations/    ← Org endpoints
│   │   └── health/           ← Health checks
│   └── scripts/
│       └── bootstrap-super-admin.js
├── prisma/
│   ├── schema.prisma          ← Data models
│   └── migrations/
├── package.json
├── .env.example
├── README.md                  ← Full documentation
├── ARCHITECTURE.md            ← System design
└── DATABASE_SCHEMA.md         ← Schema reference
```

---

## 🔧 Common Tasks

### Start Server (Development)

```bash
npm run dev
```

With hot-reload on file changes.

### View Database Migrations

```bash
npm run prisma:status
```

### Create New Migration

```bash
npm run prisma:migrate:dev -- --name add_feature_name

# Without migration (connect to existing schema)
npm run prisma:generate
```

### Reset Database (Development Only)

```bash
npm run prisma:reset
```

⚠️ **WARNING:** This deletes all data!

### Open Database GUI (Prisma Studio)

```bash
npm run prisma:studio
```

Browser opens to http://localhost:5555

### Run TypeScript Type Check

```bash
npm run tsc
```

(Already migrated to JavaScript, but useful for reference)

### Bootstrap Initial Data

```bash
npm run bootstrap
```

Creates SUPER_ADMIN from env variables.

### Check Dependencies

```bash
npm list
npm outdated
npm audit
```

---

## 📝 Module Tour

### Authentication Module

**File:** `src/modules/auth/`

```javascript
// Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}
→ { accessToken, refreshToken, user }

// Refresh Token
POST /api/v1/auth/refresh
{ "refreshToken": "..." }
→ { accessToken, refreshToken }

// Logout
POST /api/v1/auth/logout (requires token)
→ { success: true }
```

### Customer Module

**File:** `src/modules/customers/`

```javascript
// List (paginated, searchable)
GET /api/v1/customers?search=john&page=1&limit=20

// Create
POST /api/v1/customers
{ "name": "John Doe", "email": "...", "phone": "..." }

// Update
PATCH /api/v1/customers/{id}
{ "name": "Jane Doe", ... }

// Archive (soft delete)
POST /api/v1/customers/{id}/archive
```

**Access Control:** STAFF+ (all roles)

### Inventory Module

**File:** `src/modules/inventory/`

```javascript
// List items
GET /api/v1/inventory/items?category=Sarees&status=LOW_STOCK

// Create item
POST /api/v1/inventory/items
{
  "name": "Silk Saree",
  "sku": "SAREE-001",
  "category": "Sarees",
  "unitPrice": 150,
  "sellingPrice": 299.99
}

// Adjust stock
POST /api/v1/inventory/items/{id}/adjust
{ "quantity": -5, "changeType": "SALE", "note": "Order #123" }

// Get stock alerts
GET /api/v1/inventory/alerts

// Category analytics
GET /api/v1/inventory/analytics/by-category
```

**Access Control:** ORG_ADMIN+ for write, STAFF+ for read

### Finance Module

**File:** `src/modules/finance/`

```javascript
// List invoices
GET /api/v1/finance/invoices?status=PENDING&page=1

// Create invoice
POST /api/v1/finance/invoices
{
  "invoiceNumber": "INV-001",
  "issueDate": "2026-03-19T00:00:00Z",
  "dueDate": "2026-04-19T00:00:00Z"
}

// Update invoice (DRAFT only)
PATCH /api/v1/finance/invoices/{id}
{ "subtotal": 1000, "taxAmount": 100, ... }

// Change status
PATCH /api/v1/finance/invoices/{id}/status
{ "newStatus": "PENDING" }

// Add ledger entry
POST /api/v1/finance/ledger
{
  "type": "EXPENSE",
  "amount": 500,
  "entryDate": "2026-03-19T00:00:00Z",
  "category": "Supplies"
}

// Cash flow summary
GET /api/v1/finance/analytics/cash-flow

// Revenue trends (12 months)
GET /api/v1/finance/analytics/trends
```

**Access Control:** ORG_ADMIN+ for write, STAFF+ for read

---

## 🔑 API Authentication

### Getting a Token

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "SUPER_ADMIN",
      "organizationId": null
    }
  }
}
```

### Using Token in Requests

```bash
curl -X GET http://localhost:4000/api/v1/customers \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Token Refresh

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

---

## 🧪 Testing Endpoints

### Health Checks

```bash
# Liveness (is service running?)
curl http://localhost:4000/health/live

# Readiness (is service ready for traffic?)
curl http://localhost:4000/health/ready
```

### Test Customer CRUD

```bash
# Get all customers (requires auth)
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/api/v1/customers

# Create customer
curl -X POST http://localhost:4000/api/v1/customers \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1-555-0001"
  }'

# Search customers
curl "http://localhost:4000/api/v1/customers?search=test&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

### Test Inventory

```bash
# Create inventory item
curl -X POST http://localhost:4000/api/v1/inventory/items \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Silk Saree",
    "sku": "SAREE-SILK-001",
    "category": "Sarees",
    "unitPrice": 150,
    "sellingPrice": 299.99,
    "reorderLevel": 10,
    "minStockLevel": 5
  }'

# Adjust stock
curl -X POST http://localhost:4000/api/v1/inventory/items/<ID>/adjust \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "changeType": "IMPORT",
    "note": "Initial stock"
  }'
```

### Test Finance

```bash
# Create invoice
curl -X POST http://localhost:4000/api/v1/finance/invoices \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-2026-001",
    "issueDate": "2026-03-19T00:00:00Z",
    "subtotal": 1000,
    "taxAmount": 100,
    "totalAmount": 1100
  }'

# Get cash flow summary
curl http://localhost:4000/api/v1/finance/analytics/cash-flow \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🐛 Debugging

### Enable Debug Logging

```bash
# In .env
NODE_ENV="development"

# Server logs all requests with timing
```

### Using Prisma Studio

```bash
npm run prisma:studio
# Opens GUI at http://localhost:5555
# Browse/edit database directly
```

### Database Logs

```bash
# View queries being executed
npm run dev
# Look for SQL logs in terminal
```

### Common Issues

**Error: DATABASE_URL not found**
```
Solution: Create .env file with DATABASE_URL
```

**Error: "does not have exported member"**
```
Solution: Check Prisma client is generated
npm run prisma:generate
```

**Port already in use**
```
Solution: Change PORT in .env or kill process
lsof -i :4000
kill -9 <PID>
```

**Database connection refused**
```
Solution: Ensure PostgreSQL is running
psql postgres -c "SELECT version();"
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Complete system documentation |
| `ARCHITECTURE.md` | Component design & interactions |
| `DATABASE_SCHEMA.md` | Data model reference |
| `Prisma/schema.prisma` | Authoritative schema definition |

---

## 🚢 Pre-Deployment Checklist

Before pushing to production:

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Super admin bootstrapped
- [ ] JWT secrets are strong (32+ characters)
- [ ] CORS_ORIGIN points to production frontend
- [ ] NODE_ENV set to "production"
- [ ] Database backups configured
- [ ] Health checks responding correctly
- [ ] All endpoints tested with valid tokens
- [ ] Logs reviewed for errors
- [ ] Rate limiting configured (if needed)
- [ ] SSL/TLS certificates installed

---

## 🔐 Security Reminders

1. **Never commit .env** (add to .gitignore)
2. **Rotate JWT secrets** regularly in production
3. **Use strong passwords** for database
4. **Enable HTTPS** in production
5. **Validate all inputs** (Zod schemas handle this)
6. **Check user permissions** (RBAC middleware)
7. **Sanitize logs** (no passwords/tokens)
8. **Update dependencies** regularly

---

## 📞 Support

### Getting Help

1. Check README.md for detailed API docs
2. Review ARCHITECTURE.md for system design
3. Look at DATABASE_SCHEMA.md for data models
4. Check Prisma docs: https://www.prisma.io/docs
5. Contact development team

### Reporting Bugs

Include:
- Error message and stack trace
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)

---

## 🎯 Next Steps

1. ✅ Set up development environment
2. ✅ Bootstrap initial data
3. ✅ Test endpoints with Postman/curl
4. ✅ Read README.md for APIs
5. ✅ Explore ARCHITECTURE.md for design
6. ✅ Check DATABASE_SCHEMA.md for models
7. 📝 Create additional modules (Exhibitions, Social)
8. 🧪 Add unit/integration tests
9. 🚢 Deploy to staging environment

---

## 🎓 Learning Path

### Recommended Order

1. **API Fundamentals** - Test endpoints with curl/Postman
2. **Data Models** - Review DATABASE_SCHEMA.md
3. **Authentication** - Understand JWT token flow
4. **Module Structure** - Each module follows: routes → schemas → service
5. **Middleware** - How requests are processed
6. **Error Handling** - HttpError class, error codes
7. **Database** - Prisma queries, relationships

### Example Learning Project

Try building a quick feature:

```bash
# 1. Create a new module (e.g., Reviews)
mkdir -p src/modules/reviews

# 2. Copy structure from existing module
cp -r src/modules/customers/* src/modules/reviews/

# 3. Rename files
mv src/modules/reviews/customer.* src/modules/reviews/review.*

# 4. Update Prisma schema
# Add Review model to prisma/schema.prisma

# 5. Generate Prisma Client
npm run prisma:generate

# 6. Run migration
npm run prisma:migrate:dev -- --name add_reviews

# 7. Test endpoints
curl ... from command line
```

---

## 📋 npm Scripts Reference

```bash
npm run dev                  # Start with hot-reload
npm start                    # Start production server
npm run prisma:generate      # Generate Prisma Client
npm run prisma:migrate:dev   # Create & run migration
npm run prisma:migrate:deploy # Run migrations (prod)
npm run prisma:studio        # Open database GUI
npm run prisma:reset         # Reset database (dev only!)
npm run prisma:seed          # Run seed script (if exists)
npm run bootstrap            # Bootstrap super admin
npm run tsc                  # TypeScript type check
npm run build                # Build TypeScript (if enabled)
npm test                     # Run tests (if configured)
npm audit                    # Check security vulnerabilities
npm outdated                 # Check for outdated packages
```

---

**Last Updated:** March 19, 2026  
**Status:** ✅ Ready for Development  
**Version:** 1.0.0
