import express from 'express';
import dotenv from 'dotenv';
import { json, urlencoded } from 'express';
import session from 'express-session';
// Import the real Prisma client from the database package
import { prisma } from '@repo/database';

// Import routes
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';

// Import Passport configuration
import passport from './config/passport.config';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Test database connection
  prisma
    .$connect()
    .then(() => {
      console.log('Database connection established');
    })
    .catch((error: Error) => {
      console.error('Failed to connect to database:', error);
    });
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Database connection closed');
  process.exit(0);
});

export default app;
