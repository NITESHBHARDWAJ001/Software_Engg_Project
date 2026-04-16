import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../shared/db/prisma.js';
import { notificationService } from '../modules/notifications/notifications.service.js';

const ORG_SLUG = process.env.MASTER_SEED_ORG_SLUG ?? 'ethnic-demo-org';
const ORG_NAME = process.env.MASTER_SEED_ORG_NAME ?? 'Ethnic Demo Organization';
const ORG_ADMIN_EMAIL = process.env.MASTER_SEED_ORG_ADMIN_EMAIL ?? 'orgadmin@example.com';
const ORG_ADMIN_PASSWORD = process.env.MASTER_SEED_ORG_ADMIN_PASSWORD ?? 'OrgAdminStrongPass123!';
const STAFF_PASSWORD = process.env.MASTER_SEED_STAFF_PASSWORD ?? 'StaffStrongPass123!';

const dateAfterDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const dateBeforeDays = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const decimal = (value) => new Prisma.Decimal(value);

const TEAM_MEMBERS = [
  {
    email: ORG_ADMIN_EMAIL,
    password: ORG_ADMIN_PASSWORD,
    firstName: 'Nisha',
    lastName: 'Sharma',
    role: 'ORG_ADMIN',
    phone: '+919900000101',
    jobTitle: 'Operations Director',
    employmentType: 'FULL_TIME',
  },
  {
    email: 'merchandising@example.com',
    password: STAFF_PASSWORD,
    firstName: 'Aman',
    lastName: 'Verma',
    role: 'STAFF',
    phone: '+919900000102',
    jobTitle: 'Merchandising Specialist',
    employmentType: 'FULL_TIME',
  },
  {
    email: 'inventory@example.com',
    password: STAFF_PASSWORD,
    firstName: 'Sara',
    lastName: 'Khan',
    role: 'STAFF',
    phone: '+919900000103',
    jobTitle: 'Inventory Coordinator',
    employmentType: 'FULL_TIME',
  },
  {
    email: 'finance@example.com',
    password: STAFF_PASSWORD,
    firstName: 'Rohit',
    lastName: 'Mehta',
    role: 'STAFF',
    phone: '+919900000104',
    jobTitle: 'Finance Analyst',
    employmentType: 'FULL_TIME',
  },
  {
    email: 'events@example.com',
    password: STAFF_PASSWORD,
    firstName: 'Priya',
    lastName: 'Das',
    role: 'STAFF',
    phone: '+919900000105',
    jobTitle: 'Event Coordinator',
    employmentType: 'FULL_TIME',
  },
  {
    email: 'sales@example.com',
    password: STAFF_PASSWORD,
    firstName: 'Arjun',
    lastName: 'Nair',
    role: 'STAFF',
    phone: '+919900000106',
    jobTitle: 'Sales Executive',
    employmentType: 'PART_TIME',
  },
];

const CUSTOMER_ROWS = [
  ['Priya Sharma', 'priya.demo@example.com', '+919999111111', 'Mumbai', 'India', 95000],
  ['Rajesh Kumar', 'rajesh.demo@example.com', '+919999222222', 'Delhi', 'India', 125000],
  ['Anita Desai', 'anita.demo@example.com', '+919999333333', 'Ahmedabad', 'India', 78000],
  ['Farah Khan', 'farah.demo@example.com', '+919999444444', 'Hyderabad', 'India', 164000],
  ['Neha Rao', 'neha.demo@example.com', '+919999555555', 'Bengaluru', 'India', 102500],
  ['Ishaan Gupta', 'ishaan.demo@example.com', '+919999666666', 'Pune', 'India', 59000],
  ['Kavya Menon', 'kavya.demo@example.com', '+919999777777', 'Chennai', 'India', 147000],
  ['Vikram Singh', 'vikram.demo@example.com', '+919999888888', 'Jaipur', 'India', 88000],
  ['Ayesha Ali', 'ayesha.demo@example.com', '+919999999991', 'Kolkata', 'India', 112000],
  ['Mohan Reddy', 'mohan.demo@example.com', '+919999999992', 'Surat', 'India', 72000],
  ['Sana Kapoor', 'sana.demo@example.com', '+919999999993', 'Lucknow', 'India', 132000],
  ['Dev Patel', 'dev.demo@example.com', '+919999999994', 'Nagpur', 'India', 56000],
  ['Meera Joshi', 'meera.demo@example.com', '+919999999995', 'Indore', 'India', 91000],
  ['Ria Bansal', 'ria.demo@example.com', '+919999999996', 'Bhopal', 'India', 68000],
  ['Karan Malhotra', 'karan.demo@example.com', '+919999999997', 'Chandigarh', 'India', 157000],
  ['Pooja Nair', 'pooja.demo@example.com', '+919999999998', 'Kochi', 'India', 83000],
  ['Rahul Jain', 'rahul.demo@example.com', '+919999999999', 'Noida', 'India', 123000],
  ['Simran Gill', 'simran.demo@example.com', '+919999999990', 'Ludhiana', 'India', 67000],
];

