# Database Schema Reference - Ethnic Fashion SaaS

Complete reference for all 9 database models, fields, relationships, and constraints.

---

## 1. ORGANIZATION Model

**Purpose:** Multi-tenant workspace/company entity

**File Location:** `prisma/schema.prisma` (Lines: Organization block)

**Database Table:** `Organization`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | Unique organization identifier (UUID) |
| `name` | String | Required | - | Company/organization name |
| `slug` | String | @unique | - | URL-friendly identifier (e.g., "acme-corp") |
| `email` | String | Optional | - | Contact email address |
| `phone` | String | Optional | - | Contact phone number |
| `createdAt` | DateTime | @default(now()) | Current time | Creation timestamp (ISO 8601) |
| `updatedAt` | DateTime | @updatedAt | Current time | Last update timestamp (auto-updated) |

### Indexes

```sql
PRIMARY KEY (id)
UNIQUE INDEX on (slug)
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| User | 1:N | users | CASCADE delete |
| Customer | 1:N | customers | CASCADE delete |
| InventoryItem | 1:N | inventoryItems | CASCADE delete |
| Invoice | 1:N | invoices | CASCADE delete |
| LedgerEntry | 1:N | ledgerEntries | CASCADE delete |

### Prisma Definition

```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  email       String?
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  customers   Customer[]
  inventoryItems InventoryItem[]
  invoices    Invoice[]
  ledgerEntries LedgerEntry[]
}
```

### Business Rules

- Slug must be unique across system (company identifier)
- Name is required and typically 2-100 characters
- Organization is the root tenant boundary
- All data in dependent models must belong to an organization

### Example Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ethnic Fashion Co.",
  "slug": "ethnic-fashion-co",
  "email": "contact@ethnicfashion.com",
  "phone": "+1-555-0100",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-03-19T14:25:00Z"
}
```

---

## 2. USER Model

**Purpose:** User accounts with authentication and role-based access

**File Location:** `prisma/schema.prisma` (Lines: User block)

**Database Table:** `User`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | User unique identifier |
| `email` | String | @unique | - | Login email (must be unique globally) |
| `passwordHash` | String | Required | - | Argon2id hashed password (never plain text) |
| `firstName` | String | Required | - | User's first name |
| `lastName` | String | Required | - | User's last name |
| `role` | Role (Enum) | @default(STAFF) | STAFF | User's access level |
| `isActive` | Boolean | @default(true) | true | Account active flag |
| `organizationId` | String? | FK, @relation | null | Organization reference (null for SUPER_ADMIN) |
| `createdAt` | DateTime | @default(now()) | Current time | Account creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Current time | Last profile update timestamp |

### Indexes

