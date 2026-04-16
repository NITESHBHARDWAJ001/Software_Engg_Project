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

const getStaffModuleOverride = async (organizationId, userId, moduleKey) => {
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
  const modulePolicy = employeePolicies[moduleKey];

  if (!modulePolicy || typeof modulePolicy !== 'object') return null;
  return {
    allowed: modulePolicy.allowed !== false,
    limits: modulePolicy.limits && typeof modulePolicy.limits === 'object' ? modulePolicy.limits : {},
  };
};

export const requireModuleAccess = (moduleKey) => {
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
      const override = await getStaffModuleOverride(organizationId, req.auth.userId, moduleKey);
      if (override && !override.allowed) {
        throw new HttpError(403, `Module ${moduleKey} is disabled for this employee`, 'MODULE_FORBIDDEN');
      }

      // Default employee behavior: full access unless explicitly disabled.
      req.moduleLimits = override?.limits || {};
      next();
      return;
    }

    const policy = await subscriptionService.getModuleAccessPolicy(
      organizationId,
      req.auth.role,
      moduleKey,
    );

    if (!policy.allowed) {
      throw new HttpError(403, `Module ${moduleKey} is disabled for your role`, 'MODULE_FORBIDDEN');
    }

    req.moduleLimits = policy.limits || {};
    next();
  };
};

export const requireModuleLimit = (limitKey, currentValueResolver) => {
  return async (req, _res, next) => {
    if (!req.auth || req.auth.role === SUPER_ADMIN || req.auth.role === ORG_ADMIN) {
      next();
      return;
    }

    const limits = req.moduleLimits || {};
    const configuredLimit = Number(limits[limitKey]);

    if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) {
      next();
      return;
    }

    const currentValue = await currentValueResolver(req);
    if (currentValue > configuredLimit) {
      throw new HttpError(
        403,
        `Module limit exceeded for ${limitKey}: ${currentValue}/${configuredLimit}`,
        'MODULE_LIMIT_EXCEEDED',
      );
    }

    next();
  };
};
