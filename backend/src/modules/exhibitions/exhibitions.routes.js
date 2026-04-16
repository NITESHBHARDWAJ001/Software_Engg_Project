import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import { HttpError } from '../../shared/http/httpError.js';
import { ok, paged } from '../../shared/http/response.js';
import {
  exhibitionCreateSchema,
  exhibitionLeadCreateSchema,
  exhibitionLeadUpdateSchema,
  exhibitionListQuerySchema,
  exhibitionUpdateSchema,
  leadInteractionCreateSchema,
} from './exhibitions.schemas.js';
import { exhibitionsService } from './exhibitions.service.js';
import { requireFeatureAccess } from '../../shared/middleware/featureAccess.js';
import { requireModuleAccess } from '../../shared/middleware/moduleAccess.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const exhibitionsRouter = Router();
exhibitionsRouter.use(authGuard, tenantGuard);
exhibitionsRouter.use(requireFeatureAccess('EXHIBITION_MANAGEMENT'));
exhibitionsRouter.use(requireModuleAccess('EXHIBITION_MANAGEMENT'));

exhibitionsRouter.get('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const query = exhibitionListQuerySchema.parse(req.query);
  const { items, total } = await exhibitionsService.list(orgId, query.page, query.pageSize, query);
  res.json(paged(items, query.page, query.pageSize, total));
});

exhibitionsRouter.get('/stats', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const stats = await exhibitionsService.stats(orgId);
  res.json(ok(stats));
});

exhibitionsRouter.get('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const exhibition = await exhibitionsService.getById(orgId, id);
  res.json(ok(exhibition));
});

exhibitionsRouter.post('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const payload = exhibitionCreateSchema.parse(req.body);
  const exhibition = await exhibitionsService.create(orgId, req.auth.userId, payload);
  res.status(201).json(ok(exhibition, 'Exhibition created'));
});

exhibitionsRouter.patch('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = exhibitionUpdateSchema.parse(req.body);
  const exhibition = await exhibitionsService.update(orgId, id, payload);
  res.json(ok(exhibition, 'Exhibition updated'));
});

exhibitionsRouter.get('/:id/leads', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const leads = await exhibitionsService.listLeads(orgId, id);
  res.json(ok(leads));
});

exhibitionsRouter.post('/:id/leads', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = exhibitionLeadCreateSchema.parse(req.body);
  const lead = await exhibitionsService.createLead(orgId, id, req.auth.userId, payload);
  res.status(201).json(ok(lead, 'Lead added'));
});

exhibitionsRouter.patch('/:id/leads/:leadId', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const leadId = Array.isArray(req.params.leadId) ? req.params.leadId[0] : req.params.leadId;
  const payload = exhibitionLeadUpdateSchema.parse(req.body);
  const lead = await exhibitionsService.updateLead(orgId, id, leadId, payload);
  res.json(ok(lead, 'Lead updated'));
});

exhibitionsRouter.post('/leads/:leadId/interactions', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const leadId = Array.isArray(req.params.leadId) ? req.params.leadId[0] : req.params.leadId;
  const payload = leadInteractionCreateSchema.parse(req.body);
  const interaction = await exhibitionsService.addInteraction(orgId, leadId, req.auth.userId, payload);
  res.status(201).json(ok(interaction, 'Interaction added'));
});

exhibitionsRouter.get('/:id/roi', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const roi = await exhibitionsService.roi(orgId, id);
  res.json(ok(roi));
});
