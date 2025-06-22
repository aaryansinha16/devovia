import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Like a blog post
 */
export const likeBlogPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.sub; // JWT token stores userId in the sub field

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'You already liked this post' });
    }

    // Create like
    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return res.status(201).json({ 
      like,
      likeCount
    });
  } catch (error) {
    console.error('Error liking blog post:', error);
    return res.status(500).json({ error: 'Failed to like post' });
  }
};

/**
 * Unlike a blog post
 */
export const unlikeBlogPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.sub;

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if user has liked the post
    const like = await prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });

    if (!like) {
      return res.status(400).json({ error: 'You have not liked this post' });
    }

    // Delete the like
    await prisma.like.delete({
      where: { id: like.id },
    });

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return res.status(200).json({ 
      message: 'Post unliked successfully',
      likeCount 
    });
  } catch (error) {
    console.error('Error unliking blog post:', error);
    return res.status(500).json({ error: 'Failed to unlike post' });
  }
};

/**
 * Check if user has liked a blog post
 */
export const checkUserLike = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.sub;

    // Check if user has liked the post
    const like = await prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });

    // Get total like count for the post
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return res.status(200).json({
      isLiked: !!like,
      likeCount
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return res.status(500).json({ error: 'Failed to check like status' });
  }
};
