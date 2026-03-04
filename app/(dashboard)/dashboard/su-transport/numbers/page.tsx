"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { RefreshCw } from "lucide-react"

type TabKey = "early" | "shuttle1" | "shuttle2" | "shuttle3" | "night"
type DataRow = { location: string; out: number; in: number; spillOver: number }
type InternalOps = { transfer: number; jobs: number }
type TransportTab = { timeRange: string; data: DataRow[]; internalOps: InternalOps }
type TransportData = Record<TabKey, TransportTab>

const transportData: TransportData = {
  early: {
    timeRange: "5:00 AM - 9:20 AM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  shuttle1: {
    timeRange: "9:21 AM - 2:00 PM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  shuttle2: {
    timeRange: "2:01 PM - 4:30 PM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  shuttle3: {
    timeRange: "4:31 PM - 6:59 PM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  night: {
    timeRange: "7:00 PM - 4:59 AM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
}

const tabs: { id: TabKey; label: string; apiRunType: string; color: string; startTime: string; endTime: string }[] = [
  { id: "early", label: "Early", apiRunType: "Early", color: "border-red-200 text-red-600", startTime: "5:00 AM", endTime: "9:20 AM" },
  { id: "shuttle1", label: "First Shuttle", apiRunType: "First Shuttle", color: "border-green-200 text-green-600", startTime: "9:21 AM", endTime: "2:00 PM" },
  { id: "shuttle2", label: "Second Shuttle", apiRunType: "Second Shuttle", color: "border-pink-200 text-pink-600", startTime: "2:01 PM", endTime: "4:30 PM" },
  { id: "shuttle3", label: "Third Shuttle", apiRunType: "Third Shuttle", color: "border-orange-200 text-orange-600", startTime: "4:31 PM", endTime: "6:59 PM" },
  { id: "night", label: "Night", apiRunType: "Night", color: "border-purple-200 text-purple-600", startTime: "7:00 PM", endTime: "4:59 AM" },
]

// Map API run names to TabKey, including the exact format from API
const runNameToId: Record<string, TabKey> = {
  Early: "early",
  "First Shuttle": "shuttle1",
  "Second Shuttle": "shuttle2",
  "3rd Shuttle Run": "shuttle3", // Match API's exact format
  "Third Shuttle": "shuttle3", // Support both formats for robustness
  Night: "night",
}

// Helper function to parse time strings (e.g., "5:00 AM") to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(" ")
  const [hours, minutes] = time.split(":").map(Number)
  return {
    hours: period === "PM" && hours !== 12 ? hours + 12 : period === "AM" && hours === 12 ? 0 : hours,
    minutes,
  }
}

