import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './snippet.controller';
import {
  internalServerError,
  notFoundError,
  permissionError,
  successResponse,
  validationError,
} from '../utils/response.util';

// Get project messages
export const getProjectMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { limit = '50', before } = req.query;
    const userId = req.user?.sub;

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user has access (owner or member)
    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json(permissionError('Access denied'));
    }

    // Build query
    const whereClause: any = { projectId };
    if (before) {
      whereClause.createdAt = { lt: new Date(before as string) };
    }

    // Fetch messages
    const messages = await prisma.projectMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(successResponse(messages.reverse()));
  } catch (error) {
    console.error('Error fetching project messages:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Send project message
export const sendProjectMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(permissionError('Unauthorized'));
    }

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json(validationError('Message content is required'));
    }

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    // Check if user has access (owner or member)
    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json(permissionError('Access denied'));
    }

    // Create message
    const message = await prisma.projectMessage.create({
      data: {
        projectId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(successResponse(message, 'Message sent successfully'));
  } catch (error) {
    console.error('Error sending project message:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Delete project message
export const deleteProjectMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, messageId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(permissionError('Unauthorized'));
    }

    // Find message
    const message = await prisma.projectMessage.findUnique({
      where: { id: messageId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json(notFoundError('Message not found'));
    }

    if (message.projectId !== projectId) {
      return res
        .status(400)
        .json(notFoundError('Message does not belong to this project'));
    }

    // Check if user can delete (message author, project owner, or admin member)
    const isAuthor = message.userId === userId;
    const isOwner = message.project.userId === userId;
    const isAdmin = message.project.members.some(
      (m) => m.userId === userId && (m.role === 'ADMIN' || m.role === 'OWNER'),
    );

    if (!isAuthor && !isOwner && !isAdmin) {
      return res.status(403).json(permissionError('Access denied'));
    }

    // Delete message
    await prisma.projectMessage.delete({
      where: { id: messageId },
    });

    res.json(successResponse({}, 'Message deleted successfully'));
  } catch (error) {
    console.error('Error deleting project message:', error);
    res.status(500).json(internalServerError(error));
  }
};
