/**
 * Push Notification Service — Sends browser push notifications via Web Push (VAPID)
 *
 * Requires env vars:
 *   VAPID_PUBLIC_KEY  — public VAPID key
 *   VAPID_PRIVATE_KEY — private VAPID key
 *   VAPID_EMAIL       — contact email for VAPID (mailto:...)
 *
 * Generate keys once:  npx web-push generate-vapid-keys
 */

import webpush from 'web-push';
import prisma from '../lib/prisma';

// ─── Configuration ───────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:hello@devovia.dev';

const isConfigured = VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY;

if (isConfigured) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push Service] VAPID configured');
} else {
  console.warn('[Push Service] VAPID keys not set — push notifications disabled');
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PushPayload {
  title: string;
  message: string;
  type: string;
  url?: string;
  icon?: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the public VAPID key (needed by frontend to subscribe)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string,
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      keys: subscription.keys as any,
      userAgent,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys as any,
      userAgent,
    },
  });
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/**
 * Remove all push subscriptions for a user
 */
export async function removeAllSubscriptions(userId: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { userId } });
}

/**
 * Send a push notification to all of a user's subscribed devices
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isConfigured) {
    console.log(`[Push Service] VAPID not configured — skipping push to ${userId}: "${payload.title}"`);
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  console.log(`[Push Service] Sending to ${userId}: "${payload.title}" — ${subscriptions.length} subscription(s) found`);

  if (subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.message,
    type: payload.type,
    url: payload.url || '/',
    icon: payload.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          pushPayload,
        );
      } catch (err: any) {
        // 410 Gone or 404 = subscription expired, clean up
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push Service] Removing expired subscription: ${sub.endpoint.slice(0, 60)}...`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          throw err;
        }
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');
  console.log(`[Push Service] Results for ${userId}: ${succeeded.length} sent, ${failed.length} failed`);
  if (failed.length > 0) {
    failed.forEach((r) => {
      if (r.status === 'rejected') console.error(`[Push Service] Failure:`, r.reason?.message || r.reason);
    });
  }
}
