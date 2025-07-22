"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send } from "lucide-react"
import { User } from "@/app/lib/types"
import { useButtonMouseMove } from "@/app/lib/utils"

interface MessageDialogProps {
  users: User[]
}

export function MessageDialog({ users }: MessageDialogProps) {
  const [selectedUser, setSelectedUser] = useState("")
  const [message, setMessage] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleMouseMove = useButtonMouseMove()

  const handleSendMessage = () => {
    if (selectedUser && message.trim()) {
      console.log(`Sending message to ${selectedUser}: ${message}`)
      setMessage("")
      setSelectedUser("")
      setIsDialogOpen(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          className="relative cursor-pointer bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center"
          onMouseMove={handleMouseMove(buttonRef as React.RefObject<HTMLButtonElement>)}
        >
          <MessageCircle className="w-5 h-5 text-gray-700" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 opacity-50 hover:opacity-100 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            2
          </span>
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
  )
}