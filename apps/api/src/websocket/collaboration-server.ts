import { Server as HocuspocusServer } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import * as Y from 'yjs'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

interface SessionData {
  sessionId: string
  userId: string
  userName: string
  userAvatar?: string
}

export class CollaborationServer {
  private server: HocuspocusServer
  
  constructor() {
    this.server = new HocuspocusServer({
      port: 4001,
      
      extensions: [
        new Logger()
      ],
      
      // Simplified authentication - skip for now during debugging
      async onAuthenticate(data) {
        // Return a mock user for debugging purposes
        return {
          user: {
            id: 'debug-user',
            name: 'Debug User',
            avatar: null
          }
        }
      },
      
      // Document Loading - Simplified for debugging
      async onLoadDocument(data) {
        const { documentName } = data
        console.log(`Loading document: ${documentName}`)
        
        // Return a new empty document for now
        const yDoc = new Y.Doc()
        return yDoc
      },
      
      // Document Persistence - Simplified for debugging
      async onStoreDocument(data) {
        const { documentName } = data
        console.log(`Document ${documentName} stored (debug mode - not persisted)`)
      },
      
      // Connection Management
      async onConnect(data) {
        const { documentName, context } = data
        console.log(`User ${context.user.name} connected to session ${documentName}`)
      },
      
      async onDisconnect(data) {
        const { documentName, context } = data
        console.log(`User ${context.user.name} disconnected from session ${documentName}`)
      },
      
      // Change Tracking
      async onChange(data) {
        const { documentName, document, context } = data
        
        // Auto-save every 30 seconds when there are changes
        clearTimeout((this as any).saveTimeout)
        ;(this as any).saveTimeout = setTimeout(async () => {
          try {
            const update = Y.encodeStateAsUpdate(document)
            const content = Buffer.from(update).toString('base64')
            
            await prisma.collaborativeSession.update({
              where: { id: documentName },
              data: {
                content,
                updatedAt: new Date()
              }
            })
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }, 30000)
      }
    })
  }
  
  async start() {
    console.log('🚀 Starting Hocuspocus collaboration server on port 4001...')
    return this.server.listen()
  }
  
  async stop() {
    console.log('🛑 Stopping collaboration server...')
    return this.server.destroy()
  }
}

export default CollaborationServer
