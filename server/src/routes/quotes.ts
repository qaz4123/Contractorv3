/**
 * Quotes Routes
 * Quote management endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import { QuoteStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { quoteService } from '../services/quotes/QuoteService';
import prisma from '../lib/prisma';

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

const createQuoteSchema = z.object({
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  tax: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  validDays: z.number().min(1).max(365).default(30),
});

const updateQuoteSchema = createQuoteSchema.partial();

const quotesQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(QuoteStatus).optional(),
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

// GET /api/quotes
router.get('/', validateQuery(quotesQuerySchema), asyncHandler(async (req, res) => {
  const result = await quoteService.getQuotes(req.user!.userId, req.query as any);
  res.json({ success: true, ...result });
}));

// GET /api/quotes/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await quoteService.getQuoteStats(req.user!.userId);
  res.json({ success: true, data: stats });
}));

// GET /api/quotes/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const quote = await quoteService.getQuote(req.params.id, req.user!.userId);
  if (!quote) {
    res.status(404).json({ success: false, error: 'Quote not found' });
    return;
  }
  res.json({ success: true, data: quote });
}));

// POST /api/quotes
router.post('/', validateBody(createQuoteSchema), asyncHandler(async (req, res) => {
  const quote = await quoteService.createQuote({
    userId: req.user!.userId,
    ...req.body,
  });
  res.status(201).json({ success: true, data: quote });
}));

// PUT /api/quotes/:id
router.put('/:id', validateBody(updateQuoteSchema), asyncHandler(async (req, res) => {
  const quote = await quoteService.updateQuote(req.params.id, req.user!.userId, req.body);
  res.json({ success: true, data: quote });
}));

// POST /api/quotes/:id/send
router.post('/:id/send', asyncHandler(async (req, res) => {
  const quote = await quoteService.sendQuote(req.params.id, req.user!.userId);
  res.json({ success: true, data: quote });
}));

// POST /api/quotes/:id/accept
router.post('/:id/accept', asyncHandler(async (req, res) => {
  const quote = await quoteService.acceptQuote(req.params.id, req.user!.userId);
  res.json({ success: true, data: quote });
}));

// POST /api/quotes/:id/reject
router.post('/:id/reject', asyncHandler(async (req, res) => {
  const quote = await quoteService.rejectQuote(req.params.id, req.user!.userId);
  res.json({ success: true, data: quote });
}));

// POST /api/quotes/:id/duplicate
router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const quote = await quoteService.duplicateQuote(req.params.id, req.user!.userId);
  res.status(201).json({ success: true, data: quote });
}));

// POST /api/quotes/:id/convert-to-invoice
router.post('/:id/convert-to-invoice', asyncHandler(async (req, res) => {
  const invoice = await quoteService.convertToInvoice(req.params.id, req.user!.userId);
  res.status(201).json({ success: true, data: invoice });
}));

// DELETE /api/quotes/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await quoteService.deleteQuote(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Quote deleted' });
}));

export default router;
