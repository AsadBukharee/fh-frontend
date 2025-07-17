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
  Plus,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/app/Context/ToastContext"
import GradientButton from "@/app/utils/GradientButton"

// Define types
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

// Sample Data
const userData: UserData[] = [
  {
    id: 1,
    type: "Admin",
    permissions: {
      site: { view: true, edit: true, write: true, delete: true },
      dashboard: { view: true, edit: true, write: true, delete: true },
      cars: { view: true, edit: true, write: true, delete: true },
    },
  },
  {
    id: 2,
    type: "Editor",
    permissions: {
      site: { view: true, edit: true, write: true, delete: false },
      dashboard: { view: true, edit: false, write: false, delete: false },
      cars: { view: true, edit: false, write: false, delete: false },
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

// Icons
const permissionIcons = {
  view: Eye,
  edit: Edit,
  write: PencilLine,
  delete: Trash2,
}

export default function UsersPage() {
  const [data, setData] = useState<UserData[]>(userData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const { showToast } = useToast();

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
                  [permission]: !user.permissions[module][permission as keyof Permission],
                },
              },
            }
          : user
      )
    )
  }

  const renderPermissions = (userId: number, module: string, permissions: Record<string, boolean>) => (
    <div className="flex gap-2 justify-center">
      {Object.entries(permissionIcons).map(([permKey, IconComponent]) => {
        const isActive = permissions[permKey]
        return (
          <button
            key={permKey}
            onClick={() => togglePermission(userId, module, permKey)}
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

  const handleSave = () => {
    console.log("🔒 Saved Permissions:", data)
    showToast('Changes saved!', 'success')
  }

  const handleAddUser = () => {
    if (newRoleName.trim() === "") {
      showToast("Please enter a role name!", "error")
      return
    }

    const newUser: UserData = {
      id: data.length + 1,
      type: newRoleName,
      permissions: {
        site: { view: false, edit: false, write: false, delete: false },
        dashboard: { view: false, edit: false, write: false, delete: false },
        cars: { view: false, edit: false, write: false, delete: false },
      },
    }

    setData([...data, newUser])
    setNewRoleName("")
    setIsDialogOpen(false)
    showToast("New role added!", "success")
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      {/* Search bar */}
      <div className="flex justify-between items-center mb-5">
        <div className="relative w-full sm:w-80 gradient-border cursor-glow sm:mx-0 mx-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users"
            className="pl-10 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex justify-end">
          <GradientButton
            text="Add User"
            Icon={Plus}
            width="150px"
            onClick={() => setIsDialogOpen(true)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto bg-white rounded-md border border-gray-200 gradient-border cursor-glow">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead>Sr No.</TableHead>
              <TableHead>Type</TableHead>
              {allModules.map((module) => (
                <TableHead key={module} className="text-center capitalize">{module} Permissions</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell><Badge>{user.type}</Badge></TableCell>
                  {allModules.map((module) => (
                    <TableCell key={module}>
                      {renderPermissions(user.id, module, user.permissions[module] || {})}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2 + allModules.length} className="text-center py-6 text-gray-400">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <GradientButton
          text="Save"
          width="200px"
          onClick={handleSave}
        />
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter Role Name"
            />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
