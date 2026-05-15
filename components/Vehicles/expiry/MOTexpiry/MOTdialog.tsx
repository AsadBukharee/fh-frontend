"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Upload,
  FileText,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import API_URL from "@/app/utils/ENV";

import FileUploader from "@/components/Media/MediaUpload";
import CreateTaskDialog from "@/components/task/CreateTaskDialog";
import AddMechanicJobDialog from "@/components/mechhanic-job/AddMechanic";
import { useCookies } from "next-client-cookies";

interface MOTDialogProps {
  open: boolean;
  onClose: () => void;
  currentMOTDate: string;
  vehicleId: number;
  vehicleRegistration: string;
  username: string;
  onUpdateSuccess: () => void;
}

interface MOTData {
  motDate: string;
  certificateFile: string;
  motPassed: boolean | null;
}

export default function MOTDialog({
  open,
  onClose,
  currentMOTDate,
  vehicleId,
  vehicleRegistration,
  username,
  onUpdateSuccess,
}: MOTDialogProps) {
  const [step, setStep] = useState<"upload-cert" | "pass-check" | "task-or-job" | "complete">("upload-cert");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const cookies = useCookies();
  
  const [motData, setMotData] = useState<MOTData>({
    motDate: "",
    certificateFile: "",
    motPassed: null,
  });
  
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<any>(null);
  
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [skipUpload, setSkipUpload] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"task" | "job" | null>(null);

  useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open]);

  const handleReset = () => {
    setStep("upload-cert");
    setMotData({
      motDate: "",
      certificateFile: "",
      motPassed: null,
    });
    setSkipUpload(false);
    setSelectedOption(null);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleUploadOrSkip = () => {
    if (!skipUpload && !motData.motDate) {
      setError("Please select the MOT date");
      return;
    }
    
    if (!skipUpload && !motData.certificateFile) {
      setError("Please upload MOT certificate or enable 'Upload Later'");
      return;
    }
    
    if (skipUpload) {
      createUploadTask();
    } else {
      setError(null);
      setStep("pass-check");
    }
  };

  const createUploadTask = () => {
    const prefillData = {
      title: `Upload MOT Certificate - ${vehicleRegistration}`,
      description: `MOT certificate needs to be uploaded for vehicle ${vehicleRegistration}.\nMOT date: ${motData.motDate ? format(new Date(motData.motDate), "dd MMM yyyy") : "Not specified"}\n\nPlease upload the certificate as soon as it's available.`,
      priority: "medium",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      estimatedHours: "1",
      requiresApproval: false,
    };
    
    setTaskPrefill(prefillData);
    setShowTaskDialog(true);
  };

  const handlePassFailSelection = (passed: boolean) => {
    setMotData(prev => ({ ...prev, motPassed: passed }));
    
    if (passed) {
      updateVehicleWithMOT(true);
    } else {
      setStep("task-or-job");
    }
  };

  const handleTaskJobSelection = (option: "task" | "job") => {
    setSelectedOption(option);
    
    if (option === "task") {
      createRebookTask();
    } else {
      setShowJobDialog(true);
    }
  };

  const createRebookTask = () => {
    const prefillData = {
      title: `Rebook MOT - ${vehicleRegistration} (Failed)`,
      description: `Vehicle ${vehicleRegistration} failed MOT on ${motData.motDate ? format(new Date(motData.motDate), "dd MMM yyyy") : "Not specified"}.\n\nAction required:\n• Review failure details\n• Address any issues\n• Rebook MOT`,
      priority: "high",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      estimatedHours: "2",
      requiresApproval: false,
    };
    
    setTaskPrefill(prefillData);
    setShowTaskDialog(true);
  };

  const updateVehicleWithMOT = async (passedOverride?: boolean, skipUploadOverride?: boolean) => {
    const isSkipUpload = skipUploadOverride !== undefined ? skipUploadOverride : skipUpload;
    const isPassed = passedOverride !== undefined ? passedOverride : motData.motPassed;

    if (!motData.motDate && !isSkipUpload) {
      setError("Please select MOT date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = cookies.get("access_token");
      
      const calculateNextMOTDate = () => {
        if (motData.motDate) {
          const testDate = new Date(motData.motDate);
          const nextDate = new Date(testDate);
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          return nextDate.toISOString().split('T')[0];
        }
        return "";
      };

      const nextMOTExpiry = calculateNextMOTDate();

      const updateData: any = {
        updated_by: username,
        updated_at: new Date().toISOString(),
      };

      // Only update expiry if it passed
      if (isPassed === true) {
        updateData.mot_expiry = nextMOTExpiry;
      }
      
      updateData.mot_last_test_date = motData.motDate;
      updateData.mot_test_result = isPassed === true ? "pass" : isPassed === false ? "fail" : null;

      if (motData.certificateFile) {
        updateData.mot_check_docs = motData.certificateFile;
      }

      const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Also call bulk document API if a certificate was uploaded
        if (motData.certificateFile) {
          try {
            const docPayload = {
              vehicle_id: vehicleId,
              documents: [
                {
                  document_type: 9, // MOT Certificate
                  title: "MOT Certificate",
                  url: motData.certificateFile,
                  expiry_date: isPassed === true ? nextMOTExpiry : null,
                }
              ]
            };

            await fetch(`${API_URL}/api/documents/documents/vehicle-bulk/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(docPayload),
            });
          } catch (docErr) {
            console.error("Error updating bulk document:", docErr);
            // Don't fail the whole process if document update fails
          }
        }

        setSuccess(true);
        setTimeout(() => {
          onUpdateSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(data.message || "Failed to update MOT details");
      }
    } catch (err) {
      console.error("Error updating MOT:", err);
      setError("An error occurred while updating MOT details");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    if (selectedOption === "task" && motData.motPassed === false) {
      updateVehicleWithMOT(false);
    } else if (skipUpload) {
      updateVehicleWithMOT(undefined, true);
    } else {
      setShowTaskDialog(false);
      setSuccess(true);
      setTimeout(() => {
        onUpdateSuccess();
        handleClose();
      }, 1500);
    }
  };

  const handleJobCreated = () => {
    setShowJobDialog(false);
    // After job is created, still update the vehicle
    updateVehicleWithMOT(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "upload-cert": return "Upload Certificate";
      case "pass-check": return "Test Result";
      case "task-or-job": return "Next Action";
      default: return "";
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-5">
      {/* Vehicle Info Card */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-white border-orange-300 text-orange-700 font-semibold">
                {vehicleRegistration}
              </Badge>
            </div>
            <p className="text-sm text-orange-800">
              Current MOT expires: <span className="font-semibold">{formatDisplayDate(currentMOTDate)}</span>
            </p>
          </div>
          <Calendar className="w-5 h-5 text-orange-600" />
        </div>
      </div>

      {/* Test Date */}
      <div className="space-y-2">
        <Label htmlFor="motDate" className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          MOT Date {!skipUpload && "*"}
        </Label>
        <Input
          id="motDate"
          type="date"
          value={motData.motDate}
          onChange={(e) => {
            setMotData(prev => ({ ...prev, motDate: e.target.value }));
            setError(null);
          }}
        //   max={new Date().toISOString().split('T')[0]}
          className="w-full"
        />
        <p className="text-xs text-gray-500">Select when the MOT was conducted</p>
      </div>

      {/* Certificate Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          MOT Certificate {!skipUpload && "*"}
        </Label>
        
        {motData.certificateFile ? (
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Certificate uploaded</p>
                <p className="text-xs text-emerald-700">Ready to process</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMotData(prev => ({ ...prev, certificateFile: "" }))}
              className="h-9 w-9 p-0 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            skipUpload 
              ? "border-gray-200 bg-gray-50 opacity-50" 
              : "border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 cursor-pointer"
          }`}>
            {isUploadingCert ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-orange-700">Uploading certificate...</p>
              </div>
            ) : (
              <div 
                onClick={() => !skipUpload && document.getElementById("mot-certificate-upload")?.click()}
                className={skipUpload ? "" : "cursor-pointer"}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Upload className="w-7 h-7 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {skipUpload ? "Certificate upload disabled" : "Click to upload certificate"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {skipUpload ? "Enable below to upload now" : "PDF, JPG, PNG • Max 10MB"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!skipUpload && (
              <FileUploader
                onUploadSuccess={(url) => {
                  setMotData(prev => ({ ...prev, certificateFile: url }));
                  setIsUploadingCert(false);
                  setCertError(null);
                }}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={10 * 1024 * 1024}
                id="mot-certificate-upload"
                hideDefaultUI={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Skip Option */}
      <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
        skipUpload 
          ? "bg-gradient-to-br from-blue-50/50 to-blue-100/50 border-blue-200 shadow-sm" 
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}>
        <div className="p-2.5 bg-blue-100/50 rounded-xl">
          <Clock className={`w-6 h-6 ${skipUpload ? "text-blue-600" : "text-gray-400"}`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Label className="font-bold text-gray-900 cursor-pointer text-base" htmlFor="skip-upload">
              Upload Later
            </Label>
            {skipUpload && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2">
                Task Active
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {skipUpload 
              ? "A high-priority reminder task will be created to upload the certificate within 3 days." 
              : "Missing the certificate? You can proceed now and create a reminder task instead."}
          </p>
        </div>
        <Switch
          id="skip-upload"
          checked={skipUpload}
          onCheckedChange={(checked) => {
            setSkipUpload(checked);
            setError(null);
            if (checked) {
              setMotData(prev => ({ ...prev, certificateFile: "" }));
            }
          }}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleUploadOrSkip}
          disabled={loading}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              {skipUpload ? "Create Task" : "Continue"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );

  const renderPassFailStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">MOT Result</h3>
        <p className="text-gray-600 mt-2">
          Select the outcome for <span className="font-semibold">{vehicleRegistration}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handlePassFailSelection(true)}
          className="group relative h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <div className="p-3 bg-emerald-200 group-hover:bg-emerald-300 rounded-full transition-colors">
            <CheckCircle className="w-7 h-7" />
          </div>
          <span className="font-bold text-lg">Passed</span>
        </button>
        
        <button
          type="button"
          onClick={() => handlePassFailSelection(false)}
          className="group relative h-32 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-2 border-red-200 hover:border-red-300 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <div className="p-3 bg-red-200 group-hover:bg-red-300 rounded-full transition-colors">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <span className="font-bold text-lg">Failed</span>
        </button>
      </div>

      <div className="flex items-start gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        </div>
        <div className="text-sm text-blue-900">
          <p className="font-bold mb-1">What happens next?</p>
          <div className="space-y-1 text-blue-700/80">
            <p><strong className="text-blue-900">Pass:</strong> Vehicle compliance status will be updated with the new MOT expiry date.</p>
            <p><strong className="text-blue-900">Fail:</strong> You&apos;ll be prompted to create a follow-up task or a detailed mechanic job sheet.</p>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("upload-cert")}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
      </DialogFooter>
    </div>
  );

  const renderTaskJobStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">MOT Failed - Next Steps</h3>
        <p className="text-gray-600 mt-2">
          Choose how to handle the failed MOT for <span className="font-semibold">{vehicleRegistration}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleTaskJobSelection("task")}
          className="group relative h-36 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-2 border-orange-200 hover:border-orange-300 rounded-xl transition-all shadow-sm hover:shadow-md p-4"
        >
          <div className="p-3 bg-orange-200 group-hover:bg-orange-300 rounded-full transition-colors">
            <Clock className="w-7 h-7" />
          </div>
          <div className="text-center">
            <span className="font-bold text-lg block">Create Task</span>
            <span className="text-xs text-orange-600 mt-1 block">Set reminder to rebook MOT</span>
          </div>
        </button>
        
        <button
          type="button"
          onClick={() => handleTaskJobSelection("job")}
          className="group relative h-36 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all shadow-sm hover:shadow-md p-4"
        >
          <div className="p-3 bg-blue-200 group-hover:bg-blue-300 rounded-full transition-colors">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="text-center">
            <span className="font-bold text-lg block">Create Job</span>
            <span className="text-xs text-blue-600 mt-1 block">Create mechanic job sheet</span>
          </div>
        </button>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Understanding the Options
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-orange-200 rounded-md flex-shrink-0">
              <Clock className="w-4 h-4 text-orange-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Task Option</p>
              <p className="text-gray-600">Creates a high-priority reminder to rebook the MOT after addressing any minor issues.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-200 rounded-md flex-shrink-0">
              <Wrench className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Job Option</p>
              <p className="text-gray-600">Creates a detailed mechanic job sheet to fix the issues before rebooking the MOT.</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("pass-check")}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
      </DialogFooter>
    </div>
  );

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">
              {skipUpload
                ? "Task created for certificate upload"
                : motData.motPassed === true
                ? "MOT details updated successfully"
                : selectedOption === "task"
                ? "Task created for MOT rebooking"
                : "Mechanic job created successfully"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStepNumber = step === "upload-cert" ? 1 : step === "pass-check" ? 2 : 3;
  const totalSteps = 3;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 border-none bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 border-b border-gray-50 bg-gray-50/30 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <div className="p-2.5 bg-orange-100 rounded-2xl shadow-sm">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                Update MOT Details
              </DialogTitle>
              <Badge variant="outline" className="bg-white border-orange-200 text-orange-700 font-bold px-3 py-1 rounded-full shadow-sm">
                Step {currentStepNumber} of {totalSteps}
              </Badge>
            </div>
            <DialogDescription className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 ml-14">
              {getStepTitle()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 py-4">
              {[1, 2, 3].map((num) => (
                <React.Fragment key={num}>
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-2xl text-base font-bold transition-all duration-500
                    ${currentStepNumber === num 
                      ? "bg-orange-600 text-white scale-110 shadow-xl shadow-orange-100 ring-4 ring-orange-50" 
                      : currentStepNumber > num
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-50"
                      : "bg-gray-50 text-gray-300 border border-gray-100"}
                  `}>
                    {currentStepNumber > num ? <CheckCircle className="w-6 h-6 animate-in zoom-in duration-300" /> : num}
                  </div>
                  {num < 3 && (
                    <div className={`
                      h-1.5 w-12 rounded-full transition-all duration-700
                      ${currentStepNumber > num ? "bg-emerald-500" : "bg-gray-100"}
                    `} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
              {step === "upload-cert" && renderUploadStep()}
              {step === "pass-check" && renderPassFailStep()}
              {step === "task-or-job" && renderTaskJobStep()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showTaskDialog && (
        <CreateTaskDialog
          isOpen={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onTaskCreated={handleTaskCreated}
          prefill={taskPrefill}
        />
      )}

      {showJobDialog && (
        <AddMechanicJobDialog
          isOpen={showJobDialog}
          onOpenChange={(open) => setShowJobDialog(open)}
          onJobAdded={handleJobCreated}
          defaultVehicleId={vehicleId.toString()}
          defaultNotes={`MOT failed for ${vehicleRegistration}. Test date: ${motData.motDate ? format(new Date(motData.motDate), "dd MMM yyyy") : "Not specified"}.\n\nIssues need to be addressed before rebooking MOT.`}
        />
      )}
    </>
  );
}