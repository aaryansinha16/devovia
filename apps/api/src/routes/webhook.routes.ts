/**
 * Webhook Routes
 * Public endpoints for receiving webhooks from GitHub, GitLab, and deployment platforms
 */

import { Router } from 'express';
import {
  handleGitHubWebhook,
  handleVercelWebhook,
  handleNetlifyWebhook,
} from '../controllers/webhook.controller';
import { webhookRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// ============================================================================
// GITHUB WEBHOOKS
// ============================================================================

/**
 * @route   POST /api/webhooks/github/:connectionId
 * @desc    Handle GitHub webhook events with signature verification
 * @access  Public (verified by signature)
 */
router.post('/github/:connectionId', webhookRateLimiter, handleGitHubWebhook);

/**
 * @route   POST /api/webhooks/github
 * @desc    Handle GitHub webhook events without signature verification
 * @access  Public
 */
router.post('/github', webhookRateLimiter, handleGitHubWebhook);

// ============================================================================
// VERCEL WEBHOOKS
// ============================================================================

/**
 * @route   POST /api/webhooks/vercel
 * @desc    Handle Vercel deployment webhook events
 * @access  Public (verified by signature)
 */
router.post('/vercel', webhookRateLimiter, handleVercelWebhook);

// ============================================================================
// NETLIFY WEBHOOKS
// ============================================================================

/**
 * @route   POST /api/webhooks/netlify
 * @desc    Handle Netlify deployment webhook events
 * @access  Public (verified by signature)
 */
router.post('/netlify', webhookRateLimiter, handleNetlifyWebhook);

export default router;
