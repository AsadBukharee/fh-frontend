"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Search, User, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const transportData = {
  early: {
    timeRange: "06:00 AM - 09:30 AM",
    data: [
      { location: "Braintree Bus Station", out: 10, in: 12, spillOver: -2 },
      { location: "Braintree Bomo Pharmacy", out: 5, in: 9, spillOver: -3 },
      { location: "Braintree Community Hospital", out: 8, in: 20, spillOver: -2 },
      { location: "Braintree Police Station", out: 20, in: 5, spillOver: +2 },
      { location: "Colchester Napier Road", out: 57, in: 54, spillOver: -5 },
      { location: "Braintree Bus Station", out: 10, in: 12, spillOver: -2 },
      { location: "Braintree Bomo Pharmacy", out: 5, in: 9, spillOver: -3 },
      { location: "Braintree Community Hospital", out: 8, in: 20, spillOver: -2 },
      { location: "Braintree Police Station", out: 20, in: 5, spillOver: +2 },
      { location: "Colchester Napier Road", out: 57, in: 54, spillOver: -5 },
    ],
    internalOps: {
      drivers: [
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
      ],
    },
  },
  shuttle1: {
    timeRange: "09:30 AM - 12:00 PM",
    data: [
      { location: "Braintree Bus Station", out: 15, in: 8, spillOver: 3 },
      { location: "Braintree Bomo Pharmacy", out: 12, in: 14, spillOver: -1 },
      { location: "Braintree Community Hospital", out: 18, in: 22, spillOver: -4 },
      { location: "Braintree Police Station", out: 25, in: 10, spillOver: 5 },
      { location: "Colchester Napier Road", out: 45, in: 48, spillOver: -3 },
    ],
    internalOps: {
      drivers: [
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
      ],
    },
  },
  shuttle2: {
    timeRange: "12:00 PM - 15:00 PM",
    data: [
      { location: "Braintree Bus Station", out: 20, in: 18, spillOver: 1 },
      { location: "Braintree Bomo Pharmacy", out: 16, in: 19, spillOver: -2 },
      { location: "Braintree Community Hospital", out: 14, in: 25, spillOver: -3 },
      { location: "Braintree Police Station", out: 28, in: 12, spillOver: 4 },
      { location: "Colchester Napier Road", out: 52, in: 50, spillOver: -2 },
    ],
    internalOps: {
      drivers: [
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
      ],
    },
  },
  shuttle3: {
    timeRange: "15:00 PM - 18:00 PM",
    data: [
      { location: "Braintree Bus Station", out: 22, in: 16, spillOver: 2 },
      { location: "Braintree Bomo Pharmacy", out: 18, in: 21, spillOver: -1 },
      { location: "Braintree Community Hospital", out: 16, in: 28, spillOver: -5 },
      { location: "Braintree Police Station", out: 32, in: 14, spillOver: 6 },
      { location: "Colchester Napier Road", out: 48, in: 52, spillOver: -4 },
    ],
    internalOps: {
      drivers: [
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
      ],
    },
  },
  night: {
    timeRange: "18:00 PM - 00:00 AM",
    data: [
      { location: "Braintree Bus Station", out: 8, in: 12, spillOver: -1 },
      { location: "Braintree Bomo Pharmacy", out: 6, in: 9, spillOver: -2 },
      { location: "Braintree Community Hospital", out: 10, in: 15, spillOver: -3 },
      { location: "Braintree Police Station", out: 18, in: 8, spillOver: 3 },
      { location: "Colchester Napier Road", out: 35, in: 40, spillOver: -5 },
    ],
    internalOps: {
      drivers: [
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
        { name: "John david", transfers: 35, jobs: 35, total: 200 },
      ],
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
              <h1 className="text-2xl font-bold text-gray-900">SU Data Management</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">Last updated: 8:17:29 PM</p>
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

        {/* Main Content */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
              <p className="text-sm text-gray-500">Van early run data</p>
            </div>
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
                  <TableHead className="text-center font-semibold text-gray-900">Actions</TableHead>
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
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
                  <TableCell className="text-center"></TableCell>
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

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-left font-semibold text-gray-900">Drivers</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Transfers</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Jobs</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.internalOps.drivers.map((driver, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{driver.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[40px]">
                          {driver.transfers}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-gray-900 font-medium">{driver.jobs}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[50px]">
                          {driver.total}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
