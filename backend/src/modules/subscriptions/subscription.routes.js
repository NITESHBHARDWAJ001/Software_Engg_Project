import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import { HttpError } from '../../shared/http/httpError.js';
import { ok } from '../../shared/http/response.js';
import {
  mockCheckoutSchema,
  organizationSubscriptionCreateSchema,
  organizationSubscriptionUpdateSchema,
  planCreateSchema,
  planOrganizationsQuerySchema,
  planListQuerySchema,
  planUpdateSchema,
} from './subscription.schemas.js';
import { subscriptionService } from './subscription.service.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const subscriptionRouter = Router();
subscriptionRouter.use(authGuard, tenantGuard);

subscriptionRouter.get('/plans', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const query = planListQuerySchema.parse(req.query);
  const plans = await subscriptionService.listPlans(query.activeOnly);
  res.json(ok(plans));
});

subscriptionRouter.post('/plans', allowRoles(SUPER_ADMIN), async (req, res) => {
  const payload = planCreateSchema.parse(req.body);
  const plan = await subscriptionService.createPlan(req.auth.userId, payload);
  res.status(201).json(ok(plan, 'Subscription plan created'));
});

subscriptionRouter.patch('/plans/:planId', allowRoles(SUPER_ADMIN), async (req, res) => {
  const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
  const payload = planUpdateSchema.parse(req.body);

  const plan = await subscriptionService.updatePlan(planId, req.auth.userId, payload);
  res.json(ok(plan, 'Subscription plan updated'));
});

subscriptionRouter.delete('/plans/:planId', allowRoles(SUPER_ADMIN), async (req, res) => {
  const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
  const plan = await subscriptionService.deactivatePlan(planId, req.auth.userId);
  res.json(ok(plan, 'Subscription plan deactivated'));
});

subscriptionRouter.get('/plans/:planId/organizations', allowRoles(SUPER_ADMIN), async (req, res) => {
  const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
  const query = planOrganizationsQuerySchema.parse(req.query);
  const organizations = await subscriptionService.listOrganizationsOnPlan(planId, query.includeInactive);
  res.json(ok(organizations));
});

subscriptionRouter.get('/organizations/:organizationId/current', allowRoles(SUPER_ADMIN), async (req, res) => {
  const organizationId = Array.isArray(req.params.organizationId)
    ? req.params.organizationId[0]
    : req.params.organizationId;

  const subscription = await subscriptionService.getOrganizationCurrentSubscription(organizationId);
  res.json(ok(subscription));
});

subscriptionRouter.put('/organizations/:organizationId/current', allowRoles(SUPER_ADMIN), async (req, res) => {
  const organizationId = Array.isArray(req.params.organizationId)
    ? req.params.organizationId[0]
    : req.params.organizationId;
  const payload = organizationSubscriptionCreateSchema.parse(req.body);

  const subscription = await subscriptionService.assignPlanToOrganization(
    organizationId,
    req.auth.userId,
    payload,
  );

  res.status(201).json(ok(subscription, 'Organization subscription assigned'));
});

subscriptionRouter.patch('/organizations/:organizationId/current', allowRoles(SUPER_ADMIN), async (req, res) => {
  const organizationId = Array.isArray(req.params.organizationId)
    ? req.params.organizationId[0]
    : req.params.organizationId;
  const payload = organizationSubscriptionUpdateSchema.parse(req.body);

  const subscription = await subscriptionService.updateOrganizationCurrentSubscription(
    organizationId,
    req.auth.userId,
    payload,
  );

  res.json(ok(subscription, 'Organization subscription updated'));
});

subscriptionRouter.post('/organizations/:organizationId/current/cancel', allowRoles(SUPER_ADMIN), async (req, res) => {
  const organizationId = Array.isArray(req.params.organizationId)
    ? req.params.organizationId[0]
    : req.params.organizationId;

  const subscription = await subscriptionService.cancelOrganizationCurrentSubscription(
    organizationId,
    req.auth.userId,
  );

  res.json(ok(subscription, 'Organization subscription canceled'));
});

subscriptionRouter.get('/me/current', allowRoles(ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const subscription = await subscriptionService.getOrganizationCurrentSubscription(organizationId);
  res.json(ok(subscription));
});

subscriptionRouter.get('/me/features/:featureKey', allowRoles(ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const featureKey = Array.isArray(req.params.featureKey) ? req.params.featureKey[0] : req.params.featureKey;
  const hasAccess = await subscriptionService.hasFeatureAccess(organizationId, featureKey);

  res.json(ok({ featureKey, hasAccess }));
});

subscriptionRouter.post('/mock-checkout', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const payload = mockCheckoutSchema.parse(req.body);

  const scopedOrganizationId = getOrganizationScope(req);
  const organizationId = req.auth.role === SUPER_ADMIN ? payload.organizationId : scopedOrganizationId;

  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const result = await subscriptionService.mockCheckoutAndActivate(organizationId, req.auth.userId, payload);
  res.status(201).json(ok(result, 'Mock checkout completed'));
});
