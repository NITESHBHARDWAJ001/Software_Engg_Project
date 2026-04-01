# Endpoint Reference

Legend:

- Auth: `Public` or `Bearer`
- Roles: allowed roles for endpoint
- Feature: subscription feature gate key (if applicable)

## Health

### `GET /health/live`

- Auth: Public
- Roles: N/A
- Response: `{ "status": "ok" }`

### `GET /health/ready`

- Auth: Public
- Roles: N/A
- Response: `{ "status": "ready" }`

## Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/login`

- Auth: Public
- Roles: N/A
- Body:

```json
{
  "email": "admin@org.com",
  "password": "StrongPassword123"
}
```

- Success `200`: login payload with access/refresh tokens and user profile
- Errors: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`

### `POST /api/v1/auth/refresh`

- Auth: Public
- Roles: N/A
- Body:

```json
{
  "refreshToken": "<jwt>"
}
```

- Success `200`: new access and refresh tokens
- Errors: `VALIDATION_ERROR`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REVOKED`

### `POST /api/v1/auth/logout`

- Auth: Public
- Roles: N/A
- Body:

```json
{
  "refreshToken": "<jwt>"
}
```

- Success `200`: `{ success: true, message: "Logged out", data: null }`
- Errors: `VALIDATION_ERROR`

## Organizations (`/api/v1/organizations`)

### `GET /api/v1/organizations/me`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`
- Success `200`: organization profile (`id`, `name`, `slug`, `email`, `phone`, `createdAt`, `updatedAt`)
- Errors: `UNAUTHORIZED`, `FORBIDDEN`, `ORG_REQUIRED`, `ORG_NOT_FOUND`

## Customers (`/api/v1/customers`)

Feature: `CUSTOMER_MANAGEMENT`

### `GET /api/v1/customers`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `search`, `status` (`ACTIVE|INACTIVE`)
- Success `200`: paginated customer list
- Errors: `UNAUTHORIZED`, `FORBIDDEN`, `ORG_REQUIRED`, `FEATURE_FORBIDDEN`

### `GET /api/v1/customers/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: totals and top customer analytics
- Errors: `UNAUTHORIZED`, `FORBIDDEN`, `ORG_REQUIRED`, `FEATURE_FORBIDDEN`

### `GET /api/v1/customers/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: customer object
- Errors: `UNAUTHORIZED`, `FORBIDDEN`, `ORG_REQUIRED`, `CUSTOMER_NOT_FOUND`, `FEATURE_FORBIDDEN`

### `POST /api/v1/customers`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "name": "Aarav Textiles",
  "email": "procurement@aaravtextiles.com",
  "phone": "+91-9000000000",
  "city": "Jaipur",
  "country": "India"
}
```

- Success `201`: created customer object
- Errors: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `ORG_REQUIRED`, `FEATURE_FORBIDDEN`

### `PATCH /api/v1/customers/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body: partial customer create payload
- Success `200`: updated customer object
- Errors: `VALIDATION_ERROR`, `CUSTOMER_NOT_FOUND`, `ORG_REQUIRED`, `FEATURE_FORBIDDEN`

### `DELETE /api/v1/customers/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Success `200`: archive confirmation (`data: null`)
- Errors: `CUSTOMER_NOT_FOUND`, `ORG_REQUIRED`, `FEATURE_FORBIDDEN`

## Inventory (`/api/v1/inventory`)

Feature: `INVENTORY_MANAGEMENT`

### `GET /api/v1/inventory`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `search`, `category`
- Success `200`: paginated inventory list

### `GET /api/v1/inventory/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: inventory dashboard metrics

### `GET /api/v1/inventory/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: inventory item
- Errors: `ITEM_NOT_FOUND`

