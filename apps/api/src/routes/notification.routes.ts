/**
 * Notification Routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  getVapidKey,
  pushSubscribe,
  pushUnsubscribe,
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication (requireAuth parses JWT, then controllers check req.user)
router.use(requireAuth);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Push subscription
router.get('/push/vapid-key', getVapidKey);
router.post('/push/subscribe', pushSubscribe);
router.post('/push/unsubscribe', pushUnsubscribe);

export default router;
