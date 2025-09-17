"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Search, User, MoreHorizontal, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Assuming you use Shadcn/UI Select

type TimeSlotId = "early" | "shuttle1" | "shuttle2" | "shuttle3" | "night"

interface LocationRow {
  location: string
  out: number
  in: number
  spillOver: number
}

interface DriverRow {
  name: string
  transfers: number
  jobs: number
  total: number
}

interface SlotData {
  timeRange: string
  data: LocationRow[]
  internalOps: { drivers: DriverRow[] }
}

type TransportData = Record<TimeSlotId, SlotData>

const transportData: TransportData = {
  early: {
    timeRange: "06:00 AM - 09:30 AM",
    data: [
      { location: "Braintree Bus Station", out: 10, in: 12, spillOver: -2 },
      { location: "Braintree Bomo Pharmacy", out: 5, in: 9, spillOver: -3 },
      { location: "Braintree Community Hospital", out: 8, in: 20, spillOver: -2 },
      { location: "Braintree Police Station", out: 20, in: 5, spillOver: 2 },
      { location: "Colchester Napier Road", out: 57, in: 54, spillOver: -5 },
    ],
    internalOps: {
      drivers: [
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
      ],
    },
  },
}

const tabs: { id: TimeSlotId; label: string; color: string }[] = [
  { id: "early", label: "Early", color: "bg-pink-100 text-pink-600 border-pink-200" },
  { id: "shuttle1", label: "1st Shuttle", color: "bg-green-100 text-green-600 border-green-200" },
  { id: "shuttle2", label: "2nd Shuttle", color: "bg-purple-100 text-purple-600 border-purple-200" },
  { id: "shuttle3", label: "3rd Shuttle", color: "bg-orange-100 text-orange-600 border-orange-200" },
  { id: "night", label: "Night", color: "bg-blue-100 text-blue-600 border-blue-200" },
]

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState<TimeSlotId>("early")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all")
  const [selectedDriver, setSelectedDriver] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<string>("all")

  const currentData = transportData[activeTab]
  const locations: string[] = Array.from(
    new Set(transportData[activeTab].data.map((item: LocationRow) => item.location))
  )
  const timeRanges: string[] = Object.values(transportData).map((data: SlotData) => data.timeRange)
  const drivers: string[] = Array.from(
    new Set(
      transportData[activeTab].internalOps.drivers.map((driver: DriverRow) => driver.name)
    )
  )
  const dates = ["2025-09-16", "2025-09-17", "2025-09-18"] // Example dates; adjust as needed

  const filteredData = currentData.data.filter((row: LocationRow) => {
    const matchesLocation = selectedLocation === "all" || row.location === selectedLocation
    const matchesTimeRange = selectedTimeRange === "all" || currentData.timeRange === selectedTimeRange
    return matchesLocation && matchesTimeRange
  })

  const filteredDrivers = currentData.internalOps.drivers.filter((driver: DriverRow) => 
    selectedDriver === "all" || driver.name === selectedDriver
  )

  const getTotalOut = () => filteredData.reduce((sum, item) => sum + item.out, 0)
  const getTotalIn = () => filteredData.reduce((sum, item) => sum + item.in, 0)
  const getTotalSpillOver = () => filteredData.reduce((sum, item) => sum + item.spillOver, 0)

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center mb-6 justify-between">
        <div className=" items-center gap-4">
            <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SU Data Management</h1>
            </div>
         <div className="">
         <span className="text-sm text-gray-500">Last updated 10:31 PM</span>

         </div>
        
        </div>
        
      </div>

      {/* Navigation Tabs */}
     <div className=" flex items-center mb-6 justify-between">
     <div className="flex gap-2">
        {tabs.map((tab) => (
          <Badge
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setSelectedLocation("all")
              setSelectedTimeRange("all")
              setSelectedDriver("all")
              setSelectedDate("all")
            }}
            className={`px-4 py-1 rounded-2xl text-sm font-medium  border transition-colors ${
              activeTab === tab.id ? tab.color : "text-gray-500 hover:text-gray-700 bg-white border-gray-200"
            }`}
          >
            {tab.label}
          </Badge>
        ))}
      </div>
      <div className="flex items-center ">
        <Badge variant="secondary" className="bg-pink-600/20  text-pink-600 px-4 py-1 rounded-2xl text-sm font-medium  border-pink-600 hover:bg-pink-600">Reports</Badge>
      </div>
     </div>

    
      {/* Section Header */}
      <div className="mb-4">
       <div className=" mb-2">
       <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
       <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
       </div>
          {/* Filter Row */}
      <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
        <Select onValueChange={setSelectedLocation} value={selectedLocation}>
          <SelectTrigger className="w-[180px] border-gray-300">
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedTimeRange} value={selectedTimeRange}>
          <SelectTrigger className="w-[180px] border-gray-300">
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time Ranges</SelectItem>
            {timeRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedDriver} value={selectedDriver}>
          <SelectTrigger className="w-[180px] border-gray-300">
            <SelectValue placeholder="Select Driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver} value={driver}>
                {driver}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedDate} value={selectedDate}>
          <SelectTrigger className="w-[180px] border-gray-300">
            <SelectValue placeholder="Select Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {dates.map((date) => (
              <SelectItem key={date} value={date}>
                {date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="text-left font-semibold text-gray-700 py-3">Locations</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">OUT</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">IN</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">Spill Over</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={index} className="hover:bg-gray-50 border-b">
                <TableCell className="font-medium text-gray-900 py-3">{row.location}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-[#FFC1CC] text-[#FF2E63]">
                    {row.out}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-[#C1E1C5] text-[#2E7D32]">
                    {row.in}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="secondary"
                    className={`${
                      row.spillOver > 0 ? "bg-[#C1E1C5] text-[#2E7D32]" : "bg-[#FFC1CC] text-[#FF2E63]"
                    }`}
                  >
                    {row.spillOver > 0 ? `+${row.spillOver}` : row.spillOver}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-50 font-semibold border-t-2">
              <TableCell className="font-bold text-gray-900 py-3">Total</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="bg-[#FF9DB3] text-[#FF2E63] font-bold">
                  {getTotalOut()}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="bg-[#AEDBB2] text-[#2E7D32] font-bold">
                  {getTotalIn()}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className={`${
                    getTotalSpillOver() > 0 ? "bg-[#AEDBB2] text-[#2E7D32]" : "bg-[#FF9DB3] text-[#FF2E63]"
                  } font-bold`}
                >
                  {getTotalSpillOver() > 0 ? `+${getTotalSpillOver()}` : getTotalSpillOver()}
                </Badge>
              </TableCell>
              <TableCell className="text-center"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Internal Operations */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Internal Operations</h3>
          <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="text-left font-semibold text-gray-700 py-3">Drivers</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Transfers</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Jobs</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver, index) => (
                <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                  <TableCell className="font-medium text-gray-900 py-3">{driver.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#FFD54F] text-[#F57C00]">
                      {driver.transfers}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-gray-900 font-medium">{driver.jobs}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#FFC1CC] text-[#FF2E63]">
                      {driver.total}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}