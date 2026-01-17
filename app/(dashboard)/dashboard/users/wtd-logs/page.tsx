'use client'
import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

export default function WTDLogsTable() {
  const [data, setData] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [period, setPeriod] = useState("period3")
  const [range, setRange] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = useCookies().get('access_token') || ''

  // Fetch data from API with filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const periodNumber = period.replace("period", "")

        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: rowsPerPage.toString(),
          reference_period: periodNumber,
          ...(searchTerm && { search: searchTerm }),
          ...(range !== "all" && { range: range })
        })

        const response = await fetch(`${API_URL}/activity/wtd/logs/?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.message || "Failed to fetch data")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching data")
        console.error("Fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [currentPage, rowsPerPage, period, range, token, searchTerm])

  // Add debounced search to prevent too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1) // Reset to first page on search
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Handle loading and error states
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600">Loading...</div>
    </div>
  )
  
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-red-600">Error: {error}</div>
    </div>
  )
  
  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600">No data available</div>
    </div>
  )

  const { results, count, total_pages, reference_period } = data
  const { total_weeks, current_week } = reference_period

  // Generate week headers based on total_weeks from API
  const weekHeaders = Array.from({ length: total_weeks }, (_, i) => `w${i + 1}`)

  return (
    <TooltipProvider>
      <div className="w-full space-y-6 p-4 bg-white">
        {/* Header and Filters */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">WTD Logs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Reference Period {reference_period.number}: {reference_period.start_date} to {reference_period.end_date}
              {current_week && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Current Week: W{current_week}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 bg-white border-gray-200">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="period1">Period 1</SelectItem>
                <SelectItem value="period2">Period 2</SelectItem>
                <SelectItem value="period3">Period 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-32 bg-white border-gray-200">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranges</SelectItem>
                <SelectItem value="max_hours_lt_100">Max Hours {'<'} 100</SelectItem>
                <SelectItem value="worked_hrs_gt_50">Worked Hours {'>'} 50</SelectItem>
                <SelectItem value="avg_hrs_remaining_lt_20">Avg Hrs Remaining {'<'} 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-20 sticky left-0 bg-gray-50 z-10">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-40 sticky left-20 bg-gray-50 z-10">Driver</th>
                  {weekHeaders.map((week) => (
                    <th
                      key={week}
                      className={`px-4 py-3 text-center text-sm font-medium w-24 ${
                        parseInt(week.replace('w', '')) === current_week 
                          ? "bg-blue-300 text-blue-800" 
                          : "bg-purple-200 text-purple-600"
                      }`}
                    >
                      {week.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-84 bg-gray-50 z-10">Max Hrs</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-56 bg-gray-50 z-10">Worked Hrs</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-28 bg-gray-50 z-10">WTD Hrs</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-32 sticky right-0 bg-gray-50 z-10">Avg Hrs Remaining</th>
                </tr>
              </thead>
              <tbody>
                {results && results.length > 0 ? (
                  results.map((row: any, index: number) => (
                    <tr
                      key={row.driver.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-inherit z-10">{row.driver.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium sticky left-20 bg-inherit z-10">{row.driver.name}</td>
                      
                      {weekHeaders.map((week) => {
                        const weekData = row.weeks[week]
                        return (
                          <td
                            key={week}
                            className={`px-4 py-2 text-center text-sm w-24 ${
                              weekData.value === 0 
                                ? "text-gray-400 bg-gray-50" 
                                : "text-gray-900 bg-purple-50"
                            } ${
                              parseInt(week.replace('w', '')) === current_week 
                                ? "bg-blue-50" 
                                : ""
                            }`}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {weekData.value.toFixed(1)} hrs
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  {/* <p>Hours: {weekData.value.toFixed(1)}</p> */}
                                  <p>Average Hours Worked So Far: {weekData.hover}</p>
                                  <p>Holidays: {weekData.holidays}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      })}
                      
                      <td className="px-4 py-3 text-center text-sm sticky right-84 bg-inherit z-10">
                        <Badge className="bg-green-100 text-green-600 hover:bg-green-200">
                          {row.max_hours}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium sticky right-56 bg-inherit z-10">
                        <Badge className={`${row.worked_hrs > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                          {row.worked_hrs.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium sticky right-28 bg-inherit z-10">
                        <Badge className={`${row.wtd_hrs < row.max_hours ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {row.wtd_hrs.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium sticky right-0 bg-inherit z-10">
                        <Badge className={`${row.avg_hrs_remaining > 20 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                          {row.avg_hrs_remaining.toFixed(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={weekHeaders.length + 7} className="px-4 py-8 text-center text-gray-500">
                      No drivers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {total_pages > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                <SelectTrigger className="w-16 bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">
                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, count)} of {count} entries
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = i + 1
                  if (total_pages > 5) {
                    const startPage = Math.max(1, currentPage - 2)
                    const endPage = Math.min(total_pages, startPage + 4)
                    pageNum = startPage + i
                    if (pageNum > endPage) return null
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className={`w-8 h-8 ${
                        currentPage === pageNum
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === total_pages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="border-gray-200"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}