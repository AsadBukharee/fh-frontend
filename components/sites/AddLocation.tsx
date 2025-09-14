"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { debounce } from "lodash"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MapPin, Building2, Hash, CheckCircle } from "lucide-react"
import { useCookies } from "next-client-cookies"

interface LocationPayload {
  name: string
  is_maintenance: boolean
  zipcode: string
  address: string
  custom_order: number
  created_at: string
  updated_at: string
}

interface Suggestion {
  display_name: string
  address: {
    postcode?: string
  }
}

interface FormErrors {
  name?: string
  zipcode?: string
  address?: string
  custom_order?: string
}

interface AddLocationProps {
  editLocation?: {
    id: number
    name: string
    is_maintenance: boolean
    zipcode: string
    address: string | null
    custom_order: number
    lat: number | null
    lon: number | null
    created_at: string
    updated_at: string
  } | null
  onCancel?: () => void
  onSuccess?: () => void
}

const AddLocation: React.FC<AddLocationProps> = ({ editLocation, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<LocationPayload>({
    name: "",
    is_maintenance: false,
    zipcode: "",
    address: "",
    custom_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  useEffect(() => {
    if (editLocation) {
      setFormData({
        name: editLocation.name,
        is_maintenance: editLocation.is_maintenance,
        zipcode: editLocation.zipcode,
        address: editLocation.address || "",
        custom_order: editLocation.custom_order,
        created_at: editLocation.created_at,
        updated_at: new Date().toISOString(),
      })
    }
  }, [editLocation])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()
  const token=useCookies().get('access_token')
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Location name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Location name must be at least 2 characters"
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = "Zip code is required"
    } else if (!/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(formData.zipcode.trim())) {
      newErrors.zipcode = "Please enter a valid UK postcode"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    } else if (formData.address.length < 5) {
      newErrors.address = "Address must be at least 5 characters"
    }

    if (formData.custom_order < 1) {
      newErrors.custom_order = "Order must be at least 1"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const fetchSuggestionsInner = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query,
          )}&format=json&addressdetails=1&limit=5&countrycodes=gb`,
          {
            headers: {
              "User-Agent": "LocationManager/1.0",
            },
          },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions")
        }

        const data: Suggestion[] = await response.json()
        setSuggestions(data.filter((item) => item.address.postcode))
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch location suggestions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchSuggestions = useCallback(
    debounce((query: string) => {
      void fetchSuggestionsInner(query)
    }, 500) as (query: string) => void,
    [fetchSuggestionsInner],
  )

  const handleInputChange = (field: keyof LocationPayload, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString(),
    }))

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    handleInputChange("zipcode", value)
    fetchSuggestions(value)
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const postcode = suggestion.address.postcode || ""
    handleInputChange("zipcode", postcode)

    if (!formData.address.trim()) {
      handleInputChange("address", suggestion.display_name)
    }

    setSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const url = editLocation ? `${baseUrl}/activity/locations/${editLocation.id}` : `${baseUrl}/activity/locations/`

      const method = editLocation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,

        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editLocation ? "update" : "create"} location`)
      }

      toast({
        title: "Success!",
        description: `Location has been ${editLocation ? "updated" : "added"} successfully`,
      })

      if (!editLocation) {
        setFormData({
          name: "",
          is_maintenance: false,
          zipcode: "",
          address: "",
          custom_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      setErrors({})

      onSuccess?.()
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${editLocation ? "update" : "add"} location. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (editLocation) {
      setFormData({
        name: editLocation.name,
        is_maintenance: editLocation.is_maintenance,
        zipcode: editLocation.zipcode,
        address: editLocation.address || "",
        custom_order: editLocation.custom_order,
        created_at: editLocation.created_at,
        updated_at: new Date().toISOString(),
      })
    } else {
      setFormData({
        name: "",
        is_maintenance: false,
        zipcode: "",
        address: "",
        custom_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    setErrors({})
    onCancel?.()
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className={`border-0 ${editLocation ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-card"}`}>
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-2">
            <Building2 className={`h-6 w-6 ${editLocation ? "text-blue-600" : "text-primary"}`} />
            <CardTitle className="text-2xl font-semibold text-foreground">
              {editLocation ? "Edit Location" : "Add New Location"}
            </CardTitle>
            {editLocation && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {editLocation
              ? "Update the location details below"
              : "Create a new location entry with address details and settings"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                  Location Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter location name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

             
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipcode" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Postcode <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="zipcode"
                  type="text"
                  value={formData.zipcode}
                  onChange={handleZipcodeChange}
                  placeholder="Enter UK postcode (e.g., SW1A 1AA)"
                  className={errors.zipcode ? "border-destructive" : ""}
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {errors.zipcode && <p className="text-sm text-destructive">{errors.zipcode}</p>}
              {suggestions.length > 0 && (
                <div className="mt-2 border rounded-md max-h-48 overflow-y-auto bg-popover shadow-md">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm">{suggestion.address.postcode}</div>
                      <div className="text-xs text-muted-foreground truncate">{suggestion.display_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
                Full Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter the complete address"
                className={`min-h-[80px] resize-none ${errors.address ? "border-destructive" : ""}`}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="is_maintenance" className="text-sm font-medium">
                  Maintenance Mode
                </Label>
                <p className="text-xs text-muted-foreground">Enable if this location is currently under maintenance</p>
              </div>
              <Switch
                id="is_maintenance"
                checked={formData.is_maintenance}
                onCheckedChange={(checked) => handleInputChange("is_maintenance", checked)}
              />
            </div>

            <div className="flex gap-3">
              {editLocation && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-11 text-base font-medium bg-transparent"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className={`h-11 text-base font-medium ${editLocation && onCancel ? "flex-1" : "w-full"}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editLocation ? "Updating Location..." : "Adding Location..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {editLocation ? "Update Location" : "Add Location"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddLocation
