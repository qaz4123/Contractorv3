/**
 * Notifications Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { notificationService } from '../services/notifications/NotificationService';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await notificationService.getNotifications(req.user!.userId, {
    unreadOnly,
    page,
    pageSize,
  });

  res.json({ 
    success: true, 
    data: result.notifications,
    total: result.total,
    unreadCount: result.unreadCount,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}));

// POST /api/notifications/:id/read
router.post('/:id/read', asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user!.userId);
  res.json({ success: true });
}));

// POST /api/notifications/read-all
router.post('/read-all', asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user!.userId);
  res.json({ success: true });
}));

// DELETE /api/notifications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user!.userId);
  res.json({ success: true });
}));

export default router;
