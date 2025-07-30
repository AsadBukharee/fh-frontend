"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  vehicles_type_id: number
  site_allocated_id: number | null
  inspection_expire: string
  mot_expiry: string
  tax_expiry: string
  insurance_expiry: string
  vehicles_type: {
    id: number
    name: string
  }
  site_allocated: {
    id: number
    name: string
    postcode: string
  } | null
}




export default function VehiclesPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const perPage = 10
  const { showToast } = useToast()
  const cookies = useCookies()


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
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setVehicles(data.data)
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
      case "maintenance":
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

  return (
    <div className="p-6 bg-white">
      <header className="bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
            <p className="text-sm text-gray-500">Manage your fleet and track vehicle details</p>
          </div>
          <div className="space-x-2 flex">
            <button className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <Download className="w-4 h-4" />
              Export
            </button>
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
        <div className="bg-white rounded-md border border-gray-200 gradient-border cursor-glow">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-gray-600 font-medium">ID</TableHead>
                <TableHead className="text-gray-600 font-medium">Reg No.</TableHead>
                <TableHead className="text-gray-600 font-medium">Vehicle Type</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                <TableHead className="text-gray-600 font-medium">Roadworthy</TableHead>
                <TableHead className="text-gray-600 font-medium">Inspection Expiry</TableHead>
                <TableHead className="text-gray-600 font-medium">MOT Expiry</TableHead>
                <TableHead className="text-gray-600 font-medium">Tax Expiry</TableHead>
                <TableHead className="text-gray-600 font-medium">Insurance Expiry</TableHead>
                <TableHead className="text-gray-600 font-medium">Site</TableHead>
                <TableHead className="text-gray-600 font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} className="border-b border-gray-100">
                  <TableCell className="font-medium">{vehicle.id}</TableCell>
                  <TableCell>
                    <Link
                      href={`vehicles-managements/${vehicle.id}`}
                      className="text-magenta underline hover:text-magenta-600"
                    >
                      {vehicle.registration_number}
                    </Link>
                  </TableCell>
                  <TableCell>{vehicle.vehicles_type?.name || "None"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vehicle.vehicle_status)}>
                      {vehicle.vehicle_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoadworthyColor(vehicle.is_roadworthy)}>
                      {vehicle.is_roadworthy ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{vehicle.inspection_expire}</TableCell>
                  <TableCell>{vehicle.mot_expiry}</TableCell>
                  <TableCell>{vehicle.tax_expiry}</TableCell>
                  <TableCell>{vehicle.insurance_expiry}</TableCell>
                  <TableCell>{vehicle.site_allocated ? `${vehicle.site_allocated.name} (${vehicle.site_allocated.postcode})` : "None"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          ref={(el: HTMLButtonElement | null) => {
                            buttonRefs.current[`action-${vehicle.id}`] = el
                          }}
                          variant="ghost"
                          size="sm"
                          className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
                          onMouseMove={handleMouseMove(`action-${vehicle.id}`)}
                        >
                          <MoreHorizontal className="w-4 h-4 relative z-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem>
                          <Link href={`vehicles-managements/${vehicle.id}`} className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                     
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteVehicleClick(vehicle)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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

      {/* Add Vehicle Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add Vehicle</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill in the details to register a new vehicle into the system.
          </DialogDescription>
        </DialogHeader>

     <AddVehicleStepper/>
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
  )
}