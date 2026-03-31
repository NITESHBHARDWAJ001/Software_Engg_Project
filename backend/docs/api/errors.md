# API Error Codes and Failure Cases

This catalog covers known, intentional API failures emitted by route guards, business rules, and validation.

## Envelope

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message"
}
```

Validation errors include `details`.

## Authentication and Authorization

### `UNAUTHORIZED` (`401`)

Common causes:

- Missing bearer token
- Invalid or expired access token
- Missing auth context for protected routes

Example:

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### `INVALID_CREDENTIALS` (`401`)

Returned by `POST /api/v1/auth/login` when email/password mismatch or user inactive.

### `INVALID_REFRESH_TOKEN` (`401`)

Refresh token JWT invalid.

### `REFRESH_TOKEN_REVOKED` (`401`)

Refresh token exists but is revoked/expired or belongs to revoked family.

### `FORBIDDEN` (`403`)

Role does not satisfy endpoint policy (`allowRoles`).

## Tenant Scope

### `TENANT_CONTEXT_REQUIRED` (`403`)

Non-super-admin token without `organizationId`.

### `ORG_REQUIRED` (`400`)

Endpoint requires organization scope, but no organization was resolved.

## Feature Access

### `FEATURE_FORBIDDEN` (`403`)

Organization subscription does not include requested feature key.

## Validation

### `VALIDATION_ERROR` (`400`)

Zod validation failure for body/query/params.

Example:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email"]
    },
    "formErrors": []
  }
}
```

## Customers

### `CUSTOMER_NOT_FOUND` (`404`)

Customer does not exist in organization scope.

## Inventory

### `ITEM_NOT_FOUND` (`404`)

Inventory item not found in organization scope.

### `INVALID_STOCK` (`400`)

Stock adjustment would result in negative stock.

## Finance

### `INVOICE_NOT_FOUND` (`404`)

Invoice ID does not exist in organization scope.

### `INVOICE_NUMBER_EXISTS` (`409`)

Duplicate `invoiceNumber` within same organization.

### `INVALID_INVOICE_STATUS_TRANSITION` (`400`)

Status transition violates allowed state machine.

## Tasks

### `TASK_NOT_FOUND` (`404`)

Task ID not found in tenant scope.

## Exhibitions and Leads

### `EXHIBITION_NOT_FOUND` (`404`)

Exhibition not found in organization scope.

### `LEAD_NOT_FOUND` (`404`)

Lead not found in organization scope.

## Subscriptions

### `PLAN_NOT_FOUND` (`404`)

Subscription plan not found.

### `PLAN_CODE_EXISTS` (`409`)

Duplicate plan code.

### `PLAN_INACTIVE` (`400`)

Attempt to assign inactive plan to organization.

### `SUBSCRIPTION_NOT_FOUND` (`404`)

No active subscription exists for organization.

## Organizations

### `ORG_NOT_FOUND` (`404`)

Organization not found for given ID/context.

## Routing and Server

### `NOT_FOUND` (`404`)

Route does not exist.

Example:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Route not found: GET /api/v1/unknown"
}
```

### `INTERNAL_SERVER_ERROR` (`500`)

Unexpected server error; check server logs for request ID and stack details.
