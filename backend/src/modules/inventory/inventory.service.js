import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const InventoryStatus = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  CRITICAL: 'CRITICAL',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
};

const computeStatus = (currentStock, reorderLevel, minStockLevel) => {
  if (currentStock <= 0) return InventoryStatus.OUT_OF_STOCK;
  if (currentStock <= minStockLevel) return InventoryStatus.CRITICAL;
  if (currentStock <= reorderLevel) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
};

export const inventoryService = {
  async list(organizationId, page, pageSize, search, category) {
    const where = {
      organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { total, items };
  },

  async getById(organizationId, id) {
    const item = await prisma.inventoryItem.findFirst({ where: { id, organizationId } });
    if (!item) {
      throw new HttpError(404, 'Inventory item not found', 'ITEM_NOT_FOUND');
    }
    return item;
  },

  async create(organizationId, userId, payload) {
    const status = computeStatus(payload.currentStock, payload.reorderLevel, payload.minStockLevel);

    return prisma.inventoryItem.create({
      data: {
        organizationId,
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        currentStock: payload.currentStock,
        reorderLevel: payload.reorderLevel,
        minStockLevel: payload.minStockLevel,
        unitPrice: new Prisma.Decimal(payload.unitPrice),
        sellingPrice: new Prisma.Decimal(payload.sellingPrice),
        unit: payload.unit,
        status,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  },

  async update(organizationId, id, userId, payload) {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new HttpError(404, 'Inventory item not found', 'ITEM_NOT_FOUND');
    }

    const currentStock = payload.currentStock ?? existing.currentStock;
    const reorderLevel = payload.reorderLevel ?? existing.reorderLevel;
    const minStockLevel = payload.minStockLevel ?? existing.minStockLevel;

    return prisma.inventoryItem.update({
      where: { id },
      data: {
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        currentStock,
        reorderLevel,
        minStockLevel,
        unitPrice: payload.unitPrice !== undefined ? new Prisma.Decimal(payload.unitPrice) : undefined,
        sellingPrice: payload.sellingPrice !== undefined ? new Prisma.Decimal(payload.sellingPrice) : undefined,
        unit: payload.unit,
        status: computeStatus(currentStock, reorderLevel, minStockLevel),
        updatedBy: userId,
      },
    });
  },

  async adjustStock(organizationId, id, userId, quantity, changeType, note) {
    const item = await prisma.inventoryItem.findFirst({ where: { id, organizationId } });
    if (!item) {
      throw new HttpError(404, 'Inventory item not found', 'ITEM_NOT_FOUND');
    }

    const normalizedQuantity = changeType === 'OUT' ? -Math.abs(quantity) : Math.abs(quantity);
    const effectiveQuantity = changeType === 'ADJUSTMENT' ? quantity : normalizedQuantity;
    const nextStock = item.currentStock + effectiveQuantity;
    if (nextStock < 0) {
      throw new HttpError(400, 'Stock cannot go below zero', 'INVALID_STOCK');
    }

    const status = computeStatus(nextStock, item.reorderLevel, item.minStockLevel);

    const [updated] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          currentStock: nextStock,
          status,
          updatedBy: userId,
        },
      }),
      prisma.inventoryMovement.create({
        data: {
          organizationId,
          itemId: item.id,
          changeType,
          quantity: effectiveQuantity,
          note,
          createdBy: userId,
        },
      }),
    ]);

    return updated;
  },

  async alerts(organizationId) {
    return prisma.inventoryItem.findMany({
      where: {
        organizationId,
        status: { in: [InventoryStatus.LOW_STOCK, InventoryStatus.CRITICAL, InventoryStatus.OUT_OF_STOCK] },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async categoryAnalytics(organizationId) {
    const grouped = await prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: { _all: true },
      _sum: { currentStock: true },
    });

    return grouped.map((g) => ({
      category: g.category,
      itemCount: g._count._all,
      stockUnits: g._sum.currentStock ?? 0,
    }));
  },

  async stats(organizationId) {
    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValueAgg,
      categories,
      recentTransactions,
    ] = await Promise.all([
      prisma.inventoryItem.count({ where: { organizationId } }),
      prisma.inventoryItem.count({
        where: {
          organizationId,
          status: { in: [InventoryStatus.LOW_STOCK, InventoryStatus.CRITICAL] },
        },
      }),
      prisma.inventoryItem.count({
        where: {
          organizationId,
          status: InventoryStatus.OUT_OF_STOCK,
        },
      }),
      prisma.inventoryItem.aggregate({
        where: { organizationId },
        _sum: { unitPrice: true },
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        where: { organizationId },
      }),
      prisma.inventoryMovement.count({
        where: {
          organizationId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const items = await prisma.inventoryItem.findMany({
      where: { organizationId },
      select: { currentStock: true, unitPrice: true },
    });

    const totalValue = items.reduce(
      (sum, row) => sum + row.currentStock * row.unitPrice.toNumber(),
      0,
    );

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categoriesCount: categories.length,
      recentTransactions,
      averageUnitPrice: totalItems > 0 ? (totalValueAgg._sum.unitPrice?.toNumber() ?? 0) / totalItems : 0,
    };
  },

  async movementHistory(organizationId, itemId) {
    return prisma.inventoryMovement.findMany({
      where: { organizationId, itemId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  async listForAnalytics(organizationId, limit = 200) {
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        sku: true,
        name: true,
        category: true,
        currentStock: true,
      },
    });

    return items.map((item) => ({
      sku: item.sku,
      name: item.name,
      category: item.category,
      current_stock: item.currentStock,
    }));
  },
};
