import { DeliveryType, MaterialOrderStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../lib/prisma';

interface Location {
  latitude: number;
  longitude: number;
}

interface SupplierSearchParams {
  latitude?: number;
  longitude?: number;
  maxDistance?: number; // Miles
  categories?: string[];
  offersDelivery?: boolean;
  sortBy?: 'distance' | 'rating' | 'price';
  page?: number;
  limit?: number;
}

interface CreateOrderParams {
  projectId: string;
  supplierId?: string;
  supplierName: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
  deliveryType: DeliveryType;
  deliveryDate?: Date;
  deliveryWindow?: string;
  deliveryNotes?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
}

export class MaterialService {
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

  // Calculate delivery fee based on distance
  calculateDeliveryFee(supplier: {
    deliveryFee?: number | null;
    deliveryPerMile?: number | null;
    freeDeliveryMin?: number | null;
  }, distance: number, orderTotal: number): number {
    // Free delivery if order meets minimum
    if (supplier.freeDeliveryMin && orderTotal >= supplier.freeDeliveryMin) {
      return 0;
    }

    // Calculate fee
    let fee = supplier.deliveryFee || 0;
    if (supplier.deliveryPerMile) {
      fee += distance * supplier.deliveryPerMile;
    }

    return Math.round(fee * 100) / 100;
  }

  // Search suppliers near a location
  async searchSuppliers(params: SupplierSearchParams) {
    const {
      latitude,
      longitude,
      maxDistance = 50,
      categories,
      offersDelivery,
      sortBy = 'distance',
      page = 1,
      limit = 20
    } = params;

    // Build where clause
    const where: Record<string, unknown> = { active: true };
    
    if (categories && categories.length > 0) {
      where.categories = { hasSome: categories };
    }
    
    if (offersDelivery !== undefined) {
      where.offersDelivery = offersDelivery;
    }

    // Get all suppliers (we'll filter by distance in memory for now)
    // In production, use PostGIS or similar for geo queries
    const allSuppliers = await prisma.materialSupplier.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    // Filter by distance and add distance field
    let suppliers = allSuppliers.map(supplier => {
      let distance: number | null = null;
      
      if (latitude && longitude && supplier.latitude && supplier.longitude) {
        distance = this.calculateDistance(
          { latitude, longitude },
          { latitude: supplier.latitude, longitude: supplier.longitude }
        );
      }

      const canDeliver = supplier.offersDelivery && 
        (distance === null || !supplier.deliveryRadius || distance <= supplier.deliveryRadius);

      return {
        ...supplier,
        distance,
        canDeliver,
        orderCount: supplier._count.orders
      };
    }).filter(s => {
      // Filter by max distance if location provided
      if (latitude && longitude && s.distance !== null) {
        return s.distance <= maxDistance;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'distance':
        suppliers.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
        break;
      case 'rating':
        suppliers.sort((a, b) => b.rating - a.rating);
        break;
    }

    // Paginate
    const total = suppliers.length;
    const startIndex = (page - 1) * limit;
    suppliers = suppliers.slice(startIndex, startIndex + limit);

    return {
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get supplier by ID with distance from a location
  async getSupplier(supplierId: string, fromLocation?: Location) {
    const supplier = await prisma.materialSupplier.findUnique({
      where: { id: supplierId },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    let distance: number | null = null;
    if (fromLocation && supplier.latitude && supplier.longitude) {
      distance = this.calculateDistance(fromLocation, {
        latitude: supplier.latitude,
        longitude: supplier.longitude
      });
    }

    return {
      ...supplier,
      distance,
      orderCount: supplier._count.orders
    };
  }

  // Create a material order
  async createOrder(userId: string, params: CreateOrderParams) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: params.projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate totals
    const itemsWithTotal = params.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax - should be configurable

    // Get supplier info and calculate distance
    let distance: number | null = null;
    let shipping = 0;
    let supplier = null;

    if (params.supplierId) {
      supplier = await prisma.materialSupplier.findUnique({
        where: { id: params.supplierId }
      });

      if (supplier && supplier.latitude && supplier.longitude) {
        const deliveryLat = params.deliveryAddress?.latitude;
        const deliveryLon = params.deliveryAddress?.longitude;

        if (deliveryLat && deliveryLon) {
          distance = this.calculateDistance(
            { latitude: supplier.latitude, longitude: supplier.longitude },
            { latitude: deliveryLat, longitude: deliveryLon }
          );

          if (params.deliveryType === 'DELIVERY') {
            shipping = this.calculateDeliveryFee(supplier, distance, subtotal);
          }
        }
      }
    }

    const total = subtotal + tax + shipping;

    const order = await prisma.materialOrder.create({
      data: {
        projectId: params.projectId,
        supplierId: params.supplierId,
        supplierName: params.supplierName,
        items: itemsWithTotal,
        subtotal,
        tax,
        shipping,
        total,
        deliveryType: params.deliveryType,
        deliveryDate: params.deliveryDate,
        deliveryWindow: params.deliveryWindow,
        deliveryNotes: params.deliveryNotes,
        deliveryStreet: params.deliveryAddress?.street,
        deliveryCity: params.deliveryAddress?.city,
        deliveryState: params.deliveryAddress?.state,
        deliveryZipCode: params.deliveryAddress?.zipCode,
        deliveryLatitude: params.deliveryAddress?.latitude,
        deliveryLongitude: params.deliveryAddress?.longitude,
        distanceToSupplier: distance,
        status: 'DRAFT'
      },
      include: {
        supplier: true,
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return order;
  }

  // Get orders for a project
  async getProjectOrders(projectId: string, userId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return prisma.materialOrder.findMany({
      where: { projectId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            state: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Update order status
  async updateOrderStatus(orderId: string, userId: string, status: MaterialOrderStatus) {
    const order = await prisma.materialOrder.findFirst({
      where: { id: orderId },
      include: { project: true }
    });

    if (!order || order.project.userId !== userId) {
      throw new Error('Order not found');
    }

    const updateData: Record<string, unknown> = { status };

    // Set timestamps based on status
    if (status === 'CONFIRMED') {
      updateData.orderedAt = new Date();
    } else if (status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY') {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    return prisma.materialOrder.update({
      where: { id: orderId },
      data: updateData
    });
  }

  // Find nearby suppliers for a project
  async findNearbySuppliers(projectId: string, userId: string, categories?: string[]) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // For now, search by city/state. In production, geocode the project address
    // and use lat/long for distance calculation
    return this.searchSuppliers({
      categories,
      sortBy: 'rating',
      limit: 10
    });
  }

  // Create a new supplier (admin or verified contractors)
  async createSupplier(data: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    categories: string[];
    offersDelivery?: boolean;
    deliveryRadius?: number;
    freeDeliveryMin?: number;
    deliveryFee?: number;
    deliveryPerMile?: number;
  }) {
    return prisma.materialSupplier.create({
      data: {
        ...data,
        rating: 0,
        reviewCount: 0,
        verified: false,
        active: true
      }
    });
  }

  // Get supplier categories (for filtering)
  async getCategories() {
    const suppliers = await prisma.materialSupplier.findMany({
      select: { categories: true },
      where: { active: true }
    });

    const categorySet = new Set<string>();
    suppliers.forEach(s => s.categories.forEach(c => categorySet.add(c)));
    
    return Array.from(categorySet).sort();
  }
}

export const materialService = new MaterialService();
