"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Search, User } from "lucide-react"

const transportData = {
  early: {
    timeRange: "06:00 AM - 09:30 AM",
    data: [
      { location: "Braintree", out: 10, in: 12, spillOver: -2 },
      { location: "Colchester", out: 5, in: 9, spillOver: -3 },
      { location: "Colchester B", out: 8, in: 20, spillOver: -2 },
      { location: "Colchester S", out: 20, in: 5, spillOver: +2 },
    ],
    internalOps: {
      transfer: 5,
      jobs: 10,
    },
  },
  shuttle1: {
    timeRange: "09:30 AM - 12:00 PM",
    data: [
      { location: "Braintree", out: 15, in: 8, spillOver: 3 },
      { location: "Colchester", out: 12, in: 14, spillOver: -1 },
      { location: "Colchester B", out: 18, in: 22, spillOver: -4 },
      { location: "Colchester S", out: 25, in: 10, spillOver: 5 },
    ],
    internalOps: {
      transfer: 8,
      jobs: 15,
    },
  },
  shuttle2: {
    timeRange: "12:00 PM - 15:00 PM",
    data: [
      { location: "Braintree", out: 20, in: 18, spillOver: 1 },
      { location: "Colchester", out: 16, in: 19, spillOver: -2 },
      { location: "Colchester B", out: 14, in: 25, spillOver: -3 },
      { location: "Colchester S", out: 28, in: 12, spillOver: 4 },
    ],
    internalOps: {
      transfer: 12,
      jobs: 18,
    },
  },
  shuttle3: {
    timeRange: "15:00 PM - 18:00 PM",
    data: [
      { location: "Braintree", out: 22, in: 16, spillOver: 2 },
      { location: "Colchester", out: 18, in: 21, spillOver: -1 },
      { location: "Colchester B", out: 16, in: 28, spillOver: -5 },
      { location: "Colchester S", out: 32, in: 14, spillOver: 6 },
    ],
    internalOps: {
      transfer: 15,
      jobs: 22,
    },
  },
  night: {
    timeRange: "18:00 PM - 00:00 AM",
    data: [
      { location: "Braintree", out: 8, in: 12, spillOver: -1 },
      { location: "Colchester", out: 6, in: 9, spillOver: -2 },
      { location: "Colchester B", out: 10, in: 15, spillOver: -3 },
      { location: "Colchester S", out: 18, in: 8, spillOver: 3 },
    ],
    internalOps: {
      transfer: 6,
      jobs: 12,
    },
  },
}

const tabs = [
  { id: "early", label: "Early", color: "border-red-200 text-red-600" },
  { id: "shuttle1", label: "1st Shuttle", color: "border-green-200 text-green-600" },
  { id: "shuttle2", label: "2nd Shuttle", color: "border-pink-200 text-pink-600" },
  { id: "shuttle3", label: "3rd Shuttle", color: "border-orange-200 text-orange-600" },
  { id: "night", label: "Night", color: "border-purple-200 text-purple-600" },
]

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState("early")
  const currentData = transportData[activeTab as keyof typeof transportData]

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
              <p className="text-sm text-gray-500 flex items-center gap-1">Last updated: 8:17:29 PM</p>
            </div>
          </div>
         
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
            <div className="flex gap-2 mb-6">
                  {tabs.map((tab) => (
                    <Badge
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "outline"}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center cursor-pointer gap-2 ${
                          tab.id === "early"
                            ? "bg-red-500/50 border-red-500 text-red-600"
                            : tab.id === "shuttle1"
                              ? "bg-green-500/50 text-green-600 border-green-500 "
                              : tab.id === "shuttle2"
                                ? "bg-pink-500/50 border-pink-500 text-pink-600 "
                                : tab.id === "shuttle3"
                                  ? "bg-orange-500/50 border-orange-500 text-orange-600"
                                  : "bg-purple-500/50 text-purple-600 border-purple-500"
                        } ${
                        activeTab === tab.id
                          ? "bg-white"
                          : " "
                      }`}
                    >
                     
                      {tab.label}
                    </Badge>
                  ))}
                </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === "early"
                  ? "Early Run"
                  : activeTab === "shuttle1"
                    ? "1st Shuttle Run"
                    : activeTab === "shuttle2"
                      ? "2nd Shuttle Run"
                      : activeTab === "shuttle3"
                        ? "3rd Shuttle Run"
                        : "Night Run"}
              </h2>
              <p className="text-sm text-gray-500">Van early run data</p>
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
                {/* Total Row */}
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
              <p className="text-sm text-gray-500">Van early run data</p>
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
