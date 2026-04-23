"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceDatesTab } from "./components/ComplianceDatesTab";
import { ComplianceAlertsTab } from "./components/ComplianceAlertsTab";

export default function Drivers() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dates";

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen relative p-3 bg-white">
      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days for each audit alert</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="dates">Driver Compliance Dates</TabsTrigger>
            <TabsTrigger value="alerts">Driver Compliance Tasks</TabsTrigger>
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
  );
}