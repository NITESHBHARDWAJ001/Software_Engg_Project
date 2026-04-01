# Backend API Documentation

This folder contains production-oriented API documentation for the Ethnic Fashion SaaS backend.

## Audience

- Frontend developers integrating the APIs
- QA engineers validating behavior and edge cases
- Backend developers maintaining endpoint contracts

## Base URL

- Local: `http://localhost:4000`
- API prefix: `/api/v1`

## Quick Navigation

- [Endpoint Reference](./endpoints.md)
- [Response Models and Examples](./responses.md)
- [Error Codes and Failure Cases](./errors.md)
- [OpenAPI Spec (Swagger)](./openapi.json)

## Swagger UI

When backend is running, interactive Swagger docs are available at:

- `http://localhost:4000/api-docs`
- Raw OpenAPI JSON: `http://localhost:4000/api-docs.json`

The spec source file is `docs/api/openapi.json`.

## Security Model

### Authentication

Most API routes are protected by bearer authentication.

- Header: `Authorization: Bearer <accessToken>`
- Access token source: `POST /api/v1/auth/login`
- Refresh flow: `POST /api/v1/auth/refresh`

### Multi-Tenant Scope

Organization context is enforced via JWT and tenant middleware.

- For `ORG_ADMIN` and `STAFF`: organization comes from token (`organizationId` claim)
- For `SUPER_ADMIN`: organization can be provided using header `x-organization-id` on tenant-scoped endpoints

If missing where required, API returns:

```json
{
  "success": false,
  "code": "ORG_REQUIRED",
  "message": "Organization context required"
}
```

### Role-Based Access Control

Roles:

- `SUPER_ADMIN`
- `ORG_ADMIN`
- `STAFF`

Every endpoint in [Endpoint Reference](./endpoints.md) lists allowed roles.

### Subscription Feature Gating

Feature-gated modules:

- `CUSTOMER_MANAGEMENT`
- `INVENTORY_MANAGEMENT`
- `FINANCE_MANAGEMENT`
- `TASK_MANAGEMENT`
- `EXHIBITION_MANAGEMENT`

When feature access is blocked:

```json
{
  "success": false,
  "code": "FEATURE_FORBIDDEN",
  "message": "Feature <FEATURE_KEY> is not enabled for your subscription"
}
```

## Standard Response Envelopes

### 1) Standard Success

```json
{
  "success": true,
  "message": "ok",
  "data": {}
}
```

### 2) Paginated Success

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 134,
    "totalPages": 7
  }
}
```

### 3) Error

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### 4) Validation Error

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fieldErrors": {},
    "formErrors": []
  }
}
```

## HTTP Status Usage

- `200 OK`: successful read/update/delete-like operation
- `201 Created`: successful create/assignment operation
- `400 Bad Request`: invalid payload, invalid state transition, missing org context
- `401 Unauthorized`: missing/invalid/expired token or invalid credentials
- `403 Forbidden`: role or feature access denied
- `404 Not Found`: entity does not exist in tenant scope
- `409 Conflict`: uniqueness conflict (for example duplicate invoice number, duplicate plan code)
- `500 Internal Server Error`: unexpected server failure

## Health Endpoints

- `GET /health/live` -> `{ "status": "ok" }`
- `GET /health/ready` -> `{ "status": "ready" }`

## Rate Limiting

Auth routes are rate limited:

- Scope: `/api/v1/auth/*`
- Window: 15 minutes
- Max requests: 30 per client

## API Change Discipline

When changing request/response contracts:

1. Update route/schema/service.
2. Update this documentation folder in same PR.
3. Re-run integration checks (`npm run test:api`, `npm run verify:api`, `npm run verify:security`).
4. Call out contract changes in release notes.
