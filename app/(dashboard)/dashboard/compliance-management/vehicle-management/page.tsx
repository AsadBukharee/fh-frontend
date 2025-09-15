"use client"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Wrench,
} from "lucide-react"
import Link from "next/link"

interface Vehicle {
  id: number
  assignee_driver: {
    id: number
    full_name: string
    email: string
    avatar?: string
  } | null
  vehicles_type: {
    id: number
    name: string
    description: string
  }
  site_allocated: {
    id: number
    name: string
    status: string
  } | null
  warnings: string[]
  missing_attributes: string[]
  last_mileage: string | null
  registration_number: string
  vehicle_status: string
  is_roadworthy: boolean
  inspection_expire: string
  inspection_appointment: string
  mot_expiry: string
  mot_booked_date: string | null
  tax_expiry: string
  insurance_expiry: string
  tacho_calibration_expiry: string
  vehicle_cost: number
  vehicle_picture: string
  assignee_driver_name?: string
  vehicle_type_name: string
  site_name?: string
  status_indicators: {
    mot_expiring: boolean
    tax_expiring: boolean
    insurance_expiring: boolean
    inspection_due: boolean
  }
}

const realApiData = {
  success: true,
  message: "Success",
  data: [
    {
      id: 6,
      assignee_driver: {
        id: 6,
        email: "asadbukharee@gmail.com",
        full_name: "Syed Asad Abbas",
        display_name: "Syed Asad Abbas",
        avatar:
          "http://91.99.235.94:9000/media-public/uploads/064e55c9-1733-4ef5-8283-11e71e06b6f3/scaled_1000061228.jpg",
      },
      vehicles_type: {
        id: 2,
        name: "16-Seater MK8",
        description: "Mark 8",
      },
      site_allocated: null,
      warnings: [
        "🚨 MOT has expired",
        "🚨 Road tax has expired",
        "🚨 Insurance has expired",
        "📍 Vehicle not allocated to any site",
        "🚨 Tachograph calibration has expired",
      ],
      missing_attributes: [
        "Last mileage reading",
        "Front driver tyre expiry",
        "Front passenger tyre expiry",
        "Rear outer driver tyre expiry",
        "Rear outer passenger tyre expiry",
      ],
      last_mileage: null,
      registration_number: "VAN644",
      vehicle_status: "available",
      is_roadworthy: true,
      inspection_expire: "2025-11-20",
      inspection_appointment: "2025-09-20",
      mot_expiry: "2025-08-29",
      mot_booked_date: null,
      tax_expiry: "2025-08-30",
      insurance_expiry: "2025-08-14",
      tacho_calibration_expiry: "2025-08-22",
      vehicle_cost: 15000,
      vehicle_picture:
        "http://91.99.235.94:9000/media-public/uploads/f81b6ceb-7a4a-4cb0-adcd-c72e7a1c2e1b/20250701_0047_image.png",
      assignee_driver_name: "Syed Asad Abbas",
      vehicle_type_name: "16-Seater MK8",
      status_indicators: {
        mot_expiring: true,
        tax_expiring: true,
        insurance_expiring: true,
        inspection_due: false,
      },
    },
    {
      id: 5,
      assignee_driver: {
        id: 11,
        email: "khalidsadiq@gmail.com",
        full_name: "Khalid Sadiq",
        display_name: "Khalid Sadiq",
        avatar: null,
      },
      vehicles_type: {
        id: 2,
        name: "16-Seater MK8",
        description: "Mark 8",
      },
      site_allocated: {
        id: 1,
        name: "Bolton Central",
        status: "active",
      },
      warnings: [
        "🚨 MOT has expired",
        "🚨 Road tax has expired",
        "🚨 Insurance has expired",
        "🚨 Tachograph calibration has expired",
      ],
      missing_attributes: [
        "MOT certificate",
        "Front driver tyre expiry",
        "Front passenger tyre expiry",
        "Rear outer driver tyre expiry",
        "Rear outer passenger tyre expiry",
      ],
      last_mileage: "12758.00",
      registration_number: "VAN644hhj",
      vehicle_status: "assigned",
      is_roadworthy: true,
      inspection_expire: "2025-11-20",
      inspection_appointment: "2025-09-20",
      mot_expiry: "2025-08-29",
      mot_booked_date: null,
      tax_expiry: "2025-08-30",
      insurance_expiry: "2025-08-14",
      tacho_calibration_expiry: "2025-08-22",
      vehicle_cost: 15000,
      vehicle_picture: "https://jayctours.com.my/wp-content/uploads/2021/02/295055e5-f536-43bf-8773-5c107d12b05c.jpg",
      assignee_driver_name: "Khalid Sadiq",
      vehicle_type_name: "16-Seater MK8",
      site_name: "Bolton Central",
      status_indicators: {
        mot_expiring: true,
        tax_expiring: true,
        insurance_expiring: true,
        inspection_due: false,
      },
    },
    {
      id: 4,
      assignee_driver: null,
      vehicles_type: {
        id: 2,
        name: "16-Seater MK8",
        description: "Mark 8",
      },
      site_allocated: null,
      warnings: [
        "🚨 Insurance has expired",
        "🚨 Vehicle inspection has expired",
        "🚨 Front driver tyre has expired",
        "🚨 Front passenger tyre has expired",
        "🚨 Rear outer driver tyre has expired",
        "🚨 Rear outer passenger tyre has expired",
        "📍 Vehicle not allocated to any site",
        "⚠️ Tachograph download overdue by 4 days",
        "🚨 Tachograph calibration has expired",
      ],
      missing_attributes: ["MOT certificate"],
      last_mileage: "5909.70",
      registration_number: "GTR SKYLINE",
      vehicle_status: "assigned",
      is_roadworthy: true,
      inspection_expire: "2025-08-21",
      inspection_appointment: "2025-08-22",
      mot_expiry: "2026-08-20",
      mot_booked_date: null,
      tax_expiry: "2026-09-07",
      insurance_expiry: "2025-08-18",
      tacho_calibration_expiry: "2025-08-30",
      vehicle_cost: 55000,
      vehicle_picture: "https://jayctours.com.my/wp-content/uploads/2021/02/295055e5-f536-43bf-8773-5c107d12b05c.jpg",
      vehicle_type_name: "16-Seater MK8",
      status_indicators: {
        mot_expiring: false,
        tax_expiring: false,
        insurance_expiring: true,
        inspection_due: true,
      },
    },
    {
      id: 3,
      assignee_driver: null,
      vehicles_type: {
        id: 1,
        name: "16-Seater MK7",
        description: "Mark 7",
      },
      site_allocated: null,
      warnings: [
        "🚨 MOT has expired",
        "🚨 Road tax has expired",
        "🚨 Insurance has expired",
        "🚨 Vehicle inspection has expired",
        "🚨 Front driver tyre has expired",
        "🚨 Front passenger tyre has expired",
        "🚨 Rear outer driver tyre has expired",
        "🚨 Rear outer passenger tyre has expired",
        "⚠️ Front driver tyre pressure is low",
        "📍 Vehicle not allocated to any site",
        "🚨 Tachograph calibration has expired",
      ],
      missing_attributes: ["MOT certificate"],
      last_mileage: "1123.00",
      registration_number: "REG1337",
      vehicle_status: "available",
      is_roadworthy: true,
      inspection_expire: "2025-08-29",
      inspection_appointment: "2025-08-23",
      mot_expiry: "2025-08-14",
      mot_booked_date: null,
      tax_expiry: "2025-08-15",
      insurance_expiry: "2025-08-15",
      tacho_calibration_expiry: "2025-08-30",
      vehicle_cost: 120000,
      vehicle_picture: "https://jayctours.com.my/wp-content/uploads/2021/02/295055e5-f536-43bf-8773-5c107d12b05c.jpg",
      vehicle_type_name: "16-Seater MK7",
      status_indicators: {
        mot_expiring: true,
        tax_expiring: true,
        insurance_expiring: true,
        inspection_due: true,
      },
    },
    {
      id: 2,
      assignee_driver: null,
      vehicles_type: {
        id: 1,
        name: "16-Seater MK7",
        description: "Mark 7",
      },
      site_allocated: null,
      warnings: [
        "🚨 MOT has expired",
        "🚨 Road tax has expired",
        "🚨 Insurance has expired",
        "⚠️ Vehicle inspection due in 14 days",
        "🚨 Front driver tyre has expired",
        "🚨 Front passenger tyre has expired",
        "🚨 Rear outer driver tyre has expired",
        "🚨 Rear outer passenger tyre has expired",
        "📍 Vehicle not allocated to any site",
        "🚨 Tachograph calibration has expired",
      ],
      missing_attributes: ["MOT certificate"],
      last_mileage: "12358.00",
      registration_number: "VAN644",
      vehicle_status: "available",
      is_roadworthy: true,
      inspection_expire: "2025-09-29",
      inspection_appointment: "2025-09-20",
      mot_expiry: "2025-08-29",
      mot_booked_date: null,
      tax_expiry: "2025-08-30",
      insurance_expiry: "2025-08-14",
      tacho_calibration_expiry: "2025-08-22",
      vehicle_cost: 15000,
      vehicle_picture: "https://jayctours.com.my/wp-content/uploads/2021/02/295055e5-f536-43bf-8773-5c107d12b05c.jpg",
      vehicle_type_name: "16-Seater MK7",
      status_indicators: {
        mot_expiring: true,
        tax_expiring: true,
        insurance_expiring: true,
        inspection_due: true,
      },
    },
    {
      id: 1,
      assignee_driver: null,
      vehicles_type: {
        id: 2,
        name: "16-Seater MK8",
        description: "Mark 8",
      },
      site_allocated: null,
      warnings: [
        "🚨 MOT has expired",
        "🚨 Road tax has expired",
        "🚨 Insurance has expired",
        "🚨 Front driver tyre has expired",
        "🚨 Front passenger tyre has expired",
        "🚨 Rear outer driver tyre has expired",
        "🚨 Rear outer passenger tyre has expired",
        "📍 Vehicle not allocated to any site",
        "🚨 Tachograph calibration has expired",
      ],
      missing_attributes: ["MOT certificate"],
      last_mileage: "12358.00",
      registration_number: "VAN644",
      vehicle_status: "available",
      is_roadworthy: true,
      inspection_expire: "2025-11-20",
      inspection_appointment: "2025-09-20",
      mot_expiry: "2025-08-29",
      mot_booked_date: null,
      tax_expiry: "2025-08-30",
      insurance_expiry: "2025-08-14",
      tacho_calibration_expiry: "2025-08-22",
      vehicle_cost: 15000,
      vehicle_picture: "https://jayctours.com.my/wp-content/uploads/2021/02/295055e5-f536-43bf-8773-5c107d12b05c.jpg",
      vehicle_type_name: "16-Seater MK8",
      status_indicators: {
        mot_expiring: true,
        tax_expiring: true,
        insurance_expiring: true,
        inspection_due: false,
      },
    },
  ],
  stats: {
    available: 4,
    unavailable: 0,
    assigned: 2,
    disabled: 0,
    total: 6,
  },
}

