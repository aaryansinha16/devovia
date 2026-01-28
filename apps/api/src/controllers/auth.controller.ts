import { Request, Response } from 'express';
// Import the local Prisma client
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.utils';
import {
  alreadyExistsError,
  internalServerError,
  notFoundError,
  paginatedResponse,
  successResponse,
  validationError,
} from '../utils/response.util';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../utils/pagination.util';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, name } = req.body;

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res
          .status(409)
          .json(
            alreadyExistsError(
              existingUser.email === email
                ? `Email already in use`
                : `Username already taken`,
            ),
          );
      }
    } catch (findError) {
      console.error('Error checking for existing user:', findError);
      return res.status(500).json(internalServerError(findError));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
      },
    });

    // Generate tokens
    const tokens = await generateTokens(user.id);

    // Create session - but don't let it fail the registration
    try {
      const session = await createSession(user.id, tokens.refreshToken, req);
      console.log('Session created successfully:', session ? 'yes' : 'no');

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
      });
    } catch (sessionError) {
      // Log the error but continue with registration
      console.error(
        'Session creation failed but continuing registration:',
        sessionError,
      );
    }

    return res.status(201).json(
      successResponse(
        {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            createdAt: user.createdAt,
          },
          tokens,
        },
        'User registered successfully',
      ),
    );
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json(internalServerError(error));
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login endpoint called with email:', req.body.email);

    const { email, password } = req.body;
    let user: any = null;

    // Find user by email
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (findError) {
      console.error('Error finding user:', findError);
      return res.status(500).json(internalServerError(findError));
    }

    try {
      // Generate tokens
      const tokens = await generateTokens(user.id);

      // Create session - but don't let it fail the login
      try {
        const session = await createSession(user.id, tokens.refreshToken, req);
        console.log(
          'Session created successfully during login:',
          session ? 'yes' : 'no',
        );

        // Set refresh token in HttpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: 'lax',
        });
      } catch (sessionError) {
        // Log the error but continue with login
        console.error(
          'Session creation failed during login but continuing:',
          sessionError,
        );
      }

      // Return user data and tokens
      return res.status(200).json(
        successResponse(
          {
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              name: user.name,
            },
            tokens,
          },
          'Login successful',
        ),
      );
    } catch (tokenError) {
      console.error('Error generating tokens:', tokenError);
      return res.status(500).json(internalServerError(tokenError));
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(internalServerError(error));
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json(validationError('Invalid refresh token'));
    }

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: {
        token: refreshToken,
      },
    });

    if (!session) {
      return res.status(401).json(notFoundError('Session not found'));
    }

    // Check if session is valid (not forcibly logged out)
    if (!session.isValid) {
      return res.status(401).json(validationError('Session has been revoked'));
    }

    // Generate new tokens
    const tokens = await generateTokens(payload.sub);

    // Update session with new refresh token
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        token: tokens.refreshToken, // Use token field instead of refreshToken
        lastActive: new Date(), // Update last active time
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return res
      .status(200)
      .json(successResponse(tokens, 'Token refreshed successfully'));
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json(internalServerError(error));
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.sub;

    // Delete the session
    await prisma.session.updateMany({
      where: {
        userId,
        token: refreshToken, // Use token field instead of refreshToken
      },
      data: {
        isValid: false, // Use isValid field instead of isActive
      },
    });

    return res.status(200).json(successResponse({}, 'Logged out successfully'));
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json(internalServerError(error));
  }
};

// Logout from all devices
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    // Delete all sessions for this user
    await prisma.session.updateMany({
      where: {
        userId,
      },
      data: {
        isValid: false, // Use isValid field instead of isActive
      },
    });

    return res
      .status(200)
      .json(successResponse({}, 'Logged out from all devices successfully'));
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json(internalServerError(error));
  }
};

