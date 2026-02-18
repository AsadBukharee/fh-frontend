"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComplianceDatesTab } from "./components/ComplianceDatesTab"
import { ComplianceAlertsTab } from "./components/ComplianceAlertsTab"

export default function Vehicles() {
  return (
    <div className="min-h-screen relative p-3 bg-white">
      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Vehicle Compliance Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configure alert timing for vehicle compliance items</p>
        </div>

        <Tabs defaultValue="dates" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="dates">Compliance Dates</TabsTrigger>
            <TabsTrigger value="alerts">Compliance Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="dates">
            <ComplianceDatesTab />
          </TabsContent>

          <TabsContent value="alerts">
            <ComplianceAlertsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}