"use client"

import { DashboardCard } from "@/components/dashboard-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { DollarSign, Calendar, Car, MapPin, Filter, Eye, MoreHorizontal } from "lucide-react"

const topMetrics = [
  {
    title: "Total Revenue",
    value: "$4,600",
    change: 12.5,
    icon: <DollarSign className="w-4 h-4 text-orange-600" />,
    progress: 70,
    progressColor: "bg-orange-500",
  },
  {
    title: "Total Bookings",
    value: "$4,600",
    change: 12.5,
    icon: <Calendar className="w-4 h-4 text-red-600" />,
    progress: 70,
    progressColor: "bg-red-500",
  },
  {
    title: "Total Cars",
    value: "$4,600",
    change: 12.5,
    icon: <Car className="w-4 h-4 text-purple-600" />,
    progress: 70,
    progressColor: "bg-purple-500",
  },
  {
    title: "No of Stations",
    value: "$4,600",
    change: 12.5,
    icon: <MapPin className="w-4 h-4 text-purple-800" />,
    progress: 70,
    progressColor: "bg-purple-800",
  },
]

const pieData = [
  { name: "Jan", value: 100, color: "#EF4444" },
  { name: "Feb", value: 150, color: "#F97316" },
  { name: "Mar", value: 200, color: "#EAB308" },
  { name: "Apr", value: 400, color: "#22C55E" },
  { name: "May", value: 550, color: "#3B82F6" },
  { name: "Jun", value: 600, color: "#8B5CF6" },
]

const barData = [
  { month: "Jan", revenue: 200 },
  { month: "Feb", revenue: 300 },
  { month: "Mar", revenue: 250 },
  { month: "Apr", revenue: 400 },
  { month: "May", revenue: 850 },
  { month: "Jun", revenue: 450 },
  { month: "Jul", revenue: 500 },
  { month: "Aug", revenue: 600 },
  { month: "Sep", revenue: 400 },
  { month: "Oct", revenue: 350 },
  { month: "Nov", revenue: 300 },
]

const recentBookings = [
  {
    id: "#15654",
    customer: "Jenny wilson",
    avatar: "JW",
    car: "Honda",
    date: "07/9/2025",
    time: "10:30 AM",
    amount: "$400",
    status: "Accepted",
  },
  {
    id: "#15654",
    customer: "David",
    avatar: "D",
    car: "Honda",
    date: "07/9/2025",
    time: "10:30 AM",
    amount: "$400",
    status: "Pending",
  },
  {
    id: "#15654",
    customer: "Jenefir loe",
    avatar: "JL",
    car: "Honda",
    date: "07/9/2025",
    time: "10:30 AM",
    amount: "$400",
    status: "Rejected",
  },
]

export default function Dashboard() {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Last updated: 2 minutes ago</p>
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
      <div className="grid  grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-border  cursor-glow rounded-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-600 text-sm">Total Booking</CardTitle>
              <h3 className="text-lg font-semibold">Monthly booking distribution</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>2025</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center bg-transparent justify-center">
              <ResponsiveContainer className="" width={300} height={300}>
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
                <span className="text-2xl font-bold">2000</span>
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

        <Card className="gradient-border  cursor-glow rounded-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-600 text-sm">Total Revenue</CardTitle>
              <h3 className="text-lg font-semibold">Monthly revenue overview</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>2025</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-purple-600">May</span>
                <span className="text-gray-600">Revenue:$50k</span>
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
      <Card className="gradient-border   cursor-glow rounded-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-600 text-sm">New Bookings</CardTitle>
            <h3 className="text-lg font-semibold">Recent customer bookings and requests</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="ripple cursor-glow  hover:bg-gray-200 border-gray-200">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="ripple cursor-glow  hover:bg-gray-200 border-gray-200">
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
                    <Button variant="ghost" size="sm" className="ripple cursor-glow  hover:bg-gray-200">
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
