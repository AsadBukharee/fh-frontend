"use client"

import type React from "react"
import { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Camera, RotateCcw, Check, AlertTriangle, Upload, ChevronDown, ChevronUp } from "lucide-react"
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

// Define interfaces for type safety
interface InspectionItem {
  id: number
  question: string
  takePicture: boolean
  note: string
  created_at: string
  updated_at: string
  vehicle_type: number
}

interface ApiResponse {
  success: boolean
  message: string
  data: InspectionItem[]
}

interface Answer {
  question_id: number
  walkaround_id: number
  vehicle: number
  user?: number
  is_defected: boolean
  answer: string
  description?: string
  prove?: string
  motion_detected?: boolean
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
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [showMechanicDialog, setShowMechanicDialog] = useState(false) // New state for mechanic job dialog
  const cookies = useCookies()

  const API_URL_ = `${API_URL}/api/walk-around-questions/`
  const ANSWER_API_URL = `${API_URL}/api/walk-around-answers/`
  const MECHANIC_JOB_API_URL = `${API_URL}/api/mechanic-jobs/` // Adjust endpoint as needed
  const WALKAROUND_ID = walkaroundId
  const VEHICLE_ID = vehicleId

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(API_URL_, {
          headers: {
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch walkaround questions")
        }
        const result: ApiResponse = await response.json()
        if (result.success) {
          setInspectionData(result.data)
        } else {
          throw new Error(result.message || "API request unsuccessful")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  // Handler for image upload success
  const handleUploadSuccess = (itemId: number, url: string) => {
    setImageUrls((prev) => ({
      ...prev,
      [itemId]: url,
    }))
    setAnswers((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        question_id: itemId,
        walkaround_id: WALKAROUND_ID ?? 0,
        vehicle: VEHICLE_ID ?? 0,
        user: Number(cookies.get("user_id")) || undefined,
        prove: url,
      },
    }))
  }

  // Handler for answer input changes
  const handleAnswerChange = (itemId: number, field: keyof Answer, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        question_id: itemId,
        walkaround_id: WALKAROUND_ID ?? 0,
        vehicle: VEHICLE_ID ?? 0,
        user: Number(cookies.get("user_id")) || undefined,
        [field]: value,
        motion_detected:
          field === "is_defected" && value && prev[itemId]?.description ? true : prev[itemId]?.motion_detected,
      },
    }))
  }

  // Handler to create a mechanic job
  const createMechanicJob = async () => {
    try {
      // Aggregate defect descriptions from answers
      const defectDescriptions = Object.values(answers)
        .filter((answer) => answer.is_defected && answer.description)
        .map((answer) => answer.description)
        .join("; ")

      const payload = {
        walkaround_id: WALKAROUND_ID,
        vehicle_id: VEHICLE_ID,
        description: defectDescriptions || "Mechanic job created from walkaround inspection",
        status: "pending",
        // Add other fields as needed (e.g., priority, assigned_mechanic)
      }

      const response = await fetch(MECHANIC_JOB_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to create mechanic job")
      }

      const result = await response.json()
      console.log("Mechanic job created:", result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the mechanic job")
    }
  }

  // Handler for mechanic dialog response
  const handleMechanicDialogResponse = async (createJob: boolean) => {
    if (createJob) {
      await createMechanicJob()
    }
    setShowMechanicDialog(false)
    onComplete() // Proceed to completion
    setAnswers({})
    setImageUrls({})
  }

  // Handler to submit answers to the API
  const handleSubmitAnswers = async () => {
    const payload = Object.values(answers).filter((answer) => answer.answer)
    if (payload.length === 0) {
      alert("No answers provided to submit.")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(ANSWER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to submit answers")
      }

      const result = await response.json()
      if (result.success) {
        alert("Answers submitted successfully!")
        setSubmitting(false)
        setShowMechanicDialog(true) // Show mechanic job dialog instead of calling onComplete
      } else {
        throw new Error(result.message || "Submission failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during submission")
      setSubmitting(false)
    }
  }

  const toggleCameraFacing = (itemId: number) => {
    setCameraFacing((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === "user" ? "environment" : "user",
    }))
  }

  const toggleExpanded = (itemId: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
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
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-h-[500px] overflow-y-auto bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Inspection</h1>
          <p className="text-gray-600">
            Complete the walkaround inspection by answering questions and taking photos where required.
          </p>
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Progress:</strong> {Object.keys(answers).length} of {inspectionData.length} questions answered
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {inspectionData.map((item, index) => {
            const isExpanded = expandedItems[item.id] ?? true
            const hasAnswer = answers[item.id]?.answer
            const isDefected = answers[item.id]?.is_defected
            const hasImage = imageUrls[item.id]

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
                  hasAnswer ? "border-green-200 bg-green-50/30" : "border-gray-200"
                } ${isDefected ? "border-orange-200 bg-orange-50/30" : ""}`}
              >
                <div className="p-6 cursor-pointer" onClick={() => toggleExpanded(item.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full">
                          Q{index + 1}
                        </span>
                        {hasAnswer && <Check className="h-5 w-5 text-green-500" />}
                        {isDefected && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                        {item.takePicture && <Camera className="h-5 w-5 text-orange-500" />}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                      {item.note && <p className="text-gray-600 text-sm">{item.note}</p>}
                    </div>
                    <button className="ml-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer *</label>
                      <textarea
                        value={answers[item.id]?.answer || ""}
                        onChange={(e) => handleAnswerChange(item.id, "answer", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                        rows={3}
                        placeholder="Enter your inspection findings..."
                      />
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={answers[item.id]?.is_defected || false}
                        onChange={(e) => handleAnswerChange(item.id, "is_defected", e.target.checked)}
                        className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mark as Defected</label>
                        <p className="text-xs text-gray-500 mt-1">Check this if you found any issues or defects</p>
                      </div>
                    </div>

                    {answers[item.id]?.is_defected && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-orange-800 mb-2">Defect Description *</label>
                        <textarea
                          value={answers[item.id]?.description || ""}
                          onChange={(e) => handleAnswerChange(item.id, "description", e.target.value)}
                          className="w-full border border-orange-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none bg-white"
                          rows={3}
                          placeholder="Describe the defect in detail..."
                        />
                      </div>
                    )}

                    {item.takePicture && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-orange-600" />
                            <label className="text-sm font-medium text-orange-800">Photo Required</label>
                          </div>
                          <button
                            onClick={() => toggleCameraFacing(item.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium rounded-lg transition-colors"
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
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <p className="text-sm text-green-700 font-medium">Photo uploaded successfully!</p>
                            </div>
                            <img
                              src={imageUrls[item.id] || "/placeholder.svg"}
                              alt="Inspection photo"
                              className="w-full max-w-sm rounded-lg border border-gray-200 shadow-sm"
                            />
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

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Submit?</h3>
              <p className="text-gray-600 text-sm mt-1">
                {Object.keys(answers).length} of {inspectionData.length} questions answered
              </p>
            </div>
            <button
              onClick={handleSubmitAnswers}
              disabled={submitting || Object.keys(answers).length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Submit Inspection
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mechanic Job Dialog */}
      <Dialog open={showMechanicDialog} onOpenChange={setShowMechanicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Mechanic Job</DialogTitle>
            <DialogDescription>
              Do you want to create a mechanic job for this walkaround inspection?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleMechanicDialogResponse(false)}
            >
              No
            </Button>
            <Button onClick={() => handleMechanicDialogResponse(true)}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WalkaroundQuestions