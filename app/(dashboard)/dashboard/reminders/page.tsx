"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, ClockIcon, PlusIcon, BellIcon, CheckIcon, XIcon, PauseIcon } from "lucide-react"

// Types
interface User {
  id: number
  email: string
  full_name: string
  role: string
  avatar: string | null
  username: string
}

interface Reminder {
  id: number
  user: User
  is_global: boolean
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  start_date: string
  end_date: string | null
  recurrence: "once" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "custom"
  recurrence_interval: number
  custom_recurrence: Record<string, any>
  status: "active" | "completed" | "cancelled" | "snoozed" | "postponed"
  is_active: boolean
  last_sent: string | null
  next_reminder: string | null
  snooze_count: number
  last_snooze_time: string | null
  completion_time: string | null
  created_at: string
  created_by: User | null
  is_overdue: boolean
  time_until_next: string | null
}

interface ReminderInteraction {
  id: number
  reminder: number
  user: User
  action: "created" | "sent" | "snoozed" | "postponed" | "completed" | "cancelled" | "reactivated"
  action_time: string
  details: Record<string, any>
}

interface Event {
  id: string
  title: string
  date: Date
  color: string
  reminder: Reminder
}

type ViewType = "month" | "week" | "day"

const Reminders: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [postponeTime, setPostponeTime] = useState<string>("")
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    start_date: "",
    end_date: "",
    is_global: false,
    recurrence: "once" as "once" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "custom",
    recurrence_interval: 1,
    custom_recurrence: {},
  })
  const [view, setView] = useState<ViewType>("month")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [interactions, setInteractions] = useState<ReminderInteraction[]>([])
  const token = useCookies().get("access_token")

  // Fetch reminders from API
  const fetchReminders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/reminders/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch reminders")
      }
      const reminders: Reminder[] = await response.json()

      const mappedEvents: Event[] = reminders.map((reminder) => ({
        id: reminder.id.toString(),
        title: reminder.title,
        date: parseISO(reminder.next_reminder || reminder.start_date),
        color: mapPriorityToColor(reminder.priority),
        reminder,
      }))

      setEvents(mappedEvents)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error fetching reminders")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch reminders on mount
  useEffect(() => {
    fetchReminders()
  }, [token])



  // Map priority to color
  const mapPriorityToColor = (priority: string): string => {
    switch (priority) {
      case "urgent":
        return "bg-red-600 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-gray-900"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events))
  }, [events])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
  }

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
  }

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.start_date) {
      setError("Title and start date are required")
      return
    }

    try {
      const payload = {
        title: newReminder.title,
        description: newReminder.description,
        priority: newReminder.priority,
        start_date: newReminder.start_date,
        end_date: newReminder.end_date || null,
        is_global: newReminder.is_global,
        recurrence: newReminder.recurrence,
        recurrence_interval: newReminder.recurrence_interval,
        custom_recurrence: newReminder.recurrence === "custom" ? newReminder.custom_recurrence : {},
      }

      const response = await fetch(`${API_URL}/api/reminders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create reminder")
      }

      const responseData = await response.json()
      await fetchReminders()
      setSuccess(responseData.message || "Reminder created successfully")
      setNewReminder({
        title: "",
        description: "",
        priority: "medium",
        start_date: format(currentDate, "yyyy-MM-dd'T'HH:mm"),
        end_date: "",
        is_global: false,
        recurrence: "once",
        recurrence_interval: 1,
        custom_recurrence: {},
      })
      setIsModalOpen(false)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error creating reminder")
      console.error(err)
    }
  }

  const handleSnooze = async (reminderId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/${reminderId}/perform-action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "snooze",
          snooze_minutes: 30,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to snooze reminder")
      }
      const responseData = await response.json()
      await fetchReminders()
      setSuccess(responseData.message || "Reminder snoozed successfully")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error snoozing reminder")
      console.error(err)
    }
  }

  const handlePostpone = async (reminderId: number, newTime: string) => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/${reminderId}/perform-action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "postpone",
          postpone_time: newTime,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to postpone reminder")
      }
      const responseData = await response.json()
      await fetchReminders()
      setSuccess(responseData.message || "Reminder postponed successfully")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error postponing reminder")
      console.error(err)
    }
  }

  const handleComplete = async (reminderId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/${reminderId}/perform-action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "complete",
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to complete reminder")
      }
      const responseData = await response.json()
      await fetchReminders()
      setSuccess(responseData.message || "Reminder completed successfully")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error completing reminder")
      console.error(err)
    }
  }

  const handleCancel = async (reminderId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/${reminderId}/perform-action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "cancel",
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to cancel reminder")
      }
      const responseData = await response.json()
      await fetchReminders()
      setSuccess(responseData.message || "Reminder cancelled successfully")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Error canceling reminder")
      console.error(err)
    }
  }

  const getDays = () => {
    if (view === "month") return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
    if (view === "week") return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) })
    return [currentDate]
  }

  const days = getDays()

  return (
    <div className="flex h-fit bg-white">
      <div className="w-80 bg-white border-r border-sidebar-border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
            <p className="text-sm text-muted-foreground">Manage your tasks and events</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5" />
                  Manage Reminders
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Current Reminders</TabsTrigger>
                  <TabsTrigger value="new">Add New</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="space-y-4">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
                    </div>
                  )}

                  {!loading && (
                    <>
                      {/* Filter reminders for the current date */}
                      {events.filter((event) => format(event.date, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd"))
                        .length === 0 ? (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-8">
                            <BellIcon className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                              No reminders for {format(currentDate, "MMM d, yyyy")}.
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Create a new reminder to get started.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {events
                            .filter(
                              (event) => format(event.date, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
                            )
                            .map((event) => (
                              <Card key={event.id} className="transition-all hover:shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={`text-xs ${mapPriorityToColor(event.reminder.priority)}`}>
                                          {event.reminder.priority}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {event.reminder.status}
                                        </Badge>
                                        {event.reminder.is_overdue && (
                                          <Badge variant="destructive" className="text-xs">
                                            Overdue
                                          </Badge>
                                        )}
                                      </div>
                                      <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {format(event.date, "MMM d, yyyy")}
                                        <ClockIcon className="h-3 w-3 ml-2" />
                                        {format(event.date, "h:mm a")}
                                      </div>
                                      {event.reminder.description && (
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                          {event.reminder.description}
                                        </p>
                                      )}
                                    </div>

                                    {event.reminder.status === "active" && (
                                      <div className="flex flex-col gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleSnooze(event.reminder.id)}
                                          className="h-7 px-2 text-xs"
                                        >
                                          <PauseIcon className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleComplete(event.reminder.id)}
                                          className="h-7 px-2 text-xs"
                                        >
                                          <CheckIcon className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCancel(event.reminder.id)}
                                          className="h-7 px-2 text-xs"
                                        >
                                          <XIcon className="h-3 w-3" />
                                        </Button>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                              Postpone
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Postpone Reminder</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-2">
                                              <Label htmlFor="postpone_time">New Time</Label>
                                              <Input
                                                id="postpone_time"
                                                type="datetime-local"
                                                value={postponeTime}
                                                onChange={(e) => setPostponeTime(e.target.value)}
                                              />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-4">
                                              <Button
                                                variant="outline"
                                                onClick={() => setPostponeTime("")}
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                onClick={() => {
                                                  if (postponeTime) {
                                                    const unixTime = Math.floor(new Date(postponeTime).getTime() / 1000).toString()
                                                    handlePostpone(event.reminder.id, unixTime)
                                                    setPostponeTime("")
                                                  }
                                                }}
                                              >
                                                Postpone
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="new" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newReminder.title}
                        onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                        placeholder="Enter reminder title"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newReminder.description}
                        onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                        placeholder="Enter reminder description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={newReminder.priority}
                          onValueChange={(value) =>
                            setNewReminder({ ...newReminder, priority: value as "low" | "medium" | "high" | "urgent" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="recurrence">Recurrence</Label>
                        <Select
                          value={newReminder.recurrence}
                          onValueChange={(value) =>
                            setNewReminder({
                              ...newReminder,
                              recurrence: value as
                                | "once"
                                | "hourly"
                                | "daily"
                                | "weekly"
                                | "monthly"
                                | "yearly"
                                | "custom",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={newReminder.start_date}
                          onChange={(e) => setNewReminder({ ...newReminder, start_date: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={newReminder.end_date}
                          onChange={(e) => setNewReminder({ ...newReminder, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    {newReminder.recurrence !== "once" && (
                      <div className="grid gap-2">
                        <Label htmlFor="interval">Recurrence Interval</Label>
                        <Input
                          id="interval"
                          type="number"
                          min="1"
                          value={newReminder.recurrence_interval}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              recurrence_interval: Number.parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_global"
                        checked={newReminder.is_global}
                        onCheckedChange={(checked) => setNewReminder({ ...newReminder, is_global: checked as boolean })}
                      />
                      <Label htmlFor="is_global" className="text-sm">
                        Global reminder
                      </Label>
                    </div>

                    {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsModalOpen(false)
                          setError(null)
                          setNewReminder({
                            title: "",
                            description: "",
                            priority: "medium",
                            start_date: format(currentDate, "yyyy-MM-dd'T'HH:mm"),
                            end_date: "",
                            is_global: false,
                            recurrence: "once",
                            recurrence_interval: 1,
                            custom_recurrence: {},
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddReminder}>Add Reminder</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Calendar Views</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(["month", "week", "day"] as ViewType[]).map((viewType) => (
                <Button
                  key={viewType}
                  variant={view === viewType ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView(viewType)}
                  className="flex-1 capitalize"
                >
                  {viewType}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="w-full">
              Today
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{format(currentDate, "MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-muted-foreground font-medium p-2">
                  {day}
                </div>
              ))}
              {days.map((day) => (
                <button
                  key={day.toString()}
                  className={`p-2 rounded-md text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isToday(day)
                      ? "bg-orange text-orange-foreground font-medium"
                      : isSameMonth(day, currentDate)
                        ? "text-black"
                        : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    setCurrentDate(day)
                    setNewReminder({ ...newReminder, start_date: format(day, "yyyy-MM-dd'T'HH:mm") })
                    setIsModalOpen(true)
                  }}
                >
                  {format(day, "d")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange"></div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-success/10 border-success/20 text-success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-orange">
              {view === "day" ? format(currentDate, "eeee, MMMM d, yyyy") : format(currentDate, "MMMM yyyy")}
            </h2>
            <p className="text-muted-foreground mt-1">
              {events.length} reminder{events.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={prev}>
              Previous
            </Button>
            <Button variant="outline" onClick={next}>
              Next
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div
            className={`grid ${view === "month" ? "grid-cols-7" : "grid-cols-1"} ${view === "month" ? "divide-x divide-border" : ""}`}
          >
            {view === "month" &&
              ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <div
                  key={day}
                  className="p-4 font-semibold text-sm text-muted-foreground bg-muted/50 border-b border-border"
                >
                  {day}
                </div>
              ))}

            {days.map((day) => (
              <div
                key={day.toString()}
                className={`p-4 min-h-[120px] border-b border-border relative transition-colors hover:bg-accent/5 ${
                  isSameMonth(day, currentDate) ? "bg-card" : "bg-muted/20"
                } ${isToday(day) ? "ring-2 ring-orange ring-inset" : ""}`}
                onClick={() => {
                  setCurrentDate(day)
                  setNewReminder({ ...newReminder, start_date: format(day, "yyyy-MM-dd'T'HH:mm") })
                  setIsModalOpen(true)
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isToday(day) ? "text-orange" : "text-black"}`}>
                    {format(day, "d")}
                  </span>
                  {events.filter((event) => format(event.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length >
                    0 && (
                    <Badge variant="secondary" className="text-xs">
                      {events.filter((event) => format(event.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {events
                    .filter((event) => format(event.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 text-xs rounded-md truncate transition-all hover:shadow-sm ${mapPriorityToColor(event.reminder.priority)}`}
                        title={`${event.title} (${event.reminder.status})${event.reminder.is_overdue ? " - Overdue" : ""}`}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs opacity-90">{format(event.date, "h:mm a")}</div>
                      </div>
                    ))}

                  {events.filter((event) => format(event.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length >
                    3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +
                      {events.filter((event) => format(event.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length -
                        3}{" "}
                      more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Reminders