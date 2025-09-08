export type StepType =
  | "initial"
  | "upload"
  | "brakeTest"
  | "fhPMI"
  | "fhPMIOpen"
  | "maintenanceCheck"
  | "notes"
  | "mechanicJob"
  | "mechanicJobForm"
  | "driverPMI"
  | "driverPMIOpen"
  | "driverErrors"
  | "driverTraining"
  | "interimUpload"
  | "reminder"
  | "brakeReminder"
  | "reminderConfirmation" // Added new step
  | "brakeUpload";

export interface State {
  newPMIDate: string;
  step: StepType;
  documentUrl: string | null;
  isLoading: boolean;
  brakeTestPassed: boolean | null;
  maintenanceCorrect: boolean | null;
  notes: string;
  createMechanicJob: boolean | null;
  vehicleStatus: "Minor Defect Roadworthy" | "Minor Defect Unroadworthy" | "Major Defect Unroadworthy" | null;
  driverErrors: boolean | null;
  selectedDrivers: string[];
  reminderDateTime: string;
  interimCertificate: string | null;
}

export interface PMIDialogProps {
  open: boolean;
  onClose: () => void;
  lastPMIDate: string;
  vehicleId: number;
  vehicleRegistration: string;
  username: string;
  onUpdateSuccess?: () => void;
}