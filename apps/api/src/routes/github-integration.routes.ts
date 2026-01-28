import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  listGitHubRepos,
  createGitHubRepo,
  connectToGitHub,
  pushToGitHub,
  pullFromGitHub,
  getRemoteInfo,
  disconnectFromGitHub,
} from '../controllers/github-integration.controller';

const router = Router();

router.get('/repos', authenticateJWT, listGitHubRepos);
router.post('/repos/create', authenticateJWT, createGitHubRepo);
router.post('/:sessionId/connect', authenticateJWT, connectToGitHub);
router.post('/:sessionId/push', authenticateJWT, pushToGitHub);
router.post('/:sessionId/pull', authenticateJWT, pullFromGitHub);
router.get('/:sessionId/remote', authenticateJWT, getRemoteInfo);
router.delete('/:sessionId/remote', authenticateJWT, disconnectFromGitHub);

export default router;