### `POST /api/v1/inventory`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "name": "Handloom Kurta",
  "sku": "KURTA-HL-001",
  "category": "Kurtas",
  "currentStock": 100,
  "reorderLevel": 20,
  "minStockLevel": 8,
  "unitPrice": 540,
  "sellingPrice": 899,
  "unit": "piece"
}
```

- Success `201`: created item with computed `status`

### `PATCH /api/v1/inventory/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body: partial create payload
- Success `200`: updated item
- Errors: `ITEM_NOT_FOUND`

### `POST /api/v1/inventory/:id/adjust-stock`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "quantity": 5,
  "changeType": "IN",
  "note": "Purchase order received"
}
```

- Notes:
  - `changeType`: `IN|OUT|ADJUSTMENT`
  - For `OUT`, quantity is applied as negative movement
  - For `ADJUSTMENT`, quantity can be positive or negative but cannot be `0`
- Success `200`: updated item
- Errors: `INVALID_STOCK`, `ITEM_NOT_FOUND`, `VALIDATION_ERROR`

### `GET /api/v1/inventory/alerts/low-stock`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: items with `LOW_STOCK|CRITICAL|OUT_OF_STOCK`

### `GET /api/v1/inventory/analytics/categories`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: category aggregates (`category`, `itemCount`, `stockUnits`)

### `GET /api/v1/inventory/:id/movements`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: latest 100 movements

## Finance (`/api/v1/finance`)

Feature: `FINANCE_MANAGEMENT`

### `GET /api/v1/finance/invoices`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `status`, `search`
- Success `200`: paginated invoices

### `POST /api/v1/finance/invoices`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "invoiceNumber": "INV-2026-001",
  "issueDate": "2026-03-20",
  "dueDate": "2026-03-27",
  "currency": "USD",
  "subtotal": 1200,
  "taxAmount": 60,
  "discountAmount": 20,
  "totalAmount": 1240,
  "notes": "Showroom billing"
}
```

- Success `201`: created invoice
- Errors: `INVOICE_NUMBER_EXISTS`, `VALIDATION_ERROR`

### `GET /api/v1/finance/invoices/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: invoice
- Errors: `INVOICE_NOT_FOUND`

### `PATCH /api/v1/finance/invoices/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body: partial invoice payload
- Success `200`: updated invoice
- Errors: `INVOICE_NOT_FOUND`, `VALIDATION_ERROR`

### `PATCH /api/v1/finance/invoices/:id/status`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "status": "PAID",
  "paidAt": "2026-03-23"
}
```

- Allowed transitions:
  - `DRAFT -> PENDING|PAID`
  - `PENDING -> PAID|OVERDUE`
  - `OVERDUE -> PAID`
  - `PAID -> PAID`
- Success `200`: updated invoice
- Errors: `INVALID_INVOICE_STATUS_TRANSITION`, `INVOICE_NOT_FOUND`

### `GET /api/v1/finance/ledger`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `type`, `from`, `to`
- Success `200`: paginated ledger entries

### `POST /api/v1/finance/ledger`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "invoiceId": "d33707b8-9321-44e3-a35c-f0d67720f9a5",
  "type": "INCOME",
  "amount": 1240,
  "entryDate": "2026-03-23",
  "category": "Sales",
  "description": "Invoice payment"
}
```

- Success `201`: created ledger entry
- Errors: `INVOICE_NOT_FOUND`, `VALIDATION_ERROR`

### `GET /api/v1/finance/analytics/cash-flow`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `from`, `to`
- Success `200`: income/expense/net summary

### `GET /api/v1/finance/analytics/trends`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `from`, `to`, `groupBy` (`day|month`)
- Success `200`: bucketed trend rows

### `GET /api/v1/finance/analytics/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `from`, `to`
- Success `200`: KPI stats for finance dashboard

## Tasks (`/api/v1/tasks`)

Feature: `TASK_MANAGEMENT`

### `GET /api/v1/tasks`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `search`, `status`, `priority`, `assignedTo`
- Success `200`: paginated tasks

### `GET /api/v1/tasks/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: task status counters and overdue count

