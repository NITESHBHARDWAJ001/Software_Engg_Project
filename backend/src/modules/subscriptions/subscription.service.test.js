import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    subscriptionPlan: {
      count: vi.fn(),
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
    prismaMock.subscriptionPlan.count.mockResolvedValue(1);
    prismaMock.subscriptionPlan.findMany.mockResolvedValue([
      { id: 'p1', price: { toString: () => '999' } },
    ]);

    const result = await subscriptionService.listPlans(true);
    expect(result.total).toBe(1);
    expect(result.plans[0].price).toBe(999);
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
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'PLAN_CODE_EXISTS',
    });
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

  it('runs mock checkout and returns paid invoice summary', async () => {
    prismaMock.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prismaMock.subscriptionPlan.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Growth',
      code: 'GROWTH',
      billingCycle: 'MONTHLY',
      price: { toString: () => '1000' },
      currency: 'INR',
      isActive: true,
      features: ['TASK_MANAGEMENT'],
    });

    const assignSpy = vi
      .spyOn(subscriptionService, 'assignPlanToOrganization')
      .mockResolvedValue({ id: 's1', effectiveFeatures: ['TASK_MANAGEMENT'] });

    const result = await subscriptionService.mockCheckoutAndActivate('org-1', 'u1', {
      planId: 'p1',
      paymentMethod: 'CARD',
      activateNow: true,
      offer: {
        type: 'PERCENTAGE',
        value: 10,
        code: 'SPRING10',
      },
    });

    expect(result.paymentStatus).toBe('PAID');
    expect(result.invoice.finalAmount).toBe(900);
    expect(assignSpy).toHaveBeenCalledTimes(1);
    assignSpy.mockRestore();
  });
});