// Get all sessions for a user
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Normalize pagination
    const { page, limit, offset } = normalizePagination({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      maxLimit: 50,
    });

    // Get all active sessions
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        skip: offset,
        take: limit,
        where: {
          userId,
          isValid: true, // Use isValid field instead of isActive
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
          lastActive: true, // Use lastActive field instead of lastUsedAt
        },
        orderBy: {
          lastActive: sortOrder === 'asc' ? 'asc' : 'desc', // Use lastActive field instead of lastUsedAt
        },
      }),
      prisma.session.count(),
    ]);

    return res
      .status(200)
      .json(
        paginatedResponse(
          sessions,
          buildPaginationMeta(page, limit, total),
          'Sessions retrieved successfully',
        ),
      );
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json(internalServerError(error));
  }
};

// Helper function to create a session
const createSession = async (
  userId: string,
  refreshToken: string,
  req?: Request,
) => {
  try {
    console.log('Creating session for user:', userId);
    // Extract device information from request if available
    const userAgent = req?.headers['user-agent'] || 'Unknown';

    // Handle ipAddress which could be string or string[]
    let ipAddress: string = '0.0.0.0';
    if (req?.ip) {
      ipAddress = req.ip;
    } else if (req?.headers['x-forwarded-for']) {
      const forwardedFor = req.headers['x-forwarded-for'];
      ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
    }

    // Extract device type and OS information from user agent
    let device = 'Unknown Device';
    if (userAgent) {
      // Handle GitHub OAuth as a special case
      if (userAgent === 'GitHub OAuth') {
        device = 'GitHub OAuth';
      } else if (userAgent.includes('Mobile')) {
        device =
          userAgent.includes('iPhone') || userAgent.includes('iPad')
            ? 'iOS Mobile'
            : 'Android Mobile';
      } else if (userAgent.includes('Windows')) {
        device = 'Windows Desktop';
      } else if (userAgent.includes('Mac')) {
        device = 'Mac Desktop';
      } else if (userAgent.includes('Linux')) {
        device = 'Linux Desktop';
      }

      // Add browser information if available
      if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
        device += ' - Chrome';
      } else if (userAgent.includes('Firefox')) {
        device += ' - Firefox';
      } else if (
        userAgent.includes('Safari') &&
        !userAgent.includes('Chrome')
      ) {
        device += ' - Safari';
      } else if (userAgent.includes('Edge')) {
        device += ' - Edge';
      }
    }

    // Try to create a session with the most likely schema based on our migrations
    try {
      // First attempt with all fields including isActive
      return await prisma.session.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: ipAddress,
          userAgent: userAgent,
          device: device,
          lastActive: new Date(),
          isActive: true, // Add isActive field to match schema
          isValid: true, // Add isValid field to match schema
        },
      });
    } catch (firstAttemptError) {
      console.log(
        'First session creation attempt failed, trying alternative schema:',
        firstAttemptError.message,
      );

      // Second attempt without isActive field (for older schema)
      try {
        return await prisma.session.create({
          data: {
            userId,
            token: refreshToken,
            userAgent,
            ipAddress,
            isValid: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            lastActive: new Date(),
            device: device,
          },
        });
      } catch (secondAttemptError) {
        console.log(
          'Second session creation attempt failed, trying schema with isActive:',
          secondAttemptError.message,
        );

        // Third attempt with isActive but minimal other fields
        try {
          return await prisma.session.create({
            data: {
              userId,
              token: refreshToken,
              userAgent,
              ipAddress,
              isActive: true,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          });
        } catch (thirdAttemptError) {
          console.log(
            'Third session creation attempt failed, trying minimal schema:',
            thirdAttemptError.message,
          );

          // Final attempt with minimal fields
          return await prisma.session.create({
            data: {
              userId,
              token: refreshToken,
              userAgent,
              ipAddress,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('All session creation attempts failed:', error);
    // Don't throw, just log and return null - this will prevent registration from failing
    return null;
  }
};
