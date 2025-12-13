/**
 * Subcontractors Routes
 * Subcontractor marketplace with location-based search
 */

import { Router } from 'express';
import { z } from 'zod';
import { HireStatus, PremiumTier } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { subcontractorService } from '../services/subcontractors/SubcontractorService';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

// Schemas
const searchSubsSchema = paginationSchema.extend({
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  maxDistance: z.coerce.number().optional(),
  trades: z.string().optional(), // comma-separated
  minRating: z.coerce.number().min(0).max(5).optional(),
  available: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  hasInsurance: z.coerce.boolean().optional(),
  sortBy: z.enum(['distance', 'rating', 'price', 'responseTime']).optional(),
});

const registerSubSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  trades: z.array(z.string()).min(1),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceRadius: z.number().optional(),
  hourlyRate: z.number().optional(),
  dailyRate: z.number().optional(),
  preferredJobTypes: z.array(z.string()).optional(),
});

const jobPostingSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  tradesNeeded: z.array(z.string()).min(1),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  rateType: z.enum(['HOURLY', 'DAILY', 'PROJECT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  referralCommission: z.number().min(0).max(0.25).optional(),
  projectId: z.string().uuid().optional(),
});

const applyJobSchema = z.object({
  coverLetter: z.string().optional(),
  proposedRate: z.number().optional(),
  estimatedDays: z.number().optional(),
  availability: z.string().optional(),
});

const hireSubSchema = z.object({
  subcontractorId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  description: z.string().min(10),
  agreedRate: z.number().min(0),
  rateType: z.enum(['hourly', 'daily', 'fixed']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// ==========================================
// SUBCONTRACTOR SEARCH & PROFILES
// ==========================================

// GET /api/subcontractors - Search subcontractors with location
router.get('/', validateQuery(searchSubsSchema), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    latitude, 
    longitude, 
    maxDistance,
    trades, 
    minRating, 
    available, 
    verified,
    hasInsurance,
    sortBy 
  } = req.query as any;

  const result = await subcontractorService.searchSubcontractors({
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
    trades: trades ? trades.split(',') : undefined,
    minRating: minRating ? parseFloat(minRating) : undefined,
    available,
    verified,
    hasInsurance,
    sortBy,
    page: parseInt(page),
    limit: parseInt(pageSize),
  });

  res.json({
    success: true,
    data: result.subcontractors,
    ...result.pagination,
  });
}));

// GET /api/subcontractors/trades - Get all available trades
router.get('/trades', asyncHandler(async (_req, res) => {
  const trades = await subcontractorService.getAvailableTrades();
  res.json({ success: true, data: trades });
}));

// GET /api/subcontractors/me - Get my subcontractor profile
router.get('/me', asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Not registered as subcontractor' });
    return;
  }

  res.json({ success: true, data: sub });
}));

// POST /api/subcontractors/register - Register as subcontractor
router.post('/register', validateBody(registerSubSchema), asyncHandler(async (req, res) => {
  try {
    const subcontractor = await subcontractorService.registerAsSubcontractor(
      req.user!.userId,
      req.body
    );
    res.status(201).json({ success: true, data: subcontractor });
  } catch (error: any) {
    if (error.message === 'Already registered as subcontractor') {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
}));

// PATCH /api/subcontractors/me/location - Update my location
router.patch('/me/location', validateBody(z.object({
  latitude: z.number(),
  longitude: z.number(),
})), asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Not registered as subcontractor' });
    return;
  }

  const updated = await subcontractorService.updateLocation(
    sub.id,
    req.body.latitude,
    req.body.longitude
  );

  res.json({ success: true, data: updated });
}));

// PATCH /api/subcontractors/me/availability - Toggle availability
router.patch('/me/availability', validateBody(z.object({
  available: z.boolean(),
})), asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Not registered as subcontractor' });
    return;
  }

  const updated = await subcontractorService.toggleAvailability(sub.id, req.body.available);
  res.json({ success: true, data: updated });
}));

// GET /api/subcontractors/:id - Get subcontractor profile
router.get('/:id', asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;
  
  try {
    const sub = await subcontractorService.getSubcontractor(
      req.params.id,
      latitude && longitude ? {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string)
      } : undefined
    );
    res.json({ success: true, data: sub });
  } catch (error: any) {
    if (error.message === 'Subcontractor not found') {
      res.status(404).json({ success: false, error: 'Subcontractor not found' });
      return;
    }
    throw error;
  }
}));

// ==========================================
// JOB POSTINGS
// ==========================================

// POST /api/subcontractors/jobs - Create job posting
router.post('/jobs', validateBody(jobPostingSchema), asyncHandler(async (req, res) => {
  const job = await subcontractorService.createJobPosting(req.user!.userId, {
    ...req.body,
    startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
    endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
  });
  res.status(201).json({ success: true, data: job });
}));

// GET /api/subcontractors/jobs/search - Search job postings (for subs)
router.get('/jobs/search', asyncHandler(async (req, res) => {
  const { latitude, longitude, maxDistance, trades, urgency, page, pageSize } = req.query;

  const result = await subcontractorService.searchJobs({
    latitude: latitude ? parseFloat(latitude as string) : undefined,
    longitude: longitude ? parseFloat(longitude as string) : undefined,
    maxDistance: maxDistance ? parseFloat(maxDistance as string) : undefined,
    trades: trades ? (trades as string).split(',') : undefined,
    urgency: urgency as string,
    page: page ? parseInt(page as string) : 1,
    limit: pageSize ? parseInt(pageSize as string) : 20,
  });

  res.json({ 
    success: true, 
    data: result.jobs,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.limit,
    totalPages: result.pagination.totalPages,
  });
}));

