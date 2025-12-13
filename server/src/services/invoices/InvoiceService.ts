/**
 * Invoice Service
 * Handles invoice generation, payment tracking, and receipts
 */

import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import prisma from '../../lib/prisma';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface CreateInvoiceInput {
  userId: string;
  projectId?: string;
  quoteId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  lineItems: LineItem[];
  tax?: number;
  discount?: number;
  dueDate?: Date;
  notes?: string;
}

export interface UpdateInvoiceInput {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  lineItems?: LineItem[];
  tax?: number;
  discount?: number;
  dueDate?: Date;
  notes?: string;
  status?: InvoiceStatus;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export class InvoiceService {
  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(input: CreateInvoiceInput) {
    const subtotal = input.lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = input.tax || 0;
    const discount = input.discount || 0;
    const total = subtotal + (subtotal * tax / 100) - discount;

    const invoiceNumber = await this.generateInvoiceNumber(input.userId);

    const invoice = await prisma.invoice.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        quoteId: input.quoteId,
        invoiceNumber,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        clientAddress: input.clientAddress,
        lineItems: input.lineItems as any,
        subtotal,
        tax,
        discount,
        total,
        dueDate: input.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: input.notes,
        status: 'DRAFT',
      },
      include: {
        project: true,
        payments: true,
      },
    });

    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string, userId: string) {
    return prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
      include: {
        project: true,
        quote: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get all invoices for a user
   */
  async getInvoices(
    userId: string,
    options: {
      status?: InvoiceStatus;
      projectId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const { status, projectId, page = 1, pageSize = 20 } = options;

    const where: any = { userId };
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: {
            select: { id: true, name: true },
          },
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update an invoice
   */
  async updateInvoice(invoiceId: string, userId: string, input: UpdateInvoiceInput) {
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    const updateData: any = { ...input };

    // Recalculate totals if line items changed
    if (input.lineItems) {
      const subtotal = input.lineItems.reduce((sum, item) => sum + item.total, 0);
      const tax = input.tax ?? existing.tax;
      const discount = input.discount ?? existing.discount;
      updateData.subtotal = subtotal;
      updateData.total = subtotal + (subtotal * tax / 100) - discount;
      updateData.lineItems = input.lineItems as any;
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        project: true,
        payments: true,
      },
    });
  }

  /**
   * Send invoice to client
   */
  async sendInvoice(invoiceId: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
    });

    // TODO: Send email notification
    // This would integrate with NotificationService

    return updated;
  }

  /**
   * Record a payment
   */
  async recordPayment(userId: string, input: RecordPaymentInput) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, userId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        notes: input.notes,
      },
    });

    // Update invoice amounts and status
    const newAmountPaid = invoice.amountPaid + input.amount;
    let newStatus: InvoiceStatus = invoice.status;

    if (newAmountPaid >= invoice.total) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null,
      },
    });

    return payment;
  }

  /**
   * Mark invoice as viewed (for client-side tracking)
   */
  async markAsViewed(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'SENT') {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'VIEWED' },
      });
    }

    return invoice;
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Cannot delete a paid invoice');
    }

    await prisma.invoice.delete({ where: { id: invoiceId } });
    return true;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(userId: string) {
    return prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(userId: string) {
    const [total, byStatus, overdueCount, financials] = await Promise.all([
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
        _sum: { total: true, amountPaid: true },
      }),
      prisma.invoice.count({
        where: {
          userId,
          status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.invoice.aggregate({
        where: { userId },
        _sum: { total: true, amountPaid: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((s) => [s.status, {
        count: s._count,
        totalValue: s._sum.total || 0,
        amountPaid: s._sum.amountPaid || 0,
      }])
    );

    return {
      total,
      byStatus: statusCounts,
      overdueCount,
      totalInvoiced: financials._sum.total || 0,
      totalCollected: financials._sum.amountPaid || 0,
      outstandingBalance: (financials._sum.total || 0) - (financials._sum.amountPaid || 0),
    };
  }

  /**
   * Get monthly revenue data
   */
  async getMonthlyRevenue(userId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const payments = await prisma.payment.findMany({
      where: {
        invoice: { userId },
        paidAt: { gte: startDate },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    payments.forEach((payment) => {
      const monthKey = payment.paidAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
    });

    return monthlyData;
  }
}

export const invoiceService = new InvoiceService();
