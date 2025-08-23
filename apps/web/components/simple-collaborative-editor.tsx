'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAuth } from '../lib/auth-context'

interface SimpleCollaborativeEditorProps {
  sessionId: string
  className?: string
}

export function SimpleCollaborativeEditor({ 
  sessionId, 
  className = ''
}: SimpleCollaborativeEditorProps) {
  const { token } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const ydocRef = useRef<Y.Doc | null>(null)
  const ytextRef = useRef<Y.Text | null>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    let mounted = true

    const initializeEditor = async () => {
      if (!textareaRef.current || !token) {
        if (!token) {
          setConnectionError('Authentication required')
        }
        return
      }

      try {
        console.log('Initializing simple collaborative editor...')
        
        // Create Yjs document
        const ydoc = new Y.Doc()
        ydocRef.current = ydoc
        
        // Get text type for collaborative editing
        const ytext = ydoc.getText('content')
        ytextRef.current = ytext

        // Create WebSocket provider with JWT token
        console.log('Creating WebSocket provider...')
        const wsUrl = `ws://localhost:4001/${sessionId}?token=${encodeURIComponent(token)}`
        const provider = new WebsocketProvider(wsUrl, sessionId, ydoc)
        providerRef.current = provider

        // Handle connection events
        provider.on('status', ({ status }: { status: string }) => {
          if (!mounted) return
          console.log('Connection status:', status)
          
          setIsConnected(status === 'connected')
          if (status === 'connected') {
            setConnectionError(null)
            console.log('✅ Connected to collaboration server')
          } else if (status === 'disconnected') {
            console.log('❌ Disconnected from collaboration server')
          }
        })

        provider.on('connection-error', (error: Error) => {
          if (!mounted) return
          console.error('Connection error:', error)
          setConnectionError(error.message)
        })

        // Listen to Yjs text changes
        ytext.observe(() => {
          if (!mounted || !textareaRef.current) return
          const newContent = ytext.toString()
          setContent(newContent)
          if (textareaRef.current.value !== newContent) {
            textareaRef.current.value = newContent
          }
        })

        // Handle textarea input
        const handleInput = (e: Event) => {
          const textarea = e.target as HTMLTextAreaElement
          const value = textarea.value
          
          // Update Yjs document
          ytext.delete(0, ytext.length)
          ytext.insert(0, value)
        }

        textareaRef.current.addEventListener('input', handleInput)

        // Wait for connection
        console.log('Waiting for connection...')

      } catch (error) {
        console.error('Failed to initialize simple collaborative editor:', error)
        if (mounted) {
          setConnectionError(error instanceof Error ? error.message : 'Failed to initialize editor')
        }
      }
    }

    initializeEditor()

    return () => {
      mounted = false
      
      // Cleanup
      if (providerRef.current) {
        providerRef.current.destroy()
      }
      
      if (ydocRef.current) {
        ydocRef.current.destroy()
      }
    }
  }, [sessionId])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {connectionError && (
          <div className="text-red-400 text-xs">
            Error: {connectionError}
          </div>
        )}
      </div>
      
      {/* Simple Textarea Editor */}
      <textarea
        ref={textareaRef}
        className="flex-1 bg-gray-800 text-white p-4 resize-none outline-none font-mono"
        placeholder="Start typing to test collaborative editing..."
        defaultValue={content}
      />
      
      {/* Loading State */}
      {!isConnected && !connectionError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <div className="text-gray-300">Connecting to collaboration server...</div>
          </div>
        </div>
      )}
    </div>
  )
}
