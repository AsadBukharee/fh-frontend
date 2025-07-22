"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
import { NotificationItem } from "./NotificationItem"
import { Notification } from "@/app/lib/types"
import { useButtonMouseMove } from "@/app/lib/utils"

interface NotificationsDropdownProps {
  notifications: Notification[]
}

export function NotificationsDropdown({ notifications }: NotificationsDropdownProps) {
  const [activeFilter, setActiveFilter] = useState("all")
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleMouseMove = useButtonMouseMove()

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

  const filteredNotifications =
    activeFilter === "all" ? notifications : notifications.filter((n) => n.type === activeFilter)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          className="relative cursor-pointer bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center"
          onMouseMove={handleMouseMove(buttonRef)}
        >
          <Bell className="w-5 h-5 text-gray-700" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 opacity-50 hover:opacity-100 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            2
          </span>
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
              className={`cursor-pointer ripple ${
                activeFilter === "all" ? "bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant="secondary"
              className={`cursor-pointer ripple ${getFilterColor("request")} ${
                activeFilter === "request" ? "ring-2 ring-blue-300" : ""
              }`}
              onClick={() => setActiveFilter("request")}
            >
              Requests
            </Badge>
            <Badge
              variant="secondary"
              className={`cursor-pointer ripple ${getFilterColor("alert")} ${
                activeFilter === "alert" ? "ring-2 ring-yellow-300" : ""
              }`}
              onClick={() => setActiveFilter("alert")}
            >
              Alerts
            </Badge>
            <Badge
              variant="secondary"
              className={`cursor-pointer ripple ${getFilterColor("warning")} ${
                activeFilter === "warning" ? "ring-2 ring-orange-300" : ""
              }`}
              onClick={() => setActiveFilter("warning")}
            >
              Warnings
            </Badge>
            <Badge
              variant="secondary"
              className={`cursor-pointer ripple ${getFilterColor("sos")} ${
                activeFilter === "sos" ? "ring-2 ring-red-300" : ""
              }`}
              onClick={() => setActiveFilter("sos")}
            >
              SOS
            </Badge>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}