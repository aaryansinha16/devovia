import { Router } from 'express';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import { getAllUsers, updateUserRole, updateUserVerification } from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireAdmin);

// User management routes
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/verification', updateUserVerification);

export default router;
