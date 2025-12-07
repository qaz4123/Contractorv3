/**
 * Leads Routes
 * CRM lead management with AI-powered Lead Intelligence
 */

import { Router } from 'express';
import { z } from 'zod';
import { LeadStatus, TaskPriority } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, validateParams, paginationSchema } from '../middleware/validation';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { LeadIntelligenceService } from '../services/leads/LeadIntelligenceService';
import { sendPaginated, sendSuccess, sendCreated } from '../utils/responseHandler';
import { isValidUUID } from '../utils/validation';
import prisma from '../lib/prisma';

const router = Router();
const leadIntelService = new LeadIntelligenceService();

// All routes require authentication
router.use(authenticate);

// Enum mappings for renovation potential and owner motivation
const RENOVATION_POTENTIAL = { LOW: 1, MEDIUM: 2, HIGH: 3, EXCELLENT: 4 } as const;
const OWNER_MOTIVATION = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 } as const;

// Validation schemas
const createLeadSchema = z.object({
  // Support both address formats
  address: z.string().optional(),
  fullAddress: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  // Client info
  name: z.string().optional(),
  clientName: z.string().optional().nullable(),
  email: z.string().optional(),
  clientEmail: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional(),
  clientPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
}).refine(
  (data) => data.address || data.fullAddress || data.street,
  { message: 'Address is required', path: ['address'] }
);

const updateLeadSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  clientName: z.string().optional().nullable(),
  clientEmail: z.string().email('Invalid email').optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  leadScore: z.number().min(0).max(100).optional(),
  renovationPotential: z.number().min(1).max(4).optional(),
  ownerMotivation: z.number().min(1).max(4).optional(),
  profitPotential: z.number().optional(),
});

const leadsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(LeadStatus).optional(),
  search: z.string().optional(),
  minScore: z.coerce.number().optional(),
  maxScore: z.coerce.number().optional(),
  renovationPotential: z.coerce.number().min(1).max(4).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'leadScore', 'status', 'address']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/leads
 * Get all leads for user with filtering and pagination
 */
router.get(
  '/',
  validateQuery(leadsQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, pageSize, status, search, minScore, maxScore, renovationPotential, sortBy, sortOrder } = req.query as any;
    const skip = (page - 1) * pageSize;

    const where: any = {
      userId: req.user!.userId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minScore !== undefined || maxScore !== undefined) {
      where.leadScore = {};
      if (minScore !== undefined) where.leadScore.gte = minScore;
      if (maxScore !== undefined) where.leadScore.lte = maxScore;
    }

    if (renovationPotential !== undefined) {
      where.renovationPotential = renovationPotential;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
        include: {
          tasks: {
            where: { completedAt: null },
            take: 3,
            orderBy: { dueDate: 'asc' }
          }
        }
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      success: true,
      data: leads,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  })
);

/**
 * GET /api/leads/stats
 * Get lead statistics overview
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const [total, byStatus, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { userId } }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
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
          createdAt: true,
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    );

    const convertedCount = statusCounts['CONVERTED'] || 0;
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusCounts,
        conversionRate,
        recentLeads,
      },
    });
  })
);

/**
 * GET /api/leads/:id
 * Get a specific lead
 */
router.get(
  '/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    res.json({
      success: true,
      data: lead,
    });
  })
);

/**
 * POST /api/leads
 * Create a new lead with AI-powered intelligence
 */
router.post(
  '/',
  validateBody(createLeadSchema),
  asyncHandler(async (req, res) => {
    const { 
      address, 
      fullAddress,
      street,
      city,
      state,
      zipCode,
      name,
      clientName, 
      email,
      clientEmail, 
      phone,
      clientPhone, 
      notes, 
      source 
    } = req.body;

    // Use the provided address or construct from parts
    const addressString = fullAddress || address || `${street || ''}, ${city || ''}, ${state || ''} ${zipCode || ''}`.trim();
    
    // Parse address into components if not already provided
    const addressParts = street ? { street, city, state, zipCode } : parseAddress(addressString);
    
    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        userId: req.user!.userId,
        street: addressParts.street,
        city: addressParts.city,
      }
    });

    if (existingLead) {
      res.status(400).json({
        success: false,
        error: 'Lead with this address already exists',
        existingLeadId: existingLead.id
      });
      return;
    }

    // Generate AI intelligence
    console.log('Generating lead intelligence for:', address);
    let intelligence;
    try {
      intelligence = await leadIntelService.generateLeadIntelligence(address, req.user!.userId);
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
      intelligence = null;
    }

    // Create lead with intelligence data
    const lead = await prisma.lead.create({
      data: {
        userId: req.user!.userId,
        name: name || clientName || 'Property Owner',
        email: email || clientEmail || null,
        phone: phone || clientPhone || null,
        street: addressParts.street || street || '',
        city: addressParts.city || city || '',
        state: addressParts.state || state || '',
        zipCode: addressParts.zipCode || zipCode || '',
        fullAddress: fullAddress || address || addressString,
        status: 'NEW',
        source: source || 'QUICK_INPUT',
        notes,
        ...(intelligence && {
          leadScore: intelligence.leadScore,
          renovationPotential: RENOVATION_POTENTIAL[intelligence.renovationPotential] || 2,
          ownerMotivation: OWNER_MOTIVATION[intelligence.ownerMotivation] || 2,
          profitPotential: intelligence.profitPotential,
          propertyIntel: intelligence.propertyIntel as any,
          ownerIntel: intelligence.ownerIntel as any,
          financialIntel: intelligence.financialIntel as any,
          permitHistory: intelligence.permitHistory as any,
          renovationOpps: intelligence.renovationOpps as any,
          salesApproach: intelligence.salesApproach as any,
          analyzedAt: new Date(),
        })
      }
    });

    // Create initial follow-up task if we have intelligence
    if (intelligence) {
      const urgencyToPriority: Record<string, TaskPriority> = {
        'IMMEDIATE': 'URGENT' as TaskPriority,
        'HIGH': 'HIGH' as TaskPriority,
        'MEDIUM': 'MEDIUM' as TaskPriority,
        'LOW': 'LOW' as TaskPriority
      };
      const priority = urgencyToPriority[intelligence.salesApproach?.urgencyLevel || 'MEDIUM'] || ('MEDIUM' as TaskPriority);
      
      await prisma.task.create({
        data: {
          userId: req.user!.userId,
          leadId: lead.id,
          title: `Initial contact: ${addressParts.street}`,
          description: intelligence.salesApproach?.recommendedApproach || 'Follow up with property owner',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          priority
        }
      });
    }

    res.status(201).json({
      success: true,
      data: lead,
      hasIntelligence: !!intelligence
    });
  })
);

