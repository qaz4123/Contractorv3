/**
 * Job Postings Routes
 * Marketplace for contractors to post jobs and subcontractors to apply
 */

import { Router } from 'express';
import { z } from 'zod';
import { JobPostingStatus, ApplicationStatus, RateType, JobUrgency } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createJobPostingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  tradesNeeded: z.array(z.string()).min(1, 'At least one trade is required'),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  rateType: z.nativeEnum(RateType).default('PROJECT'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  urgency: z.nativeEnum(JobUrgency).default('NORMAL'),
  projectId: z.string().uuid().optional(),
});

const updateJobPostingSchema = createJobPostingSchema.partial().extend({
  status: z.nativeEnum(JobPostingStatus).optional(),
});

const applyToJobSchema = z.object({
  coverLetter: z.string().optional(),
  proposedRate: z.number().positive().optional(),
  estimatedDays: z.number().int().positive().optional(),
  availability: z.string().optional(),
});

const jobsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(JobPostingStatus).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  trade: z.string().optional(),
  urgency: z.nativeEnum(JobUrgency).optional(),
  minBudget: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
});

// ==========================================
// JOB POSTINGS (For Contractors)
// ==========================================

/**
 * GET /api/jobs
 * Get all job postings (for subcontractors to browse)
 */
router.get(
  '/',
  validateQuery(jobsQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, pageSize, status, city, state, trade, urgency, minBudget, maxBudget } = req.query as any;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: status || 'OPEN',
    };

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = state.toUpperCase();
    if (trade) where.tradesNeeded = { has: trade };
    if (urgency) where.urgency = urgency;
    if (minBudget || maxBudget) {
      where.budgetMax = {};
      if (minBudget) where.budgetMax.gte = minBudget;
      if (maxBudget) where.budgetMax.lte = maxBudget;
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: [
          { urgency: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  })
);

/**
 * GET /api/jobs/my-postings
 * Get current user's job postings
 */
router.get(
  '/my-postings',
  asyncHandler(async (req, res) => {
    const jobs = await prisma.jobPosting.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          include: {
            subcontractor: {
              select: {
                id: true,
                name: true,
                company: true,
                rating: true,
                completedJobs: true,
                verified: true,
              },
            },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    res.json({
      success: true,
      data: jobs,
    });
  })
);

/**
 * GET /api/jobs/:id
 * Get a specific job posting
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            subcontractor: {
              select: {
                id: true,
                name: true,
                company: true,
                rating: true,
                completedJobs: true,
                verified: true,
                trades: true,
                hourlyRate: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    res.json({
      success: true,
      data: job,
    });
  })
);

/**
 * POST /api/jobs
 * Create a new job posting
 */
router.post(
  '/',
  validateBody(createJobPostingSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;

    const job = await prisma.jobPosting.create({
      data: {
        userId: req.user!.userId,
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  })
);

/**
 * PUT /api/jobs/:id
 * Update a job posting
 */
router.put(
  '/:id',
  validateBody(updateJobPostingSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.jobPosting.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    const job = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    res.json({
      success: true,
      data: job,
    });
  })
);

/**
 * DELETE /api/jobs/:id
 * Delete a job posting
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.jobPosting.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    await prisma.jobPosting.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Job posting deleted successfully',
    });
  })
);

// ==========================================
// JOB APPLICATIONS (For Subcontractors)
// ==========================================

/**
 * POST /api/jobs/:id/apply
 * Apply to a job posting (as a subcontractor)
 */
router.post(
  '/:id/apply',
  validateBody(applyToJobSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    // Check if user is a subcontractor
    const subcontractor = await prisma.subcontractor.findFirst({
      where: { userId: req.user!.userId },
    });

    if (!subcontractor) {
      res.status(403).json({
        success: false,
        error: 'You must be registered as a subcontractor to apply',
      });
      return;
    }

    // Check if job exists and is open
    const job = await prisma.jobPosting.findFirst({
      where: { id, status: 'OPEN' },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found or not accepting applications',
      });
      return;
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_subcontractorId: {
          jobPostingId: id,
          subcontractorId: subcontractor.id,
        },
      },
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        error: 'You have already applied to this job',
      });
      return;
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId: id,
        subcontractorId: subcontractor.id,
        ...data,
      },
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  })
);

/**
 * GET /api/jobs/my-applications
 * Get current subcontractor's applications
 */
router.get(
  '/my-applications',
  asyncHandler(async (req, res) => {
    const subcontractor = await prisma.subcontractor.findFirst({
      where: { userId: req.user!.userId },
    });

    if (!subcontractor) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const applications = await prisma.jobApplication.findMany({
      where: { subcontractorId: subcontractor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        jobPosting: true,
      },
    });

    res.json({
      success: true,
      data: applications,
    });
  })
);

/**
 * PATCH /api/jobs/applications/:id/status
 * Update application status (contractor reviewing applications)
 */
router.patch(
  '/applications/:id/status',
  validateBody(z.object({
    status: z.nativeEnum(ApplicationStatus),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: { jobPosting: true },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }

    // Verify ownership of the job posting
    if (application.jobPosting.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: 'You can only update applications for your own job postings',
      });
      return;
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status },
      include: {
        subcontractor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // If accepted, create a SubcontractorHire record
    if (status === 'ACCEPTED') {
      await prisma.subcontractorHire.create({
        data: {
          subcontractorId: application.subcontractorId,
          contractorId: req.user!.userId,
          projectId: application.jobPosting.projectId,
          description: application.jobPosting.title,
          agreedRate: application.proposedRate || 0,
          rateType: application.jobPosting.rateType,
          status: 'ACCEPTED',
        },
      });

      // Update job posting status to FILLED
      await prisma.jobPosting.update({
        where: { id: application.jobPostingId },
        data: { status: 'FILLED' },
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * PATCH /api/jobs/applications/:id/withdraw
 * Withdraw an application (subcontractor)
 */
router.patch(
  '/applications/:id/withdraw',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subcontractor = await prisma.subcontractor.findFirst({
      where: { userId: req.user!.userId },
    });

    if (!subcontractor) {
      res.status(403).json({
        success: false,
        error: 'Subcontractor profile not found',
      });
      return;
    }

    const application = await prisma.jobApplication.findFirst({
      where: { id, subcontractorId: subcontractor.id },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

export default router;
