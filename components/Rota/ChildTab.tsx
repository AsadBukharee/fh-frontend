"use client";

import { useState, useEffect } from "react";
import { format, getISOWeek, parseISO, startOfDay } from "date-fns";
import {
  Users,
  Clock,
  DollarSign,
  Filter,
  Calendar,
  BarChart3,
  Loader2,
  Check,
  Euro,
} from "lucide-react";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription } from "../ui/alert";
import { ShiftCard } from "./shift-card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
} from "recharts";
import React from "react";
import ExportButton from "@/app/utils/ExportButton";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAutoScroll } from "@/app/utils/useAutoScroll";

// Interfaces
interface Shift {
  id: number;
  date: string;
  dayname: string;
  week_number: number;
  status: string;
  daily_salary: number;
  daily_hours: number;
  shift_detail: {
    id: number;
    name: string;
    hours_from: string;
    hours_to: string;
    total_hours: string;
    colors: string;
    rate_per_hours: number;
    shift_note: string;
  };
  user?: User;
}
interface ShiftList {
  id: number;
  name: string;
  template: boolean;
  hours_from: string;
  hours_to: string;
  total_hours: string;
  shift_note: string;
  rate_per_hours: number;
  colors: string;
  contract: number | null;
  created_at: string;
  updated_at: string;
}
interface User {
  id: number;
  full_name: string;
  display_name?: string | null;
  email: string;
  is_active?: boolean | null;
  role?: string | null;
  avatar?: string | null;
  contract?: {
    id: number;
    name: string;
    description: string;
  } | null;
  parent_rota_completed?: boolean | null;
  shifts: ShiftList[];
  child_rota_completed?: boolean | null;
}
interface DailyStats {
  date: string;
  users_working: number;
  total_staff: number;
  total_drivers: number;
  total_holidays: number;
  total_sick: number;
  total_salary: number;
  total_hours: number;
}
interface ApiResponse {
  rota_by_user: Array<{
    user: User;
    rota: Shift[];
  }>;
  daily_stats: DailyStats[];
  salary_weekly: Record<string, Record<string, number>>;
  salary_monthly: Record<string, Record<string, number>>;
  total_users: number;
  total_rota_entries: number;
  month: number;
  year: number;
}
interface ShiftTableProps {
  year: number;
  month: number;
  refreshKey?: number;
}

// Constants
const WEEK_COLORS = {
  "Week 1": "#3b82f6",
  "Week 2": "#10b981",
  "Week 3": "#f59e0b",
  "Week 4": "#ef4444",
};
const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
};
const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
];
const DEFAULT_SHIFT_COLOR = "#A5D8FF";

// Helper functions
const generateMonths = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = -6; i <= 5; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1,
    );
    months.push({
      value: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: format(date, "MMMM yyyy"),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }
  return months;
};

const normalizeDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    return format(startOfDay(date), "yyyy-MM-dd");
  } catch (error) {
    console.warn(`Invalid date format: ${dateStr}`);
    return dateStr.split("T")[0];
  }
};

const parseTimeToDecimal = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 0;
  // Handle cases like "09:30" or "09:30:00" or "9:00:"
  const cleanTime = timeStr.replace(/:$/, ""); // Remove trailing colon if any
  const parts = cleanTime.split(":");
  if (parts.length < 2) return parseFloat(cleanTime) || 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours + (isNaN(minutes) ? 0 : minutes / 60);
};

