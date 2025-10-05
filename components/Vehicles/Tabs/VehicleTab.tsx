
"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Car,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import Link from "next/link"
import AddVehicleStepper from "@/components/Vehicles/VehiclesStepper"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ExportButton from "@/app/utils/ExportButton"

interface Vehicle {
  id: number
  registration_number: string
  vehicle_status: string
  is_roadworthy: boolean
  vehicles_type: {
    id: number
    name: string
  }
  site_allocated?: {
    id: number
    name: string
    postcode: string
  } | null
  assignee_driver?: {
    id: number
    full_name: string
  } | null
  warnings: string[]
  inspection_expire: string
  mot_expiry: string
  tax_expiry: string
  insurance_expiry: string
  vehicle_picture: string
  last_mileage: string
  vehicle_type_name: string
  status_indicators: {
    mot_expiring: boolean
    tax_expiring: boolean
    insurance_expiring: boolean
    inspection_due: boolean
  }
}

export default function VehiclesPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    vehicleStatus: "",
    isRoadworthy: "",
    vehicleType: "",
  })
  const perPage = 10
  const { showToast } = useToast()
  const cookies = useCookies()

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
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        const mappedVehicles = data.data.map((vehicle: any) => ({
          id: vehicle.id,
          registration_number: vehicle.registration_number,
          vehicle_status: vehicle.vehicle_status,
          is_roadworthy: vehicle.is_roadworthy,
          vehicles_type: vehicle.vehicles_type,
          site_allocated: vehicle.site_allocated,
          assignee_driver: vehicle.assignee_driver,
          warnings: vehicle.warnings,
          inspection_expire: vehicle.inspection_expire,
          mot_expiry: vehicle.mot_expiry,
          tax_expiry: vehicle.tax_expiry,
          insurance_expiry: vehicle.insurance_expiry,
          vehicle_picture: vehicle.vehicle_picture,
          last_mileage: vehicle.last_mileage,
          vehicle_type_name: vehicle.vehicle_type_name,
          status_indicators: vehicle.status_indicators,
        }))
        setVehicles(mappedVehicles)
        setFilteredVehicles(mappedVehicles) // Initialize filteredVehicles with all vehicles
        setTotalPages(data.total_pages || 1)
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
    fetchVehicles()
  }, [fetchVehicles])

  // Client-side filtering
  useEffect(() => {
    let result = [...vehicles]

    // Apply vehicle status filter
    if (filters.vehicleStatus) {
      result = result.filter((vehicle) => vehicle.vehicle_status.toLowerCase() === filters.vehicleStatus.toLowerCase())
    }

    // Apply roadworthy filter
    if (filters.isRoadworthy) {
      const isRoadworthy = filters.isRoadworthy === "true"
      result = result.filter((vehicle) => vehicle.is_roadworthy === isRoadworthy)
    }

    // Apply vehicle type filter
    if (filters.vehicleType) {
      result = result.filter((vehicle) => vehicle.vehicles_type.name === filters.vehicleType)
    }

    setFilteredVehicles(result)
    setTotalPages(Math.ceil(result.length / perPage))
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters, vehicles, perPage])

  // Paginate filtered vehicles
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    return filteredVehicles.slice(startIndex, startIndex + perPage)
  }, [filteredVehicles, currentPage, perPage])

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700 hover:bg-green-100"
      case "unavailable":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      case "assigned":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const getRoadworthyColor = (isRoadworthy: boolean) => {
    return isRoadworthy
      ? "bg-green-100 text-green-700 hover:bg-green-100"
      : "bg-red-100 text-red-700 hover:bg-red-100"
  }

  const handleAddVehicleClick = () => {
    setIsModalOpen(true)
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

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }))
  }

  const clearFilters = () => {
    setFilters({
      vehicleStatus: "",
      isRoadworthy: "",
      vehicleType: "",
    })
    setCurrentPage(1)
  }

  const uniqueVehicleTypes = Array.from(new Set(vehicles.map((v) => v.vehicles_type.name)))

  return (
    <TooltipProvider>
      <div className="p-6 bg-white">
        <header className="bg-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
              <p className="text-sm text-gray-500">Manage your fleet and track vehicle details</p>
            </div>
            <div className="space-x-2 flex">
              <Button
                onClick={() => setIsFilterDialogOpen(true)}
                className="px-4 border bg-white border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
          <ExportButton data={vehicles} fileName="Vehicles" />
              <button
                onClick={fetchVehicles}
                disabled={loading}
                className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
              <Button
                ref={(el: HTMLButtonElement | null) => {
                  buttonRefs.current["add-vehicle"] = el
                }}
                className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
                style={{
                  background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                }}
                onMouseMove={handleMouseMove("add-vehicle")}
                onClick={handleAddVehicleClick}
              >
                <Car className="w-4 h-4" />
                Add Vehicle
              </Button>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <div
            className="relative w-80 gradient-border cursor-glow"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - rect.left) / rect.width) * 100
              const y = ((e.clientY - rect.top) / rect.height) * 100
              e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
              e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
            }}
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <Input
              placeholder="Search vehicles"
              className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading vehicles...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="relative bg-gray-100 p-4">
                  <img
                    src={vehicle.vehicle_picture}
                    alt={`${vehicle.registration_number} image`}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-pink-100 text-pink-800 text-[10px] font-semibold px-2 py-1 rounded-full">
                      Last Inspection: {vehicle.inspection_expire}
                    </div>
                    <div className="flex space-x-2">
                      {vehicle.status_indicators.inspection_due && (
                        <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">1 Due</Badge>
                      )}
                      <Badge className={getStatusColor(vehicle.vehicle_status)}>
                        {vehicle.vehicle_status}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg flex justify-between items-center text-gray-600 mb-1">
                    <span className="text-black">{vehicle.registration_number}</span>
                    {vehicle.vehicle_type_name}
                  </CardTitle>
                  <div className="flex justify-center items-center mb-2">
                    <div className="w-[280px] h-[1px] bg-black"></div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Plate Number:</strong> {vehicle.registration_number}</p>
                    <p><strong>Mileage:</strong> {vehicle.last_mileage} miles</p>
                    {vehicle.assignee_driver && (
                      <p><strong>Driver:</strong> {vehicle.assignee_driver.full_name}</p>
                    )}
                    {vehicle.site_allocated && (
                      <p><strong>Site:</strong> {vehicle.site_allocated.name} ({vehicle.site_allocated.postcode})</p>
                    )}
                  </div>
                  {vehicle.warnings.length > 0 && (
                    <div className="mt-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-red-100 text-red-700 cursor-pointer">
                            Warnings: {vehicle.warnings.length}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <ul className="text-xs list-disc list-inside">
                            {vehicle.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/vehicles/list/${vehicle.id}`}
                    className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    More Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page</span>
            <Badge variant="outline" className="bg-gray-100">
              {currentPage}
            </Badge>
            <span className="text-sm text-gray-600">of {totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              ref={(el: HTMLButtonElement | null) => {
                buttonRefs.current["prev"] = el
              }}
              variant="ghost"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
              onMouseMove={handleMouseMove("prev")}
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1 relative z-10" />
              <span className="relative z-10">Previous</span>
            </Button>
            <Button
              ref={(el: HTMLButtonElement | null) => {
                buttonRefs.current["page1"] = el
              }}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white ripple cursor-glow"
              onMouseMove={handleMouseMove("page1")}
            >
              <span className="relative z-10">{currentPage}</span>
            </Button>
            <Button
              ref={(el: HTMLButtonElement | null) => {
                buttonRefs.current["next"] = el
              }}
              variant="ghost"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
              onMouseMove={handleMouseMove("next")}
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
            >
              <span className="relative z-10">Next</span>
              <ChevronRight className="w-4 h-4 ml-1 relative z-10" />
            </Button>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Add Vehicle</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in the details to register a new vehicle into the system.
              </DialogDescription>
            </DialogHeader>
            <AddVehicleStepper />
          </DialogContent>
        </Dialog>

        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filter Vehicles</DialogTitle>
              <DialogDescription>
                Apply filters to narrow down the vehicle list.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="vehicleStatus" className="text-right">
                  Status
                </label>
                <Select
                  value={filters.vehicleStatus}
                  onValueChange={(value) => handleFilterChange("vehicleStatus", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="isRoadworthy" className="text-right">
                  Roadworthy
                </label>
                <Select
                  value={filters.isRoadworthy}
                  onValueChange={(value) => handleFilterChange("isRoadworthy", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select roadworthy status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="vehicleType" className="text-right">
                  Vehicle Type
                </label>
                <Select
                  value={filters.vehicleType}
                  onValueChange={(value) => handleFilterChange("vehicleType", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueVehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Delete Vehicle
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete vehicle <strong>{vehicleToDelete?.registration_number}</strong>? This action cannot be undone and will permanently remove the vehicle from the system.
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
    </TooltipProvider>
  )
}
