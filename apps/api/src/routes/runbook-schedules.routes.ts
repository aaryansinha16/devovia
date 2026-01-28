/**
 * Runbook Schedules API Routes
 * Handles routing for runbook scheduling operations
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
  getFrequencies,
} from '../controllers/runbook-schedules.controller';

const router = Router();

router.get('/:runbookId/schedules', authenticateJWT, listSchedules);
router.post('/:runbookId/schedules', authenticateJWT, createSchedule);
router.put('/schedules/:id', authenticateJWT, updateSchedule);
router.delete('/schedules/:id', authenticateJWT, deleteSchedule);
router.post('/schedules/:id/pause', authenticateJWT, pauseSchedule);
router.post('/schedules/:id/resume', authenticateJWT, resumeSchedule);
router.get('/frequencies', authenticateJWT, getFrequencies);

export default router;
