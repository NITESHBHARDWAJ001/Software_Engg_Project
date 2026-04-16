import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const RFM_SEGMENTS = {
  CHAMPION: 'CHAMPION',
  LOYAL: 'LOYAL',
  POTENTIAL_LOYALIST: 'POTENTIAL_LOYALIST',
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  AT_RISK: 'AT_RISK',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
};

const millisecondsPerDay = 1000 * 60 * 60 * 24;

const toNumber = (value) => value?.toNumber?.() ?? Number(value ?? 0);

const toIsoStringOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const daysSince = (value, now = new Date()) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / millisecondsPerDay));
};

const scoreByPosition = (index, total, highIsGood) => {
  if (total <= 1) return 5;
  const bucket = Math.min(4, Math.floor((index / total) * 5));
  return highIsGood ? bucket + 1 : 5 - bucket;
};

const resolveSegment = ({ recencyScore, frequencyScore, monetaryScore, frequency, recencyDays }) => {
  const totalScore = recencyScore + frequencyScore + monetaryScore;

  if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
    return RFM_SEGMENTS.CHAMPION;
  }

  if (frequencyScore >= 4 && monetaryScore >= 3) {
    return RFM_SEGMENTS.LOYAL;
  }

  if (recencyScore >= 4 && frequencyScore >= 3) {
    return RFM_SEGMENTS.POTENTIAL_LOYALIST;
  }

  if (recencyScore >= 4 && frequency <= 1) {
    return RFM_SEGMENTS.NEW_CUSTOMER;
  }

  if (recencyScore <= 2 && frequencyScore >= 3) {
    return RFM_SEGMENTS.AT_RISK;
  }

  if (totalScore <= 8 || recencyDays >= 180) {
    return RFM_SEGMENTS.NEEDS_ATTENTION;
  }

  return RFM_SEGMENTS.POTENTIAL_LOYALIST;
};

const buildCustomerProfile = (customer, activity = {}) => {
  const totalSpent = toNumber(customer.totalSpent);
  const lifetimeValue = toNumber(customer.lifetimeValue);
  const lastActivityAt = activity.lastActivityAt || customer.updatedAt || customer.createdAt;

  return {
    ...customer,
    totalSpent,
    lifetimeValue,
    rfm: {
      recencyDays: daysSince(lastActivityAt),
      frequency: activity.frequency ?? 0,
      monetary: totalSpent,
      lastActivityAt: toIsoStringOrNull(lastActivityAt),
    },
  };
};

const scoreCustomerProfiles = (profiles) => {
  const now = new Date();
  const recencyOrder = [...profiles].sort(
    (left, right) => daysSince(left.rfm.lastActivityAt ?? left.updatedAt ?? left.createdAt, now) - daysSince(right.rfm.lastActivityAt ?? right.updatedAt ?? right.createdAt, now),
  );
  const frequencyOrder = [...profiles].sort(
    (left, right) => right.rfm.frequency - left.rfm.frequency || right.rfm.monetary - left.rfm.monetary,
  );
  const monetaryOrder = [...profiles].sort(
    (left, right) => right.rfm.monetary - left.rfm.monetary || right.rfm.frequency - left.rfm.frequency,
  );

  const recencyScores = new Map(recencyOrder.map((customer, index) => [customer.id, scoreByPosition(index, recencyOrder.length, false)]));
  const frequencyScores = new Map(frequencyOrder.map((customer, index) => [customer.id, scoreByPosition(index, frequencyOrder.length, true)]));
  const monetaryScores = new Map(monetaryOrder.map((customer, index) => [customer.id, scoreByPosition(index, monetaryOrder.length, true)]));

  return profiles.map((customer) => {
    const recencyScore = recencyScores.get(customer.id) ?? 3;
    const frequencyScore = frequencyScores.get(customer.id) ?? 3;
    const monetaryScore = monetaryScores.get(customer.id) ?? 3;
    const recencyDays = daysSince(customer.rfm.lastActivityAt ?? customer.updatedAt ?? customer.createdAt, now);
    const segment = resolveSegment({
      recencyScore,
      frequencyScore,
      monetaryScore,
      frequency: customer.rfm.frequency,
      recencyDays,
    });

    return {
      ...customer,
      rfmScore: recencyScore + frequencyScore + monetaryScore,
      rfmSegment: segment,
      rfm: {
        ...customer.rfm,
        recencyDays,
        recencyScore,
        frequencyScore,
        monetaryScore,
        totalScore: recencyScore + frequencyScore + monetaryScore,
        segment,
      },
    };
  });
};

