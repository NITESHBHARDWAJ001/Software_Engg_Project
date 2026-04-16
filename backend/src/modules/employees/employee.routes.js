import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import { HttpError } from '../../shared/http/httpError.js';
import { ok, paged } from '../../shared/http/response.js';
import {
  employeeCreateSchema,
  employeeListQuerySchema,
  employeeModuleAccessUpdateSchema,
  employeeStatusSchema,
  employeeUpdateSchema,
} from './employee.schemas.js';
import { employeeService } from './employee.service.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';

export const employeeRouter = Router();

employeeRouter.use(authGuard, tenantGuard);

employeeRouter.get('/', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const query = employeeListQuerySchema.parse(req.query);
  const { employees, total } = await employeeService.list(
    organizationId,
    query.page,
    query.pageSize,
    query.search,
    query.status,
    query.employmentType,
  );

  res.json(paged(employees, query.page, query.pageSize, total));
});

employeeRouter.post('/', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const payload = employeeCreateSchema.parse(req.body);
  const employee = await employeeService.create(organizationId, payload);

  res.status(201).json(ok(employee, 'Employee created successfully'));
});

employeeRouter.patch('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = employeeUpdateSchema.parse(req.body);
  const employee = await employeeService.update(organizationId, id, payload);

  res.json(ok(employee, 'Employee updated successfully'));
});

employeeRouter.patch('/:id/status', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = employeeStatusSchema.parse(req.body);
  const employee = await employeeService.setStatus(organizationId, id, payload.isActive);

  res.json(ok(employee, payload.isActive ? 'Employee activated' : 'Employee deactivated'));
});

employeeRouter.get('/:id/module-access', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await employeeService.getModuleAccess(organizationId, id);

  res.json(ok(result));
});

employeeRouter.patch('/:id/module-access', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const organizationId = getOrganizationScope(req);
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = employeeModuleAccessUpdateSchema.parse(req.body);
  const result = await employeeService.updateModuleAccess(organizationId, req.auth.userId, id, payload.moduleAccessPolicies);

  res.json(ok(result, 'Employee module access updated successfully'));
});