// Main component
export function ShiftTable({ year, month, refreshKey }: ShiftTableProps) {
  const [childRotaUsers, setChildRotaUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${year}-${month}`,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalEntries: number;
    dailyStats: DailyStats[];
    salaryData: Record<string, Record<string, number>>;
  } | null>(null);
  const cookies = useCookies();
  const role = cookies.get("role");
  const months = generateMonths();

  const { handleExpandedChange } = useAutoScroll(loading, "rota_child_table");

  const currentMonthData =
    months.find((m) => m.value === selectedMonth) || months[6];
  const startDate = startOfDay(
    new Date(currentMonthData.year, currentMonthData.month - 1, 1),
  );
  const endDate = startOfDay(
    new Date(currentMonthData.year, currentMonthData.month, 0),
  );

  const fetchData = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const [yearStr, monthStr] = selectedMonth.split("-");
      const monthNumber = Number.parseInt(monthStr);
      const queryParams = new URLSearchParams();
      queryParams.append("month", monthNumber.toString());
      if (selectedUser) {
        queryParams.append("user_id", selectedUser.toString());
      }
      const apiUrl = `${API_URL}/api/rota/child-rota/?${queryParams.toString()}`;

      const shiftsResponse = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });

      if (!shiftsResponse.ok) {
        if (shiftsResponse.status === 401 && retryCount < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * 2 ** retryCount),
          );
          return fetchData(retryCount + 1);
        }
        throw new Error(
          shiftsResponse.status === 401
            ? "Authentication failed. Please log in again."
            : `Failed to fetch shifts: ${shiftsResponse.statusText}`,
        );
      }

      const shiftsData: ApiResponse = await shiftsResponse.json();

      const usersFromChildRota = shiftsData.rota_by_user.map((entry) => ({
        ...entry.user,
        display_name:
          entry.user.display_name || entry.user.full_name || "Unknown",
        is_active: entry.user.is_active ?? true,
        role: entry.user.role || "No Role",
        contract: entry.user.contract || null,
        parent_rota_completed: entry.user.parent_rota_completed ?? false,
        child_rota_completed: entry.user.child_rota_completed ?? true,
      }));
      setChildRotaUsers(usersFromChildRota);

      const allShifts = shiftsData.rota_by_user.flatMap((entry) =>
        entry.rota.map((shift: Shift) => {
          const hoursStr = shift.shift_detail.total_hours;
          const hours = parseTimeToDecimal(hoursStr);
          const calculatedSalary = hours * shift.shift_detail.rate_per_hours;

          if (
            shift.daily_salary !== undefined &&
            shift.daily_salary !== 0 &&
            Math.abs(shift.daily_salary - calculatedSalary) > 0.01
          ) {
            console.warn(
              `Salary mismatch for shift ${shift.id}: API=${shift.daily_salary}, Calculated=${calculatedSalary}`,
            );
          }
          return {
            ...shift,
            date: normalizeDate(shift.date),
            user: {
              ...entry.user,
              display_name:
                entry.user.display_name || entry.user.full_name || "Unknown",
              is_active: entry.user.is_active ?? true,
              role: entry.user.role || "No Role",
              contract: entry.user.contract || null,
              parent_rota_completed: entry.user.parent_rota_completed ?? false,
              child_rota_completed: entry.user.child_rota_completed ?? true,
            },
            daily_hours: shift.daily_hours !== undefined ? shift.daily_hours : hours,
            daily_salary: shift.daily_salary !== undefined ? shift.daily_salary : calculatedSalary,
          };
        }),
      );
      setShifts(allShifts);
      setStats({
        totalUsers: shiftsData.total_users,
        totalEntries: shiftsData.total_rota_entries,
        dailyStats: shiftsData.daily_stats.map((stat) => ({
          ...stat,
          date: normalizeDate(stat.date),
        })),
        salaryData: shiftsData.salary_monthly,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedUser, cookies, refreshKey]);

  const filteredUsers = childRotaUsers.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const filteredShifts = shifts.filter((shift) => {
    const shiftDate = startOfDay(parseISO(shift.date));
    return (
      shiftDate >= startDate &&
      shiftDate <= endDate &&
      (!selectedUser || shift.user?.id === selectedUser)
    );
  });

  const summaryStats = {
    totalHours: filteredShifts.reduce(
      (sum, shift) => sum + shift.daily_hours,
      0,
    ),
    totalSalary: filteredShifts.reduce(
      (sum, shift) => sum + shift.daily_salary,
      0,
    ),
    activeUsers: new Set(filteredShifts.map((shift) => shift.user?.id)).size,
    averageHoursPerDay:
      filteredShifts.length > 0
        ? filteredShifts.reduce((sum, shift) => sum + shift.daily_hours, 0) /
        filteredShifts.length
        : 0,
  };

  const prepareChartData = () => {
    const dailyData: Record<
      string,
      {
        date: string;
        hours: number;
        salary: number;
        users: Set<number | undefined>;
      }
    > = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = format(d, "MMM dd");
      dailyData[date] = { date, hours: 0, salary: 0, users: new Set() };
    }
    filteredShifts.forEach((shift) => {
      const date = format(parseISO(shift.date), "MMM dd");
      dailyData[date].hours += shift.daily_hours;
      dailyData[date].salary += shift.daily_salary;
      dailyData[date].users.add(shift.user?.id);
    });
    const dailyChartData = Object.values(dailyData).map((item) => ({
      date: item.date,
      hours: item.hours,
      salary: item.salary,
      users: item.users.size,
    }));

    const userPerformance = childRotaUsers
      .map((user) => {
        const userShifts = filteredShifts.filter(
          (shift) => shift.user?.id === user.id,
        );
        return {
          name: (user.display_name || user.full_name)?.split(" ")[0],
          fullName: user.display_name || user.full_name,
          hours: userShifts.reduce((sum, shift) => sum + shift.daily_hours, 0),
          salary: userShifts.reduce(
            (sum, shift) => sum + shift.daily_salary,
            0,
          ),
          shifts: userShifts.length,
          avatar: user.avatar,
        };
      })
      .filter((user) => user.shifts > 0);

    const shiftTypeData = filteredShifts.reduce(
      (acc, shift) => {
        const type = shift.shift_detail.name;
        if (!acc[type]) {
          acc[type] = {
            name: type,
            count: 0,
            hours: 0,
            color: shift.shift_detail.colors || DEFAULT_SHIFT_COLOR,
          };
        }
        acc[type].count += 1;
        acc[type].hours += shift.daily_hours;
        return acc;
      },
      {} as Record<
        string,
        { name: string; count: number; hours: number; color: string }
      >,
    );
    const shiftTypePieData = Object.values(shiftTypeData);

    const roleData = childRotaUsers.reduce(
      (acc, user) => {
        const role = user.role || "No Role";
        if (!acc[role]) {
          acc[role] = { name: role, count: 0 };
        }
        acc[role].count += 1;
        return acc;
      },
      {} as Record<string, { name: string; count: number }>,
    );
    const rolePieData = Object.values(roleData);

    return {
      dailyChartData,
      userPerformance,
      shiftTypePieData,
      rolePieData,
    };
  };
  const chartData = prepareChartData();

  const generateDaysForMonth = () => {
    const days = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start);
    while (date <= end) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const groupDaysByWeek = (days: Date[]) => {
    const weeks: { days: Date[]; weekLabel: string; weekColor: string }[] = [];
    let currentWeek: Date[] = [];
    let currentWeekNumber = 0;
    days.forEach((day, index) => {
      const dayShifts = filteredShifts.filter(
        (shift) => shift.date === format(day, "yyyy-MM-dd"),
      );
      const weekNumber =
        dayShifts.length > 0
          ? dayShifts[0].week_number
          : getISOWeek(day) % 4 || 4;
      if (index === 0 || weekNumber !== currentWeekNumber) {
        if (currentWeek.length > 0) {
          weeks.push({
            days: currentWeek,
            weekLabel: `Week ${currentWeekNumber}`,
            weekColor:
              WEEK_COLORS[
              `Week ${currentWeekNumber}` as keyof typeof WEEK_COLORS
              ] || "#3b82f6",
          });
        }
        currentWeek = [];
        currentWeekNumber = weekNumber;
      }
      currentWeek.push(day);
      if (index === days.length - 1) {
        weeks.push({
          days: currentWeek,
          weekLabel: `Week ${currentWeekNumber}`,
          weekColor:
            WEEK_COLORS[
            `Week ${currentWeekNumber}` as keyof typeof WEEK_COLORS
            ] || "#3b82f6",
        });
      }
    });
    return weeks;
  };

  const days = generateDaysForMonth();
  const weeks = groupDaysByWeek(days);

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-GB", { weekday: "long" });
  };

  const getRoleColor = (role: string | null | undefined) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "manager":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWeekColor = (date: Date) => {
    const dayShifts = filteredShifts.filter(
      (shift) => shift.date === format(date, "yyyy-MM-dd"),
    );
    const weekNumber =
      dayShifts.length > 0
        ? dayShifts[0].week_number
        : getISOWeek(date) % 4 || 4;
    return (
      WEEK_COLORS[`Week ${weekNumber}` as keyof typeof WEEK_COLORS] || "#3b82f6"
    );
  };

  const uniqueRoles = Array.from(
    new Set(childRotaUsers.map((user) => user.role).filter(Boolean)),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading child rota...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <button
              className="ml-4 text-blue-600 underline"
              onClick={() => fetchData()}
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Statistics with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryStats.totalHours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Avg: {summaryStats.averageHoursPerDay.toFixed(1)} hrs/day
            </p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.dailyChartData.slice(-7)}>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)} ${name}`,
                      name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {role === "superadmin" ? (
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Salary
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                £{summaryStats.totalSalary.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                For {currentMonthData.label}
              </p>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.dailyChartData.slice(-7)}>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        `£${value.toFixed(2)}`,
                        name,
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="salary"
                      stroke={CHART_COLORS.secondary}
                      fill={CHART_COLORS.secondary}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summaryStats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Out of {childRotaUsers.length} total
            </p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.rolePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={30}
                    dataKey="count"
                  >
                    {chartData.rolePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shift Type Distribution
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {chartData.shiftTypePieData.length} Types
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Shift types assigned
            </p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.shiftTypePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={30}
                    dataKey="count"
                  >
                    {chartData.shiftTypePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.color || PIE_COLORS[index % PIE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter shifts by month, user, and role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExportButton data={childRotaUsers} />
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Users</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={selectedUser !== null ? selectedUser.toString() : "all"}
                onValueChange={(value) =>
                  setSelectedUser(value === "all" ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {user.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role!}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between flex-row w-full items-center">
          <div>
            <CardTitle className="text-lg">Shift Schedule</CardTitle>
            <CardDescription>
              {selectedUser
                ? `Showing shifts for ${childRotaUsers.find((u) => u.id === selectedUser)?.full_name
                } - ${currentMonthData.label}`
                : `Showing all shifts for ${currentMonthData.label}`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative max-h-[70vh] overflow-auto rounded-lg border">
            <table className="w-full border-collapse text-sm text-center">
              <thead className="[&_tr]:border-b border-gray-300">
                <tr>
                  {/* Day column - sticky top-left */}
                  <th
                    className="sticky top-0 left-0 z-30 py-3 bg-gray-50 border border-gray-300"
                    style={{ minWidth: "120px" }}
                  >
                    Day
                  </th>

                  {/* User columns - sticky top */}
                  {(selectedUser ? childRotaUsers.filter(u => u.id === selectedUser) : filteredUsers).map(user => (
                    <th
                      key={user.id}
                      className="sticky top-0 z-20 bg-gray-50 border border-gray-300"
                      style={{ minWidth: "200px", maxWidth: "200px" }}
                    >
                      {user.full_name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="[&_tr:last-child]:border-0">
                {weeks.map((week, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {/* Week label row */}
                    <tr className="bg-gray-100 ">
                      <td
                        colSpan={(selectedUser ? 1 : filteredUsers.length) + 1}
                        className="font-semibold p-2 text-left"
                        style={{ backgroundColor: week.weekColor, color: "#fff" }}
                      >
                        {week.weekLabel}
                      </td>
                    </tr>

                    {/* Daily rows */}
                    {week.days.map((dayData, dayIndex) => {
                      const dayStr = format(dayData, "yyyy-MM-dd");
                      return (
                        <tr
                          key={dayStr}
                          className={dayIndex % 2 === 0 ? "bg-white" : "bg-[#FFF4F4]/40"}
                        >
                          {/* Day cell - sticky left */}
                          <td
                            className="sticky left-0 z-10 font-medium whitespace-nowrap border border-gray-300"
                            style={{ minWidth: "120px", color: getWeekColor(dayData), backgroundColor: "#fff" }}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="flex flex-col items-center justify-center py-2 px-1 cursor-pointer hover:bg-gray-50 transition-colors w-full h-full">
                                  <div className="font-semibold text-sm">{getDayName(dayData)}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {format(dayData, "dd/MM/yyyy")}
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 border-none shadow-none" side="right" align="start">
                                <Card className="shadow-xl border border-gray-200 min-w-[220px]">
                                  <CardHeader className="p-3 bg-gray-50 border-b">
                                    <CardTitle className="text-xs font-bold flex items-center gap-2">
                                      <Calendar className="h-3 w-3 text-blue-500" />
                                      {format(dayData, "EEEE, MMMM do")}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-3 space-y-2">
                                    {(() => {
                                      const dayStat = stats?.dailyStats.find(s => s.date === dayStr);
                                      if (!dayStat) return <p className="text-[10px] text-muted-foreground italic">No daily stats available</p>;

                                      return (
                                        <>
                                          <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                                            <div className="space-y-1">
                                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Salary</p>
                                              <p className="text-sm font-bold text-green-600">£{dayStat.total_salary.toFixed(2)}</p>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hours</p>
                                              <p className="text-sm font-bold text-blue-600">{dayStat.total_hours.toFixed(1)}h</p>
                                            </div>
                                          </div>
                                          <div className="space-y-1.5 py-1">
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                                                <Users className="h-2.5 w-2.5" /> Staff Working
                                              </div>
                                              <span className="text-[10px] font-semibold">{dayStat.users_working}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                                                <Check className="h-2.5 w-2.5" /> Drivers
                                              </div>
                                              <span className="text-[10px] font-semibold">{dayStat.total_drivers}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium text-orange-600">
                                                <Calendar className="h-2.5 w-2.5" /> Holidays
                                              </div>
                                              <span className="text-[10px] font-bold text-orange-600">{dayStat.total_holidays}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium text-red-600">
                                                <BarChart3 className="h-2.5 w-2.5" /> Sick Leave
                                              </div>
                                              <span className="text-[10px] font-bold text-red-600">{dayStat.total_sick}</span>
                                            </div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </CardContent>
                                </Card>
                              </PopoverContent>
                            </Popover>
                          </td>


                          {/* User shift cells */}
                          {(selectedUser ? childRotaUsers.filter(u => u.id === selectedUser) : filteredUsers).map(user => {
                            const userShift = filteredShifts.find(
                              shift => shift.date === dayStr && shift.user?.id === user.id
                            );
                            const cellId = `cell-${user.id}-${dayStr}`;

                            return (
                              <td key={user.id} id={cellId} className="p-2" style={{ minWidth: "200px", border: "1px solid #D1D5DB" }}>
                                {userShift ? (
                                  <ShiftCard
                                    shiftType={userShift.shift_detail.name}
                                    shift_cell_id={userShift.id}
                                    onShiftUpdate={() => {
                                      handleExpandedChange(cellId);
                                      fetchData();
                                    }}
                                    shift_id={userShift.shift_detail.id}
                                    shift_list={userShift?.user?.shifts ?? []}
                                    shift_daily_salary={userShift.daily_salary}
                                    color={userShift.shift_detail.colors || DEFAULT_SHIFT_COLOR}
                                    rate={userShift.shift_detail.rate_per_hours}
                                    total_hours={userShift.daily_hours}
                                    staffName={user.full_name}
                                    date={userShift.date}
                                    showHourlyRate={role === "superadmin" || role === "admin"}
                                  />
                                ) : (
                                  <div className="h-16 w-full rounded-md bg-gray-100/50 border-dashed border border-gray-300 flex items-center justify-center text-xs text-gray-400">
                                    No shift
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Spacer row */}
                    {weekIndex < weeks.length - 1 && (
                      <tr className="h-2 bg-gray-200">
                        <td colSpan={(selectedUser ? 1 : filteredUsers.length) + 1} />
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>




      </Card>

    </div>
  );
}
