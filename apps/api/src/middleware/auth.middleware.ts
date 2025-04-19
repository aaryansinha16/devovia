import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { JwtPayload } from '../utils/jwt.utils';

// Extend Express Request interface to include user property
// Using module augmentation instead of namespace
declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}

// Middleware to authenticate JWT tokens
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = payload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
