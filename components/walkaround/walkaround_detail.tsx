// components/walkaround/walkaround_detail.tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, User, Car, Calendar } from "lucide-react"

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
      <DialogContent className="sm:max-w-[550px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Walkaround Details</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
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
                value={`${walkaround.vehicle.registration_number} (${walkaround.vehicle.vehicles_type_name})`}
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
          {/* Mileage */}
          <div className="space-y-2">
            <Label htmlFor="milage" className="text-sm">
              Mileage
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input id="milage" value={walkaround.mileage?.toString()} readOnly className="pl-9 h-9 text-sm" />
            </div>
          </div>
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm">
              Status
            </Label>
            <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(walkaround.status)}`}>
              {walkaround.status.charAt(0).toUpperCase() + walkaround.status.slice(1)}
            </Badge>
          </div>
          {/* Parent Walkaround */}
          <div className="space-y-2">
            <Label htmlFor="parent" className="text-sm">
              Parent Walkaround ID
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 z-10" />
              <Input
                id="parent"
                value={walkaround.parent?.toString() || "None"}
                readOnly
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          {/* Signature */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="signature" className="text-sm">
              Signature
            </Label>
            {walkaround.signature ? (
              <img
                src={walkaround.signature}
                alt="Signature"
                className="border rounded-md w-full h-40 object-contain"
              />
            ) : (
              <div className="border rounded-md p-2 text-sm text-gray-500">
                No signature provided.
              </div>
            )}
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