import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const ACTIVE_STATES = ['TRIALING', 'ACTIVE', 'PAST_DUE'];

const toNumber = (value) => Number(value ?? 0);

const mapPlan = (plan) => ({
  ...plan,
  price: toNumber(plan.price),
});

const mapSubscription = (subscription) => {
  if (!subscription) return null;

  return {
    ...subscription,
    plan: subscription.plan ? mapPlan(subscription.plan) : undefined,
  };
};

const resolveEffectiveFeatures = (subscription) => {
  if (!subscription) return [];

  const baseFeatures = new Set(subscription.plan?.features ?? []);
  for (const feature of subscription.includedFeatures ?? []) {
    baseFeatures.add(feature);
  }
  for (const feature of subscription.excludedFeatures ?? []) {
    baseFeatures.delete(feature);
  }

  return [...baseFeatures];
};

export const subscriptionService = {
  async listPlans(activeOnly = false) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }, { createdAt: 'asc' }],
    });

    return plans.map(mapPlan);
  },

  async createPlan(userId, payload) {
    try {
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: payload.name,
          code: payload.code.toUpperCase(),
          description: payload.description,
          billingCycle: payload.billingCycle,
          price: new Prisma.Decimal(payload.price),
          currency: payload.currency.toUpperCase(),
          isActive: payload.isActive,
          features: payload.features,
          limits: payload.limits,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return mapPlan(plan);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpError(409, 'Subscription plan code already exists', 'PLAN_CODE_EXISTS');
      }
      throw error;
    }
  },

  async updatePlan(planId, userId, payload) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw new HttpError(404, 'Subscription plan not found', 'PLAN_NOT_FOUND');
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name: payload.name,
        code: payload.code?.toUpperCase(),
        description: payload.description,
        billingCycle: payload.billingCycle,
        price: payload.price !== undefined ? new Prisma.Decimal(payload.price) : undefined,
        currency: payload.currency?.toUpperCase(),
        isActive: payload.isActive,
        features: payload.features,
        limits: payload.limits,
        updatedBy: userId,
      },
    });

    return mapPlan(plan);
  },

  async deactivatePlan(planId, userId) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw new HttpError(404, 'Subscription plan not found', 'PLAN_NOT_FOUND');
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    return mapPlan(plan);
  },

  async getOrganizationCurrentSubscription(organizationId) {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      throw new HttpError(404, 'Organization not found', 'ORG_NOT_FOUND');
    }

    const subscription = await prisma.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ACTIVE_STATES },
      },
      include: {
        plan: true,
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });

    const mapped = mapSubscription(subscription);
    if (!mapped) return null;

    return {
      ...mapped,
      effectiveFeatures: resolveEffectiveFeatures(mapped),
    };
  },

  async assignPlanToOrganization(organizationId, userId, payload) {
    const [organization, plan] = await Promise.all([
      prisma.organization.findUnique({ where: { id: organizationId } }),
      prisma.subscriptionPlan.findUnique({ where: { id: payload.planId } }),
    ]);

    if (!organization) {
      throw new HttpError(404, 'Organization not found', 'ORG_NOT_FOUND');
    }
    if (!plan) {
      throw new HttpError(404, 'Subscription plan not found', 'PLAN_NOT_FOUND');
    }
    if (!plan.isActive) {
      throw new HttpError(400, 'Cannot assign an inactive subscription plan', 'PLAN_INACTIVE');
    }

    const subscription = await prisma.$transaction(async (tx) => {
      const current = await tx.organizationSubscription.findFirst({
        where: {
          organizationId,
          status: { in: ACTIVE_STATES },
        },
        orderBy: { startDate: 'desc' },
      });

      if (current) {
        await tx.organizationSubscription.update({
          where: { id: current.id },
          data: {
            status: 'CANCELED',
            endDate: new Date(),
            canceledAt: new Date(),
            updatedBy: userId,
          },
        });
      }

      return tx.organizationSubscription.create({
        data: {
          organizationId,
          planId: payload.planId,
          status: payload.status,
          startDate: payload.startDate,
          endDate: payload.endDate,
          trialEndsAt: payload.trialEndsAt,
          autoRenew: payload.autoRenew,
          seats: payload.seats,
          includedFeatures: payload.includedFeatures,
          excludedFeatures: payload.excludedFeatures,
          metadata: payload.metadata,
          createdBy: userId,
          updatedBy: userId,
        },
        include: { plan: true },
      });
    });

    const mapped = mapSubscription(subscription);
    return {
      ...mapped,
      effectiveFeatures: resolveEffectiveFeatures(mapped),
    };
  },

  async updateOrganizationCurrentSubscription(organizationId, userId, payload) {
    const current = await prisma.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ACTIVE_STATES },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!current) {
      throw new HttpError(404, 'No active subscription found for organization', 'SUBSCRIPTION_NOT_FOUND');
    }

    const updated = await prisma.organizationSubscription.update({
      where: { id: current.id },
      data: {
        status: payload.status,
        startDate: payload.startDate,
        endDate: payload.endDate,
        trialEndsAt: payload.trialEndsAt,
        autoRenew: payload.autoRenew,
        seats: payload.seats,
        includedFeatures: payload.includedFeatures,
        excludedFeatures: payload.excludedFeatures,
        metadata: payload.metadata,
        updatedBy: userId,
      },
      include: { plan: true },
    });

    const mapped = mapSubscription(updated);
    return {
      ...mapped,
      effectiveFeatures: resolveEffectiveFeatures(mapped),
    };
  },

  async cancelOrganizationCurrentSubscription(organizationId, userId) {
    const current = await prisma.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ACTIVE_STATES },
      },
      orderBy: { startDate: 'desc' },
      include: { plan: true },
    });

    if (!current) {
      throw new HttpError(404, 'No active subscription found for organization', 'SUBSCRIPTION_NOT_FOUND');
    }

    const canceled = await prisma.organizationSubscription.update({
      where: { id: current.id },
      data: {
        status: 'CANCELED',
        endDate: new Date(),
        canceledAt: new Date(),
        updatedBy: userId,
      },
      include: { plan: true },
    });

    const mapped = mapSubscription(canceled);
    return {
      ...mapped,
      effectiveFeatures: resolveEffectiveFeatures(mapped),
    };
  },

  async hasFeatureAccess(organizationId, featureKey) {
    const current = await this.getOrganizationCurrentSubscription(organizationId);
    if (!current) return false;

    if (current.endDate && new Date(current.endDate) < new Date()) {
      return false;
    }

    return current.effectiveFeatures.includes(featureKey);
  },
};
