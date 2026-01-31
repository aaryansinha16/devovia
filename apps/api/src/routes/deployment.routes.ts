/**
 * Deployment Routes
 * API routes for deployment-related operations
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { syncRateLimiter, aiRateLimiter } from '../middleware/rate-limit.middleware';
import {
  createConnectionSchema,
  updateConnectionSchema,
  createSiteSchema,
  updateSiteSchema,
  createDeploymentSchema,
  updateDeploymentSchema,
} from '../validators/deployment.validator';
import {
  // Connections
  listConnections,
  createConnection,
  getConnection,
  deleteConnection,
  // Sites
  listSites,
  createSite,
  getSite,
  updateSite,
  deleteSite,
  // Deployments
  listDeployments,
  getDeployment,
  createDeployment,
  updateDeployment,
  // Logs
  getDeploymentLogs,
  addDeploymentLog,
  // Rollback & Trigger
  rollbackDeployment,
  triggerDeployment,
  // Sessions
  createDeploymentSession,
  getDeploymentSession,
  // Runbooks
  getDeploymentRunbooks,
  linkRunbookToDeployment,
  executeDeploymentRunbook,
  unlinkRunbookFromDeployment,
  // AI Analysis
  analyzeDeploymentRisk,
  // Dashboard
  getDashboardStats,
  getDeploymentActivity,
} from '../controllers/deployment.controller';
import {
  syncVercelSites,
  syncVercelDeployments,
  syncDeploymentLogs,
} from '../controllers/sync-vercel.controller';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

/**
 * @route GET /api/deployments/dashboard/stats
 * @desc Get deployment dashboard statistics
 * @access Private
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @route GET /api/deployments/dashboard/activity
 * @desc Get deployment activity for charts
 * @access Private
 */
router.get('/dashboard/activity', getDeploymentActivity);

// ============================================================================
// PLATFORM CONNECTION ROUTES
// ============================================================================

/**
 * @route GET /api/deployments/connections
 * @desc List all platform connections
 * @access Private
 */
router.get('/connections', listConnections);

/**
 * @route POST /api/deployments/connections
 * @desc Create a new platform connection
 * @access Private
 */
router.post('/connections', validateRequest(createConnectionSchema), createConnection);

/**
 * @route GET /api/deployments/connections/:id
 * @desc Get a specific connection
 * @access Private
 */
router.get('/connections/:id', getConnection);

/**
 * @route DELETE /api/deployments/connections/:id
 * @desc Delete a platform connection
 * @access Private
 */
router.delete('/connections/:id', deleteConnection);

/**
 * @route POST /api/deployments/connections/:connectionId/sync-sites
 * @desc Sync sites from Vercel
 * @access Private
 */
router.post('/connections/:connectionId/sync-sites', syncRateLimiter, syncVercelSites);

// ============================================================================
// DEPLOYMENT SITE ROUTES
// ============================================================================

/**
 * @route GET /api/deployments/sites
 * @desc List all deployment sites
 * @access Private
 */
router.get('/sites', listSites);

/**
 * @route POST /api/deployments/sites
 * @desc Create a new deployment site
 * @access Private
 */
router.post('/sites', validateRequest(createSiteSchema), createSite);

/**
 * @route GET /api/deployments/sites/:id
 * @desc Get a specific site with details
 * @access Private
 */
router.get('/sites/:id', getSite);

/**
 * @route PUT /api/deployments/sites/:id
 * @desc Update a deployment site
 * @access Private
 */
router.put('/sites/:id', validateRequest(updateSiteSchema), updateSite);

/**
 * @route DELETE /api/deployments/sites/:id
 * @desc Delete a deployment site
 * @access Private
 */
router.delete('/sites/:id', deleteSite);

/**
 * @route POST /api/deployments/sites/:id/deploy
 * @desc Trigger a new deployment for a site
 * @access Private
 */
router.post('/sites/:id/deploy', triggerDeployment);

/**
 * @route POST /api/deployments/sites/:siteId/sync-deployments
 * @desc Sync deployments from Vercel for a site
 * @access Private
 */
router.post('/sites/:siteId/sync-deployments', syncRateLimiter, syncVercelDeployments);

// ============================================================================
// DEPLOYMENT ROUTES
// ============================================================================

/**
 * @route GET /api/deployments
 * @desc List all deployments with filtering
 * @access Private
 */
router.get('/', listDeployments);

/**
 * @route POST /api/deployments
 * @desc Create a new deployment record
 * @access Private
 */
router.post('/', validateRequest(createDeploymentSchema), createDeployment);

/**
 * @route GET /api/deployments/:id
 * @desc Get a specific deployment with full details
 * @access Private
 */
router.get('/:id', getDeployment);

/**
 * @route PUT /api/deployments/:id
 * @desc Update a deployment status
 * @access Private
 */
router.put('/:id', validateRequest(updateDeploymentSchema), updateDeployment);

/**
 * @route GET /api/deployments/:id/logs
 * @desc Get deployment logs
 * @access Private
 */
router.get('/:id/logs', getDeploymentLogs);

/**
 * @route POST /api/deployments/:id/logs
 * @desc Add a deployment log entry
 * @access Private
 */
router.post('/:id/logs', addDeploymentLog);

/**
 * @route POST /api/deployments/:id/sync-logs
 * @desc Sync logs from Vercel for a deployment
 * @access Private
 */
router.post('/:id/sync-logs', syncRateLimiter, syncDeploymentLogs);

/**
 * @route POST /api/deployments/:id/rollback
 * @desc Rollback to previous deployment
 * @access Private
 */
router.post('/:id/rollback', rollbackDeployment);

/**
 * @route POST /api/deployments/:id/session
 * @desc Create a collaborative session for a deployment
 * @access Private
 */
router.post('/:id/session', createDeploymentSession);

/**
 * @route GET /api/deployments/:id/session
 * @desc Get the collaborative session for a deployment
 * @access Private
 */
router.get('/:id/session', getDeploymentSession);

/**
 * @route GET /api/deployments/:id/runbooks
 * @desc Get runbooks linked to a deployment
 * @access Private
 */
router.get('/:id/runbooks', getDeploymentRunbooks);

/**
 * @route POST /api/deployments/:id/runbooks
 * @desc Link a runbook to a deployment
 * @access Private
 */
router.post('/:id/runbooks', linkRunbookToDeployment);

/**
 * @route POST /api/deployments/:id/runbooks/:runbookLinkId/execute
 * @desc Execute a deployment runbook
 * @access Private
 */
router.post('/:id/runbooks/:runbookLinkId/execute', executeDeploymentRunbook);

/**
 * @route DELETE /api/deployments/:id/runbooks/:runbookLinkId
 * @desc Remove a runbook from a deployment
 * @access Private
 */
router.delete('/:id/runbooks/:runbookLinkId', unlinkRunbookFromDeployment);

/**
 * @route POST /api/deployments/:id/analyze
 * @desc Analyze deployment for risk factors using AI
 * @access Private
 */
router.post('/:id/analyze', aiRateLimiter, analyzeDeploymentRisk);

export default router;