const INVENTORY_ROWS = [
  ['Banarasi Saree', 'SAREES', 26, 10, 5, 4500, 6900],
  ['Kanjeevaram Saree', 'SAREES', 12, 10, 5, 5200, 8100],
  ['Silk Dupatta', 'DUPATTA', 9, 10, 4, 700, 1200],
  ['Cotton Kurta', 'KURTAS', 48, 20, 10, 900, 1499],
  ['Designer Lehenga', 'LEHENGAS', 7, 8, 3, 8500, 12999],
  ['Handloom Stole', 'ACCESSORIES', 31, 12, 6, 350, 699],
  ['Embroidered Jacket', 'OUTERWEAR', 14, 10, 5, 2400, 3899],
  ['Printed Palazzo', 'BOTTOMS', 19, 10, 5, 850, 1499],
  ['Festive Blouse', 'TOPS', 23, 12, 6, 1200, 2199],
  ['Wedding Sherwani', 'MENSWEAR', 6, 6, 2, 9500, 15999],
  ['Fusion Gown', 'DRESSES', 10, 8, 4, 7800, 12499],
  ['Travel Organizer Pouch', 'ACCESSORIES', 40, 15, 8, 220, 499],
  ['Rajasthani Mojari', 'FOOTWEAR', 17, 10, 5, 1600, 2799],
  ['Kids Ethnic Set', 'KIDSWEAR', 28, 12, 6, 1100, 1899],
  ['Linen Shirt', 'MENSWEAR', 35, 15, 7, 1300, 2299],
  ['Jute Tote Bag', 'ACCESSORIES', 60, 20, 10, 150, 399],
  ['Raw Silk Fabric', 'FABRICS', 18, 10, 5, 650, 1199],
  ['Organza Dupatta', 'DUPATTA', 11, 10, 4, 500, 999],
];

const INVOICE_BLUEPRINTS = [
  { invoiceNumber: 'INV-2026-001', status: 'PAID', issueOffset: 40, dueOffset: 20, subtotal: 32000, tax: 5760, discount: 1000 },
  { invoiceNumber: 'INV-2026-002', status: 'PENDING', issueOffset: 12, dueOffset: 3, subtotal: 18000, tax: 3240, discount: 0 },
  { invoiceNumber: 'INV-2026-003', status: 'OVERDUE', issueOffset: 25, dueOffset: -5, subtotal: 45000, tax: 8100, discount: 1500 },
  { invoiceNumber: 'INV-2026-004', status: 'DRAFT', issueOffset: 4, dueOffset: 18, subtotal: 12000, tax: 2160, discount: 0 },
  { invoiceNumber: 'INV-2026-005', status: 'PAID', issueOffset: 55, dueOffset: 35, subtotal: 26000, tax: 4680, discount: 2000 },
  { invoiceNumber: 'INV-2026-006', status: 'PENDING', issueOffset: 8, dueOffset: 10, subtotal: 15500, tax: 2790, discount: 500 },
  { invoiceNumber: 'INV-2026-007', status: 'PAID', issueOffset: 18, dueOffset: 2, subtotal: 63000, tax: 11340, discount: 3000 },
  { invoiceNumber: 'INV-2026-008', status: 'OVERDUE', issueOffset: 32, dueOffset: -2, subtotal: 21000, tax: 3780, discount: 0 },
  { invoiceNumber: 'INV-2026-009', status: 'DRAFT', issueOffset: 2, dueOffset: 15, subtotal: 9800, tax: 1764, discount: 0 },
  { invoiceNumber: 'INV-2026-010', status: 'PAID', issueOffset: 70, dueOffset: 50, subtotal: 54000, tax: 9720, discount: 2500 },
];

