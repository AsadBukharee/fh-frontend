"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Edit, Save, X, File, FileText, Calendar, CheckCircle, AlertCircle, Clock, BookOpen, Upload, Image as ImageIcon, FileCheck } from "lucide-react";
import FileUploader from "@/components/Media/MediaUpload";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ProfessionalCompetencyTabProps {
  competencyData: any[];
  formatDate: (date: string | null) => string;
  isPdfUrl: (url: string) => boolean;
  showToast: (message: string, type: string) => void;
  cookies: any;
  API_URL: string;
  fetchCompetencyData: () => void;
}

export default function ProfessionalCompetencyTab({
  competencyData,
  formatDate,
  isPdfUrl,
  showToast,
  cookies,
  API_URL,
  fetchCompetencyData,
}: ProfessionalCompetencyTabProps) {
  const [selectedCompetency, setSelectedCompetency] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [uploadRequired, setUploadRequired] = useState(false);
  const [originalExpiryDate, setOriginalExpiryDate] = useState<string | null>(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [reminderData, setReminderData] = useState({
    title: "",
    description: "",
    priority: "medium",
    start_date: "",
    recurrence: "once",
    recurrence_interval: 1,
  });

  const handleCardClick = (competency: any) => {
    setSelectedCompetency(competency);
    
    // Ensure next_five_modules always has exactly 5 items
    const nextFiveModules = competency.next_five_modules || [];
    const normalizedModules = [
      ...nextFiveModules,
      ...Array(5 - nextFiveModules.length).fill("")
    ].slice(0, 5);
    
    setEditData({
      ...competency,
      modules: competency.modules || [],
      next_five_modules: normalizedModules,
    });
    setOriginalExpiryDate(competency.expiry_date);
    setUploadRequired(false);
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev: any) => {
      // If expiry date is being changed, check if documents need to be uploaded
      if (field === "expiry_date" && value !== originalExpiryDate && prev.has_document) {
        setUploadRequired(true);
      }
      
      // If expiry date is being added for the first time
      if (field === "expiry_date" && value) {
        return {
          ...prev,
          [field]: value,
          has_expiry: true,
        };
      }
      
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleModuleChange = (index: number, field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      modules: prev.modules.map((module: any, i: number) =>
        i === index ? { ...module, [field]: value } : module
      ),
    }));
  };

  const handleNextFiveModulesChange = (index: number, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      next_five_modules: prev.next_five_modules.map((module: string, i: number) =>
        i === index ? value : module
      ),
    }));
  };

  const handleFileUpload = (url: string, isBackSide: boolean) => {
    setEditData((prev: any) => {
      const updatedUrls = [...(prev.urls || [])];
      if (isBackSide) {
        updatedUrls[1] = url;
      } else {
        updatedUrls[0] = url;
      }
      
      // Reset upload required flag when documents are uploaded
      const hasAllRequiredDocs = prev.has_back_side 
        ? updatedUrls[0] && updatedUrls[1]
        : updatedUrls[0];
      
      if (hasAllRequiredDocs && uploadRequired) {
        setUploadRequired(false);
      }
      
      return {
        ...prev,
        urls: updatedUrls,
        has_document: true,
      };
    });
    showToast("Document uploaded successfully", "success");
  };

  const saveChanges = async () => {
    if (!editData) return;

    setSaving(true);
    try {
      const payload = {
        driver: editData.driver,
        document_name: editData.document_name,
        has_expiry: editData.has_expiry || !!editData.expiry_date,
        description: editData.description || "",
        expiry_date: editData.expiry_date || null,
        has_document: editData.has_document,
        has_back_side: editData.has_back_side,
        urls: editData.urls || [],
        request_status: editData.request_status,
        has_description: editData.has_description || !!editData.description,
        next_five_modules: editData.next_five_modules.filter((m: string) => m.trim() !== ""),
        modules: editData.modules.map((module: any) => ({
          module_name: module.module_name,
          description: module.description,
          expiry_date: module.expiry_date,
        })),
      };

      const response = await fetch(`${API_URL}/api/profiles/professional-competency/${editData.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update professional competency");
      }

      const result = await response.json();
      if (result.success) {
        showToast("Professional competency updated successfully", "success");
        setIsModalOpen(false);
        setIsEditing(false);
        setUploadRequired(false);
        fetchCompetencyData();
      } else {
        throw new Error(result.message || "Failed to update");
      }
    } catch (error) {
      console.error("Error updating competency:", error);
      showToast(error instanceof Error ? error.message : "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editData) return;

    // Validate if documents are required when expiry date changed
    if (uploadRequired && editData.has_document) {
      const hasAllRequiredDocs = editData.has_back_side 
        ? editData.urls[0] && editData.urls[1]
        : editData.urls[0];
      
      if (!hasAllRequiredDocs) {
        // Open reminder dialog instead of showing error
        openReminderDialog();
        return;
      }
    }

    await saveChanges();
  };

  const handleRemindMeLater = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        throw new Error("Failed to create reminder");
      }

      const result = await response.json();
      if (result.success || response.status === 201) {
        showToast("Reminder created successfully", "success");
        setIsReminderDialogOpen(false);
        
        // Reset reminder data
        setReminderData({
          title: "",
          description: "",
          priority: "medium",
          start_date: "",
          recurrence: "once",
          recurrence_interval: 1,
        });
        
        // Save changes without documents
        await saveChanges();
      } else {
        throw new Error(result.message || "Failed to create reminder");
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      showToast(error instanceof Error ? error.message : "Failed to create reminder", "error");
    }
  };

  const openReminderDialog = () => {
    // Pre-fill reminder data with document info
    setReminderData({
      title: `Upload documents for ${editData?.document_name}`,
      description: `Upload updated documents for ${editData?.document_name} with new expiry date: ${editData?.expiry_date}`,
      priority: "high",
      start_date: new Date().toISOString().split('T')[0],
      recurrence: "once",
      recurrence_interval: 1,
    });
    setIsReminderDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "not_approved":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "not_approved":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const openPdfModal = (url: string) => {
    setSelectedPdfUrl(url);
    setIsPdfModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg bg-gradient-to-br from-white via-orange-50/30 to-indigo-50/30 border-orange-100">
        <CardHeader className="border-b border-orange-100 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-3xl text-orange-900 font-bold">
                <div className="p-3 bg-orange-600 rounded-xl shadow-md">
                  <File className="h-7 w-7 text-white" />
                </div>
                Professional Competency
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-base">
                Manage and review all professional documents and certifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {competencyData.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
                <FileText className="h-10 w-10 text-orange-600" />
              </div>
              <p className="text-gray-600 text-lg">No professional competency records found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {competencyData.map((competency: any) => (
                <Card
                  key={competency.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-400 bg-white hover:scale-105 relative overflow-hidden"
                  onClick={() => handleCardClick(competency)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-indigo-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
                  
                  <CardContent className="p-6 space-y-4 relative z-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gradient-to-br from-orange-100 to-indigo-100 rounded-lg group-hover:from-orange-200 group-hover:to-indigo-200 transition-colors">
                            <FileText className="h-6 w-6 text-orange-700" />
                          </div>
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-700 transition-colors">
                          {competency.document_name}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                          {competency.document_type}
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="bg-orange-100" />
                    
                    <div className="space-y-3">
                      <Badge className={cn("px-3 py-1.5 text-xs font-semibold border inline-flex items-center gap-1.5", getStatusColor(competency.request_status))}>
                        {getStatusIcon(competency.request_status)}
                        {competency.request_status.replace("_", " ").toUpperCase()}
                      </Badge>
                      
                      {competency.has_expiry && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">Expires:</span>
                          <span className="font-semibold text-orange-700">{formatDate(competency.expiry_date)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        {competency.modules.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-700 bg-indigo-50 rounded-lg px-3 py-2">
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                            <span className="font-semibold">{competency.modules.length}</span>
                            <span>Module{competency.modules.length !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                        {competency.has_document && (
                          <div className="flex items-center gap-2 text-gray-700 bg-green-50 rounded-lg px-3 py-2">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">{competency.urls.length}</span>
                            <span>Doc{competency.urls.length !== 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(competency);
                        }}
                      >
                        View Details
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50/30">
          <DialogHeader className="border-b border-orange-200 pb-4 bg-white/80 backdrop-blur sticky top-0 z-50 -mx-6 px-6 -mt-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-600 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl text-orange-900 font-bold">
                    {editData?.document_name}
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">
                    {editData?.document_type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-5 w-5 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Document
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {editData && (
            <div className="space-y-6 mt-6">
              {/* Basic Information */}
              <Card className="border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-indigo-50 border-b border-orange-200">
                  <CardTitle className="text-xl text-orange-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Document Name</Label>
                    {isEditing ? (
                      <Input
                        value={editData.document_name}
                        onChange={(e) => handleInputChange("document_name", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    ) : (
                      <p className="font-semibold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                        {editData.document_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Document Type</Label>
                    <p className="font-semibold text-lg text-gray-700 bg-gray-50 p-3 rounded-lg uppercase tracking-wide">
                      {editData.document_type}
                    </p>
                  </div>
                  
                  <div className="space-y-2 flex gap-4 items-center ">
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    {isEditing ? (
                      <Select
                        value={editData.request_status}
                        onValueChange={(value) => handleInputChange("request_status", value)}
                      >
                        <SelectTrigger className="border-orange-300 focus:ring-2 focus:ring-orange-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Approved
                            </div>
                          </SelectItem>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="not_approved">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              Not Approved
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={cn("px-4 py-2 text-sm font-semibold border inline-flex items-center gap-2", getStatusColor(editData.request_status))}>
                        {getStatusIcon(editData.request_status)}
                        {editData.request_status.replace("_", " ").toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  {editData.has_expiry && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expiry Date
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.expiry_date || ""}
                          onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                          className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="font-semibold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                          {formatDate(editData.expiry_date)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!editData.has_expiry && isEditing && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Add Expiry Date (Optional)
                      </Label>
                      <Input
                        type="date"
                        value={editData.expiry_date || ""}
                        onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                        placeholder="Set an expiry date"
                      />
                      {editData.expiry_date && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Expiry date will be saved
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editData.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                        placeholder="Enter document description..."
                      />
                    ) : (
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                        {editData.description || "No description provided"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              {editData.has_document && (
                <Card className="border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-orange-50 border-b border-indigo-200">
                    <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Attached Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {uploadRequired && isEditing && (
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-900">
                              Document Update Required
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              You have changed the expiry date. Please upload updated documents or set a reminder to upload them later.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openReminderDialog}
                            className="border-orange-300 text-orange-700 hover:bg-orange-100 whitespace-nowrap"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Remind Later
                          </Button>
                        </div>
                      </div>
                    )}
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Front Side Document
                            {uploadRequired && <span className="text-orange-600 text-xs">(Required)</span>}
                          </Label>
                          <div className={cn(
                            "border-2 border-dashed rounded-lg p-4 transition-colors",
                            uploadRequired 
                              ? "border-orange-400 bg-orange-50/50 hover:border-orange-600" 
                              : "border-orange-300 bg-orange-50/50 hover:border-orange-500"
                          )}>
                            <FileUploader
                              onUploadSuccess={(url) => handleFileUpload(url, false)}
                              accept="image/*,application/pdf"
                              maxSize={5 * 1024 * 1024}
                              id={`file-upload-front-${editData.id}`}
                            />
                          </div>
                          {editData.urls[0] && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Current: {editData.urls[0].split("/").pop()}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {editData.has_back_side && (
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Back Side Document
                              {uploadRequired && <span className="text-orange-600 text-xs">(Required)</span>}
                            </Label>
                            <div className={cn(
                              "border-2 border-dashed rounded-lg p-4 transition-colors",
                              uploadRequired 
                                ? "border-orange-400 bg-orange-50/50 hover:border-orange-600" 
                                : "border-indigo-300 bg-indigo-50/50 hover:border-indigo-500"
                            )}>
                              <FileUploader
                                onUploadSuccess={(url) => handleFileUpload(url, true)}
                                accept="image/*,application/pdf"
                                maxSize={5 * 1024 * 1024}
                                id={`file-upload-back-${editData.id}`}
                              />
                            </div>
                            {editData.urls[1] && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Current: {editData.urls[1].split("/").pop()}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editData.urls.map((url: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            onClick={() => isPdfUrl(url) ? openPdfModal(url) : window.open(url, "_blank")}
                            className="h-auto p-4 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 justify-start group"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <ExternalLink className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-gray-900">
                                  {editData.has_back_side && index === 0 
                                    ? "Front Side" 
                                    : editData.has_back_side && index === 1 
                                    ? "Back Side" 
                                    : `Document ${index + 1}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Click to view</p>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Modules Section - Enhanced */}
              {editData.modules.length > 0 && (
                <Card className="border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-indigo-600 text-white">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      Training Modules
                      <Badge className="ml-auto bg-white/20 text-white border-white/30 text-lg px-4 py-1">
                        {editData.modules.length} {editData.modules.length === 1 ? "Module" : "Modules"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {editData.modules.map((module: any, index: number) => (
                        <Card 
                          key={index} 
                          className="border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-xl bg-gradient-to-br from-white to-orange-50/30 overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-indigo-400/10 rounded-bl-full transform translate-x-8 -translate-y-8"></div>
                          
                          <CardHeader className="bg-white/80 backdrop-blur border-b border-orange-200 relative z-10">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-indigo-600 text-white rounded-lg font-bold text-lg shadow-md">
                                {index + 1}
                              </div>
                              <CardTitle className="text-lg text-orange-900 flex-1">
                                Module {index + 1}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="p-5 space-y-4 relative z-10">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-gray-700">Module Name</Label>
                              {isEditing ? (
                                <Input
                                  value={module.module_name}
                                  onChange={(e) => handleModuleChange(index, "module_name", e.target.value)}
                                  className="border-orange-300 focus:ring-2 focus:ring-orange-500 font-semibold"
                                  placeholder="Enter module name..."
                                />
                              ) : (
                                <p className="font-bold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                                  {module.module_name}
                                </p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-gray-700">Description</Label>
                              {isEditing ? (
                                <Textarea
                                  value={module.description}
                                  onChange={(e) => handleModuleChange(index, "description", e.target.value)}
                                  className="border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                                  placeholder="Enter module description..."
                                />
                              ) : (
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed min-h-[80px]">
                                  {module.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-600" />
                                Expiry Date
                              </Label>
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={module.expiry_date}
                                  onChange={(e) => handleModuleChange(index, "expiry_date", e.target.value)}
                                  className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                                />
                              ) : (
                                <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
                                  <Calendar className="h-4 w-4 text-orange-600" />
                                  <p className="font-semibold text-orange-900">
                                    {formatDate(module.expiry_date)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Five Modules (CPC Card) - Enhanced */}
              {editData.document_type === "cpc-card" && (
                <Card className="border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 to-orange-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <CardTitle className="text-2xl flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        Next Five CPC Modules
                      </CardTitle>
                      <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                        {isEditing ? "Editing" : "Upcoming Training"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 bg-gradient-to-br from-white to-indigo-50/30">
                    {isEditing && (
                      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">
                              Edit Mode Active
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              You can now edit the next five upcoming CPC training modules. Leave fields empty if not yet scheduled.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {editData.next_five_modules.map((module: string, index: number) => (
                        <div 
                          key={index}
                          className="group relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 rounded-xl transform group-hover:scale-105 transition-transform"></div>
                          <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-all relative z-10 bg-white/80 backdrop-blur">
                            <CardContent className="p-5 space-y-3">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-orange-600 text-white rounded-lg font-bold text-lg shadow-lg">
                                  {index + 1}
                                </div>
                                <Label className="text-sm font-semibold text-gray-700">
                                  Module {index + 1}
                                </Label>
                              </div>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={module}
                                    onChange={(e) => handleNextFiveModulesChange(index, e.target.value)}
                                    className="border-indigo-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                                    placeholder={`Enter module ${index + 1} name...`}
                                  />
                                  {module && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Module set
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-gradient-to-br from-indigo-50 to-orange-50 p-4 rounded-lg border border-indigo-200 min-h-[60px] flex items-center">
                                  {module ? (
                                    <p className="font-semibold text-indigo-900 leading-relaxed">
                                      {module}
                                    </p>
                                  ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <AlertCircle className="h-4 w-4" />
                                      <p className="italic text-sm">
                                        Not scheduled
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                    
                    {!isEditing && (
                      <div className="mt-6 p-4 bg-indigo-100 border border-indigo-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-indigo-700 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-indigo-900">
                              Upcoming CPC Training Schedule
                            </p>
                            <p className="text-xs text-indigo-700 mt-1">
                              These modules represent the next five training sessions required for CPC certification maintenance. Click &qout;Edit Document&qout; to update.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="mt-6 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-orange-700 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-orange-900">
                              Save Your Changes
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              Don&apos;t forget to click &qout;Save Changes&qout; button at the top to save your module updates.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="max-w-2xl h-[500px] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-orange-200 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl text-orange-900">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              Set Upload Reminder
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Document Upload Required
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You&apos;ve changed the expiry date but haven&apos;t uploaded the updated documents yet. 
                    Set a reminder to upload them later, and your changes will be saved.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Reminder Title</Label>
              <Input
                value={reminderData.title}
                onChange={(e) => setReminderData({ ...reminderData, title: e.target.value })}
                className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                placeholder="Enter reminder title..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Description</Label>
              <Textarea
                value={reminderData.description}
                onChange={(e) => setReminderData({ ...reminderData, description: e.target.value })}
                className="border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                placeholder="Enter reminder description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Priority</Label>
                <Select
                  value={reminderData.priority}
                  onValueChange={(value) => setReminderData({ ...reminderData, priority: value })}
                >
                  <SelectTrigger className="border-orange-300 focus:ring-2 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Low Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        Medium Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        High Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Start Date</Label>
                <Input
                  type="date"
                  value={reminderData.start_date}
                  onChange={(e) => setReminderData({ ...reminderData, start_date: e.target.value })}
                  className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Recurrence</Label>
                <Select
                  value={reminderData.recurrence}
                  onValueChange={(value) => setReminderData({ ...reminderData, recurrence: value })}
                >
                  <SelectTrigger className="border-orange-300 focus:ring-2 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reminderData.recurrence !== "once" && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Interval</Label>
                  <Input
                    type="number"
                    min="1"
                    value={reminderData.recurrence_interval}
                    onChange={(e) => setReminderData({ ...reminderData, recurrence_interval: parseInt(e.target.value) || 1 })}
                    className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleRemindMeLater}
                className="flex-1 bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 text-white shadow-lg"
                disabled={!reminderData.title || !reminderData.start_date}
              >
                <Clock className="h-5 w-5 mr-2" />
                Create Reminder & Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsReminderDialogOpen(false)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-600 text-center pt-2">
              Your changes will be saved, and you&apos;ll receive a reminder to upload the documents later.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced PDF Viewer Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="border-b border-gray-200 p-6 bg-white">
            <DialogTitle className="text-2xl text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              Document Viewer
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[calc(90vh-80px)] bg-gray-100">
            <iframe
              src={selectedPdfUrl || ""}
              title="PDF Viewer"
              className="w-full h-full border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}