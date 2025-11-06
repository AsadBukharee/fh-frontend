"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCookies } from "next-client-cookies";
import { format, parseISO } from "date-fns";
import API_URL from "@/app/utils/ENV";

/* -------------------------------------------------
   Types – only the shape we need from the new API
   ------------------------------------------------- */
interface ComplianceTask {
  id: number;
  title: string;
  description: string;
  deadline: string; // ISO
  priority: "low" | "medium" | "high";
  status: string;
  is_overdue: boolean;
  days_until_deadline: number;
  created_at: string;
  assigned_to: {
    id: number;
    full_name: string;
    email: string;
    role: string;
  };
  // …other fields omitted for brevity
}

interface ComplianceCategory {
  count: number;
  items: Record<string, ComplianceTask[]>;
}

/* -------------------------------------------------
   Header component
   ------------------------------------------------- */
export function Header() {
  /* ----- category config (icons + labels) ----- */
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

  /* ----- state ----- */
  const [complianceData, setComplianceData] = useState<Record<
    string,
    ComplianceCategory
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] =
    useState<keyof typeof categoryConfig | null>(null);
  const badgeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cookies = useCookies();

  /* ----- fetch compliance data (once) ----- */
  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/task-alerts/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load compliance data");
        const json = await res.json();

        // The API returns an object with top-level categories
        setComplianceData(json);
        setLoading(false);
      } catch (err: any) {
        setError(err.message ?? "Error loading compliance data");
        setLoading(false);
      }
    };

    fetchCompliance();
  }, [cookies]);

  /* ----- helper: flatten items for a category ----- */
  const getItemsForCategory = (
    category: keyof typeof categoryConfig
  ): ComplianceTask[] => {
    if (!complianceData) return [];

    if (category === "all") {
      return Object.values(complianceData).flatMap((cat) =>
        Object.values(cat.items).flat()
      );
    }

    // Map UI categories → API keys
    const apiKeyMap: Record<string, string> = {
      drivers: "Drivers Compliance",
      vehicles: "Vehicle Compliance",
      walkarounds: "Walkarounds",
      rotas: "Rotas",
      duty_logs: "Duty & WTD Logs",
      mechanic: "Mechanic",
      other: "Other",
    };

    const apiKey = apiKeyMap[category] ?? category;
    const cat = complianceData[apiKey];
    if (!cat) return [];

    return Object.values(cat.items).flat();
  };

  /* ----- counts (badge numbers) ----- */
  const counts: Record<keyof typeof categoryConfig, number> = complianceData
    ? Object.entries(complianceData).reduce(
        (acc, [apiKey, cat]) => {
          const uiKey = (Object.entries({
            "Drivers Compliance": "drivers",
            "Vehicle Compliance": "vehicles",
            Walkarounds: "walkarounds",
            Rotas: "rotas",
            "Duty & WTD Logs": "duty_logs",
            Mechanic: "mechanic",
            Other: "other",
          }) as [string, keyof typeof categoryConfig][]).find(([k]) => k === apiKey)?.[1];

          if (uiKey) acc[uiKey] = cat.count;
          return acc;
        },
        {} as Record<keyof typeof categoryConfig, number>
      )
    : ({} as Record<keyof typeof categoryConfig, number>);

  const totalCount = Object.values(counts).reduce((s, c) => s + c, 0);
  counts.all = totalCount;

  const updatedCategoryConfig = Object.fromEntries(
    Object.entries(categoryConfig).map(([k, v]) => [
      k,
      { ...v, count: counts[k as keyof typeof counts] ?? 0 },
    ])
  ) as unknown as typeof categoryConfig;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <SearchBar />
        </div>

        <div className="flex items-center space-x-4">
          {/* ----- notification dropdowns ----- */}
          {Object.entries(updatedCategoryConfig).map(
            ([category, { icon: Icon, label, count }]) => (
              <DropdownMenu
                key={category}
                open={openDropdown === category}
                onOpenChange={(open) =>
                  setOpenDropdown(open ? (category as any) : null)
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative w-10 h-10 rounded-full flex justify-center items-center bg-gray-100 hover:bg-gray-300"
                    ref={(el) => { badgeRefs.current[category] = el; }}
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
                      Loading…
                    </DropdownMenuItem>
                  ) : error ? (
                    <DropdownMenuItem className="text-center text-red-500">
                      {error}
                    </DropdownMenuItem>
                  ) : getItemsForCategory(category as any).length === 0 ? (
                    <DropdownMenuItem className="text-center text-gray-500">
                      No items
                    </DropdownMenuItem>
                  ) : (
                    getItemsForCategory(category as any).map((task) => (
                      <DropdownMenuItem
                        key={task.id}
                        className={`flex flex-col items-start p-4 ${
                          task.is_overdue ? "bg-red-50" : "bg-white"
                        }`}
                      >
                        <div className="flex w-full justify-between">
                          <div>
                            <p className="font-semibold">{task.title}</p>
                            <p className="text-sm text-gray-600">
                              {task.description}
                            </p>
                          </div>
                          {task.is_overdue && (
                            <span className="text-xs text-red-600 font-medium">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex w-full justify-between text-xs text-gray-400">
                          <span>
                            Assigned to: {task.assigned_to.full_name}
                          </span>
                          <span>
                            Deadline:{" "}
                            {format(parseISO(task.deadline), "PPP")}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          Created {format(parseISO(task.created_at), "PPPp")}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}

          <StateDialog />
          <UserProfileDropdown />
        </div>
      </div>

      <Breadcrumbs />
    </header>
  );
}