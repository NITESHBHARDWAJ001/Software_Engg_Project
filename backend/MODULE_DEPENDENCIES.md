# Module Dependencies & Interaction Map

Complete reference for how modules depend on each other, shared utilities, and data flow patterns.

---

## 📦 Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED UTILITIES LAYER                    │
│  (Available to ALL modules - no circular dependencies)       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  config/env  │  │config/logger │  │ shared/db/   │      │
│  │              │  │              │  │ prisma       │      │
│  │ • Load vars  │  │ • Pino setup │  │              │      │
│  │ • Validate   │  │ • Structure  │  │ • Singleton  │      │
│  │ • Type-safe  │  │ • ISO time   │  │ • Interface  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │   shared/http/       │    │ shared/middleware/   │      │
│  │                      │    │                      │      │
│  │ • httpError.js       │    │ • auth.js            │      │
│  │ • response.js        │    │ • rbac.js            │      │
│  │                      │    │ • tenant.js          │      │
│  └──────────────────────┘    │ • requestContext.js  │      │
│                              │ • errorHandler.js    │      │
│                              │ • notFound.js        │      │
│                              └──────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
          ▲                ▲               ▲
          │                │               │
          │ imports        │ imports       │ imports
          │                │               │
          └────────────────┴───────────────┘
                    │
        ┌───────────▼─────────────┐
        │   All 5 API Modules     │
        │    (below structure)    │
        └─────────────────────────┘
```

---

## 🏗️ Module Architecture

### Each Module has 3 Files (Consistent Pattern)

```
Module Boundary
├── routes.js      (HTTP endpoints & request handling)
│   ├─ Imports: schemas, service, middleware
│   ├─ Exports: router (Express Router)
│   └─ Handles: routing, validation, error catching
│
├── schemas.js     (Input validation schemas)
│   ├─ Imports: zod
│   ├─ Exports: named schemas (create, update, get, etc.)
│   └─ Handles: runtime validation (Zod)
│
└── service.js     (Business logic & database operations)
    ├─ Imports: prisma, utilities
    ├─ Exports: functions (create, read, update, etc.)
    └─ Handles: queries, calculations, transformations
```

---

## 🔗 Module Dependency Details

### 1. AUTH Module

**File Location:** `src/modules/auth/`

**Dependencies:**
```
auth/routes.js
├─ imports:
│  ├─ express
│  ├─ auth/schemas
│  ├─ auth/service
│  ├─ shared/http/response
│  ├─ shared/http/httpError
│  ├─ shared/middleware/errorHandler
│  └─ express-rate-limit
│
├─ exports: router
│
└─ endpoints:
   ├─ POST /api/v1/auth/login
   ├─ POST /api/v1/auth/refresh
   └─ POST /api/v1/auth/logout (requires auth)

auth/schemas.js
├─ imports: zod
├─ exports:
│  ├─ loginSchema
│  ├─ refreshSchema
│  └─ other validation schemas
│
└─ validates:
   ├─ Email format
   ├─ Password strength
   └─ Token format

auth/service.js
├─ imports:
│  ├─ prisma (from shared/db/prisma)
│  ├─ jsonwebtoken
│  ├─ argon2
│  └─ utilities
│
├─ exports:
│  ├─ login(email, password)
│  ├─ refresh(refreshToken, context)
│  └─ logout(userId)
│
└─ handles:
   ├─ Password verification
   ├─ JWT token generation
   ├─ Token family tracking
   └─ Session management
```

**Not Used By:** No module imports auth directly

**Used By:**
- `app.js` (registers auth routes)
- `shared/middleware/auth.js` (uses JWT verification, does NOT import auth service)

---

### 2. CUSTOMER Module

**File Location:** `src/modules/customers/`

**Dependencies:**
```
customer/routes.js
├─ imports:
│  ├─ express
│  ├─ customer/schemas
│  ├─ customer/service
│  ├─ shared/middleware/rbac (checks ORG_ADMIN+)
│  ├─ shared/middleware/tenant
│  ├─ shared/http/response
│  └─ shared/http/httpError
│
├─ exports: router
│
└─ endpoints:
   ├─ GET /api/v1/customers (STAFF+)
   ├─ POST /api/v1/customers (ORG_ADMIN+)
   ├─ PATCH /api/v1/customers/:id (ORG_ADMIN+)
   └─ POST /api/v1/customers/:id/archive (ORG_ADMIN+)

