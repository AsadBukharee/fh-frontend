"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useStepper } from "@/components/ui/stepper"
import { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface NextOfKinStepProps {
  driverId: number | null
  setNextOfKinData: (data: any) => void
  user_id: number
  initialNextOfKinData?: any // Optional prop for pre-populating data
}

export function NextOfKinStep({ user_id, driverId, setNextOfKinData, initialNextOfKinData }: NextOfKinStepProps) {
  const { goToNextStep, goToPreviousStep } = useStepper()
  const cookies = useCookies()

  // Initialize formData with data from localStorage or initialNextOfKinData, if provided
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem(`nextOfKin_${driverId}`)
    return savedData
      ? JSON.parse(savedData)
      : initialNextOfKinData || {
          kin_name: "",
          kin_contact: "",
          kin_relationship: "",
          kin_address: "",
          kin_email: "",
        }
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Persist formData to localStorage whenever it changes
  useEffect(() => {
    if (driverId) {
      localStorage.setItem(`nextOfKin_${driverId}`, JSON.stringify(formData))
    }
  }, [formData, driverId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (driverId === null) {
      setError("Please complete the 'Personal Info' step first.")
      setLoading(false)
      return
    }

    const token = cookies.get('access_token')
    if (!token) {
      setError("Authentication token is missing. Please log in again.")
      setLoading(false)
      return
    }

    const payload = {
      next_of_kin_name: formData.kin_name,
      next_of_kin_contact: formData.kin_contact,
      next_of_kin_relationship: formData.kin_relationship,
      next_of_kin_address: formData.kin_address,
      next_of_kin_email: formData.kin_email,
      user_id: user_id,
      driver_id: driverId,
    }

    try {
      const res = await fetch(`${API_URL}/api/profiles/driver/${driverId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()
      console.log("API Response:", responseData) // Debug the response

      if (!res.ok) {
        throw new Error(responseData?.detail || "Submission failed.")
      }

      // Update parent state with the submitted data
      setNextOfKinData(payload)

      // Optionally, clear localStorage after successful submission
      localStorage.removeItem(`nextOfKin_${driverId}`)

      // Proceed to the next step
      goToNextStep()
    } catch (err: any) {
      console.error("Error:", err) // Debug the error
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Next of Kin Details</CardTitle>
        <CardDescription>Provide details for your next of kin.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 min-h-[200px]">
          {driverId === null ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              Please complete the &quot;Personal Info&quot; step first to enable this section.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Next of Kin Details</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="kin_name">Name</Label>
                  <Input
                    id="kin_name"
                    name="kin_name"
                    placeholder="Jane Doe"
                    value={formData.kin_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="kin_contact">Contact Number</Label>
                  <Input
                    id="kin_contact"
                    name="kin_contact"
                    type="tel"
                    placeholder="+44 7700112233"
                    value={formData.kin_contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="kin_relationship">Relationship</Label>
                <Input
                  id="kin_relationship"
                  name="kin_relationship"
                  placeholder="Wife"
                  value={formData.kin_relationship}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="kin_email">Email</Label>
                <Input
                  id="kin_email"
                  name="kin_email"
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={formData.kin_email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="kin_address">Address</Label>
                <Input
                  id="kin_address"
                  name="kin_address"
                  placeholder="25 Church Street, Bolton"
                  value={formData.kin_address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500" aria-live="polite">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="border border-magenta text-magenta"
            onClick={goToPreviousStep}
          >
            Previous
          </Button>
          <Button
            type="submit"
            className="bg-magenta text-white"
            disabled={loading || driverId === null}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}