/**
 * Quote Service
 * Handles quote creation, management, and AI-powered quote generation
 */

import { QuoteStatus, QuoteSourceType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../lib/prisma';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface CreateQuoteInput {
  userId: string;
  leadId?: string;
  projectId?: string;
  title: string;
  description?: string;
  lineItems: LineItem[];
  tax?: number;
  discount?: number;
  validDays?: number;
  sourceType?: QuoteSourceType;
  sourceData?: any;
}

export interface UpdateQuoteInput {
  title?: string;
  description?: string;
  lineItems?: LineItem[];
  tax?: number;
  discount?: number;
  validUntil?: Date;
  status?: QuoteStatus;
}

export class QuoteService {
  /**
   * Create a new quote
   */
  async createQuote(input: CreateQuoteInput) {
    const subtotal = input.lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = input.tax || 0;
    const discount = input.discount || 0;
    const total = subtotal + (subtotal * tax / 100) - discount;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (input.validDays || 30));

    const quote = await prisma.quote.create({
      data: {
        userId: input.userId,
        leadId: input.leadId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        lineItems: input.lineItems as any,
        subtotal,
        tax,
        discount,
        total,
        validUntil,
        sourceType: input.sourceType || 'MANUAL',
        sourceData: input.sourceData,
        status: 'DRAFT',
      },
      include: {
        lead: true,
        project: true,
      },
    });

    return quote;
  }

  /**
   * Get quote by ID
   */
  async getQuote(quoteId: string, userId: string) {
    return prisma.quote.findFirst({
      where: {
        id: quoteId,
        userId,
      },
      include: {
        lead: true,
        project: true,
        invoice: true,
      },
    });
  }

  /**
   * Get all quotes for a user
   */
  async getQuotes(
    userId: string,
    options: {
      status?: QuoteStatus;
      leadId?: string;
      projectId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const { status, leadId, projectId, page = 1, pageSize = 20 } = options;

    const where: any = { userId };
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    if (projectId) where.projectId = projectId;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          lead: {
            select: { id: true, name: true, street: true, city: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return {
      quotes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update a quote
   */
  async updateQuote(quoteId: string, userId: string, input: UpdateQuoteInput) {
    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
    });

    if (!existing) {
      throw new Error('Quote not found');
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

    return prisma.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        lead: true,
        project: true,
      },
    });
  }

  /**
   * Send quote to client
   */
  async sendQuote(quoteId: string, userId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
      include: { lead: true },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    // Update status to SENT
    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'SENT' },
    });

    // TODO: Send email notification to client
    // This would integrate with NotificationService

    return updated;
  }

  /**
   * Accept a quote
   */
  async acceptQuote(quoteId: string, userId: string) {
    return prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });
  }

  /**
   * Reject a quote
   */
  async rejectQuote(quoteId: string, userId: string) {
    return prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });
  }

  /**
   * Duplicate a quote
   */
  async duplicateQuote(quoteId: string, userId: string) {
    const original = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
    });

    if (!original) {
      throw new Error('Quote not found');
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    return prisma.quote.create({
      data: {
        userId: original.userId,
        leadId: original.leadId,
        projectId: original.projectId,
        title: `${original.title} (Copy)`,
        description: original.description,
        lineItems: original.lineItems as any,
        subtotal: original.subtotal,
        tax: original.tax,
        discount: original.discount,
        total: original.total,
        validUntil,
        sourceType: original.sourceType,
        status: 'DRAFT',
      },
    });
  }

  /**
   * Delete a quote
   */
  async deleteQuote(quoteId: string, userId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    await prisma.quote.delete({ where: { id: quoteId } });
    return true;
  }

  /**
   * Convert quote to invoice
   */
  async convertToInvoice(quoteId: string, userId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
      include: { lead: true },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error('Only accepted quotes can be converted to invoices');
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({ where: { userId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        projectId: quote.projectId,
        quoteId: quote.id,
        invoiceNumber,
        clientName: quote.lead?.name || 'Client',
        clientEmail: quote.lead?.email,
        clientPhone: quote.lead?.phone,
        clientAddress: quote.lead ? `${quote.lead.street}, ${quote.lead.city}, ${quote.lead.state}` : null,
        lineItems: quote.lineItems as any,
        subtotal: quote.subtotal,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return invoice;
  }

  /**
   * Get quote statistics
   */
  async getQuoteStats(userId: string) {
    const [total, byStatus, recentQuotes, totalValue] = await Promise.all([
      prisma.quote.count({ where: { userId } }),
      prisma.quote.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
        _sum: { total: true },
      }),
      prisma.quote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.quote.aggregate({
        where: { userId, status: 'ACCEPTED' },
        _sum: { total: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((s) => [s.status, { count: s._count, value: s._sum.total || 0 }])
    );

    const acceptedCount = statusCounts['ACCEPTED']?.count || 0;
    const sentCount = statusCounts['SENT']?.count || 0;
    const conversionRate = sentCount > 0 ? Math.round((acceptedCount / (sentCount + acceptedCount)) * 100) : 0;

    return {
      total,
      byStatus: statusCounts,
      totalAcceptedValue: totalValue._sum.total || 0,
      conversionRate,
      recentQuotes,
    };
  }
}

export const quoteService = new QuoteService();
