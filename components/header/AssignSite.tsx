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
import { toast } from "@/components/ui/use-toast"
import API_URL from '@/app/utils/ENV'
import { useCookies } from 'next-client-cookies'

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
        setSelectedValue(data.data.active_site_id.toString())
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch sites",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
      toast({
        title: "Error",
        description: "Failed to load sites. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignSite = async (siteId: number) => {
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
        setSelectedValue(siteId.toString())
        toast({
          title: "Success",
          description: `Site switched successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to switch site",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error assigning site:', error)
      toast({
        title: "Error",
        description: "Failed to switch site. Please try again.",
        variant: "destructive",
      })
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
    <div className="container mx-auto  max-w-4xl">
    

      {/* Main Card */}
      <Card className="max-w-md mx-auto">
    
        
        <CardContent className="space-y-6">
     

          {/* Site Switcher Dropdown */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Switch to Site
            </label>
            
            {/* Option 1: Clean Select Dropdown */}
            <div className="space-y-2">
              <Select
                value={selectedValue}
                onValueChange={(value) => {
                  if (value !== selectedValue) {
                    handleAssignSite(parseInt(value))
                  }
                }}
                disabled={assigning !== null || sites.length <= 1}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a site">
                    {selectedValue ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage 
                            src={getSiteById(parseInt(selectedValue))?.image}
                            alt={getSiteById(parseInt(selectedValue))?.name}
                          />
                          <AvatarFallback>
                            <Building2 className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span>{getSiteById(parseInt(selectedValue))?.name}</span>
                      </div>
                    ) : (
                      "Select a site"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem 
                      key={site.id} 
                      value={site.id.toString()}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={site.image} alt={site.name} />
                          <AvatarFallback>
                            <Building2 className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1">
                          <span>{site.name?.slice(0,20)}..</span>
                          <span className="text-xs text-muted-foreground">
                            ID: {site.id}
                          </span>
                        </div>
                        {activeSiteId === site.id && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {assigning !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Switching site...
                </div>
              )}
            </div>

         
          </div>

   

      
        </CardContent>
      </Card>

     
    </div>
  )
}

export default AssignSite