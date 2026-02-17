/**
 * Notification Controller
 *
 * REST endpoints for notification CRUD and preferences management.
 */

import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import * as pushService from '../services/push.service';

// GET /api/notifications
export async function listNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getNotifications(userId, { cursor, limit, unreadOnly });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('List notifications error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/notifications/unread-count
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const count = await notificationService.getUnreadCount(userId);

    return res.json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('Unread count error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /api/notifications/:id/read
export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, data: notification });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /api/notifications/read-all
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const count = await notificationService.markAllAsRead(userId);

    return res.json({ success: true, data: { markedCount: count } });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /api/notifications/:id
export async function deleteNotification(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const deleted = await notificationService.deleteNotification(id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/notifications/preferences
export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const prefs = await notificationService.getPreferences(userId);

    return res.json({ success: true, data: prefs });
  } catch (error: any) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PUT /api/notifications/preferences
export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { emailEnabled, pushEnabled, inAppEnabled, channelOverrides, digestFrequency } = req.body;

    const prefs = await notificationService.updatePreferences(userId, {
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      channelOverrides,
      digestFrequency,
    });

    return res.json({ success: true, data: prefs });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Push Subscription Endpoints ─────────────────────────────────────────────

// GET /api/notifications/push/vapid-key
export async function getVapidKey(_req: Request, res: Response) {
  try {
    const key = pushService.getVapidPublicKey();
    return res.json({ success: true, data: { publicKey: key } });
  } catch (error: any) {
    console.error('Get VAPID key error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/notifications/push/subscribe
export async function pushSubscribe(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid push subscription object' });
    }

    await pushService.saveSubscription(userId, subscription, req.headers['user-agent']);

    return res.json({ success: true, message: 'Push subscription saved' });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/notifications/push/unsubscribe
export async function pushUnsubscribe(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { endpoint } = req.body;
    if (endpoint) {
      await pushService.removeSubscription(endpoint);
    } else {
      await pushService.removeAllSubscriptions(userId);
    }

    return res.json({ success: true, message: 'Push subscription removed' });
  } catch (error: any) {
    console.error('Push unsubscribe error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
