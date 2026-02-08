'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebsocketProvider } from 'y-websocket';

interface TypingUser {
  userId: string;
  userName: string;
  userColor: string;
}

interface UseTypingIndicatorOptions {
  provider: WebsocketProvider | null;
  userId: string | undefined;
  userName: string;
  userColor: string;
  /** Debounce time in ms before clearing typing state (default: 2000) */
  debounceMs?: number;
}

export function useTypingIndicator({
  provider,
  userId,
  userName,
  userColor,
  debounceMs = 2000,
}: UseTypingIndicatorOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for awareness changes from other users
  useEffect(() => {
    if (!provider || !userId) return;

    const awareness = provider.awareness;

    const handleChange = () => {
      const states = awareness.getStates();
      const typing: TypingUser[] = [];

      states.forEach((state, clientId) => {
        if (
          state.typing &&
          state.user?.userId &&
          state.user.userId !== userId &&
          clientId !== awareness.clientID
        ) {
          typing.push({
            userId: state.user.userId,
            userName: state.user.userName || 'Someone',
            userColor: state.user.userColor || '#6366f1',
          });
        }
      });

      setTypingUsers(typing);
    };

    awareness.on('change', handleChange);

    // Set initial local user info (not typing)
    awareness.setLocalStateField('user', {
      userId,
      userName,
      userColor,
    });
    awareness.setLocalStateField('typing', false);

    return () => {
      awareness.off('change', handleChange);
    };
  }, [provider, userId, userName, userColor]);

  // Broadcast that the local user is typing
  const broadcastTyping = useCallback(() => {
    if (!provider || !userId) return;

    const awareness = provider.awareness;
    awareness.setLocalStateField('typing', true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-clear typing after debounce
    typingTimeoutRef.current = setTimeout(() => {
      awareness.setLocalStateField('typing', false);
    }, debounceMs);
  }, [provider, userId, debounceMs]);

  // Clear typing state (e.g. on send)
  const clearTyping = useCallback(() => {
    if (!provider) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    provider.awareness.setLocalStateField('typing', false);
  }, [provider]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { typingUsers, broadcastTyping, clearTyping };
}
