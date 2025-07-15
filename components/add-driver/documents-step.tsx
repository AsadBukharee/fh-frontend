"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useStepper } from "@/components/ui/stepper"
import { useActionState } from "react"
import { submitDocuments } from "../action"

interface DocumentsStepProps {
  driverId: number | null
  setDocumentsData: (data: any) => void
}

export function DocumentsStep({ driverId, setDocumentsData }: DocumentsStepProps) {
  const { goToNextStep, goToPreviousStep } = useStepper()

  const [documentsState, documentsAction, documentsPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (driverId === null) {
        return {
          success: false,
          message: "Please complete the 'Personal Info', 'Next of Kin', and 'Health Questions' steps first.",
        }
      }
      formData.append("driver_id", driverId!.toString())
      const result = await submitDocuments(prevState, formData)
      if (result.success) {
        setDocumentsData(Object.fromEntries(formData.entries()))
        goToNextStep()
      }
      return result
    },
    { success: false, message: "" },
  )

  const documentTypes = [
    { id: "d_or_d1_license", label: "D or D1 License" },
    { id: "cpc", label: "CPC" },
    { id: "tacho_card", label: "Tacho Card" },
    { id: "Passport_Right_To_Work", label: "Passport / Right To Work" },
    { id: "proof_of_address", label: "Proof of Address" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Documents</CardTitle>
        <CardDescription>Upload required documents for verification.</CardDescription>
      </CardHeader>
      <form action={documentsAction}>
        <input type="hidden" name="driver_id" value={driverId || ""} />
        <CardContent className="space-y-6 min-h-[200px]">
          {driverId === null ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              Please complete the &quot;Personal Info&quot;, &quot;Next of Kin&quot;, and &quot;Health Questions&quot; steps first to enable this
              section.
            </div>
          ) : (
            documentTypes.map((docType) => (
              <div key={docType.id} className="space-y-4 rounded-md border p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id={`${docType.id}_has_document`} name={`${docType.id}_has_document`} />
                  <Label htmlFor={`${docType.id}_has_document`}>I have a {docType.label}</Label>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.id}_front_image`}>Front Image</Label>
                    <Input id={`${docType.id}_front_image`} name={`${docType.id}_front_image`} type="file" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.id}_back_image`}>Back Image (if applicable)</Label>
                    <Input id={`${docType.id}_back_image`} name={`${docType.id}_back_image`} type="file" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.id}_expiry_date`}>Expiry Date</Label>
                    <Input id={`${docType.id}_expiry_date`} name={`${docType.id}_expiry_date`} type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.id}_description`}>Description</Label>
                    <Input
                      id={`${docType.id}_description`}
                      name={`${docType.id}_description`}
                      placeholder="e.g., Valid UK license"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${docType.id}_reason`}>Reason if not provided</Label>
                  <Input id={`${docType.id}_reason`} name={`${docType.id}_reason`} placeholder="e.g., Not applicable" />
                </div>
              </div>
            ))
          )}
          {documentsState?.message && !documentsState.success && (
            <p className="text-sm text-red-500" aria-live="polite">
              {documentsState.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" className="border border-magenta text-magenta" onClick={goToPreviousStep}>
            Previous
          </Button>
          <Button type="submit" className="bg-magenta text-white" disabled={documentsPending || driverId === null}>
            {documentsPending ? "Uploading..." : "Upload & Complete"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
