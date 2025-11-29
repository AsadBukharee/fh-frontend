// app/drivers/DocumentsStep.tsx (FINAL VERSION)

"use client";

import React, { useState, useCallback, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useStepper } from "./DriverStepper";
import FileUploader from "../Media/MediaUpload";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { toast } from "@/components/ui/use-toast";
import CreateTaskDialog from "../task/CreateTaskDialog";
import { useRouter } from "next/navigation";

export interface Module {
  module_name: string;
  description: string;
  expiry_date: string;
}

export interface ProfessionalCompetency {
  driver: { id: number } | null;
  document_name: string;
  has_expiry: boolean;
  description: string;
  expiry_date: string;
  has_document: boolean;
  has_back_side: boolean;
  urls: string[];
  request_status: string;
  has_description: boolean;
  modules: Module[];
  upload_later?: boolean;
}

interface DocumentsStepProps {
  driverId: number | null;
  setDocumentsData: (data: Record<string, ProfessionalCompetency>) => void;
}

const documentTypes = [
  { id: "d_or_d1_license", label: "D or D1 License" },
  { id: "cpc", label: "CPC" },
  { id: "tacho_card", label: "Tacho Card" },
  { id: "Passport_Right_To_Work", label: "Passport / Right To Work" },
  { id: "proof_of_address", label: "Proof of Address" },
] as const;

