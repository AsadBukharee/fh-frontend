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
  AlertDialogFooter,
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
  UserPlus,
  Filter,
  Download,
  Loader2,
  Save,
  X,
  Mail,
  ToggleLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"

interface User {
  id: number
  email: string
  full_name: string
  display_name: string
  parent_rota_completed: boolean
  child_rota_completed: boolean
  is_active: boolean
  contract: { id: number; name: string; description: string } | null
  role: string
  site: null
 shifts_count: number
  avatar?: string
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

interface EditUserForm {
  email: string
  full_name: string
  role: string
  contractId: string
  is_active: boolean
}

export default function UsersPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [contractsLoading, setContractsLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const perPage = 10
  const { showToast } = useToast()
  const [formData, setFormData] = useState<EditUserForm>({
    email: "",
    full_name: "",
    role: "",
    contractId: "",
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState<Partial<EditUserForm>>({})

  const cookies = useCookies()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const url = `${API_URL}/users/?page=${currentPage}&per_page=${perPage}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`
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
        setUsers(data.data)
        setTotalPages(data.total_pages || 1)
        setError(null)
      } else {
        setError(data.message || "Failed to fetch users")
        showToast(data.message || "Failed to fetch users", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching users"
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
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

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
      case "admin":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "manager":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      case "supervisor":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100"
      case "superadmin":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "shahwar":
        return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
      case "accounts":
        return "bg-green-100 text-green-700 hover:bg-green-100"
      case "crh":
        return "bg-teal-100 text-teal-700 hover:bg-teal-100"
      case "dvsa":
        return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100"
      case "mechanic":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
      case "driver":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
  }

  const handleAddUserClick = (type: string) => {
    setSelectedUserType(type)
    setIsModalOpen(true)
  }

  const handleEditUserClick = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      contractId: user.contract?.id.toString() || "none",
      is_active: user.is_active,
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleDeleteUserClick = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const validateForm = (): boolean => {
    const errors: Partial<EditUserForm> = {}

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required"
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters"
    }

    if (!formData.role) {
      errors.role = "Role is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormChange = (field: keyof EditUserForm, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newUser = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role: formData.get("role") as string,
      contract: formData.get("contract") as string,
    }

    if (!newUser.email || !newUser.full_name || !newUser.role) {
      showToast("Please fill in all required fields", "error")
      return
    }

    setEditLoading(true)

    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(newUser),
      })

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }

      const data = await response.json()

