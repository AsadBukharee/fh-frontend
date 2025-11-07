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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCookies } from "next-client-cookies";
import { format, parseISO } from "date-fns";
import API_URL from "@/app/utils/ENV";
import Link from "next/link";

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
  all: Bell,
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
   Header Component
   ------------------------------------------------- */
export function Header() {
  const cookies = useCookies();
  const [complianceData, setComplianceData] = useState<Record<string, ComplianceCategory> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      "all",
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
          label: k === "all" ? "All" : k,
          icon: iconMap[k] ?? AlertCircle,
          count: 0,
        };
        return acc;
      }, {} as Record<string, { label: string; icon: React.FC<any>; count: number }>);
    }

    const counts: Record<string, number> = {};
    let total = 0;
    Object.entries(complianceData).forEach(([k, c]) => {
      counts[k] = c.count;
      total += c.count;
    });
    counts["all"] = total;

    return order.reduce((acc, k) => {
      acc[k] = {
        label: k === "all" ? "All" : k,
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
        className={`p-3 rounded-md min-w-full my-2 cursor-pointer ${
          task.is_overdue ? "bg-red-50 border border-red-200" : "bg-gray-50"
        }`}
      >
        <Link
          href={`/dashboard/tasks/task-management/${task.id}`}
          className="flex justify-between items-start"
        >
          <div className="flex-1">
            <p className="font-medium text-sm">{task.title.slice(0, 30)}...</p>
            <p className="text-xs text-gray-600">{task.description.slice(0, 50)}...</p>
            {task.task_type && (
              <p className="text-xs text-gray-500">Type: {task.task_type.name}</p>
            )}
            {task.reason && (
              <p className="text-xs text-gray-500">Reason: {task.reason}</p>
            )}
          </div>
          {task.is_overdue && (
            <Badge variant="destructive" className="ml-2">
              Overdue
            </Badge>
          )}
        </Link>

        {/* ---- ICONS ---- */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>Assigned: {task.assigned_to.full_name}</span>
          <span>Due: {format(parseISO(task.deadline), "PPP")}</span>

          <div className="flex gap-1 ml-2">
            {
              task.status=="not_viewed" &&(
                <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleView}
              disabled={viewing}
              title="Mark as viewed"
            >
              <Eye className="h-4 w-4" />
            </Button>
              )
            }

            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-600 hover:text-red-700"
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
        <div className="flex items-center space-x-4">
          <SearchBar />
        </div>

        <div className="flex items-center space-x-2 h-[60px] overflow-x-auto pb-1">
          {Object.entries(uiCategories).map(([key, { label, icon: Icon, count }]) => (
            <DropdownMenu
              key={key}
              open={openDropdown === key}
              onOpenChange={(open) => setOpenDropdown(open ? key : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative w-10 h-10 rounded-full flex justify-center items-center bg-gray-100 hover:bg-gray-200"
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-96 max-h-[70vh] overflow-hidden p-0"
                align="start"
                sideOffset={5}
              >
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading…</div>
                ) : error ? (
                  <div className="p-4 text-center text-red-600">{error}</div>
                ) : key === "all" ? (
                  /* ==== ALL TAB VIEW ==== */
                  <ScrollArea className="h-[70vh]">
                    <div className="p-3">
                      {Object.entries(complianceData || {}).map(([catName, cat]) => (
                        <div key={catName} className="mb-6">
                          <DropdownMenuLabel className="font-semibold text-sm">
                            {catName}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Tabs defaultValue={Object.keys(cat.items)[0]} className="mt-2">
                            <TabsList className="flex shrink-0 w-fit overflow-x-auto">
                              {Object.keys(cat.items).map((sub) => (
                                <TabsTrigger key={sub} value={sub} className="text-xs">
                                  {sub}
                                  {cat.items[sub].length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                      {cat.items[sub].length}
                                    </Badge>
                                  )}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            {Object.entries(cat.items).map(([sub, tasks]) => (
                              <TabsContent key={sub} value={sub} className="mt-3 space-y-2">
                                {tasks.length === 0 ? (
                                  <p className="text-center text-gray-400 italic text-sm">No tasks</p>
                                ) : (
                                  tasks.map((t) => <TaskRow key={t.id} task={t} />)
                                )}
                              </TabsContent>
                            ))}
                          </Tabs>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  /* ==== SINGLE CATEGORY ==== */
                  (() => {
                    const cat = complianceData?.[key];
                    if (!cat) {
                      return <div className="p-4 text-center text-gray-500">No data</div>;
                    }
                    const subCats = Object.entries(cat.items);
                    return (
                      <Tabs defaultValue={subCats[0]?.[0]} className="w-full overflow-auto">
                        <TabsList className="flex h-[80px] w-fit">
                          {subCats.map(([sub, tasks]) => (
                            <TabsTrigger key={sub} value={sub} className="text-xs">
                              {sub}
                              {tasks.length > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                  {tasks.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {subCats.map(([sub, tasks]) => (
                          <TabsContent key={sub} value={sub} className="mt-3 p-3 space-y-2">
                            <ScrollArea className="h-64">
                              {tasks.length === 0 ? (
                                <p className="text-center text-gray-400 italic text-sm">No tasks</p>
                              ) : (
                                tasks.map((t) => <TaskRow key={t.id} task={t} />)
                              )}
                            </ScrollArea>
                          </TabsContent>
                        ))}
                      </Tabs>
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