/**
 * Runbook Secrets Controller
 * Handles business logic for secrets management
 */

import { Request, Response } from 'express';
import prisma, { SecretType, RunbookEnvironment } from '../lib/prisma';
import { SecretsService } from '../services/secrets.service';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError,
  validationError 
} from '../utils/response.util';

const secretsService = new SecretsService(prisma);

/**
 * List secrets (without values)
 */
export async function listSecrets(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { runbookId, environment } = req.query;

    const secrets = await secretsService.listSecrets({
      runbookId: runbookId as string,
      environment: environment as RunbookEnvironment,
    });

    res.json(successResponse(secrets));
  } catch (error: any) {
    console.error('Error listing secrets:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Create a new secret
 */
export async function createSecret(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { name, value, type, environment, runbookId, description } = req.body;

    if (!name || !value || !type) {
      return res
        .status(400)
        .json(validationError('Missing required fields: name, value, type'));
    }

    // Check if name is available
    const isAvailable = await secretsService.isNameAvailable(
      name,
      environment,
      runbookId
    );
    if (!isAvailable) {
      return res
        .status(400)
        .json(errorResponse({ code: 'ALREADY_EXISTS', message: 'Secret name already exists for this environment' }));
    }

    // Verify user has access to the runbook if specified
    if (runbookId) {
      const runbook = await prisma.runbook.findUnique({
        where: { id: runbookId },
        select: { ownerId: true },
      });

      if (!runbook || runbook.ownerId !== userId) {
        return res.status(403).json(permissionError('You do not have permission to access this runbook'));
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

    res.status(201).json(successResponse(secret, 'Secret created successfully'));
  } catch (error: any) {
    console.error('Error creating secret:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Update (rotate) a secret value
 */
export async function updateSecret(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json(validationError('New value is required'));
    }

    // Verify ownership
    const secret = await prisma.runbookSecret.findUnique({
      where: { id },
      select: { createdBy: true, runbookId: true },
    });

    if (!secret) {
      return res.status(404).json(notFoundError('Secret not found'));
    }

    if (secret.createdBy !== userId) {
      // Check if user owns the runbook
      if (secret.runbookId) {
        const runbook = await prisma.runbook.findUnique({
          where: { id: secret.runbookId },
          select: { ownerId: true },
        });
        if (!runbook || runbook.ownerId !== userId) {
          return res.status(403).json(permissionError('You do not have permission to modify this secret'));
        }
      } else {
        return res.status(403).json(permissionError('You do not have permission to modify this secret'));
      }
    }

    await secretsService.rotateSecret(id, value);

    res.json(successResponse(null, 'Secret rotated successfully'));
  } catch (error: any) {
    console.error('Error rotating secret:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Delete a secret
 */
export async function deleteSecret(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    const { id } = req.params;

    // Verify ownership
    const secret = await prisma.runbookSecret.findUnique({
      where: { id },
      select: { createdBy: true, runbookId: true },
    });

    if (!secret) {
      return res.status(404).json(notFoundError('Secret not found'));
    }

    if (secret.createdBy !== userId) {
      // Check if user owns the runbook
      if (secret.runbookId) {
        const runbook = await prisma.runbook.findUnique({
          where: { id: secret.runbookId },
          select: { ownerId: true },
        });
        if (!runbook || runbook.ownerId !== userId) {
          return res.status(403).json(permissionError('You do not have permission to modify this secret'));
        }
      } else {
        return res.status(403).json(permissionError('You do not have permission to modify this secret'));
      }
    }

    await secretsService.deleteSecret(id);

    res.json(successResponse(null, 'Secret deleted successfully'));
  } catch (error: any) {
    console.error('Error deleting secret:', error);
    res.status(500).json(internalServerError(error));
  }
}

/**
 * Get available secret types and environments
 */
export async function getSecretTypes(_req: Request, res: Response) {
  res.json(successResponse({
    types: Object.values(SecretType),
    environments: Object.values(RunbookEnvironment),
  }));
}
