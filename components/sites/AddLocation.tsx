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
import { Loader2, MapPin, Building2, Hash, CheckCircle, ChevronDown } from "lucide-react"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface LocationPayload {
  name: string
  associated_location: number | null
  is_loca_group: boolean
  is_maintenance: boolean
  zipcode: string | null
  address: string | null
  custom_order: number
  lat: number | null
  lon: number | null
  created_at: string
  updated_at: string
}

interface Suggestion {
  display_name: string
  lat: string
  lon: string
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
    associated_location: number | null
    is_loca_group: boolean
    is_maintenance: boolean
    zipcode: string | null
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
    name: editLocation?.name || "",
    associated_location: editLocation?.associated_location ?? null,
    is_loca_group: editLocation?.is_loca_group || false,
    is_maintenance: editLocation?.is_maintenance || false,
    zipcode: editLocation?.zipcode || "",
    address: editLocation?.address || "",
    custom_order: editLocation?.custom_order || 1,
    lat: editLocation?.lat ?? null,
    lon: editLocation?.lon ?? null,
    created_at: editLocation?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const [locations, setLocations] = useState<any[]>([])
  const [fetchingLocations, setFetchingLocations] = useState(false)

  useEffect(() => {
    if (editLocation) {
      setFormData({
        name: editLocation.name,
        associated_location: editLocation.associated_location,
        is_loca_group: editLocation.is_loca_group,
        is_maintenance: editLocation.is_maintenance,
        zipcode: editLocation.zipcode,
        address: editLocation.address || "",
        custom_order: editLocation.custom_order,
        lat: editLocation.lat,
        lon: editLocation.lon,
        created_at: editLocation.created_at,
        updated_at: new Date().toISOString(),
      })
    }
  }, [editLocation])

  const { toast } = useToast()
  const token = useCookies().get("access_token")

  const fetchExistingLocations = useCallback(async () => {
    setFetchingLocations(true)
    try {
      const response = await fetch(`${API_URL}/activity/locations/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setLocations(result.data)
      }
    } catch (err) {
      console.error("Failed to fetch locations", err)
    } finally {
      setFetchingLocations(false)
    }
  }, [token])

  useEffect(() => {
    fetchExistingLocations()
  }, [fetchExistingLocations])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Location name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Location name must be at least 2 characters"
    }

    if (!formData.zipcode || !formData.zipcode.trim()) {
      newErrors.zipcode = "Zip code is required"
    } else if (!/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test((formData.zipcode || "").trim())) {
      newErrors.zipcode = "Please enter a valid UK postcode"
    }

    if (!formData.address || !formData.address.trim()) {
      newErrors.address = "Address is required"
    } else if ((formData.address ?? "").length < 5) {
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

  const handleInputChange = (field: keyof LocationPayload, value: string | number | boolean | null) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
        updated_at: new Date().toISOString(),
      }

      // Logic: if is_loca_group is disabled, reset associated_location to null
      if (field === "is_loca_group" && value === false) {
        newData.associated_location = null
      }

      return newData
    })

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

    // Always auto-fill address from suggestion
    handleInputChange("address", suggestion.display_name)

    // Capture lat/lon from the Nominatim suggestion
    if (suggestion.lat && suggestion.lon) {
      setFormData((prev) => ({
        ...prev,
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon),
      }))
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
      const baseUrl = API_URL
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
          associated_location: null,
          is_loca_group: false,
          is_maintenance: false,
          zipcode: "",
          address: "",
          custom_order: 1,
          lat: null,
          lon: null,
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
        associated_location: editLocation.associated_location,
        is_loca_group: editLocation.is_loca_group,
        is_maintenance: editLocation.is_maintenance,
        zipcode: editLocation.zipcode,
        address: editLocation.address || "",
        custom_order: editLocation.custom_order,
        lat: editLocation.lat,
        lon: editLocation.lon,
        created_at: editLocation.created_at,
        updated_at: new Date().toISOString(),
      })
    } else {
      setFormData({
        name: "",
        associated_location: null,
        is_loca_group: false,
        is_maintenance: false,
        zipcode: "",
        address: "",
        custom_order: 1,
        lat: null,
        lon: null,
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
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className={`h-5 w-5 ${editLocation ? "text-blue-600" : "text-primary"}`} />
            <CardTitle className="text-xl font-semibold text-foreground">
              {editLocation ? "Edit Location" : "Add New Location"}
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {editLocation
              ? "Update details for the selected location"
              : "Create a new location entry with settings"}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Location Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter location name"
                className={errors.name ? "border-destructive h-9" : "h-9"}
              />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zipcode" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Postcode <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="zipcode"
                  type="text"
                  value={formData.zipcode || ""}
                  onChange={handleZipcodeChange}
                  placeholder="Enter UK postcode"
                  className={errors.zipcode ? "border-destructive h-9" : "h-9"}
                />
                {(loading || fetchingLocations) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {errors.zipcode && <p className="text-[10px] text-destructive">{errors.zipcode}</p>}
              {suggestions.length > 0 && (
                <div className="absolute mt-1 w-[200px] border rounded-md max-h-32 overflow-y-auto bg-popover shadow-lg z-50">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-2 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0 text-xs"
                    >
                      <div className="font-medium">{suggestion.address.postcode}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{suggestion.display_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
                Full Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter the complete address"
                className={`min-h-[60px] max-h-[100px] py-2 text-sm resize-none ${errors.address ? "border-destructive" : ""}`}
              />
              {errors.address && <p className="text-[10px] text-destructive">{errors.address}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="is_loca_group" className="text-xs font-semibold">
                    Location Group
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Is this a group?</p>
                </div>
                <Switch
                  id="is_loca_group"
                  checked={formData.is_loca_group}
                  onCheckedChange={(checked) => handleInputChange("is_loca_group", checked)}
                  className="scale-90"
                />
              </div>

              {formData.is_loca_group && (
                <div className="space-y-1.5">
                  <Label htmlFor="associated_location" className="text-xs font-semibold">
                    Associated Location
                  </Label>
                  <Select
                    value={formData.associated_location?.toString() || "none"}
                    onValueChange={(value) => handleInputChange("associated_location", value === "none" ? null : Number.parseInt(value))}
                  >
                    <SelectTrigger id="associated_location" className="w-full h-9">
                      <SelectValue placeholder="Select parent location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locations
                        .filter((loc) => loc.id !== editLocation?.id)
                        .map((loc) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>
                            {loc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="is_maintenance" className="text-xs font-semibold">
                    Maintenance
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Under maintenance?</p>
                </div>
                <Switch
                  id="is_maintenance"
                  checked={formData.is_maintenance}
                  onCheckedChange={(checked) => handleInputChange("is_maintenance", checked)}
                  className="scale-90"
                />
              </div>
            </div>

            <div className="flex justify-start gap-4 pt-4">
              {editLocation && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-10 text-sm font-medium px-8 bg-transparent"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 text-sm font-medium px-10"
                style={{
                  background: !submitting ? 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)' : undefined
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editLocation ? "Updating..." : "Adding..."}
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
