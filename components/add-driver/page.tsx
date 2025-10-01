"use client";

import React, { useState } from "react";
import { Stepper, StepperContent, StepperTabs, StepperNavigation } from "./DriverStepper";
import { PersonalInfoStep } from "./personal-info-step";
import { NextOfKinStep } from "./next-of-kin-step";
import { HealthQuestionsStep } from "./health-questions-step";
import { DocumentsStep } from "./documents-step";
import { ConfirmationStep } from "./confirmation-step";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AddDriverProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddDriver: React.FC<AddDriverProps> = ({ userId, open, onOpenChange }) => {
  const stepLabels = ["Personal Info", "Next of Kin", "Health Questions", "Documents", "Confirmation"];
  const [driverId, setDriverId] = useState<number | null>(null);
  const [personalInfoData, setPersonalInfoData] = useState<any>(null);
  const [nextOfKinData, setNextOfKinData] = useState<any>(null);
  const [healthQuestionsData, setHealthQuestionsData] = useState<any>(null);
  const [documentsData, setDocumentsData] = useState<any>(null);

  return (
    <div className="flex items-center justify-center bg-background">
      <div className="w-full max-w-4xl relative">
        <Stepper totalSteps={stepLabels.length} initialStep={0} disableBack={true}>
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
            />
          </StepperContent>
          <StepperNavigation />
        </Stepper>
        <Button
          variant="ghost"
          className="absolute top-0 right-0"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default AddDriver;