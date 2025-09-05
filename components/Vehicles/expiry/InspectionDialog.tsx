// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
//   DialogOverlay,
//   DialogPortal,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "@/components/ui/use-toast";
// import FileUploader from "@/components/Media/MediaUpload";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";

// interface PMIDialogProps {
//   open: boolean;
//   onClose: () => void;
//   lastPMIDate: string;
//   vehicleId: number;
//   vehicleRegistration: string;
//   username: string;
//   onUpdateSuccess?: () => void;
// }

// const InspectionDialog: React.FC<PMIDialogProps> = ({
//   open,
//   onClose,
//   lastPMIDate,
//   vehicleId,
//   vehicleRegistration,
//   username,
//   onUpdateSuccess,
// }) => {
//   const [newPMIDate, setNewPMIDate] = useState(lastPMIDate);
//   const [step, setStep] = useState<"initial" | "upload" | "brakeTest" | "fhPMI" | "maintenanceCheck" | "notes" | "mechanicJob" | "driverPMI" | "driverErrors" | "interimUpload" | "reminder" | "brakeReminder" | "brakeUpload">("initial");
//   const [documentUrl, setDocumentUrl] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [brakeTestPassed, setBrakeTestPassed] = useState<boolean | null>(null);
//   const [maintenanceCorrect, setMaintenanceCorrect] = useState<boolean | null>(null);
//   const [notes, setNotes] = useState("");
//   const [createMechanicJob, setCreateMechanicJob] = useState<boolean | null>(null);
//   const [vehicleStatus, setVehicleStatus] = useState<"Minor Defect Roadworthy" | "Minor Defect Unroadworthy" | "Major Defect Unroadworthy" | null>(null);
//   const [driverErrors, setDriverErrors] = useState<boolean | null>(null);
//   const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
//   const [reminderDateTime, setReminderDateTime] = useState("");
//   const [interimCertificate, setInterimCertificate] = useState<string | null>(null);

//   const handleUploadSuccess = (url: string, type: "certificate" | "interim" | "brake") => {
//     if (type === "certificate" || type === "brake") setDocumentUrl(url);
//     else if (type === "interim") setInterimCertificate(url);
//     toast({ title: "Success", description: `${type === "interim" ? "Interim PMI" : type === "brake" ? "Brake Test" : "PMI"} certificate uploaded successfully` });
//   };

//   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setNewPMIDate(e.target.value);
//     if (e.target.value !== lastPMIDate) setStep("upload");
//   };

//   const handleCertificateUpload = () => setStep("brakeTest");

//   const handleBrakeTestResponse = (passed: boolean) => {
//     setBrakeTestPassed(passed);
//     setStep(passed ? "fhPMI" : "brakeReminder");
//   };

//   const handleFHPMISubmit = async () => {
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/fh-pmi`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, date: new Date().toISOString() }),
//       });
//       setStep("maintenanceCheck");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to submit FH PMI Analysis", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleMaintenanceCheck = (correct: boolean) => {
//     setMaintenanceCorrect(correct);
//     setStep(correct ? "mechanicJob" : "notes");
//   };

//   const handleNotesSubmit = async () => {
//     if (!notes) {
//       toast({ title: "Error", description: "Please provide notes", variant: "destructive" });
//       return;
//     }
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/notes`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ notes, username, date: new Date().toISOString() }),
//       });
//       setStep("mechanicJob");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleMechanicJob = async (createJob: boolean) => {
//     setCreateMechanicJob(createJob);
//     if (createJob) {
//       setStep("mechanicJob");
//     } else {
//       setStep("driverPMI");
//     }
//   };

//   const handleMechanicJobSubmit = async () => {
//     if (!vehicleStatus) {
//       toast({ title: "Error", description: "Please select vehicle status", variant: "destructive" });
//       return;
//     }
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/mechanic-job`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           defects: "Detected during PMI",
//           date: new Date().toISOString(),
//           vehicleRegistration,
//           username,
//           status: vehicleStatus,
//         }),
//       });
//       setStep("driverPMI");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to create mechanic job", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDriverPMISubmit = async () => {
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/driver-pmi`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, date: new Date().toISOString() }),
//       });
//       setStep("driverErrors");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to submit Driver PMI Analysis", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDriverErrors = (errors: boolean) => {
//     setDriverErrors(errors);
//     setStep(errors ? "driverErrors" : "interimUpload");
//   };

