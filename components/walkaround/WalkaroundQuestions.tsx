"use client"

import type React from "react"
import { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Camera, RotateCcw, Check, AlertTriangle, Upload } from "lucide-react"
import ImageUploader from "./UploadImage"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import AddMechanicJobDialog from "../mechhanic-job/AddMechanic"

interface InspectionItem {
  id: number
  question: string
  takePicture: boolean
  note: string
  created_at: string
  updated_at: string
  vehicle_type: number
}

interface Answer {
  question_id: number
  walkaround_id: number
  vehicle: number
  user?: number
  is_defected: boolean
  description?: string
  prove?: string
}

const WalkaroundQuestions: React.FC<{
  vehicleId: number | null
  walkaroundId: number | null
  onComplete: () => void
}> = ({ vehicleId, walkaroundId, onComplete }) => {
  const [inspectionData, setInspectionData] = useState<InspectionItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string }>({})
  const [answers, setAnswers] = useState<{ [key: number]: Answer }>({})
  const [cameraFacing, setCameraFacing] = useState<{ [key: number]: "user" | "environment" }>({})
  const [submitting, setSubmitting] = useState(false)

  // Mechanic job flow
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showMechanicJobDialog, setShowMechanicJobDialog] = useState(false)
  const [hasDefects, setHasDefects] = useState(false)
  const [prefilledNotes, setPrefilledNotes] = useState("")

  const cookies = useCookies()
  const WALKAROUND_ID = walkaroundId
  const VEHICLE_ID = vehicleId

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/walk-around-questions/`, {
          headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
        })
        if (!response.ok) throw new Error("Failed to fetch questions")
        const result = await response.json()
        if (result.success) setInspectionData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleDefectedChange = (itemId: number, checked: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        question_id: itemId,
        walkaround_id: WALKAROUND_ID ?? 0,
        vehicle: VEHICLE_ID ?? 0,
        user: Number(cookies.get("user_id")) || undefined,
        is_defected: checked,
        description: checked ? prev[itemId]?.description || "" : undefined,
        prove: checked ? prev[itemId]?.prove : undefined,
      },
    }))
  }

  const handleDescriptionChange = (itemId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], description: value },
    }))
  }

  const handleUploadSuccess = (itemId: number, url: string) => {
    setImageUrls(prev => ({ ...prev, [itemId]: url }))
    setAnswers(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], prove: url },
    }))
  }

  const toggleCameraFacing = (itemId: number) => {
    setCameraFacing(prev => ({
      ...prev,
      [itemId]: prev[itemId] === "user" ? "environment" : "user",
    }))
  }

  const isQuestionComplete = (item: InspectionItem) => {
    const ans = answers[item.id]
    if (!ans?.is_defected) return true
    const hasDescription = !!ans.description?.trim()
    const hasPhoto = item.takePicture ? !!ans.prove : true
    return hasDescription && hasPhoto
  }

  const completedCount = inspectionData.filter(isQuestionComplete).length

  const generateDefectNotes = () => {
    const defects = inspectionData
      .map(item => {
        const ans = answers[item.id]
        if (ans?.is_defected && ans.description?.trim()) {
          return `• ${item.question}\n  → ${ans.description.trim()}`
        }
        return null
      })
      .filter(Boolean)

    return defects.length > 0
      ? `WALKAROUND DEFECTS REPORTED:\n\n${defects.join("\n\n")}\n\n(Additional notes can be added below)`
      : ""
  }

 const handleSubmitAnswers = async () => {
  // Find incomplete defect items
  const incomplete = inspectionData.filter(q => {
    const ans = answers[q.id]
    if (!ans?.is_defected) return false
    const hasDescription = !!ans.description?.trim()
    const hasPhoto = q.takePicture ? !!ans.prove : true
    return !(hasDescription && hasPhoto)
  })

  if (incomplete.length > 0) {
    setTimeout(() => {
      document.getElementById(`question-${incomplete[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
    alert(`Please complete defect details and photos for ${incomplete.length} item(s).`)
    return
  }

  setSubmitting(true)
  try {
    // Build complete payload: one entry per question
    const payload = inspectionData.map(item => {
      const existingAnswer = answers[item.id]

      return {
        question_id: item.id,
        walkaround_id: WALKAROUND_ID ?? 0,
        vehicle: VEHICLE_ID ?? 0,
        user: Number(cookies.get("user_id")) || undefined,
        is_defected: existingAnswer?.is_defected || false,
        description: existingAnswer?.is_defected ? existingAnswer?.description || "" : null,
        prove: existingAnswer?.is_defected && item.takePicture ? existingAnswer?.prove || null : null,
        answer: existingAnswer?.is_defected ? "Defected" : "OK",
      }
    })

    const response = await fetch(`${API_URL}/api/walk-around-answers/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Submission failed: ${response.status} ${errorText}`)
    }

    // Success: check if any defects
    const defectsFound = payload.some(a => a.is_defected)
    setHasDefects(defectsFound)
    setPrefilledNotes(generateDefectNotes())
    setShowConfirmDialog(true)
  } catch (err) {
    console.error(err)
    setError("Failed to submit answers")
  } finally {
    setSubmitting(false)
  }
}

  const handleCreateJobChoice = (create: boolean) => {
    setShowConfirmDialog(false)
    if (create) {
      setShowMechanicJobDialog(true)
    } else {
      onComplete()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading inspection questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-h-[600px] overflow-y-auto bg-gray-50 py-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Walkaround Check</h1>
            <p className="text-gray-600">Only mark items that have defects. Everything else is considered OK.</p>
            <div className="mt-4 inline-block bg-orange-50 border border-orange-200 rounded-lg px-6 py-3">
              <p className="text-sm font-semibold text-orange-800">
                Progress: {completedCount} / {inspectionData.length} items checked
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {inspectionData.map((item, index) => {
              const isDefected = answers[item.id]?.is_defected || false
              const isComplete = isQuestionComplete(item)

              return (
                <div
                  key={item.id}
                  id={`question-${item.id}`}
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                    isDefected
                      ? "border-orange-400 bg-orange-50"
                      : isComplete
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-orange-100 text-orange-800 text-sm font-bold px-3 py-1 rounded-full">
                          Q{index + 1}
                        </span>
                        {isDefected && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                        {!isDefected && isComplete && <Check className="h-5 w-5 text-green-600" />}
                        {item.takePicture && <Camera className="h-5 w-5 text-gray-600" />}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                      {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
                    </div>
                  </div>

                  {/* Mark as Defected Checkbox */}
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      checked={isDefected}
                      onChange={(e) => handleDefectedChange(item.id, e.target.checked)}
                      className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <label className="text-base font-medium text-gray-800">
                      Mark as Defected
                    </label>
                  </div>

                  {/* Show only when defected */}
                  {isDefected && (
                    <div className="space-y-5 mt-4 pt-4 border-t-2 border-orange-200">
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-2">
                          Defect Description (required)
                        </label>
                        <textarea
                          value={answers[item.id]?.description || ""}
                          onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                          className="w-full border border-orange-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 resize-none"
                          rows={3}
                          placeholder="Describe the issue clearly..."
                        />
                      </div>

                      {item.takePicture && (
                        <div className="bg-orange-50 border border-orange-300 rounded-lg p-5">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-medium text-orange-800 flex items-center gap-2">
                              <Camera className="h-5 w-5" />
                              Photo Required
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCameraFacing(item.id)}
                              className="text-sm bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              {cameraFacing[item.id] === "user" ? "Front" : "Back"} Camera
                            </button>
                          </div>

                          <ImageUploader
                            onUploadSuccess={(url) => handleUploadSuccess(item.id, url)}
                            cameraFacing={cameraFacing[item.id] || "environment"}
                          />

                          {imageUrls[item.id] && (
                            <div className="mt-4 text-center">
                              <Check className="inline h-5 w-5 text-green-600 mr-2" />
                              <span className="text-green-700 font-medium">Photo uploaded!</span>
                              <img src={imageUrls[item.id]} alt="Defect" className="mt-3 mx-auto max-w-full h-64 object-cover rounded-lg shadow" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
              <p className="text-lg font-medium text-gray-700">
                {completedCount === inspectionData.length ? (
                  <span className="text-green-600">All items checked ✓</span>
                ) : (
                  `${completedCount} / ${inspectionData.length} completed`
                )}
              </p>
              <button
                onClick={handleSubmitAnswers}
                disabled={submitting || completedCount !== inspectionData.length}
                className="px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold rounded-lg flex items-center gap-3 transition-all"
              >
                {submitting ? "Submitting..." : <><Upload className="h-5 w-5" /> Submit Walkaround</>}
              </button>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Mechanic Job?</DialogTitle>
              <DialogDescription className="text-base">
                {hasDefects ? "Defects were reported." : "No defects found."}
                <br /><br />
                Would you like to create a job ticket now?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCreateJobChoice(false)}>No, Thanks</Button>
              <Button onClick={() => handleCreateJobChoice(true)}>Yes, Create Job</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AddMechanicJobDialog
          isOpen={showMechanicJobDialog}
          onOpenChange={setShowMechanicJobDialog}
          onJobAdded={() => {
            setShowMechanicJobDialog(false)
            onComplete()
          }}
          defaultVehicleId={VEHICLE_ID?.toString()}
          defaultNotes={prefilledNotes}
        />
      </div>
    </>
  )
}

export default WalkaroundQuestions