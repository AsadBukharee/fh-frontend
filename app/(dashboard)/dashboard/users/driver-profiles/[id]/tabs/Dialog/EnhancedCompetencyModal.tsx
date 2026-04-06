/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'

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

  const currentDoc = modalState.editData;
  if (!currentDoc) return null;

  const handleUploadSuccess = (url: string) => {
    handleFileUpload(url, false);
    setShowUploader(false);
  };

  const currentUrl = currentDoc.urls?.[modalState.currentImageIndex] || "";
  const hasMultipleImages = currentDoc.urls?.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-[2rem] border-none shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[550px]">
          {/* Left Column: Image Preview */}
          <div className="p-10 flex flex-col items-center bg-white">
            <div className="w-full text-left mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{currentDoc.document_name}</h2>
              <p className="text-sm text-gray-400 mt-1">Manage {currentDoc.document_name} details</p>
            </div>

            <Card className="w-full h-80 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm relative group bg-gray-50 flex items-center justify-center">
              {currentUrl ? (
                isPdfUrl(currentUrl) ? (
                  <div className="flex flex-col items-center gap-4">
                    <FileText className="h-20 w-20 text-[#E11D48] opacity-50" />
                    <span className="font-bold text-gray-700 uppercase tracking-widest text-xs">PDF Document</span>
                  </div>
                ) : (
                  <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="text-center p-8">
                  <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No document uploaded</p>
                </div>
              )}

              {hasMultipleImages && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pointer-events-auto h-10 w-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-gray-800 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchModal({
                        type: 'SET_CURRENT_IMAGE_INDEX',
                        payload: modalState.currentImageIndex === 0 ? currentDoc.urls.length - 1 : modalState.currentImageIndex - 1
                      });
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pointer-events-auto h-10 w-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-gray-800 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchModal({
                        type: 'SET_CURRENT_IMAGE_INDEX',
                        payload: modalState.currentImageIndex === currentDoc.urls.length - 1 ? 0 : modalState.currentImageIndex + 1
                      });
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 bg-black/30 backdrop-blur-md rounded-full">
                  {currentDoc.urls.map((_: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        idx === modalState.currentImageIndex ? "bg-white w-4" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Button
              onClick={() => setShowUploader(true)}
              className="w-full h-14 mt-10 bg-[#FF6B35] hover:bg-[#E85A2A] text-white font-bold rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-transform"
            >
              Add Image +
            </Button>
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
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] font-medium px-4"
                      placeholder="Enter License No"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Issue No</Label>
                    <Input
                      value={driverLicenseInfo.license_issue_number}
                      onChange={(e) => handleLicenseInfoChange("license_issue_number", e.target.value)}
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] font-medium px-4"
                      placeholder="Enter Issue No"
                    />
                  </div>
                </div>
              )}

              {/* Expiry Date */}
              {currentDoc.has_expiry && (
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">Expiry Date</Label>
                  <Input
                    type="date"
                    value={currentDoc.expiry_date || ""}
                    onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                    className="h-12 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] font-medium px-4"
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
                  value={currentDoc.status_description || currentDoc.description || ""}
                  onChange={(e) => handleInputChange("status_description", e.target.value)}
                  className="min-h-[120px] border-gray-100 rounded-2xl focus:ring-[#FF6B35] focus:border-[#FF6B35] font-medium p-4 resize-none placeholder:text-gray-300"
                  placeholder="Enter the reason for rejection or special notes..."
                />
              </div>

              {/* Modules Section for CPC Card */}
              {currentDoc.document_type === "cpc-card" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">CPC Modules</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={addModule}
                      className="text-[#FF6B35] hover:text-[#E85A2A] hover:bg-orange-50 font-bold"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Module
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentDoc.modules?.map((module: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-2xl relative border border-gray-100 group/module">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteModule?.(index)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                        <div className="grid grid-cols-1 gap-3">
                          <Input
                            placeholder="Module Name"
                            value={module.module_name}
                            onChange={(e) => handleModuleChange?.(index, "module_name", e.target.value)}
                            className="bg-white border-gray-100 rounded-xl h-10"
                          />
                          <Input
                            type="date"
                            value={module.expiry_date || ""}
                            onChange={(e) => handleModuleChange?.(index, "expiry_date", e.target.value)}
                            className="bg-white border-gray-100 rounded-xl h-10"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
                className="flex-1 h-14 bg-[#FFD8CD] hover:bg-[#FFC9BB] text-[#FF6B35] font-bold rounded-2xl shadow-sm transform active:scale-[0.98] transition-all"
              >
                {modalState.saving ? "Saving..." : (
                  <>
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Modal Overlay */}
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="w-fit bg-white rounded-[2rem] p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Upload {currentDoc.document_name}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Please upload a clear image of the {currentDoc.document_name}.
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