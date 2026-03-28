import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

export const customerService = {
  async list(organizationId, page, pageSize, search, status) {
    const where = {
      organizationId,
      ...(status === 'INACTIVE' ? { isArchived: true } : { isArchived: false }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { total, customers };
  },

  async getById(organizationId, id) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
    });

    if (!customer) {
      throw new HttpError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    return customer;
  },

  async create(organizationId, userId, payload) {
    return prisma.customer.create({
      data: {
        organizationId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        city: payload.city,
        country: payload.country,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  },

  async update(organizationId, id, userId, payload) {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId, isArchived: false } });
    if (!existing) {
      throw new HttpError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...payload,
        updatedBy: userId,
      },
    });
  },

  async archive(organizationId, id, userId) {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId, isArchived: false } });
    if (!existing) {
      throw new HttpError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    await prisma.customer.update({
      where: { id },
      data: {
        isArchived: true,
        updatedBy: userId,
      },
    });
  },

  async stats(organizationId) {
    const [activeCount, inactiveCount, totals, topCustomers] = await Promise.all([
      prisma.customer.count({ where: { organizationId, isArchived: false } }),
      prisma.customer.count({ where: { organizationId, isArchived: true } }),
      prisma.customer.aggregate({
        where: { organizationId, isArchived: false },
        _sum: { totalSpent: true },
      }),
      prisma.customer.findMany({
        where: { organizationId, isArchived: false },
        orderBy: { lifetimeValue: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          totalSpent: true,
          lifetimeValue: true,
        },
      }),
    ]);

    const totalCustomers = activeCount + inactiveCount;
    const totalRevenue = totals._sum.totalSpent?.toNumber() ?? 0;

    return {
      totalCustomers,
      activeCustomers: activeCount,
      inactiveCustomers: inactiveCount,
      totalRevenue,
      averagePurchaseValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      topCustomers: topCustomers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        totalSpent: customer.totalSpent.toNumber(),
        lifetimeValue: customer.lifetimeValue.toNumber(),
      })),
    };
  },
};
