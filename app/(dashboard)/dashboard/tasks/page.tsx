"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCookies } from "next-client-cookies"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Filter,
  CheckCheck,
  Clock,
  Check,
  X,
  TriangleAlert,
  CircleArrowUp as ClockArrowUp,
  Search,
  Bell,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import API_URL from "@/app/utils/ENV"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface FilterState {
  type: string
  role: string
  userName: string
  status: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

interface ApiNotificationData {
  category?: string
  vehicle_id?: number
  registration?: string
  action?: string
  user_id?: number
  [key: string]: any
}

interface ApiUser {
  id: number
  email: string
  full_name: string
  role: string
  avatar: string | null
}

interface ApiNotification {
  id: number
  title: string
  body: string
  type: string
  category?: string
  data: ApiNotificationData
  is_read: boolean
  created_at: string
  user: ApiUser
  roles: string[]
  read_by: any
}

interface NotificationCardProps {
  id: string
  type: "approved" | "update" | "denied" | "alert"
  title: string
  description: string
  time: string
  created_at: string
  read: boolean
  navigation_path?: string
}

interface NotificationCardPropsWithAction extends NotificationCardProps {
  onMarkAsRead: () => void
}

export default function NotificationsPage() {
  const [rawNotifications, setRawNotifications] = useState<ApiNotification[]>([])
  const [categories, setCategories] = useState<Record<string, ApiNotification[]>>({})
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [loading, setLoading] = useState<boolean>(false)
  const [initialLoading, setInitialLoading] = useState<boolean>(true)
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [markingRead, setMarkingRead] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const token = useCookies().get("access_token")
  const notificationIds = useMemo(() => new Set<string>(), [])
  const router = useRouter()

  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    role: "all",
    userName: "",
    status: "all",
    dateFrom: undefined,
    dateTo: undefined,
  })

  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== "all" ||
      filters.role !== "all" ||
      filters.userName !== "" ||
      filters.status !== "all" ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined
    )
  }, [filters])

  const mapNotificationType = (apiNotification: ApiNotification): NotificationCardProps["type"] => {
    if (apiNotification.type === "profile_status") {
      return apiNotification.data.new_status === "approved" ? "approved" : "denied"
    }
    if (apiNotification.type === "system") {
      return apiNotification.title.toLowerCase().includes("alert") ? "alert" : "update"
    }
    return "update"
  }

  const getNavigationPath = (data: ApiNotificationData): string | undefined => {
    if (data.category === "vehicle_event" && data.vehicle_id) {
      return `/vehicles/${data.vehicle_id}`
    }
    if (data.action === "user_updated" || data.action === "user_login") {
      return `/users/${data.user_id}`
    }
    return undefined
  }

  const normalizeNextPageUrl = (url: string | null): string | null => {
    if (!url) return null
    try {
      const baseUrl = new URL(API_URL)
      const nextUrl = new URL(url, baseUrl)
      return nextUrl.toString()
    } catch {
      console.warn("Invalid next page URL:", url)
      return null
    }
  }

  const fetchNotifications = useCallback(
    async (url: string) => {
      if (loading || !token) return
      setLoading(true)
      setError(null)
      try {
        console.log("Fetching notifications from:", url)
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) {
          if (response.status === 401) throw new Error("Please log in again.")
          if (response.status === 404) throw new Error("Notifications not found.")
          throw new Error(`HTTP error ${response.status}`)
        }
        const data = await response.json()
        console.log("API response:", data)
        if (data.success) {
          const allCategories: Record<string, ApiNotification[]> = data.data.categories || {}
          setCategories(allCategories)

          const allNotifications: ApiNotification[] = Object.values(allCategories).flat()
          const newNotifications = allNotifications.filter(
            (item: ApiNotification) => !notificationIds.has(item.id.toString()),
          )
          setRawNotifications((prev) => [...prev, ...newNotifications])
          newNotifications.forEach((n) => notificationIds.add(n.id.toString()))
          setNextPage(normalizeNextPageUrl(data.data.pagination?.next || null))
        } else {
          throw new Error(data.message || "Failed to load notifications")
        }
      } catch (error: any) {
        console.error("Fetch error:", error)
        setError(error.message || "An unexpected error occurred while fetching notifications.")
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    },
    [loading, token, notificationIds],
  )

  const resetNotifications = useCallback(() => {
    notificationIds.clear()
    setRawNotifications([])
    setCategories({})
    fetchNotifications(`${API_URL}/api/notification-inbox/?page=1`)
  }, [notificationIds])

  const markAsRead = async (id: string) => {
    if (markingRead.includes(id)) return
    setMarkingRead((prev) => [...prev, id])
    const original = [...rawNotifications]
    setRawNotifications((prev) => prev.map((n) => (n.id.toString() === id ? { ...n, is_read: true } : n)))
    try {
      console.log(`Marking notification ${id} as read`)
      const res = await fetch(`${API_URL}/api/notifications/${id}/mark-read/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to mark notification ${id} as read. Status: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Mark as read error:", error)
      setRawNotifications(original)
      setError("Failed to mark notification as read.")
    } finally {
      setMarkingRead((prev) => prev.filter((m) => m !== id))
    }
  }

  const markAllAsRead = async () => {
    if (markingRead.includes("all")) return
    setMarkingRead((prev) => [...prev, "all"])
    const original = [...rawNotifications]
    setRawNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      console.log("Marking all notifications as read")
      const res = await fetch(`${API_URL}/api/notifications/mark-all-read/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to mark all notifications as read. Status: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Mark all as read error:", error)
      setRawNotifications(original)
      setError("Failed to mark all notifications as read.")
    } finally {
      setMarkingRead((prev) => prev.filter((m) => m !== "all"))
    }
  }

  const clearAllFilters = () => {
    setFilters({
      type: "all",
      role: "all",
      userName: "",
      status: "all",
      dateFrom: undefined,
      dateTo: undefined,
    })
    setActiveFilter("all")
  }

  useEffect(() => {
    if (token) {
      resetNotifications()
    } else {
      setError("Please log in to view notifications.")
      setInitialLoading(false)
    }
  }, [token, resetNotifications])

  const filteredNotifications = useMemo(() => {
    let filtered = rawNotifications

    if (activeFilter !== "all") {
      filtered = categories[activeFilter] || []
    }

    filtered = filtered.filter((notif) => {
      const createdAt = new Date(notif.created_at)
      return (
        (filters.type === "all" || mapNotificationType(notif) === filters.type) &&
        (filters.role === "all" || notif.user.role === filters.role) &&
        (filters.userName === "" || notif.user.full_name.toLowerCase().includes(filters.userName.toLowerCase())) &&
        (filters.status === "all" || (filters.status === "read" ? notif.is_read : !notif.is_read)) &&
        (!filters.dateFrom || createdAt >= filters.dateFrom) &&
        (!filters.dateTo || createdAt <= filters.dateTo)
      )
    })

    return filtered.map((item) => {
      const createdAt = new Date(item.created_at)
      return {
        id: item.id.toString(),
        type: mapNotificationType(item),
        title: item.title,
        description: item.body,
        time:
          createdAt.getTime() > Date.now() - 60000 ? "Just now" : formatDistanceToNow(createdAt, { addSuffix: true }),
        created_at: item.created_at,
        read: item.is_read,
        navigation_path: getNavigationPath(item.data),
      }
    })
  }, [rawNotifications, activeFilter, categories, filters])

  const allNotifications = useMemo(() => Object.values(categories).flat(), [categories])
  const getBadgeCount = (key: string) => {
    if (key === "all") {
      return allNotifications.filter((n) => !n.is_read).length
    }
    return (categories[key] || []).filter((n) => !n.is_read).length
  }

  const loadMore = useCallback(() => {
    if (nextPage && !loading) fetchNotifications(nextPage)
  }, [nextPage, loading, fetchNotifications])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Stay updated with your activity</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getBadgeCount("all")}</div>
              <p className="text-xs text-muted-foreground">Unread</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-full">
        {error && (
          <div className="mb-6 p-4 bg-destructive/5 text-destructive rounded-lg flex justify-between items-center border border-destructive/20 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium">{error}</span>
            <Button variant="ghost" size="sm" onClick={resetNotifications} disabled={loading}>
              Retry
            </Button>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 w-full sm:w-auto"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter((v) => v && v !== "all").length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearAllFilters} disabled={loading} className="w-full sm:w-auto">
              Clear All
            </Button>
          )}
        </div>

        {showFilters && (
          <Card className="mb-6 p-6 border border-border/40 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Notification Type</label>
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">User Role</label>
                <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">User Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search user..."
                    value={filters.userName}
                    onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
                    className="pl-10 bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50",
                        !filters.dateFrom && "text-muted-foreground",
                      )}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? formatDistanceToNow(filters.dateFrom, { addSuffix: false }) : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50",
                        !filters.dateTo && "text-muted-foreground",
                      )}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {filters.dateTo ? formatDistanceToNow(filters.dateTo, { addSuffix: false }) : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer px-3 py-2 text-sm font-medium transition-all hover:border-primary/50"
              onClick={() => setActiveFilter("all")}
            >
              All
              <span className="ml-2 inline-flex items-center justify-center bg-background/50 px-2 py-0.5 rounded text-xs font-bold">
                {getBadgeCount("all")}
              </span>
            </Badge>

            {Object.keys(categories).map((key) => (
              <Badge
                key={key}
                variant={activeFilter === key ? "default" : "outline"}
                className="cursor-pointer px-3 py-2 text-sm font-medium capitalize transition-all hover:border-primary/50"
                onClick={() => setActiveFilter(key)}
              >
                {key.replace("_", " ")}
                <span className="ml-2 inline-flex items-center justify-center bg-background/50 px-2 py-0.5 rounded text-xs font-bold">
                  {getBadgeCount(key)}
                </span>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {filteredNotifications.length} {filteredNotifications.length === 1 ? "Notification" : "Notifications"}
          </h3>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto bg-transparent"
            onClick={markAllAsRead}
            disabled={markingRead.includes("all") || loading || filteredNotifications.length === 0}
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
        </div>

        {initialLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground font-medium">Loading notifications...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              <>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-3 pr-4">
                    {filteredNotifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className="animate-in fade-in slide-in-from-top-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <NotificationCard {...notification} onMarkAsRead={() => markAsRead(notification.id)} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No notifications found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              </div>
            )}
          </div>
        )}

        {nextPage && !initialLoading && (
          <Button className="mt-8 w-full bg-transparent" onClick={loadMore} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Load More Notifications"}
          </Button>
        )}

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Snooze functionality coming soon. Contact support for updates.
        </p>
      </div>
    </div>
  )
}