export function DocumentsStep({ driverId, setDocumentsData }: DocumentsStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const [isPending, startTransition] = useTransition();
  const [isSubmittingMainForm, setIsSubmittingMainForm] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const router=useRouter()

  const [competencies, setCompetencies] = useState<Record<string, ProfessionalCompetency>>({
    d_or_d1_license: {
      document_name: "D or D1 License",
      has_document: true,
      has_expiry: true,
      has_description: true,
      request_status: "pending",
      modules: [],
      urls: ["", ""],
      has_back_side: false,
      description: "",
      expiry_date: "",
      driver: null,
      upload_later: false,
    },
    cpc: {
      document_name: "CPC",
      has_document: true,
      has_expiry: true,
      has_description: true,
      request_status: "pending",
      modules: [],
      urls: ["", ""],
      has_back_side: false,
      description: "",
      expiry_date: "",
      driver: null,
      upload_later: false,
    },
    tacho_card: {
      document_name: "Tacho Card",
      has_document: false,
      has_expiry: false,
      has_description: false,
      request_status: "pending",
      modules: [],
      urls: ["", ""],
      has_back_side: false,
      description: "",
      expiry_date: "",
      driver: null,
      upload_later: false,
    },
    Passport_Right_To_Work: {
      document_name: "Passport / Right To Work",
      has_document: true,
      has_expiry: true,
      has_description: true,
      request_status: "pending",
      modules: [],
      urls: ["", ""],
      has_back_side: false,
      description: "",
      expiry_date: "",
      driver: null,
      upload_later: false,
    },
    proof_of_address: {
      document_name: "Proof of Address",
      has_document: true,
      has_expiry: true,
      has_description: true,
      request_status: "pending",
      modules: [],
      urls: ["", ""],
      has_back_side: false,
      description: "",
      expiry_date: "",
      driver: null,
      upload_later: false,
    },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadLaterDialog, setUploadLaterDialog] = useState<{ open: boolean; docId: string | null }>({
    open: false,
    docId: null,
  });

  // Task Dialog State
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<any>(null);

  // CPC Module Dialog
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  // Handle "Upload Later" → Open CreateTaskDialog with prefill
  const handleUploadLater = (docId: string) => {
    const docInfo = documentTypes.find((d) => d.id === docId);
    if (!docInfo || !driverId) return;

    const docLabel = docInfo.label;

    // Mark document as upload_later
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        urls: ["", ""],
        has_back_side: false,
        upload_later: true,
        description: "Upload later",
      },
    }));

    // Close confirmation dialog
    setUploadLaterDialog({ open: false, docId: null });

    // Prepare prefill
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const deadlineStr = sevenDaysFromNow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

    setTaskPrefill({
      title: `Upload missing document: ${docLabel}`,
      description: `Driver (ID: ${driverId}) marked "${docLabel}" as "Upload Later" during registration.\n\nPlease upload this document as soon as possible.`,
      priority: "high",
      deadline: deadlineStr,
      estimatedHours: "1",
      requiresApproval: false,
    });

    setCreateTaskOpen(true);

    toast({
      title: "Upload Later Confirmed",
      description: `Creating reminder task for "${docLabel}"...`,
    });
  };

  const cancelUploadLater = (docId: string) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        upload_later: false,
        description: "",
      },
    }));
  };

  const handleTaskCreated = () => {
    toast({
      title: "Task Created Successfully",
      description: "Reminder task has been added.",
    });
  };

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    documentTypes.forEach((docType) => {
      const comp = competencies[docType.id];

      if (docType.id === "tacho_card" && !comp.has_document) {
        if (!comp.description.trim()) {
          errors[`${docType.id}_reason`] = "Reason is required if Tacho Card is not provided.";
        }
        return;
      }

      if (comp.has_document && !comp.urls[0] && !comp.upload_later) {
        errors[`${docType.id}_front_image`] = `Front image is required for ${docType.label}.`;
      }

      if (comp.has_expiry && !comp.expiry_date) {
        errors[`${docType.id}_expiry_date`] = `Expiry date is required for ${docType.label}.`;
      }

      if (comp.has_expiry && comp.expiry_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(comp.expiry_date)) {
          errors[`${docType.id}_expiry_date`] = "Invalid date format.";
        } else if (new Date(comp.expiry_date) < new Date()) {
          errors[`${docType.id}_expiry_date`] = "Expiry date cannot be in the past.";
        }
      }

      if (docType.id === "cpc" && comp.modules.length < 5) {
        errors["cpc_modules"] = "A minimum of 5 CPC modules are required.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [competencies]);

  const handleUploadSuccess = useCallback(
    (docId: string, side: "front" | "back") => (url: string) => {
      setCompetencies((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          urls: side === "front" ? [url, prev[docId].urls[1] || ""] : [prev[docId].urls[0], url],
          has_back_side: side === "back",
          upload_later: false,
          description: prev[docId].upload_later ? "" : prev[docId].description,
        },
      }));
      setFormErrors((prev) => ({ ...prev, [`${docId}_${side}_image`]: "" }));
    },
    []
  );

  const handleInputChange = useCallback((docId: string, field: string, value: string) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value },
    }));
    setFormErrors((prev) => ({ ...prev, [`${docId}_${field}`]: "" }));
  }, []);

  const toggleExpiryRequired = useCallback((docId: string, checked: boolean) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        has_expiry: checked,
        expiry_date: checked ? prev[docId].expiry_date : "",
      },
    }));
  }, []);

  const handleCheckboxChange = useCallback((docId: string, checked: boolean) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        has_document: checked,
        description: checked ? prev[docId].description : "",
        urls: checked ? prev[docId].urls : ["", ""],
        upload_later: false,
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!driverId || !validateForm()) return;

      startTransition(async () => {
        setIsSubmittingMainForm(true);

        const payload = {
          professional_competencies: Object.values(competencies)
            .filter((c) => c.has_document || c.document_name === "Tacho Card")
            .map((c) => ({
              driver: driverId,
              document_name: c.document_name,
              has_expiry: c.has_expiry,
              expiry_date: c.has_expiry ? c.expiry_date : "",
              description: c.description || "",
              has_document: c.has_document,
              has_back_side: c.has_back_side,
              urls: c.urls.filter(Boolean),
              request_status: c.upload_later ? "pending_upload" : "pending",
              has_description: c.has_description,
              modules: c.modules,
            })),
        };

        try {
          const res = await fetch(`${API_URL}/api/profiles/professional-competency/bulk-create/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error("Failed to submit");

          setDocumentsData(competencies);
          router.refresh();
        } catch (err) {
          toast({
            title: "Submission Failed",
            description: "Could not save documents. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsSubmittingMainForm(false);
        }
      });
    },
    [competencies, driverId, validateForm, setDocumentsData, goToNextStep, token]
  );

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            <span className="text-orange-500">Step 4:</span> Documents
          </CardTitle>
          <CardDescription>Upload required documents or mark as &quot;Upload Later&quot;</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {driverId === null ? (
              <p className="text-center text-red-500 py-10">Please complete previous steps first.</p>
            ) : (
              documentTypes.map((doc) => {
                const comp = competencies[doc.id];
                const hasFront = !!comp.urls[0];
                const hasBack = !!comp.urls[1];

                return (
                  <div key={doc.id} className="rounded-lg bg-white p-6 shadow-md">
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {doc.id === "tacho_card" && (
                            <Checkbox
                              checked={comp.has_document}
                              onCheckedChange={(c) => handleCheckboxChange(doc.id, c as boolean)}
                            />
                          )}
                          <h3 className="text-lg text-red-500 font-semibold">
                            {doc.label}
                            {doc.id !== "tacho_card" && <span className="text-black ml-1">*</span>}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {(doc.id !== "tacho_card" || comp.has_document) && !comp.upload_later && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div>
                            <Label>Front Image <span className="text-red-500">*</span></Label>
                            {hasFront ? (
                              <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Uploaded
                              </div>
                            ) : (
                              <FileUploader
                                id={`${doc.id}_front`}
                                onUploadSuccess={handleUploadSuccess(doc.id, "front")}
                                accept="image/*,application/pdf"
                                maxSize={10 * 1024 * 1024}
                              />
                            )}
                            {formErrors[`${doc.id}_front_image`] && (
                              <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_front_image`]}</p>
                            )}
                          </div>

                          <div>
                            <Label>Back Image (if applicable)</Label>
                            {hasBack ? (
                              <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Uploaded
                              </div>
                            ) : (
                              <FileUploader
                                id={`${doc.id}_back`}
                                onUploadSuccess={handleUploadSuccess(doc.id, "back")}
                                accept="image/*,application/pdf"
                                maxSize={10 * 1024 * 1024}
                              />
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="mb-6"
                          onClick={() => setUploadLaterDialog({ open: true, docId: doc.id })}
                        >
                          Upload Later
                        </Button>

                       
                        <div className="flex justify-between gap-4">
                        <div className=" flex flex-col gap-4 min-w-[200px]">
                            {comp.has_expiry && (
                            <div>
                              <Label>Expiry Date</Label>
                              <Input
                                type="date"
                                value={comp.expiry_date}
                                className="w-[200px]"
                                onChange={(e) => handleInputChange(doc.id, "expiry_date", e.target.value)}
                              />
                              {formErrors[`${doc.id}_expiry_date`] && (
                                <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_expiry_date`]}</p>
                              )}
                            </div>
                          )}
                           <div className="flex items-center justify-between mb-4">
                          <Label htmlFor={`${doc.id}-expiry-toggle`}>Has Expiry Date</Label>
                          <Switch
                            id={`${doc.id}-expiry-toggle`}
                            checked={comp.has_expiry}
                            onCheckedChange={(c) => toggleExpiryRequired(doc.id, c)}
                          />
                        </div>
                        </div>

                          <div>
                            <Label>Description (optional)</Label>
                            <Input
                              placeholder="e.g. Valid until 2030"
                              value={comp.description}
                              onChange={(e) => handleInputChange(doc.id, "description", e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {comp.upload_later && (
                      <div className="my-6 p-5 bg-amber-50 border border-amber-300 rounded-lg">
                        <p className="font-medium text-amber-800">Document marked as &quot;Upload Later&quot;</p>
                        <p className="text-sm text-amber-700 mt-1">
                          A reminder task has been scheduled.
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-amber-900 mt-3"
                          onClick={() => cancelUploadLater(doc.id)}
                        >
                          Undo – Upload Now
                        </Button>
                      </div>
                    )}

                    {doc.id === "tacho_card" && !comp.has_document && (
                      <div className="mt-4">
                        <Label>Reason for not providing</Label>
                        <Input
                          placeholder="e.g. Not required for my role"
                          value={comp.description}
                          onChange={(e) => handleInputChange(doc.id, "description", e.target.value)}
                        />
                        {formErrors[`${doc.id}_reason`] && (
                          <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_reason`]}</p>
                        )}
                      </div>
                    )}

                    {/* CPC Modules */}
                    {doc.id === "cpc" && (comp.has_document || comp.upload_later) && (
                      <div className="mt-8 p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <Label className="text-lg font-semibold">CPC Modules</Label>
                            <p className="text-sm text-gray-600">You must add at least 5 modules</p>
                          </div>
                          <span className="text-lg font-bold text-orange-600">
                            {comp.modules.length} / 5
                          </span>
                        </div>

                        {comp.modules.length < 5 && (
                          <p className="text-sm text-red-600 mb-4">
                            {5 - comp.modules.length} more module(s) required
                          </p>
                        )}

                        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              className="mb-4"
                              onClick={() => {
                                setCurrentDocId("cpc");
                                setCurrentModule(null);
                                setCurrentModuleIndex(null);
                              }}
                            >
                              Add CPC Module
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{currentModule ? "Edit" : "Add"} CPC Module</DialogTitle>
                            </DialogHeader>
                            <ModuleForm
                              initialData={currentModule}
                              onSubmit={(data) => {
                                setCompetencies((prev) => ({
                                  ...prev,
                                  cpc: {
                                    ...prev.cpc,
                                    modules:
                                      currentModuleIndex !== null
                                        ? prev.cpc.modules.map((m, i) => (i === currentModuleIndex ? data : m))
                                        : [...prev.cpc.modules, data],
                                  },
                                }));
                                setIsModuleDialogOpen(false);
                                setCurrentModule(null);
                                setCurrentModuleIndex(null);
                              }}
                              onCancel={() => {
                                setIsModuleDialogOpen(false);
                                setCurrentModule(null);
                                setCurrentModuleIndex(null);
                              }}
                            />
                          </DialogContent>
                        </Dialog>

                        {comp.modules.length > 0 && (
                          <div className="space-y-3">
                            {comp.modules.map((m, i) => (
                              <div key={i} className="flex justify-between items-center border p-4 rounded bg-white">
                                <div>
                                  <p className="font-medium">{m.module_name}</p>
                                  <p className="text-sm text-gray-600">{m.description}</p>
                                  <p className="text-sm text-gray-500">Expires: {m.expiry_date}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCurrentModule(m);
                                      setCurrentModuleIndex(i);
                                      setIsModuleDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setCompetencies((prev) => ({
                                        ...prev,
                                        cpc: {
                                          ...prev.cpc,
                                          modules: prev.cpc.modules.filter((_, idx) => idx !== i),
                                        },
                                      }));
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
   <CardFooter className="flex justify-between">
          <div className="grid grid-cols-3 gap-3 w-full">
            {/* Previous */}
            <Button
              type="button"
              variant="outline"
              className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
              onClick={goToPreviousStep}
              disabled={disableBack }
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

             <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isPending || driverId === null || isSubmittingMainForm}
            >
              {isPending ? "Submitting..." : "Complete Registration"}
            </Button>

            {/* Save & Next */}
            {/* <Button
              type="button"
              variant="outline"
              className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
              onClick={ handleSubmit}
              disabled={ driverId === null }
            >
              Next & Save
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button> */}
          </div>
        </CardFooter>
        </form>

        {/* Upload Later Confirmation Dialog */}
        <Dialog open={uploadLaterDialog.open} onOpenChange={(o) => setUploadLaterDialog({ ...uploadLaterDialog, open: o })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Later?</DialogTitle>
              <DialogDescription>
                This document will be marked as pending and a reminder task will be created.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadLaterDialog({ open: false, docId: null })}>
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => uploadLaterDialog.docId && handleUploadLater(uploadLaterDialog.docId)}
              >
                Confirm – Upload Later
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Full Task Creation Dialog with Prefill */}
      <CreateTaskDialog
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={handleTaskCreated}
        prefill={taskPrefill}
      />
    </>
  );
}

// Module Form (unchanged)
function ModuleForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: Module | null;
  onSubmit: (data: Module) => void;
  onCancel: () => void;
}) {
  const [moduleName, setModuleName] = useState(initialData?.module_name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName || !description || !expiryDate) return;

    onSubmit({
      module_name: moduleName.trim(),
      description: description.trim(),
      expiry_date: expiryDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Module Name</Label>
        <Input value={moduleName} onChange={(e) => setModuleName(e.target.value)} required />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <Label>Expiry Date</Label>
        <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
          {initialData ? "Update" : "Add"} Module
        </Button>
      </div>
    </form>
  );
}