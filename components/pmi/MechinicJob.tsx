"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";
import AddMechanicDefectDialog from "../mechhanic-job/AddMechanicDefectDialog";

interface Vehicle {
  id: number;
  registration_number: string;
}

interface User {
  id: number;
  full_name: string;
}

interface PMIRecord {
  id: number;
  vehicle: number;
  vehicle_reg: string;
  defects: string;
  pmi_report_date: string;
}

interface MechanicJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onJobAdded: () => void;
  record: PMIRecord;
  vehicles: Vehicle[];
}

export default function MechanicJobDialog({
  isOpen,
  onOpenChange,
  onJobAdded,
  record,
  vehicles,
}: MechanicJobDialogProps) {
  const [formData, setFormData] = useState({
    vehicle: record.vehicle.toString(),
    mechanic: "",
    assignee: "",
    notes: record.defects || "",
    source: "pmiA",
    status: "in_house",
  });
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showJobIdModal, setShowJobIdModal] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const { showToast } = useToast();
  const cookies = useCookies();
  const yourToken = cookies.get("access_token");

  const fetchMechanics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users/list-names/?role=mechanic`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourToken}`,
        },
      });
      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setMechanics(data.data);
      } else {
        showToast(data.message || "Failed to fetch mechanics", "error");
      }
    } catch (error) {
      showToast("An error occurred while fetching mechanics", "error");
    }
  }, [yourToken, showToast]);

  const fetchAssignees = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users/list-names/?role=manager`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourToken}`,
        },
      });
      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setAssignees(data.data);
      } else {
        showToast(data.message || "Failed to fetch assignees", "error");
      }
    } catch (error) {
      showToast("An error occurred while fetching assignees", "error");
    }
  }, [yourToken, showToast]);

  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);
      Promise.all([fetchMechanics(), fetchAssignees()]).finally(() =>
        setDataLoading(false)
      );

      setFormData({
        vehicle: record.vehicle.toString(),
        mechanic: "",
        assignee: "",
        notes: record.defects || "",
        source: "pmiA",
        status: "in_house",
      });
      setFormErrors({});
    }
  }, [isOpen, record, fetchMechanics, fetchAssignees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.vehicle) errors.vehicle = "Vehicle is required";
    if (!formData.mechanic) errors.mechanic = "Mechanic is required";
    if (!formData.assignee) errors.assignee = "Assignee is required";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("Please correct the form errors", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vehicle_id: Number(formData.vehicle),
        mechanic: Number(formData.mechanic),
        assignee: Number(formData.assignee),
        notes: formData.notes,
        source: formData.source,
        status: formData.status,
        datetime: record.pmi_report_date || new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/activity/mechanic-job/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      if (response.ok && data.success) {
        showToast("Mechanic job created successfully", "success");
        setJobId(data.data.id);
        setShowJobIdModal(true);
        onJobAdded();
        onOpenChange(false);
      } else {
        if (response.status === 400 && data.errors) {
          setFormErrors(data.errors);
          showToast("Please correct the form errors", "error");
        } else {
          showToast(data.message || "Failed to create mechanic job", "error");
        }
      }
    } catch (error) {
      console.error("Error creating mechanic job:", error);
      showToast("An error occurred while creating the mechanic job", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (
    label: string,
    children: React.ReactNode,
    error?: string,
    required = false,
    description?: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {required && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            Required
          </Badge>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-semibold">
              Create Mechanic Job from PMI
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Create a mechanic job for vehicle {record.vehicle_reg} based on PMI
              report #{record.id}. All fields marked as required must be completed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {dataLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading form data...</span>
              </div>
            </div>
          )}

          {!dataLoading && (
            <div className="space-y-6 py-4">
              {/* Primary Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Primary Information
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {renderFormField(
                    "Vehicle",
                    <Select
                      value={formData.vehicle}
                      onValueChange={handleSelectChange("vehicle")}
                      disabled={vehicles.length === 0}
                    >
                      <SelectTrigger
                        className={formErrors.vehicle ? "border-destructive" : ""}
                      >
                        <SelectValue
                          placeholder={
                            vehicles.length === 0
                              ? "No vehicles available"
                              : "Select a vehicle"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem
                            key={vehicle.id}
                            value={vehicle.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                              {vehicle.registration_number}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>,
                    formErrors.vehicle,
                    true,
                    `Pre-selected: ${record.vehicle_reg}`
                  )}

                  {renderFormField(
                    "Assigned Mechanic",
                    <Select
                      value={formData.mechanic}
                      onValueChange={handleSelectChange("mechanic")}
                      disabled={mechanics.length === 0}
                    >
                      <SelectTrigger
                        className={formErrors.mechanic ? "border-destructive" : ""}
                      >
                        <SelectValue
                          placeholder={
                            mechanics.length === 0
                              ? "No mechanics available"
                              : "Select a mechanic"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {mechanics.map((mechanic) => (
                          <SelectItem
                            key={mechanic.id}
                            value={mechanic.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                              {mechanic.full_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>,
                    formErrors.mechanic,
                    true,
                    "Choose the mechanic responsible for this job"
                  )}
                </div>

                {renderFormField(
                  "Job Assignee",
                  <Select
                    value={formData.assignee}
                    onValueChange={handleSelectChange("assignee")}
                    disabled={assignees.length === 0}
                  >
                    <SelectTrigger
                      className={formErrors.assignee ? "border-destructive" : ""}
                    >
                      <SelectValue
                        placeholder={
                          assignees.length === 0
                            ? "No assignees available"
                            : "Select an assignee"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((assignee) => (
                        <SelectItem
                          key={assignee.id}
                          value={assignee.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                            {assignee.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>,
                  formErrors.assignee,
                  true,
                  "Manager or supervisor overseeing this job"
                )}
              </div>

              {/* Job Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Job Details
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {renderFormField(
                    "Source",
                    <Select
                      value={formData.source}
                      onValueChange={handleSelectChange("source")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pmiA">PMI A</SelectItem>
                        <SelectItem value="walkaround">Walkaround</SelectItem>
                        <SelectItem value="mot">MOT</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>,
                    undefined,
                    false,
                    "How was this issue identified?"
                  )}

                  {renderFormField(
                    "Status",
                    <Select
                      value={formData.status}
                      onValueChange={handleSelectChange("status")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_house">In House</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="in_workshop">In Workshop</SelectItem>
                        <SelectItem value="work_in_progress">
                          Work In Progress
                        </SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>,
                    undefined,
                    false,
                    "Current status of the job"
                  )}
                </div>

                {renderFormField(
                  "Additional Notes",
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes or special instructions..."
                    className="min-h-[80px] resize-none"
                  />,
                  undefined,
                  false,
                  `Defects from PMI: ${record.defects || "None"}`
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel
              disabled={loading || dataLoading}
              className="min-w-[100px]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={loading || dataLoading}
              className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMechanicDefectDialog
        showDefectsModal={showJobIdModal}
        setShowJobIdModal={setShowJobIdModal}
        jobId={jobId}
      />
    </>
  );
}