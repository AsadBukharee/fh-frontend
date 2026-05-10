import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { StepType } from "./types";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cookies = useCookies()

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalDate(newDate);
    setError(null);

    // Update parent state
    setNewInspectionDate(newDate);

    // Skip API call if date hasn't changed
    if (newDate === currentInspectionDate) {
      return;
    }

    // Submit to API
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if required, e.g.:
          "Authorization": `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ inspection_expire: newDate }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update inspection date: ${response.statusText}`);
      }

      toast({
        title: "Success",
        description: "Inspection date updated successfully",
      });
      setStep("upload" as StepType);
    } catch (error) {
      console.error("Error updating inspection date:", error);
      setError("Failed to update inspection date. Please try again.");
      toast({
        title: "Error",
        description: "Failed to update inspection date. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Label htmlFor="inspectionDate" className="text-sm font-medium">
        Last PMI Expiration Date
      </Label>
      <Input
        id="inspectionDate"
        type="date"
        value={localDate}
        onChange={handleDateChange}
        className="mt-1"
        required
        disabled={isLoading}
        aria-describedby={error ? "date-error" : undefined}
      />
      {error && (
        <p id="date-error" className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Current date: {currentInspectionDate || "Not set"}
      </p>
    </div>
  );
};

export default InitialStep;