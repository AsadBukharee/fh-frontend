"use client"

import { cn } from "@/lib/utils"
import { PencilLine } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
    import { shiftTypes } from "../../lib/data" // Assuming shiftTypes is exported from lib/data.ts

interface ShiftCardProps {
  shiftType: string
  code: number
  hoursInfo: string
  color: "purple" | "green" | "orange" | "red" | "cyan"
  onShiftTypeChange?: (newType: string) => void // Add this line
}

const colorMap = {
  purple: { border: "border-purple-500", bg: "bg-purple-100" },
  green: { border: "border-green-500", bg: "bg-green-100" },
  orange: { border: "border-orange-500", bg: "bg-orange-100" },
  red: { border: "border-red-500", bg: "bg-red-100" },
  cyan: { border: "border-cyan-500", bg: "bg-cyan-100" },
}

export function ShiftCard({ shiftType, code, hoursInfo, color, onShiftTypeChange }: ShiftCardProps) {
  const colors = colorMap[color] || colorMap.purple // Default to purple if color not found

  return (
    <div
      className={cn(
        "relative flex flex-col items-start gap-1 rounded-md border-l-4 p-2 text-sm",
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
                key={type.type}
                onClick={() => {
                  if (onShiftTypeChange) {
                    onShiftTypeChange(type.type)
                    console.log(`Shift type changed to: ${type.type}`)
                  }
                }}
              >
                {type.type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xs font-medium">{code}</span>
      </div>
      <div className="flex w-full items-center justify-between text-muted-foreground">
        <span className="text-xs">{hoursInfo}</span>
        <PencilLine className="h-3 w-3 cursor-pointer text-gray-500 hover:text-gray-700" />
      </div>
    </div>
  )
}
