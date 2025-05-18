import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getUserSessions,
  revokeSession,
  revokeAllSessions,
} from '../controllers/session.controller';

const router = express.Router();

// All session routes require authentication
router.use(requireAuth);

// Get all sessions for the current user
router.get('/', getUserSessions);

// Revoke a specific session
router.delete('/:sessionId', revokeSession);

// Revoke all sessions except the current one
router.delete('/', revokeAllSessions);

export default router;
