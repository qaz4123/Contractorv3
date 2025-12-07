import { MaterialSupplier, ServiceAreaType, DeliveryType } from '@prisma/client';
import prisma from '../../lib/prisma';

interface SearchFilters {
  // Location-based search
  latitude?: number;
  longitude?: number;
  zipCode?: string;
  city?: string;
  state?: string;
  
  // Category filters
  category?: string;
  categories?: string[];
  brand?: string;
  
  // Delivery options
  needsDelivery?: boolean;
  needsSameDay?: boolean;
  
  // Other filters
  verified?: boolean;
  hasContractorDiscount?: boolean;
  net30?: boolean;
  minRating?: number;
  
  // Sorting & pagination
  sortBy?: 'distance' | 'rating' | 'price';
  page?: number;
  limit?: number;
}

interface SupplierWithDistance extends MaterialSupplier {
  distance?: number;
  deliveryAvailable?: boolean;
  deliveryCost?: number;
  estimatedDeliveryDays?: number;
}

interface DeliveryQuote {
  supplierId: string;
  supplierName: string;
  distance: number;
  deliveryAvailable: boolean;
  deliveryCost: number;
  freeDeliveryEligible: boolean;
  freeDeliveryMinimum?: number;
  estimatedDays: number;
  sameDayAvailable: boolean;
  sameDayCost?: number;
  pickupAvailable: boolean;
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

export class MaterialSupplierService {
  
  /**
   * Check if a supplier serves a specific location
   */
  async supplierServesLocation(
    supplier: MaterialSupplier & { serviceAreas?: { zipCodes: string[]; counties: string[] }[] },
    zipCode?: string,
    state?: string,
    latitude?: number,
    longitude?: number
  ): Promise<boolean> {
    const serviceType = supplier.serviceAreaType as ServiceAreaType;
    
    switch (serviceType) {
      case 'NATIONWIDE':
        // Check if ZIP is in excluded list
        if (zipCode && supplier.excludedZipCodes?.includes(zipCode)) {
          return false;
        }
        return true;
        
      case 'STATES':
        if (!state) return false;
        return supplier.serviceStates?.includes(state.toUpperCase()) || false;
        
      case 'ZIPCODES':
        if (!zipCode) return false;
        // Check if ZIP is explicitly served
        if (supplier.serviceZipCodes?.includes(zipCode)) {
          return true;
        }
        // Also check service areas
        if (supplier.serviceAreas) {
          return supplier.serviceAreas.some(area => 
            area.zipCodes.includes(zipCode)
          );
        }
        return false;
        
      case 'COUNTIES':
        // Would need county lookup from ZIP code
        // For now, return true if we can't verify
        return true;
        
      case 'RADIUS':
        if (!latitude || !longitude || !supplier.latitude || !supplier.longitude) {
          return false;
        }
        const distance = calculateDistance(
          latitude,
          longitude,
          supplier.latitude,
          supplier.longitude
        );
        return distance <= (supplier.deliveryRadius || 50);
        
      case 'CUSTOM':
        // Check service areas for custom zones
        if (zipCode && supplier.serviceAreas) {
          return supplier.serviceAreas.some(area => 
            area.zipCodes.includes(zipCode)
          );
        }
        return false;
        
      default:
        return true;
    }
  }

