import React from "react";
import { Button } from "@/components/ui/button";

interface ReminderConfirmationStepProps {
  vehicleRegistration: string;
  reminderDateTime: string;
  reminderType: string;
  handleClose: () => void;
}

const ReminderConfirmationStep: React.FC<ReminderConfirmationStepProps> = ({
  vehicleRegistration,
  reminderDateTime,
  reminderType,
  handleClose,
}) => (
  <div className="space-y-4">
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <p className="text-sm font-medium text-green-800">Reminder Saved</p>
      <p className="text-sm text-green-700 mt-2">
        Reminder set for {reminderType} upload for {vehicleRegistration} on{" "}
        {new Date(reminderDateTime).toLocaleDateString("en-GB")}.
      </p>
    </div>
    <Button onClick={handleClose} className="w-full">
      OK
    </Button>
  </div>
);

export default ReminderConfirmationStep;