
"use client"
import { useRef, useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight, UserPlus, Filter, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AddDriver from "@/components/add-driver/page"
// import Add_driver from "@/components/Add_driver"



const userData = [
  { id: 1, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Driver", status: "Active" },
  { id: 2, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Driver", status: "Active" },
  { id: 3, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Manager", status: "Active" },
  { id: 4, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Admin", status: "Active" },
  { id: 5, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Manager", status: "Active" },
  { id: 6, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Driver", status: "Active" },
  { id: 7, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Manager", status: "Active" },
  { id: 8, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Admin", status: "Pending" },
  { id: 9, name: "Jenny Wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Admin", status: "In-Active" },
]

export default function UsersPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null)

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Driver":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100"
      case "Manager":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      case "Admin":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "User":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 hover:bg-green-100"
      case "Pending":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      case "In-Active":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const handleAddUserClick = (type: string) => {
    console.log("Dropdown item clicked, user type:", type)
    setSelectedUserType(type)
    setIsModalOpen(true)
    console.log("Modal state:", { isModalOpen: true, selectedUserType: type })
  }

  // const handleModalClose = () => {
  //   console.log("Closing modal")
  //   setIsModalOpen(false)
  //   setSelectedUserType(null)
  // }

  // const handleFormSubmit = (e: React.FormEvent) => {
  //   e.preventDefault()
  //   console.log("Form submitted for user type:", selectedUserType)
  //   handleModalClose()
  // }

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
              <span>
                <Filter className="w-4 h-4" />
              </span>
              Filter
            </button>
            <button className="px-4 border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <span>
                <Download className="w-4 h-4" />
              </span>
              Export
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={(el) => {
                    if (el) buttonRefs.current["add-user"] = el
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
                  style={{
                    background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
                    width:  'auto',
                    height: 'auto',
                  }}
                  onMouseMove={handleMouseMove("add-user")}
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </Button>
                {/* <GradientButton text="Add User" Icon={UserPlus} /> */}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="relative border-0 bg-white">
  <div className="absolute inset-[-2px] border-4 border-transparent [border-image:linear-gradient(to_right,_#f85032_0%,_#e73827_20%,_#662D8C_100%)_1] z-[-1] rounded-md"></div>
  <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => handleAddUserClick("User")}>
    User
  </DropdownMenuItem>
  <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => handleAddUserClick("Admin")}>
    Admin
  </DropdownMenuItem>
  <DropdownMenuItem className="cursor-pointer hover:bg-gray-100" onClick={() => handleAddUserClick("Driver")}>
    Driver
  </DropdownMenuItem>
</DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Search Bar (unchanged) */}
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
          />
        </div>
      </div>

      {/* Table (unchanged, omitted for brevity) */}
      <div className="bg-white rounded-md border border-gray-200 gradient-border cursor-glow">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="text-gray-600 font-medium">Sr No.</TableHead>
              <TableHead className="text-gray-600 font-medium">Name</TableHead>
              <TableHead className="text-gray-600 font-medium">Email</TableHead>
              <TableHead className="text-gray-600 font-medium">Phone</TableHead>
              <TableHead className="text-gray-600 font-medium">Type</TableHead>
              <TableHead className="text-gray-600 font-medium">Status</TableHead>
              <TableHead className="text-gray-600 font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userData.map((user) => (
              <TableRow key={user.id} className="border-b border-gray-100">
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-blue-600">{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(user.type)}>{user.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        ref={(el) => {
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
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
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

      {/* Pagination (unchanged, omitted for brevity) */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Row Page</span>
          <Badge variant="outline" className="bg-gray-100">
            01
          </Badge>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            ref={(el) => {
              if (el) buttonRefs.current["prev"] = el
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("prev")}
          >
            <ChevronLeft className="w-4 h-4 mr-1 relative z-10" />
            <span className="relative z-10">Previous</span>
          </Button>
          <Button
            ref={(el) => {
              if (el) buttonRefs.current["page1"] = el
            }}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white ripple cursor-glow"
            onMouseMove={handleMouseMove("page1")}
          >
            <span className="relative z-10">1</span>
          </Button>
          <Button
            ref={(el) => {
              if (el) buttonRefs.current["page2"] = el
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page2")}
          >
            <span className="relative z-10">2</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["page3"] = el
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page3")}
          >
            <span className="relative z-10">3</span>
          </Button>
          <span className="text-gray-400">...</span>
          <Button
            ref={(el) => {
              buttonRefs.current["page67"] = el
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page67")}
          >
            <span className="relative z-10">67</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["page68"] = el
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page68")}
          >
            <span className="relative z-10">68</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["next"] = el
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("next")}
          >
            <span className="relative z-10">Next</span>
            <ChevronRight className="w-4 h-4 ml-1 relative z-10" />
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto z-50 bg-white">
    <DialogHeader>
      <DialogTitle>Add {selectedUserType} User</DialogTitle>
    </DialogHeader>

    {selectedUserType === "User" && (
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="role" className="text-right">
          User Role
        </label>
        <Input id="role" placeholder="Enter role (e.g., Customer, Staff)" className="col-span-3" />
      </div>
    )}
    {selectedUserType === "Admin" && (
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="permissions" className="text-right">
          Permissions
        </label>
        <Input id="permissions" placeholder="Enter permissions (e.g., full-access, read-only)" className="col-span-3" />
      </div>
    )}
    {selectedUserType === "Driver" && <AddDriver />}
  </DialogContent>
</Dialog>
    </div>
  )
}