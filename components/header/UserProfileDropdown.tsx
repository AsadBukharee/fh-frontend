"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/app/Context/ToastContext"
import API_URL from "@/app/utils/ENV"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Globe } from "lucide-react"
import { useCookies } from "next-client-cookies"
import { useRouter } from "next/navigation"

export function UserProfileDropdown() {
  const cookies = useCookies()
  const router = useRouter()
  const { showToast } = useToast()
  const [userData, setUserData] = useState<{ full_name?: string; avatar?: string } | null>(null)

  const userId = cookies.get("user_id")
  const accessToken = cookies.get("access_token")

  useEffect(() => {
    if (!userId || !accessToken) return

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/users/${userId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setUserData(result.data)
          }
        }
      } catch (error) {
        console.error("Error fetching user data for dropdown:", error)
      }
    }

    fetchUserData()
  }, [userId, accessToken])

  const getInitials = (name?: string) => {
    if (!name) return "FH"
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handlesignout = async () => {
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

  const handleGlobals = () => {
    router.push("/dashboard/globals")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-8 h-8 cursor-pointer ring-1 ring-gray-100 hover:ring-orange-200 transition-all">
          <AvatarImage src={userData?.avatar || ""} alt={userData?.full_name} />
          <AvatarFallback className="bg-[#F15A29] text-white text-[10px] font-bold">
            {getInitials(userData?.full_name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white w-56 rounded-xl shadow-xl border-gray-100 p-1.5">
        <DropdownMenuItem 
          onClick={() => router.push(`/dashboard/profile?user_id=${userId}`)} 
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F15A29] cursor-pointer transition-colors"
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F15A29] cursor-pointer transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleGlobals} 
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F15A29] cursor-pointer transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>Globals</span>
        </DropdownMenuItem>
        <div className="my-1 border-t border-gray-100" />
        <DropdownMenuItem 
          onClick={handlesignout} 
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}