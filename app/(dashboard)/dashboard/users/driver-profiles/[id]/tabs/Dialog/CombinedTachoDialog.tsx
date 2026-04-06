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
} from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'
import { toast } from "sonner"

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
  tacho_status_description: string;
  tacho_description: string;
  tacho_has_document: boolean;
  tacho_url: string;

  download_date: string;
  download_status: string;
  download_status_description: string;
  download_description: string;
  download_has_document: boolean;
  download_url: string;
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

  const [formData, setFormData] = useState<CombinedTachoFormData>({
    tacho_expiry_date: tachoCardData?.expiry_date || "",
    tacho_status: tachoCardData?.request_status || "pending",
    tacho_status_description: tachoCardData?.status_description || "",
    tacho_description: tachoCardData?.description || "",
    tacho_has_document: tachoCardData?.has_document || false,
    tacho_url: tachoCardData?.urls?.[0] || "",

    download_date: lastTachoDownloadData?.expiry_date || "",
    download_status: lastTachoDownloadData?.request_status || "pending",
    download_status_description: lastTachoDownloadData?.status_description || "",
    download_description: lastTachoDownloadData?.description || "",
    download_has_document: lastTachoDownloadData?.has_document || false,
    download_url: lastTachoDownloadData?.urls?.[0] || "",
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      setFormData({
        tacho_expiry_date: tachoCardData?.expiry_date || "",
        tacho_status: tachoCardData?.request_status || "pending",
        tacho_status_description: tachoCardData?.status_description || "",
        tacho_description: tachoCardData?.description || "",
        tacho_has_document: tachoCardData?.has_document || false,
        tacho_url: tachoCardData?.urls?.[0] || "",

        download_date: lastTachoDownloadData?.expiry_date || "",
        download_status: lastTachoDownloadData?.request_status || "pending",
        download_status_description: lastTachoDownloadData?.status_description || "",
        download_description: lastTachoDownloadData?.description || "",
        download_has_document: lastTachoDownloadData?.has_document || false,
        download_url: lastTachoDownloadData?.urls?.[0] || "",
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
      setFormData(prev => ({ ...prev, tacho_url: url, tacho_has_document: true }));
    } else {
      setFormData(prev => ({ ...prev, download_url: url, download_has_document: true }));
    }
    setShowUploader(false);
    toast.success(`Document uploaded successfully`);
  }, [currentStep]);

  const handleSave = useCallback(async () => {
    const isTacho = currentStep === 1;

    // Change Detection
    const initialTachoUrl = tachoCardData?.urls?.[0] || "";
    const initialDownloadUrl = lastTachoDownloadData?.urls?.[0] || "";
    const initialTachoExpiry = tachoCardData?.expiry_date || "";
    const initialDownloadDate = lastTachoDownloadData?.expiry_date || "";

    const isTachoExpiryChanged = formData.tacho_expiry_date !== initialTachoExpiry;
    const isTachoUrlChanged = formData.tacho_url !== initialTachoUrl;

    const isDownloadDateChanged = formData.download_date !== initialDownloadDate;
    const isDownloadUrlChanged = formData.download_url !== initialDownloadUrl;

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

      if (!formData.tacho_url && !formData.tacho_has_document) {
        toast.error("Please upload Tacho Card document");
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
    if (formData.tacho_status !== "approved" && !formData.tacho_status_description) {
      toast.error("Please provide a reason/description for the Tacho Card status");
      setCurrentStep(1);
      return;
    }
    if (formData.download_status !== "approved" && !formData.download_status_description) {
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
        status_description: formData.tacho_status_description || "",
        expiry_date: formData.tacho_expiry_date || null,
        has_document: !!formData.tacho_url || formData.tacho_has_document,
        urls: [formData.tacho_url].filter(Boolean),
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
        status_description: formData.download_status_description || "",
        expiry_date: formData.download_date || null,
        has_document: !!formData.download_url || formData.download_has_document,
        urls: [formData.download_url].filter(Boolean),
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
  const currentUrl = currentStep === 1 ? formData.tacho_url : formData.download_url;
  const currentStatus = currentStep === 1 ? formData.tacho_status : formData.download_status;
  const currentStatusDesc = currentStep === 1 ? formData.tacho_status_description : formData.download_status_description;
  const currentDesc = currentStep === 1 ? formData.tacho_description : formData.download_description;

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

            <Card className="w-full h-64 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm relative group bg-gray-50 flex items-center justify-center">
              {currentUrl ? (
                isPdfUrl(currentUrl) ? (
                  <div className="flex flex-col items-center gap-4">
                    <FileText className="h-20 w-20 text-[#E11D48] opacity-50" />
                    <span className="font-bold text-gray-700">PDF Document</span>
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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                {currentDocName}
              </div>
            </Card>

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

              {/* Status Description Section (Visible for Pending/Rejected) */}
              {(currentStatus === "pending" || currentStatus === "not_approved") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Status Description</Label>
                    <Textarea
                      value={currentStatusDesc}
                      onChange={(e) => handleFormChange(currentStep === 1 ? "tacho_status_description" : "download_status_description", e.target.value)}
                      className="min-h-[100px] border-gray-100 rounded-2xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium p-4 resize-none"
                      placeholder={`Explain why this document is ${currentStatus === "pending" ? "pending" : "rejected"}...`}
                    />
                  </div>
                </div>
              )}

              {/* General Description Section */}
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-gray-800 ml-1">General Description</Label>
                <Textarea
                  value={currentDesc}
                  onChange={(e) => handleFormChange(currentStep === 1 ? "tacho_description" : "download_description", e.target.value)}
                  className="min-h-[100px] border-gray-100 rounded-2xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium p-4 resize-none"
                  placeholder="General notes about the document..."
                />
              </div>

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

        {/* Media Upload Modal */}
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="w-fit">
            <DialogHeader>
              <DialogTitle>Upload {currentDocName}</DialogTitle>
              <DialogDescription>
                Upload the latest {currentDocName} document.
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
