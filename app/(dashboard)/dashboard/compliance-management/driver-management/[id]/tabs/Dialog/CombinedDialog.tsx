/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit,
  Save,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  X,
  IdCard,
  Key,
  Car,
  AlertTriangle,
  Check,
  XCircle,
  Link2,
  Link2Off,
  AlertOctagon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Plus,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from 'next/dynamic'

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
  showToast: (message: string, type: string) => void;
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
  dl_status_description: string;
  dl_description: string;
  dl_has_document: boolean;
  dd1_expiry_date: string;
  dd1_status: string;
  dd1_status_reason: string;
  dd1_status_description: string;
  dd1_description: string;
  dd1_has_document: boolean;
  [key: string]: any;
};

// Carousel Component for Document Preview
const DocumentCarousel = ({ 
  files, 
  originalFiles, 
  isPdfUrl,
  title,
  type = "dl"
}: { 
  files: { front: string; back: string };
  originalFiles: { front: string; back: string };
  isPdfUrl: (url: string) => boolean;
  title: string;
  type?: "dl" | "dd1";
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasImages = files.front || files.back;
  const images = [files.front, files.back].filter(Boolean);
  const originalImages = [originalFiles.front, originalFiles.back].filter(Boolean);
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  if (!hasImages) return null;
  
  const borderColor = type === "dl" ? "border-blue-200" : "border-green-200";
  const buttonColor = type === "dl" ? "text-blue-600 hover:bg-blue-100" : "text-green-600 hover:bg-green-100";
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{title}</Label>
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-blue-200 min-h-[300px] flex items-center justify-center">
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className={cn(
                "absolute left-2 top-1/2 transform -translate-y-1/2 z-10",
                "bg-white/80 backdrop-blur-sm hover:bg-white",
                buttonColor
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 z-10",
                "bg-white/80 backdrop-blur-sm hover:bg-white",
                buttonColor
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        
        {/* Current Image */}
        {isPdfUrl(images[currentIndex]) ? (
          <div className="text-center p-8">
            <FileText className="h-20 w-20 text-blue-600 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-gray-700">PDF Document</p>
            <p className="text-sm text-gray-500 mt-2">
              {currentIndex === 0 ? "Front Side" : "Back Side"}
            </p>
          </div>
        ) : (
          <img
            src={images[currentIndex]}
            alt={`${title} ${currentIndex === 0 ? "Front" : "Back"}`}
            className="max-w-full max-h-[300px] object-contain p-4"
          />
        )}
        
        {/* Update Indicator */}
        {images[currentIndex] !== originalImages[currentIndex] && (
          <div className="absolute top-4 right-4 bg-green-500 text-white text-sm px-3 py-1 rounded-full shadow-lg">
            Updated
          </div>
        )}
        
        {/* Side Indicator */}
        <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full shadow-lg">
          {currentIndex === 0 ? "Front Side" : "Back Side"}
        </div>
        
        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  index === currentIndex 
                    ? (type === "dl" ? "bg-blue-600" : "bg-green-600")
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative border-2 rounded-lg overflow-hidden w-20 h-20",
                index === currentIndex 
                  ? (type === "dl" ? "border-blue-500" : "border-green-500")
                  : "border-gray-300",
                "hover:opacity-90 transition-all"
              )}
            >
              {isPdfUrl(image) ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              ) : (
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                {index === 0 ? "Front" : "Back"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CombinedLicenseDialog({
  isOpen,
  onOpenChange,
  driverLicenseData,
  dd1CategoryData,
  driverId,
  showToast,
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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncChanges, setSyncChanges] = useState(true);
  
  const [formData, setFormData] = useState<CombinedLicenseFormData>({
    license_number: licenseNumber || "",
    license_issue_number: licenseIssueNumber || "",
    
    dl_expiry_date: driverLicenseData?.expiry_date || "",
    dl_status: driverLicenseData?.request_status || "pending",
    dl_status_reason: driverLicenseData?.status_reason || "",
    dl_status_description: driverLicenseData?.status_description || "",
    dl_description: driverLicenseData?.description || "",
    dl_has_document: driverLicenseData?.has_document || false,
    
    dd1_expiry_date: dd1CategoryData?.expiry_date || "",
    dd1_status: dd1CategoryData?.request_status || "pending",
    dd1_status_reason: dd1CategoryData?.status_reason || "",
    dd1_status_description: dd1CategoryData?.status_description || "",
    dd1_description: dd1CategoryData?.description || "",
    dd1_has_document: dd1CategoryData?.has_document || false,
  });
  
  const [originalData, setOriginalData] = useState({
    license_number: licenseNumber || "",
    license_issue_number: licenseIssueNumber || "",
    dl_expiry_date: driverLicenseData?.expiry_date || "",
    dd1_expiry_date: dd1CategoryData?.expiry_date || "",
  });
  
  const [dlFiles, setDlFiles] = useState({
    front: driverLicenseData?.urls?.[0] || "",
    back: driverLicenseData?.urls?.[1] || "",
  });
  
  const [dd1Files, setDd1Files] = useState({
    front: dd1CategoryData?.urls?.[0] || "",
    back: dd1CategoryData?.urls?.[1] || "",
  });
  
  const [originalDlFiles, setOriginalDlFiles] = useState({
    front: driverLicenseData?.urls?.[0] || "",
    back: driverLicenseData?.urls?.[1] || "",
  });
  
  const [originalDd1Files, setOriginalDd1Files] = useState({
    front: dd1CategoryData?.urls?.[0] || "",
    back: dd1CategoryData?.urls?.[1] || "",
  });
  
  const [uploadedDlFiles, setUploadedDlFiles] = useState(false);
  const [uploadedDd1Files, setUploadedDd1Files] = useState(false);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationIssues, setValidationIssues] = useState<Array<{
    type: 'warning' | 'error';
    message: string;
    action?: string;
    field?: string;
  }>>([]);

  // Initialize data when dialog opens
  useEffect(() => {
    if (isOpen) {
      const initialFormData = {
        license_number: licenseNumber || "",
        license_issue_number: licenseIssueNumber || "",
        
        dl_expiry_date: driverLicenseData?.expiry_date || "",
        dl_status: driverLicenseData?.request_status || "pending",
        dl_status_reason: driverLicenseData?.status_reason || "",
        dl_status_description: driverLicenseData?.status_description || "",
        dl_description: driverLicenseData?.description || "",
        dl_has_document: driverLicenseData?.has_document || false,
        
        dd1_expiry_date: dd1CategoryData?.expiry_date || "",
        dd1_status: dd1CategoryData?.request_status || "pending",
        dd1_status_reason: dd1CategoryData?.status_reason || "",
        dd1_status_description: dd1CategoryData?.status_description || "",
        dd1_description: dd1CategoryData?.description || "",
        dd1_has_document: dd1CategoryData?.has_document || false,
      };
      
      setFormData(initialFormData);
      setOriginalData({
        license_number: licenseNumber || "",
        license_issue_number: licenseIssueNumber || "",
        dl_expiry_date: driverLicenseData?.expiry_date || "",
        dd1_expiry_date: dd1CategoryData?.expiry_date || "",
      });
      
      const dlFilesInitial = {
        front: driverLicenseData?.urls?.[0] || "",
        back: driverLicenseData?.urls?.[1] || "",
      };
      const dd1FilesInitial = {
        front: dd1CategoryData?.urls?.[0] || "",
        back: dd1CategoryData?.urls?.[1] || "",
      };
      
      setDlFiles(dlFilesInitial);
      setDd1Files(dd1FilesInitial);
      setOriginalDlFiles(dlFilesInitial);
      setOriginalDd1Files(dd1FilesInitial);
      
      setUploadedDlFiles(false);
      setUploadedDd1Files(false);
      setSyncChanges(true);
      setValidationIssues([]);
      setIsEditing(false);
    }
  }, [isOpen, driverLicenseData, dd1CategoryData, licenseNumber, licenseIssueNumber]);

  // Validation logic
  useEffect(() => {
    const issues: Array<{
      type: 'warning' | 'error';
      message: string;
      action?: string;
      field?: string;
    }> = [];

    // Check if license number changed but no new document uploaded
    if (formData.license_number !== originalData.license_number && !uploadedDlFiles) {
      issues.push({
        type: 'error',
        message: 'License number changed. Please upload updated Driving License documents.',
        action: 'Upload documents',
        field: 'license_number'
      });
    }

    // Check if issue number changed but no new document uploaded
    if (formData.license_issue_number !== originalData.license_issue_number && !uploadedDlFiles) {
      issues.push({
        type: 'error',
        message: 'Issue number changed. Please upload updated Driving License documents.',
        action: 'Upload documents',
        field: 'license_issue_number'
      });
    }

    // Check if DL expiry changed but no new document uploaded
    if (formData.dl_expiry_date !== originalData.dl_expiry_date && !uploadedDlFiles) {
      issues.push({
        type: 'error',
        message: 'Driving License expiry date changed. Please upload updated documents.',
        action: 'Upload documents',
        field: 'dl_expiry_date'
      });
    }

    // Check if DD1 expiry changed but no new document uploaded
    if (formData.dd1_expiry_date !== originalData.dd1_expiry_date && !uploadedDd1Files) {
      issues.push({
        type: 'error',
        message: 'D/D1 Category expiry date changed. Please upload updated documents.',
        action: 'Upload documents',
        field: 'dd1_expiry_date'
      });
    }

    setValidationIssues(issues);
  }, [formData, originalData, uploadedDlFiles, uploadedDd1Files]);

  const hasChanges = useMemo(() => {
    return (
      formData.license_number !== originalData.license_number ||
      formData.license_issue_number !== originalData.license_issue_number ||
      formData.dl_expiry_date !== originalData.dl_expiry_date ||
      formData.dd1_expiry_date !== originalData.dd1_expiry_date ||
      formData.dl_status !== driverLicenseData?.request_status ||
      formData.dl_status_reason !== driverLicenseData?.status_reason ||
      formData.dl_status_description !== driverLicenseData?.status_description ||
      formData.dl_description !== driverLicenseData?.description ||
      formData.dd1_status !== dd1CategoryData?.request_status ||
      formData.dd1_status_reason !== dd1CategoryData?.status_reason ||
      formData.dd1_status_description !== dd1CategoryData?.status_description ||
      formData.dd1_description !== dd1CategoryData?.description ||
      uploadedDlFiles ||
      uploadedDd1Files
    );
  }, [formData, originalData, driverLicenseData, dd1CategoryData, uploadedDlFiles, uploadedDd1Files]);

  const isValidForSave = useMemo(() => {
    const hasErrors = validationIssues.some(issue => issue.type === 'error');
    const hasCriticalChanges = (
      formData.license_number !== originalData.license_number ||
      formData.license_issue_number !== originalData.license_issue_number ||
      formData.dl_expiry_date !== originalData.dl_expiry_date ||
      formData.dd1_expiry_date !== originalData.dd1_expiry_date
    );
    
    if (hasCriticalChanges) {
      const dlNeedsUpdate = formData.license_number !== originalData.license_number || 
                           formData.license_issue_number !== originalData.license_issue_number ||
                           formData.dl_expiry_date !== originalData.dl_expiry_date;
      const dd1NeedsUpdate = formData.dd1_expiry_date !== originalData.dd1_expiry_date;
      
      if (dlNeedsUpdate && !uploadedDlFiles) return false;
      if (dd1NeedsUpdate && !uploadedDd1Files) return false;
    }
    
    return !hasErrors;
  }, [validationIssues, formData, originalData, uploadedDlFiles, uploadedDd1Files]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (syncChanges && isEditing) {
        if (field === "dl_expiry_date") {
          newData.dd1_expiry_date = value;
        } else if (field === "dd1_expiry_date") {
          newData.dl_expiry_date = value;
        }
      }
      
      return newData;
    });
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [syncChanges, formErrors, isEditing]);

  const handleFileUpload = useCallback((documentType: "dl" | "dd1", side: "front" | "back", url: string) => {
    if (documentType === "dl") {
      setDlFiles(prev => ({ ...prev, [side]: url }));
      setUploadedDlFiles(true);
    } else {
      setDd1Files(prev => ({ ...prev, [side]: url }));
      setUploadedDd1Files(true);
    }
    
    showToast(`Document uploaded successfully`, "success");
  }, [showToast]);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getStatusIcon = useCallback((status: string) => {
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
  }, []);

  const completionPercentage = useMemo(() => {
    let completed = 0;
    let total = 0;
    
    total += 2;
    if (formData.license_number.trim()) completed += 1;
    if (formData.license_issue_number.trim()) completed += 1;
    
    total += 3;
    if (formData.dl_expiry_date) completed += 1;
    if (dlFiles.front) completed += 1;
    if (formData.dl_status !== "pending") completed += 1;
    
    total += 3;
    if (formData.dd1_expiry_date) completed += 1;
    if (dd1Files.front) completed += 1;
    if (formData.dd1_status !== "pending") completed += 1;
    
    return Math.round((completed / total) * 100);
  }, [formData, dlFiles, dd1Files]);

  const handleSave = useCallback(async () => {
    if (!isValidForSave) {
      showToast("Please resolve all validation issues before saving", "error");
      return;
    }
    
    setSaving(true);
    setFormErrors({});
    
    try {
      if (formData.license_number !== licenseNumber || formData.license_issue_number !== licenseIssueNumber) {
        const driverPayload = {
          license_number: formData.license_number,
          license_issue_number: formData.license_issue_number,
        };
        
        const driverResponse = await fetch(`${API_URL}/api/profiles/driver/${driverId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify(driverPayload),
        });
        
        if (!driverResponse.ok) {
          throw new Error("Failed to update license information");
        }
        
        fetchDriverData();
      }
      
      // Save Driving License
      const dlPayload = {
        driver: driverId,
        document_name: "Driving License",
        document_type: "driving-license",
        has_expiry: true,
        description: formData.dl_description || "",
        status_description: formData.dl_status_description || "",
        status_reason: formData.dl_status_reason || "",
        custom_reason: "",
        expiry_date: formData.dl_expiry_date || null,
        has_document: !!dlFiles.front || formData.dl_has_document,
        has_back_side: !!dlFiles.back,
        urls: [dlFiles.front, dlFiles.back].filter(Boolean),
        request_status: formData.dl_status || "pending",
        has_description: !!formData.dl_description || !!formData.dl_status_description,
        next_five_modules: [],
        modules: [],
      };
      
      const dlEndpoint = driverLicenseData?.id
        ? `${API_URL}/api/profiles/professional-competency/${driverLicenseData.id}/`
        : `${API_URL}/api/profiles/professional-competency/`;
      
      const dlMethod = driverLicenseData?.id ? "PUT" : "POST";
      
      const dlResponse = await fetch(dlEndpoint, {
        method: dlMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(dlPayload),
      });
      
      if (!dlResponse.ok) {
        throw new Error("Failed to save Driving License");
      }
      
      // Save D/D1 Category
      const dd1Payload = {
        driver: driverId,
        document_name: "D / D1 Category",
        document_type: "d-d1-category",
        has_expiry: true,
        description: formData.dd1_description || "",
        status_description: formData.dd1_status_description || "",
        status_reason: formData.dd1_status_reason || "",
        custom_reason: "",
        expiry_date: formData.dd1_expiry_date || null,
        has_document: !!dd1Files.front || formData.dd1_has_document,
        has_back_side: !!dd1Files.back,
        urls: [dd1Files.front, dd1Files.back].filter(Boolean),
        request_status: formData.dd1_status || "pending",
        has_description: !!formData.dd1_description || !!formData.dd1_status_description,
        next_five_modules: [],
        modules: [],
      };
      
      const dd1Endpoint = dd1CategoryData?.id
        ? `${API_URL}/api/profiles/professional-competency/${dd1CategoryData.id}/`
        : `${API_URL}/api/profiles/professional-competency/`;
      
      const dd1Method = dd1CategoryData?.id ? "PUT" : "POST";
      
      const dd1Response = await fetch(dd1Endpoint, {
        method: dd1Method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(dd1Payload),
      });
      
      if (!dd1Response.ok) {
        throw new Error("Failed to save D/D1 Category");
      }
      
      showToast("Both documents saved successfully", "success");
      fetchCompetencyData();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error saving documents:", error);
      showToast(error instanceof Error ? error.message : "Failed to save documents", "error");
    } finally {
      setSaving(false);
    }
  }, [
    isValidForSave, formData, dlFiles, dd1Files, driverLicenseData, dd1CategoryData,
    driverId, API_URL, cookies, showToast, fetchCompetencyData,
    fetchDriverData, onOpenChange, licenseNumber, licenseIssueNumber
  ]);

  // Card-based layout instead of tabs
  const renderValidationIssuesCard = () => {
    if (validationIssues.length === 0) return null;
    
    const errors = validationIssues.filter(issue => issue.type === 'error');
    const warnings = validationIssues.filter(issue => issue.type === 'warning');
    
    return (
      <Card className="border-2 border-red-300 shadow-lg bg-gradient-to-br from-red-50 to-white mb-6">
        <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Validation Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {errors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Required Actions</Label>
              {errors.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {warnings.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Recommendations</Label>
              {warnings.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLicenseInfoCard = () => (
    <Card className="border-2 border-indigo-300 shadow-lg bg-gradient-to-br from-indigo-50 to-white mb-6">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <CardTitle className="text-xl flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          Shared License Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              License Number
              {formData.license_number !== originalData.license_number && (
                <span className="text-red-600 text-xs">(Requires document update)</span>
              )}
            </Label>
            {isEditing ? (
              <Input
                value={formData.license_number}
                onChange={(e) => handleFormChange("license_number", e.target.value)}
                className={`border-indigo-300 focus:ring-2 focus:ring-indigo-500 ${formData.license_number !== originalData.license_number ? 'border-blue-500' : ''}`}
                placeholder="Enter license number..."
              />
            ) : (
              <p className="font-semibold text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {formData.license_number || "Not provided"}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Issue Number
              {formData.license_issue_number !== originalData.license_issue_number && (
                <span className="text-red-600 text-xs">(Requires document update)</span>
              )}
            </Label>
            {isEditing ? (
              <Input
                value={formData.license_issue_number}
                onChange={(e) => handleFormChange("license_issue_number", e.target.value)}
                className={`border-blue-300 focus:ring-2 focus:ring-blue-500 ${formData.license_issue_number !== originalData.license_issue_number ? 'border-blue-500' : ''}`}
                placeholder="Enter issue number..."
              />
            ) : (
              <p className="font-semibold text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {formData.license_issue_number || "Not provided"}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Switch
              checked={syncChanges}
              onCheckedChange={setSyncChanges}
              disabled={!isEditing}
            />
            <Label className="text-sm text-gray-700">
              Sync expiry dates between licenses
            </Label>
          </div>
          {syncChanges && (
            <Badge className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <Link2 className="h-3 w-3 mr-1" />
              Synced
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDrivingLicenseCard = () => (
    <Card className="border-2 border-blue-300 shadow-lg bg-gradient-to-br from-blue-50 to-white mb-6">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="text-xl flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          Driving License
          <Badge className="ml-auto bg-white/20 text-white border-white/30">
            {formData.dl_status.replace("_", " ").toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Document Upload Section */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-700">Document Upload</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Front Side Document
                {(formData.license_number !== originalData.license_number || 
                  formData.license_issue_number !== originalData.license_issue_number ||
                  formData.dl_expiry_date !== originalData.dl_expiry_date) && !uploadedDlFiles && isEditing &&
                  <span className="text-red-600 text-xs">(Required)</span>
                }
                {uploadedDlFiles && (
                  <span className="text-green-600 text-xs ml-2">✓ Uploaded</span>
                )}
              </Label>
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors",
                (formData.license_number !== originalData.license_number || 
                 formData.license_issue_number !== originalData.license_issue_number ||
                 formData.dl_expiry_date !== originalData.dl_expiry_date) && !uploadedDlFiles && isEditing
                  ? "border-red-400 bg-red-50/50 hover:border-red-600"
                  : uploadedDlFiles
                  ? "border-green-400 bg-green-50/50 hover:border-green-600"
                  : "border-blue-300 bg-blue-50/50 hover:border-blue-500"
              )}>
                <FileUploaderLazy
                  onUploadSuccess={(url) => handleFileUpload("dl", "front", url)}
                  accept="image/*,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  id="file-upload-dl-front"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Back Side Document
                {uploadedDlFiles && (
                  <span className="text-green-600 text-xs ml-2">✓ Uploaded</span>
                )}
              </Label>
              <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 hover:border-indigo-500 transition-colors bg-indigo-50/50">
                <FileUploaderLazy
                  onUploadSuccess={(url) => handleFileUpload("dl", "back", url)}
                  accept="image/*,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  id="file-upload-dl-back"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Document Carousel */}
        {(dlFiles.front || dlFiles.back) && (
          <DocumentCarousel 
            files={dlFiles}
            originalFiles={originalDlFiles}
            isPdfUrl={isPdfUrl}
            title="Driving License Preview"
            type="dl"
          />
        )}
        
        {/* Status and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              {isEditing ? (
                <Select
                  value={formData.dl_status}
                  onValueChange={(value) => handleFormChange("dl_status", value)}
                >
                  <SelectTrigger className="border-blue-300 focus:ring-2 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="not_approved">Not Approved</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={cn("px-4 py-2 text-sm font-semibold border w-fit", getStatusColor(formData.dl_status))}>
                  {getStatusIcon(formData.dl_status)}
                  {formData.dl_status.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiry Date
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dl_expiry_date || ""}
                  onChange={(e) => handleFormChange("dl_expiry_date", e.target.value)}
                  className={`border-blue-300 focus:ring-2 focus:ring-blue-500 ${formData.dl_expiry_date !== originalData.dl_expiry_date ? 'border-blue-500' : ''}`}
                />
              ) : (
                <p className="font-semibold text-lg text-blue-900 bg-blue-50 p-3 rounded-lg">
                  {formData.dl_expiry_date ? formatDate(formData.dl_expiry_date) : "No expiry date"}
                </p>
              )}
              {formData.dl_expiry_date !== originalData.dl_expiry_date && isEditing && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Document update required
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Description</Label>
              {isEditing ? (
                <Textarea
                  value={formData.dl_description || ""}
                  onChange={(e) => handleFormChange("dl_description", e.target.value)}
                  className="border-blue-300 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Enter document description..."
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {formData.dl_description || "No description provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDD1CategoryCard = () => (
    <Card className="border-2 border-green-300 shadow-lg bg-gradient-to-br from-green-50 to-white mb-6">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardTitle className="text-xl flex items-center gap-2">
          <Car className="h-5 w-5" />
          D/D1 Category
          <Badge className="ml-auto bg-white/20 text-white border-white/30">
            {formData.dd1_status.replace("_", " ").toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Document Upload Section */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-700">Document Upload</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Front Side Document
                {formData.dd1_expiry_date !== originalData.dd1_expiry_date && !uploadedDd1Files && isEditing &&
                  <span className="text-red-600 text-xs">(Required)</span>
                }
                {uploadedDd1Files && (
                  <span className="text-green-600 text-xs ml-2">✓ Uploaded</span>
                )}
              </Label>
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors",
                formData.dd1_expiry_date !== originalData.dd1_expiry_date && !uploadedDd1Files && isEditing
                  ? "border-red-400 bg-red-50/50 hover:border-red-600"
                  : uploadedDd1Files
                  ? "border-green-400 bg-green-50/50 hover:border-green-600"
                  : "border-green-300 bg-green-50/50 hover:border-green-500"
              )}>
                <FileUploaderLazy
                  onUploadSuccess={(url) => handleFileUpload("dd1", "front", url)}
                  accept="image/*,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  id="file-upload-dd1-front"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Back Side Document
                {uploadedDd1Files && (
                  <span className="text-green-600 text-xs ml-2">✓ Uploaded</span>
                )}
              </Label>
              <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 hover:border-emerald-500 transition-colors bg-emerald-50/50">
                <FileUploaderLazy
                  onUploadSuccess={(url) => handleFileUpload("dd1", "back", url)}
                  accept="image/*,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  id="file-upload-dd1-back"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Document Carousel */}
        {(dd1Files.front || dd1Files.back) && (
          <DocumentCarousel 
            files={dd1Files}
            originalFiles={originalDd1Files}
            isPdfUrl={isPdfUrl}
            title="D/D1 Category Preview"
            type="dd1"
          />
        )}
        
        {/* Status and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              {isEditing ? (
                <Select
                  value={formData.dd1_status}
                  onValueChange={(value) => handleFormChange("dd1_status", value)}
                >
                  <SelectTrigger className="border-green-300 focus:ring-2 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="not_approved">Not Approved</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={cn("px-4 py-2 text-sm font-semibold border w-fit", getStatusColor(formData.dd1_status))}>
                  {getStatusIcon(formData.dd1_status)}
                  {formData.dd1_status.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiry Date
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dd1_expiry_date || ""}
                  onChange={(e) => handleFormChange("dd1_expiry_date", e.target.value)}
                  className={`border-green-300 focus:ring-2 focus:ring-green-500 ${formData.dd1_expiry_date !== originalData.dd1_expiry_date ? 'border-green-500' : ''}`}
                />
              ) : (
                <p className="font-semibold text-lg text-green-900 bg-green-50 p-3 rounded-lg">
                  {formData.dd1_expiry_date ? formatDate(formData.dd1_expiry_date) : "No expiry date"}
                </p>
              )}
              {formData.dd1_expiry_date !== originalData.dd1_expiry_date && isEditing && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Document update required
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Description</Label>
              {isEditing ? (
                <Textarea
                  value={formData.dd1_description || ""}
                  onChange={(e) => handleFormChange("dd1_description", e.target.value)}
                  className="border-green-300 focus:ring-2 focus:ring-green-500 min-h-[100px]"
                  placeholder="Enter document description..."
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {formData.dd1_description || "No description provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50/30">
        <DialogHeader className="border-b border-blue-200 pb-4 bg-white/80 backdrop-blur sticky top-0 z-50 -mx-6 px-6 -mt-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <IdCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl text-blue-900 font-bold">
                  Combined License Management
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Manage Driving License and D/D1 Category together for {driverName}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges || !isValidForSave}
                    className={cn(
                      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
                      (!hasChanges || !isValidForSave) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Save All Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Edit Licenses
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Validation Issues */}
          {renderValidationIssuesCard()}
          
          {/* License Information Card */}
          {renderLicenseInfoCard()}
          
          {/* Driving License Card */}
          {renderDrivingLicenseCard()}
          
          {/* D/D1 Category Card */}
          {renderDD1CategoryCard()}
        </div>
        
        {/* Save Status Footer */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 p-4 -mx-6 -mb-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isValidForSave ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Ready to Save</p>
                      <p className="text-sm text-green-700">All changes are valid</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Validation Required</p>
                      <p className="text-sm text-orange-700">
                        {validationIssues.filter(i => i.type === 'error').length} issue(s) need attention
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit to Save
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={saving || !isValidForSave}
                    className={cn(
                      "bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700",
                      !isValidForSave && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}