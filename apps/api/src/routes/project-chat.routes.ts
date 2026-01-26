import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getProjectMessages,
  sendProjectMessage,
  deleteProjectMessage,
} from '../controllers/project-chat.controller';

const router = Router();

// All routes require authentication
router.get('/:projectId/messages', requireAuth, getProjectMessages);
router.post('/:projectId/messages', requireAuth, sendProjectMessage);
router.delete(
  '/:projectId/messages/:messageId',
  requireAuth,
  deleteProjectMessage,
);

export default router;
