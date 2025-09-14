
"use client"


import FuelCard from "@/components/fuel-check/tabs/FuelCard"
import FuelChecksManagement from "@/components/fuel-check/tabs/FuelCheck"
import FuelHistory from "@/components/fuel-check/tabs/FuelHistory"


import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function FuelCheck() {

  return (
    <div className="p-6 space-y-4 bg-white">
    
      
      <Tabs defaultValue="parent" className="w-full">
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
          <TabsTrigger
            value="parent"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Today' Fuel Usage
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
