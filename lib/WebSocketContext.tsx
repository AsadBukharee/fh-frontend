'use client';

import { useToast } from '@/app/Context/ToastContext';
import { createContext, useContext, useEffect, useState } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
});

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string; // ✅ optional now
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, token }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
const {showToast}=useToast();
  useEffect(() => {
    if (!token) {
      console.warn('No token found, skipping WebSocket connection');
      return;
    }

    let socket: WebSocket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000;

    const connect = () => {
      socket = new WebSocket(
                `ws://v2.fosterhartley.uk/ws/notifications/?token=${token}`

      );

      socket.onopen = () => {
        console.log('✅ Connected to WebSocket server');
        setIsConnected(true);
        reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          alert(
            data?.notification?.body||"Message Recived",
            
          )
          console.log('📩 Received:', data);
          
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      socket.onclose = () => {
        console.log('❌ Disconnected from WebSocket server');
        setIsConnected(false);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`🔄 Reconnecting attempt ${reconnectAttempts}...`);
          setTimeout(connect, reconnectDelay);
        }
      };

      socket.onerror = (error) => {
        console.error('⚠️ WebSocket error:', error);
        setIsConnected(false);
      };

      setWs(socket);
    };

    connect();

    return () => {
      socket?.close();
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
