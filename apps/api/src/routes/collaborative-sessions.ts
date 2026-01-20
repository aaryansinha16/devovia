import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';
import { JwtPayload } from '../utils/jwt.utils';
import { z } from 'zod';
import { generateInviteCode } from '../utils/invite-codes';

const router = Router();

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  language: z
    .enum([
      'TYPESCRIPT',
      'JAVASCRIPT',
      'PYTHON',
      'SQL',
      'JSON',
      'MARKDOWN',
      'HTML',
      'CSS',
      'YAML',
    ])
    .default('TYPESCRIPT'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PRIVATE'),
});

const updateSessionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  language: z
    .enum([
      'TYPESCRIPT',
      'JAVASCRIPT',
      'PYTHON',
      'SQL',
      'JSON',
      'MARKDOWN',
      'HTML',
      'CSS',
      'YAML',
    ])
    .optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
});

const updateRoleSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
});

const createSnapshotSchema = z.object({
  content: z.string().optional(),
  note: z.string().optional(),
});

// Helper function to check session access
async function checkSessionAccess(
  sessionId: string,
  userId: string,
  requiredRole?: 'OWNER' | 'EDITOR' | 'VIEWER',
) {
  const session = await prisma.collaborativeSession.findUnique({
    where: { id: sessionId },
    include: {
      permissions: {
        where: { userId },
        include: { user: true },
      },
    },
  });

  if (!session) return { hasAccess: false, session: null, userRole: null };

  // Check if user is owner
  if (session.ownerId === userId) {
    return { hasAccess: true, session, userRole: 'OWNER' };
  }

  // Check permissions
  const permission = session.permissions[0];
  if (!permission) {
    // Check if session is public
    if (session.visibility === 'PUBLIC') {
      return { hasAccess: true, session, userRole: 'VIEWER' };
    }
    return { hasAccess: false, session: null, userRole: null };
  }

  // Check role requirements
  if (requiredRole) {
    const roleHierarchy = { VIEWER: 0, EDITOR: 1, OWNER: 2 };
    const userRoleLevel = roleHierarchy[permission.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return { hasAccess: false, session, userRole: permission.role };
    }
  }

  return { hasAccess: true, session, userRole: permission.role };
}

// Helper function to check and release expired locks
async function cleanupExpiredLocks() {
  await prisma.collaborativeSession.updateMany({
    where: {
      lockedUntil: {
        lt: new Date(),
      },
    },
    data: {
      lockedBy: null,
      lockedUntil: null,
    },
  });
}

