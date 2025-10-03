"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Edit, Save, X, File } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import FileUploader from "@/components/Media/MediaUpload";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Stepper, StepperContent, StepperTabs, StepperNavigation, useStepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

interface ProfessionalCompetencyTabProps {
  competencyData: any[];
  editCompetencyData: any[];
  isEditingCompetency: boolean;
  savingCompetency: boolean;
  formatDate: (date: string | null) => string;
  isPdfUrl: (url: string) => boolean;
  selectedPdfUrl: string | null;
  setSelectedPdfUrl: (url: string | null) => void;
  handleCompetencyEditToggle: () => void;
  handleCompetencyInputChange: (id: number, field: string, value: string) => void;
  handleModuleInputChange: (competencyId: number, moduleId: number, field: string, value: string) => void;
  handleFileUpload: (competencyId: number, url: string, isBackSide: boolean) => void;
  handleSaveCompetency: () => void;
  handleNextFiveModulesChange: (competencyId: number, index: number, value: string) => void;
}

export default function ProfessionalCompetencyTab({
  competencyData,
  editCompetencyData,
  isEditingCompetency,
  savingCompetency,
  formatDate,
  isPdfUrl,
  selectedPdfUrl,
  setSelectedPdfUrl,
  handleCompetencyEditToggle,
  handleCompetencyInputChange,
  handleModuleInputChange,
  handleFileUpload,
  handleSaveCompetency,
  handleNextFiveModulesChange,
}: ProfessionalCompetencyTabProps) {
  const [openImageModal, setOpenImageModal] = useState(false);
  const [currentCompetencyId, setCurrentCompetencyId] = useState<number | null>(null);
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: { [key: string]: string } }>({});

  // Function to handle expiry date change and open the modal
  const handleExpiryDateChange = (competencyId: number, value: string) => {
    handleCompetencyInputChange(competencyId, "expiry_date", value);
    setCurrentCompetencyId(competencyId);
    setFrontUploaded(false);
    setBackUploaded(false);
    setOpenImageModal(true);
  };

  // Function to handle file upload and track status
  const handleModalFileUpload = (competencyId: number, url: string, isBackSide: boolean) => {
    handleFileUpload(competencyId, url, isBackSide);
    if (isBackSide) {
      setBackUploaded(true);
    } else {
      setFrontUploaded(true);
    }
  };

  // Function to handle modal save
  const handleModalSave = () => {
    setOpenImageModal(false);
    setFrontUploaded(false);
    setBackUploaded(false);
  };

  // Validation for each document
  const validateDocument = (competency: any) => {
    const errors: { [key: string]: string } = {};
    if (!competency.document_name) errors.document_name = "Document name is required";
    if (!competency.document_type) errors.document_type = "Document type is required";
    if (!competency.request_status) errors.request_status = "Status is required";
    if (competency.has_expiry && !competency.expiry_date) errors.expiry_date = "Expiry date is required";
    if (competency.has_document && competency.urls.length === 0) errors.urls = "At least one document is required";
    setValidationErrors((prev) => ({ ...prev, [competency.id]: errors }));
    return Object.keys(errors).length === 0;
  };

  // Generate tab labels from document names
  const tabLabels = (isEditingCompetency ? editCompetencyData : competencyData).map(
    (competency) => competency.document_name || `Document ${competency.id}`
  );

  return (
    <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
            <File className="h-6 w-6" />
            Professional Competency Details
          </CardTitle>
          <div className="flex gap-3">
            {isEditingCompetency ? (
              <>
                <Button
                  onClick={handleSaveCompetency}
                  disabled={savingCompetency}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  {savingCompetency ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCompetencyEditToggle}
                  disabled={savingCompetency}
                  className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCompetencyEditToggle}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Competencies
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-600">
          Documents and certifications related to professional competency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {competencyData.length === 0 ? (
          <p className="text-gray-600 text-center py-6">No professional competency records found.</p>
        ) : (
          <Stepper initialStep={0} totalSteps={competencyData.length} className="w-full">
            <StepperTabs labels={tabLabels} className="mb-4" />
            <StepperContent>
              {(isEditingCompetency ? editCompetencyData : competencyData).map((competency: any) => (
                <div key={competency.id} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
                  {isEditingCompetency ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Document Name</Label>
                        <Input
                          value={competency.document_name || ""}
                          onChange={(e) =>
                            handleCompetencyInputChange(competency.id, "document_name", e.target.value)
                          }
                          className={cn(
                            "border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg",
                            validationErrors[competency.id]?.document_name && "border-red-500"
                          )}
                          placeholder="Enter document name"
                          aria-invalid={!!validationErrors[competency.id]?.document_name}
                        />
                        {validationErrors[competency.id]?.document_name && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors[competency.id].document_name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Document Type</Label>
                        <Input
                          value={competency.document_type || ""}
                          onChange={(e) =>
                            handleCompetencyInputChange(competency.id, "document_type", e.target.value)
                          }
                          className={cn(
                            "border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg",
                            validationErrors[competency.id]?.document_type && "border-red-500"
                          )}
                          placeholder="Enter document type"
                          aria-invalid={!!validationErrors[competency.id]?.document_type}
                        />
                        {validationErrors[competency.id]?.document_type && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors[competency.id].document_type}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Status</Label>
                        <Select
                          value={competency.request_status}
                          onValueChange={(value) =>
                            handleCompetencyInputChange(competency.id, "request_status", value)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg",
                              validationErrors[competency.id]?.request_status && "border-red-500"
                            )}
                            aria-invalid={!!validationErrors[competency.id]?.request_status}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="not_approved">Not Approved</SelectItem>
                          </SelectContent>
                        </Select>
                        {validationErrors[competency.id]?.request_status && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors[competency.id].request_status}
                          </p>
                        )}
                      </div>
                      {competency.has_expiry && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-600">Expiry Date</Label>
                          <Input
                            type="date"
                            value={competency.expiry_date || ""}
                            onChange={(e) => handleExpiryDateChange(competency.id, e.target.value)}
                            className={cn(
                              "border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg",
                              validationErrors[competency.id]?.expiry_date && "border-red-500"
                            )}
                            aria-invalid={!!validationErrors[competency.id]?.expiry_date}
                          />
                          {validationErrors[competency.id]?.expiry_date && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors[competency.id].expiry_date}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="col-span-2">
                        <Label className="text-sm font-semibold text-gray-600">Description</Label>
                        <Textarea
                          value={competency.description || ""}
                          onChange={(e) =>
                            handleCompetencyInputChange(competency.id, "description", e.target.value)
                          }
                          className="w-full border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg p-2"
                          rows={4}
                          placeholder="Enter description"
                        />
                      </div>
                      {competency.has_document && (
                        <div className="col-span-2 space-y-4">
                          <div>
                            <Label className="text-sm font-semibold text-gray-600">Upload Front Side Document</Label>
                            <FileUploader
                              onUploadSuccess={(url) => handleFileUpload(competency.id, url, false)}
                              accept="image/*,application/pdf"
                              maxSize={5 * 1024 * 1024}
                              id={`file-upload-front-${competency.id}`}
                            />
                            {validationErrors[competency.id]?.urls && (
                              <p className="text-sm text-red-500 mt-1">{validationErrors[competency.id].urls}</p>
                            )}
                          </div>
                          {competency.has_back_side && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-600">Upload Back Side Document</Label>
                              <FileUploader
                                onUploadSuccess={(url) => handleFileUpload(competency.id, url, true)}
                                accept="image/*,application/pdf"
                                maxSize={5 * 1024 * 1024}
                                id={`file-upload-back-${competency.id}`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {competency.modules.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold text-gray-600">Modules</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                            {competency.modules.map((module: any) => (
                              <Card
                                key={module.id}
                                className="shadow-md bg-white hover:shadow-lg transition-all rounded-lg border border-purple-200"
                              >
                                <CardContent className="p-5">
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-semibold text-gray-600">Module Name</Label>
                                      <Input
                                        value={module.module_name || ""}
                                        onChange={(e) =>
                                          handleModuleInputChange(
                                            competency.id,
                                            module.id,
                                            "module_name",
                                            e.target.value
                                          )
                                        }
                                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                                        placeholder="Enter module name"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold text-gray-600">Description</Label>
                                      <Textarea
                                        value={module.description || ""}
                                        onChange={(e) =>
                                          handleModuleInputChange(
                                            competency.id,
                                            module.id,
                                            "description",
                                            e.target.value
                                          )
                                        }
                                        className="w-full border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg p-2"
                                        rows={3}
                                        placeholder="Enter module description"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold text-gray-600">Expiry Date</Label>
                                      <Input
                                        type="date"
                                        value={module.expiry_date || ""}
                                        onChange={(e) =>
                                          handleModuleInputChange(
                                            competency.id,
                                            module.id,
                                            "expiry_date",
                                            e.target.value
                                          )
                                        }
                                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      {competency.document_type === "cpc-card" && (
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold text-gray-600">Next Five Modules</Label>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all">
                                Add Next Five Modules
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md w-full">
                              <DialogHeader>
                                <DialogTitle>Edit Next Five Modules</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {competency.next_five_modules.map((module: string, index: number) => (
                                  <div key={index}>
                                    <Label className="text-sm font-semibold text-gray-600">{`Module ${index + 1}`}</Label>
                                    <Input
                                      value={module}
                                      onChange={(e) =>
                                        handleNextFiveModulesChange(competency.id, index, e.target.value)
                                      }
                                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                                      placeholder={`Enter module ${index + 1}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Document Name</Label>
                        <p className="font-medium text-purple-800">{competency.document_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Document Type</Label>
                        <p className="font-medium text-purple-800">{competency.document_type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Status</Label>
                        <Badge
                          className={`px-3 py-1 text-sm font-medium ${
                            competency.request_status === "pending"
                              ? "bg-orange-600 hover:bg-orange-700"
                              : competency.request_status === "approved"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-red-600 hover:bg-red-700"
                          } text-white rounded-full transition-colors`}
                        >
                          {competency.request_status.charAt(0).toUpperCase() + competency.request_status.slice(1)}
                        </Badge>
                      </div>
                      {competency.has_expiry && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-600">Expiry Date</Label>
                          <p className="font-medium text-purple-800">{formatDate(competency.expiry_date)}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <Label className="text-sm font-semibold text-gray-600">Description</Label>
                        <p className="font-medium text-purple-800">{competency.description || "No description provided"}</p>
                      </div>
                      {competency.has_document && competency.urls.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold text-gray-600">Document Links</Label>
                          <div className="flex flex-col gap-3 mt-2">
                            {competency.urls.map((url: string, index: number) => (
                              <div key={index}>
                                {isPdfUrl(url) ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button
                                        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 p-3 rounded-lg hover:bg-purple-100 w-full text-left"
                                        onClick={() => setSelectedPdfUrl(url)}
                                      >
                                        <ExternalLink className="h-5 w-5" />
                                        <span>
                                          {competency.has_back_side && index === 0
                                            ? "Front Side"
                                            : competency.has_back_side && index === 1
                                            ? "Back Side"
                                            : `Document ${index + 1}`}
                                        </span>
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl w-full">
                                      <DialogHeader>
                                        <DialogTitle>
                                          {competency.has_back_side && index === 0
                                            ? "Front Side"
                                            : competency.has_back_side && index === 1
                                            ? "Back Side"
                                            : `Document ${index + 1}`}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="w-full h-[600px]">
                                        <iframe
                                          src={selectedPdfUrl || url}
                                          title="PDF Viewer"
                                          className="w-full h-full border-0 rounded-lg"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 p-3 rounded-lg hover:bg-purple-100"
                                  >
                                    <ExternalLink className="h-5 w-5" />
                                    <span>
                                      {competency.has_back_side && index === 0
                                        ? "Front Side"
                                        : competency.has_back_side && index === 1
                                        ? "Back Side"
                                        : `Document ${index + 1}`}
                                    </span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {competency.modules.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold text-gray-600">Modules</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                            {competency.modules.map((module: any) => (
                              <Card
                                key={module.id}
                                className="shadow-md bg-white hover:shadow-lg transition-all rounded-lg border border-purple-200"
                              >
                                <CardContent className="p-5">
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-semibold text-gray-600">Module Name</Label>
                                      <p className="font-medium text-purple-800">{module.module_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold text-gray-600">Description</Label>
                                      <p className="font-medium text-purple-800">{module.description}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-semibold text-gray-600">Expiry Date</Label>
                                      <p className="font-medium text-purple-800">{formatDate(module.expiry_date)}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      {competency.document_type === "cpc-card" && (
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold text-gray-600">Next Five Modules</Label>
                          <div className="mt-2">
                            {competency.next_five_modules.map((module: string, index: number) => (
                              <p key={index} className="font-medium text-purple-800">{`Module ${index + 1}: ${module}`}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </StepperContent>
            <StepperNavigation className="mt-4" />
          </Stepper>
        )}
      </CardContent>

      {/* Modal for Updating Image on Expiry Date Change */}
      {isEditingCompetency && currentCompetencyId !== null && (
        <Dialog
          open={openImageModal}
          onOpenChange={(open) => {
            setOpenImageModal(open);
            if (!open) {
              setFrontUploaded(false);
              setBackUploaded(false);
            }
          }}
        >
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Update Document Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-600">Upload New Front Side Document</Label>
                <FileUploader
                  onUploadSuccess={(url) => handleModalFileUpload(currentCompetencyId, url, false)}
                  accept="image/*,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  id={`file-upload-front-modal-${currentCompetencyId}`}
                />
                {frontUploaded && (
                  <p className="text-sm text-green-600 mt-1">Front side uploaded successfully</p>
                )}
              </div>
              {editCompetencyData
                .find((comp: any) => comp.id === currentCompetencyId)
                ?.has_back_side && (
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Upload New Back Side Document</Label>
                  <FileUploader
                    onUploadSuccess={(url) => handleModalFileUpload(currentCompetencyId, url, true)}
                    accept="image/*,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    id={`file-upload-back-modal-${currentCompetencyId}`}
                  />
                  {backUploaded && (
                    <p className="text-sm text-green-600 mt-1">Back side uploaded successfully</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                onClick={handleModalSave}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
                disabled={
                  editCompetencyData.find((comp: any) => comp.id === currentCompetencyId)?.has_back_side
                    ? !frontUploaded || !backUploaded
                    : !frontUploaded
                }
              >
                <Save className="h-5 w-5 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenImageModal(false);
                  setFrontUploaded(false);
                  setBackUploaded(false);
                }}
                className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}