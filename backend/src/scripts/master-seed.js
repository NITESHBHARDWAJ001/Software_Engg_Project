import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../shared/db/prisma.js';

const ORG_SLUG = process.env.MASTER_SEED_ORG_SLUG ?? 'ethnic-demo-org';
const ORG_NAME = process.env.MASTER_SEED_ORG_NAME ?? 'Ethnic Demo Organization';
const ORG_ADMIN_EMAIL = process.env.MASTER_SEED_ORG_ADMIN_EMAIL ?? 'orgadmin@example.com';
const ORG_ADMIN_PASSWORD = process.env.MASTER_SEED_ORG_ADMIN_PASSWORD ?? 'OrgAdminStrongPass123!';
const STAFF_EMAIL = process.env.MASTER_SEED_STAFF_EMAIL ?? 'staff@example.com';
const STAFF_PASSWORD = process.env.MASTER_SEED_STAFF_PASSWORD ?? 'StaffStrongPass123!';

const FEATURES_BASIC = ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT'];
const FEATURES_GROWTH = [
  'CUSTOMER_MANAGEMENT',
  'INVENTORY_MANAGEMENT',
  'FINANCE_MANAGEMENT',
  'TASK_MANAGEMENT',
  'EXHIBITION_MANAGEMENT',
];
const FEATURES_ENTERPRISE = [...FEATURES_GROWTH];

const dateAfterDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const upsertUser = async ({ email, password, firstName, lastName, role, organizationId }) => {
  const passwordHash = await argon2.hash(password);
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      role,
      isActive: true,
      organizationId,
      passwordHash,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
      organizationId,
    },
  });
};

const ensureSubscriptionPlans = async (superAdminId) => {
  const plans = [
    {
      code: 'FREE',
      name: 'Free',
      description: 'Default onboarding plan for newly joined organizations.',
      billingCycle: 'MONTHLY',
      price: 0,
      currency: 'INR',
      features: FEATURES_BASIC,
      limits: { users: 2, inventoryItems: 500, customers: 200, exhibitions: 2 },
    },
    {
      code: 'BASIC',
      name: 'Basic',
      description: 'Core modules for customer and inventory.',
      billingCycle: 'MONTHLY',
      price: 999,
      currency: 'INR',
      features: FEATURES_BASIC,
      limits: { users: 5, inventoryItems: 1000 },
    },
    {
      code: 'GROWTH',
      name: 'Growth',
      description: 'Full business modules for growing teams.',
      billingCycle: 'MONTHLY',
      price: 2499,
      currency: 'INR',
      features: FEATURES_GROWTH,
      limits: { users: 25, inventoryItems: 10000 },
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'Advanced controls and unlimited scale.',
      billingCycle: 'YEARLY',
      price: 24999,
      currency: 'INR',
      features: FEATURES_ENTERPRISE,
      limits: { users: 500, inventoryItems: 1000000 },
    },
  ];

  const results = [];
  for (const plan of plans) {
    const upserted = await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        billingCycle: plan.billingCycle,
        price: new Prisma.Decimal(plan.price),
        currency: plan.currency,
        isActive: true,
        features: plan.features,
        limits: plan.limits,
        updatedBy: superAdminId,
      },
      create: {
        ...plan,
        price: new Prisma.Decimal(plan.price),
        isActive: true,
        createdBy: superAdminId,
        updatedBy: superAdminId,
      },
    });
    results.push(upserted);
  }

  return results;
};

