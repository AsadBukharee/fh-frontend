"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Search, User, MoreHorizontal, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

// Define types for API responses
interface ApiRun {
  runName: string
  startTime: string
  endTime: string
  data: any[]
  internalJobsList: { name: string; Total: string }[]
}

interface ApiResponse {
  success: boolean
  message: string
  data: {
    runs: ApiRun[]
    count: number
    page: number
    page_size: number
    total_pages: number
    filters: {
      start_date: string
      end_date: string
      driver: string
      location: string
      direction: string
    }
  }
}

interface Location {
  id: number
  name: string
}

interface Driver {
  id: number
  full_name: string
  avatar: string | null
  email: string
}

// Define types for your data structure
type TimeSlotId = "early" | "shuttle1" | "shuttle2" | "shuttle3" | "night"

interface LocationRow {
  location: string
  out: number
  in: number
  spillOver: number
}

interface DriverRow {
  name: string
  transfers: number
  jobs: number
  total: number
}

interface SlotData {
  timeRange: string
  data: LocationRow[]
  internalOps: { drivers: DriverRow[] }
}

type TransportData = Record<TimeSlotId, SlotData>

// Fallback data
const fallbackTransportData: TransportData = {
  early: { timeRange: "5:00 AM - 9:20 AM", data: [], internalOps: { drivers: [] } },
  shuttle1: { timeRange: "9:21 AM - 2:00 PM", data: [], internalOps: { drivers: [] } },
  shuttle2: { timeRange: "2:01 PM - 4:30 PM", data: [], internalOps: { drivers: [] } },
  shuttle3: { timeRange: "4:31 PM - 6:59 PM", data: [], internalOps: { drivers: [] } },
  night: { timeRange: "7:00 PM - 4:59 AM", data: [], internalOps: { drivers: [] } },
}

// Fallback static lists for locations and drivers
const fallbackLocations: Location[] = [
  { id: 15, name: "Braintree Bus Station" },
  { id: 16, name: "Braintree Borno Pharmacy" },
  { id: 17, name: "Braintree Community Hospital" },
  { id: 18, name: "Braintree Police Station" },
  { id: 26, name: "Colchester Napier Road" },
]
const fallbackDrivers: Driver[] = [
  { id: 1, full_name: "John David", avatar: null, email: "john.david@example.com" },
  { id: 2, full_name: "Jane Smith", avatar: null, email: "jane.smith@example.com" },
  { id: 3, full_name: "Mike Johnson", avatar: null, email: "mike.johnson@example.com" },
]

// Map API run names to time slot IDs
const runNameToId: Record<string, TimeSlotId> = {
  Early: "early",
  "First Shuttle": "shuttle1",
  "Second Shuttle": "shuttle2",
  "Third Shuttle": "shuttle3",
  Night: "night",
}

