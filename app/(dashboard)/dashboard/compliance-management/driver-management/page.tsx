"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Filter,
  Download,
  Loader2,
  Save,
  X,
  Mail,
  ToggleLeft,
  AlertCircle,
  RefreshCw,
  User,
  Shield,
  FileText,
  Check,
  Eye,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Driver {
  id: number
  user: {
    id: number
    email: string
    full_name: string
    display_name: string
    parent_rota_completed: boolean
    child_rota_completed: boolean
    is_active: boolean
    contract: { id: number; name: string; description: string } | null
    role: string
    site: Array<{ id: number; name: string; status: string; image: string }>
    shifts_count: number
    avatar?: string | null
  }
  warnings: string[]
  missing_attributes: string[]
  next_step: string
  is_profile_completed: boolean
  remarks: string
  profile_status: string
  have_other_jobs: boolean
  have_other_jobs_note: string
  date_of_birth: string
  phone: string
  address: string
  account_no: string
  sort_code: string
  post_code: string
  national_insurance_no: string
  license_number: string
  license_issue_number: string
  next_of_kin_name: string
  next_of_kin_relationship: string
  next_of_kin_contact: string
  next_of_kin_email: string
  next_of_kin_address: string
  manager_name: string
  signup_date: string
  created_at: string
  updated_at: string
}

interface Contract {
  id: number
  name: string
  description: string
}

interface Role {
  id: number
  slug: string
  name: string
  menu: {
    items: Array<{
      nav: string
      icon: string
      name: string
      tooltip: string
      children: Array<any>
      isSelected: boolean
    }>
  }
}



