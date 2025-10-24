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
import { Loader2, Car, AlertCircle, CheckCircle2 } from "lucide-react"
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

interface VehicleFormData {
  registration_number: string
  make: string
  model: string
  vehicles_type: number
  number_of_seats: number | null
  current_mileage: number | null
  mileage_unit: "kms" | "miles"
  tacho_fitted: boolean
  wheelchair_lift_fitted: boolean
  vehicle_picture: string
  new_checklist: string
  logbook: string
  coif_technical: string
  site_allocated_ids: number[]
  date_of_purchase: Date | null
  purchased_from: string
  purchased_by: string
  price: number | null
  has_vat: boolean
  vat_amount: number | null
  vehicle_invoice: string
  notes: string
  last_pmi_date: Date | null
  pmi_upload: string
  pmi_inspection_cycle: number | null
  mot_expiry: Date | null
  mot_upload: string
  insurance_expiry: Date | null
  insurance_upload: string
  tax_expiry: Date | null
  tax_upload: string
  tacho_calibration_expiry: Date | null
  tacho_calibration_upload: string
  last_tacho_download: Date | null
  tacho_download_upload: string
  loller_calibration_expiry: Date | null
  loller_upload: string
  tyre_expiry_front_driver: string
  tyre_expiry_front_passenger: string
  tyre_expiry_rear_outer_driver: string
  tyre_expiry_rear_outer_passenger: string
  tyre_depth_front_driver: number | null
  tyre_depth_front_passenger: number | null
  tyre_depth_rear_outer_driver: number | null
  tyre_depth_rear_outer_passenger: number | null
  tyre_pressure_front_driver: number | null
  tyre_pressure_front_passenger: number | null
  tyre_pressure_rear_outer_driver: number | null
  tyre_pressure_rear_outer_passenger: number | null
  tyre_torque_front_driver: number | null
  tyre_torque_front_passenger: number | null
  tyre_torque_rear_outer_driver: number | null
  tyre_torque_rear_outer_passenger: number | null
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

const initialState: VehicleState = {
  formData: {
    registration_number: "",
    make: "",
    model: "",
    vehicles_type: 0,
    number_of_seats: null,
    current_mileage: null,
    mileage_unit: "miles",
    tacho_fitted: false,
    wheelchair_lift_fitted: false,
    vehicle_picture: "",
    new_checklist: "",
    logbook: "",
    coif_technical: "",
    site_allocated_ids: [],
    date_of_purchase: null,
    purchased_from: "",
    purchased_by: "",
    price: null,
    has_vat: false,
    vat_amount: null,
    vehicle_invoice: "",
    notes: "",
    last_pmi_date: null,
    pmi_upload: "",
    pmi_inspection_cycle: null,
    mot_expiry: null,
    mot_upload: "",
    insurance_expiry: null,
    insurance_upload: "",
    tax_expiry: null,
    tax_upload: "",
    tacho_calibration_expiry: null,
    tacho_calibration_upload: "",
    last_tacho_download: null,
    tacho_download_upload: "",
    loller_calibration_expiry: null,
    loller_upload: "",
    tyre_expiry_front_driver: "",
    tyre_expiry_front_passenger: "",
    tyre_expiry_rear_outer_driver: "",
    tyre_expiry_rear_outer_passenger: "",
    tyre_depth_front_driver: null,
    tyre_depth_front_passenger: null,
    tyre_depth_rear_outer_driver: null,
    tyre_depth_rear_outer_passenger: null,
    tyre_pressure_front_driver: null,
    tyre_pressure_front_passenger: null,
    tyre_pressure_rear_outer_driver: null,
    tyre_pressure_rear_outer_passenger: null,
    tyre_torque_front_driver: null,
    tyre_torque_front_passenger: null,
    tyre_torque_rear_outer_driver: null,
    tyre_torque_rear_outer_passenger: null,
  },
  sites: [],
  vehicleTypes: [],
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
  if (value === null || value === 0 || isNaN(value)) {
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

const validateTyreDepth = (value: number | null, fieldName: string): string | null => {
  const error = validatePositiveNumber(value, fieldName)
  if (error) return error
  if (value !== null && value < 1.6) {
    return `${fieldName} must be at least 1.6 mm`
  }
  return null
}

const validateTyrePressure = (value: number | null, fieldName: string): string | null => {
  const error = validatePositiveNumber(value, fieldName)
  if (error) return error
  if (value !== null && (value < 30 || value > 35)) {
    return `${fieldName} must be between 30-35 PSI`
  }
  return null
}

const validateTyreTorque = (value: number | null, fieldName: string): string | null => {
  const error = validatePositiveNumber(value, fieldName)
  if (error) return error
  if (value !== null && (value < 110 || value > 130)) {
    return `${fieldName} must be between 110-130 Nm`
  }
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

// Vehicle form component
function AddVehicleStepperForm() {
  const dispatch = useDispatch<AppDispatch>()
  const { formData, sites, vehicleTypes, sitesLoading, vehicleTypesLoading, submitLoading, validationErrors } =
    useSelector((state: RootState) => state.vehicle)
  const cookies = useCookies()

  const { currentStep, goToNextStep, goToPreviousStep } = useStepper()

  const handleFileUploadSuccess = (field: keyof VehicleFormData) => (url: string) => {
    dispatch(setFormData({ [field]: url }))
    if (validationErrors[`${field}`]) {
      dispatch(clearValidationError(`${field}`))
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
          dispatch(setVehicleTypes(data.data))
        } else {
          toast.error("Failed to load vehicle types.")
        }
      } catch (error) {
        console.error("Error fetching vehicle types:", error)
        toast.error("An error occurred while fetching vehicle types.")
      } finally {
        dispatch(setVehicleTypesLoading(false))
      }
    }

    fetchSites()
    fetchVehicleTypes()
  }, [cookies, dispatch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value
    dispatch(setFormData({ [name]: newValue }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value ? new Date(value) : null }))
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

  const handleMultiSelectChange = (name: string, values: number[]) => {
    dispatch(setFormData({ [name]: values }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {}

    if (currentStep === 0) {
      const regError = validateRegistrationNumber(formData.registration_number)
      if (regError) errors.registration_number = regError

      const makeError = validateRequiredString(formData.make, "Make")
      if (makeError) errors.make = makeError

      const modelError = validateRequiredString(formData.model, "Model")
      if (modelError) errors.model = modelError

      const typeError = validateRequiredNumber(formData.vehicles_type, "Vehicle Type")
      if (typeError) errors.vehicles_type = typeError

      const sitesError = validateRequiredArray(formData.site_allocated_ids, "Allocated Site(s)")
      if (sitesError) errors.site_allocated_ids = sitesError
    }

    if (currentStep === 3) {
      const tyreExpiryFields = [
        "tyre_expiry_front_driver",
        "tyre_expiry_front_passenger",
        "tyre_expiry_rear_outer_driver",
        "tyre_expiry_rear_outer_passenger",
      ]
      tyreExpiryFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as string
        const error = validateTyreExpiry(value)
        if (error) errors[field] = error
      })

      const tyreDepthFields = [
        "tyre_depth_front_driver",
        "tyre_depth_front_passenger",
        "tyre_depth_rear_outer_driver",
        "tyre_depth_rear_outer_passenger",
      ]
      tyreDepthFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as number | null
        const error = validateTyreDepth(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })

      const tyrePressureFields = [
        "tyre_pressure_front_driver",
        "tyre_pressure_front_passenger",
        "tyre_pressure_rear_outer_driver",
        "tyre_pressure_rear_outer_passenger",
      ]
      tyrePressureFields.forEach((field) => {
        const value = formData[field as keyof VehicleFormData] as number | null
        const error = validateTyrePressure(value, field.replace(/_/g, " "))
        if (error) errors[field] = error
      })

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
    const submitData = {
      ...formData,
      vehicle_type_id: formData.vehicles_type,
      wheelchair_lift_fitted: formData.wheelchair_lift_fitted ? "Yes" : "No",
      date_of_purchase: formData.date_of_purchase ? formData.date_of_purchase.toISOString().split("T")[0] : null,
      last_pmi_date: formData.last_pmi_date ? formData.last_pmi_date.toISOString().split("T")[0] : null,
      mot_expiry: formData.mot_expiry ? formData.mot_expiry.toISOString().split("T")[0] : null,
      insurance_expiry: formData.insurance_expiry ? formData.insurance_expiry.toISOString().split("T")[0] : null,
      tax_expiry: formData.tax_expiry ? formData.tax_expiry.toISOString().split("T")[0] : null,
      tacho_calibration_expiry: formData.tacho_calibration_expiry
        ? formData.tacho_calibration_expiry.toISOString().split("T")[0]
        : null,
      last_tacho_download: formData.last_tacho_download
        ? formData.last_tacho_download.toISOString().split("T")[0]
        : null,
      loller_calibration_expiry: formData.loller_calibration_expiry
        ? formData.loller_calibration_expiry.toISOString().split("T")[0]
        : null,
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
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              All fields marked with <span className="text-red-500 font-semibold">*</span> are required to proceed.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="registration_number" className="text-sm font-medium">
                Registration Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="registration_number"
                name="registration_number"
                placeholder="e.g., AB12 CDE"
                value={formData.registration_number}
                onChange={handleInputChange}
                className={cn("", validationErrors.registration_number && "border-red-500 focus-visible:ring-red-500")}
              />
              <ErrorMessage field="registration_number" />
            </div>

            <div>
              <Label htmlFor="make" className="text-sm font-medium">
                Make <span className="text-red-500">*</span>
              </Label>
              <Input
                id="make"
                name="make"
                placeholder="e.g., Ford"
                value={formData.make}
                onChange={handleInputChange}
                className={cn("", validationErrors.make && "border-red-500 focus-visible:ring-red-500")}
              />
              <ErrorMessage field="make" />
            </div>

            <div>
              <Label htmlFor="model" className="text-sm font-medium">
                Model <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                name="model"
                placeholder="e.g., Transit"
                value={formData.model}
                onChange={handleInputChange}
                className={cn("", validationErrors.model && "border-red-500 focus-visible:ring-red-500")}
              />
              <ErrorMessage field="model" />
            </div>

            <div>
              <Label htmlFor="vehicles_type" className="text-sm font-medium">
                Vehicle Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.vehicles_type.toString()}
                onValueChange={(value) => handleSelectChange("vehicles_type", value)}
              >
                <SelectTrigger className={cn("", validationErrors.vehicles_type && "border-red-500")}>
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
                      No vehicle types available
                    </SelectItem>
                  ) : (
                    vehicleTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <ErrorMessage field="vehicles_type" />
            </div>

            <div>
              <Label htmlFor="number_of_seats" className="text-sm font-medium">
                Number of Seats
              </Label>
              <Input
                id="number_of_seats"
                name="number_of_seats"
                type="number"
                placeholder="e.g., 16"
                value={formData.number_of_seats || ""}
                onChange={handleNumberInputChange}
                className=""
              />
            </div>

            <div>
              <Label htmlFor="current_mileage" className="text-sm font-medium">
                Current Mileage
              </Label>
              <div className="flex gap-2 ">
                <Input
                  id="current_mileage"
                  name="current_mileage"
                  type="number"
                  placeholder="e.g., 25000"
                  value={formData.current_mileage || ""}
                  onChange={handleNumberInputChange}
                  className="flex-1"
                />
                <Select
                  value={formData.mileage_unit}
                  onValueChange={(value) => handleSelectChange("mileage_unit", value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kms">KMS</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="tacho_fitted" className="text-sm font-medium cursor-pointer">
                Tacho Fitted
              </Label>
              <Switch
                id="tacho_fitted"
                checked={formData.tacho_fitted}
                onCheckedChange={(checked) => dispatch(setFormData({ tacho_fitted: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="wheelchair_lift_fitted" className="text-sm font-medium cursor-pointer">
                Wheelchair Lift Fitted
              </Label>
              <Switch
                id="wheelchair_lift_fitted"
                checked={formData.wheelchair_lift_fitted}
                onCheckedChange={(checked) => dispatch(setFormData({ wheelchair_lift_fitted: checked }))}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Vehicle Picture</Label>
              <div className="">
                <FileUploader onUploadSuccess={handleFileUploadSuccess("vehicle_picture")} />
              </div>
              {formData.vehicle_picture && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  File uploaded successfully
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">New Vehicle Checklist</Label>
              <div className="">
                <FileUploader onUploadSuccess={handleFileUploadSuccess("new_checklist")} />
              </div>
              {formData.new_checklist && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  File uploaded successfully
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Logbook</Label>
              <div className="">
                <FileUploader onUploadSuccess={handleFileUploadSuccess("logbook")} />
              </div>
              {formData.logbook && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  File uploaded successfully
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">COIF/Technical Data</Label>
              <div className="">
                <FileUploader onUploadSuccess={handleFileUploadSuccess("coif_technical")} />
              </div>
              {formData.coif_technical && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  File uploaded successfully
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Allocated Site(s) <span className="text-red-500">*</span>
            </Label>
            <div className="">
              <MultiSelect
                options={sites}
                selected={formData.site_allocated_ids}
                onChange={(values) => handleMultiSelectChange("site_allocated_ids", values)}
                placeholder="Select sites"
                error={!!validationErrors.site_allocated_ids}
              />
            </div>
            <ErrorMessage field="site_allocated_ids" />
          </div>
        </div>
      ),
    },
    {
      label: "Purchase Details",
      content: (
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Purchase details are optional but recommended for record keeping.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="date_of_purchase" className="text-sm font-medium">
                Date of Purchase
              </Label>
              <Input
                id="date_of_purchase"
                name="date_of_purchase"
                type="date"
                value={formData.date_of_purchase ? formData.date_of_purchase.toISOString().split("T")[0] : ""}
                onChange={handleDateChange}
                className=""
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
                className=""
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
                className=""
              />
            </div>

            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Price (£)
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price || ""}
                onChange={handleNumberInputChange}
                className=""
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="has_vat" className="text-sm font-medium cursor-pointer">
                VAT Applicable
              </Label>
              <Switch
                id="has_vat"
                checked={formData.has_vat}
                onCheckedChange={(checked) =>
                  dispatch(setFormData({ has_vat: checked, vat_amount: checked ? formData.vat_amount : null }))
                }
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
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.vat_amount || ""}
                  onChange={handleNumberInputChange}
                  className=""
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Vehicle Invoice</Label>
              <div className="">
                <FileUploader onUploadSuccess={handleFileUploadSuccess("vehicle_invoice")} />
              </div>
              {formData.vehicle_invoice && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  File uploaded successfully
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Enter any additional notes about the vehicle..."
              value={formData.notes}
              onChange={(e: any) => handleInputChange(e)}
              className=""
              rows={4}
            />
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
              Track important compliance dates. Upload documents where applicable.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="last_pmi_date" className="text-sm font-medium">
                Last PMI Date
              </Label>
              <Input
                id="last_pmi_date"
                name="last_pmi_date"
                type="date"
                value={formData.last_pmi_date ? formData.last_pmi_date.toISOString().split("T")[0] : ""}
                onChange={handleDateChange}
              />
              <FileUploader onUploadSuccess={handleFileUploadSuccess("pmi_upload")} />
              {formData.pmi_upload && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Document uploaded
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="pmi_inspection_cycle" className="text-sm font-medium">
                PMI Inspection Cycle (days)
              </Label>
              <Input
                id="pmi_inspection_cycle"
                name="pmi_inspection_cycle"
                type="number"
                placeholder="e.g., 90"
                value={formData.pmi_inspection_cycle || ""}
                onChange={handleNumberInputChange}
                className=""
              />
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="mot_expiry" className="text-sm font-medium">
                MOT Expiry Date
              </Label>
              <Input
                id="mot_expiry"
                name="mot_expiry"
                type="date"
                value={formData.mot_expiry ? formData.mot_expiry.toISOString().split("T")[0] : ""}
                onChange={handleDateChange}
              />
              <FileUploader onUploadSuccess={handleFileUploadSuccess("mot_upload")} />
              {formData.mot_upload && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Document uploaded
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="insurance_expiry" className="text-sm font-medium">
                Insurance Expiry Date
              </Label>
              <Input
                id="insurance_expiry"
                name="insurance_expiry"
                type="date"
                value={formData.insurance_expiry ? formData.insurance_expiry.toISOString().split("T")[0] : ""}
                onChange={handleDateChange}
              />
              <FileUploader onUploadSuccess={handleFileUploadSuccess("insurance_upload")} />
              {formData.insurance_upload && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Document uploaded
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <Label htmlFor="tax_expiry" className="text-sm font-medium">
                Tax Expiry Date
              </Label>
              <Input
                id="tax_expiry"
                name="tax_expiry"
                type="date"
                value={formData.tax_expiry ? formData.tax_expiry.toISOString().split("T")[0] : ""}
                onChange={handleDateChange}
              />
              <FileUploader onUploadSuccess={handleFileUploadSuccess("tax_upload")} />
              {formData.tax_upload && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Document uploaded
                </div>
              )}
            </div>
          </div>

          {formData.tacho_fitted && (
            <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-900">Tachograph Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 border rounded-lg bg-white">
                  <Label htmlFor="tacho_calibration_expiry" className="text-sm font-medium">
                    Tacho Calibration Expiry
                  </Label>
                  <Input
                    id="tacho_calibration_expiry"
                    name="tacho_calibration_expiry"
                    type="date"
                    value={
                      formData.tacho_calibration_expiry
                        ? formData.tacho_calibration_expiry.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={handleDateChange}
                  />
                  <FileUploader onUploadSuccess={handleFileUploadSuccess("tacho_calibration_upload")} />
                  {formData.tacho_calibration_upload && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Document uploaded
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4 border rounded-lg bg-white">
                  <Label htmlFor="last_tacho_download" className="text-sm font-medium">
                    Last Tacho Download
                  </Label>
                  <Input
                    id="last_tacho_download"
                    name="last_tacho_download"
                    type="date"
                    value={formData.last_tacho_download ? formData.last_tacho_download.toISOString().split("T")[0] : ""}
                    onChange={handleDateChange}
                  />
                  <FileUploader onUploadSuccess={handleFileUploadSuccess("tacho_download_upload")} />
                  {formData.tacho_download_upload && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Document uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.wheelchair_lift_fitted && (
            <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
              <h4 className="font-semibold text-purple-900">Wheelchair Lift Information</h4>
              <div className="space-y-3 p-4 border rounded-lg bg-white">
                <Label htmlFor="loller_calibration_expiry" className="text-sm font-medium">
                  LOLLER Calibration Expiry
                </Label>
                <Input
                  id="loller_calibration_expiry"
                  name="loller_calibration_expiry"
                  type="date"
                  value={
                    formData.loller_calibration_expiry
                      ? formData.loller_calibration_expiry.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={handleDateChange}
                />
                <FileUploader onUploadSuccess={handleFileUploadSuccess("loller_upload")} />
                {formData.loller_upload && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Document uploaded
                  </div>
                )}
              </div>
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
              <strong>All tyre fields are required.</strong> Expiry format: WWYY (e.g., 0124 for week 1 of 2024). Depth
              ≥1.6mm, Pressure 30-35 PSI, Torque 110-130 Nm.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Driver */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-blue-50 to-white">
              <h4 className="font-semibold mb-4 text-blue-900">Front Driver</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Expiry (WWYY) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_expiry_front_driver"
                    placeholder="0124"
                    value={formData.tyre_expiry_front_driver}
                    onChange={handleTyreExpiryChange}
                    maxLength={4}
                    className={cn("", validationErrors.tyre_expiry_front_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_expiry_front_driver" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Depth (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_depth_front_driver"
                    type="number"
                    step="0.1"
                    placeholder="7.2"
                    value={formData.tyre_depth_front_driver || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_depth_front_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_depth_front_driver" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Pressure (PSI) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_pressure_front_driver"
                    type="number"
                    step="0.1"
                    placeholder="32.5"
                    value={formData.tyre_pressure_front_driver || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_pressure_front_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_pressure_front_driver" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Torque (Nm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_torque_front_driver"
                    type="number"
                    step="0.1"
                    placeholder="120.0"
                    value={formData.tyre_torque_front_driver || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_torque_front_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_torque_front_driver" />
                </div>
              </div>
            </div>

            {/* Front Passenger */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-green-50 to-white">
              <h4 className="font-semibold mb-4 text-green-900">Front Passenger</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Expiry (WWYY) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_expiry_front_passenger"
                    placeholder="0124"
                    value={formData.tyre_expiry_front_passenger}
                    onChange={handleTyreExpiryChange}
                    maxLength={4}
                    className={cn("", validationErrors.tyre_expiry_front_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_expiry_front_passenger" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Depth (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_depth_front_passenger"
                    type="number"
                    step="0.1"
                    placeholder="7.1"
                    value={formData.tyre_depth_front_passenger || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_depth_front_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_depth_front_passenger" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Pressure (PSI) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_pressure_front_passenger"
                    type="number"
                    step="0.1"
                    placeholder="32.0"
                    value={formData.tyre_pressure_front_passenger || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_pressure_front_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_pressure_front_passenger" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Torque (Nm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_torque_front_passenger"
                    type="number"
                    step="0.1"
                    placeholder="120.0"
                    value={formData.tyre_torque_front_passenger || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_torque_front_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_torque_front_passenger" />
                </div>
              </div>
            </div>

            {/* Rear Outer Driver */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-purple-50 to-white">
              <h4 className="font-semibold mb-4 text-purple-900">Rear Outer Driver</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Expiry (WWYY) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_expiry_rear_outer_driver"
                    placeholder="0124"
                    value={formData.tyre_expiry_rear_outer_driver}
                    onChange={handleTyreExpiryChange}
                    maxLength={4}
                    className={cn("", validationErrors.tyre_expiry_rear_outer_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_expiry_rear_outer_driver" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Depth (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_depth_rear_outer_driver"
                    type="number"
                    step="0.1"
                    placeholder="6.9"
                    value={formData.tyre_depth_rear_outer_driver || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_depth_rear_outer_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_depth_rear_outer_driver" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Pressure (PSI) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_pressure_rear_outer_driver"
                    type="number"
                    step="0.1"
                    placeholder="35.0"
                    value={formData.tyre_pressure_rear_outer_driver || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_pressure_rear_outer_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_pressure_rear_outer_driver" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Torque (Nm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_torque_rear_outer_driver"
                    type="number"
                    step="0.1"
                    placeholder="125.0"
                    value={formData.tyre_torque_rear_outer_driver || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_torque_rear_outer_driver && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_torque_rear_outer_driver" />
                </div>
              </div>
            </div>

            {/* Rear Outer Passenger */}
            <div className="p-4 border-2 rounded-lg bg-gradient-to-br from-orange-50 to-white">
              <h4 className="font-semibold mb-4 text-orange-900">Rear Outer Passenger</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Expiry (WWYY) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_expiry_rear_outer_passenger"
                    placeholder="0124"
                    value={formData.tyre_expiry_rear_outer_passenger}
                    onChange={handleTyreExpiryChange}
                    maxLength={4}
                    className={cn("", validationErrors.tyre_expiry_rear_outer_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_expiry_rear_outer_passenger" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Depth (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_depth_rear_outer_passenger"
                    type="number"
                    step="0.1"
                    placeholder="7.0"
                    value={formData.tyre_depth_rear_outer_passenger || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_depth_rear_outer_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_depth_rear_outer_passenger" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Pressure (PSI) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_pressure_rear_outer_passenger"
                    type="number"
                    step="0.1"
                    placeholder="35.5"
                    value={formData.tyre_pressure_rear_outer_passenger || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_pressure_rear_outer_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_pressure_rear_outer_passenger" />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Torque (Nm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="tyre_torque_rear_outer_passenger"
                    type="number"
                    step="0.1"
                    placeholder="125.0"
                    value={formData.tyre_torque_rear_outer_passenger || ""}
                    onChange={handleNumberInputChange}
                    className={cn("", validationErrors.tyre_torque_rear_outer_passenger && "border-red-500")}
                  />
                  <ErrorMessage field="tyre_torque_rear_outer_passenger" />
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
                  <span className="text-muted-foreground">Sites:</span>
                  <span className="font-medium">{formData.site_allocated_ids.length || 0}</span>
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
                    {formData.date_of_purchase ? formData.date_of_purchase.toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{formData.price ? `£${formData.price.toFixed(2)}` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT:</span>
                  <span className="font-medium">
                    {formData.has_vat ? (formData.vat_amount ? `£${formData.vat_amount.toFixed(2)}` : "N/A") : "N/A"}
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
                    {formData.mot_expiry ? formData.mot_expiry.toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance:</span>
                  <span className="font-medium">
                    {formData.insurance_expiry ? formData.insurance_expiry.toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">
                    {formData.tax_expiry ? formData.tax_expiry.toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tyre Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Driver:</span>
                  <span className="font-medium">{formData.tyre_expiry_front_driver || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Pass:</span>
                  <span className="font-medium">{formData.tyre_expiry_front_passenger || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Driver:</span>
                  <span className="font-medium">{formData.tyre_expiry_rear_outer_driver || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Pass:</span>
                  <span className="font-medium">{formData.tyre_expiry_rear_outer_passenger || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <p className="text-sm text-muted-foreground">
              Click &qout;Create Vehicle&qout; button below to submit the form
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
                      {currentStep === 3 && <Badge variant="destructive">All Required</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {index === 0 &&
                        "Enter vehicle information and allocate sites. All fields marked with * are required."}
                      {index === 1 && "Record purchase details and optional notes for your records."}
                      {index === 2 && "Track compliance dates and upload related documents."}
                      {index === 3 && "Complete all tyre checks with required safety metrics."}
                      {index === 4 && "Review all information and submit the vehicle registration."}
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
    { label: "Purchase Details" },
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
