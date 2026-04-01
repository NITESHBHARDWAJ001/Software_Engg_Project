import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { authGuard } from '../../shared/middleware/auth.js';
import { allowRoles } from '../../shared/middleware/rbac.js';
import { tenantGuard } from '../../shared/middleware/tenant.js';
import { prisma } from '../../shared/db/prisma.js';
import { ok } from '../../shared/http/response.js';
import { HttpError } from '../../shared/http/httpError.js';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ORG_ADMIN = 'ORG_ADMIN';
const STAFF = 'STAFF';
const FREE_PLAN_CODE = 'FREE';

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

const normalizeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const createUniqueOrganizationSlug = async (organizationName, explicitSlug) => {
  const base = normalizeSlug(explicitSlug || organizationName) || 'organization';

  let candidate = base;
  let suffix = 2;

  while (true) {
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const ensureFreePlan = async (tx, actorId) => {
  return tx.subscriptionPlan.upsert({
    where: { code: FREE_PLAN_CODE },
    update: {
      isActive: true,
      updatedBy: actorId,
    },
    create: {
      name: 'Free',
      code: FREE_PLAN_CODE,
      description: 'Default onboarding plan for newly joined organizations.',
      billingCycle: 'MONTHLY',
      price: 0,
      currency: 'INR',
      isActive: true,
      features: ['CUSTOMER_MANAGEMENT', 'INVENTORY_MANAGEMENT'],
      limits: {
        maxUsers: 2,
        maxExhibitions: 2,
        maxCustomers: 200,
        maxInventoryItems: 500,
      },
      createdBy: actorId,
      updatedBy: actorId,
    },
  });
};

export const organizationRouter = Router();
organizationRouter.use(authGuard, tenantGuard);

organizationRouter.get('/', allowRoles(SUPER_ADMIN), async (_req, res) => {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(ok(organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    phone: org.phone,
    totalUsers: org._count.users,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  }))));
});

organizationRouter.post('/', allowRoles(SUPER_ADMIN), async (req, res) => {
  const payload = createOrganizationSchema.parse(req.body);

  const existingAdmin = await prisma.user.findUnique({ where: { email: payload.adminEmail } });
  if (existingAdmin) {
    throw new HttpError(409, 'Admin email is already registered', 'EMAIL_ALREADY_EXISTS');
  }

  const slug = await createUniqueOrganizationSlug(payload.name, payload.slug);
  const [firstName, ...rest] = payload.adminName.trim().split(/\s+/);
  const lastName = rest.join(' ') || 'Admin';
  const passwordHash = await argon2.hash(payload.adminPassword);

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: payload.name,
        slug,
        email: payload.email,
        phone: payload.phone,
      },
    });

    const adminUser = await tx.user.create({
      data: {
        email: payload.adminEmail,
        passwordHash,
        firstName: firstName || 'Org',
        lastName,
        role: ORG_ADMIN,
        isActive: true,
        organizationId: organization.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    const freePlan = await ensureFreePlan(tx, req.auth.userId);
    await tx.organizationSubscription.create({
      data: {
        organizationId: organization.id,
        planId: freePlan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        autoRenew: true,
        seats: 2,
        includedFeatures: [],
        excludedFeatures: [],
        metadata: {
          onboarding: 'DEFAULT_FREE_PLAN',
          createdVia: 'SUPER_ADMIN_ORG_CREATION',
        },
        createdBy: req.auth.userId,
        updatedBy: req.auth.userId,
      },
    });

    return { organization, adminUser };
  });

  res.status(201).json(
    ok(
      {
        organization: {
          id: created.organization.id,
          name: created.organization.name,
          slug: created.organization.slug,
          email: created.organization.email,
          phone: created.organization.phone,
          createdAt: created.organization.createdAt,
          updatedAt: created.organization.updatedAt,
        },
        adminUser: created.adminUser,
      },
      'Organization created successfully',
    ),
  );
});

organizationRouter.get('/me', allowRoles(ORG_ADMIN, STAFF), async (req, res) => {
  const organizationId = req.auth.organizationId;
  if (!organizationId) {
    throw new HttpError(400, 'Organization context required', 'ORG_REQUIRED');
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!org) {
    throw new HttpError(404, 'Organization not found', 'ORG_NOT_FOUND');
  }

  res.json(ok(org));
});
