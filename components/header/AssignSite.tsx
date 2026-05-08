'use client'
import React, { useState, useEffect } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Check, ChevronDown, Building2, SwitchCamera, Globe, MapPin } from "lucide-react"
// import { toast } from "@/components/ui/use-toast"
import API_URL from '@/app/utils/ENV'
import { useCookies } from 'next-client-cookies'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Define types based on your API response
interface Site {
  id: number
  name: string
  status: 'active' | 'inactive'
  image: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: {
    sites: Site[]
    active_site_id: number
  }
}

const AssignSite = () => {
  const [sites, setSites] = useState<Site[]>([])
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [selectedValue, setSelectedValue] = useState<string>("")
  const token = useCookies().get('access_token')
  const router=useRouter()

  // Fetch sites data
  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/sites/get-user-sites/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      if (data.success) {
        setSites(data.data.sites)
        setActiveSiteId(data.data.active_site_id)
        // Set selected value to active site
        setSelectedValue(data.data.active_site_id ? data.data.active_site_id.toString() : "all")
      } else {
        toast(data.message || "Failed to fetch sites",
         )
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
      toast( "Failed to load sites. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignSite = async (siteId: number | null) => {
    try {
      setAssigning(siteId)

      const response = await fetch(`${API_URL}/api/sites/set-site/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ site_id: siteId }),
      })

      const data = await response.json()

      if (data.success) {
        setActiveSiteId(siteId)
        setSelectedValue(siteId === null ? "all" : siteId.toString())
        window.location.reload();

        toast(
          `Site switched successfully`)
      } else {
        toast( data.message || "Failed to switch site")
      }
    } catch (error) {
      console.error('Error assigning site:', error)
      toast("Failed to switch site. Please try again.")
    } finally {
      setAssigning(null)
    }
  }



  const getSiteById = (id: number) => {
    return sites.find(site => site.id === id)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading sites...</p>
      </div>
    )
  }

  return (
<div className="max-w-sm mx-auto">
  <div className="flex flex-col justify-start items-center gap-2">
   

    <Select
      value={selectedValue}
      onValueChange={(value) => {
        if (value !== selectedValue) {
          handleAssignSite(value === "all" ? null : Number(value))
        }
      }}
      disabled={assigning !== null || sites.length <= 1}
    >
      <SelectTrigger className="h-9 px-2 text-sm">
        <SelectValue placeholder="Select site">
          {selectedValue === "all" ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarFallback>
                  <Globe className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[140px]">All Sites</span>
            </div>
          ) : selectedValue && (
            <div className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={getSiteById(Number(selectedValue))?.image}
                />
                <AvatarFallback>
                  <Building2 className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[140px]">
                {getSiteById(Number(selectedValue))?.name}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="text-sm">
        <SelectItem value="all" className="py-1.5">
          <div className="flex items-center gap-2">
            <Avatar className="h-4 w-4">
              <AvatarFallback>
                <Globe className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[160px]">All Sites</span>
            {activeSiteId === null && (
              <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />
            )}
          </div>
        </SelectItem>
        {sites.map((site) => (
          <SelectItem
            key={site.id}
            value={site.id.toString()}
            className="py-1.5"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarImage src={site.image} />
                <AvatarFallback>
                  <Building2 className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>

              <span className="truncate max-w-[160px]">
                {site.name}
              </span>

              {activeSiteId === site.id && (
                <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {assigning && (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    )}
  </div>
</div>

  )
}

export default AssignSite