"use client";

import { useState, useEffect, useRef } from "react";
import { SearchBar } from "./header/SearchBar";
import { UserProfileDropdown } from "./header/UserProfileDropdown";
import { Breadcrumbs } from "./header/Breadcrumbs";
import StateDialog from "./header/StateDialog";
import { AlertCircle, Bell, Calendar, ClipboardList, Footprints, Truck, User, Wrench } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCookies } from "next-client-cookies";
import { format } from "date-fns";
import API_URL from "@/app/utils/ENV";

// Define the shape of the API response
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

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    categories: {
      drivers: Notification[];
      vehicles: Notification[];
      walkarounds: Notification[];
      rotas: Notification[];
      duty_logs: Notification[];
      mechanic: Notification[];
      other: Notification[];
    };
    counts: {
      drivers: number;
      vehicles: number;
      walkarounds: number;
      rotas: number;
      duty_logs: number;
      mechanic: number;
      other: number;
    };
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      current_page: number;
      total_pages: number;
      page_size: number;
    };
  };
}

export function Header() {
  const categoryConfig = {
    all: { icon: Bell, label: "All", count: 0 },
    drivers: { icon: User, label: "Drivers", count: 0 },
    vehicles: { icon: Truck, label: "Vehicles", count: 0 },
    walkarounds: { icon: Footprints, label: "Walkarounds", count: 0 },
    rotas: { icon: Calendar, label: "Rotas", count: 0 },
    duty_logs: { icon: ClipboardList, label: "Duty Logs", count: 0 },
    mechanic: { icon: Wrench, label: "Mechanic", count: 0 },
    other: { icon: AlertCircle, label: "Other", count: 0 },
  };

  // State for API data, loading, error, and dropdown management
  const [notificationsData, setNotificationsData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<keyof typeof categoryConfig | null>(null);
  const badgeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cookies = useCookies();

  // Fetch notifications from the API
  useEffect(() => {
    const fetchNotifications = async (url: string = `${API_URL}/api/notification-inbox/?page=1`) => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data: ApiResponse = await response.json();
        setNotificationsData(data);
        setLoading(false);
      } catch (err) {
        setError("Error fetching notifications");
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [cookies]);

  // Handle pagination
  const handlePagination = async (url: string) => {
    try {
      setLoading(true);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data: ApiResponse = await response.json();
      setNotificationsData(data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching notifications");
      setLoading(false);
    }
  };

  // Get filtered notifications based on selected category
  const getFilteredNotifications = (category: keyof typeof categoryConfig) => {
    if (!notificationsData?.data.categories) return [];
    if (category === "all") {
      return Object.values(notificationsData.data.categories).flat();
    }
    return notificationsData.data.categories[category as keyof typeof notificationsData.data.categories] || [];
  };

  // Calculate notification counts for each category
  const notificationCounts = notificationsData?.data.counts || {
    drivers: 0,
    vehicles: 0,
    walkarounds: 0,
    rotas: 0,
    duty_logs: 0,
    mechanic: 0,
    other: 0,
  };

  // Update categoryConfig with counts
  const updatedCategoryConfig = Object.keys(categoryConfig).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        ...categoryConfig[key as keyof typeof categoryConfig],
        count: key === "all"
          ? Object.values(notificationCounts).reduce((sum, count) => sum + count, 0)
          : notificationCounts[key as keyof typeof notificationCounts] || 0,
      },
    }),
    {} as typeof categoryConfig
  );

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <SearchBar />
        </div>
        <div className="flex items-center space-x-4">
          {Object.entries(updatedCategoryConfig).map(([category, { icon: Icon, label, count }]) => (
            <DropdownMenu
              key={category}
              open={openDropdown === category}
              onOpenChange={(open) => setOpenDropdown(open ? (category as keyof typeof categoryConfig) : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative w-10 h-10 rounded-full flex justify-center items-center bg-gray-100 hover:bg-gray-300"
                  ref={(el) => {
                    badgeRefs.current[category] = el;
                  }}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                      {count}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 max-h-96 overflow-y-auto"
                align="start"
                sideOffset={4}
              >
                {loading ? (
                  <DropdownMenuItem className="text-center text-gray-500">
                    Loading notifications...
                  </DropdownMenuItem>
                ) : error ? (
                  <DropdownMenuItem className="text-center text-red-500">
                    {error}
                  </DropdownMenuItem>
                ) : (
                  <>
                    {getFilteredNotifications(category as keyof typeof categoryConfig).length === 0 ? (
                      <DropdownMenuItem className="text-center text-gray-500">
                        No notifications
                      </DropdownMenuItem>
                    ) : (
                      getFilteredNotifications(category as keyof typeof categoryConfig).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex flex-col items-start p-4 ${notification.is_read ? "bg-gray-50" : "bg-white"}`}
                        >
                          <div className="flex items-center space-x-2">
                            {notification.user.avatar && (
                              <img
                                src={notification.user.avatar}
                                alt={notification.user.full_name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-semibold">{notification.title}</p>
                              <p className="text-sm text-gray-600">{notification.body}</p>
                              <p className="text-xs text-gray-400">
                                {format(new Date(notification.created_at), "PPPp")}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                    {notificationsData?.data.pagination && (
                      <div className="flex justify-between p-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!notificationsData.data.pagination.previous}
                          onClick={() =>
                            notificationsData.data.pagination.previous &&
                            handlePagination(notificationsData.data.pagination.previous)
                          }
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!notificationsData.data.pagination.next}
                          onClick={() =>
                            notificationsData.data.pagination.next &&
                            handlePagination(notificationsData.data.pagination.next)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <StateDialog />
          <UserProfileDropdown />
        </div>
      </div>
      <Breadcrumbs />
    </header>
  );
}