// Helper to parse address string
function parseAddress(address: string): { street: string; city: string; state: string; zipCode: string } {
  // Simple address parsing - in production you'd use a proper geocoding service
  const parts = address.split(',').map(p => p.trim());
  
  let street = parts[0] || address;
  let city = parts[1] || '';
  let stateZip = parts[2] || '';
  
  // Parse state and zip from "CA 90210" format
  const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);
  const state = stateZipMatch ? stateZipMatch[1] : stateZip;
  const zipCode = stateZipMatch ? stateZipMatch[2] || '' : '';
  
  return { street, city, state, zipCode };
}

/**
 * PUT /api/leads/:id
 * Update a lead
 */
router.put(
  '/:id',
  validateBody(updateLeadSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: req.body,
    });

    res.json({
      success: true,
      data: lead,
    });
  })
);

/**
 * PATCH /api/leads/:id/status
 * Update lead status
 */
router.patch(
  '/:id/status',
  validateBody(z.object({ status: z.nativeEnum(LeadStatus) })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      data: lead,
    });
  })
);

/**
 * PATCH /api/leads/:id/contact
 * Mark lead as contacted
 */
router.patch(
  '/:id/contact',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        lastContactAt: new Date(),
        status: existing.status === 'NEW' ? 'CONTACTED' : existing.status,
      },
    });

    res.json({
      success: true,
      data: lead,
    });
  })
);

/**
 * POST /api/leads/:id/refresh-intelligence
 * Regenerate AI intelligence for a lead
 */
router.post(
  '/:id/refresh-intelligence',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    const address = `${existing.street}, ${existing.city}, ${existing.state} ${existing.zipCode}`;
    console.log('Refreshing lead intelligence for:', address);
    
    const intelligence = await leadIntelService.generateLeadIntelligence(address, req.user!.userId, id);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        leadScore: intelligence.leadScore,
        renovationPotential: RENOVATION_POTENTIAL[intelligence.renovationPotential] || 2,
        ownerMotivation: OWNER_MOTIVATION[intelligence.ownerMotivation] || 2,
        profitPotential: intelligence.profitPotential,
        propertyIntel: intelligence.propertyIntel as any,
        ownerIntel: intelligence.ownerIntel as any,
        financialIntel: intelligence.financialIntel as any,
        permitHistory: intelligence.permitHistory as any,
        renovationOpps: intelligence.renovationOpps as any,
        salesApproach: intelligence.salesApproach as any,
        analyzedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: lead,
    });
  })
);

/**
 * POST /api/leads/:id/convert-to-project
 * Convert a lead into a project
 */
router.post(
  '/:id/convert-to-project',
  validateBody(z.object({
    title: z.string().min(3, 'Project title is required'),
    description: z.string().optional(),
    startDate: z.string().optional(),
    estimatedEndDate: z.string().optional(),
    budget: z.number().optional(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, startDate, estimatedEndDate, budget } = req.body;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    if (lead.status === 'WON') {
      res.status(400).json({
        success: false,
        error: 'Lead already converted to a project',
      });
      return;
    }

    // Create project from lead
    const project = await prisma.project.create({
      data: {
        userId: req.user!.userId,
        leadId: lead.id,
        name: title,
        description: description || `Renovation project at ${lead.street}, ${lead.city}`,
        street: lead.street,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zipCode,
        status: 'PLANNING',
        startDate: startDate ? new Date(startDate) : null,
        estimatedBudget: budget || lead.profitPotential || 0,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: { status: 'WON' },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

/**
 * POST /api/leads/:id/convert-to-project
 * Convert lead to project
 */
router.post(
  '/:id/convert-to-project',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    // Create project from lead
    const project = await prisma.project.create({
      data: {
        leadId: lead.id,
        userId: req.user!.userId,
        name: lead.fullAddress,
        description: `Project converted from lead: ${lead.fullAddress}`,
        street: lead.street,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zipCode,
        status: 'PLANNING',
        estimatedBudget: lead.profitPotential ? lead.profitPotential * 1000 : undefined,
      },
    });

    // Update lead status to WON
    await prisma.lead.update({
      where: { id },
      data: { status: LeadStatus.WON },
    });

    res.json(project);
  })
);

/**
 * DELETE /api/leads/:id
 * Delete a lead
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
      return;
    }

    await prisma.lead.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  })
);

export default router;
