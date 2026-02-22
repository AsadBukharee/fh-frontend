// hooks/useDriverAttributes.ts
import { useState, useEffect } from "react"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"

const HOST = API_URL

export interface DriverAttribute {
    name: string
    type: string
    help_text?: string
}

export function useDriverAttributes() {
    const [attributes, setAttributes] = useState<DriverAttribute[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    const cookies = useCookies()
    const token = cookies.get("access_token")

    useEffect(() => {
        const fetchAttributes = async () => {
            if (!token) {
                setError("No authentication token")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const res = await fetch(`${HOST}/api/profiles/driver/attributes/`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                })

                if (!res.ok) throw new Error("Failed to fetch driver attributes")

                const json = await res.json()
                if (!json.success) throw new Error(json.message || "API error")

                setAttributes(json.data)
                setError(null)
            } catch (err: any) {
                setError(err.message || "Unknown error")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchAttributes()
    }, [token])

    return { attributes, loading, error }
}