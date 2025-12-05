import { useEffect, useRef, useState, useCallback } from 'react';
import type { Card, WSMessage, WSAction } from '@/api/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';

interface UseWebSocketOptions {
  boardId: number;
  onMessage?: (message: WSMessage) => void;
  onInitialState?: (cards: Card[]) => void;
  onCardCreated?: (card: Card) => void;
  onCardUpdated?: (card: Card) => void;
  onCardMoved?: (card: Card) => void;
  onCardDeleted?: (data: { id: number; board_id: number }) => void;
}

export const useWebSocket = ({
  boardId,
  onMessage,
  onInitialState,
  onCardCreated,
  onCardUpdated,
  onCardMoved,
  onCardDeleted,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setConnectionError('No authentication token');
      return;
    }

    try {
      const ws = new WebSocket(`${WS_URL}/ws/boards/${boardId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          if (onMessage) {
            onMessage(message);
          }

          switch (message.type) {
            case 'initial_state':
              if (onInitialState && Array.isArray(message.data)) {
                onInitialState(message.data as Card[]);
              }
              break;
            case 'card.created':
              if (onCardCreated && !Array.isArray(message.data)) {
                onCardCreated(message.data as Card);
              }
              break;
            case 'card.updated':
              if (onCardUpdated && !Array.isArray(message.data)) {
                onCardUpdated(message.data as Card);
              }
              break;
            case 'card.moved':
              if (onCardMoved && !Array.isArray(message.data)) {
                onCardMoved(message.data as Card);
              }
              break;
            case 'card.deleted':
              if (onCardDeleted && !Array.isArray(message.data)) {
                onCardDeleted(message.data as { id: number; board_id: number });
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          setConnectionError('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [boardId, onMessage, onInitialState, onCardCreated, onCardUpdated, onCardMoved, onCardDeleted]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendAction = useCallback((action: WSAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    sendAction,
    reconnect: connect,
  };
};
