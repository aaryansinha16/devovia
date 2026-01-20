'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { MonacoBinding } from 'y-monaco'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useAuth } from '../lib/auth-context'

interface CollaborativeEditorProps {
  sessionId: string
  language?: string
  theme?: string
  onSave?: (content: string) => void
  onContentChange?: (content: string) => void
  className?: string
}

// Map session languages to Monaco language IDs
const LANGUAGE_MAP: Record<string, string> = {
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
  sql: 'sql',
  yaml: 'yaml',
  plaintext: 'plaintext'
}

export function CollaborativeEditor({ 
  sessionId, 
  language = 'javascript',
  theme = 'vs-dark',
  onSave,
  onContentChange,
  className = ''
}: CollaborativeEditorProps) {
  const { token, user } = useAuth()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const ydocRef = useRef<Y.Doc | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>('')
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Array<{ id: string, name: string, color: string }>>([])
  const [isEditorReady, setIsEditorReady] = useState(false)

  // Get Monaco language ID
  const monacoLanguage = LANGUAGE_MAP[language.toLowerCase()] || 'javascript'

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up collaborative editor for session:', sessionId)
    
    if (bindingRef.current) {
      try {
        bindingRef.current.destroy()
      } catch (e) {
        // Ignore cleanup errors
      }
      bindingRef.current = null
    }
    
    if (providerRef.current) {
      try {
        providerRef.current.disconnect()
        providerRef.current.destroy()
      } catch (e) {
        // Ignore cleanup errors
      }
      providerRef.current = null
    }
    
    if (ydocRef.current) {
      try {
        ydocRef.current.destroy()
      } catch (e) {
        // Ignore cleanup errors
      }
      ydocRef.current = null
    }
    
    setIsConnected(false)
    setParticipants([])
  }, [sessionId])

  // Initialize Yjs collaboration when editor is ready
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !monacoRef.current || !token) {
      return
    }

    const editor = editorRef.current
    const monaco = monacoRef.current

    console.log('🔗 Initializing collaboration for session:', sessionId)
    console.log('🔗 Language:', monacoLanguage)

    // Create new Yjs document for this session
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    
    // Get text type for collaborative editing
    const ytext = ydoc.getText('monaco')

    // Create WebSocket provider with session-specific room
    const wsUrl = `ws://localhost:4001?token=${encodeURIComponent(token)}`
    const provider = new WebsocketProvider(wsUrl, sessionId, ydoc)
    providerRef.current = provider

    // Handle connection events
    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected')
      if (status === 'connected') {
        setConnectionError(null)
        console.log('✅ Connected to collaboration server for session:', sessionId)
      } else if (status === 'disconnected') {
        console.log('❌ Disconnected from collaboration server')
      }
    })

    provider.on('connection-error', (error: Error) => {
      console.error('Connection error:', error)
      setConnectionError(error.message)
    })

    // Handle awareness (user presence)
    provider.awareness.on('update', () => {
      const states = Array.from(provider.awareness.getStates().values())
      const users = states
        .filter((state: any) => state.user)
        .map((state: any) => ({
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

    // Create Monaco-Yjs binding with awareness for cursors and selections
    const model = editor.getModel()
    if (model) {
      const binding = new MonacoBinding(
        ytext, 
        model, 
        new Set([editor]), 
        provider.awareness
      )
      bindingRef.current = binding
      
      // Track local cursor position and broadcast via awareness
      const updateCursorPosition = () => {
        const selection = editor.getSelection()
        if (selection) {
          const anchorOffset = model.getOffsetAt({
            lineNumber: selection.startLineNumber,
            column: selection.startColumn
          })
          const headOffset = model.getOffsetAt({
            lineNumber: selection.endLineNumber,
            column: selection.endColumn
          })
          
          provider.awareness.setLocalStateField('cursor', {
            anchor: anchorOffset,
            head: headOffset
          })
        }
      }
      
      // Update cursor on selection change
      editor.onDidChangeCursorSelection(updateCursorPosition)
      editor.onDidChangeCursorPosition(updateCursorPosition)
      
      // Initial cursor update
      updateCursorPosition()
      
      // Add custom decorations for remote cursors with usernames
      const decorationsCollection = editor.createDecorationsCollection()
      
      const updateRemoteCursors = () => {
        const states = Array.from(provider.awareness.getStates().entries())
        const decorations: any[] = []
        
        states.forEach(([clientId, state]: [number, any]) => {
          // Skip local user
          if (clientId === provider.awareness.clientID) return
          
          const remoteUser = state.user
          if (!remoteUser) return
          
          const cursor = state.cursor
          const color = remoteUser.color || '#007acc'
          const name = remoteUser.name || 'Anonymous'
          
          // Add cursor decoration
          if (cursor && typeof cursor.head === 'number') {
            const headPos = model.getPositionAt(cursor.head)
            
            // Cursor caret decoration
            decorations.push({
              range: new monaco.Range(headPos.lineNumber, headPos.column, headPos.lineNumber, headPos.column + 1),
              options: {
                className: `yRemoteCursor`,
                beforeContentClassName: `yRemoteCursorCaret`,
                hoverMessage: { value: `**${name}** is editing` },
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
              }
            })
            
            // Selection decoration (if user has selected text)
            if (typeof cursor.anchor === 'number' && cursor.anchor !== cursor.head) {
              const anchorPos = model.getPositionAt(cursor.anchor)
              const startPos = cursor.anchor < cursor.head ? anchorPos : headPos
              const endPos = cursor.anchor < cursor.head ? headPos : anchorPos
              
              decorations.push({
                range: new monaco.Range(
                  startPos.lineNumber, 
                  startPos.column, 
                  endPos.lineNumber, 
                  endPos.column
                ),
                options: {
                  className: `yRemoteSelection`,
                  stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                }
              })
            }
          }
          
          // Inject CSS for this user's cursor and selection (once per client)
          const styleId = `cursor-style-${clientId}`
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style')
            style.id = styleId
            style.textContent = `
              .yRemoteCursorCaret {
                border-left: 2px solid ${color} !important;
                margin-left: -1px;
                position: relative;
              }
              .yRemoteCursorCaret::after {
                content: '${name}';
                position: absolute;
                top: -18px;
                left: 0;
                background: ${color};
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                white-space: nowrap;
                z-index: 100;
                pointer-events: none;
              }
              .yRemoteSelection {
                background-color: ${color}40 !important;
              }
            `
            document.head.appendChild(style)
          }
        })
        
        decorationsCollection.set(decorations)
      }
      
      // Listen for awareness changes
      provider.awareness.on('change', updateRemoteCursors)
      
      // Initial update
      updateRemoteCursors()
    }

    // Add save functionality
    if (onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const content = editor.getValue()
        onSave(content)
      })
    }

    // Batch changes for recording (to avoid too many API calls)
    let pendingChanges: Array<{
      changeType: string;
      position: number;
      length?: number;
      content?: string;
      timestamp: number;
    }> = [];
    let changeFlushTimer: NodeJS.Timeout | null = null;

    const flushChanges = async () => {
      if (pendingChanges.length === 0) return;
      
      const changesToSend = [...pendingChanges];
      pendingChanges = [];
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        // Batch send changes
        await fetch(`${API_URL}/sessions/${sessionId}/changes/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            changes: changesToSend,
            userName: user?.name || user?.username || 'Anonymous',
            userColor: '#007acc'
          })
        });
      } catch (error) {
        // Silently fail - recording is not critical
        console.debug('Change recording failed:', error);
      }
    };

    // Notify parent of content changes and trigger auto-save
    editor.onDidChangeModelContent((e) => {
      const content = editor.getValue()
      
      if (onContentChange) {
        onContentChange(content)
      }

      // Record changes for playback
      e.changes.forEach(change => {
        pendingChanges.push({
          changeType: change.text ? (change.rangeLength > 0 ? 'replace' : 'insert') : 'delete',
          position: change.rangeOffset,
          length: change.rangeLength || undefined,
          content: change.text || undefined,
          timestamp: Date.now()
        });
      });

      // Debounce change flushing (every 2 seconds)
      if (changeFlushTimer) {
        clearTimeout(changeFlushTimer);
      }
      changeFlushTimer = setTimeout(flushChanges, 2000);
      
      // Debounced auto-save (every 30 seconds of inactivity after changes)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      autoSaveTimerRef.current = setTimeout(async () => {
        // Only save if content has changed significantly (more than 50 chars difference)
        if (Math.abs(content.length - lastSavedContentRef.current.length) > 50 || 
            content !== lastSavedContentRef.current) {
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
            await fetch(`${API_URL}/sessions/${sessionId}/snapshot`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                content,
                note: 'Auto-save'
              })
            })
            lastSavedContentRef.current = content
            console.log('✅ Auto-saved snapshot')
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }, 30000) // 30 seconds
    })

    // Cleanup on unmount or session change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      cleanup()
    }
  }, [isEditorReady, sessionId, token, user, monacoLanguage, onSave, onContentChange, cleanup])

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    console.log('📝 Monaco editor mounted')
    editorRef.current = editor
    monacoRef.current = monaco
    setIsEditorReady(true)
  }

  // Handle editor unmount
  const handleEditorWillUnmount = () => {
    console.log('📝 Monaco editor will unmount')
    cleanup()
    editorRef.current = null
    monacoRef.current = null
    setIsEditorReady(false)
  }

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
          
          <span className="text-gray-500 text-xs">
            Room: {sessionId.slice(0, 8)}...
          </span>
          
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
      
      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme={theme}
          onMount={handleEditorDidMount}
          beforeMount={(monaco) => {
            // Configure Monaco before mounting
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: false,
              noSyntaxValidation: false,
            })
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: false,
              noSyntaxValidation: false,
            })
          }}
          options={{
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
            showFoldingControls: 'always',
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'matchingDocuments',
          }}
        />
      </div>
      
      {/* Loading State */}
      {!isEditorReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <div className="text-gray-300">Loading editor...</div>
          </div>
        </div>
      )}
    </div>
  )
}
