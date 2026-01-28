import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  chatWithAI,
  explainCode,
  fixCode,
  optimizeCode,
  documentCode,
} from '../controllers/ai.controller';

const router = Router();

router.post('/chat', authenticateJWT, chatWithAI);
router.post('/explain', authenticateJWT, explainCode);
router.post('/fix', authenticateJWT, fixCode);
router.post('/optimize', authenticateJWT, optimizeCode);
router.post('/document', authenticateJWT, documentCode);

export default router;
