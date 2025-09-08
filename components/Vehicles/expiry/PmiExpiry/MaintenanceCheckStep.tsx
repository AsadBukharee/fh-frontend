import React from "react";
import { Button } from "@/components/ui/button";
import { StepType } from "./types";

interface MaintenanceCheckStepProps {
  setMaintenanceCorrect: (value: boolean) => void;
  setStep: (step: StepType) => void;
}

const MaintenanceCheckStep: React.FC<MaintenanceCheckStepProps> = ({ setMaintenanceCorrect, setStep }) => (
  <div className="flex gap-3">
    <Button onClick={() => { setMaintenanceCorrect(true); setStep("mechanicJob"); }} className="flex-1">
      Yes - Correct
    </Button>
    <Button onClick={() => { setMaintenanceCorrect(false); setStep("notes"); }} variant="outline" className="flex-1">
      No - Incorrect
    </Button>
  </div>
);

export default MaintenanceCheckStep;