export default function DriversPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [reviewLoading, setReviewLoading] = useState(false)
  const [contractsLoading, setContractsLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)
  const [driverToReview, setDriverToReview] = useState<Driver | null>(null)
  const [reviewRemarks, setReviewRemarks] = useState("")
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const { showToast } = useToast()
  const cookies = useCookies()
  const router=useRouter();

  

  const perPage = 10

  const handleApproveDriverClick = async (driverId: number) => {
    const response = await fetch(`${API_URL}/api/profiles/driver/approve/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
      },
      body: JSON.stringify({ driver_id: driverId }),
    })
    const data = await response.json()
    if (data.success) {
      showToast("Driver approved successfully", "success")
      fetchDrivers()
    } else {
      showToast(data.message || "Failed to approve driver", "error")
    }
  }

  const handleReviewDriverClick = (driver: Driver) => {
    setDriverToReview(driver)
    setReviewRemarks("")
    setReviewError(null)
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!driverToReview) return

    if (reviewRemarks.length > 150) {
      setReviewError("Remarks cannot exceed 150 characters")
      return
    }

    setReviewLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/review/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          driver_id: driverToReview.id,
          remarks: reviewRemarks,
        }),
      })

      const data = await response.json()
      if (data.success) {
        showToast("Driver review submitted successfully", "success")
        setIsReviewModalOpen(false)
        setDriverToReview(null)
        setReviewRemarks("")
        await fetchDrivers()
      } else {
        showToast(data.message || "Failed to submit review", "error")
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "An error occurred while submitting the review", "error")
    } finally {
      setReviewLoading(false)
    }
  }

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    try {
      const url = `${API_URL}/api/profiles/driver/?page=${currentPage}&per_page=${perPage}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`
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
        setDrivers(data.data.results)
        setTotalPages(data.data.pagination.total_pages || 1)
        setError(null)
      } else {
        setError(data.message || "Failed to fetch drivers")
        showToast(data.message || "Failed to fetch drivers", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching drivers"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }, [cookies, showToast, currentPage, searchQuery])

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true)
    try {
      const response = await fetch(`${API_URL}/roles/`, {
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
        setRoles(data.data)
      } else {
        showToast(data.message || "Failed to fetch roles", "error")
        setRoles([])
      }
    } catch (error) {
      console.log(error)
      showToast("Failed to fetch roles", "error")
      setRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [cookies, showToast])

  useEffect(() => {
    fetchDrivers()
    fetchRoles()
  }, [fetchDrivers, fetchRoles])

  useEffect(() => {
    if (isEditModalOpen || isModalOpen) {
      const fetchContracts = async () => {
        setContractsLoading(true)
        try {
          const response = await fetch(`${API_URL}/api/staff/contracts/`, {
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
          setContracts(data)
        } catch {
          showToast("Failed to fetch contracts", "error")
        } finally {
          setContractsLoading(false)
        }
      }
      fetchContracts()
    }
  }, [isEditModalOpen, isModalOpen, cookies, showToast])

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

 

  const getProfileStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-[10px] text-green-700"
      case "review":
        return "bg-yellow-100 text-[10px] text-yellow-700"
      case "not_approved":
        return "bg-red-100 text-[10px] text-red-700"
      default:
        return "bg-gray-100 text-[10px] text-gray-700"
    }
  }



  const handleDeleteDriverClick = (driver: Driver) => {
    setDriverToDelete(driver)
    setIsDeleteDialogOpen(true)
  }



  const handleDeleteDriver = async () => {
    if (!driverToDelete) return

    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${driverToDelete.id}/`, {
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
        showToast(data.message || `${driverToDelete.user.full_name} has been deleted successfully`, "success")
        await fetchDrivers()
      } else {
        showToast(data.message || "Failed to delete driver", "error")
      }
    } catch {
      showToast("An error occurred while deleting the driver", "error")
    } finally {
      setIsDeleteDialogOpen(false)
      setDriverToDelete(null)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  return (
    <TooltipProvider>
      <div className="p-6 bg-white">
        <header className="bg-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-sm text-gray-500">Manage your drivers and their profiles</p>
            </div>
            <div className="space-x-2 flex h-[40px]">
              <button className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={fetchDrivers}
                disabled={loading}
                className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
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
              placeholder="Search drivers"
              className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading drivers...</span>
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
                  <TableHead className="text-gray-600 font-medium">Sr No.</TableHead>
                  <TableHead className="text-gray-600 font-medium">Name</TableHead>
                  <TableHead className="text-gray-600 font-medium">Email</TableHead>
                  <TableHead className="text-gray-600 font-medium">License Number</TableHead>
                  {/* <TableHead className="text-gray-600 font-medium">Driver License Expiry</TableHead>
                  <TableHead className="text-gray-600 font-medium">Last Driver Check Code Date</TableHead>
                  <TableHead className="text-gray-600 font-medium">Next Driver Check Code Date</TableHead>
                  <TableHead className="text-gray-600 font-medium">Tacho Expiry</TableHead>

                  <TableHead className="text-gray-600 font-medium">License Expiry</TableHead> */}

                  <TableHead className="text-gray-600 font-medium">Contract</TableHead>
                  <TableHead className="text-gray-600 font-medium">Profile Status</TableHead>
                  <TableHead className="text-gray-600 font-medium">Warnings</TableHead>
                  <TableHead className="text-gray-600 font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id} className="border-b border-gray-100">
                    <TableCell className="font-medium">{driver.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/compliance-management/driver-management/${driver.id}`} className="text-black  underline">
                        {driver.user.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-blue-600">{driver.user.email}</TableCell>
                    <TableCell>{driver.license_number}</TableCell>
                    <TableCell>
                      <span>
                        {driver.user.contract ? (
                          <Badge className="bg-green-100 text-green-500">{driver.user.contract.name}</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-600">No Contract</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getProfileStatusColor(driver.profile_status)}>
                        {driver.profile_status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-center items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center items-center bg-red-300 cursor-pointer text-sm rounded-full w-8 h-8">
                            {driver?.warnings?.length || 0}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex flex-wrap w-[250px] h-fit max-h-[250px] overflow-auto">
                            {driver.warnings.map((warning, index) => (
                              <Badge key={index} className="bg-red-100 m-1 w-fit h-fit text-red-600">{warning}</Badge>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            ref={(el: HTMLButtonElement | null) => {
                              buttonRefs.current[`action-${driver.id}`] = el
                            }}
                            variant="ghost"
                            size="sm"
                            className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
                            onMouseMove={handleMouseMove(`action-${driver.id}`)}
                          >
                            <MoreHorizontal className="w-4 h-4 relative z-10" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem onClick={() => handleApproveDriverClick(driver.id)}>
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReviewDriverClick(driver)}>
                            <Star className="w-4 h-4 mr-2" />
                            Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={()=>router.push(`/dashboard/compliance-management/driver-management/${driver.id}`)} >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDriverClick(driver)}>
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

        {/* Review Driver Dialog */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Review Driver
              </DialogTitle>
              <DialogDescription>
                Add remarks for {driverToReview?.user.full_name}&apos;s review (max 150 characters).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review-remarks">Remarks</Label>
                <Input
                  id="review-remarks"
                  name="remarks"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Enter review remarks"
                  maxLength={150}
                  className={reviewError ? "border-red-500" : ""}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{reviewRemarks.length}/150</span>
                  {reviewError && (
                    <p className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {reviewError}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReviewModalOpen(false)
                    setDriverToReview(null)
                    setReviewRemarks("")
                    setReviewError(null)
                  }}
                  disabled={reviewLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reviewLoading}
                  className="bg-gradient-to-r from-orange to-magenta hover:from-orange-700 hover:to-magenta-700"
                >
                  {reviewLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


        {/* Delete Driver Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Delete Driver
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{driverToDelete?.user.full_name}</span>? This action cannot be undone, and all associated data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDriverToDelete(null)
                }}
                className="border-gray-300"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDriver}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}