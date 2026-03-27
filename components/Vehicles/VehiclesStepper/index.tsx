"use client"
import * as React from "react"
import { Provider, useDispatch, useSelector } from "react-redux"
import { useCookies } from "next-client-cookies"
import { toast } from "sonner"
import { Loader2, Car, ChevronLeft, ChevronRight, RotateCcw, AlertCircle } from "lucide-react"

import { Stepper, StepperTabs, useStepper } from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"

import API_URL from "@/app/utils/ENV"

import vehicleReducer, {
  setFormData,
  setSites,
  setVehicleTypes,
  setSitesLoading,
  setVehicleTypesLoading,
  setSubmitLoading,
  setValidationErrors,
  clearValidationError,
  resetForm,
  setShowTaskDialog,
  setTaskPrefillData,
} from "./vehicleSlice"
import { type VehicleFormData, type ValidationErrors } from "./types"
import {
  DOCUMENT_CONFIG,
  validateTyreExpiry,
  validateTyreDepth,
  validateTyrePressure,
  getMissingDocuments,
  areAllDocumentsUploaded,
  areDateDocumentsUploaded,
} from "./validation"

import { IdentificationStep } from "./IdentificationStep"
import { PurchaseInfoStep } from "./PurchaseInfoStep"
import { VehicleDocumentsStep } from "./VehicleDocumentsStep"
import { ComplianceStep } from "./ComplianceStep"
import { TyreStep } from "./TyreStep"
import { ReviewSubmitStep } from "./ReviewSubmitStep"
import CreateTaskDialog from "@/components/task/CreateTaskDialog"

import { store, type RootState, type AppDispatch } from "./store"

const STEP_META = [
  {
    label: "Vehicle Details",
    description: "Identification, photo, and site allocation",
  },
  {
    label: "Purchase Details",
    description: "Purchase price, date, and invoice",
  },
  {
    label: "Documents",
    description: "Upload all required vehicle documents",
  },
  {
    label: "Compliance",
    description: "MOT, insurance, tax, and tachograph",
  },
  {
    label: "Tyre Checks",
    description: "Expiry, depth, pressure, and torque for all tyres",
  },
  {
    label: "Review & Submit",
    description: "Confirm all details before creating the vehicle",
  },
]

interface AddVehicleStepperFormProps {
  onClose?: () => void
}

