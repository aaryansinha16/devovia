import { Router } from 'express';
import { githubLogin, githubCallback, oauthSuccess } from '../controllers/oauth.controller';

const router = Router();

// GitHub OAuth routes
router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);

// OAuth success route (for API response)
router.get('/success', oauthSuccess);

export default router;
