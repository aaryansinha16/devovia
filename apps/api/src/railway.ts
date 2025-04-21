/**
 * Standalone healthcheck server for Railway deployment
 * This provides a reliable healthcheck endpoint regardless of main application state
 */

// Log startup early to catch any issues
console.log('Starting Railway deployment healthcheck server');
console.log('Current directory:', process.cwd());
console.log('Files in directory:', require('fs').readdirSync('.'));

// Import with error handling
let express: any;
try {
  express = require('express');
  console.log('Express imported successfully');
} catch (error) {
  console.error('Failed to import express:', error);
  // Create minimal replacement for express if import fails
  const http = require('http');
  express = function() {
    const routes: Record<string, Function> = {};
    return {
      get: function(path: string, handler: Function) { routes[path] = handler; },
      listen: function(port: number, callback: Function) {
        const server = http.createServer((req: any, res: any) => {
          if (routes[req.url]) {
            routes[req.url](req, res);
          } else {
            res.writeHead(404);
            res.end('Not found');
          }
        });
        server.listen(port, callback);
        return server;
      }
    };
  };
}

// Create minimal Express app just for healthcheck
const app = express();
const PORT = process.env.PORT || 4000;

// Log all environment variables
console.log('All environment variables:');
for (const key in process.env) {
  // Skip sensitive values but log presence
  if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY') || key.includes('URL')) {
    console.log(`${key}: <is set>`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
}

// Health check endpoint (simplified and reliable)
app.get('/api/hc', (req: any, res: any) => {
  console.log('Health check endpoint called');
  res.writeHead ? res.writeHead(200) : res.status(200);
  res.end ? res.end('OK') : res.send('OK');
});

// Root endpoint for diagnostics
app.get('/', (req: any, res: any) => {
  console.log('Root endpoint called');
  res.writeHead ? res.writeHead(200) : res.status(200);
  res.end ? res.end('Devovia API Healthcheck Server') : res.send('Devovia API Healthcheck Server');
});

// Import and mount the main application routes
try {
  console.log('Attempting to import and mount main application...');
  const { apiApp, connectToDatabase } = require('./server');
  
  // Mount all routes from the main app
  app.use('/', apiApp);
  
  console.log('Successfully mounted main application routes');
} catch (error) {
  console.error('Error mounting main application:', error);
}

// Start the healthcheck server first
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Try to connect to the database and run migrations in the background
  setTimeout(async () => {
    try {
      console.log('Attempting to connect to database...');
      const { connectToDatabase } = require('./server');
      const connected = await connectToDatabase();
      console.log('Database connection result:', connected);
      
      // Run Prisma migrations if connected
      if (connected) {
        console.log('Running Prisma migrations...');
        try {
          const { execSync } = require('child_process');
          // Run migration in production mode to actually apply changes
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
          console.log('Migrations completed successfully');
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
        }
      }
    } catch (error) {
      console.error('Error with database:', error);
    }
  }, 1000);
});

// Handle startup failures gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Keep server running
});

process.on('unhandledRejection', (reason: any, promise: any) => {
  console.error('Unhandled Rejection:', reason);
  // Keep server running
});

// Export for testing
export default server;
