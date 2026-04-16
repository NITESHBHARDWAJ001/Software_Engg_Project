import argon2 from 'argon2';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const ACTIVE_STATES = ['TRIALING', 'ACTIVE', 'PAST_DUE'];
const MODULE_ACCESS_USER_METADATA_KEY = 'moduleAccessUserPolicies';
const SUPPORTED_MODULE_KEYS = [
  'CUSTOMER_MANAGEMENT',
  'INVENTORY_MANAGEMENT',
  'FINANCE_MANAGEMENT',
  'TASK_MANAGEMENT',
  'EXHIBITION_MANAGEMENT',
  'ANALYTICS_MANAGEMENT',
];

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  jobTitle: true,
  role: true,
  isActive: true,
  employmentType: true,
  employmentValidFrom: true,
  employmentValidTo: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
};

const ensureWithinOrganization = async (organizationId, id) => {
  const employee = await prisma.user.findFirst({
    where: { id, organizationId, role: 'STAFF' },
  });

  if (!employee) {
    throw new HttpError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  return employee;
};

const getUserModulePoliciesFromMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return {};
  const policies = metadata[MODULE_ACCESS_USER_METADATA_KEY];
  if (!policies || typeof policies !== 'object') return {};
  return policies;
};

const sanitizeModuleAccessPolicies = (policies = {}) => {
  const result = {};
  for (const key of SUPPORTED_MODULE_KEYS) {
    if (!policies[key] || typeof policies[key] !== 'object') continue;
    result[key] = {
      allowed: policies[key].allowed !== false,
      ...(policies[key].limits && typeof policies[key].limits === 'object'
        ? { limits: policies[key].limits }
        : {}),
    };
  }
  return result;
};

const resolveDefaultModulePolicies = (overridePolicies = {}) => {
  const resolved = {};
  for (const key of SUPPORTED_MODULE_KEYS) {
    resolved[key] = overridePolicies[key] ?? { allowed: true, limits: {} };
  }
  return resolved;
};

export const employeeService = {
  async list(organizationId, page, pageSize, search, status, employmentType) {
    const where = {
      organizationId,
      role: 'STAFF',
      ...(status === 'ACTIVE' ? { isActive: true } : {}),
      ...(status === 'INACTIVE' ? { isActive: false } : {}),
      ...(employmentType ? { employmentType } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { jobTitle: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, employees] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: USER_SELECT,
      }),
    ]);

    return { total, employees };
  },

  async create(organizationId, payload) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new HttpError(409, 'Email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await argon2.hash(payload.password);

    return prisma.user.create({
      data: {
        organizationId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        jobTitle: payload.jobTitle,
        employmentType: payload.employmentType,
        employmentValidFrom: payload.employmentValidFrom,
        employmentValidTo: payload.employmentValidTo,
        role: 'STAFF',
        isActive: true,
        passwordHash,
      },
      select: USER_SELECT,
    });
  },

  async update(organizationId, id, payload) {
    await ensureWithinOrganization(organizationId, id);

    return prisma.user.update({
      where: { id },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        jobTitle: payload.jobTitle,
        employmentType: payload.employmentType,
        employmentValidFrom:
          payload.employmentValidFrom === null ? null : payload.employmentValidFrom,
        employmentValidTo: payload.employmentValidTo === null ? null : payload.employmentValidTo,
        isActive: payload.isActive,
      },
      select: USER_SELECT,
    });
  },

  async setStatus(organizationId, id, isActive) {
    await ensureWithinOrganization(organizationId, id);

    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: USER_SELECT,
    });
  },

  async getModuleAccess(organizationId, employeeId) {
    await ensureWithinOrganization(organizationId, employeeId);

    const current = await prisma.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ACTIVE_STATES },
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, metadata: true },
    });

    const metadata = current?.metadata && typeof current.metadata === 'object' ? current.metadata : {};
    const userPolicies = getUserModulePoliciesFromMetadata(metadata);
    const employeePolicies = sanitizeModuleAccessPolicies(userPolicies[employeeId] || {});

    return {
      employeeId,
      moduleAccessPolicies: resolveDefaultModulePolicies(employeePolicies),
    };
  },

  async updateModuleAccess(organizationId, actorUserId, employeeId, moduleAccessPolicies) {
    await ensureWithinOrganization(organizationId, employeeId);

    const current = await prisma.organizationSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ACTIVE_STATES },
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, metadata: true },
    });

    if (!current) {
      throw new HttpError(404, 'No active subscription found for organization', 'SUBSCRIPTION_NOT_FOUND');
    }

    const existingMetadata = current.metadata && typeof current.metadata === 'object' ? current.metadata : {};
    const userPolicies = getUserModulePoliciesFromMetadata(existingMetadata);
    const mergedEmployeePolicies = {
      ...(userPolicies[employeeId] && typeof userPolicies[employeeId] === 'object' ? userPolicies[employeeId] : {}),
      ...sanitizeModuleAccessPolicies(moduleAccessPolicies),
    };

    const updatedUserPolicies = {
      ...userPolicies,
      [employeeId]: mergedEmployeePolicies,
    };

    await prisma.organizationSubscription.update({
      where: { id: current.id },
      data: {
        metadata: {
          ...existingMetadata,
          [MODULE_ACCESS_USER_METADATA_KEY]: updatedUserPolicies,
        },
        updatedBy: actorUserId,
      },
    });

    return {
      employeeId,
      moduleAccessPolicies: resolveDefaultModulePolicies(mergedEmployeePolicies),
    };
  },
};
