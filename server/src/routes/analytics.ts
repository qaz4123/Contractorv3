/**
 * Analytics Routes
 * Platform stats and user analytics (admin only for platform stats)
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

// GET /api/analytics/dashboard - User dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const [
    leadStats,
    projectStats,
    taskStats,
    invoiceStats,
    recentLeads,
    upcomingTasks,
  ] = await Promise.all([
    // Lead stats
    prisma.lead.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    // Project stats
    prisma.project.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    // Task stats
    prisma.task.aggregate({
      where: { userId },
      _count: true,
    }),
    // Invoice stats
    prisma.invoice.aggregate({
      where: { userId },
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),
    // Recent leads
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        status: true,
        leadScore: true,
        createdAt: true,
      },
    }),
    // Upcoming tasks
    prisma.task.findMany({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        lead: { select: { id: true, name: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      leads: {
        byStatus: Object.fromEntries(leadStats.map(s => [s.status, s._count])),
        total: leadStats.reduce((sum, s) => sum + s._count, 0),
      },
      projects: {
        byStatus: Object.fromEntries(projectStats.map(s => [s.status, s._count])),
        total: projectStats.reduce((sum, s) => sum + s._count, 0),
      },
      tasks: {
        total: taskStats._count,
      },
      invoices: {
        count: invoiceStats._count,
        totalInvoiced: invoiceStats._sum.total || 0,
        totalCollected: invoiceStats._sum.amountPaid || 0,
      },
      recentLeads,
      upcomingTasks,
    },
  });
}));

// GET /api/analytics/revenue - Revenue data with breakdown
router.get('/revenue', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const months = parseInt(req.query.months as string) || 6;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Get invoices with project info
  const invoices = await prisma.invoice.findMany({
    where: { 
      userId,
      createdAt: { gte: startDate },
    },
  });

  // Get projects for type info
  const projectIds = invoices.map(inv => inv.projectId).filter(Boolean) as string[];
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true }
  });
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Calculate total revenue
  const total = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  // Revenue by project type (using project name as type for now)
  const byProjectType: Record<string, number> = {};
  invoices.forEach(inv => {
    const project = inv.projectId ? projectMap.get(inv.projectId) : null;
    const type = project?.name || 'Other';
    byProjectType[type] = (byProjectType[type] || 0) + (inv.amountPaid || 0);
  });

  // Revenue by month
  const byMonth: { month: string; revenue: number }[] = [];
  const monthMap: Record<string, number> = {};
  
  invoices.forEach(inv => {
    if (inv.amountPaid) {
      const monthKey = inv.createdAt.toISOString().slice(0, 7);
      monthMap[monthKey] = (monthMap[monthKey] || 0) + inv.amountPaid;
    }
  });

  // Fill in missing months
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    const monthName = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    byMonth.unshift({ month: monthName, revenue: monthMap[monthKey] || 0 });
  }

  // Average per project
  const projectCount = await prisma.project.count({ where: { userId } });
  const avgPerProject = projectCount > 0 ? total / projectCount : 0;

  res.json({
    success: true,
    data: {
      total,
      byProjectType,
      byMonth,
      avgPerProject,
    },
  });
}));

// GET /api/analytics/profit-margins - Profit margins analysis
router.get('/profit-margins', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  // Get projects with quotes and invoices
  const projects = await prisma.project.findMany({
    where: { userId },
    include: {
      quotes: { select: { total: true } },
      invoices: { select: { total: true, amountPaid: true } },
    },
  });

  // Calculate overall profit margin
  let totalRevenue = 0;
  let totalCost = 0;

  const byProjectType: Record<string, number> = {};
  const projectTypeCounts: Record<string, { revenue: number; cost: number }> = {};

  projects.forEach(project => {
    const revenue = project.invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const quotedAmount = project.quotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const estimatedCost = quotedAmount * 0.7;

    totalRevenue += revenue;
    totalCost += estimatedCost;

    // Use project name as type
    const type = project.name || 'Other';
    if (!projectTypeCounts[type]) {
      projectTypeCounts[type] = { revenue: 0, cost: 0 };
    }
    projectTypeCounts[type].revenue += revenue;
    projectTypeCounts[type].cost += estimatedCost;
  });

  Object.entries(projectTypeCounts).forEach(([type, data]) => {
    if (data.revenue > 0) {
      byProjectType[type] = Math.round(((data.revenue - data.cost) / data.revenue) * 100);
    }
  });

  const overall = totalRevenue > 0 
    ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) 
    : 0;

  res.json({
    success: true,
    data: {
      overall,
      byProjectType,
      byClientRating: {},
    },
  });
}));

// GET /api/analytics/costs - Cost breakdown
router.get('/costs', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const quotes = await prisma.quote.findMany({
    where: { 
      project: { userId },
    },
    include: {
      project: { select: { id: true, name: true } }
    }
  });

  const totalQuoted = quotes.reduce((sum, q) => sum + (q.total || 0), 0);
  
  const materials = Math.round(totalQuoted * 0.4);
  const labor = Math.round(totalQuoted * 0.45);
  const overhead = Math.round(totalQuoted * 0.15);

  const byProject = Object.values(
    quotes.reduce((acc, q) => {
      const projectId = q.project?.id || 'unknown';
      if (!acc[projectId]) {
        acc[projectId] = { projectId, total: 0 };
      }
      acc[projectId].total += q.total || 0;
      return acc;
    }, {} as Record<string, { projectId: string; total: number }>)
  );

  res.json({
    success: true,
    data: {
      materials,
      labor,
      overhead,
      byProject,
    },
  });
}));

// GET /api/analytics/leads - Lead conversion funnel
router.get('/leads', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const [byStatus, bySource, avgScore] = await Promise.all([
    prisma.lead.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { userId, source: { not: null } },
      _count: true,
    }),
    prisma.lead.aggregate({
      where: { userId, leadScore: { not: null } },
      _avg: { leadScore: true },
    }),
  ]);

  const total = byStatus.reduce((sum, s) => sum + s._count, 0);
  const won = byStatus.find(s => s.status === 'WON')?._count || 0;
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

  res.json({
    success: true,
    data: {
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      bySource: Object.fromEntries(bySource.map(s => [s.source || 'Unknown', s._count])),
      total,
      conversionRate,
      avgLeadScore: Math.round(avgScore._avg.leadScore || 0),
    },
  });
}));

// GET /api/analytics/platform - Platform-wide stats (admin only)
router.get('/platform', asyncHandler(async (req, res) => {
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newUsersToday,
    totalLeads,
    totalProjects,
    totalInvoiced,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.lead.count(),
    prisma.project.count(),
    prisma.invoice.aggregate({ _sum: { total: true } }),
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      newUsersToday,
      activeUsersLast7Days: activeUsers,
      totalLeads,
      totalProjects,
      totalInvoiced: totalInvoiced._sum.total || 0,
    },
  });
}));

export default router;
