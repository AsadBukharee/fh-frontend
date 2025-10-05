"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface DutyLog {
  id: number
  day: string
  date: string
  timeRange: string
  totalHours: string
  drivingHours: string
  breakHours: string
  status: string
  type: string
  empId: string
  vehicle: number | null
  vehicleRegistration: string | null
}

interface ApiResponse {
  week_start: string
  week_end: string
  logs: {
    id: number
    day: string
    date: string
    shift_name: string
    driving_duty_hours: string
    breaks_taken: string
    total_duty_time: string
    vehicle: number | null
    vehicle_registration?: string | null   // snake_case
    vehicleRegistration?: string | null   // camelCase (fallback)
    on_duty: boolean
    status: string
    user_name: string
  }[]
}

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-")
  return `${month}/${day}/${year}`
}

const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Complete":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    case "Incomplete":
      return "bg-red-100 text-red-800 hover:bg-red-200"
    case "Waiting":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    case "Off Duty":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export default function EmployeeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string
  const [activeTab, setActiveTab] = useState("current")
  const [logs, setLogs] = useState<DutyLog[]>([])
  const [employee, setEmployee] = useState<{ name: string; employeeId: string }>({
    name: "Loading...",
    employeeId: `EMP${employeeId.padStart(3, "0")}`,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = useCookies().get("access_token")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/activity/duty-logs/current-week/?user_id=6`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Failed to fetch logs")
        const data: ApiResponse = await response.json()

        console.log("API raw log sample:", data.logs[0]) // debug check

        const formattedLogs: DutyLog[] = data.logs.map((log) => ({
          id: log.id,
          day: log.day,
          date: formatDate(log.date),
          empId: `LOG${log.id.toString().padStart(3, "0")}`,
          timeRange: log.shift_name,
          totalHours: `Total ${log.total_duty_time || "00:00:00"}`,
          drivingHours: `Driving ${log.driving_duty_hours || "00:00:00"}`,
          breakHours: `Breaks ${log.breaks_taken || "00:00:00"}`,
          status: formatStatus(log.status),
          type: "current",
          vehicle: log.vehicle,
          // handle both snake_case and camelCase
          vehicleRegistration: log.vehicle_registration ?? log.vehicleRegistration ?? null,
        }))

        setLogs(formattedLogs)
        if (data.logs.length > 0) {
          setEmployee({
            name: data.logs[0].user_name,
            employeeId: `EMP${employeeId.padStart(3, "0")}`,
          })
        }
      } catch (err) {
        setError("Error fetching logs. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (employeeId && token) fetchLogs()
  }, [employeeId, token])

  const currentWeekLogs = logs.filter((log) => log.type === "current")
  const incompleteLogs = logs.filter((log) => log.status === "Incomplete")
  const waitingLogs = logs.filter((log) => log.status === "Waiting")
  const historyLogs = logs.filter((log) => log.type === "history")

  const getFilteredLogs = () => {
    switch (activeTab) {
      case "current":
        return currentWeekLogs
      case "incomplete":
        return incompleteLogs
      case "waiting":
        return waitingLogs
      case "history":
        return historyLogs
      default:
        return currentWeekLogs
    }
  }

  const getSectionInfo = () => {
    switch (activeTab) {
      case "current":
        return { title: "Current Week Logs", description: "Logs for the current driving week only" }
      case "incomplete":
        return { title: "Incomplete Logs", description: "Logs that require completion or correction" }
      case "waiting":
        return { title: "Waiting for Approval", description: "Logs pending supervisor approval" }
      case "history":
        return { title: "Historical Logs", description: "Previous weeks and archived logs" }
      default:
        return { title: "Current Week Logs", description: "Logs for the current driving week only" }
    }
  }

  const filteredLogs = getFilteredLogs()
  const sectionInfo = getSectionInfo()

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Daily Logs - {employee.name}</h1>
            <p className="text-sm text-gray-600">Employee ID: {employee.employeeId}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {["current", "incomplete", "waiting", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "current" && "Current Week"}
              {tab === "incomplete" && (
                <>
                  Incomplete
                  {incompleteLogs.length > 0 && (
                    <Badge className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                      {incompleteLogs.length}
                    </Badge>
                  )}
                </>
              )}
              {tab === "waiting" && (
                <>
                  Waiting
                  {waitingLogs.length > 0 && (
                    <Badge className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                      {waitingLogs.length}
                    </Badge>
                  )}
                </>
              )}
              {tab === "history" && "History"}
            </button>
          ))}
        </div>

        {/* Logs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">{sectionInfo.title}</h2>
            <p className="text-sm text-gray-600">{sectionInfo.description}</p>
          </div>

          {loading ? (
            <Card className="p-8 text-center bg-white">
              <p className="text-gray-500">Loading logs...</p>
            </Card>
          ) : error ? (
            <Card className="p-8 text-center bg-white">
              <p className="text-red-500">{error}</p>
            </Card>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="p-4 bg-gray-50">
                  <Link
                    href={`/dashboard/users/daily-duty-logs/${employeeId}/${log.id}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 md:gap-8">
                      {/* Day and Date */}
                      <div className="min-w-[120px]">
                        <div className="font-medium text-gray-900">{log.day}</div>
                        <div className="text-sm text-gray-500">{log.date}</div>
                      </div>

                      {/* Shift */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">{log.timeRange}</span>
                      </div>

                      {/* Vehicle Registration */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">
                          {log.vehicleRegistration || "No Vehicle"}
                        </span>
                      </div>

                      {/* Total Duty */}
                      <div className="min-w-[100px] flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 truncate">{log.totalHours}</span>
                      </div>

                      {/* Driving */}
                      <div className="min-w-[100px] flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 truncate">{log.drivingHours}</span>
                      </div>

                      {/* Breaks */}
                      <div className="min-w-[100px] flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 truncate">{log.breakHours}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <Badge variant="secondary" className={`${getStatusColor(log.status)} text-xs px-3 py-1`}>
                        {log.status}
                      </Badge>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-white">
              <p className="text-gray-500">No logs found for this category</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
