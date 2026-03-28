import { z } from 'zod';

const billingCycles = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
const subscriptionStatuses = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'];

export const planListQuerySchema = z.object({
  activeOnly: z.coerce.boolean().default(false),
});

export const planCreateSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_\-]+$/i),
  description: z.string().max(2000).optional(),
  billingCycle: z.enum(billingCycles),
  price: z.coerce.number().min(0),
  currency: z.string().length(3).default('USD'),
  isActive: z.boolean().default(true),
  features: z.array(z.string().min(1)).default([]),
  limits: z.record(z.any()).optional(),
});

export const planUpdateSchema = planCreateSchema.partial();

export const organizationSubscriptionCreateSchema = z
  .object({
    planId: z.string().uuid(),
    status: z.enum(subscriptionStatuses).default('ACTIVE'),
    startDate: z.coerce.date().default(() => new Date()),
    endDate: z.coerce.date().optional(),
    trialEndsAt: z.coerce.date().optional(),
    autoRenew: z.boolean().default(true),
    seats: z.coerce.number().int().positive().optional(),
    includedFeatures: z.array(z.string().min(1)).default([]),
    excludedFeatures: z.array(z.string().min(1)).default([]),
    metadata: z.record(z.any()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'endDate must be on or after startDate',
        path: ['endDate'],
      });
    }
  });

export const organizationSubscriptionUpdateSchema = z
  .object({
    status: z.enum(subscriptionStatuses).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    trialEndsAt: z.coerce.date().optional(),
    autoRenew: z.boolean().optional(),
    seats: z.coerce.number().int().positive().optional(),
    includedFeatures: z.array(z.string().min(1)).optional(),
    excludedFeatures: z.array(z.string().min(1)).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        message: 'endDate must be on or after startDate',
        path: ['endDate'],
      });
    }
  });
