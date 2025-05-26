/**
 * Express server entry point for both standalone operation and serverless deployment
 */
import dotenv from 'dotenv';
import { apiApp, connectToDatabase, disconnectFromDatabase } from './server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

// Initialize database connection status
let isConnected = false;

// Handler for Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Connect to database if not already connected
  if (!isConnected) {
    isConnected = await connectToDatabase();
  }

  // Forward the request to our Express app
  return apiApp(req, res);
}

// Start the server when running directly (not in serverless environment)
if (require.main === module) {
  try {
    // Log basic environment info
    console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(
      `API Base URL: ${process.env.API_URL || `http://localhost:${PORT}/api`}`,
    );
    console.log(
      `Frontend Base URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`,
    );

    // Start the server first - important to handle healthchecks even if DB fails
    const server = apiApp.listen(PORT, async () => {
      console.log(`Server is running on http://localhost:${PORT}`);

      try {
        // Connect to the database - don't crash the app if this fails
        isConnected = await connectToDatabase();
      } catch (err) {
        console.error('Error during database connection:', err);
        // Continue running even if DB connection fails
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      if (isConnected) {
        await disconnectFromDatabase();
      }
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      // Don't exit - keep the server running for healthchecks
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit - keep the server running for healthchecks
    });
  } catch (error) {
    console.error('Server startup error:', error);
    // Still exit on catastrophic startup errors
    process.exit(1);
  }
}
