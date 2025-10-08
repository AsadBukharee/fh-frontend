"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStepper } from "./DriverStepper";
import FileUploader from "../Media/MediaUpload";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { format, parse } from "date-fns";

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
}

interface DocumentsStepProps {
  driverId: number | null;
  setDocumentsData: (data: Record<string, ProfessionalCompetency>) => void;
}

export function DocumentsStep({ driverId, setDocumentsData }: DocumentsStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const [isPending, startTransition] = useTransition();
  const [isSubmittingMainForm, setIsSubmittingMainForm] = useState(false);
  const cookies = useCookies();
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
    },
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const documentTypes = [
    { id: "d_or_d1_license", label: "D or D1 License" },
    { id: "cpc", label: "CPC" },
    { id: "tacho_card", label: "Tacho Card" },
    { id: "Passport_Right_To_Work", label: "Passport / Right To Work" },
    { id: "proof_of_address", label: "Proof of Address" },
  ];

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    documentTypes.forEach((docType) => {
      const competency = competencies[docType.id];
      if (docType.id === "tacho_card" && !competency.has_document) {
        if (!competency.description.trim()) {
          errors[`${docType.id}_reason`] = `Reason is required if ${docType.label} is not provided.`;
        }
      } else {
        if (!competency.urls[0]) {
          errors[`${docType.id}_front_image`] = `Front image is required for ${docType.label}.`;
        }
        if (competency.has_expiry && !competency.expiry_date) {
          errors[`${docType.id}_expiry_date`] = `Expiry date is required for ${docType.label}.`;
        } else if (
          competency.has_expiry &&
          competency.expiry_date &&
          !/^\d{4}-\d{2}-\d{2}$/.test(competency.expiry_date)
        ) {
          errors[`${docType.id}_expiry_date`] = `Expiry date for ${docType.label} must be in YYYY-MM-DD format.`;
        } else if (
          competency.has_expiry &&
          competency.expiry_date &&
          new Date(competency.expiry_date) < new Date()
        ) {
          errors[`${docType.id}_expiry_date`] = `Expiry date for ${docType.label} cannot be in the past.`;
        }
        if (docType.id === "cpc" && competency.modules.length === 0) {
          errors[`${docType.id}_modules`] = `At least one CPC module is required.`;
        }
        if (docType.id === "cpc") {
          competency.modules.forEach((module, index) => {
            if (!module.expiry_date) {
              errors[`${docType.id}_module_${index}_expiry_date`] = `Expiry date is required for CPC module ${module.module_name}.`;
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(module.expiry_date)) {
              errors[`${docType.id}_module_${index}_expiry_date`] = `Expiry date for CPC module ${module.module_name} must be in YYYY-MM-DD format.`;
            } else if (new Date(module.expiry_date) < new Date()) {
              errors[`${docType.id}_module_${index}_expiry_date`] = `Expiry date for CPC module ${module.module_name} cannot be in the past.`;
            }
          });
        }
      }
    });
    return errors;
  }, [competencies]);

  const handleAddModule = useCallback(
    (data: Module) => {
      if (!currentDocId) return;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expiry_date)) {
        setFormErrors((prev) => ({
          ...prev,
          [`${currentDocId}_module_expiry_date`]: "Expiry date must be in YYYY-MM-DD format.",
        }));
        return;
      }

      setCompetencies((prev) => ({
        ...prev,
        [currentDocId]: {
          ...prev[currentDocId],
          modules: currentModuleIndex !== null
            ? prev[currentDocId].modules.map((m, i) => (i === currentModuleIndex ? data : m))
            : [...prev[currentDocId].modules, data],
        },
      }));
      setFormErrors((prev) => ({ ...prev, [`${currentDocId}_modules`]: "" }));
      setCurrentModule(null);
      setCurrentModuleIndex(null);
      setCurrentDocId(null);
      setIsModuleDialogOpen(false);
    },
    [currentDocId, currentModuleIndex]
  );

  const handleEditModule = useCallback((docId: string, module: Module, index: number) => {
    setCurrentModule(module);
    setCurrentModuleIndex(index);
    setCurrentDocId(docId);
    setIsModuleDialogOpen(true);
  }, []);

  const handleDeleteModule = useCallback((docId: string, index: number) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        modules: prev[docId].modules.filter((_, i) => i !== index),
      },
    }));
  }, []);

  const handleCheckboxChange = useCallback((docId: string, checked: boolean) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        has_document: checked,
        has_expiry: checked,
        has_description: checked,
        urls: checked ? prev[docId].urls : ["", ""],
        description: checked ? prev[docId].description : "",
        expiry_date: checked ? prev[docId].expiry_date : "",
      },
    }));
    setFormErrors((prev) => ({
      ...prev,
      [`${docId}_reason`]: "",
      [`${docId}_front_image`]: "",
      [`${docId}_expiry_date`]: "",
    }));
  }, []);

  const handleInputChange = useCallback((docId: string, field: string, value: string) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [field]: field === "expiry_date" && value ? format(parse(value, "yyyy-MM-dd", new Date()), "yyyy-MM-dd") : value,
      },
    }));
    setFormErrors((prev) => ({ ...prev, [`${docId}_${field}`]: "" }));
  }, []);

  const handleUploadSuccess = useCallback(
    (docId: string, side: "front" | "back") => (url: string) => {
      setCompetencies((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          urls: side === "front" ? [url, prev[docId].urls[1] || ""] : [prev[docId].urls[0], url],
          has_back_side: side === "back" ? true : prev[docId].has_back_side,
        },
      }));
      setFormErrors((prev) => ({ ...prev, [`${docId}_${side}_image`]: "" }));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!driverId) {
        setApiError("Driver ID is required to submit documents.");
        return;
      }

      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      startTransition(async () => {
        setIsSubmittingMainForm(true);
        setApiError(null);

        const payload = {
          professional_competencies: Object.values(competencies)
            .filter((comp) => comp.has_document || comp.document_name === "Tacho Card")
            .map((comp) => ({
              driver: driverId,
              document_name: comp.document_name,
              has_expiry: comp.has_expiry,
              description: comp.description,
              expiry_date: comp.has_expiry && comp.expiry_date ? comp.expiry_date : "",
              has_document: comp.has_document,
              has_back_side: comp.has_back_side,
              urls: comp.urls.filter((url) => url),
              request_status: comp.request_status,
              has_description: comp.has_description,
              modules: comp.modules.map((module) => ({
                ...module,
                expiry_date: module.expiry_date || "",
              })),
            })),
        };

        console.log("Submitting payload:", JSON.stringify(payload, null, 2));

        try {
          const response = await fetch(`${API_URL}/api/profiles/professional-competency/bulk-create/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message && typeof errorData.message === "object") {
              const fieldErrors = Object.entries(errorData.message).reduce((acc, [field, errors]) => {
                if (Array.isArray(errors)) {
                  acc[field] = errors.map((err) => (err as any).string || err).join(", ");
                } else {
                  acc[field] = String(errors);
                }
                return acc;
              }, {} as Record<string, string>);
              setFormErrors(fieldErrors);
              throw new Error("Validation errors occurred. Please check the form.");
            }
            throw new Error(errorData.message || "Failed to submit documents");
          }

          const result = await response.json();
          setDocumentsData(competencies);
          goToNextStep();
        } catch (error: any) {
          setApiError(error.message || "An error occurred while submitting documents");
        } finally {
          setIsSubmittingMainForm(false);
        }
      });
    },
    [competencies, driverId, validateForm, setDocumentsData, goToNextStep]
  );

  useEffect(() => {
    if (!isPending) {
      setIsSubmittingMainForm(false);
    }
  }, [isPending]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Step 4: Documents</CardTitle>
        <CardDescription>Upload required documents for verification.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="driver_id" value={driverId || ""} />
        <CardContent className="space-y-6 min-h-[200px]">
          {driverId === null ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              Please complete the &quot;Personal Info&quot;, &quot;Next of Kin&quot;, and &quot;Health Questions&quot; steps first to enable this section.
            </div>
          ) : (
            documentTypes.map((docType) => (
              <div key={docType.id} className="space-y-4 rounded-md border p-4">
                {docType.id === "tacho_card" ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${docType.id}_has_document`}
                      checked={competencies[docType.id].has_document}
                      onCheckedChange={(checked) => handleCheckboxChange(docType.id, checked as boolean)}
                    />
                    <Label htmlFor={`${docType.id}_has_document`} className="text-sm font-medium text-gray-700">
                      I have a {docType.label}
                    </Label>
                  </div>
                ) : (
                  <Label className="text-sm font-medium text-gray-700">{docType.label} (Required)</Label>
                )}
                {competencies[docType.id].has_document && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${docType.id}_front_image`} className="text-sm font-medium text-gray-700">
                          Front Image
                        </Label>
                        <FileUploader
                          id={`${docType.id}_front_image`}
                          onUploadSuccess={handleUploadSuccess(docType.id, "front")}
                          accept="image/*,application/pdf"
                          maxSize={5 * 1024 * 1024}
                        />
                        {formErrors[`${docType.id}_front_image`] && (
                          <p className="text-sm text-red-500">{formErrors[`${docType.id}_front_image`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${docType.id}_back_image`} className="text-sm font-medium text-gray-700">
                          Back Image (if applicable)
                        </Label>
                        <FileUploader
                          id={`${docType.id}_back_image`}
                          onUploadSuccess={handleUploadSuccess(docType.id, "back")}
                          accept="image/*,application/pdf"
                          maxSize={5 * 1024 * 1024}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${docType.id}_expiry_date`} className="text-sm font-medium text-gray-700">
                          Expiry Date
                        </Label>
                        <Input
                          id={`${docType.id}_expiry_date`}
                          type="date"
                          value={competencies[docType.id].expiry_date}
                          onChange={(e) => handleInputChange(docType.id, "expiry_date", e.target.value)}
                          required={competencies[docType.id].has_expiry}
                          pattern="\d{4}-\d{2}-\d{2}"
                        />
                        {formErrors[`${docType.id}_expiry_date`] && (
                          <p className="text-sm text-red-500">{formErrors[`${docType.id}_expiry_date`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${docType.id}_description`} className="text-sm font-medium text-gray-700">
                          Description
                        </Label>
                        <Input
                          id={`${docType.id}_description`}
                          value={competencies[docType.id].description}
                          onChange={(e) => handleInputChange(docType.id, "description", e.target.value)}
                          placeholder="e.g., Valid UK license"
                          required={competencies[docType.id].has_description}
                        />
                      </div>
                    </div>
                    {docType.id === "cpc" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">CPC Modules</Label>
                        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="text-sm"
                              onClick={() => {
                                setCurrentDocId(docType.id);
                                setCurrentModule(null);
                                setCurrentModuleIndex(null);
                              }}
                            >
                              Add Module
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{currentModule ? "Edit CPC Module" : "Add CPC Module"}</DialogTitle>
                            </DialogHeader>
                            <ModuleForm
                              initialData={currentModule}
                              onSubmit={handleAddModule}
                              onCancel={() => {
                                setCurrentModule(null);
                                setCurrentModuleIndex(null);
                                setCurrentDocId(null);
                                setIsModuleDialogOpen(false);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        {competencies[docType.id].modules.length > 0 && (
                          <div className="space-y-2">
                            {competencies[docType.id].modules.map((module, index) => (
                              <div key={index} className="flex justify-between items-center border p-2 rounded-md">
                                <div>
                                  <p className="text-sm font-medium">{module.module_name}</p>
                                  <p className="text-sm text-gray-500">{module.description}</p>
                                  <p className="text-sm text-gray-500">Expires: {module.expiry_date}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditModule(docType.id, module, index)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteModule(docType.id, index)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                                {formErrors[`${docType.id}_module_${index}_expiry_date`] && (
                                  <p className="text-sm text-red-500">
                                    {formErrors[`${docType.id}_module_${index}_expiry_date`]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {formErrors[`${docType.id}_modules`] && (
                          <p className="text-sm text-red-500">{formErrors[`${docType.id}_modules`]}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
                {docType.id === "tacho_card" && !competencies[docType.id].has_document && (
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.id}_reason`} className="text-sm font-medium text-gray-700">
                      Reason if not provided
                    </Label>
                    <Input
                      id={`${docType.id}_reason`}
                      value={competencies[docType.id].description}
                      onChange={(e) => handleInputChange(docType.id, "description", e.target.value)}
                      placeholder="e.g., Not applicable"
                      required
                    />
                    {formErrors[`${docType.id}_reason`] && (
                      <p className="text-sm text-red-500">{formErrors[`${docType.id}_reason`]}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {apiError && (
            <p className="text-sm text-red-500 mt-4" aria-live="polite">
              {apiError}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="border border-orange-600 text-orange-600 hover:bg-orange-50 text-sm"
            onClick={goToPreviousStep}
            disabled={disableBack || isPending}
          >
            Previous
          </Button>
          <Button
            type="submit"
            className="bg-orange-600 text-white hover:bg-orange-700 text-sm"
            disabled={isPending || driverId === null}
          >
            {isPending ? "Uploading..." : "Upload & Complete"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ModuleForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: Module | null;
  onSubmit: (module: Module) => void;
  onCancel: () => void;
}) {
  const [moduleName, setModuleName] = useState(initialData?.module_name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || "");
  const [errors, setErrors] = useState<Partial<Record<keyof Module, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setModuleName(initialData?.module_name || "");
    setDescription(initialData?.description || "");
    setExpiryDate(initialData?.expiry_date || "");
  }, [initialData]);

  const validateModule = useCallback(() => {
    const newErrors: Partial<Record<keyof Module, string>> = {};
    if (!moduleName.trim()) newErrors.module_name = "Module name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!expiryDate) newErrors.expiry_date = "Expiry date is required";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      newErrors.expiry_date = "Expiry date must be in YYYY-MM-DD format";
    } else if (new Date(expiryDate) < new Date()) {
      newErrors.expiry_date = "Expiry date cannot be in the past";
    }
    return newErrors;
  }, [moduleName, description, expiryDate]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      const newErrors = validateModule();
      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        onSubmit({
          module_name: moduleName,
          description,
          expiry_date: expiryDate ? format(parse(expiryDate, "yyyy-MM-dd", new Date()), "yyyy-MM-dd") : "",
        });
      }
      setIsSubmitting(false);
    },
    [moduleName, description, expiryDate, onSubmit, validateModule]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="module_name" className="text-sm font-medium text-gray-700">
          Module Name
        </Label>
        <Input
          id="module_name"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
          placeholder="e.g., Basic First Aid"
          required
        />
        {errors.module_name && <p className="text-sm text-red-500">{errors.module_name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
        </Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Basic first aid procedures"
          required
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiry_date" className="text-sm font-medium text-gray-700">
          Expiry Date
        </Label>
        <Input
          id="expiry_date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
          pattern="\d{4}-\d{2}-\d{2}"
        />
        {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date}</p>}
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-orange-600 text-white hover:bg-orange-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}