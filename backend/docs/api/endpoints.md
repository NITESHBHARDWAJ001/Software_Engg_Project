# Endpoint Reference

Legend:

- Auth: `Public` or `Bearer`
- Roles: allowed roles for endpoint
- Feature/Module: runtime feature and module guards (when applicable)

## Health

### `GET /health/live`

- Auth: Public
- Roles: N/A

### `GET /health/ready`

- Auth: Public
- Roles: N/A

## Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/login`

- Auth: Public
- Roles: N/A

### `POST /api/v1/auth/refresh`

- Auth: Public
- Roles: N/A

### `POST /api/v1/auth/logout`

- Auth: Public
- Roles: N/A

### `POST /api/v1/auth/register`

- Auth: Public
- Roles: N/A

## Organizations (`/api/v1/organizations`)

### `GET /api/v1/organizations`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Query: `page`, `pageSize`

### `POST /api/v1/organizations`

- Auth: Bearer
- Roles: `SUPER_ADMIN`
- Body: organization + first admin bootstrap payload

### `GET /api/v1/organizations/me`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`

## Customers (`/api/v1/customers`)

- Feature/Module: `CUSTOMER_MANAGEMENT`

### `GET /api/v1/customers`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `search`, `status` (`ACTIVE|INACTIVE|ALL`)

### `GET /api/v1/customers/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Returns: totals, top customers, and RFM summary

### `GET /api/v1/customers/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/customers`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `PATCH /api/v1/customers/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `PATCH /api/v1/customers/:id/status`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body: `{ "isArchived": boolean }`

### `DELETE /api/v1/customers/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Behavior: soft deactivate/archive

## Inventory (`/api/v1/inventory`)

- Feature/Module: `INVENTORY_MANAGEMENT`

### `GET /api/v1/inventory`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `search`, `category`

### `GET /api/v1/inventory/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/inventory/movements`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `page`, `pageSize`, `changeType`, `search`

### `GET /api/v1/inventory/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/inventory`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`
- Guard: module limit `maxInventoryItems`

### `PATCH /api/v1/inventory/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `POST /api/v1/inventory/:id/adjust-stock`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Body: `{ "quantity": number, "changeType": "IN|OUT|ADJUSTMENT", "note"?: string }`

### `GET /api/v1/inventory/alerts/low-stock`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/inventory/analytics/categories`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/inventory/:id/movements`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

## Finance (`/api/v1/finance`)

- Feature/Module: `FINANCE_MANAGEMENT`

### `GET /api/v1/finance/invoices`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/finance/invoices`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `GET /api/v1/finance/invoices/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `PATCH /api/v1/finance/invoices/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/finance/invoices/:id/status`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `GET /api/v1/finance/ledger`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/finance/ledger`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `GET /api/v1/finance/analytics/cash-flow`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/finance/analytics/trends`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/finance/analytics/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

## Tasks (`/api/v1/tasks`)

- Feature/Module: `TASK_MANAGEMENT`

### `GET /api/v1/tasks`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/tasks/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/tasks/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/tasks`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/tasks/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/tasks/:id/status`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `DELETE /api/v1/tasks/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `GET /api/v1/tasks/:id/comments`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/tasks/:id/comments`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

## Exhibitions (`/api/v1/exhibitions`)

- Feature/Module: `EXHIBITION_MANAGEMENT`

### `GET /api/v1/exhibitions`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/exhibitions/stats`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/exhibitions/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/exhibitions`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `PATCH /api/v1/exhibitions/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/exhibitions/:id/leads`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/exhibitions/:id/leads`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `PATCH /api/v1/exhibitions/:id/leads/:leadId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/exhibitions/leads/:leadId/interactions`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/exhibitions/:id/roi`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

## Employees (`/api/v1/employees`)

### `GET /api/v1/employees`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `POST /api/v1/employees`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/employees/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/employees/:id/status`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `GET /api/v1/employees/:id/module-access`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/employees/:id/module-access`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

## Notifications (`/api/v1/notifications`)

### `GET /api/v1/notifications`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
- Query: `read` (`true|false`)

### `POST /api/v1/notifications`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `PATCH /api/v1/notifications/read-all`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `PATCH /api/v1/notifications/:id/read`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `DELETE /api/v1/notifications/:id`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

## Subscriptions (`/api/v1/subscriptions`)

### Plans

#### `GET /api/v1/subscriptions/plans`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

#### `POST /api/v1/subscriptions/plans`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

#### `PATCH /api/v1/subscriptions/plans/:planId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

#### `DELETE /api/v1/subscriptions/plans/:planId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

#### `GET /api/v1/subscriptions/plans/:planId/organizations`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

### Organization Subscription Management

#### `GET /api/v1/subscriptions/organizations/:organizationId/current`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

#### `PUT /api/v1/subscriptions/organizations/:organizationId/current`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

#### `PATCH /api/v1/subscriptions/organizations/:organizationId/current`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

#### `POST /api/v1/subscriptions/organizations/:organizationId/current/cancel`

- Auth: Bearer
- Roles: `SUPER_ADMIN`

### Self-Service

#### `GET /api/v1/subscriptions/me/current`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`

#### `GET /api/v1/subscriptions/me/features/:featureKey`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`

#### `POST /api/v1/subscriptions/mock-checkout`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

#### `GET /api/v1/subscriptions/me/modules/:moduleKey/access`

- Auth: Bearer
- Roles: `ORG_ADMIN`, `STAFF`

#### `PUT /api/v1/subscriptions/me/modules/access`

- Auth: Bearer
- Roles: `ORG_ADMIN`

## Analytics (`/api/v1/analytics`)

- Feature/Module: `ANALYTICS_MANAGEMENT`

### `POST /api/v1/analytics/scrape`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `POST /api/v1/analytics/report`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `POST /api/v1/analytics/generate-ad`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `POST /api/v1/analytics/stock-context/sync`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`

### `GET /api/v1/analytics/stock-context/manual-check`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/analytics/dashboard/competitors`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/analytics/dashboard/competitors/:competitorId`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/analytics/dashboard/pricing-trends`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/analytics/dashboard/sentiment`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/analytics/dashboard/insights`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`

### `GET /api/v1/analytics/dashboard/products`

- Auth: Bearer
- Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `STAFF`
