import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { chatFileUpload } from '../middleware/multer.middleware';
import {
  getProjectMessages,
  sendProjectMessage,
  deleteProjectMessage,
  updateProjectMessage,
  uploadChatFile,
  searchProjectMessages,
} from '../controllers/project-chat.controller';

const router = Router();

// All routes require authentication
router.get('/:projectId/messages/search', requireAuth, searchProjectMessages);
router.get('/:projectId/messages', requireAuth, getProjectMessages);
router.post('/:projectId/messages', requireAuth, sendProjectMessage);
router.post(
  '/:projectId/upload',
  requireAuth,
  chatFileUpload.single('file'),
  uploadChatFile,
);
router.patch(
  '/:projectId/messages/:messageId',
  requireAuth,
  updateProjectMessage,
);
router.delete(
  '/:projectId/messages/:messageId',
  requireAuth,
  deleteProjectMessage,
);

export default router;
