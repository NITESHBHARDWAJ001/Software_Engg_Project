import { randomUUID } from 'crypto';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

let notificationInfraReady;

const ensureNotificationInfra = async () => {
  if (!notificationInfraReady) {
    notificationInfraReady = (async () => {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "NotificationType" AS ENUM (
            'TASK_ASSIGNED',
            'TASK_UPDATED',
            'EXHIBITION_CREATED',
            'EXHIBITION_UPDATED',
            'EXHIBITION_ASSIGNED'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "type" "NotificationType" NOT NULL,
          "read" BOOLEAN NOT NULL DEFAULT FALSE,
          "link" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification" ("userId", "read")',
      );
      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification" ("userId", "createdAt")',
      );
    })();
  }

  return notificationInfraReady;
};

const mapNotification = (notification) => ({
  id: notification.id,
  userId: notification.userId,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  read: notification.read,
  link: notification.link ?? undefined,
  createdAt: new Date(notification.createdAt).toISOString(),
  updatedAt: new Date(notification.updatedAt).toISOString(),
});

export const notificationService = {
  async list(userId, read) {
    await ensureNotificationInfra();

    if (read === undefined) {
      const notifications = await prisma.$queryRaw`
        SELECT
          "id",
          "userId",
          "title",
          "message",
          "type",
          "read",
          "link",
          "createdAt",
          "updatedAt"
        FROM "Notification"
        WHERE "userId" = ${userId}
        ORDER BY "read" ASC, "createdAt" DESC
      `;

      return notifications.map(mapNotification);
    }

    const notifications = await prisma.$queryRaw`
      SELECT
        "id",
        "userId",
        "title",
        "message",
        "type",
        "read",
        "link",
        "createdAt",
        "updatedAt"
      FROM "Notification"
      WHERE "userId" = ${userId} AND "read" = ${read}
      ORDER BY "read" ASC, "createdAt" DESC
    `;

    return notifications.map(mapNotification);
  },

  async create(data) {
    await ensureNotificationInfra();

    const [notification] = await prisma.$queryRaw`
      INSERT INTO "Notification" (
        "id",
        "userId",
        "title",
        "message",
        "type",
        "read",
        "link",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${data.userId},
        ${data.title},
        ${data.message},
        ${data.type}::"NotificationType",
        ${data.read ?? false},
        ${data.link ?? null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING "id", "userId", "title", "message", "type", "read", "link", "createdAt", "updatedAt"
    `;

    return mapNotification(notification);
  },

  async markAsRead(userId, notificationId) {
    await ensureNotificationInfra();

    const [notification] = await prisma.$queryRaw`
      UPDATE "Notification"
      SET "read" = TRUE,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${notificationId} AND "userId" = ${userId}
      RETURNING "id", "userId", "title", "message", "type", "read", "link", "createdAt", "updatedAt"
    `;

    if (!notification) {
      throw new HttpError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    return mapNotification(notification);
  },

  async markAllAsRead(userId) {
    await ensureNotificationInfra();

    const result = await prisma.$executeRaw`
      UPDATE "Notification"
      SET "read" = TRUE,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${userId} AND "read" = FALSE
    `;

    return { updatedCount: Number(result) };
  },

  async remove(userId, notificationId) {
    await ensureNotificationInfra();

    const result = await prisma.$executeRaw`
      DELETE FROM "Notification"
      WHERE "id" = ${notificationId} AND "userId" = ${userId}
    `;

    if (!Number(result)) {
      throw new HttpError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    return { id: notificationId };
  },
};