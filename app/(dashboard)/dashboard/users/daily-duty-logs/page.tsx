"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Download, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import GradientButton from "@/app/utils/GradientButton"
import Link from "next/link"

// Sample data matching the image
const employeeData = [
  {
    id: 1,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Complete",
    incompleteLogs: 2,
    waitingApproval: 2,
    lastActivity: "1/15/2024",
  },
  {
    id: 2,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Waiting",
    incompleteLogs: 2,
    waitingApproval: 2,
    lastActivity: "1/15/2024",
  },
  {
    id: 3,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Incomplete",
    incompleteLogs: 2,
    waitingApproval: 2,
    lastActivity: "1/15/2024",
  },
  {
    id: 4,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Complete",
    incompleteLogs: 0,
    waitingApproval: 0,
    lastActivity: "1/15/2024",
  },
  {
    id: 5,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Complete",
    incompleteLogs: 2,
    waitingApproval: 2,
    lastActivity: "1/15/2024",
  },
  {
    id: 6,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Incomplete",
    incompleteLogs: 2,
    waitingApproval: 2,
    lastActivity: "1/15/2024",
  },
  {
    id: 7,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Incomplete",
    incompleteLogs: 2,
    waitingApproval: 2,
    lastActivity: "1/15/2024",
  },
  {
    id: 8,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Waiting",
    incompleteLogs: 0,
    waitingApproval: 0,
    lastActivity: "1/15/2024",
  },
  {
    id: 9,
    name: "Jenny Wilson",
    department: "Transport",
    currentWeek: "Complete",
    incompleteLogs: 0,
    waitingApproval: 0,
    lastActivity: "1/15/2024",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Complete":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    case "Waiting":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    case "Incomplete":
      return "bg-red-100 text-red-800 hover:bg-red-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export default function DailyLogsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const filteredData = employeeData.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Daily Logs Management</h1>
          <p className="text-muted-foreground">Fleet management system for tracking driver daily logs and compliance</p>
        </div>

        {/* Action Bar */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute z-2 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Status</DropdownMenuItem>
                  <DropdownMenuItem>Complete</DropdownMenuItem>
                  <DropdownMenuItem>Waiting</DropdownMenuItem>
                  <DropdownMenuItem>Incomplete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>

            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Emp ID</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Current Week</TableHead>
                <TableHead className="font-semibold">Incomplete Logs</TableHead>
                <TableHead className="font-semibold">Waiting Approval</TableHead>
                <TableHead className="font-semibold">Last Activity</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(employee.currentWeek)}>
                      {employee.currentWeek}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={employee.incompleteLogs > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}
                    >
                      {employee.incompleteLogs}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={employee.waitingApproval > 0 ? "text-yellow-600 font-medium" : "text-muted-foreground"}
                    >
                      {employee.waitingApproval}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.lastActivity}</TableCell>
                  <TableCell className="flex justify-center items-center">
                    <Link
                      href={`/dashboard/users/daily-duty-logs/${employee.id}`}
                      className="gap-1 text-muted-foreground flex hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Row Page</span>
              <select className="border rounded px-2 py-1 bg-background">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 py-1 text-muted-foreground">...</span>
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-transparent">
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
