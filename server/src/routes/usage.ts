/**
 * Usage Tracking Routes
 * API endpoints for tracking and displaying user usage/costs
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UsageTrackingService } from '../services/usage/UsageTrackingService';
import { ProjectProfitabilityService } from '../services/analytics/ProjectProfitabilityService';
import prisma from '../lib/prisma';

const router = Router();
const usageService = new UsageTrackingService();
const profitabilityService = new ProjectProfitabilityService();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/usage/current
 * Get current month's usage for the authenticated user
 */
router.get('/current', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.usageTracking.findMany({
    where: {
      userId,
      date: { gte: startOfMonth },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const limits = await usageService.checkUsageLimits(userId);
  const profitability = await usageService.calculateUserProfitability(userId);
  const recommendation = await usageService.recommendUpgrade(userId);
  const pricingTiers = usageService.getPricingTiers();
  
  const currentTier = pricingTiers[user!.subscriptionTier];

  const totalCost = usage.reduce((sum: number, u: any) => sum + u.totalCostUsd, 0);

  res.json({
    success: true,
    data: {
      aiCallsUsed: limits.aiCallsUsed,
      aiCallsLimit: limits.aiCallsLimit,
      storageUsed: limits.storageUsed,
      storageLimit: limits.storageLimit,
      monthlyCost: totalCost,
      subscriptionPrice: currentTier.monthlyPrice,
      profitability,
      shouldUpgrade: recommendation.shouldUpgrade,
      upgradeMessage: recommendation.reason,
    },
  });
}));

/**
 * GET /api/usage/history
 * Get usage history for charts
 */
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const usage = await prisma.usageTracking.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  res.json({
    success: true,
    data: usage,
  });
}));

/**
 * GET /api/usage/pricing-tiers
 * Get all pricing tiers and their features
 */
router.get('/pricing-tiers', asyncHandler(async (req, res) => {
  const tiers = usageService.getPricingTiers();
  
  res.json({
    success: true,
    data: tiers,
  });
}));

/**
 * GET /api/usage/recommendation
 * Get upgrade recommendation
 */
router.get('/recommendation', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const recommendation = await usageService.recommendUpgrade(userId);
  
  res.json({
    success: true,
    data: recommendation,
  });
}));

/**
 * GET /api/usage/profitability
 * Get user profitability metrics
 */
router.get('/profitability', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const profitability = await usageService.calculateUserProfitability(userId);
  
  res.json({
    success: true,
    data: profitability,
  });
}));

/**
 * GET /api/usage/projects/profitability
 * Get profitability metrics for all user projects
 */
router.get('/projects/profitability', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const metrics = await profitabilityService.getDashboardMetrics(userId);
  
  res.json({
    success: true,
    data: metrics,
  });
}));

/**
 * GET /api/usage/projects/:projectId/profitability
 * Get profitability for a specific project
 */
router.get('/projects/:projectId/profitability', asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;

  // Verify user owns the project
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const profitability = await profitabilityService.calculateProjectProfitability(projectId);
  
  res.json({
    success: true,
    data: profitability,
  });
}));

/**
 * GET /api/usage/quotes/conversion
 * Get quote conversion rate metrics
 */
router.get('/quotes/conversion', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const metrics = await profitabilityService.getQuoteConversionRate(userId);
  
  res.json({
    success: true,
    data: metrics,
  });
}));

export default router;
