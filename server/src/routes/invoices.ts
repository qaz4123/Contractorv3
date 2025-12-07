/**
 * Invoices Routes
 * Invoice and payment management
 */

import { Router } from 'express';
import { z } from 'zod';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { invoiceService } from '../services/invoices/InvoiceService';

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

const createInvoiceSchema = z.object({
  projectId: z.string().uuid().optional(),
  clientName: z.string().min(2),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  tax: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateInvoiceSchema = createInvoiceSchema.partial();

const invoicesQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(InvoiceStatus).optional(),
  projectId: z.string().uuid().optional(),
});

const recordPaymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/invoices
router.get('/', validateQuery(invoicesQuerySchema), asyncHandler(async (req, res) => {
  const result = await invoiceService.getInvoices(req.user!.userId, req.query as any);
  res.json({ success: true, ...result });
}));

// GET /api/invoices/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await invoiceService.getInvoiceStats(req.user!.userId);
  res.json({ success: true, data: stats });
}));

// GET /api/invoices/overdue
router.get('/overdue', asyncHandler(async (req, res) => {
  const invoices = await invoiceService.getOverdueInvoices(req.user!.userId);
  res.json({ success: true, data: invoices });
}));

// GET /api/invoices/revenue
router.get('/revenue', asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months as string) || 12;
  const revenue = await invoiceService.getMonthlyRevenue(req.user!.userId, months);
  res.json({ success: true, data: revenue });
}));

// GET /api/invoices/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoice(req.params.id, req.user!.userId);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found' });
    return;
  }
  res.json({ success: true, data: invoice });
}));

// POST /api/invoices
router.post('/', validateBody(createInvoiceSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  
  const invoice = await invoiceService.createInvoice({
    userId: req.user!.userId,
    ...data,
  });
  res.status(201).json({ success: true, data: invoice });
}));

// PUT /api/invoices/:id
router.put('/:id', validateBody(updateInvoiceSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  
  const invoice = await invoiceService.updateInvoice(req.params.id, req.user!.userId, data);
  res.json({ success: true, data: invoice });
}));

// POST /api/invoices/:id/send
router.post('/:id/send', asyncHandler(async (req, res) => {
  const invoice = await invoiceService.sendInvoice(req.params.id, req.user!.userId);
  res.json({ success: true, data: invoice });
}));

// POST /api/invoices/:id/payments
router.post('/:id/payments', validateBody(recordPaymentSchema), asyncHandler(async (req, res) => {
  const payment = await invoiceService.recordPayment(req.user!.userId, {
    invoiceId: req.params.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: payment });
}));

// DELETE /api/invoices/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await invoiceService.deleteInvoice(req.params.id, req.user!.userId);
  res.json({ success: true, message: 'Invoice deleted' });
}));

export default router;
