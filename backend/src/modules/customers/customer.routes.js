import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import { customerCreateSchema, customerListQuerySchema, customerUpdateSchema } from './customer.schemas.js';
import { customerService } from './customer.service.js';
import { HttpError } from '../../shared/http/httpError.js';
import { ok, paged } from '../../shared/http/response.js';
import { requireFeatureAccess } from '../../shared/middleware/featureAccess.js';
import { requireModuleAccess } from '../../shared/middleware/moduleAccess.js';
import { customerStatusSchema } from './customer.schemas.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const customerRouter = Router();

customerRouter.use(authGuard, tenantGuard);
customerRouter.use(requireFeatureAccess('CUSTOMER_MANAGEMENT'));
customerRouter.use(requireModuleAccess('CUSTOMER_MANAGEMENT'));

customerRouter.get('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Super admin must query with organization context endpoint', 'ORG_REQUIRED');
  }

  const query = customerListQuerySchema.parse(req.query);
  const { customers, total } = await customerService.list(
    orgId,
    query.page,
    query.pageSize,
    query.search,
    query.status,
  );
  res.json(paged(customers, query.page, query.pageSize, total));
});

customerRouter.get('/stats', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const stats = await customerService.stats(orgId);
  res.json(ok(stats));
});

customerRouter.get('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const customer = await customerService.getById(orgId, id);
  res.json(ok(customer));
});

customerRouter.post('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const payload = customerCreateSchema.parse(req.body);
  const customer = await customerService.create(orgId, req.auth.userId, payload);
  res.status(201).json(ok(customer, 'Customer created'));
});

customerRouter.patch('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = customerUpdateSchema.parse(req.body);
  const customer = await customerService.update(orgId, id, req.auth.userId, payload);
  res.json(ok(customer, 'Customer updated'));
});

customerRouter.patch('/:id/status', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = customerStatusSchema.parse(req.body);
  const customer = await customerService.setArchivedState(orgId, id, req.auth.userId, payload.isArchived);
  res.json(ok(customer, payload.isArchived ? 'Customer deactivated' : 'Customer activated'));
});

customerRouter.delete('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await customerService.archive(orgId, id, req.auth.userId);
  res.json(ok(null, 'Customer deactivated'));
});
