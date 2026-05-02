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

interface CombinedLicenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  driverLicenseData: any;
  dd1CategoryData: any;
  driverId: number;
  cookies: any;
  API_URL: string;
  formatDate: (date: string | null) => string;
  isPdfUrl: (url: string) => boolean;
  fetchCompetencyData: () => void;
  driverName: string;
  licenseNumber: string;
  licenseIssueNumber: string;
  fetchDriverData: () => void;
}

type CombinedLicenseFormData = {
  license_number: string;
  license_issue_number: string;

  dl_expiry_date: string;
  dl_status: string;
  dl_status_reason: string;
  dl_description: string;
  dl_has_document: boolean;
  dl_url: string;

  dd1_expiry_date: string;
  dd1_status: string;
  dd1_status_reason: string;
  dd1_description: string;
  dd1_has_document: boolean;
  dd1_url: string;
};

export default function CombinedLicenseDialog({
  isOpen,
  onOpenChange,
  driverLicenseData,
  dd1CategoryData,
  driverId,
  cookies,
  API_URL,
  formatDate,
  isPdfUrl,
  fetchCompetencyData,
  driverName,
  licenseNumber,
  licenseIssueNumber,
  fetchDriverData,
}: CombinedLicenseDialogProps) {
  const [currentStep, setCurrentStep] = useState(1); // 1 = DL (Front), 2 = DD1 (Back)
  const [saving, setSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [initialPreviewIdx, setInitialPreviewIdx] = useState(0);
  const [currentSwipeIdx, setCurrentSwipeIdx] = useState(0);

  const [formData, setFormData] = useState<CombinedLicenseFormData>({
    license_number: licenseNumber || "",
    license_issue_number: licenseIssueNumber || "",

    dl_expiry_date: driverLicenseData?.expiry_date || "",
    dl_status: driverLicenseData?.request_status || "pending",
    dl_status_reason: driverLicenseData?.status_reason || "",
    dl_description: driverLicenseData?.description || driverLicenseData?.status_description || "",
    dl_has_document: driverLicenseData?.has_document || false,
    dl_url: driverLicenseData?.urls?.[0] || "",

    dd1_expiry_date: dd1CategoryData?.expiry_date || "",
    dd1_status: dd1CategoryData?.request_status || "pending",
    dd1_status_reason: dd1CategoryData?.status_reason || "",
    dd1_description: dd1CategoryData?.description || dd1CategoryData?.status_description || "",
    dd1_has_document: dd1CategoryData?.has_document || false,
    dd1_url: dd1CategoryData?.urls?.[0] || "",
  });

  // Track if dialog was opened to prevent resetting currentStep on data updates
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data when dialog opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setFormData({
        license_number: licenseNumber || "",
        license_issue_number: licenseIssueNumber || "",

        dl_expiry_date: driverLicenseData?.expiry_date || "",
        dl_status: driverLicenseData?.request_status || "pending",
        dl_status_reason: driverLicenseData?.status_reason || "",
        dl_description: driverLicenseData?.description || driverLicenseData?.status_description || "",
        dl_has_document: driverLicenseData?.has_document || false,
        dl_url: driverLicenseData?.urls?.[0] || "",

        dd1_expiry_date: dd1CategoryData?.expiry_date || "",
        dd1_status: dd1CategoryData?.request_status || "pending",
        dd1_status_reason: dd1CategoryData?.status_reason || "",
        dd1_description: dd1CategoryData?.description || dd1CategoryData?.status_description || "",
        dd1_has_document: dd1CategoryData?.has_document || false,
        dd1_url: dd1CategoryData?.urls?.[0] || "",
      });
      setCurrentStep(1);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, driverLicenseData, dd1CategoryData, licenseNumber, licenseIssueNumber, isInitialized]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = useCallback((url: string) => {
    if (currentStep === 1) {
      setFormData(prev => ({ ...prev, dl_url: url, dl_has_document: true }));
    } else {
      setFormData(prev => ({ ...prev, dd1_url: url, dd1_has_document: true }));
    }
    setShowUploader(false);
    toast.success(`Document uploaded successfully`);
  }, [currentStep]);

  const handleSave = useCallback(async (isFinal = false) => {
    // Validation for current step immediately
    const isDL = currentStep === 1;

    // Change Detection
    const initialDlUrl = driverLicenseData?.urls?.[0] || "";
    const initialDd1Url = dd1CategoryData?.urls?.[0] || "";
    const initialDlExpiry = driverLicenseData?.expiry_date || "";
    const initialDd1Expiry = dd1CategoryData?.expiry_date || "";

    const isLicenseNumberChanged = formData.license_number !== (licenseNumber || "");
    const isIssueNumberChanged = formData.license_issue_number !== (licenseIssueNumber || "");
    const isLicenseInfoChanged = isLicenseNumberChanged || isIssueNumberChanged;

    const isDlExpiryChanged = formData.dl_expiry_date !== initialDlExpiry;
    const isDlUrlChanged = formData.dl_url !== initialDlUrl;

    const isDd1ExpiryChanged = formData.dd1_expiry_date !== initialDd1Expiry;
    const isDd1UrlChanged = formData.dd1_url !== initialDd1Url;

    if (isDL) {
      if (!formData.license_number) {
        toast.error("Please enter License Number");
        return;
      }
      if (!formData.dl_expiry_date) {
        toast.error("Please enter Driving License Expiry Date");
        return;
      }

      // If License info changed, REQUIRE BOTH expiry update and new document
      if (isLicenseInfoChanged) {
        if (!isDlExpiryChanged) {
          toast.error("License number changed. Please update the Driving License (Front) expiry date.");
          return;
        }
        if (!isDlUrlChanged) {
          toast.error("License number changed. Please upload a new Driving License (Front) image.");
          return;
        }
      }
      // If ONLY expiry date changed, REQUIRE a new document
      else if (isDlExpiryChanged && !isDlUrlChanged) {
        toast.error("Expiry date changed. Please upload a new Driving License (Front) image matching the new date.");
        return;
      }
      // If ONLY document changed, REQUIRE expiry date update
      else if (isDlUrlChanged && !isDlExpiryChanged) {
        toast.error("New document uploaded. Please update the Driving License (Front) expiry date to match the document.");
        return;
      }

      if (!formData.dl_url && !formData.dl_has_document) {
        toast.error("Please upload Driving License (Front) document");
        return;
      }

      // Step 1: Just move to step 2, NO API CALLS
      setCurrentStep(2);
      return;
    }

    // Step 2: FINAL SAVE (Both DL and D/D1)

    // Before saving, ensure Step 1 is still valid (in case they went back and changed something)
    if (isLicenseInfoChanged) {
      if (!isDlExpiryChanged || !isDlUrlChanged) {
        toast.error("License number changed. Please update the Driving License (Front) details and upload a new image.");
        setCurrentStep(1);
        return;
      }
    } else if (isDlExpiryChanged && !isDlUrlChanged) {
      toast.error("Driving License expiry changed. Please upload a new image for the Front of the license.");
      setCurrentStep(1);
      return;
    } else if (isDlUrlChanged && !isDlExpiryChanged) {
      toast.error("New Driving License image uploaded. Please update the expiry date in Step 1.");
      setCurrentStep(1);
      return;
    }

    if (!formData.dd1_expiry_date) {
      toast.error("Please enter D/D1 Category Expiry Date");
      return;
    }

    // If License info changed, REQUIRE BOTH expiry update and new document for D/D1
    if (isLicenseInfoChanged) {
      if (!isDd1ExpiryChanged) {
        toast.error("License number changed. Please update the D/D1 Category (Back) expiry date.");
        return;
      }
      if (!isDd1UrlChanged) {
        toast.error("License number changed. Please upload a new D/D1 Category (Back) image.");
        return;
      }
    }
    // If ONLY D/D1 expiry changed, REQUIRE a new document
    else if (isDd1ExpiryChanged && !isDd1UrlChanged) {
      toast.error("D/D1 Category expiry changed. Please upload a new D/D1 Category (Back) image.");
      return;
    }
    // If ONLY D/D1 document changed, REQUIRE expiry date update
    else if (isDd1UrlChanged && !isDd1ExpiryChanged) {
      toast.error("New D/D1 Category image uploaded. Please update the expiry date.");
      return;
    }

    if (!formData.dd1_url && !formData.dd1_has_document) {
      toast.error("Please upload D/D1 Category (Back) document");
      return;
    }

    // Validation for status description
    if (formData.dl_status !== "approved" && !formData.dl_description) {
      toast.error("Please provide a reason/description for the Driving License status");
      setCurrentStep(1);
      return;
    }

    if (formData.dd1_status !== "approved" && !formData.dd1_description) {
      toast.error("Please provide a reason/description for the D/D1 Category status");
      setCurrentStep(2);
      return;
    }

    setSaving(true);

    try {

      // 1. Save License Numbers (Profile update)
      if (formData.license_number !== licenseNumber || formData.license_issue_number !== licenseIssueNumber) {
        await fetch(`${API_URL}/api/profiles/driver/${driverId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            license_number: formData.license_number,
            license_issue_number: formData.license_issue_number,
          }),
        });
      }

      // 2. Save Driving License Document
      const dlPayload = {
        driver: driverId,
        document_name: "Driving License",
        document_type: "driving-license",
        has_expiry: true,
        description: formData.dl_description || "",
        status_reason: formData.dl_status_reason || "",
        expiry_date: formData.dl_expiry_date || null,
        has_document: !!formData.dl_url || formData.dl_has_document,
        urls: [formData.dl_url].filter(Boolean),
        request_status: formData.dl_status || "pending",
      };

      const dlId = driverLicenseData?.id;
      const dlEndpoint = dlId
        ? `${API_URL}/api/profiles/professional-competency/${dlId}/`
        : `${API_URL}/api/profiles/professional-competency/`;

      await fetch(dlEndpoint, {
        method: dlId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(dlPayload),
      });

      // 3. Save D/D1 Category Document
      const dd1Payload = {
        driver: driverId,
        document_name: "D / D1 Category",
        document_type: "d-d1-category",
        has_expiry: true,
        description: formData.dd1_description || "",
        status_reason: formData.dd1_status_reason || "",
        expiry_date: formData.dd1_expiry_date || null,
        has_document: !!formData.dd1_url || formData.dd1_has_document,
        urls: [formData.dd1_url].filter(Boolean),
        request_status: formData.dd1_status || "pending",
      };

      const dd1Id = dd1CategoryData?.id;
      const dd1Endpoint = dd1Id
        ? `${API_URL}/api/profiles/professional-competency/${dd1Id}/`
        : `${API_URL}/api/profiles/professional-competency/`;

      await fetch(dd1Endpoint, {
        method: dd1Id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(dd1Payload),
      });

      toast.success("Driving License and D/D1 Category updated successfully");

      // Complete and Refresh
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
    currentStep, formData, driverLicenseData, dd1CategoryData,
    driverId, API_URL, cookies, fetchCompetencyData,
    fetchDriverData, onOpenChange, licenseNumber, licenseIssueNumber
  ]);

  const currentDocName = currentStep === 1 ? "Driving License" : "D/D1 Category";
  const currentUrl = currentStep === 1 ? formData.dl_url : formData.dd1_url;
  const currentStatus = currentStep === 1 ? formData.dl_status : formData.dd1_status;
  const currentStatusDesc = currentStep === 1 ? formData.dl_description : formData.dd1_description;
  const currentDesc = currentStep === 1 ? formData.dl_description : formData.dd1_description;

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

            <div className="w-full relative group/carousel h-[380px] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm p-4">
              <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
                {/* Carousel Slides */}
                {[0, 1].map((idx) => {
                  const url = idx === 0 ? formData.dl_url : formData.dd1_url;
                  const isMissing = !url && !(idx === 0 ? formData.dl_has_document : formData.dd1_has_document);
                  
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
                              setPreviewImages([formData.dl_url, formData.dd1_url].filter(Boolean));
                              setInitialPreviewIdx(idx);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <img src={url} alt={idx === 0 ? "DL" : "DD1"} className="w-full h-full object-cover" />
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
                            <p className="text-lg font-bold text-gray-900">{idx === 0 ? "Driving License Missing" : "D/D1 Category Missing"}</p>
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
                         currentSwipeIdx === idx ? "bg-[#FF6B35] w-8" : "bg-black/20 hover:bg-black/40"
                       )}
                     />
                   ))}
                </div>

                {/* Info Badge */}
                <div className="absolute top-6 left-6 z-20">
                  <div className="bg-black/50 backdrop-blur-md px-5 py-2 rounded-full text-white text-[11px] font-bold uppercase tracking-widest">
                    {currentSwipeIdx === 0 ? "Step 1: License" : "Step 2: D/D1"}
                  </div>
                </div>

                {/* Upload Action */}
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep(currentSwipeIdx + 1);
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
              {/* License Inputs (Visible on both steps but shared context) */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">License No</Label>
                  <Input
                    value={formData.license_number}
                    onChange={(e) => handleFormChange("license_number", e.target.value)}
                    className="h-12 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium px-4"
                    placeholder="Enter License No"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">Issue No</Label>
                  <Input
                    value={formData.license_issue_number}
                    onChange={(e) => handleFormChange("license_issue_number", e.target.value)}
                    className="h-12 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium px-4"
                    placeholder="Enter Issue No"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-gray-800 ml-1">Expiry Date</Label>
                  <Input
                    type="date"
                    value={currentStep === 1 ? formData.dl_expiry_date : formData.dd1_expiry_date}
                    onChange={(e) => handleFormChange(currentStep === 1 ? "dl_expiry_date" : "dd1_expiry_date", e.target.value)}
                    className="h-11 border-gray-100 rounded-xl focus:ring-[#FF6B35] focus:border-[#FF6B35] placeholder:text-gray-300 font-medium px-4"
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-gray-800 ml-1">Status</Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFormChange(currentStep === 1 ? "dl_status" : "dd1_status", "approved")}
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
                    onClick={() => handleFormChange(currentStep === 1 ? "dl_status" : "dd1_status", "pending")}
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
                    onClick={() => handleFormChange(currentStep === 1 ? "dl_status" : "dd1_status", "not_approved")}
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
                      onChange={(e) => handleFormChange(currentStep === 1 ? "dl_description" : "dd1_description", e.target.value)}
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
                  onClick={() => handleSave(currentStep === 2)}
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
              <DialogTitle>Upload {currentDocName}</DialogTitle>
              <DialogDescription>
                Upload the {currentStep === 1 ? "Front" : "Back"} of your license.
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