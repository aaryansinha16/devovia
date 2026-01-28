import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { executeSessionCode } from '../controllers/session-execution.controller';

const router = Router();

router.post('/sessions/:sessionId/execute', authenticateJWT, executeSessionCode);

export default router;
