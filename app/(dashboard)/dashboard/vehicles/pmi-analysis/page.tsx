"use client"

import { useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import PMIDashboard from "@/components/pmi/PMIDriver"
import PMIHistory from "@/components/pmi/PMIHistory"
import PMITabs from "@/components/pmi/PmiTabs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function PMI() {
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
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
          >
            PMI Analysis - Maintenance
          </TabsTrigger>
          <TabsTrigger
            value="driver"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
          >
            PMI Analysis - Driver
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
          >
            PMI History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parent">
          <PMITabs />
        </TabsContent>
        <TabsContent value="driver">
          <PMIDashboard />
        </TabsContent>
        <TabsContent value="history">
          <PMIHistory/>
        </TabsContent>
      </Tabs>
    </div>
  )
}