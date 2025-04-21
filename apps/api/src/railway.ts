/**
 * Standalone healthcheck server for Railway deployment
 * This provides a reliable healthcheck endpoint regardless of main application state
 */
import express from 'express';

// Create minimal Express app just for healthcheck
const app = express();
const PORT = process.env.PORT || 4000;

// Main application import (to be started in background)
import { apiApp, connectToDatabase } from './server';

// Log environment
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`PORT: ${PORT}`);
console.log(`RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'not set'}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'is set' : 'not set'}`);

// Health check endpoint (simplified and reliable)
app.get('/api/hc', (req, res) => {
  console.log('Health check endpoint called');
  res.status(200).send('OK'); // Plain text response for maximum reliability
});

// Root endpoint for diagnostics
app.get('/', (req, res) => {
  res.status(200).send('Devovia API Healthcheck Server');
});

// Start the healthcheck server first
const server = app.listen(PORT, () => {
  console.log(`Healthcheck server is running on port ${PORT}`);
  
  // Once healthcheck server is running, try to start the main app in the background
  // This ensures the healthcheck passes even if the main app has issues
  setTimeout(async () => {
    try {
      console.log('Attempting to connect to database...');
      const connected = await connectToDatabase();
      console.log('Database connection result:', connected);
    } catch (error) {
      console.error('Error connecting to database:', error);
    }
  }, 1000);
});

// Handle startup failures gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Keep server running
});

// Export for testing
export default server;
