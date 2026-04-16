import { prisma } from '../../shared/db/prisma.js';
import { HttpError } from '../../shared/http/httpError.js';

const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const STAFF = 'STAFF';

const staffTaskWhere = (accessContext = {}, scope = 'MY') => {
  if (accessContext.role !== STAFF || !accessContext.userId) return {};
  if (scope === 'GLOBAL') return {};
  return { assignedTo: accessContext.userId };
};

const ensureStaffTaskAccess = (task, accessContext = {}) => {
  if (accessContext.role !== STAFF) return;
  if (!task || task.assignedTo !== accessContext.userId) {
    throw new HttpError(403, 'You can only access tasks assigned to you', 'TASK_FORBIDDEN');
  }
};

const fullName = (user) => {
  if (!user) return undefined;
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
};

const mapTask = (task) => ({
  id: task.id,
  organizationId: task.organizationId,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  assignedTo: task.assignedTo ?? undefined,
  assignedToName: fullName(task.assignedToUser),
  createdBy: task.createdBy,
  createdByName: fullName(task.createdByUser) ?? task.createdBy,
  dueDate: task.dueDate?.toISOString(),
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
  completedAt: task.completedAt?.toISOString(),
  tags: task.tags,
  relatedExhibitionId: task.relatedExhibitionId ?? undefined,
  relatedCustomerId: task.relatedCustomerId ?? undefined,
  attachments: task.attachments,
  comments: task.comments?.map((comment) => ({
    id: comment.id,
    taskId: comment.taskId,
    userId: comment.userId,
    userName: fullName(comment.user),
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  })),
});

const taskInclude = {
  assignedToUser: {
    select: { firstName: true, lastName: true },
  },
  createdByUser: {
    select: { firstName: true, lastName: true },
  },
};

export const taskService = {
  async list(organizationId, page, pageSize, query, accessContext = {}) {
    const where = {
      organizationId,
      ...staffTaskWhere(accessContext, query.scope),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignedTo && accessContext.role !== STAFF ? { assignedTo: query.assignedTo } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      items: items.map(mapTask),
    };
  },

  async stats(organizationId, accessContext = {}) {
    const scope = accessContext.scope || 'GLOBAL';
    const scopedWhere = {
      organizationId,
      ...staffTaskWhere(accessContext, scope),
    };

    const [total, todo, inProgress, review, completed, overdue] = await Promise.all([
      prisma.task.count({ where: scopedWhere }),
      prisma.task.count({ where: { ...scopedWhere, status: TASK_STATUS.TODO } }),
      prisma.task.count({ where: { ...scopedWhere, status: TASK_STATUS.IN_PROGRESS } }),
      prisma.task.count({ where: { ...scopedWhere, status: TASK_STATUS.REVIEW } }),
      prisma.task.count({ where: { ...scopedWhere, status: TASK_STATUS.COMPLETED } }),
      prisma.task.count({
        where: {
          ...scopedWhere,
          dueDate: { lt: new Date() },
          status: { notIn: [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED] },
        },
      }),
    ]);

    return {
      total,
      todo,
      inProgress,
      review,
      completed,
      overdue,
    };
  },

  async getById(organizationId, id, accessContext = {}) {
    const task = await prisma.task.findFirst({
      where: { id, organizationId, ...staffTaskWhere(accessContext) },
      include: {
        ...taskInclude,
        comments: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    return mapTask(task);
  },

  async create(organizationId, userId, payload) {
    const status = payload.status ?? TASK_STATUS.TODO;

    const task = await prisma.task.create({
      data: {
        organizationId,
        title: payload.title,
        description: payload.description ?? '',
        status,
        priority: payload.priority ?? 'MEDIUM',
        assignedTo: payload.assignedTo,
        createdBy: userId,
        dueDate: payload.dueDate,
        tags: payload.tags ?? [],
        attachments: payload.attachments ?? [],
        relatedExhibitionId: payload.relatedExhibitionId,
        relatedCustomerId: payload.relatedCustomerId,
        completedAt: status === TASK_STATUS.COMPLETED ? new Date() : null,
      },
      include: taskInclude,
    });

    return mapTask(task);
  },

  async update(organizationId, id, payload) {
    const existing = await prisma.task.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    const nextStatus = payload.status ?? existing.status;
    const completedAt =
      nextStatus === TASK_STATUS.COMPLETED
        ? existing.completedAt ?? new Date()
        : payload.status
          ? null
          : existing.completedAt;

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assignedTo: payload.assignedTo,
        dueDate: payload.dueDate,
        tags: payload.tags,
        attachments: payload.attachments,
        relatedExhibitionId: payload.relatedExhibitionId,
        relatedCustomerId: payload.relatedCustomerId,
        completedAt,
      },
      include: taskInclude,
    });

    return mapTask(task);
  },

  async updateStatus(organizationId, id, status, accessContext = {}) {
    const existing = await prisma.task.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    ensureStaffTaskAccess(existing, accessContext);

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        status,
        completedAt: status === TASK_STATUS.COMPLETED ? existing.completedAt ?? new Date() : null,
      },
      include: taskInclude,
    });

    return mapTask(task);
  },

  async remove(organizationId, id) {
    const existing = await prisma.task.findFirst({ where: { id, organizationId } });
    if (!existing) {
      throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    await prisma.task.delete({ where: { id: existing.id } });
  },

  async listComments(organizationId, taskId, accessContext = {}) {
    const task = await prisma.task.findFirst({ where: { id: taskId, organizationId } });
    if (!task) {
      throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    ensureStaffTaskAccess(task, accessContext);

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      userName: fullName(comment.user),
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }));
  },

  async addComment(organizationId, taskId, userId, content, accessContext = {}) {
    const task = await prisma.task.findFirst({ where: { id: taskId, organizationId } });
    if (!task) {
      throw new HttpError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    ensureStaffTaskAccess(task, accessContext);

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      userName: fullName(comment.user),
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  },
};