//   const handleDriverTrainingSubmit = async () => {
//     if (!selectedDrivers.length) {
//       toast({ title: "Error", description: "Please select at least one driver", variant: "destructive" });
//       return;
//     }
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/driver-training`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           drivers: selectedDrivers,
//           message: "As you have failed a walkaround, you will be required to complete the Walkaround Failure Training",
//           username,
//           date: new Date().toISOString(),
//         }),
//       });
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/tasks/admin`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ task: "Monitor driver training", vehicleId, username, date: new Date().toISOString() }),
//       });
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/tasks/supervisor`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ task: "Action and sign off driver training", vehicleId, username, date: new Date().toISOString() }),
//       });
//       setStep("interimUpload");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to submit driver training", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleInterimUpload = async () => {
//     if (!interimCertificate) {
//       toast({ title: "Error", description: "Please upload an interim certificate", variant: "destructive" });
//       return;
//     }
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/interim-pmi`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ interimCertificate, username, date: new Date().toISOString() }),
//       });
//       setStep("reminder");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to save interim certificate", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleReminder = async (type: "pmi" | "brake") => {
//     if (!reminderDateTime) {
//       toast({ title: "Error", description: "Please select a valid date and time", variant: "destructive" });
//       return;
//     }
//     try {
//       setIsLoading(true);
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/reminders/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           vehicleId,
//           reminderDateTime,
//           type: type === "pmi" ? `PMI certificate for ${vehicleRegistration}` : `Brake re-test for ${vehicleRegistration}`,
//           username,
//           date: new Date().toISOString(),
//         }),
//       });
//       toast({ title: "Success", description: "Reminder set successfully" });
//       if (type === "pmi") setStep("upload");
//       else setStep("brakeUpload");
//     } catch (err) {
//       toast({ title: "Error", description: "Failed to set reminder", variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFinalUpload = async (type: "pmi" | "brake") => {
//     if (!documentUrl) {
//       toast({ title: "Error", description: `Please upload ${type === "pmi" ? "PMI" : "Brake Test"} certificate`, variant: "destructive" });
//       return;
//     }
//     try {
//       setIsLoading(true);
//       const filename = type === "pmi" ? `${new Date().toISOString().split('T')[0]}_PMI_${vehicleRegistration}` : `${new Date().toISOString().split('T')[0]}_Brake Re-test Certificate_${vehicleRegistration}`;
//       await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/pmi`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ documentUrl, filename, username, date: new Date().toISOString() }),
//       });
//       toast({ title: "Success", description: `${type === "pmi" ? "PMI" : "Brake Test"} certificate saved` });
//       setStep(type === "pmi" ? "fhPMI" : "fhPMI");
//       onUpdateSuccess?.();
//     } catch (err) {
//       toast({ title: "Error", description: `Failed to save ${type === "pmi" ? "PMI" : "Brake Test"} certificate`, variant: "destructive" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogPortal>
//         <DialogOverlay className="fixed inset-0 bg-black/50" />
//         <DialogContent className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400">
//           <DialogHeader>
//             <DialogTitle>PMI Process</DialogTitle>
//             <DialogDescription>
//               {step === "initial" && "Please update the Last PMI Date."}
//               {step === "upload" && "Please upload the new PMI certificate."}
//               {step === "brakeTest" && "Did the vehicle pass the brake test?"}
//               {step === "fhPMI" && "The FH PMI Analysis will now be opened for you to fill out and complete."}
//               {step === "maintenanceCheck" && "Did the maintenance provider complete the PMI sheet correctly?"}
//               {step === "notes" && "Have you left a note in the notes section, describing the action taken to notify the maintenance provider?"}
//               {step === "mechanicJob" && "Do you need to create a job for the mechanic?"}
//               {step === "driverPMI" && "The Driver PMI Analysis will now be opened for you to fill out and complete."}
//               {step === "driverErrors" && "Did any driver or drivers make any errors?"}
//               {step === "interimUpload" && "Please upload the Interim PMI Sign Off certificate."}
//               {step === "reminder" && `Please set a reminder to upload the PMI Certificate for ${vehicleRegistration}.`}
//               {step === "brakeReminder" && `Please set a reminder to rebook the brake test for ${vehicleRegistration}.`}
//               {step === "brakeUpload" && "Please upload the new Brake Test Certificate."}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4 mt-2">
//             {step === "initial" && (
//               <div>
//                 <Label htmlFor="pmiDate">Last PMI Date</Label>
//                 <Input
//                   id="pmiDate"
//                   type="date"
//                   value={newPMIDate}
//                   onChange={handleDateChange}
//                   required
//                 />
//               </div>
//             )}
//             {step === "upload" && (
//               <div>
//                 <Label htmlFor="certificate">Upload PMI Certificate</Label>
//                 <FileUploader
//                   id="certificate"
//                   accept=".pdf,.png,.jpg,.jpeg"
//                   maxSize={5 * 1024 * 1024}
//                   onUploadSuccess={(url) => handleUploadSuccess(url, "certificate")}
//                 />
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setStep("interimUpload")}
//                   className="mt-2"
//                 >
//                   Upload Later
//                 </Button>
//               </div>
//             )}
//             {step === "brakeTest" && (
//               <div className="flex gap-2">
//                 <Button onClick={() => handleBrakeTestResponse(true)}>Yes</Button>
//                 <Button onClick={() => handleBrakeTestResponse(false)}>No</Button>
//               </div>
//             )}
//             {step === "fhPMI" && (
//               <Button onClick={handleFHPMISubmit} disabled={isLoading}>
//                 {isLoading ? "Submitting..." : "OK"}
//               </Button>
//             )}
//             {step === "maintenanceCheck" && (
//               <div className="flex gap-2">
//                 <Button onClick={() => handleMaintenanceCheck(true)}>Yes</Button>
//                 <Button onClick={() => handleMaintenanceCheck(false)}>No</Button>
//               </div>
//             )}
//             {step === "notes" && (
//               <div>
//                 <Label htmlFor="notes">Notes</Label>
//                 <Textarea
//                   id="notes"
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder="Describe action taken to notify maintenance provider"
//                 />
//               </div>
//             )}
//             {step === "mechanicJob" && createMechanicJob === null && (
//               <div className="flex gap-2">
//                 <Button onClick={() => handleMechanicJob(true)}>Yes</Button>
//                 <Button onClick={() => handleMechanicJob(false)}>No</Button>
//               </div>
//             )}
//             {step === "mechanicJob" && createMechanicJob && (
//               <div>
//                 <Label htmlFor="vehicleStatus">Vehicle Status</Label>
//                 <Select onValueChange={(value) => setVehicleStatus(value as any)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select vehicle status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Minor Defect Roadworthy">Minor Defect Roadworthy</SelectItem>
//                     <SelectItem value="Minor Defect Unroadworthy">Minor Defect Unroadworthy</SelectItem>
//                     <SelectItem value="Major Defect Unroadworthy">Major Defect Unroadworthy</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//             {step === "driverPMI" && (
//               <Button onClick={handleDriverPMISubmit} disabled={isLoading}>
//                 {isLoading ? "Submitting..." : "OK"}
//               </Button>
//             )}
//             {step === "driverErrors" && driverErrors === null && (
//               <div className="flex gap-2">
//                 <Button onClick={() => handleDriverErrors(true)}>Yes</Button>
//                 <Button onClick={() => handleDriverErrors(false)}>No</Button>
//               </div>
//             )}
//             {step === "driverErrors" && driverErrors && (
//               <div>
//                 <Label htmlFor="drivers">Select Drivers</Label>
//                 <Select onValueChange={(value) => setSelectedDrivers([...selectedDrivers, value])}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select drivers" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {/* Replace with actual driver list from API */}
//                     <SelectItem value="driver1">Driver 1</SelectItem>
//                     <SelectItem value="driver2">Driver 2</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//             {step === "interimUpload" && (
//               <div>
//                 <Label htmlFor="interimCertificate">Upload Interim PMI Sign Off Certificate</Label>
//                 <FileUploader
//                   id="interimCertificate"
//                   accept=".pdf,.png,.jpg,.jpeg"
//                   maxSize={5 * 1024 * 1024}
//                   onUploadSuccess={(url) => handleUploadSuccess(url, "interim")}
//                 />
//               </div>
//             )}
//             {(step === "reminder" || step === "brakeReminder") && (
//               <div>
//                 <Label htmlFor="reminderDateTime">Reminder Date & Time</Label>
//                 <Input
//                   id="reminderDateTime"
//                   type="datetime-local"
//                   value={reminderDateTime}
//                   onChange={(e) => setReminderDateTime(e.target.value)}
//                   required
//                 />
//               </div>
//             )}
//             {step === "brakeUpload" && (
//               <div>
//                 <Label htmlFor="brakeCertificate">Upload Brake Test Certificate</Label>
//                 <FileUploader
//                   id="brakeCertificate"
//                   accept=".pdf,.png,.jpg,.jpeg"
//                   maxSize={5 * 1024 * 1024}
//                   onUploadSuccess={(url) => handleUploadSuccess(url, "brake")}
//                 />
//               </div>
//             )}
//           </div>

