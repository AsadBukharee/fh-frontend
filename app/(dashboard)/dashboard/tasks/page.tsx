'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import ExportButton from '@/app/utils/ExportButton'
import { Search } from 'lucide-react'

const Page = () => {
  const users = [
    { id: 1, name: "Jenny Wilson", role: "Super Admin", taskOwner: true },
    { id: 2, name: "Harry Porter", role: "Admin", taskOwner: true },
    { id: 3, name: "John Wick", role: "Supervisor", taskOwner: true },
    { id: 4, name: "Imran Khan", role: "Super Admin", taskOwner: false },
    { id: 5, name: "Petter David", role: "Super Admin", taskOwner: true },
    { id: 6, name: "Raja Usman", role: "Driver", taskOwner: true },
    { id: 7, name: "Asad Naqvi", role: "CRH", taskOwner: true },
    { id: 8, name: "Hassan Shah", role: "Manager", taskOwner: false },
    { id: 9, name: "Shoaib Khan", role: "DVSA", taskOwner: false },
  ]

  return (
    <div className="container mx-auto p-10 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Task List settings</h2>
          <p className="text-muted-foreground">Manage user permission and access control</p>
        </div>
      
         <ExportButton data={users} fileName="task_list_users" />
     
      </div>
      <div className="mb-4 w-[300px] relative">
           <Search
            className="w-4 h-4 z-10 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 "
            aria-hidden="true"
          />
          <Input
            // ref={inputRef}
            placeholder="Search"
            className="pl-10 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            // value={searchTerm}
            // onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            // onKeyDown={handleKeyDown}
            aria-label="Search menu items"
            autoComplete="off"
          />
      </div>
      <div className=" rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>User Role</TableHead>
              <TableHead>Task List Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={user.taskOwner ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-800"}>
                    {user.taskOwner ? "Yes" : "No"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Row <span className="font-medium">01</span>
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-orange-500 text-white">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <span className="text-muted-foreground">...</span>
          <Button variant="outline" size="sm">
            67
          </Button>
          <Button variant="outline" size="sm">
            68
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Page