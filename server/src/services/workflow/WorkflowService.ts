/**
 * Workflow Service
 * Manages the complete customer journey: Lead → Quote → Project → Invoice
 * Ensures proper state transitions and data consistency across the lifecycle
 */

import { LeadStatus, QuoteStatus, ProjectStatus, InvoiceStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler';

interface CreateQuoteFromLeadInput {
  leadId: string;
  userId: string;
  title: string;
  description?: string;
  lineItems: any[];
  tax?: number;
  discount?: number;
  validDays?: number;
}

interface ConvertQuoteToProjectInput {
  quoteId: string;
  userId: string;
  startDate?: Date;
  estimatedDays?: number;
}

interface CreateInvoiceFromProjectInput {
  projectId: string;
  userId: string;
  dueDate?: Date;
  notes?: string;
}

interface CreateInvoiceFromQuoteInput {
  quoteId: string;
  userId: string;
  dueDate?: Date;
  notes?: string;
}

export class WorkflowService {
  /**
   * Create a quote from a lead
   * Updates lead status to PROPOSAL_SENT
   */
  async createQuoteFromLead(input: CreateQuoteFromLeadInput) {
    const { leadId, userId, title, description, lineItems, tax = 0, discount = 0, validDays = 30 } = input;

    // Verify lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    // Validate lead can have a quote created
    if (lead.status === 'LOST') {
      throw new BadRequestError('Cannot create quote for a lost lead');
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount - discount;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Create quote and update lead in a transaction
    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          userId,
          leadId,
          title,
          description,
          lineItems,
          subtotal,
          tax: taxAmount,
          discount,
          total,
          validUntil,
          status: 'DRAFT',
        },
      });

      // Update lead status to PROPOSAL_SENT
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'PROPOSAL_SENT',
          lastContactAt: new Date(),
        },
      });

      return newQuote;
    });

    return quote;
  }

  /**
   * Convert accepted quote to project
   * Updates quote status and lead status to WON
   */
  async convertQuoteToProject(input: ConvertQuoteToProjectInput) {
    const { quoteId, userId, startDate, estimatedDays } = input;

    // Get quote with lead information
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
      include: {
        lead: true,
      },
    });

    if (!quote) {
      throw new NotFoundError('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestError('Only accepted quotes can be converted to projects');
    }

    // Check if project already exists for this quote
    const existingProject = await prisma.project.findFirst({
      where: { leadId: quote.leadId || undefined },
    });

    if (existingProject) {
      throw new BadRequestError('Project already exists for this lead');
    }

    if (!quote.lead) {
      throw new BadRequestError('Quote must be associated with a lead to create a project');
    }

    const lead = quote.lead;

    // Create project from quote
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          userId,
          leadId: lead.id,
          name: quote.title,
          description: quote.description || `Project created from quote: ${quote.title}`,
          street: lead.street || 'Unknown',
          city: lead.city || 'Unknown',
          state: lead.state || 'Unknown',
          zipCode: lead.zipCode || '00000',
          status: 'PLANNING',
          startDate: startDate || new Date(),
          estimatedDays: estimatedDays || 30,
          estimatedBudget: quote.total,
        },
      });

      // Update quote with project reference
      await tx.quote.update({
        where: { id: quoteId },
        data: { projectId: newProject.id },
      });

      // Update lead status to WON
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'WON' },
      });

      return newProject;
    });

    return project;
  }

  /**
   * Create invoice from completed/in-progress project
   * Maintains link to project and quote if exists
   */
  async createInvoiceFromProject(input: CreateInvoiceFromProjectInput) {
    const { projectId, userId, dueDate, notes } = input;

    // Get project with related data
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        lead: true,
        quotes: {
          where: { status: 'ACCEPTED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Use project actual cost or estimated budget
    const amount = project.actualCost > 0 ? project.actualCost : project.estimatedBudget || 0;

    if (amount <= 0) {
      throw new BadRequestError('Project must have a cost or budget to create an invoice');
    }

    // Get client info from lead
    const clientName = project.lead?.name || 'Unknown Client';
    const clientEmail = project.lead?.email || null;
    const clientPhone = project.lead?.phone || null;
    const clientAddress = project.lead
      ? `${project.lead.street}, ${project.lead.city}, ${project.lead.state} ${project.lead.zipCode}`
      : null;

    // Use quote if available, otherwise create line items from project
    let lineItems;
    let quoteId = null;
    let subtotal = amount;
    let tax = 0;
    let discount = 0;

    if (project.quotes.length > 0) {
      const quote = project.quotes[0];
      lineItems = quote.lineItems;
      quoteId = quote.id;
      subtotal = quote.subtotal;
      tax = quote.tax;
      discount = quote.discount;
    } else {
      // Create default line items from project
      lineItems = [
        {
          id: '1',
          description: `${project.name} - Project work`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
          category: 'Labor',
        },
      ];
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({ where: { userId } });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        projectId,
        quoteId,
        invoiceNumber,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        lineItems: lineItems as any,
        subtotal,
        tax,
        discount,
        total: subtotal + tax - discount,
        status: 'DRAFT',
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        notes,
      },
    });

    return invoice;
  }

  /**
   * Create invoice directly from accepted quote (without project)
   * Useful for simple jobs that don't need project management
   */
  async createInvoiceFromQuote(input: CreateInvoiceFromQuoteInput) {
    const { quoteId, userId, dueDate, notes } = input;

    // Get quote with lead
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
      include: { lead: true },
    });

    if (!quote) {
      throw new NotFoundError('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestError('Only accepted quotes can be converted to invoices');
    }

    // Check if invoice already exists for this quote
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quoteId },
    });

    if (existingInvoice) {
      throw new BadRequestError('Invoice already exists for this quote');
    }

    // Get client info from lead or quote
    const clientName = quote.lead?.name || 'Unknown Client';
    const clientEmail = quote.lead?.email || null;
    const clientPhone = quote.lead?.phone || null;
    const clientAddress = quote.lead
      ? `${quote.lead.street}, ${quote.lead.city}, ${quote.lead.state} ${quote.lead.zipCode}`
      : null;

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({ where: { userId } });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        quoteId,
        invoiceNumber,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        lineItems: quote.lineItems as any,
        subtotal: quote.subtotal,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        status: 'DRAFT',
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes,
      },
    });

    return invoice;
  }

  /**
   * Mark lead as lost and provide reason
   * Prevents further workflow actions on lost leads
   */
  async markLeadAsLost(leadId: string, userId: string, reason?: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'LOST',
        notes: reason
          ? `${lead.notes ? lead.notes + '\n\n' : ''}Lost Reason: ${reason}`
          : lead.notes,
      },
    });

    return updatedLead;
  }

  /**
   * Get complete customer journey for a lead
   * Returns all related quotes, projects, and invoices
   */
  async getCustomerJourney(leadId: string, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
        },
        project: {
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
            },
            milestones: {
              orderBy: { orderNum: 'asc' },
            },
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    // Calculate journey metrics
    const metrics = {
      totalQuotes: lead.quotes?.length || 0,
      acceptedQuotes: lead.quotes?.filter((q: any) => q.status === 'ACCEPTED').length || 0,
      hasProject: !!lead.project,
      projectStatus: lead.project?.status || null,
      totalInvoices: lead.project?.invoices?.length || 0,
      totalInvoiced: lead.project?.invoices?.reduce((sum: number, inv: any) => sum + inv.total, 0) || 0,
      totalPaid: lead.project?.invoices?.reduce((sum: number, inv: any) => sum + inv.amountPaid, 0) || 0,
      openTasks: lead.tasks?.filter((t: any) => !t.completedAt).length || 0,
    };

    return {
      lead,
      quotes: lead.quotes || [],
      project: lead.project || null,
      invoices: lead.project?.invoices || [],
      tasks: lead.tasks || [],
      metrics,
    };
  }

  /**
   * Get all projects that can have invoices created
   * Returns projects in progress or completed that don't have final invoices
   */
  async getProjectsReadyForInvoicing(userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        userId,
        status: {
          in: ['IN_PROGRESS', 'COMPLETED'],
        },
      },
      include: {
        invoices: true,
        lead: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Filter projects that need invoices
    return projects.filter((project) => {
      const totalInvoiced = project.invoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const budget = project.actualCost || project.estimatedBudget || 0;
      return totalInvoiced < budget;
    });
  }
}

export const workflowService = new WorkflowService();
