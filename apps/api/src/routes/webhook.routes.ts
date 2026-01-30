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

const router = Router();

// ============================================================================
// GITHUB WEBHOOKS
// ============================================================================

/**
 * @route   POST /api/webhooks/github
 * @desc    Handle GitHub webhook events (push, deployment, deployment_status, etc.)
 * @access  Public (verified by signature)
 */
router.post('/github', handleGitHubWebhook);

// ============================================================================
// VERCEL WEBHOOKS
// ============================================================================

/**
 * @route   POST /api/webhooks/vercel
 * @desc    Handle Vercel deployment webhook events
 * @access  Public (verified by signature)
 */
router.post('/vercel', handleVercelWebhook);

// ============================================================================
// NETLIFY WEBHOOKS
// ============================================================================

/**
 * @route   POST /api/webhooks/netlify
 * @desc    Handle Netlify deployment webhook events
 * @access  Public (verified by signature)
 */
router.post('/netlify', handleNetlifyWebhook);

export default router;
