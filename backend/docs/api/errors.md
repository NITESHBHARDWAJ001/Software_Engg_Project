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

### `EMAIL_ALREADY_EXISTS` (`409`)

Returned when creating an organization and admin email is already used.

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

## Employees

### `EMPLOYEE_NOT_FOUND` (`404`)

Employee does not exist in organization scope.

### `EMPLOYEE_EMAIL_EXISTS` (`409`)

Employee email already exists.

### `EMPLOYEE_INVALID_ROLE` (`400`)

Attempted to create/update employee with unsupported role or invalid role transition.

## Inventory

### `ITEM_NOT_FOUND` (`404`)

Inventory item not found in organization scope.

### `INVALID_STOCK` (`400`)

Stock adjustment would result in negative stock.

### `INVALID_MOVEMENT_FILTER` (`400`)

Invalid `changeType` or movement list query inputs.

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

### `MODULE_ACCESS_UPDATE_FORBIDDEN` (`403`)

Non-`ORG_ADMIN` attempted to update organization module access policies.

## Notifications

### `NOTIFICATION_INVALID` (`400`)

Required notification payload fields are missing.

### `NOTIFICATION_NOT_FOUND` (`404`)

Notification does not exist or does not belong to the current user.

## Analytics

### `ANALYTICS_SERVICE_UNAVAILABLE` (`503`)

Analytics microservice is unavailable or timed out.

### `ANALYTICS_SYNC_FAILED` (`502`)

Stock context or organization analytics synchronization failed.

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
