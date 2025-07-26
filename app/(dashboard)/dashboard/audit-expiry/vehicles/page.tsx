"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AuditItem {
  id: string
  title: string
  subtitle: string
  days: number
  status: "after" | "before"
}

export default function Vehicles() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([
    { id: "mot-expiry", title: "MOT Expiry", subtitle: "Alert Before MOT Expiry", days: 35, status: "after" },
    { id: "time-mot-booked", title: "Time MOT Booked", subtitle: "Alert After Time MOT Booked", days: 45, status: "before" },
    { id: "last-pmi-date", title: "Last PMI Date", subtitle: "Alert Before Last PMI Date", days: 35, status: "after" },
    { id: "vehicle-tacho-download", title: "Last Vehicle Tacho Download", subtitle: "Alert Before Last Vehicle Tacho Download", days: 35, status: "after" },
    { id: "tyre-maintenance-check", title: "Last Tyre Maintenance Check", subtitle: "Alert After Last Tyre Maintenance Check", days: 45, status: "before" },
    { id: "vehicle-excise-expiry", title: "Vehicle Excise Expiry", subtitle: "Alert Before Vehicle Excise Expiry", days: 35, status: "after" },
    { id: "vehicle-insurance-expiry", title: "Vehicle Insurance Expiry", subtitle: "Alert After Vehicle Insurance Expiry", days: 45, status: "before" },
    { id: "tacho-call-expiry", title: "Tacho Call Expiry", subtitle: "Alert After Tacho Call Expiry", days: 45, status: "before" },
    { id: "loler-test-expiry", title: "Loler Test Expiry", subtitle: "Alert After Loler Test Expiry", days: 45, status: "before" },
    { id: "vehicle-equipment-check", title: "Vehicle Equipment Check", subtitle: "Alert After Vehicle Equipment Check", days: 45, status: "before" },
    { id: "vehicle-valid-check", title: "Vehicle Valid Check", subtitle: "Alert Before Vehicle Valid Check", days: 35, status: "after" },
  ])

  const updateDays = (id: string, newDays: number) => {
    setAuditItems((items) => items.map((item) => (item.id === id ? { ...item, days: newDays } : item)))
  }

  const toggleStatus = (id: string) => {
    setAuditItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: item.status === "after" ? "before" : "after" } : item
      )
    )
  }

  const handleSave = () => {
    console.log("Saving audit items:", auditItems)
  }

  return (
    <div className="min-h-screen p-3 bg-white">
      <div className=" mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Vehicle</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days for each audit Offer</p>
        </div>

        <div className=" ">
          <div className="grid grid-cols-12 gap-4 py-6 px-2  pb-4 border-b bg-gray-100 border-gray-200">
            <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">AUDIT ITEM</div>
            <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DAYS</div>
          </div>

          <div className="space-y-0 bg-white px-2">
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
            <Button onClick={handleSave} className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-2">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}