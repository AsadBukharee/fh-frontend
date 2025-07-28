"use client"

import { cn } from "@/lib/utils"
import { PencilLine } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"

import { useCookies } from "next-client-cookies"

interface Shift {
  id: number
  name: string
  template: boolean
  hours_from: string
  hours_to: string
  total_hours: string
  shift_note: string
  rate_per_hours: number
  colors: string
  contract: number | null
  created_at: string
  updated_at: string
}

interface ShiftCardProps {
  shiftType: string
  shift_cell_id: number
  shift_id: number
  color: "purple" | "green" | "orange" | "red" | "cyan"
  user_id: number
  onShiftTypeChange?: (newType: string) => void
  rate: number
  total_hours: string
}

const colorMap = {
  purple: { border: "border-purple-500", bg: "bg-purple-100" },
  green: { border: "border-green-500", bg: "bg-green-100" },
  orange: { border: "border-orange-500", bg: "bg-orange-100" },
  red: { border: "border-red-500", bg: "bg-red-100" },
  cyan: { border: "border-cyan-500", bg: "bg-cyan-100" },
}



export function ShiftCard({ shiftType, shift_cell_id, shift_id, color, user_id, onShiftTypeChange, rate, total_hours }: ShiftCardProps) {
  const colors = colorMap[color] || colorMap.purple // Default to purple if color not found
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shiftTypes, setShiftTypes] = useState<Shift[]>([])
  const cookies=useCookies()

  // Fetch shift types from API
  useEffect(() => {
    const fetchShiftTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/staff/shifts/?user_id=${user_id}`,{
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cookies.get('access_token')}`,
          }
        })
        if (!response.ok) {
          throw new Error("Failed to fetch shift types")
        }
        const data: Shift[] = await response.json()
        setShiftTypes(data)
      } catch (err) {
        console.error("Error fetching shift types:", err)
        setError("Failed to load shift types. Please try again.")
      }
    }

    fetchShiftTypes()
  }, [user_id])

  const handleShiftChange = async (newShiftId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/rota/child-rota/start-rota/${shift_cell_id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get('access_token')}`,
        },
        body: JSON.stringify({ shift: newShiftId }),
      })

      if (!response.ok) {
        throw new Error("Failed to update shift")
      }

      const newShift = shiftTypes.find((shift) => shift.id === newShiftId)
      if (newShift && onShiftTypeChange) {
        onShiftTypeChange(newShift.name)
      }
      console.log(`Shift updated to ID: ${newShiftId}`)
    } catch (err) {
      console.error("Error updating shift:", err)
      setError("Failed to update shift. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col w-[200px] items-start gap-1 rounded-md border-l-4 p-2 text-sm",
        colors.border,
        colors.bg,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="cursor-pointer font-semibold hover:underline">{shiftType}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {shiftTypes.map((type) => (
              <DropdownMenuItem
                key={type.id}
                onClick={() => {
                  if (onShiftTypeChange) {
                    onShiftTypeChange(type.name)
                    console.log(`Shift type changed to: ${type.name}`)
                  }
                }}
              >
                {type.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xs font-medium">£ {rate}</span>
      </div>
      <div className="flex w-full items-center justify-between text-muted-foreground">
        <span className="text-xs">{total_hours}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PencilLine className="h-3 w-3 cursor-pointer text-gray-500 hover:text-gray-700" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {shiftTypes.map((type) => (
              <DropdownMenuItem
                key={type.id}
                onClick={() => handleShiftChange(type.id)}
                disabled={isLoading || type.id === shift_id}
              >
                {type.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}