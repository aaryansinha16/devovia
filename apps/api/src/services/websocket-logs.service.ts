/**
 * WebSocket Logs Service
 * Handles real-time log streaming for deployments
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from '../lib/prisma';
import { verifyAccessToken } from '../utils/jwt.utils';

const db = prisma as any;

export class WebSocketLogsService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/socket.io',
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = await verifyAccessToken(token);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }

        // Attach user info to socket
        socket.data.userId = decoded.sub;
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);

      // Join deployment room
      socket.on('join-deployment', async (deploymentId: string) => {
        try {
          // Verify user has access to this deployment
          const deployment = await db.deployment.findFirst({
            where: {
              id: deploymentId,
              site: {
                connection: {
                  userId: socket.data.userId,
                },
              },
            },
          });

          if (!deployment) {
            socket.emit('error', { message: 'Deployment not found or access denied' });
            return;
          }

          // Join the room
          socket.join(`deployment:${deploymentId}`);
          socket.emit('joined-deployment', { deploymentId });
          console.log(`Client ${socket.id} joined deployment ${deploymentId}`);
        } catch (error) {
          console.error('Error joining deployment:', error);
          socket.emit('error', { message: 'Failed to join deployment' });
        }
      });

      // Leave deployment room
      socket.on('leave-deployment', (deploymentId: string) => {
        socket.leave(`deployment:${deploymentId}`);
        console.log(`Client ${socket.id} left deployment ${deploymentId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Emit a new log to all clients watching a deployment
   */
  emitLog(deploymentId: string, log: any) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`deployment:${deploymentId}`).emit('deployment-log', log);
  }

  /**
   * Emit deployment status update
   */
  emitStatusUpdate(deploymentId: string, status: string, metadata?: any) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`deployment:${deploymentId}`).emit('deployment-status', {
      deploymentId,
      status,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit deployment event
   */
  emitEvent(deploymentId: string, event: any) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`deployment:${deploymentId}`).emit('deployment-event', event);
  }

  /**
   * Get connected clients count for a deployment
   */
  getConnectedClients(deploymentId: string): number {
    if (!this.io) {
      return 0;
    }

    const room = this.io.sockets.adapter.rooms.get(`deployment:${deploymentId}`);
    return room ? room.size : 0;
  }
}

export const websocketLogsService = new WebSocketLogsService();
