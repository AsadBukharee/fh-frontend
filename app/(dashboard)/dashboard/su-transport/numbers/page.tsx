
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

type TabKey = "early" | "shuttle1" | "shuttle2" | "shuttle3" | "night"
type DataRow = { location: string; out: number; in: number; spillOver: number }
type InternalOps = { transfer: number; jobs: number }
type TransportTab = { timeRange: string; data: DataRow[]; internalOps: InternalOps }
type TransportData = Record<TabKey, TransportTab>

const transportData: TransportData = {
  early: {
    timeRange: "06:00 AM - 09:30 AM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  shuttle1: {
    timeRange: "09:30 AM - 12:00 PM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  shuttle2: {
    timeRange: "12:00 PM - 15:00 PM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  shuttle3: {
    timeRange: "15:00 PM - 18:00 PM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
  night: {
    timeRange: "18:00 PM - 00:00 AM",
    data: [],
    internalOps: { transfer: 0, jobs: 0 },
  },
}

const tabs: { id: TabKey; label: string; apiRunType: string; color: string }[] = [
  { id: "early", label: "Early", apiRunType: "Early", color: "border-red-200 text-red-600" },
  { id: "shuttle1", label: "First Shuttle", apiRunType: "First Shuttle", color: "border-green-200 text-green-600" },
  { id: "shuttle2", label: "Second Shuttle", apiRunType: "Second Shuttle", color: "border-pink-200 text-pink-600" },
  { id: "shuttle3", label: "Third Shuttle", apiRunType: "Third Shuttle", color: "border-orange-200 text-orange-600" },
  { id: "night", label: "Night", apiRunType: "Night", color: "border-purple-200 text-purple-600" },
]

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("early")
  const [apiData, setApiData] = useState<TransportData>(transportData)
  const token = useCookies().get("access_token")

  useEffect(() => {
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

          result.data.runs.forEach((run: any) => {
            const tab = tabs.find((t) => run.runName.toLowerCase().includes(t.apiRunType.toLowerCase()))
            if (tab) {
              // Map internal jobs
              const transfer = run.internalJobsList.find((j: any) => j.name === "Internal Transfer")?.Total || 0
              const jobs = run.internalJobsList.find((j: any) => j.name === "Internal Jobs")?.Total || 0

              updatedData[tab.id].internalOps = {
                transfer: Number(transfer),
                jobs: Number(jobs),
              }

              // Map data locations
              updatedData[tab.id].data = run.data.map((loc: any): DataRow => ({
                location: String(loc.location ?? ""),
                out: Number(loc.out ?? 0),
                in: Number(loc.in ?? 0),
                spillOver: Number(loc.in ?? 0) - Number(loc.out ?? 0),
              }))

              // Update time range
              updatedData[tab.id].timeRange = `${run.startTime} - ${run.endTime}`
            }
          })

          setApiData(updatedData)
        }
      } catch (error) {
        console.error("Error fetching API data:", error)
      }
    }

    fetchData()
  }, [token])

  const currentData = apiData[activeTab]

  const getTotalOut = () => currentData.data.reduce((sum, item) => sum + item.out, 0)
  const getTotalIn = () => currentData.data.reduce((sum, item) => sum + item.in, 0)
  const getTotalSpillOver = () => currentData.data.reduce((sum, item) => sum + item.spillOver, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SU Number Screen</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <Badge
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-1 rounded-2xl text-sm font-medium border transition-colors cursor-pointer gap-2 
                ${tab.id === "early"
                  ? "bg-red-500/10 border-red-500 text-red-600"
                  : tab.id === "shuttle1"
                    ? "bg-green-500/10 text-green-600 border-green-500"
                    : tab.id === "shuttle2"
                      ? "bg-pink-500/10 border-pink-500 text-pink-600"
                      : tab.id === "shuttle3"
                        ? "bg-orange-500/10 border-orange-500 text-orange-600"
                        : "bg-purple-500/10 text-purple-600 border-purple-500"}
                ${activeTab === tab.id ? "bg-white" : ""}`}
            >
              {tab.label}
            </Badge>
          ))}
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
                {currentData.data.map((row, index) => (
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
                        className={`px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[40px] ${
                          row.spillOver > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.spillOver > 0 ? "+" : ""}
                        {row.spillOver}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-100 font-semibold">
                  <TableCell className="font-bold text-gray-900">Total</TableCell>
                  <TableCell className="text-center">
                    <div className="bg-pink-200 text-pink-900 px-3 py-1 rounded-md text-sm font-bold inline-block min-w-[40px]">
                      {getTotalOut()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="bg-green-200 text-green-900 px-3 py-1 rounded-md text-sm font-bold inline-block min-w-[40px]">
                      {getTotalIn()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      className={`px-3 py-1 rounded-md text-sm font-bold inline-block min-w-[40px] ${
                        getTotalSpillOver() > 0 ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"
                      }`}
                    >
                      {getTotalSpillOver() > 0 ? "+" : ""}
                      {getTotalSpillOver()}
                    </div>
                  </TableCell>
                </TableRow>
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


