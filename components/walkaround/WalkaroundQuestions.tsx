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

interface Category {
  id: number
  code: string
  name: string
  description: string
  display_order: number
  is_pre_check: boolean
}

interface FollowUp {
  id: number
  parent_wa_question: number | null
  parent: number | null
  code: string
  category_name: string | null
  text: string
  display_order: number
  severity: string
  tick_all: boolean
  follow_up_instruction: string
  follow_ups: FollowUp[]
}

interface InspectionItem {
  id: number
  question: string
  instruction: string
  question_code: string
  category: Category | null
  category_name: string
  vehicle_types: number[]
  display_order: number
  take_picture_on_pass: boolean
  take_picture_on_fail: boolean
  note: string
  is_pre_check: boolean
  on_fail_blocks_walkaround: boolean
  severity: string
  tick_all: boolean
  follow_up_instruction: string
  follow_ups: FollowUp[]
  created_at: string
  updated_at: string
}

interface Answer {
  question_id: number
  walkaround_id: number
  vehicle: number
  user?: number
  is_defected: boolean
  description?: string
  prove?: string
  follow_up_ids?: number[] // For selected follow-ups
}

interface FollowUpAnswer {
  followup_question: number
  is_ticked: boolean
  severity: string
  follow_up_answers: FollowUpAnswer[]
}

interface WalkaroundAnswer {
  question_id: number
  is_defected: boolean
  answer: "PASS" | "FAIL"
  description: string | null
  prove: string | null
  motion_detected: boolean
  severity: string | null
  follow_up_answers: FollowUpAnswer[]
}

interface WalkaroundSubmissionPayload {
  walkaround_id: number
  driver_vehicle: number
  user: number
  submitted_at: string
  answers: WalkaroundAnswer[]
}

