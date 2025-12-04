"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface AuditItem {
  id: string
  title: string
  subtitle: string
  days: number
  status: "after" | "before"
}

const API = `${API_URL}/activity/audit-expiry-driver/`

// Fixed mapping — this is the ONLY critical change
const transformFromApi = (data: any): AuditItem[] => [
  { id: "license_expiry",                  title: "License Expiry", subtitle: "Alert Before Drivers License Expiry", days: Math.abs(data.license_expiry ?? 0), status: (data.license_expiry ?? 0) < 0 ? "before" : "after" },
  { id: "d_d1_category_expiry",            title: "D/D1 Category Expiry", subtitle: "Alert Before D Category Expiry", days: Math.abs(data.d_d1_category_expiry ?? 0), status: (data.d_d1_category_expiry ?? 0) < 0 ? "before" : "after" },
  { id: "licence_check_code_expiry",       title: "Licence Check Code Expiry", subtitle: "Alert After Last Code Expiry", days: Math.abs(data.licence_check_code_expiry ?? 0), status: (data.licence_check_code_expiry ?? 0) < 0 ? "before" : "after" },
  { id: "days_after_last_license_check_cod", title: "Days After Last License Check Code", subtitle: "Alert After Last Code Check", days: Math.abs(data.days_after_last_license_check_cod ?? 0), status: (data.days_after_last_license_check_cod ?? 0) < 0 ? "before" : "after" },
  { id: "days_after_last_tacho_download",  title: "Days After Last Tacho Download", subtitle: "Alert After Last Tacho Download", days: Math.abs(data.days_after_last_tacho_download ?? 0), status: (data.days_after_last_tacho_download ?? 0) < 0 ? "before" : "after" },
  { id: "tacho_expiry",                    title: "Tacho Expiry", subtitle: "Alert Before Tacho Expiry", days: Math.abs(data.tacho_expiry ?? 0), status: (data.tacho_expiry ?? 0) < 0 ? "before" : "after" },
  { id: "last_tacho_download",             title: "Last Tacho Download", subtitle: "Alert After Last Tacho Download", days: Math.abs(data.last_tacho_download ?? 0), status: (data.last_tacho_download ?? 0) < 0 ? "before" : "after" },
  { id: "cpc_dqc_expiry",                  title: "CPC/DQC Expiry", subtitle: "Alert Before CPC Expiry", days: Math.abs(data.cpc_dqc_expiry ?? 0), status: (data.cpc_dqc_expiry ?? 0) < 0 ? "before" : "after" },
  { id: "dbs_expiry",                      title: "DBS Expiry", subtitle: "Alert Before DBS Expiry", days: Math.abs(data.dbs_expiry ?? 0), status: (data.dbs_expiry ?? 0) < 0 ? "before" : "after" },
  { id: "night_worker_assessment",         title: "Night Worker Assessment", subtitle: "Alert Before Night Worker Assessment", days: Math.abs(data.night_worker_assessment ?? 0), status: (data.night_worker_assessment ?? 0) < 0 ? "before" : "after" },
]

const transformToApi = (items: AuditItem[]) => {
  const v = (id: string) => {
    const i = items.find(x => x.id === id)
    return i ? (i.status === "before" ? -i.days : i.days) : 0
  }
  return {
    id: 1,
    license_expiry: v("license_expiry"),
    d_d1_category_expiry: v("d_d1_category_expiry"),
    licence_check_code_expiry: v("licence_check_code_expiry"),
    days_after_last_license_check_cod: v("days_after_last_license_check_cod"),
    days_after_last_tacho_download: v("days_after_last_tacho_download"),
    tacho_expiry: v("tacho_expiry"),
    last_tacho_download: v("last_tacho_download"),
    cpc_dqc_expiry: v("cpc_dqc_expiry"),
    dbs_expiry: v("dbs_expiry"),
    night_worker_assessment: v("night_worker_assessment"),
  }
}

export default function Drivers() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const token = useCookies().get("access_token")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}1/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success && json.data) {
          setAuditItems(transformFromApi(json.data))
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [token])

  const updateDays = (id: string, days: number) => {
    setAuditItems(prev => prev.map(i => i.id === id ? { ...i, days: days < 0 ? 0 : days } : i))
  }

  const toggleStatus = (id: string) => {
    setAuditItems(prev => prev.map(i => i.id === id ? { ...i, status: i.status === "before" ? "after" : "before" } : i))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch(`${API}1/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transformToApi(auditItems)),
      })
      alert("Saved successfully!")
    } catch (err) {
      alert("Save failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative p-3 bg-white">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      )}

      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days for each audit alert</p>
        </div>

        <div>
          <div className="grid grid-cols-12 gap-4 py-6 px-2 border-b bg-gray-100 border-gray-200">
            <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">AUDIT ITEM</div>
            <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DAYS</div>
          </div>

          <div className="bg-white px-2">
            {auditItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0">
                <div className="col-span-7">
                  <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) => updateDays(item.id, Number.parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-center text-sm "
                    min="0"
                  />
                </div>

                <div className="col-span-3 flex items-center justify-center">
                  <label className="flex items-center cursor-pointer space-x-2">
                    <input type="checkbox" checked={item.status === "after"} onChange={() => toggleStatus(item.id)} className="hidden" />
                    <div className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-300 ${item.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}>
                      <div className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300 ${item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}></div>
                    </div>
                    <span className={`text-sm font-medium capitalize transition-colors duration-300 ${item.status === "before" ? "text-pink-600" : "text-orange-600"}`}>
                      {item.status}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white">
            <Button onClick={handleSave} className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-2" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}