import { z } from 'zod';

export const customerCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
