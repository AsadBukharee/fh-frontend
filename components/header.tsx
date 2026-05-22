"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { SearchBar } from "./header/SearchBar";
import { UserProfileDropdown } from "./header/UserProfileDropdown";
import { Breadcrumbs } from "./header/Breadcrumbs";
import StateDialog from "./header/StateDialog";
import {
  AlertCircle,
  Bell,
  Calendar,
  ClipboardList,
  Footprints,
  Truck,
  User,
  Wrench,
  FileText,
  HardDrive,
  CheckSquare,
  Database,
  Eye,
  Trash2,
  X,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCookies } from "next-client-cookies";
import { format, parseISO } from "date-fns";
import API_URL from "@/app/utils/ENV";
import Link from "next/link";
import AssignSite from "./header/AssignSite";
import UkTime from "./UkTime";
import Roles from "./Roles";


/* -------------------------------------------------
   Types
   ------------------------------------------------- */
interface AssignedUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}
interface TaskType {
  id: number;
  name: string;
}
export interface ComplianceTask {
  id: number;
  title: string;
  description: string;
  deadline: string;
  priority: "low" | "medium" | "high";
  status: string;
  is_overdue: boolean;
  days_until_deadline: number;
  created_at: string;
  task_type?: TaskType;
  assigned_to: AssignedUser;
  reason?: string | null;
}
interface ComplianceCategory {
  count: number;
  items: Record<string, ComplianceTask[]>;
}

/* -------------------------------------------------
   Icon map
   ------------------------------------------------- */
const iconMap: Record<string, React.FC<any>> = {
  "Drivers Compliance": User,
  "Vehicle Compliance": Truck,
  Walkarounds: Footprints,
  Rotas: Calendar,
  "Duty & WTD Logs": ClipboardList,
  Mechanic: Wrench,
  "PMI's & MOT's": FileText,
  Tachos: HardDrive,
  Audits: CheckSquare,
  "SU Data": Database,
  Other: AlertCircle,
};

/* -------------------------------------------------
   Helper: optimistic update (no react-query)
   ------------------------------------------------- */
function optimisticRemoveTask(
  data: Record<string, ComplianceCategory> | null,
  taskId: number
): Record<string, ComplianceCategory> | null {
  if (!data) return data;
  const newData = { ...data };
  Object.values(newData).forEach((cat) => {
    Object.values(cat.items).forEach((list) => {
      const idx = list.findIndex((t) => t.id === taskId);
      if (idx !== -1) list.splice(idx, 1);
    });
    cat.count = Object.values(cat.items).flat().length;
  });
  return newData;
}

/* -------------------------------------------------
   Priority Badge Component
   ------------------------------------------------- */
