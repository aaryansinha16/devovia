import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getSessions,
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);

// Protected routes
router.post('/logout', authenticateJWT, logout);
router.post('/logout-all', authenticateJWT, logoutAll);
router.get('/sessions', authenticateJWT, getSessions);
router.get('/me', authenticateJWT, (req, res) => {
  res.json(req.user);
});

export default router;
