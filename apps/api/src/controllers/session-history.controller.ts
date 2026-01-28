/**
 * Session History Controller
 * Handles business logic for session version history and snapshots
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@repo/database';
import { 
  successResponse, 
  errorResponse, 
  notFoundError, 
  permissionError,
  internalServerError 
} from '../utils/response.util';

const prisma = new PrismaClient();

export async function getSessionHistory(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = await prisma.sessionPermission.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
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
}

export async function getSnapshot(req: Request, res: Response) {
  try {
    const { sessionId, snapshotId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = await prisma.sessionPermission.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
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
}

export async function createSnapshot(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { content, note } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = await prisma.sessionPermission.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
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
}

export async function restoreSnapshot(req: Request, res: Response) {
  try {
    const { sessionId, snapshotId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = await prisma.sessionPermission.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true },
    });

    // Create backup before restoring
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

    // Update session content
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
}

export async function getSessionChanges(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { from, to, limit = '1000' } = req.query;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permission = await prisma.sessionPermission.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
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
}

export async function recordChange(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { changeType, position, length, content, userName, userColor } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const change = await prisma.sessionChange.create({
      data: {
        sessionId,
        userId,
        userName: userName || 'Unknown',
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
}

export async function recordBatchChanges(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { changes, userName, userColor } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(errorResponse({ code: 'UNAUTHORIZED', message: 'Authentication required' }));
    }

    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json(errorResponse({ code: 'VALIDATION_ERROR', message: 'Changes array is required' }));
    }

    // Create all changes in batch
    const createdChanges = await prisma.sessionChange.createMany({
      data: changes.map((change: any) => ({
        sessionId,
        userId,
        userName: userName || 'Unknown',
        userColor: userColor || '#007acc',
        changeType: change.changeType,
        position: change.position,
        length: change.length,
        content: change.content,
      })),
    });

    res.json(successResponse({ count: createdChanges.count }, 'Changes recorded successfully'));
  } catch (error: any) {
    console.error('Error recording batch changes:', error);
    res.status(500).json(internalServerError(error));
  }
}

export async function deleteSnapshot(req: Request, res: Response) {
  try {
    const { sessionId, snapshotId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await prisma.collaborativeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the owner can delete snapshots' });
    }

    const snapshot = await prisma.sessionSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot || snapshot.sessionId !== sessionId) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    await prisma.sessionSnapshot.delete({
      where: { id: snapshotId },
    });

    res.json({
      success: true,
      message: 'Snapshot deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting snapshot:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
}
