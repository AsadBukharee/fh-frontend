"use client"
import { useState, useEffect } from "react"
import { TooltipProvider } from "../ui/tooltip"
import { Plus, RefreshCcw, Search, Eye, Pencil, Trash2, MoreHorizontal, MapPin, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { toast } from "../ui/use-toast"
import { useCookies } from "next-client-cookies"
import AddLocation from "./AddLocation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import API_URL from "@/app/utils/ENV"

// Define the shape of the location data
interface Location {
  id: number
  name: string
  is_maintenance: boolean
  zipcode: string
  address: string | null
  custom_order: number
  lat: number | null
  lon: number | null
  created_at: string
  updated_at: string
}

const LocationTabs = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "zipcode" | "custom_order">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showTable, setShowTable] = useState<boolean>(true) // New state for table visibility
  const cookies = useCookies()
  const token = cookies.get("access_token")

  useEffect(() => {
    const filtered = locations.filter(
      (location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.zipcode.includes(searchTerm) ||
        (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredLocations(filtered)
  }, [locations, searchTerm, sortBy, sortOrder])

  // Fetch locations from the API
  const fetchLocations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/activity/locations/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setLocations(result.data)
        toast({
          title: "Success",
          description: "Locations loaded successfully",
        })
      } else {
        setError(result.message || "Failed to fetch locations")
        toast({
          title: "Error",
          description: result.message || "Failed to fetch locations",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = "An error occurred while fetching locations"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle successful location addition
  const handleLocationAdded = () => {
    setShowTable(false) // Hide the table
    setOpen(false) // Close the dialog
    fetchLocations() // Refetch locations
    setShowTable(true) // Show the table again after refetch
  }

  const handleDelete = async (id: number) => {
    try {
      const originalLocations = [...locations]
      setLocations(locations.filter((location) => location.id !== id))

      const response = await fetch(`${API_URL}/activity/locations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Location deleted successfully",
        })
        setDeleteDialogOpen(false)
        setSelectedLocation(null)
      } else {
        setLocations(originalLocations)
        toast({
          title: "Error",
          description: result.message || "Failed to delete location",
          variant: "destructive",
        })
      }
    } catch (err) {
      setLocations([...locations])
      toast({
        title: "Error",
        description: "An error occurred while deleting the location",
        variant: "destructive",
      })
    }
  }

  const handleView = (location: Location) => {
    setSelectedLocation(location)
    setViewModalOpen(true)
  }

  const handleEdit = (location: Location) => {
    setSelectedLocation(location)
    setEditModalOpen(true)
  }

  const handleDeleteConfirm = (location: Location) => {
    setSelectedLocation(location)
    setDeleteDialogOpen(true)
  }

  const handleSort = (column: "name" | "zipcode" | "custom_order") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  useEffect(() => {
    if (token) {
      fetchLocations()
    } else {
      setError("No access token found")
      setLoading(false)
    }
  }, [token])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading Locations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg m-8">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Error Loading Locations</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchLocations} variant="outline" size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <section className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your {locations.length} location{locations.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={fetchLocations}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
                      width: 'auto',
                      height: 'auto',
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Add New Location</DialogTitle>
                  </DialogHeader>
                  <AddLocation onSuccess={handleLocationAdded} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 z-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search locations by name, zipcode, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("name")}
                className={sortBy === "name" ? "bg-gray-100" : ""}
              >
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("zipcode")}
                className={sortBy === "zipcode" ? "bg-gray-100" : ""}
              >
                Postcode {sortBy === "zipcode" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("custom_order")}
                className={sortBy === "custom_order" ? "bg-gray-100" : ""}
              >
                Order {sortBy === "custom_order" && (sortOrder === "asc" ? "↑" : "↓")}
              </Button>
            </div>
          </div>

          {showTable && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Order</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{location.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{location.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{location.zipcode}</div>
                            {location.address && (
                              <div className="text-gray-500 truncate max-w-xs">{location.address}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={location.is_maintenance ? "destructive" : "default"}
                            className={
                              location.is_maintenance ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }
                          >
                            {location.is_maintenance ? "Maintenance" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                            {location.custom_order}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(location)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(location)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteConfirm(location)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <MapPin className="w-8 h-8" />
                          <p className="text-lg font-medium">No locations found</p>
                          <p className="text-sm">
                            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first location"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Details
                </DialogTitle>
              </DialogHeader>
              {selectedLocation && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID</label>
                      <p className="text-lg font-semibold">{selectedLocation.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Custom Order</label>
                      <p className="text-lg font-semibold">{selectedLocation.custom_order}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold">{selectedLocation.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Postcode</label>
                    <p className="text-lg">{selectedLocation.zipcode}</p>
                  </div>

                  {selectedLocation.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-lg">{selectedLocation.address}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge
                        variant={selectedLocation.is_maintenance ? "destructive" : "default"}
                        className={
                          selectedLocation.is_maintenance ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }
                      >
                        {selectedLocation.is_maintenance ? "Under Maintenance" : "Active"}
                      </Badge>
                    </div>
                  </div>

                  {selectedLocation.lat && selectedLocation.lon && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Coordinates</label>
                      <p className="text-lg">
                        {selectedLocation.lat}, {selectedLocation.lon}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm">{new Date(selectedLocation.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Updated</label>
                      <p className="text-sm">{new Date(selectedLocation.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-3xl max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Edit Location: {selectedLocation?.name}</DialogTitle>
              </DialogHeader>
              <AddLocation editLocation={selectedLocation} onSuccess={handleLocationAdded} />
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the location {selectedLocation?.name}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedLocation && handleDelete(selectedLocation.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Location
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </TooltipProvider>
  )
}

export default LocationTabs