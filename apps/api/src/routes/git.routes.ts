import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getGitStatus,
  getGitLog,
  createCommit,
  createBranch,
  checkoutBranch,
  getDiff,
  showCommit,
  revertToCommit,
  deleteBranch,
} from '../controllers/git.controller';

const router = Router();

router.get('/:sessionId/status', authenticateJWT, getGitStatus);
router.get('/:sessionId/log', authenticateJWT, getGitLog);
router.post('/:sessionId/commit', authenticateJWT, createCommit);
router.post('/:sessionId/branch', authenticateJWT, createBranch);
router.post('/:sessionId/checkout', authenticateJWT, checkoutBranch);
router.get('/:sessionId/diff', authenticateJWT, getDiff);
router.get('/:sessionId/show/:commitHash', authenticateJWT, showCommit);
router.post('/:sessionId/revert/:commitHash', authenticateJWT, revertToCommit);
router.delete('/:sessionId/branch/:branchName', authenticateJWT, deleteBranch);

export default router;
