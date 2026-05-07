/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Eye,
  Check,
  Pencil,
  CheckCircle,
  Info,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import dynamic from 'next/dynamic'
import ImagePreviewDialog from "./ImagePreviewDialog"

// Lazy load heavy components
const FileUploaderLazy = dynamic(() => import("@/components/Media/MediaUpload"), {
  loading: () => <div className="p-4 text-center">Loading uploader...</div>,
  ssr: false
})

interface EnhancedCompetencyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  modalState: any;
  dispatchModal: any;
  driverId: number;
  cookies: any;
  API_URL: string;
  formatDate: (date: string | null) => string;
  isPdfUrl: (url: string) => boolean;
  fetchCompetencyData: () => void;
  driverLicenseInfo: any;
  originalLicenseInfo: any;
  driverLicenseData?: any;
  handleInputChange: (field: string, value: any) => void;
  handleLicenseInfoChange: (field: string, value: string) => void;
  handleFileUpload: (url: string, isBackSide: boolean) => void;
  handleModuleChange?: (index: number, field: string, value: string) => void;
  addModule?: () => void;
  deleteModule?: (index: number) => void;
  handleNextFiveModulesChange?: (index: number, value: string) => void;
  handleSave: () => Promise<void>;
  handleDirectStatusUpdate?: () => Promise<void>;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  openPdfModal?: (url: string) => void;
  STATUS_REASONS?: any;
  originalExpiryDate?: string;
  hasUploadedNewDocument?: boolean;
  uploadRequired?: boolean;
  openReminderDialog?: () => void;
}

