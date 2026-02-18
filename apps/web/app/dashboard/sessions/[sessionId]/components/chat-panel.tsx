'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Paperclip, X, FileText, Image, File, Download, Loader2, Calendar as CalendarIcon, ChevronDown, Search, Reply, Edit2, CheckCheck } from 'lucide-react';
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
}

interface ReplyTo {
  id: string;
  userId: string;
  userName: string;
  content: string;
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
  replyTo?: ReplyTo;
  readBy?: string[];
  editedAt?: number;
  error?: boolean;
  retrying?: boolean;
}

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<ChatMessage[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const readObserverRef = useRef<IntersectionObserver | null>(null);
  const shouldScrollToBottom = useRef(true);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yMessagesRef = useRef<Y.Array<ChatMessage> | null>(null);
  const yReadReceiptsRef = useRef<Y.Map<string[]> | null>(null);

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

  useEffect(() => {
    if (!token || !sessionId) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const provider = new WebsocketProvider(wsUrl, `chat-${sessionId}`, ydoc);
    providerRef.current = provider;

    const yMessages = ydoc.getArray<ChatMessage>('messages');
    yMessagesRef.current = yMessages;

    const yReadReceipts = ydoc.getMap<string[]>('readReceipts');
    yReadReceiptsRef.current = yReadReceipts;

    const syncMessages = () => {
      setMessages(yMessages.toArray());
    };

    const syncReadReceipts = () => {
      setMessages((prev) => {
        let changed = false;
        const updated = prev.map((msg) => {
          const readers = yReadReceipts.get(msg.id);
          if (readers && JSON.stringify(msg.readBy) !== JSON.stringify(readers)) {
            changed = true;
            return { ...msg, readBy: readers };
          }
          return msg;
        });
        return changed ? updated : prev;
      });
    };

    yMessages.observe(syncMessages);
    yReadReceipts.observe(syncReadReceipts);
    syncMessages();

    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });

    return () => {
      yMessages.unobserve(syncMessages);
      yReadReceipts.unobserve(syncReadReceipts);
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
    };
  }, [token, sessionId]);

  // Auto-scroll to bottom only when user is near the bottom
  useEffect(() => {
    if (shouldScrollToBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const markMessageAsRead = useCallback((messageId: string) => {
    if (!user?.id) return;

    setMessages((prev) => {
      const msgIndex = prev.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return prev;
      const msg = prev[msgIndex];
      if (!msg) return prev;
      if (msg.userId === user.id) return prev;
      if (msg.readBy?.includes(user.id)) return prev;
      const updated = [...prev] as typeof prev;
      updated[msgIndex] = { ...msg, readBy: [...(msg.readBy || []), user.id] };
      return updated;
    });

    if (yReadReceiptsRef.current) {
      const existing = yReadReceiptsRef.current.get(messageId) || [];
      if (!existing.includes(user.id)) {
        yReadReceiptsRef.current.set(messageId, [...existing, user.id]);
      }
    }
  }, [user?.id]);

  // Intersection Observer: mark messages as read when they scroll into view
  useEffect(() => {
    if (!user?.id) return;

    if (readObserverRef.current) readObserverRef.current.disconnect();

    readObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = (entry.target as HTMLElement).dataset.messageId;
            if (messageId) markMessageAsRead(messageId);
          }
        });
      },
      { threshold: 0.5, root: messagesContainerRef.current },
    );

    messageRefs.current.forEach((el, messageId) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg && msg.userId !== user.id && !msg.readBy?.includes(user.id)) {
        readObserverRef.current?.observe(el);
      }
    });

    return () => readObserverRef.current?.disconnect();
  }, [messages, user?.id, markMessageAsRead]);

  // Viewport scan: catch already-visible messages after render
  useEffect(() => {
    if (!user?.id || messages.length === 0) return;

    const currentMessages = messages;
    const currentUserId = user.id;

    const scan = () => {
      const scrollContainer = messagesContainerRef.current;
      if (!scrollContainer) return;
      const containerRect = scrollContainer.getBoundingClientRect();
      messageRefs.current.forEach((el, messageId) => {
        const msg = currentMessages.find((m) => m.id === messageId);
        if (!msg || msg.userId === currentUserId || msg.readBy?.includes(currentUserId)) return;
        const elRect = el.getBoundingClientRect();
        const isVisible =
          elRect.top < containerRect.bottom &&
          elRect.bottom > containerRect.top &&
          elRect.height > 0;
        if (isVisible) markMessageAsRead(messageId);
      });
    };

    scan();
    const raf = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(raf);
  }, [messages, user?.id, markMessageAsRead]);

  const uploadFile = async (file: File): Promise<ChatAttachment | null> => {
    try {
      const tokens = await getTokens();
      if (!tokens?.accessToken) return null;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/chat/upload`, {
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
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !pendingFile) || !yMessagesRef.current || !user || !user.id) return;

    if (editingMessage) {
      handleSaveEdit();
      return;
    }

    const messageContent = message.trim();
    const fileToUpload = pendingFile;
    const currentReply = replyingTo;

    setMessage('');
    setPendingFile(null);
    setReplyingTo(null);

    const userId = user.id as string;
    const msgUserColor = generateUserColor(userId);

    let attachment: ChatAttachment | undefined;

    if (fileToUpload) {
      setIsUploading(true);
      const uploaded = await uploadFile(fileToUpload);
      setIsUploading(false);
      if (!uploaded) return;
      attachment = uploaded;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      userName: user.name || user.email || 'Anonymous',
      userAvatar: user.avatar ?? undefined,
      userColor: msgUserColor,
      content: messageContent,
      timestamp: Date.now(),
      ...(attachment && { attachment }),
      ...(currentReply && {
        replyTo: {
          id: currentReply.id,
          userId: currentReply.userId,
          userName: currentReply.userName,
          content: currentReply.content,
        },
      }),
    };

    shouldScrollToBottom.current = true;
    yMessagesRef.current.push([newMessage]);
    clearTyping();
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !yMessagesRef.current || !message.trim()) return;

    const messageContent = message.trim();
    const updatedMessage: ChatMessage = {
      ...editingMessage,
      content: messageContent,
      editedAt: Date.now(),
    };

    const yjsIndex = yMessagesRef.current.toArray().findIndex((m) => m.id === editingMessage.id);
    if (yjsIndex !== -1) {
      yMessagesRef.current.delete(yjsIndex, 1);
      yMessagesRef.current.insert(yjsIndex, [updatedMessage]);
    }

    setEditingMessage(null);
    setMessage('');
  };

  const handleEdit = (msg: ChatMessage) => {
    if (msg.userId !== user?.id) return;
    setReplyingTo(null);
    setEditingMessage(msg);
    setMessage(msg.content);
  };

  const handleReply = (msg: ChatMessage) => {
    setEditingMessage(null);
    setReplyingTo(msg);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage('');
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
      // For session chat, we just need to re-add to Yjs (no separate API persistence)
      // Simulate a brief delay to show retrying state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Success - remove error and retrying flags
      yMessagesRef.current.delete(messageIndex, 1);
      yMessagesRef.current.insert(messageIndex, [{ ...msg, retrying: false, error: false }]);
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
    if (e.key === 'Escape') {
      if (editingMessage) handleCancelEdit();
      if (replyingTo) setReplyingTo(null);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
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
      const keys = getUniqueDateKeys();
      if (keys.length > 0) scrollToDate(keys[0]!);
      return;
    }

    const target = new Date();
    target.setHours(0, 0, 0, 0);
    if (option === 'yesterday') target.setDate(target.getDate() - 1);
    if (option === 'day_before') target.setDate(target.getDate() - 2);
    const targetKey = getDateKey(target.getTime());
    const keys = getUniqueDateKeys();
    let closest = keys[0];
    for (const k of keys) {
      if (k <= targetKey) closest = k;
    }
    if (closest) scrollToDate(closest);
  };

  // Client-side search (session chat is Yjs-only, no backend persistence)
  const runSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchMatches([]);
      return;
    }
    const q = query.toLowerCase();
    setSearchMatches(messages.filter((m) => m.content.toLowerCase().includes(q)));
  }, [messages]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      runSearch(value);
    }, 300);
  };

  const handleSearchResultClick = (msgId: string) => {
    requestAnimationFrame(() => {
      const el = messageRefs.current.get(msgId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchMatches([]);
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
    const targetKey = getDateKey(date.getTime());
    const keys = getUniqueDateKeys();
    let closest = keys[0];
    for (const k of keys) {
      if (k <= targetKey) closest = k;
    }
    if (closest) scrollToDate(closest);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Session Chat
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Discuss changes with your team
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
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                 title={isConnected ? 'Connected' : 'Disconnected'} />
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
                  {`${searchMatches.length} result${searchMatches.length !== 1 ? 's' : ''}`}
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
            {searchQuery && searchMatches.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg bg-slate-800/80 backdrop-blur-sm divide-y divide-slate-700/30">
                {searchMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSearchResultClick(m.id)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors shadow-none"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-medium text-slate-300 truncate">{m.userName}</span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">{formatSearchTime(m.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                      {highlightText(getSnippet(m.content, searchQuery), searchQuery)}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchMatches.length === 0 && (
              <div className="mt-2 px-3 py-3 text-center text-[11px] text-slate-500 rounded-lg border border-slate-700/50 bg-slate-800/80">
                No messages found
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
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
              data-message-id={msg.id}
              className={`group flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} transition-all duration-300`}
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

              <div className={`min-w-0 flex flex-col ${isOwnMessage ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                  <span className="text-xs font-medium text-slate-300">
                    {isOwnMessage ? 'You' : msg.userName}
                  </span>
                  <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                  {isOwnMessage && !msg.error && !msg.retrying && (
                    msg.readBy && msg.readBy.length > 0
                      ? <span title={`Seen by ${msg.readBy.length}`}><CheckCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /></span>
                      : <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /></span>
                  )}
                </div>
                <div className="relative">
                  <div
                    onClick={() => msg.error && isOwnMessage ? handleRetryMessage(index, msg) : undefined}
                    title={msg.error ? 'Message not sent. Click to retry.' : undefined}
                    className={`inline-block px-3 py-2 rounded-2xl text-sm relative ${
                      msg.error
                        ? 'bg-red-600/80 text-white rounded-br-md cursor-pointer hover:bg-red-600 transition-colors'
                        : msg.retrying
                          ? 'bg-yellow-600/80 text-white rounded-br-md opacity-70'
                          : isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-slate-800 text-slate-200 rounded-bl-md'
                    }`}
                  >
                    {msg.replyTo && (
                      <div className={`mb-2 text-xs rounded-lg p-1.5 -mx-1 shadow-[inset_2px_0_0_0_rgba(148,163,184,0.35)] ${
                        isOwnMessage ? 'bg-blue-700/20' : 'bg-slate-700/20'
                      }`}>
                        <div className="font-medium opacity-90">{msg.replyTo.userName}</div>
                        <div className="truncate opacity-70">{msg.replyTo.content}</div>
                      </div>
                    )}

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

                    {msg.editedAt && (
                      <div className={`text-[10px] mt-1 opacity-60 ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                        (edited)
                      </div>
                    )}
                  </div>

                  {!msg.error && !msg.retrying && (
                    <div className={`absolute ${isOwnMessage ? 'right-full mr-1.5' : 'left-full ml-1.5'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1`}>
                      <button
                        onClick={() => handleReply(msg)}
                        className="p-1 bg-slate-800/95 hover:bg-slate-700 rounded-md transition-colors shadow-lg"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3 text-slate-300" />
                      </button>
                      {isOwnMessage && (
                        <button
                          onClick={() => handleEdit(msg)}
                          className="p-1 bg-slate-800/95 hover:bg-slate-700 rounded-md transition-colors shadow-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3 text-slate-300" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </React.Fragment>
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
        {/* Reply banner */}
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-800/60 rounded-lg border-l-2 border-blue-500">
            <Reply className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium text-blue-400">{replyingTo.userName}</span>
              <p className="text-[11px] text-slate-400 truncate">{replyingTo.content}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-0.5 hover:bg-slate-700 rounded flex-shrink-0">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

        {/* Edit banner */}
        {editingMessage && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-800/60 rounded-lg border-l-2 border-yellow-500">
            <Edit2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium text-yellow-400">Editing message</span>
              <p className="text-[11px] text-slate-400 truncate">{editingMessage.content}</p>
            </div>
            <button onClick={handleCancelEdit} className="p-0.5 hover:bg-slate-700 rounded flex-shrink-0">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

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
          {!editingMessage && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isUploading}
              className="text-slate-400 hover:text-sky-400 shadow-none"
              title="Attach file"
              icon={<Paperclip className="w-4 h-4" />}
            />
          )}
          <Input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (!editingMessage) broadcastTyping();
            }}
            variant={'glass'}
            onKeyDown={handleKeyPress}
            placeholder={editingMessage ? 'Edit message...' : pendingFile ? 'Add a message (optional)...' : 'Type a message...'}
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
          <p className="text-xs text-slate-500 mt-2 text-center h-4">
            Press Enter to send
          </p>
        )}
      </div>
    </div>
  );
}
