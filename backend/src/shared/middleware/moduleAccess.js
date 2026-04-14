import { HttpError } from '../http/httpError.js';
import { getOrganizationScope } from './tenant.js';
import { subscriptionService } from '../../modules/subscriptions/subscription.service.js';

const SUPER_ADMIN = 'SUPER_ADMIN';

export const requireModuleAccess = (moduleKey) => {
  return async (req, _res, next) => {
    if (!req.auth) {
      throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    if (req.auth.role === SUPER_ADMIN) {
      next();
      return;
    }

    const organizationId = getOrganizationScope(req);
    if (!organizationId) {
      throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
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
    if (!req.auth || req.auth.role === SUPER_ADMIN) {
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
