"use client";
import { useState, useEffect, useRef, useCallback, useMemo, FC, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, AlertTriangle, Eraser, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import GradientButton from "@/app/utils/GradientButton";
import { debounce } from "lodash";
import FileUploader from "../Media/MediaUpload";
import DefectsInput from "../ui/DefectsInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_name: string;
  tyre_pressure_front_driver: string;
  tyre_pressure_front_passenger: string;
  tyre_pressure_rear_outer_driver: string;
  tyre_pressure_rear_outer_passenger: string;
  tyre_depth_front_driver: string;
  tyre_depth_front_passenger: string;
  tyre_depth_rear_outer_driver: string;
  tyre_depth_rear_outer_passenger: string;
  tyre_expiry_front_driver: string;
  tyre_expiry_front_passenger: string;
  tyre_expiry_rear_outer_driver: string;
  tyre_expiry_rear_outer_passenger: string;
  warnings: string[];
  vehicle_status: string;
  is_roadworthy: boolean;
  last_milage: string;
  inspection_cycle: number;
  inspection_expire: string;
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
}

interface FormData {
  analysis_date: string;
  vehicle: number | string;
  defects: string;
  notes: string;
  status: string;
  file_url: string;
  Correct_DTP_Code_Used: string;
  brake_imbalance: string;
  brake_imbalance_note: string;
  brake_test_not_recorded: string;
  brake_test_report_attached: string;
  maintenance_error_answer: string;
  maintenance_error_note: string;
  maintenence_provider_error: string;
  tyre_pressure: Record<string, number | string>;
  tyre_depth: Record<string, number | string>;
  tyre_date: Record<string, string>;
}

interface FormErrors {
  analysis_date?: string;
  vehicle?: string;
  status?: string;
  file_url?: string;
  tyre_pressure?: Record<string, string>;
  tyre_depth?: Record<string, string>;
  tyre_date?: Record<string, string>;
}

const initialFormData: FormData = {
  analysis_date: "",
  vehicle: "",
  defects: "",
  notes: "",
  status: "pending",
  file_url: "",
  Correct_DTP_Code_Used: "",
  brake_imbalance: "",
  brake_imbalance_note: "",
  brake_test_not_recorded: "",
  brake_test_report_attached: "",
  maintenance_error_answer: "",
  maintenance_error_note: "",
  maintenence_provider_error: "",
  tyre_pressure: {
    OSF: "",
    NSF: "",
    OSR_Outer: "",
    NSR_Outer: "",
    OSR_Inner: "",
    NSR_Inner: "",
  },
  tyre_depth: {
    OSF: "",
    NSF: "",
    OSR_Outer: "",
    NSR_Outer: "",
    OSR_Inner: "",
    NSR_Inner: "",
  },
  tyre_date: {
    OSF: "",
    NSF: "",
    OSR_Outer: "",
    NSR_Outer: "",
    OSR_Inner: "",
    NSR_Inner: "",
  },
};

const getSafetyColor = (value: number | string | null | undefined, field: string): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return "bg-gray-100 text-gray-800";

  const numValue = Number(value);

  if (field === "tyre_depth") {
    if (numValue < 1.5) return "bg-red-100 text-red-800";
    if (numValue <= 2) return "bg-orange-100 text-orange-800";
    if (numValue <= 8) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }

  if (field === "tyre_pressure") {
    if (numValue < 25 || numValue > 50) return "bg-red-100 text-red-800";
    if ((numValue >= 26 && numValue <= 28) || (numValue >= 44 && numValue <= 48))
      return "bg-orange-100 text-orange-800";
    if (numValue >= 29 && numValue <= 42) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }

  return "bg-gray-100 text-gray-800";
};

