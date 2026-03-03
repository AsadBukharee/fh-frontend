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
  DialogFooter,
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
  Edit,
  CheckCircle,
  UserPlus,
  UserMinus,
} from "lucide-react"

import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import Link from "next/link"
import AddVehicleStepper from "@/components/Vehicles/VehiclesStepper"
import { TooltipProvider } from "@/components/ui/tooltip"
import ExportButton from "@/app/utils/ExportButton"
import { Label } from "@/components/ui/label"
import AssignDriverDialog from "@/components/AssignDriverDialog"

interface VehicleType {
  id: number
  name: string
  description?: string
  number_of_seats?: number | null
  created_at?: string
  updated_at?: string
}

interface Driver {
  id: number
  email: string
  full_name: string
  display_name: string
  parent_rota_completed: boolean
  child_rota_completed: boolean
  contract_signing_date: string
  rota_start_date: string
  paid_holidays: number
  is_active: boolean
  contract: {
    id: number
    name: string
    description: string
  }
  role: string
  site: Array<{
    id: number
    name: string
    status: string
    image: string
  }>
  shifts_count: number
  avatar: string | null
}

interface Site {
  id: number
  name: string
  status: string
  image: string
}

interface Vehicle {
  id: number
  registration_number: string
  vehicle_type: VehicleType
  vehicle_status: string
  is_roadworthy: boolean
  vehicle_roadworthy_status: string
  current_mileage: string | null
  assignee_driver: Driver | null
  walkaround_count: number | null
  vehicle_picture: string
  warnings: string[]
  status_indicators: {
    mot_expiring?: boolean
    tax_expiring?: boolean
    insurance_expiring?: boolean
    inspection_due?: boolean | null
  }
  // Additional fields from API that might be needed
  vehicle_type_name?: string
  assignee_driver_name?: string
  last_mileage?: string | null
  mileage_in_miles?: number | null
  mileage_in_km?: number | null
}

