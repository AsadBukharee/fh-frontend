
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

type StepType = "reminder" | "brakeReminder";

interface ReminderStepProps {
  step: StepType;
  vehicleRegistration: string;
  reminderDateTime: string;
  setReminderDateTime: (value: string) => void;
 
}

const ReminderStep: React.FC<ReminderStepProps> = ({
  step,
  vehicleRegistration,
  reminderDateTime,
  setReminderDateTime,
  
}) => {
  const reminderType = step === "reminder" ? "PMI certificate" : "brake test re-booking";
  const token=useCookies().get("access_token") || ''
  const [isLoading, setIsLoading] = useState(false);

  const handleReminder = async (type: "pmi" | "brake", reminderType: string) => {
    setIsLoading(true);
    try {
      // Construct the API payload
      const payload = {
        title: `${reminderType} for ${vehicleRegistration}`,
        description: `Reminder for ${reminderType} for vehicle ${vehicleRegistration}`,
        priority: "medium",
        start_date: reminderDateTime.split("T")[0], // Extract date (e.g., "2025-08-31")
        recurrence: "daily",
        recurrence_interval: 1,
      };

      // Replace with your API host (set in .env)
      const apiUrl = `${API_URL}/api/reminders/`;

      // Make the API call
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if required, e.g.:
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Failed to save reminder: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Reminder saved successfully:", result);

      // Reset form and provide feedback
      setReminderDateTime("");
      alert("Reminder saved successfully!");
    } catch (error) {
      console.error("Error saving reminder:", error);
      alert("Failed to save reminder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <p className="text-sm font-medium text-blue-800">
          {step === "reminder" ? "PMI Certificate Reminder" : "Brake Test Reminder"}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Vehicle Registration: {vehicleRegistration}
          {step === "brakeReminder" && ` - Failed brake test on ${new Date().toLocaleDateString("en-GB")}`}
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
