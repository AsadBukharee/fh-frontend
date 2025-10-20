"use client"
import type React from "react"
import { useRef, useState, useEffect, useCallback, useMemo } from "react"
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
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false)
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    profileStatus: [] as string[],
    hasContract: null as boolean | null,
    hasWarnings: null as boolean | null,
  })
  const { showToast } = useToast()
  const cookies = useCookies()

  const perPage = 10
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const filteredDrivers = useMemo(() => {
    return allDrivers.filter((driver) => {
      let matches = true
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        matches =
          matches &&
          (driver.user.full_name.toLowerCase().includes(query) ||
            driver.user.display_name.toLowerCase().includes(query) ||
            driver.user.email.toLowerCase().includes(query))
      }
      // Profile status filter
      if (filters.profileStatus.length > 0) {
        matches = matches && filters.profileStatus.includes(driver.profile_status.toLowerCase())
      }
      // Contract filter
      if (filters.hasContract !== null) {
        matches = matches && (driver.user.contract !== null) === filters.hasContract
      }
      // Warnings filter
      if (filters.hasWarnings !== null) {
        matches = matches && (driver.warnings.length > 0) === filters.hasWarnings
      }
      return matches
    })
  }, [allDrivers, filters, searchQuery])

  const totalPages = useMemo(() => Math.ceil(filteredDrivers.length / perPage), [filteredDrivers])

  const currentDrivers = useMemo(
    () => filteredDrivers.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredDrivers, currentPage]
  )

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
    setSearchLoading(true)
    let allData: Driver[] = []
    let page = 1
    let total_pages = 1
    try {
      while (page <= total_pages) {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          per_page: "100",
        })
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
          allData = [...allData, ...data.data.results]
          total_pages = data.data.pagination.total_pages || 1
        } else {
          setError(data.message || "Failed to fetch drivers")
          showToast(data.message || "Failed to fetch drivers", "error")
          return
        }
        page++
      }
      setAllDrivers(allData)
      setError(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching drivers"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }, [cookies, showToast])

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

  // Debounced search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // Handle keyboard events
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1)
    } else if (e.key === "Escape") {
      handleClearSearch()
    }
  }

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

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
              <ExportButton data={filteredDrivers} fileName="Driver Managements" />
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
              ref={searchInputRef}
              placeholder="Search drivers by name"
              className="pl-10 pr-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search drivers by name"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
        ) : currentDrivers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            {searchQuery || filters.profileStatus.length > 0 || filters.hasContract !== null || filters.hasWarnings !== null
              ? "No drivers match the current filters or search query"
              : "No drivers found"}
          </div>
        ) : (
          <>
            {(searchQuery || filters.profileStatus.length > 0 || filters.hasContract !== null || filters.hasWarnings !== null) && (
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}{searchQuery && ` for "${searchQuery}"`}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {currentDrivers.map((driver) => (
  <Link
    key={driver.id}
    href={`/dashboard/users/driver-profiles/${driver.id}`}
    className="block rounded-xl"
  >
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 group"
      onClick={(e) => {
        // Prevent navigation if clicking on interactive elements
        if (
          e.target instanceof HTMLElement &&
          (e.target.closest("button") ||
            // e.target.closest("a") ||
            e.target.closest(".dropdown-menu"))
        ) {
          e.preventDefault()
        }
      }}
    >
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center ring-4 ring-white shadow-md">
                {driver.user.avatar ? (
                  <img
                    src={driver.user.avatar}
                    alt={driver.user.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-orange-600" />
                )}
              </div>
              {driver.user.is_active && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-gray-900 hover:text-orange-600 transition-colors truncate">
                {driver.user.display_name}
              </h3>
              <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                {driver.user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getProfileStatusColor(driver.profile_status)} text-[9px] px-2 py-0.5`}>
                  {driver.profile_status.replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-[10px] text-gray-500">ID: {driver.id}</span>
              </div>
            </div>
          </div>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                ref={(el: HTMLButtonElement | null) => {
                  buttonRefs.current[`action-${driver.id}`] = el
                }}
                variant="ghost"
                size="sm"
                className="ripple cursor-glow h-8 w-8 p-0 hover:bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseMove={handleMouseMove(`action-${driver.id}`)}
              >
                <MoreHorizontal className="w-4 h-4 relative z-10 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white w-48">
              {driver.profile_status !== "approved" && (
                <DropdownMenuItem onClick={() => handleApproveDriverClick(driver.id)} className="cursor-pointer">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  <span>Approve Profile</span>
                </DropdownMenuItem>
              )}
              {driver.profile_status !== "not_approved" && (
                <DropdownMenuItem onClick={() => handleDisapproveDriverClick(driver)} className="cursor-pointer">
                  <XCircle className="w-4 h-4 mr-2 text-orange-600" />
                  <span>Not Approved</span>
                </DropdownMenuItem>
              )}
              {driver.profile_status === "not_approved" && (
                <DropdownMenuItem onClick={() => handleResendActivation(driver.user.id)} className="cursor-pointer">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Resend Activation</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => handleDeleteDriverClick(driver)}>
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Delete Driver</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
          <Shield className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wide">License Number</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{driver.license_number || "Not Provided"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">Contract</p>
            {driver.user.contract ? (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-900 truncate">{driver.user.contract.name}</p>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <p className="text-sm font-semibold text-red-600">No Contract</p>
              </div>
            )}
          </div>
        </div>
        {driver.warnings && driver.warnings.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-red-600 font-medium uppercase tracking-wide">Active Warnings</p>
                  <p className="text-sm font-semibold text-red-700">{driver.warnings.length} Warning{driver.warnings.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex justify-center items-center bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7">
                  {driver.warnings.length}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1 max-h-48 overflow-auto">
                <p className="font-semibold text-xs mb-2">Warning Details:</p>
                {driver.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-1.5 text-xs">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">Status</p>
              <p className="text-sm font-semibold text-green-700">No Active Warnings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </Link>
))}
            </div>
          </>
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
        <AlertDialog open={isDisapproveDialogOpen} onOpenChange={setIsDisapproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Not Approve Driver
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