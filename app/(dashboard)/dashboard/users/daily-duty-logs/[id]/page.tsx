"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, MapPin } from "lucide-react"

// Sample employee data
const employeeDetails = {
  1: { name: "John Smith", employeeId: "EMP001" },
  2: { name: "Jenny Wilson", employeeId: "EMP002" },
  3: { name: "Jenny Wilson", employeeId: "EMP003" },
  4: { name: "Jenny Wilson", employeeId: "EMP004" },
  5: { name: "Jenny Wilson", employeeId: "EMP005" },
  6: { name: "Jenny Wilson", employeeId: "EMP006" },
  7: { name: "Jenny Wilson", employeeId: "EMP007" },
  8: { name: "Jenny Wilson", employeeId: "EMP008" },
  9: { name: "Jenny Wilson", employeeId: "EMP009" },
}

const weeklyLogs = [
  {
    day: "Monday",
    date: "1/15/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Off Duty",
    type: "current",
  },
  {
    day: "Tuesday",
    date: "1/16/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Complete",
    type: "current",
  },
  {
    day: "Wednesday",
    date: "1/17/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Incomplete",
    type: "current",
  },
  {
    day: "Thursday",
    date: "1/18/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Waiting",
    type: "current",
  },
  {
    day: "Friday",
    date: "1/19/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Incomplete",
    type: "current",
  },
  {
    day: "Saturday",
    date: "1/20/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Complete",
    type: "current",
  },
  {
    day: "Sunday",
    date: "1/21/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Complete",
    type: "current",
  },
  // Historical logs
  {
    day: "Monday",
    date: "1/8/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Complete",
    type: "history",
  },
  {
    day: "Tuesday",
    date: "1/9/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Complete",
    type: "history",
  },
  {
    day: "Wednesday",
    date: "1/10/2024",
    empId: "1:30 - 4:56",
    timeRange: "08:00 - 16:30",
    locationRange: "0:00 - 10:5",
    totalHours: "Total 8:30AM",
    status: "Incomplete",
    type: "history",
  },
]

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

  const employee = employeeDetails[Number.parseInt(employeeId) as keyof typeof employeeDetails] || {
    name: "John Smith",
    employeeId: "EMP001",
  }

  const currentWeekLogs = weeklyLogs.filter((log) => log.type === "current")
  const incompleteLogs = weeklyLogs.filter((log) => log.status === "Incomplete")
  const waitingLogs = weeklyLogs.filter((log) => log.status === "Waiting")
  const historyLogs = weeklyLogs.filter((log) => log.type === "history")

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
        return {
          title: "Current Week Logs",
          description: "Logs for the current driving week only",
        }
      case "incomplete":
        return {
          title: "Incomplete Logs",
          description: "Logs that require completion or correction",
        }
      case "waiting":
        return {
          title: "Waiting for Approval",
          description: "Logs pending supervisor approval",
        }
      case "history":
        return {
          title: "Historical Logs",
          description: "Previous weeks and archived logs",
        }
      default:
        return {
          title: "Current Week Logs",
          description: "Logs for the current driving week only",
        }
    }
  }

  const filteredLogs = getFilteredLogs()
  const sectionInfo = getSectionInfo()

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Daily Logs - {employee.name}</h1>
            <p className="text-sm text-gray-600">Employee ID: {employee.employeeId}</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "current"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Current Week
          </button>
          <button
            onClick={() => setActiveTab("incomplete")}
            className={`px-4 py-2 text-sm font-medium border-b-2 clip-tab transition-colors flex items-center gap-2 ${
              activeTab === "incomplete"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 bg-gray-50 hover:text-gray-700"
            }`}
          >
            Incomplete
            {incompleteLogs.length > 0 && (
              <Badge className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {incompleteLogs.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("waiting")}
            className={`px-4 py-2 text-sm font-medium border-b-2 clip-tab transition-colors flex items-center gap-2 ${
              activeTab === "waiting"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 bg-gray-50 hover:text-gray-700"
            }`}
          >
            Waiting
            {waitingLogs.length > 0 && (
              <Badge className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{waitingLogs.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 clip-tab transition-colors ${
              activeTab === "history"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 bg-gray-50 hover:text-gray-700"
            }`}
          >
            History
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">{sectionInfo.title}</h2>
            <p className="text-sm text-gray-600">{sectionInfo.description}</p>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <Card key={index} className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      {/* Day and Date */}
                      <div className="min-w-[120px]">
                        <div className="font-medium text-gray-900">{log.day}</div>
                        <div className="text-sm text-gray-500">{log.date}</div>
                      </div>

                      {/* Employee ID */}
                      <div className="min-w-[80px]">
                        <div className="text-sm text-gray-600">{log.empId}</div>
                      </div>

                      {/* Time Range */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{log.timeRange}</span>
                      </div>

                      {/* Location Range */}
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{log.locationRange}</span>
                      </div>

                      {/* Total Hours */}
                      <div className="min-w-[100px]">
                        <span className="text-sm font-medium text-blue-600">{log.totalHours}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <Badge variant="secondary" className={`${getStatusColor(log.status)} text-xs px-3 py-1`}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
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
