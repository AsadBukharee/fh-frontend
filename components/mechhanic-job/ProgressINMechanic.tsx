"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogCancel,
  AlertDialogFooter,
} from "../ui/alert-dialog"
import {
  BarChart,
  User,
  Car,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { Badge } from "../ui/badge"
import { Card, CardContent } from "../ui/card"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

// Define the shape of the API response data
interface JobData {
  id: number
  vehicle_reg: string
  mechanic_name: string
  assignee_name: string
  mechanicdefects: any[]
  notes: string
  source: string
  status: string
  timestamp: string
  vehicle: number
  mechanic: number
  assignee: number
}

const ProgressInMechanic = ({
  isBarChartDialogOpen,
  setIsBarChartDialogOpen,
  selectedJobid,
}: {
  isBarChartDialogOpen: boolean
  setIsBarChartDialogOpen: (open: boolean) => void
  selectedJobid: number | null
}) => {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("complete") || statusLower.includes("done")) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      )
    } else if (statusLower.includes("progress") || statusLower.includes("working")) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      )
    } else if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      )
    } else if (statusLower.includes("cancelled") || statusLower.includes("failed")) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      )
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  // Fetch job details when the dialog opens or selectedJobid changes
  useEffect(() => {
    if (isBarChartDialogOpen && selectedJobid) {
      const fetchJobDetails = async () => {
        setLoading(true)
        setError(null)
        try {
          const response = await fetch(`${API_URL}/activity/mechanic-job/${selectedJobid}/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token") || ""}`,
            },
          })
          if (!response.ok) {
            throw new Error("Network response was not ok")
          }
          const data = await response.json()
          if (data.success) {
            setJobData(data.data)
          } else {
            setError("Failed to fetch job details")
          }
        } catch (err) {
          setError("Error fetching job details")
        } finally {
          setLoading(false)
        }
      }

      fetchJobDetails()
    }
  }, [isBarChartDialogOpen, selectedJobid])

  return (
    <AlertDialog open={isBarChartDialogOpen} onOpenChange={setIsBarChartDialogOpen}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <BarChart className="w-6 h-6 text-blue-600" />
            Job Details
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Comprehensive details for Job ID: <span className="font-semibold text-foreground">#{selectedJobid}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Loading job details...</span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {jobData && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Job Status</h3>
                    {getStatusBadge(jobData.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium">{new Date(jobData.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Source</p>
                        <p className="font-medium">{jobData.source}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Car className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Vehicle Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-mono text-lg font-bold text-blue-600">{jobData.vehicle_reg}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle ID</p>
                      <p className="font-medium">#{jobData.vehicle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personnel Information */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Personnel</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Mechanic</p>
                      <p className="font-medium text-lg">{jobData.mechanic_name}</p>
                      <p className="text-xs text-gray-400">ID: #{jobData.mechanic}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Assignee</p>
                      <p className="font-medium text-lg">{jobData.assignee_name}</p>
                      <p className="text-xs text-gray-400">ID: #{jobData.assignee}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              {jobData.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">Notes</h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">{jobData.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Defects Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Mechanic Defects</h3>
                    <Badge variant="outline" className="ml-auto">
                      {jobData.mechanicdefects.length} {jobData.mechanicdefects.length === 1 ? "defect" : "defects"}
                    </Badge>
                  </div>
                  {jobData.mechanicdefects.length > 0 ? (
                    <div className="space-y-3">
                      {jobData.mechanicdefects.map((defect, index) => (
                        <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-orange-800 mb-1">Defect #{index + 1}</p>
                              <pre className="text-sm text-orange-700 bg-white rounded p-2 overflow-x-auto">
                                {JSON.stringify(defect, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No defects reported</p>
                      <p className="text-sm text-gray-400">This job has no recorded defects</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={() => setIsBarChartDialogOpen(false)} className="px-6 py-2">
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ProgressInMechanic
