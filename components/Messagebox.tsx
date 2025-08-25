"use client"
import { useState } from "react"
import { Button } from "./ui/button"
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react"

// Dummy user list with enhanced data
const users = [
  {
    id: 1,
    name: "John Doe",
    lastMessage: "Hey, how are you?",
    time: "2m ago",
    online: true,
    avatar: "JD",
  },
  {
    id: 2,
    name: "Jane Smith",
    lastMessage: "Are we meeting today?",
    time: "5m ago",
    online: true,
    avatar: "JS",
  },
  {
    id: 3,
    name: "Ali Khan",
    lastMessage: "Send me the file please",
    time: "1h ago",
    online: false,
    avatar: "AK",
  },
]

const Messagebox = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [message, setMessage] = useState("")

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      setMessage("")
    }
  }

  return (
    <div className="z-50">
      {/* Floating Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer z-50 right-6 fixed bottom-6 
                   bg-orange hover:bg-orange/90 w-16 h-16 
                   bg-[#C886B9] hover:bg-magenta  rounded-full flex items-center justify-center"
      >
        <MessageCircle
          size={24}
          className="text-orange-foreground text-white group-hover:scale-110 transition-transform duration-200"
        />
      </Button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed top-0 right-0  h-full w-96 bg-card shadow-2xl border-l border-sidebar-border flex flex-col z-50 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center bg-magenta justify-between px-6 py-4 border-b border-sidebar-border bg-sidebar-orange">
            <div className="flex items-center gap-3 bg-magenta">
              {selectedUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 hover:bg-sidebar-accent/10 text-white rounded-full"
                >
                  <ArrowLeft size={18} className="text-sidebar-foreground text-white" />
                </Button>
              )}
              <h2 className="text-xl text-white font-bold text-sidebar-foreground">
                {selectedUser ? selectedUser.name : "Messages"}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-sidebar-accent/10 rounded-full text-white transition-colors"
            >
              <X size={20} className="text-sidebar-foreground text-white" />
            </Button>
          </div>

          {/* User List */}
          {!selectedUser && (
            <div className="flex-1 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="px-6 py-4 border-b border-sidebar-border hover:bg-muted cursor-pointer
                           transition-all duration-200 hover:translate-x-1 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-orange rounded-full text-white flex items-center justify-center text-orange-foreground font-bold text-sm">
                        {user.avatar}
                      </div>
                      {user.online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full border-2 border-card"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-card-foreground group-hover:text-orange transition-colors">
                          {user.name}
                        </p>
                        <span className="text-xs text-muted-foreground">{user.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">{user.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Box */}
          {selectedUser && (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-sidebar-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center text-orange-foreground font-bold text-sm">
                      {selectedUser.avatar}
                    </div>
                    {selectedUser.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedUser.online ? "Online" : "Last seen 1h ago"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
                <div className="flex justify-start">
                  <div className="bg-card px-4 py-3 rounded-2xl rounded-bl-md max-w-[75%] shadow-sm border border-sidebar-border">
                    <p className="text-card-foreground">Hello there! 👋</p>
                    <span className="text-xs text-muted-foreground mt-1 block">2:30 PM</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-orange px-4 py-3 rounded-2xl rounded-br-md max-w-[75%] shadow-sm">
                    <p className="text-orange-foreground">Hi! How are you doing?</p>
                    <span className="text-xs text-orange-foreground/70 mt-1 block">2:32 PM</span>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-card px-4 py-3 rounded-2xl rounded-bl-md max-w-[75%] shadow-sm border border-sidebar-border">
                    <p className="text-card-foreground">{selectedUser.lastMessage}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">2:35 PM</span>
                  </div>
                </div>
              </div>

              {/* Input Box */}
              <div className="p-4 border-t border-sidebar-border bg-card">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-input border border-border rounded-full px-4 py-3 text-sm 
                             outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                             transition-all duration-200 placeholder:text-muted-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    className="rounded-full w-12 h-12 bg-orange hover:bg-orange/90 
                             transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <Send size={18} className="text-orange-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Messagebox
