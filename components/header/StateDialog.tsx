"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useButtonMouseMove } from "@/app/lib/utils"
import StatsTab from "./StatsTab"
import { ChartNoAxesCombined } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface WeekReference {
  current_cycle_week: number;
  requested_week_number: number;
  applied_offset_weeks: number;
  start_date: string;
  end_date: string;
}

interface DayStats {
  Total: number;
  D: number;
  S: number;
  E: number;
  M: number;
  N: number;
}

interface StatsResponse {
  week_reference: WeekReference;
  monday: DayStats;
  tuesday: DayStats;
  wednesday: DayStats;
  thursday: DayStats;
  friday: DayStats;
  saturday: DayStats;
  sunday: DayStats;
}

const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

// ✅ Error logic
function isError(key: string, value: number): boolean {
  if (key === "D") return value <= 11;       // Driver error if ≤ 11
  if (key === "S") return value === 0;       // Supervisor error if 0
  if (["E","M","N"].includes(key)) return value === 0 || value > 1; // Shift error if 0 or > 1
  return false;
}

const StateDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleMouseMove = useButtonMouseMove()
  const [errorcount, setErrorCount] = useState(0)
  const token = useCookies().get("access_token")

  // ✅ Fetch API for 4 weeks and count errors
  useEffect(() => {
    const fetchAllWeeks = async () => {
      let totalErrors = 0
      try {
        for (let week = 1; week <= 4; week++) {
          const res = await fetch(`${API_URL}/api/rota/stats/${week}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          if (!res.ok) continue
          const data: StatsResponse = await res.json()

          // Loop through all days & keys
          days.forEach(day => {
            const d = data[day as keyof StatsResponse] as DayStats
            if (!d) return
            Object.keys(d).forEach((key) => {
              if (key !== "Total") {
                const val = d[key as keyof DayStats] as number
                if (isError(key, val)) {
                  totalErrors++
                }
              }
            })
          })
        }
        setErrorCount(totalErrors)
      } catch (err) {
        console.error("Error fetching stats:", err)
      }
    }

    fetchAllWeeks()
  }, [token])

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
          <ChartNoAxesCombined className="w-5 h-5 text-gray-700" />
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:opacity-100 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            {errorcount}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-fit bg-white">
        <DialogHeader>
          <DialogTitle>Weekly Stats</DialogTitle>
        </DialogHeader>
        <StatsTab />
      </DialogContent>
    </Dialog>
  )
}

export default StateDialog
