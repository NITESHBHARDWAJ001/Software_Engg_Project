# Backend System Architecture & Design Documentation

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                                  │
│           (Web Browser, Mobile App, Admin Dashboard, Third-party)            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                          HTTP / REST / JSON
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
    ┌────▼──────────────┐                    ┌──────────▼─────────┐
    │  API Gateway      │                    │  Rate Limiter      │
    │  ├─ CORS Policy   │                    │  (Auth Routes      │
    │  ├─ Headers       │                    │   15 min window)   │
    │  └─ Security      │                    └──────────┬─────────┘
    └────┬──────────────┘                               │
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Express.js Server      │
                    │  (JavaScript ES Modules) │
                    |  (Node.js 22+)           │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────────────────────┐
                    │    MIDDLEWARE PIPELINE (in order)        │
                    │                                          │
                    │  1. ErrorHandler (catch exceptions)      │
                    │  2. LogRequest (structured logging)      │
                    │  3. CORS & Helmet (security)             │
                    │  4. RequestContext (request ID)          │
                    │  5. Auth (JWT verification)              │
                    │  6. RBAC (role check)                    │
                    │  7. Tenant (org isolation)               │
                    │  8. BodyParser (JSON parsing)            │
                    │  9. Route Matching                       │
                    │ 10. Validation (Zod schemas)             │
                    └────────────┬─────────────────────────────┘
                                 │
         ┌───┬──────────┬─────────┼──────────┐
         │   │          │         │          │
    ┌────▼───▼──┐ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐
    │AUTH       │ │CUST │ │INV   │ │FIN   │
    │├ Login    │ │├Get │ │├Get  │ │├Get  │
    │├Refresh   │ │├Add │ │├Add  │ │├Create
    │└Logout    │ │├Upd │ │├Adj  │ │├Status
    └───────────┘ │└Arch│ │├Hist │ └──────┘
                  └─────┘ └──────┘ ┌─────────┐
                                   │Analytics│
                                   │├Cash    │
                                   │└Trends  │
                                   └─────────┘
              │
             ▼
┌──────────────────────────────────────────────────────┐
│           BUSINESS LOGIC LAYER (Services)            │
│                                                      │
│  • CRUD Operations  • Calculations  • Validations   │
│  • Transformations  • Analytics    • Data access    │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Prisma ORM Client   │
        │  ├─ Query Builder    │
        │  ├─ Transactions     │
        │  ├─ Relations        │
        │  └─ Aggregations     │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │   PostgreSQL DB     │
        │  ├─ Organizations   │
        │  ├─ Users & Auth    │
        │  ├─ Customers       │
        │  ├─ Inventory       │
        │  └─ Finance         │
        └─────────────────────┘
```

---

## Request/Response Cycle

```
1. CLIENT REQUEST
   GET /api/v1/customers
   Authorization: Bearer <token>
   ↓
2. MIDDLEWARE STACK
   ├─ Global Error Wrapper ✓
   ├─ CORS Headers ✓
   ├─ Request Context (assign ID) ✓
   ├─ Parse JWT Token ✓
   ├─ Extract userId, role, organizationId ✓
   ├─ Check User Exists (RBAC) ✓
   ├─ Verify Organization Membership (Tenant) ✓
   └─ Route Match → Route Handler ✓
   ↓
3. ROUTE HANDLER (Express Route)
   ├─ Validate Query Parameters (Zod) ✓
   ├─ Call Service Function ✓
   └─ Return Response ✓
   ↓
4. SERVICE LAYER
   ├─ Validate Business Logic ✓
   ├─ Call Prisma Methods ✓
   ├─ Transform Response ✓
   └─ Return to Route ✓
   ↓
5. DATABASE LAYER (Prisma)
   ├─ Build SQL Query ✓
   ├─ Execute on PostgreSQL ✓
   ├─ Parse Results ✓
   └─ Return to Service ✓
   ↓
6. RESPONSE FORMATTING
   ├─ Wrap in response.ok() helper ✓
   ├─ Set Status Code (200) ✓
   └─ Return JSON ✓
   ↓
7. ERROR HANDLING (if error)
   ├─ Catch in errorHandler ✓
   ├─ Format Error Response ✓
   ├─ Set Status Code (400/401/403/500) ✓
   ├─ Log Error ✓
   └─ Return JSON ✓
   ↓
