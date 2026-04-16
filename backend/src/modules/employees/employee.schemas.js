import { z } from 'zod';

const employmentTypeSchema = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY']);

export const employeeCreateSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5).optional(),
    jobTitle: z.string().min(2).optional(),
    employmentType: employmentTypeSchema,
    employmentValidFrom: z.coerce.date().optional(),
    employmentValidTo: z.coerce.date().optional(),
    password: z.string().min(8),
  })
  .refine(
    (data) =>
      !data.employmentValidFrom ||
      !data.employmentValidTo ||
      data.employmentValidTo.getTime() >= data.employmentValidFrom.getTime(),
    {
      message: 'employmentValidTo must be on or after employmentValidFrom',
      path: ['employmentValidTo'],
    },
  );

export const employeeUpdateSchema = z
  .object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(5).optional(),
    jobTitle: z.string().min(2).optional(),
    employmentType: employmentTypeSchema.optional(),
    employmentValidFrom: z.coerce.date().optional().nullable(),
    employmentValidTo: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.employmentValidFrom ||
      !data.employmentValidTo ||
      data.employmentValidTo.getTime() >= data.employmentValidFrom.getTime(),
    {
      message: 'employmentValidTo must be on or after employmentValidFrom',
      path: ['employmentValidTo'],
    },
  );

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  employmentType: employmentTypeSchema.optional(),
});

export const employeeStatusSchema = z.object({
  isActive: z.boolean(),
});

export const moduleKeySchema = z.enum([
  'CUSTOMER_MANAGEMENT',
  'INVENTORY_MANAGEMENT',
  'FINANCE_MANAGEMENT',
  'TASK_MANAGEMENT',
  'EXHIBITION_MANAGEMENT',
  'ANALYTICS_MANAGEMENT',
]);

export const employeeModuleAccessPolicySchema = z.object({
  allowed: z.boolean(),
  limits: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
});

export const employeeModuleAccessUpdateSchema = z.object({
  moduleAccessPolicies: z.record(moduleKeySchema, employeeModuleAccessPolicySchema),
});
