import { z } from 'zod';

const InvoiceStatus = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE'];
const LedgerEntryType = ['INCOME', 'EXPENSE', 'ADJUSTMENT'];

export const financeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(InvoiceStatus).optional(),
  search: z.string().optional(),
});

export const invoiceCreateSchema = z
  .object({
    invoiceNumber: z.string().min(2),
    issueDate: z.coerce.date(),
    dueDate: z.coerce.date().optional(),
    currency: z.string().length(3).default('USD'),
    subtotal: z.coerce.number().min(0),
    taxAmount: z.coerce.number().min(0).default(0),
    discountAmount: z.coerce.number().min(0).default(0),
    totalAmount: z.coerce.number().min(0),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.dueDate && payload.dueDate < payload.issueDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Due date must be on or after issue date',
        path: ['dueDate'],
      });
    }
  });

export const invoiceUpdateSchema = z
  .object({
    invoiceNumber: z.string().min(2).optional(),
    issueDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    currency: z.string().length(3).optional(),
    subtotal: z.coerce.number().min(0).optional(),
    taxAmount: z.coerce.number().min(0).optional(),
    discountAmount: z.coerce.number().min(0).optional(),
    totalAmount: z.coerce.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.dueDate && payload.issueDate && payload.dueDate < payload.issueDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'Due date must be on or after issue date',
        path: ['dueDate'],
      });
    }
  });

export const invoiceStatusSchema = z.object({
  status: z.enum(InvoiceStatus),
  paidAt: z.coerce.date().optional(),
});

export const ledgerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(LedgerEntryType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const ledgerCreateSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  type: z.enum(LedgerEntryType),
  amount: z.coerce.number().positive(),
  entryDate: z.coerce.date(),
  category: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
});

export const financeTrendQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'month']).default('month'),
}).superRefine((payload, ctx) => {
  if (payload.from && payload.to && payload.from > payload.to) {
    ctx.addIssue({
      code: 'custom',
      message: 'from must be before to',
      path: ['from'],
    });
  }
});
