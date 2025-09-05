
"use client"


import LocationTabs from "@/components/sites/LocationTabs"
import SiteGrid from "@/components/sites/SiteTabs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Sites() {

  return (
    <div className="p-6 space-y-4 bg-white">
    
      
      <Tabs defaultValue="parent" className="w-full">
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
          <TabsTrigger
            value="parent"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Sites Management
          </TabsTrigger>
          <TabsTrigger
            value="child"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "

          >
            Locations Managements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parent">
          <SiteGrid/>
        </TabsContent>
        <TabsContent value="child">
        <LocationTabs/>

        </TabsContent>
      </Tabs>
    </div>
  )
}
