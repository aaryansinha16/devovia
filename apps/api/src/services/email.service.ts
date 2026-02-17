/**
 * Email Service — Sends transactional emails via Resend
 *
 * Requires RESEND_API_KEY environment variable.
 * If not set, emails are logged to console instead of sent.
 */

import { Resend } from 'resend';

// ─── Configuration ───────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Devovia <notifications@devovia.dev>';
const APP_NAME = 'Devovia';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationEmailPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// ─── Type-specific colors and icons ──────────────────────────────────────────

const TYPE_STYLES: Record<string, { color: string; emoji: string }> = {
  deployment_success: { color: '#10b981', emoji: '🚀' },
  deployment_failed:  { color: '#ef4444', emoji: '❌' },
  project_invite:     { color: '#0ea5e9', emoji: '👥' },
  project_update:     { color: '#64748b', emoji: '📋' },
  session_invite:     { color: '#8b5cf6', emoji: '💻' },
  session_joined:     { color: '#8b5cf6', emoji: '💻' },
  runbook_completed:  { color: '#10b981', emoji: '✅' },
  runbook_failed:     { color: '#ef4444', emoji: '❌' },
  mention:            { color: '#f59e0b', emoji: '💬' },
  security:           { color: '#ef4444', emoji: '🔒' },
  system:             { color: '#64748b', emoji: 'ℹ️' },
};

// ─── Send notification email ─────────────────────────────────────────────────

export async function sendNotificationEmail(
  to: string,
  notification: NotificationEmailPayload,
): Promise<boolean> {
  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.system;
  const actionUrl = notification.data?.url
    ? `${APP_URL}${notification.data.url}`
    : APP_URL;

  const html = buildNotificationHtml({
    emoji: style.emoji,
    accentColor: style.color,
    title: notification.title,
    message: notification.message,
    actionUrl,
    actionLabel: 'View in Devovia',
  });

  if (!resend) {
    console.log(`[Email Service] Would send to ${to}: "${notification.title}" — ${notification.message}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${style.emoji} ${notification.title}`,
      html,
    });

    if (error) {
      console.error('[Email Service] Send error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email Service] Exception:', err);
    return false;
  }
}

// ─── Send digest email ───────────────────────────────────────────────────────

export async function sendDigestEmail(
  to: string,
  notifications: NotificationEmailPayload[],
  period: 'daily' | 'weekly',
): Promise<boolean> {
  if (notifications.length === 0) return true;

  const rows = notifications.map((n) => {
    const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b;">
          <span style="font-size: 16px; margin-right: 8px;">${style.emoji}</span>
          <strong style="color: #e2e8f0;">${n.title}</strong>
          <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">${n.message}</div>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 12px; overflow: hidden;">
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b;">
        <h1 style="margin: 0; color: #e2e8f0; font-size: 20px;">
          📬 Your ${period === 'daily' ? 'Daily' : 'Weekly'} Digest
        </h1>
        <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">
          ${notifications.length} notification${notifications.length > 1 ? 's' : ''} from ${APP_NAME}
        </p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
      <div style="padding: 20px; text-align: center;">
        <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Open Dashboard
        </a>
      </div>
    </div>
    <div style="text-align: center; padding: 16px; color: #475569; font-size: 12px;">
      <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: underline;">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    console.log(`[Email Service] Would send ${period} digest to ${to} with ${notifications.length} items`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `📬 Your ${period === 'daily' ? 'Daily' : 'Weekly'} ${APP_NAME} Digest (${notifications.length} notifications)`,
      html,
    });

    if (error) {
      console.error('[Email Service] Digest send error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email Service] Digest exception:', err);
    return false;
  }
}

// ─── HTML template builder ───────────────────────────────────────────────────

function buildNotificationHtml(opts: {
  emoji: string;
  accentColor: string;
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 12px; overflow: hidden;">
      <!-- Header -->
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b;">
        <div style="font-size: 32px; margin-bottom: 8px;">${opts.emoji}</div>
        <h1 style="margin: 0; color: #e2e8f0; font-size: 20px;">${opts.title}</h1>
      </div>

      <!-- Body -->
      <div style="padding: 24px;">
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0;">
          ${opts.message}
        </p>
      </div>

      <!-- CTA -->
      <div style="padding: 0 24px 24px; text-align: center;">
        <a href="${opts.actionUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          ${opts.actionLabel}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px; color: #475569; font-size: 12px;">
      <p style="margin: 0;">Sent by ${APP_NAME}</p>
      <a href="${APP_URL}/settings/notifications" style="color: #64748b; text-decoration: underline;">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>`;
}
