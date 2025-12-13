/**
 * Tasks Routes
 * CRM task management endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default('MEDIUM'),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
});

const tasksQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  leadId: z.string().uuid().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/tasks
 * Get all tasks for user
 */
router.get(
  '/',
  validateQuery(tasksQuerySchema),
  asyncHandler(async (req, res) => {
    const {
      page,
      pageSize,
      status,
      priority,
      leadId,
      dueBefore,
      dueAfter,
      sortBy,
      sortOrder,
    } = req.query as any;
    const skip = (page - 1) * pageSize;

    const where: any = {
      userId: req.user!.userId,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (leadId) where.leadId = leadId;

    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) where.dueDate.lte = new Date(dueBefore);
      if (dueAfter) where.dueDate.gte = new Date(dueAfter);
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  })
);

/**
 * GET /api/tasks/today
 * Get today's tasks
 */
router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user!.userId,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: { not: 'COMPLETED' },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: tasks,
    });
  })
);

/**
 * GET /api/tasks/overdue
 * Get overdue tasks
 */
router.get(
  '/overdue',
  asyncHandler(async (req, res) => {
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user!.userId,
        dueDate: { lt: now },
        status: { not: 'COMPLETED' },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: tasks,
    });
  })
);

/**
 * GET /api/tasks/stats
 * Get task statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const now = new Date();

    const [total, byStatus, overdue, dueToday] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.task.count({
        where: {
          userId,
          dueDate: { lt: now },
          status: { not: 'COMPLETED' },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          dueDate: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lt: new Date(now.setHours(23, 59, 59, 999)),
          },
          status: { not: 'COMPLETED' },
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    );

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusCounts,
        overdue,
        dueToday,
      },
    });
  })
);

/**
 * GET /api/tasks/:id
 * Get a specific task
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
      include: {
        lead: true,
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post(
  '/',
  validateBody(createTaskSchema),
  asyncHandler(async (req, res) => {
    const { dueDate, ...rest } = req.body;

    const task = await prisma.task.create({
      data: {
        userId: req.user!.userId,
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  })
);

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put(
  '/:id',
  validateBody(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dueDate, ...rest } = req.body;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    const updateData: any = { ...rest };
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * PATCH /api/tasks/:id/complete
 * Mark task as completed
 */
router.patch(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    await prisma.task.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  })
);

export default router;
