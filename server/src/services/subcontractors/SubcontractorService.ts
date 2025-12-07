import { PremiumTier, HireStatus, ApplicationStatus, JobPostingStatus } from '@prisma/client';
import prisma from '../../lib/prisma';

interface Location {
  latitude: number;
  longitude: number;
}

interface SubcontractorSearchParams {
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  trades?: string[];
  minRating?: number;
  available?: boolean;
  verified?: boolean;
  hasInsurance?: boolean;
  sortBy?: 'distance' | 'rating' | 'price' | 'responseTime';
  page?: number;
  limit?: number;
}

interface CreateJobPostingParams {
  title: string;
  description: string;
  tradesNeeded: string[];
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  budgetMin?: number;
  budgetMax?: number;
  rateType?: 'HOURLY' | 'DAILY' | 'PROJECT';
  startDate?: Date;
  endDate?: Date;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  referralCommission?: number;
  projectId?: string;
}

export class SubcontractorService {
  // Calculate distance between two points using Haversine formula
  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const lat1 = this.toRad(loc1.latitude);
    const lat2 = this.toRad(loc2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Search for subcontractors with advanced filtering
  async searchSubcontractors(params: SubcontractorSearchParams) {
    const {
      latitude,
      longitude,
      maxDistance = 50,
      trades,
      minRating,
      available = true,
      verified,
      hasInsurance,
      sortBy = 'rating',
      page = 1,
      limit = 20
    } = params;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (available !== undefined) {
      where.available = available;
    }
    
    if (trades && trades.length > 0) {
      where.trades = { hasSome: trades };
    }
    
    if (minRating) {
      where.rating = { gte: minRating };
    }
    
    if (verified !== undefined) {
      where.verified = verified;
    }
    
    if (hasInsurance) {
      where.insurance = true;
      where.insuranceExpiry = { gte: new Date() };
    }

    // Get all matching subcontractors
    const allSubcontractors = await prisma.subcontractor.findMany({
      where,
      include: {
        _count: {
          select: { 
            hires: { where: { status: 'COMPLETED' } },
            reviews: true
          }
        }
      }
    });

    // Calculate distance and filter
    let subcontractors = allSubcontractors.map(sub => {
      let distance: number | null = null;
      
      if (latitude && longitude && sub.latitude && sub.longitude) {
        distance = this.calculateDistance(
          { latitude, longitude },
          { latitude: sub.latitude, longitude: sub.longitude }
        );
      }

      // Check if subcontractor serves this area
      const servesArea = distance === null || 
        (sub.serviceRadius && distance <= sub.serviceRadius);

      return {
        ...sub,
        distance,
        servesArea,
        completedJobs: sub._count.hires,
        reviewCount: sub._count.reviews
      };
    }).filter(s => {
      // Filter by max distance if location provided
      if (latitude && longitude && s.distance !== null) {
        return s.distance <= maxDistance && s.servesArea;
      }
      return true;
    });

    // Sort - Premium subcontractors first, then by selected criteria
    subcontractors.sort((a, b) => {
      // Premium tier priority
      const premiumOrder = { ELITE: 0, PLUS: 1, BASIC: 2 };
      const aPremium = a.isPremium && a.premiumTier ? premiumOrder[a.premiumTier] : 3;
      const bPremium = b.isPremium && b.premiumTier ? premiumOrder[b.premiumTier] : 3;
      
      if (aPremium !== bPremium) {
        return aPremium - bPremium;
      }

      // Then by selected sort criteria
      switch (sortBy) {
        case 'distance':
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          const aRate = a.hourlyRate || a.dailyRate || 0;
          const bRate = b.hourlyRate || b.dailyRate || 0;
          return aRate - bRate;
        case 'responseTime':
          const aTime = a.avgResponseTime || 9999;
          const bTime = b.avgResponseTime || 9999;
          return aTime - bTime;
        default:
          return b.rating - a.rating;
      }
    });

    // Paginate
    const total = subcontractors.length;
    const startIndex = (page - 1) * limit;
    subcontractors = subcontractors.slice(startIndex, startIndex + limit);

    return {
      subcontractors: subcontractors.map(s => ({
        id: s.id,
        name: s.name,
        company: s.company,
        trades: s.trades,
        specialization: s.specialization,
        bio: s.bio,
        city: s.city,
        state: s.state,
        rating: s.rating,
        reviewCount: s.reviewCount,
        completedJobs: s.completedJobs,
        hourlyRate: s.hourlyRate,
        dailyRate: s.dailyRate,
        available: s.available,
        verified: s.verified,
        insurance: s.insurance,
        isPremium: s.isPremium,
        premiumTier: s.premiumTier,
        distance: s.distance ? Math.round(s.distance * 10) / 10 : null,
        avgResponseTime: s.avgResponseTime,
        responseRate: s.responseRate,
        portfolio: s.portfolio?.slice(0, 3) // Only first 3 images in list
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get subcontractor profile with full details
  async getSubcontractor(id: string, fromLocation?: Location) {
    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id },
      include: {
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            hires: { where: { status: 'COMPLETED' } },
            reviews: true
          }
        }
      }
    });

    if (!subcontractor) {
      throw new Error('Subcontractor not found');
    }

    let distance: number | null = null;
    if (fromLocation && subcontractor.latitude && subcontractor.longitude) {
      distance = this.calculateDistance(fromLocation, {
        latitude: subcontractor.latitude,
        longitude: subcontractor.longitude
      });
    }

    return {
      ...subcontractor,
      distance: distance ? Math.round(distance * 10) / 10 : null,
      completedJobs: subcontractor._count.hires,
      totalReviews: subcontractor._count.reviews
    };
  }

  // Register as a subcontractor (for existing users)
  async registerAsSubcontractor(userId: string, data: {
    name: string;
    company?: string;
    trades: string[];
    specialization?: string;
    bio?: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    serviceRadius?: number;
    hourlyRate?: number;
    dailyRate?: number;
    preferredJobTypes?: string[];
  }) {
    // Check if already registered
    const existing = await prisma.subcontractor.findUnique({
      where: { userId }
    });

    if (existing) {
      throw new Error('Already registered as subcontractor');
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.subcontractor.create({
      data: {
        userId,
        email: user.email,
        phone: user.phone,
        ...data,
        locationUpdatedAt: data.latitude ? new Date() : undefined
      }
    });
  }

  // Update subcontractor location
  async updateLocation(subcontractorId: string, latitude: number, longitude: number) {
    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: {
        latitude,
        longitude,
        locationUpdatedAt: new Date()
      }
    });
  }

