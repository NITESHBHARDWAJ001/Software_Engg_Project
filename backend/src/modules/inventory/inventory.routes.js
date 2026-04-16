import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import { ok, paged } from '../../shared/http/response.js';
import { HttpError } from '../../shared/http/httpError.js';
import {
  inventoryCreateSchema,
  inventoryListQuerySchema,
  inventoryUpdateSchema,
  stockAdjustmentSchema,
} from './inventory.schemas.js';
import { inventoryService } from './inventory.service.js';
import { requireFeatureAccess } from '../../shared/middleware/featureAccess.js';
import { requireModuleAccess, requireModuleLimit } from '../../shared/middleware/moduleAccess.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const inventoryRouter = Router();
inventoryRouter.use(authGuard, tenantGuard);
inventoryRouter.use(requireFeatureAccess('INVENTORY_MANAGEMENT'));
inventoryRouter.use(requireModuleAccess('INVENTORY_MANAGEMENT'));

inventoryRouter.get('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const query = inventoryListQuerySchema.parse(req.query);
  const { items, total } = await inventoryService.list(orgId, query.page, query.pageSize, query.search, query.category);
  res.json(paged(items, query.page, query.pageSize, total));
});

inventoryRouter.get('/stats', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const stats = await inventoryService.stats(orgId);
  res.json(ok(stats));
});

inventoryRouter.get('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = await inventoryService.getById(orgId, id);
  res.json(ok(item));
});

inventoryRouter.post('/', allowRoles(SUPER_ADMIN, ORG_ADMIN), requireModuleLimit('maxInventoryItems', async (req) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) return 0;
  const { total } = await inventoryService.list(orgId, 1, 1);
  return total + 1;
}), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const payload = inventoryCreateSchema.parse(req.body);
  const item = await inventoryService.create(orgId, req.auth.userId, payload);
  res.status(201).json(ok(item, 'Inventory item created'));
});

inventoryRouter.patch('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = inventoryUpdateSchema.parse(req.body);
  const item = await inventoryService.update(orgId, id, req.auth.userId, payload);
  res.json(ok(item, 'Inventory item updated'));
});

inventoryRouter.post('/:id/adjust-stock', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = stockAdjustmentSchema.parse(req.body);
  const item = await inventoryService.adjustStock(
    orgId,
    id,
    req.auth.userId,
    payload.quantity,
    payload.changeType,
    payload.note,
  );
  res.json(ok(item, 'Stock adjusted'));
});

inventoryRouter.get('/alerts/low-stock', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const alerts = await inventoryService.alerts(orgId);
  res.json(ok(alerts));
});

inventoryRouter.get('/analytics/categories', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const analytics = await inventoryService.categoryAnalytics(orgId);
  res.json(ok(analytics));
});

inventoryRouter.get('/:id/movements', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const movements = await inventoryService.movementHistory(orgId, id);
  res.json(ok(movements));
});
