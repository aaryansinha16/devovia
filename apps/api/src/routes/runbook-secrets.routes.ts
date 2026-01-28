/**
 * Runbook Secrets API Routes
 * Handles routing for secrets management
 */

import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  listSecrets,
  createSecret,
  updateSecret,
  deleteSecret,
  getSecretTypes,
} from '../controllers/runbook-secrets.controller';

const router = Router();

router.get('/types', authenticateJWT, getSecretTypes);
router.get('/', authenticateJWT, listSecrets);
router.post('/', authenticateJWT, createSecret);
router.put('/:id', authenticateJWT, updateSecret);
router.delete('/:id', authenticateJWT, deleteSecret);

export default router;
