"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useStepper } from "@/components/ui/stepper"
import { useActionState } from "react"
import { submitNextOfKinInfo } from "../action"

interface NextOfKinStepProps {
  driverId: number | null
  setNextOfKinData: (data: any) => void
}

export function NextOfKinStep({ driverId, setNextOfKinData }: NextOfKinStepProps) {
  const { goToNextStep, goToPreviousStep } = useStepper()

  const [nextOfKinState, nextOfKinAction, nextOfKinPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (driverId === null) {
        return { success: false, message: "Please complete the 'Personal Info' step first." }
      }
      formData.append("driver_id", driverId!.toString())
      const result = await submitNextOfKinInfo(prevState, formData)
      if (result.success) {
        setNextOfKinData(Object.fromEntries(formData.entries()))
        goToNextStep()
      }
      return result
    },
    { success: false, message: "" },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Next of Kin Details</CardTitle>
        <CardDescription>Provide details for your next of kin.</CardDescription>
      </CardHeader>
      <form action={nextOfKinAction}>
        <input type="hidden" name="driver_id" value={driverId || ""} />
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
                  <Input id="kin_name" name="kin_name" placeholder="Jane Doe" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="kin_contact">Contact Number</Label>
                  <Input id="kin_contact" name="kin_contact" type="tel" placeholder="+0987654321" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="kin_relationship">Relationship</Label>
                <Input id="kin_relationship" name="kin_relationship" placeholder="Spouse" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="kin_address">Address</Label>
                <Input id="kin_address" name="kin_address" placeholder="123 Main Street" required />
              </div>
            </div>
          )}
          {nextOfKinState?.message && !nextOfKinState.success && (
            <p className="text-sm text-red-500" aria-live="polite">
              {nextOfKinState.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" className="border border-magenta text-magenta" onClick={goToPreviousStep}>
            Previous
          </Button>
          <Button type="submit" className="bg-magenta text-white" disabled={nextOfKinPending || driverId === null}>
            {nextOfKinPending ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
