/**
 * Project Profitability Analytics
 * Track revenue vs costs per project for business optimization
 */

import prisma from '../../lib/prisma';

interface ProjectProfitability {
  projectId: string;
  projectName: string;
  revenue: number;
  costs: {
    materials: number;
    subcontractors: number;
    commissions: number;
    overhead: number;
    total: number;
  };
  profit: number;
  profitMargin: number;
  status: string;
}

export class ProjectProfitabilityService {
  /**
   * Calculate profitability for a single project
   */
  async calculateProjectProfitability(projectId: string): Promise<ProjectProfitability> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        invoices: {
          where: { status: 'PAID' },
          include: { payments: true },
        },
        materials: true,
        subcontractorHires: true,
        quotes: {
          where: { status: 'ACCEPTED' },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate revenue from paid invoices
    const revenue = project.invoices.reduce((sum, invoice) => {
      const paidAmount = invoice.payments.reduce((s, p) => s + p.amount, 0);
      return sum + paidAmount;
    }, 0);

    // Calculate material costs
    const materialCosts = project.materials.reduce((sum, order) => 
      sum + (order.subtotal + order.tax), 0
    );

    // Calculate subcontractor costs
    const subcontractorCosts = project.subcontractorHires.reduce((sum, hire) => 
      sum + (hire.agreedRate || 0), 0
    );

    // Calculate commissions (if any commissions are tied to this project)
    const commissions = await this.calculateProjectCommissions(projectId);

    // Overhead (15% of revenue as industry standard)
    const overhead = revenue * 0.15;

    const totalCosts = materialCosts + subcontractorCosts + commissions + overhead;
    const profit = revenue - totalCosts;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      revenue,
      costs: {
        materials: materialCosts,
        subcontractors: subcontractorCosts,
        commissions,
        overhead,
        total: totalCosts,
      },
      profit,
      profitMargin,
      status: project.status,
    };
  }

  /**
   * Calculate commissions tied to a project
   * Note: Current schema uses ReferralCommission for subcontractor referrals only
   * TODO: Add project-based commission tracking if needed
   */
  private async calculateProjectCommissions(projectId: string): Promise<number> {
    // For now, return 0 as commissions are tracked separately via ReferralCommission
    // which is tied to subcontractor hires, not directly to projects
    return 0;
  }

  private async getProjectLeadIds(projectId: string): Promise<string[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { leadId: true },
    });
    return project?.leadId ? [project.leadId] : [];
  }

  private async getProjectQuoteIds(projectId: string): Promise<string[]> {
    const quotes = await prisma.quote.findMany({
      where: { projectId },
      select: { id: true },
    });
    return quotes.map(q => q.id);
  }

  private async getProjectInvoiceIds(projectId: string): Promise<string[]> {
    const invoices = await prisma.invoice.findMany({
      where: { projectId },
      select: { id: true },
    });
    return invoices.map(i => i.id);
  }

  /**
   * Get profitability dashboard for all projects
   */
  async getDashboardMetrics(userId: string): Promise<{
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    averageMargin: number;
    projectCount: number;
    topProjects: ProjectProfitability[];
    lossProjects: ProjectProfitability[];
  }> {
    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });

    const profitabilities = await Promise.all(
      projects.map(p => this.calculateProjectProfitability(p.id))
    );

    const totalRevenue = profitabilities.reduce((sum, p) => sum + p.revenue, 0);
    const totalCosts = profitabilities.reduce((sum, p) => sum + p.costs.total, 0);
    const totalProfit = totalRevenue - totalCosts;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top 5 most profitable projects
    const topProjects = profitabilities
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // Projects operating at a loss
    const lossProjects = profitabilities
      .filter(p => p.profit < 0)
      .sort((a, b) => a.profit - b.profit);

    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      averageMargin,
      projectCount: projects.length,
      topProjects,
      lossProjects,
    };
  }

  /**
   * Get quote conversion rate
   */
  async getQuoteConversionRate(userId: string): Promise<{
    totalQuotes: number;
    acceptedQuotes: number;
    conversionRate: number;
    averageQuoteValue: number;
    averageAcceptedValue: number;
  }> {
    const quotes = await prisma.quote.findMany({
      where: { userId },
    });

    const totalQuotes = quotes.length;
    const acceptedQuotes = quotes.filter(q => q.status === 'ACCEPTED').length;
    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    const averageQuoteValue = totalQuotes > 0
      ? quotes.reduce((sum, q) => sum + (q.total || 0), 0) / totalQuotes
      : 0;

    const acceptedQuoteValues = quotes.filter(q => q.status === 'ACCEPTED');
    const averageAcceptedValue = acceptedQuotes > 0
      ? acceptedQuoteValues.reduce((sum, q) => sum + (q.total || 0), 0) / acceptedQuotes
      : 0;

    return {
      totalQuotes,
      acceptedQuotes,
      conversionRate,
      averageQuoteValue,
      averageAcceptedValue,
    };
  }
}
