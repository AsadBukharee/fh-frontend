"use client"
import { useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

const userData = [
  { id: 1, name: "Jenny wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Driver", status: "Active" },
  { id: 2, name: "Jenny wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Driver", status: "Active" },
  {
    id: 3,
    name: "Jenny wilson",
    email: "xyz@gmail.com",
    phone: "+1 (555) 123-4567",
    type: "Manager",
    status: "Active",
  },
  { id: 4, name: "Jenny wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Admin", status: "Active" },
  {
    id: 5,
    name: "Jenny wilson",
    email: "xyz@gmail.com",
    phone: "+1 (555) 123-4567",
    type: "Manager",
    status: "Active",
  },
  { id: 6, name: "Jenny wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Driver", status: "Active" },
  {
    id: 7,
    name: "Jenny wilson",
    email: "xyz@gmail.com",
    phone: "+1 (555) 123-4567",
    type: "Manager",
    status: "Active",
  },
  { id: 8, name: "Jenny wilson", email: "xyz@gmail.com", phone: "+1 (555) 123-4567", type: "Admin", status: "Pending" },
  {
    id: 9,
    name: "Jenny wilson",
    email: "xyz@gmail.com",
    phone: "+1 (555) 123-4567",
    type: "Admin",
    status: "In-Active",
  },
]

export default function UsersPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

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

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-80 gradient-border cursor-glow" onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
          e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
        }}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
          <Input 
            placeholder="Search users" 
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </div>
      </div>

      {/* Data Table */}
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
                        ref={(el) => (buttonRefs.current[`action-${user.id}`] = el)}
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

      {/* Pagination */}
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
            ref={(el) => { if (el) buttonRefs.current["prev"] = el }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("prev")}
          >
            <ChevronLeft className="w-4 h-4 mr-1 relative z-10" />
            <span className="relative z-10">Previous</span>
          </Button>
          <Button
            ref={(el) => { if (el) buttonRefs.current["page1"] = el }}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white ripple cursor-glow"
            onMouseMove={handleMouseMove("page1")}
          >
            <span className="relative z-10">1</span>
          </Button>
          <Button
            ref={(el) => { if (el) buttonRefs.current["page2"] = el }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page2")}
          >
            <span className="relative z-10">2</span>
          </Button>
          <Button
            ref={(el) => (buttonRefs.current["page3"] = el)}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page3")}
          >
            <span className="relative z-10">3</span>
          </Button>
          <span className="text-gray-400">...</span>
          <Button
            ref={(el) => (buttonRefs.current["page67"] = el)}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page67")}
          >
            <span className="relative z-10">67</span>
          </Button>
          <Button
            ref={(el) => (buttonRefs.current["page68"] = el)}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow"
            onMouseMove={handleMouseMove("page68")}
          >
            <span className="relative z-10">68</span>
          </Button>
          <Button
            ref={(el) => (buttonRefs.current["next"] = el)}
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
    </div>
  )
}
