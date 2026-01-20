/**
 * Express server configuration for both standalone and Next.js API integration
 */
import express from 'express';
import dotenv from 'dotenv';
import { json, urlencoded } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import prisma from './lib/prisma';
import { extractSessionToken } from './middleware/session.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import adminRoutes from './routes/admin.routes';
import moderatorRoutes from './routes/moderator.routes';
import sessionRoutes from './routes/session.routes';
import userRoutes from './routes/user.routes';
import blogRoutes from './routes/blog.routes';
import commentRoutes from './routes/comment.routes';
import collaborativeSessionRoutes from './routes/collaborative-sessions';
import seedRoutes from './routes/seed.routes';
import sessionExecutionRoutes from './routes/session-execution.routes';
import aiRoutes from './routes/ai.routes';
import sessionHistoryRoutes from './routes/session-history.routes';
import gitRoutes from './routes/git.routes';
import githubIntegrationRoutes from './routes/github-integration.routes';

// Import WebSocket collaboration server
import CollaborationServer from './websocket/collaboration-server';

// Import Passport configuration
import passport from './config/passport.config';

// Load environment variables
dotenv.config();

// Create and configure Express app
export function createExpressApp() {
  const app = express();

  // Middleware
  app.use(json());
  app.use(urlencoded({ extended: true }));

  // Cookie parser middleware (required for reading cookies)
  app.use(cookieParser());

  // CORS middleware
  app.use((req, res, next) => {
    // Get the frontend URLs from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const deployedUrl =
      process.env.DEPLOYED_FRONTEND_URL || 'https://devovia.vercel.app';

    // Get the origin from the request
    const origin = req.headers.origin;

    // Allow requests from both local and deployed frontends
    if (
      origin === frontendUrl ||
      origin === deployedUrl ||
      origin?.includes('vercel.app') ||
      origin?.includes('localhost') ||
      origin?.includes('devovia.com')
    ) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Session middleware (required for Passport)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'devovia-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Extract and validate session token
  app.use(extractSessionToken);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', oauthRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/moderator', moderatorRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/collaborative-sessions', collaborativeSessionRoutes);
  app.use('/api', sessionExecutionRoutes);
  app.use('/api/blogs', blogRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/seed', seedRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/sessions', sessionHistoryRoutes);
  app.use('/api/git', gitRoutes);
  app.use('/api/github', githubIntegrationRoutes);

  // Health check endpoint - must work regardless of database connection
  app.get('/api/hc', (req, res) => {
    // Always return 200 for Railway health checks
    console.log('Health check endpoint called');
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Devovia API Server',
      version: '1.0.0',
      status: 'running',
    });
  });

  return app;
}

// Export the Express app for use in Next.js API routes
export const apiApp = createExpressApp();

// Connect to the database
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connection established');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Log connection parameters (without sensitive info)
    console.log('DATABASE_URL env var exists:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
      console.log(
        'DATABASE_URL prefix:',
        process.env.DATABASE_URL.split('://')[0] + '://',
      );
    }
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Return false but don't throw error - allow app to start without DB
    return false;
  }
}

// Handle database disconnection
export async function disconnectFromDatabase() {
  await prisma.$disconnect();
  console.log('Database connection closed');
}

// Collaboration server instance
let collaborationServer: CollaborationServer | null = null;

// Start collaboration server
export async function startCollaborationServer() {
  if (!collaborationServer) {
    collaborationServer = new CollaborationServer();
    await collaborationServer.start();
    console.log('✅ Collaboration server started successfully');
  }
  return collaborationServer;
}

// Stop collaboration server
export async function stopCollaborationServer() {
  if (collaborationServer) {
    await collaborationServer.stop();
    collaborationServer = null;
    console.log('🛑 Collaboration server stopped');
  }
}
