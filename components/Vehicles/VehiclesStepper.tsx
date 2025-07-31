"use client";
import * as React from "react";
import { Stepper, StepperTabs, StepperContent, StepperNavigation } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Car } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import FileUploader from "../Media/UploadFile";

// Define interfaces
interface Driver {
  id: number;
  full_name: string;
  avatar: string | null;
}

interface VehicleFormData {
  assignee_driver: number | null;
  last_milage: number | null;
  vehicles_type_id: number | null;
  registration_number: string;
  site_allocated_id: number | null;
  vehicle_status: string;
  is_roadworthy: boolean;
  inspection_cycle: number | null;
  inspection_expire: string;
  inspection_appointment: string;
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
  tacho_download: string;
  tacho_calibration: string;
  tyre_expiry_front_driver: string;
  tyre_expiry_front_passenger: string;
  tyre_expiry_rear_outer_driver: string;
  tyre_expiry_rear_outer_passenger: string;
  vehicle_cost: number | null;
  vehicle_picture: string;
  tyre_pressure_front_driver: number | null;
  tyre_pressure_front_passenger: number | null;
  tyre_pressure_rear_outer_driver: number | null;
  tyre_pressure_rear_outer_passenger: number | null;
  tyre_depth_front_driver: number | null;
  tyre_depth_front_passenger: number | null;
  tyre_depth_rear_outer_driver: number | null;
  tyre_depth_rear_outer_passenger: number | null;
  tyre_torque_front_driver: number | null;
  tyre_torque_front_passenger: number | null;
  tyre_torque_rear_outer_driver: number | null;
  tyre_torque_rear_outer_passenger: number | null;
  log_book: string;
  mot: string;
  inspection: string;
  insurance: string;
  fitness_certificate: string;
  route_permit: string;
  financial: string;
  others: string;
  service_records: string;
  tax: string;
  tacho_download_docs: string;
  tacho_calibration_docs: string;
}

interface VehicleType {
  id: number;
  name: string;
  description?: string;
}

interface Site {
  id: number;
  name: string;
}

