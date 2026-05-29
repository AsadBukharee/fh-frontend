export interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_name: string;
  tyre_pressure_front_driver: string;
  tyre_pressure_front_passenger: string;
  tyre_pressure_rear_outer_driver: string;
  tyre_pressure_rear_outer_passenger: string;
  tyre_depth_front_driver: string;
  tyre_depth_front_passenger: string;
  tyre_depth_rear_outer_driver: string;
  tyre_depth_rear_outer_passenger: string;
  tyre_expiry_front_driver: string;
  tyre_expiry_front_passenger: string;
  tyre_expiry_rear_outer_driver: string;
  tyre_expiry_rear_outer_passenger: string;
  tyre_torque_front_driver: string;
  tyre_torque_front_passenger: string;
  tyre_torque_rear_outer_driver: string;
  tyre_torque_rear_outer_passenger: string;
  warnings: string[];
  vehicle_status: string;
  is_roadworthy: boolean;
  last_milage: string;
  inspection_cycle: number;
  last_pmi_date: string;
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
}

export interface FormData {
  analysis_date: string;
  vehicle: number | string;
  defects: string;
  notes: string;
  status: string;
  file_url: string;
  Correct_DTP_Code_Used: string;
  brake_imbalance: string;
  brake_imbalance_note: string;
  brake_test_not_recorded: string;
  brake_test_report_attached: string;
  maintenance_error_answer: string;
  maintenance_error_note: string;
  maintenence_provider_error: string;
  tyre_pressure: Record<string, number | string>;
  tyre_depth: Record<string, number | string>;
  tyre_date: Record<string, string>;
  tyre_torque: Record<string, number | string>;
}

export interface FormErrors {
  analysis_date?: string;
  vehicle?: string;
  status?: string;
  file_url?: string;
  tyre_pressure?: Record<string, string>;
  tyre_depth?: Record<string, string>;
  tyre_date?: Record<string, string>;
  tyre_torque?: Record<string, string>;
}
