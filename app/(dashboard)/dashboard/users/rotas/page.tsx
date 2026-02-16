"use client"

import { useState } from "react"
import ChangeShifts from "@/components/Rota/ChangeShifts"
import { ShiftTable } from "@/components/Rota/ChildTab"
import ParentTab from "@/components/Rota/ParentTab"
import Reporting from "@/components/Rota/Reporting"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function Rota() {
  const currentYear = new Date().getFullYear() // Dynamically get the current year (2025)
  const currentMonth = new Date().getMonth() + 1 // Dynamically get the current month (9 for September, 1-based)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("parent")

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="p-6 space-y-4 bg-white">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rota Master Control</h1>
          <p className="text-sm text-gray-500">Advanced staff pattern and schedule management system</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="parent" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
          <TabsTrigger
            value="parent"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Parent Tab - Pattern Management
          </TabsTrigger>
          <TabsTrigger
            value="child"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Child Tab · 12 Month View
          </TabsTrigger>
          <TabsTrigger
            value="child2"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Change Shift Requests
          </TabsTrigger>
          <TabsTrigger
            value="child3"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parent">
          <ParentTab refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="child">
          <ShiftTable year={currentYear} month={currentMonth} refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="child2">
          <ChangeShifts refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="child3">
          <Reporting refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}