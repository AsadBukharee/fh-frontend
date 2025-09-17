'use client'

import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import API_URL from '@/app/utils/ENV'
import { useCookies } from 'next-client-cookies'
import { useParams } from 'next/navigation'

interface Answer {
  id: number
  question_text: string
  question_id: number
  answer: string
  is_defected: boolean
  description: string | null
  date: string
  prove: string | null
  motion_detected: boolean
  user_id: number
  user_name: string
  vehicle_id: number | null
  vehicle_registration: string | null
}

interface WalkaroundData {
  success: boolean
  message: string
  data: {
    walkaround: {
      id: number
      vehicle: {
        id: number
        registration_number: string
        vehicles_type_name: string
        site_allocated: string | null
      }
      conducted_by: {
        id: number
        email: string
        full_name: string
        role: string
        avatar: string | null
      }
      walkaround_assignee: {
        id: number
        email: string
        full_name: string
        role: string
        avatar: string | null
      }
      walkaround_step: number
      date: string
      time: string
      milage: number
      signature: string
      note: string
      defects: string
      walkaround_duration: number | null
      status: string
      created_at: string
      updated_at: string
      parent: number | null
    }
    answers: Answer[]
    total_answers: number
    defected_count: number
    non_defected_count: number
  }
}

const InspectionItem = ({
  title,
  status,
  defaultValue = "pass",
  comments = "",
  answerId,
  onSaveComments,
}: {
  title: string
  status: "Required" | "Completed"
  defaultValue?: string
  comments?: string
  answerId: number
  onSaveComments: (answerId: number, comments: string) => Promise<void>
}) => {
  const [localComments, setLocalComments] = useState(comments)
  const [isSaving, setIsSaving] = useState(false)
  const safeId = title.replace(/[^a-zA-Z0-9-]/g, '-')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveComments(answerId, localComments)
      alert('Comments saved successfully')
    } catch (error) {
      alert('Error saving comments')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Badge variant={status === "Required" ? "destructive" : "secondary"}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-3">Inspection Results</h4>
          <RadioGroup defaultValue={defaultValue} className="flex gap-6" disabled>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pass" id={`${safeId}-pass`} />
              <Label htmlFor={`${safeId}-pass`} className="text-sm">
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Pass
                </Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fail" id={`${safeId}-fail`} />
              <Label htmlFor={`${safeId}-fail`} className="text-sm">
                <Badge variant="destructive">Fail</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="na" id={`${safeId}-na`} />
              <Label htmlFor={`${safeId}-na`} className="text-sm">
                <Badge variant="outline">N/A</Badge>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Comments</h4>
          <Textarea
            placeholder="Add any additional notes or observations"
            className="min-h-[80px] resize-none"
            value={localComments}
          readOnly
          />
          
        </div>
      </CardContent>
    </Card>
  )
}

const VehicleInspectionPage = () => {
  const { id: walkaroundId } = useParams()
  const [walkaroundData, setWalkaroundData] = useState<WalkaroundData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies().get("access_token")

  useEffect(() => {
    if (!cookies) {
      setError("Please log in to view inspection data")
      setIsLoading(false)
      return
    }

    const fetchWalkaroundData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/walk-around/${walkaroundId}/`, {
          headers: {
            Authorization: `Bearer ${cookies}`,
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) throw new Error('Failed to fetch walkaround data')
        const data: WalkaroundData = await response.json()
        if (data.success) {
          setWalkaroundData(data)
          // Check for inconsistency in defects field
          if (data.data.walkaround.defects === "no" && data.data.defected_count > 0) {
            console.warn("Inconsistent defect data: defects field says 'no' but defected_count is non-zero")
          }
        } else {
          setError(data.message || 'Unknown error')
        }
      } catch (error) {
        setError('Error fetching walkaround data')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWalkaroundData()
  }, [walkaroundId, cookies])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getInspectionStatus = (isDefected: boolean): "Required" | "Completed" => {
    return isDefected ? "Required" : "Completed"
  }

  const getDefaultValue = (isDefected: boolean): string => {
    return isDefected ? "fail" : "pass"
  }

  const handleSaveComments = async (answerId: number, comments: string) => {
    if (!cookies) throw new Error("Authentication required")
    const response = await fetch(`${API_URL}/api/answer/${answerId}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cookies}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: comments }),
    })
    if (!response.ok) throw new Error('Failed to save comments')
  }

  // Filter answers for the "Lights & Electrical" section
  const lightAndElectricalQuestions = [
    "Lights - Headlights / Side Lights / Main Beam",
    "Lights - Rear / Reverse / Fog / Brake",
    "Direction / Hazard Indicators",
  ]

  const filteredAnswers = walkaroundData?.data.answers.filter((answer) =>
    lightAndElectricalQuestions.includes(answer.question_text)
  ) || []

  const completedCount = filteredAnswers.filter((answer) => !answer.is_defected).length
  const totalCount = filteredAnswers.length

  if (isLoading) return <div className="p-6 text-center">Loading...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  if (!walkaroundData) return <div className="p-6 text-center">No data available</div>

  return (
    <div className="max-w-full mx-auto p-6 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Vehicle Inspection</h1>
        {/* <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="bg-orange-100 text-orange-800">Over 18+</Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">Supervised</Badge>
          <Badge variant="outline">N/A</Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Admin</Badge>
          <Badge variant="outline">All</Badge>
        </div> */}
      </div>

      

      {/* Lights & Electrical Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Lights & Electrical</h2>
          <span className="text-sm text-muted-foreground">{`${completedCount}/${totalCount} Completed`}</span>
        </div>

        {filteredAnswers.length === 0 ? (
          <p>No questions found for Lights & Electrical</p>
        ) : (
          filteredAnswers.map((answer) => (
            <InspectionItem
              key={answer.id}
              title={answer.question_text}
              status={getInspectionStatus(answer.is_defected)}
              defaultValue={getDefaultValue(answer.is_defected)}
              comments={answer.description || ""}
              answerId={answer.id}
              onSaveComments={handleSaveComments}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default VehicleInspectionPage