"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

// Sample data
const employeeData = [
  { id: 1, name: "Jenny Wilson", currentWeek: "Complete", allocatedShifts: 2, restDays: 2, missingLogs: 2 },
  { id: 2, name: "Jenny Wilson", currentWeek: "Waiting", allocatedShifts: 2, restDays: 2, missingLogs: 2 },
  { id: 3, name: "Jenny Wilson", currentWeek: "Incomplete", allocatedShifts: 2, restDays: 2, missingLogs: 2 },
  { id: 4, name: "Jenny Wilson", currentWeek: "Complete", allocatedShifts: 0, restDays: 0, missingLogs: 0 },
  { id: 5, name: "Jenny Wilson", currentWeek: "Complete", allocatedShifts: 2, restDays: 2, missingLogs: 2 },
  { id: 6, name: "Jenny Wilson", currentWeek: "Incomplete", allocatedShifts: 2, restDays: 2, missingLogs: 2 },
  { id: 7, name: "Jenny Wilson", currentWeek: "Incomplete", allocatedShifts: 2, restDays: 2, missingLogs: 2 },
  { id: 8, name: "Jenny Wilson", currentWeek: "Waiting", allocatedShifts: 0, restDays: 0, missingLogs: 0 },
  { id: 9, name: "Jenny Wilson", currentWeek: "Complete", allocatedShifts: 0, restDays: 0, missingLogs: 0 },
]

type Status = "Complete" | "Waiting" | "Incomplete";

const getStatusColor = (status: Status) => ({
  Complete: "bg-green-100 text-green-800 hover:bg-green-200",
  Waiting: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  Incomplete: "bg-red-100 text-red-800 hover:bg-red-200",
}[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200");

export default function DailyLogsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filterStatus, setFilterStatus] = useState("All Status")

  const filteredData = useMemo(() => {
    let data = employeeData.filter((emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filterStatus !== "All Status") {
      data = data.filter((emp) => emp.currentWeek === filterStatus)
    }
    return data
  }, [searchTerm, filterStatus])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Daily Logs Management</h1>
          <p className="text-muted-foreground">Fleet management system for tracking driver daily logs and compliance</p>
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
                  {["All Status", "Complete", "Waiting", "Incomplete"].map((status) => (
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
              <TableRow className="bg-muted/50 text-center">
                <TableHead className="font-semibold text-center">Index</TableHead>
                <TableHead className="font-semibold text-center">Name</TableHead>
                <TableHead className="font-semibold text-center">Current Week</TableHead>
                <TableHead className="font-semibold text-center">Allocated Shifts</TableHead>
                <TableHead className="font-semibold text-center">Rest Days</TableHead>
                <TableHead className="font-semibold text-center">Missing Logs</TableHead>
                <TableHead className="font-semibold text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-muted/30">
                  <TableCell>{emp.id}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusColor(emp.currentWeek as Status)}>{emp.currentWeek}</Badge>
                  </TableCell>
                  <TableCell className="text-center"><Badge className=" text-yellow-600 bg-yellow-100">{emp.allocatedShifts}</Badge></TableCell>
                  <TableCell className="text-center"><Badge className=" text-yellow-600 bg-yellow-100">{emp.restDays}</Badge></TableCell>
                  <TableCell className="text-center"><Badge className=" text-yellow-600 bg-yellow-100">{emp.missingLogs}</Badge></TableCell>
                  <TableCell className="flex justify-center">
                    <Link href={`/dashboard/users/daily-duty-logs/${emp.id}`} className="text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Row Page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className="w-8 h-8 p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
                {totalPages > 5 && <span className="px-2 py-1 text-muted-foreground">...</span>}
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