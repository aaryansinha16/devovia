import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  internalServerError,
  notFoundError,
  paginatedResponse,
  permissionError,
  successResponse,
} from '../utils/response.util';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../utils/pagination.util';

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

    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Normalize pagination
    const { page, limit, offset } = normalizePagination({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      maxLimit: 50,
    });

    // Build the where clause based on query params
    const where: any = {
      userId,
      isValid: true,
    };

    // Filter by search query
    if (search) {
      where.OR = [{ id: { contains: search as string, mode: 'insensitive' } }];
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          lastActive: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        select: {
          id: true,
          device: true,
          ipAddress: true,
          userAgent: true,
          lastActive: true,
          createdAt: true,
        },
      }),
      prisma.session.count({}),
    ]);

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

    return res
      .status(200)
      .json(
        paginatedResponse(
          sessions,
          buildPaginationMeta(page, limit, total),
          'Fetched user sessions',
        ),
      );
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return res.status(500).json(internalServerError(error));
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
      return res.status(404).json(notFoundError('Session not found'));
    }

    if (session.userId !== userId) {
      return res
        .status(403)
        .json(permissionError('Unauthorized to revoke this session'));
    }

    // Revoke the session
    await prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });

    // If revoking current session, also clear the cookie
    const currentSessionToken = req.sessionToken;
    const isCurrentSession = session.token === currentSessionToken;

    return res.status(200).json(
      successResponse(
        {
          isCurrentSession,
        },
        'Session revoked successfully',
      ),
    );
  } catch (error) {
    console.error('Error revoking session:', error);
    return res.status(500).json(internalServerError(error));
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
      return res.status(400).json(notFoundError('Current session not found'));
    }

    // Find current session
    const currentSession = await prisma.session.findUnique({
      where: { token: currentSessionToken },
      select: { id: true },
    });

    if (!currentSession) {
      return res.status(404).json(notFoundError('Current session not found'));
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
      .json(successResponse({}, 'All other sessions revoked successfully'));
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    return res.status(500).json(internalServerError(error));
  }
};
