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
} from '../utils/response.util';

const prisma = new PrismaClient();

/**
 * Get all comments for a blog post
 */
export const getBlogComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const {
      search,
      status,
      visibility,
      techStack,
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
      postId,
    };

    // Filter by search query
    if (search) {
      where.OR = [
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json(notFoundError('Blog post not found'));
    }

    // Get comments with user info
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: {
          createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip: offset,
        take: limit,
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
      }),
      prisma.comment.count({
        where: { postId },
      }),
    ]);

    return res
      .status(200)
      .json(
        paginatedResponse(
          comments,
          buildPaginationMeta(page, limit, total),
          'Fetched blog comments',
        ),
      );
  } catch (error) {
    console.error('Error getting blog comments:', error);
    return res.status(500).json(internalServerError(error));
  }
};

/**
 * Add a comment to a blog post
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?.sub; // Use sub field from JWT token for user ID

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json(notFoundError('Blog post not found'));
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
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

    return res
      .status(201)
      .json(successResponse(comment, 'Comment created successfully'));
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json(internalServerError(error));
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.sub; // Use sub field from JWT token for user ID

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json(notFoundError('Comment not found'));
    }

    // Check if user is the comment author or an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (comment.userId !== userId && user?.role !== 'ADMIN') {
      return res
        .status(403)
        .json(permissionError('Not authorized to delete this comment'));
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res
      .status(200)
      .json(successResponse({}, 'Comment deleted successfully'));
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json(internalServerError(error));
  }
};
