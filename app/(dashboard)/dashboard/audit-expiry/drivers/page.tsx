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

export default function Drivers() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([
    { id: "license-expiry", title: "License Expiry", subtitle: "Alert Before Drivers License Expiry", days: 35, status: "after" },
    { id: "d-category-expiry", title: "D Category Expiry", subtitle: "Alert Before D Category Expiry", days: 35, status: "after" },
    { id: "last-code-expiry", title: "Last Code Expiry", subtitle: "Alert After Last Code Expiry", days: 45, status: "before" },
    { id: "last-code-check", title: "Last Code Check", subtitle: "Alert Before Last Code Check", days: 35, status :"after" },
    { id: "tacho-expiry", title: "Tacho Expiry", subtitle: "Alert After Tacho Expiry", days: 35, status: "after" },
    { id: "last-tacho-download", title: "Last Tacho Download", subtitle: "Alert Before Last Tacho Download", days: 45, status: "before" },
    { id: "cpc-expiry", title: "CPC Expiry", subtitle: "Alert Before CPC Expiry", days: 35, status: "after" },
    { id: "dbs-expiry", title: "DBS Expiry", subtitle: "Alert After DBS Expiry", days: 45, status: "before" },
    { id: "night-worker-assessment", title: "Night Worker Assessment", subtitle: "Alert Before Night Worker Assessment", days: 45, status: "before" },
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
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto bg-white">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-600 mt-1">Enter number of days for each audit Other</p>
        </div>

        <div className="p-2">
          <div className="grid px-2 py-2 grid-cols-12 gap-4 pb-4 border-b bg-gray-100 border-gray-200">
            <div className="col-span-7 text-sm font-medium text-gray-500 uppercase tracking-wide">AUDIT ITEM</div>
            <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">DAYS</div>
          </div>

          <div className="space-y-0 px-2">
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

          <div className="mt-8 pt-6 w-full border-t border-gray-200">
            <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-2">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}