customer/schemas.js
├─ imports: zod
├─ exports:
│  ├─ createSchema
│  ├─ updateSchema
│  ├─ querySchema (pagination)
│  └─ archiveSchema
│
└─ validates:
   ├─ Name (required, string)
   ├─ Email format (optional)
   ├─ Phone format (optional)
   └─ Pagination params (page, limit)

customer/service.js
├─ imports:
│  ├─ prisma
│  ├─ shared/http/httpError
│  └─ utilities
│
├─ exports:
│  ├─ findMany(filters, pagination, orgId)
│  ├─ create(data, orgId, userId)
│  ├─ update(id, data, orgId, userId)
│  └─ archive(id, orgId)
│
└─ queries:
   ├─ WHERE organizationId = ? (tenant scoping)
   ├─ WHERE isArchived = false (soft delete)
   ├─ SEARCH by name/email/phone (ILIKE)
   └─ PAGINATE with offset/limit
```

**Not Used By:** Other modules

**Uses:** Only shared utilities (prisma, middleware, error handling)

---

### 3. INVENTORY Module

**File Location:** `src/modules/inventory/`

**Dependencies:**
```
inventory/routes.js
├─ imports:
│  ├─ express
│  ├─ inventory/schemas
│  ├─ inventory/service
│  ├─ shared/middleware/rbac
│  ├─ shared/middleware/tenant
│  ├─ shared/http/response
│  └─ shared/http/httpError
│
├─ exports: router
│
└─ endpoints (all scoped to org):
   ├─ GET /api/v1/inventory/items (STAFF+)
   ├─ POST /api/v1/inventory/items (ORG_ADMIN+)
   ├─ PATCH /api/v1/inventory/items/:id (ORG_ADMIN+)
   ├─ POST /api/v1/inventory/items/:id/adjust (ORG_ADMIN+)
   ├─ GET /api/v1/inventory/items/:id/movements (STAFF+)
   ├─ GET /api/v1/inventory/alerts (STAFF+)
   └─ GET /api/v1/inventory/analytics/by-category (STAFF+)

inventory/schemas.js
├─ imports: zod
├─ exports:
│  ├─ createSchema
│  ├─ updateSchema
│  ├─ adjustSchema
│  ├─ querySchema
│  └─ other schemas
│
└─ validates:
   ├─ Stock levels
   ├─ Price formats
   ├─ SKU uniqueness (via custom check)
   └─ Stock adjustment types

inventory/service.js
├─ imports:
│  ├─ prisma
│  ├─ shared/http/httpError
│  └─ utilities
│
├─ exports:
│  ├─ findMany(filters, pagination, orgId)
│  ├─ create(data, orgId, userId)
│  ├─ update(id, data, orgId, userId)
│  ├─ adjust(id, quantity, changeType, note, orgId)
│  ├─ getMovements(id, pagination, orgId)
│  ├─ getAlerts(orgId)
│  └─ getAnalyticsByCategory(orgId)
│
└─ queries:
   ├─ Find items WHERE org_id = ?
   ├─ Create movement audit record
   ├─ Update stock (atomic via transaction)
   ├─ Calculate status (IN_STOCK, LOW_STOCK, etc.)
   └─ Aggregate by category
```

**Not Used By:** Other modules

**Uses:** Only shared utilities; NO cross-module dependencies

---

### 4. FINANCE Module

**File Location:** `src/modules/finance/`

**Dependencies:**
```
finance/routes.js
├─ imports:
│  ├─ express
│  ├─ finance/schemas
│  ├─ finance/service
│  ├─ shared/middleware/rbac
│  ├─ shared/middleware/tenant
│  ├─ shared/http/response
│  └─ shared/http/httpError
│
├─ exports: router
│
└─ endpoints (all scoped to org):
   ├─ GET /api/v1/finance/invoices (STAFF+)
   ├─ POST /api/v1/finance/invoices (ORG_ADMIN+)
   ├─ PATCH /api/v1/finance/invoices/:id (ORG_ADMIN+)
   ├─ PATCH /api/v1/finance/invoices/:id/status (ORG_ADMIN+)
   ├─ GET /api/v1/finance/ledger (STAFF+)
   ├─ POST /api/v1/finance/ledger (ORG_ADMIN+)
   ├─ GET /api/v1/finance/analytics/cash-flow (STAFF+)
   └─ GET /api/v1/finance/analytics/trends (STAFF+)

