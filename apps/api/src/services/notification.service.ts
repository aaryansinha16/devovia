/**
 * Notification Service — Central brain for all notifications
 *
 * Every notification in the system flows through this service.
 * It decides: store in DB → emit via WebSocket → send email (if enabled).
 */

import prisma from '../lib/prisma';
import { websocketLogsService } from './websocket-logs.service';
import { sendNotificationEmail } from './email.service';
import { sendPushNotification } from './push.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotifyPayload {
  type: string;       // e.g. "deployment_failed", "project_invite", "mention"
  title: string;
  message: string;
  data?: Record<string, any>;  // Arbitrary payload (projectId, url, etc.)
  groupKey?: string;           // For batching related notifications
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  readAt: Date | null;
  groupKey: string | null;
  createdAt: Date;
}

// Default channel settings per notification type
const DEFAULT_CHANNELS: Record<string, { email: boolean; push: boolean; inApp: boolean }> = {
  deployment_failed:   { email: true,  push: true,  inApp: true },
  deployment_success:  { email: false, push: false, inApp: true },
  project_invite:      { email: true,  push: true,  inApp: true },
  project_update:      { email: false, push: false, inApp: true },
  session_invite:      { email: false, push: true,  inApp: true },
  session_joined:      { email: false, push: false, inApp: true },
  runbook_completed:   { email: false, push: false, inApp: true },
  runbook_failed:      { email: true,  push: true,  inApp: true },
  mention:             { email: false, push: true,  inApp: true },
  security:            { email: true,  push: true,  inApp: true },
  system:              { email: false, push: false, inApp: true },
};

// ─── Core notify function ────────────────────────────────────────────────────

/**
 * Send a notification to a user. This is the ONLY way to create notifications.
 *
 * 1. Checks user preferences to determine which channels to use
 * 2. Stores in DB (if inApp enabled)
 * 3. Emits via WebSocket for real-time delivery
 * 4. Queues email (if email enabled) — Phase 2
 */
export async function notify(
  userId: string,
  payload: NotifyPayload,
): Promise<NotificationRecord | null> {
  try {
    // Resolve channel settings for this notification type
    const channels = await resolveChannels(userId, payload.type);

    console.log('[Notify] userId:', userId, '| type:', payload.type, '| channels:', channels);

    // If all channels are disabled, skip entirely
    if (!channels.inApp && !channels.email && !channels.push) {
      console.log('[Notify] All channels disabled, skipping for user:', userId);
      return null;
    }

    // Store in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || undefined,
        groupKey: payload.groupKey || undefined,
      },
    });

    // Emit via WebSocket for real-time delivery
    if (channels.inApp) {
      const unreadCount = await getUnreadCount(userId);
      websocketLogsService.emitNotification(userId, notification);
      websocketLogsService.emitUnreadCount(userId, unreadCount);
    }

    // Email delivery
    if (channels.email) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        // Fire-and-forget — don't block the notification response
        sendNotificationEmail(user.email, {
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data,
        }).catch((err) => console.error('Email send error:', err));
      }
    }

    // Push notification
    if (channels.push) {
      sendPushNotification(userId, {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        url: payload.data?.url,
      }).catch((err) => console.error('Push send error:', err));
    }

    return notification as NotificationRecord;
  } catch (error) {
    console.error('Notification service error:', error);
    return null;
  }
}

/**
 * Send a notification to multiple users at once.
 */
export async function notifyMany(
  userIds: string[],
  payload: NotifyPayload,
): Promise<void> {
  // Deduplicate
  const unique = [...new Set(userIds)];
  await Promise.allSettled(unique.map((uid) => notify(uid, payload)));
}

// ─── Read / Query ────────────────────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  options: { cursor?: string; limit?: number; unreadOnly?: boolean } = {},
): Promise<{ notifications: NotificationRecord[]; nextCursor: string | null }> {
  const limit = options.limit || 20;

  const where: any = { userId };
  if (options.unreadOnly) where.read = false;
  if (options.cursor) where.createdAt = { lt: new Date(options.cursor) };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // Fetch one extra to determine if there's a next page
  });

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();

  const nextCursor = hasMore && notifications.length > 0
    ? notifications[notifications.length - 1].createdAt.toISOString()
    : null;

  return { notifications: notifications as NotificationRecord[], nextCursor };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<NotificationRecord | null> {
  const notification = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true, readAt: new Date() },
  });

  if (notification.count === 0) return null;

  // Emit updated unread count
  const unreadCount = await getUnreadCount(userId);
  websocketLogsService.emitUnreadCount(userId, unreadCount);

  const updated = await prisma.notification.findUnique({ where: { id: notificationId } });
  return updated as NotificationRecord | null;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });

  // Emit updated unread count (0)
  websocketLogsService.emitUnreadCount(userId, 0);

  return result.count;
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });

  if (result.count > 0) {
    const unreadCount = await getUnreadCount(userId);
    websocketLogsService.emitUnreadCount(userId, unreadCount);
  }

  return result.count > 0;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getPreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Return defaults if no preferences saved yet
  if (!prefs) {
    return {
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      channelOverrides: null,
      digestFrequency: 'daily',
    };
  }

  return prefs;
}

export async function updatePreferences(
  userId: string,
  data: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    channelOverrides?: Record<string, { email?: boolean; push?: boolean; inApp?: boolean }>;
    digestFrequency?: string;
  },
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      emailEnabled: data.emailEnabled ?? true,
      pushEnabled: data.pushEnabled ?? true,
      inAppEnabled: data.inAppEnabled ?? true,
      channelOverrides: data.channelOverrides as any,
      digestFrequency: data.digestFrequency ?? 'daily',
    },
    update: {
      ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
      ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
      ...(data.inAppEnabled !== undefined && { inAppEnabled: data.inAppEnabled }),
      ...(data.channelOverrides !== undefined && { channelOverrides: data.channelOverrides as any }),
      ...(data.digestFrequency !== undefined && { digestFrequency: data.digestFrequency }),
    },
  });
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function resolveChannels(
  userId: string,
  type: string,
): Promise<{ email: boolean; push: boolean; inApp: boolean }> {
  const defaults = DEFAULT_CHANNELS[type] || { email: false, push: false, inApp: true };

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) return defaults;

  // Start with global toggles
  let channels = {
    email: prefs.emailEnabled && defaults.email,
    push: prefs.pushEnabled && defaults.push,
    inApp: prefs.inAppEnabled && defaults.inApp,
  };

  // Apply per-type overrides if they exist
  if (prefs.channelOverrides && typeof prefs.channelOverrides === 'object') {
    const overrides = (prefs.channelOverrides as Record<string, any>)[type];
    if (overrides) {
      if (typeof overrides.email === 'boolean') channels.email = prefs.emailEnabled && overrides.email;
      if (typeof overrides.push === 'boolean') channels.push = prefs.pushEnabled && overrides.push;
      if (typeof overrides.inApp === 'boolean') channels.inApp = prefs.inAppEnabled && overrides.inApp;
    }
  }

  return channels;
}
