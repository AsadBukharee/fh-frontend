"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Edit,
  PencilLine,
  Trash2,
  Search,
 
  Menu,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/app/Context/ToastContext"
import GradientButton from "@/app/utils/GradientButton"

// Define types for better type safety
type Permission = {
  view: boolean
  edit: boolean
  write: boolean
  delete: boolean
}

type UserPermissions = {
  [key: string]: Permission
}

type UserData = {
  id: number
  type: string
  permissions: UserPermissions
}

// Sample user data
const userData: UserData[] = [
  {
    id: 1,
    type: "Admin",
    permissions: {
      site: { view: true, edit: true, write: true, delete: true },
      dashboard: { view: true, edit: true, write: true, delete: true },
    },
  },
  {
    id: 2,
    type: "Editor",
    permissions: {
      site: { view: true, edit: true, write: true, delete: false },
      dashboard: { view: true, edit: false, write: false, delete: false },
    },
  },
  {
    id: 3,
    type: "Viewer",
    permissions: {
      site: { view: true, edit: false, write: false, delete: false },
      dashboard: { view: true, edit: false, write: false, delete: false },
      cars: { view: true, edit: false, write: false, delete: false },
    },
  },
]

// Icons for permissions
const permissionIcons = {
  view: Eye,
  edit: Edit,
  write: PencilLine,
  delete: Trash2,
}

export default function UsersPage() {
  const [data, setData] = useState<UserData[]>(userData)
  const [searchTerm, setSearchTerm] = useState("")
  const [newType, setNewType] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { showToast } = useToast();

  // Available menu options
  const menuOptions = [
    "Dashboard",
    "User Management", 
    "Vehicles",
    "Staff",
    "MOTs & Inspections",
    "Mechanic Jobs",
    "SU Transport Data",
    "Audit Expiry Dates",
    "Knowledge Library",
    "Document List",
    "Outstanding Tasks",
    "Reminders",
    "RBAC"
  ]

  const togglePermission = (id: number, module: string, permission: string) => {
    setData((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [module]: {
                  ...user.permissions[module],
                  [permission]: !(user.permissions[module] as Permission)[permission as keyof Permission],
                },
              },
            }
          : user
      )
    )
  }



  const renderPermissions = (
    userId: number,
    module: string,
    permissions: Record<string, boolean>
  ) => (
    <div className="flex gap-2 justify-center">
      {Object.entries(permissionIcons).map(([permKey, IconComponent]) => {
        const isActive = permissions[permKey]
        return (
          <button
            key={permKey}
            onClick={() => {
              togglePermission(userId, module, permKey)
            }}
            className={`ripple w-6 h-6 rounded-md flex items-center justify-center transition-all ${
              isActive
                ? "border-purple-700 border bg-purple-300 text-purple-700"
                : "bg-gray-200 text-gray-400"
            }`}
            title={permKey}
          >
            <IconComponent size={12} />
          </button>
        )
      })}
    </div>
  )

  const allModules = Array.from(
    new Set(data.flatMap((user) => Object.keys(user.permissions)))
  )

  const filteredData = data.filter((user) =>
    user.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = (selectedMenu?: string) => {
    const userType = selectedMenu || newType.trim()
    if (!userType) return

    const newId = Math.max(...data.map((u) => u.id)) + 1

    const defaultModules = allModules.length
      ? allModules
      : ["site", "dashboard"]

    const defaultPermissions: UserPermissions = defaultModules.reduce((acc, mod) => {
      acc[mod] = { view: false, edit: false, write: false, delete: false }
      return acc
    }, {} as UserPermissions)

    const newUser: UserData = {
      id: newId,
      type: userType,
      permissions: defaultPermissions,
    }

    setData((prev) => [...prev, newUser])
    setNewType("")
    setIsMenuOpen(false)
  }

  const handleSave = () => {
    console.log("🔒 Saved Permissions:", data)
    // alert("Changes saved! (Check console for data)")
    showToast('Changes saved!', 'success')
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      {/* Search bar */}
      <div className="relative w-full sm:w-80 gradient-border cursor-glow sm:mx-0 mx-auto">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users"
          className="pl-10 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto bg-white rounded-md border border-gray-200 gradient-border cursor-glow">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="whitespace-nowrap">Sr No.</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              {allModules.map((module) => (
                <TableHead
                  key={module}
                  className="text-center capitalize whitespace-nowrap"
                >
                  {module} Permissions
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((user) => (
                <TableRow key={user.id} className="border-b border-gray-100">
                  <TableCell className="whitespace-nowrap">{user.id}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge>{user.type}</Badge>
                  </TableCell>
                  {allModules.map((module) => (
                    <TableCell key={module} className="whitespace-nowrap">
                      {renderPermissions(
                        user.id,
                        module,
                        user.permissions[module] || {}
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={2 + allModules.length}
                  className="text-center py-6 text-gray-400"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Save button - positioned right after table */}
      <div className="flex justify-end">
        <GradientButton
          text="Save"
          width="200px"
          onClick={handleSave}
        />
      </div>

      {/* Add New User Type */}
      <div className="mt-6 border border-gray-200 p-4 rounded-md space-y-4 gradient-border cursor-glow">
        <h3 className="text-lg font-semibold">Add New Role</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="Enter user type (e.g. Admin, Editor)"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="sm:w-1/3 w-full bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-md py-2 px-3 focus:outline-none"
          />
          {/* Menu Dialog */}
          <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DialogTrigger asChild>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-all flex items-center gap-2">
                <Menu size={16} />
                Menu
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Select Menu to Add</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {menuOptions.map((menu) => (
                  <button
                    key={menu}
                    onClick={() => handleAddUser(menu)}
                    className="text-left p-3 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    {menu}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <GradientButton
            text="Save"
            width="120px"
            onClick={handleSave}
          />
        </div>
      </div>
    </div>
  )
}
