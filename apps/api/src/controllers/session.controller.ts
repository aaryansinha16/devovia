import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all active sessions for the current user
 */
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isValid: true,
      },
      orderBy: {
        lastActive: 'desc',
      },
      select: {
        id: true,
        device: true,
        ipAddress: true,
        userAgent: true,
        lastActive: true,
        createdAt: true,
      },
    });

    // Mark the current session
    const currentSessionToken = req.sessionToken;
    let currentSessionId = null;

    if (currentSessionToken) {
      const currentSession = await prisma.session.findUnique({
        where: { token: currentSessionToken },
        select: { id: true },
      });

      if (currentSession) {
        currentSessionId = currentSession.id;
      }
    }

    return res.status(200).json({
      sessions,
      currentSessionId,
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Revoke a specific session (forced logout)
 */
export const revokeSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if the session belongs to the user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, token: true },
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.userId !== userId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to revoke this session' });
    }

    // Revoke the session
    await prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });

    // If revoking current session, also clear the cookie
    const currentSessionToken = req.sessionToken;
    const isCurrentSession = session.token === currentSessionToken;

    return res.status(200).json({
      message: 'Session revoked successfully',
      isCurrentSession,
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Revoke all sessions except the current one
 */
export const revokeAllSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const currentSessionToken = req.sessionToken;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!currentSessionToken) {
      return res.status(400).json({ message: 'Current session not found' });
    }

    // Find current session
    const currentSession = await prisma.session.findUnique({
      where: { token: currentSessionToken },
      select: { id: true },
    });

    if (!currentSession) {
      return res.status(404).json({ message: 'Current session not found' });
    }

    // Revoke all other sessions
    await prisma.session.updateMany({
      where: {
        userId,
        id: { not: currentSession.id },
        isValid: true,
      },
      data: {
        isValid: false,
      },
    });

    return res
      .status(200)
      .json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