const EXHIBITION_BLUEPRINTS = [
  {
    name: 'Spring Couture Expo',
    location: 'Mumbai',
    status: 'ACTIVE',
    startOffset: -3,
    endOffset: 4,
    budget: 150000,
    actualSpent: 82000,
    expectedRevenue: 380000,
    actualRevenue: 91000,
    expectedFootfall: 2400,
    actualFootfall: 980,
    boothSize: '20x20',
    category: 'Fashion Showcase',
  },
  {
    name: 'Heritage Weaves Summit',
    location: 'Jaipur',
    status: 'UPCOMING',
    startOffset: 8,
    endOffset: 12,
    budget: 90000,
    actualSpent: 14000,
    expectedRevenue: 210000,
    actualRevenue: 0,
    expectedFootfall: 1600,
    actualFootfall: 0,
    boothSize: '15x15',
    category: 'Textiles',
  },
  {
    name: 'Festive Fusion Market',
    location: 'Delhi',
    status: 'COMPLETED',
    startOffset: -18,
    endOffset: -15,
    budget: 180000,
    actualSpent: 176000,
    expectedRevenue: 420000,
    actualRevenue: 455000,
    expectedFootfall: 2800,
    actualFootfall: 3010,
    boothSize: '30x20',
    category: 'Retail',
  },
  {
    name: 'Luxury Bridal Week',
    location: 'Hyderabad',
    status: 'CANCELLED',
    startOffset: 20,
    endOffset: 24,
    budget: 220000,
    actualSpent: 12000,
    expectedRevenue: 550000,
    actualRevenue: 0,
    expectedFootfall: 3500,
    actualFootfall: 0,
    boothSize: '25x25',
    category: 'Bridal',
  },
  {
    name: 'Handloom Revival Fair',
    location: 'Kolkata',
    status: 'ACTIVE',
    startOffset: -1,
    endOffset: 5,
    budget: 120000,
    actualSpent: 55000,
    expectedRevenue: 300000,
    actualRevenue: 64000,
    expectedFootfall: 1900,
    actualFootfall: 720,
    boothSize: '18x18',
    category: 'Craft',
  },
];

const TASK_BLUEPRINTS = [
  'Prepare onboarding checklist',
  'Update product pricing sheet',
  'Confirm vendor availability',
  'Review cash flow forecast',
  'Assign booth staff rotations',
  'Follow up on high-value lead',
  'Audit low stock inventory',
  'Finalize expo signage',
  'Approve discount campaign',
  'Check overdue invoices',
  'Compile weekly performance report',
  'Validate lead follow-up schedule',
  'Review customer feedback',
  'Coordinate shipping batch',
  'Approve new inventory intake',
  'Cross-check exhibition budget',
  'Prepare task status summary',
  'Monitor staff workload balance',
  'Plan next campaign launch',
  'Review pending approvals',
];

const ACTIVITY_NOTES = [
  'Seeded data for feature testing',
  'Important follow-up required',
  'Marked for demo validation',
  'Ready for dashboard review',
  'Needs attention this week',
];

const ensureSeedNotification = async ({ userId, title, message, type, read = false, link }) => {
  const existing = await notificationService.list(userId);
  const duplicate = existing.find(
    (notification) => notification.title === title && notification.message === message && notification.link === (link ?? undefined),
  );

  if (duplicate) {
    return duplicate;
  }

  return notificationService.create({ userId, title, message, type, read, link });
};

const FEATURES_BASIC = ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT'];
const FEATURES_GROWTH = ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'FINANCE_MANAGEMENT', 'TASK_MANAGEMENT', 'EXHIBITION_MANAGEMENT'];
const FEATURES_ENTERPRISE = [...FEATURES_GROWTH];