function NotificationCard({
  type,
  title,
  description,
  time,
  read,
  onMarkAsRead,
  navigation_path,
}: NotificationCardPropsWithAction) {
  const router = useRouter()

  const typeConfig = {
    approved: {
      icon: <Check className="w-5 h-5" />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
      borderColor: "border-emerald-200 dark:border-emerald-800/50",
    },
    update: {
      icon: <ClockArrowUp className="w-5 h-5" />,
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
      borderColor: "border-blue-200 dark:border-blue-800/50",
    },
    denied: {
      icon: <X className="w-5 h-5" />,
      bgColor: "bg-red-50 dark:bg-red-950/30",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconColor: "text-red-600 dark:text-red-400",
      badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
      borderColor: "border-red-200 dark:border-red-800/50",
    },
    alert: {
      icon: <TriangleAlert className="w-5 h-5" />,
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-200 dark:border-amber-800/50",
    },
  }

  const config = typeConfig[type]

  const handleClick = () => {
    if (!read) {
      onMarkAsRead()
    }
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "p-4 flex items-start gap-4 cursor-pointer transition-all duration-200 border-2",
          read
            ? "bg-card border-border/40 hover:border-primary/30 hover:shadow-sm"
            : `${config.bgColor} ${config.borderColor} hover:shadow-md hover:border-primary/50`,
        )}
        onClick={handleClick}
      >
        {/* Icon */}
        <div className={cn("flex-shrink-0 mt-1 w-10 h-10 flex items-center justify-center rounded-lg", config.iconBg)}>
          <span className={config.iconColor}>{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-grow">
              <h4 className="font-semibold text-foreground text-sm md:text-base line-clamp-2">{title}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
            </div>
            {!read && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold", config.badge)}>
                    New
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as read</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center text-xs text-muted-foreground mt-3">
            <Clock className="w-3 h-3 mr-1.5" />
            {time}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  )
}
