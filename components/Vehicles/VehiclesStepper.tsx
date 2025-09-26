"use client";
import * as React from "react";
import {
  Stepper,
  StepperTabs,
  StepperContent,
  StepperNavigation,
} from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Car, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import FileUploader from "../Media/MediaUpload";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";

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

interface ValidationErrors {
  [key: string]: string;
}

interface VehicleState {
  formData: VehicleFormData;
  vehicleTypes: VehicleType[];
  sites: Site[];
  drivers: Driver[];
  vehicleTypesLoading: boolean;
  sitesLoading: boolean;
  driversLoading: boolean;
  submitLoading: boolean;
  activeStep: number;
  validationErrors: ValidationErrors;
}

const initialState: VehicleState = {
  formData: {
    assignee_driver: null,
    last_milage: null,
    vehicles_type_id: null,
    registration_number: "",
    site_allocated_id: null,
    vehicle_status: "active",
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
  },
  vehicleTypes: [],
  sites: [],
  drivers: [],
  vehicleTypesLoading: false,
  sitesLoading: false,
  driversLoading: false,
  submitLoading: false,
  activeStep: 0,
  validationErrors: {},
};

// Create Redux slice
const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {
    setFormData: (state, action: PayloadAction<Partial<VehicleFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setVehicleTypes: (state, action: PayloadAction<VehicleType[]>) => {
      state.vehicleTypes = action.payload;
    },
    setSites: (state, action: PayloadAction<Site[]>) => {
      state.sites = action.payload;
    },
    setDrivers: (state, action: PayloadAction<Driver[]>) => {
      state.drivers = action.payload;
    },
    setVehicleTypesLoading: (state, action: PayloadAction<boolean>) => {
      state.vehicleTypesLoading = action.payload;
    },
    setSitesLoading: (state, action: PayloadAction<boolean>) => {
      state.sitesLoading = action.payload;
    },
    setDriversLoading: (state, action: PayloadAction<boolean>) => {
      state.driversLoading = action.payload;
    },
    setSubmitLoading: (state, action: PayloadAction<boolean>) => {
      state.submitLoading = action.payload;
    },
    setActiveStep: (state, action: PayloadAction<number>) => {
      state.activeStep = action.payload;
    },
    setValidationErrors: (state, action: PayloadAction<ValidationErrors>) => {
      state.validationErrors = action.payload;
    },
    clearValidationError: (state, action: PayloadAction<string>) => {
      delete state.validationErrors[action.payload];
    },
    resetForm: (state) => {
      state.formData = initialState.formData;
      state.activeStep = 0;
      state.validationErrors = {};
    },
  },
});

// Export actions
export const {
  setFormData,
  setVehicleTypes,
  setSites,
  setDrivers,
  setVehicleTypesLoading,
  setSitesLoading,
  setDriversLoading,
  setSubmitLoading,
  setActiveStep,
  setValidationErrors,
  clearValidationError,
  resetForm,
} = vehicleSlice.actions;

// Create store
const store = configureStore({
  reducer: {
    vehicle: vehicleSlice.reducer,
  },
});

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Validation functions
const validateTyreExpiry = (value: string): string | null => {
  if (!value) return null;
  
  const pattern = /^\d{4}$/;
  if (!pattern.test(value)) {
    return "Tyre expiry must be exactly 4 digits in WWYY format (e.g., '0124')";
  }
  
  const week = parseInt(value.substring(0, 2));
  const year = parseInt(value.substring(2, 4));
  
  if (week < 1 || week > 53) {
    return "Week must be between 01 and 53";
  }
  
  return null;
};

const validateRegistrationNumber = (value: string): string | null => {
  if (!value.trim()) {
    return "Registration number is required";
  }
  return null;
};

const validateRequiredSelect = (value: number | null, fieldName: string): string | null => {
  if (value === null) {
    return `${fieldName} is required`;
  }
  return null;
};

