import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { tenantGuard } from '../../shared/middleware/tenant.js';
import { prisma } from '../../shared/db/prisma.js';
import { ok } from '../../shared/http/response.js';
import { HttpError } from '../../shared/http/httpError.js';

const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const organizationRouter = Router();
organizationRouter.use(authGuard, tenantGuard);

organizationRouter.get('/me', allowRoles(ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = req.auth.organizationId;
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!org) {
    throw new HttpError(404, 'Organization not found', 'ORG_NOT_FOUND');
  }

  res.json(ok(org));
});
