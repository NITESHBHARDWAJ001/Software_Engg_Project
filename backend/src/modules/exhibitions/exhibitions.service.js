import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const LEAD_STATUS = {
  CONVERTED: 'CONVERTED',
};

const fullName = (user) => {
  if (!user) return undefined;
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
};

const mapLeadInteraction = (interaction) => ({
  id: interaction.id,
  leadId: interaction.leadId,
  userId: interaction.userId,
  userName: fullName(interaction.user),
  type: interaction.type,
  notes: interaction.notes,
  createdAt: interaction.createdAt.toISOString(),
});

const mapLead = (lead) => ({
  id: lead.id,
  exhibitionId: lead.exhibitionId,
  organizationId: lead.organizationId,
  name: lead.name,
  phone: lead.phone,
  email: lead.email ?? undefined,
  company: lead.company ?? undefined,
  interestLevel: lead.interestLevel,
  status: lead.status,
  interestedProducts: lead.interestedProducts,
  notes: lead.notes ?? undefined,
  capturedBy: lead.capturedBy,
  capturedByName: fullName(lead.capturedByUser) ?? lead.capturedBy,
  capturedAt: lead.capturedAt.toISOString(),
  createdAt: lead.createdAt.toISOString(),
  updatedAt: lead.updatedAt.toISOString(),
  followUpDate: lead.followUpDate?.toISOString(),
  lastContactedDate: lead.lastContactedDate?.toISOString(),
  source: lead.source,
  estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : undefined,
  interactions: lead.interactions?.map(mapLeadInteraction),
});

const mapExhibition = (exhibition, assignedStaffNames = []) => ({
  id: exhibition.id,
  organizationId: exhibition.organizationId,
  name: exhibition.name,
  description: exhibition.description,
  location: exhibition.location,
  startDate: exhibition.startDate.toISOString(),
  endDate: exhibition.endDate.toISOString(),
  status: exhibition.status,
  budget: Number(exhibition.budget),
  actualSpent: Number(exhibition.actualSpent),
  expectedRevenue: Number(exhibition.expectedRevenue),
  actualRevenue: Number(exhibition.actualRevenue),
  expectedFootfall: exhibition.expectedFootfall ?? undefined,
  actualFootfall: exhibition.actualFootfall ?? undefined,
  boothSize: exhibition.boothSize ?? undefined,
  stallNumber: exhibition.stallNumber ?? undefined,
  category: exhibition.category ?? undefined,
  assignedStaff: exhibition.assignedStaff,
  assignedStaffNames,
  totalLeads: exhibition.totalLeads,
  convertedLeads: exhibition.convertedLeads,
  createdBy: exhibition.createdBy,
  createdAt: exhibition.createdAt.toISOString(),
  updatedAt: exhibition.updatedAt.toISOString(),
  images: exhibition.images,
  notes: exhibition.notes ?? undefined,
});

