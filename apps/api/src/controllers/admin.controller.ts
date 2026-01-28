import { Request, Response } from 'express';
import prisma, { Role, toRole } from '../lib/prisma';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../utils/pagination.util';
import {
  internalServerError,
  notFoundError,
  paginatedResponse,
  successResponse,
  validationError,
} from '../utils/response.util';

/**
 * Get all users with their roles
 * This endpoint is for admin use only
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const {
      search,
      status,
      visibility,
      techStack,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Normalize pagination
    const { page, limit, offset } = normalizePagination({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      maxLimit: 50,
    });

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({}),
    ]);

    return res
      .status(200)
      .json(
        paginatedResponse(
          users,
          buildPaginationMeta(page, limit, total),
          'Users retrieved successfully',
        ),
      );
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json(internalServerError(error));
  }
};

/**
 * Update a user's role
 * This endpoint is for admin use only
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !Object.values(Role).includes(role as Role)) {
      return res.status(400).json(
        validationError('Invalid roles provided', {
          validRoles: Object.values(Role),
        }),
      );
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json(notFoundError('User not found'));
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: toRole(role) },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    return res
      .status(200)
      .json(successResponse(updatedUser, 'User role updated successfully'));
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json(internalServerError('Internal server error'));
  }
};

/**
 * Update a user's verification status
 * This endpoint is for admin use only
 */
export const updateUserVerification = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    // Validate isVerified
    if (typeof isVerified !== 'boolean') {
      return res
        .status(400)
        .json(validationError('isVerified must be a boolean'));
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json(notFoundError('User not found'));
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
      },
    });

    return res
      .status(200)
      .json(
        successResponse(
          updatedUser,
          `User ${isVerified ? 'verified' : 'unverified'} successfully`,
        ),
      );
  } catch (error) {
    console.error('Error updating user verification:', error);
    return res.status(500).json(internalServerError('Internal server error'));
  }
};
