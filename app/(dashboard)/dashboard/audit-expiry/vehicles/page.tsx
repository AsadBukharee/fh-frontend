"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"

const HOST = API_URL;

interface AuditItem {
  id: string
  title: string
  subtitle: string
  days: number
  status: "before" | "after"
}

export default function Vehicles() {
  const [dates, setDates] = useState<AuditItem[]>([])
  const [alerts, setAlerts] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()
  const token = cookies.get("access_token")

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Authentication token missing")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [datesRes, alertsRes] = await Promise.all([
          fetch(`${HOST}/activity/vehicle-compliance-dates/`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }),
          fetch(`${HOST}/activity/vehicle-compliance-alerts/`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          })
        ])

        if (!datesRes.ok || !alertsRes.ok) {
          throw new Error(`HTTP ${datesRes.status || alertsRes.status}`)
        }

        const datesJson = await datesRes.json()
        const alertsJson = await alertsRes.json()

        if (!datesJson.success || !alertsJson.success) {
          throw new Error(datesJson.message || alertsJson.message || "API error")
        }

        const d = datesJson.data[0]
        const a = alertsJson.data[0]

        const toStatusAndDays = (value: number | null | undefined, fallback: number): { days: number; status: "before" | "after" } => {
          if (value === null || value === undefined) value = fallback
          return {
            days: Math.abs(value),
            status: value >= 0 ? "after" : "before"
          }
        }

        setDates([
          { id: "next_mot_book_from", title: "Next MOT Book From", subtitle: "Alert before MOT expiry date", ...toStatusAndDays(d.next_mot_book_from, 60), status: "before" },
          { id: "pmi_expiry_alert", title: "PMI Expiry Alert", subtitle: "Alert after PMI expiry", ...toStatusAndDays(d.pmi_expiry_date, 63), status: "after" },
          { id: "book_next_pmi_from", title: "Book Next PMI From", subtitle: "Alert before PMI expiry date", ...toStatusAndDays(d.book_next_pmi_from, 10), status: "before" },
          { id: "next_tacho_download", title: "Next Tacho Download Date", subtitle: "Alert after last tacho download", ...toStatusAndDays(d.next_tacho_download_date, 28), status: "after" },
          { id: "next_tyre_maintenance", title: "Next Tyre Maintenance Check", subtitle: "Alert after last tyre check", ...toStatusAndDays(d.next_tyre_maintenance_check_date, 60), status: "after" }
        ])

        setAlerts([
          { id: "mot_book_alert", title: "Next MOT Book From", subtitle: "Show alert from this date onwards", ...toStatusAndDays(a.next_mot_book_from, 0), status: "after" },
          { id: "pmi_book_alert", title: "Book Next PMI From", subtitle: "Show alert from this date onwards", ...toStatusAndDays(a.book_next_pmi_from, 0), status: "after" },
          { id: "tacho_download_alert", title: "Next Tacho Download Date", subtitle: "Show alert before due date", ...toStatusAndDays(a.next_tacho_download_date, -2), status: "before" },
          { id: "tyre_maintenance_alert", title: "Next Tyre Maintenance Check", subtitle: "Show alert before due date", ...toStatusAndDays(a.next_tyre_maintenance_check_date, -2), status: "before" },
          { id: "tax_expiry", title: "Tax", subtitle: "Show alert before tax expiry", ...toStatusAndDays(a.tax, -7), status: "before" },
          { id: "insurance_expiry", title: "Insurance", subtitle: "Show alert before insurance expiry", ...toStatusAndDays(a.insurance, -30), status: "before" },
          { id: "tacho_calibration", title: "Tacho Calibration", subtitle: "Show alert before calibration due", ...toStatusAndDays(a.tacho_calibration, -45), status: "before" },
          { id: "loller_calibration", title: "Loller Calibration", subtitle: "Show alert before Loller test due", ...toStatusAndDays(a.loller_calibration, -45), status: "before" }
        ])

      } catch (err: any) {
        setError("Failed to load settings: " + err.message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const updateDays = (items: AuditItem[], setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>, id: string, value: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, days: Math.max(0, value) } : i))
  }

  const toggleStatus = (items: AuditItem[], setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>, id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: i.status === "before" ? "after" : "before" } : i))
  }

  const handleSave = async () => {
    if (!token) {
      alert("Not authenticated")
      return
    }

    setSaving(true)
    try {
      const toApiValue = (item: AuditItem) => item.status === "before" ? -item.days : item.days

      const datesPayload = {
        next_mot_book_from: toApiValue(dates.find(i => i.id === "next_mot_book_from")!),
        pmi_expiry_date: toApiValue(dates.find(i => i.id === "pmi_expiry_alert")!),
        book_next_pmi_from: toApiValue(dates.find(i => i.id === "book_next_pmi_from")!),
        next_tacho_download_date: toApiValue(dates.find(i => i.id === "next_tacho_download")!),
        next_tyre_maintenance_check_date: toApiValue(dates.find(i => i.id === "next_tyre_maintenance")!)
      }

      const alertsPayload = {
        next_mot_book_from: toApiValue(alerts.find(i => i.id === "mot_book_alert")!),
        book_next_pmi_from: toApiValue(alerts.find(i => i.id === "pmi_book_alert")!),
        next_tacho_download_date: toApiValue(alerts.find(i => i.id === "tacho_download_alert")!),
        next_tyre_maintenance_check_date: toApiValue(alerts.find(i => i.id === "tyre_maintenance_alert")!),
        tax: toApiValue(alerts.find(i => i.id === "tax_expiry")!),
        insurance: toApiValue(alerts.find(i => i.id === "insurance_expiry")!),
        tacho_calibration: toApiValue(alerts.find(i => i.id === "tacho_calibration")!),
        loller_calibration: toApiValue(alerts.find(i => i.id === "loller_calibration")!)
      }

      const [res1, res2] = await Promise.all([
        fetch(`${HOST}/activity/vehicle-compliance-dates/1/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(datesPayload)
        }),
        fetch(`${HOST}/activity/vehicle-compliance-alerts/1/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(alertsPayload)
        })
      ])

      if (!res1.ok || !res2.ok) {
        const err1 = await res1.text().catch(() => "")
        const err2 = await res2.text().catch(() => "")
        throw new Error(`Save failed: ${err1 || err2}`)
      }

      alert("Vehicle compliance settings saved successfully!")
    } catch (err: any) {
      console.error(err)
      alert("Failed to save: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const renderList = (items: AuditItem[], setItems: any) => {
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
            onChange={(e) => updateDays(items, setItems, item.id, Number(e.target.value) || 0)}
            className="w-16 h-8 text-center text-sm border-gray-300"
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
            <div className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-300 
              ${item.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}>
              <div className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                ${item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}></div>
            </div>
            <span className={`text-sm font-medium capitalize transition-colors duration-300 
              ${item.status === "before" ? "text-pink-600" : "text-orange-600"}`}>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
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
          <h1 className="text-lg font-semibold text-gray-800">Vehicle Compliance Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configure alert timing for vehicle compliance items</p>
        </div>

        <Tabs defaultValue="dates" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="dates">Compliance Dates</TabsTrigger>
            <TabsTrigger value="alerts">Alert Thresholds</TabsTrigger>
          </TabsList>

          <TabsContent value="dates" className="mt-6">
            <div className="grid grid-cols-12 gap-4 py-6 px-2 border-b bg-gray-100 border-gray-200">
              <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">Audit Item</div>
              <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">Days</div>
              <div className="col-span-3 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">Trigger</div>
            </div>
            <div className="bg-white px-2">{renderList(dates, setDates)}</div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="grid grid-cols-12 gap-4 py-6 px-2 border-b bg-gray-100 border-gray-200">
              <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">Audit Item</div>
              <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">Days</div>
              <div className="col-span-3 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">Trigger</div>
            </div>
            <div className="bg-white px-2">{renderList(alerts, setAlerts)}</div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={handleSave}
            className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-6 text-lg font-medium"
            disabled={loading || saving}
          >
            {saving ? "Saving Changes..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}