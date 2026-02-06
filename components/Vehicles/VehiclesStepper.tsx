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
import {
  Loader2,
  Car,
  AlertCircle,
  CheckCircle2,
  FileText,
  BookOpen,
  FileCheck,
  Activity,
  Gauge,
  Users,
  Bus,
  Settings,
  ImageIcon,
  Info,
  Clock,
  Plus,
  FileImage,
  LucideX,
} from "lucide-react"
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
import CreateTaskDialog from "../task/CreateTaskDialog"

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

// Document interface for task creation
interface DocumentInfo {
  field: string
  label: string
  description?: string
  priority: "urgent" | "high" | "medium" | "low"
  deadlineDays: number
  estimatedHours: number
}

// Updated interface aligned with backend JSON
interface VehicleFormData {
  // ===== IDENTIFICATION =====
  vin: string
  vehicles_type: number
  site_allocated: number[]

  // ===== BASIC INFO =====
  registration_number: string
  make: string
  model: string
  vehicle_picture: string
  number_of_seats: number | null
  mileage_unit: "kms" | "miles"
  notes: string
  is_tacho_fitted: boolean
  is_wheelchair_lift_fitted: boolean

  // ===== PURCHASE INFO =====
  date_of_purchase: string
  purchased_from: string
  purchased_by: string
  price: string
  purchase_mileage: string
  has_vat: boolean
  vat_amount: string

  // ===== COMPLIANCE / ALERT DATES =====
  next_mot_to_be_booked_from: string
  book_next_pmi_from: string
  next_tacho_download_date: string
  next_tyre_maintenance_check_date: string

  // ===== PMI =====
  pmi_expiry_date: string
  last_pmi_date: string
  pmi_booked_date: string
  pmi_cycle: number | null

  // ===== STATUS =====
  vehicle_status: "available" | "unavailable" | "assigned" | "disabled"
  vehicle_roadworthy_status: "no_defect" | "minor_defect_roadworthy" | "minor_defect_not_roadworthy" | "major_defect_not_roadworthy"
  is_roadworthy: boolean
  is_active: boolean
  is_assigned: boolean
  assignee_driver: number | null
  walkaround_count: number | null
  last_mileage: string

  // ===== MOT / INSURANCE / TAX =====
  mot_expiry: string
  mot_booked_date: string
  mot_booked_time: string
  insurance_expiry: string
  tax_expiry: string

  // ===== LOLLER =====
  loller_test_expiry_date: string
  next_loller_test_date: string

  // ===== TACHOGRAPH =====
  tacho_calibration_expiry: string
  next_techo_calibration_book_date: string
  last_tacho_download_date: string
  tacho_notes: string

  // ===== OTHER CHECKS =====
  last_valet_check_date: string
  next_valet_check_date: string
  last_equipment_check_date: string
  next_equipment_check_date: string

  // ===== TYRE EXPIRY (WWYY format) =====
  tyre_expiry_front_driver: string
  tyre_expiry_front_passenger: string
  tyre_expiry_rear_inner_driver: string
  tyre_expiry_rear_inner_passenger: string
  tyre_expiry_rear_outer_driver: string
  tyre_expiry_rear_outer_passenger: string

  // ===== TYRE PRESSURE (PSI) =====
  tyre_pressure_front_driver: number | null
  tyre_pressure_front_passenger: number | null
  tyre_pressure_rear_inner_driver: number | null
  tyre_pressure_rear_inner_passenger: number | null
  tyre_pressure_rear_outer_driver: number | null
  tyre_pressure_rear_outer_passenger: number | null

  // ===== TYRE DEPTH (MM) =====
  tyre_depth_front_driver: string
  tyre_depth_front_passenger: string
  tyre_depth_rear_inner_driver: string
  tyre_depth_rear_inner_passenger: string
  tyre_depth_rear_outer_driver: string
  tyre_depth_rear_outer_passenger: string

  // ===== TYRE TORQUE (Nm) =====
  tyre_torque_front_driver: number | null
  tyre_torque_front_passenger: number | null
  tyre_torque_rear_outer_driver: number | null
  tyre_torque_rear_outer_passenger: number | null

  // ===== DOCUMENTS (URLs) =====
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
  showTaskDialog: boolean
  taskPrefillData: any
}

// Default values for tyre checks
const TYRE_DEFAULTS = {
  expiry: "0124",
  depth: "3.5",
  frontPressure: 66.5,
  rearPressure: 57.0,
  torque: 205,
}

// Document configuration for task creation
const DOCUMENT_CONFIG: Record<string, DocumentInfo> = {
  vehicle_picture: {
    field: "vehicle_picture",
    label: "Vehicle Picture",
    description: "Clear photos of the vehicle from multiple angles",
    priority: "high",
    deadlineDays: 2,
    estimatedHours: 0.5,
  },
  new_vehicle_checklist_docs: {
    field: "new_vehicle_checklist_docs",
    label: "New Vehicle Checklist",
    description: "Completed new vehicle inspection checklist",
    priority: "high",
    deadlineDays: 2,
    estimatedHours: 1,
  },
  logbook_docs: {
    field: "logbook_docs",
    label: "Logbook / V5",
    description: "Vehicle registration document (V5)",
    priority: "urgent",
    deadlineDays: 1,
    estimatedHours: 0.5,
  },
  COIF_technical_docs: {
    field: "COIF_technical_docs",
    label: "COIF / Technical Data",
    description: "Certificate of Initial Fitness and technical specifications",
    priority: "high",
    deadlineDays: 3,
    estimatedHours: 1,
  },
  vehicle_invoice_docs: {
    field: "vehicle_invoice_docs",
    label: "Vehicle Invoice",
    description: "Purchase invoice and payment receipt",
    priority: "medium",
    deadlineDays: 5,
    estimatedHours: 0.5,
  },
  service_records_docs: {
    field: "service_records_docs",
    label: "Service Records",
    description: "Previous service history and maintenance records",
    priority: "medium",
    deadlineDays: 7,
    estimatedHours: 1,
  },
  pmi_inspection_docs: {
    field: "pmi_inspection_docs",
    label: "PMI Inspection Report",
    description: "Latest Preventive Maintenance Inspection report",
    priority: "high",
    deadlineDays: 3,
    estimatedHours: 1.5,
  },
  mot_check_docs: {
    field: "mot_check_docs",
    label: "MOT Certificate",
    description: "Current MOT test certificate",
    priority: "urgent",
    deadlineDays: 1,
    estimatedHours: 0.5,
  },
  insurance_docs: {
    field: "insurance_docs",
    label: "Insurance Certificate",
    description: "Vehicle insurance certificate and policy",
    priority: "urgent",
    deadlineDays: 1,
    estimatedHours: 0.5,
  },
  tax_docs: {
    field: "tax_docs",
    label: "Tax Document",
    description: "Vehicle tax payment confirmation",
    priority: "urgent",
    deadlineDays: 1,
    estimatedHours: 0.5,
  },
  tacho_calibration_docs: {
    field: "tacho_calibration_docs",
    label: "Tacho Calibration Certificate",
    description: "Tachograph calibration certificate",
    priority: "high",
    deadlineDays: 3,
    estimatedHours: 1,
  },
  loller_docs: {
    field: "loller_docs",
    label: "LOLER Calibration Certificate",
    description: "LOLER lifting equipment calibration certificate",
    priority: "high",
    deadlineDays: 3,
    estimatedHours: 1,
  },
  others_docs: {
    field: "others_docs",
    label: "Other Documents",
    description: "Any other relevant vehicle documents",
    priority: "low",
    deadlineDays: 14,
    estimatedHours: 1,
  },
}

