'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({ ws: null, isConnected: false });

export const WebSocketProvider: React.FC<{ children: React.ReactNode; token: string }> = ({ children, token }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000;

    const connect = () => {
      socket = new WebSocket(`ws://v2.fosterhartley.uk/ws/notifications/?token=${token}`);

      socket.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        console.log('Received:', JSON.parse(event.data));
      };

      socket.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(connect, reconnectDelay);
          reconnectAttempts++;
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(socket);
    };

    connect();

    return () => {
      socket.close();
      setWs(null);
      setIsConnected(false);
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ ws, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);