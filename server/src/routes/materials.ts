import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { materialService } from '../services/materials/MaterialService';
import { materialSupplierService } from '../services/materials/MaterialSupplierService';
import { DeliveryType } from '@prisma/client';
import prisma from '../lib/prisma';

const router = Router();

// ==========================================
// PUBLIC ROUTES - No authentication required
// ==========================================

// Search suppliers with location-based service area filtering
router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const {
      latitude,
      longitude,
      zipCode,
      city,
      state,
      category,
      categories,
      brand,
      needsDelivery,
      needsSameDay,
      verified,
      hasContractorDiscount,
      net30,
      minRating,
      sortBy,
      page,
      limit
    } = req.query;

    // Use new service with service area support
    const result = await materialSupplierService.searchSuppliers({
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      zipCode: zipCode as string,
      city: city as string,
      state: state as string,
      category: category as string,
      categories: categories ? (categories as string).split(',') : undefined,
      brand: brand as string,
      needsDelivery: needsDelivery === 'true',
      needsSameDay: needsSameDay === 'true',
      verified: verified === 'true',
      hasContractorDiscount: hasContractorDiscount === 'true',
      net30: net30 === 'true',
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      sortBy: sortBy as 'distance' | 'rating' | 'price',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    res.json({
      success: true,
      data: result.suppliers,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      }
    });
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({ success: false, error: 'Failed to search suppliers' });
  }
});

// Get supplier categories for filtering
router.get('/suppliers/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await materialSupplierService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// Get brands (optionally filtered by category)
router.get('/suppliers/brands', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const brands = await materialSupplierService.getBrands(category as string);
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ success: false, error: 'Failed to get brands' });
  }
});

// Get supplier by ID with distance from a location
router.get('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;

    const fromLocation = latitude && longitude ? {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string)
    } : undefined;

    const supplier = await materialService.getSupplier(id, fromLocation);
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error getting supplier:', error);
    if (error instanceof Error && error.message === 'Supplier not found') {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to get supplier' });
  }
});

// Get delivery quotes from multiple suppliers to a location
router.post('/delivery-quotes', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, zipCode, state, orderTotal, category } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    const quotes = await materialSupplierService.getDeliveryQuotes(
      latitude,
      longitude,
      zipCode || '',
      state || '',
      orderTotal || 0,
      category
    );

    res.json({
      success: true,
      data: quotes,
      location: { latitude, longitude, zipCode, state }
    });
  } catch (error) {
    console.error('Error getting delivery quotes:', error);
    res.status(500).json({ success: false, error: 'Failed to get delivery quotes' });
  }
});

// Get delivery quote from specific supplier
router.get('/suppliers/:id/delivery-quote', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, orderTotal } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    const quote = await materialSupplierService.getDeliveryQuote(
      id,
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      orderTotal ? parseFloat(orderTotal as string) : 0
    );

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Supplier not found or no delivery available' });
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    console.error('Error getting delivery quote:', error);
    res.status(500).json({ success: false, error: 'Failed to get delivery quote' });
  }
});

// Find nearest suppliers to a location
router.get('/suppliers/nearby', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, category, limit } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    const suppliers = await materialSupplierService.findNearestSuppliers(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      category as string,
      limit ? parseInt(limit as string) : 5
    );

    res.json({
      success: true,
      data: suppliers,
      location: { latitude: parseFloat(latitude as string), longitude: parseFloat(longitude as string) }
    });
  } catch (error) {
    console.error('Error finding nearby suppliers:', error);
    res.status(500).json({ success: false, error: 'Failed to find nearby suppliers' });
  }
});

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================

// All routes below require authentication
router.use(authenticate);

// Create a new supplier (for admin or verified contractors)
router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const supplier = await materialService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ success: false, error: 'Failed to create supplier' });
  }
});

// ==========================================
// ORDER ROUTES
// ==========================================

// Create a material order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      projectId,
      supplierId,
      items,
      deliveryType,
      deliveryDate,
      deliveryWindow,
      deliveryNotes,
      deliveryAddress
    } = req.body;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const order = await materialSupplierService.createOrder({
      projectId,
      supplierId,
      items,
      deliveryType: deliveryType as DeliveryType,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      deliveryWindow,
      deliveryNotes,
      deliveryStreet: deliveryAddress?.street,
      deliveryCity: deliveryAddress?.city,
      deliveryState: deliveryAddress?.state,
      deliveryZipCode: deliveryAddress?.zipCode,
      deliveryLatitude: deliveryAddress?.latitude,
      deliveryLongitude: deliveryAddress?.longitude
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof Error && error.message === 'Supplier not found') {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Get orders for a project
router.get('/projects/:projectId/orders', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { projectId } = req.params;
    const { status } = req.query;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const where: Record<string, unknown> = { projectId };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.materialOrder.findMany({
      where,
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

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error getting project orders:', error);
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

// Get order by ID
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await prisma.materialOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: {
          select: { id: true, name: true, userId: true }
        }
      }
    });

    if (!order || order.project.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
});

// Get order summary for a project
router.get('/projects/:projectId/orders/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const orders = await prisma.materialOrder.findMany({
      where: { projectId }
    });

    const summary = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
      byStatus: {
        draft: orders.filter(o => o.status === 'DRAFT').length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        processing: orders.filter(o => ['CONFIRMED', 'PROCESSING'].includes(o.status)).length,
        shipped: orders.filter(o => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length
      },
      unpaidAmount: orders
        .filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0)
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting order summary:', error);
    res.status(500).json({ success: false, error: 'Failed to get order summary' });
  }
});

// Find nearby suppliers for a project
router.get('/projects/:projectId/nearby-suppliers', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { projectId } = req.params;
    const { categories } = req.query;

    const result = await materialService.findNearbySuppliers(
      projectId,
      userId,
      categories ? (categories as string).split(',') : undefined
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error finding nearby suppliers:', error);
    if (error instanceof Error && error.message === 'Project not found') {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to find nearby suppliers' });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body;

    const order = await materialService.updateOrderStatus(id, userId, status);
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error instanceof Error && error.message === 'Order not found') {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Calculate delivery fee estimate
router.post('/delivery-estimate', async (req: Request, res: Response) => {
  try {
    const { supplierId, deliveryLatitude, deliveryLongitude, orderTotal } = req.body;

    const supplier = await materialService.getSupplier(supplierId, {
      latitude: deliveryLatitude,
      longitude: deliveryLongitude
    });

    if (!supplier.distance) {
      return res.status(400).json({ success: false, error: 'Cannot calculate distance' });
    }

    const canDeliver = supplier.offersDelivery && 
      (!supplier.deliveryRadius || supplier.distance <= supplier.deliveryRadius);

    if (!canDeliver) {
      return res.json({
        success: true,
        canDeliver: false,
        distance: supplier.distance,
        message: 'Supplier does not deliver to this location'
      });
    }

    const deliveryFee = materialService.calculateDeliveryFee(
      supplier,
      supplier.distance,
      orderTotal || 0
    );

    res.json({
      success: true,
      canDeliver: true,
      distance: Math.round(supplier.distance * 10) / 10,
      deliveryFee,
      freeDeliveryMin: supplier.freeDeliveryMin,
      estimatedTime: `${Math.ceil(supplier.distance / 30 * 60)} mins` // Rough estimate at 30mph
    });
  } catch (error) {
    console.error('Error calculating delivery estimate:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate delivery estimate' });
  }
});

export default router;
