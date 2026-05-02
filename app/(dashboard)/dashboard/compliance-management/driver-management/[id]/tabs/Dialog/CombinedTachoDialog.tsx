/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Upload,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'
import { toast } from "sonner"
import ImagePreviewDialog from "./ImagePreviewDialog"
import { Eye } from "lucide-react"

// Lazy load heavy components
const FileUploaderLazy = dynamic(() => import("@/components/Media/MediaUpload"), {
  loading: () => <div className="p-4 text-center">Loading uploader...</div>,
  ssr: false
})

interface CombinedTachoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tachoCardData: any;
  lastTachoDownloadData: any;
  driverId: number;
  cookies: any;
  API_URL: string;
  formatDate: (date: string | null) => string;
  isPdfUrl: (url: string) => boolean;
  fetchCompetencyData: () => void;
  driverName: string;
  fetchDriverData: () => void;
}

type CombinedTachoFormData = {
  tacho_expiry_date: string;
  tacho_status: string;
  tacho_status_reason: string;
  tacho_description: string;
  tacho_has_document: boolean;
  tacho_url_front: string;
  tacho_url_back: string;

  download_date: string;
  download_status: string;
  download_status_reason: string;
  download_description: string;
  download_has_document: boolean;
  download_url_front: string;
  download_url_back: string;
};

