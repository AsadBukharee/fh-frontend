"use client"

import { formatDmy } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { TooltipProvider } from "../ui/tooltip"
import { Plus, RefreshCcw, Search, Eye, Pencil, Trash2, MoreHorizontal, MapPin, AlertTriangle, X, CornerDownRight, Folder, FolderTree } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import API_URL from "@/app/utils/ENV"
import ExportButton from "@/app/utils/ExportButton"

// Define the shape of the location data
interface Location {
  id: number
  name: string
  associated_location: number | null
  is_loca_group: boolean
  is_base: boolean
  is_maintenance: boolean
  zipcode: string | null
  address: string | null
  custom_order: number
  lat: number | null
  lon: number | null
  site: number | null
  created_at: string
  updated_at: string
}

const LocationTabs = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
  const [addSubLocationOpen, setAddSubLocationOpen] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "zipcode" | "custom_order">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "maintenance">("all")
  const [orderRange, setOrderRange] = useState<{ min: string; max: string }>({ min: "", max: "" })
  const [showTable, setShowTable] = useState<boolean>(true)
  const [sites, setSites] = useState<{ id: number, name: string }[]>([])
  const [siteFilter, setSiteFilter] = useState<string>("all")
  const cookies = useCookies()
  const token = cookies.get("access_token")

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sites/list-names/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setSites(result.data)
      }
    } catch (err) {
      console.error("Failed to fetch sites", err)
    }
  }

  useEffect(() => {
    const filtered = locations.filter((location) => {
      // Search filter
      const matchesSearch =
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.zipcode || "").includes(searchTerm) ||
        (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter


      // Site filter
      const matchesSite =
        siteFilter === "all" ||
        (location.site !== null && location.site.toString() === siteFilter)

      // Custom order range filter
      const minOrder = orderRange.min ? parseInt(orderRange.min) : null
      const maxOrder = orderRange.max ? parseInt(orderRange.max) : null
      const matchesOrder =
        (!minOrder || location.custom_order >= minOrder) &&
        (!maxOrder || location.custom_order <= maxOrder)


      return matchesSearch && matchesOrder && matchesSite
    })

    filtered.sort((a, b) => {
      // Always prioritize base locations to show at the top
      if (a.is_base && !b.is_base) return -1;
      if (!a.is_base && b.is_base) return 1;

      let aValue = a[sortBy] ?? ""
      let bValue = b[sortBy] ?? ""

      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredLocations(filtered)
  }, [locations, searchTerm, sortBy, sortOrder, statusFilter, orderRange, siteFilter])

  const hierarchicalLocations = useMemo(() => {
    const roots = filteredLocations.filter(loc => !loc.associated_location);
    const children = filteredLocations.filter(loc => loc.associated_location);

    const result: (Location & { isSub?: boolean })[] = [];
    const addedIds = new Set<number>();

    roots.forEach(root => {
      result.push(root);
      addedIds.add(root.id);

      const subLocs = children.filter(child => child.associated_location === root.id);
      subLocs.forEach(sub => {
        result.push({ ...sub, isSub: true });
        addedIds.add(sub.id);
      });
    });

    children.forEach(child => {
      if (!addedIds.has(child.id)) {
        result.push({ ...child, isSub: true });
      }
    });

    return result;
  }, [filteredLocations]);

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
    setShowTable(false)
    setOpen(false)
    setEditModalOpen(false)
    setAddSubLocationOpen(false)
    fetchLocations()
    setShowTable(true)
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

  const handleAddSubLocation = (location: Location) => {
    setSelectedLocation(location)
    setAddSubLocationOpen(true)
  }

  const handleSort = (column: "name" | "zipcode" | "custom_order") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setSiteFilter("all")
    setOrderRange({ min: "", max: "" })
  }

  useEffect(() => {
    if (token) {
      fetchLocations()
      fetchSites()
    } else {
      setError("No access token found")
      setLoading(false)
    }
  }, [token])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg text-left">Loading Locations...</p>
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
      <section className="p-4 md:p-8 bg-white min-h-screen text-left">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-start items-start mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your {locations.length} location{locations.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <ExportButton data={filteredLocations} fileName="Location_data" />
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={fetchLocations}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />

              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="flex items-center justify-start gap-2 rounded-lg px-4 py-2 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
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
                <DialogContent className="max-w-2xl max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Add New Location</DialogTitle>
                  </DialogHeader>
                  <AddLocation onSuccess={handleLocationAdded} onCancel={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-start flex-wrap">
            <div className="relative flex-1 max-w-md text-left">
              <Search className="absolute left-3 z-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search locations by name, zipcode, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-start">
              <Select value={siteFilter} onValueChange={(value: string) => setSiteFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "maintenance") => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>


              <Input
                type="number"
                placeholder="Min Order"
                value={orderRange.min}
                onChange={(e) => setOrderRange({ ...orderRange, min: e.target.value })}
                className="w-[100px]"
              />
              <Input
                type="number"
                placeholder="Max Order"
                value={orderRange.max}
                onChange={(e) => setOrderRange({ ...orderRange, max: e.target.value })}
                className="w-[100px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </Button>
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Name</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Location</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hierarchicalLocations.length > 0 ? (
                    hierarchicalLocations.map((location) => (
                      <tr
                        key={location.id}
                        className={`group transition-all duration-200 border-b border-gray-50 last:border-0 ${location.isSub ? "bg-gray-50/30" : ""}`}
                      >
                        <td className={`px-6 py-4 text-left ${location.isSub ? "pl-14" : ""}`}>
                          <div className="flex items-center justify-start gap-2">
                            {location.isSub ? (
                              <CornerDownRight className="w-4 h-4 text-gray-400" />
                            ) : location.is_loca_group ? (
                              <FolderTree className="w-4 h-4 text-orange-500" />
                            ) : location.is_base ? (
                              <MapPin className="w-4 h-4 text-red-400" />
                            ) : (
                              <MapPin className="w-4 h-4 text-gray-400" />
                            )}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={`${location.is_base || (!location.isSub && location.is_loca_group) ? "font-bold text-gray-950" : "font-medium text-gray-900"}`}>
                                  {location.name}
                                </span>
                                {location.is_loca_group && !location.isSub && (
                                  <Badge variant="outline" className="text-[10px] py-0 h-4 bg-orange-50 text-orange-700 border-orange-200">
                                    Group
                                  </Badge>
                                )}
                                {location.isSub && (
                                  <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                    Sub
                                  </Badge>
                                )}
                                {location.is_base && (
                                  <Badge variant="outline" className="text-[10px] py-0 h-4 bg-green-50 text-green-700 border-green-200">
                                    Base
                                  </Badge>
                                )}
                              </div>
                              {location.isSub && !filteredLocations.some(l => l.id === location.associated_location) && (
                                <span className="text-[10px] text-gray-400 italic">
                                  Parent ID: {location.associated_location}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className={`${location.is_base ? "font-bold text-gray-950" : "font-medium text-gray-900"}`}>
                              {location.zipcode}
                            </div>
                            {location.address && (
                              <div className={`${location.is_base ? "font-semibold text-gray-700" : "text-gray-500"} truncate max-w-[250px]`}>
                                {location.address}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white shadow-sm border border-gray-100 rounded-lg">
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              <DropdownMenuItem onClick={() => handleView(location)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(location)} className="cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {location.is_loca_group && (
                                <DropdownMenuItem onClick={() => handleAddSubLocation(location)} className="cursor-pointer">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Sub Location
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteConfirm(location)} className="text-red-600 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-left bg-gray-50/20">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <MapPin className="w-8 h-8 opacity-20" />
                          <p className="text-lg font-medium text-gray-500">No locations found</p>
                          <p className="text-sm">
                            {searchTerm || statusFilter !== "all" || orderRange.min || orderRange.max
                              ? "Try adjusting your filters or search terms"
                              : "Get started by adding your first location"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                      <p className="text-sm">{formatDmy(selectedLocation.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Updated</label>
                      <p className="text-sm">{formatDmy(selectedLocation.updated_at)}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Edit Location: {selectedLocation?.name}</DialogTitle>
              </DialogHeader>
              <AddLocation key={selectedLocation?.id || "new"} editLocation={selectedLocation} onSuccess={handleLocationAdded} onCancel={() => setEditModalOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={addSubLocationOpen} onOpenChange={setAddSubLocationOpen}>
            <DialogContent className="max-w-2xl max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-left">Add Sub Location to: {selectedLocation?.name}</DialogTitle>
              </DialogHeader>
              <AddLocation
                associatedLocationId={selectedLocation?.id}
                siteId={selectedLocation?.site || undefined}
                onSuccess={handleLocationAdded}
                onCancel={() => setAddSubLocationOpen(false)}
              />
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