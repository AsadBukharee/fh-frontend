"use client"

import { useState, useEffect } from "react"
import { useCookies } from "next-client-cookies"
import { Button } from "@/components/ui/button"
import API_URL from "@/app/utils/ENV"
import { ComplianceList } from "./ComplianceList"
import { AuditItem } from "../types"
import { toStatusAndDays, toApiValue } from "../utils"
import { toast } from "sonner"

const HOST = API_URL

export function ComplianceAlertsTab() {
    const [alerts, setAlerts] = useState<AuditItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const cookies = useCookies()
    const token = cookies.get("access_token")

    const fetchData = async () => {
        if (!token) {
            setError("Authentication token missing")
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const res = await fetch(`${HOST}/activity/vehicle-compliance-alerts/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            })

            if (!res.ok) throw new Error("Failed to fetch compliance alerts")

            const json = await res.json()
            if (!json.success) throw new Error(json.message || "API error")

            // Map the dynamic array response
            const items: AuditItem[] = json.data.map((item: any, index: number) => ({
                id: `alert-${item.id}-${index}`,
                dbId: item.id,
                title: item.display_name,
                subtitle: item.field_description,
                fieldName: item.field_name,
                fieldReference: item.field_reference,
                ...toStatusAndDays(item.field_value, item.field_value)
            }))

            setAlerts(items)
        } catch (err: any) {
            setError(err.message || "Unknown error")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [token])

    const handleSave = async () => {
        if (!token) {
            toast.error("Not authenticated")
            return
        }

        setSaving(true)
        try {
            const payload = alerts.map(item => ({
                id: item.dbId,
                display_name: item.title,
                field_description: item.subtitle,
                field_reference: item.fieldReference,
                field_value: toApiValue(item)
            }))

            const res = await fetch(`${HOST}/activity/vehicle-compliance-alerts/bulk_update/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                // Fallback to the original endpoint if bulk_update doesn't exist
                const fallbackRes = await fetch(`${HOST}/activity/vehicle-compliance-alerts/1/`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                })
                if (!fallbackRes.ok) throw new Error("Failed to save settings")
            }

            toast.success("Compliance alerts saved successfully!")
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to save: " + (err.message || "Unknown error"))
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateItem = async (updatedItem: AuditItem) => {
        if (!token) return

        try {
            const payload = {
                id: updatedItem.dbId,
                display_name: updatedItem.title,
                field_description: updatedItem.subtitle,
                field_reference: updatedItem.fieldReference,
                field_value: toApiValue(updatedItem)
            }

            const res = await fetch(`${HOST}/activity/vehicle-compliance-alerts/${updatedItem.dbId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Failed to update item")

            toast.success(`${updatedItem.title} updated successfully`)
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to update field: " + (err.message || "Unknown error"))
        }
    }

    const handleCreateItem = async (newItem: Omit<AuditItem, "id" | "dbId">) => {
        if (!token) {
            toast.error("Not authenticated")
            return
        }

        try {
            // Construct payload based on user requirement
            const payload = {
                display_name: newItem.title,
                // Alert doesn't have field_name in the example payload
                field_description: newItem.subtitle,
                field_reference: newItem.fieldReference,
                field_value: toApiValue(newItem),
            }

            const res = await fetch(`${HOST}/activity/vehicle-compliance-alerts/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || "Failed to create item")
            }

            toast.success(`${newItem.title} created successfully`)
            // Refresh list
            fetchData()
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to create: " + (err.message || "Unknown error"))
            throw err
        }
    }

    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded mt-4">{error}</div>

    return (
        <div className="mt-6">
            <ComplianceList
                type="alert"
                items={alerts}
                setItems={setAlerts}
                loading={loading}
                saving={saving}
                onUpdateItem={handleUpdateItem}
                onCreateItem={handleCreateItem}
            />

            <div className="mt-8 pt-6 border-t border-gray-200 px-2">
                <Button
                    onClick={handleSave}
                    className="bg-pink-500 w-full hover:bg-pink-600 text-white py-6 text-lg font-medium"
                    disabled={loading || saving}
                >
                    {saving ? "Saving Changes..." : "Save Compliance Alerts"}
                </Button>
            </div>
        </div>
    )
}