//           <DialogFooter className="mt-4 flex justify-end gap-2">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             {step === "upload" && (
//               <Button onClick={handleCertificateUpload} disabled={isLoading || !documentUrl}>
//                 {isLoading ? "Uploading..." : "Submit Certificate"}
//               </Button>
//             )}
//             {step === "notes" && (
//               <Button onClick={handleNotesSubmit} disabled={isLoading || !notes}>
//                 {isLoading ? "Submitting..." : "Submit Notes"}
//               </Button>
//             )}
//             {step === "mechanicJob" && createMechanicJob && (
//               <Button onClick={handleMechanicJobSubmit} disabled={isLoading || !vehicleStatus}>
//                 {isLoading ? "Submitting..." : "Submit Job"}
//               </Button>
//             )}
//             {step === "driverErrors" && driverErrors && (
//               <Button onClick={handleDriverTrainingSubmit} disabled={isLoading || !selectedDrivers.length}>
//                 {isLoading ? "Submitting..." : "Finish"}
//               </Button>
//             )}
//             {step === "interimUpload" && (
//               <Button onClick={handleInterimUpload} disabled={isLoading || !interimCertificate}>
//                 {isLoading ? "Uploading..." : "Submit Interim Certificate"}
//               </Button>
//             )}
//             {(step === "reminder" || step === "brakeReminder") && (
//               <Button onClick={() => handleReminder(step === "reminder" ? "pmi" : "brake")} disabled={isLoading || !reminderDateTime}>
//                 {isLoading ? "Saving..." : "Save Reminder"}
//               </Button>
//             )}
//             {(step === "upload" || step === "brakeUpload") && (
//               <Button onClick={() => handleFinalUpload(step === "upload" ? "pmi" : "brake")} disabled={isLoading || !documentUrl}>
//                 {isLoading ? "Uploading..." : "Complete"}
//               </Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </DialogPortal>
//     </Dialog>
//   );
// };

