"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

// Utility function to transform ID to title
const formatTitle = (id: string) => {
  return id
    .replace(/_/g, ' ') // Replace underscores with spaces
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

const API = `${API_URL}/activity/audit-expiry-vehicle/`

// 🔄 API → UI
const transformFromApi = (data: any): AuditItem[] => [
  {
    id: "next_mot_to_be_booked_from",
    title: formatTitle("next_mot_to_be_booked_from"),
    subtitle: "Alert Before MOT Expiry",
    days: Math.abs(data.next_mot_to_be_booked_from),
    status: data.next_mot_to_be_booked_from < 0 ? "before" : "after",
  },
  {
    id: "pre_mot_check",
    title: formatTitle("pre_mot_check"),
    subtitle: "Alert After Time MOT Booked",
    days: Math.abs(data.pre_mot_check),
    status: data.pre_mot_check < 0 ? "before" : "after",
  },
  {
    id: "next_inspection_to_be_booked_before",
    title: formatTitle("next_inspection_to_be_booked_before"),
    subtitle: "Alert Before Last PMI Date",
    days: Math.abs(data.next_inspection_to_be_booked_before),
    status: data.next_inspection_to_be_booked_before < 0 ? "before" : "after",
  },
  {
    id: "pre_inspection_check",
    title: formatTitle("pre_inspection_check"),
    subtitle: "Alert After Pre Inspection Check",
    days: Math.abs(data.pre_inspection_check),
    status: data.pre_inspection_check < 0 ? "before" : "after",
  },
  {
    id: "next_vehicle_tacho_download_date",
    title: formatTitle("next_vehicle_tacho_download_date"),
    subtitle: "Alert Before Last Vehicle Tacho Download",
    days: Math.abs(data.next_vehicle_tacho_download_date),
    status: data.next_vehicle_tacho_download_date < 0 ? "before" : "after",
  },
  {
    id: "next_tyre_maintenance_check",
    title: formatTitle("next_tyre_maintenance_check"),
    subtitle: "Alert After Last Tyre Maintenance Check",
    days: Math.abs(data.next_tyre_maintenance_check),
    status: data.next_tyre_maintenance_check < 0 ? "before" : "after",
  },
  {
    id: "book_next_tacho_cali_from",
    title: formatTitle("book_next_tacho_cali_from"),
    subtitle: "Alert After Tacho Cali Expiry",
    days: Math.abs(data.book_next_tacho_cali_from),
    status: data.book_next_tacho_cali_from < 0 ? "before" : "after",
  },
  {
    id: "next_tacho_cali_booked_date",
    title: formatTitle("next_tacho_cali_booked_date"),
    subtitle: "Alert After Tacho Cali Booked",
    days: Math.abs(data.next_tacho_cali_booked_date),
    status: data.next_tacho_cali_booked_date < 0 ? "before" : "after",
  },
  {
    id: "next_loller_test_to_be_booked_from",
    title: formatTitle("next_loller_test_to_be_booked_from"),
    subtitle: "Alert After Loler Test Expiry",
    days: Math.abs(data.next_loller_test_to_be_booked_from),
    status: data.next_loller_test_to_be_booked_from < 0 ? "before" : "after",
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
    next_mot_to_be_booked_from: getVal("next_mot_to_be_booked_from"),
    pre_mot_check: getVal("pre_mot_check"),
    next_inspection_to_be_booked_before: getVal("next_inspection_to_be_booked_before"),
    pre_inspection_check: getVal("pre_inspection_check"),
    next_vehicle_tacho_download_date: getVal("next_vehicle_tacho_download_date"),
    next_tyre_maintenance_check: getVal("next_tyre_maintenance_check"),
    book_next_tacho_cali_from: getVal("book_next_tacho_cali_from"),
    next_tacho_cali_booked_date: getVal("next_tacho_cali_booked_date"),
    next_loller_test_to_be_booked_from: getVal("next_loller_test_to_be_booked_from"),
  }
}

export default function Vehicles() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const token = useCookies().get("access_token")

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (json.success && json.data.length > 0) {
          setAuditItems(transformFromApi(json.data[0]))
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
    <div className="min-h-screen relative p-3 bg-white">
      {loading && (
        <div className=" absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      )}
      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Vehicle</h1>
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
                {/* Title */}
                <div className="col-span-7">
                  <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                </div>

                {/* Input */}
                <div className="col-span-2 flex justify-center">
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) => updateDays(item.id, Number(e.target.value) || 0)}
                    className="w-16 h-8 text-center text-sm border-gray-300"
                    min="0"
                  />
                </div>

                {/* Toggle */}
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

          {/* Save Button */}
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