import { z } from 'zod';

const exhibitionStatuses = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const leadInterestLevels = ['COLD', 'WARM', 'HOT'];
const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CONVERTED', 'LOST'];
const leadSources = ['EXHIBITION', 'REFERRAL', 'WEBSITE', 'OTHER'];
const interactionTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE'];

export const exhibitionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(exhibitionStatuses).optional(),
  search: z.string().optional(),
});

export const exhibitionCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(''),
  location: z.string().min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(exhibitionStatuses).default('UPCOMING'),
  budget: z.coerce.number().min(0).default(0),
  actualSpent: z.coerce.number().min(0).default(0),
  expectedRevenue: z.coerce.number().min(0).default(0),
  actualRevenue: z.coerce.number().min(0).default(0),
  expectedFootfall: z.coerce.number().int().min(0).optional(),
  actualFootfall: z.coerce.number().int().min(0).optional(),
  boothSize: z.string().optional(),
  stallNumber: z.string().optional(),
  category: z.string().optional(),
  assignedStaff: z.array(z.string()).default([]),
  notes: z.string().optional(),
  images: z.array(z.string()).default([]),
});

export const exhibitionUpdateSchema = exhibitionCreateSchema.partial();

export const exhibitionLeadCreateSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(3),
  email: z.string().email().optional(),
  company: z.string().optional(),
  interestLevel: z.enum(leadInterestLevels).default('COLD'),
  status: z.enum(leadStatuses).default('NEW'),
  interestedProducts: z.array(z.string()).default([]),
  notes: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
  lastContactedDate: z.coerce.date().optional(),
  source: z.enum(leadSources).default('EXHIBITION'),
  estimatedValue: z.coerce.number().min(0).optional(),
});

export const exhibitionLeadUpdateSchema = exhibitionLeadCreateSchema.partial();

export const leadInteractionCreateSchema = z.object({
  type: z.enum(interactionTypes),
  notes: z.string().min(1),
});