export default function EnhancedCompetencyModal({
  isOpen,
  onOpenChange,
  modalState,
  dispatchModal,
  driverId,
  cookies,
  API_URL,
  formatDate,
  isPdfUrl,
  fetchCompetencyData,
  driverLicenseInfo,
  originalLicenseInfo,
  driverLicenseData,
  handleInputChange,
  handleLicenseInfoChange,
  handleFileUpload,
  handleModuleChange,
  addModule,
  deleteModule,
  handleNextFiveModulesChange,
  handleSave,
  handleDirectStatusUpdate,
  getStatusColor,
  getStatusIcon,
  openPdfModal,
  STATUS_REASONS,
  originalExpiryDate,
  hasUploadedNewDocument,
  uploadRequired,
  openReminderDialog,
}: EnhancedCompetencyModalProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'next_five'>('current');
  const [uploadingSide, setUploadingSide] = useState<'front' | 'back'>('front');

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [initialPreviewIdx, setInitialPreviewIdx] = useState(0);
  const [currentSwipeIdx, setCurrentSwipeIdx] = useState(0);
  const [currentModuleStep, setCurrentModuleStep] = useState(1);

  // Reset step when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentModuleStep(1);
    }
  }, [isOpen]);

  // Add module local state
  const [isAddModuleDialogOpen, setIsAddModuleDialogOpen] = useState(false);
  const [editingModuleIdx, setEditingModuleIdx] = useState<number | null>(null);
  const [newModuleData, setNewModuleData] = useState({
    module_name: "",
    expiry_date: "",
    notes: ""
  });

  const currentDoc = modalState.editData;
  if (!currentDoc) return null;

  const handleUploadSuccess = (url: string) => {
    handleFileUpload(url, uploadingSide === 'back');
    setShowUploader(false);
  };

  const handleEditModuleClick = (idx: number, module: any) => {
    setEditingModuleIdx(idx);
    setNewModuleData({
      module_name: typeof module === 'string' ? module : (module.module_name || ""),
      expiry_date: typeof module === 'string' ? "" : (module.expiry_date || ""),
      notes: typeof module === 'string' ? "" : (module.notes || "")
    });
    setIsAddModuleDialogOpen(true);
  };

  const handleAddNewModule = () => {
    if (!newModuleData.module_name) return;

    const listKey = activeTab === 'current' ? 'modules' : 'next_five_modules';
    const currentList = [...(currentDoc[listKey] || [])];

    if (editingModuleIdx !== null) {
      // Update existing
      currentList[editingModuleIdx] = newModuleData;
    } else {
      // Append new
      currentList.push(newModuleData);
    }

    handleInputChange(listKey, currentList);
    setIsAddModuleDialogOpen(false);
    setEditingModuleIdx(null);
    setNewModuleData({ module_name: "", expiry_date: "", notes: "" });
  };

  const handleCpcWizardNext = () => {
    if (currentModuleStep < 5) {
      setCurrentModuleStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleCpcModuleUpdate = (index: number, field: string, value: string) => {
    const currentModules = [...(currentDoc.modules || [])];
    while (currentModules.length < 5) {
      currentModules.push({ module_name: "", expiry_date: "", notes: "" });
    }
    currentModules[index] = {
      ...currentModules[index],
      [field]: value
    };
    handleInputChange("modules", currentModules);
  };

  const currentUrl = currentDoc.urls?.[modalState.currentImageIndex] || "";
  const hasMultipleImages = currentDoc.urls?.length > 1;

  // CPC Modules Specialized Layout
  if (currentDoc.document_type === "cpc-card") {
    const activeModuleList = activeTab === 'current' ? currentDoc.modules || [] : currentDoc.next_five_modules || [];
    const canAddModule = activeModuleList.length < 5;

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[950px] p-10 overflow-y-auto max-h-[95vh] bg-white rounded-[4rem] border-none shadow-2xl custom-scrollbar">
          <div className="space-y-10">
            {/* Header section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">CPC Modules</h2>
                  <p className="text-gray-400 font-medium text-[15px]">Track your current and upcoming module expiry dates</p>
                </div>
                {(currentDoc.modules?.length < 5 || currentDoc.modules?.slice(0, 5).some((m: any) => !m.module_name?.trim() || !m.expiry_date)) && (
                  <Badge className="bg-orange-50 text-orange-600 border-orange-100 px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                    <Info className="h-4 w-4" />
                    <span>Data Required: 5 CPC Modules (Name & Expiry)</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Summary Detail Card Grid */}
            <div className="flex gap-10">
              {/* Image Preview Side */}
              <div className="w-[440px] space-y-4">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Document Images</Label>
                <div className="relative group/carousel h-[340px] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm p-4">
                  <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
                    {/* Carousel Slides */}
                    {[0, 1].map((idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "absolute inset-0 transition-all duration-500 ease-in-out transform",
                          currentSwipeIdx === idx ? "opacity-100 translate-x-0 scale-100" : (idx < currentSwipeIdx ? "opacity-0 -translate-x-full scale-95" : "opacity-0 translate-x-full scale-95")
                        )}
                      >
                        {currentDoc.urls?.[idx] ? (
                          isPdfUrl(currentDoc.urls[idx]) ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#FDE4E7]">
                              <FileText className="h-14 w-14 text-[#E11D48] opacity-50" />
                              <span className="font-bold text-[#E11D48] uppercase tracking-widest text-xs">PDF DOCUMENT</span>
                            </div>
                          ) : (
                            <div
                              className="relative w-full h-full cursor-pointer group/img"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImages(currentDoc.urls);
                                setInitialPreviewIdx(idx);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <img src={currentDoc.urls[idx]} alt={idx === 0 ? "Front" : "Back"} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="text-white h-10 w-10" />
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-50">
                              <Upload className="h-8 w-8 text-gray-200" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{idx === 0 ? "Front Side Missing" : "Back Side Missing"}</p>
                              <p className="text-xs text-gray-400 mt-1 font-medium">Clear photos required</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Carousel Overlays */}
                    <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                      {[0, 1].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSwipeIdx(idx)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            currentSwipeIdx === idx ? "bg-[#F26522] w-6" : "bg-black/20 hover:bg-black/40"
                          )}
                        />
                      ))}
                    </div>

                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest">
                        {currentSwipeIdx === 0 ? "Front of Card" : "Back of Card"}
                      </div>
                    </div>

                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadingSide(currentSwipeIdx === 0 ? 'front' : 'back');
                        setShowUploader(true);
                      }}
                      className="absolute top-4 right-4 z-20 h-10 w-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-none text-[#F26522] hover:bg-white hover:scale-110 transition-all"
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSwipeIdx(0)}
                    className={cn(
                      "absolute left-6 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/80 backdrop-blur shadow-md rounded-full text-gray-800 transition-all hover:bg-white active:scale-90",
                      currentSwipeIdx === 0 ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 translate-x-0"
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSwipeIdx(1)}
                    className={cn(
                      "absolute right-6 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/80 backdrop-blur shadow-md rounded-full text-gray-800 transition-all hover:bg-white active:scale-90",
                      currentSwipeIdx === 1 ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form Fields Side */}
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">Has Expiry</Label>
                    <p className="text-[11px] text-gray-500 font-medium">Does this document have an expiry date?</p>
                  </div>
                  <Switch
                    checked={currentDoc.has_expiry}
                    onCheckedChange={(checked) => {
                      handleInputChange("has_expiry", checked);
                      if (!checked) handleInputChange("expiry_date", null);
                    }}
                    className="data-[state=checked]:bg-[#F26522]"
                  />
                </div>

                {currentDoc.has_expiry && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-sm font-bold text-gray-800 ml-1">Expiry Date</Label>
                    <Input
                      type="date"
                      value={currentDoc.expiry_date || ""}
                      onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="h-14 border border-gray-100 rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] font-medium px-6 text-lg placeholder:text-gray-300 shadow-none bg-white"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-gray-800 ml-1">Status</Label>
                  <div className="flex gap-4">
                    {[
                      { val: "approved", label: "Active", bg: "bg-[#E6F4EA]", text: "text-[#1E8E3E]", border: "border-[#1E8E3E]/0" },
                      { val: "pending", label: "Pending", bg: "bg-[#FEF7E0]", text: "text-[#F9AB00]", border: "border-[#F9AB00]/0" },
                      { val: "not_approved", label: "Rejected", bg: "bg-[#FCE8E6]", text: "text-[#D93025]", border: "border-[#D93025]/0" }
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => handleInputChange("request_status", s.val)}
                        type="button"
                        className={cn(
                          "px-8 py-3 rounded-full text-[15px] font-bold transition-all border outline-none",
                          currentDoc.request_status === s.val
                            ? `${s.bg} ${s.text} ${s.border}`
                            : "bg-white text-gray-300 border-gray-50 hover:bg-gray-50"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-800 ml-1">Description</Label>
                  <Textarea
                    value={currentDoc.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[140px] border border-gray-100 rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] p-6 resize-none placeholder:text-gray-300 font-medium text-base shadow-none bg-white"
                    placeholder="Enter special notes..."
                  />
                </div>

                {currentDoc.request_status === 'not_approved' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-sm font-bold text-gray-800 ml-1">
                      Remarks <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={currentDoc.remarks || ""}
                      onChange={(e) => handleInputChange("remarks", e.target.value)}
                      className={cn(
                        "min-h-[140px] border rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] p-6 resize-none placeholder:text-gray-300 font-medium text-base shadow-none bg-white",
                        modalState.formErrors.remarks ? "border-red-500" : "border-gray-100"
                      )}
                      placeholder="Enter the reason for rejection"
                    />
                    {modalState.formErrors.remarks && (
                      <p className="text-xs text-red-500 ml-1">{modalState.formErrors.remarks}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs Section */}
            <div className="pt-4 space-y-6">
              <div className="flex gap-4 border-none items-center">
                <button
                  onClick={() => setActiveTab('current')}
                  className={cn(
                    "px-6 py-2.5 rounded-full font-bold text-[15px] transition-all",
                    activeTab === 'current' ? "bg-[#FFF0EE] text-[#FF7E67]" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Current CPC Modules
                </button>
                <button
                  onClick={() => setActiveTab('next_five')}
                  className={cn(
                    "px-6 py-2.5 rounded-full font-bold text-[15px] transition-all",
                    activeTab === 'next_five' ? "bg-[#FFF0EE] text-[#FF7E67]" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Next 5 CPC Modules
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-[#F26522] hover:text-[#D4541B] hover:bg-orange-50 font-bold gap-1"
                  onClick={() => {
                    setCurrentModuleStep(1);
                    setIsAddModuleDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add/Edit Modules
                </Button>
              </div>

              {/* Table Section */}
              <div className="overflow-hidden rounded-2xl border border-gray-50 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F8F9FA]">
                    <tr>
                      <th className="px-8 py-5 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-8 py-5 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-8 py-5 text-[13px] font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {activeModuleList.map((module: any, idx: number) => {
                      const moduleName = typeof module === 'string' ? module : (module.module_name || `Module ${idx + 1}`);
                      const expiryDate = typeof module === 'string' ? null : module.expiry_date;

                      return (
                        <tr
                          key={idx}
                          onClick={() => {
                            setCurrentModuleStep(idx + 1);
                            setIsAddModuleDialogOpen(true);
                          }}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group/row"
                        >
                          <td className="px-8 py-6 font-bold text-gray-900 border-none">
                            {moduleName}
                          </td>
                          <td className="px-8 py-6 border-none">
                            <span className="bg-[#FEF7E0] text-[#F9AB00] px-5 py-2 rounded-full text-xs font-bold">
                              {expiryDate ? formatDate(expiryDate) : "---"}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center border-none">
                            <button className="text-gray-300 hover:text-[#F26522] group-hover/row:text-[#F26522] transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeModuleList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-gray-300 font-medium">
                          No modules added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Specialized Footer buttons */}
            <div className="flex gap-4 pt-6">

              <Button
                onClick={() => handleSave()}
                disabled={modalState.saving}
                className="flex-1 ml-auto h-16 w-fit max-w-[300px] bg-[#FCE8E6] hover:bg-[#FBCCD2] text-[#D93025] font-bold text-lg rounded-2xl shadow-none flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-5 w-5" />
                {modalState.saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Nested Wizard Module Dialog */}
          <Dialog open={isAddModuleDialogOpen} onOpenChange={setIsAddModuleDialogOpen}>
            <DialogContent className="max-w-[550px] p-0 overflow-hidden bg-white rounded-[2.5rem] border-none shadow-2xl">
              <div className="p-10 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-[28px] font-bold text-gray-900 tracking-tight">CPC Module {currentModuleStep}</h2>
                    <p className="text-gray-400 font-medium text-[15px]">Please enter the details for this module</p>
                  </div>
                  <button
                    onClick={() => setIsAddModuleDialogOpen(false)}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <Separator className="bg-gray-100" />

                {/* Form Fields */}
                {(() => {
                  const currentModuleIndex = currentModuleStep - 1;
                  const module = (currentDoc.modules || [])[currentModuleIndex] || { module_name: "", expiry_date: "", notes: "" };
                  return (
                    <div className="space-y-6">
                      <div className="space-y-2.5">
                        <Label className="text-[15px] font-bold text-gray-800 ml-1">Name</Label>
                        <Input
                          placeholder="Enter name"
                          value={module.module_name || ""}
                          onChange={(e) => handleCpcModuleUpdate(currentModuleIndex, "module_name", e.target.value)}
                          className="h-14 border border-gray-100 rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] font-medium px-6 text-[15px] placeholder:text-gray-300 shadow-none bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-[15px] font-bold text-gray-800 ml-1">Expiry</Label>
                        <Input
                          type="date"
                          value={module.expiry_date || ""}
                          onChange={(e) => handleCpcModuleUpdate(currentModuleIndex, "expiry_date", e.target.value)}
                          className="h-14 border border-gray-100 rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] font-medium px-6 text-[15px] placeholder:text-gray-300 shadow-none bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-[15px] font-bold text-gray-800 ml-1">Description</Label>
                        <Textarea
                          placeholder="Write Description"
                          value={module.notes || module.description || ""}
                          onChange={(e) => handleCpcModuleUpdate(currentModuleIndex, "notes", e.target.value)}
                          className="min-h-[160px] border border-gray-100 rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] p-6 resize-none placeholder:text-gray-300 font-medium text-[15px] shadow-none bg-white transition-all"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Next/Save Button */}
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      if (currentModuleStep < 5) {
                        setCurrentModuleStep(prev => prev + 1);
                      } else {
                        handleSave();
                        setIsAddModuleDialogOpen(false);
                      }
                    }}
                    disabled={modalState.saving}
                    className="w-full h-16 bg-[#FFF0EE] hover:bg-[#FDE4E1] text-[#F26522] font-bold text-lg rounded-2xl shadow-none transition-all flex items-center justify-center border-none"
                  >
                    {modalState.saving ? "Saving..." : currentModuleStep < 5 ? "Save & Next" : "Save & Finish"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Upload Modal Overlay */}
          <Dialog open={showUploader} onOpenChange={setShowUploader}>
            <DialogContent className="w-fit bg-white rounded-[2rem] p-8 border-none shadow-2xl">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold">Upload {uploadingSide === 'back' ? 'Back' : 'Front'} Document</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Please upload a clear image of the {uploadingSide === 'back' ? 'back' : 'front'} of the CPC card.
                </DialogDescription>
              </DialogHeader>
              <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-100">
                <FileUploaderLazy
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    );
  }

  // Original Layout for other documents (Retained for compatibility)
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-[2rem] border-none shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[550px]">
          {/* Left Column: Image Preview */}
          <div className="p-8 flex flex-col items-center bg-white border-r border-gray-50 overflow-y-auto custom-scrollbar">
            <div className="w-full text-left mb-6">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">{currentDoc.document_name}</h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">Review and update document details</p>
            </div>

            <div className="w-full relative group/carousel h-[380px] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm p-4">
              <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
                {/* Carousel Slides */}
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "absolute inset-0 transition-all duration-500 ease-in-out transform",
                      currentSwipeIdx === idx ? "opacity-100 translate-x-0 scale-100" : (idx < currentSwipeIdx ? "opacity-0 -translate-x-full scale-95" : "opacity-0 translate-x-full scale-95")
                    )}
                  >
                    {currentDoc.urls?.[idx] ? (
                      isPdfUrl(currentDoc.urls[idx]) ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#FDE4E7]">
                          <FileText className="h-16 w-16 text-[#E11D48] opacity-50" />
                          <span className="font-bold text-[#E11D48] uppercase tracking-widest text-xs">PDF DOCUMENT</span>
                        </div>
                      ) : (
                        <div
                          className="relative w-full h-full cursor-pointer group/img"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImages(currentDoc.urls);
                            setInitialPreviewIdx(idx);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <img src={currentDoc.urls[idx]} alt={idx === 0 ? "Front" : "Back"} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="text-white h-12 w-12" />
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8 bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                          <Upload className="h-10 w-10 text-gray-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-gray-900">{idx === 0 ? "Front Side Missing" : "Back Side Missing"}</p>
                          <p className="text-sm font-medium text-gray-400 leading-tight px-4">Click the upload icon in the top right to add a document</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {[0, 1].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSwipeIdx(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        currentSwipeIdx === idx ? "bg-[#F26522] w-8 shadow-[0_0_10px_rgba(242,101,34,0.4)]" : "bg-black/20 hover:bg-black/40"
                      )}
                    />
                  ))}
                </div>

                {/* Document Type Badge */}
                <div className="absolute top-6 left-6 z-20">
                  <div className="bg-black/50 backdrop-blur-md px-5 py-2 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.1em]">
                    {currentSwipeIdx === 0 ? "Front Page" : "Back Page"}
                  </div>
                </div>

                {/* Upload Action */}
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadingSide(currentSwipeIdx === 0 ? 'front' : 'back');
                    setShowUploader(true);
                  }}
                  className="absolute top-6 right-6 z-20 h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-none text-[#F26522] hover:bg-white hover:scale-110 active:scale-95 transition-all"
                >
                  <Upload className="h-6 w-6" />
                </Button>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSwipeIdx(0)}
                className={cn(
                  "absolute left-8 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-gray-800 transition-all hover:bg-white active:scale-90",
                  currentSwipeIdx === 0 ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 translate-x-0"
                )}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentSwipeIdx(1)}
                className={cn(
                  "absolute right-8 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-gray-800 transition-all hover:bg-white active:scale-90",
                  currentSwipeIdx === 1 ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
                )}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="p-10 bg-white border-l border-gray-50 flex flex-col justify-between">
            <div className="space-y-8">
              {/* License Inputs if applicable */}
              {currentDoc.document_type === "driving-license" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">License No</Label>
                    <Input
                      value={driverLicenseInfo.license_number}
                      onChange={(e) => handleLicenseInfoChange("license_number", e.target.value)}
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#F26522] focus:border-[#F26522] font-medium px-4"
                      placeholder="Enter License No"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Issue No</Label>
                    <Input
                      value={driverLicenseInfo.license_issue_number}
                      onChange={(e) => handleLicenseInfoChange("license_issue_number", e.target.value)}
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#F26522] focus:border-[#F26522] font-medium px-4"
                      placeholder="Enter Issue No"
                    />
                  </div>
                </div>
              )}

              {/* Has Expiry Toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="space-y-0.5">
                   <Label className="text-[13px] font-bold text-gray-800">Has Expiry</Label>
                   <p className="text-[10px] text-gray-400 font-medium">Does this document have an expiry date?</p>
                </div>
                <Switch
                  checked={currentDoc.has_expiry}
                  onCheckedChange={(checked) => {
                    handleInputChange("has_expiry", checked);
                    if (!checked) handleInputChange("expiry_date", null);
                  }}
                  className="data-[state=checked]:bg-[#F26522] scale-90"
                />
              </div>

              {/* Expiry Date */}
              {currentDoc.has_expiry && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">Expiry Date</Label>
                  <Input
                    type="date"
                    value={currentDoc.expiry_date || ""}
                    onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                    className="h-12 border-gray-100 rounded-xl focus:ring-[#F26522] focus:border-[#F26522] font-medium px-4"
                  />
                </div>
              )}

              {/* Status Section */}
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-gray-800 ml-1">Status</Label>
                <div className="flex gap-3">
                  {[
                    { val: "approved", label: "Active", bg: "bg-[#E6F4EA]", text: "text-[#1E8E3E]", border: "border-[#1E8E3E]/20" },
                    { val: "pending", label: "Pending", bg: "bg-[#FEF7E0]", text: "text-[#F9AB00]", border: "border-[#F9AB00]/20" },
                    { val: "not_approved", label: "Rejected", bg: "bg-[#FCE8E6]", text: "text-[#D93025]", border: "border-[#D93025]/20" }
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => handleInputChange("request_status", s.val)}
                      type="button"
                      className={cn(
                        "flex-1 py-3 rounded-full text-sm font-bold transition-all border outline-none",
                        currentDoc.request_status === s.val
                          ? `${s.bg} ${s.text} ${s.border}`
                          : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-gray-800 ml-1">Description</Label>
                <Textarea
                  value={currentDoc.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-[100px] border-gray-100 rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] font-medium p-4 resize-none placeholder:text-gray-300"
                  placeholder="Enter special notes..."
                />
              </div>

              {/* Remarks Section for Rejection */}
              {currentDoc.request_status === 'not_approved' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">
                    Remarks <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={currentDoc.remarks || ""}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    className={cn(
                      "min-h-[100px] border rounded-2xl focus:ring-[#F26522] focus:border-[#F26522] font-medium p-4 resize-none placeholder:text-gray-300",
                      modalState.formErrors.remarks ? "border-red-500" : "border-gray-100"
                    )}
                    placeholder="Enter the reason for rejection"
                  />
                  {modalState.formErrors.remarks && (
                    <p className="text-xs text-red-500 ml-1">{modalState.formErrors.remarks}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSave()}
                disabled={modalState.saving}
                className="flex-1 h-14 bg-[#FFD8CD] hover:bg-[#FFC9BB] text-[#F26522] font-bold rounded-2xl shadow-sm transform active:scale-[0.98] transition-all"
              >
                {modalState.saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Modal Overlay */}
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="w-fit bg-white rounded-[2rem] p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Upload {uploadingSide === 'back' ? 'Back' : 'Front'} side of {currentDoc.document_name}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Please upload a clear image of the {uploadingSide === 'back' ? 'back' : 'front'} side of the {currentDoc.document_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-100">
              <FileUploaderLazy
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Global Image Preview Dialog */}
        <ImagePreviewDialog
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          images={previewImages}
          initialIndex={initialPreviewIdx}
          title={currentDoc.document_name}
        />
      </DialogContent>
    </Dialog>
  );
}