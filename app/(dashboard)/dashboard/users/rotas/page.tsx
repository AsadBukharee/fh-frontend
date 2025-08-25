"use client"

import  { ShiftTable } from "@/components/Rota/ChildTab"
import ParentTab from "@/components/Rota/ParentTab"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Rota() {
  const currentYear = 2025
  const currentMonth = 7 
  return (
    <div className="p-6 space-y-4 bg-white">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rota Master Control</h1>
        <p className="text-sm text-gray-500">Advanced staff pattern and schedule management system</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="parent" className="w-full">
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
        </TabsList>

        <TabsContent value="parent">
          <ParentTab/>
        </TabsContent>
        <TabsContent value="child">
        <ShiftTable year={currentYear} month={currentMonth} />

        </TabsContent>
      </Tabs>
    </div>
  )
}
