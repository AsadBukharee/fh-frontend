"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Users, Clock, DollarSign, Filter, Calendar, BarChart3, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

import { Alert, AlertDescription } from "../ui/alert"
import React from "react"
import { ShiftCard } from "./shift-card"
import {  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from "recharts"

interface User {
  id: number
  full_name: string
  display_name?: string
  email: string
  is_active?: boolean
  role?: string | null
  avatar?: string | null
  contract?: {
    id: number
    name: string
    description: string
  } | null
  parent_rota_completed?: boolean
  child_rota_completed?: boolean
}

interface Shift {
  id: number
  date: string
  dayname: string
  status: string
  daily_salary: number
  daily_hours: number
  shift_detail: {
    id: number
    name: string
    hours_from: string
    hours_to: string
    total_hours: string
    colors: string
    rate_per_hours: number
    shift_note: string
  }
  user?: User
}

interface ShiftTableProps {
  year: number
  month: number
}

interface DailyStats {
  date: string
  users_working: number
}

interface ApiResponse {
  rota_by_user: Array<{
    user: User
    rota: Shift[]
  }>
  daily_stats: DailyStats[]
  salary_weekly: Record<string, Record<string, number>>
  salary_monthly: Record<string, Record<string, number>>
  total_users: number
  total_rota_entries: number
}

// Map hex color to ShiftCard color
const hexToColorName = (hex: string): "purple" | "green" | "orange" | "red" | "cyan" => {
  const colorMapping: { [key: string]: "purple" | "green" | "orange" | "red" | "cyan" } = {
    "#CBA6AA": "purple",
    "#FFB6D1": "purple",
    "#FFD580": "orange",
    "#A5D8FF": "cyan",
    "#CBA6F7": "purple",
    "#F6C177": "orange",
    "#344601": "green",
  }
  return colorMapping[hex.toUpperCase()] || "purple"
}

// Generate months for dropdown
const generateMonths = () => {
  const months = []
  const currentDate = new Date()
  for (let i = -6; i <= 5; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    months.push({
      value: `${date.getFullYear()}-${date.getMonth()}`,
      label: format(date, "MMMM yyyy"),
      year: date.getFullYear(),
      month: date.getMonth(),
    })
  }
  return months
}

// Chart colors
const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#6366f1"]

export function ShiftTable({ year, month }: ShiftTableProps) {
  const [childRotaUsers, setChildRotaUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>(`${year}-${month}`)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalUsers: number
    totalEntries: number
    dailyStats: DailyStats[]
    salaryData: Record<string, Record<string, number>>
  } | null>(null)
  const cookies = useCookies()
  const months = generateMonths()
console.log(setSearchTerm,stats)
  // Get current month data
  const currentMonthData = months.find((m) => m.value === selectedMonth) || months[6]
  const startDate = new Date(currentMonthData.year, currentMonthData.month, 1)
  const endDate = new Date(currentMonthData.year, currentMonthData.month + 1, 0)

  // Fetch shifts data with query parameters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [yearStr, monthStr] = selectedMonth.split("-")
        console.log(yearStr)
        const monthNumber = Number.parseInt(monthStr) + 1 // Convert from 0-based to 1-based month
        const queryParams = new URLSearchParams()
        queryParams.append("month", monthNumber.toString())
        if (selectedUser) {
          queryParams.append("user_id", selectedUser.toString())
        }
        const apiUrl = `${API_URL}/api/rota/child-rota/?${queryParams.toString()}`
        console.log("Fetching data from:", apiUrl)

        const shiftsResponse = await fetch(apiUrl, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })

        if (!shiftsResponse.ok) throw new Error("Failed to fetch shifts")

        const shiftsData: ApiResponse = await shiftsResponse.json()

        const usersFromChildRota = shiftsData.rota_by_user.map((entry) => ({
          ...entry.user,
          display_name: entry.user.display_name || entry.user.full_name, // Fallback to full_name
          is_active: entry.user.is_active !== undefined ? entry.user.is_active : true,
          role: entry.user.role || "No Role",
          contract: entry.user.contract || null,
          parent_rota_completed: entry.user.parent_rota_completed !== undefined ? entry.user.parent_rota_completed : false,
          child_rota_completed: entry.user.child_rota_completed !== undefined ? entry.user.child_rota_completed : true,
        }))
        setChildRotaUsers(usersFromChildRota)

        const allShifts = shiftsData.rota_by_user.flatMap((entry) =>
          entry.rota.map((shift: Shift) => {
            const hours = parseFloat(shift.shift_detail.total_hours) || 0 // Convert "08:00" to 8
            const salary = hours * shift.shift_detail.rate_per_hours
            return {
              ...shift,
              user: {
                ...entry.user,
                display_name: entry.user.display_name || entry.user.full_name,
                is_active: entry.user.is_active !== undefined ? entry.user.is_active : true,
                role: entry.user.role || "No Role",
                contract: entry.user.contract || null,
                parent_rota_completed: entry.user.parent_rota_completed !== undefined ? entry.user.parent_rota_completed : false,
                child_rota_completed: entry.user.child_rota_completed !== undefined ? entry.user.child_rota_completed : true,
              },
              daily_hours: shift.daily_hours || hours, // Use API value or calculate
              daily_salary: shift.daily_salary || salary, // Use API value or calculate
            }
          }),
        )
        setShifts(allShifts)
        setStats({
          totalUsers: shiftsData.total_users,
          totalEntries: shiftsData.total_rota_entries,
          dailyStats: shiftsData.daily_stats,
          salaryData: shiftsData.salary_monthly,
        })
      } catch (err) {
        setError("Error fetching data. Please try again.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedMonth, selectedUser, cookies])

  // Filter users based on search and role
  const filteredUsers = childRotaUsers.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  // Filter shifts by date range and selected user
  const filteredShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.date)
    return shiftDate >= startDate && shiftDate <= endDate && (!selectedUser || shift.user?.id === selectedUser)
  })

  // Calculate summary statistics
  const summaryStats = {
    totalHours: filteredShifts.reduce((sum, shift) => sum + shift.daily_hours, 0),
    totalSalary: filteredShifts.reduce((sum, shift) => sum + shift.daily_salary, 0),
    activeUsers: new Set(filteredShifts.map((shift) => shift.user?.id)).size,
    averageHoursPerDay:
      filteredShifts.length > 0
        ? filteredShifts.reduce((sum, shift) => sum + shift.daily_hours, 0) / filteredShifts.length
        : 0,
  }

  // Prepare chart data
  const prepareChartData = () => {
    const dailyData = filteredShifts.reduce(
      (acc, shift) => {
        const date = format(new Date(shift.date), "MMM dd")
        if (!acc[date]) {
          acc[date] = { date, hours: 0, salary: 0, users: new Set() }
        }
        acc[date].hours += shift.daily_hours
        acc[date].salary += shift.daily_salary
        acc[date].users.add(shift.user?.id)
        return acc
      },
      {} as Record<string, { date: string; hours: number; salary: number; users: Set<number | undefined> }>,
    )
    const dailyChartData = Object.values(dailyData).map((item) => ({
      date: item.date,
      hours: Math.round(item.hours * 10) / 10,
      salary: Math.round(item.salary * 100) / 100,
      users: item.users.size,
    }))

    const userPerformance = childRotaUsers
      .map((user) => {
        const userShifts = filteredShifts.filter((shift) => shift.user?.id === user.id)
        return {
          name: (user.display_name || user.full_name)?.split(" ")[0], // Use display_name or full_name
          fullName: user.display_name || user.full_name,
          hours: userShifts.reduce((sum, shift) => sum + shift.daily_hours, 0),
          salary: userShifts.reduce((sum, shift) => sum + shift.daily_salary, 0),
          shifts: userShifts.length,
          avatar: user.avatar,
        }
      })
      .filter((user) => user.shifts > 0)

    const shiftTypeData = filteredShifts.reduce(
      (acc, shift) => {
        const type = shift.shift_detail.name
        if (!acc[type]) {
          acc[type] = { name: type, count: 0, hours: 0, color: shift.shift_detail.colors }
        }
        acc[type].count += 1
        acc[type].hours += shift.daily_hours
        return acc
      },
      {} as Record<string, { name: string; count: number; hours: number; color: string }>,
    )
    const shiftTypePieData = Object.values(shiftTypeData)

    const roleData = childRotaUsers.reduce(
      (acc, user) => {
        const role = user.role || "No Role"
        if (!acc[role]) {
          acc[role] = { name: role, count: 0 }
        }
        acc[role].count += 1
        return acc
      },
      {} as Record<string, { name: string; count: number }>,
    )
    const rolePieData = Object.values(roleData)

    return {
      dailyChartData,
      userPerformance,
      shiftTypePieData,
      rolePieData,
    }
  }
  const chartData = prepareChartData()

  // Generate days for the selected month
  const generateDaysForMonth = () => {
    const days = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const date = new Date(start)
    while (date <= end) {
      days.push(new Date(date))
      date.setDate(date.getDate() + 1)
    }
    return days
  }

  // Group days by week
  const groupDaysByWeek = (days: Date[]) => {
    const weeks: Date[][] = []
    let currentWeek: Date[] = []
    days.forEach((day, index) => {
      const dayOfWeek = day.getDay()
      if (index === 0 || dayOfWeek === 1) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek)
        }
        currentWeek = []
      }
      currentWeek.push(day)
      if (index === days.length - 1 || dayOfWeek === 0) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek)
        }
        currentWeek = []
      }
    })
    return weeks
  }

  const days = generateDaysForMonth()
  const weeks = groupDaysByWeek(days)

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  const getRoleColor = (role: string | null | undefined) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-red-100 text-red-800"
      case "supervisor":
        return "bg-blue-100 text-blue-800"
      case "manager":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const uniqueRoles = Array.from(new Set(childRotaUsers.map((user) => user.role).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange mx-auto mb-4" />
        <p className="text-gray-600">Loading child rota...</p>
      </div>
    </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Statistics with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Hours Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mb-3">
              Avg: {summaryStats.averageHoursPerDay.toFixed(1)} hrs/day
            </p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.dailyChartData.slice(-7)}>
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

        {/* Total Salary Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">£{summaryStats.totalSalary.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mb-3">For {currentMonthData.label}</p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.dailyChartData.slice(-7)}>
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

        {/* Active Users Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summaryStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mb-3">Out of {childRotaUsers.length} total</p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.rolePieData} cx="50%" cy="50%" innerRadius={20} outerRadius={30} dataKey="count">
                    {chartData.rolePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shift Type Distribution Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shift Type Distribution</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{chartData.shiftTypePieData.length} Types</div>
            <p className="text-xs text-muted-foreground mb-3">Shift types assigned</p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.shiftTypePieData} cx="50%" cy="50%" innerRadius={20} outerRadius={30} dataKey="count">
                    {chartData.shiftTypePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
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
          <CardDescription>Filter shifts by month, user, and role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">User</label>
              <Select
                value={selectedUser !== null ? selectedUser.toString() : "all"}
                onValueChange={(value) => setSelectedUser(value === "all" ? null : Number(value))}
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

      {/* Shift Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shift Schedule</CardTitle>
          <CardDescription>
            {selectedUser
              ? `Showing shifts for ${childRotaUsers.find((u) => u.id === selectedUser)?.full_name} - ${currentMonthData.label}`
              : `Showing all shifts for ${currentMonthData.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 border-b border-r px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50">
                    Day
                  </th>
                  {(selectedUser ? childRotaUsers.filter((u) => u.id === selectedUser) : filteredUsers).map((user) => (
                    <th
                      key={user.id}
                      className="border-b w-[200px] border-r px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[200px]"
                    >
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
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          {user.role && (
                            <Badge variant="outline" className={cn("text-xs mt-1", getRoleColor(user.role))}>
                              {user.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="border-b w-[100px] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">
                    Daily Salary
                  </th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {week.map((dayData, dayIndex) => {
                      const totalDailySalary = filteredShifts
                        .filter((shift) => shift.date === dayData.toISOString()?.split("T")[0])
                        .reduce((sum, shift) => sum + shift.daily_salary, 0)

                      return (
                        <tr key={dayData.toISOString()} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="sticky max-w-[200px] left-0 z-10 whitespace-nowrap border-r px-4 py-2 text-sm font-medium bg-inherit">
                            <div>
                              <div className="font-semibold">
                                {getDayName(dayData)} {dayData.getDate()}
                              </div>
                              <div className="text-xs text-muted-foreground">{format(dayData, "MMM yyyy")}</div>
                            </div>
                          </td>
                          {(selectedUser ? childRotaUsers.filter((u) => u.id === selectedUser) : filteredUsers).map(
                            (user) => {
                              const userShift = filteredShifts.find(
                                (shift) =>
                                  shift.date === dayData.toISOString()?.split("T")[0] && shift.user?.id === user.id,
                              )
                              return (
                                <td key={user.id} className="border-r p-2 align-top">
                                  {userShift ? (
                                    <ShiftCard
                                      shiftType={userShift.shift_detail.name}
                                     shift_cell_id={userShift.id}
                                     user_id={user.id}
                                     shift_id={userShift.shift_detail.id}
                                      color={hexToColorName(userShift.shift_detail.colors)}
                                      onShiftTypeChange={(newType) => {
                                        console.log(`Change shift ${userShift.id} to ${newType}`)
                                      }}
                                      rate={userShift.shift_detail.rate_per_hours}
                                      total_hours={userShift.shift_detail.total_hours}
                                    />
                                  ) : (
                                    <div className="h-16 w-[200px] rounded-md bg-gray-100/50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                      <span className="text-xs text-gray-400">No shift</span>
                                    </div>
                                  )}
                                </td>
                              )
                            },
                          )}
                          <td className="p-2 align-top text-sm text-right font-medium">
                            £{totalDailySalary.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                    {weekIndex < weeks.length - 1 && (
                      <tr className="h-2 bg-gray-200">
                        <td colSpan={(selectedUser ? 1 : filteredUsers.length) + 2}></td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Information Panel */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const user = childRotaUsers.find((u) => u.id === selectedUser)
              if (!user) return null
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>
                          {user.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Role:</span>
                        {user.role ? (
                          <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">No role assigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {user.contract && (
                      <div>
                        <h4 className="font-medium mb-2">Contract Information</h4>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{user.contract.name}</p>
                          <p className="text-sm text-muted-foreground">{user.contract.description}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium mb-2">Rota Status</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Parent Rota:</span>
                          <Badge variant={user.parent_rota_completed ? "default" : "secondary"}>
                            {user.parent_rota_completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Child Rota:</span>
                          <Badge variant={user.child_rota_completed ? "default" : "secondary"}>
                            {user.child_rota_completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}