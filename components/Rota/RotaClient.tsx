"use client"

import { useState } from "react"
import ChangeShifts from "@/components/Rota/ChangeShifts"
import { ShiftTable } from "@/components/Rota/ChildTab"
import ParentTab from "@/components/Rota/ParentTab"
import Reporting from "@/components/Rota/Reporting"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface RotaClientProps {
  initialReportingData: any
  contracts: any[]
  drivers: any[]
  shifts: any[]
  role: string
}

export default function RotaClient({
  initialReportingData,
  contracts,
  drivers,
  shifts,
  role
}: RotaClientProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "parent"

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    router.refresh()
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`?${params.toString()}`)
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
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
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
          <Reporting 
            refreshKey={refreshKey} 
            initialData={initialReportingData}
            contracts={contracts}
            drivers={drivers}
            shifts={shifts}
            role={role}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
