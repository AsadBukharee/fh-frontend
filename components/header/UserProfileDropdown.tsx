"use client"

import { useToast } from "@/app/Context/ToastContext"
import API_URL from "@/app/utils/ENV"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import { useCookies } from "next-client-cookies"
import { useRouter } from "next/navigation"

export function UserProfileDropdown() {
  const cookies = useCookies()
  const router = useRouter()
  const {showToast}=useToast()

  const handlesignout = async() => {
    const response = await fetch(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
      },
      body: JSON.stringify({ refresh: cookies.get("refresh_token") }),
    })
    if (!response.ok) {
      showToast('Failed to sign out', 'error')
      return
    }
    cookies.remove("user_id")
    cookies.remove("access_token")
    cookies.remove("role")
    cookies.remove("refresh_token")
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarFallback className="bg-red-600 text-white text-sm">FH</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem className="hover:bg-gray-100">
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-gray-100">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlesignout} className="hover:bg-gray-100">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}