```sql
PRIMARY KEY (id)
UNIQUE INDEX on (email)
INDEX on (organizationId)
INDEX on (role)
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| Organization | N:1 | organization | SET NULL |
| RefreshSession | 1:N | refreshSessions | CASCADE delete |

### Enum: Role

```prisma
enum Role {
  SUPER_ADMIN   // Global system admin
  ORG_ADMIN     // Organization administrator
  STAFF         // Regular user
}
```

### Prisma Definition

```prisma
model User {
  id             String          @id @default(uuid())
  email          String          @unique
  passwordHash   String
  firstName      String
  lastName       String
  role           Role            @default(STAFF)
  isActive       Boolean         @default(true)
  organizationId String?
  organization   Organization?   @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  refreshSessions RefreshSession[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([organizationId])
  @@index([role])
}
```

### Business Rules

- Email is case-insensitive unique identifier
- Password never stored in plain text (Argon2id hashing)
- Role determines permission level within system
- isActive allows deactivation without deletion
- SUPER_ADMIN users have organizationId = null
- ORG_ADMIN and STAFF must have organizationId

### Role Permissions

```javascript
SUPER_ADMIN: [
  'manage:all-organizations',
  'manage:all-users',
  'create:organizations',
  'view:system-metrics'
]

ORG_ADMIN: [
  'manage:own-organization',
  'manage:organization-users',
  'create:resources-in-org',
  'view:organization-reports'
]

STAFF: [
  'read:organization-data',
  'create:transactions', // Limited creation
  'view:own-data'
]
```

### Example Data

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "email": "admin@ethnicfashion.com",
  "passwordHash": "$argon2id$v=19$m=19456,t=2,p=1$...",
  "firstName": "Ram",
  "lastName": "Sharma",
  "role": "ORG_ADMIN",
  "isActive": true,
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-01-15T10:35:00Z",
  "updatedAt": "2026-03-19T14:25:00Z"
}
```

---

## 3. REFRESHSESSION Model

**Purpose:** JWT refresh token family tracking for security

**File Location:** `prisma/schema.prisma` (Lines: RefreshSession block)

**Database Table:** `RefreshSession`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | Session identifier |
| `userId` | String | FK | - | User reference |
| `tokenHash` | String | Required | - | SHA256 hash of refresh token (never store plaintext) |
| `tokenFamily` | String | Required | - | Reuse detection identifier (same for rotated pairs) |
| `isRevoked` | Boolean | @default(false) | false | Revocation flag (logout or reuse detected) |
| `expiresAt` | DateTime | Required | - | Token expiration time (7 days) |
| `createdAt` | DateTime | @default(now()) | Current time | Session creation timestamp |

### Indexes

```sql
PRIMARY KEY (id)
FOREIGN KEY (userId) references User(id)
INDEX on (userId)
INDEX on (tokenFamily) -- for reuse detection
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| User | N:1 | user | CASCADE delete |

### Prisma Definition

```prisma
model RefreshSession {
  id          String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash    String
  tokenFamily  String
  isRevoked    Boolean  @default(false)
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([tokenFamily])
}
```

### Business Rules

- Created when user logs in or refreshes token
- tokenFamily links all tokens in a rotation chain
- If old refresh token is used again → entire family revoked (security)
- expiresAt is 7 days from creation
- Expired sessions should be cleaned up periodically (background job)
- Hash prevents exposing actual tokens in database

### Token Refresh Flow

```
Login: → Generate accessToken + refreshToken + tokenFamily
           Store: tokenHash, tokenFamily, expiresAt

Refresh Old: → Validate refreshToken signature
                Check tokenHash table by family
                If tokenFamily found and not revoked:
                  Generate new tokenFamily
                  Revoke old RefreshSession
                  Create new RefreshSession
                Otherwise:
                  Revoke entire family (reuse detected)
                  Return 403
```

### Example Data

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440005",
  "userId": "660e8400-e29b-41d4-a716-446655440001",
  "tokenHash": "sha256:ae7d8f9c...",
  "tokenFamily": "family-uuid-12345",
  "isRevoked": false,
  "expiresAt": "2026-03-26T10:35:00Z",
  "createdAt": "2026-03-19T10:35:00Z"
}
```

---

## 4. CUSTOMER Model

**Purpose:** CRM customer records with purchase history

**File Location:** `prisma/schema.prisma` (Lines: Customer block)

**Database Table:** `Customer`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | uuid | Customer unique identifier |
| `organizationId` | String | FK | - | Organization reference |
| `name` | String | Required | - | Customer's full name |
| `email` | String | Optional | - | Email address (not unique) |
| `phone` | String | Optional | - | Phone number |
| `city` | String | Optional | - | City of residence |
| `country` | String | Optional | - | Country of residence |
| `totalSpent` | Decimal | @default(0) | 0 | Cumulative purchase amount |
| `lifetimeValue` | Decimal | @default(0) | 0 | Expected lifetime value |
| `isArchived` | Boolean | @default(false) | false | Soft delete flag |
| `createdBy` | String? | Optional | - | Creator user ID |
| `updatedBy` | String? | Optional | - | Last updater user ID |
| `createdAt` | DateTime | @default(now()) | Current time | Creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Current time | Last update timestamp |

### Indexes

```sql
PRIMARY KEY (id)
FOREIGN KEY (organizationId) references Organization(id)
INDEX on (organizationId)
INDEX on (organizationId, name) -- for search
INDEX on (organizationId, isArchived) -- for active/archived split
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| Organization | N:1 | organization | CASCADE delete |

### Prisma Definition

```prisma
model Customer {
  id               String   @id @default(uuid())
  organizationId   String
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name             String
  email            String?
  phone            String?
  city             String?
  country          String?
  totalSpent       Decimal  @default(0)
  lifetimeValue    Decimal  @default(0)
  isArchived       Boolean  @default(false)
  createdBy        String?
  updatedBy        String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([organizationId])
  @@index([organizationId, name])
  @@index([organizationId, isArchived])
}
```

### Business Rules

- Name is required, other fields optional
- Soft delete via isArchived (not physically deleted)
- totalSpent updated when invoice moved to PAID status
- lifetimeValue calculated from purchase history
- Tenant-scoped: cannot see other org's customers
- Email/Phone not globally unique (multiple orgs possible)

### Analytics Calculations

```javascript
// totalSpent: Sum of all PAID invoices
SELECT SUM(totalAmount) FROM Invoice 
WHERE customerId = ? AND status = 'PAID'

// lifetimeValue: Estimated future value
// Heuristic: (totalSpent / months_active) * 12
// Or: Manual override by staff
```

### Example Data

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440010",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "+1-555-0201",
  "city": "New York",
  "country": "USA",
  "totalSpent": 4500.50,
  "lifetimeValue": 5000.00,
  "isArchived": false,
  "createdBy": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-02-10T11:20:00Z",
  "updatedAt": "2026-03-15T09:45:00Z"
}
```

---

## 5. INVENTORYITEM Model

**Purpose:** Product/stock records with status tracking

**File Location:** `prisma/schema.prisma` (Lines: InventoryItem block)

**Database Table:** `InventoryItem`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | Item unique identifier |
| `organizationId` | String | FK | - | Organization reference |
| `name` | String | Required | - | Product name |
| `sku` | String | Required | - | Stock Keeping Unit (unique per org) |
| `category` | String | Required | - | Product category (e.g., "Sarees", "Dupattas") |
| `currentStock` | Int | @default(0) | 0 | Current quantity on hand |
| `reorderLevel` | Int | @default(0) | 0 | Reorder point threshold |
| `minStockLevel` | Int | @default(0) | 0 | Critical stock level |
| `unitPrice` | Decimal | @default(0) | 0 | Cost price (supplier) |
| `sellingPrice` | Decimal | @default(0) | 0 | Selling price (customer) |
| `unit` | String | @default("piece") | "piece" | Measurement unit (piece, kg, meter, etc.) |
| `status` | InventoryStatus | @default(IN_STOCK) | IN_STOCK | Computed status |
| `createdBy` | String? | Optional | - | Creator user ID |
| `updatedBy` | String? | Optional | - | Last updater user ID |
| `createdAt` | DateTime | @default(now()) | Current time | Creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Current time | Last update timestamp |

### Indexes

```sql
PRIMARY KEY (id)
FOREIGN KEY (organizationId) references Organization(id)
UNIQUE INDEX on (organizationId, sku)
INDEX on (organizationId, category)
INDEX on (organizationId, status)
```

### Enum: InventoryStatus

```prisma
enum InventoryStatus {
  IN_STOCK      // currentStock > reorderLevel
  LOW_STOCK     // currentStock <= reorderLevel AND > minStockLevel
  CRITICAL      // currentStock <= minStockLevel AND > 0
  OUT_OF_STOCK  // currentStock = 0
}
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| Organization | N:1 | organization | CASCADE delete |
| InventoryMovement | 1:N | movements | CASCADE delete |

### Prisma Definition

```prisma
model InventoryItem {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String
  sku            String
  category       String
  currentStock   Int      @default(0)
  reorderLevel   Int      @default(0)
  minStockLevel  Int      @default(0)
  unitPrice      Decimal  @default(0)
  sellingPrice   Decimal  @default(0)
  unit           String   @default("piece")
  status         InventoryStatus @default(IN_STOCK)
  createdBy      String?
  updatedBy      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  movements      InventoryMovement[]

  @@unique([organizationId, sku])
  @@index([organizationId, category])
  @@index([organizationId, status])
}
```

### Business Rules

- SKU must be unique within organization (not globally)
- Status is derived from currentStock + thresholds
- currentStock updated via InventoryMovement records (not directly)
- sellingPrice = retail price, unitPrice = cost price
- profitMargin = (sellingPrice - unitPrice) / sellingPrice

### Status Calculation

```javascript
function calculateStatus(currentStock, minStockLevel, reorderLevel) {
  if (currentStock === 0) return InventoryStatus.OUT_OF_STOCK;
  if (currentStock <= minStockLevel) return InventoryStatus.CRITICAL;
  if (currentStock <= reorderLevel) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}
```

### Example Data

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440015",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Silk Saree - Red",
  "sku": "SAREE-SILK-RED-001",
  "category": "Sarees",
  "currentStock": 25,
  "reorderLevel": 10,
  "minStockLevel": 5,
  "unitPrice": 150.00,
  "sellingPrice": 299.99,
  "unit": "piece",
  "status": "IN_STOCK",
  "createdBy": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-01-20T14:30:00Z",
  "updatedAt": "2026-03-18T16:45:00Z"
}
```

---

## 6. INVENTORYMOVEMENT Model

**Purpose:** Audit trail for stock adjustments

**File Location:** `prisma/schema.prisma` (Lines: InventoryMovement block)

**Database Table:** `InventoryMovement`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | Movement record ID |
| `organizationId` | String | Required | - | Organization context (denormalized) |
| `itemId` | String | FK | - | InventoryItem reference |
| `changeType` | String | Required | - | Type of change (IMPORT, SALE, ADJUSTMENT, RETURN, DAMAGE) |
| `quantity` | Int | Required | - | Change in stock (positive/negative) |
| `note` | String? | Optional | - | Reason or additional info |
| `createdBy` | String? | Optional | - | User who made adjustment |
| `createdAt` | DateTime | @default(now()) | Current time | Timestamp of change |

### Indexes

```sql
PRIMARY KEY (id)
FOREIGN KEY (itemId) references InventoryItem(id)
INDEX on (organizationId, itemId) -- movements of item
INDEX on (createdAt) -- time-series queries
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| InventoryItem | N:1 | item | CASCADE delete |

### Prisma Definition

```prisma
model InventoryMovement {
  id             String   @id @default(uuid())
  organizationId String
  itemId         String
  item           InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  changeType     String
  quantity       Int
  note           String?
  createdBy      String?
  createdAt      DateTime @default(now())

  @@index([organizationId, itemId])
  @@index([createdAt])
}
```

### Business Rules

- Append-only (never updated or deleted, immutable audit trail)
- quantity can be positive (incoming) or negative (outgoing)
- changeType categorizes the movement:
  - IMPORT: Purchase from supplier
  - SALE: Customer purchase
  - ADJUSTMENT: Manual correction
  - RETURN: Customer return
  - DAMAGE: Lost/damaged stock
- createdBy allows tracing who adjusted stock

### Usage Pattern

```javascript
// Recording a sale
await prisma.inventoryMovement.create({
  data: {
    organizationId: org,
    itemId: item.id,
    changeType: 'SALE',
    quantity: -5,  // Negative because stock decreases
    note: 'Order #12345',
    createdBy: userId,
  }
});

// Update the item's stock
await prisma.inventoryItem.update({
  where: { id: item.id },
  data: {
    currentStock: { decrement: 5 }
  }
});
```

### Example Data

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440020",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "itemId": "990e8400-e29b-41d4-a716-446655440015",
  "changeType": "SALE",
  "quantity": -2,
  "note": "Invoice #INV-2026-003",
  "createdBy": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-03-19T10:15:00Z"
}
```

---

## 7. INVOICE Model

**Purpose:** Financial documents for sales/purchases

**File Location:** `prisma/schema.prisma` (Lines: Invoice block)

**Database Table:** `Invoice`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | Invoice unique identifier |
| `organizationId` | String | FK | - | Organization reference |
| `invoiceNumber` | String | Unique per org | - | Human-readable invoice number |
| `status` | InvoiceStatus | @default(DRAFT) | DRAFT | Current invoice status |
| `issueDate` | DateTime | Required | - | Date invoice was created |
| `dueDate` | DateTime? | Optional | - | Payment due date |
| `paidAt` | DateTime? | Optional | - | Payment date (null until paid) |
| `currency` | String | @default("USD") | "USD" | Currency code (ISO 4217) |
| `subtotal` | Decimal | @default(0) | 0 | Amount before tax/discount |
| `taxAmount` | Decimal | @default(0) | 0 | Tax/VAT amount |
| `discountAmount` | Decimal | @default(0) | 0 | Discount applied |
| `totalAmount` | Decimal | @default(0) | 0 | Final amount (subtotal + tax - discount) |
| `notes` | String? | Optional | - | Invoice notes/memo |
| `createdBy` | String? | Optional | - | Issuer user ID |
| `updatedBy` | String? | Optional | - | Last modifier user ID |
| `createdAt` | DateTime | @default(now()) | Current time | Creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Current time | Last update timestamp |

### Indexes

```sql
PRIMARY KEY (id)
FOREIGN KEY (organizationId) references Organization(id)
UNIQUE INDEX on (organizationId, invoiceNumber)
INDEX on (organizationId, status)
INDEX on (organizationId, issueDate)
```

### Enum: InvoiceStatus

```prisma
enum InvoiceStatus {
  DRAFT     // Editable, not yet issued
  PENDING   // Issued, awaiting payment
  PAID      // Payment received
  OVERDUE   // Past due date, unpaid
}
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| Organization | N:1 | organization | CASCADE delete |
| LedgerEntry | 1:N | ledgerEntries | SET NULL |

### Prisma Definition

```prisma
model Invoice {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invoiceNumber  String
  status         InvoiceStatus @default(DRAFT)
  issueDate      DateTime
  dueDate        DateTime?
  paidAt         DateTime?
  currency       String       @default("USD")
  subtotal       Decimal      @default(0)
  taxAmount      Decimal      @default(0)
  discountAmount Decimal      @default(0)
  totalAmount    Decimal      @default(0)
  notes          String?
  createdBy      String?
  updatedBy      String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  ledgerEntries  LedgerEntry[]

  @@unique([organizationId, invoiceNumber])
  @@index([organizationId, status])
  @@index([organizationId, issueDate])
}
```

### Business Rules

- invoiceNumber is unique within organization (format: ORG-YYYY-NNNNN)
- Only DRAFT invoices can be edited
- Status transitions: DRAFT → PENDING → PAID (or OVERDUE)
- paidAt is set when status changes to PAID
- totalAmount = subtotal + taxAmount - discountAmount
- Cannot delete invoices (soft delete via status changes)

### Invoice Status Workflow

```
┌────────┐
│ DRAFT  │ Editable, Line items can be added/removed
└───┬────┘
    │
    │ Issue Invoice
    │
    ▼
┌────────┐
│PENDING │ Awaiting payment, Not editable
└───┬─────┴────────────────────┐
    │                          │
    │ Payment Received         │ Past Due Date
    │                          │
    ▼                          ▼
┌────────┐                 ┌────────┐
│  PAID  │                 │OVERDUE │
└────────┘                 └────────┘
    │ Create INCOME ledger entry
    │ Update Customer.totalSpent
    ▼
 (Financial Impact)
```

### Amount Calculation

```javascript
function calculateTotal(subtotal, taxAmount, discountAmount) {
  return subtotal + taxAmount - discountAmount;
}

// Example:
// Items: 100
// Subtotal: 100
// Tax (10%): 10
// Discount: 15
// Total: 100 + 10 - 15 = 95
```

### Example Data

```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440025",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceNumber": "EFC-2026-00001",
  "status": "PAID",
  "issueDate": "2026-03-01T10:00:00Z",
  "dueDate": "2026-04-01T00:00:00Z",
  "paidAt": "2026-03-18T15:30:00Z",
  "currency": "USD",
  "subtotal": 1000.00,
  "taxAmount": 100.00,
  "discountAmount": 50.00,
  "totalAmount": 1050.00,
  "notes": "Payment via wire transfer",
  "createdBy": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-03-01T10:00:00Z",
  "updatedAt": "2026-03-18T15:30:00Z"
}
```

---

## 8. LEDGERENTRY Model

**Purpose:** Financial accounting records for bookkeeping

**File Location:** `prisma/schema.prisma` (Lines: LedgerEntry block)

**Database Table:** `LedgerEntry`

### Fields

| Field | Type | Constraints | Default | Description |
|-------|------|-------------|---------|-------------|
| `id` | String | @id, @default(uuid()) | - | Ledger entry ID |
| `organizationId` | String | FK | - | Organization reference |
| `invoiceId` | String? | FK | null | Optional invoice reference |
| `type` | LedgerEntryType | Required | - | Entry type (INCOME/EXPENSE/ADJUSTMENT) |
| `amount` | Decimal | Required | - | Transaction amount (always positive) |
| `entryDate` | DateTime | Required | - | When transaction occurred |
| `category` | String? | Optional | - | Accounting category (e.g., "Sales", "Supplies") |
| `description` | String? | Optional | - | Entry description/memo |
| `createdBy` | String? | Optional | - | Recorder user ID |
| `createdAt` | DateTime | @default(now()) | Current time | Entry creation timestamp |

### Indexes

```sql
PRIMARY KEY (id)
FOREIGN KEY (organizationId) references Organization(id)
FOREIGN KEY (invoiceId) references Invoice(id)
INDEX on (organizationId, type)
INDEX on (organizationId, entryDate)
INDEX on (invoiceId)
```

### Enum: LedgerEntryType

```prisma
enum LedgerEntryType {
  INCOME       // Money in (sales, returns, interest)
  EXPENSE      // Money out (costs, refunds, supplies)
  ADJUSTMENT   // Corrections, writeoffs
}
```

### Relationships

| Related Model | Type | Field | Behavior |
|---------------|------|-------|----------|
| Organization | N:1 | organization | CASCADE delete |
| Invoice | N:1 | invoice | SET NULL (optional) |

### Prisma Definition

```prisma
model LedgerEntry {
  id             String         @id @default(uuid())
  organizationId String
  organization   Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invoiceId      String?
  invoice        Invoice?       @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  type           LedgerEntryType
  amount         Decimal
  entryDate      DateTime
  category       String?
  description    String?
  createdBy      String?
  createdAt      DateTime       @default(now())

  @@index([organizationId, type])
  @@index([organizationId, entryDate])
  @@index([invoiceId])
}
```

### Business Rules

- Append-only (never updated or deleted, accounting integrity)
- amount always stored as positive value
- type determines direction (INCOME adds, EXPENSE subtracts, ADJUSTMENT varies)
- invoiceId optional (null for manual entries)
- category helps with reporting (e.g., "Sales Revenue", "Office Supplies")
- entryDate may differ from createdAt (historical entries possible)

### Entry Types & Impact

```javascript
INCOME:      // Money received
  amount: 100
  impact: balance += 100 ← money in
  examples: sales, refunds received, interest