const upsertUser = async ({ email, password, firstName, lastName, role, organizationId, phone, jobTitle, employmentType }) => {
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
      phone: phone ?? null,
      jobTitle: jobTitle ?? null,
      employmentType: employmentType ?? null,
      employmentValidFrom: role === 'STAFF' ? dateBeforeDays(180) : null,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
      organizationId,
      phone: phone ?? null,
      jobTitle: jobTitle ?? null,
      employmentType: employmentType ?? null,
      employmentValidFrom: role === 'STAFF' ? dateBeforeDays(180) : null,
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
        price: decimal(plan.price),
        currency: plan.currency,
        isActive: true,
        features: plan.features,
        limits: plan.limits,
        updatedBy: superAdminId,
      },
      create: {
        ...plan,
        price: decimal(plan.price),
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
  for (const [index, row] of CUSTOMER_ROWS.entries()) {
    const [name, email, phone, city, country, spent] = row;
    const existing = await prisma.customer.findFirst({ where: { organizationId, email } });
    const payload = {
      organizationId,
      name,
      email,
      phone,
      city,
      country,
      totalSpent: decimal(spent),
      lifetimeValue: decimal(spent + 2500 + index * 500),
      isArchived: false,
      createdBy: actorId,
      updatedBy: actorId,
    };

    if (existing) {
      await prisma.customer.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.customer.create({ data: payload });
    }
  }
};

