import { Request, Response } from 'express';
// Import mock Prisma client instead of the real one
import { mockPrisma as prisma } from '../utils/mock-prisma';
import bcrypt from 'bcrypt';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.utils';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
        error:
          existingUser.email === email
            ? 'Email already in use'
            : 'Username already taken',
      });
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

    // Create session
    await createSession(user.id, tokens.refreshToken);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email }, // Allow login with username or email
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = await generateTokens(user.id);

    // Create session
    await createSession(user.id, tokens.refreshToken);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: {
        refreshToken,
      },
    });

    if (!session) {
      return res.status(401).json({ message: 'Session not found' });
    }

    // Generate new tokens
    const tokens = await generateTokens(payload.sub);

    // Update session with new refresh token
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return res.status(200).json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
        refreshToken,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
        isActive: false,
      },
    });

    return res
      .status(200)
      .json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all sessions for a user
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;

    // Get all active sessions
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
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
        lastUsedAt: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Sessions retrieved successfully',
      sessions,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to create a session
const createSession = async (userId: string, refreshToken: string) => {
  const userAgent = 'Unknown';
  const ipAddress = '0.0.0.0';

  return prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastUsedAt: new Date(),
    },
  });
};
