import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { PMIDialogProps, State, StepType } from "./PmiExpiry/types";
import InitialStep from "./PmiExpiry/InitialStep";
import UploadStep from "./PmiExpiry/UploadStep";
import BrakeTestStep from "./PmiExpiry/BrakeTestStep";
import FHPMIStep from "./PmiExpiry/FHPMIStep";
import FHPMIOpenStep from "./PmiExpiry/FHPMIOpenStep";
import MaintenanceCheckStep from "./PmiExpiry/MaintenanceCheckStep";
import NotesStep from "./PmiExpiry/NotesStep";
import MechanicJobStep from "./PmiExpiry/MechanicJobStep";
import MechanicJobFormStep from "./PmiExpiry/MechanicJobFormStep";
import DriverPMIStep from "./PmiExpiry/DriverPMIStep";
import DriverPMIOpenStep from "./PmiExpiry/DriverPMIOpenStep";
import DriverErrorsStep from "./PmiExpiry/DriverErrorsStep";
import DriverTrainingStep from "./PmiExpiry/DriverTrainingStep";
import InterimUploadStep from "./PmiExpiry/InterimUploadStep";
import ReminderStep from "./PmiExpiry/ReminderStep";
import ReminderConfirmationStep from "./PmiExpiry/ReminderConfirmationStep";
import BrakeUploadStep from "./PmiExpiry/BrakeUploadStep";