EXPENSE:     // Money spent
  amount: 50
  impact: balance -= 50 ← money out
  examples: supplies, rent, salaries, refunds issued

ADJUSTMENT:  // Corrections
  amount: -10
  impact: variable (positive/negative allowed)
  examples: inventory writeoff, loan forgiveness
```

### Automatic Entry Creation

```javascript
// When invoice transitions to PAID
async function markInvoiceAsPaid(invoiceId, org) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date()
    }
  });

  // Automatically create INCOME entry
  await prisma.ledgerEntry.create({
    data: {
      organizationId: org,
      invoiceId: invoiceId,
      type: 'INCOME',
      amount: invoice.totalAmount,
      entryDate: new Date(),
      category: 'Sales',
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
      createdBy: userId
    }
  });
}
```

### Example Data

```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440030",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceId": "bb0e8400-e29b-41d4-a716-446655440025",
  "type": "INCOME",
  "amount": 1050.00,
  "entryDate": "2026-03-18T15:30:00Z",
  "category": "Sales Revenue",
  "description": "Payment for Invoice EFC-2026-00001",
  "createdBy": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-03-18T15:30:00Z"
}
```

---

## ER Diagram (ASCII Art)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            ORGANIZATION                                   │
│  ┌─────────┬─────────┬──────────┬────────┬──────────┬──────────────┐     │
│  │ id: PK  │ name    │ slug: UK │ email  │ phone    │ created/upd  │     │
│  └─────────┴─────────┴──────────┴────────┴──────────┴──────────────┘     │
└──────────────────────────┬──────────────────────────┬─────────────────────┘
                          │                          │
         ┌────────────────┼──────────────┬───────────┼──────────┬──────────┐
         │                │              │          │           │          │
         ▼                ▼              ▼          ▼           ▼          ▼
    ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐
    │    USER     │ │CUSTOMER  │ │ INVENTORY│ │INVOICE │ │ LEDGER   │ │ REFRESH │
    │             │ │          │ │ ITEM     │ │        │ │ ENTRY    │ │SESSION  │
    │ ├─ id: PK   │ │├─id: PK  │ │├─id: PK  │ │├─id:PK │ │├─id: PK │ │├─id:PK  │
    │ ├─email:U   │ │├─org*    │ │├─org*    │ │├─org*  │ │├─org*   │ │├─user*  │
    │ ├─password  │ │├─name    │ │├─name    │ │├─num:U │ │├─inv*   │ │├─token  │
    │ ├─name      │ │├─email   │ │├─sku:U  │ │├─status│ │├─type   │ │├─family │
    │ ├─role      │ │├─phone   │ │├─cat     │ │├─issD  │ │├─amount │ │├─revoked│
    │ ├─active    │ │├─city    │ │├─stock   │ │├─dueD  │ │├─date   │ │├─expiry │
    │ ├─org*      │ │├─country │ │├─reorder │ │├─paidAt│ │├─cat    │ │└─────────┘
    │ └─created   │ │├─spent   │ │├─minLvl  │ │├─amount│ │├─desc   │
    │             │ │├─lifetime│ │├─unitP   │ │├─tax   │ │└─────────┘
    │             │ │├─archived│ │├─sellP   │ │├─disc  │
    │             │ │└─created │ │├─unit    │ │└─created
    │             │             │├─status  │
    │             │             │└─created │
    └─────────────┘ └──────────┘           
         │                    └──────────┘ └────────┘
         │
         │ (1:N)
         ▼
    ┌─────────────┐
    │REFRESH      │
    │SESSION      │
    │             │
    │ ├─id: PK    │
    │ ├─user*     │
    │ ├─tokenH    │
    │ ├─family    │
    │ ├─revoked   │
    │ └─expiry    │
    └─────────────┘

INVENTORY ITEM (1:N) ───────→ INVENTORY MOVEMENT
                               ├─ id: PK
                               ├─ org
                               ├─ item*
                               ├─ changeType
                               ├─ qty
                               └─ created

INVOICE (1:N) ───────────→ LEDGER ENTRY
                          └─ Links to financial entries

Legend:
  PK   = Primary Key
  U    = Unique
  UK   = Unique Key
  *    = Foreign Key
  FK   = Foreign Key
  1:N  = One-to-Many
  N:1  = Many-to-One
```

