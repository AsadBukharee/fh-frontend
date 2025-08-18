'use client';

import { useWebSocket } from '@/lib/WebSocketContext';
import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string;
  data: { test: boolean; timestamp: string; source: string };
  is_read: boolean;
  created_at: string;
  source: string;
}

interface WebSocketMessage {
  type: string;
  notification: Notification;
  timestamp: string;
}

const NotificationComponent: React.FC = () => {
  const { ws, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data: WebSocketMessage = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications((prev) => [...prev, data.notification]);
        }
      };
    }
  }, [ws]);

  const sendTestMessage = () => {
    if (ws && isConnected && message.trim()) {
      ws.send(JSON.stringify({ type: 'test_message', body: message }));
      setMessage('');
    }
  };

  const markAsRead = (notificationId: number) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({ type: 'mark_read', notification_id: notificationId }));
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    }
  };

  return (
    <div>
      <h2>Notifications</h2>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <ul>
        {notifications.map((notif) => (
          <li key={notif.id} style={{ opacity: notif.is_read ? 0.5 : 1 }}>
            <strong>{notif.title}</strong>: {notif.body} ({notif.created_at})
            {!notif.is_read && (
              <button onClick={() => markAsRead(notif.id)}>Mark as Read</button>
            )}
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Send a test message"
        disabled={!isConnected}
      />
      <button onClick={sendTestMessage} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
};

export default NotificationComponent;