const ensureInventory = async (organizationId, actorId) => {
  for (const row of INVENTORY_ROWS) {
    const [name, category, currentStock, reorderLevel, minStockLevel, unitPrice, sellingPrice] = row;
    const sku = `DEMO-${category.slice(0, 3).toUpperCase()}-${name
      .replace(/[^A-Za-z0-9]+/g, '-')
      .slice(0, 12)
      .toUpperCase()}`;

    const item = await prisma.inventoryItem.upsert({
      where: {
        organizationId_sku: { organizationId, sku },
      },
      update: {
        name,
        category,
        currentStock,
        reorderLevel,
        minStockLevel,
        unitPrice: decimal(unitPrice),
        sellingPrice: decimal(sellingPrice),
        status:
          currentStock <= minStockLevel
            ? 'CRITICAL'
            : currentStock <= reorderLevel
              ? 'LOW_STOCK'
              : 'IN_STOCK',
        updatedBy: actorId,
      },
      create: {
        organizationId,
        name,
        sku,
        category,
        currentStock,
        reorderLevel,
        minStockLevel,
        unitPrice: decimal(unitPrice),
        sellingPrice: decimal(sellingPrice),
        unit: 'piece',
        status:
          currentStock <= minStockLevel
            ? 'CRITICAL'
            : currentStock <= reorderLevel
              ? 'LOW_STOCK'
              : 'IN_STOCK',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });

    const movementNote = `Master seed opening stock for ${name}`;
    const movementExists = await prisma.inventoryMovement.findFirst({
      where: { organizationId, itemId: item.id, changeType: 'OPENING_STOCK', note: movementNote },
    });

    if (!movementExists) {
      await prisma.inventoryMovement.create({
        data: {
          organizationId,
          itemId: item.id,
          changeType: 'OPENING_STOCK',
          quantity: currentStock,
          note: movementNote,
          createdBy: actorId,
        },
      });
    }
  }
};

const ensureFinance = async (organizationId, actorId) => {
  const invoiceRecords = [];

  for (const blueprint of INVOICE_BLUEPRINTS) {
    const issueDate = dateBeforeDays(blueprint.issueOffset);
    const dueDate = blueprint.status === 'DRAFT' ? dateAfterDays(blueprint.dueOffset) : dateBeforeDays(blueprint.dueOffset);
    const total = blueprint.subtotal + blueprint.tax - blueprint.discount;

    const invoice = await prisma.invoice.upsert({
      where: {
        organizationId_invoiceNumber: {
          organizationId,
          invoiceNumber: blueprint.invoiceNumber,
        },
      },
      update: {
        status: blueprint.status,
        issueDate,
        dueDate,
        paidAt: blueprint.status === 'PAID' ? dateBeforeDays(Math.max(1, blueprint.issueOffset - 2)) : null,
        currency: 'INR',
        subtotal: decimal(blueprint.subtotal),
        taxAmount: decimal(blueprint.tax),
        discountAmount: decimal(blueprint.discount),
        totalAmount: decimal(total),
        notes: `Seeded invoice ${blueprint.invoiceNumber}`,
        updatedBy: actorId,
      },
      create: {
        organizationId,
        invoiceNumber: blueprint.invoiceNumber,
        status: blueprint.status,
        issueDate,
        dueDate,
        paidAt: blueprint.status === 'PAID' ? dateBeforeDays(Math.max(1, blueprint.issueOffset - 2)) : null,
        currency: 'INR',
        subtotal: decimal(blueprint.subtotal),
        taxAmount: decimal(blueprint.tax),
        discountAmount: decimal(blueprint.discount),
        totalAmount: decimal(total),
        notes: `Seeded invoice ${blueprint.invoiceNumber}`, 
        createdBy: actorId,
        updatedBy: actorId,
      },
    });

    invoiceRecords.push(invoice);
  }

  const paidInvoices = invoiceRecords.filter((invoice) => invoice.status === 'PAID');

  for (const [index, invoice] of paidInvoices.entries()) {
    const paymentNote = `Master seed payment entry for ${invoice.invoiceNumber}`;
    const existing = await prisma.ledgerEntry.findFirst({
      where: { organizationId, invoiceId: invoice.id, description: paymentNote },
    });

    if (!existing) {
      await prisma.ledgerEntry.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          type: 'INCOME',
          amount: invoice.totalAmount,
          entryDate: dateBeforeDays(2 + index),
          category: 'Sales',
          description: paymentNote,
          createdBy: actorId,
        },
      });
    }
  }

  const ledgerRows = [
    ['INCOME', 28500, 'Sales', 'Online order batch', 1],
    ['INCOME', 41200, 'Sales', 'Wholesale order batch', 4],
    ['INCOME', 19800, 'Sales', 'Retail showroom billing', 8],
    ['EXPENSE', 9200, 'Logistics', 'Courier and packing expense', 3],
    ['EXPENSE', 15400, 'Marketing', 'Campaign and social ads', 6],
    ['EXPENSE', 7600, 'Operations', 'Staff overtime and venue prep', 9],
    ['ADJUSTMENT', 1200, 'Accounting', 'Monthly reconciliation entry', 11],
    ['EXPENSE', 13400, 'Procurement', 'Fabric sourcing expense', 14],
    ['INCOME', 37100, 'Sales', 'Expo lead conversion', 15],
    ['EXPENSE', 5100, 'Maintenance', 'Device and equipment service', 18],
    ['INCOME', 22450, 'Sales', 'Customer bulk re-order', 21],
    ['EXPENSE', 6800, 'Operations', 'Admin supplies and utilities', 24],
    ['ADJUSTMENT', 800, 'Finance', 'Rounding and adjustment entry', 27],
    ['INCOME', 48900, 'Sales', 'Seasonal peak collection', 30],
    ['EXPENSE', 9800, 'Transport', 'Intercity dispatch charges', 33],
    ['EXPENSE', 11800, 'Marketing', 'Exhibition launch campaign', 36],
  ];

  for (const [index, [type, amount, category, description, dayOffset]] of ledgerRows.entries()) {
    const entryDate = dateBeforeDays(dayOffset);
    const existing = await prisma.ledgerEntry.findFirst({
      where: { organizationId, type, category, description, entryDate },
    });

    if (!existing) {
      await prisma.ledgerEntry.create({
        data: {
          organizationId,
          type,
          amount: decimal(amount),
          entryDate,
          category,
          description,
          createdBy: actorId,
        },
      });
    }
  }

  return invoiceRecords;
};

