'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { MonacoBinding } from 'y-monaco'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAuth } from '../lib/auth-context'

interface CollaborativeEditorProps {
  sessionId: string
  language?: string
  theme?: string
  onSave?: (content: string) => void
  className?: string
}

// Define Monaco languages
const SUPPORTED_LANGUAGES = {
  javascript: 'javascript',
  typescript: 'typescript', 
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  html: 'html',
  css: 'css',
  json: 'json',
  markdown: 'markdown',
  plaintext: 'plaintext'
}

export function CollaborativeEditor({ 
  sessionId, 
  language = 'javascript',
  theme = 'vs-dark',
  onSave,
  className = ''
}: CollaborativeEditorProps) {
  const { token, user } = useAuth()
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const ydocRef = useRef<Y.Doc | null>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Array<{ id: string, name: string, color: string }>>([])

  useEffect(() => {
    let mounted = true

    const initializeEditor = async () => {
      if (!editorContainerRef.current || !token) {
        if (!token) {
          setConnectionError('Authentication required')
        }
        return
      }

      try {

        // Create Yjs document
        const ydoc = new Y.Doc()
        ydocRef.current = ydoc
        
        // Get text type for collaborative editing
        const ytext = ydoc.getText('monaco')

        // Create WebSocket provider with JWT token authentication
        const wsUrl = `ws://localhost:4001/${sessionId}?token=${encodeURIComponent(token)}`
        const provider = new WebsocketProvider(wsUrl, sessionId, ydoc)
        providerRef.current = provider

        // Handle connection events
        provider.on('status', ({ status }: { status: string }) => {
          if (!mounted) return
          
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

        // Handle awareness (user presence)
        provider.awareness.on('update', () => {
          if (!mounted) return
          
          const states = Array.from(provider.awareness.getStates().values())
          const users = states
            .filter(state => state.user)
            .map(state => ({
              id: state.user.id,
              name: state.user.name || 'Anonymous',
              color: state.user.color || '#007acc'
            }))
          
          setParticipants(users)
        })

        // Generate user color based on user ID
        const generateUserColor = (userId: string) => {
          const colors = [
            '#007acc', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce'
          ]
          let hash = 0
          for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash)
          }
          return colors[Math.abs(hash) % colors.length]
        }

        // Set local user info
        provider.awareness.setLocalStateField('user', {
          id: user?.id || 'anonymous',
          name: user?.name || 'Anonymous',
          color: generateUserColor(user?.id || 'anonymous'),
          email: user?.email || ''
        })

        // Create Monaco editor
        const editor = monaco.editor.create(editorContainerRef.current, {
          value: '', // Will be populated by Yjs
          language: SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES] || 'javascript',
          theme,
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          showFoldingControls: 'always'
        })
        
        editorRef.current = editor

        // Create Monaco-Yjs binding
        const binding = new MonacoBinding(ytext, editor.getModel()!, new Set([editor]), provider.awareness)
        bindingRef.current = binding

        // Add save functionality
        if (onSave) {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            const content = editor.getValue()
            onSave(content)
          })
        }

        // Wait for connection
        await provider.connect()

      } catch (error) {
        console.error('Failed to initialize collaborative editor:', error)
        if (mounted) {
          setConnectionError(error instanceof Error ? error.message : 'Failed to initialize editor')
        }
      }
    }

    initializeEditor()

    return () => {
      mounted = false
      
      // Cleanup
      if (bindingRef.current) {
        bindingRef.current.destroy()
      }
      
      if (providerRef.current) {
        providerRef.current.destroy()
      }
      
      if (editorRef.current) {
        editorRef.current.dispose()
      }
      
      if (ydocRef.current) {
        ydocRef.current.destroy()
      }
    }
  }, [sessionId, language, theme, onSave])

  const handleSave = () => {
    if (editorRef.current && onSave) {
      const content = editorRef.current.getValue()
      onSave(content)
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 text-sm">
        <div className="flex items-center gap-4">
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
        
        {/* Participants */}
        <div className="flex items-center gap-2">
          {participants.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-xs">
                {participants.length} user{participants.length !== 1 ? 's' : ''} online:
              </span>
              <div className="flex -space-x-1">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="relative w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-gray-900 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    style={{ 
                      backgroundColor: participant.color,
                      zIndex: participants.length - index 
                    }}
                    title={`${participant.name} (${participant.id.slice(0, 8)}...)`}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {participants.length === 0 && isConnected && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-xs">Only you online</span>
            </div>
          )}
          
          {onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              title="Save (Ctrl+S)"
            >
              Save
            </button>
          )}
        </div>
      </div>
      
      {/* Monaco Editor Container */}
      <div ref={editorContainerRef} className="flex-1" />
      
      {/* Loading/Error State */}
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