// Vehicle form component
function AddVehicleStepper() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    formData,
    vehicleTypes,
    sites,
    drivers,
    vehicleTypesLoading,
    sitesLoading,
    driversLoading,
    submitLoading,
    activeStep,
    validationErrors,
  } = useSelector((state: RootState) => state.vehicle);
  const cookies = useCookies();

  // Handle file upload success
  const handleFileUploadSuccess =
    (field: keyof VehicleFormData) => (url: string) => {
      dispatch(setFormData({ [field]: url }));
    };

  // Fetch vehicle types, sites, and drivers on mount
  React.useEffect(() => {
    const fetchVehicleTypes = async () => {
      dispatch(setVehicleTypesLoading(true));
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
          dispatch(setVehicleTypes(data.data));
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
        dispatch(setVehicleTypesLoading(false));
      }
    };

    const fetchSites = async () => {
      dispatch(setSitesLoading(true));
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
          dispatch(setSites(data.data));
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
        dispatch(setSitesLoading(false));
      }
    };

    const fetchDrivers = async () => {
      dispatch(setDriversLoading(true));
      try {
        const response = await fetch(
          `${API_URL}/api/profiles/list-names/?type=driver`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          dispatch(setDrivers(data.data));
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
        dispatch(setDriversLoading(false));
      }
    };

    fetchVehicleTypes();
    fetchSites();
    fetchDrivers();
  }, [cookies, dispatch]);

  // Handle input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    dispatch(setFormData({ [name]: newValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      dispatch(clearValidationError(name));
    }
    
    // Real-time validation for specific fields
    if (name === "registration_number") {
      const error = validateRegistrationNumber(value);
      if (error) {
        dispatch(setValidationErrors({ ...validationErrors, [name]: error }));
      }
    }
  };

  // Handle tire expiry input changes
  const handleTyreExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Only allow digits and limit to 4 characters
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 4);
    
    dispatch(setFormData({ [name]: sanitizedValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      dispatch(clearValidationError(name));
    }
    
    // Validate if value has 4 digits
    if (sanitizedValue.length === 4) {
      const error = validateTyreExpiry(sanitizedValue);
      if (error) {
        dispatch(setValidationErrors({ ...validationErrors, [name]: error }));
      }
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    const newValue = name === "vehicle_status" ? value : (value ? parseInt(value) : null);
    
    dispatch(setFormData({ [name]: newValue }));
    
    // Clear validation error when user makes a selection
    if (validationErrors[name]) {
      dispatch(clearValidationError(name));
    }
  };

  // Handle number input changes
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setFormData({ [name]: value ? parseFloat(value) : null }));
  };

  // Validate form step
  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (activeStep === 0) {
      // Basic Information validation
      const regError = validateRegistrationNumber(formData.registration_number);
      if (regError) errors.registration_number = regError;
      
      const typeError = validateRequiredSelect(formData.vehicles_type_id, "Vehicle type");
      if (typeError) errors.vehicles_type_id = typeError;
      
      const siteError = validateRequiredSelect(formData.site_allocated_id, "Site allocated");
      if (siteError) errors.site_allocated_id = siteError;
    }
    
    if (activeStep === 2) {
      // Tire Details validation
      const tyreFields = [
        'tyre_expiry_front_driver',
        'tyre_expiry_front_passenger', 
        'tyre_expiry_rear_outer_driver',
        'tyre_expiry_rear_outer_passenger'
      ];
      
      tyreFields.forEach(field => {
        const value = formData[field as keyof VehicleFormData] as string;
        if (value) {
          const error = validateTyreExpiry(value);
          if (error) errors[field] = error;
        }
      });
    }
    
    dispatch(setValidationErrors(errors));
    return Object.keys(errors).length === 0;
  };

  // Validate required fields
  const isFormValid = () => {
    return (
      formData.registration_number &&
      formData.vehicles_type_id !== null &&
      formData.site_allocated_id !== null &&
      Object.keys(validationErrors).length === 0
    );
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      dispatch(setActiveStep(activeStep + 1));
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding.",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    const token = cookies.get("access_token");

    dispatch(setSubmitLoading(true));
    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Vehicle added successfully!",
        });
        dispatch(resetForm());
      } else {
        // Handle validation errors from API
        if (data.message && data.message.includes("Validation failed")) {
          const errorMessage = data.message.replace("Validation failed: ", "");
          const fieldErrors: ValidationErrors = {};
          
          // Parse error message and extract field-specific errors
          const errors = errorMessage.split("; ");
          errors.forEach((error: string) => {
            const [field, message] = error.split(": ");
            if (field && message) {
              fieldErrors[field] = message;
            }
          });
          
          dispatch(setValidationErrors(fieldErrors));
        }
        
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
      dispatch(setSubmitLoading(false));
    }
  };

  // Error display component
  const ErrorMessage = ({ field }: { field: string }) => {
    if (!validationErrors[field]) return null;
    
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {validationErrors[field]}
        </AlertDescription>
      </Alert>
    );
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
              className={validationErrors.registration_number ? "border-red-500" : ""}
              required
            />
            <ErrorMessage field="registration_number" />
          </div>
          <div>
            <Label htmlFor="vehicles_type_id">Vehicle Type *</Label>
            <Select
              name="vehicles_type_id"
              value={formData.vehicles_type_id?.toString() || ""}
              onValueChange={(value) =>
                handleSelectChange("vehicles_type_id", value)
              }
              required
            >
              <SelectTrigger className={validationErrors.vehicles_type_id ? "border-red-500" : ""}>
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
                  <SelectItem value="none" disabled>
                    No types available
                  </SelectItem>
                ) : (
                  vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <Badge className="bg-blue-100 text-blue-700">
                        {type.name}
                      </Badge>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <ErrorMessage field="vehicles_type_id" />
          </div>
          <div>
            <Label htmlFor="site_allocated_id">Site Allocated *</Label>
            <Select
              name="site_allocated_id"
              value={formData.site_allocated_id?.toString() || ""}
              onValueChange={(value) =>
                handleSelectChange("site_allocated_id", value)
              }
              required
            >
              <SelectTrigger className={validationErrors.site_allocated_id ? "border-red-500" : ""}>
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
                  <SelectItem value="none" disabled>
                    No active sites
                  </SelectItem>
                ) : (
                  sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      <Badge className="bg-blue-100 text-blue-700">
                        {site.name}
                      </Badge>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <ErrorMessage field="site_allocated_id" />
          </div>
          <div>
            <Label htmlFor="vehicle_status">Status</Label>
            <Select
              name="vehicle_status"
              value={formData.vehicle_status}
              onValueChange={(value) =>
                handleSelectChange("vehicle_status", value)
              }
              defaultValue="active"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="minor_defect">Minor Defect</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="assignee_driver">Assignee Driver</Label>
            <Select
              name="assignee_driver"
              value={formData.assignee_driver?.toString() || ""}
              onValueChange={(value) =>
                handleSelectChange("assignee_driver", value)
              }
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
                  <SelectItem value="none" disabled>
                    No drivers available
                  </SelectItem>
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
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("vehicle_picture")}
            />
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1.5">
            <Label htmlFor="is_roadworthy" className="mb-0">
              Roadworthy
            </Label>
            <Switch
              id="is_roadworthy"
              name="is_roadworthy"
              checked={formData.is_roadworthy}
              onCheckedChange={(checked) =>
                dispatch(setFormData({ is_roadworthy: checked }))
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
            <Label htmlFor="inspection_appointment">
              Inspection Appointment
            </Label>
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
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tire expiry dates should be in WWYY format (4 digits). Example: 0124 means week 1 of 2024.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tyre_expiry_front_driver">
                Front Driver Tire Expiry (WWYY)
              </Label>
              <Input
                id="tyre_expiry_front_driver"
                name="tyre_expiry_front_driver"
                placeholder="e.g., 0124"
                value={formData.tyre_expiry_front_driver}
                onChange={handleTyreExpiryChange}
                maxLength={4}
                className={validationErrors.tyre_expiry_front_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_expiry_front_driver" />
            </div>
            <div>
              <Label htmlFor="tyre_expiry_front_passenger">
                Front Passenger Tire Expiry (WWYY)
              </Label>
              <Input
                id="tyre_expiry_front_passenger"
                name="tyre_expiry_front_passenger"
                placeholder="e.g., 0124"
                value={formData.tyre_expiry_front_passenger}
                onChange={handleTyreExpiryChange}
                maxLength={4}
                className={validationErrors.tyre_expiry_front_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_expiry_front_passenger" />
            </div>
            <div>
              <Label htmlFor="tyre_expiry_rear_outer_driver">
                Rear Outer Driver Tire Expiry (WWYY)
              </Label>
              <Input
                id="tyre_expiry_rear_outer_driver"
                name="tyre_expiry_rear_outer_driver"
                placeholder="e.g., 0124"
                value={formData.tyre_expiry_rear_outer_driver}
                onChange={handleTyreExpiryChange}
                maxLength={4}
                className={validationErrors.tyre_expiry_rear_outer_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_expiry_rear_outer_driver" />
            </div>
            <div>
              <Label htmlFor="tyre_expiry_rear_outer_passenger">
                Rear Outer Passenger Tire Expiry (WWYY)
              </Label>
              <Input
                id="tyre_expiry_rear_outer_passenger"
                name="tyre_expiry_rear_outer_passenger"
                placeholder="e.g., 0124"
                value={formData.tyre_expiry_rear_outer_passenger}
                onChange={handleTyreExpiryChange}
                maxLength={4}
                className={validationErrors.tyre_expiry_rear_outer_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_expiry_rear_outer_passenger" />
            </div>
            <div>
              <Label htmlFor="tyre_pressure_front_driver">
                Front Driver Tire Pressure (PSI)
              </Label>
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
              <Label htmlFor="tyre_pressure_front_passenger">
                Front Passenger Tire Pressure (PSI)
              </Label>
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
              <Label htmlFor="tyre_pressure_rear_outer_driver">
                Rear Outer Driver Tire Pressure (PSI)
              </Label>
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
              <Label htmlFor="tyre_pressure_rear_outer_passenger">
                Rear Outer Passenger Tire Pressure (PSI)
              </Label>
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
              <Label htmlFor="tyre_depth_front_driver">
                Front Driver Tire Depth (mm)
              </Label>
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
              <Label htmlFor="tyre_depth_front_passenger">
                Front Passenger Tire Depth (mm)
              </Label>
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
              <Label htmlFor="tyre_depth_rear_outer_driver">
                Rear Outer Driver Tire Depth (mm)
              </Label>
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
              <Label htmlFor="tyre_depth_rear_outer_passenger">
                Rear Outer Passenger Tire Depth (mm)
              </Label>
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
              <Label htmlFor="tyre_torque_front_driver">
                Front Driver Tire Torque (Nm)
              </Label>
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
              <Label htmlFor="tyre_torque_front_passenger">
                Front Passenger Tire Torque (Nm)
              </Label>
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
              <Label htmlFor="tyre_torque_rear_outer_driver">
                Rear Outer Driver Tire Torque (Nm)
              </Label>
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
              <Label htmlFor="tyre_torque_rear_outer_passenger">
                Rear Outer Passenger Tire Torque (Nm)
              </Label>
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
        </div>
      ),
    },
    {
      label: "Documents",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="log_book">Log Book</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("log_book")}
            />
          </div>
          <div>
            <Label htmlFor="mot">MOT</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("mot")} />
          </div>
          <div>
            <Label htmlFor="inspection">Inspection</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("inspection")}
            />
          </div>
          <div>
            <Label htmlFor="insurance">Insurance</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("insurance")}
            />
          </div>
          <div>
            <Label htmlFor="fitness_certificate">Fitness Certificate</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("fitness_certificate")}
            />
          </div>
          <div>
            <Label htmlFor="route_permit">Route Permit</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("route_permit")}
            />
          </div>
          <div>
            <Label htmlFor="financial">Financial Document</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("financial")}
            />
          </div>
          <div>
            <Label htmlFor="others">Other Documents</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("others")} />
          </div>
          <div>
            <Label htmlFor="service_records">Service Records</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("service_records")}
            />
          </div>
          <div>
            <Label htmlFor="tax">Tax Document</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("tax")} />
          </div>
          <div>
            <Label htmlFor="tacho_download_docs">Tacho Download Docs</Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess("tacho_download_docs")}
            />
          </div>
          <div>
            <Label htmlFor="tacho_calibration_docs">
              Tacho Calibration Docs
            </Label>
            <FileUploader
              onUploadSuccess={handleFileUploadSuccess(
                "tacho_calibration_docs"
              )}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Confirm",
      content: (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review Vehicle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-3">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Registration Number:</strong>{" "}
                  {formData.registration_number || "N/A"}
                </p>
                <p>
                  <strong>Vehicle Type:</strong>{" "}
                  {vehicleTypes.find(
                    (type) => type.id === formData.vehicles_type_id
                  )?.name || "N/A"}
                </p>
                <p>
                  <strong>Site Allocated:</strong>{" "}
                  {sites.find((site) => site.id === formData.site_allocated_id)
                    ?.name || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {formData.vehicle_status || "N/A"}
                </p>
                <p>
                  <strong>Assignee Driver:</strong>{" "}
                  {drivers.find(
                    (driver) => driver.id === formData.assignee_driver
                  )?.full_name || "N/A"}
                </p>
                <p>
                  <strong>Last Mileage:</strong> {formData.last_milage || "N/A"}
                </p>
                <p>
                  <strong>Vehicle Cost:</strong> {formData.vehicle_cost || "N/A"}
                </p>
                <p>
                  <strong>Roadworthy:</strong>{" "}
                  {formData.is_roadworthy ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Expiry Dates</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Inspection Cycle:</strong>{" "}
                  {formData.inspection_cycle || "N/A"} days
                </p>
                <p>
                  <strong>Inspection Expiry:</strong>{" "}
                  {formData.inspection_expire || "N/A"}
                </p>
                <p>
                  <strong>Inspection Appointment:</strong>{" "}
                  {formData.inspection_appointment || "N/A"}
                </p>
                <p>
                  <strong>MOT Expiry:</strong> {formData.mot_expiry || "N/A"}
                </p>
                <p>
                  <strong>Tax Expiry:</strong> {formData.tax_expiry || "N/A"}
                </p>
                <p>
                  <strong>Insurance Expiry:</strong>{" "}
                  {formData.insurance_expiry || "N/A"}
                </p>
                <p>
                  <strong>Tacho Download:</strong>{" "}
                  {formData.tacho_download || "N/A"}
                </p>
                <p>
                  <strong>Tacho Calibration:</strong>{" "}
                  {formData.tacho_calibration || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Tire Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Front Driver Tire Expiry:</strong>{" "}
                  {formData.tyre_expiry_front_driver || "N/A"}
                </p>
                <p>
                  <strong>Front Passenger Tire Expiry:</strong>{" "}
                  {formData.tyre_expiry_front_passenger || "N/A"}
                </p>
                <p>
                  <strong>Rear Outer Driver Tire Expiry:</strong>{" "}
                  {formData.tyre_expiry_rear_outer_driver || "N/A"}
                </p>
                <p>
                  <strong>Rear Outer Passenger Tire Expiry:</strong>{" "}
                  {formData.tyre_expiry_rear_outer_passenger || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Documents</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Log Book:</strong> {formData.log_book ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>MOT:</strong> {formData.mot ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>Inspection:</strong> {formData.inspection ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>Insurance:</strong> {formData.insurance ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>Fitness Certificate:</strong>{" "}
                  {formData.fitness_certificate ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>Route Permit:</strong> {formData.route_permit ? "Uploaded" : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid() || submitLoading}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
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
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Vehicle</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <Stepper
          totalSteps={steps.length}
          //@ts-expect-error ab thk ha
          activeStep={activeStep}
          //@ts-expect-error ab thk ha
          onStepChange={(step) => dispatch(setActiveStep(step))}
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
              onClick={() => dispatch(resetForm())}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            {activeStep !== steps.length - 1 && (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={
                  submitLoading ||
                  vehicleTypesLoading ||
                  sitesLoading ||
                  driversLoading
                }
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
              >
                Next
              </Button>
            )}
          </StepperNavigation>
        </Stepper>
      </form>
    </div>
  );
}

// Wrap the component with Provider
export default function AddVehicleStepperWrapper() {
  return (
    <Provider store={store}>
      <AddVehicleStepper />
    </Provider>
  );
}