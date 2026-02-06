// app/drivers/DocumentsStep.tsx (WITH DBS CHECK ADDED)

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
} from "@/components/ui/dialog";
import { CheckCircle2, ChevronLeft, ChevronRight, Calendar, Upload, FileText, AlertCircle, Info, Clock, X, Loader2, CheckCircle } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

export interface Module {
  id?: number;
  module_name: string;
  description: string;
  expiry_date: string;
}

export interface ProfessionalCompetency {
  id?: number;
  driver: number | { id: number } | null;
  document_name: string;
  document_type: string;
  has_expiry: boolean;
  description: string;
  expiry_date: string | null;
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
  onOpenchange: (open: boolean) => void;
  driverProfileId?: number;
}

type DocumentType = {
  id: string;
  label: string;
  document_type: string;
  has_expiry: boolean;
  description: string;
  has_back_side: boolean;
  optional: boolean;
  dependsOnTachoCard?: boolean;
  stepperName?: string;
};

const documentTypes: readonly DocumentType[] = [
  {
    id: "driving-license",
    label: "Driving License",
    document_type: "driving-license",
    has_expiry: true,
    description: "Full driving license document",
    has_back_side: false,
    optional: false,
    stepperName: "License"
  },
  {
    id: "d-d1-category",
    label: "D / D1 Category",
    document_type: "d-d1-category",
    has_expiry: true,
    description: "D/D1 category entitlement",
    has_back_side: false,
    optional: false,
    stepperName: "D/D1"
  },
  {
    id: "last-driver-check-code",
    label: "Last Driver Check Code",
    document_type: "last-driver-check-code",
    has_expiry: false,
    description: "Last driver check code and date",
    has_back_side: false,
    optional: false,
    stepperName: "Check Code"
  },
  {
    id: "cpc-card",
    label: "CPC Card",
    document_type: "cpc-card",
    has_expiry: true,
    description: "Driver CPC Qualification Card",
    has_back_side: false,
    optional: false,
    stepperName: "CPC"
  },
  {
    id: "tacho-card",
    label: "Tacho Card",
    document_type: "tacho-card",
    has_expiry: true,
    description: "Digital tachograph card",
    has_back_side: false,
    optional: true,
    stepperName: "Tacho"
  },
  {
    id: "last-tacho-download",
    label: "Last Tacho Download",
    document_type: "last-tacho-download",
    has_expiry: false,
    description: "Last tachograph download date",
    has_back_side: false,
    optional: true,
    dependsOnTachoCard: true,
    stepperName: "Tacho Down"
  },
  {
    id: "dbs-check",
    label: "DBS Check",
    document_type: "dbs-check",
    has_expiry: true,
    description: "Disclosure and Barring Service check certificate",
    has_back_side: false,
    optional: false,
    stepperName: "DBS"
  },
  {
    id: "passport",
    label: "Passport",
    document_type: "passport",
    has_expiry: true,
    description: "Valid passport document",
    has_back_side: false,
    optional: false,
    stepperName: "Passport"
  },
  {
    id: "proof-of-address",
    label: "Proof of Address",
    document_type: "proof-of-address",
    has_expiry: false,
    description: "Proof of current address",
    has_back_side: false,
    optional: false,
    stepperName: "Address"
  },
] as const;