const AddPMI: FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const signatureCanvasRef = useRef<any>(null);
  const token = useCookies().get("access_token");
  const tyrePositions = useMemo(() => ["OSF", "NSF", "OSR_Outer", "NSR_Outer", "OSR_Inner", "NSR_Inner"], []);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Cache vehicles to prevent refetching
  const vehicleCache = useRef<Vehicle[]>([]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setFormErrors({});
      setFormData(initialFormData);
      setSignatureSaved(false);
      signatureCanvasRef.current?.clear();
    }
  }, [open]);

  // Fetch vehicles only if not cached
  const fetchVehicles = useCallback(async () => {
    if (vehicleCache.current.length > 0) {
      setVehicles(vehicleCache.current);
      return;
    }

    setVehiclesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "force-cache",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch vehicles: ${errorData.message || "Unknown error"}`);
      }
      const data = await response.json();
      if (data.success) {
        const uniqueVehicles = data.data.reduce((acc: Vehicle[], vehicle: Vehicle) => {
          if (!acc.some(v => v.registration_number === vehicle.registration_number && v.vehicle_type_name === vehicle.vehicle_type_name)) {
            acc.push(vehicle);
          }
          return acc;
        }, []);
        vehicleCache.current = uniqueVehicles;
        setVehicles(uniqueVehicles);
      } else {
        setError("Failed to load vehicles");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load vehicles");
    } finally {
      setVehiclesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && token) {
      fetchVehicles();
    }
  }, [open, token, fetchVehicles]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string | number | Record<string, string | number>) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const debouncedHandleTyreChange = useMemo(
    () =>
      debounce(
        (field: "tyre_pressure" | "tyre_depth" | "tyre_date", position: string, value: string) => {
          setFormData((prev) => ({
            ...prev,
            [field]: { ...prev[field], [position]: value },
          }));
          setFormErrors((prev) => ({
            ...prev,
            [field]: { ...prev[field], [position]: undefined },
          }));
        },
        300
      ),
    []
  );

  const handleFileUploadSuccess = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, file_url: url }));
    setFormErrors((prev) => ({ ...prev, file_url: undefined }));
  }, []);

  const flattenFormData = useCallback((data: FormData): Record<string, any> => {
    const flattened: Record<string, any> = { ...data };
    ["tyre_pressure", "tyre_depth", "tyre_date"].forEach((field) => {
      
      Object.entries((data as Record<string, any>)[field] || {}).forEach(([key, value]) => {
        flattened[`${field}_${key}`] = value;
      });
      delete flattened[field];
    });
    return flattened;
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.analysis_date) {
      errors.analysis_date = "Analysis date is required";
      isValid = false;
    }
    if (!formData.vehicle) {
      errors.vehicle = "Vehicle selection is required";
      isValid = false;
    }
    if (!formData.status) {
      errors.status = "Status is required";
      isValid = false;
    }
    if (formData.file_url && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.file_url)) {
      errors.file_url = "Invalid URL format";
      isValid = false;
    }

    const tyreErrors = {
      tyre_pressure: {} as Record<string, string>,
      tyre_depth: {} as Record<string, string>,
      tyre_date: {} as Record<string, string>,
    };

    for (const pos of tyrePositions) {
      if (formData.tyre_pressure[pos] && isNaN(Number(formData.tyre_pressure[pos]))) {
        tyreErrors.tyre_pressure[pos] = `Tyre pressure for ${pos} must be a valid number`;
        isValid = false;
      } else if (formData.tyre_pressure[pos] && (Number(formData.tyre_pressure[pos]) < 0 || Number(formData.tyre_pressure[pos]) > 100)) {
        tyreErrors.tyre_pressure[pos] = `Tyre pressure for ${pos} must be between 0 and 100 PSI`;
        isValid = false;
      }
      if (formData.tyre_depth[pos] && isNaN(Number(formData.tyre_depth[pos]))) {
        tyreErrors.tyre_depth[pos] = `Tyre depth for ${pos} must be a valid number`;
        isValid = false;
      } else if (formData.tyre_depth[pos] && (Number(formData.tyre_depth[pos]) < 0 || Number(formData.tyre_depth[pos]) > 10)) {
        tyreErrors.tyre_depth[pos] = `Tyre depth for ${pos} must be between 0 and 10 mm`;
        isValid = false;
      }
      if (formData.tyre_date[pos] && !/^\d{4}$/.test(formData.tyre_date[pos])) {
        tyreErrors.tyre_date[pos] = `Tyre date for ${pos} must be in YYWW format (e.g., 2325)`;
        isValid = false;
      }
    }

    if (Object.keys(tyreErrors.tyre_pressure).length) errors.tyre_pressure = tyreErrors.tyre_pressure;
    if (Object.keys(tyreErrors.tyre_depth).length) errors.tyre_depth = tyreErrors.tyre_depth;
    if (Object.keys(tyreErrors.tyre_date).length) errors.tyre_date = tyreErrors.tyre_date;

    setFormErrors(errors);
    if (!isValid) setError("Please fix the errors in the form");
    return isValid;
  }, [formData, tyrePositions]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setConfirmOpen(true);
  }, [validateForm]);

  const confirmSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const flattenedData = flattenFormData(formData);
      const response = await fetch(`${API_URL}/activity/pmi/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flattenedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.message || "Unknown error"}`);
      }

      setOpen(false);
      setConfirmOpen(false);
      setFormData(initialFormData);
      setSignatureSaved(false);
      signatureCanvasRef.current?.clear();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create PMI record");
    } finally {
      setLoading(false);
    }
  }, [formData, token, flattenFormData]);

  const handleVehicleChange = useCallback((vehicleId: string) => {
    const selectedVehicle = vehicles.find((v) => v.id === Number(vehicleId));
    const errors: string[] = [];
    
    if (selectedVehicle) {
      if (Number(selectedVehicle.tyre_pressure_front_passenger) > 100) {
        errors.push(`Front passenger tyre pressure (${selectedVehicle.tyre_pressure_front_passenger} PSI) is unrealistic`);
      }
      if (Number(selectedVehicle.tyre_depth_front_passenger) > 10) {
        errors.push(`Front passenger tyre depth (${selectedVehicle.tyre_depth_front_passenger} mm) is unrealistic`);
      }
      setError(errors.length ? errors.join("; ") : null);

      setFormData((prev) => ({
        ...prev,
        vehicle: vehicleId,
        tyre_pressure: {
          OSF: selectedVehicle.tyre_pressure_front_driver || "",
          NSF: selectedVehicle.tyre_pressure_front_passenger || "",
          OSR_Outer: selectedVehicle.tyre_pressure_rear_outer_driver || "",
          NSR_Outer: selectedVehicle.tyre_pressure_rear_outer_passenger || "",
          OSR_Inner: "",
          NSR_Inner: "",
        },
        tyre_depth: {
          OSF: selectedVehicle.tyre_depth_front_driver || "",
          NSF: selectedVehicle.tyre_depth_front_passenger || "",
          OSR_Outer: selectedVehicle.tyre_depth_rear_outer_driver || "",
          NSR_Outer: selectedVehicle.tyre_depth_rear_outer_passenger || "",
          OSR_Inner: "",
          NSR_Inner: "",
        },
        tyre_date: {
          OSF: selectedVehicle.tyre_expiry_front_driver || "",
          NSF: selectedVehicle.tyre_expiry_front_passenger || "",
          OSR_Outer: selectedVehicle.tyre_expiry_rear_outer_driver || "",
          NSR_Outer: selectedVehicle.tyre_expiry_rear_outer_passenger || "",
          OSR_Inner: "",
          NSR_Inner: "",
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicle: vehicleId,
        tyre_pressure: { OSF: "", NSF: "", OSR_Outer: "", NSR_Outer: "", OSR_Inner: "", NSR_Inner: "" },
        tyre_depth: { OSF: "", NSF: "", OSR_Outer: "", NSR_Outer: "", OSR_Inner: "", NSR_Inner: "" },
        tyre_date: { OSF: "", NSF: "", OSR_Outer: "", NSR_Outer: "", OSR_Inner: "", NSR_Inner: "" },
      }));
    }
    setFormErrors((prev) => ({ ...prev, vehicle: undefined }));
  }, [vehicles]);

  const memoizedVehicles = useMemo(() => vehicles, [vehicles]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <GradientButton text="Add" Icon={Plus} />
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New PMI Record</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center">
              <AlertTriangle className="mr-2" />
              {error}
            </div>
          )}
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Analysis Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.analysis_date}
                    onChange={(e) => handleChange("analysis_date", e.target.value)}
                    required
                    aria-required="true"
                    className={cn(formErrors.analysis_date && "border-red-500")}
                  />
                  {formErrors.analysis_date && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.analysis_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle *
                  </label>
                  <Select
                    value={formData.vehicle.toString()}
                    onValueChange={handleVehicleChange}
                    disabled={vehiclesLoading}
                    aria-required="true"
                  >
                    <SelectTrigger className={cn(formErrors.vehicle && "border-red-500")}>
                      <SelectValue placeholder={vehiclesLoading ? "Loading vehicles..." : "Select a vehicle"} />
                    </SelectTrigger>
                    <SelectContent>
                      {memoizedVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.registration_number} ({vehicle.vehicle_type_name})
                          {vehicle.warnings.length > 0 && (
                            <span className="ml-2 text-red-500">⚠️ {vehicle.warnings.length} issues</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.vehicle && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.vehicle}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Upload
                  </label>
                  <FileUploader onUploadSuccess={handleFileUploadSuccess} />
                  {formErrors.file_url && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.file_url}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Provider Error
                  </label>
                  <Input
                    value={formData.maintenence_provider_error}
                    onChange={(e) => handleChange("maintenence_provider_error", e.target.value)}
                  />
                </div>
              </div>
              <DefectsInput
                value={formData.defects}
                onChange={(newValue) => handleChange("defects", newValue)}
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Brake Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brake Imbalance
                  </label>
                  <Input
                    value={formData.brake_imbalance}
                    onChange={(e) => handleChange("brake_imbalance", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brake Imbalance Note
                  </label>
                  <Input
                    value={formData.brake_imbalance_note}
                    onChange={(e) => handleChange("brake_imbalance_note", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brake Test Not Recorded
                  </label>
                  <RadioGroup
                    value={formData.brake_test_not_recorded}
                    onValueChange={(value) => handleChange("brake_test_not_recorded", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="brake_test_not_recorded_yes" />
                      <Label htmlFor="brake_test_not_recorded_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="brake_test_not_recorded_no" />
                      <Label htmlFor="brake_test_not_recorded_no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NA" id="brake_test_not_recorded_na" />
                      <Label htmlFor="brake_test_not_recorded_na">NA</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brake Test Report Attached
                  </label>
                  <RadioGroup
                    value={formData.brake_test_report_attached}
                    onValueChange={(value) => handleChange("brake_test_report_attached", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="brake_test_report_attached_yes" />
                      <Label htmlFor="brake_test_report_attached_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="brake_test_report_attached_no" />
                      <Label htmlFor="brake_test_report_attached_no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NA" id="brake_test_report_attached_na" />
                      <Label htmlFor="brake_test_report_attached_na">NA</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Error Answer
                  </label>
                  <RadioGroup
                    value={formData.maintenance_error_answer}
                    onValueChange={(value) => handleChange("maintenance_error_answer", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="maintenance_error_answer_yes" />
                      <Label htmlFor="maintenance_error_answer_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="maintenance_error_answer_no" />
                      <Label htmlFor="maintenance_error_answer_no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NA" id="maintenance_error_answer_na" />
                      <Label htmlFor="maintenance_error_answer_na">NA</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Error Note
                  </label>
                  <Input
                    value={formData.maintenance_error_note}
                    onChange={(e) => handleChange("maintenance_error_note", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tyre Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tyrePositions.map((pos) => (
                  <div key={pos}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tyre Pressure {pos} (PSI)
                    </label>
                    <Input
                      type="number"
                      value={formData.tyre_pressure[pos]}
                      onChange={(e) => debouncedHandleTyreChange("tyre_pressure", pos, e.target.value)}
                      className={cn(getSafetyColor(formData.tyre_pressure[pos], "tyre_pressure"), formErrors.tyre_pressure?.[pos] && "border-red-500")}
                    />
                    {formErrors.tyre_pressure?.[pos] && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.tyre_pressure[pos]}</p>
                    )}
                  </div>
                ))}
                {tyrePositions.map((pos) => (
                  <div key={pos}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tyre Depth {pos} (mm)
                    </label>
                    <Input
                      type="number"
                      value={formData.tyre_depth[pos]}
                      onChange={(e) => debouncedHandleTyreChange("tyre_depth", pos, e.target.value)}
                      className={cn(getSafetyColor(formData.tyre_depth[pos], "tyre_depth"), formErrors.tyre_depth?.[pos] && "border-red-500")}
                    />
                    {formErrors.tyre_depth?.[pos] && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.tyre_depth[pos]}</p>
                    )}
                  </div>
                ))}
                {tyrePositions.map((pos) => (
                  <div key={pos}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tyre Date {pos} (YYWW)
                    </label>
                    <Input
                      value={formData.tyre_date[pos]}
                      onChange={(e) => debouncedHandleTyreChange("tyre_date", pos, e.target.value)}
                      placeholder="e.g., 2325"
                      className={cn(formErrors.tyre_date?.[pos] && "border-red-500")}
                    />
                    {formErrors.tyre_date?.[pos] && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.tyre_date[pos]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormData(initialFormData);
                signatureCanvasRef.current?.clear();
                setSignatureSaved(false);
              }}
              disabled={loading}
            >
              Reset Form
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Add PMI"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm PMI Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this PMI record? Please review the details:
              <ul className="mt-2 space-y-1">
                <li><strong>Vehicle:</strong> {vehicles.find(v => v.id === Number(formData.vehicle))?.registration_number || "N/A"}</li>
                <li><strong>Analysis Date:</strong> {formData.analysis_date || "N/A"}</li>
                <li><strong>Status:</strong> {formData.status || "N/A"}</li>
                <li><strong>File URL:</strong> {formData.file_url || "N/A"}</li>
                <li><strong>Tyre Pressures:</strong> {tyrePositions.map(pos => `${pos}: ${formData.tyre_pressure[pos] || "N/A"} PSI`).join(", ")}</li>
                <li><strong>Tyre Depths:</strong> {tyrePositions.map(pos => `${pos}: ${formData.tyre_depth[pos] || "N/A"} mm`).join(", ")}</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSubmit}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddPMI;