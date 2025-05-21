import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { avatarUpload } from '../middleware/multer.middleware';
import {
  getCurrentUserProfile,
  getUserByUsername,
  updateUserProfile,
  updateUserAvatar,
  changePassword,
  deleteAccount,
} from '../controllers/user.controller';

const router = Router();

// Protected routes - require authentication
router.get('/profile', requireAuth, getCurrentUserProfile);
router.put('/profile', requireAuth, updateUserProfile);
router.patch(
  '/profile/avatar',
  requireAuth,
  avatarUpload.single('avatar'),
  updateUserAvatar,
);
router.post('/change-password', requireAuth, changePassword);
router.delete('/profile', requireAuth, deleteAccount);

// Public routes - must be after specific routes to prevent parameter catching
router.get('/:username', getUserByUsername);

export default router;
