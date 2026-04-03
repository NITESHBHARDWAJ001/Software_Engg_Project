import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface DashboardUpdate {
  updateType: string;
  timestamp: string;
  data: any;
}

interface ScrapeComplete {
  status: string;
  timestamp: string;
  data: any;
}

export const useDashboardWebSocket = (orgId: string, enabled: boolean = true) => {
  const socketRef = useRef<Socket | null>(null);
  const connectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) return;

    try {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        console.log('[useDashboardWebSocket] Connected, subscribing to dashboard:', orgId);
        socketRef.current?.emit('subscribe:dashboard', orgId);
      });

      socketRef.current.on('scrape:complete', (data: ScrapeComplete) => {
        console.log('[useDashboardWebSocket] Scrape complete:', data);
        // Trigger dashboard refresh
        window.dispatchEvent(
          new CustomEvent('dashboard:scrape-complete', { detail: data })
        );
      });

      socketRef.current.on('dashboard:update', (data: DashboardUpdate) => {
        console.log('[useDashboardWebSocket] Dashboard update:', data);
        window.dispatchEvent(
          new CustomEvent('dashboard:update', { detail: data })
        );
      });

      socketRef.current.on('disconnect', () => {
        console.log('[useDashboardWebSocket] Disconnected from WebSocket');
      });

      socketRef.current.on('error', (error) => {
        console.error('[useDashboardWebSocket] WebSocket error:', error);
      });
    } catch (error) {
      console.error('[useDashboardWebSocket] Failed to connect:', error);
      // Retry connection after delay
      connectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [orgId, enabled]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe:dashboard', orgId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
    }
  }, [orgId]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connected: socketRef.current?.connected || false,
    socket: socketRef.current,
  };
};
