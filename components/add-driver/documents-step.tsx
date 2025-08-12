"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStepper } from "@/components/ui/stepper";
import { useActionState, useState } from "react";
import { submitDocuments } from "../action";
import FileUploader from "../Media/MediaUpload";
// Import shared types
// types/professionalCompetency.ts
export interface Module {
  module_name: string;
  description: string;
  expiry_date: string;
}

export interface ProfessionalCompetency {
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
  setDocumentsData: (data: any) => void;
}

export function DocumentsStep({ driverId, setDocumentsData }: DocumentsStepProps) {
  const { goToNextStep, goToPreviousStep } = useStepper();
  const [competencies, setCompetencies] = useState<{ [key: string]: ProfessionalCompetency }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  const [documentsState, documentsAction, documentsPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (driverId === null) {
        return {
          success: false,
          message: "Please complete the 'Personal Info', 'Next of Kin', and 'Health Questions' steps first.",
        };
      }
    //@ts-expect-error ab thk ha
      const result = await submitDocuments({ driverId, competencies });
      if (result.success) {
        setDocumentsData(competencies);
        goToNextStep();
      }
      return result;
    },
    { success: false, message: "" },
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
        urls: side === "front" ? [url, prev[docId]?.urls[1] || ""] : [prev[docId]?.urls[0] || "", url],
      },
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    documentTypes.forEach((docType) => {
      const competency = competencies[docType.id];
      if (competency?.has_document) {
        if (!competency.urls[0]) {
          errors[`${docType.id}_front_image`] = `Front image is required for ${docType.label}.`;
        }
        if (competency.has_expiry && competency.expiry_date && new Date(competency.expiry_date) < new Date()) {
          errors[`${docType.id}_expiry_date`] = `Expiry date for ${docType.label} cannot be in the past.`;
        }
        if (docType.id === "cpc" && competency.modules.length === 0) {
          errors[`${docType.id}_modules`] = `At least one CPC module is required.`;
        }
      } else if (!competency?.description) {
        errors[`${docType.id}_reason`] = `Reason is required if ${docType.label} is not provided.`;
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
              : m,
          ),
        },
      }));
    } else {
      setCompetencies((prev) => ({
        ...prev,
        [currentDocId]: {
          ...prev[currentDocId],
          modules: [...(prev[currentDocId]?.modules || []), module],
        },
      }));
    }
    setCurrentModule(null);
    setIsModuleDialogOpen(false);
    setCurrentDocId(null);
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
            ),
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
        document_name: documentTypes.find((d) => d.id === docId)?.label || "",
        has_expiry: checked,
        has_description: checked,
        request_status: "pending",
        modules: prev[docId]?.modules || [],
        urls: prev[docId]?.urls || ["", ""],
        has_back_side: prev[docId]?.has_back_side || false,
      },
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
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    console.log('hi',errors
    )

    if (Object.keys(errors).length === 0) {
      documentsAction(new FormData());
    }else{
      console.log("hello")
    }
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${docType.id}_has_document`}
                    checked={competencies[docType.id]?.has_document || false}
                    onCheckedChange={(checked) => handleCheckboxChange(docType.id, checked as boolean)}
                  />
                  <Label htmlFor={`${docType.id}_has_document`} className="text-sm font-medium text-gray-700">
                    I have a {docType.label}
                  </Label>
                </div>
                {competencies[docType.id]?.has_document && (
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
                        <Checkbox
                          id={`${docType.id}_has_back_side`}
                          checked={competencies[docType.id]?.has_back_side || false}
                          onCheckedChange={(checked) =>
                            setCompetencies((prev) => ({
                              ...prev,
                              [docType.id]: { ...prev[docType.id], has_back_side: checked as boolean },
                            }))
                          }
                        />
                        <Label htmlFor={`${docType.id}_has_back_side`} className="text-sm">
                          Has Back Side
                        </Label>
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
                          value={competencies[docType.id]?.expiry_date || ""}
                          onChange={(e) => handleInputChange(docType.id, "expiry_date", e.target.value)}
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
                          value={competencies[docType.id]?.description || ""}
                          onChange={(e) => handleInputChange(docType.id, "description", e.target.value)}
                          placeholder="e.g., Valid UK license"
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
                        {competencies[docType.id]?.modules.length > 0 && (
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
                {!competencies[docType.id]?.has_document && (
                  <div className="space-y-2">
                    <Label htmlFor={`${docType.id}_reason`} className="text-sm font-medium text-gray-700">
                      Reason if not provided
                    </Label>
                    <Input
                      id={`${docType.id}_reason`}
                      value={competencies[docType.id]?.description || ""}
                      onChange={(e) => handleInputChange(docType.id, "description", e.target.value)}
                      placeholder="e.g., Not applicable"
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
            <p className="text-sm text-red-500" aria-live="polite">
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
          >
            Previous
          </Button>
          <Button
            type="submit"
            className="bg-orange-600 text-white hover:bg-orange-700 text-sm"
            // disabled={documentsPending || driverId === null}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (moduleName && description && expiryDate) {
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