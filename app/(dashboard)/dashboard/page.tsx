"use client"

import { useState, useEffect } from "react"
import { DashboardCard } from "@/components/dashboard-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { DollarSign, Calendar, Car, MapPin, Filter, Eye, MoreHorizontal } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

// Define API response type
interface DashboardData {
  date: string;
  dashboard_metrics: {
    daily_staff_count: number;
    daily_drivers_count: number;
    vehicles_onsite: number;
    daily_salary_count: number;
    monthly_salary_count: number;
    daily_man_hours: number;
    daily_inspections_due: number;
    inspections_due_next_7_days: number;
    mots_due_today: number;
    mots_due_next_7_days: number;
    paid_holidays_this_month: {
      hours: number;
      cost: number;
    };
    outstanding_tasks_notifications: number;
    monthly_jobs_count: number;
    yearly_job_count: number;
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()

  // Fetch API data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch(`${API_URL}/dashboard/dashboard/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setDashboardData(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again later.")
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [cookies])

  // Top Metrics based on API data
  const topMetrics = dashboardData
    ? [
        {
          title: "Vehicles Onsite",
          value: dashboardData.dashboard_metrics.vehicles_onsite.toString(),
          change: 0,
          icon: <Car className="w-4 h-4 text-purple-600" />,
          progress: (dashboardData.dashboard_metrics.vehicles_onsite / 10) * 100, // Assuming max 10 vehicles
          progressColor: "bg-purple-500",
        },
        {
          title: "Daily Drivers",
          value: dashboardData.dashboard_metrics.daily_drivers_count.toString(),
          change: 0,
          icon: <MapPin className="w-4 h-4 text-orange-600" />,
          progress: (dashboardData.dashboard_metrics.daily_drivers_count / 5) * 100, // Assuming max 5 drivers
          progressColor: "bg-orange-500",
        },
        {
          title: "Monthly Jobs",
          value: dashboardData.dashboard_metrics.monthly_jobs_count.toString(),
          change: 0,
          icon: <Calendar className="w-4 h-4 text-red-600" />,
          progress: (dashboardData.dashboard_metrics.monthly_jobs_count / 10) * 100, // Assuming max 10 jobs
          progressColor: "bg-red-500",
        },
        {
          title: "Monthly Salary",
          value: `$${dashboardData.dashboard_metrics.monthly_salary_count.toLocaleString()}`,
          change: 0,
          icon: <DollarSign className="w-4 h-4 text-green-600" />,
          progress: (dashboardData.dashboard_metrics.monthly_salary_count / 20) * 100, // Assuming max $20
          progressColor: "bg-green-500",
        },
      ]
    : []

  // Pie Chart Data (Vehicles Onsite vs Offsite)
  const pieData = dashboardData
    ? [
        { name: "Onsite", value: dashboardData.dashboard_metrics.vehicles_onsite, color: "#22C55E" },
        { name: "Offsite", value: Math.max(0, 10 - dashboardData.dashboard_metrics.vehicles_onsite), color: "#EF4444" },
      ]
    : []

  // Bar Chart Data (Monthly Jobs)
  const barData = dashboardData
    ? [
        { month: "Jan", jobs: 3 },
        { month: "Feb", jobs: 5 },
        { month: "Mar", jobs: 2 },
        { month: "Apr", jobs: 4 },
        { month: "May", jobs: 6 },
        { month: "Jun", jobs: 3 },
        { month: "Jul", jobs: 5 },
        { month: "Aug", jobs: dashboardData.dashboard_metrics.monthly_jobs_count },
      ]
    : []

  // Placeholder for recent bookings
  const recentBookings = [
    {
      id: "#15654",
      customer: "Jenny Wilson",
      avatar: "JW",
      car: "Honda",
      date: "07/9/2025",
      time: "10:30 AM",
      amount: "$400",
      status: "Accepted",
    },
    {
      id: "#15655",
      customer: "John Doe",
      avatar: "JD",
      car: "Toyota",
      date: "08/9/2025",
      time: "2:00 PM",
      amount: "$350",
      status: "Pending",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-700"
      case "Pending":
        return "bg-yellow-100 text-yellow-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      default:
        return "text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center flex justify-center flex-col py-12">
          <div className="w-14 h-14 my-5 border-t-4 border-orange-500 animate-spin rounded-full"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Error loading dashboard data"}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Last updated: {new Date(dashboardData.date).toLocaleString()}</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((metric, index) => (
          <DashboardCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            progress={metric.progress}
            progressColor={metric.progressColor}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-border cursor-glow rounded-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-600 text-sm">Vehicle Status</CardTitle>
              <h3 className="text-lg font-semibold">Vehicles Onsite vs Offsite</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{dashboardData.date}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center relative">
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{dashboardData.dashboard_metrics.vehicles_onsite}</span>
                <span className="text-sm text-gray-600">Vehicles Onsite</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-gray-600">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border cursor-glow rounded-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-600 text-sm">Monthly Jobs</CardTitle>
              <h3 className="text-lg font-semibold">Monthly jobs overview</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{dashboardData.date}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-purple-600">Aug</span>
                <span className="text-gray-600">Jobs: {dashboardData.dashboard_metrics.monthly_jobs_count}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="jobs" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="gradient-border cursor-glow rounded-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-600 text-sm">New Bookings</CardTitle>
            <h3 className="text-lg font-semibold">Recent customer bookings and requests</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="ripple cursor-glow hover:bg-gray-200 border-gray-200">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="ripple cursor-glow hover:bg-gray-200 border-gray-200">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Car Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((booking, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{booking.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{booking.customer}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-blue-600">{booking.id}</TableCell>
                  <TableCell>{booking.car}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.time}</TableCell>
                  <TableCell className="font-semibold">{booking.amount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="ripple cursor-glow hover:bg-gray-200">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}