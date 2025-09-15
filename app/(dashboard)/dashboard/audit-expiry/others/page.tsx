"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
  lastCheckDate: string | null
  directory: string | null
}

const API = `${API_URL}/activity/audit-expiry-others/`

// 🔄 API → UI
const transformFromApi = (data: any): AuditItem[] => [
  {
    id: "operator_compliance_score",
    title: formatTitle("operator_compliance_score"),
    subtitle: "Alert Before Operator Compliance Score",
    days: Math.abs(data.operator_compliance_score),
    status: data.operator_compliance_score < 0 ? "before" : "after",
    lastCheckDate: data.operator_compliance_score_reference_date,
    directory: data.operator_compliance_score_directory,
  },
  {
    id: "test_report_history",
    title: formatTitle("test_report_history"),
    subtitle: "Alert After Test Report History",
    days: Math.abs(data.test_report_history),
    status: data.test_report_history < 0 ? "before" : "after",
    lastCheckDate: data.test_report_history_reference_date,
    directory: data.test_report_history_directory,
  },
  {
    id: "vehicle_encounter_report",
    title: formatTitle("vehicle_encounter_report"),
    subtitle: "Alert Before Vehicle Encounter Report",
    days: Math.abs(data.vehicle_encounter_report),
    status: data.vehicle_encounter_report < 0 ? "before" : "after",
    lastCheckDate: data.vehicle_encounter_report_reference_date,
    directory: data.vehicle_encounter_report_directory,
  },
  {
    id: "yearly_maintenance_provider_audit",
    title: formatTitle("yearly_maintenance_provider_audit"),
    subtitle: "Alert After Yearly Maintenance Provider Audit",
    days: Math.abs(data.yearly_maintenance_provider_audit),
    status: data.yearly_maintenance_provider_audit < 0 ? "before" : "after",
    lastCheckDate: data.yearly_maintenance_provider_audit_reference_date,
    directory: data.yearly_maintenance_provider_audit_directory,
  },
  {
    id: "yearly_garage_equipment_audit",
    title: formatTitle("yearly_garage_equipment_audit"),
    subtitle: "Alert Before Yearly Garage Equipment Audit",
    days: Math.abs(data.yearly_garage_equipment_audit),
    status: data.yearly_garage_equipment_audit < 0 ? "before" : "after",
    lastCheckDate: data.yearly_garage_equipment_audit_reference_date,
    directory: data.yearly_garage_equipment_audit_directory,
  },
  {
    id: "vol_review",
    title: formatTitle("vol_review"),
    subtitle: "Alert Before VOL Review",
    days: Math.abs(data.vol_review),
    status: data.vol_review < 0 ? "before" : "after",
    lastCheckDate: data.vol_review_reference_date,
    directory: data.vol_review_directory,
  },
  {
    id: "transport_manager_refresher_check",
    title: formatTitle("transport_manager_refresher_check"),
    subtitle: "Alert After Transport Manager Refresher Check",
    days: Math.abs(data.transport_manager_refresher_check),
    status: data.transport_manager_refresher_check < 0 ? "before" : "after",
    lastCheckDate: data.transport_manager_refresher_check_reference_date,
    directory: data.transport_manager_refresher_check_directory,
  },
  {
    id: "transport_manager_cpc_card_check",
    title: formatTitle("transport_manager_cpc_card_check"),
    subtitle: "Alert After Transport Manager CPC Card Check",
    days: Math.abs(data.transport_manager_cpc_card_check),
    status: data.transport_manager_cpc_card_check < 0 ? "before" : "after",
    lastCheckDate: data.transport_manager_cpc_card_check_reference_date,
    directory: data.transport_manager_cpc_card_check_directory,
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
    operator_compliance_score: getVal("operator_compliance_score"),
    operator_compliance_score_reference_date: items.find((x) => x.id === "operator_compliance_score")?.lastCheckDate || null,
    operator_compliance_score_directory: items.find((x) => x.id === "operator_compliance_score")?.directory || null,
    test_report_history: getVal("test_report_history"),
    test_report_history_reference_date: items.find((x) => x.id === "test_report_history")?.lastCheckDate || null,
    test_report_history_directory: items.find((x) => x.id === "test_report_history")?.directory || null,
    vehicle_encounter_report: getVal("vehicle_encounter_report"),
    vehicle_encounter_report_reference_date: items.find((x) => x.id === "vehicle_encounter_report")?.lastCheckDate || null,
    vehicle_encounter_report_directory: items.find((x) => x.id === "vehicle_encounter_report")?.directory || null,
    yearly_maintenance_provider_audit: getVal("yearly_maintenance_provider_audit"),
    yearly_maintenance_provider_audit_reference_date: items.find((x) => x.id === "yearly_maintenance_provider_audit")?.lastCheckDate || null,
    yearly_maintenance_provider_audit_directory: items.find((x) => x.id === "yearly_maintenance_provider_audit")?.directory || null,
    yearly_garage_equipment_audit: getVal("yearly_garage_equipment_audit"),
    yearly_garage_equipment_audit_reference_date: items.find((x) => x.id === "yearly_garage_equipment_audit")?.lastCheckDate || null,
    yearly_garage_equipment_audit_directory: items.find((x) => x.id === "yearly_garage_equipment_audit")?.directory || null,
    vol_review: getVal("vol_review"),
    vol_review_reference_date: items.find((x) => x.id === "vol_review")?.lastCheckDate || null,
    vol_review_directory: items.find((x) => x.id === "vol_review")?.directory || null,
    transport_manager_refresher_check: getVal("transport_manager_refresher_check"),
    transport_manager_refresher_check_reference_date: items.find((x) => x.id === "transport_manager_refresher_check")?.lastCheckDate || null,
    transport_manager_refresher_check_directory: items.find((x) => x.id === "transport_manager_refresher_check")?.directory || null,
    transport_manager_cpc_card_check: getVal("transport_manager_cpc_card_check"),
    transport_manager_cpc_card_check_reference_date: items.find((x) => x.id === "transport_manager_cpc_card_check")?.lastCheckDate || null,
    transport_manager_cpc_card_check_directory: items.find((x) => x.id === "transport_manager_cpc_card_check")?.directory || null,
  }
}