const InspectionDialog: React.FC<PMIDialogProps> = ({
  open,
  onClose,
  lastPMIDate,
  vehicleId,
  vehicleRegistration,
  username,
  onUpdateSuccess,
}) => {
  const [reminderDateTime, setReminderDateTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [state, setState] = useState<State>({
    newPMIDate: lastPMIDate,
    step: "initial",
    documentUrl: null,
    isLoading: false,
    brakeTestPassed: null,
    maintenanceCorrect: null,
    notes: "",
    createMechanicJob: null,
    vehicleStatus: null,
    driverErrors: null,
    selectedDrivers: [],
    reminderDateTime: "",
    interimCertificate: null,
  });

  const {
    newPMIDate,
    step,
    documentUrl,
   
    brakeTestPassed,
    maintenanceCorrect,
    notes,
    createMechanicJob,
    vehicleStatus,
    driverErrors,
    selectedDrivers,

    interimCertificate,
  } = state;

  const resetState = () => {
    setState({
      newPMIDate: lastPMIDate,
      step: "initial",
      documentUrl: null,
      isLoading: false,
      brakeTestPassed: null,
      maintenanceCorrect: null,
      notes: "",
      createMechanicJob: null,
      vehicleStatus: null,
      driverErrors: null,
      selectedDrivers: [],
      reminderDateTime: "",
      interimCertificate: null,
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleUploadSuccess = (url: string, type: "certificate" | "interim" | "brake") => {
    setState(prev => ({
      ...prev,
      [type === "interim" ? "interimCertificate" : "documentUrl"]: url,
    }));
    toast({
      title: "Success",
      description: `${type === "interim" ? "Interim PMI" : type === "brake" ? "Brake Test" : "PMI"} certificate uploaded successfully`,
    });
  };

  const delayAndProceed = (nextStep: StepType, message?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false, step: nextStep }));
      if (message) {
        toast({ title: "Success", description: message });
      }
    }, 2000);
  };

  const handleCertificateUpload = () => {
    if (!documentUrl) {
      toast({ title: "Error", description: "Please upload a certificate first", variant: "destructive" });
      return;
    }
    setState(prev => ({ ...prev, step: "brakeTest" }));
  };

  const handleFHPMISubmit = () => {
    setState(prev => ({ ...prev, step: "fhPMIOpen" }));
    toast({
      title: "Opening FH PMI Analysis",
      description: "Please fill out the form and click submit when complete.",
    });
  };

  const handleFHPMIComplete = () => {
    delayAndProceed("maintenanceCheck", "FH PMI Analysis submitted successfully");
  };

  const handleNotesSubmit = () => {
    if (!notes.trim()) {
      toast({ title: "Error", description: "Please provide notes describing the action taken", variant: "destructive" });
      return;
    }
    delayAndProceed("mechanicJob", "Notes saved successfully");
  };

  const handleMechanicJobSubmit = () => {
    if (!vehicleStatus) {
      toast({ title: "Error", description: "Please select vehicle status", variant: "destructive" });
      return;
    }
    delayAndProceed("driverPMI", "Mechanic job created successfully in job log");
  };

  const handleDriverPMISubmit = () => {
    setState(prev => ({ ...prev, step: "driverPMIOpen" }));
    toast({
      title: "Opening Driver PMI Analysis",
      description: "Please fill out the form and click submit when complete.",
    });
  };

  const handleDriverPMIComplete = () => {
    delayAndProceed("driverErrors", "Driver PMI Analysis submitted successfully");
  };

  const handleDriverTrainingSubmit = () => {
    if (!selectedDrivers.length) {
      toast({ title: "Error", description: "Please select at least one driver", variant: "destructive" });
      return;
    }
    delayAndProceed("interimUpload", "Training forms sent to drivers. Admin monitoring task and supervisor sign-off tasks created.");
  };

  const handleInterimUpload = () => {
    if (!interimCertificate) {
      toast({ title: "Error", description: "Please upload an interim certificate", variant: "destructive" });
      return;
    }
    delayAndProceed("reminder", "Interim PMI Sign Off certificate saved with date and time stamp");
  };

  const handleReminder = async (type: "pmi" | "brake", reminderType: string) => {
    setIsLoading(true);
    try {
      // Construct the API payload
      const payload = {
        title: `${reminderType} for ABC123`,
        description: `Reminder for ${reminderType} for vehicle ABC123`,
        priority: "medium",
        start_date: reminderDateTime.split("T")[0], // Extract date (e.g., "2025-08-31")
        recurrence: "daily",
        recurrence_interval: 1,
      };

      // Replace with your API host (set in .env)
      const apiUrl = `${process.env.REACT_APP_API_HOST}/api/reminders/`;

      // Make the API call
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if required, e.g.:
          // "Authorization": `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify(payload),
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Failed to save reminder: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Reminder saved successfully:", result);

      // Reset form and provide feedback
      setReminderDateTime("");
      alert("Reminder saved successfully!");
    } catch (error) {
      console.error("Error saving reminder:", error);
      alert("Failed to save reminder. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleFinalUpload = (type: "pmi" | "brake") => {
    if (!documentUrl) {
      toast({
        title: "Error",
        description: `Please upload ${type === "pmi" ? "PMI" : "Brake Test"} certificate`,
        variant: "destructive",
      });
      return;
    }
    const filename = type === "pmi"
      ? `${new Date().toISOString().split('T')[0]}_PMI_${vehicleRegistration}`
      : `${new Date().toISOString().split('T')[0]}_Brake Re-test Certificate_${vehicleRegistration}`;
    toast({
      title: "Success",
      description: `${type === "pmi" ? "PMI" : "Brake Test"} certificate saved as ${filename}`,
    });
    setState(prev => ({ ...prev, step: "fhPMI" }));
    if (onUpdateSuccess) onUpdateSuccess();
  };

  const stepDescriptions: Record<StepType, string> = {
    initial: "Please update the Last PMI Date.",
    upload: "System asks user to upload new PMI certificate.",
    brakeTest: "Did the vehicle pass the brake test?",
    fhPMI: "The FH PMI Analysis will now be opened for you to fill out and complete.",
    fhPMIOpen: "Please fill out the FH PMI Analysis form and click submit when complete.",
    maintenanceCheck: "Did the maintenance provider complete the PMI sheet correctly?",
    notes: "Have you left a note in the notes section, describing the action taken to notify the maintenance provider?",
    mechanicJob: "Do you need to create a job for the mechanic?",
    mechanicJobForm: "Please update the vehicle status and submit the mechanic job.",
    driverPMI: "The Driver PMI Analysis will now be opened for you to fill out and complete.",
    driverPMIOpen: "Please fill out the Driver PMI Analysis form and click submit when complete.",
    driverErrors: "Did any driver or drivers make any errors?",
    driverTraining: "Please select the drivers who need walkaround failure training.",
    interimUpload: "Please upload the Interim PMI Sign Off certificate.",
    reminder: `Please set a reminder to upload the PMI Certificate for ${vehicleRegistration}.`,
    brakeReminder: `Please set a reminder to rebook the brake test for ${vehicleRegistration}.`,
    reminderConfirmation: `Reminder saved for ${vehicleRegistration}.`, // Added description for new step
    brakeUpload: "Please upload the new Brake Test Certificate.",
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogContent className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400 max-w-2xl max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-yellow-800">
              PMI Process - {vehicleRegistration}
            </DialogTitle>
            <DialogDescription className="text-yellow-700">
              {stepDescriptions[step]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {step === "initial" && (
              <InitialStep
                newPMIDate={newPMIDate}
                setNewPMIDate={(value) => setState(prev => ({ ...prev, newPMIDate: value }))}
                lastPMIDate={lastPMIDate}
                setStep={(value) => setState(prev => ({ ...prev, step: value }))}
              />
            )}
            {step === "upload" && (
              <UploadStep
                handleUploadSuccess={handleUploadSuccess}
                setStep={(value) => setState(prev => ({ ...prev, step: value }))}
              />
            )}
            {step === "brakeTest" && (
              <BrakeTestStep
                setBrakeTestPassed={(value) => setState(prev => ({ ...prev, brakeTestPassed: value }))}
                setStep={(value) => setState(prev => ({ ...prev, step: value }))}
              />
            )}
            {step === "fhPMI" && (
              <FHPMIStep
                handleFHPMISubmit={handleFHPMISubmit}
                isLoading={isLoading}
              />
            )}
            {step === "fhPMIOpen" && (
              <FHPMIOpenStep
                vehicleRegistration={vehicleRegistration}
                username={username}
                handleFHPMIComplete={handleFHPMIComplete}
              />
            )}
            {step === "maintenanceCheck" && (
              <MaintenanceCheckStep
                setMaintenanceCorrect={(value) => setState(prev => ({ ...prev, maintenanceCorrect: value }))}
                setStep={(value) => setState(prev => ({ ...prev, step: value }))}
              />
            )}
            {step === "notes" && (
              <NotesStep
                notes={notes}
                setNotes={(value) => setState(prev => ({ ...prev, notes: value }))}
                handleNotesSubmit={handleNotesSubmit}
                isLoading={isLoading}
              />
            )}
            {step === "mechanicJob" && (
              <MechanicJobStep
                createMechanicJob={createMechanicJob}
                setCreateMechanicJob={(value) => setState(prev => ({ ...prev, createMechanicJob: value }))}
                setStep={(value) => setState(prev => ({ ...prev, step: value }))}
              />
            )}
            {step === "mechanicJobForm" && (
              <MechanicJobFormStep
                vehicleRegistration={vehicleRegistration}
                username={username}
                vehicleStatus={vehicleStatus}
                setVehicleStatus={(value) => setState(prev => ({ ...prev, vehicleStatus: value as State["vehicleStatus"] }))}
                handleMechanicJobSubmit={handleMechanicJobSubmit}
                isLoading={isLoading}
              />
            )}
            {step === "driverPMI" && (
              <DriverPMIStep
                handleDriverPMISubmit={handleDriverPMISubmit}
                isLoading={isLoading}
              />
            )}
            {step === "driverPMIOpen" && (
              <DriverPMIOpenStep
                vehicleRegistration={vehicleRegistration}
                username={username}
                handleDriverPMIComplete={handleDriverPMIComplete}
              />
            )}
            {step === "driverErrors" && (
              <DriverErrorsStep
                driverErrors={driverErrors}
                setDriverErrors={(value) => setState(prev => ({ ...prev, driverErrors: value }))}
                setStep={(value) => setState(prev => ({ ...prev, step: value }))}
              />
            )}
            {step === "driverTraining" && (
              <DriverTrainingStep
                selectedDrivers={selectedDrivers}
                setSelectedDrivers={(value) => setState(prev => ({ ...prev, selectedDrivers: value }))}
                handleDriverTrainingSubmit={handleDriverTrainingSubmit}
                isLoading={isLoading}
              />
            )}
            {step === "interimUpload" && (
              <InterimUploadStep
                handleUploadSuccess={handleUploadSuccess}
                handleInterimUpload={handleInterimUpload}
                interimCertificate={interimCertificate}
                isLoading={isLoading}
              />
            )}
            {(step === "reminder" || step === "brakeReminder") && (
           <ReminderStep
        step="reminder"
        vehicleRegistration="ABC123"
        reminderDateTime={reminderDateTime}
        setReminderDateTime={setReminderDateTime}
        
      />
            )}
            {step === "reminderConfirmation" && (
              <ReminderConfirmationStep
                vehicleRegistration={vehicleRegistration}
                reminderDateTime={reminderDateTime}
                reminderType={step === "reminderConfirmation" ? "PMI certificate" : "brake test re-booking"}
                handleClose={handleClose}
              />
            )}
            {step === "brakeUpload" && (
              <BrakeUploadStep
                handleUploadSuccess={handleUploadSuccess}
                handleFinalUpload={handleFinalUpload}
                documentUrl={documentUrl}
                isLoading={isLoading}
              />
            )}
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === "upload" && (
              <Button onClick={handleCertificateUpload} disabled={isLoading || !documentUrl}>
                {isLoading ? "Processing..." : "Submit Certificate"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default InspectionDialog;