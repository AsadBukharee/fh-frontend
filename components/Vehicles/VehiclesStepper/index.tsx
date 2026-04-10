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
import { type VehicleFormData, type ValidationErrors, TYRE_DEFAULTS } from "./types"
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
  vehicleId?: number
}

function AddVehicleStepperForm({ onClose, vehicleId }: AddVehicleStepperFormProps) {
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
        const promises: Promise<Response>[] = [
          fetch(`${API_URL}/api/sites/list-names/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/vehicle-types/`, { headers: { Authorization: `Bearer ${token}` } }),
        ]

        if (vehicleId) {
          promises.push(
            fetch(`${API_URL}/api/vehicles/${vehicleId}/`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/api/documents/documents/by-entity/vehicle/${vehicleId}/`, { headers: { Authorization: `Bearer ${token}` } })
          )
        }

        const responses = await Promise.all(promises)
        const sitesData = await responses[0].json()
        const typesData = await responses[1].json()

        if (sitesData.success) dispatch(setSites(sitesData.data))
        if (typesData.success) dispatch(setVehicleTypes(typesData.data))

        if (vehicleId && responses[2]) {
          const vehicleResponse = await responses[2].json()
          if (vehicleResponse.success) {
            const vData = vehicleResponse.data
            
            const mappedData: Partial<VehicleFormData> = {
              vin: vData.vin || "",
              vehicle_type: vData.vehicle_type?.id || 0,
              site_allocated: vData.site_allocated?.map((s: any) => s.id) || [],
              registration_number: vData.registration_number || "",
              make: vData.make || "",
              model: vData.model || "",
              vehicle_picture: vData.vehicle_picture || "",
              number_of_seats: vData.number_of_seats || null,
              mileage_unit: vData.mileage_unit || "miles",
              notes: vData.notes || "",
              is_tacho_fitted: vData.is_tacho_fitted || false,
              is_wheelchair_lift_fitted: vData.is_wheelchair_lift_fitted || false,
              date_of_purchase: vData.date_of_purchase || "",
              purchased_from: vData.purchased_from || "",
              purchased_by: vData.purchased_by || "",
              price: vData.price || "",
              purchase_mileage: vData.purchase_mileage || "",
              has_vat: vData.has_vat || false,
              vat_amount: vData.vat_amount || "",
              last_pmi_date: vData.last_pmi_date || "",
              pmi_cycle: vData.pmi_cycle || null,
              vehicle_status: vData.vehicle_status || "available",
              vehicle_roadworthy_status: vData.vehicle_roadworthy_status || "no_defect",
              is_roadworthy: vData.is_roadworthy ?? true,
              is_active: vData.is_active ?? true,
              is_assigned: vData.is_assigned || false,
              last_mileage: vData.last_mileage || "",
              mot_expiry: vData.mot_expiry || "",
              insurance_expiry: vData.insurance_expiry || "",
              tax_expiry: vData.tax_expiry || "",
              last_tyre_maintenance_check_date: vData.last_tyre_maintenance_check_date || "",
              loller_test_expiry_date: vData.loller_test_expiry_date || "",
              loller_docs: vData.loller_docs || "",
              tacho_calibration_expiry: vData.tacho_calibration_expiry || "",
              last_tacho_download_date: vData.last_tacho_download_date || "",
              last_tacho_download_docs: vData.last_tacho_download_docs || "",
              last_valet_check_date: vData.last_valet_check_date || "",
              last_valet_check_docs: vData.last_valet_check_docs || "",
              last_equipment_check_date: vData.last_equipment_check_date || "",
              equipment_docs: vData.equipment_docs || "",
              tyre_expiry_front_driver: vData.tyre_expiry_front_driver || TYRE_DEFAULTS.expiry,
              tyre_expiry_front_passenger: vData.tyre_expiry_front_passenger || TYRE_DEFAULTS.expiry,
              tyre_expiry_rear_inner_driver: vData.tyre_expiry_rear_inner_driver || TYRE_DEFAULTS.expiry,
              tyre_expiry_rear_inner_passenger: vData.tyre_expiry_rear_inner_passenger || TYRE_DEFAULTS.expiry,
              tyre_expiry_rear_outer_driver: vData.tyre_expiry_rear_outer_driver || TYRE_DEFAULTS.expiry,
              tyre_expiry_rear_outer_passenger: vData.tyre_expiry_rear_outer_passenger || TYRE_DEFAULTS.expiry,
              tyre_depth_front_driver: vData.tyre_depth_front_driver || TYRE_DEFAULTS.depth,
              tyre_depth_front_passenger: vData.tyre_depth_front_passenger || TYRE_DEFAULTS.depth,
              tyre_depth_rear_inner_driver: vData.tyre_depth_rear_inner_driver || TYRE_DEFAULTS.depth,
              tyre_depth_rear_inner_passenger: vData.tyre_depth_rear_inner_passenger || TYRE_DEFAULTS.depth,
              tyre_depth_rear_outer_driver: vData.tyre_depth_rear_outer_driver || TYRE_DEFAULTS.depth,
              tyre_depth_rear_outer_passenger: vData.tyre_depth_rear_outer_passenger || TYRE_DEFAULTS.depth,
              tyre_pressure_front_driver: vData.tyre_pressure_front_driver || TYRE_DEFAULTS.frontPressure,
              tyre_pressure_front_passenger: vData.tyre_pressure_front_passenger || TYRE_DEFAULTS.frontPressure,
              tyre_pressure_rear_inner_driver: vData.tyre_pressure_rear_inner_driver || TYRE_DEFAULTS.rearPressure,
              tyre_pressure_rear_inner_passenger: vData.tyre_pressure_rear_inner_passenger || TYRE_DEFAULTS.rearPressure,
              tyre_pressure_rear_outer_driver: vData.tyre_pressure_rear_outer_driver || TYRE_DEFAULTS.rearPressure,
              tyre_pressure_rear_outer_passenger: vData.tyre_pressure_rear_outer_passenger || TYRE_DEFAULTS.rearPressure,
              tyre_torque_front_driver: vData.tyre_torque_front_driver || TYRE_DEFAULTS.torque,
              tyre_torque_front_passenger: vData.tyre_torque_front_passenger || TYRE_DEFAULTS.torque,
              tyre_torque_rear_outer_driver: vData.tyre_torque_rear_outer_driver || TYRE_DEFAULTS.torque,
              tyre_torque_rear_outer_passenger: vData.tyre_torque_rear_outer_passenger || TYRE_DEFAULTS.torque,
            }

            // Process documents from the vehicles endpoint if any
            let docsToProcess: any[] = []
            if (vData.documents && Array.isArray(vData.documents)) {
              docsToProcess = [...vData.documents]
            }

            // Also map from the specific documents endpoint if fetched
            if (responses[3]) {
              const docsResponse = await responses[3].json()
              if (docsResponse.success && docsResponse.data?.documents && Array.isArray(docsResponse.data.documents)) {
                 docsToProcess = [...docsToProcess, ...docsResponse.data.documents]
              } else if (Array.isArray(docsResponse)) {
                 docsToProcess = [...docsToProcess, ...docsResponse]
              }
            }

            // Map documents returning objects into URL strings (based on document_type.code)
            if (docsToProcess.length > 0) {
              docsToProcess.forEach((doc: any) => {
                if (doc.document_type?.code) {
                  const validDocFields = [
                    "vehicle_invoice_docs", "mot_check_docs", "pmi_inspection_docs", "others_docs",
                    "tacho_calibration_docs", "tax_docs", "insurance_docs", "service_records_docs",
                    "new_vehicle_checklist_docs", "logbook_docs", "COIF_technical_docs",
                    "loller_docs", "last_tacho_download_docs", "last_valet_check_docs", "equipment_docs"
                  ];
                  if (validDocFields.includes(doc.document_type.code) && doc.url) {
                    (mappedData as any)[doc.document_type.code] = doc.url
                  }
                }
              })
            }

            dispatch(setFormData(mappedData))
          }
        }
      } catch {
        toast.error("Failed to load initial data")
      } finally {
        dispatch(setSitesLoading(false))
        dispatch(setVehicleTypesLoading(false))
      }
    }
    fetchData()
  }, [dispatch, cookies, vehicleId])

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

    // Convert empty strings to null to avoid API errors for optional fields
    Object.keys(submissionData).forEach(key => {
      if ((submissionData as any)[key] === "") {
        (submissionData as any)[key] = null
      }
    })

    try {
      const isEditing = !!vehicleId
      const url = isEditing ? `${API_URL}/api/vehicles/${vehicleId}/` : `${API_URL}/api/vehicles/`
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(submissionData),
      })
      if (response.ok) {
        toast.success(isEditing ? "Vehicle updated successfully" : "Vehicle created successfully")
        dispatch(resetForm())
        onClose?.()
      } else {
        const data = await response.json()
        toast.error(data.message || (isEditing ? "Failed to update vehicle" : "Failed to create vehicle"))
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
      <div className="w-full max-w-7xl mx-auto flex flex-col h-[calc(90vh-120px)] min-h-[500px] relative">

        {/* ── Step tabs ── */}
        <div className="flex-shrink-0 px-6 pt-2 pb-4 border-b bg-card/60 backdrop-blur-md">
          <StepperTabs labels={STEP_META.map((s) => s.label)} />
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-5">
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
        <div className="flex-shrink-0 sticky bottom-0 z-20 w-full border-t bg-card/80 backdrop-blur-xl mt-auto">
          <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-4">
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
                {vehicleId ? "Update Vehicle" : "Create Vehicle"}
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

export default function VehiclesStepper({ onClose, vehicleId }: { onClose?: () => void; vehicleId?: number }) {
  return (
    <Provider store={store}>
      <Stepper totalSteps={STEP_META.length} initialStep={0}>
        <AddVehicleStepperForm onClose={onClose} vehicleId={vehicleId} />
      </Stepper>
    </Provider>
  )
}
