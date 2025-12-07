/**
 * Automation Routes
 * AI-powered suggestions and automated actions
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

// GET /api/automation/suggestions - Get AI-powered action suggestions
router.get('/suggestions', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const suggestions: Array<{
    type: 'follow_up' | 'send_quote' | 'schedule_visit' | 'order_materials';
    priority: 'high' | 'medium' | 'low';
    description: string;
    relatedId: string;
  }> = [];

  // Get leads that need follow-up
  const staleLeads = await prisma.lead.findMany({
    where: {
      userId,
      status: { in: ['NEW', 'CONTACTED'] },
      updatedAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
      },
    },
    take: 5,
    orderBy: { leadScore: 'desc' },
  });

  staleLeads.forEach(lead => {
    const isHighScore = (lead.leadScore || 0) >= 70;
    suggestions.push({
      type: 'follow_up',
      priority: isHighScore ? 'high' : 'medium',
      description: `Follow up with lead at ${lead.street || lead.name || 'Unknown'} - no activity for 7+ days`,
      relatedId: lead.id,
    });
  });

  // Get qualified leads without quotes
  const leadsNeedingQuotes = await prisma.lead.findMany({
    where: {
      userId,
      status: 'QUALIFIED',
      quotes: { none: {} },
    },
    take: 3,
  });

  leadsNeedingQuotes.forEach(lead => {
    suggestions.push({
      type: 'send_quote',
      priority: 'high',
      description: `Send quote for qualified lead at ${lead.street || lead.name || 'Unknown'}`,
      relatedId: lead.id,
    });
  });

  // Get overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() },
    },
    take: 3,
    orderBy: { dueDate: 'asc' },
  });

  overdueTasks.forEach(task => {
    suggestions.push({
      type: 'schedule_visit',
      priority: 'high',
      description: `Overdue task: ${task.title}`,
      relatedId: task.id,
    });
  });

  // Get projects that may need materials
  const activeProjects = await prisma.project.findMany({
    where: {
      userId,
      status: 'IN_PROGRESS',
    },
    take: 2,
  });

  activeProjects.forEach(project => {
    suggestions.push({
      type: 'order_materials',
      priority: 'low',
      description: `Check material needs for ${project.name} project`,
      relatedId: project.id,
    });
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  res.json({
    success: true,
    data: suggestions,
  });
}));

// POST /api/automation/schedule - Schedule an automated task
router.post('/schedule', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { type, scheduledFor, relatedId, action } = req.body;

  // Create a scheduled task
  const task = await prisma.task.create({
    data: {
      userId,
      title: `Automated: ${type}`,
      description: JSON.stringify(action),
      dueDate: new Date(scheduledFor),
      status: 'PENDING',
      priority: 'MEDIUM',
      leadId: type === 'follow_up' || type === 'send_quote' ? relatedId : undefined,
      projectId: type === 'order_materials' ? relatedId : undefined,
    },
  });

  res.json({
    success: true,
    data: task,
  });
}));

export default router;
