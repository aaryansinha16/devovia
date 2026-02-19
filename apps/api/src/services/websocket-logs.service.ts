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
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
          }
        },
        credentials: true,
      },
      path: '/socket.io',
      transports: ['websocket'],
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

      // ── Auto-join user notification room ───────────────────────────
      if (socket.data.userId) {
        socket.join(`user:${socket.data.userId}`);
      }

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

      // ── Supercharged command progress rooms ──────────────────────────

      // Join command progress room (user-scoped, no extra auth needed since socket is already authed)
      socket.on('join-command', (commandId: string) => {
        socket.join(`command:${commandId}`);
        socket.emit('joined-command', { commandId });
      });

      // Leave command progress room
      socket.on('leave-command', (commandId: string) => {
        socket.leave(`command:${commandId}`);
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

  // ── Notifications ─────────────────────────────────────────────────────────

  /**
   * Emit a new notification to a specific user
   */
  emitNotification(userId: string, notification: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Emit updated unread notification count to a specific user
   */
  emitUnreadCount(userId: string, count: number) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification-count', { count });
  }

  // ── Supercharged Command Progress ────────────────────────────────────────

  /**
   * Emit a step progress update for a chained/multi-step command
   */
  emitCommandStepUpdate(commandId: string, stepData: {
    stepIndex: number;
    totalSteps: number;
    intent: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
  }) {
    if (!this.io) return;

    this.io.to(`command:${commandId}`).emit('command-step', {
      commandId,
      ...stepData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit overall command progress (percentage, status message)
   */
  emitCommandProgress(commandId: string, progress: {
    percent: number;
    message: string;
    status: 'running' | 'completed' | 'failed';
  }) {
    if (!this.io) return;

    this.io.to(`command:${commandId}`).emit('command-progress', {
      commandId,
      ...progress,
      timestamp: new Date().toISOString(),
    });
  }
}

export const websocketLogsService = new WebSocketLogsService();
