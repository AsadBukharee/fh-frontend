import React from "react";
import { Button } from "@/components/ui/button";
import { StepType } from "./types";

interface MechanicJobStepProps {
  createMechanicJob: boolean | null;
  setCreateMechanicJob: (value: boolean) => void;
  setStep: (step: StepType) => void;
}

const MechanicJobStep: React.FC<MechanicJobStepProps> = ({ createMechanicJob, setCreateMechanicJob, setStep }) => (
  createMechanicJob === null ? (
    <div className="flex gap-3">
      <Button onClick={() => { setCreateMechanicJob(true); setStep("mechanicJobForm"); }} className="flex-1">
        Yes - Create Job
      </Button>
      <Button onClick={() => { setCreateMechanicJob(false); setStep("driverPMI"); }} variant="outline" className="flex-1">
        No - Skip
      </Button>
    </div>
  ) : null
);

export default MechanicJobStep;