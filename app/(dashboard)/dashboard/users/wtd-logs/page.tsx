'use client'
import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

export default function WTDLogsTable() {
  const [data, setData] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20) // Matches API default page_size
  const [period, setPeriod] = useState("period3") // Matches UI selection
  const [range, setRange] = useState("all") // New state for range filter
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = useCookies().get('access_token') || ''

  // Fetch data from API with filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Extract numeric period value (e.g., "period3" -> "3")
        const periodNumber = period.replace("period", "")

        // Construct query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: rowsPerPage.toString(),
          reference_period: periodNumber, // Use numeric period value
          ...(searchTerm && { search: searchTerm }), // Add search term if provided
          ...(range !== "all" && { range: range }) // Add range filter if not "all"
        })

        const response = await fetch(`${API_URL}/activity/wtd/logs/?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.message || "Failed to fetch data")
        }
      } catch (err) {
        setError("An error occurred while fetching data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [currentPage, rowsPerPage, period, range, token]) // Dependencies

  // Handle loading and error states
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data available</div>

  const { results, count, total_pages, reference_period } = data
  const { total_weeks } = reference_period

  // Filter drivers by search term (client-side, optional if API handles search)
  const filteredResults = searchTerm
    ? results.filter((row: any) =>
        row.driver.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : results

  return (
    <div className="w-full space-y-6 p-4 bg-white">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">WTD Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reference Period {reference_period.number}: {reference_period.start_date} to {reference_period.end_date}
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
          {/* Range filter with meaningful options */}
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
                {Array.from({ length: total_weeks }, (_, i) => (
                  <th
                    key={`w${i + 1}`}
                    className={`px-4 py-3 text-center bg-purple-200 text-sm font-medium text-purple-600 w-24 ${
                      reference_period.current_week === i + 1 ? "bg-purple-300" : ""
                    }`}
                  >
                    W {i + 1}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-84 bg-gray-50 z-10">Max Hrs</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-56 bg-gray-50 z-10">Worked Hrs</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-28 bg-gray-50 z-10">WTD Hrs</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-0 bg-gray-50 z-10">Avg Hrs Remaining</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((row: any, index: number) => (
                <tr
                  key={row.driver.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-inherit z-10">{row.driver.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium sticky left-20 bg-inherit z-10">{row.driver.name}</td>
                  {Array.from({ length: total_weeks }, (_, i) => (
                    <td
                      key={`w${i + 1}`}
                      className={`px-4 py-3 bg-purple-100 text-center text-sm ${
                        row.weeks[`w${i + 1}`] === 0 ? "text-gray-400" : "text-gray-900"
                      } w-24`}
                    >
                      {row.weeks[`w${i + 1}`]} hrs
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm sticky right-84 bg-inherit z-10">
                    <Badge className="bg-green-100 text-green-600">{row.max_hours}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-red-500 font-medium sticky right-56 bg-inherit z-10">
                    <Badge className="bg-red-100 text-red-600">{row.worked_hrs}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-red-500 font-medium sticky right-28 bg-inherit z-10">
                    <Badge className="bg-red-100 text-red-600">{row.wtd_hrs}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-orange-500 font-medium sticky right-0 bg-inherit z-10">
                    <Badge className="bg-orange-100 text-orange-600">{row.avg_hrs_remaining}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show Page</span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
            <SelectTrigger className="w-16 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="border-gray-200 text-gray-400 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: total_pages }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={currentPage === i + 1 ? "default" : "outline"}
                className={`w-8 h-8 ${
                  currentPage === i + 1
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === total_pages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}