// WebSocket hook for real-time workflow updates

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WorkflowUpdate } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const useWebSocket = (runId: string | null, onMessage: (update: WorkflowUpdate) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  // Update the ref when onMessage changes (without triggering reconnection)
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!runId) return;

    // Close existing socket if any
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('Closing existing WebSocket connection');
      socketRef.current.close();
    }

    // Create WebSocket connection
    const wsUrl = `${WS_URL}/ws/${runId}`;
    const socket = new WebSocket(wsUrl);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected:', runId);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const update: WorkflowUpdate = JSON.parse(event.data);
        console.log('WebSocket message received:', update);
        // Use the ref to always get the latest onMessage callback
        onMessageRef.current(update);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(heartbeat);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [runId]); // Removed onMessage from dependencies to prevent reconnection loops

  return { isConnected };
};
