
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
import TaskStep from "./PmiExpiry/TaskStep";
import TaskConfirmationStep from "./PmiExpiry/TaskConfirmationStep";
import BrakeUploadStep from "./PmiExpiry/BrakeUploadStep";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

const InspectionDialog: React.FC<PMIDialogProps> = ({
  open,
  onClose,
  lastPMIDate,
  vehicleId,
  vehicleRegistration,
  username,
  onUpdateSuccess,
}) => {
  const cookies = useCookies();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [state, setState] = useState<State>({
    currentInspectionDate: lastPMIDate, // Initialize from prop
    newInspectionDate: lastPMIDate, // For API payload
    step: "initial",
    stepHistory: [],
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
    hasChanges: false,
  });

  const {
    currentInspectionDate,
    newInspectionDate,
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
      currentInspectionDate: lastPMIDate,
      newInspectionDate: lastPMIDate,
      step: "initial",
      stepHistory: [],
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
      hasChanges: false,
    });
  };

  const handleClose = () => {
    if (state.hasChanges && onUpdateSuccess) {
      onUpdateSuccess();
    }
    resetState();
    onClose();
  };

  const handleInitialSubmit = async () => {
    if (!newInspectionDate) {
      toast({ title: "Error", description: "Please select Last PMI expiration date", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ last_pmi_date: newInspectionDate }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update inspection date: ${response.statusText}`);
      }

      toast({
        title: "Success",
        description: "Inspection date updated successfully",
      });
      setState(prev => ({ ...prev, hasChanges: true, step: "upload" }));
    } catch (error) {
      console.error("Error updating inspection date:", error);
      toast({
        title: "Error",
        description: "Failed to update inspection date. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (url: string, type: "certificate" | "interim") => {
    const documentTypeId = type === "certificate" ? 16 : 17;
    const title = type === "certificate" ? "PMI Certificate" : "Interiam PMI Certificate";
    
    try {
      const payload = {
        vehicle_id: vehicleId,
        documents: [
          {
            document_type: documentTypeId,
            title: title,
            url: url,
            expiry_date: null,
          }
        ]
      };

      const response = await fetch(`${API_URL}/api/documents/documents/vehicle-bulk/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast({ 
        title: "Error", 
        description: `Failed to save ${title} to compliance records`, 
        variant: "destructive" 
      });
    }
  };

  const handleUploadSuccess = (url: string, type: "certificate" | "interim" | "brake") => {
    setState((prev) => ({
      ...prev,
      [type === "interim" ? "interimCertificate" : "documentUrl"]: url,
      hasChanges: true,
    }));

    toast({
      title: "Success",
      description: `${type === "interim" ? "Interiam PMI" : type === "brake" ? "Brake Test" : "PMI"} certificate uploaded successfully`,
    });
  };

  const handleCertificateUpload = async () => {
    if (!documentUrl) {
      toast({ title: "Error", description: "Please upload a certificate first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    await handleDocumentUpload(documentUrl, "certificate");
    setIsLoading(false);
    setStep("brakeTest");
  };

  const handleFHPMISubmit = () => {
    setStep("fhPMIOpen");
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
    setStep("driverPMIOpen");
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

  const handleInterimUpload = async () => {
    if (!interimCertificate) {
      toast({ title: "Error", description: "Please upload an interim certificate", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    await handleDocumentUpload(interimCertificate, "interim");
    setIsLoading(false);
    delayAndProceed("taskStep", "Interiam PMI Certificate saved with date and time stamp");
  };

  const setStep = (nextStep: StepType) => {
    setState((prev) => ({
      ...prev,
      step: nextStep,
      stepHistory: [...prev.stepHistory, prev.step],
    }));
  };

  const handleBack = () => {
    setState((prev) => {
      if (prev.stepHistory.length === 0) return prev;
      const newHistory = [...prev.stepHistory];
      const previousStep = newHistory.pop()!;
      return {
        ...prev,
        step: previousStep,
        stepHistory: newHistory,
      };
    });
  };

  const handleTaskSuccess = () => {
    setState(prev => ({ ...prev, hasChanges: true, step: "taskConfirmation" }));
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
      ? `${new Date().toISOString().split("T")[0]}_PMI_${vehicleRegistration}`
      : `${new Date().toISOString().split("T")[0]}_Brake Re-test Certificate_${vehicleRegistration}`;
    toast({
      title: "Success",
      description: `${type === "pmi" ? "PMI" : "Brake Test"} certificate saved as ${filename}`,
    });
    setState((prev) => ({ ...prev, hasChanges: true, step: "fhPMI" }));
  };

  const delayAndProceed = (nextStep: StepType, message?: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, isLoading: false }));
      setStep(nextStep);
      if (message) {
        toast({ title: "Success", description: message });
      }
    }, 2000);
  };

  const stepDescriptions: Record<StepType, string> = {
    initial: "Please update the Last PMI Date.",
    upload: "Upload Last PMI certificate.",
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
    interimUpload: "Please upload the Interiam PMI Certificate.",
    taskStep: `Please set a task to upload the PMI Certificate for ${vehicleRegistration}.`,
    brakeTaskStep: `Please set a task to rebook the brake test for ${vehicleRegistration}.`,
    taskConfirmation: `Task saved for ${vehicleRegistration}.`,
    brakeUpload: "Please upload the new Brake Test Certificate.",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                vehicleId={vehicleId}
                currentInspectionDate={currentInspectionDate}
                setNewInspectionDate={(value) =>
                  setState((prev) => ({ ...prev, newInspectionDate: value }))
                }
                setStep={setStep}
              />
            )}
            {step === "upload" && (
              <UploadStep
                handleUploadSuccess={handleUploadSuccess}
                handleCertificateUpload={handleCertificateUpload}
                setStep={setStep}
                documentUrl={documentUrl}
                isLoading={isLoading}
              />
            )}
            {step === "brakeTest" && (
              <BrakeTestStep
                setBrakeTestPassed={(value) => setState((prev) => ({ ...prev, brakeTestPassed: value }))}
                setStep={setStep}
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
                setMaintenanceCorrect={(value) => setState((prev) => ({ ...prev, maintenanceCorrect: value }))}
                setStep={setStep}
              />
            )}
            {step === "notes" && (
              <NotesStep
                notes={notes}
                setNotes={(value) => setState((prev) => ({ ...prev, notes: value }))}
                handleNotesSubmit={handleNotesSubmit}
                isLoading={isLoading}
              />
            )}
            {step === "mechanicJob" && (
              <MechanicJobStep
                createMechanicJob={createMechanicJob}
                setCreateMechanicJob={(value) => setState((prev) => ({ ...prev, createMechanicJob: value }))}
                setStep={setStep}
              />
            )}
            {step === "mechanicJobForm" && (
              <MechanicJobFormStep
                vehicleRegistration={vehicleRegistration}
                username={username}
                vehicleStatus={vehicleStatus}
                setVehicleStatus={(value) => setState((prev) => ({ ...prev, vehicleStatus: value as State["vehicleStatus"] }))}
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
                setDriverErrors={(value) => setState((prev) => ({ ...prev, driverErrors: value }))}
                setStep={setStep}
              />
            )}
            {step === "driverTraining" && (
              <DriverTrainingStep
                selectedDrivers={selectedDrivers}
                setSelectedDrivers={(value) => setState((prev) => ({ ...prev, selectedDrivers: value }))}
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
            {(step === "taskStep" || step === "brakeTaskStep") && (
              <TaskStep
                step={step}
                vehicleRegistration={vehicleRegistration}
                reminderDateTime={state.reminderDateTime}
                setReminderDateTime={(value) => setState((prev) => ({ ...prev, reminderDateTime: value }))}
                onSuccess={handleTaskSuccess}
              />
            )}
            {step === "taskConfirmation" && (
              <TaskConfirmationStep
                vehicleRegistration={vehicleRegistration}
                reminderDateTime={state.reminderDateTime}
                taskType={state.stepHistory[state.stepHistory.length - 1] === "taskStep" ? "PMI certificate" : "brake test re-booking"}
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

          <DialogFooter className="mt-6 flex justify-between gap-3">
            <div>
              {state.stepHistory.length > 0 && step !== "taskConfirmation" && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {step === "initial" && (
                <Button onClick={handleInitialSubmit} disabled={isLoading} className="bg-[#F26633] hover:bg-[#D9552B] text-white">
                  {isLoading ? "Updating..." : "Next"}
                </Button>
              )}
              {step === "upload" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      toast({ title: "Upload Later", description: "Proceeding to interim upload process" });
                      setStep("interimUpload");
                    }}
                  >
                    Upload Later
                  </Button>
                  <Button 
                    onClick={handleCertificateUpload} 
                    disabled={isLoading || !documentUrl}
                    className="bg-[#F26633] hover:bg-[#D9552B] text-white"
                  >
                    {isLoading ? "Saving..." : "Next Step"}
                  </Button>
                </>
              )}
              {step === "interimUpload" && (
                <Button 
                  onClick={handleInterimUpload} 
                  disabled={isLoading || !interimCertificate}
                  className="bg-[#F26633] hover:bg-[#D9552B] text-white"
                >
                  {isLoading ? "Saving..." : "Submit Certificate"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default InspectionDialog;