"use client"
import * as React from "react"
import { Stepper, StepperTabs, StepperContent, StepperNavigation } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Car, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import FileUploader from "../Media/MediaUpload"
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { Provider, useDispatch, useSelector } from "react-redux"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  vehicles_type: number // Changed to number to store ID
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
    vehicles_type: 0, // Initialize with 0
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

// Create Redux slice
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

// Export actions
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

// Create store
const store = configureStore({
  reducer: {
    vehicle: vehicleSlice.reducer,
  },
})

// Define RootState and AppDispatch types
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
  const year = Number.parseInt(value.substring(2, 4))
  if (week < 1 || week > 53) {
    return "Week must be between 01 and 53"
  }
  return null
}

const validateRegistrationNumber = (value: string): string | null => {
  if (!value.trim()) {
    return "Registration number is required"
  }
  const pattern = /^[A-Z0-9\s-]{1,8}$/
  if (!pattern.test(value)) {
    return "Invalid registration number format (max 8 characters, letters, numbers, spaces, or hyphens)"
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

const validatePositiveNumber = (value: number | null, fieldName: string, min: number = 0): string | null => {
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

const validateUploadIfDateSet = (date: Date | null, upload: string, fieldName: string): string | null => {
  if (date && !upload) {
    return `Upload required for ${fieldName}`
  }
  return null
}

const validateDate = (date: Date | null, fieldName: string): string | null => {
  if (date && isNaN(date.getTime())) {
    return `Invalid ${fieldName} date`
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
}: {
  options: Site[]
  selected: number[]
  onChange: (value: number[]) => void
  placeholder: string
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
          className="w-full justify-between bg-transparent"
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
function AddVehicleStepper() {
  const dispatch = useDispatch<AppDispatch>()
  const {
    formData,
    sites,
    vehicleTypes,
    sitesLoading,
    vehicleTypesLoading,
    submitLoading,
    activeStep,
    validationErrors,
  } = useSelector((state: RootState) => state.vehicle)
  const cookies = useCookies()


  // Handle file upload success
  const handleFileUploadSuccess = (field: keyof VehicleFormData) => (url: string) => {
    dispatch(setFormData({ [field]: url }))
    if (validationErrors[`${field}`]) {
      dispatch(clearValidationError(`${field}`))
    }
  }

  // Fetch sites and vehicle types on mount
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
          toast.error("Failed to load sites.", {
            description: "Please try again later.",
          })
        }
      } catch (error) {
        console.error("Error fetching sites:", error)
        toast.error("An error occurred while fetching sites.", {
          description: "Please check your connection and try again.",
        })
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
          toast.error("Failed to load vehicle types.", {
            description: "Please try again later.",
          })
        }
      } catch (error) {
        console.error("Error fetching vehicle types:", error)
        toast.error("An error occurred while fetching vehicle types.", {
          description: "Please check your connection and try again.",
        })
      } finally {
        dispatch(setVehicleTypesLoading(false))
      }
    }

    fetchSites()
    fetchVehicleTypes()
  }, [cookies, dispatch])

  // Handle input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value
    dispatch(setFormData({ [name]: newValue }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  // Handle date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value ? new Date(value) : null }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  // Handle tyre expiry input changes
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

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    dispatch(setFormData({ [name]: name === "vehicles_type" ? Number(value) : value }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  // Handle number input changes
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value ? Number.parseFloat(value) : null }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  // Handle multi select change
  const handleMultiSelectChange = (name: string, values: number[]) => {
    dispatch(setFormData({ [name]: values }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {}

    if (activeStep === 0) {
      // Vehicle Type Details
    
      const makeError = validateRequiredString(formData.make, "Make")
      if (makeError) errors.make = makeError

      const modelError = validateRequiredString(formData.model, "Model")
      if (modelError) errors.model = modelError

      const typeError = validateRequiredNumber(formData.vehicles_type, "Vehicle Type")
      if (typeError) errors.vehicles_type = typeError

      const sitesError = validateRequiredArray(formData.site_allocated_ids, "Allocated Site(s)")
      if (sitesError) errors.site_allocated_ids = sitesError

      if (formData.number_of_seats !== null) {
        const seatsError = validatePositiveNumber(formData.number_of_seats, "Number of Seats", 1)
        if (seatsError) errors.number_of_seats = seatsError
      }

      if (formData.current_mileage !== null) {
        const mileageError = validatePositiveNumber(formData.current_mileage, "Current Mileage")
        if (mileageError) errors.current_mileage = mileageError
      }
    }

    if (activeStep === 1) {
      // Vehicle Purchase Details
      const purchaseDateError = validateDate(formData.date_of_purchase, "Date of Purchase")
      if (purchaseDateError) errors.date_of_purchase = purchaseDateError

      if (formData.purchased_from) {
        const purchasedFromError = validateRequiredString(formData.purchased_from, "Purchased From")
        if (purchasedFromError) errors.purchased_from = purchasedFromError
      }

      if (formData.purchased_by) {
        const purchasedByError = validateRequiredString(formData.purchased_by, "Purchased By")
        if (purchasedByError) errors.purchased_by = purchasedByError
      }

      if (formData.price !== null) {
        const priceError = validatePositiveNumber(formData.price, "Price")
        if (priceError) errors.price = priceError
      }

      if (formData.has_vat && formData.vat_amount !== null) {
        const vatError = validatePositiveNumber(formData.vat_amount, "VAT Amount")
        if (vatError) errors.vat_amount = vatError
      }
    }

    if (activeStep === 2) {
      // Vehicle Expiry Dates
      const pmiDateError = validateDate(formData.last_pmi_date, "Last PMI Date")
      if (pmiDateError) errors.last_pmi_date = pmiDateError

      const pmiUploadError = validateUploadIfDateSet(formData.last_pmi_date, formData.pmi_upload, "PMI")
      if (pmiUploadError) errors.pmi_upload = pmiUploadError

      if (formData.pmi_inspection_cycle !== null) {
        const cycleError = validatePositiveNumber(formData.pmi_inspection_cycle, "PMI Inspection Cycle", 1)
        if (cycleError) errors.pmi_inspection_cycle = cycleError
      }

      const motDateError = validateDate(formData.mot_expiry, "MOT Expiry")
      if (motDateError) errors.mot_expiry = motDateError

      const motUploadError = validateUploadIfDateSet(formData.mot_expiry, formData.mot_upload, "MOT")
      if (motUploadError) errors.mot_upload = motUploadError

      const insuranceDateError = validateDate(formData.insurance_expiry, "Insurance Expiry")
      if (insuranceDateError) errors.insurance_expiry = insuranceDateError

      const insuranceUploadError = validateUploadIfDateSet(formData.insurance_expiry, formData.insurance_upload, "Insurance")
      if (insuranceUploadError) errors.insurance_upload = insuranceUploadError

      const taxDateError = validateDate(formData.tax_expiry, "Tax Expiry")
      if (taxDateError) errors.tax_expiry = taxDateError

      const taxUploadError = validateUploadIfDateSet(formData.tax_expiry, formData.tax_upload, "Tax")
      if (taxUploadError) errors.tax_upload = taxUploadError

      if (formData.tacho_fitted) {
        const tachoCalDateError = validateDate(formData.tacho_calibration_expiry, "Tacho Calibration Expiry")
        if (tachoCalDateError) errors.tacho_calibration_expiry = tachoCalDateError

        const tachoCalUploadError = validateUploadIfDateSet(
          formData.tacho_calibration_expiry,
          formData.tacho_calibration_upload,
          "Tacho Calibration",
        )
        if (tachoCalUploadError) errors.tacho_calibration_upload = tachoCalUploadError

        const tachoDownDateError = validateDate(formData.last_tacho_download, "Last Tacho Download")
        if (tachoDownDateError) errors.last_tacho_download = tachoDownDateError

        const tachoDownUploadError = validateUploadIfDateSet(
          formData.last_tacho_download,
          formData.tacho_download_upload,
          "Tacho Download",
        )
        if (tachoDownUploadError) errors.tacho_download_upload = tachoDownUploadError
      }

      if (formData.wheelchair_lift_fitted) {
        const lollerDateError = validateDate(formData.loller_calibration_expiry, "Loller Calibration Expiry")
        if (lollerDateError) errors.loller_calibration_expiry = lollerDateError

        const lollerUploadError = validateUploadIfDateSet(
          formData.loller_calibration_expiry,
          formData.loller_upload,
          "Loller Calibration",
        )
        if (lollerUploadError) errors.loller_upload = lollerUploadError
      }
    }

    if (activeStep === 3) {
      // Tyre Checks
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

  // Handle next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      dispatch(setActiveStep(activeStep + 1))
    } else {
      toast.error("Validation Error", {
        description: "Please fix the errors before proceeding.",
      })
    }
  }

  // Handle form submission
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
      vehicle_type_id: formData.vehicles_type, // Rename to match API expectation
      wheelchair_lift_fitted: formData.wheelchair_lift_fitted ? "Yes" : "No",
      date_of_purchase: formData.date_of_purchase ? formData.date_of_purchase.toISOString().split('T')[0] : null,
      last_pmi_date: formData.last_pmi_date ? formData.last_pmi_date.toISOString().split('T')[0] : null,
      mot_expiry: formData.mot_expiry ? formData.mot_expiry.toISOString().split('T')[0] : null,
      insurance_expiry: formData.insurance_expiry ? formData.insurance_expiry.toISOString().split('T')[0] : null,
      tax_expiry: formData.tax_expiry ? formData.tax_expiry.toISOString().split('T')[0] : null,
      tacho_calibration_expiry: formData.tacho_calibration_expiry ? formData.tacho_calibration_expiry.toISOString().split('T')[0] : null,
      last_tacho_download: formData.last_tacho_download ? formData.last_tacho_download.toISOString().split('T')[0] : null,
      loller_calibration_expiry: formData.loller_calibration_expiry ? formData.loller_calibration_expiry.toISOString().split('T')[0] : null,
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

  // Error display component
  const ErrorMessage = ({ field }: { field: string }) => {
    if (!validationErrors[field]) return null

    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{validationErrors[field]}</AlertDescription>
      </Alert>
    )
  }

  // Stepper steps
  const steps = [
    {
      label: "Vehicle Type Details",
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
            />
            <ErrorMessage field="registration_number" />
          </div>
          <div>
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              name="make"
              placeholder="Enter make"
              value={formData.make}
              onChange={handleInputChange}
              className={validationErrors.make ? "border-red-500" : ""}
            />
            <ErrorMessage field="make" />
          </div>
          <div>
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              name="model"
              placeholder="Enter model"
              value={formData.model}
              onChange={handleInputChange}
              className={validationErrors.model ? "border-red-500" : ""}
            />
            <ErrorMessage field="model" />
          </div>
          <div>
            <Label htmlFor="vehicles_type">Vehicle Type *</Label>
            <Select
              value={formData.vehicles_type.toString()}
              onValueChange={(value) => handleSelectChange("vehicles_type", value)}
            >
              <SelectTrigger className={validationErrors.vehicles_type ? "border-red-500" : ""}>
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
                      <Badge className="bg-blue-100 text-blue-700">{type.name}</Badge>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <ErrorMessage field="vehicles_type" />
          </div>
          <div>
            <Label htmlFor="number_of_seats">Number of Seats</Label>
            <Input
              id="number_of_seats"
              name="number_of_seats"
              type="number"
              placeholder="Enter number of seats"
              value={formData.number_of_seats || ""}
              onChange={handleNumberInputChange}
              className={validationErrors.number_of_seats ? "border-red-500" : ""}
            />
            <ErrorMessage field="number_of_seats" />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="current_mileage">Previous Mileage</Label>
              <Input
                id="current_mileage"
                name="current_mileage"
                type="number"
                placeholder="Enter mileage"
                value={formData.current_mileage || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.current_mileage ? "border-red-500" : ""}
              />
              <ErrorMessage field="current_mileage" />
            </div>
            <div className="w-32">
              <Select
                value={formData.mileage_unit}
                onValueChange={(value) => handleSelectChange("mileage_unit", value)}
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
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="tacho_fitted" className="mb-0">
              Tacho Fitted
            </Label>
            <Switch
              id="tacho_fitted"
              name="tacho_fitted"
              checked={formData.tacho_fitted}
              onCheckedChange={(checked) => dispatch(setFormData({ tacho_fitted: checked }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="wheelchair_lift_fitted" className="mb-0">
              Wheelchair Lift Fitted
            </Label>
            <Switch
              id="wheelchair_lift_fitted"
              name="wheelchair_lift_fitted"
              checked={formData.wheelchair_lift_fitted}
              onCheckedChange={(checked) => dispatch(setFormData({ wheelchair_lift_fitted: checked }))}
            />
          </div>
          <div>
            <Label htmlFor="vehicle_picture">Vehicle Picture</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("vehicle_picture")} />
          </div>
          <div>
            <Label htmlFor="new_checklist">New Vehicle Checklist</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("new_checklist")} />
          </div>
          <div>
            <Label htmlFor="logbook">Logbook</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("logbook")} />
          </div>
          <div>
            <Label htmlFor="coif_technical">COIF/Technical Data</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("coif_technical")} />
          </div>
          <div className="col-span-2">
            <Label>Allocated Site(s) *</Label>
            <MultiSelect
              options={sites}
              selected={formData.site_allocated_ids}
              onChange={(values) => handleMultiSelectChange("site_allocated_ids", values)}
              placeholder="Select sites"
            />
            <ErrorMessage field="site_allocated_ids" />
          </div>
        </div>
      ),
    },
    {
      label: "Vehicle Purchase Details",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date_of_purchase">Date of Purchase</Label>
            <Input
              id="date_of_purchase"
              name="date_of_purchase"
              type="date"
              value={formData.date_of_purchase ? formData.date_of_purchase.toISOString().split('T')[0] : ""}
              onChange={handleDateChange}
              className={validationErrors.date_of_purchase ? "border-red-500" : ""}
            />
            <ErrorMessage field="date_of_purchase" />
          </div>
          <div>
            <Label htmlFor="purchased_from">Purchased From</Label>
            <Input
              id="purchased_from"
              name="purchased_from"
              placeholder="Enter seller"
              value={formData.purchased_from}
              onChange={handleInputChange}
              className={validationErrors.purchased_from ? "border-red-500" : ""}
            />
            <ErrorMessage field="purchased_from" />
          </div>
          <div>
            <Label htmlFor="purchased_by">Purchased By</Label>
            <Input
              id="purchased_by"
              name="purchased_by"
              placeholder="Enter buyer"
              value={formData.purchased_by}
              onChange={handleInputChange}
              className={validationErrors.purchased_by ? "border-red-500" : ""}
            />
            <ErrorMessage field="purchased_by" />
          </div>
          <div>
            <Label htmlFor="price">Price (£)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price || ""}
              onChange={handleNumberInputChange}
              className={validationErrors.price ? "border-red-500" : ""}
            />
            <ErrorMessage field="price" />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="has_vat" className="mb-0">
              VAT Applicable
            </Label>
            <Switch
              id="has_vat"
              name="has_vat"
              checked={formData.has_vat}
              onCheckedChange={(checked) =>
                dispatch(setFormData({ has_vat: checked, vat_amount: checked ? formData.vat_amount : null }))
              }
            />
          </div>
          {formData.has_vat && (
            <div>
              <Label htmlFor="vat_amount">VAT Amount (£)</Label>
              <Input
                id="vat_amount"
                name="vat_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.vat_amount || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.vat_amount ? "border-red-500" : ""}
              />
              <ErrorMessage field="vat_amount" />
            </div>
          )}
          <div>
            <Label htmlFor="vehicle_invoice">Vehicle Invoice</Label>
            <FileUploader onUploadSuccess={handleFileUploadSuccess("vehicle_invoice")} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Enter notes"
              value={formData.notes}
              //@ts-expect-error ab thk ha
              onChange={handleInputChange}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Vehicle Expiry Dates",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="last_pmi_date">Last PMI Date</Label>
            <Input
              id="last_pmi_date"
              name="last_pmi_date"
              type="date"
              value={formData.last_pmi_date ? formData.last_pmi_date.toISOString().split('T')[0] : ""}
              onChange={handleDateChange}
              className={validationErrors.last_pmi_date ? "border-red-500" : ""}
            />
            <FileUploader onUploadSuccess={handleFileUploadSuccess("pmi_upload")} />
            <ErrorMessage field="pmi_upload" />
            <ErrorMessage field="last_pmi_date" />
          </div>
          <div>
            <Label htmlFor="pmi_inspection_cycle">PMI Inspection Cycle (days)</Label>
            <Input
              id="pmi_inspection_cycle"
              name="pmi_inspection_cycle"
              type="number"
              value={formData.pmi_inspection_cycle || ""}
              onChange={handleNumberInputChange}
              className={validationErrors.pmi_inspection_cycle ? "border-red-500" : ""}
            />
            <ErrorMessage field="pmi_inspection_cycle" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mot_expiry">MOT Expiry Date</Label>
            <Input
              id="mot_expiry"
              name="mot_expiry"
              type="date"
              value={formData.mot_expiry ? formData.mot_expiry.toISOString().split('T')[0] : ""}
              onChange={handleDateChange}
              className={validationErrors.mot_expiry ? "border-red-500" : ""}
            />
            <FileUploader onUploadSuccess={handleFileUploadSuccess("mot_upload")} />
            <ErrorMessage field="mot_upload" />
            <ErrorMessage field="mot_expiry" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
            <Input
              id="insurance_expiry"
              name="insurance_expiry"
              type="date"
              value={formData.insurance_expiry ? formData.insurance_expiry.toISOString().split('T')[0] : ""}
              onChange={handleDateChange}
              className={validationErrors.insurance_expiry ? "border-red-500" : ""}
            />
            <FileUploader onUploadSuccess={handleFileUploadSuccess("insurance_upload")} />
            <ErrorMessage field="insurance_upload" />
            <ErrorMessage field="insurance_expiry" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tax_expiry">Tax Expiry Date</Label>
            <Input
              id="tax_expiry"
              name="tax_expiry"
              type="date"
              value={formData.tax_expiry ? formData.tax_expiry.toISOString().split('T')[0] : ""}
              onChange={handleDateChange}
              className={validationErrors.tax_expiry ? "border-red-500" : ""}
            />
            <FileUploader onUploadSuccess={handleFileUploadSuccess("tax_upload")} />
            <ErrorMessage field="tax_upload" />
            <ErrorMessage field="tax_expiry" />
          </div>
          {formData.tacho_fitted && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tacho_calibration_expiry">Tacho Calibration Expiry</Label>
                <Input
                  id="tacho_calibration_expiry"
                  name="tacho_calibration_expiry"
                  type="date"
                  value={formData.tacho_calibration_expiry ? formData.tacho_calibration_expiry.toISOString().split('T')[0] : ""}
                  onChange={handleDateChange}
                  className={validationErrors.tacho_calibration_expiry ? "border-red-500" : ""}
                />
                <FileUploader onUploadSuccess={handleFileUploadSuccess("tacho_calibration_upload")} />
                <ErrorMessage field="tacho_calibration_upload" />
                <ErrorMessage field="tacho_calibration_expiry" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_tacho_download">Last Vehicle Tacho Download</Label>
                <Input
                  id="last_tacho_download"
                  name="last_tacho_download"
                  type="date"
                  value={formData.last_tacho_download ? formData.last_tacho_download.toISOString().split('T')[0] : ""}
                  onChange={handleDateChange}
                  className={validationErrors.last_tacho_download ? "border-red-500" : ""}
                />
                <FileUploader onUploadSuccess={handleFileUploadSuccess("tacho_download_upload")} />
                <ErrorMessage field="tacho_download_upload" />
                <ErrorMessage field="last_tacho_download" />
              </div>
            </>
          )}
          {formData.wheelchair_lift_fitted && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="loller_calibration_expiry">Loller Calibration Expiry</Label>
              <Input
                id="loller_calibration_expiry"
                name="loller_calibration_expiry"
                type="date"
                value={formData.loller_calibration_expiry ? formData.loller_calibration_expiry.toISOString().split('T')[0] : ""}
                onChange={handleDateChange}
                className={validationErrors.loller_calibration_expiry ? "border-red-500" : ""}
              />
              <FileUploader onUploadSuccess={handleFileUploadSuccess("loller_upload")} />
              <ErrorMessage field="loller_upload" />
              <ErrorMessage field="loller_calibration_expiry" />
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Tyre Checks",
      content: (
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tyre expiry dates must be in WWYY format (e.g., 0124 for week 1 of 2024).
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tyre_expiry_front_driver">Front Driver Expiry (WWYY) *</Label>
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
              <Label htmlFor="tyre_expiry_front_passenger">Front Passenger Expiry (WWYY) *</Label>
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
              <Label htmlFor="tyre_expiry_rear_outer_driver">Rear Outer Driver Expiry (WWYY) *</Label>
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
              <Label htmlFor="tyre_expiry_rear_outer_passenger">Rear Outer Passenger Expiry (WWYY) *</Label>
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
              <Label>
                Front Driver Tread Depth (mm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be at least 1.6 mm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_depth_front_driver"
                name="tyre_depth_front_driver"
                type="number"
                step="0.1"
                placeholder="e.g., 7.2"
                value={formData.tyre_depth_front_driver || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_depth_front_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_depth_front_driver" />
            </div>
            <div>
              <Label>
                Front Passenger Tread Depth (mm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be at least 1.6 mm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_depth_front_passenger"
                name="tyre_depth_front_passenger"
                type="number"
                step="0.1"
                placeholder="e.g., 7.1"
                value={formData.tyre_depth_front_passenger || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_depth_front_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_depth_front_passenger" />
            </div>
            <div>
              <Label>
                Rear Outer Driver Tread Depth (mm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be at least 1.6 mm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_depth_rear_outer_driver"
                name="tyre_depth_rear_outer_driver"
                type="number"
                step="0.1"
                placeholder="e.g., 6.9"
                value={formData.tyre_depth_rear_outer_driver || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_depth_rear_outer_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_depth_rear_outer_driver" />
            </div>
            <div>
              <Label>
                Rear Outer Passenger Tread Depth (mm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be at least 1.6 mm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_depth_rear_outer_passenger"
                name="tyre_depth_rear_outer_passenger"
                type="number"
                step="0.1"
                placeholder="e.g., 7.0"
                value={formData.tyre_depth_rear_outer_passenger || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_depth_rear_outer_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_depth_rear_outer_passenger" />
            </div>
            <div>
              <Label>
                Front Driver Pressure (PSI) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 30-35 PSI to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_pressure_front_driver"
                name="tyre_pressure_front_driver"
                type="number"
                step="0.1"
                placeholder="e.g., 32.5"
                value={formData.tyre_pressure_front_driver || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_pressure_front_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_pressure_front_driver" />
            </div>
            <div>
              <Label>
                Front Passenger Pressure (PSI) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 30-35 PSI to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_pressure_front_passenger"
                name="tyre_pressure_front_passenger"
                type="number"
                step="0.1"
                placeholder="e.g., 32.0"
                value={formData.tyre_pressure_front_passenger || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_pressure_front_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_pressure_front_passenger" />
            </div>
            <div>
              <Label>
                Rear Outer Driver Pressure (PSI) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 30-35 PSI to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_pressure_rear_outer_driver"
                name="tyre_pressure_rear_outer_driver"
                type="number"
                step="0.1"
                placeholder="e.g., 35.0"
                value={formData.tyre_pressure_rear_outer_driver || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_pressure_rear_outer_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_pressure_rear_outer_driver" />
            </div>
            <div>
              <Label>
                Rear Outer Passenger Pressure (PSI) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 30-35 PSI to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_pressure_rear_outer_passenger"
                name="tyre_pressure_rear_outer_passenger"
                type="number"
                step="0.1"
                placeholder="e.g., 35.5"
                value={formData.tyre_pressure_rear_outer_passenger || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_pressure_rear_outer_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_pressure_rear_outer_passenger" />
            </div>
            <div>
              <Label>
                Front Driver Torque (Nm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 110-130 Nm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_torque_front_driver"
                name="tyre_torque_front_driver"
                type="number"
                step="0.1"
                placeholder="e.g., 120.0"
                value={formData.tyre_torque_front_driver || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_torque_front_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_torque_front_driver" />
            </div>
            <div>
              <Label>
                Front Passenger Torque (Nm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 110-130 Nm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_torque_front_passenger"
                name="tyre_torque_front_passenger"
                type="number"
                step="0.1"
                placeholder="e.g., 120.0"
                value={formData.tyre_torque_front_passenger || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_torque_front_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_torque_front_passenger" />
            </div>
            <div>
              <Label>
                Rear Outer Driver Torque (Nm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 110-130 Nm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_torque_rear_outer_driver"
                name="tyre_torque_rear_outer_driver"
                type="number"
                step="0.1"
                placeholder="e.g., 125.0"
                value={formData.tyre_torque_rear_outer_driver || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_torque_rear_outer_driver ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_torque_rear_outer_driver" />
            </div>
            <div>
              <Label>
                Rear Outer Passenger Torque (Nm) *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 inline ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Should be between 110-130 Nm to pass</TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tyre_torque_rear_outer_passenger"
                name="tyre_torque_rear_outer_passenger"
                type="number"
                step="0.1"
                placeholder="e.g., 125.0"
                value={formData.tyre_torque_rear_outer_passenger || ""}
                onChange={handleNumberInputChange}
                className={validationErrors.tyre_torque_rear_outer_passenger ? "border-red-500" : ""}
              />
              <ErrorMessage field="tyre_torque_rear_outer_passenger" />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Confirm",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Vehicle Type Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Registration Number:</strong> {formData.registration_number || "N/A"}
                </p>
                <p>
                  <strong>Make:</strong> {formData.make || "N/A"}
                </p>
                <p>
                  <strong>Model:</strong> {formData.model || "N/A"}
                </p>
                <p>
                  <strong>Vehicle Type:</strong>{" "}
                  {vehicleTypes.find((type) => type.id === formData.vehicles_type)?.name || "N/A"}
                </p>
                <p>
                  <strong>Number of Seats:</strong> {formData.number_of_seats || "N/A"}
                </p>
                <p>
                  <strong>Current Mileage:</strong>{" "}
                  {formData.current_mileage
                    ? `${formData.current_mileage} ${formData.mileage_unit.toUpperCase()}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Tacho Fitted:</strong> {formData.tacho_fitted ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Wheelchair Lift Fitted:</strong> {formData.wheelchair_lift_fitted ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Allocated Sites:</strong>{" "}
                  {formData.site_allocated_ids
                    .map((id) => sites.find((site) => site.id === id)?.name || "Unknown")
                    .join(", ") || "N/A"}
                </p>
                <p>
                  <strong>Vehicle Picture:</strong> {formData.vehicle_picture ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>New Checklist:</strong> {formData.new_checklist ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>Logbook:</strong> {formData.logbook ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>COIF/Technical Data:</strong> {formData.coif_technical ? "Uploaded" : "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Purchase Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Date of Purchase:</strong>{" "}
                  {formData.date_of_purchase ? formData.date_of_purchase.toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <strong>Purchased From:</strong> {formData.purchased_from || "N/A"}
                </p>
                <p>
                  <strong>Purchased By:</strong> {formData.purchased_by || "N/A"}
                </p>
                <p>
                  <strong>Price:</strong> {formData.price ? `£${formData.price.toFixed(2)}` : "N/A"}
                </p>
                <p>
                  <strong>VAT Amount:</strong>{" "}
                  {formData.has_vat ? (formData.vat_amount ? `£${formData.vat_amount.toFixed(2)}` : "N/A") : "NA"}
                </p>
                <p>
                  <strong>Vehicle Invoice:</strong> {formData.vehicle_invoice ? "Uploaded" : "N/A"}
                </p>
                <p>
                  <strong>Notes:</strong> {formData.notes || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Expiry Dates</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Last PMI Date:</strong>{" "}
                  {formData.last_pmi_date ? formData.last_pmi_date.toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <strong>PMI Inspection Cycle:</strong> {formData.pmi_inspection_cycle || "N/A"} days
                </p>
                <p>
                  <strong>MOT Expiry:</strong>{" "}
                  {formData.mot_expiry ? formData.mot_expiry.toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <strong>Insurance Expiry:</strong>{" "}
                  {formData.insurance_expiry ? formData.insurance_expiry.toLocaleDateString() : "N/A"}
                </p>
                <p>
                  <strong>Tax Expiry:</strong>{" "}
                  {formData.tax_expiry ? formData.tax_expiry.toLocaleDateString() : "N/A"}
                </p>
                {formData.tacho_fitted && (
                  <>
                    <p>
                      <strong>Tacho Calibration Expiry:</strong>{" "}
                      {formData.tacho_calibration_expiry ? formData.tacho_calibration_expiry.toLocaleDateString() : "N/A"}
                    </p>
                    <p>
                      <strong>Last Tacho Download:</strong>{" "}
                      {formData.last_tacho_download ? formData.last_tacho_download.toLocaleDateString() : "N/A"}
                    </p>
                  </>
                )}
                {formData.wheelchair_lift_fitted && (
                  <p>
                    <strong>Loller Calibration Expiry:</strong>{" "}
                    {formData.loller_calibration_expiry ? formData.loller_calibration_expiry.toLocaleDateString() : "N/A"}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Tyre Checks</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Front Driver Expiry:</strong> {formData.tyre_expiry_front_driver || "N/A"}
                </p>
                <p>
                  <strong>Front Passenger Expiry:</strong> {formData.tyre_expiry_front_passenger || "N/A"}
                </p>
                <p>
                  <strong>Rear Outer Driver Expiry:</strong> {formData.tyre_expiry_rear_outer_driver || "N/A"}
                </p>
                <p>
                  <strong>Rear Outer Passenger Expiry:</strong> {formData.tyre_expiry_rear_outer_passenger || "N/A"}
                </p>
                <p>
                  <strong>Front Driver Depth:</strong> {formData.tyre_depth_front_driver || "N/A"} mm
                </p>
                <p>
                  <strong>Front Passenger Depth:</strong> {formData.tyre_depth_front_passenger || "N/A"} mm
                </p>
                <p>
                  <strong>Rear Outer Driver Depth:</strong> {formData.tyre_depth_rear_outer_driver || "N/A"} mm
                </p>
                <p>
                  <strong>Rear Outer Passenger Depth:</strong> {formData.tyre_depth_rear_outer_passenger || "N/A"} mm
                </p>
                <p>
                  <strong>Front Driver Pressure:</strong> {formData.tyre_pressure_front_driver || "N/A"} PSI
                </p>
                <p>
                  <strong>Front Passenger Pressure:</strong> {formData.tyre_pressure_front_passenger || "N/A"} PSI
                </p>
                <p>
                  <strong>Rear Outer Driver Pressure:</strong> {formData.tyre_pressure_rear_outer_driver || "N/A"} PSI
                </p>
                <p>
                  <strong>Rear Outer Passenger Pressure:</strong> {formData.tyre_pressure_rear_outer_passenger || "N/A"} PSI
                </p>
                <p>
                  <strong>Front Driver Torque:</strong> {formData.tyre_torque_front_driver || "N/A"} Nm
                </p>
                <p>
                  <strong>Front Passenger Torque:</strong> {formData.tyre_torque_front_passenger || "N/A"} Nm
                </p>
                <p>
                  <strong>Rear Outer Driver Torque:</strong> {formData.tyre_torque_rear_outer_driver || "N/A"} Nm
                </p>
                <p>
                  <strong>Rear Outer Passenger Torque:</strong> {formData.tyre_torque_rear_outer_passenger || "N/A"} Nm
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
  ]

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6">
   

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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{step.label}</CardTitle>
                      <CardDescription>
                        {index === 0 && "Enter vehicle information and allocate sites."}
                        {index === 1 && "Record purchase details and optional notes."}
                        {index === 2 && "Track compliance dates and related uploads."}
                        {index === 3 && "Complete tyre checks with required metrics."}
                        {index === 4 && "Review and confirm all the provided details."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>{step.content}</CardContent>
                  </Card>
                </div>
              ))}
            </StepperContent>

            <StepperNavigation className="sticky bottom-0 left-0 right-0 z-10 bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-t px-4 py-3 flex justify-between gap-2">
              <div className="flex gap-2">
                {activeStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => dispatch(setActiveStep(activeStep - 1))}
                    disabled={submitLoading}
                  >
                    Back
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => dispatch(resetForm())} disabled={submitLoading}>
                  Cancel
                </Button>
              </div>

              {activeStep !== steps.length - 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={submitLoading || sitesLoading || vehicleTypesLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                </Button>
              )}
            </StepperNavigation>
          </Stepper>
        </form>
      </div>
    </TooltipProvider>
  )
}

// Wrap the component with Provider
export default function AddVehicleStepperWrapper() {
  return (
    <Provider store={store}>
      <AddVehicleStepper />
    </Provider>
  )
}