  /**
   * Search for suppliers that serve a specific location
   */
  async searchSuppliers(filters: SearchFilters): Promise<{
    suppliers: SupplierWithDistance[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Build where clause
    const where: Record<string, unknown> = {
      active: true,
    };

    // Category filter
    if (filters.category) {
      where.categories = { has: filters.category };
    }
    if (filters.categories && filters.categories.length > 0) {
      where.categories = { hasSome: filters.categories };
    }

    // Brand filter
    if (filters.brand) {
      where.brands = { has: filters.brand };
    }

    // Delivery filter
    if (filters.needsDelivery) {
      where.offersDelivery = true;
    }

    // Same-day filter
    if (filters.needsSameDay) {
      where.sameDayAvailable = true;
    }

    // Verified filter
    if (filters.verified) {
      where.verified = true;
    }

    // Contractor discount filter
    if (filters.hasContractorDiscount) {
      where.contractorDiscount = { gt: 0 };
    }

    // Net30 filter
    if (filters.net30) {
      where.net30Available = true;
    }

    // Rating filter
    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    // State filter for quick filtering
    if (filters.state) {
      where.OR = [
        { serviceAreaType: 'NATIONWIDE' },
        { serviceStates: { has: filters.state.toUpperCase() } },
        { state: filters.state.toUpperCase() }, // Supplier is in this state
      ];
    }

    // Get all matching suppliers with service areas
    const allSuppliers = await prisma.materialSupplier.findMany({
      where,
      include: {
        serviceAreas: true,
      },
    });

    // Filter by location service area
    let filteredSuppliers = allSuppliers;
    if (filters.zipCode || filters.latitude) {
      filteredSuppliers = [];
      for (const supplier of allSuppliers) {
        const serves = await this.supplierServesLocation(
          supplier,
          filters.zipCode,
          filters.state,
          filters.latitude,
          filters.longitude
        );
        if (serves) {
          filteredSuppliers.push(supplier);
        }
      }
    }

    // Calculate distance and delivery info
    let results: SupplierWithDistance[] = filteredSuppliers.map((supplier) => {
      const result: SupplierWithDistance = { ...supplier } as SupplierWithDistance;

      // Calculate distance if coordinates provided
      if (
        filters.latitude &&
        filters.longitude &&
        supplier.latitude &&
        supplier.longitude
      ) {
        result.distance = calculateDistance(
          filters.latitude,
          filters.longitude,
          supplier.latitude,
          supplier.longitude
        );

        // Check if delivery is available at this distance
        if (supplier.offersDelivery) {
          const maxDistance = supplier.maxDeliveryDistance || supplier.deliveryRadius || 100;
          result.deliveryAvailable = result.distance <= maxDistance;

          // Calculate delivery cost
          if (result.deliveryAvailable) {
            if (supplier.deliveryPerMile) {
              result.deliveryCost = Math.max(
                supplier.minDeliveryFee || 0,
                result.distance * supplier.deliveryPerMile
              );
            } else {
              result.deliveryCost = supplier.deliveryFee || 0;
            }
          }
        }
      } else {
        result.deliveryAvailable = supplier.offersDelivery;
        result.deliveryCost = supplier.deliveryFee || 0;
      }

      // Estimate delivery days based on distance
      if (result.distance !== undefined) {
        if (result.distance < 30) {
          result.estimatedDeliveryDays = 1;
        } else if (result.distance < 100) {
          result.estimatedDeliveryDays = 2;
        } else {
          result.estimatedDeliveryDays = 3;
        }
      }

      return result;
    });

    // Sort results
    switch (filters.sortBy) {
      case 'distance':
        results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        results.sort((a, b) => (a.deliveryCost || 0) - (b.deliveryCost || 0));
        break;
      default:
        // Default: sort by distance if available, then rating
        results.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          return b.rating - a.rating;
        });
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      suppliers: paginatedResults,
      total: results.length,
      page,
      totalPages: Math.ceil(results.length / limit),
    };
  }

  /**
   * Get delivery quote from a specific supplier to a location
   */
  async getDeliveryQuote(
    supplierId: string,
    deliveryLatitude: number,
    deliveryLongitude: number,
    orderTotal: number
  ): Promise<DeliveryQuote | null> {
    const supplier = await prisma.materialSupplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier || !supplier.latitude || !supplier.longitude) {
      return null;
    }

    const distance = calculateDistance(
      deliveryLatitude,
      deliveryLongitude,
      supplier.latitude,
      supplier.longitude
    );

    const maxDistance = supplier.maxDeliveryDistance || supplier.deliveryRadius || 100;
    const deliveryAvailable = supplier.offersDelivery && distance <= maxDistance;

    let deliveryCost = 0;
    if (deliveryAvailable) {
      if (supplier.deliveryPerMile) {
        deliveryCost = Math.max(
          supplier.minDeliveryFee || 0,
          distance * supplier.deliveryPerMile
        );
      } else {
        deliveryCost = supplier.deliveryFee || 0;
      }
    }

    const freeDeliveryEligible = 
      supplier.freeDeliveryMin !== null && 
      orderTotal >= (supplier.freeDeliveryMin || 0);

