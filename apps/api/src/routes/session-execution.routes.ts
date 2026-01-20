import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { executeCode } from '../services/code-execution.service';
import { prisma } from '@repo/database';

const router = Router();

router.post(
  '/sessions/:sessionId/execute',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { code, language } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!code || !language) {
        return res
          .status(400)
          .json({ error: 'Code and language are required' });
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
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if user is owner or has editor/viewer permission
      const hasAccess =
        session.ownerId === userId || session.permissions.length > 0;
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Execute the code
      const result = await executeCode(code, language);

      res.json(result);
    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({
        error: 'Code execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

export default router;
