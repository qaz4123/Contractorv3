/**
 * Workflow Routes
 * Connected customer journey endpoints: Lead → Quote → Project → Invoice
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { workflowService } from '../services/workflow/WorkflowService';
import { sendSuccess, sendCreated } from '../utils/responseHandler';

const router = Router();

router.use(authenticate);

// Validation schemas
const lineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  total: z.number(),
  category: z.string().optional(),
});

const createQuoteFromLeadSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  tax: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  validDays: z.number().min(1).max(365).default(30),
});

const convertQuoteToProjectSchema = z.object({
  startDate: z.string().datetime().optional(),
  estimatedDays: z.number().min(1).optional(),
});

const createInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const markLeadLostSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/workflow/leads/:leadId/quotes
 * Create a quote from a lead
 * Automatically updates lead status to PROPOSAL_SENT
 */
router.post(
  '/leads/:leadId/quotes',
  validateParams(z.object({ leadId: z.string().uuid() })),
  validateBody(createQuoteFromLeadSchema),
  asyncHandler(async (req, res) => {
    const quote = await workflowService.createQuoteFromLead({
      leadId: req.params.leadId,
      userId: req.user!.userId,
      ...req.body,
    });

    sendCreated(res, quote, 'Quote created from lead successfully');
  })
);

/**
 * POST /api/workflow/quotes/:quoteId/project
 * Convert accepted quote to project
 * Updates lead status to WON
 */
router.post(
  '/quotes/:quoteId/project',
  validateParams(z.object({ quoteId: z.string().uuid() })),
  validateBody(convertQuoteToProjectSchema),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);

    const project = await workflowService.convertQuoteToProject({
      quoteId: req.params.quoteId,
      userId: req.user!.userId,
      ...data,
    });

    sendCreated(res, project, 'Project created from quote successfully');
  })
);

/**
 * POST /api/workflow/projects/:projectId/invoices
 * Create invoice from project
 * Uses project costs and links to accepted quote if available
 */
router.post(
  '/projects/:projectId/invoices',
  validateParams(z.object({ projectId: z.string().uuid() })),
  validateBody(createInvoiceSchema),
  asyncHandler(async (req, res) => {
    const invoice = await workflowService.createInvoiceFromProject({
      projectId: req.params.projectId,
      userId: req.user!.userId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate as string) : undefined,
      notes: req.body.notes,
    });

    sendCreated(res, invoice, 'Invoice created from project successfully');
  })
);

/**
 * POST /api/workflow/quotes/:quoteId/invoices
 * Create invoice directly from quote (skip project phase)
 * Useful for simple jobs
 */
router.post(
  '/quotes/:quoteId/invoices',
  validateParams(z.object({ quoteId: z.string().uuid() })),
  validateBody(createInvoiceSchema),
  asyncHandler(async (req, res) => {
    const invoice = await workflowService.createInvoiceFromQuote({
      quoteId: req.params.quoteId,
      userId: req.user!.userId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate as string) : undefined,
      notes: req.body.notes,
    });

    sendCreated(res, invoice, 'Invoice created from quote successfully');
  })
);

/**
 * POST /api/workflow/leads/:leadId/lost
 * Mark lead as lost with optional reason
 */
router.post(
  '/leads/:leadId/lost',
  validateParams(z.object({ leadId: z.string().uuid() })),
  validateBody(markLeadLostSchema),
  asyncHandler(async (req, res) => {
    const lead = await workflowService.markLeadAsLost(
      req.params.leadId,
      req.user!.userId,
      req.body.reason
    );

    sendSuccess(res, lead, 200, 'Lead marked as lost');
  })
);

/**
 * GET /api/workflow/leads/:leadId/journey
 * Get complete customer journey for a lead
 * Returns all related quotes, projects, invoices, and metrics
 */
router.get(
  '/leads/:leadId/journey',
  validateParams(z.object({ leadId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const journey = await workflowService.getCustomerJourney(
      req.params.leadId,
      req.user!.userId
    );

    sendSuccess(res, journey, 200, 'Customer journey retrieved successfully');
  })
);

/**
 * GET /api/workflow/projects/ready-for-invoicing
 * Get all projects that can have invoices created
 */
router.get(
  '/projects/ready-for-invoicing',
  asyncHandler(async (req, res) => {
    const projects = await workflowService.getProjectsReadyForInvoicing(req.user!.userId);

    sendSuccess(res, projects, 200, 'Projects ready for invoicing retrieved');
  })
);

export default router;
