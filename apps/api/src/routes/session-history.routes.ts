import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getSessionHistory,
  getSnapshot,
  createSnapshot,
  restoreSnapshot,
  getSessionChanges,
  recordChange,
  recordBatchChanges,
  deleteSnapshot,
} from '../controllers/session-history.controller';

const router = Router();

router.get('/:sessionId/history', authenticateJWT, getSessionHistory);
router.get('/:sessionId/history/:snapshotId', authenticateJWT, getSnapshot);
router.post('/:sessionId/snapshot', authenticateJWT, createSnapshot);
router.post('/:sessionId/restore/:snapshotId', authenticateJWT, restoreSnapshot);
router.get('/:sessionId/changes', authenticateJWT, getSessionChanges);
router.post('/:sessionId/changes', authenticateJWT, recordChange);
router.post('/:sessionId/changes/batch', authenticateJWT, recordBatchChanges);
router.delete('/:sessionId/history/:snapshotId', authenticateJWT, deleteSnapshot);

export default router;
