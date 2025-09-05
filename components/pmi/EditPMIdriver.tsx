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
import { Input } from "@/components/ui/input";
import DefectsInput from "../ui/DefectsInput";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertTriangle, Edit } from "lucide-react";

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

interface EditPMIProps {
  record: PMIRecord;
  onEdit: (updatedRecord: PMIRecord) => void;
}

export default function EditPMI({ record, onEdit }: EditPMIProps) {
  const [editRecord, setEditRecord] = useState<PMIRecord>({ ...record });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cookies = useCookies();
  const yourToken = cookies.get("access_token");

  const handleEditSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/activity/pmi-driver/${editRecord.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${yourToken}`,
          },
          body: JSON.stringify(editRecord),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update PMI record");
      }
      const updatedRecord: PMIRecord = await response.json();
      onEdit(updatedRecord);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error updating PMI record. Please try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="w-4 h-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[500px] overflow-y-auto rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle>Edit PMI Report</DialogTitle>
          <DialogDescription>Editing record #{editRecord.id}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle_reg">Vehicle Reg</Label>
            <Input
              id="vehicle_reg"
              value={editRecord.vehicle_reg}
              onChange={(e) =>
                setEditRecord({
                  ...editRecord,
                  vehicle_reg: e.target.value,
                })
              }
              placeholder="Enter vehicle registration"
              className="w-full"
              aria-required="true"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="defects">Defects</Label>
            <DefectsInput
              value={editRecord.defects}
              onChange={(newValue) =>
                setEditRecord({
                  ...editRecord,
                  defects: newValue,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editRecord.notes}
              onChange={(e) =>
                setEditRecord({
                  ...editRecord,
                  notes: e.target.value,
                })
              }
              placeholder="Additional notes"
              className="min-h-[80px]"
              aria-describedby="notes-description"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="action_taken">Action Taken</Label>
            <Textarea
              id="action_taken"
              value={editRecord.action_taken}
              onChange={(e) =>
                setEditRecord({
                  ...editRecord,
                  action_taken: e.target.value,
                })
              }
              placeholder="Document actions taken"
              className="min-h-[80px]"
              aria-describedby="action-taken-description"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setEditRecord(null)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            className="rounded-xl"
            disabled={loading}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}