function AddVehicleStepperForm({ onClose }: AddVehicleStepperFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const cookies = useCookies()
  const { currentStep, goToNextStep, goToPreviousStep } = useStepper()

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

  // ── Fetch initial data ──────────────────────────────
  React.useEffect(() => {
    const fetchData = async () => {
      dispatch(setSitesLoading(true))
      dispatch(setVehicleTypesLoading(true))
      const token = cookies.get("access_token")
      try {
        const [sitesRes, typesRes] = await Promise.all([
          fetch(`${API_URL}/api/sites/list-names/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/vehicle-types/`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const sitesData = await sitesRes.json()
        const typesData = await typesRes.json()
        if (sitesData.success) dispatch(setSites(sitesData.data))
        if (typesData.success) dispatch(setVehicleTypes(typesData.data))
      } catch {
        toast.error("Failed to load initial data")
      } finally {
        dispatch(setSitesLoading(false))
        dispatch(setVehicleTypesLoading(false))
      }
    }
    fetchData()
  }, [dispatch, cookies])

  // ── Handlers ────────────────────────────────────────
  const handleFileUploadSuccess = (field: keyof VehicleFormData) => (url: string) => {
    dispatch(setFormData({ [field]: url }))
    if (validationErrors[field as string]) dispatch(clearValidationError(field as string))
  }

  const handleCreateTaskForDocument = (documentField: string) => {
    const docConfig = DOCUMENT_CONFIG[documentField]
    if (!docConfig) return
    const deadline = new Date(Date.now() + docConfig.deadlineDays * 86400000).toISOString().slice(0, 16)
    dispatch(setTaskPrefillData({
      title: `Upload ${docConfig.label}: ${formData.registration_number || "New Vehicle"}`,
      description: docConfig.description,
      priority: docConfig.priority,
      deadline,
      estimatedHours: docConfig.estimatedHours.toString(),
    }))
    dispatch(setShowTaskDialog(true))
  }

  const handleCreateTasksForAllMissing = () => {
    const missing = getMissingDocuments(formData)
    if (missing.length > 0) handleCreateTaskForDocument(missing[0].field)
  }

  const validateCurrentStep = (): boolean => {
    const errors: ValidationErrors = {}

    if (currentStep === 0) {
      if (!formData.vin) errors.vin = "VIN is required"
      if (!formData.registration_number) errors.registration_number = "Registration is required"
      if (!formData.make) errors.make = "Make is required"
      if (!formData.model) errors.model = "Model is required"
      if (formData.vehicle_type === 0) errors.vehicle_type = "Type is required"
      if (formData.site_allocated.length === 0) errors.site_allocated = "Site is required"
      if (!formData.last_mileage) errors.last_mileage = "Mileage is required"
    }

    if (currentStep === 1) {
      if (!formData.purchase_mileage) errors.purchase_mileage = "Purchase mileage is required"
    }

    if (currentStep === 4) {
      const tyres = ["front_driver", "front_passenger", "rear_outer_driver", "rear_outer_passenger", "rear_inner_driver", "rear_inner_passenger"]
      tyres.forEach((t) => {
        const errExp = validateTyreExpiry((formData as any)[`tyre_expiry_${t}`])
        const errDep = validateTyreDepth((formData as any)[`tyre_depth_${t}`], t)
        const errPre = validateTyrePressure((formData as any)[`tyre_pressure_${t}`], t)
        if (errExp) errors[`tyre_expiry_${t}`] = errExp
        if (errDep) errors[`tyre_depth_${t}`] = errDep
        if (errPre) errors[`tyre_pressure_${t}`] = errPre
      })
    }

    dispatch(setValidationErrors(errors))
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 2 && !areAllDocumentsUploaded(formData)) {
      toast.error("Please upload all required documents before proceeding")
      return
    }
    if (currentStep === 3 && !areDateDocumentsUploaded(formData)) {
      toast.error("Please upload a document for every compliance date entered")
      return
    }
    if (validateCurrentStep()) {
      goToNextStep()
    } else {
      toast.error("Please fix the highlighted errors before continuing")
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return
    dispatch(setSubmitLoading(true))
    const token = cookies.get("access_token")

    // Sanitize data before submission
    const submissionData = { ...formData }
    const today = new Date().toISOString().split("T")[0]

    // API requires valid date format; default missing maintenance dates to today
    if (!submissionData.last_tyre_maintenance_check_date) submissionData.last_tyre_maintenance_check_date = today
    if (!submissionData.last_valet_check_date) submissionData.last_valet_check_date = today
    if (!submissionData.last_equipment_check_date) submissionData.last_equipment_check_date = today

    // API requires integer tyre pressures
    const tyreKeys = [
      "front_driver", "front_passenger",
      "rear_inner_driver", "rear_inner_passenger",
      "rear_outer_driver", "rear_outer_passenger"
    ]
    tyreKeys.forEach(pos => {
      const field = `tyre_pressure_${pos}`
      if ((submissionData as any)[field]) {
        (submissionData as any)[field] = Math.round(Number((submissionData as any)[field]))
      }
    })

    try {
      const response = await fetch(`${API_URL}/api/vehicles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(submissionData),
      })
      if (response.ok) {
        toast.success("Vehicle created successfully")
        dispatch(resetForm())
        onClose?.()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to create vehicle")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      dispatch(setSubmitLoading(false))
    }
  }

  const steps = [
    { content: <IdentificationStep handleCreateTaskForDocument={handleCreateTaskForDocument} handleFileUploadSuccess={handleFileUploadSuccess} /> },
    { content: <PurchaseInfoStep handleCreateTaskForDocument={handleCreateTaskForDocument} handleFileUploadSuccess={handleFileUploadSuccess} /> },
    { content: <VehicleDocumentsStep handleCreateTaskForDocument={handleCreateTaskForDocument} handleFileUploadSuccess={handleFileUploadSuccess} handleCreateTasksForAllMissing={handleCreateTasksForAllMissing} /> },
    { content: <ComplianceStep handleCreateTaskForDocument={handleCreateTaskForDocument} handleFileUploadSuccess={handleFileUploadSuccess} /> },
    { content: <TyreStep /> },
    { content: <ReviewSubmitStep /> },
  ]

  const isLastStep = currentStep === steps.length - 1
  const meta = STEP_META[currentStep]

  return (
    <TooltipProvider>
      <div className="max-w-7xl h-[500px] flex flex-col">

        {/* ── Step tabs ── */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b bg-card/60 backdrop-blur-md">
          <StepperTabs labels={STEP_META.map((s) => s.label)} />
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-5 mb-10">
            {/* Step header */}
            <div>
              <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
            </div>

            {/* Step content */}
            {steps[currentStep].content}
          </div>
        </div>

        {/* ── Footer navigation ── */}
        <div className="flex-shrink-0 fixed bottom-0 z-20 w-[96%] border-t bg-card/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            {/* Left — Back + Reset */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 0 || submitLoading}
                className="h-10 px-4 rounded-xl gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={() => dispatch(resetForm())}
                disabled={submitLoading}
                className="h-10 px-3 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </div>

            {/* Center — step indicator */}
            <span className="text-xs font-medium text-muted-foreground select-none">
              Step {currentStep + 1} of {steps.length}
            </span>

            {/* Right — Next / Submit */}
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="h-10 px-6 rounded-xl font-semibold gap-2"
              >
                {submitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Car className="h-4 w-4" />
                )}
                Create Vehicle
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={submitLoading || sitesLoading || vehicleTypesLoading}
                className="h-10 px-6 rounded-xl font-semibold gap-1.5"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <CreateTaskDialog
        isOpen={showTaskDialog}
        onClose={() => dispatch(setShowTaskDialog(false))}
        onTaskCreated={() => {
          toast.success("Task created successfully")
          dispatch(setShowTaskDialog(false))
        }}
        prefill={taskPrefillData}
      />
    </TooltipProvider>
  )
}

export default function VehiclesStepper({ onClose }: { onClose?: () => void }) {
  return (
    <Provider store={store}>
      <Stepper totalSteps={STEP_META.length} initialStep={0}>
        <AddVehicleStepperForm onClose={onClose} />
      </Stepper>
    </Provider>
  )
}