8. CLIENT RECEIVES RESPONSE
   {
     "success": true/false,
     "data": {...} or null,
     "error": {...} or null
   }
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE PIPELINE                         │
│  (Runs for EVERY request in this sequence)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  errorHandler.js                                                │
│  ├─ Wraps all downstream in try-catch                          │
│  ├─ Catches errors from any middleware/route                   │
│  └─ Returns formatted error response                            │
│           ↓                                                      │
│  helmet (Express built-in)                                      │
│  ├─ Sets security headers                                       │
│  └─ Protects against common attacks                             │
│           ↓                                                      │
│  cors (Express built-in)                                        │
│  ├─ Validates origin                                            │
│  ├─ Allows frontend to access API                              │
│  └─ Enforces CSRF protection                                    │
│           ↓                                                      │
│  bodyParser (Express built-in)                                  │
│  ├─ Parses JSON body                                            │
│  ├─ Parses URL-encoded data                                     │
│  └─ Checks Content-Type                                         │
│           ↓                                                      │
│  requestContext.js                                              │
│  ├─ Generates unique requestId                                  │
│  ├─ Attaches to req.context                                     │
│  └─ Propagates in logs for tracing                              │
│           ↓                                                      │
│  unless auth middleware (specific routes)                       │
│  ├─ GET /health/* → Skip auth                                   │
│  ├─ POST /api/v1/auth/login → Skip auth                        │
│  └─ ALL OTHER → Require auth ✓                                 │
│           ↓                                                      │
│  auth.js (Token Verification)                                   │
│  ├─ Extract token from Authorization header                     │
│  ├─ Verify JWT signature (with JWT_ACCESS_SECRET)              │
│  ├─ Check token expiration                                      │
│  ├─ Extract claims (userId, role, organizationId)               │
│  ├─ Check user exists and is active                             │
│  └─ Attach to req.auth {userId, role, organizationId}          │
│           ↓                                                      │
│  rbac.js (Role Check)                                           │
│  ├─ Check route requires specific roles                         │
│  ├─ Verify user has required role                               │
│  ├─ Allow SUPER_ADMIN (global admin) to bypass                 │
│  └─ Return 403 Forbidden if insufficient permissions            │
│           ↓                                                      │
│  tenant.js (Organization Isolation)                             │
│  ├─ Extract organizationId from req.auth                        │
│  ├─ Store in req.auth.organizationId                            │
│  ├─ Enforce in service layer queries                            │
│  └─ Prevent cross-org data access                               │
│           ↓                                                      │
│  Express Router.match()                                         │
│  ├─ Compare req path to registered routes                       │
│  ├─ Extract path parameters (/customers/:id → id)              │
│  ├─ Call matching route handler                                 │
│  └─ If no match → 404 middleware                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │         ROUTE HANDLER FUNCTION             │
        │  (Each request → specific handler)         │
        ├───────────────────────────────────────────┤
        │                                            │
        │  async (req, res, next) => {              │
        │    ├─ Validate Inputs (Zod)              │
        │    │  └─ req.query, req.body, req.params │
        │    ├─ Call Service Function              │
        │    │  └─ Pass auth context               │
        │    ├─ Handle Response                    │
        │    │  └─ res.status(200).json({...})     │
        │    └─ Or throw error (caught by handler) │
        │  }                                        │
        │                                            │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │       SERVICE LAYER FUNCTION              │
        │  (Business Logic & Data Transformation)   │
        ├───────────────────────────────────────────┤
        │                                            │
        │  async function (params, context) {      │
        │    ├─ Validate business rules            │
        │    ├─ Construct Prisma Query             │
        │    │  └─ Filter by organizationId        │
        │    │  └─ Include relations if needed     │
        │    ├─ Call prisma.model.method()         │
        │    ├─ Transform results                  │
        │    │  └─ Compute derived fields          │
        │    │  └─ Format dates/decimals           │
        │    └─ Return data to route               │
        │  }                                        │
        │                                            │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │       PRISMA CLIENT CALL                   │
        │  (ORM → SQL → PostgreSQL)                  │
        ├───────────────────────────────────────────┤
        │                                            │
        │  prisma.customer.findMany({              │
        │    where: {                               │
        │      organizationId: context.org,        │
        │      isArchived: false,                  │
        │      name: { contains: searchTerm }      │
        │    },                                     │
        │    select: { id, name, email, ... },     │
        │    skip: offset,                         │
        │    take: limit,                          │
        │    orderBy: { createdAt: 'desc' }        │
        │  })                                       │
        │                                            │
        │  Translates to SQL:                       │
        │  SELECT id, name, email, ...              │
        │  FROM "Customer"                          │
        │  WHERE organizationId = $1                │
        │    AND isArchived = false                │
        │    AND name ILIKE $2                     │
        │  ORDER BY "createdAt" DESC                │
        │  LIMIT $3 OFFSET $4                       │
        │                                            │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │     POSTGRESQL DATABASE QUERY              │
        │  (Execution & Results)                     │
        ├───────────────────────────────────────────┤
        │                                            │
        │  ✓ Query executed with parameters         │
        │  ✓ Indexes used for performance           │
        │  ✓ Results returned as rows               │
        │  ✓ Prisma converts to JavaScript objects  │
        │                                            │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │      RESPONSE FORMATTING & RETURN          │
        ├───────────────────────────────────────────┤
        │                                            │
        │  service → route → response.paged()       │
        │                                            │
        │  return res.status(200).json({            │
        │    success: true,                        │
        │    data: {                                │
        │      items: [...],                       │
        │      pagination: {                        │
        │        page: 1,                          │
        │        limit: 20,                        │
        │        total: 150,                       │
        │        pages: 8                          │
        │      }                                    │
        │    },                                     │
        │    error: null                            │
        │  })                                       │
        │                                            │
        └───────────────────────────────────────────┘
```

---

## Module Architecture

### 1. Authentication Module Deep-Dive

```
auth/
├── auth.routes.js
│   ├─ POST /api/v1/auth/login
│   │  ├─ Input: { email, password }
│   │  ├─ Process:
│   │  │  1. Validate input format
│   │  │  2. Call authService.login()
│   │  │  3. Return tokens + user info
│   │  └─ Response: { accessToken, refreshToken, user }
│   │
│   ├─ POST /api/v1/auth/refresh
│   │  ├─ Input: { refreshToken }
│   │  ├─ Process:
│   │  │  1. Verify refresh token
│   │  │  2. Check token family (reuse detection)
│   │  │  3. Issue new token pair
│   │  │  4. Invalidate old refresh token
│   │  └─ Response: { accessToken, refreshToken }
│   │
│   └─ POST /api/v1/auth/logout
│      ├─ Auth Required: YES
│      ├─ Process:
│      │  1. Verify authentication
│      │  2. Mark refresh session as revoked
│      │  3. Client discards tokens
│      └─ Response: { success: true }
│
├── auth.schemas.js
│   ├─ loginSchema
│   │  └─ { email: string, password: string }
│   └─ refreshSchema
│      └─ { refreshToken: string }
│
└── auth.service.js
   ├─ login(email, password)
   │  └─ Returns: { accessToken, refreshToken, user }
   │
   ├─ refresh(refreshToken, context)
   │  └─ Returns: { accessToken, refreshToken }
   │
   ├─ logout(userId)
   │  └─ Returns: void
   │
   ├─ Helper: verifyPassword()
   │  └─ Compare argon2id hash
   │
   └─ Token Generation:
      ├─ Access (15 min): userId + role + org
      └─ Refresh (7 days): userId + tokenFamily

Token Flow Diagram:
┌─────────────┐
│ User Login  │
└──────┬──────┘
       │ email + password
       ▼
   ┌─────────────────────┐
   │ Find user by email  │
   │ Verify password     │
   └──────┬──────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Create JWT Token Pair:        │
   │ ├─ Access (15 min)           │
   │ ├─ Refresh (7 days)          │
   │ └─ Store family ID           │
   └──────┬───────────────────────┘
          │
          ▼
   ┌────────────────────────────────┐
   │ Save RefreshSession in DB       │
   │ ├─ tokenHash (never raw token) │
   │ └─ tokenFamily ID              │
   └──────┬────────────────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Return to Client    │
   │ ├─ Both tokens      │
   │ └─ User info        │
   └─────────────────────┘

Refresh Token Rotation:
┌─────────────────────────┐
│ Client calls /refresh   │
│ with old refreshToken   │
└──────────┬──────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Verify Token Sig     │
    │ & Expiration         │
    └──────┬───────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ Lookup RefreshSession      │
    └──────┬─────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Check: Is Revoked?           │
    │ If YES → DENY                │
    │ If NO  → Continue            │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Check: Family matches?       │
    │ If NO → Token reuse detected │
    │         Revoke entire family │
    │         Return error         │
    │ If YES → Continue            │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Issued New Token Pair:       │
    │ - Same family ID             │
    │ - Old refresh token revoked  │
    │ - Return new pair            │
    └──────────────────────────────┘
```

---

### 2. Customer Module Deep-Dive

```
customers/
├── customer.routes.js
│   ├─ GET /api/v1/customers
│   │  ├─ Auth: STAFF+ (all roles)
│   │  ├─ Tenant: Scoped to user's org
│   │  ├─ Query Params:
│   │  │  ├─ search: string (optional)
│   │  │  ├─ page: number (default: 1)
│   │  │  ├─ limit: number (default: 20, max: 100)
│   │  │  ├─ sortBy: 'name'|'email'|'createdAt'
│   │  │  └─ sortOrder: 'asc'|'desc'
│   │  ├─ Process:
│   │  │  1. Parse & validate query params
│   │  │  2. Call customerService.findMany()
│   │  │  3. Return paginated results
│   │  └─ Response: { items: [], pagination: {...} }
│   │
│   ├─ POST /api/v1/customers
│   │  ├─ Auth: ORG_ADMIN+ (ORG_ADMIN, SUPER_ADMIN)
│   │  ├─ Body: { name, email?, phone?, city?, country? }
│   │  ├─ Process:
│   │  │  1. Validate input (Zod)
│   │  │  2. Check name uniqueness (optional)
│   │  │  3. Create customer
│   │  │  4. Attach to organization
│   │  └─ Response: { id, name, email, ... }
│   │
│   ├─ PATCH /api/v1/customers/{id}
│   │  ├─ Auth: ORG_ADMIN+
│   │  ├─ Body: { name?, email?, phone?, city?, country? }
│   │  ├─ Process:
│   │  │  1. Verify customer exists and belongs to org
│   │  │  2. Validate updates
│   │  │  3. Update in database
│   │  └─ Response: { id, name, email, ... }
│   │
│   └─ POST /api/v1/customers/{id}/archive
│      ├─ Auth: ORG_ADMIN+
│      ├─ Process:
│      │  1. Set isArchived = true
│      │  2. Preserve data (soft delete)
│      └─ Response: { success: true }
│
├── customer.schemas.js
│   ├─ createSchema: { name, email?, phone?, city?, country? }
│   ├─ updateSchema: { name?, email?, phone?, city?, country? }
│   ├─ querySchema: { page, limit, search, sortBy, sortOrder }
│   └─ All use Zod for strict validation
│
└── customer.service.js
   ├─ findMany(filters, pagination)
   │  ├─ Filter by organization.id
   │  ├─ Filter by isArchived = false (default)
   │  ├─ Search by name/email/phone pattern
   │  ├─ Sort by specified field
   │  ├─ Paginate with offset/limit
   │  └─ Returns: { items: [], total: number }
   │
   ├─ create(data, organizationId, userId)
   │  ├─ Set organizationId from auth
   │  ├─ Set createdBy = userId
   │  ├─ Initialize: totalSpent = 0, lifetimeValue = 0
   │  └─ Returns: created customer
   │
   ├─ update(id, data, organizationId, userId)
   │  ├─ Verify customer belongs to org
   │  ├─ Update allowed fields
   │  ├─ Set updatedBy = userId
   │  └─ Returns: updated customer
   │
   └─ archive(id, organizationId)
      ├─ Verify ownership
      ├─ Set isArchived = true
      └─ Returns: void

Business Rules:
- Customers are tenant-scoped (hidden from other orgs)
- Soft delete via isArchived (no physical deletion)
- totalSpent updated when invoice is marked PAID
- lifetimeValue = sum of all payments (calculated)
- Search is case-insensitive, supports partial matching
```

---

### 3. Inventory Module Deep-Dive

```
inventory/
├── inventory.routes.js
│   ├─ GET /api/v1/inventory/items
│   │  ├─ Auth: STAFF+ (read-only)
│   │  ├─ Query:
│   │  │  ├─ search: by name/sku/category
│   │  │  ├─ category: filter
│   │  │  ├─ status: IN_STOCK|LOW_STOCK|CRITICAL|OUT_OF_STOCK
│   │  │  ├─ page, limit, sort
│   │  │
│   ├─ POST /api/v1/inventory/items
│   │  ├─ Auth: ORG_ADMIN+
│   │  ├─ Body: { name, sku, category, unitPrice, sellingPrice, unit, reorderLevel, minStockLevel }
│   │  ├─ Validation: SKU must be unique per org
│   │  │
│   ├─ PATCH /api/v1/inventory/items/{id}
│   │  ├─ Auth: ORG_ADMIN+
│   │  ├─ Body: Update any field except currentStock
│   │  │
│   ├─ POST /api/v1/inventory/items/{id}/adjust
│   │  ├─ Auth: ORG_ADMIN+
│   │  ├─ Body: { quantity, changeType, note? }
│   │  ├─ Process:
│   │  │  1. Create InventoryMovement record
│   │  │  2. Update currentStock
│   │  │  3. Recalculate status
│   │  │
│   ├─ GET /api/v1/inventory/items/{id}/movements
│   │  ├─ Auth: STAFF+
│   │  ├─ Returns: Audit trail of stock changes
│   │  │
│   ├─ GET /api/v1/inventory/alerts
│   │  ├─ Auth: STAFF+
│   │  ├─ Returns: Items with status LOW_STOCK or CRITICAL
│   │  │
│   └─ GET /api/v1/inventory/analytics/by-category
│      ├─ Auth: STAFF+
│      ├─ Returns: Stock levels grouped by category
│
├── inventory.schemas.js
│   ├─ createSchema
│   ├─ updateSchema
│   ├─ adjustSchema: { quantity: int, changeType: string, note?: string }
│   └─ querySchema
│
└── inventory.service.js
   ├─ findMany(filters, pagination)
   │  ├─ Filter by organizationId
   │  ├─ Filter by status (if provided)
   │  ├─ Search by name/sku/category
   │  └─ Returns paginated results
   │
   ├─ create(data, organizationId)
   │  ├─ Validate unique SKU per org
   │  ├─ Initialize currentStock = 0
   │  ├─ Calculate initial status
   │  └─ Returns: created item
   │
   ├─ update(id, data, organizationId)
   │  ├─ Verify ownership
   │  ├─ Prevent changes to currentStock (use adjust instead)
   │  └─ Update other fields
   │
   ├─ adjust(id, quantity, changeType, note, organizationId)
   │  ├─ Create InventoryMovement
   │  ├─ Update InventoryItem.currentStock
   │  ├─ Recalculate status
   │  └─ Returns: updated item with movement
   │
   ├─ getMovements(id, pagination)
   │  ├─ Return movement history for item
   │  └─ Sorted by createdAt DESC
   │
   ├─ getAlerts(organizationId)
   │  ├─ Find items where status IN (LOW_STOCK, CRITICAL)
   │  ├─ Sort by urgency
   │  └─ Returns: alert list
   │
   └─ getAnalyticsByCategory(organizationId)
      ├─ Group items by category
      ├─ Calculate: total items, total stock, total value
      └─ Returns: category breakdown

Stock Status Calculation:
const calculateStatus = (currentStock, minStockLevel, reorderLevel) => {
  if (currentStock === 0) return 'OUT_OF_STOCK';
  if (currentStock <= minStockLevel) return 'CRITICAL';
  if (currentStock <= reorderLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
};

Inventory Movement Types:
- IMPORT: Incoming stock (purchase/receipt)
- SALE: Outgoing stock (customer sale)
- ADJUSTMENT: Manual correction
- RETURN: Customer return
- DAMAGE: Damaged/lost stock
```

---

### 4. Finance Module Deep-Dive

```
finance/
├── finance.routes.js
│   │
│   ├─ INVOICES
│   │  │
│   │  ├─ GET /api/v1/finance/invoices
│   │  │  ├─ Auth: STAFF+
│   │  │  ├─ Filters: status, fromDate, toDate
│   │  │  │
│   │  ├─ POST /api/v1/finance/invoices
│   │  │  ├─ Auth: ORG_ADMIN+
│   │  │  ├─ Body: { invoiceNumber, issueDate, dueDate?, items? }
│   │  │  ├─ Creates in DRAFT status
│   │  │  │
│   │  ├─ PATCH /api/v1/finance/invoices/{id}
│   │  │  ├─ Auth: ORG_ADMIN+
│   │  │  ├─ Can only edit DRAFT invoices
│   │  │  │
│   │  └─ PATCH /api/v1/finance/invoices/{id}/status
│   │     ├─ Auth: ORG_ADMIN+
│   │     ├─ Body: { newStatus }
│   │     ├─ Allowed transitions:
│   │     │  - DRAFT → PENDING (issue invoice)
│   │     │  - PENDING → PAID (mark as paid, creates INCOME entry)
│   │     │  - PENDING → OVERDUE (automatic or manual)
│   │     │
│   ├─ LEDGER
│   │  │
│   │  ├─ GET /api/v1/finance/ledger
│   │  │  ├─ Auth: STAFF+
│   │  │  ├─ Filters: type (INCOME|EXPENSE|ADJUSTMENT), fromDate, toDate
│   │  │  │
│   │  └─ POST /api/v1/finance/ledger
│   │     ├─ Auth: ORG_ADMIN+
│   │     ├─ Body: { type, amount, entryDate, category, description? }
│   │     ├─ Types: INCOME, EXPENSE, ADJUSTMENT
│   │     └─ Creates journal entry
│   │
│   ├─ ANALYTICS
│   │  │
│   │  ├─ GET /api/v1/finance/analytics/cash-flow
│   │  │  ├─ Auth: STAFF+
│   │  │  ├─ Returns: Monthly INCOME vs EXPENSE breakdown
│   │  │  ├─ Format: {
│   │  │  │   month: "2026-03",
│   │  │  │   income: 50000,
│   │  │  │   expense: 20000,
│   │  │  │   net: 30000
│   │  │  │ }
│   │  │  │
│   │  └─ GET /api/v1/finance/analytics/trends
│   │     ├─ Auth: STAFF+
│   │     ├─ Returns: Last 12 months revenue vs expense trend
│   │     ├─ Used for dashboards
│
├── finance.schemas.js
│   ├─ invoiceCreateSchema
│   ├─ invoiceUpdateSchema
│   ├─ invoiceStatusSchema: { newStatus }
│   ├─ ledgerEntrySchema
│   └─ All with strict validation
│
└── finance.service.js
   ├─ INVOICE OPERATIONS
   │  │
   │  ├─ findInvoices(filters, pagination)
   │  │  ├─ Where: organizationId + status filter
   │  │  │
   │  ├─ createInvoice(data, organizationId, userId)
   │  │  ├─ Generate invoiceNumber (auto-increment)
   │  │  ├─ Verify uniqueness per org
   │  │  ├─ Status = DRAFT
   │  │  ├─ Create with subtotal/tax/discount/total = 0
   │  │  │
   │  ├─ updateInvoice(id, data, organizationId)
   │  │  ├─ Only allow updates if DRAFT
   │  │  │
   │  ├─ updateInvoiceStatus(id, newStatus, organizationId)
   │  │  ├─ Validate state transition
   │  │  ├─ If DRAFT → PENDING: issuance
   │  │  ├─ If PENDING → PAID:
   │  │  │  ├─ Set paidAt = now
   │  │  │  └─ Create INCOME ledger entry for totalAmount
   │  │  │
   │  ├─ LEDGER OPERATIONS
   │  │
   │  ├─ findLedgerEntries(filters, pagination)
   │  │  ├─ Filter by organizationId + type
   │  │  │
   │  ├─ createLedgerEntry(data, organizationId, userId)
   │  │  ├─ type: INCOME|EXPENSE|ADJUSTMENT
   │  │  ├─ Store: amount, entryDate, category, description
   │  │  │
   │  ├─ ANALYTICS
   │  │
   │  ├─ getCashFlowSummary(organizationId, months?)
   │  │  ├─ Aggregate by month
   │  │  ├─ Sum INCOME entries (positive)
   │  │  ├─ Sum EXPENSE entries (negative)
   │  │  ├─ Calculate net
   │  │  │
   │  └─ getRevenuTrends(organizationId, months=12)
      ├─ Last 12 months of INCOME vs EXPENSE
      ├─ Used for dashboards
      └─ Returns: [{ month, income, expense, net }, ...]

Invoice Status Flow:
┌─────────────┐
│ CREATE      │
│ Status:     │
│ DRAFT       │
└─────┬───────┘
      │ (Can edit safely)
      │
      ▼
┌─────────────┐
│ ISSUE       │
│ Status:     │
│ PENDING     │
└─────┬───────┘
      │ (Awaiting payment)
      │
      ├─ If payment received:
      │  │
      │  └─→ PAID (create INCOME entry)
      │
      └─ If past dueDate:
         │
         └─→ OVERDUE (automatic check possible)

Ledger Entry Types:
- INCOME: Money in (sales, refunds received, interest)
  ├─ Created automatically on PENDING→PAID
  ├─ Amount always positive
  └─ Adds to balance
  
- EXPENSE: Money out (costs, supplies, refunds issued)
  ├─ Manual entry
  ├─ Amount always positive
  └─ Subtracts from balance
  
- ADJUSTMENT: Corrections (writeoffs, errors)
  ├─ Manual entry
  ├─ Used for corrections
  └─ Can be + or -
```

---

## Database Relationships

### One-to-Many Relationships

```
Organization (1) ──→ (Many) User
  Organization has multiple users
  User belongs to ONE organization
  
  Query: org.users() returns all users in org
  
User (1) ──→ (Many) RefreshSession
  User has multiple active sessions
  Session belongs to ONE user
  
  Query: user.refreshSessions()

Organization (1) ──→ (Many) Customer
  Org has customers
  Customer tracked in ONE org
  
InventoryItem (1) ──→ (Many) InventoryMovement
  Item has movement history
  Movement tracked against ONE item
  
Invoice (1) ──→ (Many) LedgerEntry
  Invoice can create multiple entries
  Entry optional links to ONE invoice
```

### Optional Relationships

```
LedgerEntry.invoice (optional)
  ├─ If invoiceId exists: entry is linked to invoice
  └─ If invoiceId null: manual journal entry

User.organization (optional)
  ├─ SUPER_ADMIN: null (global admin)
  └─ ORG_ADMIN/STAFF: points to organization
```

### Cascade Delete Behavior

```
If Organization deleted:
  └─ Cascade: User, Customer, InventoryItem, Invoice, 
             InventoryMovement, LedgerEntry (all of org)

If User deleted:
  └─ Cascade: RefreshSession (orphans)

If InventoryItem deleted:
  └─ Cascade: InventoryMovement (orphans)

If Invoice deleted:
  └─ SetNull: LedgerEntry.invoiceId (leaves orphaned entries)
```

---

## Database Indexing Strategy

### Indexes for Performance

```
Organization
  ├─ PK: id (uuid) ← default
  └─ UNIQUE: slug

User
  ├─ PK: id (uuid) ← default
  ├─ UNIQUE: email
  ├─ FK: organizationId (foreign key index)
  └─ INDEX: (role) - for RBAC queries

RefreshSession
  ├─ PK: id (uuid)
  ├─ FK: userId
  └─ INDEX: (tokenFamily) - for reuse detection

Customer
  ├─ PK: id
  ├─ FK: organizationId
  ├─ UNIQUE: (organizationId, name) - optional
  ├─ INDEX: (organizationId, name) - search within org
  └─ INDEX: (organizationId, isArchived) - active/archived split

InventoryItem
  ├─ PK: id
  ├─ FK: organizationId
  ├─ UNIQUE: (organizationId, sku)
  ├─ INDEX: (organizationId, category) - category grouping
  └─ INDEX: (organizationId, status) - status-based alerts

InventoryMovement
  ├─ PK: id
  ├─ FK: itemId
  ├─ INDEX: (organizationId, itemId) - movements of item
  └─ INDEX: (createdAt) - time-series queries

Invoice
  ├─ PK: id
  ├─ FK: organizationId
  ├─ UNIQUE: (organizationId, invoiceNumber)
  ├─ INDEX: (organizationId, status) - status filtering
  └─ INDEX: (organizationId, issueDate) - date range queries

LedgerEntry
  ├─ PK: id
  ├─ FK: organizationId
  ├─ FK: invoiceId
  ├─ INDEX: (organizationId, type) - by entry type
  ├─ INDEX: (organizationId, entryDate) - time-series analytics
  └─ INDEX: (invoiceId) - invoice reconciliation
```

---

## Performance Considerations

### Query Optimization

```javascript
// ❌ SLOW: N+1 queries
const customers = await prisma.customer.findMany({ ... });
for (const customer of customers) {
  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id }
  }); // Called once per customer
}

// ✅ FAST: Single query with relation
const customers = await prisma.customer.findMany({
  include: {
    invoices: { select: { id, totalAmount } }
  }
});

// ❌ SLOW: Getting all data
const items = await prisma.inventoryItem.findMany();
const total = items.reduce((sum, i) => sum + i.currentStock, 0);

// ✅ FAST: Aggregation at database level
const { _sum } = await prisma.inventoryItem.aggregate({
  _sum: { currentStock: true },
  where: { organizationId }
});
```

### Pagination Design

```javascript
// Limit results to prevent memory issues
const page = query.page || 1;
const limit = Math.min(query.limit || 20, 100); // Max 100
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.customer.findMany({
    where: { organizationId },
    skip, take: limit
  }),
  prisma.customer.count({
    where: { organizationId }
  })
]);

return {
  items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### Caching Opportunities

- Health checks (cache for 5-10 seconds)
- Inventory categories (cache invalidated on item update)
- Exchange rates (cache for 1 hour if expanded)
- Organization metadata (cache per request in req.context)

---

## Security Architecture

### Input Validation

```
Every request payload → Zod Schema Validation

1. Type checking (email format, numbers within range)
2. Length validation (string min/max)
3. Enum validation (status only valid values)
4. Pattern matching (SKU format, invoice numbers)
5. Business logic validation (no duplicates, org ownership)
```

### Authentication Flow

```
1. User sends email + password → /api/v1/auth/login
2. Server:
   ├─ Finds user by email (indexed)
   ├─ Compares password with Argon2id hash
   ├─ Creates JWT access token (15 min)
   ├─ Creates JWT refresh token (7 days)
   ├─ Stores refresh session in DB
   └─ Returns both tokens
3. Client stores tokens (localStorage, SecureStorage in mobile)
4. Client sends access token in Authorization header
5. Server verifies JWT signature on each request
6. If expired: client calls /api/v1/auth/refresh
7. Server issues new token pair, invalidates old refresh
```

### Data Isolation

```
Every query enforced with:
  WHERE organizationId = ? (from req.auth)
  
Example:
  // Get customer - THIS requires org check
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  
  // WRONG: Missing org filter!
  if (customer.organizationId !== req.auth.organizationId) {
    throw new HttpError(403, 'Forbidden');
  }
  
  // RIGHT: Include in where clause
  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
      organizationId: req.auth.organizationId
    }
  });
```

---

## Error Recovery & Resilience

### Database Transaction Usage

```javascript
// Atomic invoice payment with ledger entry
await prisma.$transaction(async (tx) => {
  // Both must succeed or both rollback
  
  const invoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date()
    }
  });
  
  const entry = await tx.ledgerEntry.create({
    data: {
      organizationId: orgId,
      invoiceId: invoiceId,
      type: 'INCOME',
      amount: invoice.totalAmount,
      entryDate: new Date(),
      createdBy: userId
    }
  });
  
  return { invoice, entry };
});
```

### Graceful Degradation

```
Health Checks:
  /health/live  → Is process running? (fast)
  /health/ready → Can serve traffic? (connects to DB)
  
If DB is slow but alive:
  - /health/live returns 200
  - /health/ready might timeout (readiness = traffic rejection)
  - Orchestration can restart pod
```

---

This document serves as the definitive blueprint for the backend system architecture, component interactions, and implementation patterns used throughout the application.
