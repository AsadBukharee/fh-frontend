"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Textarea } from "@/components/ui/textarea"
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
  BarChart,
  CircleCheck,
  X,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import Link from "next/link"
import GradientButton from "@/app/utils/GradientButton"
import AddMechanicJobDialog from "@/components/mechhanic-job/AddMechanic"
import ProgressInMechanic from "@/components/mechhanic-job/ProgressINMechanic"
import ExportButton from "@/app/utils/ExportButton"

interface MechanicJob {
  id: number
  vehicle_reg: string
  mechanic_name: string
  assignee_name: string
  mechanicdefects: string[]
  notes: string
  source: string
  status: string
  timestamp: string
  vehicle: number
  mechanic: number
  assignee: number
}

interface User {
  id: number
  full_name: string
}

interface Vehicle {
  id: number
  registration_number: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MechanicJobApiResponse extends ApiResponse<{
  results: MechanicJob[]
  count: number
  page: number
  page_size: number
  total_pages: number
}> {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserApiResponse extends ApiResponse<User[]> {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VehicleApiResponse extends ApiResponse<Vehicle[]> {}

export default function MechanicJobsPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [allJobs, setAllJobs] = useState<MechanicJob[]>([])
  const [managers, setManagers] = useState<User[]>([])
  const [mechanics, setMechanics] = useState<User[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobToDelete, setJobToDelete] = useState<MechanicJob | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isBarChartDialogOpen, setIsBarChartDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<MechanicJob | null>(null)
  const [status, setStatus] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterVehicleReg, setFilterVehicleReg] = useState<string>("")
  const [filterMechanicName, setFilterMechanicName] = useState<string>("")
  const [filterAssigneeName, setFilterAssigneeName] = useState<string>("")
  const [filterSource, setFilterSource] = useState<string>("")
  const [filterDefects, setFilterDefects] = useState<string>("")
  const [filterStartDate, setFilterStartDate] = useState<string>("")
  const [filterEndDate, setFilterEndDate] = useState<string>("")
  
  const perPage = 10
  const { showToast } = useToast()
  const cookies = useCookies()
  const role = cookies.get("role") || "user"

  // Frontend filtering logic
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        job.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.mechanic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.mechanicdefects.some(defect => 
          defect.toLowerCase().includes(searchQuery.toLowerCase())
        )

      // Status filter
      const matchesStatus = filterStatus === '' || filterStatus === 'all' || 
        job.status.toLowerCase() === filterStatus.toLowerCase()

      // Vehicle registration filter
      const matchesVehicleReg = filterVehicleReg === '' || filterVehicleReg === 'all' ||
        job.vehicle_reg === filterVehicleReg

      // Mechanic name filter
      const matchesMechanicName = filterMechanicName === '' || filterMechanicName === 'all' ||
        job.mechanic_name === filterMechanicName

      // Assignee name filter
      const matchesAssigneeName = filterAssigneeName === '' || filterAssigneeName === 'all' ||
        job.assignee_name === filterAssigneeName

      // Source filter
      const matchesSource = filterSource === '' ||
        job.source.toLowerCase().includes(filterSource.toLowerCase())

      // Defects filter
      const matchesDefects = filterDefects === '' ||
        job.mechanicdefects.some(defect => 
          defect.toLowerCase().includes(filterDefects.toLowerCase())
        )

      // Date filters
      const jobDate = new Date(job.timestamp)
      const matchesStartDate = filterStartDate === '' || 
        jobDate >= new Date(filterStartDate)
      
      const matchesEndDate = filterEndDate === '' || 
        jobDate <= new Date(filterEndDate)

      return matchesSearch && matchesStatus && matchesVehicleReg && 
             matchesMechanicName && matchesAssigneeName && matchesSource && 
             matchesDefects && matchesStartDate && matchesEndDate
    })
  }, [
    allJobs, 
    searchQuery, 
    filterStatus, 
    filterVehicleReg, 
    filterMechanicName, 
    filterAssigneeName, 
    filterSource, 
    filterDefects, 
    filterStartDate, 
    filterEndDate
  ])

  // Calculate pagination based on filtered results
  const totalFilteredPages = Math.ceil(filteredJobs.length / perPage)
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return filteredJobs.slice(startIndex, endIndex)
  }, [filteredJobs, currentPage, perPage])

  const fetchManagers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users/list-names/?role=manager`, {
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
      const data: UserApiResponse = await response.json()
      if (data.success) {
        setManagers(data.data)
      } else {
        showToast(data.message || "Failed to fetch managers", "error")
      }
    } catch (error) {
      showToast("An error occurred while fetching managers", "error")
    }
  }, [cookies, showToast])

  const fetchMechanics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users/list-names/?role=mechanic`, {
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
      const data: UserApiResponse = await response.json()
      if (data.success) {
        setMechanics(data.data)
      } else {
        showToast(data.message || "Failed to fetch mechanics", "error")
      }
    } catch (error) {
      showToast("An error occurred while fetching mechanics", "error")
    }
  }, [cookies, showToast])

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
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
      const data: VehicleApiResponse = await response.json()
      if (data.success) {
        setVehicles(data.data)
      } else {
        showToast(data.message || "Failed to fetch vehicles", "error")
      }
    } catch (error) {
      showToast("An error occurred while fetching vehicles", "error")
    }
  }, [cookies, showToast])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all jobs without filters (simplified query)
      const queryParams = new URLSearchParams({
        page: "1",
        per_page: "1000", // Fetch more to handle frontend pagination
      }).toString()

      const url = `${API_URL}/activity/mechanic-job/?${queryParams}`
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
      const data: MechanicJobApiResponse = await response.json()
      if (data.success) {
        setAllJobs(data.data.results)
        setTotalPages(data.data.total_pages || 1)
        setError(null)
      } else {
        setError(data.message || "Failed to fetch mechanic jobs")
        showToast(data.message || "Failed to fetch mechanic jobs", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching mechanic jobs"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }, [cookies, showToast])

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredJobs.length])

  useEffect(() => {
    Promise.all([fetchJobs(), fetchManagers(), fetchMechanics(), fetchVehicles()])
  }, [fetchJobs, fetchManagers, fetchMechanics, fetchVehicles])

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
      case "in_house":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100"
      case "completed":
        return "bg-green-100 text-green-700 hover:bg-green-100"
      case "pending":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      case "work_in_progress":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const handleDeleteJobClick = (job: MechanicJob) => {
    setJobToDelete(job)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteJob = async () => {
    if (!jobToDelete) return

    try {
      const response = await fetch(`${API_URL}/activity/mechanic-job/${jobToDelete.id}/`, {
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
        showToast(data.message || `Job ID ${jobToDelete.id} has been deleted successfully`, "success")
        await fetchJobs()
      } else {
        showToast(data.message || "Failed to delete job", "error")
      }
    } catch {
      showToast("An error occurred while deleting the job", "error")
    } finally {
      setIsDeleteDialogOpen(false)
      setJobToDelete(null)
    }
  }

  const handleStatusUpdateClick = (job: MechanicJob) => {
    setSelectedJob(job)
    setStatus(job.status)
    setNotes(job.notes)
    setIsStatusDialogOpen(true)
  }

  const handleBarChartClick = (job: MechanicJob) => {
    setSelectedJob(job)
    setIsBarChartDialogOpen(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedJob) return

    try {
      const payload = {
        status,
        notes,
      }
      const response = await fetch(`${API_URL}/activity/mechanic-job/${selectedJob.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }

      const data = await response.json()

      if (response.ok && data.success) {
        showToast(data.message || `Job ID ${selectedJob.id} status updated successfully`, "success")
        await fetchJobs()
      } else {
        showToast(data.message || "Failed to update job status", "error")
      }
    } catch {
      showToast("An error occurred while updating the job status", "error")
    } finally {
      setIsStatusDialogOpen(false)
      setSelectedJob(null)
      setStatus("")
      setNotes("")
    }
  }

  const handleApplyFilters = () => {
    setIsFilterDialogOpen(false)
  }

  const handleClearFilters = () => {
    setFilterStatus("")
    setFilterVehicleReg("")
    setFilterMechanicName("")
    setFilterAssigneeName("")
    setFilterSource("")
    setFilterDefects("")
    setFilterStartDate("")
    setFilterEndDate("")
    setIsFilterDialogOpen(false)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalFilteredPages) setCurrentPage(currentPage + 1)
  }

  // Update search query on change (debounced if needed)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }, [])

  return (
    <div className="p-6 bg-white">
      <header className="bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mechanic Jobs Management</h1>
            <p className="text-sm text-gray-500">Manage and track mechanic job details</p>
          </div>
          <div className="space-x-2 flex">
            <Button
              onClick={() => setIsFilterDialogOpen(true)}
              className="px-4 border h-[45px] border-gray-50 bg-white shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              Filter ({filteredJobs.length} of {allJobs.length})
            </Button>
            <ExportButton data={paginatedJobs} fileName="Mechanic Job"/>
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mb-6 flex justify-between items-center">
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
            placeholder="Search mechanic jobs..."
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        {role === "superadmin" && (
          <GradientButton
            text="Mechanic Job"
            Icon={Plus}
            onClick={() => setIsAddDialogOpen(true)}
          />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading mechanic jobs...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : (
        <>
          {/* Results summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {paginatedJobs.length} of {filteredJobs.length} mechanic jobs 
            {searchQuery || Object.values({filterStatus, filterVehicleReg, filterMechanicName, filterAssigneeName, filterSource, filterDefects, filterStartDate, filterEndDate}).some(f => f !== '') && 
              ` (filtered from ${allJobs.length} total)`}
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Job ID</TableHead>
                  <TableHead>Vehicle Reg</TableHead>
                  <TableHead>Mechanic</TableHead>
                  <TableHead>Defects</TableHead>
                  <TableHead>Notes</TableHead>
                  {role === "mechanic" ? <TableHead>Parts</TableHead> : null}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.length > 0 ? (
                  paginatedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.id}</TableCell>
                      <TableCell>{job.vehicle_reg}</TableCell>
                      <TableCell>{job.mechanic_name}</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">
                          {job.mechanicdefects.length} Defects
                        </Badge>
                        <span className="ml-2 text-sm">{job.mechanicdefects.join(", ")}</span>
                      </TableCell>
                      <TableCell>{job.notes}</TableCell>
                      {role === "mechanic" ? (
                        <TableCell>
                          <Badge className="bg-gray-100 cursor-pointer text-gray-700 ">
                            <Eye size={20} />
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell className="flex items-center gap-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        {job.status.toLowerCase() === "work_in_progress" && (
                          <Badge
                            className="bg-gray-100 text-gray-700 cursor-pointer text-[10px]"
                            onClick={() => handleBarChartClick(job)}
                          >
                            <BarChart />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(job.timestamp).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              ref={(el: HTMLButtonElement | null) => {
                                buttonRefs.current[`action-${job.id}`] = el
                              }}
                              variant="outline"
                              className="bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm ripple cursor-glow"
                              onMouseMove={handleMouseMove(`action-${job.id}`)}
                            >
                              <MoreHorizontal className="w-4 h-4 relative z-10" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem>
                              <Link href={`/dashboard/mechanic-jobs/${job.id}`} className="flex items-center">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdateClick(job)}>
                              <CircleCheck className="w-4 h-4 mr-2" />
                              Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteJobClick(job)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={role === "mechanic" ? 9 : 8} className="text-center py-8 text-gray-500">
                      No mechanic jobs found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page</span>
            <Badge variant="outline" className="bg-gray-100">
              {currentPage}
            </Badge>
            <span className="text-sm text-gray-600">of {totalFilteredPages}</span>
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
              disabled={currentPage === totalFilteredPages || loading}
            >
              <span className="relative z-10">Next</span>
              <ChevronRight className="w-4 h-4 ml-1 relative z-10" />
            </Button>
          </div>
        </div>
      )}

      {/* Filter Dialog */}
      <AlertDialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-500" />
              Filter Mechanic Jobs
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apply filters to narrow down the list of mechanic jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in_house">In House</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="work_in_progress">Work in Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle Registration</label>
              <Select value={filterVehicleReg} onValueChange={setFilterVehicleReg}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle registration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.registration_number}>
                      {vehicle.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mechanic Name</label>
              <Select value={filterMechanicName} onValueChange={setFilterMechanicName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mechanic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.full_name}>
                      {mechanic.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Manager Name</label>
              <Select value={filterAssigneeName} onValueChange={setFilterAssigneeName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.full_name}>
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Source</label>
              <Input
                placeholder="Enter source keywords"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Defects (keyword search)</label>
              <Input
                placeholder="Enter defect keywords"
                value={filterDefects}
                onChange={(e) => setFilterDefects(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyFilters} className="bg-orange-600 hover:bg-orange-700">
              Apply Filters
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Mechanic Job
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete job ID <strong>{jobToDelete?.id}</strong> for vehicle <strong>{jobToDelete?.vehicle_reg}</strong>? This action cannot be undone and will permanently remove the job from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-red-600 hover:bg-red-700">
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CircleCheck className="w-5 h-5 text-orange-500" />
              Update Job Status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update the status and notes for job ID <strong>{selectedJob?.id}</strong> for vehicle <strong>{selectedJob?.vehicle_reg}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_house">In House</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="work_in_progress">Work in Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes"
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} className="bg-orange-600 hover:bg-orange-700">
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProgressInMechanic
        isBarChartDialogOpen={isBarChartDialogOpen}
        setIsBarChartDialogOpen={setIsBarChartDialogOpen}
        selectedJobid={selectedJob ? selectedJob.id : null}
      />

      <AddMechanicJobDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onJobAdded={fetchJobs}
      />
    </div>
  )
}