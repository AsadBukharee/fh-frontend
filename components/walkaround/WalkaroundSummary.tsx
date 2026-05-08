"use client"

import React, { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SignatureCanvas from "react-signature-canvas"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import AddMechanicJobDialog from "../mechhanic-job/AddMechanic"
import AddMechanicDefectDialog from "../mechhanic-job/AddMechanicDefectDialog"

interface Profile {
  id: number
  full_name: string
  avatar: string | null
  email: string
  sites: { id: number; name: string }[]
}

interface WalkaroundSummaryProps {
  isOpen: boolean
  walkaroundId: number | null
  vehicleId: number | null
  inspectionDataLength: number
  failedCount: number
  passedCount: number
  managers: Profile[]
  prefilledNotes: string
  hasDefects: boolean
  onComplete: (success: boolean, status: string) => void
}

export default function WalkaroundSummary({
  isOpen,
  walkaroundId,
  vehicleId,
  inspectionDataLength,
  failedCount,
  passedCount,
  managers,
  prefilledNotes: initialNotes,
  hasDefects,
  onComplete,
}: WalkaroundSummaryProps) {
  const [walkaroundStatus, setWalkaroundStatus] = useState("completed")
  const [assigneeId, setAssigneeId] = useState("none")
  const [notes, setNotes] = useState(initialNotes)
  const [submitting, setSubmitting] = useState(false)
  const [signatureError, setSignatureError] = useState("")
  const [assigneeError, setAssigneeError] = useState("")
  const sigCanvas = useRef<SignatureCanvas | null>(null)
  const cookies = useCookies()

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showMechanicJobDialog, setShowMechanicJobDialog] = useState(false)
  const [showDefectsDialog, setShowDefectsDialog] = useState(false)
  const [newJobId, setNewJobId] = useState<number | null>(null)

  const handleCreateJobChoice = (create: boolean) => {
    setShowConfirmDialog(false)
    setTimeout(() => {
      if (create) {
        setShowMechanicJobDialog(true)
      } else {
        onComplete(true, walkaroundStatus)
      }
    }, 300)
  }

  const handleFinalSubmit = async () => {
    if (assigneeId === "none") {
      setAssigneeError("Walkaround assignee is required")
      return
    }

    let signatureData = null
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signatureData = sigCanvas.current.getCanvas().toDataURL("image/png")
    } else {
      setSignatureError("Signature is required")
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        status: walkaroundStatus,
        signature: signatureData,
        note: notes || null,
      }
      if (assigneeId !== "none") {
        payload.walkaround_assignee = parseInt(assigneeId, 10)
      }

      const response = await fetch(`${API_URL}/api/walk-around/${walkaroundId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
         const errText = await response.text();
         alert(`Failed to update: ${errText}`);
         throw new Error("Failed to update walkaround details")
      }
      
      setShowConfirmDialog(true)
    } catch (err) {
       console.error("Error updating walkaround:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <Dialog open={isOpen && !showConfirmDialog && !showMechanicJobDialog && !showDefectsDialog} onOpenChange={() => {}} modal>
      <DialogContent className="min-w-[700px] max-h-[85vh] overflow-y-auto w-full rounded-2xl border border-gray-200 p-0">
        <DialogHeader>
          <div className="border-b border-gray-100 px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-gray-900">Walkaround Summary</DialogTitle>
          <DialogDescription className="mt-1 text-gray-500">
            Review your walkaround details and provide an assignee and signature to finalize the process.
          </DialogDescription>
          </div>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Questions</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{inspectionDataLength}</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">Passed</p>
              <p className="mt-1 text-2xl font-semibold text-green-800">
                {passedCount}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">Failed</p>
              <p className="mt-1 text-2xl font-semibold text-red-800">
                {failedCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Walkaround Assignee</Label>
              <Select value={assigneeId} onValueChange={(value) => {
                setAssigneeId(value)
                setAssigneeError("")
              }}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {managers.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assigneeError && <p className="text-sm text-red-500">{assigneeError}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={walkaroundStatus} onValueChange={setWalkaroundStatus}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Defect Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-y p-3"
              placeholder="Additional defect notes..."
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Signature</span>
              <button type="button" onClick={() => sigCanvas.current?.clear()} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                Clear Signature
              </button>
            </Label>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: "h-40 w-full bg-gray-50" }}
              />
            </div>
            {signatureError && <p className="text-red-500 text-sm mt-1">{signatureError}</p>}
          </div>
        </div>
        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button onClick={handleFinalSubmit} disabled={submitting} className="h-11 w-full bg-orange-600 font-semibold text-white hover:bg-orange-700 sm:w-auto">
            {submitting ? "Saving..." : "Submit Walkaround"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="rounded-2xl border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Create Mechanic Job?</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {hasDefects ? "Defects were reported." : "No defects found."}
            <br />
            <br />
            Would you like to create a job ticket now?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button className="h-10" variant="outline" onClick={() => handleCreateJobChoice(false)}>No, Thanks</Button>
          <Button className="h-10 bg-orange-600 hover:bg-orange-700" onClick={() => handleCreateJobChoice(true)}>Yes, Create Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
 
    <AddMechanicJobDialog
      isOpen={showMechanicJobDialog}
      onOpenChange={setShowMechanicJobDialog}
      onJobAdded={(jobId) => {
        setShowMechanicJobDialog(false)
        setNewJobId(jobId)
        setTimeout(() => {
          setShowDefectsDialog(true)
        }, 300)
      }}
      defaultVehicleId={vehicleId?.toString()}
      defaultNotes={notes}
    />

    <AddMechanicDefectDialog
       showDefectsModal={showDefectsDialog}
       setShowJobIdModal={setShowDefectsDialog}
       jobId={newJobId}
       onComplete={() => onComplete(true, walkaroundStatus)}
    />
    </>
  )
}