### `GET /api/v1/tasks/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: task with comments
- Errors: `TASK_NOT_FOUND`

### `POST /api/v1/tasks`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "title": "Prepare exhibition catalog",
  "description": "Finalize design and print",
  "status": "TODO",
  "priority": "HIGH",
  "assignedTo": "934136d5-f8ca-4f1f-aa95-d3109e3851dd",
  "dueDate": "2026-03-30",
  "tags": ["catalog", "print"],
  "attachments": [],
  "relatedExhibitionId": "4f7af63f-4727-42f2-b52b-8dbd54ecf8d8",
  "relatedCustomerId": "f157f8de-9c44-4c89-b6f5-6f1909157f58"
}
```

- Success `201`: created task
- Errors: `VALIDATION_ERROR`

### `PATCH /api/v1/tasks/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body: partial task create payload
- Success `200`: updated task
- Errors: `TASK_NOT_FOUND`

### `PATCH /api/v1/tasks/:id/status`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body:

```json
{
  "status": "COMPLETED"
}
```

- Success `200`: updated task status and `completedAt`
- Errors: `TASK_NOT_FOUND`, `VALIDATION_ERROR`

### `DELETE /api/v1/tasks/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Success `200`: `{ success: true, message: "Task deleted", data: { "id": "..." } }`
- Errors: `TASK_NOT_FOUND`

### `GET /api/v1/tasks/:id/comments`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: task comments list
- Errors: `TASK_NOT_FOUND`

### `POST /api/v1/tasks/:id/comments`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body:

```json
{
  "content": "Updated with latest print vendor"
}
```

- Success `201`: created comment
- Errors: `TASK_NOT_FOUND`, `VALIDATION_ERROR`

## Exhibitions (`/api/v1/exhibitions`)

Feature: `EXHIBITION_MANAGEMENT`

### `GET /api/v1/exhibitions`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `status`, `search`
- Success `200`: paginated exhibitions

### `GET /api/v1/exhibitions/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: exhibition KPIs and ROI summary

### `GET /api/v1/exhibitions/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: exhibition details
- Errors: `EXHIBITION_NOT_FOUND`

### `POST /api/v1/exhibitions`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body:

```json
{
  "name": "Summer Ethnic Expo",
  "description": "Regional B2B showcase",
  "location": "Pragati Maidan",
  "startDate": "2026-04-05",
  "endDate": "2026-04-08",
  "status": "UPCOMING",
  "budget": 15000,
  "actualSpent": 5000,
  "expectedRevenue": 70000,
  "actualRevenue": 0,
  "expectedFootfall": 2000,
  "actualFootfall": 0,
  "boothSize": "24x24",
  "stallNumber": "B12",
  "category": "Trade Show",
  "assignedStaff": ["934136d5-f8ca-4f1f-aa95-d3109e3851dd"],
  "notes": "Corner display",
  "images": []
}
```

- Success `201`: created exhibition

### `PATCH /api/v1/exhibitions/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Body: partial exhibition payload
- Success `200`: updated exhibition
- Errors: `EXHIBITION_NOT_FOUND`

### `GET /api/v1/exhibitions/:id/leads`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: list of exhibition leads with interactions
- Errors: `EXHIBITION_NOT_FOUND`

### `POST /api/v1/exhibitions/:id/leads`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body:

```json
{
  "name": "Nisha Traders",
  "phone": "+91-9811000000",
  "email": "nisha@traders.in",
  "company": "Nisha Traders",
  "interestLevel": "HOT",
  "status": "NEW",
  "interestedProducts": ["Sarees"],
  "notes": "Interested in festive collection",
  "followUpDate": "2026-03-25",
  "lastContactedDate": "2026-03-23",
  "source": "EXHIBITION",
  "estimatedValue": 24000
}
```

- Success `201`: created lead
- Errors: `EXHIBITION_NOT_FOUND`, `VALIDATION_ERROR`