    // Estimate delivery days
    let estimatedDays = 1;
    if (distance >= 100) estimatedDays = 3;
    else if (distance >= 30) estimatedDays = 2;

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      distance: Math.round(distance * 10) / 10,
      deliveryAvailable,
      deliveryCost: freeDeliveryEligible ? 0 : Math.round(deliveryCost * 100) / 100,
      freeDeliveryEligible,
      freeDeliveryMinimum: supplier.freeDeliveryMin || undefined,
      estimatedDays,
      sameDayAvailable: supplier.sameDayAvailable && distance < 30,
      sameDayCost: supplier.sameDayFee || undefined,
      pickupAvailable: supplier.offersPickup,
    };
  }

  /**
   * Get delivery quotes from multiple suppliers
   */
  async getDeliveryQuotes(
    deliveryLatitude: number,
    deliveryLongitude: number,
    deliveryZipCode: string,
    deliveryState: string,
    orderTotal: number,
    category?: string
  ): Promise<DeliveryQuote[]> {
    // First find suppliers that serve this location
    const { suppliers } = await this.searchSuppliers({
      latitude: deliveryLatitude,
      longitude: deliveryLongitude,
      zipCode: deliveryZipCode,
      state: deliveryState,
      category,
      needsDelivery: true,
      limit: 50,
    });

    // Get quotes from each
    const quotes: DeliveryQuote[] = [];
    for (const supplier of suppliers) {
      if (supplier.latitude && supplier.longitude) {
        const quote = await this.getDeliveryQuote(
          supplier.id,
          deliveryLatitude,
          deliveryLongitude,
          orderTotal
        );
        if (quote && quote.deliveryAvailable) {
          quotes.push(quote);
        }
      }
    }

    // Sort by delivery cost
    return quotes.sort((a, b) => a.deliveryCost - b.deliveryCost);
  }

  /**
   * Find nearest suppliers for a category
   */
  async findNearestSuppliers(
    latitude: number,
    longitude: number,
    category: string,
    limit: number = 5
  ): Promise<SupplierWithDistance[]> {
    const { suppliers } = await this.searchSuppliers({
      latitude,
      longitude,
      category,
      sortBy: 'distance',
      limit,
    });

    return suppliers;
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    const suppliers = await prisma.materialSupplier.findMany({
      where: { active: true },
      select: { categories: true },
    });

    const categoriesSet = new Set<string>();
    suppliers.forEach(s => s.categories.forEach(c => categoriesSet.add(c)));

    return Array.from(categoriesSet).sort();
  }

  /**
   * Get all available brands
   */
  async getBrands(category?: string): Promise<string[]> {
    const where: Record<string, unknown> = { active: true };
    if (category) {
      where.categories = { has: category };
    }

    const suppliers = await prisma.materialSupplier.findMany({
      where,
      select: { brands: true },
    });

    const brandsSet = new Set<string>();
    suppliers.forEach(s => s.brands.forEach(b => brandsSet.add(b)));

    return Array.from(brandsSet).sort();
  }

  /**
   * Create a material order with delivery calculation
   */
  async createOrder(data: {
    projectId: string;
    supplierId: string;
    items: Array<{ name: string; quantity: number; unit: string; unitPrice: number }>;
    deliveryType: DeliveryType;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    deliveryStreet?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryZipCode?: string;
    deliveryDate?: Date;
    deliveryWindow?: string;
    deliveryNotes?: string;
  }) {
    const supplier = await prisma.materialSupplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Calculate totals
    const itemsWithTotals = data.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    // Calculate distance and shipping
    let distanceToSupplier: number | null = null;
    let shipping = 0;

    if (
      data.deliveryType === 'DELIVERY' &&
      data.deliveryLatitude &&
      data.deliveryLongitude &&
      supplier.latitude &&
      supplier.longitude
    ) {
      distanceToSupplier = calculateDistance(
        data.deliveryLatitude,
        data.deliveryLongitude,
        supplier.latitude,
        supplier.longitude
      );

      // Calculate delivery cost
      if (supplier.freeDeliveryMin && subtotal >= supplier.freeDeliveryMin) {
        shipping = 0;
      } else if (supplier.deliveryPerMile) {
        shipping = Math.max(
          supplier.minDeliveryFee || 0,
          distanceToSupplier * supplier.deliveryPerMile
        );
      } else {
        shipping = supplier.deliveryFee || 0;
      }
    }

    // Calculate tax (assume 8% for now, should be location-based)
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shipping;

    // Create the order
    return prisma.materialOrder.create({
      data: {
        projectId: data.projectId,
        supplierId: data.supplierId,
        supplierName: supplier.name,
        items: itemsWithTotals,
        subtotal,
        tax,
        shipping,
        total,
        deliveryType: data.deliveryType,
        deliveryStreet: data.deliveryStreet,
        deliveryCity: data.deliveryCity,
        deliveryState: data.deliveryState,
        deliveryZipCode: data.deliveryZipCode,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        distanceToSupplier,
        deliveryDate: data.deliveryDate,
        deliveryWindow: data.deliveryWindow,
        deliveryNotes: data.deliveryNotes,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
      },
      include: {
        supplier: true,
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

export const materialSupplierService = new MaterialSupplierService();
