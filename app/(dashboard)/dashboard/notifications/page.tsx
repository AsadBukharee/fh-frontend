'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, CheckCheck, Clock, Check, X, TriangleAlert, ClockArrowUp } from "lucide-react";

// Define the notification type
interface NotificationCardProps {
  id: string;
  type: "approved" | "update" | "denied" | "alert";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  // State for notifications
  const [recentNotifications, setRecentNotifications] = useState<NotificationCardProps[]>([
    {
      id: "1",
      type: "approved",
      title: "Request Approved",
      description: "Your request for project access has been approved.",
      time: "2 hrs ago",
      read: false,
    },
    {
      id: "2",
      type: "update",
      title: "System Update",
      description: "System will undergo maintenance on July 16, 2025.",
      time: "3 hrs ago",
      read: false,
    },
    {
      id: "3",
      type: "denied",
      title: "Request Denied",
      description: "Your request for additional resources was denied.",
      time: "5 hrs ago",
      read: false,
    },
  ]);

  const [earlierNotifications, setEarlierNotifications] = useState<NotificationCardProps[]>([
    {
      id: "4",
      type: "alert",
      title: "Security Alert",
      description: "Unusual login attempt detected on your account.",
      time: "1 day ago",
      read: false,
    },
  ]);

  // State for active filter
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Function to mark a single notification as read
  const markAsRead = (id: string, isRecent: boolean) => {
    if (isRecent) {
      setRecentNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    } else {
      setEarlierNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    setRecentNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setEarlierNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  // Function to filter notifications
  const filteredRecentNotifications =
    activeFilter === "all"
      ? recentNotifications
      : recentNotifications.filter((notif) => notif.type === activeFilter);

  const filteredEarlierNotifications =
    activeFilter === "all"
      ? earlierNotifications
      : earlierNotifications.filter((notif) => notif.type === activeFilter);

  // Calculate badge counts
  const getBadgeCount = (type: string) => {
    if (type === "all") {
      return recentNotifications.length + earlierNotifications.length;
    }
    return (
      recentNotifications.filter((notif) => notif.type === type).length +
      earlierNotifications.filter((notif) => notif.type === type).length
    );
  };

  return (
    <div className="container mx-auto bg-white px-4 py-8 md:px-6 lg:px-8 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">See all your notifications here</p>
        </div>
        <Button
          
          className="flex items-center gap-2 shadow-md outlin-1 outline-gray-100 bg-transparent"
          onClick={() => setActiveFilter("all")}
        >
          <Filter className="w-4 h-4" />
          Clear Filter
        </Button>
      </div>

      {/* Categories and Mark as Read */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === "all"
                  ? "border-red-500 text-red-500 bg-red-50"
                  : "border-0 text-red-500 bg-red-100"
              }`}
              onClick={() => setActiveFilter("all")}
            >
                <span>See All</span>
  <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
    {getBadgeCount("all")}
  </span>
             
            </Badge>
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === "approved"
                  ? "border-green-500 text-green-500 bg-green-50"
                  : "text-green-500 bg-green-100 border-0"
              }`}
              onClick={() => setActiveFilter("approved")}
            >
                <span>Requests</span>
                <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                    {getBadgeCount("approved")}
                </span>
             
            </Badge>
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === "update"
                  ? "border-pink-500 text-pink-500 bg-pink-50"
                  : "text-pink-500 bg-pink-100 border-0"
              }`}
              onClick={() => setActiveFilter("update")}
            >
                <span>Updates</span>
                <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                    {getBadgeCount("update")}
                </span>
            </Badge>
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === "alert"
                  ? "border-orange-500 text-orange-500 bg-orange-50"
                  : "text-orange-500  border-0 bg-orange-100"
              }`}
              onClick={() => setActiveFilter("alert")}
            >
                <span>Alerts</span>
                <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                    {getBadgeCount("alert")}
                </span>
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          className="flex items-center gap-2 self-start md:self-auto"
          onClick={markAllAsRead}
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[calc(100vh-250px)] pr-4">
        <h3 className="text-xl font-semibold mb-4">Recent</h3>
        <div className="grid gap-4 mb-8">
          {filteredRecentNotifications.length > 0 ? (
            filteredRecentNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                {...notification}
                onMarkAsRead={() => markAsRead(notification.id, true)}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No recent notifications</p>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-4">Earlier</h3>
        <div className="grid gap-4">
          {filteredEarlierNotifications.length > 0 ? (
            filteredEarlierNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                {...notification}
                onMarkAsRead={() => markAsRead(notification.id, false)}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No earlier notifications</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface NotificationCardPropsWithAction extends NotificationCardProps {
  onMarkAsRead: () => void;
}

function NotificationCard({
  type,
  title,
  description,
  time,
  read,
  onMarkAsRead,
}: NotificationCardPropsWithAction) {
  const iconMap = {
    approved: <span className="bg-green-100 p-1 rounded-full"><Check className="w-5 h-5 text-green-500" /></span>,
    update: <span className="bg-blue-100 p-1 rounded-full"><ClockArrowUp  className="w-5 h-5 text-blue-500" /></span>,
    denied: <span className="bg-red-100 p-1 rounded-full"><X className="w-5 h-5 text-red-500" /></span>,
    alert: <span className="bg-orange-100 p-1 rounded-full"><TriangleAlert  className="w-5 h-5 text-orange-500" /></span>,
  };

  return (
    <Card
      className="p-4 flex items-start gap-4 relative cursor-pointer hover:bg-gray-50"
      onClick={onMarkAsRead}
    >
      <div className="flex-shrink-0 mt-1 w-10 h-10 flex items-center justify-center">{iconMap[type]}</div>
      <div className="flex-grow">
        <h4 className="font-medium text-base">{title}</h4>
        <p className="text-sm text-muted-foreground mb-1">{description}</p>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {time}
        </div>
      </div>
      {!read && (
        <div
          className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full absolute top-4 right-4"
          aria-label="Unread notification"
        ></div>
      )}
    </Card>
  );
}