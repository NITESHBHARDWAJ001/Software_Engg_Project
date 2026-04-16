import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const ACTIVE_STATES = ['TRIALING', 'ACTIVE', 'PAST_DUE'];
const FREE_PLAN_CODE = 'FREE';
const FREE_PLAN_FEATURES = ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'ANALYTICS_MANAGEMENT'];

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

const MODULE_ACCESS_METADATA_KEY = 'moduleAccessPolicies';

const normalizeRoleKey = (role) => String(role || '').toUpperCase();

const getModulePoliciesFromMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return {};
  const policies = metadata[MODULE_ACCESS_METADATA_KEY];
  if (!policies || typeof policies !== 'object') return {};
  return policies;
};

export const subscriptionService = {
  async ensureFreePlan(userId) {
    const actorId = userId ?? 'SYSTEM';
    const plan = await prisma.subscriptionPlan.upsert({
      where: { code: FREE_PLAN_CODE },
      update: {
        name: 'Free',
        description: 'Default onboarding plan for newly joined organizations.',
        billingCycle: 'MONTHLY',
        price: new Prisma.Decimal(0),
        currency: 'INR',
        isActive: true,
        updatedBy: actorId,
      },
      create: {
        name: 'Free',
        code: FREE_PLAN_CODE,
        description: 'Default onboarding plan for newly joined organizations.',
        billingCycle: 'MONTHLY',
        price: new Prisma.Decimal(0),
        currency: 'INR',
        isActive: true,
        features: FREE_PLAN_FEATURES,
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

    return mapPlan(plan);
  },

  async assignDefaultFreePlan(organizationId, userId) {
    const freePlan = await this.ensureFreePlan(userId);
    return this.assignPlanToOrganization(organizationId, userId, {
      planId: freePlan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: undefined,
      trialEndsAt: undefined,
      autoRenew: true,
      seats: 2,
      includedFeatures: [],
      excludedFeatures: [],
      metadata: {
        onboarding: 'DEFAULT_FREE_PLAN',
      },
    });
  },

  async listPlans(activeOnly = false, page = 1, pageSize = 20) {
    const where = activeOnly ? { isActive: true } : {};
    const [total, plans] = await Promise.all([
      prisma.subscriptionPlan.count({ where }),
      prisma.subscriptionPlan.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { price: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      plans: plans.map(mapPlan),
      total,
    };
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

  async getModuleAccessPolicy(organizationId, role, moduleKey) {
    const current = await this.getOrganizationCurrentSubscription(organizationId);
    if (!current) {
      return {
        allowed: true,
        limits: {},
      };
    }

    const roleKey = normalizeRoleKey(role);
    const policies = getModulePoliciesFromMetadata(current.metadata);
    const rolePolicies = policies[roleKey] ?? {};
    const modulePolicy = rolePolicies[moduleKey] ?? null;

    if (!modulePolicy) {
      return {
        allowed: true,
        limits: {},
      };
    }

    return {
      allowed: modulePolicy.allowed !== false,
      limits: modulePolicy.limits && typeof modulePolicy.limits === 'object' ? modulePolicy.limits : {},
    };
  },

  async updateOrganizationModuleAccess(organizationId, actorUserId, payload) {
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

    const existingMetadata = current.metadata && typeof current.metadata === 'object' ? current.metadata : {};
    const mergedPolicies = {
      ...getModulePoliciesFromMetadata(existingMetadata),
      ...payload.moduleAccessPolicies,
    };

    const updated = await prisma.organizationSubscription.update({
      where: { id: current.id },
      data: {
        metadata: {
          ...existingMetadata,
          [MODULE_ACCESS_METADATA_KEY]: mergedPolicies,
        },
        updatedBy: actorUserId,
      },
      include: { plan: true },
    });

    const mapped = mapSubscription(updated);
    return {
      ...mapped,
      effectiveFeatures: resolveEffectiveFeatures(mapped),
      moduleAccessPolicies: mergedPolicies,
    };
  },

  async mockCheckoutAndActivate(organizationId, userId, payload) {
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
      throw new HttpError(400, 'Cannot checkout inactive subscription plan', 'PLAN_INACTIVE');
    }

    const baseAmount = toNumber(plan.price);
    const offerType = payload.offer?.type;
    const offerValue = payload.offer?.value ?? 0;
    const computedDiscount = offerType === 'PERCENTAGE'
      ? Math.min(baseAmount, (baseAmount * offerValue) / 100)
      : Math.min(baseAmount, offerValue);
    const finalAmount = Math.max(0, baseAmount - computedDiscount);

    let activatedSubscription = null;
    if (payload.activateNow) {
      activatedSubscription = await this.assignPlanToOrganization(organizationId, userId, {
        planId: payload.planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: undefined,
        trialEndsAt: undefined,
        autoRenew: true,
        seats: undefined,
        includedFeatures: [],
        excludedFeatures: [],
        metadata: {
          checkoutMode: 'MOCK',
          paymentMethod: payload.paymentMethod,
          offerCode: payload.offer?.code,
          offerTitle: payload.offer?.title,
          notes: payload.notes,
        },
      });
    }

    return {
      transactionId: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
      mode: 'MOCK',
      paymentStatus: 'PAID',
      paymentMethod: payload.paymentMethod,
      organizationId,
      plan: mapPlan(plan),
      invoice: {
        currency: plan.currency,
        amount: baseAmount,
        discountAmount: computedDiscount,
        finalAmount,
      },
      offerApplied: payload.offer
        ? {
            code: payload.offer.code,
            title: payload.offer.title,
            type: payload.offer.type,
            value: payload.offer.value,
          }
        : null,
      activatedSubscription,
      processedAt: new Date(),
      message: 'Mock payment successful',
    };
  },

  async listOrganizationsOnPlan(planId, includeInactive = false, page = 1, pageSize = 20) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new HttpError(404, 'Subscription plan not found', 'PLAN_NOT_FOUND');
    }

    const where = {
      planId,
      ...(includeInactive ? {} : { status: { in: ACTIVE_STATES } }),
    };

    const [total, subscriptions] = await Promise.all([
      prisma.organizationSubscription.count({ where }),
      prisma.organizationSubscription.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              email: true,
              phone: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  users: true,
                },
              },
            },
          },
        },
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      organizations: subscriptions.map((row) => ({
      subscriptionId: row.id,
      organizationId: row.organizationId,
      planId: row.planId,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      trialEndsAt: row.trialEndsAt,
      autoRenew: row.autoRenew,
      seats: row.seats,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      organization: {
        id: row.organization.id,
        name: row.organization.name,
        slug: row.organization.slug,
        email: row.organization.email,
        phone: row.organization.phone,
        totalUsers: row.organization._count.users,
        createdAt: row.organization.createdAt,
        updatedAt: row.organization.updatedAt,
      },
      })),
      total,
    };
  },
};
