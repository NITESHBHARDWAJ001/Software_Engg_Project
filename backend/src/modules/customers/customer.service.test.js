import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    customer: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    task: {
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: prismaMock,
}));

import { customerService } from './customer.service.js';

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists active customers with paging', async () => {
    prismaMock.task.groupBy.mockResolvedValue([]);
    prismaMock.customer.findMany.mockResolvedValue([
      { id: 'c1', name: 'Anita', email: 'anita@example.com', phone: '111', isArchived: false, totalSpent: 0, lifetimeValue: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 'c2', name: 'Ani Kumar', email: 'ani@example.com', phone: '222', isArchived: false, totalSpent: 0, lifetimeValue: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 'c3', name: 'Other User', email: 'other@example.com', phone: '333', isArchived: true, totalSpent: 0, lifetimeValue: 0, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await customerService.list('org-1', 1, 10, 'ani', 'ACTIVE');

    expect(result.total).toBe(2);
    expect(result.customers).toHaveLength(2);
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1' }),
      }),
    );
    expect(prismaMock.task.groupBy).toHaveBeenCalled();
  });

  it('throws when customer is not found by id', async () => {
    prismaMock.customer.findFirst.mockResolvedValue(null);

    await expect(customerService.getById('org-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'CUSTOMER_NOT_FOUND',
    });
  });

  it('creates customer with audit fields', async () => {
    prismaMock.customer.create.mockResolvedValue({ id: 'c1' });

    await customerService.create('org-1', 'u1', {
      name: 'Nitesh',
      email: 'nitesh@example.com',
      phone: '9999999999',
      city: 'Pune',
      country: 'India',
    });

    expect(prismaMock.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          createdBy: 'u1',
          updatedBy: 'u1',
          name: 'Nitesh',
        }),
      }),
    );
  });

  it('builds customer stats with decimal values', async () => {
    prismaMock.task.groupBy.mockResolvedValue([]);
    prismaMock.customer.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Top Customer',
        organizationId: 'org-1',
        email: 'top@example.com',
        phone: '1234567890',
        city: 'Pune',
        country: 'India',
        totalSpent: { toNumber: () => 500 },
        lifetimeValue: { toNumber: () => 550 },
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c2',
        name: 'Second Customer',
        organizationId: 'org-1',
        email: 'second@example.com',
        phone: '9876543210',
        city: 'Delhi',
        country: 'India',
        totalSpent: { toNumber: () => 300 },
        lifetimeValue: { toNumber: () => 350 },
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c3',
        name: 'Inactive Customer',
        organizationId: 'org-1',
        email: 'inactive@example.com',
        phone: '5555555555',
        city: 'Mumbai',
        country: 'India',
        totalSpent: { toNumber: () => 0 },
        lifetimeValue: { toNumber: () => 0 },
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await customerService.stats('org-1');

    expect(result.totalCustomers).toBe(3);
    expect(result.activeCustomers).toBe(2);
    expect(result.inactiveCustomers).toBe(1);
    expect(result.totalRevenue).toBe(800);
    expect(result.averagePurchaseValue).toBeCloseTo(266.67, 2);
    expect(result.topCustomers[0]).toMatchObject({ id: 'c1', totalSpent: 500, lifetimeValue: 550 });
    expect(result.rfmSummary.customerCount).toBe(3);
  });
});
