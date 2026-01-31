/**
 * Require User Middleware
 * Ensures authenticated user exists on request
 */

import { Request, Response, NextFunction } from 'express';
import { unauthorizedError } from '../utils/response.util';

/**
 * Middleware to ensure user is authenticated
 * Must be used after authenticateJWT middleware
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.sub) {
    return res.status(401).json(unauthorizedError('Authentication required'));
  }
  next();
}

/**
 * Utility function to get user ID or fail with error response
 * Returns null if user is not authenticated (response already sent)
 */
export function getUserIdOrFail(req: Request, res: Response): string | null {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json(unauthorizedError('Authentication required'));
    return null;
  }
  return userId;
}