const tabs: { id: TimeSlotId; label: string; color: string }[] = [
  { id: "early", label: "Early", color: "bg-pink-100 text-pink-600 border-pink-200" },
  { id: "shuttle1", label: "1st Shuttle", color: "bg-green-100 text-green-600 border-green-200" },
  { id: "shuttle2", label: "2nd Shuttle", color: "bg-purple-100 text-purple-600 border-purple-200" },
  { id: "shuttle3", label: "3rd Shuttle", color: "bg-orange-100 text-orange-600 border-orange-200" },
  { id: "night", label: "Night", color: "bg-blue-100 text-blue-600 border-blue-200" },
]

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState<TimeSlotId>("early")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedDriver, setSelectedDriver] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [direction, setDirection] = useState<string>("all")
  const [transportData, setTransportData] = useState<TransportData>(fallbackTransportData)
  const [locations, setLocations] = useState<Location[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const cookies = useCookies()
  const token = cookies.get("access_token")

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_URL}/activity/locations/names/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch locations")
        }
        const data = await response.json()
        if (data.success) {
          setLocations(data.data)
        } else {
          throw new Error(data.message || "Failed to fetch locations")
        }
      } catch (err) {
        console.error(err)
        setLocations(fallbackLocations)
        setError("Failed to fetch locations. Using fallback data.")
      }
    }
    fetchLocations()
  }, [token])

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch drivers")
        }
        const data = await response.json()
        if (data.success) {
          setDrivers(data.data)
        } else {
          throw new Error(data.message || "Failed to fetch drivers")
        }
      } catch (err) {
        console.error(err)
        setDrivers(fallbackDrivers)
        setError("Failed to fetch drivers. Using fallback data.")
      }
    }
    fetchDrivers()
  }, [token])

  // Fetch transport data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const today = new Date()
        const defaultEndDate = today
        const defaultStartDate = new Date(today.setDate(today.getDate() - 7))

        const queryParams = new URLSearchParams({
          start_date: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : format(defaultStartDate, "yyyy-MM-dd"),
          end_date: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(defaultEndDate, "yyyy-MM-dd"),
          driver: selectedDriver !== "all" ? selectedDriver : "",
          location: selectedLocation !== "all" ? selectedLocation : "",
          direction: direction !== "all" ? direction : "out",
          page: page.toString(),
          page_size: "20",
        })

        const response = await fetch(
          `${API_URL}/activity/su-run/data-screen/?${queryParams}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }
        const apiData: ApiResponse = await response.json()

        const newTransportData: TransportData = { ...fallbackTransportData }
        apiData.data.runs.forEach((run) => {
          const slotId = runNameToId[run.runName] || "early"
          newTransportData[slotId] = {
            timeRange: `${run.startTime} - ${run.endTime}`,
            data: run.data,
            internalOps: {
              drivers: [],
            },
          }
        })
        setTransportData(newTransportData)
        setTotalPages(apiData.data.total_pages)
        setError(null)
      } catch (err) {
        setError("Error fetching data. Using fallback data.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [dateRange.from, dateRange.to, selectedDriver, selectedLocation, direction, page, token])

  const currentData = transportData[activeTab]

  const filteredData = currentData.data.filter((row: LocationRow) => {
    return selectedLocation === "all" || row.location === selectedLocation
  })

  const filteredDrivers = currentData.internalOps.drivers.filter((driver: DriverRow) =>
    selectedDriver === "all" || driver.name === selectedDriver
  )

  const getTotalOut = () => filteredData.reduce((sum, item) => sum + item.out, 0)
  const getTotalIn = () => filteredData.reduce((sum, item) => sum + item.in, 0)
  const getTotalSpillOver = () => filteredData.reduce((sum, item) => sum + item.spillOver, 0)

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center mb-6 justify-between">
        <div className="items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SU Data Management</h1>
          </div>
          <div>
            <span className="text-sm text-gray-500">Last updated 12:58 PM</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center mb-6 justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Badge
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSelectedLocation("all")
                setSelectedDriver("all")
                setDateRange({ from: undefined, to: undefined })
                setDirection("all")
                setPage(1)
              }}
              className={`px-4 py-1 rounded-2xl text-sm font-medium border transition-colors ${
                activeTab === tab.id ? tab.color : "text-gray-500 hover:text-gray-700 bg-white border-gray-200"
              }`}
            >
              {tab.label}
            </Badge>
          ))}
        </div>
        <div className="flex items-center">
          <Badge variant="secondary" className="bg-pink-600/20 text-pink-600 px-4 py-1 rounded-2xl text-sm font-medium border-pink-600 hover:bg-pink-600">
            Reports
          </Badge>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-4">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
        </div>
        {/* Filter Row */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
          <Select onValueChange={setSelectedLocation} value={selectedLocation}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.name}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedDriver} value={selectedDriver}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Select Driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.full_name}>
                  {driver.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to })
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select onValueChange={setDirection} value={direction}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Select Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="in">In</SelectItem>
              <SelectItem value="out">Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && <p className="text-gray-500">Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Pagination Controls */}
      {!isLoading && (
        <div className="flex justify-between mb-4">
          <Button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="text-left font-semibold text-gray-700 py-3">Locations</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">OUT</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">IN</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Spill Over</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 border-b">
                    <TableCell className="font-medium text-gray-900 py-3">{row.location}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-[#FFC1CC] text-[#FF2E63]">
                        {row.out}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-[#C1E1C5] text-[#2E7D32]">
                        {row.in}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`${
                          row.spillOver > 0 ? "bg-[#C1E1C5] text-[#2E7D32]" : "bg-[#FFC1CC] text-[#FF2E63]"
                        }`}
                      >
                        {row.spillOver > 0 ? `+${row.spillOver}` : row.spillOver}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                    No location data available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredData.length > 0 && (
                <TableRow className="bg-gray-50 font-semibold border-t-2">
                  <TableCell className="font-bold text-gray-900 py-3">Total</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#FF9DB3] text-[#FF2E63] font-bold">
                      {getTotalOut()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#AEDBB2] text-[#2E7D32] font-bold">
                      {getTotalIn()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={`${
                        getTotalSpillOver() > 0 ? "bg-[#AEDBB2] text-[#2E7D32]" : "bg-[#FF9DB3] text-[#FF2E63]"
                      } font-bold`}
                    >
                      {getTotalSpillOver() > 0 ? `+${getTotalSpillOver()}` : getTotalSpillOver()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center"></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Internal Operations */}
      {!isLoading && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Internal Operations</h3>
            <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="text-left font-semibold text-gray-700 py-3">Drivers</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Transfers</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Jobs</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map((driver, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-medium text-gray-900 py-3">{driver.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-[#FFD54F] text-[#F57C00]">
                          {driver.transfers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-gray-900 font-medium">{driver.jobs}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-[#FFC1CC] text-[#FF2E63]">
                          {driver.total}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                      No driver data available for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}