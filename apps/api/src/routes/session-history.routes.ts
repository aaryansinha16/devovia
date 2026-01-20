import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { PrismaClient } from '@repo/database';

const router = Router();
const prisma = new PrismaClient();

// GET /api/sessions/:sessionId/history - Get version history for a session
router.get(
  '/:sessionId/history',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has access to this session
      const permission = await prisma.sessionPermission.findUnique({
        where: {
          sessionId_userId: { sessionId, userId },
        },
      });

      const session = await prisma.collaborativeSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.ownerId !== userId && !permission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get snapshots (versions)
      const snapshots = await prisma.sessionSnapshot.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          version: true,
          createdAt: true,
          createdBy: true,
          createdByName: true,
          note: true,
          size: true,
          isAutoSave: true,
        },
      });

      res.json({
        success: true,
        snapshots,
      });
    } catch (error: any) {
      console.error('Error fetching session history:', error);
      res.status(500).json({ error: 'Failed to fetch session history' });
    }
  },
);

// GET /api/sessions/:sessionId/history/:snapshotId - Get a specific snapshot
router.get(
  '/:sessionId/history/:snapshotId',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, snapshotId } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check access
      const permission = await prisma.sessionPermission.findUnique({
        where: {
          sessionId_userId: { sessionId, userId },
        },
      });

      const session = await prisma.collaborativeSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.ownerId !== userId && !permission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const snapshot = await prisma.sessionSnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot || snapshot.sessionId !== sessionId) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }

      res.json({
        success: true,
        snapshot,
      });
    } catch (error: any) {
      console.error('Error fetching snapshot:', error);
      res.status(500).json({ error: 'Failed to fetch snapshot' });
    }
  },
);

// POST /api/sessions/:sessionId/snapshot - Create a manual snapshot
router.post(
  '/:sessionId/snapshot',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { content, note } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has edit access
      const permission = await prisma.sessionPermission.findUnique({
        where: {
          sessionId_userId: { sessionId, userId },
        },
      });

      const session = await prisma.collaborativeSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const isOwner = session.ownerId === userId;
      const canEdit =
        isOwner ||
        permission?.role === 'EDITOR' ||
        permission?.role === 'OWNER';

      if (!canEdit) {
        return res
          .status(403)
          .json({ error: 'Edit access required to create snapshots' });
      }

      // Get user info for denormalization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true },
      });

      const snapshot = await prisma.sessionSnapshot.create({
        data: {
          sessionId,
          content,
          createdBy: userId,
          createdByName: user?.name || user?.username || 'Unknown',
          note,
          size: content?.length || 0,
          isAutoSave: false,
        },
      });

      res.json({
        success: true,
        snapshot,
      });
    } catch (error: any) {
      console.error('Error creating snapshot:', error);
      res.status(500).json({ error: 'Failed to create snapshot' });
    }
  },
);

// POST /api/sessions/:sessionId/restore/:snapshotId - Restore a snapshot
router.post(
  '/:sessionId/restore/:snapshotId',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, snapshotId } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has edit access
      const permission = await prisma.sessionPermission.findUnique({
        where: {
          sessionId_userId: { sessionId, userId },
        },
      });

      const session = await prisma.collaborativeSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const isOwner = session.ownerId === userId;
      const canEdit =
        isOwner ||
        permission?.role === 'EDITOR' ||
        permission?.role === 'OWNER';

      if (!canEdit) {
        return res
          .status(403)
          .json({ error: 'Edit access required to restore snapshots' });
      }

      const snapshot = await prisma.sessionSnapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot || snapshot.sessionId !== sessionId) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true },
      });

      // Create a new snapshot of current state before restoring (backup)
      await prisma.sessionSnapshot.create({
        data: {
          sessionId,
          content: session.content,
          createdBy: userId,
          createdByName: user?.name || user?.username || 'Unknown',
          note: `Auto-backup before restoring to version from ${snapshot.createdAt.toISOString()}`,
          size: session.content?.length || 0,
          isAutoSave: true,
        },
      });

      // Update session content with snapshot content
      await prisma.collaborativeSession.update({
        where: { id: sessionId },
        data: { content: snapshot.content },
      });

      res.json({
        success: true,
        message: 'Snapshot restored successfully',
        content: snapshot.content,
      });
    } catch (error: any) {
      console.error('Error restoring snapshot:', error);
      res.status(500).json({ error: 'Failed to restore snapshot' });
    }
  },
);

