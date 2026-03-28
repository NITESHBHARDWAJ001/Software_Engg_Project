import { z } from 'zod';

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().min(2).optional(),
});

export const inventoryCreateSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  category: z.string().min(2),
  currentStock: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  minStockLevel: z.coerce.number().int().min(0).default(0),
  unitPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  unit: z.string().default('piece'),
});

export const inventoryUpdateSchema = inventoryCreateSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().int(),
  changeType: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  note: z.string().optional(),
}).superRefine((value, ctx) => {
  if ((value.changeType === 'IN' || value.changeType === 'OUT') && value.quantity <= 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Quantity must be greater than zero for IN and OUT changes',
      path: ['quantity'],
    });
  }

  if (value.changeType === 'ADJUSTMENT' && value.quantity === 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Adjustment quantity cannot be zero',
      path: ['quantity'],
    });
  }
});
