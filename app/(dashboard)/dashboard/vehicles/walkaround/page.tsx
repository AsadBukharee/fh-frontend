"use client"

import { Eye, Car, Plus, RefreshCcw } from "lucide-react"
import { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import GradientButton from "@/app/utils/GradientButton"
import Addwalkaround from "@/components/walkaround/add-walkaround"
import WalkaroundDetailsDialog from "@/components/walkaround/walkaround_detail"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Walkaround {
  id: number
  driver: {
    full_name: string
    email: string
  }
  vehicle: {
    id: number
    vehicles_type_name: string
    registration_number: string
  }
  conducted_by: string | null
  walkaround_assignee: string | null
  status: "pending" | "failed" | "completed" | "custom"
  date: string
  time: string
  milage: number
  defects?: string
  notes?: string
}

interface GroupedWalkaround {
  vehicle_id: number
  vehicle_type: string
  registration_number: string
  drivers: Walkaround[]
}

interface ApiResponse {
  success: boolean
  data: {
    results: any[]
    count: number
    next: string | null
    previous: string | null
  }
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "failed":
      return "bg-red-500"
    case "custom":
      return "bg-purple-700"
    default:
      return "bg-gray-300"
  }
}

const WalkaroundPage = () => {
  const [walkarounds, setWalkarounds] = useState<Walkaround[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedWalkaround, setSelectedWalkaround] = useState<Walkaround | null>(null)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date("2025-08-12"))
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date("2025-08-12"))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalCount, setTotalCount] = useState(0)

  const cookies = useCookies()

  const fetchWalkarounds = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(dateFrom && { date_from: format(dateFrom, "yyyy-MM-dd") }),
        ...(dateTo && { date_to: format(dateTo, "yyyy-MM-dd") }),
      })

      const response = await fetch(`${API_URL}/api/walk-around/?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      const result: ApiResponse = await response.json()
      if (result.success) {
        const mappedWalkarounds = result.data.results.flatMap((chain: any) => {
          const steps = [chain.root, ...chain.children]
          return steps.map((step: any) => {
            const conductor = step.conducted_by || { full_name: "None None", email: "unknown" }
            const conductorName = conductor.full_name !== "None None" ? conductor.full_name : conductor.email
            let assigneeName = null
            if (step.walkaround_assignee) {
              assigneeName =
                step.walkaround_assignee.full_name !== "None None"
                  ? step.walkaround_assignee.full_name
                  : step.walkaround_assignee.email
            }
            return {
              id: step.id,
              driver: conductor,
              vehicle: chain.root.vehicle,
              conducted_by: conductorName,
              walkaround_assignee: assigneeName,
              status: step.status,
              date: step.date,
              time: step.time,
              milage: step.milage,
              defects: step.defects || undefined,
              notes: step.notes || undefined,
            }
          })
        })
        setWalkarounds(mappedWalkarounds)
        setTotalCount(result.data.count)
      } else {
        setError("Failed to fetch walkarounds.")
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalkarounds()
  }, [page, pageSize, dateFrom, dateTo])

  // Validate date range
  useEffect(() => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError("Start date cannot be later than end date.")
    } else if (error === "Start date cannot be later than end date.") {
      setError(null)
    }
  }, [dateFrom, dateTo, error])

  const resetFilters = () => {
    setDateFrom(new Date("2025-08-01"))
    setDateTo(new Date("2025-08-12"))
    setPage(1)
    setPageSize(50)
  }

  const groupedWalkarounds = walkarounds.reduce(
    (acc, walkaround) => {
      const vehicleId = walkaround.vehicle.id
      const vehicleType = walkaround.vehicle.vehicles_type_name
      const registrationNumber = walkaround.vehicle.registration_number

      if (!acc[vehicleId]) {
        acc[vehicleId] = {
          vehicle_id: vehicleId,
          vehicle_type: vehicleType,
          registration_number: registrationNumber,
          drivers: [],
        }
      }
      acc[vehicleId].drivers.push(walkaround)
      return acc
    },
    {} as Record<number, GroupedWalkaround>,
  )

  const allWalkarounds = Object.values(groupedWalkarounds)

  const handleViewDetails = (walkaroundData: Walkaround) => {
    setSelectedWalkaround(walkaroundData)
    setOpenDetailsDialog(true)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround</h1>
            <p className="text-sm text-gray-500 mb-4">View vehicle walkaround details</p>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Date Range Picker */}
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      {dateFrom ? format(dateFrom, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      {dateTo ? format(dateTo, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      disabled={(date) => (dateFrom ? date < dateFrom : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Page Size Selector */}
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              {/* Reset Filters */}
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
          <div className="flex gap-4 items-center justify-center">
            <RefreshCcw
              className="text-gray-500 hover:text-gray-600 cursor-pointer"
              onClick={() => fetchWalkarounds()}
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <GradientButton text="Walkaround" Icon={Plus} />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Walkaround</DialogTitle>
                </DialogHeader>
                <Addwalkaround setOpen={setOpen} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Walkaround List */}
        <div className="space-y-6">
          {allWalkarounds.map((group, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Car className="text-gray-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">{group.registration_number}</span>
              </div>
              <div className="flex items-center max-w-[450px] overflow-x-auto space-x-2">
                {group.drivers.map((driver, driverIdx) => (
                  <div
                    key={driverIdx}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleViewDetails(driver)}
                  >
                    <span className="text-xs text-gray-600 mt-1">{driver.walkaround_assignee || "N/A"}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getStatusClasses(
                        driver.status,
                      )}`}
                    >
                      {driverIdx + 1}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{driver.conducted_by || "Not conducted"}</span>
                  </div>
                ))}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getStatusClasses(
                    "custom",
                  )} cursor-pointer`}
                >
                  +
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">View</span>
                <Eye className="text-gray-500 w-4 h-4 cursor-pointer hover:text-gray-700 transition-colors" />
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} walkarounds
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
        {/* No Results */}
        {allWalkarounds.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No walkarounds found.</p>
          </div>
        )}
      </div>

      <WalkaroundDetailsDialog
        walkaround={selectedWalkaround}
        open={openDetailsDialog}
        onOpenChange={setOpenDetailsDialog}
      />
    </div>
  )
}

export default WalkaroundPage