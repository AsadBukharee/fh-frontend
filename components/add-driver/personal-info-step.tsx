
"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useStepper } from "@/components/ui/stepper"
import { useActionState } from "react"
import { submitPersonalInfo } from "../action"

interface PersonalInfoStepProps {
  setDriverId: (id: number) => void
  setPersonalInfoData: (data: any) => void
}

export function PersonalInfoStep({ setDriverId, setPersonalInfoData }: PersonalInfoStepProps) {
  const { goToNextStep } = useStepper()

  const [personalInfoState, personalInfoAction, personalInfoPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await submitPersonalInfo(formData)
      if (result.success) {
        setDriverId(result.data.driver_id)
        setPersonalInfoData(Object.fromEntries(formData.entries()))
        goToNextStep()
      }
      return result
    },
    { success: false, message: "" },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Personal Information</CardTitle>
        <CardDescription>Provide your personal details.</CardDescription>
      </CardHeader>
      <form action={personalInfoAction}>
        <CardContent className="min-h-[200px]">
          <div className="space-y-2">
            {/* <h3 className="text-lg font-semibold">Personal Information</h3> */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="driver_name">Driver Name</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="driver_name"
                    name="driver_name"
                    placeholder="John Doe"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            {/* < the rest of the input fields follow the same pattern > */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="address1">Address Line 1</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="address1"
                    name="address1"
                    placeholder="123 Main St"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="post_code">Post Code</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="post_code"
                    name="post_code"
                    placeholder="12345"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="national_insurance_no">National Insurance No.</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="national_insurance_no"
                    name="national_insurance_no"
                    placeholder="AB123456C"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="account_no">Account Number</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="account_no"
                    name="account_no"
                    placeholder="12345678"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sort_code">Sort Code</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
                  }}
                >
                  <Input
                    id="sort_code"
                    name="sort_code"
                    placeholder="12-34-56"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="have_other_job" name="have_other_job" />
              <Label htmlFor="have_other_job">Do you have another job?</Label>
            </div>
          </div>
          {personalInfoState?.message && !personalInfoState.success && (
            <p className="text-sm text-red-500" aria-live="polite">
              {personalInfoState.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" className="bg-magenta text-white" disabled={personalInfoPending}>
            {personalInfoPending ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}