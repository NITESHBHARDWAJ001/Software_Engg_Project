# Backend Implementation TODO (Express.js + PostgreSQL + Prisma + JWT)

## 0. Goal and Scope
- Build production-ready backend for the multi-tenant SaaS platform.
- Use Express.js, PostgreSQL, Prisma, JWT authentication with refresh-token rotation.
- Implement all modules except sentiment-analysis processing (deferred).
- Keep architecture modular and scalable with best practices from day one.
- Implementation location: `../backend`

## 1. Project Foundation
- [x] Initialize backend app structure (`src/app`, `src/modules`, `src/shared`, `src/config`).
- [ ] Set up TypeScript, ESLint, Prettier, and strict compiler settings.
- [x] Add environment config loader and validation (e.g., Zod).
- [x] Add centralized logger (structured JSON logs with requestId).
- [x] Add error handling middleware with standardized error response format.
- [x] Add health endpoints (`/health/live`, `/health/ready`).
- [x] Add API versioning (`/api/v1`).
- [ ] Add Docker setup for local development.
- [x] Add `.env.example` with all required env variables.

### Acceptance Criteria
- App starts with validated env config.
- Health endpoints return expected statuses.
- Lint and type-check pass in CI.

---

## 2. Database and Prisma Setup
- [x] Configure PostgreSQL connection and Prisma client.
- [x] Define base models with UUID primary keys.
- [x] Add audit fields where needed (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`).
- [x] Add tenant field (`organizationId`) on tenant-owned entities.
- [x] Add unique constraints and composite indexes for common filters.
- [x] Set up Prisma migrations and migration scripts.
- [ ] Create seed strategy:
  - [ ] Base seed (reference data)
  - [ ] Optional dev/demo seed
  - [ ] Super admin bootstrap-safe seed support

### Acceptance Criteria
- Initial migration runs cleanly on empty DB.
- Prisma schema supports tenant boundaries and RBAC relationships.

---

## 3. Multi-Tenancy Guardrails
- [x] Create tenant context middleware (derive org from auth context, not request body).
- [x] Enforce `organizationId` filtering in all tenant-scoped repositories.
- [x] Add service-level guard for cross-tenant access attempts.
- [ ] Add test coverage for tenant isolation across CRUD endpoints.
- [ ] Add admin-only endpoints for super admin that bypass tenant restrictions safely.

### Acceptance Criteria
- No tenant can read/write other tenant data.
- Integration tests prove isolation behavior.

---

## 4. Authentication and Authorization (JWT + Refresh Rotation)
- [x] Implement login endpoint with secure password verification.
- [x] Implement JWT access token generation (short TTL, e.g., 15m).
- [x] Implement refresh token rotation with DB-backed session store.
- [x] Add refresh token reuse detection and family revocation.
- [x] Add logout endpoint (single session and global logout options).
- [x] Add auth middleware for protected routes.
- [x] Implement RBAC middleware/policy checks:
  - [x] `SUPER_ADMIN`
  - [x] `ORG_ADMIN`
  - [x] `STAFF`
- [x] Add password hashing (Argon2id preferred).
- [x] Add rate-limits for auth routes.

### Acceptance Criteria
- Auth flow supports login, refresh, logout securely.
- Token rotation prevents replay abuse.
- Role checks enforced consistently.

---

## 5. Super Admin Bootstrap (Idempotent)
- [x] Add bootstrap command/startup task to create first super admin.
- [x] Read bootstrap credentials from environment/secret manager.
- [x] Ensure idempotent behavior (safe re-run, no duplicates).
- [x] Add bootstrap audit log entry.
- [ ] Add emergency CLI command for super admin reset.

### Acceptance Criteria
- Running bootstrap multiple times does not create duplicates.
- Super admin exists and can access platform-wide endpoints.

---

## 6. Shared Platform Features
- [x] Standard request validation layer (Zod/Joi).
- [x] Standard pagination/filter/sort utility.
- [x] Standard API response wrapper and error codes.
- [ ] Centralized DTO mapping (no raw Prisma models in responses).
- [x] Correlation/request ID propagation in logs.
- [ ] Audit trail utility for sensitive operations.

### Acceptance Criteria
- All endpoints follow common validation and response conventions.

---

## 7. Module: Organization and Team Management
- [ ] Organization profile CRUD.
- [ ] Team member invite flow (email token or invite code).
- [ ] Role assignment and role-change guards.
- [ ] User status management (active/inactive).
- [ ] Organization-level settings endpoints.

### Acceptance Criteria
- ORG_ADMIN can fully manage their org/team.
- STAFF has restricted role-based access.

---

## 8. Module: Customers
- [x] Customers CRUD with tenant scoping.
- [x] Customer search/filter/sort/pagination.
- [ ] Purchase history endpoint per customer.
- [ ] Customer analytics summary endpoint (counts, revenue buckets).
- [x] Soft delete/archive strategy if required by UX.

### Acceptance Criteria
- Customer list and detail pages can be fully powered by API.

---

## 9. Module: Inventory
- [x] Inventory items CRUD.
- [x] Inventory stock updates with validation rules.
- [x] Low stock and critical stock alert endpoints.
- [x] Category-level inventory analytics endpoints.
- [x] Inventory movement/transaction history endpoint.
- [ ] Concurrency handling for stock updates (optimistic lock/versioning).

### Acceptance Criteria
- Stock integrity remains correct under concurrent updates.
- Alerts and analytics are accurate per tenant.

---

## 10. Module: Finance
- [x] Invoice CRUD and state transitions (`DRAFT`, `PENDING`, `PAID`, `OVERDUE`).
- [x] Transaction ledger endpoints.
- [x] Cash flow summary endpoint.
- [x] Revenue/expense trend endpoints.
- [x] Role-based restrictions for sensitive finance actions.

### Acceptance Criteria
- Finance dashboards can be populated directly from backend endpoints.

---

## 11. Module: Exhibitions
- [ ] Exhibition CRUD with lifecycle status.
- [ ] Exhibition lead capture and management endpoints.
- [ ] Exhibition ROI/performance summary endpoint.
- [ ] Filter/search for exhibitions and leads.

### Acceptance Criteria
- Exhibition board and analytics views are API-backed.

---

## 12. Module: Social Media and Marketing (Without Sentiment Processing)
- [ ] Campaign CRUD.
- [ ] Reels/content metadata CRUD.
- [ ] Engagement metrics ingestion endpoint.
- [ ] Competitor benchmarking endpoints.
- [ ] Sentiment placeholders (data contracts only):
  - [ ] `sentimentStatus` field
  - [ ] `sentimentJobs` table
  - [ ] `sentimentResults` table schema (optional now)

### Acceptance Criteria
- Social and campaign dashboards work without live sentiment engine.
- Future sentiment backend can plug in without API contract break.

---

## 13. Security Hardening
- [x] Helmet and strict security headers.
- [x] CORS allowlist per environment.
- [x] Input payload size limits and schema validation.
- [x] Route-level rate limiting strategy.
- [ ] Sensitive action audit logs.
- [ ] Secret management policy (no secrets in repo).
- [ ] Dependency vulnerability scanning in CI.

### Acceptance Criteria
- Security middleware enabled and tested in staging.

---

## 14. Testing Strategy
- [ ] Unit tests for services, auth, policy guards.
- [ ] Integration tests for module routes with test DB.
- [ ] Auth security tests (rotation, reuse detection, revocation).
- [ ] Tenant isolation tests across all tenant modules.
- [ ] Contract tests for frontend-critical endpoints.
- [ ] Test seed and fixtures for deterministic runs.

### Acceptance Criteria
- CI passes with defined coverage threshold.
- Critical auth and tenancy paths have integration coverage.

---

## 15. Observability and Reliability
- [ ] Structured logs with context (`requestId`, `userId`, `organizationId`).
- [ ] Error classification and alerting hooks.
- [ ] Basic metrics (latency, error rate, auth failures).
- [ ] Timeouts/retries for external integrations.
- [ ] Graceful shutdown handling.

### Acceptance Criteria
- Operational issues are diagnosable from logs/metrics.

---

## 16. CI/CD and Deployment
- [ ] CI pipeline stages:
  - [ ] lint
  - [ ] type-check
  - [ ] tests
  - [ ] prisma migration check
- [ ] Build and deploy scripts for environments.
- [ ] Migration strategy for staging/prod.
- [ ] Rollback and backup plan for DB changes.

### Acceptance Criteria
- Automated pipeline blocks broken builds.
- Deploy process is repeatable and documented.

---

## 17. Deferred: Sentiment Analysis Backend (Later Phase)
- [ ] Define queue abstraction and worker skeleton.
- [ ] Add job producer endpoint/service hooks.
- [ ] Implement NLP provider integration.
- [ ] Store and expose sentiment outputs via API.
- [ ] Add retry/dead-letter handling for failed jobs.
- [ ] Add monitoring dashboard for sentiment jobs.

### Acceptance Criteria
- Sentiment processing can be enabled without refactoring existing modules.

---

## 18. Suggested Execution Order (Milestones)
- [x] Milestone 1: Foundation + Prisma + Auth + Bootstrap
- [x] Milestone 2: Organization/Team + Customers + Inventory
- [ ] Milestone 3: Finance + Exhibitions + Social/Campaign baseline
- [ ] Milestone 4: Hardening (security, tests, observability)
- [ ] Milestone 5: Sentiment backend phase

---

## 19. Definition of Done (DoD)
- [ ] All endpoints validated, authenticated, and authorized as required.
- [ ] Tenant isolation verified by tests.
- [ ] Migrations and seeds are deterministic.
- [ ] CI passes for lint, type-check, tests.
- [ ] Logs/metrics are sufficient for production diagnostics.
- [ ] API docs updated and frontend integration verified.
