"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

// Utility function to transform ID to title
const formatTitle = (id: string) => {
  return id
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

interface AuditItem {
  id: string
  title: string
  subtitle: string
  days: number
  status: "after" | "before"
}

const API = `${API_URL}/activity/audit-expiry-driver/`

// 🔄 API → UI
const transformFromApi = (data: any): AuditItem[] => [
  {
    id: "license_expiry",
    title: formatTitle("license_expiry"),
    subtitle: "Alert Before Drivers License Expiry",
    days: Math.abs(data.license_expiry),
    status: data.license_expiry < 0 ? "before" : "after",
  },
  {
    id: "d_category_expiry",
    title: formatTitle("d_category_expiry"),
    subtitle: "Alert Before D Category Expiry",
    days: Math.abs(data.d_category_expiry),
    status: data.d_category_expiry < 0 ? "before" : "after",
  },
  {
    id: "last_code_expiry",
    title: formatTitle("last_code_expiry"),
    subtitle: "Alert After Last Code Expiry",
    days: Math.abs(data.last_code_expiry),
    status: data.last_code_expiry < 0 ? "before" : "after",
  },
  {
    id: "last_code_check",
    title: formatTitle("last_code_check"),
    subtitle: "Alert Before Last Code Check",
    days: Math.abs(data.last_code_check),
    status: data.last_code_check < 0 ? "before" : "after",
  },
  {
    id: "tacho_expiry",
    title: formatTitle("tacho_expiry"),
    subtitle: "Alert After Tacho Expiry",
    days: Math.abs(data.tacho_expiry),
    status: data.tacho_expiry < 0 ? "before" : "after",
  },
  {
    id: "last_tacho_download",
    title: formatTitle("last_tacho_download"),
    subtitle: "Alert Before Last Tacho Download",
    days: Math.abs(data.last_tacho_download),
    status: data.last_tacho_download < 0 ? "before" : "after",
  },
  {
    id: "cpc_expiry",
    title: formatTitle("cpc_expiry"),
    subtitle: "Alert Before CPC Expiry",
    days: Math.abs(data.cpc_expiry),
    status: data.cpc_expiry < 0 ? "before" : "after",
  },
  {
    id: "dbs_expiry",
    title: formatTitle("dbs_expiry"),
    subtitle: "Alert After DBS Expiry",
    days: Math.abs(data.dbs_expiry),
    status: data.dbs_expiry < 0 ? "before" : "after",
  },
  {
    id: "night_worker_assessment",
    title: formatTitle("night_worker_assessment"),
    subtitle: "Alert Before Night Worker Assessment",
    days: Math.abs(data.night_worker_assessment),
    status: data.night_worker_assessment < 0 ? "before" : "after",
  },
]

// 🔄 UI → API
const transformToApi = (items: AuditItem[]) => {
  const getVal = (id: string) => {
    const i = items.find((x) => x.id === id)
    if (!i) return 0
    return i.status === "before" ? -Math.abs(i.days) : Math.abs(i.days)
  }
  return {
    id: 1,
    license_expiry: getVal("license_expiry"),
    d_category_expiry: getVal("d_category_expiry"),
    last_code_expiry: getVal("last_code_expiry"),
    last_code_check: getVal("last_code_check"),
    tacho_expiry: getVal("tacho_expiry"),
    last_tacho_download: getVal("last_tacho_download"),
    cpc_expiry: getVal("cpc_expiry"),
    dbs_expiry: getVal("dbs_expiry"),
    night_worker_assessment: getVal("night_worker_assessment"),
  }
}

export default function Drivers() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const token = useCookies().get("access_token")

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}1/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (json.success && json.data) {
          setAuditItems(transformFromApi(json.data))
        }
      } catch (err) {
        console.error("Error fetching audit data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // Update days
  const updateDays = (id: string, newDays: number) => {
    setAuditItems((items) =>
      items.map((item) => (item.id === id ? { ...item, days: newDays } : item))
    )
  }

  // Toggle before/after
  const toggleStatus = (id: string) => {
    setAuditItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: item.status === "after" ? "before" : "after" } : item
      )
    )
  }

  // Save data
  const handleSave = async () => {
    setLoading(true)
    const payload = transformToApi(auditItems)
    try {
      const res = await fetch(`${API}1/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      console.log("Saved successfully:", json)
    } catch (err) {
      console.error("Error saving audit items:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-3 bg-white">
      {loading && (
        <div className=" absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      )}
      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days for each audit alert</p>
        </div>

        <div>
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 py-6 px-2 border-b bg-gray-100 border-gray-200">
            <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">
              AUDIT ITEM
            </div>
            <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">
              DAYS
            </div>
          </div>

          {/* Items */}
          <div className="bg-white px-2">
            {auditItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="col-span-7">
                  <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) => updateDays(item.id, Number.parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-center text-sm border-gray-300"
                    min="0"
                  />
                </div>

                <div className="col-span-3 flex items-center justify-center">
                  <label className="flex items-center cursor-pointer space-x-2">
                    <input
                      type="checkbox"
                      checked={item.status === "after"}
                      onChange={() => toggleStatus(item.id)}
                      className="hidden"
                    />
                    <div
                      className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-300 
                      ${item.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                        ${item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}
                      ></div>
                    </div>
                    <span
                      className={`text-sm font-medium capitalize transition-colors duration-300 
                      ${item.status === "before" ? "text-pink-600" : "text-orange-600"}`}
                    >
                      {item.status}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white">
            <Button
              onClick={handleSave}
              className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-2"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}