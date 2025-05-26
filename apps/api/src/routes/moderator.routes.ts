import { Router } from 'express';
import {
  authenticateJWT,
  requireModerator,
} from '../middleware/auth.middleware';
import {
  getContentForModeration,
  getReportedContent,
  getModerationLogs,
} from '../controllers/moderator.controller';

const router = Router();

// All moderator routes require authentication and moderator role
router.use(authenticateJWT);
router.use(requireModerator);

// Content moderation routes
router.get('/content', getContentForModeration);
router.get('/reports', getReportedContent);
router.get('/logs', getModerationLogs);

export default router;
