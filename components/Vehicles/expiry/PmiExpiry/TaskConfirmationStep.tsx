import React from "react";
import { Button } from "@/components/ui/button";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";

interface TaskConfirmationStepProps {
  vehicleRegistration: string;
  reminderDateTime: string;
  taskType: string;
  handleClose: () => void;
}

const TaskConfirmationStep: React.FC<TaskConfirmationStepProps> = ({
  vehicleRegistration,
  reminderDateTime,
  taskType,
  handleClose,
}) => (
  <div className="space-y-4">
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <p className="text-sm font-medium text-green-800">Task Created</p>
      <p className="text-sm text-green-700 mt-2">
        Task created for {taskType} upload for {vehicleRegistration} with deadline on{" "}
        {formatToDDMMYYYY(new Date(reminderDateTime))}.
      </p>
    </div>
    <Button onClick={handleClose} className="w-full">
      OK
    </Button>
  </div>
);

export default TaskConfirmationStep;