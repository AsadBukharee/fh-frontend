
"use client"

import { useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import FuelCard from "@/components/fuel-check/tabs/FuelCard"
import FuelChecksManagement from "@/components/fuel-check/tabs/FuelCheck"
import FuelHistory from "@/components/fuel-check/tabs/FuelHistory"


import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function FuelCheck() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "parent"

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  return (
    <div className="p-6 space-y-4 bg-white">
    
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
          <TabsTrigger
            value="parent"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Today&apos; Fuel Usage
          </TabsTrigger>
          <TabsTrigger
            value="child"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "

          >
            Fuel Usage History
          </TabsTrigger>
            <TabsTrigger
            value="child2"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "

          >
           Fuel Cards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parent">
          <FuelChecksManagement/>
        </TabsContent>
        <TabsContent value="child">
        <FuelHistory/>

        </TabsContent>
         <TabsContent value="child2">
        <FuelCard/>

        </TabsContent>
      </Tabs>
    </div>
  )
}