export default function AddVehicleStepper() {
  // Initialize form data state
  const [formData, setFormData] = React.useState<VehicleFormData>({
    assignee_driver: null,
    last_milage: null,
    vehicles_type_id: null,
    registration_number: "",
    site_allocated_id: null,
    vehicle_status: "available",
    is_roadworthy: true,
    inspection_cycle: null,
    inspection_expire: "",
    inspection_appointment: "",
    mot_expiry: "",
    tax_expiry: "",
    insurance_expiry: "",
    tacho_download: "",
    tacho_calibration: "",
    tyre_expiry_front_driver: "",
    tyre_expiry_front_passenger: "",
    tyre_expiry_rear_outer_driver: "",
    tyre_expiry_rear_outer_passenger: "",
    vehicle_cost: null,
    vehicle_picture: "",
    tyre_pressure_front_driver: null,
    tyre_pressure_front_passenger: null,
    tyre_pressure_rear_outer_driver: null,
    tyre_pressure_rear_outer_passenger: null,
    tyre_depth_front_driver: null,
    tyre_depth_front_passenger: null,
    tyre_depth_rear_outer_driver: null,
    tyre_depth_rear_outer_passenger: null,
    tyre_torque_front_driver: null,
    tyre_torque_front_passenger: null,
    tyre_torque_rear_outer_driver: null,
    tyre_torque_rear_outer_passenger: null,
    log_book: "",
    mot: "",
    inspection: "",
    insurance: "",
    fitness_certificate: "",
    route_permit: "",
    financial: "",
    others: "",
    service_records: "",
    tax: "",
    tacho_download_docs: "",
    tacho_calibration_docs: "",
  });

  const [vehicleTypes, setVehicleTypes] = React.useState<VehicleType[]>([]);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [vehicleTypesLoading, setVehicleTypesLoading] = React.useState(false);
  const [sitesLoading, setSitesLoading] = React.useState(false);
  const [driversLoading, setDriversLoading] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const cookies = useCookies();

  // Handle file upload success
  const handleFileUploadSuccess = (field: keyof VehicleFormData) => (url: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: url,
    }));
  };

  // Fetch vehicle types, sites, and drivers on mount
  React.useEffect(() => {
    const fetchVehicleTypes = async () => {
      setVehicleTypesLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/vehicle-types/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setVehicleTypes(data.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load vehicle types.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching vehicle types:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching vehicle types.",
          variant: "destructive",
        });
      } finally {
        setVehicleTypesLoading(false);
      }
    };

    const fetchSites = async () => {
      setSitesLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/sites/list-names/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setSites(data.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load sites.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching sites:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching sites.",
          variant: "destructive",
        });
      } finally {
        setSitesLoading(false);
      }
    };

    const fetchDrivers = async () => {
      setDriversLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setDrivers(data.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load drivers.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching drivers.",
          variant: "destructive",
        });
      } finally {
        setDriversLoading(false);
      }
    };

    fetchVehicleTypes();
    fetchSites();
    fetchDrivers();
  }, [cookies]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle select changes (handles both number and string values)
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "vehicle_status" ? value : value ? parseInt(value) : null,
    }));
  };

  // Handle number input changes
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : null,
    }));
  };

  // Validate required fields
  const isFormValid = () => {
    return (
      formData.registration_number &&
      formData.vehicles_type_id !== null &&
      formData.site_allocated_id !== null
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep !== steps.length - 1) {
      toast({
        title: "Incomplete",
        description: "Please complete all steps before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!API_URL) {
      toast({
        title: "Configuration Error",
        description: "API URL is not defined.",
        variant: "destructive",
      });
      return;
    }

    const token = cookies.get("access_token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "No access token found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vehicle added successfully!",
        });
        // Reset form
        setFormData({
          assignee_driver: null,
          last_milage: null,
          vehicles_type_id: null,
          registration_number: "",
          site_allocated_id: null,
          vehicle_status: "available",
          is_roadworthy: true,
          inspection_cycle: null,
          inspection_expire: "",
          inspection_appointment: "",
          mot_expiry: "",
          tax_expiry: "",
          insurance_expiry: "",
          tacho_download: "",
          tacho_calibration: "",
          tyre_expiry_front_driver: "",
          tyre_expiry_front_passenger: "",
          tyre_expiry_rear_outer_driver: "",
          tyre_expiry_rear_outer_passenger: "",
          vehicle_cost: null,
          vehicle_picture: "",
          tyre_pressure_front_driver: null,
          tyre_pressure_front_passenger: null,
          tyre_pressure_rear_outer_driver: null,
          tyre_pressure_rear_outer_passenger: null,
          tyre_depth_front_driver: null,
          tyre_depth_front_passenger: null,
          tyre_depth_rear_outer_driver: null,
          tyre_depth_rear_outer_passenger: null,
          tyre_torque_front_driver: null,
          tyre_torque_front_passenger: null,
          tyre_torque_rear_outer_driver: null,
          tyre_torque_rear_outer_passenger: null,
          log_book: "",
          mot: "",
          inspection: "",
          insurance: "",
          fitness_certificate: "",
          route_permit: "",
          financial: "",
          others: "",
          service_records: "",
          tax: "",
          tacho_download_docs: "",
          tacho_calibration_docs: "",
        });
        setActiveStep(0);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to add vehicle. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding the vehicle.",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Stepper steps
  const steps = [
    {
      label: "Basic Information",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="registration_number">Registration Number *</Label>
            <Input
              id="registration_number"
              name="registration_number"
              placeholder="Enter registration number"
              value={formData.registration_number}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="vehicles_type_id">Vehicle Type *</Label>
            <Select
              name="vehicles_type_id"
              value={formData.vehicles_type_id?.toString() || ""}
              onValueChange={(value) => handleSelectChange("vehicles_type_id", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypesLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  </SelectItem>
                ) : vehicleTypes.length === 0 ? (
                  <SelectItem value="none" disabled>No types available</SelectItem>
                ) : (
                  vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <Badge className="bg-blue-100 text-blue-700">{type.name}</Badge>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="site_allocated_id">Site Allocated *</Label>
            <Select
              name="site_allocated_id"
              value={formData.site_allocated_id?.toString() || ""}
              onValueChange={(value) => handleSelectChange("site_allocated_id", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {sitesLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  </SelectItem>
                ) : sites.length === 0 ? (
                  <SelectItem value="none" disabled>No active sites</SelectItem>
                ) : (
                  sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      <Badge className="bg-blue-100 text-blue-700">{site.name}</Badge>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vehicle_status">Status</Label>
            <Select
              name="vehicle_status"
              value={formData.vehicle_status}
              onValueChange={(value) => handleSelectChange("vehicle_status", value)}
              defaultValue="available"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="assignee_driver">Assignee Driver</Label>
            <Select
              name="assignee_driver"
              value={formData.assignee_driver?.toString() || ""}
              onValueChange={(value) => handleSelectChange("assignee_driver", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                {driversLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  </SelectItem>
                ) : drivers.length === 0 ? (
                  <SelectItem value="none" disabled>No drivers available</SelectItem>
                ) : (
                  drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.full_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="last_milage">Last Mileage</Label>
            <Input
              id="last_milage"
              name="last_milage"
              type="number"
              step="0.01"
              value={formData.last_milage || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 84231.50"
            />
          </div>
          <div>
            <Label htmlFor="vehicle_cost">Vehicle Cost</Label>
            <Input
              id="vehicle_cost"
              name="vehicle_cost"
              type="number"
              value={formData.vehicle_cost || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 28000"
            />
          </div>
          <div>
            <Label htmlFor="vehicle_picture">Vehicle Picture</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("vehicle_picture")} />
            {formData.vehicle_picture && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.vehicle_picture}</p>
            )}
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1.5">
            <Label htmlFor="is_roadworthy" className="mb-0">Roadworthy</Label>
            <Switch
              id="is_roadworthy"
              name="is_roadworthy"
              checked={formData.is_roadworthy}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_roadworthy: checked }))
              }
            />
          </div>
        </div>
      ),
    },
    {
      label: "Expiry Dates",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inspection_cycle">Inspection Cycle (days)</Label>
            <Input
              id="inspection_cycle"
              name="inspection_cycle"
              type="number"
              value={formData.inspection_cycle || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 30"
            />
          </div>
          <div>
            <Label htmlFor="inspection_expire">Inspection Expiry</Label>
            <Input
              id="inspection_expire"
              name="inspection_expire"
              type="date"
              value={formData.inspection_expire}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="inspection_appointment">Inspection Appointment</Label>
            <Input
              id="inspection_appointment"
              name="inspection_appointment"
              type="date"
              value={formData.inspection_appointment}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="mot_expiry">MOT Expiry</Label>
            <Input
              id="mot_expiry"
              name="mot_expiry"
              type="date"
              value={formData.mot_expiry}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tax_expiry">Tax Expiry</Label>
            <Input
              id="tax_expiry"
              name="tax_expiry"
              type="date"
              value={formData.tax_expiry}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
            <Input
              id="insurance_expiry"
              name="insurance_expiry"
              type="date"
              value={formData.insurance_expiry}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tacho_download">Tacho Download</Label>
            <Input
              id="tacho_download"
              name="tacho_download"
              type="date"
              value={formData.tacho_download}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tacho_calibration">Tacho Calibration</Label>
            <Input
              id="tacho_calibration"
              name="tacho_calibration"
              type="date"
              value={formData.tacho_calibration}
              onChange={handleInputChange}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Tire Details",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tyre_expiry_front_driver">Front Driver Tire Expiry</Label>
            <Input
              id="tyre_expiry_front_driver"
              name="tyre_expiry_front_driver"
              type="date"
              value={formData.tyre_expiry_front_driver}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tyre_expiry_front_passenger">Front Passenger Tire Expiry</Label>
            <Input
              id="tyre_expiry_front_passenger"
              name="tyre_expiry_front_passenger"
              type="date"
              value={formData.tyre_expiry_front_passenger}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tyre_expiry_rear_outer_driver">Rear Outer Driver Tire Expiry</Label>
            <Input
              id="tyre_expiry_rear_outer_driver"
              name="tyre_expiry_rear_outer_driver"
              type="date"
              value={formData.tyre_expiry_rear_outer_driver}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tyre_expiry_rear_outer_passenger">Rear Outer Passenger Tire Expiry</Label>
            <Input
              id="tyre_expiry_rear_outer_passenger"
              name="tyre_expiry_rear_outer_passenger"
              type="date"
              value={formData.tyre_expiry_rear_outer_passenger}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="tyre_pressure_front_driver">Front Driver Tire Pressure (PSI)</Label>
            <Input
              id="tyre_pressure_front_driver"
              name="tyre_pressure_front_driver"
              type="number"
              step="0.1"
              value={formData.tyre_pressure_front_driver || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 32.5"
            />
          </div>
          <div>
            <Label htmlFor="tyre_pressure_front_passenger">Front Passenger Tire Pressure (PSI)</Label>
            <Input
              id="tyre_pressure_front_passenger"
              name="tyre_pressure_front_passenger"
              type="number"
              step="0.1"
              value={formData.tyre_pressure_front_passenger || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 32.0"
            />
          </div>
          <div>
            <Label htmlFor="tyre_pressure_rear_outer_driver">Rear Outer Driver Tire Pressure (PSI)</Label>
            <Input
              id="tyre_pressure_rear_outer_driver"
              name="tyre_pressure_rear_outer_driver"
              type="number"
              step="0.1"
              value={formData.tyre_pressure_rear_outer_driver || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 35.0"
            />
          </div>
          <div>
            <Label htmlFor="tyre_pressure_rear_outer_passenger">Rear Outer Passenger Tire Pressure (PSI)</Label>
            <Input
              id="tyre_pressure_rear_outer_passenger"
              name="tyre_pressure_rear_outer_passenger"
              type="number"
              step="0.1"
              value={formData.tyre_pressure_rear_outer_passenger || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 35.5"
            />
          </div>
          <div>
            <Label htmlFor="tyre_depth_front_driver">Front Driver Tire Depth (mm)</Label>
            <Input
              id="tyre_depth_front_driver"
              name="tyre_depth_front_driver"
              type="number"
              step="0.1"
              value={formData.tyre_depth_front_driver || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 7.2"
            />
          </div>
          <div>
            <Label htmlFor="tyre_depth_front_passenger">Front Passenger Tire Depth (mm)</Label>
            <Input
              id="tyre_depth_front_passenger"
              name="tyre_depth_front_passenger"
              type="number"
              step="0.1"
              value={formData.tyre_depth_front_passenger || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 7.1"
            />
          </div>
          <div>
            <Label htmlFor="tyre_depth_rear_outer_driver">Rear Outer Driver Tire Depth (mm)</Label>
            <Input
              id="tyre_depth_rear_outer_driver"
              name="tyre_depth_rear_outer_driver"
              type="number"
              step="0.1"
              value={formData.tyre_depth_rear_outer_driver || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 6.9"
            />
          </div>
          <div>
            <Label htmlFor="tyre_depth_rear_outer_passenger">Rear Outer Passenger Tire Depth (mm)</Label>
            <Input
              id="tyre_depth_rear_outer_passenger"
              name="tyre_depth_rear_outer_passenger"
              type="number"
              step="0.1"
              value={formData.tyre_depth_rear_outer_passenger || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 7.0"
            />
          </div>
          <div>
            <Label htmlFor="tyre_torque_front_driver">Front Driver Tire Torque (Nm)</Label>
            <Input
              id="tyre_torque_front_driver"
              name="tyre_torque_front_driver"
              type="number"
              step="0.1"
              value={formData.tyre_torque_front_driver || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 130.0"
            />
          </div>
          <div>
            <Label htmlFor="tyre_torque_front_passenger">Front Passenger Tire Torque (Nm)</Label>
            <Input
              id="tyre_torque_front_passenger"
              name="tyre_torque_front_passenger"
              type="number"
              step="0.1"
              value={formData.tyre_torque_front_passenger || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 130.0"
            />
          </div>
          <div>
            <Label htmlFor="tyre_torque_rear_outer_driver">Rear Outer Driver Tire Torque (Nm)</Label>
            <Input
              id="tyre_torque_rear_outer_driver"
              name="tyre_torque_rear_outer_driver"
              type="number"
              step="0.1"
              value={formData.tyre_torque_rear_outer_driver || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 135.0"
            />
          </div>
          <div>
            <Label htmlFor="tyre_torque_rear_outer_passenger">Rear Outer Passenger Tire Torque (Nm)</Label>
            <Input
              id="tyre_torque_rear_outer_passenger"
              name="tyre_torque_rear_outer_passenger"
              type="number"
              step="0.1"
              value={formData.tyre_torque_rear_outer_passenger || ""}
              onChange={handleNumberInputChange}
              placeholder="e.g., 135.0"
            />
          </div>
        </div>
      ),
    },
    {
      label: "Documents",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="log_book">Log Book</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("log_book")} />
            {formData.log_book && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.log_book}</p>
            )}
          </div>
          <div>
            <Label htmlFor="mot">MOT</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("mot")} />
            {formData.mot && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.mot}</p>
            )}
          </div>
          <div>
            <Label htmlFor="inspection">Inspection</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("inspection")} />
            {formData.inspection && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.inspection}</p>
            )}
          </div>
          <div>
            <Label htmlFor="insurance">Insurance</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("insurance")} />
            {formData.insurance && (
              <p className="text-sm text-grayHV600 mt-2">Uploaded: {formData.insurance}</p>
            )}
          </div>
          <div>
            <Label htmlFor="fitness_certificate">Fitness Certificate</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("fitness_certificate")} />
            {formData.fitness_certificate && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.fitness_certificate}</p>
            )}
          </div>
          <div>
            <Label htmlFor="route_permit">Route Permit</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("route_permit")} />
            {formData.route_permit && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.route_permit}</p>
            )}
          </div>
          <div>
            <Label htmlFor="financial">Financial Document</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("financial")} />
            {formData.financial && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.financial}</p>
            )}
          </div>
          <div>
            <Label htmlFor="others">Other Documents</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("others")} />
            {formData.others && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.others}</p>
            )}
          </div>
          <div>
            <Label htmlFor="service_records">Service Records</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("service_records")} />
            {formData.service_records && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.service_records}</p>
            )}
          </div>
          <div>
            <Label htmlFor="tax">Tax Document</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("tax")} />
            {formData.tax && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.tax}</p>
            )}
          </div>
          <div>
            <Label htmlFor="tacho_download_docs">Tacho Download Docs</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("tacho_download_docs")} />
            {formData.tacho_download_docs && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.tacho_download_docs}</p>
            )}
          </div>
          <div>
            <Label htmlFor="tacho_calibration_docs">Tacho Calibration Docs</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("tacho_calibration_docs")} />
            {formData.tacho_calibration_docs && (
              <p className="text-sm text-gray-600 mt-2">Uploaded: {formData.tacho_calibration_docs}</p>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Vehicle</h1>
      <form onSubmit={handleSubmit}>
        <Stepper
          totalSteps={steps.length}
          // activeStep={activeStep}
          // onStepChange={setActiveStep}
        >
          <StepperTabs labels={steps.map((step) => step.label)} />
          <StepperContent>
            {steps.map((step, index) => (
              <div key={index} className="space-y-6">
                {step.content}
              </div>
            ))}
          </StepperContent>
          <StepperNavigation className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Reset form and stepper
                setFormData({
                  assignee_driver: null,
                  last_milage: null,
                  vehicles_type_id: null,
                  registration_number: "",
                  site_allocated_id: null,
                  vehicle_status: "available",
                  is_roadworthy: true,
                  inspection_cycle: null,
                  inspection_expire: "",
                  inspection_appointment: "",
                  mot_expiry: "",
                  tax_expiry: "",
                  insurance_expiry: "",
                  tacho_download: "",
                  tacho_calibration: "",
                  tyre_expiry_front_driver: "",
                  tyre_expiry_front_passenger: "",
                  tyre_expiry_rear_outer_driver: "",
                  tyre_expiry_rear_outer_passenger: "",
                  vehicle_cost: null,
                  vehicle_picture: "",
                  tyre_pressure_front_driver: null,
                  tyre_pressure_front_passenger: null,
                  tyre_pressure_rear_outer_driver: null,
                  tyre_pressure_rear_outer_passenger: null,
                  tyre_depth_front_driver: null,
                  tyre_depth_front_passenger: null,
                  tyre_depth_rear_outer_driver: null,
                  tyre_depth_rear_outer_passenger: null,
                  tyre_torque_front_driver: null,
                  tyre_torque_front_passenger: null,
                  tyre_torque_rear_outer_driver: null,
                  tyre_torque_rear_outer_passenger: null,
                  log_book: "",
                  mot: "",
                  inspection: "",
                  insurance: "",
                  fitness_certificate: "",
                  route_permit: "",
                  financial: "",
                  others: "",
                  service_records: "",
                  tax: "",
                  tacho_download_docs: "",
                  tacho_calibration_docs: "",
                });
                setActiveStep(0);
              }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitLoading ||
                vehicleTypesLoading ||
                sitesLoading ||
                driversLoading ||
                activeStep !== steps.length - 1 ||
                !isFormValid()
              }
              className="bg-gradient-to-r from-orange to-magenta text-white hover:from-orange-700 hover:to-magenta-700"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Car className="w-4 h-4 mr-2" />
                  Create Vehicle
                </>
              )}
            </Button>
          </StepperNavigation>
        </Stepper>
      </form>
    </div>
  );
}