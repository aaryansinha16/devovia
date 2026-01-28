/**
 * Runbook Approvals API Routes
 * Handles routing for approval workflows in runbook executions
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  getPendingApprovals,
  getApprovalById,
  approveApproval,
  rejectApproval,
  getApprovalHistory,
} from '../controllers/runbook-approvals.controller';

const router = Router();

router.get('/pending', authenticateJWT, getPendingApprovals);
router.get('/history', authenticateJWT, getApprovalHistory);
router.get('/:id', authenticateJWT, getApprovalById);
router.post('/:id/approve', authenticateJWT, approveApproval);
router.post('/:id/reject', authenticateJWT, rejectApproval);

export default router;
