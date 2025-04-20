/**
 * Express server configuration for both standalone and Next.js API integration
 */
import express from 'express';
import dotenv from 'dotenv';
import { json, urlencoded } from 'express';
import session from 'express-session';
import { prisma } from '@repo/database';

// Import routes
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';

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

  // CORS middleware
  app.use((req, res, next) => {
    // Get the frontend URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.header('Access-Control-Allow-Origin', frontendUrl);
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
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', oauthRoutes);

  // Health check endpoint
  app.get('/api/hc', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
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
    return false;
  }
}

// Handle database disconnection
export async function disconnectFromDatabase() {
  await prisma.$disconnect();
  console.log('Database connection closed');
}
