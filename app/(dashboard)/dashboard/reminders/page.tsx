"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
  addDays,
  isSameDay,
} from "date-fns";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  BellIcon,
  CheckIcon,
  XIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ZapIcon,
  AlertTriangleIcon,
  InfoIcon,
  CalendarDaysIcon,
  ListTodoIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CreateTaskDialog from "@/components/task/CreateTaskDialog";

// Types
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

interface Reminder {
  id: number;
  user: User;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  start_date: string;
  end_date: string | null;
  recurrence: string;
  status: string;
  is_active: boolean;
  next_reminder: string | null;
  is_overdue: boolean;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  color: string;
  reminder: Reminder;
}

interface TaskPrefillData {
  title?: string;
  description?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  deadline?: string;
  estimatedHours?: string;
  requiresApproval?: boolean;
}

type ViewType = "month" | "week" | "day";

const Reminders: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null
  );
  const [postponeTime, setPostponeTime] = useState<string>("");
  const [view, setView] = useState<ViewType>("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillData | null>(null);

  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    start_date: "",
    end_date: "",
    is_global: false,
    recurrence: "once",
    recurrence_interval: 1,
    custom_recurrence: {},
  });

  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Enhanced sanitizer
  const sanitizeDate = useCallback((iso: string) => {
    if (!iso) return new Date();
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return new Date();
    if (d.getFullYear() < 2000) return new Date();
    return d;
  }, []);

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reminders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch reminders");
      }

      const reminders: Reminder[] = await response.json();

      const mappedEvents: Event[] = reminders.map((reminder) => {
        const safeDate = sanitizeDate(
          reminder.next_reminder || reminder.start_date
        );
        return {
          id: reminder.id.toString(),
          title: reminder.title,
          date: safeDate,
          color: mapPriorityToColor(reminder.priority),
          reminder,
        };
      });

      setEvents(mappedEvents);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, sanitizeDate]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleCreateTaskFromReminder = (reminder: Reminder) => {
    const prefill: TaskPrefillData = {
      title: reminder.title,
      description: reminder.description,
      priority: reminder.priority as 'urgent' | 'high' | 'medium' | 'low',
      deadline: reminder.next_reminder || reminder.start_date,
      estimatedHours: "",
      requiresApproval: reminder.priority === "urgent" || reminder.priority === "high",
    };
    
    setTaskPrefill(prefill);
    setIsTaskDialogOpen(true);
  };

  const handleTaskCreated = () => {
    setSuccess("Task created successfully from reminder!");
    setIsTaskDialogOpen(false);
    setTaskPrefill(null);
  };

  const mapPriorityToColor = (priority: string): string => {
    switch (priority) {
      case "urgent":
        return "bg-red-600 text-white border-red-700";
      case "high":
        return "bg-orange-500 text-white border-orange-600";
      case "medium":
        return "bg-yellow-500 text-gray-900 border-yellow-600";
      case "low":
        return "bg-green-500 text-white border-green-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangleIcon className="h-3 w-3" />;
      case "high":
        return <ZapIcon className="h-3 w-3" />;
      case "medium":
        return <InfoIcon className="h-3 w-3" />;
      case "low":
        return <CalendarDaysIcon className="h-3 w-3" />;
      default:
        return <BellIcon className="h-3 w-3" />;
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Navigation functions
  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.start_date) {
      setError("Title and start date are required");
      return;
    }

    try {
      const payload = {
        ...newReminder,
        end_date: newReminder.end_date || null,
        custom_recurrence:
          newReminder.recurrence === "custom"
            ? newReminder.custom_recurrence
            : {},
      };

      const response = await fetch(`${API_URL}/api/reminders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create reminder");
      }

      const responseData = await response.json();
      await fetchReminders();
      setSuccess("Reminder created successfully");

      resetNewReminder();
      setIsModalOpen(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetNewReminder = () => {
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
    });
  };

  const handleSnooze = async (id: number) => {
    await performAction(id, { action: "snooze", snooze_minutes: 30 });
  };

 const handlePostpone = async (id: number, postponeDateTime: string) => {
  try {
    if (!postponeDateTime) {
      setError("Please select a new date and time");
      return;
    }

    // Parse the datetime-local value
    const selectedDate = new Date(postponeDateTime);
    
    // Validate it's a future date
    if (selectedDate <= new Date()) {
      setError("Postpone time must be in the future");
      return;
    }

    // Convert to ISO string format (backend expects YYYY-MM-DDThh:mm:ss)
    // Ensure we include seconds for proper ISO format
    const isoString = selectedDate.toISOString();
    
    console.log("Postponing reminder", id, "to:", {
      selectedDate,
      isoString,
      formatted: format(selectedDate, "yyyy-MM-dd HH:mm:ss")
    });

    // Call the API with ISO string format
    await performAction(id, { 
      action: "postpone", 
      postpone_time: isoString 
    });

    // Clear the input
    setPostponeTime("");
  } catch (error) {
    console.error("Postpone error:", error);
    setError("Failed to postpone reminder. Please try again.");
  }
};

  const handleComplete = async (id: number) => {
    await performAction(id, { action: "complete" });
  };

  const handleCancel = async (id: number) => {
    await performAction(id, { action: "cancel" });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      await performAction(id, { action: "delete" });
    }
  };

  const performAction = async (id: number, body: Record<string, any>) => {
    try {
      console.log("Sending request to:", `${API_URL}/api/reminders/${id}/perform-action/`);
      console.log("Request body:", body);

      const res = await fetch(
        `${API_URL}/api/reminders/${id}/perform-action/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errData = await res.json();
        console.error("Error response:", errData);
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const msg = await res.json();
      console.log("Success response:", msg);
      
      await fetchReminders();
      setSuccess(msg.message || "Action completed successfully");
      setError(null);
    } catch (err: any) {
      console.error("Error in performAction:", err);
      setError(err.message);
    }
  };

  const getDays = () => {
    if (view === "month")
      return eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      });
    if (view === "week")
      return eachDayOfInterval({
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
      });
    return [currentDate];
  };

  const days = getDays();

  const todayEvents = events.filter((event) =>
    isSameDay(event.date, currentDate)
  );

  // Test function to verify API works
  const testPostpone = async (id: number) => {
    // Test with 1 hour from now
    const oneHourFromNow = new Date(Date.now() + 3600000);
    const unixTimestamp = Math.floor(oneHourFromNow.getTime() / 1000);
    
    console.log("Testing postpone with:", {
      date: oneHourFromNow,
      unixTimestamp,
      iso: oneHourFromNow.toISOString()
    });
    
    await performAction(id, { 
      action: "postpone", 
      postpone_time: unixTimestamp 
    });
  };

  return (
    <TooltipProvider>
      <div className="flex h-fit bg-gradient-to-br from-gray-50 to-white">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 space-y-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your tasks and events
              </p>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
                    >
                      <PlusIcon className="h-4 w-4" />
                      New Reminder
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create new reminder</p>
                  </TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <BellIcon className="h-5 w-5 text-orange-500" />
                    Manage Reminders
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="new" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">Add New</TabsTrigger>
                    <TabsTrigger value="existing">
                      Today&apos;s Reminders
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing" className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      </div>
                    ) : todayEvents.length === 0 ? (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <BellIcon className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-gray-500 text-center">
                            No reminders for{" "}
                            {format(currentDate, "MMM d, yyyy")}.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {todayEvents.map((event) => (
                          <Card
                            key={event.id}
                            className="transition-all hover:shadow-md border-l-4"
                            style={{ borderLeftColor: event.color }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      className={`flex items-center gap-1 text-xs ${mapPriorityToColor(
                                        event.reminder.priority
                                      )}`}
                                    >
                                      {getPriorityIcon(event.reminder.priority)}
                                      {event.reminder.priority}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {event.reminder.status}
                                    </Badge>
                                    {event.reminder.is_overdue && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-sm truncate">
                                    {event.title}
                                  </h4>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {format(event.date, "MMM d, yyyy")}
                                    <ClockIcon className="h-3 w-3 ml-2" />
                                    {format(event.date, "h:mm a")}
                                  </div>
                                  {event.reminder.description && (
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                      {event.reminder.description}
                                    </p>
                                  )}
                                </div>

                                {event.reminder.status === "active" && (
                                  <div className="flex flex-col gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleSnooze(event.reminder.id)
                                          }
                                          className="h-7 px-2 text-xs hover:bg-yellow-50"
                                        >
                                          <PauseIcon className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Snooze for 30 minutes</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleComplete(event.reminder.id)
                                          }
                                          className="h-7 px-2 text-xs hover:bg-green-50"
                                        >
                                          <CheckIcon className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Mark as complete</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleCancel(event.reminder.id)
                                          }
                                          className="h-7 px-2 text-xs hover:bg-red-50"
                                        >
                                          <XIcon className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Cancel reminder</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleCreateTaskFromReminder(event.reminder)
                                          }
                                          className="h-7 px-2 text-xs hover:bg-purple-50"
                                        >
                                          <ListTodoIcon className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Create task</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    
                                    {/* Test button - remove in production */}
                                    {/* <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            testPostpone(event.reminder.id)
                                          }
                                          className="h-7 px-2 text-xs hover:bg-blue-50"
                                        >
                                          Test
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Test postpone 1 hour</p>
                                      </TooltipContent>
                                    </Tooltip> */}
                                    
                                    <Dialog>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 px-2 text-xs hover:bg-blue-50"
                                              onClick={() => setPostponeTime("")}
                                            >
                                              Postpone
                                            </Button>
                                          </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Postpone reminder</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5" />
                                            Postpone Reminder
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          <div className="grid gap-2">
                                            <Label htmlFor="postpone_time">
                                              Select new date and time
                                            </Label>
                                            <Input
                                              id="postpone_time"
                                              type="datetime-local"
                                              value={postponeTime}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                setPostponeTime(value);
                                              }}
                                              min={format(
                                                new Date(),
                                                "yyyy-MM-dd'T'HH:mm"
                                              )}
                                            />
                                            <p className="text-xs text-gray-500">
                                              Current reminder time:{" "}
                                              {format(
                                                event.date,
                                                "MMM d, yyyy 'at' h:mm a"
                                              )}
                                            </p>
                                          </div>
                                          
                                          {postponeTime && (
                                            <Alert className="bg-blue-50 border-blue-200">
                                              <InfoIcon className="h-4 w-4 text-blue-600" />
                                              <AlertDescription className="text-blue-700">
                                                New time: {format(new Date(postponeTime), "MMM d, yyyy 'at' h:mm a")}
                                                <br />
                                                <span className="text-xs">
                                                  Unix timestamp: {Math.floor(new Date(postponeTime).getTime() / 1000)}
                                                </span>
                                              </AlertDescription>
                                            </Alert>
                                          )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4 border-t">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setPostponeTime("");
                                              document.querySelector('[aria-label="Close"]')?.dispatchEvent(new Event('click'));
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={() => {
                                              handlePostpone(event.reminder.id, postponeTime);
                                              document.querySelector('[aria-label="Close"]')?.dispatchEvent(new Event('click'));
                                            }}
                                            disabled={!postponeTime}
                                            className="bg-blue-500 hover:bg-blue-600"
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
                  </TabsContent>

                  <TabsContent value="new" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label
                          htmlFor="title"
                          className="flex items-center gap-1"
                        >
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          value={newReminder.title}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              title: e.target.value,
                            })
                          }
                          placeholder="Enter reminder title"
                          className="focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="description"
                          className="flex items-center gap-1"
                        >
                          Description
                          <span className="text-xs text-gray-500 ml-auto">
                            Optional
                          </span>
                        </Label>
                        <Textarea
                          id="description"
                          value={newReminder.description}
                          onChange={(e) =>
                            setNewReminder({
                              ...newReminder,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter reminder description"
                          rows={3}
                          className="focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newReminder.priority}
                            onValueChange={(value) =>
                              setNewReminder({
                                ...newReminder,
                                priority: value as
                                  | "low"
                                  | "medium"
                                  | "high"
                                  | "urgent",
                              })
                            }
                          >
                            <SelectTrigger className="focus:ring-2 focus:ring-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="low"
                                className="flex items-center gap-2"
                              >
                                <div className=" flex gap-2 items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <p>Low</p>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="medium"
                                className="flex flex-row  gap-2"
                              >
                                <div className=" flex gap-2 items-center">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  <p>Medium</p>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="high"
                                className="flex items-center gap-2"
                              >
                                <div className=" flex gap-2 items-center">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                  <p>High</p>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="urgent"
                                className="flex items-center gap-2"
                              >
                                <div className="flex gap-2 items-center">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  <p> Urgent</p>
                                </div>
                              </SelectItem>
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
                            <SelectTrigger className="focus:ring-2 focus:ring-orange-500">
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
                          <Label
                            htmlFor="start_date"
                            className="flex items-center gap-1"
                          >
                            Start Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="start_date"
                            type="datetime-local"
                            value={newReminder.start_date}
                            onChange={(e) =>
                              setNewReminder({
                                ...newReminder,
                                start_date: e.target.value,
                              })
                            }
                            className="focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="end_date">End Date</Label>
                          <Input
                            id="end_date"
                            type="datetime-local"
                            value={newReminder.end_date}
                            onChange={(e) =>
                              setNewReminder({
                                ...newReminder,
                                end_date: e.target.value,
                              })
                            }
                            className="focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      {newReminder.recurrence !== "once" && (
                        <div className="grid gap-2">
                          <Label htmlFor="interval">Repeat every</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="interval"
                              type="number"
                              min="1"
                              value={newReminder.recurrence_interval}
                              onChange={(e) =>
                                setNewReminder({
                                  ...newReminder,
                                  recurrence_interval:
                                    Number.parseInt(e.target.value) || 1,
                                })
                              }
                              className="focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-500">
                              {newReminder.recurrence === "hourly"
                                ? "hour(s)"
                                : newReminder.recurrence === "daily"
                                ? "day(s)"
                                : newReminder.recurrence === "weekly"
                                ? "week(s)"
                                : newReminder.recurrence === "monthly"
                                ? "month(s)"
                                : newReminder.recurrence === "yearly"
                                ? "year(s)"
                                : "time(s)"}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Checkbox
                          id="is_global"
                          checked={newReminder.is_global}
                          onCheckedChange={(checked) =>
                            setNewReminder({
                              ...newReminder,
                              is_global: checked as boolean,
                            })
                          }
                          className="data-[state=checked]:bg-orange-500"
                        />
                        <Label
                          htmlFor="is_global"
                          className="text-sm cursor-pointer"
                        >
                          Create as global reminder (visible to all users)
                        </Label>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="animate-pulse">
                          <AlertTriangleIcon className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsModalOpen(false);
                            setError(null);
                            resetNewReminder();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddReminder}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        >
                          <BellIcon className="h-4 w-4 mr-2" />
                          Add Reminder
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Calendar Views Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Calendar Views
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {(["month", "week", "day"] as ViewType[]).map((viewType) => (
                  <Button
                    key={viewType}
                    variant={view === viewType ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView(viewType)}
                    className={`flex-1 capitalize transition-all ${
                      view === viewType
                        ? "bg-orange-500 text-white"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {viewType}
                  </Button>
                ))}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="w-full hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Today
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Jump to today</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Mini Calendar */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {format(currentDate, "MMMM yyyy")}
                </CardTitle>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setCurrentDate(subMonths(currentDate, 1))
                        }
                        className="h-6 w-6"
                      >
                        <ChevronLeftIcon className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Previous month</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setCurrentDate(addMonths(currentDate, 1))
                        }
                        className="h-6 w-6"
                      >
                        <ChevronRightIcon className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Next month</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-gray-500 font-medium p-1">
                    {day}
                  </div>
                ))}
                {eachDayOfInterval({
                  start: startOfMonth(currentDate),
                  end: endOfMonth(currentDate),
                }).map((day) => (
                  <Tooltip key={day.toString()}>
                    <TooltipTrigger asChild>
                      <button
                        className={`p-1.5 rounded-md text-xs transition-all hover:bg-orange-50 hover:text-orange-600 relative ${
                          isToday(day)
                            ? "bg-orange-500 text-white font-medium"
                            : isSameMonth(day, currentDate)
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                        onClick={() => {
                          setCurrentDate(day);
                          setNewReminder({
                            ...newReminder,
                            start_date: format(day, "yyyy-MM-dd'T'HH:mm"),
                          });
                        }}
                      >
                        {format(day, "d")}
                        {events.filter((event) => isSameDay(event.date, day))
                          .length > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {
                          events.filter((event) => isSameDay(event.date, day))
                            .length
                        }{" "}
                        reminder(s) on {format(day, "MMM d")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Reminder Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Reminders</span>
                <Badge variant="secondary">{events.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Today&apos;s Reminders
                </span>
                <Badge variant="secondary">{todayEvents.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overdue</span>
                <Badge variant="destructive">
                  {events.filter((e) => e.reminder.is_overdue).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-white">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="text-gray-500">Loading reminders...</p>
            </div>
          )}

          {error && (
            <Alert
              variant="destructive"
              className="mb-4 animate-in slide-in-from-top"
            >
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 animate-in slide-in-from-top">
              <CheckIcon className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {view === "day"
                  ? format(currentDate, "eeee, MMMM d, yyyy")
                  : view === "week"
                  ? `Week of ${format(
                      startOfWeek(currentDate),
                      "MMM d"
                    )} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`
                  : format(currentDate, "MMMM yyyy")}
            </h2>
              <p className="text-gray-500 mt-2">
                {events.length} reminder{events.length !== 1 ? "s" : ""}{" "}
                scheduled
              </p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={prev} className="gap-2">
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previous {view}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={next} className="gap-2">
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Next {view}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card className="overflow-hidden shadow-lg border-gray-200">
            <div
              className={`grid ${
                view === "month" ? "grid-cols-7" : "grid-cols-1"
              } divide-x divide-gray-100`}
            >
              {view === "month" &&
                [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((day) => (
                  <div
                    key={day}
                    className="p-4 font-semibold text-sm text-gray-600 bg-gray-50 border-b border-gray-200"
                  >
                    {day}
                  </div>
                ))}

              {days.map((day) => (
                <div
                  key={day.toString()}
                  className={`p-4 min-h-[150px] border-b border-gray-100 relative transition-all hover:bg-gray-50/50 group ${
                    isSameMonth(day, currentDate) ? "bg-white" : "bg-gray-50/50"
                  } ${
                    isToday(day)
                      ? "bg-orange-50 border-l-4 border-l-orange-500"
                      : ""
                  }`}
                  onClick={() => {
                    setCurrentDate(day);
                    setNewReminder({
                      ...newReminder,
                      start_date: format(day, "yyyy-MM-dd'T'HH:mm"),
                    });
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-sm font-semibold ${
                        isToday(day) ? "text-orange-600" : "text-gray-900"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="flex items-center gap-1">
                      {events.filter((event) => isSameDay(event.date, day))
                        .length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {
                            events.filter((event) => isSameDay(event.date, day))
                              .length
                          }
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(day);
                          setNewReminder({
                            ...newReminder,
                            start_date: format(day, "yyyy-MM-dd'T'HH:mm"),
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {events
                      .filter((event) => isSameDay(event.date, day))
                      .slice(0, 4)
                      .map((event) => (
                        <Tooltip key={event.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`p-2 text-xs rounded-md truncate transition-all hover:shadow-md cursor-pointer ${mapPriorityToColor(
                                event.reminder.priority
                              )} border`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReminder(event.reminder);
                              }}
                            >
                              <div className="flex items-center gap-1 font-medium">
                                {getPriorityIcon(event.reminder.priority)}
                                <span className="truncate">{event.title}</span>
                              </div>
                              <div className="text-xs opacity-90 mt-0.5">
                                {format(event.date, "h:mm a")}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold">{event.title}</p>
                              <p className="text-xs text-gray-600">
                                {event.reminder.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {format(event.date, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  {format(event.date, "h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-xs ${mapPriorityToColor(
                                    event.reminder.priority
                                  )}`}
                                >
                                  {event.reminder.priority}
                                </Badge>
                                {event.reminder.is_overdue && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSnooze(event.reminder.id)
                                  }
                                  className="h-7 px-2 text-xs"
                                >
                                  <PauseIcon className="h-3 w-3 mr-1" />
                                  Snooze
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleComplete(event.reminder.id)
                                  }
                                  className="h-7 px-2 text-xs"
                                >
                                  <CheckIcon className="h-3 w-3 mr-1" />
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleCreateTaskFromReminder(event.reminder)
                                  }
                                  className="h-7 px-2 text-xs"
                                >
                                  <ListTodoIcon className="h-3 w-3 mr-1" />
                                  Task
                                </Button>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}

                    {events.filter((event) => isSameDay(event.date, day))
                      .length > 4 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +
                        {events.filter((event) => isSameDay(event.date, day))
                          .length - 4}{" "}
                        more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          {selectedReminder && (
            <Card className="mt-6 animate-in slide-in-from-bottom">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${mapPriorityToColor(
                        selectedReminder.priority
                      )}`}
                    >
                      {getPriorityIcon(selectedReminder.priority)}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedReminder.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedReminder.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSnooze(selectedReminder.id)}
                          className="hover:bg-yellow-50"
                        >
                          <PauseIcon className="h-4 w-4 mr-2" />
                          Snooze
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Snooze for 30 minutes</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComplete(selectedReminder.id)}
                          className="hover:bg-green-50"
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark as complete</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateTaskFromReminder(selectedReminder)}
                          className="hover:bg-purple-50"
                        >
                          <ListTodoIcon className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create task from this reminder</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedReminder(null)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <CreateTaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false);
          setTaskPrefill(null);
        }}
        onTaskCreated={handleTaskCreated}
        prefill={taskPrefill || undefined}
      />
    </TooltipProvider>
  );
};

export default Reminders;