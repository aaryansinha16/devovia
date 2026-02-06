import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getDashboardStats, getDashboardActivity } from '../controllers/dashboard.controller';

const router = Router();

/**
 * @route GET /api/dashboard/stats
 * @desc Get comprehensive dashboard statistics
 * @access Private
 */
router.get('/stats', authenticateJWT, getDashboardStats);

/**
 * @route GET /api/dashboard/activity
 * @desc Get recent activity timeline
 * @access Private
 */
router.get('/activity', authenticateJWT, getDashboardActivity);

export default router;
