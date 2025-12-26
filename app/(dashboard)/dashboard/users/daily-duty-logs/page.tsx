"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

// Replace with your actual host or use environment variable
const API_HOST = API_URL

interface EmployeeLog {
  user_id: number
  full_name: string
  allocated_shifts: number
  rest_days: number
  enter_logs: number
  missing_logs: number
  completed_logs: number
  completion_percentage: number
  status: string
  week_number: number
  working_hours_this_week: number
  carry_over_hours_next_week: number
}

type Status = "Complete" | "Waiting" | "Incomplete"

const getStatusColor = (status: Status) => ({
  Complete: "bg-green-100 text-green-800 hover:bg-green-200",
  Waiting: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  Incomplete: "bg-red-100 text-red-800 hover:bg-red-200",
}[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200")

export default function DailyLogsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterStatus, setFilterStatus] = useState("All Status")

  const [data, setData] = useState<EmployeeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token=useCookies().get("access_token")

  // Fetch data from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_HOST}/activity/duty-logs/fetch-all-logs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed, e.g.:
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          setData(result.data)
        } else {
          throw new Error(result.message || "Invalid response format")
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch logs")
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredData = useMemo(() => {
    let filtered = data

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== "All Status") {
      filtered = filtered.filter((emp) => emp.status === filterStatus)
    }

    return filtered
  }, [data, searchTerm, filterStatus])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading daily logs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Daily Logs Management</h1>
          <p className="text-muted-foreground">
            Fleet management system for tracking driver daily logs and compliance
          </p>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {filterStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {["All Status", "Complete", "Incomplete"].map((status) => (
                    <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center font-semibold">Index</TableHead>
                <TableHead className="text-center font-semibold">Name</TableHead>
                <TableHead className="text-center font-semibold">Current Week</TableHead>
                <TableHead className="text-center font-semibold">Allocated Shifts</TableHead>
                <TableHead className="text-center font-semibold">Rest Days</TableHead>
                <TableHead className="text-center font-semibold">Missing Logs</TableHead>
                <TableHead className="text-center font-semibold">Working Hours (Week)</TableHead>
                <TableHead className="text-center font-semibold">Completion %</TableHead>
                <TableHead className="text-center font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((emp, index) => (
                  <TableRow key={emp.user_id} className="hover:bg-muted/30">
                    <TableCell className="text-center">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{emp.full_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(emp.status as Status)}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{emp.allocated_shifts}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{emp.rest_days}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{emp.missing_logs}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {emp.working_hours_this_week.toFixed(1)} hrs
                    </TableCell>
                    <TableCell className="text-center">
                      {emp.completion_percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={`/dashboard/users/daily-duty-logs/${emp.user_id}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border rounded px-2 py-1 bg-background"
              >
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
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
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