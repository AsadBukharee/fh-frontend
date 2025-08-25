"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export default function DriversPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
 console.log(setIsModalOpen)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [contractsLoading, setContractsLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
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
  const { showToast } = useToast()
  const cookies = useCookies()
const handleApproveDriverClick = async (driverId: number) => {
  const response=await fetch(`${API_URL}/api/profiles/driver/approve/`, {
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

  const getTypeColor = (roleName: string | undefined) => {
    switch (roleName?.toLowerCase()) {
      case "driver":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }



  const getProfileStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-[10px] text-green-700"
      case "review":
        return "bg-yellow-100 text-[10px]  text-yellow-700"
      case "not_approved":
        return "bg-red-100 text-[10px]  text-red-700"
      default:
        return "bg-gray-100 text-[10px]  text-gray-700"
    }
  }

 

  const handleEditDriverClick = (driver: Driver) => {
    setSelectedDriver(driver)
    setFormData({
      email: driver.user.email,
      full_name: driver.user.full_name,
      role: driver.user.role,
      contractId: driver.user.contract?.id.toString() || "none",
      is_active: driver.user.is_active,
      date_of_birth: driver.date_of_birth,
      phone: driver.phone,
      address: driver.address,
      account_no: driver.account_no,
      sort_code: driver.sort_code,
      post_code: driver.post_code,
      national_insurance_no: driver.national_insurance_no,
      license_number: driver.license_number,
      license_issue_number: driver.license_issue_number,
      next_of_kin_name: driver.next_of_kin_name,
      next_of_kin_relationship: driver.next_of_kin_relationship,
      next_of_kin_contact: driver.next_of_kin_contact,
      next_of_kin_email: driver.next_of_kin_email,
      next_of_kin_address: driver.next_of_kin_address,
      manager_name: driver.manager_name,
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleDeleteDriverClick = (driver: Driver) => {
    setDriverToDelete(driver)
    setIsDeleteDialogOpen(true)
  }


  const validateEditDriverForm = (data: DriverForm): Partial<DriverForm> => {
    const errors: Partial<DriverForm> = {}

    if (!data.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!data.full_name.trim()) {
      errors.full_name = "Full name is required"
    } else if (data.full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters"
    }

    if (!data.role) {
      errors.role = "Role is required"
    }

    if (!data.date_of_birth) {
      errors.date_of_birth = "Date of birth is required"
    }

    if (!data.phone?.trim()) {
      errors.phone = "Phone number is required"
    } else if (!/^\+?\d{10,14}$/.test(data.phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    if (!data.license_number?.trim()) {
      errors.license_number = "License number is required"
    }

    if (!data.license_issue_number?.trim()) {
      errors.license_issue_number = "License issue number is required"
    }

    return errors
  }

  

  const handleEditDriverSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const editFormData: DriverForm = {
      email: form.get("email") as string,
      full_name: form.get("full_name") as string,
      role: form.get("role") as string,
      contractId: form.get("contract") as string,
      is_active: (form.get("is_active") as string) === "on",
      date_of_birth: form.get("date_of_birth") as string,
      phone: form.get("phone") as string,
      address: form.get("address") as string,
      account_no: form.get("account_no") as string,
      sort_code: form.get("sort_code") as string,
      post_code: form.get("post_code") as string,
      national_insurance_no: form.get("national_insurance_no") as string,
      license_number: form.get("license_number") as string,
      license_issue_number: form.get("license_issue_number") as string,
      next_of_kin_name: form.get("next_of_kin_name") as string,
      next_of_kin_relationship: form.get("next_of_kin_relationship") as string,
      next_of_kin_contact: form.get("next_of_kin_contact") as string,
      next_of_kin_email: form.get("next_of_kin_email") as string,
      next_of_kin_address: form.get("next_of_kin_address") as string,
      manager_name: form.get("manager_name") as string,
    }

    const errors = validateEditDriverForm(editFormData)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      showToast("Please fix the form errors", "error")
      return
    }

    if (!selectedDriver) return

    setEditLoading(true)

    try {
      // Update user
      const userResponse = await fetch(`${API_URL}/users/${selectedDriver.user.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          email: editFormData.email,
          full_name: editFormData.full_name,
          role: editFormData.role,
          is_active: editFormData.is_active,
        }),
      })

      if (userResponse.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }

      const userData = await userResponse.json()
      if (!userData.success) {
        showToast(userData.message || "Failed to update driver details", "error")
        return
      }

      // Update driver profile
      const driverPayload = {
        date_of_birth: editFormData.date_of_birth,
        phone: editFormData.phone,
        address: editFormData.address,
        account_no: editFormData.account_no,
        sort_code: editFormData.sort_code,
        post_code: editFormData.post_code,
        national_insurance_no: editFormData.national_insurance_no,
        license_number: editFormData.license_number,
        license_issue_number: editFormData.license_issue_number,
        next_of_kin_name: editFormData.next_of_kin_name,
        next_of_kin_relationship: editFormData.next_of_kin_relationship,
        next_of_kin_contact: editFormData.next_of_kin_contact,
        next_of_kin_email: editFormData.next_of_kin_email,
        next_of_kin_address: editFormData.next_of_kin_address,
        manager_name: editFormData.manager_name,
      }

      const driverResponse = await fetch(`${API_URL}/api/profiles/driver/${selectedDriver.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(driverPayload),
      })

      if (driverResponse.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }

      const driverData = await driverResponse.json()
      if (!driverData.success) {
        showToast(driverData.message || "Failed to update driver profile", "error")
        return
      }

      // Assign contract if provided
      if (editFormData.contractId && editFormData.contractId !== "none") {
        const contractResponse = await fetch(`${API_URL}/users/${selectedDriver.user.id}/assign-contract/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({ contract_id: Number.parseInt(editFormData.contractId) }),
        })
        if (contractResponse.status === 401) {
          showToast("Session expired. Please log in again.", "error")
          return
        }
        await contractResponse.json()
      }

      showToast("Driver updated successfully", "success")
      setIsEditModalOpen(false)
      setSelectedDriver(null)
      await fetchDrivers()
    } catch (error) {
        console.log(error)
      showToast(error instanceof Error ? error.message : "An error occurred while updating the driver", "error")
    } finally {
      setEditLoading(false)
    }
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
                  <TableCell className="font-medium">{driver.user.display_name}</TableCell>
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
           <div className="flex  justify-center items-center bg-red-300 cursor-pointer  text-sm rounded-full w-8 h-8 ">
                      {driver?.warnings?.length || 0}
                    </div>
      </TooltipTrigger>
      <TooltipContent>
       <div className="flex flex-wrap  w-[250px] h-fit   max-h-[250px] overflow-auto">
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
                           <DropdownMenuItem  onClick={() => handleApproveDriverClick(driver.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditDriverClick(driver)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
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

   

      {/* Edit Driver Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5" />
              Edit Driver Details
            </DialogTitle>
            <DialogDescription>
              Update driver information and permissions. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDriverSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Personal Information</div>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-full_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="edit-full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter full name"
                    className={formErrors.full_name ? "border-red-500" : ""}
                  />
                  {formErrors.full_name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.full_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date_of_birth" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="edit-date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className={formErrors.date_of_birth ? "border-red-500" : ""}
                  />
                  {formErrors.date_of_birth && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.date_of_birth}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Address
                  </Label>
                  <Input
                    id="edit-address"
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-post_code" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Post Code
                  </Label>
                  <Input
                    id="edit-post_code"
                    name="post_code"
                    placeholder="Enter post code"
                    value={formData.post_code}
                    onChange={(e) => setFormData({ ...formData, post_code: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Driver Details</div>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-account_no" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Account Number
                  </Label>
                  <Input
                    id="edit-account_no"
                    name="account_no"
                    placeholder="Enter account number"
                    value={formData.account_no}
                    onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-sort_code" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Sort Code
                  </Label>
                  <Input
                    id="edit-sort_code"
                    name="sort_code"
                    placeholder="Enter sort code"
                    value={formData.sort_code}
                    onChange={(e) => setFormData({ ...formData, sort_code: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-national_insurance_no" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    National Insurance Number
                  </Label>
                  <Input
                    id="edit-national_insurance_no"
                    name="national_insurance_no"
                    placeholder="Enter national insurance number"
                    value={formData.national_insurance_no}
                    onChange={(e) => setFormData({ ...formData, national_insurance_no: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-license_number" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    License Number
                  </Label>
                  <Input
                    id="edit-license_number"
                    name="license_number"
                    placeholder="Enter license number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className={formErrors.license_number ? "border-red-500" : ""}
                  />
                  {formErrors.license_number && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.license_number}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-license_issue_number" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    License Issue Number
                  </Label>
                  <Input
                    id="edit-license_issue_number"
                    name="license_issue_number"
                    placeholder="Enter license issue number"
                    value={formData.license_issue_number}
                    onChange={(e) => setFormData({ ...formData, license_issue_number: e.target.value })}
                    className={formErrors.license_issue_number ? "border-red-500" : ""}
                  />
                  {formErrors.license_issue_number && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.license_issue_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Next of Kin</div>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-next_of_kin_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Next of Kin Name
                  </Label>
                  <Input
                    id="edit-next_of_kin_name"
                    name="next_of_kin_name"
                    placeholder="Enter next of kin name"
                    value={formData.next_of_kin_name}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-next_of_kin_relationship" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Relationship
                  </Label>
                  <Input
                    id="edit-next_of_kin_relationship"
                    name="next_of_kin_relationship"
                    placeholder="Enter relationship"
                    value={formData.next_of_kin_relationship}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_relationship: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-next_of_kin_contact" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Number
                  </Label>
                  <Input
                    id="edit-next_of_kin_contact"
                    name="next_of_kin_contact"
                    placeholder="Enter contact number"
                    value={formData.next_of_kin_contact}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_contact: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-next_of_kin_email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="edit-next_of_kin_email"
                    name="next_of_kin_email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.next_of_kin_email}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-next_of_kin_address" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Address
                  </Label>
                  <Input
                    id="edit-next_of_kin_address"
                    name="next_of_kin_address"
                    placeholder="Enter address"
                    value={formData.next_of_kin_address}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Role & Permissions</div>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    User Role
                  </Label>
                  <Select
                    name="role"
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading roles...
                          </div>
                        </SelectItem>
                      ) : roles.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No roles available
                        </SelectItem>
                      ) : (
                        roles
                          .filter((role) => role.slug === "driver")
                          .map((role) => (
                            <SelectItem key={role.id} value={role.slug}>
                              <div className="flex items-center gap-2">
                                <Badge className={getTypeColor(role.slug)} variant="secondary">
                                  {role.name}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.role}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <ToggleLeft className="w-4 h-4" />
                      Account Status
                    </Label>
                    <p className="text-sm text-gray-500">
                      {formData.is_active ? "Driver can access the system" : "Driver access is disabled"}
                    </p>
                  </div>
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Contract Assignment</div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="edit-contract" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Assigned Contract
                </Label>
                {contractsLoading ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading contracts...</span>
                  </div>
                ) : (
                  <Select
                    name="contract"
                    value={formData.contractId}
                    onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contract (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Contract</SelectItem>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id.toString()}>
                                               <div className="space-y-1">
                          <div className="font-medium">{contract.name}</div>
                          {contract.description && (
                            <div className="text-sm text-gray-500">{contract.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-gray-500">
                Assign a contract to define driver responsibilities and access levels
              </p>
            </div>
          </div>

          {/* Manager Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Manager
            </div>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-manager_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Manager Name
              </Label>
              <Input
                id="edit-manager_name"
                name="manager_name"
                placeholder="Enter manager name"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false)
                setFormErrors({})
                setSelectedDriver(null)
              }}
              disabled={editLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editLoading || rolesLoading}
              className="bg-gradient-to-r from-orange to-magenta hover:from-orange-700 hover:to-magenta-700"
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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