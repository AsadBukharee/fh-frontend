import React from "react";
import { Button } from "@/components/ui/button";
import { StepType } from "./types";

interface BrakeTestStepProps {
  setBrakeTestPassed: (value: boolean) => void;
  setStep: (step: StepType) => void;
}

const BrakeTestStep: React.FC<BrakeTestStepProps> = ({ setBrakeTestPassed, setStep }) => (
  <div className="flex gap-3">
    <Button onClick={() => { setBrakeTestPassed(true); setStep("fhPMI"); }} className="flex-1">
      Yes - Passed
    </Button>
    <Button onClick={() => { setBrakeTestPassed(false); setStep("brakeReminder"); }} variant="outline" className="flex-1">
      No - Failed
    </Button>
  </div>
);

export default BrakeTestStep;