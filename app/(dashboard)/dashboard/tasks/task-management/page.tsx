// pages/TaskManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PlusCircle,
  MoreHorizontal,
  Eye,
  Edit,
  History,
  Settings,
  ListFilter,
  X,
  Check,
  Filter,
  Calendar as CalendarIcon,
  ChevronDown,
  Logs,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid } from "date-fns";
import ExportButton from "@/app/utils/ExportButton";
import CreateTaskDialog from "@/components/task/CreateTaskDialog";
import ReassignTaskDialog from "@/components/task/ReassignTaskDialog";
import ViewTaskDialog from "@/components/task/ViewTaskDialog";
import UpdateTaskDialog from "@/components/task/UpdateTaskDialog";
import HistoryTaskDialog from "@/components/task/HistoryTaskDialog";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";


// ---------------------------------------------------
// 1. INTERFACES
// ---------------------------------------------------
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

interface TaskType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface AssignmentLog {
  id: number;
  task: number;
  assigned_to: number;
  assigned_by: number | null;
  assigned_to_display: string | null;
  reason: string | null;
  created_at: string;
}
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}
interface HistoryItem {
  id: number;
  action: string;
  user: User;
  user_display: string | null;
  old_value: any;
  new_value: any;
  comment: string;
  created_at: string;
}

interface ChangeLog {
  id: number;
  action_type: string;
  action_type_display: string;
  user: number;
  user_display: string | null;
  field_name: string | null;
  old_value: any;
  new_value: any;
  comment: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: TaskType | null;
  task_type_display: string | null;
  assigned_to: User;
  assigned_to_display: string | null;
  assigned_by: User;
  assigned_by_display: string | null;
  deadline: string;
  priority: string;
  status: string;
  reason: string | null;
  estimated_hours: string | null;
  actual_hours: string | null;
  completion_notes: string | null;
  requires_approval: boolean;
  approved_by: User | null;
  approved_at: string | null;
  assignment_logs: AssignmentLog[];
  history: HistoryItem[];
  change_logs: ChangeLog[];
  is_overdue: boolean;
  days_until_deadline: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Task[];
}

