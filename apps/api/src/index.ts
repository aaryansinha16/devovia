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
  // Start the server
  const server = apiApp.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // Connect to the database
    isConnected = await connectToDatabase();
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await disconnectFromDatabase();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}
