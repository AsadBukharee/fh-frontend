
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Eraser, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { debounce } from "lodash";
import DefectsInput from "@/components/ui/DefectsInput";
import FileUploader from "@/components/Media/MediaUpload";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";


// Lazy load SignatureCanvas
const SignatureCanvas = lazy(() => import("react-signature-canvas"));

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
  last_pmi_date: string;
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
}

interface FormData {
  analysis_date: string;
  vehicle: number | string;
  defects: string;
  notes: string;

  file_url: string;

  brake_imbalance: string;
  brake_imbalance_note: string;
  brake_test_not_recorded: string;
  brake_test_report_attached: string;
  maintenance_error_answer: string;
  maintenance_error_note: string;
  signature: string;
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
  signature?: string;
  tyre_pressure?: Record<string, string>;
  tyre_depth?: Record<string, string>;
  tyre_date?: Record<string, string>;
}

interface FHPMIOpenStepProps {
  vehicleRegistration: string;
  username: string;
  handleFHPMIComplete: () => void;
}

const initialFormData: FormData = {
  analysis_date: new Date().toISOString().split("T")[0], // Prefill with current date
  vehicle: "",
  defects: "",
  notes: "",

  file_url: "",

  brake_imbalance: "",
  brake_imbalance_note: "",
  brake_test_not_recorded: "",
  brake_test_report_attached: "",
  maintenance_error_answer: "",
  maintenance_error_note: "",
  signature: "",
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

const FHPMIOpenStep: React.FC<FHPMIOpenStepProps> = ({ vehicleRegistration, username, handleFHPMIComplete }) => {
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

  // Fetch vehicles and set vehicle based on registration
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

        // Set vehicle based on vehicleRegistration prop
        const selectedVehicle = uniqueVehicles.find((v: { registration_number: string; }) => v.registration_number === vehicleRegistration);
        if (selectedVehicle) {
          handleVehicleChange(selectedVehicle.id.toString());
        }
      } else {
        setError("Failed to load vehicles");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load vehicles");
    } finally {
      setVehiclesLoading(false);
    }
  }, [token, vehicleRegistration]);

  useEffect(() => {
    if (token) {
      fetchVehicles();
    }
  }, [token, fetchVehicles]);

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

  const handleSignatureClear = useCallback(() => {
    signatureCanvasRef.current?.clear();
    setFormData((prev) => ({ ...prev, signature: "" }));
    setSignatureSaved(false);
    setFormErrors((prev) => ({ ...prev, signature: undefined }));
  }, []);

  const handleSignatureSave = useCallback(() => {
    const signatureData = signatureCanvasRef.current?.getTrimmedCanvas().toDataURL("image/png");
    if (signatureData && !signatureCanvasRef.current?.isEmpty()) {
      setFormData((prev) => ({ ...prev, signature: signatureData }));
      setSignatureSaved(true);
      setFormErrors((prev) => ({ ...prev, signature: undefined }));
    } else {
      setFormErrors((prev) => ({ ...prev, signature: "Signature is required" }));
    }
  }, []);

  const handleFileUploadSuccess = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, file_url: url }));
    setFormErrors((prev) => ({ ...prev, file_url: undefined }));
  }, []);

  const flattenFormData = useCallback((data: FormData): Record<string, any> => {
    const flattened: Record<string, any> = { ...data };
    (["tyre_pressure", "tyre_depth", "tyre_date"] as const).forEach((field) => {
      const fieldData = data[field];
      if (fieldData && typeof fieldData === "object") {
        Object.entries(fieldData).forEach(([key, value]) => {
          flattened[`${field}_${key}`] = value;
        });
      }
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

    if (formData.file_url && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.file_url)) {
      errors.file_url = "Invalid URL format";
      isValid = false;
    }
    if (!formData.signature) {
      errors.signature = "Signature is required";
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

      setFormData(initialFormData);
      setSignatureSaved(false);
      signatureCanvasRef.current?.clear();
      handleFHPMIComplete(); // Call the callback to indicate completion
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create PMI record");
    } finally {
      setLoading(false);
    }
  }, [formData, token, flattenFormData, handleFHPMIComplete]);

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
    <div className="bg-white p-4 rounded-lg border border-blue-200">
      <p className="text-sm font-medium mb-3 text-blue-800">FH PMI Analysis Form</p>
      <div className="space-y-2 text-sm text-blue-700">
        <div className="grid grid-cols-2 gap-2">
          <div>Vehicle Registration: <span className="font-medium">{vehicleRegistration}</span></div>
          <div>Date: <span className="font-medium">{formatToDDMMYYYY(new Date())}</span></div>
          <div>Username: <span className="font-medium">{username}</span></div>
          <div>Status: <span className="font-medium text-green-600">Form Ready</span></div>
        </div>
      </div>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      )}
      <div className="mt-4 p-3 bg-white rounded border border-blue-300 max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">General Information</h3>
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
                <Select
                  value={formData.brake_test_not_recorded}
                  onValueChange={(value) => handleChange("brake_test_not_recorded", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="NA">NA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brake Test Report Attached
                </label>
                <Select
                  value={formData.brake_test_report_attached}
                  onValueChange={(value) => handleChange("brake_test_report_attached", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="NA">NA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Error Answer
                </label>
                <Select
                  value={formData.maintenance_error_answer}
                  onValueChange={(value) => handleChange("maintenance_error_answer", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="NA">NA</SelectItem>
                  </SelectContent>
                </Select>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature *
            </label>
            <Suspense fallback={<div>Loading signature canvas...</div>}>
              <div className="border border-gray-300 rounded-md p-2">
                <SignatureCanvas
                  ref={signatureCanvasRef}
                  canvasProps={{
                    className: "w-full h-32",
                    "aria-label": "Signature canvas",
                  }}
                  penColor="black"
                  backgroundColor="white"
                />
              </div>
            </Suspense>
            <div className="mt-2 flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSignatureClear}
                disabled={loading}
              >
                <Eraser className="mr-2 h-4 w-4" />
                Clear Signature
              </Button>
              <Button
                variant="outline"
                onClick={handleSignatureSave}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Signature
              </Button>
            </div>
            {signatureSaved && (
              <p className="text-green-500 text-sm mt-1">Signature saved</p>
            )}
            {formErrors.signature && (
              <p className="text-red-500 text-sm mt-1">{formErrors.signature}</p>
            )}
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
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit FH PMI Analysis"}
        </Button>
      </div>
    </div>
  );
};

export default FHPMIOpenStep;