// export default InspectionDialog;


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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import FileUploader from "@/components/Media/MediaUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PMIDialogProps {
  open: boolean;
  onClose: () => void;
  lastPMIDate: string;
  vehicleId: number;
  vehicleRegistration: string;
  username: string;
  onUpdateSuccess?: () => void;
}

type StepType = 
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
  | "brakeUpload" 
  | "complete";

const InspectionDialog: React.FC<PMIDialogProps> = ({
  open,
  onClose,
  lastPMIDate,
  vehicleId,
  vehicleRegistration,
  username,
  onUpdateSuccess,
}) => {
  const [newPMIDate, setNewPMIDate] = useState(lastPMIDate);
  const [step, setStep] = useState<StepType>("initial");
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [brakeTestPassed, setBrakeTestPassed] = useState<boolean | null>(null);
  const [maintenanceCorrect, setMaintenanceCorrect] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [createMechanicJob, setCreateMechanicJob] = useState<boolean | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState<"Minor Defect Roadworthy" | "Minor Defect Unroadworthy" | "Major Defect Unroadworthy" | null>(null);
  const [driverErrors, setDriverErrors] = useState<boolean | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [interimCertificate, setInterimCertificate] = useState<string | null>(null);

  // Reset all state when dialog closes
  const resetState = () => {
    setStep("initial");
    setDocumentUrl(null);
    setIsLoading(false);
    setBrakeTestPassed(null);
    setMaintenanceCorrect(null);
    setNotes("");
    setCreateMechanicJob(null);
    setVehicleStatus(null);
    setDriverErrors(null);
    setSelectedDrivers([]);
    setReminderDateTime("");
    setInterimCertificate(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleUploadSuccess = (url: string, type: "certificate" | "interim" | "brake") => {
    if (type === "certificate" || type === "brake") {
      setDocumentUrl(url);
    } else if (type === "interim") {
      setInterimCertificate(url);
    }
    
    toast({ 
      title: "Success", 
      description: `${type === "interim" ? "Interim PMI" : type === "brake" ? "Brake Test" : "PMI"} certificate uploaded successfully` 
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPMIDate(e.target.value);
    if (e.target.value !== lastPMIDate) {
      setStep("upload");
    }
  };

  const delayAndProceed = (nextStep: StepType, message?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(nextStep);
      if (message) {
        toast({ title: "Success", description: message });
      }
    }, 2000); // 2-second delay to simulate processing
  };

  // Step handlers following the flowchart
  const handleCertificateUpload = () => {
    if (!documentUrl) {
      toast({ title: "Error", description: "Please upload a certificate first", variant: "destructive" });
      return;
    }
    setStep("brakeTest");
  };

  const handleBrakeTestResponse = (passed: boolean) => {
    setBrakeTestPassed(passed);
    setStep(passed ? "fhPMI" : "brakeReminder");
  };

  const handleFHPMISubmit = () => {
    setStep("fhPMIOpen");
    toast({ 
      title: "Opening FH PMI Analysis", 
      description: "Please fill out the form and click submit when complete." 
    });
  };

  const handleFHPMIComplete = () => {
    delayAndProceed("maintenanceCheck", "FH PMI Analysis submitted successfully");
  };

  const handleMaintenanceCheck = (correct: boolean) => {
    setMaintenanceCorrect(correct);
    setStep(correct ? "mechanicJob" : "notes");
  };

  const handleNotesSubmit = () => {
    if (!notes.trim()) {
      toast({ title: "Error", description: "Please provide notes describing the action taken", variant: "destructive" });
      return;
    }
    delayAndProceed("mechanicJob", "Notes saved successfully");
  };

  const handleMechanicJob = (createJob: boolean) => {
    setCreateMechanicJob(createJob);
    if (createJob) {
      setStep("mechanicJobForm");
    } else {
      setStep("driverPMI");
    }
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
      description: "Please fill out the form and click submit when complete." 
    });
  };

  const handleDriverPMIComplete = () => {
    delayAndProceed("driverErrors", "Driver PMI Analysis submitted successfully");
  };

  const handleDriverErrors = (errors: boolean) => {
    setDriverErrors(errors);
    if (errors) {
      setStep("driverTraining");
    } else {
      toast({ 
        title: "Success", 
        description: "All entries saved with time, date, and username stamp" 
      });
      setStep("interimUpload");
    }
  };

  const handleDriverTrainingSubmit = () => {
    if (!selectedDrivers.length) {
      toast({ title: "Error", description: "Please select at least one driver", variant: "destructive" });
      return;
    }
    
    // Simulate the training process
    delayAndProceed("interimUpload", 
      "Training forms sent to drivers. Admin monitoring task and supervisor sign-off tasks created."
    );
  };

  const handleInterimUpload = () => {
    if (!interimCertificate) {
      toast({ title: "Error", description: "Please upload an interim certificate", variant: "destructive" });
      return;
    }
    delayAndProceed("reminder", "Interim PMI Sign Off certificate saved with date and time stamp");
  };

  const handleReminder = (type: "pmi" | "brake") => {
    if (!reminderDateTime) {
      toast({ title: "Error", description: "Please select a valid date and time", variant: "destructive" });
      return;
    }
    
    const reminderType = type === "pmi" ? "PMI certificate" : "brake test re-booking";
    delayAndProceed(
      type === "pmi" ? "upload" : "brakeUpload", 
      `Reminder set for ${reminderType} upload for ${vehicleRegistration}`
    );
  };

  const handleFinalUpload = (type: "pmi" | "brake") => {
    if (!documentUrl) {
      toast({ 
        title: "Error", 
        description: `Please upload ${type === "pmi" ? "PMI" : "Brake Test"} certificate`, 
        variant: "destructive" 
      });
      return;
    }
    
    const filename = type === "pmi" 
      ? `${new Date().toISOString().split('T')[0]}_PMI_${vehicleRegistration}`
      : `${new Date().toISOString().split('T')[0]}_Brake Re-test Certificate_${vehicleRegistration}`;
    
    toast({ 
      title: "Success", 
      description: `${type === "pmi" ? "PMI" : "Brake Test"} certificate saved as ${filename}` 
    });
    
    // Return to step E (FH PMI) as per flowchart
    setStep("fhPMI");
    if (onUpdateSuccess) onUpdateSuccess();
  };

  const removeDriver = (driverToRemove: string) => {
    setSelectedDrivers(selectedDrivers.filter(driver => driver !== driverToRemove));
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
              {step === "initial" && "Please update the Last PMI Date."}
              {step === "upload" && "System asks user to upload new PMI certificate."}
              {step === "brakeTest" && "Did the vehicle pass the brake test?"}
              {step === "fhPMI" && "The FH PMI Analysis will now be opened for you to fill out and complete."}
              {step === "fhPMIOpen" && "Please fill out the FH PMI Analysis form and click submit when complete."}
              {step === "maintenanceCheck" && "Did the maintenance provider complete the PMI sheet correctly?"}
              {step === "notes" && "Have you left a note in the notes section, describing the action taken to notify the maintenance provider?"}
              {step === "mechanicJob" && "Do you need to create a job for the mechanic?"}
              {step === "mechanicJobForm" && "Please update the vehicle status and submit the mechanic job."}
              {step === "driverPMI" && "The Driver PMI Analysis will now be opened for you to fill out and complete."}
              {step === "driverPMIOpen" && "Please fill out the Driver PMI Analysis form and click submit when complete."}
              {step === "driverErrors" && "Did any driver or drivers make any errors?"}
              {step === "driverTraining" && "Please select the drivers who need walkaround failure training."}
              {step === "interimUpload" && "Please upload the Interim PMI Sign Off certificate."}
              {step === "reminder" && `Please set a reminder to upload the PMI Certificate for ${vehicleRegistration}.`}
              {step === "brakeReminder" && `Please set a reminder to rebook the brake test for ${vehicleRegistration}.`}
              {step === "brakeUpload" && "Please upload the new Brake Test Certificate."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Initial Date Update */}
            {step === "initial" && (
              <div>
                <Label htmlFor="pmiDate" className="text-sm font-medium">Last PMI Date</Label>
                <Input
                  id="pmiDate"
                  type="date"
                  value={newPMIDate}
                  onChange={handleDateChange}
                  className="mt-1"
                  required
                />
              </div>
            )}

            {/* Certificate Upload */}
            {step === "upload" && (
              <div className="space-y-3">
                <Label htmlFor="certificate" className="text-sm font-medium">Upload PMI Certificate</Label>
                <FileUploader
                  id="certificate"
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSize={5 * 1024 * 1024}
                  onUploadSuccess={(url) => handleUploadSuccess(url, "certificate")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    toast({ title: "Upload Later", description: "Proceeding to interim upload process" });
                    setStep("interimUpload");
                  }}
                  className="w-full"
                >
                  Upload Later
                </Button>
              </div>
            )}

            {/* Brake Test Question */}
            {step === "brakeTest" && (
              <div className="flex gap-3">
                <Button onClick={() => handleBrakeTestResponse(true)} className="flex-1">
                  Yes - Passed
                </Button>
                <Button onClick={() => handleBrakeTestResponse(false)} variant="outline" className="flex-1">
                  No - Failed
                </Button>
              </div>
            )}

            {/* FH PMI Analysis */}
            {step === "fhPMI" && (
              <Button onClick={handleFHPMISubmit} disabled={isLoading} className="w-full">
                {isLoading ? "Processing..." : "OK - Open FH PMI Analysis"}
              </Button>
            )}

            {step === "fhPMIOpen" && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-3 text-blue-800">FH PMI Analysis Form</p>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Vehicle Registration: <span className="font-medium">{vehicleRegistration}</span></div>
                    <div>Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></div>
                    <div>Username: <span className="font-medium">{username}</span></div>
                    <div>Status: <span className="font-medium text-green-600">Form Ready</span></div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <p className="text-xs text-gray-600 mb-2">Simulated form completion in progress...</p>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <Button onClick={handleFHPMIComplete} className="mt-4 w-full" size="sm">
                  Submit FH PMI Analysis
                </Button>
              </div>
            )}

            {/* Maintenance Check */}
            {step === "maintenanceCheck" && (
              <div className="flex gap-3">
                <Button onClick={() => handleMaintenanceCheck(true)} className="flex-1">
                  Yes - Correct
                </Button>
                <Button onClick={() => handleMaintenanceCheck(false)} variant="outline" className="flex-1">
                  No - Incorrect
                </Button>
              </div>
            )}

            {/* Notes Section */}
            {step === "notes" && (
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Describe action taken to notify maintenance provider
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter detailed notes about the action taken..."
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>
            )}

            {/* Mechanic Job Question */}
            {step === "mechanicJob" && createMechanicJob === null && (
              <div className="flex gap-3">
                <Button onClick={() => handleMechanicJob(true)} className="flex-1">
                  Yes - Create Job
                </Button>
                <Button onClick={() => handleMechanicJob(false)} variant="outline" className="flex-1">
                  No - Skip
                </Button>
              </div>
            )}

            {/* Mechanic Job Form */}
            {step === "mechanicJobForm" && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="font-medium mb-3 text-gray-800">Mechanic Job Sheet (Pre-populated)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>Defects: <span className="font-medium">Detected during PMI</span></div>
                    <div>Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></div>
                    <div>Vehicle Registration: <span className="font-medium">{vehicleRegistration}</span></div>
                    <div>Username: <span className="font-medium">{username}</span></div>
                    <div>Time: <span className="font-medium">{new Date().toLocaleTimeString()}</span></div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="vehicleStatus" className="text-sm font-medium">Vehicle Status</Label>
                  <Select onValueChange={(value) => setVehicleStatus(value as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select vehicle status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Minor Defect Roadworthy">Minor Defect Roadworthy</SelectItem>
                      <SelectItem value="Minor Defect Unroadworthy">Minor Defect Unroadworthy</SelectItem>
                      <SelectItem value="Major Defect Unroadworthy">Major Defect Unroadworthy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Driver PMI Analysis */}
            {step === "driverPMI" && (
              <Button onClick={handleDriverPMISubmit} disabled={isLoading} className="w-full">
                {isLoading ? "Processing..." : "OK - Open Driver PMI Analysis"}
              </Button>
            )}

            {step === "driverPMIOpen" && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium mb-3 text-green-800">Driver PMI Analysis Form</p>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Vehicle Registration: <span className="font-medium">{vehicleRegistration}</span></div>
                    <div>Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></div>
                    <div>Username: <span className="font-medium">{username}</span></div>
                    <div>Status: <span className="font-medium text-green-600">Form Ready</span></div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border border-green-300">
                  <p className="text-xs text-gray-600 mb-2">Simulated form completion in progress...</p>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <Button onClick={handleDriverPMIComplete} className="mt-4 w-full" size="sm">
                  Submit Driver PMI Analysis
                </Button>
              </div>
            )}

            {/* Driver Errors Question */}
            {step === "driverErrors" && driverErrors === null && (
              <div className="flex gap-3">
                <Button onClick={() => handleDriverErrors(true)} variant="outline" className="flex-1">
                  Yes - Errors Found
                </Button>
                <Button onClick={() => handleDriverErrors(false)} className="flex-1">
                  No - No Errors
                </Button>
              </div>
            )}

            {/* Driver Training Setup */}
            {step === "driverTraining" && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="font-medium mb-3 text-orange-800">Driver Walkaround Failure Training Setup</p>
                  <p className="text-sm text-orange-700 mb-3">The following actions will be completed:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                    <li>Send training forms to selected drivers</li>
                    <li>Message: "As you have failed a walkaround, you will be required to complete the Walkaround Failure Training"</li>
                    <li>Create task for admin to monitor training progress</li>
                    <li>Create task for supervisors to action and sign off with drivers</li>
                  </ul>
                </div>
                
                <div>
                  <Label htmlFor="drivers" className="text-sm font-medium">Select Drivers for Training</Label>
                  <Select onValueChange={(value) => {
                    if (!selectedDrivers.includes(value)) {
                      setSelectedDrivers([...selectedDrivers, value]);
                    }
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select drivers who made errors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="John Smith">John Smith</SelectItem>
                      <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                      <SelectItem value="Mike Williams">Mike Williams</SelectItem>
                      <SelectItem value="Emma Davis">Emma Davis</SelectItem>
                      <SelectItem value="David Wilson">David Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedDrivers.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium text-sm mb-2">Selected Drivers ({selectedDrivers.length}):</p>
                    <div className="space-y-1">
                      {selectedDrivers.map((driver, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span>{driver}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDriver(driver)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interim Certificate Upload */}
            {step === "interimUpload" && (
              <div>
                <Label htmlFor="interimCertificate" className="text-sm font-medium">
                  Upload Interim PMI Sign Off Certificate
                </Label>
                <FileUploader
                  id="interimCertificate"
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSize={5 * 1024 * 1024}
                  onUploadSuccess={(url) => handleUploadSuccess(url, "interim")}
                />
              </div>
            )}

            {/* Reminder Setup */}
            {(step === "reminder" || step === "brakeReminder") && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">
                    {step === "reminder" ? "PMI Certificate Reminder" : "Brake Test Reminder"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Vehicle Registration: {vehicleRegistration}
                    {step === "brakeReminder" && ` - Failed brake test on ${new Date().toLocaleDateString()}`}
                  </p>
                </div>
                <div>
                  <Label htmlFor="reminderDateTime" className="text-sm font-medium">
                    Reminder Date & Time
                  </Label>
                  <Input
                    id="reminderDateTime"
                    type="datetime-local"
                    value={reminderDateTime}
                    onChange={(e) => setReminderDateTime(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            )}

            {/* Final Certificate Upload */}
            {step === "brakeUpload" && (
              <div>
                <Label htmlFor="brakeCertificate" className="text-sm font-medium">
                  Upload New Brake Test Certificate
                </Label>
                <FileUploader
                  id="brakeCertificate"
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSize={5 * 1024 * 1024}
                  onUploadSuccess={(url) => handleUploadSuccess(url, "brake")}
                />
              </div>
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

            {step === "notes" && (
              <Button onClick={handleNotesSubmit} disabled={isLoading || !notes.trim()}>
                {isLoading ? "Processing..." : "Submit Notes"}
              </Button>
            )}

            {step === "mechanicJobForm" && (
              <Button onClick={handleMechanicJobSubmit} disabled={isLoading || !vehicleStatus}>
                {isLoading ? "Processing..." : "Submit Mechanic Job"}
              </Button>
            )}

            {step === "driverTraining" && (
              <Button onClick={handleDriverTrainingSubmit} disabled={isLoading || !selectedDrivers.length}>
                {isLoading ? "Processing..." : "Complete Training Setup"}
              </Button>
            )}

            {step === "interimUpload" && (
              <Button onClick={handleInterimUpload} disabled={isLoading || !interimCertificate}>
                {isLoading ? "Processing..." : "Submit Interim Certificate"}
              </Button>
            )}

            {(step === "reminder" || step === "brakeReminder") && (
              <Button 
                onClick={() => handleReminder(step === "reminder" ? "pmi" : "brake")} 
                disabled={isLoading || !reminderDateTime}
              >
                {isLoading ? "Processing..." : "Save Reminder"}
              </Button>
            )}

            {step === "brakeUpload" && (
              <Button onClick={() => handleFinalUpload("brake")} disabled={isLoading || !documentUrl}>
                {isLoading ? "Processing..." : "Complete Process"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default InspectionDialog;