export default function VehicleDashboard() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [vehicles, setVehicles] = useState<Vehicle[]>(realApiData.data as Vehicle[])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(realApiData.data as Vehicle[])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All Data")
  const perPage = 10

  const filterOptions = [
    "All Data",
    "MOT",
    "PMI Inspection",
    "Vehicle Tacho Download",
    "Tyre Maintenance Check",
    "Insurance & Docs",
    "Calibrations",
  ]

  const vehicleCategories = ["All Vehicles", "16-Seater MK7", "16-Seater MK8"]
  const vehicleStatuses = ["All Status", "Available", "Assigned"]

  const filterVehicles = useCallback((vehicles: Vehicle[], filter: string) => {
    switch (filter) {
      case "MOT":
        return vehicles.filter((v) => v.status_indicators.mot_expiring)
      case "PMI Inspection":
        return vehicles.filter((v) => v.status_indicators.inspection_due)
      case "Insurance & Docs":
        return vehicles.filter((v) => v.status_indicators.insurance_expiring)
      case "Vehicle Tacho Download":
      case "Tyre Maintenance Check":
      case "Calibrations":
        return vehicles.filter((v) => v.warnings.some((w) => w.includes("Tachograph") || w.includes("tyre")))
      default:
        return vehicles
    }
  }, [])

  useEffect(() => {
    const filtered = filterVehicles(vehicles, activeFilter)
    const searchFiltered = searchQuery
      ? filtered.filter((v) => v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()))
      : filtered
    setFilteredVehicles(searchFiltered)
    setTotalPages(Math.ceil(searchFiltered.length / perPage))
  }, [vehicles, activeFilter, searchQuery, filterVehicles])

  const getComplianceStatus = (vehicle: Vehicle) => {
    const criticalWarnings = vehicle.warnings.filter((w) => w.includes("🚨")).length
    const warningCount = vehicle.warnings.filter((w) => w.includes("⚠️")).length

    if (criticalWarnings > 0) return "Critical"
    if (warningCount > 0) return "Warning"
    return "Compliant"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-destructive text-destructive-foreground"
      case "Warning":
        return "bg-accent text-accent-foreground"
      case "Compliant":
        return "bg-chart-4 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Critical":
        return <AlertTriangle className="w-3 h-3" />
      case "Warning":
        return <Clock className="w-3 h-3" />
      case "Compliant":
        return <CheckCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1)
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1)

  const getRowRange = () => {
    const start = (currentPage - 1) * perPage + 1
    const end = Math.min(currentPage * perPage, filteredVehicles.length)
    return `${start}-${end}`
  }

  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * perPage, currentPage * perPage)

  const stats = {
    total: realApiData.stats.total,
    available: realApiData.stats.available,
    assigned: realApiData.stats.assigned,
    critical: vehicles.filter((v) => v.warnings.some((w) => w.includes("🚨"))).length,
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-card-foreground font-[family-name:var(--font-heading)]">
          Fleet Management Dashboard
        </h1>
        <p className="text-muted-foreground">Monitor vehicle compliance, MOT schedules, and inspection dates</p>
      </div>

       {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 z-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    All Vehicles <Filter className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {vehicleCategories.map((category) => (
                    <DropdownMenuItem key={category}>{category}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    All Status <Filter className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {vehicleStatuses.map((status) => (
                    <DropdownMenuItem key={status}>{status}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

      {/* Filters and Search */}
      <Card>
        <CardContent >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center ">
            {/* Filter Tabs */}
            <div className="flex overflow-x-auto space-x-1 p-1 rounded-lg">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                 ref={(el: HTMLButtonElement | null) => {
  buttonRefs.current[filter] = el;
}}

                  className={`px-4 py-2 text-sm clip-tab font-medium transition-all duration-200 whitespace-nowrap ${
                    activeFilter === filter
                      ? "bg-orange/70 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

         
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : error ? (
            <div className="text-destructive text-center py-8">{error}</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No vehicles found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {[
                      "Vehicle Reg",
                      "Vehicle Type",
                      "Driver",
                      "Site",
                      "Status",
                      "Compliance",
                      "MOT Expiry",
                      "Tax Expiry",
                      "Insurance Expiry",
                      "Inspection",
                      "Mileage",
                      "Warnings",
                    ].map((header) => (
                      <TableHead key={header} className="text-xs font-semibold text-card-foreground">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVehicles.map((vehicle, index) => (
                    <TableRow
                      key={vehicle.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/10"
                      }`}
                    >
                      <TableCell className="font-medium text-card-foreground"><Link href={`/dashboard/compliance-management/vehicle-management/${vehicle.id}`}>{vehicle.registration_number}</Link></TableCell>
                      <TableCell className="text-sm">{vehicle.vehicle_type_name}</TableCell>
                      <TableCell className="text-sm">
                        {vehicle.assignee_driver ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {vehicle.assignee_driver.full_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {vehicle.site_allocated ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {vehicle.site_allocated.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No site</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${vehicle.vehicle_status === "available" ? "bg-chart-4 text-white" : "bg-accent text-accent-foreground"}`}
                        >
                          {vehicle.vehicle_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(getComplianceStatus(vehicle))} flex items-center gap-1`}>
                          {getStatusIcon(getComplianceStatus(vehicle))}
                          {getComplianceStatus(vehicle)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{vehicle.mot_expiry}</TableCell>
                      <TableCell className="text-sm">{vehicle.tax_expiry}</TableCell>
                      <TableCell className="text-sm">{vehicle.insurance_expiry}</TableCell>
                      <TableCell className="text-sm">{vehicle.inspection_expire}</TableCell>
                      <TableCell className="text-sm">
                        {vehicle.last_mileage ? `${vehicle.last_mileage} mi` : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Wrench className="w-3 h-3 text-muted-foreground" />
                                <span className="text-destructive font-medium">{vehicle.warnings.length}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs p-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">Active Warnings:</p>
                                {vehicle.warnings.length > 0 ? (
                                  <ul className="text-xs space-y-1">
                                    {vehicle.warnings.map((warning, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-destructive">•</span>
                                        <span>{warning}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-muted-foreground">No warnings</p>
                                )}
                                {vehicle.missing_attributes.length > 0 && (
                                  <>
                                    <p className="font-semibold text-sm mt-2">Missing Attributes:</p>
                                    <ul className="text-xs space-y-1">
                                      {vehicle.missing_attributes.map((attr, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-amber-500">•</span>
                                          <span>{attr}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Showing {getRowRange()} of {filteredVehicles.length} vehicles
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => currentPage + i - 2)
                .filter((page) => page > 0 && page <= totalPages)
                .map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
