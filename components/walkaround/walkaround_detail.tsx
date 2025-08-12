"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, User, Car, Calendar } from "lucide-react"

// Re-defining Walkaround interface here for clarity within this component,
// but it should ideally be in a shared types file.
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
  status: "pending" | "failed" | "completed" | "custom"
  date: string
  time: string
  milage: number
  defects?: string
  notes?: string
}

interface WalkaroundDetailsDialogProps {
  walkaround: Walkaround | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-500"
    case "pending":
      return "text-yellow-500 bg-yellow-100"
    case "failed":
      return "text-red-500 bg-red-100"
    case "custom":
      return "text-purple-700 bg-purple-100"
    default:
      return "bg-gray-300 text-gray-800"
  }
}

export default function WalkaroundDetailsDialog({ walkaround, open, onOpenChange }: WalkaroundDetailsDialogProps) {
  if (!walkaround) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[500px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Data</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Walkaround Step */}
          <div className="space-y-2">
            <Label htmlFor="walkaround-step" className="text-sm">
              Walkaround Step
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="walkaround-step" value="2" readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Walkaround Duration */}
          <div className="space-y-2">
            <Label htmlFor="walkaround-duration" className="text-sm">
              Walkaround Duration
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="walkaround-duration" value="4 hrs" readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Conducted By */}
          <div className="space-y-2">
            <Label htmlFor="conducted-by" className="text-sm">
              Conducted By
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="conducted-by" value={walkaround.conducted_by || "N/A"} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Driver */}
          <div className="space-y-2">
            <Label htmlFor="driver" className="text-sm">
              Driver
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input
                id="driver"
                value={
                  walkaround.driver.full_name === "None None" ? walkaround.driver.email : walkaround.driver.full_name
                }
                readOnly
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          {/* Walkaround Assignee */}
          <div className="space-y-2">
            <Label htmlFor="walkaround-assignee" className="text-sm">
              Walkaround Assignee
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input
                id="walkaround-assignee"
                value={walkaround.walkaround_assignee || "N/A"}
                readOnly
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          {/* Vehicle */}
          <div className="space-y-2">
            <Label htmlFor="vehicle" className="text-sm">
              Vehicle
            </Label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input
                id="vehicle"
                value={walkaround.vehicle.registration_number}
                readOnly
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm">
              Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="date" value={walkaround.date} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm">
              Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="time" value={walkaround.time} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Milage */}
          <div className="space-y-2">
            <Label htmlFor="milage" className="text-sm">
              Milage
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="milage" value={walkaround.milage.toString()} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Status */}
          <div className="space-y-2 gap-2">
            <Label htmlFor="status" className="text-sm">
              Status
            </Label>
            <Badge className={`px-3 mx-2  py-1 rounded-full text-sm font-medium ${getStatusClasses(walkaround.status)}`}>
              {walkaround.status.charAt(0).toUpperCase() + walkaround.status.slice(1)}
            </Badge>
          </div>
          {/* Defects */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="defects" className="text-sm">
              Defects
            </Label>
            <Textarea
              id="defects"
              value={walkaround.defects || "No defects reported."}
              readOnly
              className="min-h-[80px] text-sm"
            />
          </div>
          {/* Notes */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes" className="text-sm">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={walkaround.notes || "No additional notes."}
              readOnly
              className="min-h-[80px] text-sm"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
