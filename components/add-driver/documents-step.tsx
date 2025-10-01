"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStepper } from "./DriverStepper";
import { useActionState } from "react";
import { submitDocuments } from "../action";
import FileUploader from "../Media/MediaUpload";

export interface Module {
  module_name: string;
  description: string;
  expiry_date: string;
}

export interface ProfessionalCompetency {
  driver: any; // Replace 'any' with the correct type if known
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
      driver: undefined
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
      driver: undefined
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
      driver: undefined
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
      driver: undefined
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
      driver: undefined
    },
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const [documentsState, documentsAction, documentsPending] = useActionState(
    async (_prevState: any, _formData: FormData) => {
      if (driverId === null) {
        return {
          success: false,
          message: "Please complete the 'Personal Info', 'Next of Kin', and 'Health Questions' steps first.",
        };
      }

      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return { success: false, message: "Please fix the errors in the form." };
      }

      const result = await submitDocuments({ driverId, competencies });
      if (result.success) {
        setDocumentsData(competencies);
        goToNextStep();
      }
      return result;
    },
    { success: false, message: "" }
  );

  const documentTypes = [
    { id: "d_or_d1_license", label: "D or D1 License" },
    { id: "cpc", label: "CPC" },
    { id: "tacho_card", label: "Tacho Card" },
    { id: "Passport_Right_To_Work", label: "Passport / Right To Work" },
    { id: "proof_of_address", label: "Proof of Address" },
  ];

  const handleUploadSuccess = (docId: string, side: "front" | "back") => (url: string) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        urls: side === "front" ? [url, prev[docId].urls[1] || ""] : [prev[docId].urls[0] || "", url],
      },
    }));
    setFormErrors((prev) => ({ ...prev, [`${docId}_${side}_image`]: "" }));
  };

  const validateForm = () => {
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
        } else if (competency.has_expiry && competency.expiry_date && new Date(competency.expiry_date) < new Date()) {
          errors[`${docType.id}_expiry_date`] = `Expiry date for ${docType.label} cannot be in the past.`;
        }
        if (docType.id === "cpc" && competency.modules.length === 0) {
          errors[`${docType.id}_modules`] = `At least one CPC module is required.`;
        }
      }
    });
    return errors;
  };

  const handleAddModule = (module: Module) => {
    if (!currentDocId) return;
    if (currentModule) {
      setCompetencies((prev) => ({
        ...prev,
        [currentDocId]: {
          ...prev[currentDocId],
          modules: prev[currentDocId].modules.map((m) =>
            m.module_name === currentModule.module_name &&
            m.description === currentModule.description &&
            m.expiry_date === currentModule.expiry_date
              ? module
              : m
          ),
        },
      }));
    } else {
      setCompetencies((prev) => ({
        ...prev,
        [currentDocId]: {
          ...prev[currentDocId],
          modules: [...prev[currentDocId].modules, module],
        },
      }));
    }
    setFormErrors((prev) => ({ ...prev, [`${currentDocId}_modules`]: "" }));
    setCurrentModule(null);
    setCurrentDocId(null);
    setIsModuleDialogOpen(false);
  };

  const handleEditModule = (docId: string, module: Module) => {
    setCurrentModule(module);
    setCurrentDocId(docId);
    setIsModuleDialogOpen(true);
  };

  const handleDeleteModule = (docId: string, module: Module) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        modules: prev[docId].modules.filter(
          (m) =>
            !(
              m.module_name === module.module_name &&
              m.description === module.description &&
              m.expiry_date === module.expiry_date
            )
        ),
      },
    }));
  };

  const handleCheckboxChange = (docId: string, checked: boolean) => {
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
  };

  const handleInputChange = (docId: string, field: string, value: string) => {
    setCompetencies((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [field]: value,
      },
    }));
    setFormErrors((prev) => ({ ...prev, [`${docId}_${field}`]: "" }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    documentsAction(new FormData());
  };

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
                              onClick={() => setCurrentDocId(docType.id)}
                            >
                              {currentModule ? "Edit Module" : "Add Module"}
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
                                    onClick={() => handleEditModule(docType.id, module)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteModule(docType.id, module)}
                                  >
                                    Delete
                                  </Button>
                                </div>
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
          {documentsState?.message && !documentsState.success && (
            <p className="text-sm text-red-500 mt-4" aria-live="polite">
              {documentsState.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="border border-orange-600 text-orange-600 hover:bg-orange-50 text-sm"
            onClick={goToPreviousStep}
            disabled={disableBack || documentsPending}
          >
            Previous
          </Button>
          <Button
            type="submit"
            className="bg-orange-600 text-white hover:bg-orange-700 text-sm"
            disabled={documentsPending || driverId === null}
          >
            {documentsPending ? "Uploading..." : "Upload & Complete"}
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

  const validateModule = () => {
    const newErrors: Partial<Record<keyof Module, string>> = {};
    if (!moduleName.trim()) newErrors.module_name = "Module name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!expiryDate) newErrors.expiry_date = "Expiry date is required";
    else if (new Date(expiryDate) < new Date()) newErrors.expiry_date = "Expiry date cannot be in the past";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateModule();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ module_name: moduleName, description, expiry_date: expiryDate });
    }
  };

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
        />
        {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date}</p>}
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700">
          Save
        </Button>
      </div>
    </form>
  );
}