"use client"
import * as React from "react"
import { Stepper, StepperTabs, StepperContent } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Car, AlertCircle, CheckCircle2, FileText, BookOpen, FileCheck, Accessibility, Activity, Gauge, Users, Bus, Settings, Image, Calendar, Upload, Info } from "lucide-react"
import { toast } from "sonner"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { Provider, useDispatch, useSelector } from "react-redux"
import { Textarea } from "@/components/ui/textarea"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStepper } from "@/components/ui/stepper"
import FileUploader from "../Media/MediaUpload"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Define interfaces
interface Site {
  id: number
  name: string
}
interface VehicleType {
  id: number
  name: string
  description?: string
}
interface ValidationErrors {
  [key: string]: string
}

// Updated interface with ALL 6 tyre fields
interface VehicleFormData {
  vin: string
  registration_number: string
  make: string
  model: string
  vehicles_type: number
  site_allocated: number[]
  number_of_seats: number | null
  mileage_unit: "kms" | "miles"
  vehicle_picture: string
  notes: string
  current_mileage: number | null
  is_tacho_fitted: boolean
  is_wheelchair_lift_fitted: boolean
  date_of_purchase: string
  purchased_from: string
  purchased_by: string
  price: string
  has_vat: boolean
  vat_amount: string
  
  // Expiry dates with mandatory document uploads
  last_pmi_date: string
  mot_expiry: string
  insurance_expiry: string
  tax_expiry: string
  tacho_calibration_expiry: string
  last_tacho_download_date: string
  loller_calibration_expiry: string
  
  // Document fields for each date (NEW)
  last_pmi_date_docs: string
  mot_expiry_docs: string
  insurance_expiry_docs: string
  tax_expiry_docs: string
  tacho_calibration_expiry_docs: string
  last_tacho_download_date_docs: string
  loller_calibration_expiry_docs: string
  
  // Vehicle status fields
  vehicle_status: "available" | "maintenance" | "out_of_service"
  vehicle_roadworthy_status: "no_defect" | "defects_found" | "requires_inspection"
  is_roadworthy: boolean
  is_active: boolean
  
  // PMI fields
  pmi_booked_date: string
  pmi_cycle: number | null
  
  // Other dates
  next_loller_test_date: string
  next_techo_calibration_book_date: string
  next_tacho_download_date: string
  tacho_notes: string
  last_tyre_maintenance_check_date: string
  next_tyre_maintenance_check_date: string
  last_valet_check_date: string
  next_valet_check_date: string
  last_equipment_check_date: string
  next_equipment_check_date: string
  
  // Tyre Checks - ALL 6 TYRES AS PER REQUIREMENTS
  tyre_expiry_front_driver: string
  tyre_expiry_front_passenger: string
  tyre_expiry_rear_outer_driver: string
  tyre_expiry_rear_outer_passenger: string
  tyre_expiry_rear_inner_driver: string
  tyre_expiry_rear_inner_passenger: string
  
  tyre_depth_front_driver: string
  tyre_depth_front_passenger: string
  tyre_depth_rear_outer_driver: string
  tyre_depth_rear_outer_passenger: string
  tyre_depth_rear_inner_driver: string
  tyre_depth_rear_inner_passenger: string
  
  tyre_pressure_front_driver: number | null
  tyre_pressure_front_passenger: number | null
  tyre_pressure_rear_outer_driver: number | null
  tyre_pressure_rear_outer_passenger: number | null
  tyre_pressure_rear_inner_driver: number | null
  tyre_pressure_rear_inner_passenger: number | null
  
  tyre_torque_front_driver: number | null
  tyre_torque_front_passenger: number | null
  tyre_torque_rear_outer_driver: number | null
  tyre_torque_rear_outer_passenger: number | null
  
  // Document uploads
  vehicle_invoice_docs: string
  mot_check_docs: string
  pmi_inspection_docs: string
  others_docs: string
  tacho_calibration_docs: string
  tax_docs: string
  loller_docs: string
  insurance_docs: string
  service_records_docs: string
  new_vehicle_checklist_docs: string
  logbook_docs: string
  COIF_technical_docs: string
}

interface VehicleState {
  formData: VehicleFormData
  sites: Site[]
  vehicleTypes: VehicleType[]
  sitesLoading: boolean
  vehicleTypesLoading: boolean
  submitLoading: boolean
  activeStep: number
  validationErrors: ValidationErrors
}

// Custom Vehicle Type Options (as per requirements)
const CUSTOM_VEHICLE_TYPES: VehicleType[] = [
  { id: 1, name: "Estate Car" },
  { id: 2, name: "Saloon Car" },
  { id: 3, name: "MPV" },
  { id: 4, name: "Minibus-MK7" },
  { id: 5, name: "Minibus-MK8" },
  { id: 6, name: "8-Seater" },
  { id: 7, name: "Coach" },
]

// Default values for tyre checks
const TYRE_DEFAULTS = {
  expiry: "0124",
  depth: "3.5",
  frontPressure: 66.5,
  rearPressure: 57.0,
  torque: 205,
}

