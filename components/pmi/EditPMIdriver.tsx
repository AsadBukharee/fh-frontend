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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [editOpen, setEditOpen] = useState(false);
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
            Authorization: `Bearer ${yourToken}`,
          },
          body: JSON.stringify({
            ...editRecord,
            // Ensure dates are in the correct format if needed by the API
            pmi_report_date: editRecord.pmi_report_date || null,
            pmi_expiry: editRecord.pmi_expiry || null,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update PMI record");
        throw new Error(errorData.message || "Failed to update PMI record");
      }
      const updatedRecord: PMIRecord = await response.json();
      onEdit(updatedRecord);
      setEditOpen(false); // Close dialog only on success
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error updating PMI record. Please try again."
      );
      console.error(err);
      // Do NOT close dialog here to allow user to see the error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full flex justify-start py-1 px-2 text-gray-700"
          onClick={() => {
            setEditRecord({ ...record }); // Reset to original record
            setError(null); // Clear any errors
            setEditOpen(true);
          }}
        >
          <Edit className="w-4 h-4" />
          <span className="ml-2">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[600px] overflow-y-auto rounded-2xl shadow-lg">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="identified_by_driver">Identified by Driver</Label>
            <Select
              value={editRecord.identified_by_driver ? "yes" : "no"}
              onValueChange={(value) =>
                setEditRecord({
                  ...editRecord,
                  identified_by_driver: value === "yes",
                })
              }
            >
              <SelectTrigger id="identified_by_driver">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="defect_previously_noted">Previously Noted</Label>
            <Select
              value={editRecord.defect_previously_noted ? "yes" : "no"}
              onValueChange={(value) =>
                setEditRecord({
                  ...editRecord,
                  defect_previously_noted: value === "yes",
                })
              }
            >
              <SelectTrigger id="defect_previously_noted">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setEditRecord({ ...record }); // Reset to original record
              setError(null); // Clear any errors
              setEditOpen(false); // Close dialog
            }}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            className="rounded-xl"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}