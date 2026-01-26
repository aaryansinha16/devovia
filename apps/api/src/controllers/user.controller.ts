import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { uploadAvatarToCloudinary } from '../utils/cloudinary.util';
import { cleanupTempFile } from '../middleware/multer.middleware';
import {
  internalServerError,
  notFoundError,
  permissionError,
  successResponse,
  validationError,
} from '../utils/response.util';

const prisma = new PrismaClient();

/**
 * Get the current user's profile
 */
export const getCurrentUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        githubUrl: true,
        twitterUrl: true,
        portfolioUrl: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(notFoundError('User not found'));
    }

    return res
      .status(200)
      .json(successResponse(user, 'User fetched successfully'));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json(internalServerError(error));
  }
};

/**
 * Get a user's public profile by username
 */
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        githubUrl: true,
        twitterUrl: true,
        portfolioUrl: true,
        isVerified: true,
        createdAt: true,
        // Include project count
        _count: {
          select: {
            projects: true,
          },
        },
        // Could include recent projects here if needed
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update the current user's profile
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, bio, githubUrl, twitterUrl, portfolioUrl } = req.body;

    // Validate the data
    if (name && (typeof name !== 'string' || name.length > 100)) {
      return res
        .status(400)
        .json(
          validationError(
            'Name must be a string with maximum length of 100 characters',
          ),
        );
    }

    if (bio && (typeof bio !== 'string' || bio.length > 500)) {
      return res
        .status(400)
        .json(
          validationError(
            'Bio must be a string with maximum length of 500 characters',
          ),
        );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        githubUrl: githubUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        githubUrl: true,
        twitterUrl: true,
        portfolioUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res
      .status(200)
      .json(successResponse(updatedUser, 'User updated successfully'));
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json(internalServerError(error));
  }
};

/**
 * Update the user's avatar
 * This function handles file uploads for user avatars using Cloudinary
 */
export const updateUserAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if file exists (multer adds the file to the request)
    if (!req.file) {
      return res.status(400).json(validationError('No image file uploaded'));
    }

    // Upload the file to Cloudinary
    try {
      // Get the temporary file path
      const filePath = req.file.path;

      // Upload to Cloudinary
      const uploadResult = await uploadAvatarToCloudinary(filePath, userId);

      // Clean up the temporary file
      cleanupTempFile(filePath);

      // Use the secure URL from Cloudinary
      const avatarUrl = uploadResult.secure_url;

      // Update user's avatar in the database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          avatar: avatarUrl,
          // Store the Cloudinary public ID for future reference (deleting old images, etc.)
          avatarPublicId: uploadResult.publicId,
        },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      });

      return res.status(200).json(
        successResponse(
          {
            user: {
              id: updatedUser.id,
              username: updatedUser.username,
              avatar: updatedUser.avatar,
            },
          },
          'Avatar updated successfully',
        ),
      );
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return res
        .status(500)
        .json(internalServerError('Failed to upload image to cloud storage'));
    }
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return res.status(500).json(internalServerError('Internal server error'));
  }
};

/**
 * Change the user's password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json(
          validationError('Current password and new password are required'),
        );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json(
          validationError('New password must be at least 8 characters long'),
        );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return res
        .status(404)
        .json(notFoundError('User not found or has no password set'));
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(permissionError('Current password is incorrect'));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return res
      .status(200)
      .json(successResponse({}, 'Password updated successfully'));
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json(internalServerError('Internal server error'));
  }
};

/**
 * Delete the user's account (soft delete or add security verification as needed)
 */
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json(
          validationError('Password confirmation required to delete account'),
        );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return res
        .status(404)
        .json(notFoundError('User not found or has no password set'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(permissionError('Password is incorrect'));
    }

    // Delete user's sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete user account
    await prisma.user.delete({
      where: { id: userId },
    });

    return res
      .status(200)
      .json(successResponse({}, 'Account deleted successfully'));
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json(internalServerError('Internal server error'));
  }
};
