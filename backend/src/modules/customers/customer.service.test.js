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
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: prismaMock,
}));

import { customerService } from './customer.service.js';
import { HttpError } from '../../shared/http/httpError.js';

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists active customers with paging', async () => {
    prismaMock.customer.count.mockResolvedValue(2);
    prismaMock.customer.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);

    const result = await customerService.list('org-1', 2, 10, 'ani', 'ACTIVE');

    expect(result.total).toBe(2);
    expect(result.customers).toHaveLength(2);
    expect(prismaMock.customer.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', isArchived: false }),
      }),
    );
    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it('throws when customer is not found by id', async () => {
    prismaMock.customer.findFirst.mockResolvedValue(null);

    await expect(customerService.getById('org-1', 'missing')).rejects.toBeInstanceOf(HttpError);
    await expect(customerService.getById('org-1', 'missing')).rejects.toMatchObject({ statusCode: 404 });
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
    prismaMock.customer.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    prismaMock.customer.aggregate.mockResolvedValue({
      _sum: {
        totalSpent: {
          toNumber: () => 800,
        },
      },
    });
    prismaMock.customer.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Top Customer',
        totalSpent: { toNumber: () => 500 },
        lifetimeValue: { toNumber: () => 550 },
      },
    ]);

    const result = await customerService.stats('org-1');

    expect(result.totalCustomers).toBe(4);
    expect(result.totalRevenue).toBe(800);
    expect(result.averagePurchaseValue).toBe(200);
    expect(result.topCustomers[0]).toMatchObject({ id: 'c1', totalSpent: 500, lifetimeValue: 550 });
  });
});
