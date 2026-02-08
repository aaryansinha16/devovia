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
import { uploadToR2 } from '../utils/r2.util';
import { cleanupTempFile } from '../middleware/multer.middleware';

// Get project messages
// Supports: ?before=ISO (older), ?after=ISO (newer), ?around=ISO (centered on date), ?limit=N
export const getProjectMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { limit = '50', before, after, around } = req.query;
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

    const take = Math.min(parseInt(limit as string) || 50, 100);

    const userSelect = {
      select: { id: true, name: true, username: true, avatar: true },
    };

    // "around" mode: fetch messages centered around a date (for jump-to-date)
    if (around && typeof around === 'string') {
      const targetDate = new Date(around);
      const half = Math.ceil(take / 2);

      const [olderMessages, newerMessages] = await Promise.all([
        prisma.projectMessage.findMany({
          where: { projectId, createdAt: { lt: targetDate } },
          include: { user: userSelect },
          orderBy: { createdAt: 'desc' },
          take: half,
        }),
        prisma.projectMessage.findMany({
          where: { projectId, createdAt: { gte: targetDate } },
          include: { user: userSelect },
          orderBy: { createdAt: 'asc' },
          take: half,
        }),
      ]);

      const messages = [...olderMessages.reverse(), ...newerMessages];

      // Check if there are more messages in each direction
      const hasOlder = olderMessages.length === half;
      const hasNewer = newerMessages.length === half;

      return res.json(successResponse({ messages, hasOlder, hasNewer }));
    }

    // "after" mode: fetch newer messages (scroll down / load more recent)
    if (after && typeof after === 'string') {
      const messages = await prisma.projectMessage.findMany({
        where: { projectId, createdAt: { gt: new Date(after) } },
        include: { user: userSelect },
        orderBy: { createdAt: 'asc' },
        take,
      });

      const hasNewer = messages.length === take;
      return res.json(successResponse({ messages, hasOlder: true, hasNewer }));
    }

    // "before" mode: fetch older messages (scroll up)
    if (before && typeof before === 'string') {
      const messages = await prisma.projectMessage.findMany({
        where: { projectId, createdAt: { lt: new Date(before) } },
        include: { user: userSelect },
        orderBy: { createdAt: 'desc' },
        take,
      });

      const hasOlder = messages.length === take;
      return res.json(successResponse({ messages: messages.reverse(), hasOlder, hasNewer: true }));
    }

    // Default: fetch most recent messages
    const messages = await prisma.projectMessage.findMany({
      where: { projectId },
      include: { user: userSelect },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const hasOlder = messages.length === take;
    res.json(successResponse({ messages: messages.reverse(), hasOlder, hasNewer: false }));
  } catch (error) {
    console.error('Error fetching project messages:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Send project message (with optional attachment metadata)
export const sendProjectMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const {
      content,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      attachmentType,
      attachmentPublicId,
    } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(permissionError('Unauthorized'));
    }

    // Must have content or attachment
    if ((!content || !content.trim()) && !attachmentUrl) {
      return res
        .status(400)
        .json(validationError('Message content or attachment is required'));
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

    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json(permissionError('Access denied'));
    }

    // Create message with optional attachment
    const message = await prisma.projectMessage.create({
      data: {
        projectId,
        userId,
        content: content?.trim() || '',
        ...(attachmentUrl && {
          attachmentUrl,
          attachmentName,
          attachmentSize: attachmentSize ? parseInt(attachmentSize) : null,
          attachmentType,
          attachmentPublicId,
        }),
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

// Upload a file for chat attachment
export const uploadChatFile = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json(permissionError('Unauthorized'));
    }

    if (!req.file) {
      return res.status(400).json(validationError('No file uploaded'));
    }

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      cleanupTempFile(req.file.path);
      return res.status(404).json(notFoundError('Project not found'));
    }

    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      cleanupTempFile(req.file.path);
      return res.status(403).json(permissionError('Access denied'));
    }

    // Upload to Cloudflare R2
    const uploadResult = await uploadToR2(
      req.file.path,
      `chat-files/${projectId}`,
      req.file.originalname,
      req.file.mimetype,
    );

    // Clean up temp file
    cleanupTempFile(req.file.path);

    res.status(200).json(
      successResponse(
        {
          url: uploadResult.key,
          publicId: uploadResult.key,
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        },
        'File uploaded successfully',
      ),
    );
  } catch (error) {
    if (req.file) cleanupTempFile(req.file.path);
    console.error('Error uploading chat file:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Search project messages
export const searchProjectMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { q, limit = '20', before } = req.query;
    const userId = req.user?.sub;

    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json(validationError('Search query is required'));
    }

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json(notFoundError('Project not found'));
    }

    const isOwner = project.userId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json(permissionError('Access denied'));
    }

    const take = Math.min(parseInt(limit as string) || 20, 50);

    const whereClause: any = {
      projectId,
      content: { contains: q.trim(), mode: 'insensitive' },
    };

    if (before && typeof before === 'string') {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.projectMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const hasMore = messages.length === take;

    res.json(
      successResponse({
        messages: messages.reverse(),
        hasMore,
        total: await prisma.projectMessage.count({
          where: {
            projectId,
            content: { contains: q.trim(), mode: 'insensitive' },
          },
        }),
      }),
    );
  } catch (error) {
    console.error('Error searching project messages:', error);
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
