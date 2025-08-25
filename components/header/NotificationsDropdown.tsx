"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { ApiResponse, Notification } from "@/app/lib/types";
import { useButtonMouseMove } from "@/app/lib/utils";
import { useCookies } from "next-client-cookies";
import API_URL from "@/app/utils/ENV";

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const handleMouseMove = useButtonMouseMove();
  const apiUrl =API_URL
  const token=useCookies().get("access_token")

  // Fetch notifications
  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiUrl}/api/notification-inbox/?page=${page}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        if (data.success) {
          setNotifications((prev) => (page === 1 ? data.data.results : [...prev, ...data.data.results]));
          setUnreadCount(data.data.stats.unread_count);
          setHasMore(!!data.data.pagination.next);
        } else {
          setError("Failed to fetch notifications");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Error fetching notifications");
        setIsLoading(false);
        console.error(err);
      });
  }, [page]);

  const filteredNotifications =
    activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter);

  const getFilterColor = (type: string) => {
    switch (type) {
      case "system":
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          className="relative cursor-pointer bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center"
          onMouseMove={handleMouseMove(buttonRef)}
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 opacity-50 hover:opacity-100 text-white text-xs font-semibold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Notifications</h3>
            <Badge variant="secondary">{filteredNotifications.length}</Badge>
          </div>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeFilter === "all" ? "default" : "secondary"}
              className={`cursor-pointer ripple ${
                activeFilter === "all" ? "bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant="secondary"
              className={`cursor-pointer ripple ${getFilterColor("system")} ${
                activeFilter === "system" ? "ring-2 ring-gray-300" : ""
              }`}
              onClick={() => setActiveFilter("system")}
            >
              System
            </Badge>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 && !isLoading && (
            <p className="p-4 text-gray-500">No notifications found.</p>
          )}
          {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
          {isLoading && <p className="p-4 text-gray-500">Loading...</p>}
          {hasMore && !isLoading && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setPage((prev) => prev + 1)}
            >
              Load More
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}