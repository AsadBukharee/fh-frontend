import { TYRE_SPECS, type ValidationErrors, type VehicleFormData, type DocumentInfo } from "./types"

export const DOCUMENT_CONFIG: Record<string, DocumentInfo> = {
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
  last_tacho_download_docs: {
    field: "last_tacho_download_docs",
    label: "Last Tacho Download Documents",
    description: "Tachograph download records and reports",
    priority: "medium",
    deadlineDays: 5,
    estimatedHours: 1,
  },
  last_valet_check_docs: {
    field: "last_valet_check_docs",
    label: "Valet Check Documents",
    description: "Valet check reports and records",
    priority: "low",
    deadlineDays: 7,
    estimatedHours: 0.5,
  },
  equipment_docs: {
    field: "equipment_docs",
    label: "Equipment Check Documents",
    description: "Equipment inspection reports",
    priority: "medium",
    deadlineDays: 5,
    estimatedHours: 1,
  },
}

export const validateTyreExpiry = (value: string): string | null => {
  if (!value) return "Required"
  const pattern = /^\d{4}$/
  if (!pattern.test(value)) {
    return "Must be exactly 4 digits in WWYY format (e.g., '0124')"
  }
  const week = parseInt(value.substring(0, 2))
  if (week < 1 || week > 53) {
    return "Week must be between 01 and 53"
  }
  return null
}

export const validateRegistrationNumber = (value: string): string | null => {
  if (!value.trim()) {
    return "Registration number is required"
  }
  return null
}

export const validateRequiredString = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`
  }
  return null
}

export const validateRequiredArray = (value: any[], fieldName: string): string | null => {
  if (!value || value.length === 0) {
    return `${fieldName} is required`
  }
  return null
}

export const validateTyreDepth = (value: string, fieldName: string): string | null => {
  if (!value) return `${fieldName} is required`
  if (value.toUpperCase() === "NV") return null
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return `${fieldName} must be a valid number or "NV"`
  if (numValue < 1.6) {
    return `${fieldName} must be at least 1.6 mm or "NV"`
  }
  return null
}

export const validateDateFormat = (value: string, fieldName: string): string | null => {
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

export const validateTyrePressure = (value: number | null, fieldLabel: string): string | null => {
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

export const validateTyreTorque = (value: number | null, fieldLabel: string): string | null => {
  if (value === null || value === undefined) return `${fieldLabel} is required.`
  if (value < TYRE_SPECS.torqueMin || value > TYRE_SPECS.torqueMax)
    return `${fieldLabel} must be ${TYRE_SPECS.torqueMin}–${TYRE_SPECS.torqueMax} Nm.`
  return null
}

export const getMissingDocuments = (formData: VehicleFormData): DocumentInfo[] => {
  const missing: DocumentInfo[] = []
  Object.keys(DOCUMENT_CONFIG).forEach((field) => {
    const config = DOCUMENT_CONFIG[field]
    const value = (formData as any)[field] as string
    let isRequired = false

    if (["vehicle_picture", "new_vehicle_checklist_docs", "logbook_docs", "COIF_technical_docs", "vehicle_invoice_docs"].includes(field)) {
      isRequired = true
    }
    if (field === "pmi_inspection_docs" && formData.last_pmi_date) isRequired = true
    if (field === "mot_check_docs" && formData.mot_expiry) isRequired = true
    if (field === "insurance_docs" && formData.insurance_expiry) isRequired = true
    if (field === "tax_docs" && formData.tax_expiry) isRequired = true
    if (field === "tacho_calibration_docs" && formData.is_tacho_fitted && formData.tacho_calibration_expiry) isRequired = true
    if (field === "last_tacho_download_docs" && formData.is_tacho_fitted && formData.last_tacho_download_date) isRequired = true
    if (field === "loller_docs" && formData.is_wheelchair_lift_fitted && formData.loller_test_expiry_date) isRequired = true
    if (field === "last_valet_check_docs" && formData.last_valet_check_date) isRequired = true
    if (field === "equipment_docs" && formData.last_equipment_check_date) isRequired = true

    if (isRequired && !value) missing.push(config)
  })
  return missing
}

export const areAllDocumentsUploaded = (formData: VehicleFormData): boolean => {
  return getMissingDocuments(formData).length === 0
}

export const areDateDocumentsUploaded = (formData: VehicleFormData): boolean => {
    const requiredDateFields = [
      { date: formData.mot_expiry, doc: formData.mot_check_docs },
      { date: formData.insurance_expiry, doc: formData.insurance_docs },
      { date: formData.tax_expiry, doc: formData.tax_docs },
      { date: formData.last_pmi_date, doc: formData.pmi_inspection_docs },
    ]
    for (const { date, doc } of requiredDateFields) {
      if (date && !doc) return false
    }
    if (formData.is_tacho_fitted) {
      if (formData.tacho_calibration_expiry && !formData.tacho_calibration_docs) return false
      if (formData.last_tacho_download_date && !formData.last_tacho_download_docs) return false
    }
    if (formData.is_wheelchair_lift_fitted) {
      if (formData.loller_test_expiry_date && !formData.loller_docs) return false
    }
    if (formData.last_valet_check_date && !formData.last_valet_check_docs) return false
    if (formData.last_equipment_check_date && !formData.equipment_docs) return false
    return true
}
