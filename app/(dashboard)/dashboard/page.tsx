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
  users: { total_users: number; active_users: number; inactive_users: number }
  time: { current_date: string; current_week: number; yearly_week: string; current_month: number; current_year: number; days_in_month_so_far: number }
  vehicles: { running_vehicles: number; total_vehicles: number; vehicles_in_maintenance: number; upcoming_maintenance: number; utilization_rate: number }
  sites: { total_sites: number; active_sites: number; inactive_sites: number; utilization_rate: number }
  operations: { trips_today: number; trips_this_week: number; trips_this_month: number; avg_trips_per_day: number }
  financial: { revenue_today: number; revenue_this_week: number; revenue_this_month: number; avg_daily_revenue: number }
  system: { active_alerts: number; pending_approvals: number; system_status: string; last_updated: string }
  fuel_consumption: { total_consumption: number; daily_average: number; weekly_average: number; monthly_so_far: number; avg_efficiency: number; total_distance: number }
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const cookies = useCookies()

  // Fetch API data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch(`${API_URL}/dashboard/dashboard/`,{
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        setDashboardData(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  // Top Metrics based on API data
  const topMetrics = dashboardData
    ? [
        {
          title: "Total Revenue",
          value: `$${dashboardData.financial.revenue_today.toLocaleString()}`,
          change: 0, // Placeholder, calculate if historical data available
          icon: <DollarSign className="w-4 h-4 text-orange-600" />,
          progress: (dashboardData.financial.revenue_today / dashboardData.financial.revenue_this_week) * 100,
          progressColor: "bg-orange-500",
        },
        {
          title: "Total Trips",
          value: dashboardData.operations.trips_today.toString(),
          change: 0,
          icon: <Calendar className="w-4 h-4 text-red-600" />,
          progress: (dashboardData.operations.trips_today / dashboardData.operations.trips_this_week) * 100,
          progressColor: "bg-red-500",
        },
        {
          title: "Total Vehicles",
          value: dashboardData.vehicles.total_vehicles.toString(),
          change: 0,
          icon: <Car className="w-4 h-4 text-purple-600" />,
          progress: dashboardData.vehicles.utilization_rate,
          progressColor: "bg-purple-500",
        },
        {
          title: "Total Sites",
          value: dashboardData.sites.total_sites.toString(),
          change: 0,
          icon: <MapPin className="w-4 h-4 text-purple-800" />,
          progress: dashboardData.sites.utilization_rate,
          progressColor: "bg-purple-800",
        },
      ]
    : []

  // Pie Chart Data (Vehicle Status Distribution)
  const pieData = dashboardData
    ? [
        { name: "Running", value: dashboardData.vehicles.running_vehicles, color: "#22C55E" },
        { name: "Maintenance", value: dashboardData.vehicles.vehicles_in_maintenance, color: "#F97316" },
        { name: "Idle", value: dashboardData.vehicles.total_vehicles - dashboardData.vehicles.running_vehicles - dashboardData.vehicles.vehicles_in_maintenance, color: "#EF4444" },
      ]
    : []

  // Bar Chart Data (Placeholder for monthly revenue, since API only has current month)
  const barData = [
    { month: "Jan", revenue: 2000 },
    { month: "Feb", revenue: 3000 },
    { month: "Mar", revenue: 2500 },
    { month: "Apr", revenue: 4000 },
    { month: "May", revenue: 8500 },
    { month: "Jun", revenue: 4500 },
    { month: "Jul", revenue: 5000 },
    { month: "Aug", revenue: dashboardData?.financial.revenue_this_month || 4500 },
  ]

  // Placeholder for recent bookings (API doesn't provide this)
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
    // ... other bookings
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
        return " text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center flex justify-center flex-col py-12">
          <div className=" w-14 h-14 my-5 border-t-4 border-orange animate-spin rounded-full"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
         
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div className="p-6">Error loading dashboard data</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Last updated: {new Date(dashboardData.system.last_updated).toLocaleString()}</p>
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
              <h3 className="text-lg font-semibold">Vehicle distribution</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{dashboardData.time.current_year}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
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
                <span className="text-2xl font-bold">{dashboardData.vehicles.total_vehicles}</span>
                <span className="text-sm text-gray-600">Total Vehicles</span>
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
              <CardTitle className="text-gray-600 text-sm">Total Revenue</CardTitle>
              <h3 className="text-lg font-semibold">Monthly revenue overview</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{dashboardData.time.current_year}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-purple-600">Aug</span>
                <span className="text-gray-600">Revenue: ${dashboardData.financial.revenue_this_month.toLocaleString()}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="revenue" fill="#8B5CF6" />
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