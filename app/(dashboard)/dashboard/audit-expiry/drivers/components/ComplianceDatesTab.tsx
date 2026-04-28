"use client"

import { useState, useEffect } from "react"
import { useCookies } from "next-client-cookies"
import { useAutoScroll } from "@/app/utils/useAutoScroll"
import { Button } from "@/components/ui/button"
import API_URL from "@/app/utils/ENV"
import { ComplianceList } from "./ComplianceList"
import { AuditItem, ApiDateItem } from "../types"
import { toStatusAndDays, toApiValue } from "../utils"
import { toast } from "sonner"

const HOST = API_URL

export function ComplianceDatesTab() {
    const [dates, setDates] = useState<AuditItem[]>([])
    const [loading, setLoading] = useState(true)
    const { expandedId, handleExpandedChange } = useAutoScroll(loading, "audit-expiry-dates")
    const [saving, setSaving] = useState(false)
    const [hardSetting, setHardSetting] = useState(false)
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

            const res = await fetch(`${HOST}/activity/driver-compliance-dates/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            })

            if (!res.ok) throw new Error("Failed to fetch compliance dates")

            const json = await res.json()
            if (!json.success) throw new Error(json.message || "API error")

            // Map the dynamic array response
            const items: AuditItem[] = json.data.map((item: ApiDateItem, index: number) => ({
                id: `date-${item.id}-${index}`,
                dbId: item.id,
                title: item.display_name,
                subtitle: item.field_description,
                fieldName: item.field_name,
                fieldReference: item.field_reference,
                ...toStatusAndDays(item.field_value)
            }))

            setDates(items)
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

    const handleHardSet = async () => {
        if (!token) {
            toast.error("Not authenticated")
            return
        }

        setHardSetting(true)
        try {
            const response = await fetch(`${HOST}/api/notifications/set-driver-compliance-dates/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.message || "Failed to set driver compliance dates")
            }

            const data = await response.json()
            toast.success(data.message || "Driver compliance dates set successfully!")
            
            // Optionally refresh the data after hard set to show updated values
            await fetchData()
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to set driver compliance dates: " + (err.message || "Unknown error"))
        } finally {
            setHardSetting(false)
        }
    }

    const handleSave = async () => {
        if (!token) {
            toast.error("Not authenticated")
            return
        }

        setSaving(true)
        try {
            const payload = dates.map(item => ({
                id: item.dbId,
                display_name: item.title,
                field_name: item.fieldName,
                field_description: item.subtitle,
                field_reference: item.fieldReference,
                field_value: toApiValue(item)
            }))

            // Try bulk update endpoint first
            const res = await fetch(`${HOST}/activity/driver-compliance-dates/bulk-update/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                // Fallback to individual updates
                const updatePromises = payload.map(item =>
                    fetch(`${HOST}/activity/driver-compliance-dates/${item.id}/`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(item)
                    })
                )

                const results = await Promise.all(updatePromises)
                const failed = results.filter(r => !r.ok)

                if (failed.length > 0) {
                    throw new Error(`Failed to update ${failed.length} items`)
                }
            }

            toast.success("Compliance dates saved successfully!")
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
                field_name: updatedItem.fieldName,
                field_description: updatedItem.subtitle,
                field_reference: updatedItem.fieldReference,
                field_value: toApiValue(updatedItem)
            }

            const res = await fetch(`${HOST}/activity/driver-compliance-dates/${updatedItem.dbId}/`, {
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
            const payload = {
                display_name: newItem.title,
                field_name: newItem.fieldName || newItem.title.toLowerCase().replace(/\s+/g, "_"),
                field_description: newItem.subtitle,
                field_reference: newItem.fieldReference,
                field_value: toApiValue(newItem),
            }

            const res = await fetch(`${HOST}/activity/driver-compliance-dates/`, {
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
            <div className="flex justify-between items-center mb-4">
                <Button
                    onClick={handleHardSet}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
                    disabled={loading || saving || hardSetting}
                >
                    {hardSetting ? "Setting..." : "Hard Set"}
                </Button>
            </div>
            
            <ComplianceList
                type="date"
                items={dates}
                setItems={setDates}
                loading={loading}
                saving={saving}
                onUpdateItem={handleUpdateItem}
                onCreateItem={handleCreateItem}
                handleExpandedChange={handleExpandedChange}
            />

            <div className="mt-8 pt-6 border-t border-gray-200 px-2">
                <Button
                    onClick={handleSave}
                    className="bg-pink-500 w-full hover:bg-pink-600 text-white py-6 text-lg font-medium"
                    disabled={loading || saving || hardSetting}
                >
                    {saving ? "Saving Changes..." : "Save Compliance Dates"}
                </Button>
            </div>
        </div>
    )
}