import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";

type StepType = "taskStep" | "brakeTaskStep";

interface TaskStepProps {
  step: StepType;
  vehicleRegistration: string;
  reminderDateTime: string;
  setReminderDateTime: (value: string) => void;
  onSuccess: () => void;
}

interface User {
  id: number;
  username: string;
  full_name?: string;
}

interface TaskType {
  id: number;
  name: string;
}

const TaskStep: React.FC<TaskStepProps> = ({
  step,
  vehicleRegistration,
  reminderDateTime,
  setReminderDateTime,
  onSuccess,
}) => {
  const taskTypeLabel = step === "taskStep" ? "PMI certificate" : "brake test re-booking";
  const token = useCookies().get("access_token") || '';
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, typesRes] = await Promise.all([
          fetch(`${API_URL}/users/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/task-types/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (usersRes.ok) {
          const json = await usersRes.json();
          setUsers(json.data?.results || json.results || []);
        }
        if (typesRes.ok) {
          const json = await typesRes.json();
          const results = json.data?.results || json.results || [];
          setTaskTypes(results);
          
          // Try to auto-select a relevant task type
          const relevantType = results.find((t: TaskType) => 
            t.name.toLowerCase().includes("maintenance") || 
            t.name.toLowerCase().includes("vehicle")
          );
          if (relevantType) setSelectedTaskType(String(relevantType.id));
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
      }
    };
    fetchData();
  }, [token]);

  const handleCreateTask = async () => {
    if (!reminderDateTime || !selectedUser || !selectedTaskType) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: `${taskTypeLabel} for ${vehicleRegistration}`,
        description: `Task for ${taskTypeLabel} for vehicle ${vehicleRegistration}`,
        priority: "medium",
        deadline: new Date(reminderDateTime).toISOString(),
        task_type: parseInt(selectedTaskType),
        assigned_to: parseInt(selectedUser),
      };

      const apiUrl = `${API_URL}/api/tasks/`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <p className="text-sm font-medium text-blue-800">
          {step === "taskStep" ? "PMI Certificate Task" : "Brake Test Task"}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Vehicle Registration: {vehicleRegistration}
          {step === "brakeTaskStep" && ` - Failed brake test on ${formatToDDMMYYYY(new Date())}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taskType" className="text-sm font-medium">Task Type</Label>
          <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
            <SelectTrigger id="taskType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo" className="text-sm font-medium">Assigned To</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger id="assignedTo">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.full_name || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline" className="text-sm font-medium">
          Deadline Date & Time
        </Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={reminderDateTime}
          onChange={(e) => setReminderDateTime(e.target.value)}
          required
        />
      </div>

      <Button
        onClick={handleCreateTask}
        disabled={isLoading || !reminderDateTime || !selectedUser || !selectedTaskType}
        className="w-full"
      >
        {isLoading ? "Creating..." : "Create Task"}
      </Button>
    </div>
  );
};

export default TaskStep;