const ensureExhibitionsAndTasks = async (organizationId, actorId, users, customers) => {
  const staffUsers = users.filter((user) => user.role === 'STAFF');
  const exhibitions = [];
  const customerRotation = customers.length > 0 ? customers : [];

  for (const [index, blueprint] of EXHIBITION_BLUEPRINTS.entries()) {
    const assignedStaff = staffUsers.slice(0, 2 + (index % 3)).map((user) => user.id);
    const startDate = dateAfterDays(blueprint.startOffset);
    const endDate = dateAfterDays(blueprint.endOffset);

    const exhibitionData = {
      organizationId,
      name: blueprint.name,
      description: `${blueprint.name} showcasing seeded demo collections`,
      location: blueprint.location,
      startDate,
      endDate,
      status: blueprint.status,
      budget: decimal(blueprint.budget),
      actualSpent: decimal(blueprint.actualSpent),
      expectedRevenue: decimal(blueprint.expectedRevenue),
      actualRevenue: decimal(blueprint.actualRevenue),
      expectedFootfall: blueprint.expectedFootfall,
      actualFootfall: blueprint.actualFootfall,
      boothSize: blueprint.boothSize,
      stallNumber: `S-${String(index + 1).padStart(2, '0')}`,
      category: blueprint.category,
      assignedStaff,
      totalLeads: 0,
      convertedLeads: 0,
      notes: `Seeded exhibition ${blueprint.name}`,
      images: [],
      createdBy: actorId,
    };

    const existingExhibition = await prisma.exhibition.findFirst({
      where: { organizationId, name: blueprint.name },
    });

    const exhibition = existingExhibition
      ? await prisma.exhibition.update({
          where: { id: existingExhibition.id },
          data: exhibitionData,
        })
      : await prisma.exhibition.create({ data: exhibitionData });

    exhibitions.push(exhibition);
  }

  const allTasks = [];

  for (const [index, title] of TASK_BLUEPRINTS.entries()) {
    const assignee = staffUsers[index % staffUsers.length];
    const relatedExhibition = exhibitions[index % exhibitions.length];
    const relatedCustomer = customerRotation[index % customerRotation.length];
    const statusCycle = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];
    const priorityCycle = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const status = statusCycle[index % statusCycle.length];
    const priority = priorityCycle[index % priorityCycle.length];
    const dueDate = index % 4 === 0 ? dateBeforeDays(index + 1) : dateAfterDays(index + 2);
    const taskTitle = `${title} #${index + 1}`;
    const description = `${ACTIVITY_NOTES[index % ACTIVITY_NOTES.length]} for ${relatedExhibition.name}.`;

    const taskData = {
      organizationId,
      title: taskTitle,
      description,
      status,
      priority,
      assignedTo: index % 5 === 0 ? null : assignee.id,
      createdBy: actorId,
      dueDate,
      tags: ['seed', relatedExhibition.category?.toLowerCase() ?? 'general'],
      attachments: [],
      relatedExhibitionId: relatedExhibition.id,
      relatedCustomerId: index % 3 === 0 ? relatedCustomer.id : null,
      completedAt: status === 'COMPLETED' ? dateBeforeDays(index + 1) : null,
    };

    const existingTask = await prisma.task.findFirst({
      where: { organizationId, title: taskTitle },
    });

    const task = existingTask
      ? await prisma.task.update({
          where: { id: existingTask.id },
          data: taskData,
        })
      : await prisma.task.create({ data: taskData });

    allTasks.push(task);

    if (task.assignedTo) {
      const assignedTo = users.find((user) => user.id === task.assignedTo);
      if (assignedTo) {
        const notificationTitle = `Task assigned: ${task.title}`;
        const notificationMessage = `A new task has been assigned to you: ${task.title}`;
        await ensureSeedNotification({
          userId: assignedTo.id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'TASK_ASSIGNED',
          read: index % 4 === 0,
          link: '/app/tasks',
        });
      }
    }

    const commentAuthors = [actorId, assignee.id];
    for (const [commentIndex, authorId] of commentAuthors.entries()) {
      const content = `${ACTIVITY_NOTES[(index + commentIndex) % ACTIVITY_NOTES.length]} (${taskTitle})`;
      const existingComment = await prisma.taskComment.findFirst({
        where: { taskId: task.id, userId: authorId, content },
      });

      if (!existingComment) {
        await prisma.taskComment.create({
          data: {
            taskId: task.id,
            userId: authorId,
            content,
          },
        });
      }
    }
  }

  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CONVERTED', 'LOST'];
  const leadInterests = ['COLD', 'WARM', 'HOT'];
  const leadSources = ['EXHIBITION', 'REFERRAL', 'WEBSITE', 'OTHER'];
  const interactions = ['CALL', 'EMAIL', 'MEETING', 'NOTE'];

  for (const [index, exhibition] of exhibitions.entries()) {
    const leadCount = 6;
    let convertedCount = 0;

    for (let leadIndex = 0; leadIndex < leadCount; leadIndex += 1) {
      const customer = customerRotation[(index * leadCount + leadIndex) % customerRotation.length];
      const capturedBy = staffUsers[(index + leadIndex) % staffUsers.length];
      const status = leadStatuses[(index + leadIndex) % leadStatuses.length];
      const interest = leadInterests[(leadIndex + index) % leadInterests.length];
      const source = leadSources[(leadIndex + index) % leadSources.length];
      const phone = `+91988${String(index).padStart(2, '0')}${String(leadIndex).padStart(2, '0')}${String(100 + leadIndex)}`;
      const leadName = `${customer.name} Lead ${leadIndex + 1}`;
      const estimatedValue = 12000 + index * 5000 + leadIndex * 1800;

      const existingLead = await prisma.exhibitionLead.findFirst({
        where: { exhibitionId: exhibition.id, phone },
      });

      const leadData = {
        exhibitionId: exhibition.id,
        organizationId,
        name: leadName,
        phone,
        email: customer.email,
        company: `${customer.city} Fashion Studio`,
        interestLevel: interest,
        status,
        interestedProducts: ['Sarees', 'Dupattas', 'Designer Sets'],
        notes: `${ACTIVITY_NOTES[leadIndex % ACTIVITY_NOTES.length]} from ${customer.city}`,
        capturedBy: capturedBy.id,
        capturedAt: dateBeforeDays(leadIndex + index + 1),
        followUpDate: leadIndex % 2 === 0 ? dateAfterDays(leadIndex + 2) : null,
        lastContactedDate: leadIndex % 3 === 0 ? dateBeforeDays(leadIndex) : null,
        source,
        estimatedValue: decimal(estimatedValue),
      };

      let lead;
      if (existingLead) {
        lead = await prisma.exhibitionLead.update({
          where: { id: existingLead.id },
          data: leadData,
        });
      } else {
        lead = await prisma.exhibitionLead.create({ data: leadData });
      }

      if (status === 'CONVERTED') {
        convertedCount += 1;
      }

      const interactionType = interactions[(index + leadIndex) % interactions.length];
      const interactionContent = `${interactionType} follow-up for ${leadName}`;
      const interactionExists = await prisma.leadInteraction.findFirst({
        where: { leadId: lead.id, userId: capturedBy.id, type: interactionType, notes: interactionContent },
      });

      if (!interactionExists) {
        await prisma.leadInteraction.create({
          data: {
            leadId: lead.id,
            userId: capturedBy.id,
            type: interactionType,
            notes: interactionContent,
          },
        });
      }
    }

    await prisma.exhibition.update({
      where: { id: exhibition.id },
      data: {
        totalLeads: leadCount,
        convertedLeads: convertedCount,
      },
    });

    const adminNotificationTitle = `Exhibition updated: ${exhibition.name}`;
    const adminNotificationMessage = `${exhibition.name} is ${exhibition.status.toLowerCase()} with ${leadCount} leads seeded for testing.`;
    await ensureSeedNotification({
      userId: actorId,
      title: adminNotificationTitle,
      message: adminNotificationMessage,
      type: exhibition.status === 'ACTIVE' ? 'EXHIBITION_UPDATED' : 'EXHIBITION_CREATED',
      read: index % 2 === 0,
      link: '/app/exhibitions',
    });

    for (const staffUser of staffUsers.slice(0, 3)) {
      const staffNotificationTitle = `Exhibition assignment: ${exhibition.name}`;
      const staffNotificationMessage = `${exhibition.name} was assigned to your team for testing.`;
      await ensureSeedNotification({
        userId: staffUser.id,
        title: staffNotificationTitle,
        message: staffNotificationMessage,
        type: 'EXHIBITION_ASSIGNED',
        read: false,
        link: '/app/exhibitions',
      });
    }
  }

  return { exhibitions, tasks: allTasks };
};

