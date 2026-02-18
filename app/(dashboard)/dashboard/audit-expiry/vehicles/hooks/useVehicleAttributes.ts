"use client"

import { useState, useEffect } from "react"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"

const HOST = API_URL

export interface VehicleAttribute {
    name: string
    type: string
}

let attributesCache: VehicleAttribute[] | null = null
let fetchPromise: Promise<VehicleAttribute[]> | null = null

export function useVehicleAttributes() {
    const [attributes, setAttributes] = useState<VehicleAttribute[]>(attributesCache || [])
    const [loading, setLoading] = useState(!attributesCache)
    const [error, setError] = useState<string | null>(null)

    const cookies = useCookies()
    const token = cookies.get("access_token")

    useEffect(() => {
        const fetchAttributes = async () => {
            if (!token) {
                setLoading(false)
                return
            }

            if (attributesCache) {
                setAttributes(attributesCache)
                setLoading(false)
                return
            }

            try {
                if (!fetchPromise) {
                    fetchPromise = (async () => {
                        const res = await fetch(`${HOST}/api/vehicles/attributes/`, {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            }
                        })

                        if (!res.ok) throw new Error("Failed to fetch vehicle attributes")

                        const json = await res.json()
                        if (json.success) {
                            attributesCache = json.data
                            return json.data
                        } else {
                            throw new Error(json.message || "Failed to fetch attributes")
                        }
                    })()
                }

                const data = await fetchPromise
                setAttributes(data)
            } catch (err: any) {
                setError(err.message)
                console.error("Error fetching vehicle attributes:", err)
                fetchPromise = null // Reset on error to allow retry
            } finally {
                setLoading(false)
            }
        }

        fetchAttributes()
    }, [token])

    return { attributes, loading, error }
}