export default function CombinedTachoDialog({
  isOpen,
  onOpenChange,
  tachoCardData,
  lastTachoDownloadData,
  driverId,
  cookies,
  API_URL,
  formatDate,
  isPdfUrl,
  fetchCompetencyData,
  driverName,
  fetchDriverData,
}: CombinedTachoDialogProps) {
  const [currentStep, setCurrentStep] = useState(1); // 1 = Tacho Card, 2 = Last Tacho Download
  const [saving, setSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadingSide, setUploadingSide] = useState<'front' | 'back'>('front');

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [initialPreviewIdx, setInitialPreviewIdx] = useState(0);
  const [currentSwipeIdx, setCurrentSwipeIdx] = useState(0);

  const [formData, setFormData] = useState<CombinedTachoFormData>({
    tacho_expiry_date: tachoCardData?.expiry_date || "",
    tacho_status: tachoCardData?.request_status || "pending",
    tacho_status_reason: tachoCardData?.status_reason || "",
    tacho_description: tachoCardData?.description || tachoCardData?.status_description || "",
    tacho_has_document: tachoCardData?.has_document || false,
    tacho_url_front: tachoCardData?.urls?.[0] || "",
    tacho_url_back: tachoCardData?.urls?.[1] || "",

    download_date: lastTachoDownloadData?.expiry_date || "",
    download_status: lastTachoDownloadData?.request_status || "pending",
    download_status_reason: lastTachoDownloadData?.status_reason || "",
    download_description: lastTachoDownloadData?.description || lastTachoDownloadData?.status_description || "",
    download_has_document: lastTachoDownloadData?.has_document || false,
    download_url_front: lastTachoDownloadData?.urls?.[0] || "",
    download_url_back: lastTachoDownloadData?.urls?.[1] || "",
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      setFormData({
        tacho_expiry_date: tachoCardData?.expiry_date || "",
        tacho_status: tachoCardData?.request_status || "pending",
        tacho_status_reason: tachoCardData?.status_reason || "",
        tacho_description: tachoCardData?.description || tachoCardData?.status_description || "",
        tacho_has_document: tachoCardData?.has_document || false,
        tacho_url_front: tachoCardData?.urls?.[0] || "",
        tacho_url_back: tachoCardData?.urls?.[1] || "",

        download_date: lastTachoDownloadData?.expiry_date || "",
        download_status: lastTachoDownloadData?.request_status || "pending",
        download_status_reason: lastTachoDownloadData?.status_reason || "",
        download_description: lastTachoDownloadData?.description || lastTachoDownloadData?.status_description || "",
        download_has_document: lastTachoDownloadData?.has_document || false,
        download_url_front: lastTachoDownloadData?.urls?.[0] || "",
        download_url_back: lastTachoDownloadData?.urls?.[1] || "",
      });
      setCurrentStep(1);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, tachoCardData, lastTachoDownloadData, isInitialized]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = useCallback((url: string) => {
    if (currentStep === 1) {
      if (uploadingSide === 'front') {
        setFormData(prev => ({ ...prev, tacho_url_front: url, tacho_has_document: true }));
      } else {
        setFormData(prev => ({ ...prev, tacho_url_back: url, tacho_has_document: true }));
      }
    } else {
      if (uploadingSide === 'front') {
        setFormData(prev => ({ ...prev, download_url_front: url, download_has_document: true }));
      } else {
        setFormData(prev => ({ ...prev, download_url_back: url, download_has_document: true }));
      }
    }
    setShowUploader(false);
    toast.success(`Document uploaded successfully`);
  }, [currentStep, uploadingSide]);

  const handleSave = useCallback(async () => {
    const isTacho = currentStep === 1;

    // Change Detection
    const initialTachoUrl = tachoCardData?.urls?.[0] || "";
    const initialDownloadUrl = lastTachoDownloadData?.urls?.[0] || "";
    const initialTachoExpiry = tachoCardData?.expiry_date || "";
    const initialDownloadDate = lastTachoDownloadData?.expiry_date || "";

    const isTachoExpiryChanged = formData.tacho_expiry_date !== initialTachoExpiry;
    const isTachoUrlChanged = formData.tacho_url_front !== initialTachoUrl || formData.tacho_url_back !== (tachoCardData?.urls?.[1] || "");

    const isDownloadDateChanged = formData.download_date !== initialDownloadDate;
    const isDownloadUrlChanged = formData.download_url_front !== initialDownloadUrl || formData.download_url_back !== (lastTachoDownloadData?.urls?.[1] || "");

    if (isTacho) {
      if (!formData.tacho_expiry_date) {
        toast.error("Please enter Tacho Card Expiry Date");
        return;
      }
      
      // If ONLY expiry date changed, REQUIRE a new document
      if (isTachoExpiryChanged && !isTachoUrlChanged) {
        toast.error("Tacho Card expiry changed. Please upload a new Tacho Card image matching the new date.");
        return;
      }
      // If ONLY document changed, REQUIRE expiry date update
      if (isTachoUrlChanged && !isTachoExpiryChanged) {
        toast.error("New Tacho Card image uploaded. Please update/verify the expiry date.");
        return;
      }

      if (!formData.tacho_url_front && !formData.tacho_has_document) {
        toast.error("Please upload Tacho Card Front document");
        return;
      }

      // Step 1: Just move to step 2
      setCurrentStep(2);
      return;
    }

    // Step 2: FINAL SAVE (Both Tacho Card and Last Tacho Download)
    
    // Re-verify Step 1 in case of changes
    if (isTachoExpiryChanged && !isTachoUrlChanged) {
      toast.error("Tacho Card expiry changed. Please upload a new image in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (isTachoUrlChanged && !isTachoExpiryChanged) {
      toast.error("New Tacho Card image uploaded. Please update the expiry date in Step 1.");
      setCurrentStep(1);
      return;
    }

    if (!formData.download_date) {
      toast.error("Please enter Download Date");
      return;
    }

    // If ONLY download date changed, REQUIRE a new document
    if (isDownloadDateChanged && !isDownloadUrlChanged) {
      toast.error("Download date changed. Please upload a new Tacho download document matching the new date.");
      return;
    }
    // If ONLY download document changed, REQUIRE date update
    if (isDownloadUrlChanged && !isDownloadDateChanged) {
      toast.error("New Tacho download document uploaded. Please update/verify the download date.");
      return;
    }

    // Validation for status description
    if (formData.tacho_status !== "approved" && !formData.tacho_description) {
      toast.error("Please provide a reason/description for the Tacho Card status");
      setCurrentStep(1);
      return;
    }
    if (formData.download_status !== "approved" && !formData.download_description) {
      toast.error("Please provide a reason/description for the Download status");
      setCurrentStep(2);
      return;
    }

    setSaving(true);

    try {
      // 1. Profile Sync for Last Tacho Download Date
      if (isDownloadDateChanged) {
        await fetch(`${API_URL}/api/profiles/driver/${driverId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            last_driver_tacho_download: formData.download_date,
          }),
        });
      }

      // 2. Save Tacho Card Document
      const tachoPayload = {
        driver: driverId,
        document_name: "Tacho Card",
        document_type: "tacho-card",
        has_expiry: true,
        description: formData.tacho_description || "",
        status_reason: formData.tacho_status_reason || "",
        expiry_date: formData.tacho_expiry_date || null,
        has_document: !!formData.tacho_url_front || !!formData.tacho_url_back || formData.tacho_has_document,
        urls: [formData.tacho_url_front, formData.tacho_url_back].filter(Boolean),
        request_status: formData.tacho_status || "pending",
      };

      const tachoId = tachoCardData?.id;
      const tachoEndpoint = tachoId
        ? `${API_URL}/api/profiles/professional-competency/${tachoId}/`
        : `${API_URL}/api/profiles/professional-competency/`;

      await fetch(tachoEndpoint, {
        method: tachoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(tachoPayload),
      });

      // 3. Save Last Tacho Download Document
      const downloadPayload = {
        driver: driverId,
        document_name: "Last Tacho Download",
        document_type: "last-tacho-download",
        has_expiry: true,
        description: formData.download_description || "",
        status_reason: formData.download_status_reason || "",
        expiry_date: formData.download_date || null,
        has_document: !!formData.download_url_front || !!formData.download_url_back || formData.download_has_document,
        urls: [formData.download_url_front, formData.download_url_back].filter(Boolean),
        request_status: formData.download_status || "pending",
      };

      const downloadId = lastTachoDownloadData?.id;
      const downloadEndpoint = downloadId
        ? `${API_URL}/api/profiles/professional-competency/${downloadId}/`
        : `${API_URL}/api/profiles/professional-competency/`;

      await fetch(downloadEndpoint, {
        method: downloadId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(downloadPayload),
      });

      toast.success("Tacho documents updated successfully");
      onOpenChange(false);
      fetchCompetencyData();
      fetchDriverData();

    } catch (error) {
      console.error("Error saving documents:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [
    currentStep, formData, tachoCardData, lastTachoDownloadData,
    driverId, API_URL, cookies, fetchCompetencyData,
    fetchDriverData, onOpenChange
  ]);

  const currentDocName = currentStep === 1 ? "Tacho Card" : "Last Tacho Download";
  const currentStatus = currentStep === 1 ? formData.tacho_status : formData.download_status;
  const currentStatusDesc = currentStep === 1 ? formData.tacho_description : formData.download_description;
  const currentDesc = currentStep === 1 ? formData.tacho_description : formData.download_description;
  const currentUrlFront = currentStep === 1 ? formData.tacho_url_front : formData.download_url_front;
  const currentUrlBack = currentStep === 1 ? formData.tacho_url_back : formData.download_url_back;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-[2rem] border-none shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[500px]">
          {/* Left Column: Image Preview */}
          <div className="p-8 flex flex-col items-center justify-between bg-white">
            <div className="w-full text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{currentDocName}</h2>
              <p className="text-xs text-gray-400 mt-1">Manage {currentDocName} documentation</p>
            </div>

            <div className="w-full space-y-4">
            <div className="w-full relative group/carousel h-[380px] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm p-4">
              <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
                {/* Carousel Slides */}
                {[0, 1].map((idx) => {
                  const url = idx === 0 ? currentUrlFront : currentUrlBack;
                  
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "absolute inset-0 transition-all duration-500 ease-in-out transform",
                        currentSwipeIdx === idx ? "opacity-100 translate-x-0 scale-100" : (idx < currentSwipeIdx ? "opacity-0 -translate-x-full scale-95" : "opacity-0 translate-x-full scale-95")
                      )}
                    >
                      {url ? (
                        isPdfUrl(url) ? (
                          <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#FDE4E7]">
                            <FileText className="h-16 w-16 text-[#E11D48] opacity-50" />
                            <span className="font-bold text-[#E11D48] uppercase tracking-widest text-xs">PDF DOCUMENT</span>
                          </div>
                        ) : (
                          <div 
                            className="relative w-full h-full cursor-pointer group/img"
                            onClick={(e) => {
                              e.stopPropagation();
                              const urls = [currentUrlFront, currentUrlBack].filter(Boolean);
                              setPreviewImages(urls);
                              setInitialPreviewIdx(urls.indexOf(url));
                              setIsPreviewOpen(true);
                            }}
                          >
                            <img src={url} alt={idx === 0 ? "Front" : "Back"} className="w-full h-full object-cover" />
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
                            <p className="text-lg font-bold text-gray-900">{idx === 0 ? "Front Page Missing" : "Back Page Missing"}</p>
                            <p className="text-sm font-medium text-gray-400">Click upload to add document</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                   {[0, 1].map((idx) => (
                     <button
                       key={idx}
                       onClick={() => setCurrentSwipeIdx(idx)}
                       className={cn(
                         "w-2 h-2 rounded-full transition-all duration-300",
                         currentSwipeIdx === idx ? "bg-[#FF6B35] w-8 shadow-[0_0_10px_rgba(255,107,53,0.3)]" : "bg-black/20 hover:bg-black/40"
                       )}
                     />
                   ))}
                </div>

                {/* Info Badge */}
                <div className="absolute top-6 left-6 z-20">
                  <div className="bg-black/50 backdrop-blur-md px-5 py-2 rounded-full text-white text-[11px] font-bold uppercase tracking-widest">
                    {currentSwipeIdx === 0 ? "Front Side" : "Back Side"}
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
                  className="absolute top-6 right-6 z-20 h-11 w-11 bg-white shadow-xl border-none text-[#FF6B35] hover:bg-white hover:scale-110 transition-all rounded-xl"
                >
                  <Upload className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSwipeIdx(0)}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/90 backdrop-blur shadow-lg rounded-xl text-gray-800 transition-all hover:bg-white",
                  currentSwipeIdx === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentSwipeIdx(1)}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/90 backdrop-blur shadow-lg rounded-xl text-gray-800 transition-all hover:bg-white",
                  currentSwipeIdx === 1 ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            </div>

            <div className="flex gap-3 w-full mt-6">
              <Button
                onClick={() => setShowUploader(true)}
                className="flex-1 h-12 bg-[#FF6B35] hover:bg-[#E85A2A] text-white font-bold rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload
              </Button>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="p-8 bg-white border-l border-gray-50 h-[550px] overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">
                    {currentStep === 1 ? "Expiry Date" : "Download Date"}
                  </Label>
                  <Input
                    type="date"
                    value={currentStep === 1 ? formData.tacho_expiry_date : formData.download_date}
                    onChange={(e) => handleFormChange(currentStep === 1 ? "tacho_expiry_date" : "download_date", e.target.value)}
                    className="h-11 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium px-4"
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-gray-800 ml-1">Status</Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFormChange(currentStep === 1 ? "tacho_status" : "download_status", "approved")}
                    className={cn(
                      "flex-1 py-3 rounded-full text-sm font-bold transition-all border outline-none",
                      currentStatus === "approved"
                        ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                        : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleFormChange(currentStep === 1 ? "tacho_status" : "download_status", "pending")}
                    className={cn(
                      "flex-1 py-3 rounded-full text-sm font-bold transition-all border outline-none",
                      currentStatus === "pending"
                        ? "bg-[#FEF7E0] text-[#F9AB00] border-[#F9AB00]/20"
                        : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleFormChange(currentStep === 1 ? "tacho_status" : "download_status", "not_approved")}
                    className={cn(
                      "flex-1 py-3 rounded-full text-sm font-bold transition-all border outline-none",
                      currentStatus === "not_approved"
                        ? "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"
                        : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {/* Description Section (Visible for Pending/Rejected) */}
              {(currentStatus === "pending" || currentStatus === "not_approved") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Description</Label>
                    <Textarea
                      value={currentStatusDesc}
                      onChange={(e) => handleFormChange(currentStep === 1 ? "tacho_description" : "download_description", e.target.value)}
                      className="min-h-[100px] border-gray-100 rounded-2xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium p-4 resize-none"
                      placeholder={`Explain why this document is ${currentStatus === "pending" ? "pending" : "rejected"}...`}
                    />
                  </div>
                </div>
              )}


              {/* Footer Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-12 bg-[#FFD8CD] hover:bg-[#FFC9BB] text-[#FF6B35] font-bold rounded-2xl transition-all shadow-sm"
                >
                  {saving ? "Saving..." : currentStep === 1 ? (
                    <>
                      Save & Next!
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </>
                  ) : "Save & Exit"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Image Preview Dialog */}
        <ImagePreviewDialog
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          images={previewImages}
          initialIndex={initialPreviewIdx}
          title={currentDocName}
        />

        {/* Media Upload Modal */}
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="w-fit">
            <DialogHeader>
              <DialogTitle>Upload {uploadingSide === 'front' ? 'FrontSide' : 'BackSide'} of {currentDocName}</DialogTitle>
              <DialogDescription>
                Upload the {uploadingSide === 'front' ? 'Front' : 'Back'} side of your {currentDocName} document.
              </DialogDescription>
            </DialogHeader>
            <FileUploaderLazy
              onUploadSuccess={handleFileUpload}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
