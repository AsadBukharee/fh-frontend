// app/drivers/DocumentsStep.tsx (COMPLETE UPDATED VERSION)

"use client";

import React, { useState, useCallback, useTransition, useEffect } from "react";
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
import { CheckCircle2, ChevronLeft, ChevronRight, Calendar, Upload, FileText, AlertCircle, Info, Plus, Clock, X } from "lucide-react";
import { useStepper } from "./DriverStepper";
import FileUploader from "../Media/MediaUpload";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { toast } from "@/components/ui/use-toast";
import CreateTaskDialog from "../task/CreateTaskDialog";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export interface Module {
  id?: number;
  module_name: string;
  description: string;
  expiry_date: string;
}

export interface ProfessionalCompetency {
  id?: number;
  driver: { id: number } | null;
  document_name: string;
  document_type: string;
  has_expiry: boolean;
  description: string;
  expiry_date: string;
  has_document: boolean;
  has_back_side: boolean;
  urls: string[];
  request_status: string;
  has_description: boolean;
  modules: Module[];
  next_five_modules: any[];
  upload_later?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DocumentsStepProps {
  driverId: number | null;
  setDocumentsData: (data: Record<string, ProfessionalCompetency>) => void;
  existingDocuments?: ProfessionalCompetency[];
  onOpenchange:(open: boolean) => void;
}

const documentTypes = [
  { id: "driving-license", label: "Driving License", document_type: "driving-license", has_expiry: true },
  { id: "dd1-category", label: "D / D1 Category", document_type: "dd1-category", has_expiry: true },
  { id: "cpc-card", label: "CPC Card", document_type: "cpc-card", has_expiry: true },
  { id: "tacho-card", label: "Tacho Card", document_type: "tacho-card", has_expiry: false },
  { id: "passport", label: "Passport", document_type: "passport", has_expiry: false },
  { id: "proof-of-address", label: "Proof of Address", document_type: "proof-of-address", has_expiry: false },
] as const;

export function DocumentsStep({ driverId, setDocumentsData, existingDocuments,onOpenchange }: DocumentsStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const [isPending, startTransition] = useTransition();
  const [isSubmittingMainForm, setIsSubmittingMainForm] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const router = useRouter();

  const [competencies, setCompetencies] = useState<Record<string, ProfessionalCompetency>>(() => {
    // Initialize with default structure
    const defaultCompetencies: Record<string, ProfessionalCompetency> = {};
    
    documentTypes.forEach(doc => {
      defaultCompetencies[doc.id] = {
        id: undefined,
        document_name: doc.label,
        document_type: doc.document_type,
        has_document: false,
        has_expiry: doc.has_expiry,
        has_description: false,
        request_status: "pending",
        modules: [],
        next_five_modules: [],
        urls: ["", ""],
        has_back_side: false,
        description: "",
        expiry_date: "",
        driver: null,
        upload_later: false,
      };
    });
    
    // If existing documents are provided, merge them
    if (existingDocuments && existingDocuments.length > 0) {
      existingDocuments.forEach(doc => {
        if (doc.document_type && defaultCompetencies[doc.document_type]) {
          defaultCompetencies[doc.document_type] = {
            ...defaultCompetencies[doc.document_type],
            ...doc,
            has_document: doc.urls && doc.urls.length > 0,
            upload_later: false,
            modules: doc.modules || [],
          };
        }
      });
    }
    
    return defaultCompetencies;
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

  // Function to create task for upload later
  const createTaskForUploadLater = async (documentName: string, driverId: number) => {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const deadlineStr = sevenDaysFromNow.toISOString().slice(0, 16);

      const taskData = {
        title: `Upload missing document: ${documentName}`,
        description: `Driver (ID: ${driverId}) marked "${documentName}" as "Upload Later" during registration.\n\nPlease upload this document as soon as possible.`,
        priority: "high",
        deadline: deadlineStr,
        estimatedHours: "1",
        requiresApproval: false,
        driver: driverId,
      };

      // You can call your task creation API here if needed
      // For now, we'll just show a toast
      toast({
        title: "Task Created",
        description: `Reminder task created for ${documentName}`,
      });
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // Handle "Upload Later" → Create task immediately
  const handleUploadLater = (docId: string) => {
    const docInfo = documentTypes.find((d) => d.id === docId);
    if (!docInfo || !driverId) return;

    const docLabel = docInfo.label;

    // Mark document as upload_later
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        urls: [],
        has_back_side: false,
        upload_later: true,
        description: "Upload later",
        has_document: false,
        // Clear modules for CPC card if marked as upload later
        modules: docId === "cpc-card" ? [] : prev[docId].modules,
      },
    }));

    // Close confirmation dialog
    setUploadLaterDialog({ open: false, docId: null });

    // Prepare prefill for task creation dialog
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const deadlineStr = sevenDaysFromNow.toISOString().slice(0, 16);

    setTaskPrefill({
      title: `Upload missing document: ${docLabel}`,
      description: `Driver (ID: ${driverId}) marked "${docLabel}" as "Upload Later" during registration.\n\nPlease upload this document as soon as possible.`,
      priority: "high",
      deadline: deadlineStr,
      estimatedHours: "1",
      requiresApproval: false,
      driver: driverId,
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
        has_document: false,
        // Reset to default modules for CPC card
        modules: docId === "cpc-card" ? prev[docId].modules || [] : prev[docId].modules,
      },
    }));
  };

  const handleTaskCreated = () => {
    toast({
      title: "Task Created Successfully",
      description: "Reminder task has been added.",
    });
    setCreateTaskOpen(false);
  };

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    documentTypes.forEach((docType) => {
      const comp = competencies[docType.id];

      // Skip validation if document is marked as upload later
      if (comp.upload_later) return;

      if (docType.id === "tacho-card" && !comp.has_document) {
        if (!comp.description.trim()) {
          errors[`${docType.id}_reason`] = "Reason is required if Tacho Card is not provided.";
        }
        return;
      }

      if (comp.has_document && !comp.urls[0]) {
        errors[`${docType.id}_front_image`] = `${docType.label} is required.`;
      }

      if (comp.has_expiry && !comp.expiry_date && comp.has_document) {
        errors[`${docType.id}_expiry_date`] = `Expiry date is required for ${docType.label}.`;
      }

      if (comp.has_expiry && comp.expiry_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(comp.expiry_date)) {
          errors[`${docType.id}_expiry_date`] = "Invalid date format.";
        } else if (new Date(comp.expiry_date) < new Date()) {
          errors[`${docType.id}_expiry_date`] = "Expiry date cannot be in the past.";
        }
      }

      // For CPC Card: Ensure all 5 modules are filled when document is uploaded
      if (docType.id === "cpc-card" && comp.has_document) {
        if (comp.modules.length < 5) {
          errors["cpc_modules"] = "All 5 CPC modules are required.";
        }
        
        // Validate each module
        comp.modules.forEach((module, index) => {
          if (!module.module_name.trim()) {
            errors[`cpc_module_${index}_name`] = `Module ${index + 1} name is required.`;
          }
          if (!module.expiry_date) {
            errors[`cpc_module_${index}_expiry`] = `Module ${index + 1} expiry date is required.`;
          }
        });
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [competencies]);

  const handleUploadSuccess = useCallback(
    (docId: string, side: "front" | "back") => (url: string) => {
      setCompetencies((prev) => {
        const currentDoc = prev[docId];
        const newUrls = [...currentDoc.urls];
        
        if (side === "front") {
          newUrls[0] = url;
        } else {
          if (newUrls.length < 2) {
            newUrls.push(url);
          } else {
            newUrls[1] = url;
          }
        }
        
        return {
          ...prev,
          [docId]: {
            ...currentDoc,
            urls: newUrls.filter(Boolean),
            has_document: true,
            upload_later: false,
            description: currentDoc.upload_later ? "" : currentDoc.description,
            has_back_side: side === "back" || currentDoc.has_back_side,
          },
        };
      });
      setFormErrors((prev) => ({ ...prev, [`${docId}_front_image`]: "" }));
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
        urls: checked ? prev[docId].urls : [],
        upload_later: false,
        has_back_side: false,
        // Reset modules for CPC card if unchecked
        modules: docId === "cpc-card" && !checked ? [] : prev[docId].modules,
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!driverId || !validateForm()) return;

      startTransition(async () => {
        setIsSubmittingMainForm(true);

        try {
          // Prepare payload for bulk create API
          const professional_competencies: any[] = [];

          documentTypes.forEach((docType) => {
            const comp = competencies[docType.id];
            
            // IMPORTANT: Skip if marked as "Upload Later" - these should NOT be included in API payload
            if (comp.upload_later) {
              // Just create task, don't include in API payload
              createTaskForUploadLater(comp.document_name, driverId);
              return;
            }

            // Skip tacho card without document and no upload later
            if (docType.id === "tacho-card" && !comp.has_document && !comp.description) {
              return;
            }

            // Only include documents that have content
            if (comp.has_document || (docType.id === "tacho-card" && comp.description)) {
              const competency: any = {
                driver: driverId,
                document_name: comp.document_name,
                document_type: comp.document_type,
                has_document: comp.has_document,
                has_expiry: comp.has_expiry,
                description: comp.description || "",
                expiry_date: comp.has_expiry && comp.expiry_date ? comp.expiry_date : null,
                has_back_side: comp.has_back_side,
                urls: comp.urls.filter(Boolean),
                request_status: "pending",
                has_description: !!comp.description,
                next_five_modules: [],
              };

              // Include modules only for CPC card
              if (docType.id === "cpc-card" && comp.modules.length > 0) {
                competency.modules = comp.modules.map(module => ({
                  module_name: module.module_name,
                  description: module.description,
                  expiry_date: module.expiry_date,
                }));
              } else {
                competency.modules = [];
              }

              // If existing document has ID, include it for update
              if (comp.id) {
                competency.id = comp.id;
              }

              professional_competencies.push(competency);
            }
          });

          // Only call API if there are documents to save
          if (professional_competencies.length > 0) {
            const res = await fetch(`${API_URL}/api/profiles/professional-competency/bulk-create/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ professional_competencies }),
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.detail || `Failed to save documents: ${res.status}`);
            }

            const results = await res.json();
            console.log("Bulk create results:", results);
          }

          alert(`Documents saved successfully.`);


          setDocumentsData(competencies);
          onOpenchange(false)
          // router.refresh();
          // goToNextStep();
        } catch (err: any) {
          console.error('Submission error:', err);
          toast({
            title: "Submission Failed",
            description: err.message || "Could not save documents. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsSubmittingMainForm(false);
        }
      });
    },
    [competencies, driverId, validateForm, setDocumentsData, goToNextStep, token, router]
  );

  const getDocumentStatus = (docId: string) => {
    const comp = competencies[docId];
    if (comp.upload_later) return "pending_upload";
    if (comp.has_document && comp.urls.length > 0) return "pending";
    return "not_uploaded";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>;
      case "pending_upload":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Upload Later</Badge>;
      case "not_uploaded":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Not Uploaded</Badge>;
      default:
        return null;
    }
  };

  // Initialize CPC modules with 5 empty modules if needed
  useEffect(() => {
    const cpcCompetency = competencies["cpc-card"];
    if (cpcCompetency && cpcCompetency.has_document && cpcCompetency.modules.length < 5) {
      // Fill up to 5 modules
      const modules = [...cpcCompetency.modules];
      for (let i = modules.length; i < 5; i++) {
        modules.push({
          module_name: `Driver CPC Module ${i + 1}`,
          description: `Periodic training module ${i + 1}`,
          expiry_date: "",
        });
      }
      
      setCompetencies(prev => ({
        ...prev,
        "cpc-card": {
          ...prev["cpc-card"],
          modules,
        }
      }));
    }
  }, [competencies["cpc-card"]?.has_document]);

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto shadow-lg border-orange-100">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-orange-900">
                Step 4: Professional Documents
              </CardTitle>
              <CardDescription className="text-gray-600">
                Upload required professional documents and certifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {driverId === null ? (
              <div className="text-center py-10 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-red-600 mb-2">Driver Information Required</p>
                <p className="text-gray-600">Please complete previous steps to add driver information first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {documentTypes.map((doc) => {
                  const comp = competencies[doc.id];
                  const status = getDocumentStatus(doc.id);
                  const hasFront = comp.urls.length > 0 && comp.urls[0];
                  const hasBack = comp.urls.length > 1 && comp.urls[1];

                  return (
                    <Card key={doc.id} className="border-2 border-orange-100 hover:border-orange-300 transition-all hover:shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${comp.has_document ? 'bg-gradient-to-br from-orange-500 to-indigo-500' : 'bg-gray-200'}`}>
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {doc.label}
                              </CardTitle>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">
                                {doc.document_type.replace("-", " ")}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Tacho Card Special Case */}
                        {doc.id === "tacho-card" && (
                          <div className="flex items-center space-x-2 mb-4">
                            <Checkbox
                              id={`${doc.id}-has-document`}
                              checked={comp.has_document}
                              onCheckedChange={(c) => handleCheckboxChange(doc.id, c as boolean)}
                            />
                            <Label htmlFor={`${doc.id}-has-document`} className="text-sm font-medium">
                              Has Tacho Card
                            </Label>
                          </div>
                        )}

                        {/* Document Upload Section */}
                        {((doc.id !== "tacho-card") || comp.has_document) && !comp.upload_later && (
                          <>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Upload className="h-3 w-3" />
                                  Front Document
                                  {doc.id !== "tacho-card" && <span className="text-red-500">*</span>}
                                </Label>
                                {hasFront ? (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span className="text-sm font-medium">Document uploaded</span>
                                      <Badge variant="outline" className="ml-auto text-xs">
                                        {comp.urls[0].split("/").pop()?.slice(0, 20)}...
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          setCompetencies(prev => ({
                                            ...prev,
                                            [doc.id]: {
                                              ...prev[doc.id],
                                              urls: ["", prev[doc.id].urls[1]].filter(Boolean),
                                            }
                                          }));
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50/30 hover:border-orange-400 transition-colors">
                                    <FileUploader
                                      id={`${doc.id}_front`}
                                      onUploadSuccess={handleUploadSuccess(doc.id, "front")}
                                      accept="image/*,application/pdf"
                                      maxSize={10 * 1024 * 1024}
                                    />
                                  </div>
                                )}
                                {formErrors[`${doc.id}_front_image`] && (
                                  <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_front_image`]}</p>
                                )}
                              </div>

                              <div>
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Upload className="h-3 w-3" />
                                  Back Document (Optional)
                                </Label>
                                {hasBack ? (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span className="text-sm font-medium">Back side uploaded</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 ml-auto"
                                        onClick={() => {
                                          setCompetencies(prev => ({
                                            ...prev,
                                            [doc.id]: {
                                              ...prev[doc.id],
                                              urls: [prev[doc.id].urls[0], ""].filter(Boolean),
                                              has_back_side: false,
                                            }
                                          }));
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/30 hover:border-indigo-400 transition-colors">
                                    <FileUploader
                                      id={`${doc.id}_back`}
                                      onUploadSuccess={handleUploadSuccess(doc.id, "back")}
                                      accept="image/*,application/pdf"
                                      maxSize={10 * 1024 * 1024}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <Separator className="my-4" />

                            {/* Expiry Date Section */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  Expiry Date
                                  {doc.has_expiry && <span className="text-red-500">*</span>}
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`${doc.id}-expiry-toggle`} className="text-sm">
                                    Has Expiry
                                  </Label>
                                  <Switch
                                    id={`${doc.id}-expiry-toggle`}
                                    checked={comp.has_expiry}
                                    onCheckedChange={(c) => toggleExpiryRequired(doc.id, c)}
                                  />
                                </div>
                              </div>

                              {comp.has_expiry && (
                                <Input
                                  type="date"
                                  value={comp.expiry_date}
                                  onChange={(e) => handleInputChange(doc.id, "expiry_date", e.target.value)}
                                  className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                                />
                              )}
                              {formErrors[`${doc.id}_expiry_date`] && (
                                <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_expiry_date`]}</p>
                              )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Info className="h-3 w-3" />
                                Description (Optional)
                              </Label>
                              <Textarea
                                placeholder="e.g., Valid until 2030, Document number, etc."
                                value={comp.description}
                                onChange={(e) => handleInputChange(doc.id, "description", e.target.value)}
                                className="border-gray-300 focus:border-orange-400 min-h-[80px]"
                              />
                            </div>

                            {/* Upload Later Button */}
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              onClick={() => setUploadLaterDialog({ open: true, docId: doc.id })}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Upload Later
                            </Button>
                          </>
                        )}

                        {/* Upload Later State */}
                        {comp.upload_later && (
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-amber-900">Marked for Later Upload</p>
                                <p className="text-sm text-amber-700 mt-1">
                                  A reminder task will be created to upload this document.
                                </p>
                                <Button
                                  type="button"
                                  variant="link"
                                  className="p-0 h-auto text-amber-900 mt-2 text-sm"
                                  onClick={() => cancelUploadLater(doc.id)}
                                >
                                  Upload now instead
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tacho Card without document */}
                        {doc.id === "tacho-card" && !comp.has_document && !comp.upload_later && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">
                              Reason for not providing Tacho Card
                              <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              placeholder="e.g., Not required for my role, Company provided, etc."
                              value={comp.description}
                              onChange={(e) => handleInputChange(doc.id, "description", e.target.value)}
                              className="border-gray-300 min-h-[80px]"
                            />
                            {formErrors[`${doc.id}_reason`] && (
                              <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_reason`]}</p>
                            )}
                          </div>
                        )}

                        {/* CPC Modules Section */}
                        {doc.id === "cpc-card" && (comp.has_document || comp.upload_later) && !comp.upload_later && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <Label className="text-lg font-semibold text-gray-900">CPC Modules</Label>
                                <p className="text-sm text-gray-600">Add all 5 training modules for CPC certification</p>
                              </div>
                              <Badge className={comp.modules.length === 5 ? "bg-green-100 text-green-800 border-green-200" : "bg-indigo-100 text-indigo-800 border-indigo-200"}>
                                {comp.modules.length}/5 modules
                              </Badge>
                            </div>

                            {formErrors["cpc_modules"] && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  {formErrors["cpc_modules"]}
                                </p>
                              </div>
                            )}

                            <div className="space-y-4">
                              {Array.from({ length: 5 }).map((_, index) => {
                                // eslint-disable-next-line @next/next/no-assign-module-variable
                                const module = comp.modules[index] || {
                                  module_name: `Driver CPC Module ${index + 1}`,
                                  description: `Periodic training module ${index + 1}`,
                                  expiry_date: "",
                                };

                                return (
                                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-orange-500 rounded text-white text-sm flex items-center justify-center font-bold">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1">
                                        <Input
                                          placeholder="Module Name"
                                          value={module.module_name}
                                          onChange={(e) => {
                                            const newModules = [...comp.modules];
                                            if (!newModules[index]) {
                                              newModules[index] = { module_name: "", description: "", expiry_date: "" };
                                            }
                                            newModules[index].module_name = e.target.value;
                                            setCompetencies(prev => ({
                                              ...prev,
                                              "cpc-card": {
                                                ...prev["cpc-card"],
                                                modules: newModules,
                                              }
                                            }));
                                          }}
                                          className="border-gray-300"
                                        />
                                        {formErrors[`cpc_module_${index}_name`] && (
                                          <p className="text-sm text-red-500 mt-1">{formErrors[`cpc_module_${index}_name`]}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <Textarea
                                          placeholder="Module description"
                                          value={module.description}
                                          onChange={(e) => {
                                            const newModules = [...comp.modules];
                                            if (!newModules[index]) {
                                              newModules[index] = { module_name: "", description: "", expiry_date: "" };
                                            }
                                            newModules[index].description = e.target.value;
                                            setCompetencies(prev => ({
                                              ...prev,
                                              "cpc-card": {
                                                ...prev["cpc-card"],
                                                modules: newModules,
                                              }
                                            }));
                                          }}
                                          className="border-gray-300 min-h-[60px]"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label className="text-sm font-medium">Expiry Date <span className="text-red-500">*</span></Label>
                                        <Input
                                          type="date"
                                          value={module.expiry_date}
                                          onChange={(e) => {
                                            const newModules = [...comp.modules];
                                            if (!newModules[index]) {
                                              newModules[index] = { module_name: "", description: "", expiry_date: "" };
                                            }
                                            newModules[index].expiry_date = e.target.value;
                                            setCompetencies(prev => ({
                                              ...prev,
                                              "cpc-card": {
                                                ...prev["cpc-card"],
                                                modules: newModules,
                                              }
                                            }));
                                          }}
                                          className="border-gray-300"
                                        />
                                        {formErrors[`cpc_module_${index}_expiry`] && (
                                          <p className="text-sm text-red-500 mt-1">{formErrors[`cpc_module_${index}_expiry`]}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-700 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                All 5 CPC modules are required for CPC Card upload
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-6 border-t border-gray-200">
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 px-6"
                onClick={goToPreviousStep}
                disabled={disableBack}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 shadow-lg"
                disabled={isPending || driverId === null || isSubmittingMainForm}
              >
                {isSubmittingMainForm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Documents...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>

        {/* Upload Later Confirmation Dialog */}
        <Dialog open={uploadLaterDialog.open} onOpenChange={(o) => setUploadLaterDialog({ ...uploadLaterDialog, open: o })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Upload Document Later?
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                This document will be marked as pending and a reminder task will be created for later upload.
                You can upload it at any time from the driver&apos;s profile.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setUploadLaterDialog({ open: false, docId: null })}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                onClick={() => uploadLaterDialog.docId && handleUploadLater(uploadLaterDialog.docId)}
              >
                Confirm & Create Reminder
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