export default function Others() {
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

  // Update days or lastCheckDate
  const updateItem = (id: string, field: 'days' | 'lastCheckDate', value: number | string) => {
    setAuditItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      )}
      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Others</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days and last check date for each audit alert</p>
        </div>

        {/* Header row */}
        <div className="grid px-3 py-4 grid-cols-12 gap-4 pb-4 border-b bg-gray-100 border-gray-200">
          <div className="col-span-4 text-sm font-medium text-gray-500 uppercase tracking-wide">AUDIT ITEM</div>
          <div className="col-span-3 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">LAST CHECK DATE</div>
          <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DAYS</div>
          <div className="col-span-1 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">STATUS</div>
          <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DIRECTORY</div>
        </div>

        {/* Data rows */}
        <div className="space-y-0 px-3">
          {auditItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0 items-center">
              {/* Title */}
              <div className="col-span-4">
                <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
              </div>

              {/* Last Check Date */}
              <div className="col-span-3 flex justify-center">
                <Input
                  type="date"
                  value={item.lastCheckDate || ''}
                  onChange={(e) => updateItem(item.id, 'lastCheckDate', e.target.value || '')}
                  className="w-40 h-8 text-center text-sm border-gray-300"
                />
              </div>

              {/* Days */}
              <div className="col-span-2 flex justify-center">
                <Input
                  type="number"
                  value={item.days}
                  onChange={(e) => updateItem(item.id, 'days', Number.parseInt(e.target.value) || 0)}
                  className="w-16 h-8 text-center text-sm border-gray-300"
                  min="0"
                />
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <label className="flex items-center cursor-pointer space-x-2">
                  <input
                    type="checkbox"
                    checked={item.status === "after"}
                    onChange={() => toggleStatus(item.id)}
                    className="hidden"
                  />
                  <div
                    className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300 
                      ${item.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                        ${item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}
                    ></div>
                  </div>
                </label>
              </div>

              {/* Directory */}
              <div className="col-span-2 text-center">
                {item.directory ? (
                  <Link
                    href={item.directory}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Open
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="my-8 w-full pt-6 border-t border-white">
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
  )
}