export function DocumentsStep({ driverId, setDocumentsData, existingDocuments, onOpenchange, driverProfileId }: DocumentsStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const [currentDocumentStep, setCurrentDocumentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<string[]>([]);

  const cookies = useCookies();
  const token = cookies.get("access_token");
  const router = useRouter();

  const [competencies, setCompetencies] = useState<Record<string, ProfessionalCompetency>>(() => {
    const defaultCompetencies: Record<string, ProfessionalCompetency> = {};

    documentTypes.forEach(doc => {
      const isOptional = doc.optional === true;
      const dependsOnTachoCard = doc.dependsOnTachoCard === true;

      defaultCompetencies[doc.id] = {
        id: undefined,
        document_name: doc.label,
        document_type: doc.document_type,
        has_document: !isOptional && !dependsOnTachoCard,
        has_expiry: doc.has_expiry,
        has_description: false,
        request_status: "pending",
        modules: [],
        next_five_modules: [],
        urls: ["", ""],
        has_back_side: doc.has_back_side || false,
        description: "",
        expiry_date: null,
        driver: null,
        upload_later: false,
      };
    });

    if (existingDocuments && existingDocuments.length > 0) {
      existingDocuments.forEach(doc => {
        if (doc.document_type && defaultCompetencies[doc.document_type]) {
          const driverObj = typeof doc.driver === 'number' ? { id: doc.driver } : doc.driver;

          defaultCompetencies[doc.document_type] = {
            ...defaultCompetencies[doc.document_type],
            ...doc,
            driver: driverObj,
            has_document: doc.urls && doc.urls.length > 0,
            upload_later: false,
            modules: doc.modules || [],
            expiry_date: doc.expiry_date || null,
            has_back_side: doc.urls.length > 1 || doc.has_back_side,
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

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<any>(null);

  const currentDoc = documentTypes[currentDocumentStep];
  const currentComp = competencies[currentDoc.id];
  const totalSteps = documentTypes.length;

  // Function to update driver profile with specific field
  const updateDriverProfile = async (field: string, value: string) => {
    if (!driverId || !token) {
      console.warn("Driver profile ID or token not available for update");
      return false;
    }

    try {
      const url = `${API_URL}/api/profiles/driver/${driverId}/`;

      const payload = {
        [field]: value
      };

      console.log("Updating driver profile with:", payload);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Driver profile update failed:", res.status, errorText);
        return false;
      }

      const result = await res.json();
      console.log("Driver profile updated successfully:", result);
      return true;
    } catch (error) {
      console.error("Error updating driver profile:", error);
      return false;
    }
  };

  const createTaskForUploadLater = async (documentName: string, driverId: number) => {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const deadlineStr = sevenDaysFromNow.toISOString().slice(0, 16);

      return {
        title: `Upload missing document: ${documentName}`,
        description: `Driver (ID: ${driverId}) marked "${documentName}" as "Upload Later" during registration.\n\nPlease upload this document as soon as possible.`,
        priority: "high",
        deadline: deadlineStr,
        estimatedHours: "1",
        requiresApproval: false,
        driver: driverId,
      };
    } catch (error) {
      console.error("Error creating task:", error);
      return null;
    }
  };

  const handleUploadLater = (docId: string) => {
    const docInfo = documentTypes.find((d) => d.id === docId);
    if (!docInfo || !driverId) return;

    const docLabel = docInfo.label;

    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        urls: [],
        has_back_side: false,
        upload_later: true,
        description: "Upload later",
        has_document: false,
        modules: docId === "cpc-card" ? [] : prev[docId].modules,
        expiry_date: null,
      },
    }));

    setUploadLaterDialog({ open: false, docId: null });

    createTaskForUploadLater(docLabel, driverId).then(taskData => {
      if (taskData) {
        setTaskPrefill(taskData);
        setCreateTaskOpen(true);
      }
    });
  };

  const cancelUploadLater = (docId: string) => {
    const docInfo = documentTypes.find((d) => d.id === docId);
    const isOptional = docInfo?.optional === true;
    const dependsOnTachoCard = docInfo?.dependsOnTachoCard === true;
    const tachoCardExists = competencies["tacho-card"]?.has_document;

    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        upload_later: false,
        description: "",
        has_document: !isOptional && !dependsOnTachoCard ? true :
          dependsOnTachoCard ? tachoCardExists : false,
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

  const validateCurrentDocument = () => {
    const docId = currentDoc.id;
    const comp = currentComp;
    const docType = currentDoc;

    const errors: Record<string, string> = {};

    if (comp.upload_later) return errors;

    if (docId === "last-tacho-download") {
      const tachoCardExists = competencies["tacho-card"]?.has_document;
      if (tachoCardExists && !comp.has_document) {
        errors[`${docId}_required`] = `${docType.label} is required when Tacho Card is provided.`;
      }

      if (tachoCardExists && comp.has_document) {
        if (!comp.expiry_date) {
          errors[`${docId}_expiry_date`] = `Download date is required for ${docType.label}.`;
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(comp.expiry_date)) {
          errors[`${docId}_expiry_date`] = "Invalid date format.";
        } else {
          // LAST TACHO DOWNLOAD: Must be today or past (not future)
          const downloadDate = new Date(comp.expiry_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          downloadDate.setHours(0, 0, 0, 0);

          if (downloadDate > today) {
            errors[`${docId}_expiry_date`] = "Download date cannot be in the future.";
          }
        }
      }
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (docType.optional && !comp.has_document && docId !== "last-tacho-download") {
      setFormErrors(errors);
      return true;
    }

    if (!docType.optional && !comp.has_document) {
      errors[`${docId}_required`] = `${docType.label} is required.`;
      setFormErrors(errors);
      return false;
    }

    if (comp.has_document) {
      if (docId !== "last-driver-check-code" && docId !== "last-tacho-download" && docId !== "dbs-check") {
        if (!comp.urls[0]) {
          errors[`${docId}_front_image`] = `${docType.label} is required.`;
        }
      }

      if (comp.has_expiry) {
        if (!comp.expiry_date) {
          errors[`${docId}_expiry_date`] = `${docId === "last-tacho-download" ? "Download date" : "Expiry date"} is required for ${docType.label}.`;
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(comp.expiry_date)) {
          errors[`${docId}_expiry_date`] = "Invalid date format.";
        } else {
          // SPECIAL DATE VALIDATION RULES:
          const expiryDate = new Date(comp.expiry_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);

          switch (docId) {
            case "last-driver-check-code":
              // LAST DRIVER CHECK CODE: Must be today or past (not future)
              if (expiryDate > today) {
                errors[`${docId}_expiry_date`] = "Check date cannot be in the future.";
              }
              break;

            case "dbs-check":
              // DBS CHECK: Allow any date (no validation)
              // License Expiry, D/D1, CPC Card, Tacho Card: Already validated as cannot be past
              break;

            default:
              // For License Expiry, D/D1, CPC Card, Tacho Card: Cannot be in past
              if (expiryDate < today) {
                errors[`${docId}_expiry_date`] = "Expiry date cannot be in the past.";
              }
              break;
          }
        }
      }

      if (docId === "cpc-card") {
        if (comp.modules.length < 5) {
          errors["cpc_modules"] = "All 5 CPC modules are required.";
        }

        comp.modules.forEach((module, index) => {
          if (!module.module_name.trim()) {
            errors[`cpc_module_${index}_name`] = `Module ${index + 1} name is required.`;
          }
          if (!module.expiry_date) {
            errors[`cpc_module_${index}_expiry`] = `Module ${index + 1} expiry date is required.`;
          }
        });
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveCurrentDocument = async () => {
    if (!driverId || !token) {
      toast({
        title: "Error",
        description: "Driver ID or authentication token is missing.",
        variant: "destructive",
      });
      return false;
    }

    if (!validateCurrentDocument()) {
      toast({
        title: "Validation Error",
        description: "Please fix errors before saving.",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);

    try {
      const docId = currentDoc.id;
      const comp = currentComp;
      const docType = currentDoc;

      // Handle Upload Later case
      if (comp.upload_later) {
        const taskData = await createTaskForUploadLater(docType.label, driverId);
        if (taskData) {
          setTaskPrefill(taskData);
          setCreateTaskOpen(true);
        }
        setSavedDocuments(prev => [...prev, docId]);
        toast({
          title: "Marked for Later Upload",
          description: `${docType.label} will be uploaded later.`,
        });
        return true;
      }

      const tachoCardExists = competencies["tacho-card"]?.has_document;

      // Skip Last Tacho Download if Tacho Card doesn't exist
      if (docId === "last-tacho-download") {
        if (!tachoCardExists || !comp.has_document) {
          setSavedDocuments(prev => [...prev, docId]);
          return true;
        }
      }

      // Skip optional documents if not provided
      if (docType.optional && !comp.has_document && docId !== "last-tacho-download") {
        setSavedDocuments(prev => [...prev, docId]);
        return true;
      }

      // Prepare the competency data
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

      // Special handling for Last Driver Check Code
      if (docId === "last-driver-check-code" && comp.expiry_date) {
        competency.description = comp.description || `Last driver check on ${comp.expiry_date}`;
      }

      // Special handling for Last Tacho Download
      if (docId === "last-tacho-download" && comp.expiry_date) {
        competency.description = comp.description || `Last tacho download on ${comp.expiry_date}`;
      }

      // Special handling for DBS Check
      if (docId === "dbs-check" && comp.expiry_date) {
        competency.description = comp.description || `DBS check valid until ${comp.expiry_date}`;
      }

      if (docId === "cpc-card" && comp.modules.length > 0) {
        competency.modules = comp.modules.map(module => ({
          module_name: module.module_name,
          description: module.description,
          expiry_date: module.expiry_date,
        }));
      } else {
        competency.modules = [];
      }

      if (comp.id) {
        competency.id = comp.id;
      }

      // Save the document to professional-competency API
      const url = comp.id
        ? `${API_URL}/api/profiles/professional-competency/${comp.id}/`
        : `${API_URL}/api/profiles/professional-competency/`;

      const method = comp.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(competency),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save ${docType.label}: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log(`Saved ${docType.label}:`, result);

      // UPDATE 1: If this is "Last Driver Check Code" and has a date, update driver profile
      if (docId === "last-driver-check-code" && comp.expiry_date) {
        try {
          const profileUpdated = await updateDriverProfile("last_driver_license_check_code_date", comp.expiry_date);
          if (profileUpdated) {
            toast({
              title: "Driver Profile Updated",
              description: `Driver check date (${comp.expiry_date}) saved to driver profile.`,
            });
          }
        } catch (profileError) {
          console.warn("Could not update driver profile, but document was saved:", profileError);
          // Don't fail the whole operation if profile update fails
        }
      }

      // UPDATE 2: If this is "Last Tacho Download" and has a date, update driver profile
      if (docId === "last-tacho-download" && comp.expiry_date && comp.has_document) {
        try {
          const profileUpdated = await updateDriverProfile("last_tacho_download", comp.expiry_date);
          if (profileUpdated) {
            toast({
              title: "Driver Profile Updated",
              description: `Last tacho download date (${comp.expiry_date}) saved to driver profile.`,
            });
          }
        } catch (profileError) {
          console.warn("Could not update driver profile, but document was saved:", profileError);
          // Don't fail the whole operation if profile update fails
        }
      }

      // Update local state
      setSavedDocuments(prev => [...prev, docId]);
      setCompetencies(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          id: result.id || comp.id,
        }
      }));

      toast({
        title: "Success",
        description: `${docType.label} saved successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error(`Error saving ${currentDoc.label}:`, error);
      toast({
        title: "Save Failed",
        description: error.message || `Could not save ${currentDoc.label}. Please try again.`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const success = await saveCurrentDocument();
    if (success) {
      if (currentDocumentStep < totalSteps - 1) {
        setCurrentDocumentStep(prev => prev + 1);
        setFormErrors({});
      } else {
        goToNextStep();
      }
    }
  };

  const handleBack = () => {
    if (currentDocumentStep > 0) {
      setCurrentDocumentStep(prev => prev - 1);
      setFormErrors({});
    }
  };

  const handleSkip = () => {
    const currentDocInfo = documentTypes[currentDocumentStep];
    if (currentDocInfo.optional) {
      setCompetencies(prev => ({
        ...prev,
        [currentDocInfo.id]: {
          ...prev[currentDocInfo.id],
          has_document: false,
          upload_later: false,
          urls: [],
        }
      }));
      setSavedDocuments(prev => [...prev, currentDocInfo.id]);

      if (currentDocumentStep < totalSteps - 1) {
        setCurrentDocumentStep(prev => prev + 1);
        setFormErrors({});
      } else {
        goToNextStep();
      }
    }
  };



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

      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${docId}_front_image`];
        delete newErrors[`${docId}_back_image`];
        delete newErrors[`${docId}_required`];
        return newErrors;
      });
    },
    []
  );

  const handleInputChange = useCallback((docId: string, field: string, value: string) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [field]: value,
        ...(field === 'expiry_date' && !value.trim() && { expiry_date: null })
      },
    }));

    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${docId}_${field}`];
      return newErrors;
    });
  }, []);

  const toggleExpiryRequired = useCallback((docId: string, checked: boolean) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        has_expiry: checked,
        expiry_date: checked ? prev[docId].expiry_date || "" : null,
      },
    }));
  }, []);

  const handleCheckboxChange = useCallback((docId: string, checked: boolean) => {
    setCompetencies((prev) => {
      const newCompetencies = { ...prev };

      newCompetencies[docId] = {
        ...prev[docId],
        has_document: checked,
        description: checked ? prev[docId].description : "",
        urls: checked ? prev[docId].urls : [],
        upload_later: false,
        has_back_side: false,
        modules: docId === "cpc-card" && !checked ? [] : prev[docId].modules,
        expiry_date: checked ? prev[docId].expiry_date : null,
      };

      if (docId === "tacho-card") {
        const lastTachoDoc = documentTypes.find(d => d.id === "last-tacho-download");
        if (lastTachoDoc && lastTachoDoc.dependsOnTachoCard) {
          newCompetencies["last-tacho-download"] = {
            ...prev["last-tacho-download"],
            has_document: checked,
            description: checked ? prev["last-tacho-download"].description : "",
            urls: checked ? prev["last-tacho-download"].urls : [],
            upload_later: false,
            expiry_date: checked ? prev["last-tacho-download"].expiry_date : null,
          };
        }
      }

      return newCompetencies;
    });

    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${docId}_required`];
      delete newErrors[`${docId}_front_image`];
      delete newErrors[`${docId}_back_image`];
      delete newErrors[`${docId}_expiry_date`];

      if (docId === "tacho-card") {
        delete newErrors["last-tacho-download_required"];
        delete newErrors["last-tacho-download_expiry_date"];
      }

      return newErrors;
    });
  }, []);

  const getDocumentStatus = (docId: string) => {
    if (savedDocuments.includes(docId)) return "saved";
    const comp = competencies[docId];
    if (comp.upload_later) return "pending_upload";
    if (comp.has_document && comp.urls.length > 0) return "pending";
    if (comp.has_document && comp.urls.length === 0 && docId !== "last-driver-check-code" && docId !== "last-tacho-download" && docId !== "dbs-check") return "needs_upload";
    if (comp.has_document && (docId === "last-driver-check-code" || docId === "last-tacho-download" || docId === "dbs-check")) return "pending";
    return "not_provided";
  };

  useEffect(() => {
    const cpcCompetency = competencies["cpc-card"];
    if (cpcCompetency && cpcCompetency.has_document && cpcCompetency.modules.length < 5) {
      const modules = [...cpcCompetency.modules];
      for (let i = modules.length; i < 5; i++) {
        modules.push({
          module_name: "",
          description: "",
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

  useEffect(() => {
    const tachoCardExists = competencies["tacho-card"]?.has_document;
    const lastTachoDoc = competencies["last-tacho-download"];

    if (tachoCardExists && !lastTachoDoc.has_document && !lastTachoDoc.upload_later) {
      setCompetencies(prev => ({
        ...prev,
        "last-tacho-download": {
          ...prev["last-tacho-download"],
          has_document: true,
        }
      }));
    }
  }, [competencies["tacho-card"]?.has_document]);

  const renderCurrentDocument = () => {
    const doc = currentDoc;
    const comp = currentComp;
    const status = getDocumentStatus(doc.id);
    const hasFront = comp.urls.length > 0 && comp.urls[0];
    const hasBack = comp.urls.length > 1 && comp.urls[1];
    const isOptional = doc.optional === true;
    const dependsOnTachoCard = doc.dependsOnTachoCard === true;
    const tachoCardExists = competencies["tacho-card"]?.has_document;
    const isLastTachoDownload = doc.id === "last-tacho-download";
    const isLastDriverCheck = doc.id === "last-driver-check-code";
    const isDBSCheck = doc.id === "dbs-check";
    const hasBackSideOption = doc.has_back_side === true;

    return (
      <Card key={doc.id} className="border-2 border-orange-100 hover:border-orange-300 transition-all hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${savedDocuments.includes(doc.id) ? 'bg-green-600' : comp.has_document && (comp.urls[0] || isLastDriverCheck || isLastTachoDownload || isDBSCheck) ? 'bg-gradient-to-br from-orange-500 to-indigo-500' : 'bg-gray-200'}`}>
                {savedDocuments.includes(doc.id) ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : (
                  <FileText className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {doc.label}
                  {!isOptional && !dependsOnTachoCard && <span className="text-red-500 ml-1">*</span>}
                  {dependsOnTachoCard && tachoCardExists && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  {doc.document_type.replace("-", " ")}
                  {isOptional && !dependsOnTachoCard && " (Optional)"}
                  {dependsOnTachoCard && tachoCardExists && " (Required with Tacho Card)"}
                  {dependsOnTachoCard && !tachoCardExists && " (Not Required)"}
                </p>
              </div>
            </div>
            <Badge className={savedDocuments.includes(doc.id)
              ? "bg-green-100 text-green-800 border-green-200"
              : status === "pending_upload"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : comp.has_document
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : isOptional
                    ? "bg-gray-100 text-gray-800 border-gray-200"
                    : "bg-red-100 text-red-800 border-red-200"}>
              {savedDocuments.includes(doc.id) ? "Saved" :
                status === "pending_upload" ? "Upload Later" :
                  comp.has_document ? "Ready" :
                    isOptional ? "Optional" : "Required"}
            </Badge>
          </div>

          {/* Special note for Last Driver Check Code */}
          {isLastDriverCheck && comp.expiry_date && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  This date will also be saved to the driver&apos;s profile as the last driver license check.
                </span>
              </p>
            </div>
          )}

          {/* Special note for Last Tacho Download */}
          {isLastTachoDownload && comp.expiry_date && tachoCardExists && (
            <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  This date will also be saved to the driver&apos;s profile as the last tacho download date.
                </span>
              </p>
            </div>
          )}

          {/* Special note for DBS Check */}
          {isDBSCheck && (
            <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  Disclosure and Barring Service (DBS) check is required for professional drivers.
                </span>
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Document Checkbox - FOR OPTIONAL AND CONDITIONAL DOCUMENTS */}
          {(isOptional || dependsOnTachoCard) && (
            <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg ${dependsOnTachoCard && !tachoCardExists ? 'bg-gray-50' : 'bg-blue-50'}`}>
              <Checkbox
                id={`${doc.id}-has-document`}
                checked={comp.has_document}
                onCheckedChange={(c) => handleCheckboxChange(doc.id, c as boolean)}
                disabled={dependsOnTachoCard && !tachoCardExists}
              />
              <Label htmlFor={`${doc.id}-has-document`} className="text-sm font-medium">
                {dependsOnTachoCard && !tachoCardExists
                  ? "Not required (No Tacho Card)"
                  : isOptional
                    ? "I have this document (Optional)"
                    : "I have this document"
                }
              </Label>
            </div>
          )}

          {/* Conditional requirement notice for Last Tacho Download */}
          {dependsOnTachoCard && tachoCardExists && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  This is <strong>required</strong> because you have a Tacho Card.
                  Please provide the last download date.
                </span>
              </p>
            </div>
          )}

          {/* Error message for required documents */}
          {formErrors[`${doc.id}_required`] && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {formErrors[`${doc.id}_required`]}
              </p>
            </div>
          )}

          {/* Document Upload Section */}
          {(!isOptional || (isOptional && comp.has_document)) &&
            !comp.upload_later &&
            (!dependsOnTachoCard || (dependsOnTachoCard && comp.has_document)) && (
              <>
                {/* For Last Driver Check Code, Last Tacho Download, and DBS Check */}
                {(isLastDriverCheck || isLastTachoDownload || isDBSCheck) ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {isLastDriverCheck ? "Last Check Date" :
                          isLastTachoDownload ? "Last Download Date" :
                            "DBS Expiry Date"}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={comp.expiry_date || ""}
                        onChange={(e) => handleInputChange(doc.id, "expiry_date", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                      />
                      {formErrors[`${doc.id}_expiry_date`] && (
                        <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_expiry_date`]}</p>
                      )}
                    </div>

                    {/* Optional document upload for these types */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Upload className="h-3 w-3" />
                        {isDBSCheck ? "DBS Certificate" : "Supporting Document"} (Optional)
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
                    </div>
                  </div>
                ) : (
                  /* Regular document upload for other documents */
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Upload className="h-3 w-3" />
                          Front Document
                          {!isOptional && <span className="text-red-500">*</span>}
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

                      {/* Back side upload - ALWAYS OPTIONAL */}
                      {hasBackSideOption && (
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
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Expiry Date Section */}
                    {doc.has_expiry && (
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
                            value={comp.expiry_date || ""}
                            onChange={(e) => handleInputChange(doc.id, "expiry_date", e.target.value)}
                            className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                          />
                        )}
                        {formErrors[`${doc.id}_expiry_date`] && (
                          <p className="text-sm text-red-500 mt-1">{formErrors[`${doc.id}_expiry_date`]}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    Description (Optional)
                  </Label>
                  <Textarea
                    placeholder={isLastDriverCheck || isLastTachoDownload || isDBSCheck
                      ? `e.g., ${isDBSCheck ? "DBS certificate number" : "Check code"}, additional notes, etc.`
                      : "e.g., Document number, additional notes, etc."}
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

          {/* Optional Document Not Provided State */}
          {isOptional && !dependsOnTachoCard && !comp.has_document && !comp.upload_later && (
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Optional Document</p>
                  <p className="text-sm text-gray-700 mt-1">
                    This document is optional. Check the box above if you have it to upload.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Document Not Required State */}
          {dependsOnTachoCard && !tachoCardExists && !comp.has_document && !comp.upload_later && (
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Not Required</p>
                  <p className="text-sm text-gray-700 mt-1">
                    This information is not required since no Tacho Card is provided.
                  </p>
                </div>
              </div>
            </div>
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

          {/* CPC Modules Section */}
          {doc.id === "cpc-card" && comp.has_document && !comp.upload_later && (
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
                  const cpcModule = comp.modules[index] || {
                    module_name: "",
                    description: "",
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
                            placeholder="Module Name *"
                            value={cpcModule.module_name}
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
                            value={cpcModule.description}
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
                            value={cpcModule.expiry_date}
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
  };

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
                Step 4: Professional Documents ({currentDocumentStep + 1}/{totalSteps})
              </CardTitle>
              <CardDescription className="text-gray-600">
                Upload required documents one by one. Each document is saved before moving to the next.
              </CardDescription>
            </div>
          </div>

          {/* Document Stepper */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {currentDoc.label}
              </span>
              <span className="text-sm text-gray-500">
                {savedDocuments.length} of {totalSteps} saved
              </span>
            </div>
            <Progress value={((currentDocumentStep + 1) / totalSteps) * 100} className="h-2" />

            <div className="flex items-center justify-between mt-4">
              {documentTypes.map((doc, index) => {
                const status = getDocumentStatus(doc.id);
                const isCurrent = index === currentDocumentStep;
                const isCompleted = savedDocuments.includes(doc.id);

                return (
                  <div key={doc.id} className="flex flex-col items-center relative">
                    {/* Connector line */}
                    {index < documentTypes.length - 1 && (
                      <div className="absolute top-4 left-12 w-12 h-0.5 bg-gray-300"></div>
                    )}

                    {/* Step circle */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10
                      ${isCurrent
                        ? 'bg-orange-600 text-white border-2 border-orange-600'
                        : isCompleted
                          ? 'bg-green-600 text-white border-2 border-green-600'
                          : status === "pending_upload"
                            ? 'bg-amber-500 text-white border-2 border-amber-500'
                            : 'bg-gray-200 text-gray-600 border-2 border-gray-300'
                      }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Document label - using stepperName from array */}
                    <span className={`text-xs mt-1 text-center max-w-[80px] truncate ${isCurrent ? 'font-semibold text-orange-700' : 'text-gray-600'
                      }`}>
                      {doc.stepperName || doc.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {driverId === null ? (
            <div className="text-center py-10 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600 mb-2">Driver Information Required</p>
              <p className="text-gray-600">Please complete previous steps to add driver information first.</p>
            </div>
          ) : (
            renderCurrentDocument()
          )}
        </CardContent>

        <CardFooter className="pt-6 border-t border-gray-200">
          <div className="flex justify-between w-full">
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={goToPreviousStep}
                disabled={disableBack}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Driver
              </Button>

              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleBack}
                disabled={currentDocumentStep === 0 || isSaving}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Document
              </Button>
            </div>

            <div className="space-x-2">


              <Button
                type="button"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6"
                onClick={handleNext}
                disabled={isSaving || driverId === null}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentDocumentStep === totalSteps - 1 ? (
                  "Save & Proceed"
                ) : (
                  <>
                    Save & Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

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