const initialState: VehicleState = {
  formData: {
    // ===== IDENTIFICATION =====
    vin: "",
    vehicles_type: 0,
    site_allocated: [],

    // ===== BASIC INFO =====
    registration_number: "",
    make: "",
    model: "",
    vehicle_picture: "",
    number_of_seats: null,
    mileage_unit: "miles",
    notes: "",
    is_tacho_fitted: false,
    is_wheelchair_lift_fitted: false,

    // ===== PURCHASE INFO =====
    date_of_purchase: "",
    purchased_from: "",
    purchased_by: "",
    price: "",
    purchase_mileage: "",
    has_vat: false,
    vat_amount: "",

    // ===== COMPLIANCE / ALERT DATES =====
    next_mot_to_be_booked_from: "",
    book_next_pmi_from: "",
    next_tacho_download_date: "",
    next_tyre_maintenance_check_date: "",

    // ===== PMI =====
    pmi_expiry_date: "",
    last_pmi_date: "",
    pmi_booked_date: "",
    pmi_cycle: null,

    // ===== STATUS =====
    vehicle_status: "available",
    vehicle_roadworthy_status: "no_defect",
    is_roadworthy: true,
    is_active: true,
    is_assigned: false,
    assignee_driver: null,
    walkaround_count: null,
    last_mileage: "",

    // ===== MOT / INSURANCE / TAX =====
    mot_expiry: "",
    mot_booked_date: "",
    mot_booked_time: "",
    insurance_expiry: "",
    tax_expiry: "",

    // ===== LOLLER =====
    loller_test_expiry_date: "",
    next_loller_test_date: "",

    // ===== TACHOGRAPH =====
    tacho_calibration_expiry: "",
    next_techo_calibration_book_date: "",
    last_tacho_download_date: "",
    tacho_notes: "",

    // ===== OTHER CHECKS =====
    last_valet_check_date: "",
    next_valet_check_date: "",
    last_equipment_check_date: "",
    next_equipment_check_date: "",

    // ===== TYRE EXPIRY =====
    tyre_expiry_front_driver: TYRE_DEFAULTS.expiry,
    tyre_expiry_front_passenger: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_inner_driver: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_inner_passenger: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_outer_driver: TYRE_DEFAULTS.expiry,
    tyre_expiry_rear_outer_passenger: TYRE_DEFAULTS.expiry,

    // ===== TYRE DEPTH =====
    tyre_depth_front_driver: TYRE_DEFAULTS.depth,
    tyre_depth_front_passenger: TYRE_DEFAULTS.depth,
    tyre_depth_rear_inner_driver: TYRE_DEFAULTS.depth,
    tyre_depth_rear_inner_passenger: TYRE_DEFAULTS.depth,
    tyre_depth_rear_outer_driver: TYRE_DEFAULTS.depth,
    tyre_depth_rear_outer_passenger: TYRE_DEFAULTS.depth,

    // ===== TYRE PRESSURE =====
    tyre_pressure_front_driver: TYRE_DEFAULTS.frontPressure,
    tyre_pressure_front_passenger: TYRE_DEFAULTS.frontPressure,
    tyre_pressure_rear_inner_driver: TYRE_DEFAULTS.rearPressure,
    tyre_pressure_rear_inner_passenger: TYRE_DEFAULTS.rearPressure,
    tyre_pressure_rear_outer_driver: TYRE_DEFAULTS.rearPressure,
    tyre_pressure_rear_outer_passenger: TYRE_DEFAULTS.rearPressure,

    // ===== TYRE TORQUE =====
    tyre_torque_front_driver: TYRE_DEFAULTS.torque,
    tyre_torque_front_passenger: TYRE_DEFAULTS.torque,
    tyre_torque_rear_outer_driver: TYRE_DEFAULTS.torque,
    tyre_torque_rear_outer_passenger: TYRE_DEFAULTS.torque,

    // ===== DOCUMENTS =====
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
  vehicleTypes: [],
  sitesLoading: false,
  vehicleTypesLoading: false,
  submitLoading: false,
  activeStep: 0,
  validationErrors: {},
  showTaskDialog: false,
  taskPrefillData: null,
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
    setShowTaskDialog: (state, action: PayloadAction<boolean>) => {
      state.showTaskDialog = action.payload
    },
    setTaskPrefillData: (state, action: PayloadAction<any>) => {
      state.taskPrefillData = action.payload
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
  setShowTaskDialog,
  setTaskPrefillData,
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

  const numValue = Number.parseFloat(value)
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

const validateTimeFormat = (value: string, fieldName: string): string | null => {
  if (!value) return null

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/
  if (!timeRegex.test(value)) {
    return `${fieldName} must be in HH:MM:SS format`
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
}

// INDIVIDUAL VALIDATION FUNCTIONS
const validateTyrePressure = (value: number | null, fieldLabel: string): string | null => {
  if (value === null || value === undefined) return `${fieldLabel} is required.`

  const lower = fieldLabel.toLowerCase()
  const isFront = lower.includes("front")
  const isRear = lower.includes("rear")

  if (isFront) {
    if (value < TYRE_SPECS.frontMin || value > TYRE_SPECS.frontMax)
      return `${fieldLabel} must be ${TYRE_SPECS.frontMin}–${TYRE_SPECS.frontMax} PSI.`
  }

  if (isRear) {
    if (value < TYRE_SPECS.rearMin || value > TYRE_SPECS.rearMax)
      return `${fieldLabel} must be ${TYRE_SPECS.rearMin}–${TYRE_SPECS.rearMax} PSI.`
  }

  return null
}

const validateTyreTorque = (value: number | null, fieldLabel: string): string | null => {
  if (value === null || value === undefined) return `${fieldLabel} is required.`

  if (value < TYRE_SPECS.torqueMin || value > TYRE_SPECS.torqueMax)
    return `${fieldLabel} must be ${TYRE_SPECS.torqueMin}–${TYRE_SPECS.torqueMax} Nm.`

  return null
}

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

  const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left transition-all duration-200 ease-in-out",
            error ? "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20" : 
            selected.length > 0 ? "border-green-400 hover:border-green-500 focus:border-green-500 focus:ring-green-500/20" :
            "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
          )}
        >
          <span className={cn(
            "text-sm font-medium",
            selected.length > 0 ? "text-green-700" : "text-slate-600"
          )}>
            {selected.length > 0 ? `${selected.length} site${selected.length > 1 ? "s" : ""} selected` : placeholder}
          </span>
          <span className="ml-auto h-4 w-4 shrink-0 opacity-50">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-lg">
        <Command>
          <CommandInput 
            placeholder="Search sites..." 
            value={search} 
            onValueChange={setSearch}
            className="border-b border-slate-200/50"
          />
          <CommandList className="max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">
                No sites found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    const newSelected = selected.includes(option.id)
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id]
                    onChange(newSelected)
                  }}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selected.includes(option.id) ? "bg-green-50 text-green-900" : "hover:bg-slate-50"
                  )}
                >
                  <Check className={cn(
                    "mr-2 h-4 w-4 transition-all",
                    selected.includes(option.id) ? "opacity-100 text-green-600" : "opacity-0"
                  )} />
                  {option.name}
                </CommandItem>
              ))
            )}
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
  onTaskCreate,
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
  onTaskCreate?: () => void
}) {
  const hasDateNoDoc = value && !docValue
  const hasError = error || docError
  const isComplete = value && docValue

  return (
    <div
      className={cn(
        "space-y-3 p-5 border rounded-lg transition-all duration-200 ease-in-out",
        isComplete && "bg-green-50/50 border-green-200/60",
        hasError && "bg-red-50/50 border-red-200/60",
        hasDateNoDoc && "bg-amber-50/50 border-amber-200/60",
        !isComplete && !hasError && !hasDateNoDoc && "bg-slate-50/50 border-slate-200/60"
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <Label htmlFor={name} className="text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {isComplete && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</p>}
        </div>
        {hasDateNoDoc && onTaskCreate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onTaskCreate}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/60 h-8 px-3 text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date</span>
          <Input
            id={name}
            name={name}
            type="date"
            value={value}
            onChange={onChange}
            className={cn(
              "text-sm transition-colors",
              hasError && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
              hasDateNoDoc && !hasError && "border-amber-400 focus:border-amber-500 focus:ring-amber-500/20",
              isComplete && "border-green-400 focus:border-green-500 focus:ring-green-500/20"
            )}
          />
          {error && <p className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}
          {hasDateNoDoc && !error && <p className="text-xs text-amber-600 flex items-center gap-1"><Clock className="h-3 w-3" /> Document required for this date</p>}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upload Document</span>
          <FileUploader onUploadSuccess={onFileUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          {docValue ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Document uploaded
            </div>
          ) : docError ? (
            <Alert variant="destructive" className="py-2 px-3 bg-red-50 border-red-200">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs text-red-700 font-medium">{docError}</AlertDescription>
            </Alert>
          ) : value && !docValue ? (
            <Alert className="bg-amber-50 border-amber-200 py-2 px-3">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700">
                <strong>Required:</strong> Upload document for this date to proceed
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Document Upload Component with Task Creation
function DocumentUploadWithTask({
  field,
  label,
  icon: Icon,
  value,
  onUploadSuccess,
  error,
  required = false,
  onTaskCreate,
  description,
}: {
  field: string
  label: string
  icon: React.ComponentType<any>
  value: string
  onUploadSuccess: (url: string) => void
  error?: string
  required?: boolean
  onTaskCreate?: () => void
  description?: string
}) {
  return (
    <div className={cn(
      "space-y-3 p-4 rounded-lg border transition-all duration-200 ease-in-out",
      value && "bg-green-50/50 border-green-200/60",
      error && "bg-red-50/50 border-red-200/60",
      !value && !error && "bg-slate-50/50 border-slate-200/60"
    )}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-600" />
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          {value && <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium"><CheckCircle2 className="h-3 w-3" /> Uploaded</p>}
        </div>
        {!value && onTaskCreate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onTaskCreate}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/60 h-8 px-3 text-xs font-medium transition-colors flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Task
          </Button>
        )}
      </div>

      {!value && <FileUploader onUploadSuccess={onUploadSuccess} />}
      
      {error && (
        <Alert variant="destructive" className="py-2 px-3 bg-red-50 border-red-200">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="text-xs text-red-700 font-medium">{error}</AlertDescription>
        </Alert>
      )}
      {required && !value && !error && (
        <Alert className="py-2 px-3 bg-yellow-50/50 border-yellow-200/60">
          <AlertCircle className="h-3 w-3 text-yellow-600" />
          <AlertDescription className="text-xs text-yellow-700">
            <strong>Required:</strong> Please upload this document
          </AlertDescription>
        </Alert>
      )}
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
  const hasValue = value !== null && value !== ""
  
  return (
    <div className={cn(
      "space-y-2 p-3 rounded-lg border transition-all duration-200 ease-in-out",
      error && "bg-red-50/50 border-red-200/60",
      !error && hasValue && "bg-green-50/50 border-green-200/60",
      !error && !hasValue && "bg-slate-50/50 border-slate-200/60"
    )}>
      <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
        {label} {required && <span className="text-red-500">*</span>}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-slate-500 cursor-help hover:text-slate-700 transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-slate-900 text-white">
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
        className={cn(
          "text-sm transition-colors",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
          !error && hasValue && "border-green-400 focus:border-green-500 focus:ring-green-500/20",
          !error && !hasValue && "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
        )}
      />
      {error && <p className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}
    </div>
  )
}

// Vehicle form component
function AddVehicleStepperForm() {
  const dispatch = useDispatch<AppDispatch>()
  const {
    formData,
    sites,
    vehicleTypes,
    sitesLoading,
    vehicleTypesLoading,
    submitLoading,
    validationErrors,
    showTaskDialog,
    taskPrefillData,
  } = useSelector((state: RootState) => state.vehicle)
  const cookies = useCookies()
  const { currentStep, goToNextStep, goToPreviousStep } = useStepper()

  // Function to fetch vehicle types from API
  const fetchVehicleTypes = async () => {
    dispatch(setVehicleTypesLoading(true))
    try {
      const response = await fetch(`${API_URL}/api/vehicle-types/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        const apiVehicleTypes: VehicleType[] = data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
        }))
        dispatch(setVehicleTypes(apiVehicleTypes))
      } else {
        toast.error("Failed to load vehicle types.")
        dispatch(setVehicleTypes([]))
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error)
      toast.error("An error occurred while fetching vehicle types.")
      dispatch(setVehicleTypes([]))
    } finally {
      dispatch(setVehicleTypesLoading(false))
    }
  }

  React.useEffect(() => {
    const fetchData = async () => {
      // Fetch sites
      dispatch(setSitesLoading(true))
      try {
        const sitesResponse = await fetch(`${API_URL}/api/sites/list-names/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const sitesData = await sitesResponse.json()
        if (sitesData.success) {
          dispatch(setSites(sitesData.data))
        } else {
          toast.error("Failed to load sites.")
        }
      } catch (error) {
        console.error("Error fetching sites:", error)
        toast.error("An error occurred while fetching sites.")
      } finally {
        dispatch(setSitesLoading(false))
      }

      // Fetch vehicle types from API
      await fetchVehicleTypes()
    }

    fetchData()
  }, [cookies, dispatch])

  const handleFileUploadSuccess = (field: keyof VehicleFormData) => (url: string) => {
    dispatch(setFormData({ [field]: url } as unknown as Partial<VehicleFormData>))
    const key = String(field)
    if (validationErrors[key]) {
      dispatch(clearValidationError(key))
    }
  }

  const handleCreateTaskForDocument = (documentField: string) => {
    const docConfig = DOCUMENT_CONFIG[documentField]
    if (!docConfig) return

    const vehicleReg = formData.registration_number || "New Vehicle"
    const vehicleInfo = formData.vin ? `VIN: ${formData.vin}` : ""

    const title = `Upload ${docConfig.label}: ${vehicleReg}`
    let description = `Vehicle: ${vehicleReg}\n${vehicleInfo}\n\nRequired: ${docConfig.description || docConfig.label}`

    // Add specific instructions based on document type
    if (documentField.includes("pmi")) {
      description += "\n\nInclude: PMI inspection report, checklist, and any repair notes"
    } else if (documentField.includes("service")) {
      description += "\n\nInclude: Service history, maintenance records, repair invoices"
    } else if (documentField.includes("tacho")) {
      description += "\n\nInclude: Calibration certificate, download report, calibration date"
    } else if (documentField.includes("loller")) {
      description += "\n\nInclude: LOLER test certificate, inspection report"
    }

    const deadline = new Date(Date.now() + docConfig.deadlineDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

    const prefillData = {
      title,
      description,
      priority: docConfig.priority,
      deadline,
      estimatedHours: docConfig.estimatedHours.toString(),
      requiresApproval: false,
    }

    dispatch(setTaskPrefillData(prefillData))
    dispatch(setShowTaskDialog(true))
  }

  const getMissingDocuments = (): DocumentInfo[] => {
    const missing: DocumentInfo[] = []

    Object.keys(DOCUMENT_CONFIG).forEach((field) => {
      const config = DOCUMENT_CONFIG[field]
      const value = formData[field as keyof VehicleFormData] as string

      // Check if document is required based on conditions
      let isRequired = false

      // Basic required documents (always)
      if (
        [
          "vehicle_picture",
          "new_vehicle_checklist_docs",
          "logbook_docs",
          "COIF_technical_docs",
          "vehicle_invoice_docs",
        ].includes(field)
      ) {
        isRequired = true
      }

      // PMI inspection report required if PMI date exists
      if (field === "pmi_inspection_docs" && (formData.last_pmi_date || formData.pmi_expiry_date)) {
        isRequired = true
      }

      // MOT, Insurance, Tax documents required if dates exist
      if (field === "mot_check_docs" && formData.mot_expiry) {
        isRequired = true
      }
      if (field === "insurance_docs" && formData.insurance_expiry) {
        isRequired = true
      }
      if (field === "tax_docs" && formData.tax_expiry) {
        isRequired = true
      }

      // Tacho documents only required if tacho is fitted and dates exist
      if (field === "tacho_calibration_docs" && formData.is_tacho_fitted && formData.tacho_calibration_expiry) {
        isRequired = true
      }

      // LOLER documents only required if wheelchair lift is fitted and dates exist
      if (field === "loller_docs" && formData.is_wheelchair_lift_fitted && formData.loller_test_expiry_date) {
        isRequired = true
      }

      if (isRequired && !value) {
        missing.push(config)
      }
    })

    return missing
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    const newValue: string | boolean = isCheckbox ? (e.target as HTMLInputElement).checked : value

    // Create a copy of formData to update
    const updated: any = { ...formData }
    
    // Update the field that changed
    updated[name] = newValue

    // Handle VAT recalculation when price changes OR when VAT switch is toggled
    if (name === "price") {
      // Update price (ensure it's a string for display)
      updated.price = value
      
      // Recalculate VAT if has_vat is true
      if (updated.has_vat) {
        const numericPrice = Number.parseFloat(value) || 0
        updated.vat_amount = (numericPrice * 0.2).toFixed(2)
      }
    }

    // Handle VAT calculation when VAT switch toggles
    if (name === "has_vat") {
      if (newValue === true) {
        const numericPrice = Number.parseFloat(formData.price || "0") || 0
        updated.vat_amount = (numericPrice * 0.2).toFixed(2)
      } else {
        updated.vat_amount = ""
      }
    }

    dispatch(setFormData(updated))

    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value || "" }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (name.includes("tyre_depth")) {
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

  // STRICT VALIDATION: Check if ALL required documents are uploaded
  const areAllDocumentsUploaded = (): boolean => {
    const missingDocs = getMissingDocuments()
    return missingDocs.length === 0
  }

  // STRICT VALIDATION: Check if documents are uploaded for dates with dates entered
  const areDateDocumentsUploaded = (): boolean => {
    // Check required expiry dates
    const requiredDateFields = [
      { date: formData.mot_expiry, doc: formData.mot_check_docs },
      { date: formData.insurance_expiry, doc: formData.insurance_docs },
      { date: formData.tax_expiry, doc: formData.tax_docs },
      { date: formData.last_pmi_date, doc: formData.pmi_inspection_docs },
      { date: formData.pmi_expiry_date, doc: formData.pmi_inspection_docs },
    ]

    // If date is entered, document must exist
    for (const { date, doc } of requiredDateFields) {
      if (date && !doc) return false
    }

    // Check conditional dates
    if (formData.is_tacho_fitted) {
      if (formData.tacho_calibration_expiry && !formData.tacho_calibration_docs) return false
    }

    if (formData.is_wheelchair_lift_fitted) {
      if (formData.loller_test_expiry_date && !formData.loller_docs) return false
    }

    return true
  }

  // Main validation function with STRICT document requirements
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

      // Validate last mileage
      const mileageError = validateRequiredString(formData.last_mileage, "Last Mileage")
      if (mileageError) errors.last_mileage = mileageError
    }

    // STEP 1 VALIDATION - Vehicle Purchase Details
    if (currentStep === 1) {
      const purchaseMileageError = validateRequiredString(formData.purchase_mileage, "Purchase Mileage")
      if (purchaseMileageError) errors.purchase_mileage = purchaseMileageError
    }

    // STEP 2 VALIDATION - Vehicle Documents (STRICT: ALL DOCUMENTS REQUIRED)
    if (currentStep === 2) {
      const requiredDocuments = [
        { field: "logbook_docs", label: "Logbook" },
        { field: "vehicle_invoice_docs", label: "Vehicle/Purchase Invoice" },
        { field: "COIF_technical_docs", label: "COIF" },
        { field: "service_records_docs", label: "Service Documents" },
        { field: "new_vehicle_checklist_docs", label: "Vehicle Delivery Checklist" },
        { field: "others_docs", label: "Other Documents" },
      ]

      requiredDocuments.forEach(({ field, label }) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateRequiredString(value, label)
        if (error) errors[field] = error
      })

      // ADDITIONAL: Show warning if any document is missing
      if (!areAllDocumentsUploaded()) {
        errors._documents = "All documents are required to proceed"
      }
    }

    // STEP 3 VALIDATION - Vehicle Compliance Documents & Expiry Dates (STRICT: DOCUMENTS REQUIRED FOR DATES)
    if (currentStep === 3) {
      // Validate date fields that are required
      const dateFields = [
        { field: "last_pmi_date", label: "Last PMI Date" },
        { field: "pmi_expiry_date", label: "PMI Expiry Date" },
        { field: "mot_expiry", label: "MOT Expiry Date", required: true },
        { field: "insurance_expiry", label: "Insurance Expiry Date", required: true },
        { field: "tax_expiry", label: "Tax Expiry Date", required: true },
        { field: "mot_booked_date", label: "MOT Booked Date" },
        { field: "mot_booked_time", label: "MOT Booked Time" },
        { field: "next_mot_to_be_booked_from", label: "Next MOT To Be Booked From" },
        { field: "book_next_pmi_from", label: "Book Next PMI From" },
        { field: "next_tacho_download_date", label: "Next Tacho Download Date" },
        { field: "next_tyre_maintenance_check_date", label: "Next Tyre Maintenance Check Date" },
        { field: "loller_test_expiry_date", label: "LOLER Test Expiry Date" },
        { field: "next_loller_test_date", label: "Next LOLER Test Date" },
        { field: "tacho_calibration_expiry", label: "Tacho Calibration Expiry" },
        { field: "next_techo_calibration_book_date", label: "Next Tacho Calibration Book Date" },
        { field: "last_tacho_download_date", label: "Last Tacho Download Date" },
        { field: "last_valet_check_date", label: "Last Valet Check Date" },
        { field: "next_valet_check_date", label: "Next Valet Check Date" },
        { field: "last_equipment_check_date", label: "Last Equipment Check Date" },
        { field: "next_equipment_check_date", label: "Next Equipment Check Date" },
      ]

      dateFields.forEach(({ field, label, required }) => {
        const value = formData[field as keyof VehicleFormData] as string

        if (required && !value) {
          errors[field] = `${label} is required`
        } else if (value) {
          if (field === "mot_booked_time") {
            const timeError = validateTimeFormat(value, label)
            if (timeError) errors[field] = timeError
          } else {
            const dateError = validateDateFormat(value, label)
            if (dateError) errors[field] = dateError
          }
        }
      })

      // Validate tacho dates if tacho is fitted
      if (formData.is_tacho_fitted) {
        const tachoFields = ["tacho_calibration_expiry", "last_tacho_download_date"]
        tachoFields.forEach((field) => {
          const value = formData[field as keyof VehicleFormData] as string
          const label = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          if (value) {
            const dateError = validateDateFormat(value, label)
            if (dateError) errors[field] = dateError
          }
        })
      }

      // Validate loller dates if wheelchair lift is fitted
      if (formData.is_wheelchair_lift_fitted) {
        const lollerFields = ["loller_test_expiry_date", "next_loller_test_date"]
        lollerFields.forEach((field) => {
          const value = formData[field as keyof VehicleFormData] as string
          const label = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          if (value) {
            const dateError = validateDateFormat(value, label)
            if (dateError) errors[field] = dateError
          }
        })
      }

      // ADDITIONAL: Show warning if dates exist without documents
      if (!areDateDocumentsUploaded()) {
        errors._dateDocuments = "Documents are required for all entered dates"
      }
    }

    // STEP 4 TYRE VALIDATION (ALL 6 TYRES)
    if (currentStep === 4) {
      // Expiry fields (6 tyres)
      const tyreExpiryFields = [
        "tyre_expiry_front_driver",
        "tyre_expiry_front_passenger",
        "tyre_expiry_rear_outer_driver",
        "tyre_expiry_rear_outer_passenger",
        "tyre_expiry_rear_inner_driver",
        "tyre_expiry_rear_inner_passenger",
      ]

      tyreExpiryFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateTyreExpiry(value)
        if (error) errors[field] = error
      })

      // Depth fields (6 tyres)
      const tyreDepthFields = [
        "tyre_depth_front_driver",
        "tyre_depth_front_passenger",
        "tyre_depth_rear_outer_driver",
        "tyre_depth_rear_outer_passenger",
        "tyre_depth_rear_inner_driver",
        "tyre_depth_rear_inner_passenger",
      ]

      tyreDepthFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateTyreDepth(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })

      // Pressure fields (6 tyres)
      const tyrePressureFields = [
        "tyre_pressure_front_driver",
        "tyre_pressure_front_passenger",
        "tyre_pressure_rear_outer_driver",
        "tyre_pressure_rear_outer_passenger",
        "tyre_pressure_rear_inner_driver",
        "tyre_pressure_rear_inner_passenger",
      ]

      tyrePressureFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as number | null
        const error = validateTyrePressure(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })

      // Torque fields (4 tyres only - outer tyres)
      const tyreTorqueFields = [
        "tyre_torque_front_driver",
        "tyre_torque_front_passenger",
        "tyre_torque_rear_outer_driver",
        "tyre_torque_rear_outer_passenger",
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

    type Nullable<T> = T | null

    const toInt = (v: unknown): Nullable<number> => {
      if (v === "" || v === null || v === undefined) return null
      const n = Number.parseInt(String(v), 10)
      return Number.isNaN(n) ? null : n
    }

    const toFloat = (v: unknown): Nullable<number> => {
      if (v === "" || v === null || v === undefined) return null
      const n = Number.parseFloat(String(v))
      return Number.isNaN(n) ? null : n
    }

    const nvToNullFloat = (v: unknown): Nullable<number> => {
      if (typeof v === "string" && v.trim().toUpperCase() === "NV") return null
      return toFloat(v)
    }

    // Map frontend field names to backend field names
    const submitData = {
      // ===== IDENTIFICATION =====
      vin: formData.vin,
      vehicles_type: formData.vehicles_type,
      site_allocated: formData.site_allocated,

      // ===== BASIC INFO =====
      registration_number: formData.registration_number,
      make: formData.make,
      model: formData.model,
      vehicle_picture: formData.vehicle_picture,
      number_of_seats: toInt(formData.number_of_seats),
      mileage_unit: formData.mileage_unit,
      notes: formData.notes,
      is_tacho_fitted: Boolean(formData.is_tacho_fitted),
      is_wheelchair_lift_fitted: Boolean(formData.is_wheelchair_lift_fitted),

      // ===== PURCHASE INFO =====
      date_of_purchase: formData.date_of_purchase || null,
      purchased_from: formData.purchased_from || null,
      purchased_by: formData.purchased_by || null,
      price: formData.price, // Keep as string
      purchase_mileage: formData.purchase_mileage,
      has_vat: Boolean(formData.has_vat),
      vat_amount: formData.vat_amount,

      // ===== COMPLIANCE / ALERT DATES =====
      next_mot_to_be_booked_from: formData.next_mot_to_be_booked_from || null,
      book_next_pmi_from: formData.book_next_pmi_from || null,
      next_tacho_download_date: formData.next_tacho_download_date || null,
      next_tyre_maintenance_check_date: formData.next_tyre_maintenance_check_date || null,

      // ===== PMI =====
      pmi_expiry_date: formData.pmi_expiry_date || null,
      last_pmi_date: formData.last_pmi_date || null,
      pmi_booked_date: formData.pmi_booked_date || null,
      pmi_cycle: toInt(formData.pmi_cycle),

      // ===== STATUS =====
      vehicle_status: formData.vehicle_status,
      vehicle_roadworthy_status: formData.vehicle_roadworthy_status,
      is_roadworthy: Boolean(formData.is_roadworthy),
      is_active: Boolean(formData.is_active),
      is_assigned: Boolean(formData.is_assigned),
      assignee_driver: toInt(formData.assignee_driver),
      walkaround_count: toInt(formData.walkaround_count),
      last_mileage: formData.last_mileage,

      // ===== MOT / INSURANCE / TAX =====
      mot_expiry: formData.mot_expiry || null,
      mot_booked_date: formData.mot_booked_date || null,
      mot_booked_time: formData.mot_booked_time || null,
      insurance_expiry: formData.insurance_expiry || null,
      tax_expiry: formData.tax_expiry || null,

      // ===== LOLLER =====
      loller_test_expiry_date: formData.loller_test_expiry_date || null,
      next_loller_test_date: formData.next_loller_test_date || null,

      // ===== TACHOGRAPH =====
      tacho_calibration_expiry: formData.tacho_calibration_expiry || null,
      next_techo_calibration_book_date: formData.next_techo_calibration_book_date || null,
      last_tacho_download_date: formData.last_tacho_download_date || null,
      tacho_notes: formData.tacho_notes || null,

      // ===== OTHER CHECKS =====
      last_valet_check_date: formData.last_valet_check_date || null,
      next_valet_check_date: formData.next_valet_check_date || null,
      last_equipment_check_date: formData.last_equipment_check_date || null,
      next_equipment_check_date: formData.next_equipment_check_date || null,

      // ===== TYRE EXPIRY =====
      tyre_expiry_front_driver: formData.tyre_expiry_front_driver,
      tyre_expiry_front_passenger: formData.tyre_expiry_front_passenger,
      tyre_expiry_rear_inner_driver: formData.tyre_expiry_rear_inner_driver,
      tyre_expiry_rear_inner_passenger: formData.tyre_expiry_rear_inner_passenger,
      tyre_expiry_rear_outer_driver: formData.tyre_expiry_rear_outer_driver,
      tyre_expiry_rear_outer_passenger: formData.tyre_expiry_rear_outer_passenger,

      // ===== TYRE DEPTH =====
      tyre_depth_front_driver: formData.tyre_depth_front_driver,
      tyre_depth_front_passenger: formData.tyre_depth_front_passenger,
      tyre_depth_rear_inner_driver: formData.tyre_depth_rear_inner_driver,
      tyre_depth_rear_inner_passenger: formData.tyre_depth_rear_inner_passenger,
      tyre_depth_rear_outer_driver: formData.tyre_depth_rear_outer_driver,
      tyre_depth_rear_outer_passenger: formData.tyre_depth_rear_outer_passenger,

      // ===== TYRE PRESSURE =====
      tyre_pressure_front_driver: toInt(formData.tyre_pressure_front_driver),
      tyre_pressure_front_passenger: toInt(formData.tyre_pressure_front_passenger),
      tyre_pressure_rear_inner_driver: toInt(formData.tyre_pressure_rear_inner_driver),
      tyre_pressure_rear_inner_passenger: toInt(formData.tyre_pressure_rear_inner_passenger),
      tyre_pressure_rear_outer_driver: toInt(formData.tyre_pressure_rear_outer_driver),
      tyre_pressure_rear_outer_passenger: toInt(formData.tyre_pressure_rear_outer_passenger),

      // ===== TYRE TORQUE =====
      tyre_torque_front_driver: toInt(formData.tyre_torque_front_driver),
      tyre_torque_front_passenger: toInt(formData.tyre_torque_front_passenger),
      tyre_torque_rear_outer_driver: toInt(formData.tyre_torque_rear_outer_driver),
      tyre_torque_rear_outer_passenger: toInt(formData.tyre_torque_rear_outer_passenger),

      // ===== DOCUMENTS =====
      vehicle_invoice_docs: formData.vehicle_invoice_docs || null,
      mot_check_docs: formData.mot_check_docs || null,
      pmi_inspection_docs: formData.pmi_inspection_docs || null,
      others_docs: formData.others_docs || null,
      tacho_calibration_docs: formData.tacho_calibration_docs || null,
      tax_docs: formData.tax_docs || null,
      loller_docs: formData.loller_docs || null,
      insurance_docs: formData.insurance_docs || null,
      service_records_docs: formData.service_records_docs || null,
      new_vehicle_checklist_docs: formData.new_vehicle_checklist_docs || null,
      logbook_docs: formData.logbook_docs || null,
      COIF_technical_docs: formData.COIF_technical_docs || null,
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

  const handleTaskDialogClose = () => {
    dispatch(setShowTaskDialog(false))
    dispatch(setTaskPrefillData(null))
  }

  const handleTaskCreated = () => {
    toast.success("Task created successfully", {
      description: "The task has been added to your task list.",
    })
    handleTaskDialogClose()
  }

  const ErrorMessage = ({ field }: { field: string }) => {
    if (!validationErrors[field]) return null
    return (
      <Alert variant="destructive" className="">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{validationErrors[field]}</AlertDescription>
      </Alert>
    )
  }

  const handleCreateTasksForAllMissing = () => {
    const missingDocs = getMissingDocuments()
    if (missingDocs.length > 0) {
      // Create task for the first missing document
      handleCreateTaskForDocument(missingDocs[0].field)
    }
  }

  const steps = [
    {
      label: "Vehicle Details",
      content: (
        <div className="w-full space-y-8">
          {/* First Row - Image Preview & Key Details */}
          <div className="grid gap-8 mb-8">
            {/* Left Column - Image Upload & Preview */}
            <div className="space-y-4">
              <Label
                htmlFor="vehicle_picture"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Vehicle Photo <span className="text-destructive">*</span>
              </Label>

              {/* Main Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Upload Section */}
                <div className="flex flex-col gap-4">
                  <DocumentUploadWithTask
                    field="vehicle_picture"
                    label=""
                    icon={ImageIcon}
                    value={formData.vehicle_picture}
                    onUploadSuccess={handleFileUploadSuccess("vehicle_picture")}
                    error={validationErrors.vehicle_picture}
                    required
                    onTaskCreate={() => handleCreateTaskForDocument("vehicle_picture")}
                    description="Upload clear photos from multiple angles"
                  />
                  <ErrorMessage field="vehicle_picture" />
                </div>

                {/* Preview Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Preview</Label>

                  {formData.vehicle_picture ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-modern">
                      {typeof formData.vehicle_picture === "string" ? (
                        <img
                          src={formData.vehicle_picture || "/placeholder.svg"}
                          alt="Vehicle preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              {(formData.vehicle_picture as File).name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {((formData.vehicle_picture as File).size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 shadow-lg"
                        onClick={() => dispatch(setFormData({ vehicle_picture: "" }))}
                      >
                        <LucideX className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 backdrop-blur-sm flex items-center justify-center shadow-inner">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No image uploaded</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload will appear here</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Recommended: High-quality images showing front, back, and sides
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Key Vehicle Information */}
            <div className="space-y-6 p-8 rounded-2xl bg-card/60 backdrop-blur-md">
              {/* Make & Model - First Row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Make */}
                <div className="space-y-3">
                  <Label htmlFor="make" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Make <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="make"
                      name="make"
                      placeholder="e.g., Mercedes"
                      value={formData.make}
                      onChange={handleInputChange}
                      className={cn(
                        "pl-11 h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md",
                        validationErrors.make && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <ErrorMessage field="make" />
                </div>

                {/* Model */}
                <div className="space-y-3">
                  <Label
                    htmlFor="model"
                    className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
                  >
                    Model <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Settings className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="model"
                      name="model"
                      placeholder="e.g., Sprinter"
                      value={formData.model}
                      onChange={handleInputChange}
                      className={cn(
                        "pl-11 h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md",
                        validationErrors.model && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <ErrorMessage field="model" />
                </div>
              </div>

              {/* Registration & VIN - Second Row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Registration Number */}
                <div className="space-y-3">
                  <Label
                    htmlFor="registration_number"
                    className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
                  >
                    Registration Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="registration_number"
                      name="registration_number"
                      placeholder="e.g., AB12 CDE"
                      value={formData.registration_number}
                      onChange={handleInputChange}
                      className={cn(
                        "pl-11 h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md",
                        validationErrors.registration_number && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <ErrorMessage field="registration_number" />
                </div>

                {/* VIN Number */}
                <div className="space-y-3">
                  <Label htmlFor="vin" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    VIN Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="vin"
                      name="vin"
                      placeholder="e.g., VF3ABC12345678901"
                      value={formData.vin}
                      onChange={handleInputChange}
                      className={cn(
                        "pl-11 h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md",
                        validationErrors.vin && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <ErrorMessage field="vin" />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                {/* Roadworthy Status */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Roadworthy Status
                  </Label>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 p-4 bg-background/40 shadow-inner hover:shadow-md transition-all duration-300">
                    <Label
                      htmlFor="is_roadworthy"
                      className="flex items-center gap-3 text-sm font-medium cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Is Roadworthy
                    </Label>
                    <Switch
                      id="is_roadworthy"
                      checked={formData.is_roadworthy}
                      onCheckedChange={(checked) => dispatch(setFormData({ is_roadworthy: checked }))}
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Vehicle Status
                  </Label>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 p-4 bg-background/40 shadow-inner hover:shadow-md transition-all duration-300">
                    <Label htmlFor="is_active" className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                      <Activity className="h-4 w-4 text-primary" />
                      Is Active
                    </Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => dispatch(setFormData({ is_active: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of the form - 3 Columns Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Vehicle Type - From API */}
            <div className="space-y-3">
              <Label
                htmlFor="vehicles_type"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Vehicle Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.vehicles_type.toString()}
                onValueChange={(value) => handleSelectChange("vehicles_type", value)}
                disabled={vehicleTypesLoading}
              >
                <SelectTrigger
                  className={cn(
                    "w-full h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300",
                    validationErrors.vehicles_type && "border-destructive",
                  )}
                >
                  <SelectValue placeholder={vehicleTypesLoading ? "Loading vehicle types..." : "Select vehicle type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" disabled>
                    Select vehicle type
                  </SelectItem>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4" />
                        <span>{type.name}</span>
                        {type.description && (
                          <span className="text-xs text-muted-foreground ml-1">({type.description})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorMessage field="vehicles_type" />
              {vehicleTypesLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading vehicle types...
                </div>
              )}
              {vehicleTypes.length === 0 && !vehicleTypesLoading && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Failed to load vehicle types. Please refresh the page.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Number of Seats */}
            <div className="space-y-3">
              <Label
                htmlFor="number_of_seats"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Number of Seats
              </Label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="number_of_seats"
                  name="number_of_seats"
                  type="number"
                  min="1"
                  placeholder="e.g., 16"
                  value={formData.number_of_seats || ""}
                  onChange={handleNumberInputChange}
                  className="pl-11 h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md"
                />
              </div>
            </div>

            {/* Last Mileage */}
            <div className="space-y-3">
              <Label
                htmlFor="last_mileage"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Last Mileage <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="last_mileage"
                    name="last_mileage"
                    placeholder="e.g., 50000"
                    value={formData.last_mileage}
                    onChange={handleInputChange}
                    className={cn(
                      "pl-11 h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md",
                      validationErrors.last_mileage && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </div>
                <Select
                  value={formData.mileage_unit}
                  onValueChange={(value) => handleSelectChange("mileage_unit", value)}
                >
                  <SelectTrigger className="w-32 h-12 rounded-xl shadow-inner bg-background/60 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kms">KMS</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ErrorMessage field="last_mileage" />
            </div>

            {/* Vehicle Status */}
            <div className="space-y-3">
              <Label
                htmlFor="vehicle_status"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Vehicle Status
              </Label>
              <Select
                value={formData.vehicle_status}
                onValueChange={(value) => handleSelectChange("vehicle_status", value)}
              >
                <SelectTrigger className="w-full h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    <span className="px-2 py-1 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Available</span>
                  </SelectItem>
                  <SelectItem value="unavailable">
                    <span className="px-2 py-1 rounded border bg-slate-100 text-slate-700 border-slate-200">Unavailable</span>
                  </SelectItem>
                  <SelectItem value="assigned">
                    <span className="px-2 py-1 rounded border bg-orange-50 text-orange-700 border-orange-200">Assigned</span>
                  </SelectItem>
                  <SelectItem value="disabled">
                    <span className="px-2 py-1 rounded border bg-gray-100 text-gray-700 border-gray-200">Disabled</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Roadworthy Status */}
            <div className="space-y-3">
              <Label
                htmlFor="vehicle_roadworthy_status"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Roadworthy Status
              </Label>
              <Select
                value={formData.vehicle_roadworthy_status}
                onValueChange={(value) => handleSelectChange("vehicle_roadworthy_status", value)}
              >
                <SelectTrigger className="w-full h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_defect">No Defect</SelectItem>
                  <SelectItem value="minor_defect_roadworthy">Minor Defect (Roadworthy)</SelectItem>
                  <SelectItem value="minor_defect_not_roadworthy">Minor Defect (Not Roadworthy)</SelectItem>
                  <SelectItem value="major_defect_not_roadworthy">Major Defect (Not Roadworthy)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Walkaround Count */}
            <div className="space-y-3">
              <Label
                htmlFor="walkaround_count"
                className="text-sm font-semibold tracking-wide uppercase text-muted-foreground"
              >
                Walkaround Count
              </Label>
              <Input
                id="walkaround_count"
                name="walkaround_count"
                type="number"
                min="0"
                placeholder="e.g., 12"
                value={formData.walkaround_count || ""}
                onChange={handleNumberInputChange}
                className="h-12 rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md"
              />
            </div>
          </div>

          {/* Allocated Sites */}
          <div className="space-y-4 mt-8">
            <Label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Allocated Site(s) <span className="text-destructive">*</span>
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
          <div className="space-y-3 mt-8">
            <Label htmlFor="notes" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Enter any additional notes about the vehicle..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="rounded-xl shadow-inner bg-background/60 border-border/60 transition-all duration-300 focus:shadow-md resize-none"
            />
          </div>
        </div>
      ),
    },
    {
      label: "Vehicle Purchase Details",
      content: (
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">Purchase details for record keeping.</AlertDescription>
          </Alert>

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
                placeholder="e.g., Fleet Department"
                value={formData.purchased_by}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Purchase Price
              </Label>
              <Input
                id="price"
                name="price"
                placeholder="0"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  // Allow digits, decimal point, and backspace
                  if (!/[0-9.]/.test(e.key) && 
                      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                    e.preventDefault()
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="purchase_mileage" className="text-sm font-medium">
                Purchase Mileage <span className="text-red-500">*</span>
              </Label>
              <Input
                id="purchase_mileage"
                name="purchase_mileage"
                placeholder="e.g., 12000.50"
                value={formData.purchase_mileage}
                onChange={handleInputChange}
                className={cn(
                  validationErrors.purchase_mileage && "border-destructive",
                )}
              />
              {validationErrors.purchase_mileage && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.purchase_mileage}</p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-white">
              <Label htmlFor="has_vat" className="text-sm font-medium cursor-pointer">
                VAT Amount (Yes/No – If yes auto calculates 20% of price)
              </Label>
              <Switch
                id="has_vat"
                checked={formData.has_vat}
                onCheckedChange={(checked) => {
                  const updated = { ...formData, has_vat: checked }
                  if (checked) {
                    const p = Number.parseFloat(formData.price) || 0
                    updated.vat_amount = (p * 0.2).toFixed(2)
                  } else {
                    updated.vat_amount = ""
                  }
                  dispatch(setFormData(updated))
                }}
              />
            </div>

            {formData.has_vat && (
              <div>
                <Label htmlFor="vat_amount" className="text-sm font-medium">
                  VAT Amount (Auto calculates 20% of price)
                </Label>
                <Input id="vat_amount" name="vat_amount" value={formData.vat_amount} readOnly disabled />
              </div>
            )}

            <div>
              <Label htmlFor="total_price" className="text-sm font-medium">
                Total Price – (Purchased price plus VAT amount)
              </Label>
              {(() => {
                const priceNum = parseFloat(formData.price || "0") || 0
                const vatNum = parseFloat(formData.vat_amount || "0") || 0
                const total = (priceNum + vatNum).toFixed(2)

                return (
                  <Input
                    id="total_price"
                    value={`£${total}`}
                    readOnly
                    disabled
                    className="font-bold text-lg bg-green-50 border-green-300"
                  />
                )
              })()}
            </div>
          </div>

          {/* Document Upload for Purchase Invoice */}
          <div className="mt-6">
            <DocumentUploadWithTask
              field="vehicle_invoice_docs"
              label="Vehicle/Purchase Invoice"
              icon={FileText}
              value={formData.vehicle_invoice_docs}
              onUploadSuccess={handleFileUploadSuccess("vehicle_invoice_docs")}
              error={validationErrors.vehicle_invoice_docs}
              required={true}
              onTaskCreate={() => handleCreateTaskForDocument("vehicle_invoice_docs")}
              description="Mandatory to attach a picture/file"
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
              <strong>All documents are required.</strong> You cannot proceed to the next step until all documents are
              uploaded.
            </AlertDescription>
          </Alert>

          {!areAllDocumentsUploaded() && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing Documents:</strong> Please upload all required documents to proceed.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-5">
            <DocumentUploadWithTask
              field="logbook_docs"
              label="Logbook"
              icon={BookOpen}
              value={formData.logbook_docs}
              onUploadSuccess={handleFileUploadSuccess("logbook_docs")}
              error={validationErrors.logbook_docs}
              required={true}
              onTaskCreate={() => handleCreateTaskForDocument("logbook_docs")}
              description="Mandatory to attach a picture/file"
            />

            <DocumentUploadWithTask
              field="COIF_technical_docs"
              label="COIF"
              icon={FileText}
              value={formData.COIF_technical_docs}
              onUploadSuccess={handleFileUploadSuccess("COIF_technical_docs")}
              error={validationErrors.COIF_technical_docs}
              required={true}
              onTaskCreate={() => handleCreateTaskForDocument("COIF_technical_docs")}
              description="Mandatory to attach a picture/file"
            />

            <DocumentUploadWithTask
              field="service_records_docs"
              label="Service Documents"
              icon={FileText}
              value={formData.service_records_docs}
              onUploadSuccess={handleFileUploadSuccess("service_records_docs")}
              error={validationErrors.service_records_docs}
              required={true}
              onTaskCreate={() => handleCreateTaskForDocument("service_records_docs")}
              description="Mandatory to attach a picture/file"
            />

            <DocumentUploadWithTask
              field="new_vehicle_checklist_docs"
              label="Vehicle Delivery Checklist"
              icon={FileCheck}
              value={formData.new_vehicle_checklist_docs}
              onUploadSuccess={handleFileUploadSuccess("new_vehicle_checklist_docs")}
              error={validationErrors.new_vehicle_checklist_docs}
              required={true}
              onTaskCreate={() => handleCreateTaskForDocument("new_vehicle_checklist_docs")}
              description="Mandatory to attach a picture/file"
            />

            <DocumentUploadWithTask
              field="others_docs"
              label="Other Documents"
              icon={FileText}
              value={formData.others_docs}
              onUploadSuccess={handleFileUploadSuccess("others_docs")}
              error={validationErrors.others_docs}
              required={true}
              onTaskCreate={() => handleCreateTaskForDocument("others_docs")}
              description="Mandatory to attach a picture/file"
            />
          </div>

          {/* Create task button for missing documents */}
          {!areAllDocumentsUploaded() && (
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateTasksForAllMissing}
                className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 bg-transparent"
              >
                <Clock className="h-4 w-4 mr-2" />
                Create Tasks for Missing Documents
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Vehicle Compliance Documents & Expiry Dates",
      content: (
        <div className="space-y-6">
          <Alert
            className={cn(
              "border-2",
              areDateDocumentsUploaded() ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200",
            )}
          >
            <AlertCircle className={cn("h-4 w-4", areDateDocumentsUploaded() ? "text-green-600" : "text-amber-600")} />
            <AlertDescription className={areDateDocumentsUploaded() ? "text-green-900" : "text-amber-900"}>
              <strong>Important:</strong> Document upload is mandatory for each date entered. You cannot proceed until
              all documents are uploaded.
            </AlertDescription>
          </Alert>

          {!areDateDocumentsUploaded() && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing Documents:</strong> You must upload documents for all entered dates to proceed.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MOT Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">MOT Details</h4>
              
              <div>
                <Label htmlFor="mot_expiry" className="text-sm font-medium">
                  MOT Expiry Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mot_expiry"
                  name="mot_expiry"
                  type="date"
                  value={formData.mot_expiry}
                  onChange={handleDateChange}
                  className={cn(
                    validationErrors.mot_expiry && "border-destructive",
                  )}
                />
                {validationErrors.mot_expiry && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.mot_expiry}</p>
                )}
              </div>

              <div>
                <Label htmlFor="mot_booked_date" className="text-sm font-medium">
                  MOT Booked Date
                </Label>
                <Input
                  id="mot_booked_date"
                  name="mot_booked_date"
                  type="date"
                  value={formData.mot_booked_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="mot_booked_time" className="text-sm font-medium">
                  MOT Booked Time
                </Label>
                <Input
                  id="mot_booked_time"
                  name="mot_booked_time"
                  type="time"
                  value={formData.mot_booked_time}
                  onChange={handleTimeChange}
                />
              </div>

              <div>
                <Label htmlFor="next_mot_to_be_booked_from" className="text-sm font-medium">
                  Next MOT To Be Booked From
                </Label>
                <Input
                  id="next_mot_to_be_booked_from"
                  name="next_mot_to_be_booked_from"
                  type="date"
                  value={formData.next_mot_to_be_booked_from}
                  onChange={handleDateChange}
                />
              </div>

              <DocumentUploadWithTask
                field="mot_check_docs"
                label="MOT Certificate"
                icon={FileText}
                value={formData.mot_check_docs}
                onUploadSuccess={handleFileUploadSuccess("mot_check_docs")}
                error={validationErrors.mot_check_docs}
                required={!!formData.mot_expiry}
                onTaskCreate={() => handleCreateTaskForDocument("mot_check_docs")}
                description="Required when MOT expiry date is set"
              />
            </div>

            {/* Insurance Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">Insurance Details</h4>
              
              <div>
                <Label htmlFor="insurance_expiry" className="text-sm font-medium">
                  Insurance Expiry Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="insurance_expiry"
                  name="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={handleDateChange}
                  className={cn(
                    validationErrors.insurance_expiry && "border-destructive",
                  )}
                />
                {validationErrors.insurance_expiry && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.insurance_expiry}</p>
                )}
              </div>

              <DocumentUploadWithTask
                field="insurance_docs"
                label="Insurance Certificate"
                icon={FileText}
                value={formData.insurance_docs}
                onUploadSuccess={handleFileUploadSuccess("insurance_docs")}
                error={validationErrors.insurance_docs}
                required={!!formData.insurance_expiry}
                onTaskCreate={() => handleCreateTaskForDocument("insurance_docs")}
                description="Required when insurance expiry date is set"
              />
            </div>

            {/* Tax Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">Tax Details</h4>
              
              <div>
                <Label htmlFor="tax_expiry" className="text-sm font-medium">
                  Tax Expiry Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tax_expiry"
                  name="tax_expiry"
                  type="date"
                  value={formData.tax_expiry}
                  onChange={handleDateChange}
                  className={cn(
                    validationErrors.tax_expiry && "border-destructive",
                  )}
                />
                {validationErrors.tax_expiry && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.tax_expiry}</p>
                )}
              </div>

              <DocumentUploadWithTask
                field="tax_docs"
                label="Tax Document"
                icon={FileText}
                value={formData.tax_docs}
                onUploadSuccess={handleFileUploadSuccess("tax_docs")}
                error={validationErrors.tax_docs}
                required={!!formData.tax_expiry}
                onTaskCreate={() => handleCreateTaskForDocument("tax_docs")}
                description="Required when tax expiry date is set"
              />
            </div>

            {/* PMI Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">PMI Details</h4>
              
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
                <Label htmlFor="pmi_expiry_date" className="text-sm font-medium">
                  PMI Expiry Date
                </Label>
                <Input
                  id="pmi_expiry_date"
                  name="pmi_expiry_date"
                  type="date"
                  value={formData.pmi_expiry_date}
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
                <Label htmlFor="book_next_pmi_from" className="text-sm font-medium">
                  Book Next PMI From
                </Label>
                <Input
                  id="book_next_pmi_from"
                  name="book_next_pmi_from"
                  type="date"
                  value={formData.book_next_pmi_from}
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

              <DocumentUploadWithTask
                field="pmi_inspection_docs"
                label="PMI Inspection Report"
                icon={FileText}
                value={formData.pmi_inspection_docs}
                onUploadSuccess={handleFileUploadSuccess("pmi_inspection_docs")}
                error={validationErrors.pmi_inspection_docs}
                required={!!formData.last_pmi_date || !!formData.pmi_expiry_date}
                onTaskCreate={() => handleCreateTaskForDocument("pmi_inspection_docs")}
                description="Required when PMI dates are set"
              />
            </div>

            {/* Tachograph Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">Tachograph Details</h4>
              
              <div className="flex items-center justify-between p-3 bg-white border rounded">
                <Label htmlFor="is_tacho_fitted" className="text-sm font-medium cursor-pointer">
                  Tacho Fitted
                </Label>
                <Switch
                  id="is_tacho_fitted"
                  checked={formData.is_tacho_fitted}
                  onCheckedChange={(checked) => dispatch(setFormData({ is_tacho_fitted: checked }))}
                />
              </div>

              {formData.is_tacho_fitted && (
                <>
                  <div>
                    <Label htmlFor="tacho_calibration_expiry" className="text-sm font-medium">
                      Tacho Calibration Expiry
                    </Label>
                    <Input
                      id="tacho_calibration_expiry"
                      name="tacho_calibration_expiry"
                      type="date"
                      value={formData.tacho_calibration_expiry}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="next_techo_calibration_book_date" className="text-sm font-medium">
                      Next Tacho Calibration Book Date
                    </Label>
                    <Input
                      id="next_techo_calibration_book_date"
                      name="next_techo_calibration_book_date"
                      type="date"
                      value={formData.next_techo_calibration_book_date}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="last_tacho_download_date" className="text-sm font-medium">
                      Last Tacho Download Date
                    </Label>
                    <Input
                      id="last_tacho_download_date"
                      name="last_tacho_download_date"
                      type="date"
                      value={formData.last_tacho_download_date}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="next_tacho_download_date" className="text-sm font-medium">
                      Next Tacho Download Date
                    </Label>
                    <Input
                      id="next_tacho_download_date"
                      name="next_tacho_download_date"
                      type="date"
                      value={formData.next_tacho_download_date}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tacho_notes" className="text-sm font-medium">
                      Tacho Notes
                    </Label>
                    <Textarea
                      id="tacho_notes"
                      name="tacho_notes"
                      placeholder="Enter tachograph notes..."
                      value={formData.tacho_notes}
                      onChange={handleInputChange}
                      rows={2}
                    />
                  </div>

                  <DocumentUploadWithTask
                    field="tacho_calibration_docs"
                    label="Tacho Calibration Certificate"
                    icon={FileText}
                    value={formData.tacho_calibration_docs}
                    onUploadSuccess={handleFileUploadSuccess("tacho_calibration_docs")}
                    error={validationErrors.tacho_calibration_docs}
                    required={!!formData.tacho_calibration_expiry}
                    onTaskCreate={() => handleCreateTaskForDocument("tacho_calibration_docs")}
                    description="Required when tacho calibration expiry is set"
                  />
                </>
              )}
            </div>

            {/* LOLER Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">LOLER Details</h4>
              
              <div className="flex items-center justify-between p-3 bg-white border rounded">
                <Label htmlFor="is_wheelchair_lift_fitted" className="text-sm font-medium cursor-pointer">
                  Wheelchair Lift Fitted (LOLER)
                </Label>
                <Switch
                  id="is_wheelchair_lift_fitted"
                  checked={formData.is_wheelchair_lift_fitted}
                  onCheckedChange={(checked) => dispatch(setFormData({ is_wheelchair_lift_fitted: checked }))}
                />
              </div>

              {formData.is_wheelchair_lift_fitted && (
                <>
                  <div>
                    <Label htmlFor="loller_test_expiry_date" className="text-sm font-medium">
                      LOLER Test Expiry Date
                    </Label>
                    <Input
                      id="loller_test_expiry_date"
                      name="loller_test_expiry_date"
                      type="date"
                      value={formData.loller_test_expiry_date}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="next_loller_test_date" className="text-sm font-medium">
                      Next LOLER Test Date
                    </Label>
                    <Input
                      id="next_loller_test_date"
                      name="next_loller_test_date"
                      type="date"
                      value={formData.next_loller_test_date}
                      onChange={handleDateChange}
                    />
                  </div>

                  <DocumentUploadWithTask
                    field="loller_docs"
                    label="LOLER Calibration Certificate"
                    icon={FileText}
                    value={formData.loller_docs}
                    onUploadSuccess={handleFileUploadSuccess("loller_docs")}
                    error={validationErrors.loller_docs}
                    required={!!formData.loller_test_expiry_date}
                    onTaskCreate={() => handleCreateTaskForDocument("loller_docs")}
                    description="Required when LOLER test expiry is set"
                  />
                </>
              )}
            </div>

            {/* Other Checks */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold text-lg">Other Checks</h4>
              
              <div>
                <Label htmlFor="next_tyre_maintenance_check_date" className="text-sm font-medium">
                  Next Tyre Maintenance Check Date
                </Label>
                <Input
                  id="next_tyre_maintenance_check_date"
                  name="next_tyre_maintenance_check_date"
                  type="date"
                  value={formData.next_tyre_maintenance_check_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="last_valet_check_date" className="text-sm font-medium">
                  Last Valet Check Date
                </Label>
                <Input
                  id="last_valet_check_date"
                  name="last_valet_check_date"
                  type="date"
                  value={formData.last_valet_check_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="next_valet_check_date" className="text-sm font-medium">
                  Next Valet Check Date
                </Label>
                <Input
                  id="next_valet_check_date"
                  name="next_valet_check_date"
                  type="date"
                  value={formData.next_valet_check_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="last_equipment_check_date" className="text-sm font-medium">
                  Last Equipment Check Date
                </Label>
                <Input
                  id="last_equipment_check_date"
                  name="last_equipment_check_date"
                  type="date"
                  value={formData.last_equipment_check_date}
                  onChange={handleDateChange}
                />
              </div>

              <div>
                <Label htmlFor="next_equipment_check_date" className="text-sm font-medium">
                  Next Equipment Check Date
                </Label>
                <Input
                  id="next_equipment_check_date"
                  name="next_equipment_check_date"
                  type="date"
                  value={formData.next_equipment_check_date}
                  onChange={handleDateChange}
                />
              </div>
            </div>
          </div>

          {/* Create task button for missing documents */}
          {!areDateDocumentsUploaded() && (
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateTasksForAllMissing}
                className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 bg-transparent"
              >
                <Clock className="h-4 w-4 mr-2" />
                Create Tasks for Missing Date Documents
              </Button>
            </div>
          )}
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
              Expiry format: WWYY (e.g., 0124 for week 1 of 2024). Depth ≥1.6mm or &quot;NV&quot; for Null Value, Front Pressure
              65–68 PSI, Rear Pressure 56–58 PSI, Torque 200–210 Nm.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-6">
            {/* Front Driver */}
            <div className="flex justify-between gap-4">
              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-blue-50 to-white flex-1">
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
              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-green-50 to-white flex-1">
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

            {/* Rear Outer Driver & Passenger */}
            <div className="flex justify-between gap-4">
              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-purple-50 to-white flex-1">
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

              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-red-50 to-white flex-1">
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
                </div>
              </div>

              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-yellow-50 to-white flex-1">
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
                </div>
              </div>

              <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-orange-50 to-white flex-1">
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
                  <span className="text-muted-foreground">Last Mileage:</span>
                  <span className="font-medium">
                    {formData.last_mileage || "0"} {formData.mileage_unit}
                  </span>
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
                  <span className="font-medium">{formData.date_of_purchase || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{formData.price ? `£${formData.price}` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Mileage:</span>
                  <span className="font-medium">{formData.purchase_mileage || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT:</span>
                  <span className="font-medium">
                    {formData.has_vat ? (formData.vat_amount ? `£${formData.vat_amount}` : "Yes") : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price:</span>
                  <span className="font-medium">
                    £
                    {(Number.parseFloat(formData.price || "0") + Number.parseFloat(formData.vat_amount || "0")).toFixed(
                      2,
                    )}
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
                  <span className="font-medium">{formData.mot_expiry || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance:</span>
                  <span className="font-medium">{formData.insurance_expiry || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">{formData.tax_expiry || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last PMI:</span>
                  <span className="font-medium">{formData.last_pmi_date || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PMI Expiry:</span>
                  <span className="font-medium">{formData.pmi_expiry_date || "N/A"}</span>
                </div>
                {formData.is_tacho_fitted && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tacho Calibration:</span>
                      <span className="font-medium">{formData.tacho_calibration_expiry || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Tacho Download:</span>
                      <span className="font-medium">{formData.last_tacho_download_date || "N/A"}</span>
                    </div>
                  </>
                )}
                {formData.is_wheelchair_lift_fitted && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LOLER Test Expiry:</span>
                    <span className="font-medium">{formData.loller_test_expiry_date || "N/A"}</span>
                  </div>
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
                    {formData.tyre_depth_front_driver
                      ? formData.tyre_depth_front_driver.toUpperCase() === "NV"
                        ? "NV"
                        : `${formData.tyre_depth_front_driver}mm`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Pass:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_front_passenger
                      ? formData.tyre_depth_front_passenger.toUpperCase() === "NV"
                        ? "NV"
                        : `${formData.tyre_depth_front_passenger}mm`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Outer Driver:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_outer_driver
                      ? formData.tyre_depth_rear_outer_driver.toUpperCase() === "NV"
                        ? "NV"
                        : `${formData.tyre_depth_rear_outer_driver}mm`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Outer Pass:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_outer_passenger
                      ? formData.tyre_depth_rear_outer_passenger.toUpperCase() === "NV"
                        ? "NV"
                        : `${formData.tyre_depth_rear_outer_passenger}mm`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Inner Driver:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_inner_driver
                      ? formData.tyre_depth_rear_inner_driver.toUpperCase() === "NV"
                        ? "NV"
                        : `${formData.tyre_depth_rear_inner_driver}mm`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Inner Pass:</span>
                  <span className="font-medium">
                    {formData.tyre_depth_rear_inner_passenger
                      ? formData.tyre_depth_rear_inner_passenger.toUpperCase() === "NV"
                        ? "NV"
                        : `${formData.tyre_depth_rear_inner_passenger}mm`
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <p className="text-sm text-muted-foreground">Click &quot;Create Vehicle&quot; button below to submit the form</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-8">
        <form onSubmit={(e) => e.preventDefault()}>
          <StepperTabs labels={steps.map((step) => step.label)} />
          <StepperContent>
            {steps.map((step, index) => (
              <div key={index} className="space-y-8">
                <Card className="border border-border/50 shadow-modern bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/30 backdrop-blur-sm p-8">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3 text-balance">
                      {step.label}
                      {currentStep === 0 && (
                        <Badge variant="destructive" className="shadow-sm">
                          Required Fields
                        </Badge>
                      )}
                      {currentStep === 2 && (
                        <Badge variant="destructive" className="shadow-sm">
                          All Documents Required
                        </Badge>
                      )}
                      {currentStep === 3 && (
                        <Badge variant="destructive" className="shadow-sm">
                          Documents Required for Dates
                        </Badge>
                      )}
                      {currentStep === 4 && (
                        <Badge variant="destructive" className="shadow-sm">
                          All Tyre Fields Required
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed mt-2">
                      {index === 0 &&
                        "Enter vehicle information including vehicle photo, make, model, registration, type, seats, VIN, last mileage, status, and allocated sites."}
                      {index === 1 &&
                        "Record purchase details including date, purchased from, price, purchase mileage, VAT, and total price."}
                      {index === 2 &&
                        "Upload all mandatory documents: Logbook, COIF, Service Documents, Vehicle Delivery Checklist, and Other Documents."}
                      {index === 3 && "Track compliance dates with mandatory document uploads for each date entered."}
                      {index === 4 && "Complete all tyre checks (6 tyres) with required safety metrics."}
                      {index === 5 && "Review all information and submit the vehicle registration."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">{step.content}</CardContent>
                </Card>
              </div>
            ))}
          </StepperContent>
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-card/80 backdrop-blur-xl border-t border-border/50 px-8 py-5 flex justify-between gap-4 shadow-modern rounded-t-2xl mt-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => goToPreviousStep()}
                disabled={submitLoading || currentStep === 0}
                size="lg"
                className="h-12 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
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
                className="h-12 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                Step {currentStep + 1} of {steps.length}
              </div>
              {currentStep === steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  size="lg"
                  className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/95 shadow-[0_10px_20px_-5px_oklch(var(--primary)/0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 font-semibold rounded-xl"
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
                    // STRICT VALIDATION: Check document requirements before allowing next step
                    if (currentStep === 2 && !areAllDocumentsUploaded()) {
                      toast.error("Cannot proceed", {
                        description: "All required documents must be uploaded before proceeding.",
                      })
                      return
                    }

                    if (currentStep === 3 && !areDateDocumentsUploaded()) {
                      toast.error("Cannot proceed", {
                        description: "Documents must be uploaded for all entered dates before proceeding.",
                      })
                      return
                    }

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
                  className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/95 shadow-[0_10px_20px_-5px_oklch(var(--primary)/0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 font-semibold rounded-xl"
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Task Creation Dialog */}
      <CreateTaskDialog
        isOpen={showTaskDialog}
        onClose={handleTaskDialogClose}
        onTaskCreated={handleTaskCreated}
        prefill={taskPrefillData}
      />
    </TooltipProvider>
  )
}

export default function AddVehicleStepperWrapper() {
  const steps = [
    { label: "Vehicle Details" },
    { label: "Vehicle Purchase Details" },
    { label: "Vehicle Documents" },
    { label: "Vehicle Compliance Documents & Expiry Dates" },
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