const ensureNotifications = async (users, exhibitions, tasks, actorId) => {
  const orgAdmin = users.find((user) => user.role === 'ORG_ADMIN') ?? users[0];
  const staffUsers = users.filter((user) => user.role === 'STAFF');
  const taskNotifications = tasks.slice(0, 12);

  for (const [index, task] of taskNotifications.entries()) {
    const assignee = task.assignedTo ? users.find((user) => user.id === task.assignedTo) : orgAdmin;
    if (!assignee) continue;

    const title = task.assignedTo
      ? `Task assigned: ${task.title}`
      : `Unassigned task ready: ${task.title}`;
    const message = task.assignedTo
      ? `${task.title} is ready for work and appears in the task board.`
      : `${task.title} still needs an assignee.`;

    await ensureSeedNotification({
      userId: assignee.id,
      title,
      message,
      type: task.assignedTo ? 'TASK_ASSIGNED' : 'TASK_UPDATED',
      read: index % 3 === 0,
      link: '/app/tasks',
    });
  }

  for (const [index, exhibition] of exhibitions.entries()) {
    const recipients = [orgAdmin, ...staffUsers.slice(0, 2)];
    for (const recipient of recipients) {
      const title = `${exhibition.name} status: ${exhibition.status}`;
      const message = `${exhibition.name} is seeded with ${exhibition.totalLeads} leads and ${exhibition.status.toLowerCase()} status.`;
      await ensureSeedNotification({
        userId: recipient.id,
        title,
        message,
        type: exhibition.status === 'ACTIVE' ? 'EXHIBITION_UPDATED' : 'EXHIBITION_CREATED',
        read: index % 2 === 1,
        link: '/app/exhibitions',
      });
    }
  }

  const financeNotifications = [
    { title: 'Finance dashboard refreshed', message: 'Seeded invoices and ledger entries are ready for review.', type: 'TASK_UPDATED' },
    { title: 'Outstanding invoices available', message: 'Open the finance reports to review overdue and pending invoices.', type: 'TASK_UPDATED' },
  ];

  for (const [index, note] of financeNotifications.entries()) {
    await ensureSeedNotification({
      userId: orgAdmin.id,
      title: note.title,
      message: note.message,
      type: note.type,
      read: index === 0,
      link: '/app/finance',
    });
  }

  const staffNotifications = staffUsers.slice(0, 4).flatMap((user, index) => [
    {
      userId: user.id,
      title: `Task summary for ${user.firstName}`,
      message: `You have seeded tasks waiting in the board for ${user.firstName}.`,
      type: 'TASK_UPDATED',
      read: index % 2 === 0,
      link: '/app/tasks',
    },
  ]);

  for (const notification of staffNotifications) {
    await ensureSeedNotification(notification);
  }
};