const resolveAssignedStaffNames = async (organizationId, userIds) => {
  if (!userIds || userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      organizationId,
      id: { in: userIds },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  const byId = new Map(users.map((user) => [user.id, fullName(user)]));
  return userIds.map((id) => byId.get(id) ?? id);
};

const refreshLeadCounts = async (tx, exhibitionId) => {
  const [totalLeads, convertedLeads] = await Promise.all([
    tx.exhibitionLead.count({ where: { exhibitionId } }),
    tx.exhibitionLead.count({
      where: {
        exhibitionId,
        status: LEAD_STATUS.CONVERTED,
      },
    }),
  ]);

  await tx.exhibition.update({
    where: { id: exhibitionId },
    data: {
      totalLeads,
      convertedLeads,
    },
  });
};

export const exhibitionsService = {
  async list(organizationId, page, pageSize, query) {
    const where = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { location: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.exhibition.count({ where }),
      prisma.exhibition.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const mappedItems = await Promise.all(
      items.map(async (item) => {
        const assignedStaffNames = await resolveAssignedStaffNames(organizationId, item.assignedStaff);
        return mapExhibition(item, assignedStaffNames);
      }),
    );

    return { total, items: mappedItems };
  },

  async stats(organizationId) {
    const [
      totalExhibitions,
      ongoingExhibitions,
      completedExhibitions,
      totalLeads,
      convertedLeads,
      revenueAgg,
      budgetAgg,
    ] = await Promise.all([
      prisma.exhibition.count({ where: { organizationId } }),
      prisma.exhibition.count({ where: { organizationId, status: 'ACTIVE' } }),
      prisma.exhibition.count({ where: { organizationId, status: 'COMPLETED' } }),
      prisma.exhibitionLead.count({ where: { organizationId } }),
      prisma.exhibitionLead.count({ where: { organizationId, status: LEAD_STATUS.CONVERTED } }),
      prisma.exhibition.aggregate({ where: { organizationId }, _sum: { actualRevenue: true } }),
      prisma.exhibition.aggregate({ where: { organizationId }, _sum: { budget: true } }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.actualRevenue ?? 0);
    const totalBudget = Number(budgetAgg._sum.budget ?? 0);

    return {
      totalExhibitions,
      ongoingExhibitions,
      completedExhibitions,
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads ? (convertedLeads / totalLeads) * 100 : 0,
      totalRevenue,
      totalBudget,
      roi: totalBudget ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0,
    };
  },

  async getById(organizationId, id) {
    const exhibition = await prisma.exhibition.findFirst({
      where: { id, organizationId },
    });

    if (!exhibition) {
      throw new HttpError(404, 'Exhibition not found', 'EXHIBITION_NOT_FOUND');
    }

    const assignedStaffNames = await resolveAssignedStaffNames(organizationId, exhibition.assignedStaff);
    return mapExhibition(exhibition, assignedStaffNames);
  },

  async create(organizationId, userId, payload) {
    const exhibition = await prisma.exhibition.create({
      data: {
        organizationId,
        name: payload.name,
        description: payload.description ?? '',
        location: payload.location,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: payload.status,
        budget: new Prisma.Decimal(payload.budget ?? 0),
        actualSpent: new Prisma.Decimal(payload.actualSpent ?? 0),
        expectedRevenue: new Prisma.Decimal(payload.expectedRevenue ?? 0),
        actualRevenue: new Prisma.Decimal(payload.actualRevenue ?? 0),
        expectedFootfall: payload.expectedFootfall,
        actualFootfall: payload.actualFootfall,
        boothSize: payload.boothSize,
        stallNumber: payload.stallNumber,
        category: payload.category,
        assignedStaff: payload.assignedStaff ?? [],
        createdBy: userId,
        notes: payload.notes,
        images: payload.images ?? [],
      },
    });

    const assignedStaffNames = await resolveAssignedStaffNames(organizationId, exhibition.assignedStaff);
    return mapExhibition(exhibition, assignedStaffNames);
  },

  async update(organizationId, id, payload) {
    const existing = await prisma.exhibition.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new HttpError(404, 'Exhibition not found', 'EXHIBITION_NOT_FOUND');
    }

    const exhibition = await prisma.exhibition.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        description: payload.description,
        location: payload.location,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: payload.status,
        budget: payload.budget !== undefined ? new Prisma.Decimal(payload.budget) : undefined,
        actualSpent: payload.actualSpent !== undefined ? new Prisma.Decimal(payload.actualSpent) : undefined,
        expectedRevenue:
          payload.expectedRevenue !== undefined ? new Prisma.Decimal(payload.expectedRevenue) : undefined,
        actualRevenue: payload.actualRevenue !== undefined ? new Prisma.Decimal(payload.actualRevenue) : undefined,
        expectedFootfall: payload.expectedFootfall,
        actualFootfall: payload.actualFootfall,
        boothSize: payload.boothSize,
        stallNumber: payload.stallNumber,
        category: payload.category,
        assignedStaff: payload.assignedStaff,
        notes: payload.notes,
        images: payload.images,
      },
    });

    const assignedStaffNames = await resolveAssignedStaffNames(organizationId, exhibition.assignedStaff);
    return mapExhibition(exhibition, assignedStaffNames);
  },

  async listLeads(organizationId, exhibitionId) {
    const exhibition = await prisma.exhibition.findFirst({ where: { id: exhibitionId, organizationId } });
    if (!exhibition) {
      throw new HttpError(404, 'Exhibition not found', 'EXHIBITION_NOT_FOUND');
    }

    const leads = await prisma.exhibitionLead.findMany({
      where: { organizationId, exhibitionId },
      include: {
        capturedByUser: {
          select: { firstName: true, lastName: true },
        },
        interactions: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { capturedAt: 'desc' },
    });

    return leads.map(mapLead);
  },

  async createLead(organizationId, exhibitionId, userId, payload) {
    const exhibition = await prisma.exhibition.findFirst({ where: { id: exhibitionId, organizationId } });
    if (!exhibition) {
      throw new HttpError(404, 'Exhibition not found', 'EXHIBITION_NOT_FOUND');
    }

    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.exhibitionLead.create({
        data: {
          exhibitionId,
          organizationId,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          company: payload.company,
          interestLevel: payload.interestLevel,
          status: payload.status,
          interestedProducts: payload.interestedProducts ?? [],
          notes: payload.notes,
          capturedBy: userId,
          capturedAt: new Date(),
          followUpDate: payload.followUpDate,
          lastContactedDate: payload.lastContactedDate,
          source: payload.source,
          estimatedValue:
            payload.estimatedValue !== undefined ? new Prisma.Decimal(payload.estimatedValue) : undefined,
        },
        include: {
          capturedByUser: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      await refreshLeadCounts(tx, exhibitionId);
      return createdLead;
    });

    return mapLead(lead);
  },

  async updateLead(organizationId, exhibitionId, leadId, payload) {
    const lead = await prisma.exhibitionLead.findFirst({
      where: { id: leadId, exhibitionId, organizationId },
    });

    if (!lead) {
      throw new HttpError(404, 'Lead not found', 'LEAD_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedLead = await tx.exhibitionLead.update({
        where: { id: lead.id },
        data: {
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          company: payload.company,
          interestLevel: payload.interestLevel,
          status: payload.status,
          interestedProducts: payload.interestedProducts,
          notes: payload.notes,
          followUpDate: payload.followUpDate,
          lastContactedDate: payload.lastContactedDate,
          source: payload.source,
          estimatedValue:
            payload.estimatedValue !== undefined ? new Prisma.Decimal(payload.estimatedValue) : undefined,
        },
        include: {
          capturedByUser: {
            select: { firstName: true, lastName: true },
          },
          interactions: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      await refreshLeadCounts(tx, exhibitionId);
      return updatedLead;
    });

    return mapLead(updated);
  },

  async addInteraction(organizationId, leadId, userId, payload) {
    const lead = await prisma.exhibitionLead.findFirst({ where: { id: leadId, organizationId } });
    if (!lead) {
      throw new HttpError(404, 'Lead not found', 'LEAD_NOT_FOUND');
    }

    const interaction = await prisma.leadInteraction.create({
      data: {
        leadId,
        userId,
        type: payload.type,
        notes: payload.notes,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return mapLeadInteraction(interaction);
  },

  async roi(organizationId, exhibitionId) {
    const exhibition = await prisma.exhibition.findFirst({
      where: { id: exhibitionId, organizationId },
      include: {
        leads: true,
      },
    });

    if (!exhibition) {
      throw new HttpError(404, 'Exhibition not found', 'EXHIBITION_NOT_FOUND');
    }

    const totalLeads = exhibition.leads.length;
    const convertedLeads = exhibition.leads.filter((lead) => lead.status === LEAD_STATUS.CONVERTED).length;

    const totalRevenueFromLeads = exhibition.leads.reduce((sum, lead) => {
      if (lead.status === 'QUALIFIED' || lead.status === LEAD_STATUS.CONVERTED) {
        return sum + Number(lead.estimatedValue ?? 0);
      }
      return sum;
    }, 0);

    const budget = Number(exhibition.budget);
    const actualRevenue = Number(exhibition.actualRevenue);
    const totalRevenue = actualRevenue || totalRevenueFromLeads;
    const roi = totalRevenue - budget;
    const roiPercentage = budget > 0 ? (roi / budget) * 100 : 0;

    return {
      exhibitionId: exhibition.id,
      exhibitionName: exhibition.name,
      budget,
      totalInvestment: budget,
      revenue: totalRevenue,
      totalRevenue,
      roi,
      roisPercentage: roiPercentage,
      roiPercentage,
      leads: totalLeads,
      totalLeads,
      conversions: convertedLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    };
  },
};
