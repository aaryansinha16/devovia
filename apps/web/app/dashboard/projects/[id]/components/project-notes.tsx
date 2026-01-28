'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useAuth } from '../../../../../lib/auth-context';
import { WS_URL } from '../../../../../lib/api-config';
import { FileText, Users, Maximize, Minimize } from 'lucide-react';

interface ProjectNotesProps {
  projectId: string;
}

function EditorComponent({ 
  ydoc, 
  provider, 
  user 
}: { 
  ydoc: Y.Doc; 
  provider: WebsocketProvider; 
  user: any;
}) {
  const [cursors, setCursors] = useState<Map<number, { x: number; y: number; name: string; color: string }>>(new Map());
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  const generateUserColor = (userId: string): string => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length]!;
  };

  // Listen for other users' cursor updates (separate from mouse tracking)
  useEffect(() => {
    if (!provider) return;

    const updateCursors = () => {
      const states = provider.awareness.getStates();
      const newCursors = new Map<number, { x: number; y: number; name: string; color: string }>();
      
      states.forEach((state, clientId) => {
        if (clientId !== provider.awareness.clientID && state.mouseCursor) {
          newCursors.set(clientId, state.mouseCursor);
        }
      });
      
      setCursors(newCursors);
    };

    provider.awareness.on('change', updateCursors);
    updateCursors();

    return () => {
      provider.awareness.off('change', updateCursors);
    };
  }, [provider]);

  // Track mouse movements and broadcast via awareness
  useEffect(() => {
    if (!provider || !containerEl) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      provider.awareness.setLocalStateField('mouseCursor', {
        x,
        y,
        name: user?.name || user?.email || 'Anonymous',
        color: user?.id ? generateUserColor(user.id as string) : '#3b82f6',
      });
    };

    const handleMouseLeave = () => {
      provider.awareness.setLocalStateField('mouseCursor', null);
    };

    containerEl.addEventListener('mousemove', handleMouseMove);
    containerEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      containerEl.removeEventListener('mousemove', handleMouseMove);
      containerEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [provider, containerEl, user]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your project notes...',
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'content',
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: user?.name || user?.email || 'Anonymous',
          color: user?.id ? generateUserColor(user.id as string) : '#3b82f6',
        },
        render: (user) => {
          const cursor = document.createElement('span');
          cursor.classList.add('collaboration-cursor__caret');
          cursor.style.borderColor = user.color;
          cursor.style.borderLeft = `2px solid ${user.color}`;
          cursor.style.position = 'relative';

          const label = document.createElement('div');
          label.classList.add('collaboration-cursor__label');
          label.style.backgroundColor = user.color;
          label.style.color = '#fff';
          label.style.fontSize = '12px';
          label.style.fontWeight = '600';
          label.style.padding = '2px 6px';
          label.style.borderRadius = '4px';
          label.style.position = 'absolute';
          label.style.top = '-24px';
          label.style.left = '-2px';
          label.style.whiteSpace = 'nowrap';
          label.style.width = 'fit-content';
          label.style.pointerEvents = 'none';
          label.style.userSelect = 'none';
          label.style.zIndex = '10';
          label.textContent = user.name;

          cursor.appendChild(label);
          return cursor;
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  });

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Initializing editor...</div>
      </div>
    );
  }

  return (
    <div ref={setContainerEl} style={{ position: 'relative', height: '100%' }}>
      <EditorContent editor={editor} />
      
      {/* Render other users' cursors */}
      {Array.from(cursors.entries()).map(([clientId, cursor]) => (
          <div
            key={clientId}
            style={{
              position: 'absolute',
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              pointerEvents: 'none',
              zIndex: 1000,
              transition: 'left 0.1s ease-out, top 0.1s ease-out',
            }}
          >
          {/* Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M5.65376 12.3673L5 5L12.3673 5.65376L8.29289 9.72823L12.3673 13.8027L10.2349 15.9351L6.16044 11.8606L5.65376 12.3673Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          
          {/* Name label */}
          <div
            style={{
              backgroundColor: cursor.color,
              color: '#fff',
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '4px',
              marginTop: '4px',
              marginLeft: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectNotes({ projectId }: ProjectNotesProps) {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Initialize Yjs and provider before editor
  useEffect(() => {
    if (!token || !projectId) return;

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to WebSocket server with project-specific room
    const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const provider = new WebsocketProvider(wsUrl, `project-note-${projectId}`, ydoc);
    providerRef.current = provider;

    // Connection status
    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });

    // Track active users
    provider.awareness.on('change', () => {
      setActiveUsers(provider.awareness.getStates().size);
    });

    // Mark as initialized
    setIsInitialized(true);

    return () => {
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
      setIsInitialized(false);
    };
  }, [token, projectId]);

  if (!isInitialized || !ydocRef.current || !providerRef.current) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col bg-slate-900/50 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none' 
          : 'h-full rounded-xl'
      }`}
      style={{backdropFilter: "blur(9.8px)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 7px 29px 0px"}}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Project Notes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Collaborative document for your team
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-4 h-4" />
              <span>{activeUsers} online</span>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-slate-400" />
              ) : (
                <Maximize className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorComponent 
          ydoc={ydocRef.current} 
          provider={providerRef.current} 
          user={user} 
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
        <p className="text-xs text-slate-500 text-center">
          Changes are saved automatically • Live cursors show team activity
        </p>
      </div>
    </div>
  );
}
