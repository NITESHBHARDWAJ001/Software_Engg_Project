import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../shared/http/httpError.js';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    taskComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: prismaMock,
}));

import { taskService } from './tasks.service.js';

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates task and maps response fields', async () => {
    prismaMock.task.create.mockResolvedValue({
      id: 't1',
      organizationId: 'org-1',
      title: 'Task 1',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assignedTo: null,
      assignedToUser: null,
      createdBy: 'u1',
      createdByUser: { firstName: 'Nitesh', lastName: 'S' },
      dueDate: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
      tags: [],
      attachments: [],
      relatedExhibitionId: null,
      relatedCustomerId: null,
    });

    const result = await taskService.create('org-1', 'u1', { title: 'Task 1' });

    expect(result.id).toBe('t1');
    expect(result.createdByName).toBe('Nitesh S');
    expect(result.status).toBe('TODO');
  });

  it('throws when updating status for missing task', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(taskService.updateStatus('org-1', 'missing', 'COMPLETED')).rejects.toBeInstanceOf(HttpError);
  });

  it('lists tasks with mapped names', async () => {
    prismaMock.task.count.mockResolvedValue(1);
    prismaMock.task.findMany.mockResolvedValue([
      {
        id: 't1',
        organizationId: 'org-1',
        title: 'Task 1',
        description: 'Desc',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedTo: 'u2',
        assignedToUser: { firstName: 'A', lastName: 'User' },
        createdBy: 'u1',
        createdByUser: { firstName: 'N', lastName: 'Admin' },
        dueDate: new Date('2026-01-02T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        completedAt: null,
        tags: [],
        attachments: [],
        relatedExhibitionId: null,
        relatedCustomerId: null,
      },
    ]);

    const result = await taskService.list('org-1', 1, 20, { status: 'IN_PROGRESS' });

    expect(result.total).toBe(1);
    expect(result.items[0].assignedToName).toBe('A User');
    expect(result.items[0].createdByName).toBe('N Admin');
  });

  it('adds comments only when task exists', async () => {
    prismaMock.task.findFirst.mockResolvedValue({ id: 't1', organizationId: 'org-1' });
    prismaMock.taskComment.create.mockResolvedValue({
      id: 'c1',
      taskId: 't1',
      userId: 'u1',
      content: 'hello',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      user: { firstName: 'N', lastName: 'S' },
    });

    const comment = await taskService.addComment('org-1', 't1', 'u1', 'hello');

    expect(comment.userName).toBe('N S');
    expect(comment.content).toBe('hello');
  });
});
