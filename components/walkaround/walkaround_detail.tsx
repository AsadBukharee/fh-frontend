"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { User, Car, Calendar } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import AddMechanicJobDialog from "../mechhanic-job/AddMechanic"

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
    last_mileage: string | null
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
  onComplete: () => void
}

// Add AddMechanicJobDialog import (make sure to adjust the path based on your project structure)
// import { AddMechanicJobDialog } from "@/components/AddMechanicJobDialog"

const STATUS_CHOICES: Walkaround["status"][] = [
  "completed",
  "failed"
]

// Statuses that require mechanic job creation
const MECHANIC_JOB_STATUSES: Walkaround["status"][] = [
  "minor_roadworthy_defect",
  "minor_unroadworthy_defect",
  "major_unroadworthy_defect",
  "further_work_required"
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
  onComplete,
}: WalkaroundDetailsDialogProps) {
  const [status, setStatus] = useState<Walkaround["status"]>("pending")
  const [note, setNote] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const cookies = useCookies()
  
  // New state for mechanic job dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showMechanicJobDialog, setShowMechanicJobDialog] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{ status: Walkaround["status"]; note: string } | null>(null)

  // Sync with walkaround when dialog opens or data changes
  useEffect(() => {
    if (walkaround?.status) {
      setStatus(walkaround.status)
    }
  }, [walkaround])

  if (!walkaround) return null

  const checkIfDefectStatus = (status: Walkaround["status"]) => {
    return MECHANIC_JOB_STATUSES.includes(status)
  }

  const handleCreateJobChoice = async (createJob: boolean) => {
    setShowConfirmDialog(false)
    
    if (!pendingUpdate) return

    if (createJob) {
      // Show mechanic job dialog
      setShowMechanicJobDialog(true)
    } else {
      // Just update the status without creating a job
      await performStatusUpdate(pendingUpdate.status, pendingUpdate.note)
      setPendingUpdate(null)
    }
  }

  const performStatusUpdate = async (newStatus: Walkaround["status"], newNote: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/walk-around/${walkaround.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ status: newStatus, note: newNote }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast.success("Walkaround status updated successfully.")
      onComplete()
      onOpenChange(false)
    } catch (error) {
      toast.error("Error updating walkaround.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!status) {
      toast.error("Status is required.")
      return
    }
    if (!note.trim()) {
      toast.error("Note is required when updating status.")
      return
    }

    // Check if this status requires a mechanic job
    const requiresMechanicJob = checkIfDefectStatus(status)
    const hasDefects = walkaround.defects && walkaround.defects.trim().length > 0

    if (requiresMechanicJob) {
      // Store the pending update and show confirmation dialog
      setPendingUpdate({ status, note })
      setShowConfirmDialog(true)
    } else {
      // For non-defect statuses, update directly
      await performStatusUpdate(status, note)
    }
  }

  // Create prefilled notes for the mechanic job
  const getPrefilledNotes = () => {
    const defectInfo = walkaround.defects ? `\n\nDefects reported in walkaround:\n${walkaround.defects}` : ''
    const currentNote = note ? `\n\nStatus update note:\n${note}` : ''
    const walkaroundInfo = `Walkaround ID: ${walkaround.id}\nVehicle: ${walkaround.vehicle.registration_number}\nDate: ${walkaround.date}`

    return `${walkaroundInfo}${defectInfo}${currentNote}`
  }

  return (
    <>
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
                <User className="absolute left-3 z-10 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
                <Input value={walkaround.conducted_by || "N/A"} disabled readOnly className="pl-9 h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Driver</Label>
              <div className="relative">
                <User className="absolute left-3 z-10 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
                <Input
                  value={
                    walkaround.driver.full_name === "None None"
                      ? walkaround.driver.email
                      : walkaround.driver.full_name
                  }
                  disabled
                  readOnly
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle</Label>
              <div className="relative">
                <Car className="absolute left-3 z-10 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
                <Input
                  value={`${walkaround.vehicle.registration_number} (${walkaround.vehicle.vehicles_type_name})`}
                  readOnly
                  disabled
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 z-10 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
                <Input value={walkaround.date} disabled readOnly className="pl-9 h-9 text-sm" />
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

          {/* Defects display (if any) */}
          {walkaround.defects && (
            <div className="space-y-2">
              <Label>Reported Defects</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-line">
                {walkaround.defects}
              </div>
            </div>
          )}

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

      {/* Confirmation Dialog for creating mechanic job */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Mechanic Job?</DialogTitle>
            <DialogDescription className="text-base">
              {walkaround?.defects ? "Defects were reported." : "No defects found."}
              <br /><br />
              Would you like to create a job ticket now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCreateJobChoice(false)}>
              No, Thanks
            </Button>
            <Button onClick={() => handleCreateJobChoice(true)}>
              Yes, Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mechanic Job Dialog - Uncomment and adjust based on your actual component */}
      
      <AddMechanicJobDialog
        isOpen={showMechanicJobDialog}
        onOpenChange={setShowMechanicJobDialog}
        onJobAdded={() => {
          setShowMechanicJobDialog(false)
          if (pendingUpdate) {
            performStatusUpdate(pendingUpdate.status, pendingUpdate.note)
          }
          onComplete()
        }}
        defaultVehicleId={walkaround?.vehicle?.id?.toString()}
        defaultNotes={getPrefilledNotes()}
      />
     
    </>
  )
}