### `PATCH /api/v1/exhibitions/:id/leads/:leadId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body: partial lead payload
- Success `200`: updated lead
- Errors: `LEAD_NOT_FOUND`, `VALIDATION_ERROR`

### `POST /api/v1/exhibitions/leads/:leadId/interactions`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body:

```json
{
  "type": "CALL",
  "notes": "Shared MOQ and pricing"
}
```

- Success `201`: created interaction
- Errors: `LEAD_NOT_FOUND`, `VALIDATION_ERROR`

### `GET /api/v1/exhibitions/:id/roi`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Success `200`: ROI and conversion metrics
- Errors: `EXHIBITION_NOT_FOUND`

## Subscriptions (`/api/v1/subscriptions`)

### Plans

#### `GET /api/v1/subscriptions/plans`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `activeOnly` (boolean)
- Success `200`: list of plan resources

#### `POST /api/v1/subscriptions/plans`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Body:

```json
{
  "name": "Growth",
  "code": "GROWTH",
  "description": "For scaling teams",
  "billingCycle": "MONTHLY",
  "price": 1499,
  "currency": "USD",
  "isActive": true,
  "features": [
    "CUSTOMER_MANAGEMENT",
    "INVENTORY_MANAGEMENT",
    "FINANCE_MANAGEMENT",
    "TASK_MANAGEMENT",
    "EXHIBITION_MANAGEMENT"
  ],
  "limits": {
    "users": 25,
    "storageGb": 100
  }
}
```

- Success `201`: created plan
- Errors: `PLAN_CODE_EXISTS`, `VALIDATION_ERROR`

#### `PATCH /api/v1/subscriptions/plans/:planId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Body: partial plan payload
- Success `200`: updated plan
- Errors: `PLAN_NOT_FOUND`, `VALIDATION_ERROR`

#### `DELETE /api/v1/subscriptions/plans/:planId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Success `200`: deactivated plan
- Errors: `PLAN_NOT_FOUND`

### Organization Subscription Management (Super Admin)

#### `GET /api/v1/subscriptions/organizations/:organizationId/current`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Success `200`: current active subscription or `null`
- Errors: `ORG_NOT_FOUND`

#### `PUT /api/v1/subscriptions/organizations/:organizationId/current`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Body:

```json
{
  "planId": "75da58f3-ebc2-49ac-a182-93412144286e",
  "status": "ACTIVE",
  "startDate": "2026-03-23",
  "endDate": null,
  "trialEndsAt": null,
  "autoRenew": true,
  "seats": 15,
  "includedFeatures": [],
  "excludedFeatures": [],
  "metadata": {
    "ticket": "OPS-124"
  }
}
```

- Success `201`: assigned subscription (previous active subscription, if any, is canceled)
- Errors: `ORG_NOT_FOUND`, `PLAN_NOT_FOUND`, `PLAN_INACTIVE`, `VALIDATION_ERROR`

#### `PATCH /api/v1/subscriptions/organizations/:organizationId/current`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Body: partial subscription payload
- Success `200`: updated subscription
- Errors: `SUBSCRIPTION_NOT_FOUND`, `VALIDATION_ERROR`

#### `POST /api/v1/subscriptions/organizations/:organizationId/current/cancel`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Success `200`: canceled subscription
- Errors: `SUBSCRIPTION_NOT_FOUND`

### Self-Service Subscription Views (Organization)

#### `GET /api/v1/subscriptions/me/current`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`
- Success `200`: current org subscription (or `null`)
- Errors: `ORG_REQUIRED`, `ORG_NOT_FOUND`

#### `GET /api/v1/subscriptions/me/features/:featureKey`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`
- Success `200`: feature access bool
- Response data:

```json
{
  "featureKey": "FINANCE_MANAGEMENT",
  "hasAccess": true
}
```

- Errors: `ORG_REQUIRED`, `ORG_NOT_FOUND`
