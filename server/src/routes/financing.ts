/**
 * Financing Routes
 * Financing offers and commission tracking
 */

import { Router } from 'express';
import { z } from 'zod';
import { FinancingStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

// Schemas
const createOfferSchema = z.object({
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  lenderName: z.string().min(2),
  lenderLogo: z.string().url().optional(),
  amount: z.number().min(1000),
  interestRate: z.number().min(0).max(100),
  termMonths: z.number().min(1).max(360),
  monthlyPayment: z.number().min(0),
});

const offersQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(FinancingStatus).optional(),
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

// GET /api/financing - Get financing offers
router.get('/', validateQuery(offersQuerySchema), asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20, status, leadId, projectId } = req.query as any;

  // Get leads/projects owned by user to filter financing
  const userLeads = await prisma.lead.findMany({
    where: { userId: req.user!.userId },
    select: { id: true },
  });
  const userProjects = await prisma.project.findMany({
    where: { userId: req.user!.userId },
    select: { id: true },
  });

  const leadIds = userLeads.map(l => l.id);
  const projectIds = userProjects.map(p => p.id);

  const where: any = {
    OR: [
      { leadId: { in: leadIds } },
      { projectId: { in: projectIds } },
    ],
  };

  if (status) where.status = status;
  if (leadId) where.leadId = leadId;
  if (projectId) where.projectId = projectId;

  const [offers, total] = await Promise.all([
    prisma.financingOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.financingOffer.count({ where }),
  ]);

  res.json({
    success: true,
    data: offers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}));

// GET /api/financing/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const userLeads = await prisma.lead.findMany({
    where: { userId: req.user!.userId },
    select: { id: true },
  });
  const userProjects = await prisma.project.findMany({
    where: { userId: req.user!.userId },
    select: { id: true },
  });

  const leadIds = userLeads.map(l => l.id);
  const projectIds = userProjects.map(p => p.id);

  const where = {
    OR: [
      { leadId: { in: leadIds } },
      { projectId: { in: projectIds } },
    ],
  };

  const [total, byStatus, totalFunded, commissions] = await Promise.all([
    prisma.financingOffer.count({ where }),
    prisma.financingOffer.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.financingOffer.aggregate({
      where: { ...where, status: 'FUNDED' },
      _sum: { amount: true },
    }),
    prisma.financingOffer.aggregate({
      where: { ...where, status: 'FUNDED' },
      _sum: { commissionAmount: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      totalFunded: totalFunded._sum.amount || 0,
      totalCommissions: commissions._sum.commissionAmount || 0,
    },
  });
}));

// GET /api/financing/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const offer = await prisma.financingOffer.findUnique({
    where: { id: req.params.id },
  });

  if (!offer) {
    res.status(404).json({ success: false, error: 'Offer not found' });
    return;
  }

  res.json({ success: true, data: offer });
}));

// POST /api/financing - Create financing offer
router.post('/', validateBody(createOfferSchema), asyncHandler(async (req, res) => {
  // Verify lead/project ownership
  if (req.body.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: req.body.leadId, userId: req.user!.userId },
    });
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
  }

  if (req.body.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: req.body.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }
  }

  const offer = await prisma.financingOffer.create({
    data: {
      ...req.body,
      status: 'OFFERED',
      commissionRate: 0.02, // 2% default
    },
  });

  res.status(201).json({ success: true, data: offer });
}));

// PATCH /api/financing/:id/status
router.patch('/:id/status', validateBody(z.object({
  status: z.nativeEnum(FinancingStatus),
})), asyncHandler(async (req, res) => {
  const offer = await prisma.financingOffer.findUnique({
    where: { id: req.params.id },
  });

  if (!offer) {
    res.status(404).json({ success: false, error: 'Offer not found' });
    return;
  }

  const updateData: any = { status: req.body.status };

  // Set timestamps based on status
  if (req.body.status === 'APPROVED') {
    updateData.acceptedAt = new Date();
  } else if (req.body.status === 'FUNDED') {
    updateData.fundedAt = new Date();
    updateData.commissionAmount = offer.amount * offer.commissionRate;
  }

  const updated = await prisma.financingOffer.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({ success: true, data: updated });
}));

// DELETE /api/financing/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const offer = await prisma.financingOffer.findUnique({
    where: { id: req.params.id },
  });

  if (!offer) {
    res.status(404).json({ success: false, error: 'Offer not found' });
    return;
  }

  if (offer.status === 'FUNDED') {
    res.status(400).json({ success: false, error: 'Cannot delete funded offer' });
    return;
  }

  await prisma.financingOffer.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Offer deleted' });
}));

export default router;
