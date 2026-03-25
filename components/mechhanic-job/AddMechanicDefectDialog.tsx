"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"
import { Card, CardContent } from "../ui/card"
import { Trash2, Plus, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { resetWalkaroundState } from "@/app/store/slices/walkaroundSlice"

interface Defect {
  priority: string
  defect_text: string
  color: string
}

interface AddDefectsFormDialogProps {
  showDefectsModal: boolean
  jobId: number | null
  setShowJobIdModal: React.Dispatch<React.SetStateAction<boolean>>
  onComplete?: () => void
}

const PRIORITY_CHOICES = [
  { value: "high", label: "High", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "low", label: "Low", color: "bg-green-100 text-green-800 border-green-200" },
]

const AddMechanicDefectDialog = ({ showDefectsModal, jobId, setShowJobIdModal, onComplete }: AddDefectsFormDialogProps) => {
  const [defects, setDefects] = useState<Defect[]>([{ priority: "medium", defect_text: "", color: "#ef4444" }])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(showDefectsModal) // Local state to control dialog
  const token = useCookies().get("access_token") || ""
  const dispatch = useDispatch()
  const walkaroundDefects = useSelector((state: RootState) => state.walkaround.walkaroundDefects)

useEffect(() => {
    setIsOpen(showDefectsModal)
    // When the dialog opens, if we have walkaround defects, populate the form
    if (showDefectsModal && walkaroundDefects.length > 0) {
      setDefects(walkaroundDefects)
    } else if (showDefectsModal && defects.length === 0) {
      // Default initial row for manual defects
      setDefects([{ priority: "medium", defect_text: "", color: "#ef4444" }])
    }
  }, [showDefectsModal, walkaroundDefects])

  const addDefect = () => {
    setDefects([...defects, { priority: "medium", defect_text: "", color: "#ef4444" }])
  }

  const removeDefect = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index))
  }

  const updateDefect = (index: number, field: keyof Defect, value: string) => {
    const newDefects = [...defects]
    newDefects[index] = { ...newDefects[index], [field]: value }
    setDefects(newDefects)
  }

  const getPriorityStyle = (priority: string) => {
    return PRIORITY_CHOICES.find((p) => p.value === priority)?.color || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const handleSubmit = async () => {
    if (!jobId) {
      setError("No job ID provided.")
      return
    }

    for (const [index, defect] of defects.entries()) {
      if (!defect.defect_text.trim()) {
        setError(`Defect #${index + 1}: Description is required.`)
        return
      }
      if (defect.defect_text.trim().length < 10) {
        setError(`Defect #${index + 1}: Description must be at least 10 characters.`)
        return
      }
      if (!PRIORITY_CHOICES.map((p) => p.value).includes(defect.priority)) {
        setError(`Defect #${index + 1}: Invalid priority selected.`)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      // Send each defect as a separate POST request
      for (const defect of defects) {
        const payload = {
          mechanic_job: jobId,
          priority: defect.priority,
          defect_text: defect.defect_text,
          color: defect.color,
        }

        const response = await fetch(`${API_URL}/activity/mechanic-defect/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Failed to add defect: ${response.statusText}`)
        }
      }

      // Only close dialog on success
      setIsOpen(false)
      setShowJobIdModal(false)
      setDefects([{ priority: "medium", defect_text: "", color: "#ef4444" }]) // Reset form
      if (onComplete) onComplete()
    } catch (err) {
      setError("Failed to add defects. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false)
      setShowJobIdModal(false)
      setError(null)
      // Clear Redux state when closing/finishing the flow
      dispatch(resetWalkaroundState())
      if (onComplete) onComplete()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-4xl h-[500px] overflow-y-auto">
        <AlertDialogHeader className="pb-4">
          <AlertDialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Add Defects for Job #{jobId}
          </AlertDialogTitle>
          <p className="text-sm text-muted-foreground">
            Document defects found during inspection. Each defect will be tracked and prioritized.
          </p>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto  px-1">
          <div className="space-y-4">
            {defects.map((defect, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Defect #{index + 1}</span>
                      <Badge variant="outline" className={getPriorityStyle(defect.priority)}>
                        {PRIORITY_CHOICES.find((p) => p.value === defect.priority)?.label} Priority
                      </Badge>
                    </div>
                    {defects.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDefect(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3">
                      <Label htmlFor={`priority-${index}`} className="text-sm font-medium">
                        Priority Level
                      </Label>
                      <Select value={defect.priority} onValueChange={(value) => updateDefect(index, "priority", value)}>
                        <SelectTrigger id={`priority-${index}`} className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_CHOICES.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    priority.value === "high"
                                      ? "bg-red-500"
                                      : priority.value === "medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                />
                                {priority.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-7">
                      <Label htmlFor={`defect_text-${index}`} className="text-sm font-medium">
                        Defect Description
                      </Label>
                      <Textarea
                        id={`defect_text-${index}`}
                        value={defect.defect_text}
                        onChange={(e) => updateDefect(index, "defect_text", e.target.value)}
                        placeholder="Describe the defect in detail (minimum 10 characters)..."
                        className="mt-1 min-h-[80px] resize-none"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{defect.defect_text.length}/500 characters</p>
                    </div>

                    <div className="lg:col-span-2">
                      <Label htmlFor={`color-${index}`} className="text-sm font-medium">
                        Tag Color
                      </Label>
                      <div className="mt-1 space-y-2">
                        <Input
                          id={`color-${index}`}
                          type="color"
                          value={defect.color}
                          onChange={(e) => updateDefect(index, "color", e.target.value)}
                          className="h-10 w-full cursor-pointer"
                        />
                        <div
                          className="w-full h-6 rounded border-2 border-gray-200"
                          style={{ backgroundColor: defect.color }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={addDefect}
              className="w-full border-dashed border-2 h-12 hover:bg-gray-50 bg-transparent"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Defect
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <AlertDialogFooter className="pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {defects.length} defect{defects.length !== 1 ? "s" : ""} to submit
            </p>
            <div className="flex gap-2">
              <AlertDialogAction onClick={handleClose} disabled={loading}>
                Cancel
              </AlertDialogAction>
              <Button
                onClick={handleSubmit}
                className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                disabled={loading || defects.some((d) => !d.defect_text.trim())}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Submit ${defects.length} Defect${defects.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AddMechanicDefectDialog