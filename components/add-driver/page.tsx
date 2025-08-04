"use client"

import React, { useState } from "react"
import { Stepper, StepperContent, StepperTabs } from "@/components/ui/stepper"
import { PersonalInfoStep } from "./personal-info-step"
import { NextOfKinStep } from "./next-of-kin-step"
import { HealthQuestionsStep } from "./health-questions-step"
import { DocumentsStep } from "./documents-step"
import { ConfirmationStep } from "./confirmation-step"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface AddDriverProps {
  userId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AddDriver: React.FC<AddDriverProps> = ({ userId, open, onOpenChange }) => {
  const stepLabels = ["Personal Info", "Next of Kin", "Health Questions", "Documents", "Confirmation"]
  const [driverId, setDriverId] = useState<number | null>(null)
  const [personalInfoData, setPersonalInfoData] = useState<any>(null)
  const [nextOfKinData, setNextOfKinData] = useState<any>(null)
  const [healthQuestionsData, setHealthQuestionsData] = useState<any>(null)
  const [documentsData, setDocumentsData] = useState<any>(null)
  console.log(open)

  return (
    <div className="flex items-center justify-center bg-background">
      <div className="w-full max-w-4xl relative">
        {/* Cancel Button */}
        <Button
          variant="outline"
          className="absolute top-4 right-4"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Stepper totalSteps={stepLabels.length} initialStep={0}>
          <StepperTabs labels={stepLabels} />
          <StepperContent>
            <PersonalInfoStep setDriverId={setDriverId} user_id={userId} setPersonalInfoData={setPersonalInfoData} />
            <NextOfKinStep driverId={driverId} user_id={userId} setNextOfKinData={setNextOfKinData} />
            <HealthQuestionsStep driverId={driverId} setHealthQuestionsData={setHealthQuestionsData} />
            <DocumentsStep driverId={driverId} setDocumentsData={setDocumentsData} />
            <ConfirmationStep
              personalInfoData={personalInfoData}
              nextOfKinData={nextOfKinData}
              healthQuestionsData={healthQuestionsData}
              documentsData={documentsData}
              // onComplete={() => onOpenChange(false)} // Close modal on completion
            />
          </StepperContent>
        </Stepper>
      </div>
    </div>
  )
}

export default AddDriver