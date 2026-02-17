'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Trash2, Paperclip, X, FileText, Image, File, Download, Loader2, Calendar as CalendarIcon, ChevronDown, Search } from 'lucide-react';
import { Button, Input, IconButton, Popover, PopoverTrigger, PopoverContent, Calendar, cn } from '@repo/ui';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '../../../../../lib/auth-context';
import { WS_URL, API_URL } from '../../../../../lib/api-config';
import { getTokens } from '../../../../../lib/auth';
import { useTypingIndicator } from '../../../../../hooks/use-typing-indicator';

interface ChatAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  content: string;
  timestamp: number;
  attachment?: ChatAttachment;
  error?: boolean;
  retrying?: boolean;
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [hasNewer, setHasNewer] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingNewer, setLoadingNewer] = useState(false);
  const shouldScrollToBottom = useRef(true);
  const isJumpingToDate = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; createdAt: string; content: string; userName: string; timestamp: number }[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
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

  const userColor = user?.id ? generateUserColor(user.id as string) : '#6366f1';
  const { typingUsers, broadcastTyping, clearTyping } = useTypingIndicator({
    provider: providerRef.current,
    userId: user?.id as string | undefined,
    userName: user?.name || user?.email || 'Anonymous',
    userColor,
  });

  const parseApiMessages = (messagesData: any[]): ChatMessage[] => {
    return messagesData.map((msg: any) => ({
      id: msg.id,
      userId: msg.userId,
      userName: msg.user?.name || msg.user?.username || 'Anonymous',
      userAvatar: msg.user?.avatar,
      userColor: generateUserColor(msg.userId),
      content: msg.content,
      timestamp: new Date(msg.createdAt).getTime(),
      ...(msg.attachmentUrl && {
        attachment: {
          url: msg.attachmentUrl,
          name: msg.attachmentName || 'file',
          size: msg.attachmentSize || 0,
          type: msg.attachmentType || '',
          publicId: msg.attachmentPublicId,
        },
      }),
    }));
  };

  const fetchMessages = async (params: Record<string, string> = {}) => {
    const tokens = await getTokens();
    if (!tokens?.accessToken) return null;

    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/project-chat/${projectId}/messages${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success) return null;

    const payload = data.data;
    return {
      messages: parseApiMessages(payload.messages || []),
      hasOlder: payload.hasOlder ?? false,
      hasNewer: payload.hasNewer ?? false,
    };
  };

  // Load initial (most recent) messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const result = await fetchMessages();
        if (result) {
          setMessages(result.messages);
          setHasOlder(result.hasOlder);
          setHasNewer(result.hasNewer);
          shouldScrollToBottom.current = true;
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [projectId]);

  // Load older messages (scroll up)
  const loadOlderMessages = async () => {
    if (loadingOlder || !hasOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0]!;
      const result = await fetchMessages({ before: new Date(oldest.timestamp).toISOString() });
      if (result && result.messages.length > 0) {
        const container = messagesContainerRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;

        shouldScrollToBottom.current = false;
        setMessages((prev) => [...result.messages, ...prev]);
        setHasOlder(result.hasOlder);

        // Restore scroll position after prepending
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Load newer messages (scroll down, only when viewing historical)
  const loadNewerMessages = async () => {
    if (loadingNewer || !hasNewer || messages.length === 0) return;
    setLoadingNewer(true);
    try {
      const newest = messages[messages.length - 1]!;
      const result = await fetchMessages({ after: new Date(newest.timestamp).toISOString() });
      if (result && result.messages.length > 0) {
        shouldScrollToBottom.current = false;
        setMessages((prev) => [...prev, ...result.messages]);
        setHasNewer(result.hasNewer);
      }
    } catch (error) {
      console.error('Error loading newer messages:', error);
    } finally {
      setLoadingNewer(false);
    }
  };

  // Jump to a specific date via API
  const jumpToDateApi = async (dateIso: string) => {
    isJumpingToDate.current = true;
    setIsLoading(true);
    try {
      const result = await fetchMessages({ around: dateIso });
      if (result && result.messages.length > 0) {
        dateRefs.current.clear();
        shouldScrollToBottom.current = false;
        setMessages(result.messages);
        setHasOlder(result.hasOlder);
        setHasNewer(result.hasNewer);

        // After render, scroll to the first message on or after the target date
        requestAnimationFrame(() => {
          const targetKey = getDateKey(new Date(dateIso).getTime());
          const el = dateRefs.current.get(targetKey);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
          } else {
            // Scroll to top of the loaded window
            messagesContainerRef.current?.scrollTo(0, 0);
          }
          isJumpingToDate.current = false;
        });
      } else {
        isJumpingToDate.current = false;
      }
    } catch (error) {
      console.error('Error jumping to date:', error);
      isJumpingToDate.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Jump back to latest messages
  const jumpToLatest = async () => {
    setIsLoading(true);
    try {
      const result = await fetchMessages();
      if (result) {
        dateRefs.current.clear();
        shouldScrollToBottom.current = true;
        setMessages(result.messages);
        setHasOlder(result.hasOlder);
        setHasNewer(result.hasNewer);
      }
    } catch (error) {
      console.error('Error jumping to latest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Infinite scroll: load older on scroll to top, newer on scroll to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasOlder && !loadingOlder) {
        loadOlderMessages();
      }
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 100 && hasNewer && !loadingNewer) {
        loadNewerMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasOlder, hasNewer, loadingOlder, loadingNewer, messages]);

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

    // Track the count of Yjs messages at initial sync so we can
    // ignore stale messages that are already loaded from the API.
    let initialYjsCount: number | null = null;

    // Sync only NEW Yjs messages (added after initial sync) into state
    const syncMessages = () => {
      if (initialYjsCount === null) return;
      const allYjs = yMessages.toArray();
      // Only consider messages added after the initial sync snapshot
      const newYjsMessages = allYjs.slice(initialYjsCount);
      if (newYjsMessages.length === 0) return;

      setMessages((prev) => {
        const combined = [...prev];
        newYjsMessages.forEach((yjsMsg) => {
          // Only check for duplicate IDs, not content - allow identical messages
          const isDuplicate = combined.some((m) => m.id === yjsMsg.id);
          if (!isDuplicate) {
            combined.push(yjsMsg);
          }
        });
        return combined.sort((a, b) => a.timestamp - b.timestamp);
      });
    };

    // Listen for changes
    yMessages.observe(syncMessages);

    // Once Yjs finishes initial sync, snapshot the current count
    // so we only process messages added after this point.
    provider.on('synced', () => {
      initialYjsCount = yMessages.length;
    });

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

  // Auto-scroll to bottom only on initial load and own new messages
  useEffect(() => {
    if (shouldScrollToBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const uploadFile = async (file: File): Promise<ChatAttachment | null> => {
    try {
      const tokens = await getTokens();
      if (!tokens?.accessToken) return null;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/project-chat/${projectId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const fileData = data.data;
      return {
        url: fileData.url,
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        publicId: fileData.publicId,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !pendingFile) || !yMessagesRef.current || !user || !user.id) return;

    // Capture values before clearing (optimistic UI)
    const messageContent = message.trim();
    const fileToUpload = pendingFile;

    // Clear input immediately for instant UX feedback
    setMessage('');
    setPendingFile(null);

    const userId = user.id as string;
    const userColor = generateUserColor(userId);

    let attachment: ChatAttachment | undefined;

    // Upload file if pending
    if (fileToUpload) {
      setIsUploading(true);
      const uploaded = await uploadFile(fileToUpload);
      setIsUploading(false);
      if (uploaded) {
        attachment = uploaded;
      } else {
        return; // Upload failed, don't send
      }
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: userId,
      userName: user.name || user.email || 'Anonymous',
      userAvatar: user.avatar,
      userColor: userColor,
      content: messageContent,
      timestamp: Date.now(),
      ...(attachment && { attachment }),
    };

    // Add to Yjs for real-time sync
    shouldScrollToBottom.current = true;
    const messageIndex = yMessagesRef.current.length;
    yMessagesRef.current.push([newMessage]);
    clearTyping();

    // Also persist to database via API
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        const response = await fetch(`${API_URL}/project-chat/${projectId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            content: messageContent,
            ...(attachment && {
              attachmentUrl: attachment.url,
              attachmentName: attachment.name,
              attachmentSize: String(attachment.size),
              attachmentType: attachment.type,
              attachmentPublicId: attachment.publicId,
            }),
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error saving message:', error);
      // Mark message as failed in Yjs
      if (yMessagesRef.current && yMessagesRef.current.get(messageIndex)) {
        const failedMsg = yMessagesRef.current.get(messageIndex);
        yMessagesRef.current.delete(messageIndex, 1);
        yMessagesRef.current.insert(messageIndex, [{ ...failedMsg, error: true }]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be under 10MB');
        return;
      }
      setPendingFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageType = (type: string) => type.startsWith('image/');

  const getFileUrl = (key: string) =>
    `${API_URL}/chat/view?key=${encodeURIComponent(key)}`;

  const handleDownload = (key: string, fileName: string) => {
    const downloadUrl = `${API_URL}/chat/download?key=${encodeURIComponent(key)}&name=${encodeURIComponent(fileName)}`;
    window.open(downloadUrl, '_blank');
  };

  const handleRetryMessage = async (messageIndex: number, msg: ChatMessage) => {
    if (!yMessagesRef.current || msg.retrying) return;

    // Mark as retrying
    yMessagesRef.current.delete(messageIndex, 1);
    yMessagesRef.current.insert(messageIndex, [{ ...msg, retrying: true, error: false }]);

    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        const response = await fetch(`${API_URL}/project-chat/${projectId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            content: msg.content,
            ...(msg.attachment && {
              attachmentUrl: msg.attachment.url,
              attachmentName: msg.attachment.name,
              attachmentSize: String(msg.attachment.size),
              attachmentType: msg.attachment.type,
              attachmentPublicId: msg.attachment.publicId,
            }),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Success - remove error and retrying flags
        yMessagesRef.current.delete(messageIndex, 1);
        yMessagesRef.current.insert(messageIndex, [{ ...msg, retrying: false, error: false }]);
      }
    } catch (error) {
      console.error('Error retrying message:', error);
      // Mark as failed again
      yMessagesRef.current.delete(messageIndex, 1);
      yMessagesRef.current.insert(messageIndex, [{ ...msg, retrying: false, error: true }]);
    }
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

  const getDateKey = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatDateLabel = (dateKey: string) => {
    const date = new Date(dateKey + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = getDateKey(today.getTime()) === dateKey;
    const isYesterday = getDateKey(yesterday.getTime()) === dateKey;

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const scrollToDate = (dateKey: string) => {
    const el = dateRefs.current.get(dateKey);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getUniqueDateKeys = () => {
    const keys: string[] = [];
    messages.forEach((msg) => {
      const key = getDateKey(msg.timestamp);
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  };

  const handleJumpTo = (option: 'yesterday' | 'day_before' | 'beginning') => {
    if (option === 'beginning') {
      jumpToDateApi(new Date(0).toISOString());
      return;
    }

    const target = new Date();
    target.setHours(0, 0, 0, 0);
    if (option === 'yesterday') target.setDate(target.getDate() - 1);
    if (option === 'day_before') target.setDate(target.getDate() - 2);
    jumpToDateApi(target.toISOString());
  };

  // Search messages via API
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      return;
    }
    setIsSearching(true);
    try {
      const tokens = await getTokens();
      if (!tokens?.accessToken) return;
      const url = `${API_URL}/project-chat/${projectId}/messages/search?q=${encodeURIComponent(query.trim())}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) {
        const results = (data.data.messages || []).map((m: any) => ({
          id: m.id,
          createdAt: m.createdAt,
          content: m.content || '',
          userName: m.user?.name || m.user?.username || 'Unknown',
          timestamp: new Date(m.createdAt).getTime(),
        }));
        setSearchResults(results);
        setSearchTotal(data.data.total || results.length);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  }, [projectId]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchMessages(value);
    }, 400);
  };

  const jumpToSearchResult = async (messageId: string, createdAt: string) => {
    const result = await fetchMessages({ around: createdAt });
    if (result && result.messages.length > 0) {
      dateRefs.current.clear();
      shouldScrollToBottom.current = false;
      setMessages(result.messages);
      setHasOlder(result.hasOlder);
      setHasNewer(result.hasNewer);
      // Wait for React to render the new messages, then scroll to the target
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = messageRefs.current.get(messageId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Brief highlight flash to draw attention
            el.classList.add('ring-1', 'ring-yellow-400/60', 'rounded-lg');
            setTimeout(() => el.classList.remove('ring-1', 'ring-yellow-400/60', 'rounded-lg'), 2000);
          }
        }, 50);
      });
    }
  };

  const handleSearchResultClick = (result: typeof searchResults[0]) => {
    jumpToSearchResult(result.id, result.createdAt);
    // Keep searchQuery + searchOpen so highlights persist on the loaded messages
    setSearchResults([]);
    setSearchTotal(0);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchTotal(0);
  };

  const getSnippet = (content: string, query: string, maxLen = 80) => {
    const lower = content.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx === -1) return content.slice(0, maxLen) + (content.length > maxLen ? '...' : '');
    const start = Math.max(0, idx - 30);
    const end = Math.min(content.length, idx + query.length + 30);
    return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
  };

  const formatSearchTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
  };

  // Highlight search term in message text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-400/40 text-inherit rounded-sm px-0.5">{part}</mark>
        : part
    );
  };

  const handleDatePick = (date: Date | undefined) => {
    if (!date) return;
    setShowCalendar(false);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    jumpToDateApi(target.toISOString());
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
          <div className="flex items-center gap-2">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
                else closeSearch();
              }}
              className="text-slate-400 hover:text-sky-400 shadow-none"
              title="Search messages"
              icon={<Search className="w-4 h-4" />}
            />
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </div>
        {searchOpen && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeSearch();
                  }}
                  variant="glass"
                  placeholder="Search messages..."
                  className="pl-8 pr-3 py-1.5 h-8 bg-slate-800/50 border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>
              {searchQuery && (
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {isSearching ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : (
                    `${searchTotal} result${searchTotal !== 1 ? 's' : ''}`
                  )}
                </span>
              )}
              <IconButton
                variant="ghost"
                size="sm"
                onClick={closeSearch}
                className="text-slate-400 hover:text-slate-200 shadow-none p-1"
                icon={<X className="w-3.5 h-3.5" />}
              />
            </div>
            {searchQuery && !isSearching && searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg bg-slate-800/80 backdrop-blur-sm divide-y divide-slate-700/30">
                {searchResults.map((r) => (
                  <button
                    // variant={'ghost'}
                    key={r.id}
                    onClick={() => handleSearchResultClick(r)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors shadow-none"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-medium text-slate-300 truncate">{r.userName}</span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">{formatSearchTime(r.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                      {highlightText(getSnippet(r.content, searchQuery), searchQuery)}
                    </p>
                  </button>
                ))}
                {searchTotal > searchResults.length && (
                  <div className="px-3 py-1.5 text-[10px] text-slate-500 text-center">
                    Showing {searchResults.length} of {searchTotal} results
                  </div>
                )}
              </div>
            )}
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="mt-2 px-3 py-3 text-center text-[11px] text-slate-500 rounded-lg border border-slate-700/50 bg-slate-800/80">
                No messages found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        )}
        {hasOlder && !loadingOlder && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadOlderMessages}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Load older messages
            </Button>
          </div>
        )}
        {messages.map((msg, index) => {
          const isOwnMessage = msg.userId === user?.id;
          const currentDateKey = getDateKey(msg.timestamp);
          const prevDateKey = index > 0 ? getDateKey(messages[index - 1]!.timestamp) : null;
          const showDateDivider = currentDateKey !== prevDateKey;

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div
                  ref={(el) => { if (el) dateRefs.current.set(currentDateKey, el); }}
                  className="relative flex items-center justify-center my-4"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/50" />
                  </div>
                  <div className="relative">
                    <Popover onOpenChange={(open) => { if (!open) setShowCalendar(false); }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="gradient"
                          size="sm"
                        >
                          <CalendarIcon className="w-3 h-3" />
                          {formatDateLabel(currentDateKey)}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className={cn(
                          'p-1 bg-slate-900 border-none',
                          showCalendar ? 'w-auto' : 'w-52'
                        )}
                        sideOffset={6}
                      >
                        {showCalendar ? (
                          <Calendar
                            mode="single"
                            selected={undefined}
                            onSelect={handleDatePick}
                            disabled={{ after: new Date() }}
                            className="text-slate-200"
                          />
                        ) : (
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs text-slate-300 hover:bg-slate-700/70 rounded-lg shadow-none"
                              onClick={() => handleJumpTo('yesterday')}
                            >
                              Jump to yesterday
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs text-slate-300 hover:bg-slate-700/70 rounded-lg shadow-none"
                              onClick={() => handleJumpTo('day_before')}
                            >
                              Jump to day before yesterday
                            </Button>
                            <div className="border-t border-slate-700/50 my-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs text-slate-300 hover:bg-slate-700/70 rounded-lg shadow-none"
                              onClick={() => setShowCalendar(true)}
                            >
                              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                              Jump to a specific date...
                            </Button>
                            <div className="border-t border-slate-700/50 my-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs text-slate-300 hover:bg-slate-700/70 rounded-lg shadow-none"
                              onClick={() => handleJumpTo('beginning')}
                            >
                              Jump to the very beginning
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

            <div
              ref={(el) => { if (el) messageRefs.current.set(msg.id, el); }}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} transition-all duration-300`}
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
                  onClick={() => msg.error && isOwnMessage ? handleRetryMessage(index, msg) : undefined}
                  title={msg.error ? 'Message not sent. Click to retry.' : undefined}
                  className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    msg.error
                      ? 'bg-red-600/80 text-white rounded-br-md cursor-pointer hover:bg-red-600 transition-colors'
                      : msg.retrying
                        ? 'bg-yellow-600/80 text-white rounded-br-md opacity-70'
                        : isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-slate-800 text-slate-200 rounded-bl-md'
                  }`}
                >
                  {msg.attachment && (
                    <div className="mb-1.5">
                      {isImageType(msg.attachment.type) ? (
                        <a href={getFileUrl(msg.attachment.url)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getFileUrl(msg.attachment.url)}
                            alt={msg.attachment.name}
                            className="max-w-[240px] max-h-[180px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDownload(msg.attachment!.url, msg.attachment!.name)}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                            isOwnMessage ? 'bg-blue-700/50 hover:bg-blue-700/70' : 'bg-slate-700/50 hover:bg-slate-700/70'
                          }`}
                        >
                          <FileText className="w-5 h-5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{msg.attachment.name}</p>
                            <p className={`text-[10px] ${isOwnMessage ? 'text-blue-200' : 'text-slate-400'}`}>
                              {formatFileSize(msg.attachment.size)}
                            </p>
                          </div>
                          <Download className="w-4 h-4 flex-shrink-0 opacity-60" />
                        </button>
                      )}
                    </div>
                  )}
                  {msg.content && <span>{searchQuery ? highlightText(msg.content, searchQuery) : msg.content}</span>}
                </div>
              </div>
            </div>
            </React.Fragment>
          );
        })}

        {loadingNewer && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />

        {hasNewer && (
          <div className="sticky bottom-2 flex justify-center pointer-events-none">
            <Button
              onClick={jumpToLatest}
              size="sm"
              className="pointer-events-auto rounded-full shadow-lg"
              leftIcon={<ChevronDown className="w-3.5 h-3.5" />}
            >
              Jump to latest
            </Button>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-slate-700/50">
        {/* File preview */}
        {pendingFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-slate-800/50 rounded-lg border border-slate-600/30">
            {pendingFile.type.startsWith('image/') ? (
              <Image className="w-4 h-4 text-sky-400 flex-shrink-0" />
            ) : (
              <File className="w-4 h-4 text-sky-400 flex-shrink-0" />
            )}
            <span className="text-xs text-slate-300 truncate flex-1">{pendingFile.name}</span>
            <span className="text-[10px] text-slate-500 flex-shrink-0">{formatFileSize(pendingFile.size)}</span>
            <button
              onClick={() => setPendingFile(null)}
              className="p-0.5 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.zip,.json"
            onChange={handleFileSelect}
          />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading}
            className="text-slate-400 hover:text-sky-400 shadow-none"
            title="Attach file"
            icon={<Paperclip className="w-4 h-4" />}
          />
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              broadcastTyping();
            }}
            variant={'glass'}
            onKeyPress={handleKeyPress}
            placeholder={pendingFile ? 'Add a message (optional)...' : 'Type a message...'}
            className="flex-1 px-4 py-2.5 bg-slate-800/50 border-slate-600/50 rounded-xl text-white placeholder-slate-500 text-sm"
            disabled={!isConnected || isUploading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!message.trim() && !pendingFile) || !isConnected || isUploading}
            className="px-4 py-2.5"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>

        {typingUsers.length > 0 ? (
          <div className="flex items-center gap-1.5 mt-2 h-4">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-slate-400">
              {typingUsers.length === 1
                ? `${typingUsers[0]!.userName} is typing...`
                : `${typingUsers.map((u) => u.userName).join(', ')} are typing...`}
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-2 text-center h-4">Press Enter to send</p>
        )}
      </div>
    </div>
  );
}
