import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { JwtPayload } from '../utils/jwt.utils';
import prisma, { Role, toRole } from '../lib/prisma';

// Extend Express Request interface to include user property
// Using module augmentation instead of namespace
declare module 'express' {
  interface Request {
    user?: JwtPayload;
    userRole?: Role;
    sessionToken?: string; // Add session token to track current session
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

    // Fetch user role from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, isVerified: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user info and role to request
    req.user = payload;
    req.userRole = toRole(user.role as string);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check if user is verified
export const requireVerified = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { isVerified: true },
    });

    if (!user || !user.isVerified) {
      return res.status(403).json({
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Export the middleware as requireAuth for clearer naming in routes
export const requireAuth = authenticateJWT;

// Optional authentication - extracts user if token exists, but doesn't require it
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyAccessToken(token);

    if (payload) {
      // Fetch user role from database
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true, isVerified: true },
      });

      if (user) {
        // Attach user info and role to request
        req.user = payload;
        req.userRole = toRole(user.role as string);
      }
    }

    next();
  } catch (error) {
    // On error, just continue without user (don't block the request)
    next();
  }
};

// Middleware to check user role
export const requireRole = (roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { role: true },
      });

      if (!user || !roles.includes(toRole(user.role as string))) {
        return res.status(403).json({
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Middleware to require admin role
export const requireAdmin = requireRole([Role.ADMIN]);

// Middleware to require moderator or admin role
export const requireModerator = requireRole([Role.ADMIN, Role.MODERATOR]);