const ensureOrganizationSubscription = async (organizationId, planId, actorId) => {
  const current = await prisma.organizationSubscription.findFirst({
    where: {
      organizationId,
      status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] },
    },
    orderBy: { startDate: 'desc' },
  });

  if (!current) {
    return prisma.organizationSubscription.create({
      data: {
        organizationId,
        planId,
        status: 'ACTIVE',
        startDate: new Date(),
        autoRenew: true,
        includedFeatures: [],
        excludedFeatures: [],
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  return prisma.organizationSubscription.update({
    where: { id: current.id },
    data: {
      planId,
      status: 'ACTIVE',
      autoRenew: true,
      includedFeatures: [],
      excludedFeatures: [],
      updatedBy: actorId,
    },
  });
};

const ensureCustomers = async (organizationId, actorId) => {
  const rows = [
    { name: 'Priya Sharma', email: 'priya.demo@example.com', phone: '+919999111111', city: 'Mumbai', country: 'India' },
    { name: 'Rajesh Kumar', email: 'rajesh.demo@example.com', phone: '+919999222222', city: 'Delhi', country: 'India' },
  ];

  for (const row of rows) {
    const existing = await prisma.customer.findFirst({ where: { organizationId, email: row.email } });
    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: { ...row, isArchived: false, updatedBy: actorId },
      });
      continue;
    }

    await prisma.customer.create({
      data: {
        organizationId,
        ...row,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }
};

const ensureInventory = async (organizationId, actorId) => {
  const rows = [
    { name: 'Banarasi Saree', sku: 'DEMO-BAN-001', category: 'SAREES', currentStock: 25, reorderLevel: 10, minStockLevel: 5, unitPrice: 4500, sellingPrice: 6500, status: 'IN_STOCK' },
    { name: 'Silk Dupatta', sku: 'DEMO-DUP-001', category: 'DUPATTA', currentStock: 8, reorderLevel: 10, minStockLevel: 4, unitPrice: 700, sellingPrice: 1200, status: 'LOW_STOCK' },
  ];

  for (const row of rows) {
    await prisma.inventoryItem.upsert({
      where: {
        organizationId_sku: {
          organizationId,
          sku: row.sku,
        },
      },
      update: {
        ...row,
        unitPrice: new Prisma.Decimal(row.unitPrice),
        sellingPrice: new Prisma.Decimal(row.sellingPrice),
        updatedBy: actorId,
      },
      create: {
        organizationId,
        ...row,
        unitPrice: new Prisma.Decimal(row.unitPrice),
        sellingPrice: new Prisma.Decimal(row.sellingPrice),
        unit: 'piece',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }
};

const ensureFinance = async (organizationId, actorId) => {
  await prisma.invoice.upsert({
    where: {
      organizationId_invoiceNumber: {
        organizationId,
        invoiceNumber: 'DEMO-INV-001',
      },
    },
    update: {
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: dateAfterDays(15),
      subtotal: new Prisma.Decimal(12000),
      taxAmount: new Prisma.Decimal(2160),
      discountAmount: new Prisma.Decimal(0),
      totalAmount: new Prisma.Decimal(14160),
      updatedBy: actorId,
    },
    create: {
      organizationId,
      invoiceNumber: 'DEMO-INV-001',
      status: 'PENDING',
      issueDate: new Date(),
      dueDate: dateAfterDays(15),
      currency: 'INR',
      subtotal: new Prisma.Decimal(12000),
      taxAmount: new Prisma.Decimal(2160),
      discountAmount: new Prisma.Decimal(0),
      totalAmount: new Prisma.Decimal(14160),
      createdBy: actorId,
      updatedBy: actorId,
    },
  });

  const existing = await prisma.ledgerEntry.findFirst({
    where: {
      organizationId,
      category: 'Sales',
      description: 'Master seed sales entry',
    },
  });

  if (!existing) {
    await prisma.ledgerEntry.create({
      data: {
        organizationId,
        type: 'INCOME',
        amount: new Prisma.Decimal(14160),
        entryDate: new Date(),
        category: 'Sales',
        description: 'Master seed sales entry',
        createdBy: actorId,
      },
    });
  }
};

const ensureExhibitionAndTasks = async (organizationId, actorId) => {
  let exhibition = await prisma.exhibition.findFirst({
    where: { organizationId, name: 'Demo Fashion Expo' },
  });

  if (!exhibition) {
    exhibition = await prisma.exhibition.create({
      data: {
        organizationId,
        name: 'Demo Fashion Expo',
        description: 'Seeded exhibition for feature checks',
        location: 'Mumbai',
        startDate: dateAfterDays(7),
        endDate: dateAfterDays(9),
        status: 'UPCOMING',
        budget: new Prisma.Decimal(50000),
        actualSpent: new Prisma.Decimal(0),
        expectedRevenue: new Prisma.Decimal(200000),
        actualRevenue: new Prisma.Decimal(0),
        assignedStaff: [actorId],
        createdBy: actorId,
      },
    });
  }

  const task = await prisma.task.findFirst({
    where: { organizationId, title: 'Demo follow-up task' },
  });

  if (!task) {
    await prisma.task.create({
      data: {
        organizationId,
        title: 'Demo follow-up task',
        description: 'Seeded task for API checks',
        status: 'TODO',
        priority: 'MEDIUM',
        assignedTo: actorId,
        createdBy: actorId,
        dueDate: dateAfterDays(3),
        tags: ['seed'],
        attachments: [],
        relatedExhibitionId: exhibition.id,
      },
    });
  }
};

const main = async () => {
  console.log('Running master seed...');

  const organization = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {
      name: ORG_NAME,
      email: `${ORG_SLUG}@example.com`,
      phone: '+910000000001',
    },
    create: {
      name: ORG_NAME,
      slug: ORG_SLUG,
      email: `${ORG_SLUG}@example.com`,
      phone: '+910000000001',
    },
  });

  const superAdmin = await upsertUser({
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    organizationId: null,
  });

  const orgAdmin = await upsertUser({
    email: ORG_ADMIN_EMAIL,
    password: ORG_ADMIN_PASSWORD,
    firstName: 'Org',
    lastName: 'Admin',
    role: 'ORG_ADMIN',
    organizationId: organization.id,
  });

  await upsertUser({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    firstName: 'Staff',
    lastName: 'User',
    role: 'STAFF',
    organizationId: organization.id,
  });

  const plans = await ensureSubscriptionPlans(superAdmin.id);
  const growthPlan = plans.find((p) => p.code === 'GROWTH') ?? plans[0];

  await ensureOrganizationSubscription(organization.id, growthPlan.id, superAdmin.id);
  await ensureCustomers(organization.id, orgAdmin.id);
  await ensureInventory(organization.id, orgAdmin.id);
  await ensureFinance(organization.id, orgAdmin.id);
  await ensureExhibitionAndTasks(organization.id, orgAdmin.id);

  console.log('Master seed completed successfully.');
  console.log(`Organization: ${organization.slug}`);
  console.log(`Super Admin: ${env.SUPER_ADMIN_EMAIL}`);
  console.log(`Org Admin: ${ORG_ADMIN_EMAIL}`);
  console.log(`Org Admin Password: ${ORG_ADMIN_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error('[FATAL] Master seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
