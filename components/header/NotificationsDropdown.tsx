"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming a utility for className concatenation
import { Button } from "../ui/button";

// Define Notification type (same as in Header.tsx)
interface Notification {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    avatar: string | null;
  };
  roles: string[];
  title: string;
  body: string;
  type: string;
  category: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_by: null | any;
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
    current_page: number;
    total_pages: number;
    page_size: number;
  };
  onPaginate: (url: string) => void;
  selectedCategory: string;
}

export function NotificationsDropdown({ notifications, pagination, onPaginate, selectedCategory }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications dropdown"
      >
        <Bell className="w-5 h-5" />
        <span className="hidden sm:inline">Notifications</span>
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
            {notifications.length}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Notifications
            </h3>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">No notifications available</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50",
                    notification.is_read ? "bg-gray-100" : "bg-white"
                  )}
                >
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString("en-GB", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    From: {notification.user.full_name} ({notification.user.role})
                  </p>
                </li>
              ))}
            </ul>
          )}
          {pagination && (
            <div className="p-4 border-t flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.previous}
                onClick={() => pagination.previous && onPaginate(pagination.previous)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.next}
                onClick={() => pagination.next && onPaginate(pagination.next)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}