/**
 * React hook for real-time deployment log streaming via WebSocket
 */

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { DeploymentLog } from '../services/deployment-service';

interface UseDeploymentLogsOptions {
  deploymentId: string;
  enabled?: boolean;
}

interface UseDeploymentLogsReturn {
  logs: DeploymentLog[];
  isConnected: boolean;
  error: string | null;
  clearLogs: () => void;
}

export function useDeploymentLogs({
  deploymentId,
  enabled = true,
}: UseDeploymentLogsOptions): UseDeploymentLogsReturn {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !deploymentId) {
      return;
    }

    // Get auth token from localStorage or cookie
    const token = localStorage.getItem('token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      setError('Authentication token not found');
      return;
    }

    // Connect to WebSocket server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socketInstance = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      
      // Join deployment room
      socketInstance.emit('join-deployment', deploymentId);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    // Deployment-specific events
    socketInstance.on('joined-deployment', ({ deploymentId: joinedId }) => {
      console.log(`Joined deployment room: ${joinedId}`);
    });

    socketInstance.on('deployment-log', (log: DeploymentLog) => {
      console.log('Received log:', log);
      setLogs((prevLogs) => [...prevLogs, log]);
    });

    socketInstance.on('deployment-status', (data: any) => {
      console.log('Deployment status update:', data);
      // Could emit this to parent component if needed
    });

    socketInstance.on('deployment-event', (event: any) => {
      console.log('Deployment event:', event);
      // Could emit this to parent component if needed
    });

    socketInstance.on('error', (data: { message: string }) => {
      console.error('WebSocket error:', data.message);
      setError(data.message);
    });

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.emit('leave-deployment', deploymentId);
        socketInstance.disconnect();
      }
    };
  }, [deploymentId, enabled]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    isConnected,
    error,
    clearLogs,
  };
}
