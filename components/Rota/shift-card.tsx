"use client"

import { cn } from "@/lib/utils"
import { PencilLine } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
  rate: number
  total_hours: string
  shift_list: Shift[]
  onShiftUpdate: () => void
}

const colorMap = {
  purple: { border: "border-purple-500", bg: "bg-purple-100" },
  green: { border: "border-green-500", bg: "bg-green-100" },
  orange: { border: "border-orange-500", bg: "bg-orange-100" },
  red: { border: "border-red-500", bg: "bg-red-100" },
  cyan: { border: "border-cyan-500", bg: "bg-cyan-100" },
}

export function ShiftCard({ shiftType, shift_cell_id, shift_id, color, rate, total_hours, shift_list, onShiftUpdate }: ShiftCardProps) {
  const colors = colorMap[color] || colorMap.purple
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<"salary" | "hours" | null>(null)
  const [newSalary, setNewSalary] = useState<number>(rate)
  const [newHours, setNewHours] = useState<string>(total_hours)
  const cookies = useCookies()

  const handleShiftChange = async (newShiftId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/rota/child-rota/${shift_cell_id}/`, {
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

      const newShift = shift_list.find((shift) => shift.id === newShiftId)
      if (!newShift) {
        throw new Error("Shift not found")
      }
      console.log(`Shift updated to ID: ${newShiftId}`)
      onShiftUpdate()
    } catch (err) {
      console.error("Error updating shift:", err)
      setError("Failed to update shift. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSalaryUpdate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/rota/child-rota/${shift_cell_id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get('access_token')}`,
        },
        body: JSON.stringify({ daily_salary: newSalary }),
      })

      if (!response.ok) {
        throw new Error("Failed to update salary")
      }
      console.log(`Salary updated to: ${newSalary}`)
      onShiftUpdate()
      setEditMode(null)
    } catch (err) {
      console.error("Error updating salary:", err)
      setError("Failed to update salary. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleHoursUpdate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/rota/child-rota/${shift_cell_id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get('access_token')}`,
        },
        body: JSON.stringify({ daily_hours: parseFloat(newHours) }),
      })

      if (!response.ok) {
        throw new Error("Failed to update hours")
      }
      console.log(`Hours updated to: ${newHours}`)
      onShiftUpdate()
      setEditMode(null)
    } catch (err) {
      console.error("Error updating hours:", err)
      setError("Failed to update hours. Please try again.")
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
            {shift_list.map((type) => (
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
        {editMode === "salary" ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={newSalary}
              onChange={(e) => setNewSalary(parseFloat(e.target.value))}
              className="w-16 text-xs"
              disabled={isLoading}
            />
            <Button size="sm" onClick={handleSalaryUpdate} disabled={isLoading}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditMode(null)} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        ) : (
          <span
            className="text-xs font-medium cursor-pointer hover:underline"
            onClick={() => setEditMode("salary")}
          >
            £ {rate}
          </span>
        )}
      </div>
      <div className="flex w-full items-center justify-between text-muted-foreground">
        {editMode === "hours" ? (
          <div className="flex items-center gap-1">
            <Input
              type="text"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
              className="w-16 text-xs"
              disabled={isLoading}
            />
            <Button size="sm" onClick={handleHoursUpdate} disabled={isLoading}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditMode(null)} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        ) : (
          <span
            className="text-xs cursor-pointer hover:underline"
            onClick={() => setEditMode("hours")}
          >
            {total_hours}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <PencilLine className="h-3 w-3 cursor-pointer text-gray-500 hover:text-gray-700" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {shift_list.map((type) => (
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