// GET /api/sessions/:sessionId/changes - Get change history for playback
router.get(
  '/:sessionId/changes',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { from, to, limit = '1000' } = req.query;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check access
      const permission = await prisma.sessionPermission.findUnique({
        where: {
          sessionId_userId: { sessionId, userId },
        },
      });

      const session = await prisma.collaborativeSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.ownerId !== userId && !permission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const whereClause: any = { sessionId };

      if (from) {
        whereClause.timestamp = {
          ...whereClause.timestamp,
          gte: new Date(from as string),
        };
      }
      if (to) {
        whereClause.timestamp = {
          ...whereClause.timestamp,
          lte: new Date(to as string),
        };
      }

      const changes = await prisma.sessionChange.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' },
        take: parseInt(limit as string),
      });

      res.json({
        success: true,
        changes,
        count: changes.length,
      });
    } catch (error: any) {
      console.error('Error fetching changes:', error);
      res.status(500).json({ error: 'Failed to fetch changes' });
    }
  },
);

// POST /api/sessions/:sessionId/changes - Record a change (called by WebSocket server or client)
router.post(
  '/:sessionId/changes',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { changeType, position, length, content, userName, userColor } =
        req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const change = await prisma.sessionChange.create({
        data: {
          sessionId,
          userId,
          userName,
          userColor,
          changeType,
          position,
          length,
          content,
        },
      });

      res.json({
        success: true,
        change,
      });
    } catch (error: any) {
      console.error('Error recording change:', error);
      res.status(500).json({ error: 'Failed to record change' });
    }
  },
);

// POST /api/sessions/:sessionId/changes/batch - Record multiple changes at once
router.post(
  '/:sessionId/changes/batch',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { changes, userName, userColor } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ error: 'No changes provided' });
      }

      // Limit batch size to prevent abuse
      const limitedChanges = changes.slice(0, 100);

      const createdChanges = await prisma.sessionChange.createMany({
        data: limitedChanges.map((change: any) => ({
          sessionId,
          userId,
          userName,
          userColor,
          changeType: change.changeType,
          position: change.position,
          length: change.length,
          content: change.content,
          timestamp: change.timestamp ? new Date(change.timestamp) : new Date(),
        })),
      });

      res.json({
        success: true,
        count: createdChanges.count,
      });
    } catch (error: any) {
      console.error('Error recording batch changes:', error);
      res.status(500).json({ error: 'Failed to record changes' });
    }
  },
);

// GET /api/sessions/:sessionId/diff/:snapshotId1/:snapshotId2 - Get diff between two snapshots
router.get(
  '/:sessionId/diff/:snapshotId1/:snapshotId2',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, snapshotId1, snapshotId2 } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check access
      const permission = await prisma.sessionPermission.findUnique({
        where: {
          sessionId_userId: { sessionId, userId },
        },
      });

      const session = await prisma.collaborativeSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.ownerId !== userId && !permission) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const [snapshot1, snapshot2] = await Promise.all([
        prisma.sessionSnapshot.findUnique({ where: { id: snapshotId1 } }),
        prisma.sessionSnapshot.findUnique({ where: { id: snapshotId2 } }),
      ]);

      if (!snapshot1 || !snapshot2) {
        return res
          .status(404)
          .json({ error: 'One or both snapshots not found' });
      }

      // Return both contents for client-side diff computation
      res.json({
        success: true,
        snapshot1: {
          id: snapshot1.id,
          content: snapshot1.content,
          createdAt: snapshot1.createdAt,
          createdByName: snapshot1.createdByName,
        },
        snapshot2: {
          id: snapshot2.id,
          content: snapshot2.content,
          createdAt: snapshot2.createdAt,
          createdByName: snapshot2.createdByName,
        },
      });
    } catch (error: any) {
      console.error('Error fetching diff:', error);
      res.status(500).json({ error: 'Failed to fetch diff' });
    }
  },
);

export default router;
