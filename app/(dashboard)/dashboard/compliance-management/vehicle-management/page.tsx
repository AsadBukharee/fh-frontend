"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import Link from "next/link"
import AddVehicleStepper from "@/components/Vehicles/VehiclesStepper"

interface Vehicle {
  id: number
  registration_number: string
  vehicle_status: string
  is_roadworthy: boolean
  last_mileage: string
  inspection_expire: string
  inspection_appointment: string
  mot_expiry: string
  tax_expiry: string
  insurance_expiry: string
  tacho_calibration: string
  vehicles_type: { id: number; name: string }
  site_allocated: { id: number; name: string; postcode: string } | null
  status_indicators: {
    mot_expiring: boolean
    tax_expiring: boolean
    insurance_expiring: boolean
    inspection_due: boolean
  }
  tyre_expiry_status: {
    front_driver_expiring: boolean
    front_passenger_expiring: boolean
    rear_outer_driver_expiring: boolean
    rear_outer_passenger_expiring: boolean
  }
  warnings: string[]
}

export default function VehiclesPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All Data")
  const perPage = 10
  const { showToast } = useToast()
  const cookies = useCookies()

  const filterOptions = [
    "All Data",
    "MOT",
    "PMI Inspection",
    "Tyre Maintenance Check",
    "Insurance & Docs",
    "Calibration",
    "Site Allocation",
  ]

  const filterVehicles = useCallback((vehicles: Vehicle[], filter: string) => {
    switch (filter) {
      case "MOT":
        return vehicles.filter(
          (vehicle) => vehicle.status_indicators.mot_expiring || vehicle.warnings.some((warning) => warning.includes("MOT"))
        )
      case "PMI Inspection":
        return vehicles.filter(
          (vehicle) => vehicle.status_indicators.inspection_due || vehicle.warnings.some((warning) => warning.includes("inspection"))
        )
      case "Tyre Maintenance Check":
        return vehicles.filter(
          (vehicle) =>
            Object.values(vehicle.tyre_expiry_status).some((expiring) => expiring) ||
            vehicle.warnings.some((warning) => warning.includes("tyre"))
        )
      case "Insurance & Docs":
        return vehicles.filter(
          (vehicle) =>
            vehicle.status_indicators.insurance_expiring || vehicle.warnings.some((warning) => warning.includes("Insurance"))
        )
      case "Calibration":
        return vehicles.filter((vehicle) =>
          vehicle.warnings.some((warning) => warning.includes("Tachograph calibration"))
        )
      case "Site Allocation":
        return vehicles.filter(
          (vehicle) => !vehicle.site_allocated || vehicle.warnings.some((warning) => warning.includes("Vehicle not allocated"))
        )
      default:
        return vehicles
    }
  }, [])

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const url = `${API_URL}/api/vehicles/?page=${currentPage}&per_page=${perPage}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`
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
        setVehicles(data.data)
        setTotalPages(Math.ceil(data.stats.total / perPage) || 1)
        setError(null)
      } else {
        setError(data.message || "Failed to fetch vehicles")
        showToast(data.message || "Failed to fetch vehicles", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching vehicles"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }, [cookies, showToast, currentPage, searchQuery])

  useEffect(() => {
    const filtered = filterVehicles(vehicles, activeFilter)
    setFilteredVehicles(filtered)
  }, [vehicles, activeFilter, filterVehicles])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const handleMouseMove = (key: string) => (e: React.MouseEvent) => {
    const button = buttonRefs.current[key]
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      button.style.setProperty("--mouse-x", `${x}%`)
      button.style.setProperty("--mouse-y", `${y}%`)
    }
  }

  const getStatusColor = (vehicle: Vehicle, type: string) => {
    switch (type) {
      case "mot":
        return vehicle.status_indicators.mot_expiring ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "inspection":
        return vehicle.status_indicators.inspection_due ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "insurance":
        return vehicle.status_indicators.insurance_expiring ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "tax":
        return vehicle.status_indicators.tax_expiring ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusText = (vehicle: Vehicle, type: string) => {
    switch (type) {
      case "mot":
        return vehicle.status_indicators.mot_expiring ? "Due Certificate" : "Booked"
      case "inspection":
        return vehicle.status_indicators.inspection_due ? "Due Inspection" : "Booked"
      case "insurance":
        return vehicle.status_indicators.insurance_expiring ? "Due Certificate" : "Booked"
      case "tax":
        return vehicle.status_indicators.tax_expiring ? "Due Certificate" : "Booked"
      default:
        return "N/A"
    }
  }

  const getRoadworthyColor = (isRoadworthy: boolean) => {
    return isRoadworthy ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
  }

  const handleDeleteVehicleClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${vehicleToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }
      const data = await response.json()
      if (response.ok && data.success) {
        showToast(data.message || `Vehicle ${vehicleToDelete.registration_number} has been deleted successfully`, "success")
        await fetchVehicles()
      } else {
        showToast(data.message || "Failed to delete vehicle", "error")
      }
    } catch {
      showToast("An error occurred while deleting the vehicle", "error")
    } finally {
      setIsDeleteDialogOpen(false)
      setVehicleToDelete(null)
    }
  }

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1)
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1)

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 ">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Vehicle Maintenance & Compliance Overview</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and manage your fleet compliance status</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            
            </div>
          </div>

        
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="w-4 h-4 z-10 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {filteredVehicles.length} of {vehicles.length} results</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchVehicles}
                disabled={loading}
                className="text-gray-600 hover:text-gray-900"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
  <div className=" px-4 py-4">
    <div className="flex items-center gap-1 bg-white overflow-x-auto">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`relative flex items-start gap-2 pr-8 pl-5 py-2  text-sm justify-start mb font-medium transition-colors clip-tab ${
                  activeFilter === filter
                    ? "bg-white text-orange-500 border-b-2 border-orange-500"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

      <div className=" ">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
            <span className="text-gray-600">Loading vehicles...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    Vehicle Reg
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    MOT
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    MOT Expiry Date
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    MOT Status
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    PMI Inspection
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    PMI Inspection Date
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    PMI Inspection Status
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    Insurance
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    Insurance Expiry
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    Calibration
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold text-xs uppercase tracking-wider px-6 py-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle, index) => (
                  <TableRow
                    key={vehicle.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                  >
                    <TableCell className="px-6 py-4">
                      <Link
                        href={`/dashboard/compliance-management/vehicle-management/${vehicle.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {vehicle.registration_number}
                      </Link>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${getStatusColor(vehicle, "mot")} border text-xs font-medium px-2 py-1`}>
                        {getStatusText(vehicle, "mot")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-900">{vehicle.mot_expiry}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${getStatusColor(vehicle, "mot")} border text-xs font-medium px-2 py-1`}>
                        {getStatusText(vehicle, "mot")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${getStatusColor(vehicle, "inspection")} border text-xs font-medium px-2 py-1`}>
                        {getStatusText(vehicle, "inspection")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-900">{vehicle.inspection_expire}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${getStatusColor(vehicle, "inspection")} border text-xs font-medium px-2 py-1`}>
                        {getStatusText(vehicle, "inspection")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${getStatusColor(vehicle, "insurance")} border text-xs font-medium px-2 py-1`}>
                        {getStatusText(vehicle, "insurance")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-900">{vehicle.insurance_expiry}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-900">{vehicle.tacho_calibration}</TableCell>
                    <TableCell className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
                          <DropdownMenuItem className="hover:bg-gray-50">
                            <Link href={`maintenance-data/${vehicle.id}`} className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteVehicleClick(vehicle)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && !error && filteredVehicles.length === 0 && vehicles.length > 0 && (
          <div className="text-center py-8 text-gray-500">No vehicles match the selected filter {activeFilter}.</div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Page</span>
            <Badge variant="outline" className="bg-white border-gray-300 text-gray-900">
              {currentPage}
            </Badge>
            <span>of {totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || loading}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 bg-transparent"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white min-w-[40px]">
              {currentPage}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 bg-transparent"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
  </div>

    

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Delete Vehicle
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete vehicle <strong>{vehicleToDelete?.registration_number}</strong>? This
              action cannot be undone and will permanently remove the vehicle from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">
              Delete Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}