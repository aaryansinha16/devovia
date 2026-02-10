import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  superchargedRateLimit,
  superchargedSafetyFilter,
} from '../middleware/supercharged-rate-limit.middleware';
import {
  parseCommand,
  executeCommand,
  cancelCommand,
  undoExecutedCommand,
  getHistory,
  getTokenUsage,
  getMemories,
  saveMemory,
  deleteMemory,
  getOrchestrators,
  createOrchestrator,
  updateOrchestrator,
  deleteOrchestrator,
  getMacros,
  createMacro,
  updateMacro,
  deleteMacro,
  getCommandSuggestions,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getCodeReviewSummary,
} from '../controllers/supercharged.controller';

const router = Router();

// All routes require authentication
router.post('/parse', requireAuth, superchargedSafetyFilter, superchargedRateLimit, parseCommand);
router.post('/execute', requireAuth, executeCommand);
router.post('/undo', requireAuth, undoExecutedCommand);
router.post('/cancel', requireAuth, cancelCommand);
router.get('/history', requireAuth, getHistory);
router.get('/token-usage', requireAuth, getTokenUsage);
router.get('/memories', requireAuth, getMemories);
router.post('/memories', requireAuth, saveMemory);
router.delete('/memories', requireAuth, deleteMemory);
router.get('/orchestrators', requireAuth, getOrchestrators);
router.post('/orchestrators', requireAuth, createOrchestrator);
router.put('/orchestrators', requireAuth, updateOrchestrator);
router.delete('/orchestrators', requireAuth, deleteOrchestrator);
router.get('/macros', requireAuth, getMacros);
router.post('/macros', requireAuth, createMacro);
router.put('/macros', requireAuth, updateMacro);
router.delete('/macros', requireAuth, deleteMacro);
router.get('/suggestions', requireAuth, getCommandSuggestions);
router.get('/schedules', requireAuth, getSchedules);
router.post('/schedules', requireAuth, createSchedule);
router.put('/schedules', requireAuth, updateSchedule);
router.delete('/schedules', requireAuth, deleteSchedule);
router.get('/code-review', requireAuth, getCodeReviewSummary);

export default router;