finance/schemas.js
├─ imports: zod
├─ exports:
│  ├─ invoiceCreateSchema
│  ├─ invoiceUpdateSchema
│  ├─ invoiceStatusSchema
│  ├─ ledgerEntrySchema
│  └─ other schemas
│
└─ validates:
   ├─ Invoice numbers
   ├─ Amount formats (Decimal)
   ├─ Status transitions
   ├─ Entry types (INCOME, EXPENSE, ADJUSTMENT)
   └─ Date formats

finance/service.js
├─ imports:
│  ├─ prisma
│  ├─ shared/http/httpError
│  └─ utilities
│
├─ exports:
│  ├─ INVOICES SECTION
│  │  ├─ findInvoices(filters, pagination, orgId)
│  │  ├─ createInvoice(data, orgId, userId)
│  │  ├─ updateInvoice(id, data, orgId)
│  │  └─ updateInvoiceStatus(id, newStatus, orgId)
│  │
│  ├─ LEDGER SECTION  
│  │  ├─ findLedgerEntries(filters, pagination, orgId)
│  │  └─ createLedgerEntry(data, orgId, userId)
│  │
│  └─ ANALYTICS SECTION
│     ├─ getCashFlowSummary(orgId, months)
│     └─ getRevenueT rends(orgId, months)
│
└─ queries:
   ├─ Invoice CRUD with status enforcement
   ├─ Ledger entry creation (append-only)
   ├─ Atomic transaction for status change:
   │  ├─ Update invoice status
   │  ├─ Set paidAt
   │  └─ Create INCOME ledger entry
   ├─ Cash flow aggregation by month
   └─ 12-month revenue trend
```

**Not Used By:** Other modules

**Uses:** Only shared utilities; NO cross-module dependencies

---

### 5. ORGANIZATIONS Module

**File Location:** `src/modules/organizations/`

**Dependencies:**
```
organization/routes.js
├─ imports:
│  ├─ express
│  ├─ shared/middleware/rbac
│  ├─ shared/middleware/tenant
│  ├─ shared/http/response
│  └─ prisma (directly, no service file)
│
├─ exports: router
│
└─ endpoints:
   └─ GET /api/v1/organizations/me (STAFF+)
       └─ Returns: current user's organization
```

**Note:** This module is minimal (single endpoint) - no separate service layer needed.

---

### 6. HEALTH Module

**File Location:** `src/modules/health/`

**Dependencies:**
```
health/routes.js
├─ imports:
│  ├─ express
│  ├─ shared/http/response
│  └─ no auth required
│
├─ exports: router
│
└─ endpoints:
   ├─ GET /health/live   (200 if running)
   └─ GET /health/ready  (200 if ready)
```

**Note:** No database access, no auth required. Used by orchestration systems.

---

## 🔄 Cross-Module Communication Pattern

### Current Design: Minimal Coupling

```
Module A ────── SHOULD NOT import ──────→ Module B
     ↓
     └────────→ shared utilities ←────────┘
                 (prisma, middleware, errors)

Benefits:
✓ Modules are independent
✓ Easy to test in isolation
✓ Easy to add/remove modules
✓ No circular dependencies
✓ Clear data flow
```

### If Cross-Module Data Needed

**Example:** Finance module needs Customer info

**❌ WRONG - Direct import:**
```javascript
// finance/service.js
import { getCustomer } from '../customers/customer.service';
// Creates coupling!
```

**✅ RIGHT - Query through shared Prisma:**
```javascript
// finance/service.js
import { prisma } from '../shared/db/prisma';

// Get customer via Prisma
const customer = await prisma.customer.findUnique({
  where: {
    id: customerId,
    organizationId: orgId // Must enforce org boundary!
  }
});
```

---

## 📡 Data Flow Through Layers

### Request to Response Flow (Example: Create Invoice)

```
1. CLIENT
   POST /api/v1/finance/invoices
   Authorization: Bearer <token>
   { invoiceNumber, issueDate, amount, ... }

2. EXPRESS MIDDLEWARE PIPELINE
   ├─ errorHandler (wrap in try-catch)
   ├─ helmet, cors
   ├─ bodyParser (parse JSON)
   ├─ requestContext (assign request ID)
   ├─ auth middleware (verify JWT, extract userId/orgId/role)
   ├─ rbac middleware (check role >= ORG_ADMIN)
   ├─ tenant middleware (attach organizationId)
   └─ route matched → finance.routes.js

3. ROUTE HANDLER (finance/routes.js)
   ├─ Validate input with schemas.invoiceCreateSchema
   │  └─ If invalid → 400 error with details
   ├─ Call service.createInvoice(body, orgId, userId)
   └─ Catch errors → errorHandler middleware

