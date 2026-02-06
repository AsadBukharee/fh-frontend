"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface AuditItem {
  id: string
  title: string
  subtitle: string
  days: number        // always positive in UI
  status: "before" | "after"
}

export default function Drivers() {
  const [dates, setDates] = useState<AuditItem[]>([])
  const [alerts, setAlerts] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const HOST = API_URL
  const cookies = useCookies()
  const token = cookies.get("access_token")

  // Helper: Convert API value → UI state
  const apiToUI = (value: number | null | undefined, defaultPositive: number): { days: number; status: "before" | "after" } => {
    const val = value ?? defaultPositive
    // If API value is negative, it means "after" in UI
    // If API value is positive, it means "before" in UI
    return {
      days: Math.abs(val),
      status: val > 0 ? "after" : "before" // REVERSED based on your comment
    }
  }

  // Helper: Convert UI state → API value
  // According to comment: "in after we send positive and in before we send negative"
  const uiToApi = (days: number, status: "before" | "after"): number => {
    return status === "after" ? Math.abs(days) : -Math.abs(days)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!HOST || !token) {
        setError("Missing API host or authentication")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [datesRes, alertsRes] = await Promise.all([
          fetch(`${HOST}/activity/driver-compliance-dates/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${HOST}/activity/driver-compliance-alerts/1/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
        ])

        if (!datesRes.ok || !alertsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const datesJson = await datesRes.json()
        const alertsJson = await alertsRes.json()

        if (!datesJson.success || !alertsJson.success) {
          throw new Error(datesJson.message || alertsJson.message || "API error")
        }

        const d = datesJson.data[0]
        const a = alertsJson.data

        // Transform API → UI (with reversed before/after logic)
        setDates([
          {
            id: "next_check_code",
            title: "Next Driver Check Code Due (Date to be shown after last driver check code)  ",
            subtitle: "Last Driver Check Code ",
            ...apiToUI(d.next_driver_check_code_due, 60),
          },
          {
            id: "next_tacho_download_dates",
            title: "Next Driver Tacho Download Due (Date to be shown after last driver tacho download) ",
            subtitle: "Last Driver Tacho Download ",
            ...apiToUI(d.next_tacho_download, 28),
          },
        ])
        setAlerts([
          {
            id: "alert_check_code",
            title: "Next Driver Check Code Due",
            subtitle: "Alert before Next Driver Check Code Due",
            ...apiToUI(a.next_driver_check_code_due, 3)
          },
          {
            id: "license_expiry",
            title: "License Expiry",
            subtitle: "Alert before License Expiry Date",
            ...apiToUI(a.license_expiry, 60)
          },
          {
            id: "d_d1_category_expiry",
            title: "D/D1 Category Expiry",
            subtitle: "Alert before D/D1 Category Expiry",
            ...apiToUI(a.d_d1_category_expiry, 60)
          },
          {
            id: "tacho_expiry",
            title: "Tacho Card Expiry",
            subtitle: "Alert before Tacho Card Expiry Date",
            ...apiToUI(a.tacho_card_expiry, 60)
          },
          {
            id: "dbs_expiry",
            title: "DBS Expiry Date",
            subtitle: "Alert before DBS Expiry",
            ...apiToUI(a.dbs_expiry, 45)
          },
          {
            id: "cpc_dqc_expiry",
            title: "CPC/DQC Expiry Date",
            subtitle: "Alert before CPC/DQC Expiry",
            ...apiToUI(a.cpc_dqc_expiry, 120)
          },
          {
            id: "alert_tacho_download",
            title: "Next Driver Tacho Download",
            subtitle: "Alert Before Next Driver Tacho Download",
            ...apiToUI(a.next_tacho_download, 7)
          },
          {
            id: "night_worker",
            title: "Night Worker Assessment Due",
            subtitle: "Alert before Night Worker Assessment Due",
            ...apiToUI(a.night_worker_assessment, 2)
          },
        ])
      } catch (err: any) {
        setError(err.message || "Failed to load compliance settings")
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [HOST, token])

  const updateDays = (
    items: AuditItem[],
    setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>,
    id: string,
    value: number
  ) => {
    const num = value < 0 ? 0 : value
    setItems(prev => prev.map(i => i.id === id ? { ...i, days: num } : i))
  }

  const toggleStatus = (
    items: AuditItem[],
    setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>,
    id: string
  ) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: i.status === "before" ? "after" : "before" } : i))
  }

  // Save BOTH endpoints correctly
  const handleSave = async () => {
    if (!HOST || !token) return

    setSaving(true)
    try {
      // Save Dates (only 2 fields)
      const datesPayload = {
        next_driver_check_code_due: uiToApi(
          dates.find(i => i.id === "next_check_code")?.days ?? 60,
          dates.find(i => i.id === "next_check_code")?.status ?? "before"
        ),
        next_tacho_download: uiToApi(
          dates.find(i => i.id === "next_tacho_download_dates")?.days ?? 28,
          dates.find(i => i.id === "next_tacho_download_dates")?.status ?? "before"
        ),
      }

      // Save Alerts (all fields)
      const alertsPayload = {
        next_driver_check_code_due: uiToApi(alerts.find(i => i.id === "alert_check_code")?.days ?? 3, alerts.find(i => i.id === "alert_check_code")?.status ?? "before"),
        license_expiry: uiToApi(alerts.find(i => i.id === "license_expiry")?.days ?? 60, alerts.find(i => i.id === "license_expiry")?.status ?? "before"),
        d_d1_category_expiry: uiToApi(alerts.find(i => i.id === "d_d1_category_expiry")?.days ?? 60, alerts.find(i => i.id === "d_d1_category_expiry")?.status ?? "before"),
        tacho_card_expiry: uiToApi(alerts.find(i => i.id === "tacho_expiry")?.days ?? 60, alerts.find(i => i.id === "tacho_expiry")?.status ?? "before"),
        dbs_expiry: uiToApi(alerts.find(i => i.id === "dbs_expiry")?.days ?? 45, alerts.find(i => i.id === "dbs_expiry")?.status ?? "before"),
        cpc_dqc_expiry: uiToApi(alerts.find(i => i.id === "cpc_dqc_expiry")?.days ?? 120, alerts.find(i => i.id === "cpc_dqc_expiry")?.status ?? "before"),
        next_tacho_download: uiToApi(alerts.find(i => i.id === "alert_tacho_download")?.days ?? 7, alerts.find(i => i.id === "alert_tacho_download")?.status ?? "before"),
        night_worker_assessment: uiToApi(alerts.find(i => i.id === "night_worker")?.days ?? 2, alerts.find(i => i.id === "night_worker")?.status ?? "before"),
      }

      const [datesRes, alertsRes] = await Promise.all([
        fetch(`${HOST}/activity/driver-compliance-dates/1/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(datesPayload),
        }),
        fetch(`${HOST}/activity/driver-compliance-alerts/1/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(alertsPayload),
        }),
      ])

      if (!datesRes.ok || !alertsRes.ok) {
        const err1 = await datesRes.json().catch(() => ({}))
        const err2 = await alertsRes.json().catch(() => ({}))
        throw new Error(err1.message || err2.message || "Failed to save")
      }

      alert("All settings saved successfully!")
    } catch (err: any) {
      console.error("Save error:", err)
      alert("Save failed: " + (err.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const renderList = (items: AuditItem[], setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>) => {
    return items.map((item) => (
      <div key={item.id} className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0">
        <div className="col-span-7">
          <div className="font-medium text-gray-900 text-sm">{item.title}</div>
          <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
        </div>

        <div className="col-span-2 flex justify-center">
          <Input
            type="number"
            value={item.days}
            onChange={(e) => updateDays(items, setItems, item.id, Number.parseInt(e.target.value) || 0)}
            className="w-16 h-8 text-center text-sm"
            min="0"
            disabled={loading || saving}
          />
        </div>

        <div className="col-span-3 flex items-center justify-center">
          <label className="flex items-center cursor-pointer space-x-2">
            <input
              type="checkbox"
              checked={item.status === "after"}
              onChange={() => toggleStatus(items, setItems, item.id)}
              className="hidden"
              disabled={loading || saving}
            />
            <div className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-300 ${
              item.status === "before" ? "bg-pink-100" : "bg-orange-100"
            }`}>
              <div className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300 ${
                item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"
              }`}></div>
            </div>
            <span className={`text-sm font-medium capitalize transition-colors duration-300 ${
              item.status === "before" ? "text-pink-600" : "text-orange-600"
            }`}>
              {item.status}
            </span>
          </label>
        </div>
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-pink-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center">
        <div>
          <p className="text-red-600 font-medium">Error</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative p-3 bg-white">
      {(loading || saving) && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      )}

      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days for each audit alert</p>
        </div>

        <Tabs defaultValue="dates" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="dates">Driver Compliance Dates</TabsTrigger>
            <TabsTrigger value="alerts">Driver Compliance Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="dates" className="mt-6">
            <div className="grid grid-cols-12 gap-4 py-6 px-2 border-b bg-gray-100 border-gray-200">
              <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">AUDIT ITEM</div>
              <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DAYS</div>
              <div className="col-span-3 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">TRIGGER</div>
            </div>
            <div className="bg-white px-2">
              {renderList(dates, setDates)}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="grid grid-cols-12 gap-4 py-6 px-2 border-b bg-gray-100 border-gray-200">
              <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">AUDIT ITEM</div>
              <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DAYS</div>
              <div className="col-span-3 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">TRIGGER</div>
            </div>
            <div className="bg-white px-2">
              {renderList(alerts, setAlerts)}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-6 border-t border-white">
          <Button
            onClick={handleSave}
            className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-2"
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}