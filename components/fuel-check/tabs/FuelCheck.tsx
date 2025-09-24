
"use client"

import { formatDmy } from "@/lib/utils"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Search,
  Download,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
  Car,
  CreditCard,
  ChevronDown,
} from "lucide-react"
import GradientButton from "@/app/utils/GradientButton"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import AddFuelLogDialog from "@/components/fuel-check/AddFuelCheck"
import { Loader2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import ExportButton from "@/app/utils/ExportButton"

interface FuelLog {
  id: number
  vehicle: {
    id: number
    registration_number: string
    vehicles_type_name: string
    last_mileage: string
    site_allocated: { id: number; name: string; status: string; image: string } | null
  } | null
  date: string
  time: string
  vehicle_photo: string | null
  driver: number
  card: number | null
  card_data: { title: string; card_number: string } | null
  amount: number
  cost: number
  receipt: string | null
  notes: string
}

interface Vehicle {
  id: number
  registration_number: string
  vehicles_type_name: string
}

interface Driver {
  id: number
  full_name: string
}

interface Card {
  id: number
  title: string
  card_number: string
}

interface ViewFuelLogDialogProps {
  isOpen: boolean
  onClose: () => void
  log: FuelLog | null
}

const ViewFuelLogDialog: React.FC<ViewFuelLogDialogProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-lg">
        <DialogHeader>
          <DialogTitle>Fuel Log Details</DialogTitle>
          <DialogDescription>View detailed information for fuel log ID: {log.id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Vehicle:</span>
            <span className="col-span-3">
              {log.vehicle ? `${log.vehicle.registration_number} (${log.vehicle.vehicles_type_name})` : "N/A"}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Last Mileage:</span>
            <span className="col-span-3">{log.vehicle?.last_mileage || "N/A"}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Date:</span>
            <span className="col-span-3">{formatDmy(log.date)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Time:</span>
            <span className="col-span-3">{log.time}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Driver ID:</span>
            <span className="col-span-3">{log.driver}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Card:</span>
            <span className="col-span-3">
              {log.card_data?.title || "N/A"} ({log.card_data?.card_number || "N/A"})
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Amount:</span>
            <span className="col-span-3">{log.amount.toFixed(2)} Liters</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Cost:</span>
            <span className="col-span-3">£{log.cost.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Notes:</span>
            <span className="col-span-3">{log.notes}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Vehicle Photo:</span>
            <span className="col-span-3">
              {log.vehicle_photo ? (
                <a
                  href={log.vehicle_photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Photo
                </a>
              ) : (
                "N/A"
              )}
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Receipt:</span>
            <span className="col-span-3">
              {log.receipt ? (
                <a
                  href={log.receipt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Receipt
                </a>
              ) : (
                "N/A"
              )}
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-lg bg-transparent">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Complete":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    case "Waiting":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    case "Incomplete":
      return "bg-red-100 text-red-800 hover:bg-red-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export default function FuelChecksManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [driverFilter, setDriverFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [cardFilter, setCardFilter] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editLog, setEditLog] = useState<FuelLog | null>(null)
  const [viewLog, setViewLog] = useState<FuelLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const cookies = useCookies()

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setDrivers(data.data)
        } else {
          setError("Failed to fetch drivers")
        }
      } catch (err) {
        setError("An error occurred while fetching drivers")
      }
    }

    fetchDrivers()
  }, [cookies])

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vehicles/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setVehicles(
            data.data.map((vehicle: any) => ({
              id: vehicle.id,
              registration_number: vehicle.registration_number,
              vehicles_type_name: vehicle.vehicle_type_name,
            })),
          )
        } else {
          setError("Failed to fetch vehicles")
        }
      } catch (err) {
        setError("An error occurred while fetching vehicles")
      }
    }

    fetchVehicles()
  }, [cookies])

  // Fetch cards
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch(`${API_URL}/activity/card/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setCards(data.data)
        } else {
          setError("Failed to fetch cards")
        }
      } catch (err) {
        setError("An error occurred while fetching cards")
      }
    }

    fetchCards()
  }, [cookies])

  // Fetch fuel logs
  useEffect(() => {
    const fetchFuelLogs = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          ...(vehicleFilter && { vehicle: vehicleFilter }),
          ...(driverFilter && { driver: driverFilter }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          page: currentPage.toString(),
          page_size: pageSize.toString(),
          ...(cardFilter && { card: cardFilter }),
        })

        const response = await fetch(`${API_URL}/activity/fuel-log/?${queryParams}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setFuelLogs(data.data.results)
          setTotalCount(data.data.count)
        } else {
          setError("Failed to fetch fuel logs")
        }
      } catch (err) {
        setError("An error occurred while fetching fuel logs")
      } finally {
        setLoading(false)
      }
    }

    fetchFuelLogs()
  }, [currentPage, pageSize, vehicleFilter, driverFilter, dateFrom, dateTo, cardFilter, cookies])

  const handleAddFuelLog = (newLog: FuelLog) => {
    setFuelLogs((prev) => [newLog, ...prev])
    setIsAddDialogOpen(false)
  }

  const handleEditFuelLog = (updatedLog: FuelLog) => {
    setFuelLogs((prev) => prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)))
    setIsAddDialogOpen(false)
    setEditLog(null)
  }

  const handleDeleteFuelLog = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/activity/fuel-log/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (response.ok) {
        setFuelLogs((prev) => prev.filter((log) => log.id !== id))
      } else {
        setError("Failed to delete fuel log")
      }
    } catch (err) {
      setError("An error occurred while deleting fuel log")
    }
  }

  const filteredData = fuelLogs.filter(
    (log) =>
      log?.vehicle?.registration_number?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(totalCount / pageSize)

  const clearAllFilters = () => {
    setSearchTerm("")
    setVehicleFilter("")
    setDriverFilter("")
    setDateFrom("")
    setDateTo("")
    setCardFilter("")
    setCurrentPage(1)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchTerm) count++
    if (vehicleFilter) count++
    if (driverFilter) count++
    if (dateFrom) count++
    if (dateTo) count++
    if (cardFilter) count++
    return count
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading fuel logs...</span>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="p-6 flex items-center gap-4 border-red-200">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Error</h3>
            <p className="text-red-500">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Fuel Checks Management</h1>
            <p className="text-lg text-muted-foreground">Track and manage fuel logs for fleet compliance</p>
          </div>

          <Card className="">
            <div className="p-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute z-5 left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 gap-2 rounded-lg relative"
                  >
                    <Filter className="h-5 w-5" />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                     <ExportButton data={fuelLogs} fileName="fuel_logs.csv"/>
                    </TooltipTrigger>
                    <TooltipContent>Export fuel logs to CSV</TooltipContent>
                  </Tooltip>

                  <GradientButton
                    text="Add Fuel Log"
                    Icon={Plus}
                    onClick={() => {
                      setEditLog(null)
                      setIsAddDialogOpen(true)
                    }}
                  />
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-6 bg-muted/20 border-b border-border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter Options
                    </h3>
                    {getActiveFiltersCount() > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-6">
<div className="flex items-center gap-4">
    {/* From */}
  <div className="flex flex-col w-[150px]">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
      From
    </label>
    <Input
      type="date"
      value={dateFrom}
      onChange={(e) => setDateFrom(e.target.value)}
      className="h-10 rounded-lg"
    />
  </div>

  {/* To */}
  <div className="flex flex-col w-[150px]">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
      To
    </label>
    <Input
      type="date"
      value={dateTo}
      onChange={(e) => setDateTo(e.target.value)}
      className="h-10 rounded-lg"
    />
  </div>
</div>

<div className=" flex items-center gap-4">
    {/* Vehicle */}
  <div className="flex flex-col w-[200px]">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
      Vehicle
    </label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
          {vehicleFilter
            ? vehicles.find((v) => v.id.toString() === vehicleFilter)?.registration_number ||
              "Select Vehicle"
            : "Select Vehicle"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem onClick={() => setVehicleFilter("")}>
          All Vehicles
        </DropdownMenuItem>
        {vehicles.map((vehicle) => (
          <DropdownMenuItem
            key={vehicle.id}
            onClick={() => setVehicleFilter(vehicle.id.toString())}
          >
            {vehicle.registration_number} ({vehicle.vehicles_type_name})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  {/* Driver */}
  <div className="flex flex-col w-[250px]">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
      Driver
    </label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
          {driverFilter
            ? drivers.find((d) => d.id.toString() === driverFilter)?.full_name || "Select Driver"
            : "Select Driver"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem onClick={() => setDriverFilter("")}>
          All Drivers
        </DropdownMenuItem>
        {drivers.map((driver) => (
          <DropdownMenuItem
            key={driver.id}
            onClick={() => setDriverFilter(driver.id.toString())}
          >
            {driver.full_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  {/* Card */}
  <div className="flex flex-col w-[200px]">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
      Card
    </label>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
          {cardFilter
            ? cards.find((c) => c.id.toString() === cardFilter)?.title || "Select Card"
            : "Select Card"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem onClick={() => setCardFilter("")}>
          All Cards
        </DropdownMenuItem>
        {cards.map((card) => (
          <DropdownMenuItem
            key={card.id}
            onClick={() => setCardFilter(card.id.toString())}
          >
            {card.title || "Untitled"} ({card.card_number})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
</div>


                  {getActiveFiltersCount() > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                        {searchTerm && (
                          <Badge variant="secondary" className="gap-1">
                            Search: {searchTerm}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                          </Badge>
                        )}
                        {vehicleFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Vehicle:{" "}
                            {vehicles.find((v) => v.id.toString() === vehicleFilter)?.registration_number ||
                              vehicleFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setVehicleFilter("")} />
                          </Badge>
                        )}
                        {driverFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Driver: {drivers.find((d) => d.id.toString() === driverFilter)?.full_name || driverFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDriverFilter("")} />
                          </Badge>
                        )}
                        {dateFrom && (
                          <Badge variant="secondary" className="gap-1">
                            From: {dateFrom}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom("")} />
                          </Badge>
                        )}
                        {dateTo && (
                          <Badge variant="secondary" className="gap-1">
                            To: {dateTo}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo("")} />
                          </Badge>
                        )}
                        {cardFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Card: {cards.find((c) => c.id.toString() === cardFilter)?.title || cardFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setCardFilter("")} />
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold py-4">Log ID</TableHead>
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold text-center">Amount (Liters)</TableHead>
                  <TableHead className="font-semibold text-center">Cost (£)</TableHead>
                  <TableHead className="font-semibold">Card Used</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>{log.vehicle?.registration_number || "N/A"}</TableCell>
                    <TableCell>{formatDmy(log.date)}</TableCell>
                    <TableCell>{log.time}</TableCell>
                    <TableCell className="text-center">{log.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{log.cost.toFixed(2)}</TableCell>
                    <TableCell>{log.card_data?.title || "N/A"}</TableCell>
                    <TableCell>{log.notes}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>More actions</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setViewLog(log)
                              setIsViewDialogOpen(true)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditLog(log)
                              setIsAddDialogOpen(true)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFuelLog(log.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <select
                  className="border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-9 rounded-lg gap-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-9 w-9 rounded-lg p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-3 py-2 text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-9 w-9 rounded-lg p-0 bg-transparent"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-lg gap-2"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          <AddFuelLogDialog
            isOpen={isAddDialogOpen}
            onClose={() => {
              setIsAddDialogOpen(false)
              setEditLog(null)
            }}
            onAdd={editLog ? handleEditFuelLog : handleAddFuelLog}
            initialData={editLog}
            vehicles={vehicles}
            drivers={drivers}
            cards={cards}
          />

          <ViewFuelLogDialog isOpen={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} log={viewLog} />
        </div>
      </div>
    </TooltipProvider>
  )
}
