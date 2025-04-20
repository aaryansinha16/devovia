/**
 * JWT Utilities
 *
 * This file contains functions for working with JWT tokens.
 */

// Import required modules
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma, { Role, toRole } from '../lib/prisma';

// Define the JWT payload interface
export interface JwtPayload {
  sub: string;
  role?: Role;
  isVerified?: boolean;
  iat: number;
  exp: number;
}

/**
 * Generate access and refresh tokens for a user
 * @param userId - The user ID to include in the token
 * @returns Object containing accessToken and refreshToken
 */
export const generateTokens = async (
  userId: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  // Get user role and verification status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isVerified: true },
  });

  // Type assertion to handle the string type for expiresIn
  const accessToken = jwt.sign(
    { 
      sub: userId,
      role: user?.role || Role.USER,
      isVerified: user?.isVerified || false
    },
    config.jwt.secret,
    // Using any to bypass the type checking for expiresIn
    // This is safe because we know the config values are correct
    { expiresIn: config.jwt.expiresIn } as any,
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    config.jwt.refreshSecret,
    // Using any to bypass the type checking for expiresIn
    { expiresIn: config.jwt.refreshExpiresIn } as any,
  );

  return { accessToken, refreshToken };
};

/**
 * Verify an access token
 * @param token - The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export const verifyAccessToken = async (
  token: string,
): Promise<JwtPayload | null> => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 * @param token - The JWT refresh token to verify
 * @returns The decoded payload or null if invalid
 */
export const verifyRefreshToken = async (
  token: string,
): Promise<JwtPayload | null> => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    return payload;
  } catch (error) {
    return null;
  }
};
