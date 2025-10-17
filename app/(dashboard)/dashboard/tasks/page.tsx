'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Filter,
  CheckCheck,
  Clock,
  Check,
  X,
  TriangleAlert,
  ClockArrowUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

// Define API response types
interface ApiNotificationData {
  action?: string;
  category?: string;
  new_status?: string;
  site_ids?: number[];
  pmi_id?: number;
  vehicle_id?: number;
  vehicle_reg?: string;
  analysis_date?: string;
  pmi_driver_id?: number;
  pmi_analysis_id?: number;
  [key: string]: any;
}

interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

interface ApiNotification {
  id: number;
  title: string;
  body: string;
  type: string;
  category?: string;
  data: ApiNotificationData;
  is_read: boolean;
  created_at: string;
  user: ApiUser;
  roles: string[];
  read_by: any;
}

// Define UI notification type
interface NotificationCardProps {
  id: string;
  type: 'approved' | 'update' | 'denied' | 'alert';
  title: string;
  description: string;
  time: string;
  created_at: string;
  read: boolean;
}

interface NotificationCardPropsWithAction extends NotificationCardProps {
  onMarkAsRead: () => void;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationCardProps[]>([]);
  const [categories, setCategories] = useState<Record<string, ApiNotification[]>>({});
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string[]>([]);
  const token = useCookies().get('access_token');
  const notificationIds = useMemo(() => new Set<string>(), []);

  // Map API notification type to UI type
  const mapNotificationType = (apiNotification: ApiNotification): NotificationCardProps['type'] => {
    if (apiNotification.type === 'profile_status') {
      return apiNotification.data.new_status === 'approved' ? 'approved' : 'denied';
    }
    if (apiNotification.type === 'system') {
      return apiNotification.title.toLowerCase().includes('alert') ? 'alert' : 'update';
    }
    return 'update';
  };

  // Normalize pagination URL
  const normalizeNextPageUrl = (url: string | null): string | null => {
    if (!url) return null;
    try {
      const baseUrl = new URL(API_URL);
      const nextUrl = new URL(url, baseUrl);
      return nextUrl.toString();
    } catch {
      console.warn('Invalid next page URL:', url);
      return null;
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (url: string) => {
      if (loading || !token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          if (response.status === 401) throw new Error('Please log in again.');
          if (response.status === 404) throw new Error('Notifications not found.');
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          const allCategories: Record<string, ApiNotification[]> = data.data.categories || {};
          setCategories(allCategories);

          const allNotifications: ApiNotification[] = Object.values(allCategories).flat();

          const mappedNotifications: NotificationCardProps[] = allNotifications
            .filter((item: ApiNotification) => !notificationIds.has(item.id.toString()))
            .map((item: ApiNotification) => {
              const createdAt = new Date(item.created_at);
              return {
                id: item.id.toString(),
                type: mapNotificationType(item),
                title: item.title,
                description: item.body,
                time:
                  createdAt.getTime() > Date.now() - 60000
                    ? 'Just now'
                    : formatDistanceToNow(createdAt, { addSuffix: true }),
                created_at: item.created_at,
                read: item.is_read,
              };
            });

          setNotifications((prev) => [...prev, ...mappedNotifications]);
          mappedNotifications.forEach((n) => notificationIds.add(n.id));
          setNextPage(normalizeNextPageUrl(data.data.pagination?.next || null));
        } else {
          throw new Error(data.message || 'Failed to load notifications');
        }
      } catch (error: any) {
        setError(error.message || 'An unexpected error occurred while fetching notifications.');
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [loading, token, notificationIds]
  );

  // Reset notifications and fetch first page
  const resetNotifications = useCallback(() => {
    notificationIds.clear();
    setNotifications([]);
    fetchNotifications(`${API_URL}/api/notification-inbox/?page=1`);
  }, [fetchNotifications, notificationIds]);

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    if (markingRead.includes(id)) return;
    setMarkingRead((prev) => [...prev, id]);
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/mark-read/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Failed to mark notification ${id} as read.`);
    } catch {
      setNotifications(original);
      setError('Failed to mark notification as read.');
    } finally {
      setMarkingRead((prev) => prev.filter((m) => m !== id));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (markingRead.includes('all')) return;
    setMarkingRead((prev) => [...prev, 'all']);
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await fetch(`${API_URL}/api/notifications/mark-all-read/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to mark all notifications as read.');
    } catch {
      setNotifications(original);
      setError('Failed to mark all notifications as read.');
    } finally {
      setMarkingRead((prev) => prev.filter((m) => m !== 'all'));
    }
  };

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchNotifications(`${API_URL}/api/notification-inbox/?page=1`);
    } else {
      setError('Please log in to view notifications.');
      setInitialLoading(false);
      // Optionally redirect: window.location.href = '/login';
    }
  }, [token]);

  // Filter notifications by category
  const filteredNotifications = useMemo(
    () =>
      activeFilter === 'all'
        ? notifications
        : notifications.filter((notif) =>
            categories[activeFilter]?.some((c) => c.id.toString() === notif.id)
          ),
    [notifications, activeFilter, categories]
  );

  // Calculate badge counts efficiently
  const allNotifications = useMemo(() => Object.values(categories).flat(), [categories]);
  const getBadgeCount = (key: string) =>
    key === 'all' ? allNotifications.length : (categories[key] || []).length;

  // Load more notifications
  const loadMore = useCallback(() => {
    if (nextPage && !loading) fetchNotifications(nextPage);
  }, [nextPage, loading, fetchNotifications]);

  return (
    <div className="container mx-auto bg-white px-4 py-8 md:px-6 lg:px-8 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">See all your notifications here</p>
        </div>
        <Button
          className="flex items-center border border-gray-300 text-black hover:text-white gap-2 shadow-md outline-1 outline-gray-100 bg-transparent"
          onClick={() => {
            setActiveFilter('all');
            resetNotifications();
          }}
          disabled={loading}
        >
          <Filter className="w-4 h-4" />
          Clear Filter
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          {error}
          <Button
            variant="ghost"
            onClick={resetNotifications}
            disabled={loading}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Category badges */}
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
              All
              <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                {getBadgeCount('all')}
              </span>
            </Badge>

            {Object.keys(categories).map((key) => (
              <Badge
                key={key}
                variant="outline"
                className={`cursor-pointer capitalize ${
                  activeFilter === key
                    ? 'border-green-500 text-green-500 bg-green-50'
                    : 'text-green-500 bg-green-100 border-0'
                }`}
                onClick={() => setActiveFilter(key)}
              >
                {key.replace('_', ' ')}
                <span className="flex items-center justify-center ml-1 bg-white p-1 w-5 h-5 rounded-full text-xs">
                  {getBadgeCount(key)}
                </span>
              </Badge>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          className="flex items-center gap-2 self-start md:self-auto"
          onClick={markAllAsRead}
          disabled={markingRead.includes('all') || loading}
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </Button>
      </div>

      {initialLoading ? (
        <p className="text-muted-foreground">Loading notifications...</p>
      ) : (
        <div className="grid gap-4">
          {filteredNotifications.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-200px)]">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))}
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No notifications found</p>
          )}
        </div>
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
    </div>
  );
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
          title="Unread notification"
        ></div>
      )}
    </Card>
  );
}