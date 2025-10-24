
"use client"


import SUHistoryScreen from "@/components/sudatascreen/data/SUdataHistory"
import SUTodayScreen from "@/components/sudatascreen/data/SUTodayScreen"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SUScreen() {

  return (
    <div className="p-6 space-y-4 bg-white">
    
      
      <Tabs defaultValue="parent" className="w-full">
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
          <TabsTrigger
            value="parent"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
           SU Data Today Screen
          </TabsTrigger>
          <TabsTrigger
            value="child"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "

          >
            SU Data Screen History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parent">
          <SUTodayScreen/>
        </TabsContent>
        <TabsContent value="child">
        <SUHistoryScreen/>

        </TabsContent>
      </Tabs>
    </div>
  )
}
