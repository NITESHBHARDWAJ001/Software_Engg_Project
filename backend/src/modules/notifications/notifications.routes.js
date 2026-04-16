import { Router } from 'express';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { ok } from '../../shared/http/response.js';
import { HttpError } from '../../shared/http/httpError.js';
import { notificationService } from './notifications.service.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';

export const notificationRouter = Router();

notificationRouter.use(authGuard);

notificationRouter.get('/', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const readParam = req.query.read;
  const read =
    readParam === undefined ? undefined : String(readParam).toLowerCase() === 'true';

  const notifications = await notificationService.list(req.auth.userId, read);
  res.json(ok(notifications));
});

notificationRouter.post('/', allowRoles(SUPER_ADMIN, ORG_ADMIN), async (req, res) => {
  const { userId, title, message, type, link } = req.body ?? {};

  if (!userId || !title || !message || !type) {
    throw new HttpError(400, 'userId, title, message, and type are required', 'NOTIFICATION_INVALID');
  }

  const notification = await notificationService.create({
    userId,
    title,
    message,
    type,
    link,
  });

  res.status(201).json(ok(notification, 'Notification created'));
});

notificationRouter.patch('/read-all', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const result = await notificationService.markAllAsRead(req.auth.userId);
  res.json(ok(result, 'Notifications marked as read'));
});

notificationRouter.patch('/:id/read', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const notification = await notificationService.markAsRead(req.auth.userId, id);
  res.json(ok(notification, 'Notification marked as read'));
});

notificationRouter.delete('/:id', allowRoles(SUPER_ADMIN, ORG_ADMIN, STAFF), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await notificationService.remove(req.auth.userId, id);
  res.json(ok(result, 'Notification deleted'));
});