const initialState: VehicleState = {
  formData: {
    vin: "",
    registration_number: "",
    make: "",
    model: "",
    vehicles_type: 0,
    site_allocated: [],
    number_of_seats: null,
    mileage_unit: "miles",
    vehicle_picture: "",
    notes: "",
    
    // NEW FIELDS
    current_mileage: null,
    is_tacho_fitted: false,
    is_wheelchair_lift_fitted: false,
    
    date_of_purchase: "",
    purchased_from: "",
    purchased_by: "",
    price: "",
    has_vat: false,
    vat_amount: "",
    
    // Expiry dates
    last_pmi_date: "",
    mot_expiry: "",
    insurance_expiry: "",
    tax_expiry: "",
    tacho_calibration_expiry: "",
    last_tacho_download_date: "",
    loller_calibration_expiry: "",
    
    // Document fields for dates (initially empty)
    last_pmi_date_docs: "",
    mot_expiry_docs: "",
    insurance_expiry_docs: "",
    tax_expiry_docs: "",
    tacho_calibration_expiry_docs: "",
    last_tacho_download_date_docs: "",
    loller_calibration_expiry_docs: "",
    
    vehicle_status: "available",
    vehicle_roadworthy_status: "no_defect",
    is_roadworthy: true,
    is_active: true,
    pmi_booked_date: "",
    pmi_cycle: null,
    next_loller_test_date: "",
    next_techo_calibration_book_date: "",
    next_tacho_download_date: "",
    tacho_notes: "",
    last_tyre_maintenance_check_date: "",
    next_tyre_maintenance_check_date: "",
    last_valet_check_date: "",
    next_valet_check_date: "",
    last_equipment_check_date: "",
    next_equipment_check_date: "",
    
    // Tyre defaults (ALL 6 TYRES)
    tyre_expiry_front_driver: TYRE_DEFAULTS.expiry,
    tyre_expiry_front_passenger: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_outer_driver: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_outer_passenger: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_inner_driver: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_inner_passenger: TYRE_DEFAULTS.expiry,
    
    tyre_depth_front_driver: TYRE_DEFAULTS.depth,
    tyre_depth_front_passenger: TYRE_DEFAULTS.depth,
    tyre_depth_rear_outer_driver: TYRE_DEFAULTS.depth,
    tyre_depth_rear_outer_passenger: TYRE_DEFAULTS.depth,
    tyre_depth_rear_inner_driver: TYRE_DEFAULTS.depth,
    tyre_depth_rear_inner_passenger: TYRE_DEFAULTS.depth,
    
    tyre_pressure_front_driver: TYRE_DEFAULTS.frontPressure,
    tyre_pressure_front_passenger: TYRE_DEFAULTS.frontPressure,
    tyre_pressure_rear_outer_driver: TYRE_DEFAULTS.rearPressure,
    tyre_pressure_rear_outer_passenger: TYRE_DEFAULTS.rearPressure,
    tyre_pressure_rear_inner_driver: TYRE_DEFAULTS.rearPressure,
    tyre_pressure_rear_inner_passenger: TYRE_DEFAULTS.rearPressure,
    
    tyre_torque_front_driver: TYRE_DEFAULTS.torque,
    tyre_torque_front_passenger: TYRE_DEFAULTS.torque,
    tyre_torque_rear_outer_driver: TYRE_DEFAULTS.torque,
    tyre_torque_rear_outer_passenger: TYRE_DEFAULTS.torque,
    
    vehicle_invoice_docs: "",
    mot_check_docs: "",
    pmi_inspection_docs: "",
    others_docs: "",
    tacho_calibration_docs: "",
    tax_docs: "",
    loller_docs: "",
    insurance_docs: "",
    service_records_docs: "",
    new_vehicle_checklist_docs: "",
    logbook_docs: "",
    COIF_technical_docs: "",
  },
  sites: [],
  vehicleTypes: CUSTOM_VEHICLE_TYPES,
  sitesLoading: false,
  vehicleTypesLoading: false,
  submitLoading: false,
  activeStep: 0,
  validationErrors: {},
}

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {
    setFormData: (state, action: PayloadAction<Partial<VehicleFormData>>) => {
      state.formData = { ...state.formData, ...action.payload }
    },
    setSites: (state, action: PayloadAction<Site[]>) => {
      state.sites = action.payload
    },
    setVehicleTypes: (state, action: PayloadAction<VehicleType[]>) => {
      state.vehicleTypes = action.payload
    },
    setSitesLoading: (state, action: PayloadAction<boolean>) => {
      state.sitesLoading = action.payload
    },
    setVehicleTypesLoading: (state, action: PayloadAction<boolean>) => {
      state.vehicleTypesLoading = action.payload
    },
    setSubmitLoading: (state, action: PayloadAction<boolean>) => {
      state.submitLoading = action.payload
    },
    setActiveStep: (state, action: PayloadAction<number>) => {
      state.activeStep = action.payload
    },
    setValidationErrors: (state, action: PayloadAction<ValidationErrors>) => {
      state.validationErrors = action.payload
    },
    clearValidationError: (state, action: PayloadAction<string>) => {
      delete state.validationErrors[action.payload]
    },
    resetForm: (state) => {
      state.formData = initialState.formData
      state.activeStep = 0
      state.validationErrors = {}
    },
  },
})

export const {
  setFormData,
  setSites,
  setVehicleTypes,
  setSitesLoading,
  setVehicleTypesLoading,
  setSubmitLoading,
  setActiveStep,
  setValidationErrors,
  clearValidationError,
  resetForm,
} = vehicleSlice.actions

