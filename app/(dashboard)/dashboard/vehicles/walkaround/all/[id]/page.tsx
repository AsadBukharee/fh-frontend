'use client'

import { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, Car, User, MapPin, Gauge } from 'lucide-react'
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
        last_mileage: string
        site_allocated: {
          id: number
          name: string
          status: string
          image: string
        }
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
      } | null
      walkaround_step: number
      date: string
      time: string
      mileage: number | null
      signature: string | null
      note: string | null
      defects: string | null
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
    <Card className="mb-6 border-gray-500/20 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4 bg-gradient-to-r from-orange-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
          <Badge 
            variant={status === "Required" ? "destructive" : "secondary"} 
            className={status === "Required" ? "bg-rose-500 text-white" : "bg-orange-500 text-white"}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Inspection Results</h4>
          <RadioGroup defaultValue={defaultValue} className="flex gap-6" disabled>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pass" id={`${safeId}-pass`} />
              <Label htmlFor={`${safeId}-pass`} className="text-sm">
                <Badge 
                  variant="secondary" 
                  className="bg-orange-500/20 text-orange-800 hover:bg-orange-500/30"
                >
                  Pass
                </Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fail" id={`${safeId}-fail`} />
              <Label htmlFor={`${safeId}-fail`} className="text-sm">
                <Badge variant="destructive" className="bg-rose-500 text-white">Fail</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="na" id={`${safeId}-na`} />
              <Label htmlFor={`${safeId}-na`} className="text-sm">
                <Badge variant="outline" className="border-gray-500 text-gray-700">N/A</Badge>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
          <Textarea
            placeholder="Add any additional notes or observations"
            className="min-h-[80px] resize-none border-gray-500/30 focus:ring-orange-500"
            value={localComments}
            onChange={(e) => setLocalComments(e.target.value)}
            readOnly={isSaving}
          />
          <Button 
            className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Comments'}
          </Button>
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
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-700 text-lg animate-pulse">Loading...</div>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-rose-500 text-lg">{error}</div>
    </div>
  )
  if (!walkaroundData) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-700 text-lg">No data available</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-r-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Vehicle Inspection</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-orange-500 text-orange-500">ID: {walkaroundData.data.walkaround.id}</Badge>
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            {walkaroundData.data.walkaround.status.charAt(0).toUpperCase() + walkaroundData.data.walkaround.status.slice(1)}
          </Badge>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        {filteredAnswers.length === 0 ? (
          <Card className="border-gray-500/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500/50 to-rose-500/50">
              <CardTitle className="text-2xl font-semibold text-gray-800">Walkaround Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Car className="h-5 w-5 text-orange-500" /> Vehicle Information
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Registration:</span> 
                      {walkaroundData.data.walkaround.vehicle.registration_number}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Type:</span> 
                      {walkaroundData.data.walkaround.vehicle.vehicles_type_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Last Mileage:</span> 
                      {walkaroundData.data.walkaround.vehicle.last_mileage}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Site:</span> 
                      {walkaroundData.data.walkaround.vehicle.site_allocated.name} 
                      <Badge variant="outline" className="ml-2 border-gray-500 text-gray-500">
                        {walkaroundData.data.walkaround.vehicle.site_allocated.status}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-500" /> Conducted By
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Name:</span> 
                      {walkaroundData.data.walkaround.conducted_by.full_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Role:</span> 
                      {walkaroundData.data.walkaround.conducted_by.role}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Email:</span> 
                      {walkaroundData.data.walkaround.conducted_by.email}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-500/20" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" /> Inspection Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-rose-500" />
                    <span className="font-medium">Date:</span> 
                    {formatDate(walkaroundData.data.walkaround.date)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rose-500" />
                    <span className="font-medium">Time:</span> 
                    {walkaroundData.data.walkaround.time.split('.')[0]}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Step:</span> 
                    {walkaroundData.data.walkaround.walkaround_step}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Status:</span> 
                    <Badge 
                      variant="outline" 
                      className={walkaroundData.data.walkaround.status === 'pending' 
                        ? "border-rose-500 text-rose-500" 
                        : "border-orange-500 text-orange-500"}
                    >
                      {walkaroundData.data.walkaround.status.charAt(0).toUpperCase() + 
                       walkaroundData.data.walkaround.status.slice(1)}
                    </Badge>
                  </p>
                  <p className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-rose-500" />
                    <span className="font-medium">Mileage:</span> 
                    {walkaroundData.data.walkaround.mileage ?? 'N/A'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Note:</span> 
                    {walkaroundData.data.walkaround.note ?? 'N/A'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Defects:</span> 
                    {walkaroundData.data.walkaround.defects ?? 'None reported'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rose-500" />
                    <span className="font-medium">Duration:</span> 
                    {walkaroundData.data.walkaround.walkaround_duration ?? 'N/A'}
                  </p>
                </div>
              </div>

              {walkaroundData.data.walkaround.vehicle.site_allocated.image && (
                <>
                  <Separator className="bg-gray-500/20" />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-500" /> Site Image
                    </h3>
                    <img 
                      src={walkaroundData.data.walkaround.vehicle.site_allocated.image} 
                      alt={walkaroundData.data.walkaround.vehicle.site_allocated.name} 
                      className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Lights & Electrical</h2>
              <Badge 
                variant="outline" 
                className="border-orange-500 text-orange-500"
              >
                {`${completedCount}/${totalCount} Completed`}
              </Badge>
            </div>
            {filteredAnswers.map((answer) => (
              <InspectionItem
                key={answer.id}
                title={answer.question_text}
                status={getInspectionStatus(answer.is_defected)}
                defaultValue={getDefaultValue(answer.is_defected)}
                comments={answer.description || ""}
                answerId={answer.id}
                onSaveComments={handleSaveComments}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default VehicleInspectionPage