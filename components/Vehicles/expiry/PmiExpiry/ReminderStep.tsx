import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepType } from "./types";

interface ReminderStepProps {
  step: StepType;
  vehicleRegistration: string;
  reminderDateTime: string;
  setReminderDateTime: (value: string) => void;
  handleReminder: (type: "pmi" | "brake", reminderType: string) => void; // Updated to include reminderType
  isLoading: boolean;
}

const ReminderStep: React.FC<ReminderStepProps> = ({
  step,
  vehicleRegistration,
  reminderDateTime,
  setReminderDateTime,
  handleReminder,
  isLoading,
}) => {
  const reminderType = step === "reminder" ? "PMI certificate" : "brake test re-booking";

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <p className="text-sm font-medium text-blue-800">
          {step === "reminder" ? "PMI Certificate Reminder" : "Brake Test Reminder"}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Vehicle Registration: {vehicleRegistration}
          {step === "brakeReminder" && ` - Failed brake test on ${new Date().toLocaleDateString()}`}
        </p>
      </div>
      <div>
        <Label htmlFor="reminderDateTime" className="text-sm font-medium">
          Reminder Date & Time
        </Label>
        <Input
          id="reminderDateTime"
          type="datetime-local"
          value={reminderDateTime}
          onChange={(e) => setReminderDateTime(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <Button
        onClick={() => handleReminder(step === "reminder" ? "pmi" : "brake", reminderType)}
        disabled={isLoading || !reminderDateTime}
        className="w-full"
      >
        {isLoading ? "Processing..." : "Save Reminder"}
      </Button>
    </div>
  );
};

export default ReminderStep;