const buildRfmSummary = (profiles) => {
  if (profiles.length === 0) {
    return {
      customerCount: 0,
      averageRecencyDays: 0,
      averageFrequency: 0,
      averageMonetary: 0,
      segments: {
        [RFM_SEGMENTS.CHAMPION]: 0,
        [RFM_SEGMENTS.LOYAL]: 0,
        [RFM_SEGMENTS.POTENTIAL_LOYALIST]: 0,
        [RFM_SEGMENTS.NEW_CUSTOMER]: 0,
        [RFM_SEGMENTS.AT_RISK]: 0,
        [RFM_SEGMENTS.NEEDS_ATTENTION]: 0,
      },
    };
  }

  const totals = profiles.reduce((accumulator, customer) => {
    accumulator.recencyDays += customer.rfm.recencyDays;
    accumulator.frequency += customer.rfm.frequency;
    accumulator.monetary += customer.rfm.monetary;
    accumulator.segments[customer.rfm.segment] += 1;
    return accumulator;
  }, {
    recencyDays: 0,
    frequency: 0,
    monetary: 0,
    segments: {
      [RFM_SEGMENTS.CHAMPION]: 0,
      [RFM_SEGMENTS.LOYAL]: 0,
      [RFM_SEGMENTS.POTENTIAL_LOYALIST]: 0,
      [RFM_SEGMENTS.NEW_CUSTOMER]: 0,
      [RFM_SEGMENTS.AT_RISK]: 0,
      [RFM_SEGMENTS.NEEDS_ATTENTION]: 0,
    },
  });

  return {
    customerCount: profiles.length,
    averageRecencyDays: Number((totals.recencyDays / profiles.length).toFixed(1)),
    averageFrequency: Number((totals.frequency / profiles.length).toFixed(1)),
    averageMonetary: Number((totals.monetary / profiles.length).toFixed(1)),
    segments: totals.segments,
  };
};

const loadCustomerProfiles = async (organizationId) => {
  const [customers, taskActivity] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        country: true,
        totalSpent: true,
        lifetimeValue: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.task.groupBy({
      by: ['relatedCustomerId'],
      where: {
        organizationId,
        relatedCustomerId: { not: null },
      },
      _count: { _all: true },
      _max: { updatedAt: true, createdAt: true },
    }),
  ]);

  const activityByCustomerId = new Map(
    taskActivity
      .filter((row) => row.relatedCustomerId)
      .map((row) => [row.relatedCustomerId, {
        frequency: row._count._all,
        lastActivityAt: row._max.updatedAt ?? row._max.createdAt ?? null,
      }]),
  );

  const profiles = customers.map((customer) => buildCustomerProfile(customer, activityByCustomerId.get(customer.id)));
  const scoredProfiles = scoreCustomerProfiles(profiles);

  return { customers: scoredProfiles, allCustomers: scoredProfiles };
};

export const customerService = {
  async list(organizationId, page, pageSize, search, status) {
    const { allCustomers } = await loadCustomerProfiles(organizationId);

    const filteredCustomers = allCustomers.filter((customer) => {
      if (status === 'ACTIVE') {
        return !customer.isArchived;
      }

      if (status === 'INACTIVE') {
        return customer.isArchived;
      }

      return true;
    }).filter((customer) => {
      if (!search) return true;

      const query = search.toLowerCase();
      return [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    const total = filteredCustomers.length;
    const customers = filteredCustomers.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

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
    const existing = await prisma.customer.findFirst({ where: { id, organizationId } });
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

  async setArchivedState(organizationId, id, userId, isArchived) {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new HttpError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    return prisma.customer.update({
      where: { id },
      data: {
        isArchived,
        updatedBy: userId,
      },
    });
  },

  async archive(organizationId, id, userId) {
    return this.setArchivedState(organizationId, id, userId, true);
  },

  async activate(organizationId, id, userId) {
    return this.setArchivedState(organizationId, id, userId, false);
  },

  async stats(organizationId) {
    const { allCustomers } = await loadCustomerProfiles(organizationId);

    const activeCustomers = allCustomers.filter((customer) => !customer.isArchived);
    const inactiveCustomers = allCustomers.filter((customer) => customer.isArchived);
    const totalRevenue = allCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const topCustomers = allCustomers
      .slice()
      .sort((left, right) => right.lifetimeValue - left.lifetimeValue || right.totalSpent - left.totalSpent)
      .slice(0, 5)
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        totalSpent: customer.totalSpent,
        lifetimeValue: customer.lifetimeValue,
        rfmScore: customer.rfmScore,
        rfmSegment: customer.rfmSegment,
      }));

    return {
      totalCustomers: allCustomers.length,
      activeCustomers: activeCustomers.length,
      inactiveCustomers: inactiveCustomers.length,
      totalRevenue,
      averagePurchaseValue: allCustomers.length > 0 ? totalRevenue / allCustomers.length : 0,
      topCustomers,
      rfmSummary: buildRfmSummary(allCustomers),
    };
  },
};