// Helper function to determine the current shift based on current time (fallback)
const getCurrentShiftByTime = (currentTime: Date): TabKey => {
  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  const currentMinutes = hours * 60 + minutes

  for (const tab of tabs) {
    const start = parseTime(tab.startTime)
    const end = parseTime(tab.endTime)
    const startMinutes = start.hours * 60 + start.minutes
    const endMinutes = end.hours * 60 + end.minutes

    // Handle "Night" shift crossing midnight
    if (tab.id === "night") {
      if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
        return "night"
      }
    } else {
      if (startMinutes <= currentMinutes && currentMinutes <= endMinutes) {
        return tab.id
      }
    }
  }

  // Default to "early" if no shift matches
  return "early"
}

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("early")
  const [apiData, setApiData] = useState<TransportData>(transportData)
  const [refreshCounter, setRefreshCounter] = useState<number>(30)
  const [currentRunType, setCurrentRunType] = useState<string | null>(null)
  const token = useCookies().get("access_token")

  // Fetch data from API and set initial active tab based on curent_run_type
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/activity/su-run/overview/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        const updatedData: TransportData = { ...transportData }

        // Map API data to tabs
        result.data.runs.forEach((run: any) => {
          const tabId = runNameToId[run.runName]
          if (tabId) {
            // Map internal jobs
            const transfer = run.internalJobsList.find((j: any) => j.name === "Internal Transfer")?.Total || 0
            const jobs = run.internalJobsList.find((j: any) => j.name === "Internal Jobs")?.Total || 0

            updatedData[tabId].internalOps = {
              transfer: Number(transfer),
              jobs: Number(jobs),
            }

            // Map data locations
            updatedData[tabId].data = run.data.map((loc: any): DataRow => ({
              location: String(loc.location ?? ""),
              out: Number(loc.out ?? 0),
              in: Number(loc.in ?? 0),
              spillOver: Number(loc.in ?? 0) - Number(loc.out ?? 0),
            }))

            // Update time range
            updatedData[tabId].timeRange = `${run.startTime} - ${run.endTime}`
          }
        })

        setApiData(updatedData)
        // Set active tab based on curent_run_type, handling typo
        const runType = result.data.current_run_type || result.data.curent_run_type
        if (runType && runNameToId[runType]) {
          setActiveTab(runNameToId[runType])
        } else {
          setActiveTab(getCurrentShiftByTime(new Date()))
        }
        setCurrentRunType(runType)
      } else {
        console.error("API returned unsuccessful response:", result.message)
        setActiveTab(getCurrentShiftByTime(new Date()))
      }
    } catch (error) {
      console.error("Error fetching API data:", error)
      setActiveTab(getCurrentShiftByTime(new Date()))
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  // Auto-refresh every 30 seconds with counter
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((prev) => {
        if (prev <= 1) {
          fetchData()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Manual refresh function
  const refreshData = () => {
    fetchData()
    setRefreshCounter(30)
  }

  const currentData = apiData[activeTab]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SU Number Screen</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Last updated: {new Date().toLocaleTimeString()}
                <span className="ml-4">Next refresh in {refreshCounter} seconds</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs and Refresh Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Badge
                  key={tab.id}
                  variant="outline"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setRefreshCounter(30)
                  }}
                  className={`flex items-center px-4 py-1 rounded-2xl text-sm font-medium border transition-colors cursor-pointer gap-2
                    ${tab.id === "early"
                      ? isActive
                        ? "bg-red-500/20 text-red-500 border-red-500/70"
                        : "bg-white text-gray-600/50 border-gray-500/50"
                      : tab.id === "shuttle1"
                        ? isActive
                          ? "bg-green-500/20 text-green-500 border-green-500/70"
                          : "bg-white text-gray-600/50 border-gray-500/50"
                        : tab.id === "shuttle2"
                          ? isActive
                            ? "bg-pink-500/20 text-pink-500 border-pink-500/70"
                            : "bg-white text-gray-600/50 border-gray-500/50"
                          : tab.id === "shuttle3"
                            ? isActive
                              ? "bg-orange-500/20 text-orange-500 border-orange-500/70"
                              : "bg-white text-gray-600/50 border-gray-500/50"
                            : isActive
                              ? "bg-purple-500/20 text-purple-500 border-purple-500/70"
                              : "bg-white text-gray-600/50 border-gray-500/50"
                    }`}
                >
                  {tab.label}
                </Badge>
              )
            })}
          </div>
          <Button
            variant="outline"
            onClick={refreshData}
            className="text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />

          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find((tab) => tab.id === activeTab)?.label} Run
              </h2>
              <p className="text-sm text-gray-500">Van run data</p>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
              {currentData.timeRange}
            </Badge>
          </div>

          {/* Data Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left font-semibold text-gray-900">Locations</TableHead>
                  <TableHead className="text-center font-semibold text-gray-900">OUT</TableHead>
                  <TableHead className="text-center font-semibold text-gray-900">IN</TableHead>
                  <TableHead className="text-center font-semibold text-gray-900">Spill Over</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.data.length > 0 ? (
                  currentData.data.map((row, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{row.location}</TableCell>
                      <TableCell className="text-center">
                        <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[40px]">
                          {row.out}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[40px]">
                          {row.in}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[40px] ${row.spillOver > 0
                              ? "bg-green-100 text-green-800"
                              : row.spillOver < 0
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {row.spillOver > 0 ? "+" : ""}
                          {row.spillOver}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Internal Operations */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Internal Operations</h3>
              <p className="text-sm text-gray-500">Van run data</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Transfer</div>
                  <div className="text-2xl font-bold text-orange-600">{currentData.internalOps.transfer}</div>
                </div>
              </Card>
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Jobs</div>
                  <div className="text-2xl font-bold text-red-600">{currentData.internalOps.jobs}</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}