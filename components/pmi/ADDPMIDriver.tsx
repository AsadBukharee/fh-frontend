"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus } from "lucide-react";
import GradientButton from "@/app/utils/GradientButton";
import DefectsInput from "../ui/DefectsInput";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_name: string;
}

interface PMIRecord {
  id: number;
  pmi: number;
  notes: string;
  status: string;
  vehicle: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  action_taken: string;
  identified_by_driver: boolean;
  defect_previously_noted: boolean;
  pmi_expiry: string;
  vehicle_reg: string;
  defects: string;
  pmi_report_date: string;
}

interface AddPMIProps {
  vehicles: Vehicle[];
  vehiclesLoading: boolean;
  vehiclesError: string | null;
  onCreate: (newRecord: PMIRecord) => void;
}

export default function AddPMI({
  vehicles,
  vehiclesLoading,
  vehiclesError,
  onCreate,
}: AddPMIProps) {
  const [createRecord, setCreateRecord] = useState<Partial<PMIRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cookies = useCookies();
  const yourToken = cookies.get("access_token");

  const getCurrentUserId = () => {
    return 2; // Replace with actual logic
  };

  const handleCreateSubmit = async () => {
    if (!createRecord?.vehicle) {
      setError("Vehicle is required.");
      return;
    }
    if (!createRecord?.pmi_report_date) {
      setError("Analysis date is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        vehicle: createRecord.vehicle,
        pmi: createRecord.pmi || 1,
        notes: createRecord.notes || "",
        status: createRecord.status || "created",
        defects: createRecord.defects || "",
        created_by: getCurrentUserId(),
        action_taken: createRecord.action_taken || "",
        pmi_report_date: createRecord.pmi_report_date || "",
        identified_by_driver: createRecord.identified_by_driver || false,
        defect_previously_noted: createRecord.defect_previously_noted || false,
      };
      const response = await fetch(`${API_URL}/activity/pmi-driver/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${yourToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create PMI record");
      }
      const newRecord: PMIRecord = await response.json();
      onCreate(newRecord);
      setCreateRecord(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error creating PMI record. Please try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <GradientButton text="New PMI Report" Icon={Plus} />
      </DialogTrigger>
      <DialogContent className="h-[600px] overflow-y-auto rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle>Create New PMI Report</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new PMI report. Vehicle and
            analysis date are required.
          </DialogDescription>
        </DialogHeader>
        {vehiclesLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading vehicles...</p>
          </div>
        )}
        {vehiclesError && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{vehiclesError}</AlertDescription>
          </Alert>
        )}
        {!vehiclesLoading && !vehiclesError && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select
                value={createRecord?.vehicle?.toString() || ""}
                onValueChange={(value) =>
                  setCreateRecord({
                    ...createRecord,
                    vehicle: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="vehicle" className="w-full">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem
                      key={vehicle.id}
                      value={vehicle.id.toString()}
                    >
                      {vehicle.registration_number} ({vehicle.vehicle_type_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={createRecord?.notes || ""}
                onChange={(e) =>
                  setCreateRecord({ ...createRecord, notes: e.target.value })
                }
                placeholder="Additional notes"
                className="min-h-[80px]"
                aria-describedby="notes-description"
              />
            </div>
            <div className="flex flex-col gap-2">
              <DefectsInput
                value={createRecord?.defects || ""}
                onChange={(newValue) =>
                  setCreateRecord({ ...createRecord, defects: newValue })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="action_taken">Action Taken</Label>
              <Textarea
                id="action_taken"
                value={createRecord?.action_taken || ""}
                onChange={(e) =>
                  setCreateRecord({
                    ...createRecord,
                    action_taken: e.target.value,
                  })
                }
                placeholder="Document actions taken"
                className="min-h-[80px]"
                aria-describedby="action-taken-description"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pmi_report_date">Analysis Date *</Label>
              <Input
                id="pmi_report_date"
                type="date"
                value={createRecord?.pmi_report_date || ""}
                onChange={(e) =>
                  setCreateRecord({
                    ...createRecord,
                    pmi_report_date: e.target.value,
                  })
                }
                className="w-full"
                required
                aria-required="true"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="identified_by_driver"
                checked={createRecord?.identified_by_driver || false}
                onCheckedChange={(checked) =>
                  setCreateRecord({
                    ...createRecord,
                    identified_by_driver: !!checked,
                  })
                }
              />
              <Label htmlFor="identified_by_driver">
                Identified by Driver
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="defect_previously_noted"
                checked={createRecord?.defect_previously_noted || false}
                onCheckedChange={(checked) =>
                  setCreateRecord({
                    ...createRecord,
                    defect_previously_noted: !!checked,
                  })
                }
              />
              <Label htmlFor="defect_previously_noted">
                Defect Previously Noted
              </Label>
            </div>
          </div>
        )}
        <DialogFooter className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setCreateRecord(null)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit}
            className="rounded-xl"
            disabled={vehiclesLoading || !!vehiclesError || loading}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}