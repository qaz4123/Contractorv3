import { Subcontractor, PremiumTier } from '@prisma/client';
import prisma from '../../lib/prisma';

interface SearchFilters {
  trade?: string;
  trades?: string[];
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  maxDistance?: number; // in miles
  minRating?: number;
  verified?: boolean;
  insurance?: boolean;
  availableNow?: boolean;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  sortBy?: 'rating' | 'distance' | 'price' | 'responseTime' | 'completedJobs';
  page?: number;
  limit?: number;
}

interface SubcontractorWithDistance extends Subcontractor {
  distance?: number;
  premiumBoost?: number;
  searchScore?: number;
}

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get premium tier boost multiplier
function getPremiumBoost(tier: PremiumTier | null): number {
  switch (tier) {
    case 'ELITE':
      return 3.0; // Appears 3x higher in rankings
    case 'PLUS':
      return 2.0; // Appears 2x higher
    case 'BASIC':
      return 1.5; // Appears 1.5x higher
    default:
      return 1.0;
  }
}

export class SubcontractorMarketplace {
  /**
   * Search for subcontractors with smart ranking
   * Premium users appear at top, then sorted by relevance
   */
  async searchSubcontractors(filters: SearchFilters): Promise<{
    subcontractors: SubcontractorWithDistance[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Build where clause
    const where: Record<string, unknown> = {
      available: true,
    };

    if (filters.trade) {
      where.trades = { has: filters.trade };
    }

    if (filters.trades && filters.trades.length > 0) {
      where.trades = { hasSome: filters.trades };
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.state) {
      where.state = filters.state.toUpperCase();
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters.verified) {
      where.verified = true;
    }

    if (filters.insurance) {
      where.insurance = true;
      where.insuranceExpiry = { gte: new Date() };
    }

    if (filters.availableNow) {
      where.OR = [
        { availableFrom: null },
        { availableFrom: { lte: new Date() } },
      ];
    }

    if (filters.minHourlyRate !== undefined || filters.maxHourlyRate !== undefined) {
      where.hourlyRate = {};
      if (filters.minHourlyRate) {
        (where.hourlyRate as Record<string, number>).gte = filters.minHourlyRate;
      }
      if (filters.maxHourlyRate) {
        (where.hourlyRate as Record<string, number>).lte = filters.maxHourlyRate;
      }
    }

    // Get all matching subcontractors
    const [subcontractors, total] = await Promise.all([
      prisma.subcontractor.findMany({
        where,
        include: {
          reviews: {
            select: { rating: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.subcontractor.count({ where }),
    ]);

    // Calculate distance and search score
    let results: SubcontractorWithDistance[] = subcontractors.map((sub) => {
      const result: SubcontractorWithDistance = { ...sub } as SubcontractorWithDistance;

      // Calculate distance if location provided
      if (
        filters.latitude &&
        filters.longitude &&
        sub.latitude &&
        sub.longitude
      ) {
        result.distance = calculateDistance(
          filters.latitude,
          filters.longitude,
          sub.latitude,
          sub.longitude
        );
      }

      // Calculate premium boost
      result.premiumBoost = getPremiumBoost(sub.premiumTier);

      // Calculate search score (higher is better)
      let score = 0;
      
      // Rating score (0-50 points)
      score += sub.rating * 10;
      
      // Completed jobs bonus (0-20 points)
      score += Math.min(sub.completedJobs * 0.5, 20);
      
      // Response rate bonus (0-15 points)
      if (sub.responseRate) {
        score += sub.responseRate * 0.15;
      }
      
      // Verified bonus (10 points)
      if (sub.verified) score += 10;
      
      // Insurance bonus (5 points)
      if (sub.insurance) score += 5;

      // Apply premium boost
      score *= result.premiumBoost;

      // Distance penalty (closer is better)
      if (result.distance !== undefined) {
        score -= result.distance * 0.5; // Lose 0.5 points per mile
      }

      result.searchScore = score;

      return result;
    });

    // Filter by max distance if specified
    if (filters.maxDistance && filters.latitude && filters.longitude) {
      results = results.filter(
        (sub) => sub.distance !== undefined && sub.distance <= filters.maxDistance!
      );
    }

    // Sort results
    switch (filters.sortBy) {
      case 'distance':
        results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        results.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
        break;
      case 'responseTime':
        results.sort((a, b) => (a.avgResponseTime || 999) - (b.avgResponseTime || 999));
        break;
      case 'completedJobs':
        results.sort((a, b) => b.completedJobs - a.completedJobs);
        break;
      default:
        // Default: sort by search score (premium + relevance)
        results.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      subcontractors: paginatedResults,
      total: results.length,
      page,
      totalPages: Math.ceil(results.length / limit),
    };
  }

  /**
   * Register a user as a subcontractor
   */
  async registerAsSubcontractor(
    userId: string,
    data: {
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
      licenseNumber?: string;
      insurance?: boolean;
      insuranceExpiry?: Date;
      preferredJobTypes?: string[];
    }
  ) {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already registered
    const existing = await prisma.subcontractor.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing profile
      return prisma.subcontractor.update({
        where: { id: existing.id },
        data: {
          ...data,
          locationUpdatedAt: data.latitude ? new Date() : undefined,
        },
      });
    }

    // Create new subcontractor profile
    return prisma.subcontractor.create({
      data: {
        userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        ...data,
        locationUpdatedAt: data.latitude ? new Date() : undefined,
      },
    });
  }

  /**
   * Update subcontractor location (GPS)
   */
  async updateLocation(
    subcontractorId: string,
    latitude: number,
    longitude: number
  ) {
    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: {
        latitude,
        longitude,
        locationUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Toggle availability status
   */
  async setAvailability(subcontractorId: string, available: boolean) {
    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: { available },
    });
  }

  /**
   * Upgrade to premium tier
   */
  async upgradeToPremium(
    subcontractorId: string,
    tier: PremiumTier,
    durationMonths: number = 1
  ) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: {
        isPremium: true,
        premiumTier: tier,
        premiumExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Boost listing (featured placement) for a period
   */
  async boostListing(subcontractorId: string, durationDays: number = 7) {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + durationDays);

    return prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: { featuredUntil },
    });
  }

  /**
   * Get featured subcontractors (for homepage/sidebar)
   */
  async getFeaturedSubcontractors(limit: number = 5) {
    return prisma.subcontractor.findMany({
      where: {
        available: true,
        featuredUntil: { gte: new Date() },
      },
      orderBy: [
        { premiumTier: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    });
  }

  /**
   * Create a job referral and track commission
   */
  async createReferral(
    referrerId: string,
    hireId: string,
    jobValue: number,
    commissionRate: number = 0.05
  ) {
    const hire = await prisma.subcontractorHire.findUnique({
      where: { id: hireId },
      include: { subcontractor: true },
    });

    if (!hire) {
      throw new Error('Hire not found');
    }

    return prisma.referralCommission.create({
      data: {
        referrerId,
        refereeId: hire.subcontractorId,
        hireId,
        jobValue,
        commissionRate,
        commissionAmount: jobValue * commissionRate,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get contractor's pending commissions
   */
  async getPendingCommissions(userId: string) {
    return prisma.referralCommission.findMany({
      where: {
        referrerId: userId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark commission as paid
   */
  async payCommission(commissionId: string) {
    return prisma.referralCommission.update({
      where: { id: commissionId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  /**
   * Get subcontractors near a location
   */
  async getNearbySubcontractors(
    latitude: number,
    longitude: number,
    radiusMiles: number = 25,
    trade?: string
  ) {
    const allSubs = await prisma.subcontractor.findMany({
      where: {
        available: true,
        latitude: { not: null },
        longitude: { not: null },
        ...(trade && { trades: { has: trade } }),
      },
    });

    return allSubs
      .map((sub) => ({
        ...sub,
        distance: calculateDistance(
          latitude,
          longitude,
          sub.latitude!,
          sub.longitude!
        ),
      }))
      .filter((sub) => sub.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Add a review and update rating
   */
  async addReview(
    subcontractorId: string,
    reviewerId: string,
    rating: number,
    comment?: string
  ) {
    // Create review
    const review = await prisma.subcontractorReview.create({
      data: {
        subcontractorId,
        reviewerId,
        rating: Math.min(5, Math.max(1, rating)), // Clamp 1-5
        comment,
      },
    });

    // Update average rating
    const reviews = await prisma.subcontractorReview.findMany({
      where: { subcontractorId },
      select: { rating: true },
    });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.subcontractor.update({
      where: { id: subcontractorId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
      },
    });

    return review;
  }

  /**
   * Get all available trades in the marketplace
   */
  async getAvailableTrades() {
    const subs = await prisma.subcontractor.findMany({
      where: { available: true },
      select: { trades: true },
    });

    const tradesSet = new Set<string>();
    subs.forEach((sub) => sub.trades.forEach((t) => tradesSet.add(t)));

    return Array.from(tradesSet).sort();
  }
}

export const subcontractorMarketplace = new SubcontractorMarketplace();
