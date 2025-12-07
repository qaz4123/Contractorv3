/**
 * Usage Tracking Service
 * Track AI usage, storage, and costs per user for profitability analysis
 */

import prisma from '../../lib/prisma';

interface UsageMetrics {
  aiCalls: number;
  aiTokens: number;
  aiCost: number;
  storageUsed: number;
  storageCost: number;
}

interface PricingTier {
  name: string;
  monthlyPrice: number;
  aiCallsLimit: number;
  storageLimit: number; // GB
  features: string[];
}

export class UsageTrackingService {
  // Pricing configuration
  private readonly PRICING_TIERS: Record<string, PricingTier> = {
    FREE: {
      name: 'Free',
      monthlyPrice: 0,
      aiCallsLimit: 10,
      storageLimit: 0.5,
      features: ['10 AI analyses/month', '3 projects', 'Basic features'],
    },
    STARTER: {
      name: 'Starter',
      monthlyPrice: 49,
      aiCallsLimit: 100,
      storageLimit: 5,
      features: ['100 AI analyses/month', '25 projects', 'Email support', 'Quote templates'],
    },
    PROFESSIONAL: {
      name: 'Professional',
      monthlyPrice: 149,
      aiCallsLimit: 500,
      storageLimit: 50,
      features: ['500 AI analyses/month', 'Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom branding', 'API access'],
    },
    ENTERPRISE: {
      name: 'Enterprise',
      monthlyPrice: 399,
      aiCallsLimit: -1, // Unlimited
      storageLimit: 500,
      features: ['Unlimited AI analyses', 'Unlimited projects', 'Dedicated support', 'Multi-user', 'White label', 'Custom integrations'],
    },
  };

  // Cost structure
  private readonly AI_COST_PER_CALL = 0.05; // $0.05 per AI analysis
  private readonly STORAGE_COST_PER_GB = 0.10; // $0.10 per GB per month
  
  /**
   * Track AI usage for a user
   */
  async trackAIUsage(userId: string, tokens: number, leadId?: string, projectId?: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aiCost = this.AI_COST_PER_CALL;

    await prisma.usageTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        aiApiCalls: 1,
        aiTokensUsed: tokens,
        aiCostUsd: aiCost,
        totalCostUsd: aiCost,
      },
      update: {
        aiApiCalls: { increment: 1 },
        aiTokensUsed: { increment: tokens },
        aiCostUsd: { increment: aiCost },
        totalCostUsd: { increment: aiCost },
      },
    });

    // Track monthly usage
    await this.updateMonthlyUsage(userId, 'aiCalls', 1);
  }

  /**
   * Track storage usage
   */
  async trackStorageUsage(userId: string, sizeInMB: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const storageCost = (sizeInMB / 1024) * this.STORAGE_COST_PER_GB / 30; // Daily cost

    await prisma.usageTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        storageUsedMb: sizeInMB,
        storageCostUsd: storageCost,
        totalCostUsd: storageCost,
      },
      update: {
        storageUsedMb: { increment: sizeInMB },
        storageCostUsd: { increment: storageCost },
        totalCostUsd: { increment: storageCost },
      },
    });
  }

  /**
   * Check if user has exceeded their plan limits
   */
  async checkUsageLimits(userId: string): Promise<{
    withinLimits: boolean;
    aiCallsUsed: number;
    aiCallsLimit: number;
    storageUsed: number;
    storageLimit: number;
    message?: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tier = this.PRICING_TIERS[user.subscriptionTier];
    const monthlyUsage = await this.getMonthlyUsage(userId);

    const aiWithinLimit = tier.aiCallsLimit === -1 || monthlyUsage.aiCalls < tier.aiCallsLimit;
    const storageWithinLimit = monthlyUsage.storageUsed < tier.storageLimit;

    let message;
    if (!aiWithinLimit) {
      message = `AI analysis limit reached (${tier.aiCallsLimit}/month). Upgrade to continue.`;
    } else if (!storageWithinLimit) {
      message = `Storage limit reached (${tier.storageLimit}GB). Upgrade for more storage.`;
    }

    return {
      withinLimits: aiWithinLimit && storageWithinLimit,
      aiCallsUsed: monthlyUsage.aiCalls,
      aiCallsLimit: tier.aiCallsLimit,
      storageUsed: monthlyUsage.storageUsed,
      storageLimit: tier.storageLimit,
      message,
    };
  }

  /**
   * Get monthly usage for a user
   */
  private async getMonthlyUsage(userId: string): Promise<{
    aiCalls: number;
    storageUsed: number;
    totalCost: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usageTracking.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
        },
      },
    });

    return {
      aiCalls: usage.reduce((sum: number, u: any) => sum + u.aiApiCalls, 0),
      storageUsed: Math.max(...usage.map((u: any) => u.storageUsedMb)) / 1024, // GB
      totalCost: usage.reduce((sum: number, u: any) => sum + u.totalCostUsd, 0),
    };
  }

  /**
   * Update monthly usage summary
   */
  private async updateMonthlyUsage(userId: string, metric: string, value: number): Promise<void> {
    // This would update a monthly summary table for faster queries
    // For now, we aggregate on the fly
  }

  /**
   * Calculate profitability per user
   */
  async calculateUserProfitability(userId: string): Promise<{
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tier = this.PRICING_TIERS[user.subscriptionTier];
    const monthlyUsage = await this.getMonthlyUsage(userId);

    const revenue = tier.monthlyPrice;
    const costs = monthlyUsage.totalCost;
    const profit = revenue - costs;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue,
      costs,
      profit,
      profitMargin,
    };
  }

  /**
   * Get pricing tier details
   */
  getPricingTiers(): Record<string, PricingTier> {
    return this.PRICING_TIERS;
  }

  /**
   * Recommend upgrade based on usage patterns
   */
  async recommendUpgrade(userId: string): Promise<{
    shouldUpgrade: boolean;
    currentTier: string;
    recommendedTier: string;
    reason: string;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const limits = await this.checkUsageLimits(userId);
    const currentTier = user.subscriptionTier;

    if (!limits.withinLimits) {
      const nextTier = this.getNextTier(currentTier);
      return {
        shouldUpgrade: true,
        currentTier,
        recommendedTier: nextTier,
        reason: limits.message || 'Usage limits exceeded',
      };
    }

    // Check if user is using >80% of limits
    const aiUsagePercent = limits.aiCallsLimit > 0 ? (limits.aiCallsUsed / limits.aiCallsLimit) * 100 : 0;
    const storageUsagePercent = (limits.storageUsed / limits.storageLimit) * 100;

    if (aiUsagePercent > 80 || storageUsagePercent > 80) {
      const nextTier = this.getNextTier(currentTier);
      return {
        shouldUpgrade: true,
        currentTier,
        recommendedTier: nextTier,
        reason: 'Approaching usage limits. Upgrade for better experience.',
      };
    }

    return {
      shouldUpgrade: false,
      currentTier,
      recommendedTier: currentTier,
      reason: 'Current plan is suitable for your usage',
    };
  }

  private getNextTier(currentTier: string): string {
    const tiers = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : currentTier;
  }
}
