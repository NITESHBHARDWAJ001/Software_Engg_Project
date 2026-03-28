import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { getOrganizationScope, tenantGuard } from '../../shared/middleware/tenant.js';
import { HttpError } from '../../shared/http/httpError.js';
import { ok, paged } from '../../shared/http/response.js';
import {
  taskCommentCreateSchema,
  taskCreateSchema,
  taskListQuerySchema,
  taskStatusUpdateSchema,
  taskUpdateSchema,
} from './tasks.schemas.js';
import { taskService } from './tasks.service.js';
import { requireFeatureAccess } from '../../shared/middleware/featureAccess.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const taskRouter = Router();
taskRouter.use(authGuard, tenantGuard);
taskRouter.use(requireFeatureAccess('TASK_MANAGEMENT'));

taskRouter.get('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const query = taskListQuerySchema.parse(req.query);
  const { items, total } = await taskService.list(orgId, query.page, query.pageSize, query);
  res.json(paged(items, query.page, query.pageSize, total));
});

taskRouter.get('/stats', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const stats = await taskService.stats(orgId);
  res.json(ok(stats));
});

taskRouter.get('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const task = await taskService.getById(orgId, id);
  res.json(ok(task));
});

taskRouter.post('/', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const payload = taskCreateSchema.parse(req.body);
  const task = await taskService.create(orgId, req.auth.userId, payload);
  res.status(201).json(ok(task, 'Task created'));
});

taskRouter.patch('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = taskUpdateSchema.parse(req.body);
  const task = await taskService.update(orgId, id, payload);
  res.json(ok(task, 'Task updated'));
});

taskRouter.patch('/:id/status', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = taskStatusUpdateSchema.parse(req.body);
  const task = await taskService.updateStatus(orgId, id, payload.status);
  res.json(ok(task, 'Task status updated'));
});

taskRouter.delete('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await taskService.remove(orgId, id);
  res.json(ok({ id }, 'Task deleted'));
});

taskRouter.get('/:id/comments', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const comments = await taskService.listComments(orgId, id);
  res.json(ok(comments));
});

taskRouter.post('/:id/comments', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const orgId = getOrganizationScope(req);
  if (!orgId) throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = taskCommentCreateSchema.parse(req.body);
  const comment = await taskService.addComment(orgId, id, req.auth.userId, payload.content);
  res.status(201).json(ok(comment, 'Comment added'));
});