  // Toggle availability
  async toggleAvailability(subcontractorId: string, available: boolean) {
    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: { available }
    });
  }

  // ==========================================
  // JOB POSTINGS
  // ==========================================

  // Create a job posting
  async createJobPosting(userId: string, data: CreateJobPostingParams) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days default

    return prisma.jobPosting.create({
      data: {
        userId,
        ...data,
        rateType: data.rateType || 'PROJECT',
        urgency: data.urgency || 'NORMAL',
        referralCommission: data.referralCommission || 0.05,
        status: 'OPEN',
        expiresAt
      }
    });
  }

  // Search job postings (for subcontractors)
  async searchJobs(params: {
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    trades?: string[];
    urgency?: string;
    page?: number;
    limit?: number;
  }) {
    const { latitude, longitude, maxDistance = 50, trades, urgency, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {
      status: 'OPEN',
      expiresAt: { gte: new Date() }
    };

    if (trades && trades.length > 0) {
      where.tradesNeeded = { hasSome: trades };
    }

    if (urgency) {
      where.urgency = urgency;
    }

    const jobs = await prisma.jobPosting.findMany({
      where,
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Filter by distance
    let filteredJobs = jobs.map(job => {
      let distance: number | null = null;
      
      if (latitude && longitude && job.latitude && job.longitude) {
        distance = this.calculateDistance(
          { latitude, longitude },
          { latitude: job.latitude, longitude: job.longitude }
        );
      }

      return { ...job, distance, applicationCount: job._count.applications };
    }).filter(j => {
      if (latitude && longitude && j.distance !== null) {
        return j.distance <= maxDistance;
      }
      return true;
    });

    // Sort by distance if location provided
    if (latitude && longitude) {
      filteredJobs.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    const total = filteredJobs.length;
    const startIndex = (page - 1) * limit;
    filteredJobs = filteredJobs.slice(startIndex, startIndex + limit);

    return {
      jobs: filteredJobs.map(j => ({
        ...j,
        distance: j.distance ? Math.round(j.distance * 10) / 10 : null
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  // Apply for a job
  async applyForJob(subcontractorId: string, jobPostingId: string, data: {
    coverLetter?: string;
    proposedRate?: number;
    estimatedDays?: number;
    availability?: string;
  }) {
    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobPostingId_subcontractorId: { jobPostingId, subcontractorId }
      }
    });

    if (existing) {
      throw new Error('Already applied to this job');
    }

    return prisma.jobApplication.create({
      data: {
        jobPostingId,
        subcontractorId,
        ...data,
        status: 'PENDING'
      }
    });
  }

  // Get applications for a job (for the contractor who posted)
  async getJobApplications(jobPostingId: string, userId: string) {
    const job = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId, userId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return prisma.jobApplication.findMany({
      where: { jobPostingId },
      include: {
        subcontractor: {
          select: {
            id: true,
            name: true,
            company: true,
            trades: true,
            rating: true,
            reviewCount: true,
            completedJobs: true,
            verified: true,
            isPremium: true,
            portfolio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Accept an application and create a hire
  async acceptApplication(applicationId: string, userId: string, agreedRate: number) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true }
    });

    if (!application || application.jobPosting.userId !== userId) {
      throw new Error('Application not found');
    }

    // Start a transaction
    const [updatedApp, hire] = await prisma.$transaction([
      prisma.jobApplication.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' }
      }),
      prisma.subcontractorHire.create({
        data: {
          subcontractorId: application.subcontractorId,
          contractorId: userId,
          projectId: application.jobPosting.projectId,
          description: application.jobPosting.title,
          agreedRate,
          rateType: application.jobPosting.rateType,
          commissionRate: application.jobPosting.referralCommission,
          status: 'ACCEPTED'
        }
      }),
      prisma.jobPosting.update({
        where: { id: application.jobPostingId },
        data: { status: 'FILLED' }
      })
    ]);

    // Create referral commission if there was a referrer
    if (application.jobPosting.referrerId) {
      await prisma.referralCommission.create({
        data: {
          referrerId: application.jobPosting.referrerId,
          refereeId: application.subcontractorId,
          jobPostingId: application.jobPostingId,
          hireId: hire.id,
          jobValue: agreedRate,
          commissionRate: application.jobPosting.referralCommission,
          commissionAmount: agreedRate * application.jobPosting.referralCommission,
          status: 'PENDING'
        }
      });
    }

    return { application: updatedApp, hire };
  }

  // ==========================================
  // REVIEWS & RATINGS
  // ==========================================

  async addReview(subcontractorId: string, reviewerId: string, rating: number, comment?: string) {
    // Create review
    const review = await prisma.subcontractorReview.create({
      data: {
        subcontractorId,
        reviewerId,
        rating,
        comment
      }
    });

    // Update subcontractor average rating
    const reviews = await prisma.subcontractorReview.findMany({
      where: { subcontractorId },
      select: { rating: true }
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length
      }
    });

    return review;
  }

  // Get available trades (for filtering)
  async getAvailableTrades() {
    const subcontractors = await prisma.subcontractor.findMany({
      select: { trades: true },
      where: { available: true }
    });

    const tradeSet = new Set<string>();
    subcontractors.forEach(s => s.trades.forEach(t => tradeSet.add(t)));
    
    return Array.from(tradeSet).sort();
  }

  // ==========================================
  // PREMIUM FEATURES
  // ==========================================

  async upgradeToPremium(subcontractorId: string, tier: PremiumTier, months: number = 1) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: {
        isPremium: true,
        premiumTier: tier,
        premiumExpiresAt: expiresAt
      }
    });
  }

  async boostListing(subcontractorId: string, days: number = 7) {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: { featuredUntil }
    });
  }
}

export const subcontractorService = new SubcontractorService();
