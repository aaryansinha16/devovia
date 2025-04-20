/**
 * Express server entry point for standalone operation
 */
import dotenv from 'dotenv';
import { apiApp, connectToDatabase, disconnectFromDatabase } from './server';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

// Start the server when running directly (not via Next.js)
if (require.main === module) {
  // Start the server
  const server = apiApp.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // Connect to the database
    await connectToDatabase();
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

// Export the Express app for use in other modules
export default apiApp;
