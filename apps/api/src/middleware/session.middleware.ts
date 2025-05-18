import { Request, Response, NextFunction } from 'express';
import { verifyRefreshToken } from '../utils/jwt.utils';
import prisma from '../lib/prisma';

/**
 * Middleware to extract the session token from the request
 * Gets token from Authorization header or from cookies
 */
export const extractSessionToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let sessionToken = null;

    // First check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.split(' ')[1];
    }

    // If not found in header, check cookies
    if (!sessionToken && req.cookies && req.cookies.refreshToken) {
      sessionToken = req.cookies.refreshToken;
    }

    if (sessionToken) {
      // Verify that this is a valid refresh token
      try {
        const payload = await verifyRefreshToken(sessionToken);
        if (payload) {
          // Check if session is still valid in database
          const session = await prisma.session.findUnique({
            where: { token: sessionToken },
            select: { isValid: true, userId: true },
          });

          if (session && session.isValid) {
            // Attach the session token to the request
            req.sessionToken = sessionToken;

            // Update last active time for the session
            await prisma.session.update({
              where: { token: sessionToken },
              data: { lastActive: new Date() },
            });
          } else if (session && !session.isValid) {
            // Session has been forcibly invalidated (forced logout)
            // Clear the cookie
            res.clearCookie('refreshToken');

            // Set a header indicating forced logout
            res.set('X-Forced-Logout', 'true');

            // Do not set req.sessionToken, effectively making the session invalid
          }
        }
      } catch (error) {
        // Invalid token, just continue without setting the session
        console.error('Invalid session token:', error);
      }
    }

    next();
  } catch (error) {
    console.error('Error extracting session token:', error);
    next(); // Continue even if error occurs
  }
};

/**
 * Middleware to require a valid session
 * Must be used after the extractSessionToken middleware
 */
export const requireValidSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.sessionToken) {
    return res.status(401).json({
      message: 'Valid session required',
      code: 'INVALID_SESSION',
    });
  }

  next();
};
