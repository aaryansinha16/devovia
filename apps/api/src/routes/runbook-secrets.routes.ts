/**
 * Runbook Secrets API Routes
 * Handles CRUD operations for secrets management
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, SecretType, RunbookEnvironment } from '@repo/database';
import { authenticateJWT } from '../middleware/auth.middleware';
import { SecretsService } from '../services/secrets.service';

const router = Router();
const prisma = new PrismaClient();
const secretsService = new SecretsService(prisma);

/**
 * GET /api/runbooks/secrets
 * List secrets (without values)
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { runbookId, environment } = req.query;

    const secrets = await secretsService.listSecrets({
      runbookId: runbookId as string,
      environment: environment as RunbookEnvironment,
    });

    res.json(secrets);
  } catch (error: any) {
    console.error('Error listing secrets:', error);
    res.status(500).json({ error: 'Failed to list secrets' });
  }
});

/**
 * POST /api/runbooks/secrets
 * Create a new secret
 */
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, value, type, environment, runbookId, description } = req.body;

    if (!name || !value || !type) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: name, value, type' });
    }

    // Check if name is available
    const isAvailable = await secretsService.isNameAvailable(
      name,
      environment,
      runbookId,
    );
    if (!isAvailable) {
      return res
        .status(400)
        .json({ error: 'Secret name already exists for this environment' });
    }

    // Verify user has access to the runbook if specified
    if (runbookId) {
      const runbook = await prisma.runbook.findUnique({
        where: { id: runbookId },
        select: { ownerId: true },
      });

      if (!runbook || runbook.ownerId !== userId) {
        return res.status(403).json({ error: 'Access denied to this runbook' });
      }
    }

    const secret = await secretsService.createSecret({
      name,
      value,
      type: type as SecretType,
      environment: environment as RunbookEnvironment,
      runbookId,
      description,
      createdBy: userId,
    });

    res.status(201).json(secret);
  } catch (error: any) {
    console.error('Error creating secret:', error);
    res.status(500).json({ error: 'Failed to create secret' });
  }
});

/**
 * PUT /api/runbooks/secrets/:id
 * Update (rotate) a secret value
 */
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'New value is required' });
    }

    // Verify ownership
    const secret = await prisma.runbookSecret.findUnique({
      where: { id },
      select: { createdBy: true, runbookId: true },
    });

    if (!secret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    if (secret.createdBy !== userId) {
      // Check if user owns the runbook
      if (secret.runbookId) {
        const runbook = await prisma.runbook.findUnique({
          where: { id: secret.runbookId },
          select: { ownerId: true },
        });
        if (!runbook || runbook.ownerId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await secretsService.rotateSecret(id, value);

    res.json({ message: 'Secret rotated successfully' });
  } catch (error: any) {
    console.error('Error rotating secret:', error);
    res.status(500).json({ error: 'Failed to rotate secret' });
  }
});

/**
 * DELETE /api/runbooks/secrets/:id
 * Delete a secret
 */
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify ownership
    const secret = await prisma.runbookSecret.findUnique({
      where: { id },
      select: { createdBy: true, runbookId: true },
    });

    if (!secret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    if (secret.createdBy !== userId) {
      // Check if user owns the runbook
      if (secret.runbookId) {
        const runbook = await prisma.runbook.findUnique({
          where: { id: secret.runbookId },
          select: { ownerId: true },
        });
        if (!runbook || runbook.ownerId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await secretsService.deleteSecret(id);

    res.json({ message: 'Secret deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting secret:', error);
    res.status(500).json({ error: 'Failed to delete secret' });
  }
});

/**
 * GET /api/runbooks/secrets/types
 * Get available secret types
 */
router.get('/types', authenticateJWT, async (_req: Request, res: Response) => {
  res.json({
    types: Object.values(SecretType),
    environments: Object.values(RunbookEnvironment),
  });
});

export default router;
