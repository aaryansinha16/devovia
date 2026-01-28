/**
 * Session Execution Controller
 * Handles business logic for code execution in collaborative sessions
 */

import { Request, Response } from 'express';
import { executeCode } from '../services/code-execution.service';
import { prisma } from '@repo/database';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError,
  validationError 
} from '../utils/response.util';

/**
 * Execute code in a session
 */
export async function executeSessionCode(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { code, language } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    if (!code || !language) {
      return res
        .status(400)
        .json(validationError('Code and language are required'));
    }

    // Verify user has access to this session
    const session = await prisma.collaborativeSession.findUnique({
      where: { id: sessionId },
      include: {
        permissions: {
          where: { userId },
        },
      },
    });

    if (!session) {
      return res.status(404).json(notFoundError('Session not found'));
    }

    // Check if user is owner or has editor/viewer permission
    const hasAccess =
      session.ownerId === userId || session.permissions.length > 0;
    if (!hasAccess) {
      return res.status(403).json(permissionError('You do not have permission to access this session'));
    }

    // Execute the code
    const result = await executeCode(code, language);

    res.json(successResponse(result));
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json(internalServerError(error instanceof Error ? error.message : 'Unknown error'));
  }
}