4. SERVICE LAYER (finance/service.js)
   ├─ Validate business rules
   │  ├─ Check invoice number unique in org
   │  ├─ Validate amounts
   │  └─ Enforce org boundary
   ├─ Call prisma.invoice.create({
   │    organizationId: orgId,  ← enforced!
   │    data: { ... }
   │  })
   └─ Return invoice object

5. PRISMA ORM LAYER
   ├─ Convert to SQL
   ├─ Execute on PostgreSQL
   ├─ Return result

6. DATABASE LAYER
   ├─ Write to invoices table
   ├─ Return inserted record
   └─ PRIMARY KEY constraint enforced

7. SERVICE RETURNS to ROUTE
   ├─ Transform if needed
   └─ Return data

8. ROUTE RETURNS to CLIENT
   ├─ response.ok(data, statusCode)
   ├─ JSON serialize
   └─ HTTP 201 Created

9. ERROR HANDLING (any step)
   ├─ Error caught by errorHandler middleware
   ├─ Format error response
   ├─ Set HTTP status code
   ├─ Log error
   └─ Send to client

10. CLIENT RECEIVES
    {
      "success": true/false,
      "data": { invoiceObject },
      "error": null or { code, message, details }
    }
```

---

## 🎯 Dependency Injection Points

### Configuration (app.js)

```javascript
// src/app.js - Where modules are registered

import authRoutes from './modules/auth/auth.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import organizationRoutes from './modules/organizations/organization.routes.js';
import healthRoutes from './modules/health/health.routes.js';

// Middleware pipeline
app.use(errorHandler());
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestContext());

// Routes registration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', authMiddleware, customerRoutes);
app.use('/api/v1/inventory', authMiddleware, inventoryRoutes);
app.use('/api/v1/finance', authMiddleware, financeRoutes);
app.use('/api/v1/organizations', authMiddleware, organizationRoutes);
app.use('/health', healthRoutes);

// 404 handler
app.use(notFound());
```

### Module Registration Pattern

```javascript
// Each module exports an Express Router
export default router;

// Which is then used in app.js
app.use('/api/v1/module-name', moduleRoutes);
```

---

## 🔗 Middleware Dependency Chain

```
REQUEST ENTERS
      │
      ▼
errorHandler()
  └─ Wraps all downstream in try-catch
      │
      ▼
helmet()
  └─ Security headers
      │
      ▼
cors()
  └─ CORS validation
      │
      ▼
bodyParser.json()
  └─ Parse JSON body
      │
      ▼
requestContext()
  └─ Generate/attach request ID to req.context
      │
      ├─ Public routes (no auth needed)
      │  ├─ /health/live
      │  ├─ /health/ready
      │  └─ POST /api/v1/auth/login
      │
      └─ Protected routes (require auth)
         │
         ▼
       auth()
         └─ Extract & verify JWT token
         └─ Attach userId, role, organizationId to req.auth
            │
            ├─ Public list/read (STAFF+)
            │  └─ All authenticated users
            │
            └─ Admin operations (ORG_ADMIN+)
               │
               ▼
             rbac()
               └─ Check user.role >= required role
                  │
                  ▼
               tenant()
                  └─ Extract organizationId from req.auth
                  └─ Enforce: all queries must match org
                     │
                     ▼
                  ROUTE HANDLER
                     │
                     ├─ Validate inputs (Zod)
                     ├─ Call service (which queries with org scoping)
                     └─ Return response
                        │
                        ▼
                  RESPONSE FORMATTER
                     └─ response.ok() or response.paged()
                        │
                        ▼
                  HTTP 200/201/etc
```

---

## 📊 Shared Utilities Dependency Map

### Prisma Usage Pattern

```
ALL SERVICES
    ↓
import { prisma } from '../shared/db/prisma'
    ↓
Use Prisma methods:
  ├─ prisma.model.findMany()
  ├─ prisma.model.findUnique()
  ├─ prisma.model.create()
  ├─ prisma.model.update()
  ├─ prisma.model.aggregate()
  └─ prisma.$transaction()
    ↓
Always enforce organizationId filter:
  where: {
    organizationId: orgId,
    ... other conditions
  }
```

### Error Handling Pattern

```
ALL ROUTES
    ↓
import { HttpError } from '../shared/http/httpError'
    ↓
Throw errors:
  throw new HttpError(statusCode, message, code, details)
    ↓
errorHandler middleware catches
    ↓
Format error response:
  {
    success: false,
    data: null,
    error: { code, message, details }
  }
```

### Response Formatting Pattern

```
ALL ROUTES
    ↓
