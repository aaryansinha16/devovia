import * as Y from 'yjs';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@repo/database';
import type { Server } from 'http';

interface DecodedToken {
  userId: string;
  email: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

export class SimpleYjsServer {
  private wss: WebSocketServer | null = null;
  private port: number;
  private jwtSecret: string;
  private prisma: PrismaClient;
  private docs: Map<string, Y.Doc> = new Map();

  constructor(port: number = 4001) {
    this.port = port;
    this.jwtSecret = process.env.JWT_SECRET || 'TEMP_HARDCODED_SECRET_12345';
    this.prisma = new PrismaClient();

    if (!process.env.JWT_SECRET) {
      console.warn(
        '⚠️  JWT_SECRET not found in environment variables, using fallback secret',
      );
    }
  }

  private verifyToken(token: string): DecodedToken | null {
    try {
      console.log('🔑 Verifying token...');
      console.log('Token length:', token.length);
      console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
      console.log('JWT Secret being used:', this.jwtSecret);

      // Try to decode without verification first to see the payload
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString(),
          );
          console.log(
            'Token payload (decoded without verification):',
            JSON.stringify(payload, null, 2),
          );
        } catch (e) {
          console.log('Could not decode token payload');
        }
      }

      const decoded = jwt.verify(token, this.jwtSecret) as DecodedToken;
      console.log('✅ Token verified successfully for user:', decoded.sub);
      return decoded;
    } catch (error: any) {
      console.error('JWT verification failed:', error.message);
      console.error('Error name:', error.name);
      console.error('Full token:', token);
      return null;
    }
  }

  private async loadDocument(roomId: string): Promise<Y.Doc> {
    let doc = this.docs.get(roomId);

    if (!doc) {
      doc = new Y.Doc();
      this.docs.set(roomId, doc);

      try {
        // Check if this is a project note room (format: project-note-{projectId})
        if (roomId.startsWith('project-note-')) {
          const projectId = roomId.replace('project-note-', '');
          const note = await this.prisma.projectNote.findUnique({
            where: { projectId },
          });

          if (note && note.yjsState) {
            Y.applyUpdate(doc, note.yjsState);
            console.log(`📄 Loaded project note for project: ${projectId}`);
          }
        }
        // Check if this is a project chat room (format: project-chat-{projectId})
        else if (roomId.startsWith('project-chat-')) {
          // Chat uses Yjs array for messages, no persistence needed here
          console.log(`💬 Project chat room initialized: ${roomId}`);
        }
        // Otherwise, load collaborative session
        else {
          const session = await this.prisma.collaborativeSession.findUnique({
            where: { id: roomId },
          });

          if (session?.content) {
            // Apply existing content as Yjs update
            const content = JSON.parse(session.content);
            if (content.ops) {
              // Handle existing content as delta ops
              const ytext = doc.getText('content');
              ytext.insert(0, content.ops.map((op: any) => op.insert).join(''));
            } else if (typeof content === 'string') {
              // Handle plain text content
              const ytext = doc.getText('content');
              ytext.insert(0, content);
            }
          }
        }

        // Set up auto-save on document changes
        doc.on('update', () => {
          this.saveDocumentDebounced(roomId, doc);
        });

        console.log(`Document loaded for room: ${roomId}`);
      } catch (error) {
        console.error('Error loading document:', error);
      }
    }

    return doc;
  }

  private saveTimeouts = new Map<string, NodeJS.Timeout>();

  private saveDocumentDebounced(roomId: string, doc: Y.Doc) {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(roomId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for debounced save
    const timeout = setTimeout(() => {
      this.saveDocument(roomId, doc);
      this.saveTimeouts.delete(roomId);
    }, 2000); // Save after 2 seconds of inactivity

    this.saveTimeouts.set(roomId, timeout);
  }

  private async saveDocument(roomId: string, doc: Y.Doc): Promise<void> {
    try {
      // Save project note
      if (roomId.startsWith('project-note-')) {
        const projectId = roomId.replace('project-note-', '');
        const state = Y.encodeStateAsUpdate(doc);
        await this.prisma.projectNote.upsert({
          where: { projectId },
          update: {
            yjsState: Buffer.from(state),
          },
          create: {
            projectId,
            yjsState: Buffer.from(state),
          },
        });
        console.log(`💾 Saved project note for project: ${projectId}`);
      }
      // Skip saving for chat rooms (messages are saved via API)
      else if (roomId.startsWith('project-chat-')) {
        // Chat messages are persisted via the API, not Yjs state
        return;
      }
      // Save collaborative session (old format)
      else {
        const ytext = doc.getText('content');
        const content = ytext.toString();

        await this.prisma.collaborativeSession.update({
          where: { id: roomId },
          data: {
            content: JSON.stringify(content),
            updatedAt: new Date(),
          },
        });
        console.log(`💾 Saved document for session: ${roomId}`);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  }

  async start(httpServer?: Server) {
    console.log(`🚀 Starting Yjs WebSocket server on port ${this.port}...`);

    // If an HTTP server is provided, attach to it; otherwise create standalone server
    if (httpServer) {
      this.wss = new WebSocketServer({ server: httpServer });
      console.log('✅ WebSocket server attached to HTTP server');
    } else {
      this.wss = new WebSocketServer({ port: this.port });
      console.log(`✅ WebSocket server listening on port ${this.port}`);
    }

    this.wss.on('connection', async (ws, request) => {
      console.log('New WebSocket connection established');
      console.log('Request URL:', request.url);

      // Parse the URL - y-websocket sends URL like: /?token=xxx/roomName
      // or sometimes: /roomName?token=xxx
      const url = new URL(request.url || '/', 'ws://localhost');
      let roomName = url.pathname.slice(1) || 'default';
      let token = url.searchParams.get('token');

      // If token contains '/', the room name is appended to it
      if (token && token.includes('/')) {
        const parts = token.split('/');
        token = parts[0];
        roomName = parts[1] || roomName;
      }

      console.log('Extracted room name:', roomName);
      console.log('Token (first 20 chars):', token?.substring(0, 20) + '...');

      // Verify JWT token
      if (!token) {
        console.log('No token provided, closing connection');
        ws.close(1008, 'Token required');
        return;
      }

      const decoded = this.verifyToken(token);
      if (!decoded) {
        console.log('Invalid token, closing connection');
        ws.close(1008, 'Invalid token');
        return;
      }

      console.log(
        `Authenticated user ${decoded.email} joined room: ${roomName}`,
      );

      try {
        // Load or create document for this session
        const doc = await this.loadDocument(roomName);

        // Use y-websocket's built-in connection setup with loaded document
        setupWSConnection(ws, request, {
          docName: roomName,
          gc: true, // Enable garbage collection
          document: doc,
        });
      } catch (error) {
        console.error('Error setting up connection:', error);
        ws.close(1011, 'Server error');
      }
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log(`✅ Yjs server listening on ws://localhost:${this.port}`);
  }

  async stop() {
    if (this.wss) {
      console.log('🛑 Stopping Yjs WebSocket server...');
      this.wss.close();
      this.wss = null;
      console.log('✅ Yjs WebSocket server stopped');
    }
  }
}

export default SimpleYjsServer;
