import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { StepType } from "./types";

interface DriverErrorsStepProps {
  driverErrors: boolean | null;
  setDriverErrors: (value: boolean) => void;
  setStep: (step: StepType) => void;
}

const DriverErrorsStep: React.FC<DriverErrorsStepProps> = ({ driverErrors, setDriverErrors, setStep }) => (
  driverErrors === null ? (
    <div className="flex gap-3">
      <Button onClick={() => { setDriverErrors(true); setStep("driverTraining"); }} variant="outline" className="flex-1">
        Yes - Errors Found
      </Button>
      <Button onClick={() => {
        setDriverErrors(false);
        toast({ title: "Success", description: "All entries saved with time, date, and username stamp" });
        setStep("interimUpload");
      }} className="flex-1">
        No - No Errors
      </Button>
    </div>
  ) : null
);

export default DriverErrorsStep;