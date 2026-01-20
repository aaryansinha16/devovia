import * as Y from 'yjs';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@repo/database';

interface DecodedToken {
  userId: string;
  email: string;
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
    this.jwtSecret = 'TEMP_HARDCODED_SECRET_12345';
    this.prisma = new PrismaClient();
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
      console.log('✅ Token verified successfully for user:', decoded.email);
      return decoded;
    } catch (error: any) {
      console.error('JWT verification failed:', error.message);
      console.error('Error name:', error.name);
      console.error('Full token:', token);
      return null;
    }
  }

  private async loadDocument(sessionId: string): Promise<Y.Doc> {
    let doc = this.docs.get(sessionId);

    if (!doc) {
      doc = new Y.Doc();
      this.docs.set(sessionId, doc);

      try {
        // Load existing document from database
        const session = await this.prisma.collaborativeSession.findUnique({
          where: { id: sessionId },
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

        // Set up auto-save on document changes
        doc.on('update', () => {
          this.saveDocumentDebounced(sessionId, doc);
        });

        console.log(`Document loaded for session: ${sessionId}`);
      } catch (error) {
        console.error('Error loading document:', error);
      }
    }

    return doc;
  }

  private saveTimeouts = new Map<string, NodeJS.Timeout>();

  private saveDocumentDebounced(sessionId: string, doc: Y.Doc) {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(sessionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for debounced save
    const timeout = setTimeout(() => {
      this.saveDocument(sessionId, doc);
      this.saveTimeouts.delete(sessionId);
    }, 2000); // Save after 2 seconds of inactivity

    this.saveTimeouts.set(sessionId, timeout);
  }

  private async saveDocument(sessionId: string, doc: Y.Doc) {
    try {
      const ytext = doc.getText('content');
      const content = ytext.toString();

      await this.prisma.collaborativeSession.update({
        where: { id: sessionId },
        data: {
          content: JSON.stringify(content),
          updatedAt: new Date(),
        },
      });

      console.log(`Document saved for session: ${sessionId}`);
    } catch (error) {
      console.error('Error saving document:', error);
    }
  }

  async start() {
    console.log(`🚀 Starting Yjs WebSocket server on port ${this.port}...`);

    this.wss = new WebSocketServer({ port: this.port });

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
