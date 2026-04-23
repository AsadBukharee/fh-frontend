
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import VehiclesPage from "@/components/Vehicles/Tabs/VehicleTab"
import VehicleTypeTab from "@/components/Vehicles/Tabs/VehicleTypeTab"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Badge } from "@/components/ui/badge"

export default function Vehciles() {
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null)
  const cookies = useCookies()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "assigned"

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  useEffect(() => {
    const fetchUnassignedCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vehicles/no-site/?page=1&per_page=1`, {
          headers: {
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (response.ok) {
          const json = await response.json()
          if (json.success && json.stats) {
            setUnassignedCount(json.stats.total)
          }
        }
      } catch (error) {
        console.error("Failed to fetch unassigned count:", error)
      }
    }

    fetchUnassignedCount()
  }, [cookies])

  return (
    <div className="p-6 space-y-4 bg-white">
    
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
          <TabsTrigger
            value="assigned"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Assigned Sites
          </TabsTrigger>
          <TabsTrigger
            value="unassigned"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "
          >
            Unassigned Sites
            {unassignedCount !== null && (
              <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white border-none py-0 px-1.5 h-5 min-w-[20px] justify-center">
                {unassignedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="child"
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 "

          >
        Manage Vehicle Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned">
          <VehiclesPage activeTab="assigned" />
        </TabsContent>
        <TabsContent value="unassigned">
          <VehiclesPage activeTab="unassigned" />
        </TabsContent>
        <TabsContent value="child">
          <VehicleTypeTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
