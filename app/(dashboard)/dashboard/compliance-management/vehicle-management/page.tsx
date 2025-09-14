"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Search, Filter, Loader2 } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"

interface Vehicle {
  id: number
  registration_number: string
  mot_expiry: string
  next_mot_booked_from: string
  next_booked_date: string
  time_mot_booked: string
  last_insp_date: string
  next_insp_booked_before: string
  next_insp_date: string
  second_planned_insp_date: string
  third_planned_insp_date: string
  fourth_planned_insp_date: string
  fifth_planned_insp_date: string
  sixth_planned_insp_date: string
  mot_status: "Expired" | "Booked" | "Due" | "TBC"
  insp_status: "Expired" | "Booked" | "Due" | "TBC"
}

export default function VehiclesPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(68)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All Data")
  const perPage = 10
  const { showToast } = useToast()
  const cookies = useCookies()

  const filterOptions = [
    "All Data",
    "MOT",
    "PMI Inspection",
    "Vehicle Tacho Download",
    "Tyre Maintenance Check",
    "Insurance & Docs",
    "Calibrations",
  ]

  const vehicleCategories = ["All Vehicles", "Car", "Van", "Truck"]
  const vehicleStatuses = ["All Status", "Active", "Inactive"]

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const url = `${API_URL}/api/vehicles/?page=${currentPage}&per_page=${perPage}${
        searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
      }`
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        const mappedVehicles = data.data.map((vehicle: any) => {
          const nextInspDate = new Date(vehicle.inspection_expire || "TBC")
          const plannedDates = Array(5)
            .fill(0)
            .map((_, i) =>
              !isNaN(nextInspDate.getTime())
                ? new Date(nextInspDate.setMonth(nextInspDate.getMonth() + 3)).toLocaleDateString(
                    "en-GB"
                  )
                : "TBC"
            )
          return {
            id: vehicle.id,
            registration_number: vehicle.registration_number,
            mot_expiry: vehicle.mot_expiry || "TBC",
            next_mot_booked_from: vehicle.mot_booked_date || "TBC",
            next_booked_date: vehicle.mot_booked_date || "TBC",
            time_mot_booked: vehicle.mot_booked_time || "TBC",
            last_insp_date: vehicle.last_insp_date || "TBC",
            next_insp_booked_before: vehicle.inspection_appointment || "TBC",
            next_insp_date: vehicle.inspection_expire || "TBC",
            second_planned_insp_date: plannedDates[0] || "11/03/2026",
            third_planned_insp_date: plannedDates[1] || "11/06/2026",
            fourth_planned_insp_date: plannedDates[2] || "11/09/2026",
            fifth_planned_insp_date: plannedDates[3] || "11/12/2026",
            sixth_planned_insp_date: plannedDates[4] || "11/03/2027",
            mot_status: getMotStatus(vehicle.mot_expiry),
            insp_status: getInspStatus(vehicle.inspection_expire),
          }
        })
        setVehicles(mappedVehicles)
        setTotalPages(Math.ceil(data.stats.total / perPage) || 68)
        setError(null)
      } else {
        setError(data.message || "Failed to fetch vehicles")
        showToast(data.message || "Failed to fetch vehicles", "error")
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred while fetching vehicles"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }, [cookies, showToast, currentPage, searchQuery])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const filterVehicles = useCallback((vehicles: Vehicle[], filter: string) => {
    switch (filter) {
      case "MOT":
        return vehicles.filter((v) => v.mot_status !== "TBC" && v.mot_status !== "Booked")
      case "PMI Inspection":
        return vehicles.filter((v) => v.insp_status !== "TBC" && v.insp_status !== "Booked")
      case "Vehicle Tacho Download":
      case "Tyre Maintenance Check":
      case "Insurance & Docs":
      case "Calibrations":
        return vehicles.filter((v) => v.mot_status === "TBC" || v.insp_status === "TBC")
      default:
        return vehicles
    }
  }, [])

  useEffect(() => {
    setFilteredVehicles(filterVehicles(vehicles, activeFilter))
  }, [vehicles, activeFilter, filterVehicles])

  const getMotStatus = (motExpiry: string) => {
    const today = new Date("2025-09-12T23:21:00+05:00") // 11:21 PM PKT, September 12, 2025
    const expiryDate = new Date(motExpiry)
    if (isNaN(expiryDate.getTime()) || !motExpiry || motExpiry === "TBC") return "TBC"
    if (expiryDate < today) return "Expired"
    if (expiryDate < new Date(today.setDate(today.getDate() + 7))) return "Due"
    return "Booked"
  }

  const getInspStatus = (inspExpiry: string) => {
    const today = new Date("2025-09-12T23:21:00+05:00") // 11:21 PM PKT, September 12, 2025
    const expiryDate = new Date(inspExpiry)
    if (isNaN(expiryDate.getTime()) || !inspExpiry || inspExpiry === "TBC") return "TBC"
    if (expiryDate < today) return "Expired"
    if (expiryDate < new Date(today.setDate(today.getDate() + 7))) return "Due"
    return "Booked"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Expired":
        return "bg-[#EF4444] text-white"
      case "Due":
        return "bg-[#F59E0B] text-white"
      case "Booked":
        return "bg-[#10B981] text-white"
      case "TBC":
        return "bg-[#6B7280] text-white"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1)
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1)

  const getRowRange = () => {
    const start = (currentPage - 1) * perPage + 1
    const end = Math.min(currentPage * perPage, filteredVehicles.length)
    return `${start}-${end}`
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Vehicle Maintenance & Compliance Overview
      </h1>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex overflow-x-auto space-x-2 border-b border-gray-300">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              ref={(el) => (buttonRefs.current[filter] = el)}
              className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                activeFilter === filter
                  ? "bg-[#F59E0B] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search vehicles..."
              className="pl-10 pr-4 py-2 w-72 border-gray-300 focus:border-blue-500 rounded-md shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-md shadow-sm"
              >
                All Vehicles <Filter className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-gray-200 shadow-lg">
              {vehicleCategories.map((category) => (
                <DropdownMenuItem key={category} className="hover:bg-gray-100">
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-md shadow-sm"
              >
                All Status <Filter className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-gray-200 shadow-lg">
              {vehicleStatuses.map((status) => (
                <DropdownMenuItem key={status} className="hover:bg-gray-100">
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-md shadow-sm"
              >
                All Categories <Filter className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-gray-200 shadow-lg">
              {vehicleCategories.map((category) => (
                <DropdownMenuItem key={category} className="hover:bg-gray-100">
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-8">{error}</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No vehicles found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
          <Table className="min-w-full bg-white divide-y divide-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                {[
                  "Vehicle Reg",
                  "MOT Expiry",
                  "Next MOT Booked From",
                  "Next Booked Date",
                  "Time MOT Booked",
                  "Last Insp Date",
                  "Next Insp Booked Before",
                  "Next Insp Date",
                  "2nd Planned Insp Date",
                  "3rd Planned Insp Date",
                  "4th Planned Insp Date",
                  "5th Planned Insp Date",
                  "6th Planned Insp Date",
                ].map((header) => (
                  <TableHead
                    key={header}
                    className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase border-r last:border-r-0"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle, index) => (
                <TableRow
                  key={vehicle.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <TableCell className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {vehicle.registration_number}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.mot_expiry}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.next_mot_booked_from}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.next_booked_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.time_mot_booked}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.last_insp_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge
                      className={`${getStatusColor(vehicle.mot_status)} px-3 py-1 text-xs font-medium rounded-full`}
                    >
                      {vehicle.mot_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge
                      className={`${getStatusColor(vehicle.insp_status)} px-3 py-1 text-xs font-medium rounded-full`}
                    >
                      {vehicle.next_insp_booked_before}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.next_insp_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.second_planned_insp_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.third_planned_insp_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.fourth_planned_insp_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.fifth_planned_insp_date}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-900">
                    {vehicle.sixth_planned_insp_date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
        <span>Row Page {getRowRange()} |</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-md"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => currentPage + i).map(
            (page) =>
              page <= totalPages && (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`${
                    currentPage === page
                      ? "bg-[#F59E0B] text-white"
                      : "text-gray-600 border-gray-300"
                  } hover:bg-gray-50 rounded-md w-8`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
          )}
          {totalPages > 5 && currentPage + 4 < totalPages && (
            <span className="px-2">...</span>
          )}
          {totalPages > 5 && (
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-md w-8"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-md"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}