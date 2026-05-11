import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { StepType } from "./types";

interface InitialStepProps {
  currentInspectionDate: string; // Current inspection date (from API)
  setNewInspectionDate: (value: string) => void; // Updates parent state for API payload
  setStep: (step: StepType) => void; // Advances to next step
  vehicleId: number; // For API endpoint
}

const InitialStep: React.FC<InitialStepProps> = ({
  currentInspectionDate,
  setNewInspectionDate,
  setStep,
  vehicleId,
}) => {
  const [localDate, setLocalDate] = useState(currentInspectionDate);
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalDate(newDate);
    // Update parent state
    setNewInspectionDate(newDate);
  };

  return (
    <div>
      <Label htmlFor="inspectionDate" className="text-sm font-medium">
        Last PMI Date
      </Label>
      <Input
        id="inspectionDate"
        type="date"
        value={localDate}
        onChange={handleDateChange}
        className="mt-1"
        required
      />
      <p className="text-xs text-muted-foreground mt-1">
        Current date: {currentInspectionDate || "Not set"}
      </p>
    </div>
  );
};

export default InitialStep;