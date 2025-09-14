"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Users, ArrowRightLeft } from "lucide-react"

const transportData = {
  early: {
    timeRange: "00:00 AM - 09:30 AM",
    data: [
      { location: "Braintree", out: 10, outName: "Imran Khalique", in: 12, inName: "John Smith", spillOver: -2 },
      { location: "Braintree S", out: 8, outName: "Raja Usman", in: 9, inName: "Matthew Wilson", spillOver: -3 },
      { location: "Colchester", out: 8, outName: "Shoaib", in: 20, inName: "Harry Potter", spillOver: -2 },
      { location: "Colchester S", out: 30, outName: "Asad", in: 5, inName: "John Wick", spillOver: 2 },
    ],
    transfers: [
      { from: "Braintree", to: "Colchester", count: 6 },
      { from: "Colchester", to: "Colchester S", count: 5 },
    ],
  },
  shuttle1: {
    timeRange: "09:30 AM - 12:00 PM",
    data: [
      { location: "Braintree", out: 15, outName: "Sarah Johnson", in: 8, inName: "Mike Davis", spillOver: 3 },
      { location: "Braintree S", out: 12, outName: "Ahmed Ali", in: 14, inName: "Lisa Brown", spillOver: -1 },
      { location: "Colchester", out: 18, outName: "David Wilson", in: 22, inName: "Emma Taylor", spillOver: -4 },
      { location: "Colchester S", out: 25, outName: "James Lee", in: 10, inName: "Anna White", spillOver: 5 },
    ],
    transfers: [
      { from: "Braintree", to: "Colchester", count: 8 },
      { from: "Colchester", to: "Colchester S", count: 7 },
    ],
  },
  shuttle2: {
    timeRange: "12:00 PM - 15:00 PM",
    data: [
      { location: "Braintree", out: 20, outName: "Chris Martin", in: 18, inName: "Sophie Clark", spillOver: 1 },
      { location: "Braintree S", out: 16, outName: "Omar Hassan", in: 19, inName: "Tom Anderson", spillOver: -2 },
      { location: "Colchester", out: 14, outName: "Rachel Green", in: 25, inName: "Paul Walker", spillOver: -3 },
      { location: "Colchester S", out: 28, outName: "Kevin Hart", in: 12, inName: "Maria Garcia", spillOver: 4 },
    ],
    transfers: [
      { from: "Braintree", to: "Colchester", count: 9 },
      { from: "Colchester", to: "Colchester S", count: 6 },
    ],
  },
  shuttle3: {
    timeRange: "15:00 PM - 18:00 PM",
    data: [
      { location: "Braintree", out: 22, outName: "Alex Turner", in: 16, inName: "Grace Miller", spillOver: 2 },
      { location: "Braintree S", out: 18, outName: "Zain Ahmed", in: 21, inName: "Oliver Jones", spillOver: -1 },
      { location: "Colchester", out: 16, outName: "Nina Patel", in: 28, inName: "Lucas Brown", spillOver: -5 },
      { location: "Colchester S", out: 32, outName: "Ryan Cooper", in: 14, inName: "Chloe Davis", spillOver: 6 },
    ],
    transfers: [
      { from: "Braintree", to: "Colchester", count: 10 },
      { from: "Colchester", to: "Colchester S", count: 8 },
    ],
  },
  night: {
    timeRange: "18:00 PM - 00:00 AM",
    data: [
      { location: "Braintree", out: 8, outName: "Mark Johnson", in: 12, inName: "Kate Wilson", spillOver: -1 },
      { location: "Braintree S", out: 6, outName: "Ali Khan", in: 9, inName: "Ben Parker", spillOver: -2 },
      { location: "Colchester", out: 10, outName: "Sam Roberts", in: 15, inName: "Lily Evans", spillOver: -3 },
      { location: "Colchester S", out: 18, outName: "Max Steel", in: 8, inName: "Ruby Rose", spillOver: 3 },
    ],
    transfers: [
      { from: "Braintree", to: "Colchester", count: 4 },
      { from: "Colchester", to: "Colchester S", count: 3 },
    ],
  },
}

const tabs = [
  { id: "early", label: "Early", icon: Users },
  { id: "shuttle1", label: "1st Shuttle", icon: Users },
  { id: "shuttle2", label: "2nd Shuttle", icon: Users },
  { id: "shuttle3", label: "3rd Shuttle", icon: Users },
  { id: "night", label: "Night", icon: Users },
]

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState("early")
  const currentData = transportData[activeTab as keyof typeof transportData]

  const getTotalOut = () => currentData.data.reduce((sum, item) => sum + item.out, 0)
  const getTotalIn = () => currentData.data.reduce((sum, item) => sum + item.in, 0)
  const getTotalSpillOver = () => currentData.data.reduce((sum, item) => sum + item.spillOver, 0)

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SU Transport Data</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last updated: 07:23 PM
            </p>
          </div>
          <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">
            10 S
          </Badge>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-white p-1 ">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center shadow  clip-tab ${
                  activeTab === tab.id
                    ? "bg-white text-orange hover:bg-gray-50"
                    : "text-gray-600 bg-gray-100 hover:text-gray-900"
                }`}
              >

              
                {tab.label}
              </Button>
            )
          })}
        </div>

        {/* Main Content */}
        <Card className="p-3">
          <div className="space-y-3">
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
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                {currentData.timeRange}
              </Badge>
            </div>

            {/* Data Table */}
            <div className="rounded-md ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Location</TableHead>
                    <TableHead className="text-center">Out(s)</TableHead>
                    <TableHead className="text-center">In(from)</TableHead>
                    <TableHead className="text-center">Spill Over</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.location}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm font-medium inline-block">
                          {row.outName} ({row.out})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium inline-block">
                          {row.inName} ({row.in})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`px-2 py-1 rounded text-sm font-medium inline-block ${
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
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-center">
                      <div className="bg-pink-200 text-pink-900 px-2 py-1 rounded text-sm font-bold inline-block">
                        {getTotalOut()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="bg-green-200 text-green-900 px-2 py-1 rounded text-sm font-bold inline-block">
                        {getTotalIn()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={`px-2 py-1 rounded text-sm font-bold inline-block ${
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
            </div>

            {/* Internal Transfers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Internal Transfers
              </h3>
              <p className="text-sm text-gray-500">Van early run data</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentData.transfers.map((transfer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{transfer.from}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {transfer.count} Transfer
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">{transfer.to}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
