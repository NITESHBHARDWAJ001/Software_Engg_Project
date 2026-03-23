import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    inventoryItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (ops) => Promise.all(ops)),
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: prismaMock,
}));

import { inventoryService } from './inventory.service.js';
import { HttpError } from '../../shared/http/httpError.js';

describe('inventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates item and computes low stock status', async () => {
    prismaMock.inventoryItem.create.mockResolvedValue({ id: 'i1' });

    await inventoryService.create('org-1', 'u1', {
      name: 'Saree',
      sku: 'SK1',
      category: 'SAREES',
      currentStock: 3,
      reorderLevel: 5,
      minStockLevel: 2,
      unitPrice: 100,
      sellingPrice: 150,
      unit: 'piece',
    });

    const args = prismaMock.inventoryItem.create.mock.calls[0][0];
    expect(args.data.status).toBe('LOW_STOCK');
    expect(args.data.unitPrice).toBeInstanceOf(Prisma.Decimal);
  });

  it('normalizes OUT stock adjustment into negative movement', async () => {
    prismaMock.inventoryItem.findFirst.mockResolvedValue({
      id: 'i1',
      currentStock: 10,
      reorderLevel: 5,
      minStockLevel: 2,
    });
    prismaMock.inventoryItem.update.mockResolvedValue({ id: 'i1', currentStock: 6, status: 'IN_STOCK' });
    prismaMock.inventoryMovement.create.mockResolvedValue({ id: 'm1' });

    const updated = await inventoryService.adjustStock('org-1', 'i1', 'u1', 4, 'OUT', 'sale');

    expect(updated.currentStock).toBe(6);
    expect(prismaMock.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quantity: -4, changeType: 'OUT' }),
      }),
    );
  });

  it('throws on stock going below zero', async () => {
    prismaMock.inventoryItem.findFirst.mockResolvedValue({
      id: 'i1',
      currentStock: 2,
      reorderLevel: 5,
      minStockLevel: 2,
    });

    await expect(inventoryService.adjustStock('org-1', 'i1', 'u1', 5, 'OUT', 'sale')).rejects.toBeInstanceOf(HttpError);
    await expect(inventoryService.adjustStock('org-1', 'i1', 'u1', 5, 'OUT', 'sale')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('calculates stats with totals and categories', async () => {
    prismaMock.inventoryItem.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prismaMock.inventoryItem.aggregate.mockResolvedValue({
      _sum: {
        unitPrice: { toNumber: () => 450 },
      },
    });
    prismaMock.inventoryItem.groupBy.mockResolvedValue([{ category: 'SAREES' }]);
    prismaMock.inventoryMovement.count.mockResolvedValue(7);
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      { currentStock: 2, unitPrice: { toNumber: () => 100 } },
      { currentStock: 1, unitPrice: { toNumber: () => 250 } },
    ]);

    const result = await inventoryService.stats('org-1');

    expect(result.totalItems).toBe(3);
    expect(result.totalValue).toBe(450);
    expect(result.categoriesCount).toBe(1);
    expect(result.recentTransactions).toBe(7);
  });
});
