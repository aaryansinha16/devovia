import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../utils/pagination.util';
import {
  internalServerError,
  notFoundError,
  paginatedResponse,
  permissionError,
  successResponse,
  validationError,
} from '../utils/response.util';

const prisma = new PrismaClient();

// Type for authenticated request
export type AuthRequest = Request & {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

// Create a new snippet
export const createSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, code, language, tags, isPublic } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!title || !code || !language) {
      return res
        .status(400)
        .json(validationError('Title, code, and language are required'));
    }

    const snippet = await prisma.snippet.create({
      data: {
        title,
        description: description || null,
        code,
        language,
        tags: tags || [],
        isPublic: isPublic || false,
        userId,
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

    res
      .status(201)
      .json(successResponse(snippet, 'Snippet created successfully'));
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json(internalServerError('Failed to create snippet'));
  }
};

// Get all snippets for the authenticated user with filters
export const getSnippets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // const pageNum = parseInt(page as string);
    // const limitNum = parseInt(limit as string);
    // const skip = (pageNum - 1) * limitNum;
    const {
      search,
      language,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Normalize pagination
    const { page, limit, offset } = normalizePagination({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      maxLimit: 50,
    });

    // Build the where clause based on query params
    const where: any = {
      userId,
    };

    // Filter by search query
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { language: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (language && language !== 'all') {
      where.language = language;
    }

    if (tag && tag !== 'all') {
      where.tags = {
        has: tag as string,
      };
    }

    const [snippets, total] = await Promise.all([
      prisma.snippet.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.snippet.count({ where: { userId } }),
    ]);

    res.json(
      paginatedResponse(
        snippets,
        buildPaginationMeta(page, limit, total),
        'Fetched snippets',
      ),
    );
  } catch (error) {
    console.error('Error fetching snippets:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Get a single snippet by ID
export const getSnippetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id },
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

    if (!snippet) {
      return res.status(404).json(notFoundError('Snippet not found'));
    }

    // Check if user owns the snippet or if it's public
    if (snippet.userId !== userId && !snippet.isPublic) {
      return res.status(403).json(permissionError('Access denied'));
    }

    res.json(successResponse(snippet, 'Snippet fetched successfully'));
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Get a public snippet (no auth required)
export const getPublicSnippet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const snippet = await prisma.snippet.findUnique({
      where: { id },
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

    if (!snippet) {
      return res.status(404).json(notFoundError('Snippet not found'));
    }

    if (!snippet.isPublic) {
      return res.status(403).json(permissionError('This snippet is private'));
    }

    res.json(successResponse(snippet, 'Snippet fetched successfully'));
  } catch (error) {
    console.error('Error fetching public snippet:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Update a snippet
export const updateSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, code, language, tags, isPublic } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if snippet exists and user owns it
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      return res.status(404).json(notFoundError('Snippet not found'));
    }

    if (existingSnippet.userId !== userId) {
      return res.status(403).json(permissionError('Access denied'));
    }

    const snippet = await prisma.snippet.update({
      where: { id },
      data: {
        title: title || existingSnippet.title,
        description:
          description !== undefined ? description : existingSnippet.description,
        code: code || existingSnippet.code,
        language: language || existingSnippet.language,
        tags: tags !== undefined ? tags : existingSnippet.tags,
        isPublic: isPublic !== undefined ? isPublic : existingSnippet.isPublic,
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

    res.json(successResponse(snippet, 'Snippet updated successfully'));
  } catch (error) {
    console.error('Error updating snippet:', error);
    res.status(500).json(internalServerError(error));
  }
};

// Delete a snippet
export const deleteSnippet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if snippet exists and user owns it
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      return res.status(404).json(notFoundError('Snippet not found'));
    }

    if (existingSnippet.userId !== userId) {
      return res.status(403).json(permissionError('Access denied'));
    }

    await prisma.snippet.delete({
      where: { id },
    });

    res.json(successResponse({}, 'Snippet deleted successfully'));
  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json(internalServerError(error));
  }
};