// GET /api/collaborative-sessions - Get user's sessions
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as JwtPayload).sub;

    const sessions = await prisma.collaborativeSession.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { permissions: { some: { userId } } },
          { visibility: 'PUBLIC' },
        ],
        isActive: true,
      },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
        snapshots: {
          select: { id: true, createdAt: true, note: true, size: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { permissions: true, snapshots: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/collaborative-sessions - Create new session
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { title, description, language, visibility } =
      createSessionSchema.parse(req.body);
    const userId = (req.user as JwtPayload).sub;

    const session = await prisma.collaborativeSession.create({
      data: {
        title,
        description,
        language,
        visibility,
        ownerId: userId,
        inviteCode: visibility !== 'PRIVATE' ? generateInviteCode() : null,
      },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
        snapshots: true,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/collaborative-sessions/:id - Get specific session
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;

    const { hasAccess, session } = await checkSessionAccess(sessionId, userId);

    if (!hasAccess || !session) {
      return res
        .status(404)
        .json({ error: 'Session not found or access denied' });
    }

    const fullSession = await prisma.collaborativeSession.findUnique({
      where: { id: sessionId },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        snapshots: {
          select: {
            id: true,
            createdAt: true,
            note: true,
            size: true,
            createdBy: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Update last active timestamp for user
    if (session.ownerId !== userId) {
      await prisma.sessionPermission.updateMany({
        where: { sessionId, userId },
        data: { lastActive: new Date() },
      });
    }

    res.json(fullSession);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// PUT /api/collaborative-sessions/:id - Update session
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;
    const updates = updateSessionSchema.parse(req.body);

    const { hasAccess, userRole } = await checkSessionAccess(
      sessionId,
      userId,
      'EDITOR',
    );

    if (!hasAccess) {
      return res
        .status(404)
        .json({ error: 'Session not found or access denied' });
    }

    // Only owner can update metadata, editors can update content
    const allowedUpdates: any = {};
    if (updates.content !== undefined) {
      allowedUpdates.content = updates.content;
    }

    if (userRole === 'OWNER') {
      if (updates.title) allowedUpdates.title = updates.title;
      if (updates.description !== undefined)
        allowedUpdates.description = updates.description;
      if (updates.language) allowedUpdates.language = updates.language;
      if (updates.visibility) allowedUpdates.visibility = updates.visibility;
    }

    const updatedSession = await prisma.collaborativeSession.update({
      where: { id: sessionId },
      data: allowedUpdates,
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    res.json(updatedSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/collaborative-sessions/:id - Delete session
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;

    const session = await prisma.collaborativeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.ownerId !== userId) {
      return res
        .status(404)
        .json({ error: 'Session not found or access denied' });
    }

    await prisma.collaborativeSession.delete({
      where: { id: sessionId },
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// POST /api/collaborative-sessions/:id/lock - Acquire edit lock
router.post('/:id/lock', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;

    const { hasAccess } = await checkSessionAccess(sessionId, userId, 'EDITOR');

    if (!hasAccess) {
      return res
        .status(404)
        .json({ error: 'Session not found or access denied' });
    }

    // Clean up expired locks first
    await cleanupExpiredLocks();

    // Try to acquire lock (5 minutes)
    const lockUntil = new Date(Date.now() + 5 * 60 * 1000);

    try {
      await prisma.collaborativeSession.update({
        where: {
          id: sessionId,
          OR: [
            { lockedBy: null },
            { lockedBy: userId }, // User can extend their own lock
            { lockedUntil: { lt: new Date() } }, // Expired lock
          ],
        },
        data: {
          lockedBy: userId,
          lockedUntil: lockUntil,
        },
      });

      res.json({ locked: true, lockedUntil: lockUntil });
    } catch (error) {
      // Lock is held by someone else
      res.json({
        locked: false,
        error: 'Session is currently locked by another user',
      });
    }
  } catch (error) {
    console.error('Error acquiring lock:', error);
    res.status(500).json({ error: 'Failed to acquire lock' });
  }
});

// POST /api/collaborative-sessions/:id/unlock - Release edit lock
router.post('/:id/unlock', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;

    const { hasAccess } = await checkSessionAccess(sessionId, userId);

    if (!hasAccess) {
      return res
        .status(404)
        .json({ error: 'Session not found or access denied' });
    }

    await prisma.collaborativeSession.updateMany({
      where: {
        id: sessionId,
        lockedBy: userId,
      },
      data: {
        lockedBy: null,
        lockedUntil: null,
      },
    });

    res.json({ message: 'Lock released successfully' });
  } catch (error) {
    console.error('Error releasing lock:', error);
    res.status(500).json({ error: 'Failed to release lock' });
  }
});

// POST /api/collaborative-sessions/:id/invite - Invite user to session
router.post('/:id/invite', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;
    const { email, role } = inviteUserSchema.parse(req.body);

    const { hasAccess, userRole } = await checkSessionAccess(sessionId, userId);

    if (!hasAccess || userRole !== 'OWNER') {
      return res
        .status(404)
        .json({ error: 'Session not found or insufficient permissions' });
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, username: true, avatar: true },
    });

    if (!invitedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already in session
    const existingPermission = await prisma.sessionPermission.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: invitedUser.id,
        },
      },
    });

    if (existingPermission) {
      return res.status(400).json({ error: 'User is already a participant' });
    }

    // Create permission
    const permission = await prisma.sessionPermission.create({
      data: {
        sessionId,
        userId: invitedUser.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    res.status(201).json(permission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// PUT /api/collaborative-sessions/:id/permissions/:userId - Update user role
router.put('/:id/permissions/:userId', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const targetUserId = req.params.userId;
    const requesterId = (req.user as JwtPayload).sub;
    const { role } = updateRoleSchema.parse(req.body);

    const { hasAccess, userRole } = await checkSessionAccess(
      sessionId,
      requesterId,
    );

    if (!hasAccess || userRole !== 'OWNER') {
      return res
        .status(404)
        .json({ error: 'Session not found or insufficient permissions' });
    }

    const updatedPermission = await prisma.sessionPermission.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    res.json(updatedPermission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// DELETE /api/collaborative-sessions/:id/permissions/:userId - Remove user from session
router.delete('/:id/permissions/:userId', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const targetUserId = req.params.userId;
    const requesterId = (req.user as JwtPayload).sub;

    const { hasAccess, userRole } = await checkSessionAccess(
      sessionId,
      requesterId,
    );

    if (!hasAccess || userRole !== 'OWNER') {
      return res
        .status(404)
        .json({ error: 'Session not found or insufficient permissions' });
    }

    await prisma.sessionPermission.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId: targetUserId,
        },
      },
    });

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// POST /api/collaborative-sessions/:id/invite-link - Generate invite link
router.post('/:id/invite-link', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;

    const { hasAccess, userRole } = await checkSessionAccess(sessionId, userId);

    if (!hasAccess || userRole !== 'OWNER') {
      return res
        .status(404)
        .json({ error: 'Session not found or insufficient permissions' });
    }

    // Generate or update invite code
    const inviteCode = generateInviteCode();

    await prisma.collaborativeSession.update({
      where: { id: sessionId },
      data: { inviteCode },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/sessions/join/${inviteCode}`;

    res.json({ inviteLink, inviteCode });
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ error: 'Failed to generate invite link' });
  }
});

// POST /api/collaborative-sessions/:id/snapshots - Create snapshot
router.post('/:id/snapshots', authenticateJWT, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = (req.user as JwtPayload).sub;
    const { content, note } = createSnapshotSchema.parse(req.body);

    const { hasAccess } = await checkSessionAccess(sessionId, userId, 'EDITOR');

    if (!hasAccess) {
      return res
        .status(404)
        .json({ error: 'Session not found or access denied' });
    }

    const snapshot = await prisma.sessionSnapshot.create({
      data: {
        sessionId,
        content,
        note,
        createdBy: userId,
        size: content ? Buffer.byteLength(content, 'utf8') : 0,
      },
    });

    res.status(201).json(snapshot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

// GET /api/session-snapshots/:id - Get specific snapshot
router.get('/snapshots/:id', authenticateJWT, async (req, res) => {
  try {
    const snapshotId = req.params.id;
    const userId = (req.user as JwtPayload).sub;

    const snapshot = await prisma.sessionSnapshot.findUnique({
      where: { id: snapshotId },
      include: { session: true },
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    const { hasAccess } = await checkSessionAccess(snapshot.sessionId, userId);

    if (!hasAccess) {
      return res.status(404).json({ error: 'Access denied' });
    }

    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

export default router;
