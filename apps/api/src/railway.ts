/**
 * Railway deployment entry point
 * Starts a minimal HTTP server for healthcheck IMMEDIATELY,
 * then loads the main application in the background
 */

import * as http from 'http';

const PORT = Number(process.env.PORT) || 4000;

console.log('=== Railway Deployment Starting ===');
console.log(`Port: ${PORT}`);
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);

// Track application state
let mainAppLoaded = false;
let mainApp: any = null;

// Create a minimal HTTP server that ALWAYS responds to healthcheck
const server = http.createServer((req, res) => {
  const url = req.url || '';

  // Always respond to healthcheck - this is critical
  if (url === '/api/hc' || url === '/api/hc/') {
    console.log(`[${new Date().toISOString()}] Healthcheck request`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        appLoaded: mainAppLoaded,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Root endpoint for diagnostics
  if (url === '/' || url === '') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Devovia API - App loaded: ${mainAppLoaded}`);
    return;
  }

  // Forward all other requests to main app if loaded
  if (mainAppLoaded && mainApp) {
    mainApp(req, res);
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Application still loading',
        status: 'starting',
      }),
    );
  }
});

// Start the HTTP server IMMEDIATELY
server.listen(PORT, () => {
  console.log(`✅ HTTP server listening on port ${PORT}`);
  console.log(`✅ Healthcheck available at http://localhost:${PORT}/api/hc`);

  // Now load the main application in the background
  loadMainApplication();
});

// Load main application asynchronously
async function loadMainApplication() {
  console.log('Loading main application...');

  try {
    // Small delay to ensure server is fully ready
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Import the main Express app
    console.log('Importing server module...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { apiApp, connectToDatabase } = require('./server');

    mainApp = apiApp;
    mainAppLoaded = true;
    console.log('✅ Main application loaded successfully');

    // Connect to database
    console.log('Connecting to database...');
    const connected = await connectToDatabase();
    console.log(`Database connection: ${connected ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    console.error('❌ Failed to load main application:', error);
    // Server keeps running for healthcheck even if app fails to load
  }
}

// Handle errors gracefully - never crash
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception (server still running):', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (server still running):', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;