import { ok, paged } from '../shared/http/response'
    ↓
Return responses:
  Single item:  res.status(200).json(ok(data))
  Paginated:    res.status(200).json(paged(items, pagination))
  Created:      res.status(201).json(ok(data))
```

---

## 🧩 Adding a New Module

### Step-by-Step Process

```bash
# 1. Create module directory
mkdir -p src/modules/mymodule

# 2. Create three files following pattern
touch src/modules/mymodule/{mymodule.routes,mymodule.schemas,mymodule.service}.js

# 3. Structure:

# mymodule.schemas.js (first)
import { z } from 'zod';
export const createSchema = z.object({...});
export const updateSchema = z.object({...});

# mymodule.service.js (second)
import { prisma } from '../shared/db/prisma';
import { HttpError } from '../shared/http/httpError';

export async function findMany(filters, pagination, orgId) {
  return prisma.mymodel.findMany({
    where: {
      organizationId: orgId,
      ...filters
    }
  });
}

# mymodule.routes.js (third)
import express from 'express';
import * as schemas from './mymodule.schemas.js';
import * as service from './mymodule.service.js';
import { ok, paged } from '../shared/http/response.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await service.findMany(...);
    res.json(paged(data.items, data.pagination));
  } catch (error) {
    next(error);
  }
});

export default router;

# 4. Register in app.js
import mymoduleRoutes from './modules/mymodule/mymodule.routes.js';
app.use('/api/v1/mymodule', authMiddleware, mymoduleRoutes);

# 5. Update Prisma schema
# Add new Model to prisma/schema.prisma

# 6. Generate & migrate
npm run prisma:generate
npm run prisma:migrate:dev -- --name add_mymodel
```

### Key Rules for New Modules

✅ **DO:**
- Follow the 3-file pattern (routes, schemas, service)
- Import from shared utilities only
- Enforce organizationId in all queries
- Use Zod for validation
- Throw HttpError for errors
- Use response.ok() or response.paged()

❌ **DON'T:**
- Import other modules directly
- Query the database in routes.js (use service)
- Store secrets in code
- Trust client input without validation
- Forget tenant scoping (organizationId)

---

## 🔍 Module Interaction Examples

### Example 1: Finance Needs Customer Contact Info

**Scenario:** When creating an invoice memo, want to include customer name/email

**Solution:** Use shared Prisma query, NOT import customer service

```javascript
// finance/service.js - CORRECT
async function createInvoice(data, orgId, userId) {
  // Get customer info via Prisma (tenant-scoped)
  const customer = await prisma.customer.findUnique({
    where: {
      id: data.customerId,
      organizationId: orgId // Must include org check!
    }
  });
  
  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }
  
  // Use customer info
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: orgId,
      notes: `Customer: ${customer.name}`
      // ... other fields
    }
  });
  
  return invoice;
}
```

### Example 2: Inventory Needs Multiple Pieces of Data

**Scenario:** Stock adjustment may need customer info from an order

**Solution:** Same pattern - rely on Prisma queries

```javascript
// inventory/service.js - CORRECT
async function adjust(itemId, quantity, orderRef, orgId) {
  // Get item
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId, organizationId: orgId }
  });
  
  // Get invoice info if available
  if (orderRef) {
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: orderRef, 
        organizationId: orgId 
      },
      include: { organization: true } // Can include relations
    });
  }
  
  // Create movement record
  await prisma.inventoryMovement.create({
    data: {
      organizationId: orgId,
      itemId: item.id,
      quantity: -quantity,
      changeType: 'SALE'
    }
  });
}
```

---

## 📈 Scalability & Future Modules

### Current Module Count: 6

- ✅ Auth
- ✅ Customers
- ✅ Inventory
- ✅ Finance
- ✅ Organizations
- ✅ Health

### Planned Modules

- 📅 Exhibitions (event management + ROI tracking)
- 📢 Social/Marketing (campaigns, reels, engagement)
- 📊 Analytics (custom dashboards)
- 📄 Reports (PDF generation)
- 📦 Shipping (logistics integration)
- 💬 Support (customer support tickets)

### Module Scaling Pattern

Each module addition:
1. Add 3 files (routes, schemas, service)
2. Update Prisma schema with new model(s)
3. Run migration
4. Register in app.js
5. Test endpoints

**No need to modify existing modules** - they remain independent!

---

**Document Version:** 1.0.0  
**Last Updated:** March 19, 2026  
**Status:** Complete Backend Architecture  
**Next Step:** Exhibitions Module Implementation
