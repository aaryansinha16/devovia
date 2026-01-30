/**
 * Standalone server for running API + WebSocket collaboration server
 * Used in development and production environments
 */
import { apiApp, connectToDatabase } from './server';
import SimpleYjsServer from './websocket/simple-yjs-server';
import { websocketLogsService } from './services/websocket-logs.service';

const PORT = process.env.PORT || 4000;
let yjsServer: SimpleYjsServer | null = null;

async function startServer() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    const dbConnected = await connectToDatabase();

    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but continuing startup...');
    } else {
      console.log('✅ Database connected successfully');
    }

    // Start simple Yjs server
    console.log('🚀 Starting Yjs collaboration server...');
    yjsServer = new SimpleYjsServer(4001);
    await yjsServer.start();

    // Start Express API server
    console.log('🚀 Starting Express API server...');
    const server = apiApp.listen(PORT, () => {
      console.log(`✅ Express server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket server running on http://localhost:4001`);
      
      // Initialize WebSocket logs service for real-time deployment logs
      console.log('🚀 Starting WebSocket logs service...');
      websocketLogsService.initialize(server);
      console.log('✅ WebSocket logs service initialized');
      
      console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
      console.log('🎉 Devovia API is ready!');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down servers...');

      server.close(() => {
        console.log('✅ Express server closed');
      });

      if (yjsServer) {
        await yjsServer.stop();
      }

      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
