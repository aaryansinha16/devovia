'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '../../../../../lib/auth-context';
import { WS_URL, API_URL } from '../../../../../lib/api-config';
import { getTokens } from '../../../../../lib/auth';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  content: string;
  timestamp: number;
}

interface ProjectChatProps {
  projectId: string;
}

export default function ProjectChat({ projectId }: ProjectChatProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yMessagesRef = useRef<Y.Array<ChatMessage> | null>(null);

  // Generate user color based on user ID
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

  // Load existing messages from API
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.accessToken) return;

        const response = await fetch(`${API_URL}/project-chat/${projectId}/messages`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Convert API messages to chat format
          const apiMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            userId: msg.userId,
            userName: msg.user.name || msg.user.username || 'Anonymous',
            userAvatar: msg.user.avatar,
            userColor: generateUserColor(msg.userId),
            content: msg.content,
            timestamp: new Date(msg.createdAt).getTime(),
          }));
          setMessages(apiMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [projectId]);

  useEffect(() => {
    if (!token || !projectId) return;

    // Create Yjs document for real-time chat
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to WebSocket server with chat-specific room
    const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const provider = new WebsocketProvider(wsUrl, `project-chat-${projectId}`, ydoc);
    providerRef.current = provider;

    // Get shared messages array
    const yMessages = ydoc.getArray<ChatMessage>('messages');
    yMessagesRef.current = yMessages;

    // Sync messages from Yjs
    const syncMessages = () => {
      const yjsMessages = yMessages.toArray();
      setMessages((prev) => {
        // Merge API messages with Yjs messages, avoiding duplicates
        const combined = [...prev];
        yjsMessages.forEach((yjsMsg) => {
          if (!combined.some((m) => m.id === yjsMsg.id)) {
            combined.push(yjsMsg);
          }
        });
        return combined.sort((a, b) => a.timestamp - b.timestamp);
      });
    };

    // Listen for changes
    yMessages.observe(syncMessages);

    // Initial sync
    syncMessages();

    // Connection status
    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });

    return () => {
      yMessages.unobserve(syncMessages);
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
    };
  }, [token, projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !yMessagesRef.current || !user || !user.id) return;

    const userId = user.id as string;
    const userColor = generateUserColor(userId);

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      userName: user.name || user.email || 'Anonymous',
      userAvatar: user.avatar,
      userColor: userColor,
      content: message.trim(),
      timestamp: Date.now(),
    };

    // Add to Yjs for real-time sync
    yMessagesRef.current.push([newMessage]);

    // Also persist to database via API
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        await fetch(`${API_URL}/project-chat/${projectId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ content: message.trim() }),
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-xl"
      style={{backdropFilter: "blur(9.8px)", boxShadow: "rgba(0, 0, 0, 0.3) 0px 7px 29px 0px"}}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Team Chat
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Discuss your project with team members
            </p>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwnMessage = msg.userId === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
            >
              {msg.userAvatar ? (
                <img
                  src={msg.userAvatar}
                  alt={msg.userName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
                  style={{ backgroundColor: msg.userColor }}
                >
                  {msg.userName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className={`flex-1 min-w-0 max-w-[80%] ${isOwnMessage ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                  <span className="text-xs font-medium text-slate-300">
                    {isOwnMessage ? 'You' : msg.userName}
                  </span>
                  <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-slate-200 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2 text-center">Press Enter to send</p>
      </div>
    </div>
  );
}
