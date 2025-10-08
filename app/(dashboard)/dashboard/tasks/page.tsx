'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, CheckCheck, Clock, Check, X, TriangleAlert, ClockArrowUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

// Define the notification type
interface NotificationCardProps {
  id: string;
  type: 'approved' | 'update' | 'denied' | 'alert';
  title: string;
  description: string;
  time: string;
  created_at: string;
  read: boolean;
}

// API response type
interface ApiNotification {
  id: number;
  title: string;
  body: string;
  type: string;
  data: {
    new_status?: string;
    event_type?: string;
    [key: string]: any;
  };
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationCardProps[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = useCookies().get('access_token');
  const notificationIds = new Set(notifications.map((n) => n.id)); // For duplicate checking

  // Map API notification type to component type
  const mapNotificationType = (apiNotification: ApiNotification): NotificationCardProps['type'] => {
    if (apiNotification.type === 'profile_status') {
      return apiNotification.data.new_status === 'approved' ? 'approved' : 'denied';
    }
    if (apiNotification.type === 'system') {
      return apiNotification.title.toLowerCase().includes('alert') ? 'alert' : 'update';
    }
    return 'update';
  };

  // Normalize nextPage URL
  const normalizeNextPageUrl = (url: string | null): string | null => {
    if (!url) return null;
    const baseUrl = new URL(API_URL);
    const nextUrl = new URL(url);
    return `${baseUrl.origin}${nextUrl.pathname}${nextUrl.search}`;
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (url: string) => {
    if (loading || !token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid or expired token. Please log in again.');
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        const mappedNotifications: NotificationCardProps[] = data.data.results
          .filter((item: ApiNotification) => !notificationIds.has(item.id.toString()))
          .map((item: ApiNotification) => ({
            id: item.id.toString(),
            type: mapNotificationType(item),
            title: item.title,
            description: item.body,
            time: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
            created_at: item.created_at,
            read: item.is_read,
          }));

        setNotifications((prev) => [...prev, ...mappedNotifications]);
        mappedNotifications.forEach((n) => notificationIds.add(n.id));
        setNextPage(normalizeNextPageUrl(data.data.pagination.next));
      } else {
        throw new Error(data.message || 'API request failed');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [loading, token, notificationIds]);

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    const originalNotifications = [...notifications];
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}/mark-read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to mark notification ${id} as read`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(originalNotifications); // Revert on failure
      setError('Failed to mark notification as read.');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const originalNotifications = [...notifications];
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setNotifications(originalNotifications); // Revert on failure
      setError('Failed to mark all notifications as read.');
    }
  };

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchNotifications(`${API_URL}/api/notification-inbox/?page=1`);
    } else {
      setError('No access token found. Please log in.');
      setInitialLoading(false);
    }
  }, [token]);

  // Filter notifications
  const filteredNotifications =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((notif) => notif.type === activeFilter);

  // Separate recent and earlier notifications
  const recentNotifications = filteredNotifications.filter(
    (notif) => new Date().getTime() - new Date(notif.created_at).getTime() < 24 * 60 * 60 * 1000
  );
  const earlierNotifications = filteredNotifications.filter(
    (notif) => new Date().getTime() - new Date(notif.created_at).getTime() >= 24 * 60 * 60 * 1000
  );

  // Calculate badge counts
  const getBadgeCount = (type: string) => {
    if (type === 'all') {
      return notifications.length;
    }
    return notifications.filter((notif) => notif.type === type).length;
  };

  // Load more notifications
  const loadMore = useCallback(() => {
    if (nextPage && !loading) {
      fetchNotifications(nextPage);
    }
  }, [nextPage, loading, fetchNotifications]);

  return (
    <div className="container mx-auto bg-white px-4 py-8 md:px-6 lg:px-8 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">See all your notifications here</p>
        </div>
        <Button
          className="flex items-center border border-gray-300 text-black hover:text-white gap-2 shadow-md outline-1 outline-gray-100 bg-transparent"
          onClick={() => setActiveFilter('all')}
        >
          <Filter className="w-4 h-4" />
          Clear Filter
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          {error}
          <Button variant="ghost" onClick={() => fetchNotifications(`${API_URL}/api/notification-inbox/?page=1`)}>
            Retry
          </Button>
        </div>
      )}

      {/* Categories and Mark as Read */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === 'all'
                  ? 'border-red-500 text-red-500 bg-red-50'
                  : 'border-0 text-red-500 bg-red-100'
              }`}
              onClick={() => setActiveFilter('all')}
            >
              <span>See All</span>
              <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                {getBadgeCount('all')}
              </span>
            </Badge>
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === 'approved'
                  ? 'border-green-500 text-green-500 bg-green-50'
                  : 'text-green-500 bg-green-100 border-0'
              }`}
              onClick={() => setActiveFilter('approved')}
            >
              <span>Requests</span>
              <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                {getBadgeCount('approved')}
              </span>
            </Badge>
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === 'update'
                  ? 'border-pink-500 text-pink-500 bg-pink-50'
                  : 'text-pink-500 bg-pink-100 border-0'
              }`}
              onClick={() => setActiveFilter('update')}
            >
              <span>Updates</span>
              <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                {getBadgeCount('update')}
              </span>
            </Badge>
            <Badge
              variant="outline"
              className={`cursor-pointer ${
                activeFilter === 'alert'
                  ? 'border-orange-500 text-orange-500 bg-orange-50'
                  : 'text-orange-500 border-0 bg-orange-100'
              }`}
              onClick={() => setActiveFilter('alert')}
            >
              <span>Alerts</span>
              <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                {getBadgeCount('alert')}
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
        {initialLoading ? (
          <p className="text-muted-foreground">Loading notifications...</p>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-4">Recent</h3>
            <div className="grid gap-4 mb-8">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    {...notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No recent notifications</p>
              )}
            </div>

            <h3 className="text-xl font-semibold mb-4">Earlier</h3>
            <div className="grid gap-4">
              {earlierNotifications.length > 0 ? (
                earlierNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    {...notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No earlier notifications</p>
              )}
            </div>
          </>
        )}

        {nextPage && !initialLoading && (
          <Button
            className="mt-4 w-full"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        )}
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
    approved: (
      <span className="bg-green-100 p-1 rounded-full">
        <Check className="w-5 h-5 text-green-500" />
      </span>
    ),
    update: (
      <span className="bg-blue-100 p-1 rounded-full">
        <ClockArrowUp className="w-5 h-5 text-blue-500" />
      </span>
    ),
    denied: (
      <span className="bg-red-100 p-1 rounded-full">
        <X className="w-5 h-5 text-red-500" />
      </span>
    ),
    alert: (
      <span className="bg-orange-100 p-1 rounded-full">
        <TriangleAlert className="w-5 h-5 text-orange-500" />
      </span>
    ),
  };

  return (
    <Card
      className="p-4 flex items-start gap-4 relative cursor-pointer hover:bg-gray-50"
      onClick={onMarkAsRead}
    >
      <div className="flex-shrink-0 mt-1 w-10 h-10 flex items-center justify-center">
        {iconMap[type]}
      </div>
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