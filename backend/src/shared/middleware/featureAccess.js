import { HttpError } from '../http/httpError.js';
import { getOrganizationScope } from './tenant.js';
import { subscriptionService } from '../../modules/subscriptions/subscription.service.js';
import { prisma } from '../db/prisma.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';
const ACTIVE_STATES = ['TRIALING', 'ACTIVE', 'PAST_DUE'];
const MODULE_ACCESS_USER_METADATA_KEY = 'moduleAccessUserPolicies';

const getUserModulePoliciesFromMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return {};
  const policies = metadata[MODULE_ACCESS_USER_METADATA_KEY];
  if (!policies || typeof policies !== 'object') return {};
  return policies;
};

const getStaffFeatureOverride = async (organizationId, userId, featureKey) => {
  const current = await prisma.organizationSubscription.findFirst({
    where: {
      organizationId,
      status: { in: ACTIVE_STATES },
    },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    select: { metadata: true },
  });

  const metadata = current?.metadata && typeof current.metadata === 'object' ? current.metadata : {};
  const userPolicies = getUserModulePoliciesFromMetadata(metadata);
  const employeePolicies = userPolicies[userId] && typeof userPolicies[userId] === 'object' ? userPolicies[userId] : {};
  const modulePolicy = employeePolicies[featureKey];

  if (!modulePolicy || typeof modulePolicy !== 'object') return undefined;
  return modulePolicy.allowed !== false;
};

export const requireFeatureAccess = (featureKey) => {
  return async (req, _res, next) => {
    if (!req.auth) {
      throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    if (req.auth.role === SUPER_ADMIN || req.auth.role === ORG_ADMIN) {
      next();
      return;
    }

    const organizationId = getOrganizationScope(req);
    if (!organizationId) {
      throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
    }

    if (req.auth.role === STAFF) {
      const overrideAllowed = await getStaffFeatureOverride(organizationId, req.auth.userId, featureKey);
      if (overrideAllowed === false) {
        throw new HttpError(403, `Feature ${featureKey} is disabled for this employee`, 'FEATURE_FORBIDDEN');
      }

      // Default employee behavior: full access unless explicitly disabled.
      next();
      return;
    }

    const subscription = await subscriptionService.getOrganizationCurrentSubscription(organizationId);
    // Legacy-safe mode: if an organization has no subscription yet, allow access.
    if (!subscription) {
      next();
      return;
    }

    const hasAccess = await subscriptionService.hasFeatureAccess(organizationId, featureKey);
    if (!hasAccess) {
      throw new HttpError(403, `Feature ${featureKey} is not enabled for your subscription`, 'FEATURE_FORBIDDEN');
    }

    next();
  };
};
