import argon2 from 'argon2';
import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

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
};
