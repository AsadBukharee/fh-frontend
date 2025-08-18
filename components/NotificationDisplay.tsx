
"use client";

import { useWebSocket } from "@/lib/WebSocketContext";
import { useToast } from "./ui/use-toast";
import { useState, useEffect } from "react";

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

const NotificationDisplay: React.FC = () => {
  const { ws, isConnected } = useWebSocket();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    console.log("WebSocket status:", { isConnected, ws: !!ws });
    if (ws) {
      ws.onmessage = (event) => {
        console.log("Raw WebSocket message received:", event.data);
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log("Parsed WebSocket message:", data);
          if (data.type === "notification") {
            setNotifications((prev) => {
              const exists = prev.some((notif) => notif.id === data.notification.id);
              console.log("Notification exists:", exists, "Notification ID:", data.notification.id);
              if (exists) {
                return prev.map((notif) =>
                  notif.id === data.notification.id ? data.notification : notif
                );
              }
              return [...prev, data.notification];
            });
            if (!data.notification.is_read) {
              console.log("Showing toast for notification:", data.notification);
              toast({
                title: data.notification.title,
                description: data.notification.body,
                variant: data.notification.type === "web_test" ? "default" : "default",
                duration: 5000,
              });
            }
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
          toast({
            title: "Error",
            description: "Failed to process notification",
            variant: "destructive",
            duration: 5000,
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to notifications server",
          variant: "destructive",
          duration: 5000,
        });
      };

      ws.onopen = () => {
        console.log("WebSocket connection opened");
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } else {
      console.warn("WebSocket instance is null");
    }

    // Cleanup
    return () => {
      if (ws) {
        ws.onmessage = null;
        ws.onerror = null;
        ws.onopen = null;
        ws.onclose = null;
      }
    };
  }, [ws, toast, isConnected]);

  const markAsRead = (notificationId: number) => {
    if (ws && isConnected) {
      console.log("Sending mark_read for notification ID:", notificationId);
      ws.send(JSON.stringify({ type: "mark_read", notification_id: notificationId }));
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } else {
      console.warn("Cannot mark as read: WebSocket not connected");
      toast({
        title: "Error",
        description: "Cannot mark notification as read: Not connected",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  console.log("Current notifications state:", notifications);

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Vehicle Management Notifications</h2>
      <p className="text-sm text-gray-600 mb-2">
        Status: {isConnected ? "Connected" : "Disconnected"}
      </p>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className={`p-3 rounded-md ${
                notif.is_read ? "bg-gray-200 opacity-70" : "bg-white"
              } border border-gray-300 flex justify-between items-center`}
            >
              <div>
                <strong className="text-blue-600">{notif.title}</strong>
                <p className="text-sm">{notif.body}</p>
                <p className="text-xs text-gray-500">
                  {new Date(notif.created_at).toLocaleString()} • Source: {notif.data.source}
                </p>
              </div>
              {!notif.is_read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationDisplay;
