import { createHash, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';
import { analyticsService } from '../analytics/analytics.service.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const FREE_PLAN_CODE = 'FREE';

const signAccessToken = (payload) => {
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN;
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60,
  });
};

const normalizeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const createUniqueOrganizationSlug = async (organizationName) => {
  const base = normalizeSlug(organizationName) || 'organization';

  let candidate = base;
  let suffix = 2;

  while (true) {
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const ensureFreePlan = async (tx, actorId) => {
  return tx.subscriptionPlan.upsert({
    where: { code: FREE_PLAN_CODE },
    update: {
      isActive: true,
      updatedBy: actorId,
    },
    create: {
      name: 'Free',
      code: FREE_PLAN_CODE,
      description: 'Default onboarding plan for newly joined organizations.',
      billingCycle: 'MONTHLY',
      price: 0,
      currency: 'INR',
      isActive: true,
      features: ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'ANALYTICS_MANAGEMENT'],
      limits: {
        maxUsers: 2,
        maxExhibitions: 2,
        maxCustomers: 200,
        maxInventoryItems: 500,
      },
      createdBy: actorId,
      updatedBy: actorId,
    },
  });
};

export const authService = {
  async register(payload) {
    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existingUser) {
      throw new HttpError(409, 'Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    const slug = await createUniqueOrganizationSlug(payload.organizationName);
    const [firstName, ...rest] = payload.adminName.trim().split(/\s+/);
    const lastName = rest.join(' ') || 'Admin';
    const passwordHash = await argon2.hash(payload.password);
    const organizationId = randomUUID();

    let user;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            id: organizationId,
            name: payload.organizationName,
            slug,
            email: payload.email,
          },
        });

        const createdUser = await tx.user.create({
          data: {
            email: payload.email,
            passwordHash,
            firstName: firstName || 'Org',
            lastName,
            role: 'ORG_ADMIN',
            isActive: true,
            organizationId: organization.id,
          },
        });

        const freePlan = await ensureFreePlan(tx, createdUser.id);
        await tx.organizationSubscription.create({
          data: {
            organizationId: organization.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            startDate: new Date(),
            autoRenew: true,
            seats: 2,
            includedFeatures: [],
            excludedFeatures: [],
            metadata: {
              onboarding: 'DEFAULT_FREE_PLAN',
              createdVia: 'SELF_REGISTER',
            },
            createdBy: createdUser.id,
            updatedBy: createdUser.id,
          },
        });

        return { organization, user: createdUser };
      });

      user = result.user;
    } catch (error) {
      try {
        await analyticsService.deleteOrganization(organizationId);
      } catch {
        // Ignore cleanup failures to surface primary error.
      }
      throw error;
    }

    // Best effort: keep registration successful even if analytics service is temporarily down.
    analyticsService
      .upsertOrganization({
        orgId: organizationId,
        name: payload.organizationName,
        slug,
        email: payload.email,
      })
      .then(async () => {
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            analyticsAvailable: true,
            analyticsSyncedAt: new Date(),
            analyticsSyncAttemptAt: new Date(),
            analyticsSyncError: null,
          },
        });
        logger.info({ organizationId }, 'Analytics org sync succeeded after register');
      })
      .catch(async (error) => {
        await prisma.organization
          .update({
            where: { id: organizationId },
            data: {
              analyticsAvailable: false,
              analyticsSyncAttemptAt: new Date(),
              analyticsSyncError: error?.message?.slice(0, 1000) || 'SYNC_FAILED',
            },
          })
          .catch(() => {
            // Ignore status update errors for non-blocking fallback behavior.
          });

        logger.warn(
          {
            organizationId,
            error: error?.message,
          },
          'Analytics org sync failed after register; daily reconciler will retry',
        );
      });

    const authPayload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = signAccessToken(authPayload);
    const refreshToken = signRefreshToken(authPayload);
    const tokenFamily = randomUUID();

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        tokenFamily,
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  },

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isMatch = await argon2.verify(user.passwordHash, password);
    if (!isMatch) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const tokenFamily = randomUUID();

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        tokenFamily,
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  },

  async refresh(oldRefreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const hashed = hashToken(oldRefreshToken);
    const currentSession = await prisma.refreshSession.findFirst({
      where: {
        tokenHash: hashed,
        userId: decoded.sub,
      },
    });

    if (!currentSession || currentSession.isRevoked || currentSession.expiresAt < new Date()) {
      if (currentSession?.tokenFamily) {
        await prisma.refreshSession.updateMany({
          where: { tokenFamily: currentSession.tokenFamily },
          data: { isRevoked: true },
        });
      }
      throw new HttpError(401, 'Refresh token revoked or expired', 'REFRESH_TOKEN_REVOKED');
    }

    await prisma.refreshSession.update({
      where: { id: currentSession.id },
      data: { isRevoked: true },
    });

    const payload = {
      sub: decoded.sub,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshSession.create({
      data: {
        userId: decoded.sub,
        tokenHash: hashToken(newRefreshToken),
        tokenFamily: currentSession.tokenFamily,
        expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken) {
    const hashed = hashToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash: hashed },
      data: { isRevoked: true },
    });
  },
};