      if (data.success) {
        showToast(data.message || "User created successfully", "success")
        setIsModalOpen(false)
        await fetchUsers()
      } else {
        showToast(data.message || "Failed to create user", "error")
      }
    } catch (err) {
      console.log(err)
      showToast("An error occurred while creating the user", "error")
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser || !validateForm()) return

    setEditLoading(true)

    try {
      const userResponse = await fetch(`${API_URL}/users/${selectedUser.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
        }),
      })

      if (userResponse.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        return
      }

      const userData = await userResponse.json()
      if (!userData.success) {
        showToast(userData.message || "Failed to update user details", "error")
        return
      }

      showToast(userData.message || "User details updated successfully", "success")

      if (formData.contractId && formData.contractId !== "none") {
        const contractResponse = await fetch(`${API_URL}/users/${selectedUser.id}/assign-contract/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({ contract_id: Number.parseInt(formData.contractId) }),
        })
        if (contractResponse.status === 401) {
          showToast("Session expired. Please log in again.", "error")
          return
        }
        await contractResponse.json()
      }

      showToast("User updated successfully", "success")
      setIsEditModalOpen(false)
      setSelectedUser(null)
      await fetchUsers()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "An error occurred while updating the user", "error")
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`${API_URL}/users/${userToDelete.id}/`, {
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
        showToast(data.message || `${userToDelete.full_name} has been deleted successfully`, "success")
        await fetchUsers()
      } else {
        showToast(data.message || "Failed to delete user", "error")
      }
    } catch {
      showToast("An error occurred while deleting the user", "error")
    } finally {
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage your team members and their permissions</p>
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
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={(el: HTMLButtonElement | null) => {
                    buttonRefs.current["add-user"] = el
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
                  style={{
                    background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                  }}
                  onMouseMove={handleMouseMove("add-user")}
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="relative border-0 bg-white">
                <div className="absolute inset-[-2px] border-4 border-transparent [border-image:linear-gradient(to_right,_#f85032_0%,_#e73827_20%,_#662D8C_100%)_1] z-[-1] rounded-md"></div>
                {rolesLoading ? (
                  <DropdownMenuItem disabled>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading roles...
                  </DropdownMenuItem>
                ) : roles.length === 0 ? (
                  <DropdownMenuItem disabled>No roles available</DropdownMenuItem>
                ) : (
                  roles.map((role) => (
                    <DropdownMenuItem
                      key={role.id}
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleAddUserClick(role.name)}
                    >
                      {role.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
            placeholder="Search users"
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading users...</span>
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
                <TableHead className="text-gray-600 font-medium">Role</TableHead>
                <TableHead className="text-gray-600 font-medium">Contract</TableHead>
                <TableHead className="text-gray-600 font-medium">Shifts</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                <TableHead className="text-gray-600 font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-b border-gray-100">
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell className="text-blue-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(user.role)}>
                      {roles.find((role) => role.slug === user.role)?.name || user.role || "None"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span>
                      {user.contract ? (
                        <Badge className="bg-green-100 text-green-500">{user.contract.name}</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-600">No Contract</Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge  className=" bg-orange-100 text-orange-600 border border-orange-600">{user.shifts_count|| 0} shifts</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.is_active)}>{user.is_active ? "Active" : "In-Active"}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          ref={(el: HTMLButtonElement | null) => {
                            buttonRefs.current[`action-${user.id}`] = el
                          }}
                          variant="ghost"
                          size="sm"
                          className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
                          onMouseMove={handleMouseMove(`action-${user.id}`)}
                        >
                          <MoreHorizontal className="w-4 h-4 relative z-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white">
                        
                        <DropdownMenuItem onClick={() => handleEditUserClick(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUserClick(user)}>
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

      {/* Add User Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto z-50 bg-white">
          <DialogHeader>
            <DialogTitle>Add {selectedUserType} User</DialogTitle>
            <DialogDescription>Create a new user account with the specified role and permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-email" className="text-right">
                Email *
              </Label>
              <Input
                id="add-email"
                name="email"
                type="email"
                placeholder="Enter email"
                className="col-span-3"
                required
              />

              <Label htmlFor="add-full_name" className="text-right">
                Full Name *
              </Label>
              <Input
                id="add-full_name"
                name="full_name"
                placeholder="Enter full name"
                className="col-span-3"
                required
              />

              <Label htmlFor="add-role" className="text-right">
                Role *
              </Label>
              <Select name="role" required defaultValue={roles.find((role) => role.name === selectedUserType)?.slug || ""}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={`Select role (default: ${selectedUserType})`} />
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
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.slug}>
                        <Badge className={getTypeColor(role.slug)} variant="secondary">
                          {role.name}
                        </Badge>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Label htmlFor="add-contract" className="text-right">
                Contract
              </Label>
              <Select name="contract">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select contract (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Contract</SelectItem>
                  {contractsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading contracts...
                      </div>
                    </SelectItem>
                  ) : (
                    contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        {contract.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={editLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading || rolesLoading}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit User Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5" />
              Edit User Details
            </DialogTitle>
            <DialogDescription>
              Update user information and permissions. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUserSubmit} className="space-y-6">
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
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
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
                  <Label htmlFor="edit-full_name">Full Name</Label>
                  <Input
                    id="edit-full_name"
                    value={formData.full_name}
                    onChange={(e) => handleFormChange("full_name", e.target.value)}
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
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Role & Permissions</div>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">User Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleFormChange("role", value)}>
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
                        roles.map((role) => (
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
                      {formData.is_active ? "User can access the system" : "User access is disabled"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleFormChange("is_active", checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">Contract Assignment</div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="edit-contract">Assigned Contract</Label>
                {contractsLoading ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading contracts...</span>
                  </div>
                ) : (
                  <Select value={formData.contractId} onValueChange={(value) => handleFormChange("contractId", value)}>
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
                  Assign a contract to define user responsibilities and access levels
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setFormErrors({})
                }}
                disabled={editLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading || rolesLoading}
                className="bg-gradient-to-r from-orange-500 to-magenta hover:from-orange-700 hover:to-purple-700"
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.full_name}</strong>? This action cannot be undone
              and will permanently remove the user from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}