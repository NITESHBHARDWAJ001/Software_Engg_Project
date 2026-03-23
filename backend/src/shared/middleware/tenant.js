import { HttpError } from '../http/httpError.js';

const SUPER_ADMIN = 'SUPER_ADMIN';

export const tenantGuard = (req, _res, next) => {
  if (!req.auth) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (req.auth.role !== SUPER_ADMIN && !req.auth.organizationId) {
    throw new HttpError(403, 'Missing organization context', 'TENANT_CONTEXT_REQUIRED');
  }

  next();
};

export const getOrganizationScope = (req) => {
  if (!req.auth) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (req.auth.organizationId) {
    return req.auth.organizationId;
  }

  if (req.auth.role === SUPER_ADMIN) {
    const orgHeader = req.headers['x-organization-id'];
    return Array.isArray(orgHeader) ? orgHeader[0] : orgHeader;
  }

  return undefined;
};
