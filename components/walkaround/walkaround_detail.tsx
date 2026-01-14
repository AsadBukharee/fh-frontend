"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { User, Car, Calendar } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface Walkaround {
  id: number
  driver: {
    full_name: string
    email: string
  }
  vehicle: {
    id: number
    vehicles_type_name: string
    registration_number: string
  }
  conducted_by: string | null
  walkaround_assignee: string | null
  status:
    | "pending"
    | "completed"
    | "failed"
    | "minor_roadworthy_defect"
    | "minor_unroadworthy_defect"
    | "major_unroadworthy_defect"
    | "in_progress"
    | "further_work_required"
  date: string
  time: string
  mileage: number
  defects?: string
  notes?: string
  signature?: string
  parent?: number | null
}

interface WalkaroundDetailsDialogProps {
  walkaround: Walkaround | null
  open: boolean
  onOpenChange: (open: boolean) => void
  oncomplete: () => void
}

const STATUS_CHOICES: Walkaround["status"][] = [
  "pending",
 
  "minor_roadworthy_defect",
  "minor_unroadworthy_defect",
  "major_unroadworthy_defect",

]

const getStatusClasses = (status: Walkaround["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-500"
    case "pending":
      return "text-yellow-500 bg-yellow-100"
    case "failed":
      return "text-red-500 bg-red-100"
    default:
      return "bg-gray-300 text-gray-800"
  }
}

export default function WalkaroundDetailsDialog({
  walkaround,
  open,
  onOpenChange,
  oncomplete,
}: WalkaroundDetailsDialogProps) {
  const [status, setStatus] = useState<Walkaround["status"]>("pending")
  const [note, setNote] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const cookies = useCookies()

  // Sync with walkaround when dialog opens or data changes
  useEffect(() => {
    if (walkaround?.status) {
      setStatus(walkaround.status)
    }
  }, [walkaround])

  if (!walkaround) return null

  const handleUpdate = async () => {
    if (!status) {
      toast.error("Status is required.")
      return
    }
    if (!note.trim()) {
      toast.error("Note is required when updating status.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/walk-around/${walkaround.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ status, note }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast.success("Walkaround status updated successfully.")
      oncomplete()
      onOpenChange(false)
    } catch (error) {
      toast.error("Error updating walkaround.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Walkaround Details</DialogTitle>
        </DialogHeader>

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Conducted By</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
              <Input value={walkaround.conducted_by || "N/A"} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Driver</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
              <Input
                value={
                  walkaround.driver.full_name === "None None"
                    ? walkaround.driver.email
                    : walkaround.driver.full_name
                }
                readOnly
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vehicle</Label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
              <Input
                value={`${walkaround.vehicle.registration_number} (${walkaround.vehicle.vehicles_type_name})`}
                readOnly
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
              <Input value={walkaround.date} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-2 gap-2 flex items-center">
            <Label>Status</Label>
            <Badge className={`px-3 py-1 w-full wrap-break-word rounded-full text-sm font-medium ${getStatusClasses(status)}`}>
              {status
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </Badge>
          </div>
        </div>

        {/* Editable Section */}
        <div className="space-y-3 mt-4">
          <Label>Change Status</Label>
          <select
            className="border rounded-md w-full p-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as Walkaround["status"])}
          >
            {STATUS_CHOICES.map((s) => (
              <option key={s} value={s}>
                {s
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>

          <Label>Note (required)</Label>
          <Textarea
            placeholder="Add a note about this update"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] text-sm"
          />

          <Button onClick={handleUpdate} disabled={isLoading} className="w-full mt-2">
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
