import * as React from "react"

export interface Site {
  id: number
  name: string
}

export interface VehicleType {
  id: number
  name: string
  description?: string
}

export interface ValidationErrors {
  [key: string]: string
}

export interface DocumentInfo {
  field: string
  label: string
  description?: string
  priority: "urgent" | "high" | "medium" | "low"
  deadlineDays: number
  estimatedHours: number
}

export interface VehicleFormData {
  // ===== IDENTIFICATION =====
  vin: string
  vehicle_type: number
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

  // ===== PMI =====
  last_pmi_date: string
  pmi_cycle: number | null

  // ===== STATUS =====
  vehicle_status: "available" | "unavailable" | "assigned" | "disabled"
  vehicle_roadworthy_status: "no_defect" | "minor_defect_roadworthy" | "minor_defect_not_roadworthy" | "major_defect_not_roadworthy"
  is_roadworthy: boolean
  is_active: boolean
  is_assigned: boolean
  last_mileage: string

  // ===== MOT / INSURANCE / TAX =====
  mot_expiry: string
  insurance_expiry: string
  tax_expiry: string
  last_tyre_maintenance_check_date: string

  // ===== LOLLER =====
  loller_test_expiry_date: string
  loller_docs: string

  // ===== TACHOGRAPH =====
  tacho_calibration_expiry: string
  last_tacho_download_date: string
  last_tacho_download_docs: string

  // ===== OTHER CHECKS =====
  last_valet_check_date: string
  last_valet_check_docs: string
  last_equipment_check_date: string
  equipment_docs: string

  // ===== TYRE EXPIRY (WWYY format) =====
  tyre_expiry_front_driver: string
  tyre_expiry_front_passenger: string
  tyre_expiry_rear_inner_driver: string
  tyre_expiry_rear_inner_passenger: string
  tyre_expiry_rear_outer_driver: string
  tyre_expiry_rear_outer_passenger: string

  // ===== TYRE DEPTH (MM) =====
  tyre_depth_front_driver: string
  tyre_depth_front_passenger: string
  tyre_depth_rear_inner_driver: string
  tyre_depth_rear_inner_passenger: string
  tyre_depth_rear_outer_driver: string
  tyre_depth_rear_outer_passenger: string

  // ===== TYRE PRESSURE (PSI) =====
  tyre_pressure_front_driver: number | null
  tyre_pressure_front_passenger: number | null
  tyre_pressure_rear_inner_driver: number | null
  tyre_pressure_rear_inner_passenger: number | null
  tyre_pressure_rear_outer_driver: number | null
  tyre_pressure_rear_outer_passenger: number | null

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
  insurance_docs: string
  service_records_docs: string
  new_vehicle_checklist_docs: string
  logbook_docs: string
  COIF_technical_docs: string
}

export interface VehicleState {
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

export const TYRE_DEFAULTS = {
  expiry: "0124",
  depth: "3.5",
  frontPressure: 67,
  rearPressure: 57,
  torque: 205,
}

export const TYRE_SPECS = {
  torqueMin: 200,
  torqueMax: 210,
  frontMin: 65,
  frontMax: 68,
  rearMin: 56,
  rearMax: 58,
}
