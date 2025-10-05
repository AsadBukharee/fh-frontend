"use client"
import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

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
  XCircle,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import ExportButton from "@/app/utils/ExportButton"

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

interface DriverForm {
  email: string
  full_name: string
  password?: string
  password_confirm?: string
  role: string
  contractId?: string
  is_active: boolean
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
}

interface DisapprovePayload {
  driver_id: number
  remarks: string
}

export default function DriversPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [contractsLoading, setContractsLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)
  const [driverToDisapprove, setDriverToDisapprove] = useState<Driver | null>(null)
  const [disapproveRemarks, setDisapproveRemarks] = useState("")
  const [disapproveError, setDisapproveError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    profileStatus: [] as string[],
    hasContract: null as boolean | null,
    hasWarnings: null as boolean | null,
  })
  const { showToast } = useToast()
  const cookies = useCookies()
  const [formData, setFormData] = useState<DriverForm>({
    email: "",
    full_name: "",
    role: "driver",
    contractId: "none",
    is_active: true,
    password: "",
    password_confirm: "",
    date_of_birth: "",
    phone: "",
    address: "",
    account_no: "",
    sort_code: "",
    post_code: "",
    national_insurance_no: "",
    license_number: "",
    license_issue_number: "",
    next_of_kin_name: "",
    next_of_kin_relationship: "",
    next_of_kin_contact: "",
    next_of_kin_email: "",
    next_of_kin_address: "",
    manager_name: "",
  })
  const [formErrors, setFormErrors] = useState<Partial<DriverForm>>({})
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

  const handleDisapproveDriverClick = (driver: Driver) => {
    setDriverToDisapprove(driver)
    setDisapproveRemarks("")
    setDisapproveError(null)
    setIsDisapproveDialogOpen(true)
  }

  const handleDisapproveDriver = async () => {
    if (!driverToDisapprove) return

    if (!disapproveRemarks.trim()) {
      setDisapproveError("Remarks are required")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/disapprove/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          driver_id: driverToDisapprove.id,
          remarks: disapproveRemarks,
        } as DisapprovePayload),
      })

      const data = await response.json()

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }

      if (data.success) {
        showToast("Driver disapproved successfully", "success")
        await fetchDrivers()
      } else {
        setDisapproveError(data.message || "Failed to disapprove driver")
        showToast(data.message || "Failed to disapprove driver", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while disapproving the driver"
      setDisapproveError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setIsDisapproveDialogOpen(false)
      setDriverToDisapprove(null)
      setDisapproveRemarks("")
    }
  }

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      })
      if (searchQuery) queryParams.append("q", searchQuery)
      if (filters.profileStatus.length > 0) queryParams.append("profile_status", filters.profileStatus.join(","))
      if (filters.hasContract !== null) queryParams.append("has_contract", filters.hasContract.toString())
      if (filters.hasWarnings !== null) queryParams.append("has_warnings", filters.hasWarnings.toString())
      const url = `${API_URL}/api/profiles/driver/?${queryParams.toString()}`
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
  }, [cookies, showToast, currentPage, searchQuery, filters])

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

  const handleFilterChange = (filterType: string, value: string | boolean | null) => {
    setFilters((prev) => {
      if (filterType === "profileStatus") {
        const newStatus = prev.profileStatus.includes(value as string)
          ? prev.profileStatus.filter((status) => status !== value)
          : [...prev.profileStatus, value as string]
        return { ...prev, profileStatus: newStatus }
      } else if (filterType === "hasContract") {
        return { ...prev, hasContract: value as boolean | null }
      } else if (filterType === "hasWarnings") {
        return { ...prev, hasWarnings: value as boolean | null }
      }
      return prev
    })
    setCurrentPage(1)
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuLabel>Filter Drivers</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.profileStatus.includes("approved")}
                    onCheckedChange={() => handleFilterChange("profileStatus", "approved")}
                  >
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.profileStatus.includes("review")}
                    onCheckedChange={() => handleFilterChange("profileStatus", "review")}
                  >
                    Review
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.profileStatus.includes("not_approved")}
                    onCheckedChange={() => handleFilterChange("profileStatus", "not_approved")}
                  >
                    Not Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.hasContract === true}
                    onCheckedChange={() => handleFilterChange("hasContract", filters.hasContract === true ? null : true)}
                  >
                    Has Contract
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.hasContract === false}
                    onCheckedChange={() => handleFilterChange("hasContract", filters.hasContract === false ? null : false)}
                  >
                    No Contract
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.hasWarnings === true}
                    onCheckedChange={() => handleFilterChange("hasWarnings", filters.hasWarnings === true ? null : true)}
                  >
                    Has Warnings
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.hasWarnings === false}
                    onCheckedChange={() => handleFilterChange("hasWarnings", filters.hasWarnings === false ? null : false)}
                  >
                    No Warnings
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ExportButton data={drivers} fileName="Driver Managements" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      {driver.user.avatar ? (
                        <img
                          src={driver.user.avatar}
                          alt={driver.user.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <Link href={`/dashboard/users/driver-profiles/${driver.id}`}>
                        <h3 className="font-semibold text-lg hover:text-blue-600">{driver.user.display_name}</h3>
                      </Link>
                      <p className="text-sm text-blue-600">{driver.user.email}</p>
                    </div>
                  </div>
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
                      {driver.profile_status !== "approved" && (
                        <DropdownMenuItem onClick={() => handleApproveDriverClick(driver.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {driver.profile_status !== "not_approved" && (
                        <DropdownMenuItem onClick={() => handleDisapproveDriverClick(driver)}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Disapprove
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDriverClick(driver)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">ID:</span>
                    <span className="text-sm">{driver.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">License Number:</span>
                    <span className="text-sm">{driver.license_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Contract:</span>
                    {driver.user.contract ? (
                      <Badge className="bg-green-100 text-green-500">{driver.user.contract.name}</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-600">No Contract</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Profile Status:</span>
                    <Badge className={getProfileStatusColor(driver.profile_status)}>
                      {driver.profile_status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Warnings:</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-center items-center bg-red-300 cursor-pointer text-sm rounded-full w-8 h-8">
                          {driver?.warnings?.length || 0}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-wrap w-[250px] h-fit max-h-[250px] overflow-auto">
                          {driver.warnings.map((warning, index) => (
                            <Badge key={index} className="bg-red-100 m-1 w-fit h-fit text-red-600">
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
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
                <span className="font-semibold">{driverToDelete?.user.full_name}</span>? This action
                cannot be undone, and all associated data will be permanently removed.
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

        {/* Disapprove Driver Dialog */}
        <AlertDialog open={isDisapproveDialogOpen} onOpenChange={setIsDisapproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Disapprove Driver
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disapprove{" "}
                <span className="font-semibold">{driverToDisapprove?.user.full_name}</span>? Please
                provide a reason for disapproval.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="disapprove-remarks">Remarks</Label>
                <Input
                  id="disapprove-remarks"
                  value={disapproveRemarks}
                  onChange={(e) => setDisapproveRemarks(e.target.value)}
                  placeholder="Enter reason for disapproval"
                  className="mt-1"
                />
                {disapproveError && (
                  <p className="text-red-600 text-sm mt-1">{disapproveError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <AlertDialogCancel
                onClick={() => {
                  setIsDisapproveDialogOpen(false)
                  setDriverToDisapprove(null)
                  setDisapproveRemarks("")
                  setDisapproveError(null)
                }}
                className="border-gray-300"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisapproveDriver}
                className="bg-red-600 hover:bg-red-700"
              >
                Disapprove
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}