// GET /api/subcontractors/jobs/my - Get my job postings (as contractor)
router.get('/jobs/my', asyncHandler(async (req, res) => {
  const jobs = await prisma.jobPosting.findMany({
    where: { userId: req.user!.userId },
    include: {
      _count: { select: { applications: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: jobs });
}));

// GET /api/subcontractors/jobs/:id/applications - Get job applications
router.get('/jobs/:id/applications', asyncHandler(async (req, res) => {
  try {
    const applications = await subcontractorService.getJobApplications(
      req.params.id,
      req.user!.userId
    );
    res.json({ success: true, data: applications });
  } catch (error: any) {
    if (error.message === 'Job not found') {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }
    throw error;
  }
}));

// POST /api/subcontractors/jobs/:id/apply - Apply for a job
router.post('/jobs/:id/apply', validateBody(applyJobSchema), asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(400).json({ success: false, error: 'Must be registered as subcontractor to apply' });
    return;
  }

  try {
    const application = await subcontractorService.applyForJob(sub.id, req.params.id, req.body);
    res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    if (error.message === 'Already applied to this job') {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
}));

// POST /api/subcontractors/applications/:id/accept - Accept an application
router.post('/applications/:id/accept', validateBody(z.object({
  agreedRate: z.number().min(0),
})), asyncHandler(async (req, res) => {
  try {
    const result = await subcontractorService.acceptApplication(
      req.params.id,
      req.user!.userId,
      req.body.agreedRate
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Application not found') {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }
    throw error;
  }
}));

// ==========================================
// DIRECT HIRES
// ==========================================

// POST /api/subcontractors/hire - Hire a subcontractor directly
router.post('/hire', validateBody(hireSubSchema), asyncHandler(async (req, res) => {
  const data = req.body;
  
  const sub = await prisma.subcontractor.findUnique({
    where: { id: data.subcontractorId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Subcontractor not found' });
    return;
  }

  if (!sub.available) {
    res.status(400).json({ success: false, error: 'Subcontractor is not available' });
    return;
  }

  const hire = await prisma.subcontractorHire.create({
    data: {
      subcontractorId: data.subcontractorId,
      contractorId: req.user!.userId,
      projectId: data.projectId,
      description: data.description,
      agreedRate: data.agreedRate,
      rateType: data.rateType,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: 'PENDING',
    },
    include: {
      subcontractor: true,
    },
  });

  res.status(201).json({ success: true, data: hire });
}));

// GET /api/subcontractors/hires/my - Get my hires (as contractor)
router.get('/hires/my', asyncHandler(async (req, res) => {
  const hires = await prisma.subcontractorHire.findMany({
    where: { contractorId: req.user!.userId },
    include: {
      subcontractor: true,
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: hires });
}));

// GET /api/subcontractors/hires/received - Get hires I received (as sub)
router.get('/hires/received', asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Not registered as subcontractor' });
    return;
  }

  const hires = await prisma.subcontractorHire.findMany({
    where: { subcontractorId: sub.id },
    include: {
      contractor: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: hires });
}));

// PATCH /api/subcontractors/hires/:id/status
router.patch('/hires/:id/status', validateBody(z.object({
  status: z.nativeEnum(HireStatus),
})), asyncHandler(async (req, res) => {
  const hire = await prisma.subcontractorHire.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { contractorId: req.user!.userId },
        { subcontractor: { userId: req.user!.userId } }
      ]
    },
  });

  if (!hire) {
    res.status(404).json({ success: false, error: 'Hire not found' });
    return;
  }

  const updated = await prisma.subcontractorHire.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
    include: { subcontractor: true },
  });

  // If completed, update referral commission status
  if (req.body.status === 'COMPLETED') {
    await prisma.referralCommission.updateMany({
      where: { hireId: req.params.id },
      data: { status: 'APPROVED' }
    });
  }

  res.json({ success: true, data: updated });
}));

// ==========================================
// REVIEWS
// ==========================================

// POST /api/subcontractors/:id/reviews
router.post('/:id/reviews', validateBody(reviewSchema), asyncHandler(async (req, res) => {
  // Check if user has hired this subcontractor
  const hire = await prisma.subcontractorHire.findFirst({
    where: {
      subcontractorId: req.params.id,
      contractorId: req.user!.userId,
      status: 'COMPLETED',
    },
  });

  if (!hire) {
    res.status(400).json({ success: false, error: 'You can only review subcontractors you have worked with' });
    return;
  }

  const review = await subcontractorService.addReview(
    req.params.id,
    req.user!.userId,
    req.body.rating,
    req.body.comment
  );

  res.status(201).json({ success: true, data: review });
}));

// ==========================================
// PREMIUM FEATURES
// ==========================================

// POST /api/subcontractors/me/upgrade - Upgrade to premium
router.post('/me/upgrade', validateBody(z.object({
  tier: z.nativeEnum(PremiumTier),
  months: z.number().min(1).max(12).optional(),
})), asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Not registered as subcontractor' });
    return;
  }

  // In production, this would process payment first
  const updated = await subcontractorService.upgradeToPremium(
    sub.id,
    req.body.tier,
    req.body.months || 1
  );

  res.json({ success: true, data: updated });
}));

// POST /api/subcontractors/me/boost - Boost listing
router.post('/me/boost', validateBody(z.object({
  days: z.number().min(1).max(30).optional(),
})), asyncHandler(async (req, res) => {
  const sub = await prisma.subcontractor.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!sub) {
    res.status(404).json({ success: false, error: 'Not registered as subcontractor' });
    return;
  }

  // In production, this would process payment first
  const updated = await subcontractorService.boostListing(sub.id, req.body.days || 7);
  res.json({ success: true, data: updated });
}));

export default router;