const PriorityBadge = ({ priority }: { priority: "low" | "medium" | "high" | undefined | null }) => {
  const colors: Record<string, string> = {
    low: "bg-blue-100 text-blue-700 border-blue-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
  };
  if (!priority) return null;
  return (
    <Badge variant="outline" className={`text-xs ${colors[priority] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {priority.toUpperCase()}
    </Badge>
  );
};

/* -------------------------------------------------
   Header Component
   ------------------------------------------------- */
export function Header() {
  const cookies = useCookies();
  const [complianceData, setComplianceData] = useState<Record<string, ComplianceCategory> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [activeSubCat, setActiveSubCat] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ----- Fetch ----- */
  useEffect(() => {
    const fetchCompliance = async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/task-alerts/`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json: Record<string, ComplianceCategory> = await res.json();
        setComplianceData(json);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? "Load error");
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
    const id = setInterval(fetchCompliance, 60_000);
    return () => {
      clearInterval(id);
      abortControllerRef.current?.abort();
    };
  }, [cookies]);

  /* ----- UI Categories ----- */
  const uiCategories = useMemo(() => {
    const order = [
      "Drivers Compliance",
      "Vehicle Compliance",
      "Walkarounds",
      "Rotas",
      "Duty & WTD Logs",
      "Mechanic",
      "PMI's & MOT's",
      "Tachos",
      "Audits",
      "SU Data",
      "Other",
    ];

    if (!complianceData) {
      return order.reduce((acc, k) => {
        acc[k] = {
          label: k,
          icon: iconMap[k] ?? AlertCircle,
          count: 0,
        };
        return acc;
      }, {} as Record<string, { label: string; icon: React.FC<any>; count: number }>);
    }

    const counts: Record<string, number> = {};
    Object.entries(complianceData).forEach(([k, c]) => {
      counts[k] = c.count;
    });

    return order.reduce((acc, k) => {
      acc[k] = {
        label: k,
        icon: iconMap[k] ?? AlertCircle,
        count: counts[k] ?? 0,
      };
      return acc;
    }, {} as Record<string, { label: string; icon: React.FC<any>; count: number }>);
  }, [complianceData]);

  /* ----- View (PUT) ----- */
  const markAsViewed = async (taskId: number) => {
    const previous = complianceData;
    setComplianceData((d) => optimisticRemoveTask(d, taskId));

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ status: "viewed" }),
      });
      if (!res.ok) throw new Error("Failed to mark as viewed");
    } catch (err) {
      setComplianceData(previous);
      alert("Could not mark task as viewed");
    }
  };

  /* ----- Delete (DELETE) ----- */
  const deleteTask = async (taskId: number) => {
    if (!window.confirm("Delete this task?")) return;

    const previous = complianceData;
    setComplianceData((d) => optimisticRemoveTask(d, taskId));

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete task");
    } catch (err) {
      setComplianceData(previous);
      alert("Could not delete task");
    }
  };

  /* ----- Task Row with icons ----- */
  const TaskRow = ({ task }: { task: ComplianceTask }) => {
    const [viewing, setViewing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const stripHtml = (html: string) => {
      if (!html) return "";
      return html.replace(/<[^>]*>?/gm, '');
    };

    const handleView = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (viewing) return;
      setViewing(true);
      await markAsViewed(task.id);
      setViewing(false);
    };

    const handleDelete = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (deleting) return;
      setDeleting(true);
      await deleteTask(task.id);
      setDeleting(false);
    };

    return (
      <div
        className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${task.is_overdue
          ? "bg-red-50 border-red-200 hover:border-red-300"
          : "bg-white border-gray-200 hover:border-gray-300"
          }`}
      >
        <Link
          href={`/dashboard/tasks/task-management/${task.id}`}
          className="block"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                {task.title}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {stripHtml(task.description)}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <PriorityBadge priority={task.priority} />
              {task.is_overdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs mb-3">
            {task.task_type && (
              <div className="flex items-center gap-1 text-gray-600">
                <span className="font-medium">Type:</span>
                <span>{task.task_type.name}</span>
              </div>
            )}
            {task.reason && (
              <div className="flex items-center gap-1 text-gray-600">
                <span className="font-medium">Reason:</span>
                <span className="truncate max-w-[150px]">{stripHtml(task.reason)}</span>
              </div>
            )}
          </div>
        </Link>

        {/* ---- FOOTER WITH ICONS ---- */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col gap-1 text-xs">
            {task.assigned_to?.full_name && (
              <div className="flex items-center gap-1 text-gray-600">
                <User className="h-3 w-3" />
                <span className="font-medium">{task.assigned_to.full_name}</span>
              </div>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {(() => {
                    try {
                      return format(parseISO(task.deadline), "MMM dd, yyyy");
                    } catch {
                      return task.deadline;
                    }
                  })()}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-1">
            {task.status === "not_viewed" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleView}
                disabled={viewing}
                title="Mark as viewed"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* ----- Render ----- */
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 justify-evenly">
          <SearchBar />
          <AssignSite />
          {/* <TimeZone/> */}
          <UkTime />
          <Roles />
        </div>

        <div className="flex items-center space-x-2 h-[60px] overflow-x-auto pb-1">
          {Object.entries(uiCategories).map(([key, { label, icon: Icon, count }]) => (
            <DropdownMenu
              key={key}
              open={openDropdown === key}
              onOpenChange={(open) => {
                setOpenDropdown(open ? key : null);
                if (!open) {
                  setDropdownSearch("");
                  setActiveSubCat("");
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`relative w-10 h-10 rounded-full flex justify-center items-center transition-all ${count > 0
                    ? "bg-red-100 hover:bg-red-200 text-red-700"
                    : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm animate-pulse">
                      {count}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[480px] max-h-[75vh] overflow-hidden p-0 shadow-lg"
                align="end"
                sideOffset={8}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-700" />
                    <h3 className="font-semibold text-base text-gray-900">{label}</h3>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {count} {count === 1 ? "task" : "tasks"}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setOpenDropdown(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search input */}
                {!loading && !error && (complianceData?.[key]?.count ?? 0) > 0 && (
                  <div className="px-4 py-2 border-b bg-white">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search tasks..."
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                      />
                      {dropdownSearch && (
                        <button
                          onClick={() => setDropdownSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : (
                  (() => {
                    const cat = complianceData?.[key];
                    if (!cat || cat.count === 0) {
                      return (
                        <div className="p-8 text-center">
                          <CheckSquare className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700">All caught up!</p>
                          <p className="text-xs text-gray-500 mt-1">No pending tasks</p>
                        </div>
                      );
                    }
                    const searchLower = dropdownSearch.toLowerCase().trim();
                    const subCats = Object.entries(cat.items).map(([sub, tasks]) => {
                      if (!searchLower) return [sub, tasks] as [string, ComplianceTask[]];
                      const filtered = tasks.filter((t) => {
                        const haystack = [
                          t.title,
                          t.description,
                          t.assigned_to?.full_name,
                          t.task_type?.name,
                          t.reason,
                          t.status,
                          t.priority,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase();
                        return haystack.includes(searchLower);
                      });
                      return [sub, filtered] as [string, ComplianceTask[]];
                    });
                    const totalFiltered = subCats.reduce((sum, [, tasks]) => sum + tasks.length, 0);
                    if (searchLower && totalFiltered === 0) {
                      return (
                        <div className="p-8 text-center">
                          <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-600">No matching tasks</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      );
                    }
                    const currentSub = activeSubCat || "All";
                    const currentTasks = currentSub === "All"
                      ? subCats.flatMap(([, tasks]) => tasks)
                      : subCats.find(([sub]) => sub === currentSub)?.[1] || [];

                    return (
                      <div className="w-full">
                        <div className="p-4 border-b bg-gray-50/50">
                          <Select
                            value={currentSub}
                            onValueChange={setActiveSubCat}
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">
                                <span className="flex items-center justify-between w-full min-w-[200px] gap-2">
                                  <span className="truncate font-semibold">All Categories</span>
                                  {totalFiltered > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-auto h-5 min-w-[20px] rounded-full px-1.5 text-xs bg-blue-100 text-blue-700"
                                    >
                                      {totalFiltered}
                                    </Badge>
                                  )}
                                </span>
                              </SelectItem>
                              {subCats.map(([sub, tasks]) => (
                                <SelectItem key={sub} value={sub}>
                                  <span className="flex items-center justify-between w-full min-w-[200px] gap-2">
                                    <span className="truncate">{sub}</span>
                                    {tasks.length > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-auto h-5 min-w-[20px] rounded-full px-1.5 text-xs bg-blue-100 text-blue-700"
                                      >
                                        {tasks.length}
                                      </Badge>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <ScrollArea className="h-[calc(75vh-140px)]">
                          <div className="p-4 space-y-3">
                            {currentTasks.length === 0 ? (
                              <div className="py-8 text-center">
                                <p className="text-sm text-gray-400 italic">No tasks in this category</p>
                              </div>
                            ) : (
                              currentTasks.map((t) => <TaskRow key={t.id} task={t} />)
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    );
                  })()
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