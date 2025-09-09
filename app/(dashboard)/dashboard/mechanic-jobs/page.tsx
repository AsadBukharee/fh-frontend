"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import Link from "next/link"
import GradientButton from "@/app/utils/GradientButton"
import AddMechanicJobDialog from "@/components/mechhanic-job/AddMechanic"
import ProgressInMechanic from "@/components/mechhanic-job/ProgressINMechanic"

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

interface ApiResponse {
  success: boolean
  message: string
  data: {
    results: MechanicJob[]
    count: number
    page: number
    page_size: number
    total_pages: number
  }
}

export default function MechanicJobsPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [jobs, setJobs] = useState<MechanicJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobToDelete, setJobToDelete] = useState<MechanicJob | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isBarChartDialogOpen, setIsBarChartDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<MechanicJob | null>(null)
  const [status, setStatus] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const perPage = 10
  const { showToast } = useToast()
  const cookies = useCookies()
  const role = cookies.get("role") || "user"

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const url = `${API_URL}/activity/mechanic-job/?page=${currentPage}&per_page=${perPage}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`
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
      const data: ApiResponse = await response.json()
      if (data.success) {
        setJobs(data.data.results)
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
  }, [cookies, showToast, currentPage, searchQuery])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

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
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
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
            <h1 className="text-3xl font-bold text-gray-900">Mechanic Jobs Management</h1>
            <p className="text-sm text-gray-500">Manage and track mechanic job details</p>
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
            placeholder="Search mechanic jobs"
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        <div className="rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Job ID</TableHead>
                <TableHead>Vehicle Reg</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Defects</TableHead>
                <TableHead>Notes</TableHead>
                {
                  role==='mechanic' ?  <TableHead>Parts</TableHead> : null
                }
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
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
                  {
                    role==='mechanic' ? <TableCell>
                      <Badge className="bg-gray-100 cursor-pointer text-gray-700 ">
                        <Eye size={20}/>
                      </Badge>
                      </TableCell> : null
                  }
                  <TableCell className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.status.toLowerCase() === "work_in_progress" && 
                      <Badge 
                        className="bg-gray-100 text-gray-700 cursor-pointer text-[10px]"
                        onClick={() => handleBarChartClick(job)}
                      >
                        <BarChart />
                      </Badge>
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(job.timestamp).toLocaleDateString()}
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
                          <MoreHorizontal className="w-4 h-4 mr-2 relative z-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem>
                          <Link href={`/mechanic-jobs/${job.id}`} className="flex items-center">
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