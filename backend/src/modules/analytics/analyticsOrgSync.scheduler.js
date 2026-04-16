import { prisma } from '../../shared/db/prisma.js';
import { logger } from '../../config/logger.js';
import { analyticsService } from './analytics.service.js';

const DEFAULT_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 15 * 1000;

let intervalRef = null;
let isRunning = false;

const parseIntervalMs = () => {
  const fromEnv = Number(process.env.ANALYTICS_ORG_SYNC_INTERVAL_MS);
  if (Number.isFinite(fromEnv) && fromEnv >= 60 * 1000) {
    return fromEnv;
  }
  return DEFAULT_SYNC_INTERVAL_MS;
};

export const runAnalyticsOrgReconciliation = async () => {
  if (isRunning) {
    logger.info('Analytics org reconciliation already running; skipping overlapping run');
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { analyticsAvailable: false },
          { analyticsSyncedAt: null },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
      },
    });

    let synced = 0;
    let failed = 0;

    for (const org of organizations) {
      try {
        const now = new Date();

        await analyticsService.upsertOrganization({
          orgId: org.id,
          name: org.name,
          slug: org.slug,
          email: org.email,
          phone: org.phone,
        });

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            analyticsAvailable: true,
            analyticsSyncedAt: now,
            analyticsSyncAttemptAt: now,
            analyticsSyncError: null,
          },
        });

        synced += 1;
      } catch (error) {
        await prisma.organization
          .update({
            where: { id: org.id },
            data: {
              analyticsAvailable: false,
              analyticsSyncAttemptAt: new Date(),
              analyticsSyncError: error?.message?.slice(0, 1000) || 'SYNC_FAILED',
            },
          })
          .catch(() => {
            // Ignore status update errors to continue reconciliation.
          });

        failed += 1;
        logger.warn(
          {
            organizationId: org.id,
            error: error?.message,
          },
          'Analytics org reconciliation failed for organization',
        );
      }
    }

    logger.info(
      {
        total: organizations.length,
        synced,
        failed,
        durationMs: Date.now() - startedAt,
      },
      'Analytics org reconciliation completed',
    );
  } catch (error) {
    logger.error({ error: error?.message }, 'Analytics org reconciliation crashed');
  } finally {
    isRunning = false;
  }
};

export const startAnalyticsOrgReconciliationScheduler = () => {
  const intervalMs = parseIntervalMs();

  setTimeout(() => {
    runAnalyticsOrgReconciliation().catch(() => {
      // Errors are already logged inside runAnalyticsOrgReconciliation.
    });
  }, STARTUP_DELAY_MS);

  intervalRef = setInterval(() => {
    runAnalyticsOrgReconciliation().catch(() => {
      // Errors are already logged inside runAnalyticsOrgReconciliation.
    });
  }, intervalMs);

  logger.info({ intervalMs }, 'Analytics org reconciliation scheduler started');
};

export const stopAnalyticsOrgReconciliationScheduler = () => {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
    logger.info('Analytics org reconciliation scheduler stopped');
  }
};
