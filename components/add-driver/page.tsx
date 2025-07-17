"use client"

import { useState } from "react"
import { Stepper, StepperContent, StepperTabs } from "@/components/ui/stepper"
import { PersonalInfoStep } from "./personal-info-step"
import { NextOfKinStep } from "./next-of-kin-step"
import { HealthQuestionsStep } from "./health-questions-step"
import { DocumentsStep } from "./documents-step"
import { ConfirmationStep } from "./confirmation-step"

export default function AddDriver() {
  const stepLabels = ["Personal Info", "Next of Kin", "Health Questions", "Documents", "Confirmation"]
  const [driverId, setDriverId] = useState<number | null>(null)
  const [personalInfoData, setPersonalInfoData] = useState<any>(null)
  const [nextOfKinData, setNextOfKinData] = useState<any>(null)
  const [healthQuestionsData, setHealthQuestionsData] = useState<any>(null)
  const [documentsData, setDocumentsData] = useState<any>(null)

  return (
    <div className="flex items-center justify-center bg-background ">
      <div className="w-full max-w-4xl">
        <Stepper totalSteps={stepLabels.length} initialStep={0}>
          <StepperTabs labels={stepLabels} />
          <StepperContent>
            <PersonalInfoStep setDriverId={setDriverId} setPersonalInfoData={setPersonalInfoData} />
            <NextOfKinStep driverId={driverId} setNextOfKinData={setNextOfKinData} />
            <HealthQuestionsStep driverId={driverId} setHealthQuestionsData={setHealthQuestionsData} />
            <DocumentsStep driverId={driverId} setDocumentsData={setDocumentsData} />
            <ConfirmationStep
              personalInfoData={personalInfoData}
              nextOfKinData={nextOfKinData}
              healthQuestionsData={healthQuestionsData}
              documentsData={documentsData}
            />
          </StepperContent>
        </Stepper>
      </div>
    </div>
  )
}