const main = async () => {
  console.log('Running large demo seed...');

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
    phone: '+910000000099',
    jobTitle: 'Platform Owner',
    employmentType: null,
  });

  const seededUsers = [];
  for (const member of TEAM_MEMBERS) {
    seededUsers.push(
      await upsertUser({
        email: member.email,
        password: member.password,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        organizationId: organization.id,
        phone: member.phone,
        jobTitle: member.jobTitle,
        employmentType: member.employmentType,
      }),
    );
  }

  const plans = await ensureSubscriptionPlans(superAdmin.id);
  const growthPlan = plans.find((plan) => plan.code === 'GROWTH') ?? plans[0];

  await ensureOrganizationSubscription(organization.id, growthPlan.id, superAdmin.id);
  await ensureCustomers(organization.id, seededUsers.find((user) => user.role === 'ORG_ADMIN').id);
  await ensureInventory(organization.id, seededUsers.find((user) => user.role === 'ORG_ADMIN').id);
  const invoices = await ensureFinance(organization.id, seededUsers.find((user) => user.role === 'ORG_ADMIN').id);
  const { exhibitions, tasks } = await ensureExhibitionsAndTasks(
    organization.id,
    seededUsers.find((user) => user.role === 'ORG_ADMIN').id,
    seededUsers,
    await prisma.customer.findMany({ where: { organizationId: organization.id }, orderBy: { createdAt: 'asc' } }),
  );

  await ensureNotifications(
    seededUsers,
    exhibitions,
    tasks,
    seededUsers.find((user) => user.role === 'ORG_ADMIN').id,
  );

  console.log('Large demo seed completed successfully.');
  console.log(`Organization: ${organization.slug}`);
  console.log(`Seeded users: ${seededUsers.length + 1}`);
  console.log(`Seeded invoices: ${invoices.length}`);
  console.log(`Seeded exhibitions: ${exhibitions.length}`);
  console.log(`Seeded tasks: ${tasks.length}`);
  console.log(`Super Admin: ${env.SUPER_ADMIN_EMAIL}`);
  console.log(`Org Admin: ${ORG_ADMIN_EMAIL}`);
  console.log(`Org Admin Password: ${ORG_ADMIN_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error('[FATAL] Large demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
