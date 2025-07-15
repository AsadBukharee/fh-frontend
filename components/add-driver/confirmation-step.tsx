"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStepper } from "@/components/ui/stepper"

interface ConfirmationStepProps {
  personalInfoData: any
  nextOfKinData: any
  healthQuestionsData: any
  documentsData: any
}

export function ConfirmationStep({
  personalInfoData,
  nextOfKinData,
  healthQuestionsData,
  documentsData,
}: ConfirmationStepProps) {
  const { goToPreviousStep } = useStepper()

  const healthQuestionsList = [
    { id: 1, text: "Do you have any medical conditions?" },
    { id: 2, text: "Are you taking any medications?" },
    { id: 3, text: "Do you have any vision problems?" },
    { id: 4, text: "Do you have any history of seizures or blackouts?" },
    { id: 5, text: "Have you ever been diagnosed with diabetes?" },
  ]

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
        <CardTitle>Step 5: Confirmation</CardTitle>
        <CardDescription>Review your details and confirm your submission.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 min-h-[200px]">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <p>
            <strong>Name:</strong> {personalInfoData?.driver_name || "N/A"}
          </p>
          <p>
            <strong>DOB:</strong> {personalInfoData?.date_of_birth || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {personalInfoData?.phone || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {personalInfoData?.address1 || "N/A"}
          </p>
          <p>
            <strong>NI No:</strong> {personalInfoData?.national_insurance_no || "N/A"}
          </p>
          <p>
            <strong>Other Job:</strong> {personalInfoData?.have_other_job === "on" ? "Yes" : "No"}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Next of Kin</h3>
          <p>
            <strong>Name:</strong> {nextOfKinData?.kin_name || "N/A"}
          </p>
          <p>
            <strong>Contact:</strong> {nextOfKinData?.kin_contact || "N/A"}
          </p>
          <p>
            <strong>Relationship:</strong> {nextOfKinData?.kin_relationship || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {nextOfKinData?.kin_address || "N/A"}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Health Questions</h3>
          {healthQuestionsList.map((q) => (
            <p key={q.id}>
              <strong>{q.text}</strong> {healthQuestionsData?.[`question_${q.id}_answer`] === "true" ? "Yes" : "No"}
              {healthQuestionsData?.[`question_${q.id}_note`] &&
                ` (Note: ${healthQuestionsData[`question_${q.id}_note`]})`}
            </p>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Documents</h3>
          {documentTypes.map((docType) => (
            <p key={docType.id}>
              <strong>{docType.label}:</strong>{" "}
              {documentsData?.[`${docType.id}_has_document`] === "on" ? "Uploaded" : "Not Provided"}
              {documentsData?.[`${docType.id}_expiry_date`] &&
                ` (Expiry: ${documentsData[`${docType.id}_expiry_date`]})`}
              {documentsData?.[`${docType.id}_reason`] && ` (Reason: ${documentsData[`${docType.id}_reason`]})`}
            </p>
          ))}
        </div>
        <div className="mt-4 text-center text-lg font-medium text-green-600">
          All steps completed! Your application is ready for review.
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" className="border border-magenta text-magenta"  onClick={goToPreviousStep}>
          Previous
        </Button>
        <Button type="button" className="bg-magenta text-white" onClick={() => alert("Application Submitted!")}>
          Submit Application
        </Button> 
      </CardFooter>
    </Card>
  )
}
