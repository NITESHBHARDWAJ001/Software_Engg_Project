import { z } from 'zod';

export const analyticsStockContextSchema = z.object({
  sourceMode: z.enum(['AUTO', 'MANUAL']).default('AUTO'),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
  items: z.array(
    z.object({
      sku: z.string().min(1),
      name: z.string().min(1),
      category: z.string().optional(),
      current_stock: z.coerce.number().int().default(0),
      note: z.string().max(500).optional(),
    }),
  ).default([]),
});
