"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, MapPin, User, Building2, Car, Loader2 } from "lucide-react"
import { useToast } from "@/app/Context/ToastContext"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import ImageUploader from "./Media/UploadImage"
// import ImageUploader from "./ImageUploader" // Import the ImageUploader component

export default function AddSiteForm() {
  const { showToast } = useToast()
  const cookies = useCookies()
  const token = cookies.get("access_token")

  const [form, setForm] = useState({
    name: "",
    image: "",
    notes: "",
    postcode: "",
    address: "",
    contact_name: "",
    contact_position: "",
    contact_phone: "",
    contact_email: "",
    radius_m: 200,
    latitude: "",
    longitude: "",
    number_of_allocated_vehicles: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  // Callback function to handle successful image upload
  const handleImageUpload = (url: string) => {
    setForm({ ...form, image: url })
    showToast("Image uploaded successfully!", "success")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      name: form.name,
      postcode: form.postcode,
      address: form.address,
      latitude: Number.parseFloat(form.latitude) || undefined,
      longitude: Number.parseFloat(form.longitude) || undefined,
      radius_m: Number.parseInt(form.radius_m.toString(), 10),
      contact_name: form.contact_name,
      contact_position: form.contact_position,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      number_of_allocated_vehicles: Number.parseInt(form.number_of_allocated_vehicles.toString(), 10),
      image: form.image || undefined, // Include image URL in payload
    }

    try {
      const response = await fetch(`${API_URL}/api/sites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to submit the form")
      }

      const result = await response.json()
      showToast("Site added successfully!", "success")
      console.log("API response:", result)

      setForm({
        name: "",
        image: "",
        notes: "",
        postcode: "",
        address: "",
        contact_name: "",
        contact_position: "",
        contact_phone: "",
        contact_email: "",
        radius_m: 200,
        latitude: "",
        longitude: "",
        number_of_allocated_vehicles: 0,
      })
    } catch (error) {
      showToast("Failed to add site. Please try again.", "error")
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
     

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter site name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Image Upload</Label>
                <ImageUploader onUploadSuccess={handleImageUpload} />
              
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes about this site..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  name="postcode"
                  value={form.postcode}
                  onChange={handleChange}
                  placeholder="CM7 4AZ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius_m">Radius (meters)</Label>
                <Input
                  id="radius_m"
                  name="radius_m"
                  type="number"
                  value={form.radius_m}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter the complete address..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="51.9731"
                  step="any"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="0.4831"
                  step="any"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  value={form.contact_name}
                  onChange={handleChange}
                  placeholder="Imran Ali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_position">Position</Label>
                <Input
                  id="contact_position"
                  name="contact_position"
                  value={form.contact_position}
                  onChange={handleChange}
                  placeholder="Contact Position"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  value={form.contact_phone}
                  onChange={handleChange}
                  placeholder="+44 938747 8383"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={handleChange}
                  placeholder="person@gmail.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="number_of_allocated_vehicles">Number of Allocated Vehicles</Label>
              <Input
                id="number_of_allocated_vehicles"
                name="number_of_allocated_vehicles"
                type="number"
                value={form.number_of_allocated_vehicles}
                onChange={handleChange}
                min="0"
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isSubmitting || !form.name} className="min-w-[150px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Site...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Add Site
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}