/**
 * React hook for real-time command execution progress streaming via WebSocket
 * Reuses the same Socket.IO infrastructure as deployment log streaming
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface CommandStepUpdate {
  commandId: string;
  stepIndex: number;
  totalSteps: number;
  intent: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  timestamp: string;
}

export interface CommandProgressUpdate {
  commandId: string;
  percent: number;
  message: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
}

interface UseCommandProgressOptions {
  commandId: string | null;
  enabled?: boolean;
}

interface UseCommandProgressReturn {
  steps: CommandStepUpdate[];
  progress: CommandProgressUpdate | null;
  isConnected: boolean;
  error: string | null;
  reset: () => void;
}

export function useCommandProgress({
  commandId,
  enabled = true,
}: UseCommandProgressOptions): UseCommandProgressReturn {
  const [steps, setSteps] = useState<CommandStepUpdate[]>([]);
  const [progress, setProgress] = useState<CommandProgressUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevCommandIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !commandId) {
      return;
    }

    // Don't reconnect for the same command
    if (commandId === prevCommandIdRef.current && socketRef.current?.connected) {
      return;
    }

    // Get auth token
    const token = localStorage.getItem('token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      setError('Authentication token not found');
      return;
    }

    // Reset state for new command
    setSteps([]);
    setProgress(null);
    setError(null);
    prevCommandIdRef.current = commandId;

    // Connect to WebSocket server (reuses same Socket.IO server as deployment logs)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socketInstance = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socketInstance.emit('join-command', commandId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    socketInstance.on('joined-command', ({ commandId: joinedId }) => {
      console.log(`Joined command progress room: ${joinedId}`);
    });

    socketInstance.on('command-step', (data: CommandStepUpdate) => {
      setSteps(prev => {
        // Update existing step or add new one
        const existing = prev.findIndex(s => s.stepIndex === data.stepIndex);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    socketInstance.on('command-progress', (data: CommandProgressUpdate) => {
      setProgress(data);
    });

    socketInstance.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave-command', commandId);
        socketInstance.disconnect();
      }
      socketRef.current = null;
    };
  }, [commandId, enabled]);

  const reset = useCallback(() => {
    setSteps([]);
    setProgress(null);
    setError(null);
    prevCommandIdRef.current = null;
  }, []);

  return {
    steps,
    progress,
    isConnected,
    error,
    reset,
  };
}
