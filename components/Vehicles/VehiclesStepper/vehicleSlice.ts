import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { type VehicleState, type VehicleFormData, TYRE_DEFAULTS, type ValidationErrors, type Site, type VehicleType } from "./types"

const initialState: VehicleState = {
  formData: {
    // ===== IDENTIFICATION =====
    vin: "",
    vehicle_type: 0,
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

    // ===== PMI =====
    last_pmi_date: "",
    pmi_cycle: null,

    // ===== STATUS =====
    vehicle_status: "available",
    vehicle_roadworthy_status: "no_defect",
    is_roadworthy: true,
    is_active: true,
    is_assigned: false,
    last_mileage: "",

    // ===== MOT / INSURANCE / TAX =====
    mot_expiry: "",
    insurance_expiry: "",
    tax_expiry: "",
    last_tyre_maintenance_check_date: "",

    // ===== LOLLER =====
    loller_test_expiry_date: "",
    loller_docs: "",

    // ===== TACHOGRAPH =====
    tacho_calibration_expiry: "",
    last_tacho_download_date: "",
    last_tacho_download_docs: "",

    // ===== OTHER CHECKS =====
    last_valet_check_date: "",
    last_valet_check_docs: "",
    last_equipment_check_date: "",
    equipment_docs: "",

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

export default vehicleSlice.reducer