---

## SQL Constraints Summary

### Unique Constraints

```sql
Organization.slug (GLOBALLY unique)
User.email (GLOBALLY unique)
InventoryItem(organizationId, sku) (unique per org)
Invoice(organizationId, invoiceNumber) (unique per org)
```

### Foreign Keys

```sql
User.organizationId → Organization.id (CASCADE)
RefreshSession.userId → User.id (CASCADE)
Customer.organizationId → Organization.id (CASCADE)
InventoryItem.organizationId → Organization.id (CASCADE)
InventoryMovement.itemId → InventoryItem.id (CASCADE)
Invoice.organizationId → Organization.id (CASCADE)
LedgerEntry.organizationId → Organization.id (CASCADE)
LedgerEntry.invoiceId → Invoice.id (SET NULL)
```

### Indexes for Query Performance

```sql
-- Organization
CREATE INDEX idx_org_slug ON Organization(slug);

-- User
CREATE INDEX idx_user_org_id ON User(organizationId);
CREATE INDEX idx_user_role ON User(role);

-- RefreshSession
CREATE INDEX idx_session_user_id ON RefreshSession(userId);
CREATE INDEX idx_session_family ON RefreshSession(tokenFamily);

-- Customer
CREATE INDEX idx_customer_org ON Customer(organizationId);
CREATE INDEX idx_customer_org_name ON Customer(organizationId, name);
CREATE INDEX idx_customer_org_archived ON Customer(organizationId, isArchived);

-- InventoryItem
CREATE INDEX idx_inv_item_org_sku ON InventoryItem(organizationId, sku);
CREATE INDEX idx_inv_item_org_cat ON InventoryItem(organizationId, category);
CREATE INDEX idx_inv_item_org_status ON InventoryItem(organizationId, status);

-- InventoryMovement
CREATE INDEX idx_inv_move_org_item ON InventoryMovement(organizationId, itemId);
CREATE INDEX idx_inv_move_created ON InventoryMovement(createdAt);

-- Invoice
CREATE INDEX idx_invoice_org_num ON Invoice(organizationId, invoiceNumber);
CREATE INDEX idx_invoice_org_status ON Invoice(organizationId, status);
CREATE INDEX idx_invoice_org_issued ON Invoice(organizationId, issueDate);

-- LedgerEntry
CREATE INDEX idx_ledger_org_type ON LedgerEntry(organizationId, type);
CREATE INDEX idx_ledger_org_date ON LedgerEntry(organizationId, entryDate);
CREATE INDEX idx_ledger_invoice ON LedgerEntry(invoiceId);
```

---

## Migration & Version Control

### Current Schema Version

- **Version:** 1.0.0
- **Created:** 2026-03-19
- **Status:** Production Ready
- **Models:** 9 (Organization, User, RefreshSession, Customer, InventoryItem, InventoryMovement, Invoice, LedgerEntry)

### Future Enhancements

Planned additions:
- Exhibition management
- Social/marketing campaigns
- Advanced analytics & reporting
- File attachments (receipts, invoices)
- Custom fields per organization
- Audit logs for compliance

---

**Last Updated:** March 19, 2026  
**Schema Maintainer:** Development Team  
**Reference:** See `prisma/schema.prisma` for authoritative schema definition
