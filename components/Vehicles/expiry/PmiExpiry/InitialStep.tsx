import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepType } from "./types";

interface InitialStepProps {
  newPMIDate: string;
  setNewPMIDate: (value: string) => void;
  lastPMIDate: string;
  setStep: (step: StepType) => void;
}

const InitialStep: React.FC<InitialStepProps> = ({ newPMIDate, setNewPMIDate, lastPMIDate, setStep }) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPMIDate(e.target.value);
    if (e.target.value !== lastPMIDate) {
      setStep("upload");
    }
  };

  return (
    <div>
      <Label htmlFor="pmiDate" className="text-sm font-medium">Last PMI Date</Label>
      <Input
        id="pmiDate"
        type="date"
        value={newPMIDate}
        onChange={handleDateChange}
        className="mt-1"
        required
      />
    </div>
  );
};

export default InitialStep;