const FollowUpList: React.FC<{
  followUps: FollowUp[]
  questionId: number
  selectedIds: number[]
  parentTickAll: boolean
  onToggle: (id: number, multiSelect: boolean, siblings: number[]) => void
}> = ({ followUps, questionId, selectedIds, parentTickAll, onToggle }) => {
  return (
    <ul className="space-y-3 mt-2">
      {followUps.map((fu) => {
        const isSelected = selectedIds.includes(fu.id)
        const siblings = followUps.map((s) => s.id)
        return (
          <li key={fu.id} className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type={parentTickAll ? "checkbox" : "radio"}
                name={`followup-${fu.parent || fu.parent_wa_question}`}
                checked={isSelected}
                onChange={() => onToggle(fu.id, parentTickAll, siblings)}
                className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className={`text-sm ${isSelected ? "text-orange-900 font-semibold" : "text-gray-700"}`}>
                {fu.text}
              </span>
            </label>
            {isSelected && fu.follow_ups.length > 0 && (
              <div className="ml-7 pl-4 border-l-2 border-orange-100 py-1">
                {fu.follow_up_instruction && (
                  <p className="text-xs font-bold text-orange-800 mb-2">{fu.follow_up_instruction}</p>
                )}
                <FollowUpList
                  followUps={fu.follow_ups}
                  questionId={questionId}
                  selectedIds={selectedIds}
                  parentTickAll={fu.tick_all}
                  onToggle={onToggle}
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const WalkaroundQuestions: React.FC<{
  vehicleId: number | null
  vehicleTypeId: number | null
  walkaroundId: number | null
  onComplete: () => void
}> = ({ vehicleId, vehicleTypeId, walkaroundId, onComplete }) => {
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
        let url = `${API_URL}/api/walk-around-questions/?`
        if (vehicleTypeId) {
          url += `vehicle_types=[${vehicleTypeId}]`
        }
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
        })
        if (!response.ok) throw new Error("Failed to fetch questions")
        const result = await response.json()
        if (result.success) setInspectionData(result.data.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [vehicleTypeId])

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
    const isDefected = ans?.is_defected || false

    const photoRequired = isDefected ? item.take_picture_on_fail : item.take_picture_on_pass
    const hasPhoto = photoRequired ? !!ans?.prove : true
    const hasDescription = isDefected ? !!ans?.description?.trim() : true

    // If defected and has follow-ups, at least one must be selected
    const hasFollowUps = item.follow_ups.length > 0
    const followUpsComplete = isDefected && hasFollowUps ? (ans?.follow_up_ids?.length || 0) > 0 : true

    return hasPhoto && hasDescription && followUpsComplete
  }

  const completedCount = inspectionData.filter(isQuestionComplete).length

  const handleFollowUpToggle = (questionId: number, followUpId: number, multiSelect: boolean, siblings: number[]) => {
    setAnswers((prev) => {
      const ans = prev[questionId] || {
        question_id: questionId,
        walkaround_id: WALKAROUND_ID ?? 0,
        vehicle: VEHICLE_ID ?? 0,
        is_defected: true,
        follow_up_ids: [],
      }
      let newIds = ans.follow_up_ids || []

      if (multiSelect) {
        if (newIds.includes(followUpId)) {
          newIds = newIds.filter((id) => id !== followUpId)
        } else {
          newIds = [...newIds, followUpId]
        }
      } else {
        // Remove siblings and add current
        newIds = newIds.filter((id) => !siblings.includes(id))
        newIds.push(followUpId)
      }

      return { ...prev, [questionId]: { ...ans, follow_up_ids: newIds, is_defected: true } }
    })
  }

  const generateDefectNotes = () => {
    const defects = inspectionData
      .map((item) => {
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

  const buildFollowUpAnswers = (followUps: FollowUp[], selectedIds: number[]): FollowUpAnswer[] => {
    return followUps.map((fu) => ({
      followup_question: fu.id,
      is_ticked: selectedIds.includes(fu.id),
      severity: fu.severity,
      follow_up_answers: buildFollowUpAnswers(fu.follow_ups, selectedIds),
    }))
  }

  const handleSubmitAnswers = async () => {
    // Find incomplete items (either missing mandatory photo or defect details)
    const incomplete = inspectionData.filter((q) => !isQuestionComplete(q))

    if (incomplete.length > 0) {
      setTimeout(() => {
        document.getElementById(`question-${incomplete[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
      alert(`Please complete required details for ${incomplete.length} item(s).`)
      return
    }

    setSubmitting(true)
    try {
      // Build complete payload matching the new requested structure
      const submittedAnswers: WalkaroundAnswer[] = inspectionData.map((item) => {
        const existingAnswer = answers[item.id]
        const isDefected = existingAnswer?.is_defected || false
        const photoRequired = isDefected ? item.take_picture_on_fail : item.take_picture_on_pass
        const selectedFollowUpIds = existingAnswer?.follow_up_ids || []

        return {
          question_id: item.id,
          is_defected: isDefected,
          answer: isDefected ? "FAIL" : "PASS",
          description: isDefected ? existingAnswer?.description || "" : null,
          prove: photoRequired ? existingAnswer?.prove || null : null,
          motion_detected: true, // Defaulting to true as per requirements
          severity: item.severity,
          follow_up_answers: buildFollowUpAnswers(item.follow_ups, selectedFollowUpIds),
        }
      })

      const payload: WalkaroundSubmissionPayload = {
        walkaround_id: WALKAROUND_ID ?? 0,
        driver_vehicle: VEHICLE_ID ?? 0,
        user: Number(cookies.get("user_id")) || 0,
        submitted_at: new Date().toISOString(),
        answers: submittedAnswers,
      }

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
      const defectsFound = payload.answers.some((a: WalkaroundAnswer) => a.is_defected)
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
      <div className="flex flex-col justify-center items-center h-screen max-h-[600px] bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading inspection questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen max-h-[600px] bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              handleSubmitAnswers();
            }}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all"
            disabled={submitting}
          >
            {submitting ? "Retrying..." : "Retry Submission"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-h-[600px] min-w-[650px] overflow-y-auto bg-gray-50 py-6">
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
              const photoRequired = isDefected ? item.take_picture_on_fail : item.take_picture_on_pass

              return (
                <div
                  key={item.id}
                  id={`question-${item.id}`}
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${isDefected ? "border-orange-400 bg-orange-50" : isComplete ? "border-green-300 bg-green-50" : "border-gray-300"
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-orange-100 text-orange-800 text-sm font-bold px-3 py-1 rounded-full">Q{index + 1}</span>
                        {isDefected && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                        {!isDefected && isComplete && <Check className="h-5 w-5 text-green-600" />}
                        {photoRequired && <Camera className="h-5 w-5 text-gray-600" />}
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
                    <label className="text-base font-medium text-gray-800">Mark as Defected</label>
                  </div>

                  {/* Show description only when defected */}
                  {isDefected && (
                    <div className="space-y-5 mt-4 pt-4 border-t-2 border-orange-200">
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-2">Defect Description (required)</label>
                        <textarea
                          value={answers[item.id]?.description || ""}
                          onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                          className="w-full border border-orange-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 resize-none"
                          rows={3}
                          placeholder="Describe the issue clearly..."
                        />
                      </div>

                      {/* Follow-up Questions Section */}
                      {item.follow_ups.length > 0 && (
                        <div className="bg-white border border-orange-200 rounded-lg p-4">
                          <p className="text-sm font-bold text-orange-800 mb-3">
                            {item.follow_up_instruction || "Specific Issues:"}
                            {item.tick_all ? " (Tick all that apply)" : " (Select one)"}
                          </p>
                          <FollowUpList
                            followUps={item.follow_ups}
                            questionId={item.id}
                            selectedIds={answers[item.id]?.follow_up_ids || []}
                            parentTickAll={item.tick_all}
                            onToggle={(fuId: number, multi: boolean, sids: number[]) => handleFollowUpToggle(item.id, fuId, multi, sids)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show photo uploader if required (on pass or fail) */}
                  {photoRequired && (
                    <div className={`mt-4 pt-4 border-t-2 ${isDefected ? "border-orange-200" : "border-gray-200"}`}>
                      <div className="bg-orange-50 bg-opacity-50 border border-orange-100 rounded-lg p-5">
                        <div className="flex justify-between items-center mb-4">
                          <span className={`${isDefected ? "text-orange-800" : "text-gray-700"} font-medium flex items-center gap-2`}>
                            <Camera className="h-5 w-5" />
                            Photo Required {isDefected ? "(Defect Proof)" : "(Check Verification)"}
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
                            <img
                              src={imageUrls[item.id]}
                              alt="Inspection"
                              className="mt-3 mx-auto max-w-full h-64 object-cover rounded-lg shadow"
                            />
                          </div>
                        )}
                      </div>
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