const store = configureStore({
  reducer: {
    vehicle: vehicleSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Validation functions
const validateTyreExpiry = (value: string): string | null => {
  if (!value) return "Required"
  const pattern = /^\d{4}$/
  if (!pattern.test(value)) {
    return "Must be exactly 4 digits in WWYY format (e.g., '0124')"
  }
  const week = Number.parseInt(value.substring(0, 2))
  if (week < 1 || week > 53) {
    return "Week must be between 01 and 53"
  }
  return null
}

const validateRegistrationNumber = (value: string): string | null => {
  if (!value.trim()) {
    return "Registration number is required"
  }
  return null
}

const validateRequiredString = (value: string, fieldName: string): string | null => {
  if (!value.trim()) {
    return `${fieldName} is required`
  }
  return null
}

const validateRequiredNumber = (value: number | null, fieldName: string): string | null => {
  if (value === null || isNaN(value)) {
    return `${fieldName} is required`
  }
  return null
}

const validatePositiveNumber = (value: number | null, fieldName: string, min = 0): string | null => {
  if (value === null || isNaN(value)) {
    return `${fieldName} is required`
  }
  if (value < min) {
    return `${fieldName} must be ${min} or greater`
  }
  return null
}

const validateRequiredArray = (value: number[], fieldName: string): string | null => {
  if (value.length === 0) {
    return `${fieldName} is required`
  }
  return null
}

const validateTyreDepth = (value: string, fieldName: string): string | null => {
  if (!value) return `${fieldName} is required`
  
  // Allow "NV" (case-insensitive) for null values
  if (value.toUpperCase() === "NV") return null
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return `${fieldName} must be a valid number or "NV"`
  if (numValue < 1.6) {
    return `${fieldName} must be at least 1.6 mm or "NV"`
  }
  return null
}

const validateDateFormat = (value: string, fieldName: string): string | null => {
  if (!value) return null
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) {
    return `${fieldName} must be in YYYY-MM-DD format`
  }
  
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return `${fieldName} is not a valid date`
  }
  
  return null
}

const validateDateWithDocument = (dateValue: string, docValue: string, fieldName: string): string | null => {
  if (dateValue && !docValue) {
    return `${fieldName} requires document upload`
  }
  return null
}

// Tyre Specs Configuration
const TYRE_SPECS = {
  torqueMin: 200,
  torqueMax: 210,
  frontMin: 65,
  frontMax: 68,
  rearMin: 56,
  rearMax: 58,
};

// INDIVIDUAL VALIDATION FUNCTIONS
const validateTyrePressure = (value: number | null, fieldLabel: string): string | null => {
  if (value === null || value === undefined)
    return `${fieldLabel} is required.`;

  const lower = fieldLabel.toLowerCase();
  const isFront = lower.includes("front");
  const isRear = lower.includes("rear");

  if (isFront) {
    if (value < TYRE_SPECS.frontMin || value > TYRE_SPECS.frontMax)
      return `${fieldLabel} must be ${TYRE_SPECS.frontMin}–${TYRE_SPECS.frontMax} PSI.`;
  }

  if (isRear) {
    if (value < TYRE_SPECS.rearMin || value > TYRE_SPECS.rearMax)
      return `${fieldLabel} must be ${TYRE_SPECS.rearMin}–${TYRE_SPECS.rearMax} PSI.`;
  }

  return null;
};

const validateTyreTorque = (value: number | null, fieldLabel: string): string | null => {
  if (value === null || value === undefined)
    return `${fieldLabel} is required.`;

  if (value < TYRE_SPECS.torqueMin || value > TYRE_SPECS.torqueMax)
    return `${fieldLabel} must be ${TYRE_SPECS.torqueMin}–${TYRE_SPECS.torqueMax} Nm.`;

  return null;
};

// MultiSelect component
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  error,
}: {
  options: Site[]
  selected: number[]
  onChange: (value: number[]) => void
  placeholder: string
  error?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", error && "border-red-500")}
        >
          {selected.length > 0 ? `${selected.length} site${selected.length > 1 ? "s" : ""} selected` : placeholder}
          <span className="ml-auto h-4 w-4 shrink-0 opacity-50">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search sites..." value={search} onValueChange={setSearch} />
          <CommandList>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.id}
                onSelect={() => {
                  const newSelected = selected.includes(option.id)
                    ? selected.filter((id) => id !== option.id)
                    : [...selected, option.id]
                  onChange(newSelected)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", selected.includes(option.id) ? "opacity-100" : "opacity-0")} />
                {option.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Date Input with File Upload Component
function DateInputWithFileUpload({
  label,
  name,
  value,
  onChange,
  onFileUpload,
  error,
  required = false,
  docFieldName,
  docValue,
  docError,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (url: string) => void
  error?: string
  required?: boolean
  docFieldName: string
  docValue: string
  docError?: string
}) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Input
            id={name}
            name={name}
            type="date"
            value={value}
            onChange={onChange}
            className={cn("", error && "border-red-500")}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Upload Document {required && <span className="text-red-500">*</span>}
          </Label>
          <FileUploader 
            onUploadSuccess={onFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          {docValue ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Document uploaded
            </div>
          ) : docError ? (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {docError}
              </AlertDescription>
            </Alert>
          ) : value && !docValue ? (
            <Alert className="bg-amber-50 border-amber-200 py-2">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800">
                Document required for this date
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Tyre Check Input Component
function TyreCheckInput({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  step,
  placeholder,
  tooltip,
  required = true,
}: {
  label: string
  name: string
  value: string | number | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  type?: string
  step?: string
  placeholder?: string
  tooltip?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        {label} {required && <span className="text-red-500">*</span>}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      <Input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        className={cn("", error && "border-red-500")}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// Vehicle form component
function AddVehicleStepperForm() {
  const dispatch = useDispatch<AppDispatch>()
  const { formData, sites, vehicleTypes, sitesLoading, vehicleTypesLoading, submitLoading, validationErrors } =
    useSelector((state: RootState) => state.vehicle)
  const cookies = useCookies()
  const { currentStep, goToNextStep, goToPreviousStep } = useStepper()

  const handleFileUploadSuccess = (field: keyof VehicleFormData) => (url: string) => {
    dispatch(setFormData({ [field]: url } as unknown as Partial<VehicleFormData>))
    const key = String(field)
    if (validationErrors[key]) {
      dispatch(clearValidationError(key))
    }
  }

  React.useEffect(() => {
    const fetchSites = async () => {
      dispatch(setSitesLoading(true))
      try {
        const response = await fetch(`${API_URL}/api/sites/list-names/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          dispatch(setSites(data.data))
        } else {
          toast.error("Failed to load sites.")
        }
      } catch (error) {
        console.error("Error fetching sites:", error)
        toast.error("An error occurred while fetching sites.")
      } finally {
        dispatch(setSitesLoading(false))
      }
    }

    fetchSites()
  }, [cookies, dispatch])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const newValue: string | boolean = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    const updated: any = { ...formData, [name]: newValue };

    // Handle VAT recalculation when price changes
    if (name === "price" && formData.has_vat) {
      const numericPrice = parseFloat(String(newValue)) || 0;
      updated.vat_amount = (numericPrice * 0.20).toFixed(2);
    }

    // Handle VAT calculation when VAT switch toggles on
    if (name === "has_vat") {
      if (newValue === true) {
        const numericPrice = parseFloat(formData.price || "0") || 0;
        updated.vat_amount = (numericPrice * 0.20).toFixed(2);
      } else {
        updated.vat_amount = "";
      }
    }

    dispatch(setFormData(updated));

    if (validationErrors[name]) {
      dispatch(clearValidationError(name));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value || "" }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleTyreExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const sanitizedValue = value.replace(/\D/g, "").slice(0, 4)
    dispatch(setFormData({ [name]: sanitizedValue }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
    if (sanitizedValue.length === 4) {
      const error = validateTyreExpiry(sanitizedValue)
      if (error) {
        dispatch(setValidationErrors({ ...validationErrors, [name]: error }))
      }
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    dispatch(setFormData({ [name]: name === "vehicles_type" ? Number(value) : value }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value ? Number.parseFloat(value) : null }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleStringNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
  
    // For tyre depth fields, accept "NV" (case-insensitive)
    if (name.includes('tyre_depth')) {
      dispatch(setFormData({ [name]: value }))
    } else {
      dispatch(setFormData({ [name]: value }))
    }
    
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleMultiSelectChange = (name: string, values: number[]) => {
    dispatch(setFormData({ [name]: values }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  // Main validation function
  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {}

    // STEP 0 VALIDATION - Vehicle Details
    if (currentStep === 0) {
      const vinError = validateRequiredString(formData.vin, "VIN")
      if (vinError) errors.vin = vinError

      const regError = validateRegistrationNumber(formData.registration_number)
      if (regError) errors.registration_number = regError

      const makeError = validateRequiredString(formData.make, "Make")
      if (makeError) errors.make = makeError

      const modelError = validateRequiredString(formData.model, "Model")
      if (modelError) errors.model = modelError

      const typeError = formData.vehicles_type === 0 ? "Vehicle Type is required" : null
      if (typeError) errors.vehicles_type = typeError

      const sitesError = validateRequiredArray(formData.site_allocated, "Allocated Site(s)")
      if (sitesError) errors.site_allocated = sitesError

      // Validate current mileage
      const mileageError = validatePositiveNumber(formData.current_mileage, "Current Mileage")
      if (mileageError) errors.current_mileage = mileageError
    }

    // STEP 1 VALIDATION - Vehicle Documents
    if (currentStep === 1) {
      const requiredDocuments = [
        { field: "vehicle_picture", label: "Vehicle Picture" },
        { field: "new_vehicle_checklist_docs", label: "New Vehicle Checklist" },
        { field: "logbook_docs", label: "Logbook / V5" },
        { field: "COIF_technical_docs", label: "COIF / Technical Data" },
        { field: "vehicle_invoice_docs", label: "Vehicle Invoice" },
      ]

      requiredDocuments.forEach(({ field, label }) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateRequiredString(value, label)
        if (error) errors[field] = error
      })
    }

    // STEP 3 VALIDATION - Expiry Dates (with mandatory documents)
    if (currentStep === 3) {
      // Validate date fields that are required
      const dateFields = [
        { field: "last_pmi_date", docField: "last_pmi_date_docs", label: "Last PMI Date" },
        { field: "mot_expiry", docField: "mot_expiry_docs", label: "MOT Expiry Date", required: true },
        { field: "insurance_expiry", docField: "insurance_expiry_docs", label: "Insurance Expiry Date", required: true },
        { field: "tax_expiry", docField: "tax_expiry_docs", label: "Tax Expiry Date", required: true },
      ]

      dateFields.forEach(({ field, docField, label, required }) => {
        const dateValue = formData[field as keyof VehicleFormData] as string
        const docValue = formData[docField as keyof VehicleFormData] as string
        
        if (required && !dateValue) {
          errors[field] = `${label} is required`
        } else if (dateValue) {
          const dateError = validateDateFormat(dateValue, label)
          if (dateError) {
            errors[field] = dateError
          } else {
            // Check if document is uploaded for this date
            const docError = validateDateWithDocument(dateValue, docValue, label)
            if (docError) errors[docField] = docError
          }
        }
      })

      // Validate tacho dates if tacho is fitted
      if (formData.is_tacho_fitted) {
        const tachoDateFields = [
          { field: "tacho_calibration_expiry", docField: "tacho_calibration_expiry_docs", label: "Tacho Calibration Expiry" },
          { field: "last_tacho_download_date", docField: "last_tacho_download_date_docs", label: "Last Tacho Download Date" },
        ]

        tachoDateFields.forEach(({ field, docField, label }) => {
          const dateValue = formData[field as keyof VehicleFormData] as string
          const docValue = formData[docField as keyof VehicleFormData] as string
          
          if (dateValue) {
            const dateError = validateDateFormat(dateValue, label)
            if (dateError) {
              errors[field] = dateError
            } else {
              const docError = validateDateWithDocument(dateValue, docValue, label)
              if (docError) errors[docField] = docError
            }
          }
        })
      }

      // Validate loller dates if wheelchair lift is fitted
      if (formData.is_wheelchair_lift_fitted) {
        const lollerField = { 
          field: "loller_calibration_expiry", 
          docField: "loller_calibration_expiry_docs", 
          label: "Loller Calibration Expiry" 
        }
        
        const dateValue = formData[lollerField.field as keyof VehicleFormData] as string
        const docValue = formData[lollerField.docField as keyof VehicleFormData] as string
        
        if (dateValue) {
          const dateError = validateDateFormat(dateValue, lollerField.label)
          if (dateError) {
            errors[lollerField.field] = dateError
          } else {
            const docError = validateDateWithDocument(dateValue, docValue, lollerField.label)
            if (docError) errors[lollerField.docField] = docError
          }
        }
      }
    }

    // STEP 4 TYRE VALIDATION (ALL 6 TYRES)
    if (currentStep === 4) {
      // Expiry fields (6 tyres)
      const tyreExpiryFields = [
        "tyre_expiry_front_driver", "tyre_expiry_front_passenger",
        "tyre_expiry_rear_outer_driver", "tyre_expiry_rear_outer_passenger",
        "tyre_expiry_rear_inner_driver", "tyre_expiry_rear_inner_passenger",
      ]

      tyreExpiryFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateTyreExpiry(value)
        if (error) errors[field] = error
      })

      // Depth fields (6 tyres)
      const tyreDepthFields = [
        "tyre_depth_front_driver", "tyre_depth_front_passenger",
        "tyre_depth_rear_outer_driver", "tyre_depth_rear_outer_passenger",
        "tyre_depth_rear_inner_driver", "tyre_depth_rear_inner_passenger",
      ]

      tyreDepthFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateTyreDepth(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })

      // Pressure fields (6 tyres)
      const tyrePressureFields = [
        "tyre_pressure_front_driver", "tyre_pressure_front_passenger",
        "tyre_pressure_rear_outer_driver", "tyre_pressure_rear_outer_passenger",
        "tyre_pressure_rear_inner_driver", "tyre_pressure_rear_inner_passenger",
      ]

      tyrePressureFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as number | null
        const error = validateTyrePressure(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })

      // Torque fields (4 tyres only - outer tyres)
      const tyreTorqueFields = [
        "tyre_torque_front_driver", "tyre_torque_front_passenger",
        "tyre_torque_rear_outer_driver", "tyre_torque_rear_outer_passenger",
      ]

      tyreTorqueFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as number | null
        const error = validateTyreTorque(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })
    }

    // APPLY ERRORS
    dispatch(setValidationErrors(errors))

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCurrentStep()) {
      toast.error("Validation Error", {
        description: "Please fix all validation errors before submitting.",
      })
      return
    }

    const token = cookies.get("access_token")
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      is_tacho_fitted: formData.is_tacho_fitted ? "Yes" : "No",
      is_wheelchair_lift_fitted: formData.is_wheelchair_lift_fitted ? "Yes" : "No",
      
      // Convert "NV" in tyre depth fields to null (ALL 6 TYRES)
      tyre_depth_front_driver: formData.tyre_depth_front_driver.toUpperCase() === "NV" ? null : formData.tyre_depth_front_driver,
      tyre_depth_front_passenger: formData.tyre_depth_front_passenger.toUpperCase() === "NV" ? null : formData.tyre_depth_front_passenger,
      tyre_depth_rear_outer_driver: formData.tyre_depth_rear_outer_driver.toUpperCase() === "NV" ? null : formData.tyre_depth_rear_outer_driver,
      tyre_depth_rear_outer_passenger: formData.tyre_depth_rear_outer_passenger.toUpperCase() === "NV" ? null : formData.tyre_depth_rear_outer_passenger,
      tyre_depth_rear_inner_driver: formData.tyre_depth_rear_inner_driver.toUpperCase() === "NV" ? null : formData.tyre_depth_rear_inner_driver,
      tyre_depth_rear_inner_passenger: formData.tyre_depth_rear_inner_passenger.toUpperCase() === "NV" ? null : formData.tyre_depth_rear_inner_passenger,
      
      // Convert empty date strings to null
      date_of_purchase: formData.date_of_purchase || null,
      last_pmi_date: formData.last_pmi_date || null,
      pmi_booked_date: formData.pmi_booked_date || null,
      mot_expiry: formData.mot_expiry || null,
      insurance_expiry: formData.insurance_expiry || null,
      tax_expiry: formData.tax_expiry || null,
      loller_calibration_expiry: formData.loller_calibration_expiry || null,
      next_loller_test_date: formData.next_loller_test_date || null,
      tacho_calibration_expiry: formData.tacho_calibration_expiry || null,
      next_techo_calibration_book_date: formData.next_techo_calibration_book_date || null,
      last_tacho_download_date: formData.last_tacho_download_date || null,
      next_tacho_download_date: formData.next_tacho_download_date || null,
      last_tyre_maintenance_check_date: formData.last_tyre_maintenance_check_date || null,
      next_tyre_maintenance_check_date: formData.next_tyre_maintenance_check_date || null,
      last_valet_check_date: formData.last_valet_check_date || null,
      next_valet_check_date: formData.next_valet_check_date || null,
      last_equipment_check_date: formData.last_equipment_check_date || null,
      next_equipment_check_date: formData.next_equipment_check_date || null,
    }

    dispatch(setSubmitLoading(true))
    
    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Vehicle added successfully!", {
          description: "The vehicle has been added to the system.",
        })
        dispatch(resetForm())
      } else {
        toast.error("Failed to add vehicle", {
          description: data.message || "Please try again.",
        })
      }
    } catch (error) {
      console.error("Error adding vehicle:", error)
      toast.error("An error occurred", {
        description: "Failed to add the vehicle. Please check your connection and try again.",
      })
    } finally {
      dispatch(setSubmitLoading(false))
    }
  }

  const ErrorMessage = ({ field }: { field: string }) => {
    if (!validationErrors[field]) return null
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{validationErrors[field]}</AlertDescription>
      </Alert>
    )
  }

  const steps = [
    {
      label: "Vehicle Details",
      content: (
        <div className="w-full">
          {/* Main Grid - 3 Columns */}
          <div className="grid grid-cols-3 gap-6">
            {/* VIN Number */}
            <div className="space-y-2">
              <Label htmlFor="vin" className="text-sm font-medium">
                VIN Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="vin"
                  name="vin"
                  placeholder="e.g., VF3ABC12345678901"
                  value={formData.vin}
                  onChange={handleInputChange}
                  className={cn(
                    "pl-10",
                    validationErrors.vin && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              <ErrorMessage field="vin" />
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="registration_number" className="text-sm font-medium">
                Registration Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="registration_number"
                  name="registration_number"
                  placeholder="e.g., AB12 CDE"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  className={cn(
                    "pl-10",
                    validationErrors.registration_number && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              <ErrorMessage field="registration_number" />
            </div>

            {/* Make */}
            <div className="space-y-2">
              <Label htmlFor="make" className="text-sm font-medium">
                Make <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="make"
                  name="make"
                  placeholder="e.g., Mercedes"
                  value={formData.make}
                  onChange={handleInputChange}
                  className={cn(
                    "pl-10",
                    validationErrors.make && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              <ErrorMessage field="make" />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">
                Model <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Settings className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g., Sprinter"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={cn(
                    "pl-10",
                    validationErrors.model && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              <ErrorMessage field="model" />
            </div>

            {/* Vehicle Type - Custom Options */}
            <div className="space-y-2">
              <Label htmlFor="vehicles_type" className="text-sm font-medium">
                Vehicle Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.vehicles_type.toString()}
                onValueChange={(value) => handleSelectChange("vehicles_type", value)}
              >
                <SelectTrigger
                  className={cn(
                    "w-full",
                    validationErrors.vehicles_type && "border-red-500"
                  )}
                >
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" disabled>Select vehicle type</SelectItem>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4" />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorMessage field="vehicles_type" />
            </div>

            {/* Number of Seats */}
            <div className="space-y-2">
              <Label htmlFor="number_of_seats" className="text-sm font-medium">
                Number of Seats
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="number_of_seats"
                  name="number_of_seats"
                  type="number"
                  min="1"
                  placeholder="e.g., 16"
                  value={formData.number_of_seats || ""}
                  onChange={handleNumberInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Current Mileage - NEW FIELD */}
            <div className="space-y-2">
              <Label htmlFor="current_mileage" className="text-sm font-medium">
                Current Mileage <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="current_mileage"
                    name="current_mileage"
                    type="number"
                    min="0"
                    placeholder="e.g., 50000"
                    value={formData.current_mileage || ""}
                    onChange={handleNumberInputChange}
                    className={cn(
                      "pl-10",
                      validationErrors.current_mileage && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                <Select
                  value={formData.mileage_unit}
                  onValueChange={(value) => handleSelectChange("mileage_unit", value)}
                  // className="w-32"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kms">KMS</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ErrorMessage field="current_mileage" />
            </div>

            {/* Tacho Fitted - NEW FIELD */}
            <div className="space-y-2">
              <Label htmlFor="is_tacho_fitted" className="text-sm font-medium">
                Tacho Fitted
              </Label>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="is_tacho_fitted" className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                  <Activity className="h-4 w-4" />
                  Tacho Fitted
                </Label>
                <Switch
                  id="is_tacho_fitted"
                  checked={formData.is_tacho_fitted}
                  onCheckedChange={(checked) => dispatch(setFormData({ is_tacho_fitted: checked }))}
                />
              </div>
            </div>

            {/* Wheelchair Lift Fitted - NEW FIELD */}
            <div className="space-y-2">
              <Label htmlFor="is_wheelchair_lift_fitted" className="text-sm font-medium">
                Wheelchair Lift Fitted
              </Label>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="is_wheelchair_lift_fitted" className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                  <Accessibility className="h-4 w-4" />
                  Wheelchair Lift Fitted
                </Label>
                <Switch
                  id="is_wheelchair_lift_fitted"
                  checked={formData.is_wheelchair_lift_fitted}
                  onCheckedChange={(checked) => dispatch(setFormData({ is_wheelchair_lift_fitted: checked }))}
                />
              </div>
            </div>

            {/* Vehicle Status */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_status" className="text-sm font-medium">
                Vehicle Status
              </Label>
              <Select
                value={formData.vehicle_status}
                onValueChange={(value) => handleSelectChange("vehicle_status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Roadworthy Status */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_roadworthy_status" className="text-sm font-medium">
                Roadworthy Status
              </Label>
              <Select
                value={formData.vehicle_roadworthy_status}
                onValueChange={(value) => handleSelectChange("vehicle_roadworthy_status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_defect">No Defect</SelectItem>
                  <SelectItem value="minor_defect_roadworthy">Minor Defect Roadworthy</SelectItem>
                  <SelectItem value="minor_defect_not_roadworthy">Minor Defect - Not Roadworthy</SelectItem>
                  <SelectItem value="major_defect_not_roadworthy">Major Defect - Not Roadworthy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Roadworthy */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_roadworthy" className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                <CheckCircle2 className="h-4 w-4" />
                Is Roadworthy
              </Label>
              <Switch
                id="is_roadworthy"
                checked={formData.is_roadworthy}
                onCheckedChange={(checked) => dispatch(setFormData({ is_roadworthy: checked }))}
              />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                <Activity className="h-4 w-4" />
                Is Active
              </Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => dispatch(setFormData({ is_active: checked }))}
              />
            </div>
          </div>

          {/* Allocated Sites */}
          <div className="space-y-4 mt-6">
            <Label className="text-sm font-medium">
              Allocated Site(s) <span className="text-red-500">*</span>
            </Label>
            <MultiSelect
              options={sites}
              selected={formData.site_allocated}
              onChange={(values) => handleMultiSelectChange("site_allocated", values)}
              placeholder="Select one or more sites"
              error={!!validationErrors.site_allocated}
            />
            <ErrorMessage field="site_allocated" />
          </div>

          {/* Notes */}
          <div className="space-y-2 mt-6">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Enter any additional notes about the vehicle..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Vehicle Documents",
      content: (
        <div>
          <Alert className="bg-amber-50 border-amber-200 mb-6">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>All documents are required.</strong> Please upload all vehicle documents before proceeding.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { field: "vehicle_picture", label: "Vehicle Picture", icon: Image },
              { field: "new_vehicle_checklist_docs", label: "New Vehicle Checklist", icon: FileCheck },
              { field: "logbook_docs", label: "Logbook / V5", icon: BookOpen },
              { field: "COIF_technical_docs", label: "COIF / Technical Data", icon: FileText },
              { field: "vehicle_invoice_docs", label: "Vehicle Invoice", icon: FileText },
              { field: "mot_check_docs", label: "MOT Certificate", icon: FileCheck, optional: true },
            ].map(({ field, label, icon: Icon, optional }) => (
              <div key={field} className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label} {!optional && <span className="text-red-500">*</span>}
                </Label>
                <FileUploader 
                  onUploadSuccess={handleFileUploadSuccess(field as keyof VehicleFormData)} 
                />
                {formData[field as keyof VehicleFormData] ? (
                  <p className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Uploaded
                  </p>
                ) : (
                  !optional && validationErrors[field] && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {validationErrors[field]}
                      </AlertDescription>
                    </Alert>
                  )
                )}
              </div>
            ))}
          </div>
          
          {/* Show summary of missing documents */}
          {Object.keys(validationErrors).some(key => [
            "vehicle_picture", 
            "new_vehicle_checklist_docs", 
            "logbook_docs", 
            "COIF_technical_docs", 
            "vehicle_invoice_docs"
          ].includes(key)) && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please upload all required documents before proceeding to the next step.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
    },
    {
      label: "Purchase & PMI",
      content: (
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Purchase details and PMI information for record keeping.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Details */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg shadow">
              <h4 className="font-semibold text-blue-900">Purchase Details</h4>
              
              <div>
                <Label htmlFor="date_of_purchase" className="text-sm font-medium">
                  Date of Purchase
                </Label>
                <Input
                  id="date_of_purchase"
                  name="date_of_purchase"
                  type="date"
                  value={formData.date_of_purchase}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="purchased_from" className="text-sm font-medium">
                  Purchased From
                </Label>
                <Input
                  id="purchased_from"
                  name="purchased_from"
                  placeholder="e.g., ABC Motors Ltd"
                  value={formData.purchased_from}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="purchased_by" className="text-sm font-medium">
                  Purchased By
                </Label>
                <Input
                  id="purchased_by"
                  name="purchased_by"
                  placeholder="e.g., John Smith"
                  value={formData.purchased_by}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-sm font-medium">
                  Price (£)
                </Label>
                <Input
                  id="price"
                  name="price"
                  placeholder="0"
                  type="number"
                  value={formData.price}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) {
                      handleInputChange(e);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (["e", "E", ".", ",", "-", "+"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white">
                <Label htmlFor="has_vat" className="text-sm font-medium cursor-pointer">
                  VAT Applicable
                </Label>
                <Switch
                  id="has_vat"
                  checked={formData.has_vat}
                  onCheckedChange={(checked) => {
                    const updated = { ...formData, has_vat: checked };
                    if (checked) {
                      const p = parseFloat(formData.price) || 0;
                      updated.vat_amount = (p * 0.20).toFixed(2);
                    } else {
                      updated.vat_amount = "";
                    }
                    dispatch(setFormData(updated));
                  }}
                />
              </div>

              {formData.has_vat && (
                <div>
                  <Label htmlFor="vat_amount" className="text-sm font-medium">
                    VAT Amount (£)
                  </Label>
                  <Input
                    id="vat_amount"
                    name="vat_amount"
                    value={formData.vat_amount}
                    readOnly
                    disabled
                  />
                </div>
              )}
            </div>

            {/* PMI Information */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg shadow">
              <h4 className="font-semibold text-green-900">PMI Information</h4>
              
              <div>
                <Label htmlFor="last_pmi_date" className="text-sm font-medium">
                  Last PMI Date
                </Label>
                <Input
                  id="last_pmi_date"
                  name="last_pmi_date"
                  type="date"
                  value={formData.last_pmi_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="pmi_booked_date" className="text-sm font-medium">
                  PMI Booked Date
                </Label>
                <Input
                  id="pmi_booked_date"
                  name="pmi_booked_date"
                  type="date"
                  value={formData.pmi_booked_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="pmi_cycle" className="text-sm font-medium">
                  PMI Cycle (days)
                </Label>
                <Input
                  id="pmi_cycle"
                  name="pmi_cycle"
                  type="number"
                  placeholder="e.g., 90"
                  value={formData.pmi_cycle || ""}
                  onChange={handleNumberInputChange}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">PMI Inspection Docs</Label>
                <FileUploader onUploadSuccess={handleFileUploadSuccess("pmi_inspection_docs")} />
                {formData.pmi_inspection_docs && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Document uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Document Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {[
              { field: "service_records_docs", label: "Service Records", icon: FileText },
              { field: "others_docs", label: "Other Documents", icon: FileText },
            ].map(({ field, label, icon: Icon }) => (
              <div key={field} className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </Label>
                <FileUploader onUploadSuccess={handleFileUploadSuccess(field as keyof VehicleFormData)} />
                {formData[field as keyof VehicleFormData] && (
                  <p className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Uploaded
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Expiry Dates",
      content: (
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Important:</strong> Document upload is mandatory for each date entered or changed.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4">
            {/* Last PMI Date */}
            <DateInputWithFileUpload
              label="Last PMI Date"
              name="last_pmi_date"
              value={formData.last_pmi_date}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("last_pmi_date_docs")}
              error={validationErrors.last_pmi_date}
              docFieldName="last_pmi_date_docs"
              docValue={formData.last_pmi_date_docs}
              docError={validationErrors.last_pmi_date_docs}
            />

            {/* MOT Expiry Date */}
            <DateInputWithFileUpload
              label="MOT Expiry Date"
              name="mot_expiry"
              value={formData.mot_expiry}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("mot_expiry_docs")}
              error={validationErrors.mot_expiry}
              required={true}
              docFieldName="mot_expiry_docs"
              docValue={formData.mot_expiry_docs}
              docError={validationErrors.mot_expiry_docs}
            />

            {/* Insurance Expiry Date */}
            <DateInputWithFileUpload
              label="Insurance Expiry Date"
              name="insurance_expiry"
              value={formData.insurance_expiry}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("insurance_expiry_docs")}
              error={validationErrors.insurance_expiry}
              required={true}
              docFieldName="insurance_expiry_docs"
              docValue={formData.insurance_expiry_docs}
              docError={validationErrors.insurance_expiry_docs}
            />

            {/* Tax Expiry Date */}
            <DateInputWithFileUpload
              label="Tax Expiry Date"
              name="tax_expiry"
              value={formData.tax_expiry}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("tax_expiry_docs")}
              error={validationErrors.tax_expiry}
              required={true}
              docFieldName="tax_expiry_docs"
              docValue={formData.tax_expiry_docs}
              docError={validationErrors.tax_expiry_docs}
            />

            {/* Tachograph Information (Conditional) */}
            {formData.is_tacho_fitted && (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Tachograph Information (Tacho is fitted)
                  </AlertDescription>
                </Alert>

                <DateInputWithFileUpload
                  label="Tacho Calibration Expiry"
                  name="tacho_calibration_expiry"
                  value={formData.tacho_calibration_expiry}
                  onChange={handleDateChange}
                  onFileUpload={handleFileUploadSuccess("tacho_calibration_expiry_docs")}
                  error={validationErrors.tacho_calibration_expiry}
                  docFieldName="tacho_calibration_expiry_docs"
                  docValue={formData.tacho_calibration_expiry_docs}
                  docError={validationErrors.tacho_calibration_expiry_docs}
                />

                <DateInputWithFileUpload
                  label="Last Vehicle Tacho Download Date"
                  name="last_tacho_download_date"
                  value={formData.last_tacho_download_date}
                  onChange={handleDateChange}
                  onFileUpload={handleFileUploadSuccess("last_tacho_download_date_docs")}
                  error={validationErrors.last_tacho_download_date}
                  docFieldName="last_tacho_download_date_docs"
                  docValue={formData.last_tacho_download_date_docs}
                  docError={validationErrors.last_tacho_download_date_docs}
                />
              </>
            )}

            {/* Loller Calibration (Conditional) */}
            {formData.is_wheelchair_lift_fitted && (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <Accessibility className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Loller Calibration (Wheelchair lift is fitted)
                  </AlertDescription>
                </Alert>

                <DateInputWithFileUpload
                  label="Loller Calibration Expiry"
                  name="loller_calibration_expiry"
                  value={formData.loller_calibration_expiry}
                  onChange={handleDateChange}
                  onFileUpload={handleFileUploadSuccess("loller_calibration_expiry_docs")}
                  error={validationErrors.loller_calibration_expiry}
                  docFieldName="loller_calibration_expiry_docs"
                  docValue={formData.loller_calibration_expiry_docs}
                  docError={validationErrors.loller_calibration_expiry_docs}
                />
              </>
            )}
          </div>

          {/* Additional Dates (without document upload requirement) */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Additional Dates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="next_loller_test_date" className="text-sm font-medium">
                  Next LOLLER Test Date
                </Label>
                <Input
                  id="next_loller_test_date"
                  name="next_loller_test_date"
                  type="date"
                  value={formData.next_loller_test_date}
                  onChange={handleDateChange}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="last_tyre_maintenance_check_date" className="text-sm font-medium">
                  Last Tyre Maintenance Check
                </Label>
                <Input
                  id="last_tyre_maintenance_check_date"
                  name="last_tyre_maintenance_check_date"
                  type="date"
                  value={formData.last_tyre_maintenance_check_date}
                  onChange={handleDateChange}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="next_tyre_maintenance_check_date" className="text-sm font-medium">
                  Next Tyre Maintenance Check
                </Label>
                <Input
                  id="next_tyre_maintenance_check_date"
                  name="next_tyre_maintenance_check_date"
                  type="date"
                  value={formData.next_tyre_maintenance_check_date}
                  onChange={handleDateChange}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="last_valet_check_date" className="text-sm font-medium">
                  Last Valet Check
                </Label>
                <Input
                  id="last_valet_check_date"
                  name="last_valet_check_date"
                  type="date"
                  value={formData.last_valet_check_date}
                  onChange={handleDateChange}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Tyre Checks",
      content: (
        <div className="space-y-6">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>All tyre fields are required.</strong> 
              Expiry format: WWYY (e.g., 0124 for week 1 of 2024). 
              Depth ≥1.6mm or &quot;NV&quot; for Null Value, Front Pressure 65–68 PSI, Rear Pressure 56–58 PSI, Torque 200–210 Nm.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-6">
            {/* Front Driver */}
            <div className="flex justify-between">
              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-blue-50 to-white">
              <h4 className="font-semibold mb-4 text-blue-900">Front Driver</h4>
              <div className="space-y-4">
                <TyreCheckInput
                  label="Expiry (WWYY)"
                  name="tyre_expiry_front_driver"
                  value={formData.tyre_expiry_front_driver}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors.tyre_expiry_front_driver}
                  placeholder="0124"
                  tooltip="Week and year format: 0124 = Week 01 of 2024"
                />
                <TyreCheckInput
                  label="Depth (mm)"
                  name="tyre_depth_front_driver"
                  value={formData.tyre_depth_front_driver}
                  onChange={handleStringNumberInputChange}
                  error={validationErrors.tyre_depth_front_driver}
                  placeholder="3.5 or NV"
                  tooltip="Minimum 1.6mm or 'NV' for Null Value"
                />
                <TyreCheckInput
                  label="Pressure (PSI)"
                  name="tyre_pressure_front_driver"
                  value={formData.tyre_pressure_front_driver}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_pressure_front_driver}
                  type="number"
                  step="0.1"
                  placeholder="66.5"
                  tooltip="Front tyres: 65-68 PSI"
                />
                <TyreCheckInput
                  label="Torque (Nm)"
                  name="tyre_torque_front_driver"
                  value={formData.tyre_torque_front_driver}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_torque_front_driver}
                  type="number"
                  step="0.1"
                  placeholder="205"
                  tooltip="Torque: 200-210 Nm"
                />
              </div>
            </div>

            {/* Front Passenger */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-green-50 to-white">
              <h4 className="font-semibold mb-4 text-green-900">Front Passenger</h4>
              <div className="space-y-4">
                <TyreCheckInput
                  label="Expiry (WWYY)"
                  name="tyre_expiry_front_passenger"
                  value={formData.tyre_expiry_front_passenger}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors.tyre_expiry_front_passenger}
                  placeholder="0124"
                  tooltip="Week and year format: 0124 = Week 01 of 2024"
                />
                <TyreCheckInput
                  label="Depth (mm)"
                  name="tyre_depth_front_passenger"
                  value={formData.tyre_depth_front_passenger}
                  onChange={handleStringNumberInputChange}
                  error={validationErrors.tyre_depth_front_passenger}
                  placeholder="3.5 or NV"
                  tooltip="Minimum 1.6mm or 'NV' for Null Value"
                />
                <TyreCheckInput
                  label="Pressure (PSI)"
                  name="tyre_pressure_front_passenger"
                  value={formData.tyre_pressure_front_passenger}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_pressure_front_passenger}
                  type="number"
                  step="0.1"
                  placeholder="66.5"
                  tooltip="Front tyres: 65-68 PSI"
                />
                <TyreCheckInput
                  label="Torque (Nm)"
                  name="tyre_torque_front_passenger"
                  value={formData.tyre_torque_front_passenger}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_torque_front_passenger}
                  type="number"
                  step="0.1"
                  placeholder="205"
                  tooltip="Torque: 200-210 Nm"
                />
              </div>
            </div>
            </div>

            {/* Rear Outer Driver */}
          <div className=" flex gap-2">
              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-purple-50 to-white">
              <h4 className="font-semibold mb-4 text-purple-900">Rear Outer Driver</h4>
              <div className="space-y-4">
                <TyreCheckInput
                  label="Expiry (WWYY)"
                  name="tyre_expiry_rear_outer_driver"
                  value={formData.tyre_expiry_rear_outer_driver}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors.tyre_expiry_rear_outer_driver}
                  placeholder="0124"
                  tooltip="Week and year format: 0124 = Week 01 of 2024"
                />
                <TyreCheckInput
                  label="Depth (mm)"
                  name="tyre_depth_rear_outer_driver"
                  value={formData.tyre_depth_rear_outer_driver}
                  onChange={handleStringNumberInputChange}
                  error={validationErrors.tyre_depth_rear_outer_driver}
                  placeholder="3.5 or NV"
                  tooltip="Minimum 1.6mm or 'NV' for Null Value"
                />
                <TyreCheckInput
                  label="Pressure (PSI)"
                  name="tyre_pressure_rear_outer_driver"
                  value={formData.tyre_pressure_rear_outer_driver}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_pressure_rear_outer_driver}
                  type="number"
                  step="0.1"
                  placeholder="57.0"
                  tooltip="Rear tyres: 56-58 PSI"
                />
                <TyreCheckInput
                  label="Torque (Nm)"
                  name="tyre_torque_rear_outer_driver"
                  value={formData.tyre_torque_rear_outer_driver}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_torque_rear_outer_driver}
                  type="number"
                  step="0.1"
                  placeholder="205"
                  tooltip="Torque: 200-210 Nm"
                />
              </div>
            </div>

            {/* Rear Outer Passenger */}
       

            {/* Rear Inner Driver */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-red-50 to-white">
              <h4 className="font-semibold mb-4 text-red-900">Rear Inner Driver</h4>
              <div className="space-y-4">
                <TyreCheckInput
                  label="Expiry (WWYY)"
                  name="tyre_expiry_rear_inner_driver"
                  value={formData.tyre_expiry_rear_inner_driver}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors.tyre_expiry_rear_inner_driver}
                  placeholder="0124"
                  tooltip="Week and year format: 0124 = Week 01 of 2024"
                />
                <TyreCheckInput
                  label="Depth (mm)"
                  name="tyre_depth_rear_inner_driver"
                  value={formData.tyre_depth_rear_inner_driver}
                  onChange={handleStringNumberInputChange}
                  error={validationErrors.tyre_depth_rear_inner_driver}
                  placeholder="3.5 or NV"
                  tooltip="Minimum 1.6mm or 'NV' for Null Value"
                />
                <TyreCheckInput
                  label="Pressure (PSI)"
                  name="tyre_pressure_rear_inner_driver"
                  value={formData.tyre_pressure_rear_inner_driver}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_pressure_rear_inner_driver}
                  type="number"
                  step="0.1"
                  placeholder="57.0"
                  tooltip="Rear tyres: 56-58 PSI"
                />
                {/* No torque for inner tyres */}
              </div>
            </div>

            {/* Rear Inner Passenger */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-yellow-50 to-white">
              <h4 className="font-semibold mb-4 text-yellow-900">Rear Inner Passenger</h4>
              <div className="space-y-4">
                <TyreCheckInput
                  label="Expiry (WWYY)"
                  name="tyre_expiry_rear_inner_passenger"
                  value={formData.tyre_expiry_rear_inner_passenger}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors.tyre_expiry_rear_inner_passenger}
                  placeholder="0124"
                  tooltip="Week and year format: 0124 = Week 01 of 2024"
                />
                <TyreCheckInput
                  label="Depth (mm)"
                  name="tyre_depth_rear_inner_passenger"
                  value={formData.tyre_depth_rear_inner_passenger}
                  onChange={handleStringNumberInputChange}
                  error={validationErrors.tyre_depth_rear_inner_passenger}
                  placeholder="3.5 or NV"
                  tooltip="Minimum 1.6mm or 'NV' for Null Value"
                />
                <TyreCheckInput
                  label="Pressure (PSI)"
                  name="tyre_pressure_rear_inner_passenger"
                  value={formData.tyre_pressure_rear_inner_passenger}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_pressure_rear_inner_passenger}
                  type="number"
                  step="0.1"
                  placeholder="57.0"
                  tooltip="Rear tyres: 56-58 PSI"
                />
                {/* No torque for inner tyres */}
              </div>
            </div>
                 <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-orange-50 to-white">
              <h4 className="font-semibold mb-4 text-orange-900">Rear Outer Passenger</h4>
              <div className="space-y-4">
                <TyreCheckInput
                  label="Expiry (WWYY)"
                  name="tyre_expiry_rear_outer_passenger"
                  value={formData.tyre_expiry_rear_outer_passenger}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors.tyre_expiry_rear_outer_passenger}
                  placeholder="0124"
                  tooltip="Week and year format: 0124 = Week 01 of 2024"
                />
                <TyreCheckInput
                  label="Depth (mm)"
                  name="tyre_depth_rear_outer_passenger"
                  value={formData.tyre_depth_rear_outer_passenger}
                  onChange={handleStringNumberInputChange}
                  error={validationErrors.tyre_depth_rear_outer_passenger}
                  placeholder="3.5 or NV"
                  tooltip="Minimum 1.6mm or 'NV' for Null Value"
                />
                <TyreCheckInput
                  label="Pressure (PSI)"
                  name="tyre_pressure_rear_outer_passenger"
                  value={formData.tyre_pressure_rear_outer_passenger}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_pressure_rear_outer_passenger}
                  type="number"
                  step="0.1"
                  placeholder="57.0"
                  tooltip="Rear tyres: 56-58 PSI"
                />
                <TyreCheckInput
                  label="Torque (Nm)"
                  name="tyre_torque_rear_outer_passenger"
                  value={formData.tyre_torque_rear_outer_passenger}
                  onChange={handleNumberInputChange}
                  error={validationErrors.tyre_torque_rear_outer_passenger}
                  type="number"
                  step="0.1"
                  placeholder="205"
                  tooltip="Torque: 200-210 Nm"
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      ),
    },
    {
      label: "Review & Submit",
      content: (
        <div className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Please review all information before submitting. You can go back to edit any section.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-medium">{formData.vin || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration:</span>
                  <span className="font-medium">{formData.registration_number || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Make:</span>
                  <span className="font-medium">{formData.make || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{formData.model || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">
                    {vehicleTypes.find((t) => t.id === formData.vehicles_type)?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Mileage:</span>
                  <span className="font-medium">{formData.current_mileage || "0"} {formData.mileage_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tacho Fitted:</span>
                  <span className="font-medium">{formData.is_tacho_fitted ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wheelchair Lift:</span>
                  <span className="font-medium">{formData.is_wheelchair_lift_fitted ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Purchase Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {formData.date_of_purchase || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{formData.price ? `£${formData.price}` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT:</span>
                  <span className="font-medium">
                    {formData.has_vat ? (formData.vat_amount ? `£${formData.vat_amount}` : "Yes") : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compliance Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MOT:</span>
                  <span className="font-medium">
                    {formData.mot_expiry || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance:</span>
                  <span className="font-medium">
                    {formData.insurance_expiry || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">
                    {formData.tax_expiry || "N/A"}
                  </span>
                </div>
                {formData.is_tacho_fitted && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tacho Calibration:</span>
                      <span className="font-medium">
                        {formData.tacho_calibration_expiry || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Tacho Download:</span>
                      <span className="font-medium">
                        {formData.last_tacho_download_date || "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tyre Status (ALL 6)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Driver:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_front_driver ? (formData.tyre_depth_front_driver.toUpperCase() === "NV" ? "NV" : `${formData.tyre_depth_front_driver}mm`) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Pass:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_front_passenger ? (formData.tyre_depth_front_passenger.toUpperCase() === "NV" ? "NV" : `${formData.tyre_depth_front_passenger}mm`) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Outer Driver:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_outer_driver ? (formData.tyre_depth_rear_outer_driver.toUpperCase() === "NV" ? "NV" : `${formData.tyre_depth_rear_outer_driver}mm`) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Outer Pass:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_outer_passenger ? (formData.tyre_depth_rear_outer_passenger.toUpperCase() === "NV" ? "NV" : `${formData.tyre_depth_rear_outer_passenger}mm`) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Inner Driver:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_inner_driver ? (formData.tyre_depth_rear_inner_driver.toUpperCase() === "NV" ? "NV" : `${formData.tyre_depth_rear_inner_driver}mm`) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Inner Pass:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_inner_passenger ? (formData.tyre_depth_rear_inner_passenger.toUpperCase() === "NV" ? "NV" : `${formData.tyre_depth_rear_inner_passenger}mm`) : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <p className="text-sm text-muted-foreground">
              Click &quot;Create Vehicle&quot; button below to submit the form
            </p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto p-6">
        <form onSubmit={(e) => e.preventDefault()}>
          <StepperTabs labels={steps.map((step) => step.label)} />
          <StepperContent>
            {steps.map((step, index) => (
              <div key={index} className="space-y-6">
                <Card className="border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {step.label}
                      {currentStep === 0 && <Badge variant="destructive">Required Fields</Badge>}
                      {currentStep === 1 && <Badge variant="destructive">All Documents Required</Badge>}
                      {currentStep === 3 && <Badge variant="destructive">Documents Required for Dates</Badge>}
                      {currentStep === 4 && <Badge variant="destructive">All Tyre Fields Required</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {index === 0 &&
                        "Enter vehicle information including current mileage, tacho, and wheelchair lift status. All fields marked with * are required."}
                      {index === 1 && "All documents are required. Upload vehicle picture, checklist, logbook, COIF, and invoice."}
                      {index === 2 && "Record purchase details and PMI information for your records."}
                      {index === 3 && "Track compliance dates. Document upload is mandatory for each date entered."}
                      {index === 4 && "Complete all tyre checks (6 tyres) with required safety metrics. Enter 'NV' for Null Value in depth fields."}
                      {index === 5 && "Review all information and submit the vehicle registration."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{step.content}</CardContent>
                </Card>
              </div>
            ))}
          </StepperContent>
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-background border-t px-6 py-4 flex justify-between gap-4 shadow-lg">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => goToPreviousStep()}
                disabled={submitLoading || currentStep === 0}
                size="lg"
              >
                ← Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  dispatch(resetForm())
                }}
                disabled={submitLoading}
                size="lg"
              >
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
              {currentStep === steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Vehicle...
                    </>
                  ) : (
                    <>
                      <Car className="w-5 h-5 mr-2" />
                      Create Vehicle
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentStep()) {
                      goToNextStep()
                    } else {
                      toast.error("Please complete all required fields", {
                        description: "Fix the errors before proceeding to the next step.",
                      })
                    }
                  }}
                  disabled={submitLoading || sitesLoading || vehicleTypesLoading}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}

export default function AddVehicleStepperWrapper() {
  const steps = [
    { label: "Vehicle Details" },
    { label: "Vehicle Documents" },
    { label: "Purchase & PMI" },
    { label: "Expiry Dates" },
    { label: "Tyre Checks" },
    { label: "Review & Submit" },
  ]
  
  return (
    <Provider store={store}>
      <Stepper totalSteps={steps.length} initialStep={0}>
        <AddVehicleStepperForm />
      </Stepper>
    </Provider>
  )
}