// ---------------------------------------------------
// 2. COMPONENT
// ---------------------------------------------------
const Page = () => {
  // ------------------- STATE -------------------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter()

  // Filters
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState<number[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState<number[]>([]);
  const [assignedByFilter, setAssignedByFilter] = useState<number[]>([]);
  const [dateAssignedRange, setDateAssignedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [deadlineRange, setDeadlineRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  // Data
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modals
  const [taskTypeModalOpen, setTaskTypeModalOpen] = useState(false);
  const [assignedToModalOpen, setAssignedToModalOpen] = useState(false);
  const [assignedByModalOpen, setAssignedByModalOpen] = useState(false);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const cookies = useCookies();
  const token = cookies.get("access_token") ?? "";
  const API_HOST = API_URL;

  // ------------------- FETCH DATA -------------------
  const fetchTaskTypes = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/task-types/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTaskTypes(data.results ?? data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_HOST}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json();               // <-- the whole response
      const userArray = payload.data?.results ?? [];   // <-- correct path

      // Optional: keep the total count if you ever need it
      // setTotalUsers(payload.data?.count ?? 0);

      setUsers(userArray);
    } catch (e) {
      console.error("Failed to load users", e);
      setUsers([]);   // keep UI stable
    }
  };

  const fetchTasks = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      // ---- Pagination & Search ----
      params.set("page", currentPage.toString());

      if (searchTerm.trim()) {
        params.set("search", searchTerm); // NO encodeURIComponent
      }

      // ---- Single-value filters ----
      if (priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      // ---- Multi-ID filters (comma separated) ----
      if (taskTypeFilter.length > 0) {
        params.set("task_type", taskTypeFilter.join(","));
      }

      if (assignedToFilter.length > 0) {
        params.set("assigned_to", assignedToFilter.join(","));
      }

      if (assignedByFilter.length > 0) {
        params.set("assigned_by", assignedByFilter.join(","));
      }

      // ---- Date assigned range ----
      if (dateAssignedRange.from && isValid(dateAssignedRange.from)) {
        params.set(
          "date_assigned_start",
          format(dateAssignedRange.from, "yyyy-MM-dd")
        );
      }

      if (dateAssignedRange.to && isValid(dateAssignedRange.to)) {
        params.set(
          "date_assigned_end",
          format(dateAssignedRange.to, "yyyy-MM-dd")
        );
      }

      // ---- Deadline range ----
      if (deadlineRange.from && isValid(deadlineRange.from)) {
        params.set(
          "deadline_start",
          format(deadlineRange.from, "yyyy-MM-dd")
        );
      }

      if (deadlineRange.to && isValid(deadlineRange.to)) {
        params.set(
          "deadline_end",
          format(deadlineRange.to, "yyyy-MM-dd")
        );
      }

      const res = await fetch(`${API_HOST}/api/tasks/?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ApiResponse = await res.json();

      setTasks(data.results);
      setTotalTasks(data.count);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err) {
      console.error(err);
      alert("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };


  // ------------------- EFFECTS -------------------
  useEffect(() => {
    fetchTaskTypes();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    searchTerm,
    priorityFilter,
    statusFilter,
    taskTypeFilter,
    assignedToFilter,
    assignedByFilter,
    dateAssignedRange,
    deadlineRange,
  ]);

  // ------------------- HANDLERS -------------------
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePriority = (v: string) => {
    setPriorityFilter(v);
    setCurrentPage(1);
  };
  const handleStatus = (v: string) => {
    setStatusFilter(v);
    setCurrentPage(1);
  };

  const toggleTaskType = (id: number) => {
    setTaskTypeFilter((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };
  const clearTaskType = () => {
    setTaskTypeFilter([]);
    setCurrentPage(1);
  };

  const toggleAssignedTo = (id: number) => {
    setAssignedToFilter((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };
  const clearAssignedTo = () => {
    setAssignedToFilter([]);
    setCurrentPage(1);
  };

  const toggleAssignedBy = (id: number) => {
    setAssignedByFilter((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };
  const clearAssignedBy = () => {
    setAssignedByFilter([]);
    setCurrentPage(1);
  };

  const handlePrev = () => prevPage && setCurrentPage((p) => p - 1);
  const handleNext = () => nextPage && setCurrentPage((p) => p + 1);

  const openReassign = (t: Task) => {
    setSelectedTask(t);
    setIsReassignOpen(true);
  };
  const openView = (t: Task) => {
    setSelectedTask(t);
    setIsViewOpen(true);
  };
  const openUpdate = (t: Task) => {
    setSelectedTask(t);
    setIsUpdateOpen(true);
  };
  const openHistory = (t: Task) => {
    setSelectedTask(t);
    setIsHistoryOpen(true);
  };

  const refresh = () => fetchTasks();

  // ------------------- BADGE HELPERS -------------------
  const priorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "viewed":
        return "bg-green-100 text-green-800";
      case "not_viewed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "rejected":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const latestReason = (task: Task): string => {
    if (task.assignment_logs.length === 0) return task.reason ?? "—";
    const latest = task.assignment_logs
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
    return latest.reason ?? "—";
  };

  // ------------------- RENDER -------------------
  return (
    <div className="container bg-white mx-auto p-4">
      <h2 className="text-2xl font-bold">Task Management</h2>
      <p className="text-muted-foreground">
        View, filter, and manage tasks across all types and priorities
      </p>

      {/* ---------- FILTER BAR (exact image) ---------- */}


      {/* ---------- SEARCH & ACTIONS ---------- */}
      <div className="flex flex-wrap gap-4 mt-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute z-1 left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, assignees..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <Button
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setIsCreateOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create Task
        </Button>

        <ExportButton data={tasks} fileName="tasks_export.csv" />
        <Button
          onClick={fetchTasks}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`w-4 h-4  ${loading ? "animate-spin" : ""
              }`}
          />

        </Button>



      </div>
      <div className="mt-6 mb-4 rounded-lg = bg-card p-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        {/* Task Type */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center border border-gray-200 gap-1"
          onClick={() => setTaskTypeModalOpen(true)}
        >
          <ListFilter className="h-4 w-4" />
          Task Type
          {taskTypeFilter.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {taskTypeFilter.length}
            </Badge>
          )}
        </Button>

        {/* Priority */}
        <Select value={priorityFilter} onValueChange={handlePriority}>
          <SelectTrigger className="w-[150px] border border-gray-200">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Assigned to */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 border border-gray-200"
          onClick={() => setAssignedToModalOpen(true)}
        >
          Assigned to
          {assignedToFilter.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {assignedToFilter.length}
            </Badge>
          )}
        </Button>

        {/* Assigned by */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 border border-gray-200"
          onClick={() => setAssignedByModalOpen(true)}
        >
          Assigned by
          {assignedByFilter.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {assignedByFilter.length}
            </Badge>
          )}
        </Button>

        {/* Date Assigned */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="flex border border-gray-200 items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Date Assigned
              {(dateAssignedRange.from || dateAssignedRange.to) && (
                <Badge variant="secondary" className="ml-1">
                  {dateAssignedRange.from && dateAssignedRange.to
                    ? "2"
                    : "1"}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateAssignedRange.from,
                to: dateAssignedRange.to,
              }}
              onSelect={(range: any) => {
                setDateAssignedRange({
                  from: range?.from,
                  to: range?.to,
                });
                setCurrentPage(1);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Deadline Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="flex border border-gray-200 items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              Deadline Date
              {(deadlineRange.from || deadlineRange.to) && (
                <Badge variant="secondary" className="ml-1">
                  {deadlineRange.from && deadlineRange.to ? "2" : "1"}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: deadlineRange.from,
                to: deadlineRange.to,
              }}
              onSelect={(range: any) => {
                setDeadlineRange({
                  from: range?.from,
                  to: range?.to,
                });
                setCurrentPage(1);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Status */}
        <Select value={statusFilter} onValueChange={handleStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="not_viewed">Not Viewed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Settings */}

      </div>
      {/* ---------- TABLE ---------- */}
      {loading ? (
        <p className="text-center">Loading tasks...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Task Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Reassign Reason</TableHead>
              <TableHead>Reassign</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium"><Link href={`/dashboard/tasks/task-management/${task.id}`}>{task.title}</Link></TableCell>
                <TableCell className="max-w-xs truncate">
                  {task.description}
                </TableCell>
                <TableCell>
                  {task.task_type?.name ?? task.task_type_display ?? "—"}
                </TableCell>

                <TableCell>
                  <Badge className={priorityBadge(task.priority)}>
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </Badge>
                </TableCell>

                <TableCell>{task.assigned_by?.full_name}</TableCell>
                <TableCell>{task.assigned_to?.full_name}</TableCell>

                <TableCell>
                  {formatToDDMMYYYY(task.created_at)}
                </TableCell>

                <TableCell>
                  {formatToDDMMYYYY(task.deadline)}
                </TableCell>

                <TableCell>
                  <Badge className={statusBadge(task.status)}>
                    {task.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell>
                  {task.is_overdue ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : (
                    <Badge variant="secondary">On time</Badge>
                  )}
                </TableCell>

                <TableCell className="max-w-xs truncate">
                  {latestReason(task)}
                </TableCell>

                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReassign(task)}
                  >
                    Reassign
                  </Button>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(task)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openUpdate(task)}>
                        <Edit className="mr-2 h-4 w-4" /> Update
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openHistory(task)}>
                        <Logs className="mr-2 h-4 w-4" /> Logs
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ---------- PAGINATION ---------- */}
      <div className="flex items-center justify-between mt-6">
        <Button onClick={handlePrev} disabled={!prevPage}>
          Previous
        </Button>

        <span>
          Page {currentPage} of {Math.max(1, Math.ceil(totalTasks / 10))}
        </span>

        <Button onClick={handleNext} disabled={!nextPage}>
          Next
        </Button>
      </div>

      {/* ---------- DIALOGS ---------- */}
      <CreateTaskDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={refresh}
      />

      <ReassignTaskDialog
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        taskId={selectedTask?.id ?? null}
        onTaskReassigned={refresh}
      />

      <ViewTaskDialog
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        task={selectedTask}
      />

      <UpdateTaskDialog
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        task={selectedTask}
        onTaskUpdated={refresh}
      />

      <HistoryTaskDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        // assignmentLogs={selectedTask?.assignment_logs ?? []}/
        history={selectedTask?.history ?? []}
      // changeLogs={selectedTask?.change_logs ?? []}
      />


      {/* ---------- TASK TYPE MODAL ---------- */}
      <Dialog open={taskTypeModalOpen} onOpenChange={setTaskTypeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Task Type
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {taskTypes.map((tt) => (
              <div
                key={tt.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
              >
                <Checkbox
                  id={`tt-${tt.id}`}
                  checked={taskTypeFilter.includes(tt.id)}
                  onCheckedChange={() => toggleTaskType(tt.id)}
                />
                <Label htmlFor={`tt-${tt.id}`} className="flex-1 cursor-pointer">
                  {tt.name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" size="sm" onClick={clearTaskType}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
            <Button size="sm" onClick={() => setTaskTypeModalOpen(false)}>
              <Check className="mr-1 h-4 w-4" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- ASSIGNED TO MODAL ---------- */}
      <Dialog open={assignedToModalOpen} onOpenChange={setAssignedToModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by Assigned To</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users?.map((u) => (
              <div
                key={u.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
              >
                <Checkbox
                  id={`ato-${u.id}`}
                  checked={assignedToFilter.includes(u.id)}
                  onCheckedChange={() => toggleAssignedTo(u.id)}
                />
                <Label htmlFor={`ato-${u.id}`} className="flex-1 cursor-pointer">
                  {u.full_name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" size="sm" onClick={clearAssignedTo}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
            <Button size="sm" onClick={() => setAssignedToModalOpen(false)}>
              <Check className="mr-1 h-4 w-4" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- ASSIGNED BY MODAL ---------- */}
      <Dialog open={assignedByModalOpen} onOpenChange={setAssignedByModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by Assigned By</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
              >
                <Checkbox
                  id={`aby-${u.id}`}
                  checked={assignedByFilter.includes(u.id)}
                  onCheckedChange={() => toggleAssignedBy(u.id)}
                />
                <Label htmlFor={`aby-${u.id}`} className="flex-1 cursor-pointer">
                  {u.full_name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" size="sm" onClick={clearAssignedBy}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
            <Button size="sm" onClick={() => setAssignedByModalOpen(false)}>
              <Check className="mr-1 h-4 w-4" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;