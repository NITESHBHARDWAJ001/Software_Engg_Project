import { z } from 'zod';

const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];
const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  scope: z.enum(['MY', 'GLOBAL']).default('GLOBAL'),
  search: z.string().optional(),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  assignedTo: z.string().optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().default(''),
  status: z.enum(taskStatuses).default('TODO'),
  priority: z.enum(taskPriorities).default('MEDIUM'),
  assignedTo: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  tags: z.array(z.string().min(1)).default([]),
  attachments: z.array(z.string().min(1)).default([]),
  relatedExhibitionId: z.string().optional(),
  relatedCustomerId: z.string().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskStatusUpdateSchema = z.object({
  status: z.enum(taskStatuses),
});

export const taskCommentCreateSchema = z.object({
  content: z.string().min(1),
});