export default function VehiclesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState<Vehicle | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleToUpdate, setVehicleToUpdate] = useState<Vehicle | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    vehicleStatus: "",
    isRoadworthy: "",
    vehicleType: "",
  })
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusForm, setStatusForm] = useState({
    vehicle_status: "",
    vehicle_roadworthy_status: "",
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
          vehicle_type: v.vehicle_type,
          vehicle_status: v.vehicle_status,
          is_roadworthy: v.is_roadworthy,
          vehicle_roadworthy_status: v.vehicle_roadworthy_status || "no_defect",
          current_mileage: v.last_mileage || v.current_mileage || "0.00",
          assignee_driver: v.assignee_driver,
          walkaround_count: v.walkaround_count,
          vehicle_picture: v.vehicle_picture || "",
          warnings: v.warnings || [],
          status_indicators: v.status_indicators || {},
          vehicle_type_name: v.vehicle_type_name || v.vehicle_type?.name,
          assignee_driver_name: v.assignee_driver_name || v.assignee_driver?.full_name,
          last_mileage: v.last_mileage,
          mileage_in_miles: v.mileage_in_miles,
          mileage_in_km: v.mileage_in_km,
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
      result = result.filter((v) => 
        (v.vehicle_type_name || v.vehicle_type.name) === filters.vehicleType
      )
    }

    setFilteredVehicles(result)
    setCurrentPage(1)
  }, [filters, vehicles])

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredVehicles.slice(start, start + perPage)
  }, [filteredVehicles, currentPage])

  const totalPages = Math.ceil(filteredVehicles.length / perPage) || 1

  const uniqueVehicleTypes = Array.from(new Set(
    vehicles.map((v) => v.vehicle_type_name || v.vehicle_type.name)
  ))

  const formatMileage = (mileage: string | null) => {
    if (!mileage || mileage === "null" || mileage === "undefined") return "0"
    const num = parseFloat(mileage)
    return isNaN(num) ? "0" : num.toLocaleString("en-GB")
  }

  const getRoadworthyBadge = (vehicle: Vehicle) => {
    const status = vehicle.vehicle_roadworthy_status
    
    // Contract-based roadworthy
    if (status.includes("contract")) {
      const dateMatch = status.match(/(\d{2}\/\d{2}\/\d{2})\s+Contract/)
      const date = dateMatch ? dateMatch[1] : "Contract"
      return (
        <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs px-3 py-1 rounded-full">
          {date} Contract
        </Badge>
      )
    }

    // Map status values to display text and colors
    switch (status) {
      case "no_defect":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-300 font-semibold text-xs px-3 py-1 rounded-full ring-1 ring-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1.5" />
            No Defect
          </Badge>
        )
      
      case "minor_defect_roadworthy":
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold text-xs px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-1.5" />
            Minor Defect (Roadworthy)
          </Badge>
        )
      
      case "minor_defect_not_roadworthy":
        return (
          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full inline-block mr-1.5" />
            Minor Defect (Not Roadworthy)
          </Badge>
        )
      
      case "major_defect_not_roadworthy":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300 font-semibold text-xs px-3 py-1 rounded-full ring-1 ring-red-200">
            <span className="w-2 h-2 bg-red-600 rounded-full inline-block mr-1.5 animate-pulse" />
            Major Defect (Not Roadworthy)
          </Badge>
        )
      
      case "contract":
        return (
          <Badge className="bg-purple-100 text-purple-800 border border-purple-300 font-semibold text-xs px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-purple-500 rounded-full inline-block mr-1.5" />
            Contract
          </Badge>
        )
      
      default:
        // Fallback for unknown status
        return (
          <Badge className="bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-gray-500 rounded-full inline-block mr-1.5" />
            {status}
          </Badge>
        )
    }
  }

  const getWalkaroundBadge = (count: number | null) => {
    const num = count ?? 0
    const display = num < 10 ? `0${num}` : num.toString()
    const variant =
      num >= 20
        ? "bg-green-100 text-green-800" // Good → keep green
        : num >= 10
        ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300" // Warning → Amber
        : "bg-red-100 text-red-800 ring-1 ring-red-300" // Danger → Red
    return <Badge className={`${variant} text-xs font-medium px-2 py-0.5`}>{display}</Badge>
  }

  const clearFilters = () => {
    setFilters({ vehicleStatus: "", isRoadworthy: "", vehicleType: "" })
    setIsFilterDialogOpen(false)
  }

  const handleUpdateStatusClick = (vehicle: Vehicle) => {
    setVehicleToUpdate(vehicle)
    setStatusForm({
      vehicle_status: vehicle.vehicle_status,
      vehicle_roadworthy_status: vehicle.vehicle_roadworthy_status,
    })
    setIsStatusDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!vehicleToUpdate) return

    setUpdatingStatus(true)
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${vehicleToUpdate.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          vehicle_status: statusForm.vehicle_status,
          vehicle_roadworthy_status: statusForm.vehicle_roadworthy_status,
        }),
      })

      if (res.ok) {
        showToast(`Vehicle ${vehicleToUpdate.registration_number} status updated successfully`, "success")
        fetchVehicles()
        setIsStatusDialogOpen(false)
      } else {
        const data = await res.json()
        showToast(data.message || "Failed to update vehicle status", "error")
      }
    } catch {
      showToast("An error occurred while updating vehicle status", "error")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAssignClick = (vehicle: Vehicle) => {
    setSelectedVehicleForAssign(vehicle)
    setIsAssignDialogOpen(true)
  }

  const handleUnassignDriver = async (vehicle: Vehicle) => {
    if (!confirm(`Are you sure you want to unassign the driver from vehicle ${vehicle.registration_number}?`)) {
      return
    }

    setUpdatingStatus(true)
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${vehicle.id}/unassign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (response.ok) {
        showToast(`Driver unassigned from ${vehicle.registration_number} successfully`, "success")
        fetchVehicles() // Refresh the list
      } else {
        const data = await response.json()
        showToast(data.message || "Failed to unassign driver", "error")
      }
    } catch {
      showToast("An error occurred while unassigning driver", "error")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="px-2 py-1 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
            Available
          </span>
        )
      case "unavailable":
        return (
          <span className="px-2 py-1 rounded border bg-slate-100 text-slate-700 border-slate-200 text-xs">
            Unavailable
          </span>
        )
      case "assigned":
        return (
          <span className="px-2 py-1 rounded border bg-orange-50 text-orange-700 border-orange-200 text-xs">
            Assigned
          </span>
        )
      case "disabled":
        return (
          <span className="px-2 py-1 rounded border bg-gray-100 text-gray-700 border-gray-200 text-xs">
            Disabled
          </span>
        )
      default:
        return <span className="text-xs">{status}</span>
    }
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
                      <th className="px-6 py-4 text-left font-medium">Status</th>
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
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <Link href={`/dashboard/vehicles/list/${vehicle.id}`} className="hover:underline">
                              {vehicle.registration_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {vehicle.vehicle_type_name || vehicle.vehicle_type.name}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(vehicle.vehicle_status)}</td>
                          <td className="px-6 py-4">{getRoadworthyBadge(vehicle)}</td>
                          <td className="px-6 py-4 text-gray-700">
                            {formatMileage(vehicle.current_mileage)} KMS
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {vehicle.assignee_driver_name || vehicle.assignee_driver?.full_name || "Not Assigned"}
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

                                  {/* Update Status Menu Item */}
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatusClick(vehicle)}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Update Status
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  {/* Assign/Unassign Driver based on status */}
                                  {vehicle.vehicle_status === "assigned" ? (
                                    <DropdownMenuItem
                                      onClick={() => handleUnassignDriver(vehicle)}
                                      className="flex items-center gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
                                    >
                                      <UserMinus className="h-4 w-4" />
                                      Unassign Driver
                                    </DropdownMenuItem>
                                  ) : vehicle.vehicle_status === "available" ? (
                                    <DropdownMenuItem
                                      onClick={() => handleAssignClick(vehicle)}
                                      className="flex items-center gap-2 cursor-pointer text-green-600 focus:text-green-600"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      Assign Driver
                                    </DropdownMenuItem>
                                  ) : null}

                                  {/* Show disabled message for other statuses */}
                                  {vehicle.vehicle_status !== "assigned" && vehicle.vehicle_status !== "available" && (
                                    <DropdownMenuItem
                                      disabled
                                      className="flex items-center gap-2 opacity-50 cursor-not-allowed"
                                      title="Driver can only be assigned to available vehicles or unassigned from assigned vehicles"
                                    >
                                      {vehicle.vehicle_status === "assigned" ? (
                                        <UserMinus className="h-4 w-4" />
                                      ) : (
                                        <UserPlus className="h-4 w-4" />
                                      )}
                                      {vehicle.vehicle_status === "assigned" ? "Unassign Driver" : "Assign Driver"}
                                    </DropdownMenuItem>
                                  )}
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
          <DialogContent className="max-w-[1000px] w-[1000px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Add Vehicle</DialogTitle>
              <DialogDescription>
                Fill in the details to register a new vehicle into the system.
              </DialogDescription>
            </DialogHeader>
            <AddVehicleStepper />
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Update Vehicle Status
              </DialogTitle>
              <DialogDescription>
                Update the status for vehicle:{" "}
                <strong>{vehicleToUpdate?.registration_number}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Vehicle Status */}
              <div className="space-y-3">
                <Label
                  htmlFor="vehicle_status"
                  className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
                >
                  Vehicle Status
                </Label>
                <Select
                  value={statusForm.vehicle_status}
                  onValueChange={(value) => setStatusForm(prev => ({ ...prev, vehicle_status: value }))}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">
                      <span className="px-2 py-1 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Available
                      </span>
                    </SelectItem>
                    <SelectItem value="unavailable">
                      <span className="px-2 py-1 rounded border bg-slate-100 text-slate-700 border-slate-200">
                        Unavailable
                      </span>
                    </SelectItem>
                    <SelectItem value="assigned">
                      <span className="px-2 py-1 rounded border bg-orange-50 text-orange-700 border-orange-200">
                        Assigned
                      </span>
                    </SelectItem>
                    <SelectItem value="disabled">
                      <span className="px-2 py-1 rounded border bg-gray-100 text-gray-700 border-gray-200">
                        Disabled
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Roadworthy Status */}
              <div className="space-y-3">
                <Label
                  htmlFor="vehicle_roadworthy_status"
                  className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
                >
                  Roadworthy Status
                </Label>
                <Select
                  value={statusForm.vehicle_roadworthy_status}
                  onValueChange={(value) => setStatusForm(prev => ({ ...prev, vehicle_roadworthy_status: value }))}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_defect">No Defect</SelectItem>
                    <SelectItem value="minor_defect_roadworthy">Minor Defect (Roadworthy)</SelectItem>
                    <SelectItem value="minor_defect_not_roadworthy">Minor Defect (Not Roadworthy)</SelectItem>
                    <SelectItem value="major_defect_not_roadworthy">Major Defect (Not Roadworthy)</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="bg-green-600 hover:bg-green-700"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedVehicleForAssign && (
          <AssignDriverDialog
            vehicleId={selectedVehicleForAssign.id}
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
            onSuccess={() => {
              fetchVehicles() // Refresh the list after successful assignment
              setSelectedVehicleForAssign(null)
            }}
          />
        )}

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
                    <SelectItem value="disabled">Disabled</SelectItem>
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
      </div>
    </TooltipProvider>
  )
}