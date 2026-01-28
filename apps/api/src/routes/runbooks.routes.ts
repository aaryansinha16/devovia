/**
 * Runbooks API Routes
 * Handles routing for runbook CRUD operations and execution
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  listRunbooks,
  getRunbookById,
  createRunbook,
  updateRunbook,
  deleteRunbook,
  executeRunbook,
  listRunbookExecutions,
  getExecutionById,
  cancelExecution,
  streamExecutionLogs,
} from '../controllers/runbook.controller';

const router = Router();

// ============================================================================
// RUNBOOK CRUD OPERATIONS
// ============================================================================

router.get('/', authenticateJWT, listRunbooks);
router.get('/:id', authenticateJWT, getRunbookById);
router.post('/', authenticateJWT, createRunbook);
router.put('/:id', authenticateJWT, updateRunbook);
router.delete('/:id', authenticateJWT, deleteRunbook);

// ============================================================================
// RUNBOOK EXECUTION
// ============================================================================

router.post('/:id/execute', authenticateJWT, executeRunbook);
router.get('/:id/executions', authenticateJWT, listRunbookExecutions);
router.get('/executions/:id', authenticateJWT, getExecutionById);
router.post('/executions/:id/cancel', authenticateJWT, cancelExecution);
router.get('/executions/:id/logs/stream', streamExecutionLogs);

export default router;
