import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../shared/http/httpError.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    subscriptionPlan: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    organizationSubscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn) => fn(prismaMock)),
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({ prisma: prismaMock }));

import { subscriptionService } from './subscription.service.js';

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists plans with numeric price conversion', async () => {
    prismaMock.subscriptionPlan.findMany.mockResolvedValue([
      { id: 'p1', price: { toString: () => '999' } },
    ]);

    const plans = await subscriptionService.listPlans(true);
    expect(plans[0].price).toBe(999);
  });

  it('throws on duplicate plan code', async () => {
    prismaMock.subscriptionPlan.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      subscriptionService.createPlan('u1', {
        name: 'Growth',
        code: 'GROWTH',
        billingCycle: 'MONTHLY',
        price: 999,
        currency: 'INR',
        isActive: true,
        features: [],
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('returns false for feature when no subscription exists', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prismaMock.organizationSubscription.findFirst.mockResolvedValue(null);

    const result = await subscriptionService.hasFeatureAccess('org-1', 'TASK_MANAGEMENT');
    expect(result).toBe(false);
  });

  it('assigns subscription and computes effective features', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prismaMock.subscriptionPlan.findUnique.mockResolvedValue({ id: 'p1', isActive: true });
    prismaMock.organizationSubscription.findFirst.mockResolvedValue(null);
    prismaMock.organizationSubscription.create.mockResolvedValue({
      id: 's1',
      organizationId: 'org-1',
      planId: 'p1',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: null,
      trialEndsAt: null,
      canceledAt: null,
      autoRenew: true,
      seats: null,
      includedFeatures: ['TASK_MANAGEMENT'],
      excludedFeatures: ['FINANCE_MANAGEMENT'],
      metadata: null,
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: {
        id: 'p1',
        code: 'GROWTH',
        name: 'Growth',
        price: { toString: () => '999' },
        currency: 'INR',
        features: ['FINANCE_MANAGEMENT', 'CUSTOMER_MANAGEMENT'],
      },
    });

    const sub = await subscriptionService.assignPlanToOrganization('org-1', 'u1', {
      planId: 'p1',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: undefined,
      trialEndsAt: undefined,
      autoRenew: true,
      seats: undefined,
      includedFeatures: ['TASK_MANAGEMENT'],
      excludedFeatures: ['FINANCE_MANAGEMENT'],
      metadata: undefined,
    });

    expect(sub.effectiveFeatures).toContain('CUSTOMER_MANAGEMENT');
    expect(sub.effectiveFeatures).toContain('TASK_MANAGEMENT');
    expect(sub.effectiveFeatures).not.toContain('FINANCE_MANAGEMENT');
  });
});
