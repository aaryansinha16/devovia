import { Request, Response } from 'express';
import prisma, { Role, toRole } from '../lib/prisma';

/**
 * Get all users with their roles
 * This endpoint is for admin use only
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
      return res.status(400).json({ 
        message: 'Invalid role provided',
        validRoles: Object.values(Role)
      });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
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

    return res.status(200).json({ 
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
      return res.status(400).json({ message: 'isVerified must be a boolean' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
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

    return res.status(200).json({ 
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user verification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
