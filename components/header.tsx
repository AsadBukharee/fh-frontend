"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Bell, MessageCircle, User, Settings, LogOut, Filter, Download, Plus, Send } from "lucide-react"

interface HeaderProps {
  title: string
  subtitle?: string
  showActions?: boolean
}

const users = [
  { id: 1, name: "Jenny Wilson", role: "Driver", avatar: "JW" },
  { id: 2, name: "David Smith", role: "Manager", avatar: "DS" },
  { id: 3, name: "Sarah Johnson", role: "Supervisor", avatar: "SJ" },
  { id: 4, name: "Mike Brown", role: "Admin", avatar: "MB" },
]

export function Header({ title, subtitle, showActions = false }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [message, setMessage] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const buttonRefs = {
    bell: useRef<HTMLButtonElement>(null),
    chat: useRef<HTMLButtonElement>(null),
    filter: useRef<HTMLButtonElement>(null),
    export: useRef<HTMLButtonElement>(null),
    addUser: useRef<HTMLButtonElement>(null),
  }

  const handleMouseMove = (ref: React.RefObject<HTMLButtonElement>) => (e: React.MouseEvent) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      ref.current.style.setProperty("--mouse-x", `${x}%`)
      ref.current.style.setProperty("--mouse-y", `${y}%`)
    }
  }

  const notifications = [
    {
      id: 1,
      type: "request",
      title: "New user registered",
      message: "Jenny Wilson just signed up",
      time: "2 minutes ago",
    },
    {
      id: 2,
      type: "alert",
      title: "Vehicle inspection due",
      message: "Honda Civic needs inspection",
      time: "1 hour ago",
    },
    { id: 3, type: "warning", title: "Low fuel alert", message: "Vehicle ABC123 has low fuel", time: "2 hours ago" },
    { id: 4, type: "sos", title: "Emergency alert", message: "Driver needs assistance", time: "3 hours ago" },
    { id: 5, type: "request", title: "Task completed", message: "Daily duty log submitted", time: "4 hours ago" },
  ]

  const getFilterColor = (type: string) => {
    switch (type) {
      case "request":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200"
      case "alert":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      case "warning":
        return "bg-orange-100 text-orange-700 hover:bg-orange-200"
      case "sos":
        return "bg-red-100 text-red-700 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return "w-2 h-2 bg-blue-500 rounded-full"
      case "alert":
        return "w-2 h-2 bg-yellow-500 rounded-full"
      case "warning":
        return "w-2 h-2 bg-orange-500 rounded-full"
      case "sos":
        return "w-2 h-2 bg-red-500 rounded-full"
      default:
        return "w-2 h-2 bg-gray-500 rounded-full"
    }
  }

  const filteredNotifications =
    activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter)

  const handleSendMessage = () => {
    if (selectedUser && message.trim()) {
      // Handle message sending logic here
      console.log(`Sending message to ${selectedUser}: ${message}`)
      setMessage("")
      setSelectedUser("")
      setIsDialogOpen(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative gradient-border cursor-glow" onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
            e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
          }}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <Input
              placeholder="Search"
              className="pl-10 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                ref={buttonRefs.bell}
                variant="ghost"
                size="sm"
                className="relative ripple cursor-glow bg-gray-100 hover:bg-gray-200"
                onMouseMove={handleMouseMove(buttonRefs.bell)}
              >
                <Bell className="w-5 h-5 relative z-10" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 bg-white">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Notifications</h3>
                  <Badge variant="secondary">{filteredNotifications.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={activeFilter === "all" ? "default" : "secondary"}
                    className={`cursor-pointer ripple ${activeFilter === "all" ? "bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer ripple ${getFilterColor("request")} ${activeFilter === "request" ? "ring-2 ring-blue-300" : ""}`}
                    onClick={() => setActiveFilter("request")}
                  >
                    Requests
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer ripple ${getFilterColor("alert")} ${activeFilter === "alert" ? "ring-2 ring-yellow-300" : ""}`}
                    onClick={() => setActiveFilter("alert")}
                  >
                    Alerts
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer ripple ${getFilterColor("warning")} ${activeFilter === "warning" ? "ring-2 ring-orange-300" : ""}`}
                    onClick={() => setActiveFilter("warning")}
                  >
                    Warnings
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`cursor-pointer ripple ${getFilterColor("sos")} ${activeFilter === "sos" ? "ring-2 ring-red-300" : ""}`}
                    onClick={() => setActiveFilter("sos")}
                  >
                    SOS
                  </Badge>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-4 border-b">
                    <div className="flex items-start space-x-3">
                      <div className={getNotificationIcon(notification.type) + " mt-2"}></div>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-500">{notification.message}</p>
                        <p className="text-xs text-gray-400">{notification.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                ref={buttonRefs.chat}
                variant="ghost"
                size="sm"
                className="relative ripple cursor-glow bg-gray-100 hover:bg-gray-200"
                onMouseMove={handleMouseMove(buttonRefs.chat)}
              >
                <MessageCircle className="w-5 h-5 relative z-10" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user to message" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({user.role})</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedUser || !message.trim()}
                  className="w-full ripple cursor-glow"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarFallback className="bg-red-600 text-white text-sm">FH</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {showActions && (
          <div className="flex items-center space-x-3">
            <Button
              ref={buttonRefs.filter}
              variant="outline"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200 border-gray-200"
              onMouseMove={handleMouseMove(buttonRefs.filter)}
            >
              <Filter className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">Filter</span>
            </Button>
            <Button
              ref={buttonRefs.export}
              variant="outline"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200 border-gray-200"
              onMouseMove={handleMouseMove(buttonRefs.export)}
            >
              <Download className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">Export</span>
            </Button>
            <Button
              ref={buttonRefs.addUser}
              size="sm"
              className="bg-linear-to-r from-orange-400 via-red-500 to-purple-600 hover:from-orange-500 hover:via-red-600 hover:to-purple-700 text-white ripple cursor-glow"
              onMouseMove={handleMouseMove(buttonRefs.addUser)}
            >
              <Plus className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">Add User</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
