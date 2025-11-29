"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Eye,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Car,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react"

import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import Link from "next/link"
import AddVehicleStepper from "@/components/Vehicles/VehiclesStepper"
import { TooltipProvider } from "@/components/ui/tooltip"
import ExportButton from "@/app/utils/ExportButton"

interface Vehicle {
  id: number
  registration_number: string
  vehicles_type: { name: string }
  vehicle_status: string
  is_roadworthy: boolean
  vehicle_roadworthy_status: string
  current_mileage: string
  assignee_driver: { full_name: string } | null
  walkaround_count: number | null
  vehicle_picture: string
  warnings: string[]
  status_indicators: any
}

export default function VehiclesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
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
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }
      if (!response.ok) throw new Error("Failed to fetch vehicles")

      const json = await response.json()
      if (json.success) {
        const mapped = json.data.map((v: any) => ({
          id: v.id,
          registration_number: v.registration_number,
          vehicles_type: { name: v.vehicles_type.name },
          vehicle_status: v.vehicle_status,
          is_roadworthy: v.is_roadworthy,
          vehicle_roadworthy_status: v.vehicle_roadworthy_status || "no_defect",
          current_mileage: v.current_mileage || "0.00",
          assignee_driver: v.assignee_driver,
          walkaround_count: v.walkaround_count,
          vehicle_picture: v.vehicle_picture || "",
          warnings: v.warnings || [],
          status_indicators: v.status_indicators || {},
        }))
        setVehicles(mapped)
        setFilteredVehicles(mapped)
        setError(null)
      } else {
        throw new Error(json.message || "Failed to load vehicles")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error"
      setError(msg)
      showToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, cookies, showToast])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  // Client-side filtering
  useEffect(() => {
    let result = [...vehicles]

    if (filters.vehicleStatus) {
      result = result.filter((v) => v.vehicle_status === filters.vehicleStatus)
    }
    if (filters.isRoadworthy) {
      const val = filters.isRoadworthy === "true"
      result = result.filter((v) => v.is_roadworthy === val)
    }
    if (filters.vehicleType) {
      result = result.filter((v) => v.vehicles_type.name === filters.vehicleType)
    }

    setFilteredVehicles(result)
    setCurrentPage(1)
  }, [filters, vehicles])

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredVehicles.slice(start, start + perPage)
  }, [filteredVehicles, currentPage])

  const totalPages = Math.ceil(filteredVehicles.length / perPage) || 1

  const uniqueVehicleTypes = Array.from(new Set(vehicles.map((v) => v.vehicles_type.name)))

  const formatMileage = (mileage: string) => {
    return parseFloat(mileage).toLocaleString("en-GB")
  }

 const getRoadworthyBadge = (vehicle: Vehicle) => {
  // Contract-based roadworthy (e.g., "15/12/25 Contract")
  if (vehicle.vehicle_roadworthy_status.includes("contract")) {
    const dateMatch = vehicle.vehicle_roadworthy_status.match(/(\d{2}\/\d{2}\/\d{2})\s+Contract/)
    const date = dateMatch ? dateMatch[1] : "Contract"
    return (
      <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs px-3 py-1 rounded-full">
        {date} Contract
      </Badge>
    )
  }

  // Fully Approved → Vibrant Green
  if (vehicle.is_roadworthy) {
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-300 font-semibold text-xs px-3 py-1 rounded-full ring-1 ring-green-200">
        <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1.5" />
        Approved
      </Badge>
    )
  }

  // Not Approved → Bold Red (Phase 2 Red)
  return (
    <Badge className="bg-red-100 text-red-800 border border-red-300 font-semibold text-xs px-3 py-1 rounded-full ring-1 ring-red-200">
      <span className="w-2 h-2 bg-red-600 rounded-full inline-block mr-1.5 animate-pulse" />
      Not Approved
    </Badge>
  )
}

  const getWalkaroundBadge = (count: number | null) => {
  const num = count ?? 0
  const display = num < 10 ? `0${num}` : num.toString()
  const variant =
    num >= 20
      ? "bg-green-100 text-green-800"           // Good → keep green
      : num >= 10
      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"  // Warning → Amber
      : "bg-red-100 text-red-800 ring-1 ring-red-300"        // Danger → Red
  return <Badge className={`${variant} text-xs font-medium px-2 py-0.5`}>{display}</Badge>
}

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return

    try {
      const res = await fetch(`${API_URL}/api/vehicles/${vehicleToDelete.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (res.ok) {
        showToast(`Vehicle ${vehicleToDelete.registration_number} deleted successfully`, "success")
        fetchVehicles()
      } else {
        const data = await res.json()
        showToast(data.message || "Failed to delete vehicle", "error")
      }
    } catch {
      showToast("An error occurred while deleting the vehicle", "error")
    } finally {
      setIsDeleteDialogOpen(false)
      setVehicleToDelete(null)
    }
  }

  const clearFilters = () => {
    setFilters({ vehicleStatus: "", isRoadworthy: "", vehicleType: "" })
    setIsFilterDialogOpen(false)
  }

  return (
    <TooltipProvider>
      <div className="p-6 bg-white min-h-screen">
        {/* Header */}
        <header className="bg-white mb-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your fleet and track vehicle details</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(true)}>
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
              <ExportButton data={vehicles} fileName="Vehicles" />
              <Button variant="outline" size="sm" onClick={fetchVehicles} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
              <Button
               className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 
             text-white font-semibold 
             hover:from-red-700 hover:via-orange-600 hover:to-amber-600 
             shadow-lg transform transition hover:scale-105 
             transition-all duration-200"
  onClick={() => setIsModalOpen(true)}
              >
                <Car className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </div>

          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 z-1 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search vehicles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span>Loading vehicles...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-600">
              <AlertCircle className="w-6 h-6 mr-2" />
              {error}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium">Index</th>
                      <th className="px-6 py-4 text-left font-medium">Vehicle Reg</th>
                      <th className="px-6 py-4 text-left font-medium">Vehicle Type</th>
                      <th className="px-6 py-4 text-left font-medium">Roadworthy Status</th>
                      <th className="px-6 py-4 text-left font-medium">Current Mileage</th>
                      <th className="px-6 py-4 text-left font-medium">Current Driver</th>
                      <th className="px-6 py-4 text-center font-medium">Walkarounds</th>
                      <th className="px-6 py-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedVehicles.map((vehicle, idx) => {
                      const index = (currentPage - 1) * perPage + idx + 1
                      return (
                        <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-600 font-medium">{index}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{vehicle.registration_number}</td>
                          <td className="px-6 py-4 text-gray-700">{vehicle.vehicles_type.name}</td>
                          <td className="px-6 py-4">{getRoadworthyBadge(vehicle)}</td>
                          <td className="px-6 py-4 text-gray-700">{formatMileage(vehicle.current_mileage)} KMS</td>
                          <td className="px-6 py-4 text-gray-700">
                            {vehicle.assignee_driver?.full_name || "Not Assigned"}
                          </td>
                          <td className="px-6 py-4 text-center">{getWalkaroundBadge(vehicle.walkaround_count)}</td>

                          {/* ACTIONS DROPDOWN */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/dashboard/vehicles/list/${vehicle.id}`}
                                      className="flex items-center gap-2 w-full cursor-pointer"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={() => {
                                      setVehicleToDelete(vehicle)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Vehicle
                                  </DropdownMenuItem>

                                  {/* Add more actions here in the future */}
                                  {/* <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Schedule Service
                                  </DropdownMenuItem> */}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * perPage + 1} to{" "}
                  {Math.min(currentPage * perPage, filteredVehicles.length)} of {filteredVehicles.length} vehicles
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    {totalPages > 5 && <span className="px-2 text-gray-500">...</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Vehicle Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Add Vehicle</DialogTitle>
              <DialogDescription>
                Fill in the details to register a new vehicle into the system.
              </DialogDescription>
            </DialogHeader>
            <AddVehicleStepper />
          </DialogContent>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filter Vehicles</DialogTitle>
              <DialogDescription>Apply filters to narrow down the vehicle list.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="status" className="text-right font-medium">Status</label>
                <Select
                  value={filters.vehicleStatus}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, vehicleStatus: v === "all" ? "" : v }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="roadworthy" className="text-right font-medium">Roadworthy</label>
                <Select
                  value={filters.isRoadworthy}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, isRoadworthy: v === "all" ? "" : v }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right font-medium">Vehicle Type</label>
                <Select
                  value={filters.vehicleType}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, vehicleType: v === "all" ? "" : v }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="All types" />
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
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" /> Clear Filters
              </Button>
              <Button onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Delete Vehicle
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete vehicle{" "}
                <strong>{vehicleToDelete?.registration_number}</strong>?
                <br />
                This action cannot be undone.
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