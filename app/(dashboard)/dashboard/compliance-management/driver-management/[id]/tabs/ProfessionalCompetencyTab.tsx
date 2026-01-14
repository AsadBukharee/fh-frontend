/* eslint-disable react/no-unescaped-entities */
"use client"
import { useState, useCallback, useEffect, useMemo, memo, useRef, useReducer } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit,
  Save,
  File,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Upload,
  Plus,
  X,
  ExternalLink,
  Trash2,
  Image as ImageIcon,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Info,
  AlertTriangle,
  Check,
  XCircle,
  IdCard,
  Key,
  Pencil,
  User,
  Link,
  Unlink,
  RefreshCw,
  Copy,
  Shield,
  Car,
  AlertOctagon,
  Link2,
  Link2Off,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import dynamic from 'next/dynamic'
import { Tabs } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Lazy load heavy components
const FileUploaderLazy = dynamic(() => import("@/components/Media/MediaUpload"), {
  loading: () => <div className="p-4 text-center">Loading uploader...</div>,
  ssr: false
})

// Fixed DEFAULT_DOCUMENTS to match API response - Moved outside component to prevent recreation
const DEFAULT_DOCUMENTS = [
  { id: 1, document_name: "Driving License", document_type: "driving-license", has_expiry: true },
  { id: 2, document_name: "D / D1 Category", document_type: "d-d1-category", has_expiry: true },
  { id: 3, document_name: "CPC Card", document_type: "cpc-card", has_expiry: true },
  { id: 4, document_name: "Tacho Card", document_type: "tacho-card", has_expiry: true },
  { id: 5, document_name: "Passport", document_type: "passport", has_expiry: true },
  { id: 6, document_name: "Proof of Address", document_type: "proof-of-address", has_expiry: false },
  { id: 7, document_name: "DBS Check", document_type: "dbs-check", has_expiry: true },
  { id: 8, document_name: "Last Driver Check Code", document_type: "last-driver-check-code", has_expiry: true },
  { id: 9, document_name: "Last Tacho Download", document_type: "last-tacho-download", has_expiry: true },
]

// Status reasons configuration - Moved outside component
const STATUS_REASONS = {
  pending: [
    { value: "pending_verification", label: "Pending verification" },
    { value: "waiting_upload", label: "Waiting for document upload" },
    { value: "under_review", label: "Under review" },
    { value: "additional_info", label: "Additional information required" },
    { value: "expired_document", label: "Document expired" },
  ],
  not_approved: [
    { value: "poor_quality", label: "Poor quality image" },
    { value: "expired_document", label: "Document expired" },
    { value: "incorrect_info", label: "Incorrect information" },
    { value: "missing_document", label: "Missing document" },
    { value: "illegible", label: "Document illegible" },
    { value: "wrong_document", label: "Wrong document uploaded" },
    { value: "other", label: "Other reason" },
  ],
  approved: [
    { value: "approved", label: "Approved - All requirements met" },
    { value: "verified", label: "Verified and approved" },
    { value: "completed", label: "Documentation completed" },
  ],
}

interface ProfessionalCompetencyTabProps {
  competencyData: any[]
  formatDate: (date: string | null) => string
  isPdfUrl: (url: string) => boolean
  showToast: (message: string, type: string) => void
  cookies: any
  API_URL: string
  driverId: number
  fetchCompetencyData: () => void
  driverName: string
  licenseNumber: string
  licenseIssueNumber: string
  fetchDriverData: () => void
}

// Optimized state reducer for better performance
type ModalState = {
  selectedCompetency: any | null;
  isModalOpen: boolean;
  isEditing: boolean;
  saving: boolean;
  editData: any;
  formErrors: Record<string, string>;
  currentImageIndex: number;
  showStatusDescription: boolean;
  directStatusEditing: boolean;
  statusUpdateData: {
    request_status: string;
    status_reason: string;
    status_description: string;
    custom_reason: string;
  };
};

type ModalAction =
  | { type: 'SET_SELECTED_COMPETENCY'; payload: any }
  | { type: 'SET_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_EDIT_DATA'; payload: any }
  | { type: 'SET_FORM_ERROR'; payload: { field: string; value: string } }
  | { type: 'SET_CURRENT_IMAGE_INDEX'; payload: number }
  | { type: 'SET_SHOW_STATUS_DESCRIPTION'; payload: boolean }
  | { type: 'SET_DIRECT_STATUS_EDITING'; payload: boolean }
  | { type: 'SET_STATUS_UPDATE_DATA'; payload: Partial<ModalState['statusUpdateData']> }
  | { type: 'CLEAR_FORM_ERRORS' }
  | { type: 'RESET_MODAL' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'SET_SELECTED_COMPETENCY':
      return { ...state, selectedCompetency: action.payload };
    case 'SET_MODAL_OPEN':
      return { ...state, isModalOpen: action.payload };
    case 'SET_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_EDIT_DATA':
      return { ...state, editData: action.payload };
    case 'SET_FORM_ERROR':
      return {
        ...state,
        formErrors: {
          ...state.formErrors,
          [action.payload.field]: action.payload.value
        }
      };
    case 'CLEAR_FORM_ERRORS':
      return { ...state, formErrors: {} };
    case 'SET_CURRENT_IMAGE_INDEX':
      return { ...state, currentImageIndex: action.payload };
    case 'SET_SHOW_STATUS_DESCRIPTION':
      return { ...state, showStatusDescription: action.payload };
    case 'SET_DIRECT_STATUS_EDITING':
      return { ...state, directStatusEditing: action.payload };
    case 'SET_STATUS_UPDATE_DATA':
      return {
        ...state,
        statusUpdateData: {
          ...state.statusUpdateData,
          ...action.payload
        }
      };
    case 'RESET_MODAL':
      return {
        selectedCompetency: null,
        isModalOpen: false,
        isEditing: false,
        saving: false,
        editData: null,
        formErrors: {},
        currentImageIndex: 0,
        showStatusDescription: false,
        directStatusEditing: false,
        statusUpdateData: {
          request_status: "",
          status_reason: "",
          status_description: "",
          custom_reason: "",
        },
      };
    default:
      return state;
  }
};

// Optimized image component with Intersection Observer for lazy loading
const LazyImage = memo(({
  src,
  alt,
  className,
  onLoad,
  onError
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
 
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = imgRef.current;
            if (img) {
              img.src = src;
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
   
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
   
    return () => observer.disconnect();
  }, [src]);
 
  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src=""
        data-src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setIsLoaded(true);
          onError?.();
        }}
        loading="lazy"
      />
    </>
  );
});

LazyImage.displayName = 'LazyImage';

// Combined License Dialog Component
const CombinedLicenseDialog = memo(({
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
}: {
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
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "driving-license" | "d-d1-category">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncChanges, setSyncChanges] = useState(true);
  
  // Form data with validation tracking
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
    [key: string]: any; // Add index signature for dynamic access
  };

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
  
  // Original data for comparison
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
  
  const [dlImageIndex, setDlImageIndex] = useState(0);
  const [dd1ImageIndex, setDd1ImageIndex] = useState(0);
  
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
    }
  }, [isOpen, driverLicenseData, dd1CategoryData, licenseNumber, licenseIssueNumber]);

  // Validation logic - Check for required updates
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

    // Check if documents are missing when they should exist
    if (formData.dl_has_document && (!dlFiles.front || dlFiles.front === originalDlFiles.front)) {
      issues.push({
        type: 'warning',
        message: 'Driving License document may need to be updated with the changes.',
        action: 'Review document',
        field: 'dl_document'
      });
    }

    if (formData.dd1_has_document && (!dd1Files.front || dd1Files.front === originalDd1Files.front)) {
      issues.push({
        type: 'warning',
        message: 'D/D1 Category document may need to be updated with the changes.',
        action: 'Review document',
        field: 'dd1_document'
      });
    }

    setValidationIssues(issues);
  }, [formData, originalData, uploadedDlFiles, uploadedDd1Files, dlFiles, dd1Files, originalDlFiles, originalDd1Files]);

  // Check if there are any changes
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

  // Check if changes are valid (no blocking errors)
  const isValidForSave = useMemo(() => {
    const hasErrors = validationIssues.some(issue => issue.type === 'error');
    const hasCriticalChanges = (
      formData.license_number !== originalData.license_number ||
      formData.license_issue_number !== originalData.license_issue_number ||
      formData.dl_expiry_date !== originalData.dl_expiry_date ||
      formData.dd1_expiry_date !== originalData.dd1_expiry_date
    );
    
    if (hasCriticalChanges) {
      // For critical changes, both documents must be uploaded
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
      
      if (syncChanges) {
        // Auto-sync expiry dates
        if (field === "dl_expiry_date") {
          newData.dd1_expiry_date = value;
        } else if (field === "dd1_expiry_date") {
          newData.dl_expiry_date = value;
        }
        
        // Auto-sync status
        if (field.startsWith("dl_")) {
          const dd1Field = field.replace("dl_", "dd1_");
          if (dd1Field in newData) {
            newData[dd1Field] = value;
          }
        } else if (field.startsWith("dd1_")) {
          const dlField = field.replace("dd1_", "dl_");
          if (dlField in newData) {
            newData[dlField] = value;
          }
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
  }, [syncChanges, formErrors]);

  const handleFileUpload = useCallback((documentType: "dl" | "dd1", side: "front" | "back", url: string) => {
    if (documentType === "dl") {
      setDlFiles(prev => ({ ...prev, [side]: url }));
      setUploadedDlFiles(true);
    } else {
      setDd1Files(prev => ({ ...prev, [side]: url }));
      setUploadedDd1Files(true);
    }
    
    if (syncChanges) {
      // If syncing, update the other document too
      if (documentType === "dl") {
        setDd1Files(prev => ({ ...prev, [side]: url }));
        setUploadedDd1Files(true);
      } else {
        setDlFiles(prev => ({ ...prev, [side]: url }));
        setUploadedDlFiles(true);
      }
    }
    
    // Clear validation issues for this document
    setValidationIssues(prev => 
      prev.filter(issue => 
        !(issue.field === `${documentType}_document` || 
          (documentType === "dl" && issue.field?.includes("license")) ||
          (documentType === "dl" && issue.field === "dl_expiry_date") ||
          (documentType === "dd1" && issue.field === "dd1_expiry_date"))
      )
    );
    
    showToast(`Document uploaded successfully`, "success");
  }, [syncChanges, showToast]);

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

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    let completed = 0;
    let total = 0;
    
    // License info
    total += 2;
    if (formData.license_number.trim()) completed += 1;
    if (formData.license_issue_number.trim()) completed += 1;
    
    // Driving License
    total += 3;
    if (formData.dl_expiry_date) completed += 1;
    if (dlFiles.front) completed += 1;
    if (formData.dl_status !== "pending") completed += 1;
    
    // D/D1 Category
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
      // Update driver license information if changed
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

  // Render validation issues section
  const renderValidationIssues = () => {
    if (validationIssues.length === 0) return null;
    
    const errors = validationIssues.filter(issue => issue.type === 'error');
    const warnings = validationIssues.filter(issue => issue.type === 'warning');
    
    return (
      <Card className="border-2 border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Validation Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-red-700">Required Actions</Label>
              {errors.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{issue.message}</p>
                    {issue.action && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                          onClick={() => {
                            if (issue.field === 'license_number' || issue.field === 'license_issue_number' || issue.field === 'dl_expiry_date') {
                              setActiveTab('driving-license');
                            } else if (issue.field === 'dd1_expiry_date') {
                              setActiveTab('d-d1-category');
                            }
                          }}
                        >
                          {issue.action}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {warnings.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-orange-700">Recommendations</Label>
              {warnings.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">{issue.message}</p>
                    {issue.action && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs"
                          onClick={() => {
                            if (issue.field === 'dl_document') {
                              setActiveTab('driving-license');
                            } else if (issue.field === 'dd1_document') {
                              setActiveTab('d-d1-category');
                            }
                          }}
                        >
                          {issue.action}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card className="border-2 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-orange-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Completion Status</p>
                <p className="text-sm text-gray-600">Both licenses synchronized</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "px-3 py-1 text-xs",
                validationIssues.length > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
              )}>
                {validationIssues.length > 0 ? `${validationIssues.length} Issues` : "Ready to Save"}
              </Badge>
              <Badge className="bg-gradient-to-r from-indigo-600 to-orange-600 text-white">
                {completionPercentage}% Complete
              </Badge>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {renderValidationIssues()}

      {/* License Information */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-indigo-50 border-b border-orange-200">
          <CardTitle className="text-xl text-orange-900 flex items-center gap-3">
            <IdCard className="h-5 w-5" />
            Shared License Information
          </CardTitle>
          <CardDescription>
            Changes to license information require updated documents
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                License Number
              </Label>
              {formData.license_number !== originalData.license_number && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Changed
                </Badge>
              )}
            </div>
            {isEditing ? (
              <Input
                value={formData.license_number}
                onChange={(e) => handleFormChange("license_number", e.target.value)}
                className={cn(
                  "border-orange-300 focus:ring-2 focus:ring-orange-500",
                  formData.license_number !== originalData.license_number && "border-blue-500"
                )}
                placeholder="Enter license number..."
              />
            ) : (
              <div className="font-semibold text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {formData.license_number || "Not provided"}
              </div>
            )}
            {formData.license_number !== originalData.license_number && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Document update required
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Issue Number
              </Label>
              {formData.license_issue_number !== originalData.license_issue_number && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Changed
                </Badge>
              )}
            </div>
            {isEditing ? (
              <Input
                value={formData.license_issue_number}
                onChange={(e) => handleFormChange("license_issue_number", e.target.value)}
                className={cn(
                  "border-blue-300 focus:ring-2 focus:ring-blue-500",
                  formData.license_issue_number !== originalData.license_issue_number && "border-blue-500"
                )}
                placeholder="Enter issue number..."
              />
            ) : (
              <div className="font-semibold text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {formData.license_issue_number || "Not provided"}
              </div>
            )}
            {formData.license_issue_number !== originalData.license_issue_number && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Document update required
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driving License Card */}
        <Card className={cn(
          "border-2 transition-all",
          formData.dl_expiry_date !== originalData.dl_expiry_date ? "border-blue-500" : "border-blue-200"
        )}>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                  <IdCard className="h-5 w-5" />
                  Driving License
                </CardTitle>
                {formData.dl_expiry_date !== originalData.dl_expiry_date && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expiry date changed - document update required</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("px-3 py-1 text-xs", getStatusColor(formData.dl_status))}>
                  {formData.dl_status.replace("_", " ").toUpperCase()}
                </Badge>
                {uploadedDlFiles && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Updated
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">Expiry Date</Label>
                {formData.dl_expiry_date !== originalData.dl_expiry_date && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Changed
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dl_expiry_date || ""}
                  onChange={(e) => handleFormChange("dl_expiry_date", e.target.value)}
                  className={cn(
                    "border-blue-300 focus:ring-2 focus:ring-blue-500",
                    formData.dl_expiry_date !== originalData.dl_expiry_date && "border-blue-500"
                  )}
                />
              ) : (
                <div className="font-semibold text-lg text-blue-900 bg-blue-50 p-3 rounded-lg">
                  {formData.dl_expiry_date ? formatDate(formData.dl_expiry_date) : "No expiry date"}
                </div>
              )}
              {formData.dl_expiry_date !== originalData.dl_expiry_date && !uploadedDlFiles && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Document update required
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Document</Label>
              {dlFiles.front ? (
                <div className="relative h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg overflow-hidden border border-blue-200">
                  {isPdfUrl(dlFiles.front) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-blue-600 opacity-50" />
                    </div>
                  ) : (
                    <img
                      src={dlFiles.front}
                      alt="Driving License Front"
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                  {dlFiles.front !== originalDlFiles.front && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Updated
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No document uploaded</p>
                </div>
              )}
            </div>
            
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('driving-license')}
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Driving License Details
              </Button>
            )}
          </CardContent>
        </Card>

        {/* D/D1 Category Card */}
        <Card className={cn(
          "border-2 transition-all",
          formData.dd1_expiry_date !== originalData.dd1_expiry_date ? "border-green-500" : "border-green-200"
        )}>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  D/D1 Category
                </CardTitle>
                {formData.dd1_expiry_date !== originalData.dd1_expiry_date && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-green-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expiry date changed - document update required</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("px-3 py-1 text-xs", getStatusColor(formData.dd1_status))}>
                  {formData.dd1_status.replace("_", " ").toUpperCase()}
                </Badge>
                {uploadedDd1Files && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Updated
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">Expiry Date</Label>
                {formData.dd1_expiry_date !== originalData.dd1_expiry_date && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Changed
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dd1_expiry_date || ""}
                  onChange={(e) => handleFormChange("dd1_expiry_date", e.target.value)}
                  className={cn(
                    "border-green-300 focus:ring-2 focus:ring-green-500",
                    formData.dd1_expiry_date !== originalData.dd1_expiry_date && "border-green-500"
                  )}
                />
              ) : (
                <div className="font-semibold text-lg text-green-900 bg-green-50 p-3 rounded-lg">
                  {formData.dd1_expiry_date ? formatDate(formData.dd1_expiry_date) : "No expiry date"}
                </div>
              )}
              {formData.dd1_expiry_date !== originalData.dd1_expiry_date && !uploadedDd1Files && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Document update required
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Document</Label>
              {dd1Files.front ? (
                <div className="relative h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden border border-green-200">
                  {isPdfUrl(dd1Files.front) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-green-600 opacity-50" />
                    </div>
                  ) : (
                    <img
                      src={dd1Files.front}
                      alt="D/D1 Category Front"
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                  {dd1Files.front !== originalDd1Files.front && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Updated
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No document uploaded</p>
                </div>
              )}
            </div>
            
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('d-d1-category')}
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit D/D1 Category Details
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Settings */}
      {isEditing && (
        <Card className="border-2 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-orange-100 rounded-lg">
                  {syncChanges ? (
                    <Link2 className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Link2Off className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {syncChanges ? "Changes are synchronized" : "Changes are independent"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {syncChanges 
                      ? "Updates to one license will automatically apply to the other"
                      : "Each license can be updated independently"}
                  </p>
                </div>
              </div>
              <Switch
                checked={syncChanges}
                onCheckedChange={setSyncChanges}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-600 data-[state=checked]:to-orange-600"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render detailed Driving License tab
  const renderDrivingLicenseTab = () => (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <CardTitle className="text-xl text-blue-900 flex items-center gap-3">
            <IdCard className="h-5 w-5" />
            Driving License Details
          </CardTitle>
          <CardDescription>
            Update document, status, and other details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Document Upload Section */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Document Upload</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Front Side</Label>
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-4 transition-colors",
                  formData.license_number !== originalData.license_number || 
                  formData.license_issue_number !== originalData.license_issue_number ||
                  formData.dl_expiry_date !== originalData.dl_expiry_date
                    ? "border-red-400 bg-red-50/50 hover:border-red-600"
                    : "border-blue-300 bg-blue-50/50 hover:border-blue-500"
                )}>
                  <FileUploaderLazy
                    onUploadSuccess={(url) => handleFileUpload("dl", "front", url)}
                    accept="image/*,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    id="file-upload-dl-front"
                  />
                </div>
                {dlFiles.front && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Front document uploaded
                    {dlFiles.front !== originalDlFiles.front && (
                      <span className="ml-1 font-semibold">(Updated)</span>
                    )}
                  </p>
                )}
                {(formData.license_number !== originalData.license_number || 
                  formData.license_issue_number !== originalData.license_issue_number ||
                  formData.dl_expiry_date !== originalData.dl_expiry_date) && !uploadedDlFiles && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required due to changes
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Back Side (Optional)</Label>
                <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 hover:border-indigo-500 transition-colors bg-indigo-50/50">
                  <FileUploaderLazy
                    onUploadSuccess={(url) => handleFileUpload("dl", "back", url)}
                    accept="image/*,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    id="file-upload-dl-back"
                  />
                </div>
                {dlFiles.back && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Back document uploaded
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Document Preview */}
          {dlFiles.front && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Document Preview</Label>
              <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                {isPdfUrl(dlFiles.front) ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-20 w-20 text-gray-400 opacity-50" />
                  </div>
                ) : (
                  <img
                    src={dlFiles.front}
                    alt="Driving License Preview"
                    className="w-full h-full object-contain p-4"
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Status and Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center gap-2">
                    {getStatusIcon(formData.dl_status)}
                    <span className="font-medium capitalize">{formData.dl_status.replace("_", " ")}</span>
                  </div>
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
                    className={cn(
                      "border-blue-300 focus:ring-2 focus:ring-blue-500",
                      formData.dl_expiry_date !== originalData.dl_expiry_date && "border-blue-500"
                    )}
                  />
                ) : (
                  <div className="font-semibold text-lg text-blue-900 bg-blue-50 p-3 rounded-lg">
                    {formData.dl_expiry_date ? formatDate(formData.dl_expiry_date) : "No expiry date"}
                  </div>
                )}
                {formData.dl_expiry_date !== originalData.dl_expiry_date && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Document update required
                  </p>
                )}
              </div>
            </div>
            
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
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {formData.dl_description || "No description provided"}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status Details</Label>
              {isEditing ? (
                <Textarea
                  value={formData.dl_status_description || ""}
                  onChange={(e) => handleFormChange("dl_status_description", e.target.value)}
                  className="border-blue-300 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Enter status details..."
                />
              ) : (
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {formData.dl_status_description || "No status details"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render detailed D/D1 Category tab
  const renderDD1CategoryTab = () => (
    <div className="space-y-6">
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <CardTitle className="text-xl text-green-900 flex items-center gap-3">
            <Car className="h-5 w-5" />
            D/D1 Category Details
          </CardTitle>
          <CardDescription>
            Update document, status, and other details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Document Upload Section */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Document Upload</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Front Side</Label>
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-4 transition-colors",
                  formData.dd1_expiry_date !== originalData.dd1_expiry_date
                    ? "border-red-400 bg-red-50/50 hover:border-red-600"
                    : "border-green-300 bg-green-50/50 hover:border-green-500"
                )}>
                  <FileUploaderLazy
                    onUploadSuccess={(url) => handleFileUpload("dd1", "front", url)}
                    accept="image/*,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    id="file-upload-dd1-front"
                  />
                </div>
                {dd1Files.front && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Front document uploaded
                    {dd1Files.front !== originalDd1Files.front && (
                      <span className="ml-1 font-semibold">(Updated)</span>
                    )}
                  </p>
                )}
                {formData.dd1_expiry_date !== originalData.dd1_expiry_date && !uploadedDd1Files && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required due to expiry date change
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Back Side (Optional)</Label>
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 hover:border-emerald-500 transition-colors bg-emerald-50/50">
                  <FileUploaderLazy
                    onUploadSuccess={(url) => handleFileUpload("dd1", "back", url)}
                    accept="image/*,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    id="file-upload-dd1-back"
                  />
                </div>
                {dd1Files.back && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Back document uploaded
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Document Preview */}
          {dd1Files.front && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Document Preview</Label>
              <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                {isPdfUrl(dd1Files.front) ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-20 w-20 text-gray-400 opacity-50" />
                  </div>
                ) : (
                  <img
                    src={dd1Files.front}
                    alt="D/D1 Category Preview"
                    className="w-full h-full object-contain p-4"
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Status and Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center gap-2">
                    {getStatusIcon(formData.dd1_status)}
                    <span className="font-medium capitalize">{formData.dd1_status.replace("_", " ")}</span>
                  </div>
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
                    className={cn(
                      "border-green-300 focus:ring-2 focus:ring-green-500",
                      formData.dd1_expiry_date !== originalData.dd1_expiry_date && "border-green-500"
                    )}
                  />
                ) : (
                  <div className="font-semibold text-lg text-green-900 bg-green-50 p-3 rounded-lg">
                    {formData.dd1_expiry_date ? formatDate(formData.dd1_expiry_date) : "No expiry date"}
                  </div>
                )}
                {formData.dd1_expiry_date !== originalData.dd1_expiry_date && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Document update required
                  </p>
                )}
              </div>
            </div>
            
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
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {formData.dd1_description || "No description provided"}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status Details</Label>
              {isEditing ? (
                <Textarea
                  value={formData.dd1_status_description || ""}
                  onChange={(e) => handleFormChange("dd1_status_description", e.target.value)}
                  className="border-green-300 focus:ring-2 focus:ring-green-500 min-h-[80px]"
                  placeholder="Enter status details..."
                />
              ) : (
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {formData.dd1_status_description || "No status details"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-orange-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-600 to-indigo-600 rounded-xl shadow-lg">
                <IdCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl text-orange-900 font-bold">
                  License Management
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Manage Driving License and D/D1 Category together
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
                      "bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 text-white shadow-lg",
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
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-orange-600 to-green-600 hover:from-orange-700 hover:to-green-700 text-white shadow-lg"
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
        
        
     
            {renderOverviewTab()}
    
            {renderDrivingLicenseTab()}
        
            {renderDD1CategoryTab()}
       
        
        {/* Save Status Footer */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-gradient-to-r from-orange-50 to-indigo-50 border-t border-orange-200 p-4 -mx-6 -mb-6 mt-6">
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
                    className="bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700"
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
});

CombinedLicenseDialog.displayName = 'CombinedLicenseDialog';

// Enhanced CompetencyCard with combined license option
const EnhancedCompetencyCard = memo(({
  competency,
  cardImageIndex,
  setCardImageIndexes,
  handleCardClick,
  isPdfUrl,
  formatDate,
  getStatusColor,
  getStatusIcon,
  license_number,
  license_issue_number,
  onOpenCombinedDialog,
}: {
  competency: any;
  cardImageIndex: number;
  setCardImageIndexes: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleCardClick: (competency: any) => void;
  isPdfUrl: (url: string) => boolean;
  formatDate: (date: string | null) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  license_number: string;
  license_issue_number: string;
  onOpenCombinedDialog?: () => void;
}) => {
  const isLicense = competency.document_type === "driving-license" || 
                   competency.document_type === "d-d1-category";
  
  const hasMultipleImages = competency.urls?.length > 1;
 
  const handleCardImageClick = useCallback((index: number) => {
    setCardImageIndexes(prev => ({
      ...prev,
      [competency.id || 0]: index
    }));
  }, [competency.id, setCardImageIndexes]);
  
  const handleCardImageNavigation = useCallback((direction: 'prev' | 'next', urlsLength: number) => {
    setCardImageIndexes(prev => {
      const currentIndex = prev[competency.id || 0] || 0;
      let newIndex;
      if (direction === 'prev') {
        newIndex = currentIndex === 0 ? urlsLength - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === urlsLength - 1 ? 0 : currentIndex + 1;
      }
      return {
        ...prev,
        [competency.id || 0]: newIndex
      };
    });
  }, [competency.id, setCardImageIndexes]);
  
  const handleCombinedClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenCombinedDialog) {
      onOpenCombinedDialog();
    }
  }, [onOpenCombinedDialog]);

  const renderImageCarousel = useMemo(() => {
    if (!competency.has_document || !competency.urls?.[0]) return null;
   
    return (
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
      
        <div className="relative h-full">
          {competency.urls.map((url: string, index: number) => (
            <div
              key={`${competency.id}-${index}`}
              className={`absolute inset-0 transition-opacity duration-300 ${
                index === cardImageIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {isPdfUrl(url) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-indigo-100">
                  <FileText className="h-20 w-20 text-orange-600 opacity-50" />
                </div>
              ) : (
                <LazyImage
                  src={url}
                  alt={`${competency.document_name} - ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              )}
            </div>
          ))}
        
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardImageNavigation('prev', competency.urls.length);
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardImageNavigation('next', competency.urls.length);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5">
                {competency.urls.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardImageClick(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === cardImageIndex
                        ? 'bg-white scale-125'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            
              <div className="absolute top-2 left-2 z-20 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {cardImageIndex + 1}/{competency.urls.length}
              </div>
            </>
          )}
        </div>
      
        <Badge
          className={cn(
            "absolute top-3 right-3 z-20 px-3 py-1.5 text-xs font-semibold border shadow-lg backdrop-blur-sm inline-flex items-center gap-1.5",
            getStatusColor(competency.request_status || "pending"),
          )}
        >
          {getStatusIcon(competency.request_status || "pending")}
          {(competency.request_status || "pending").replace("_", " ").toUpperCase()}
        </Badge>
      </div>
    );
  }, [competency, cardImageIndex, isPdfUrl, hasMultipleImages, handleCardImageNavigation, handleCardImageClick, getStatusColor, getStatusIcon]);

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 border-2 relative overflow-hidden",
        competency.has_document
          ? "hover:shadow-2xl border-green-200 hover:border-orange-400 bg-white hover:scale-[1.02]"
          : "border-dashed border-red-600 bg-gray-50/50 hover:border-orange-400 hover:bg-orange-50/50",
        isLicense && "border-2 border-blue-200 hover:border-blue-400"
      )}
      onClick={() => handleCardClick(competency)}
    >
      {isLicense && onOpenCombinedDialog && (
        <div className="absolute top-3 left-3 z-20">
          <Button
            size="sm"
            onClick={handleCombinedClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs px-2 py-1 h-auto"
          >
            <Link className="h-3 w-3 mr-1" />
            Combined
          </Button>
        </div>
      )}
     
      {renderImageCarousel}
     
      <CardContent className="p-5 space-y-3 relative">
        {!competency.has_document && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-indigo-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
        )}
       
        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "p-2.5 rounded-xl transition-all shadow-sm",
                  competency.has_document
                    ? "bg-gradient-to-br from-orange-500 to-indigo-500 group-hover:shadow-md"
                    : "bg-gray-300 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-indigo-500",
                  isLicense && "bg-gradient-to-br from-blue-500 to-indigo-500"
                )}
              >
                {competency.has_document ? (
                  <FileText className="h-5 w-5 text-white" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                )}
              </div>
            </div>
            <h3
              className={cn(
                "font-bold text-lg mb-1 line-clamp-2 transition-colors leading-tight",
                competency.has_document
                  ? "text-gray-900"
                  : "text-gray-600 group-hover:text-orange-700",
                isLicense && "text-blue-900"
              )}
            >
              {competency.document_name}
            </h3>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              {competency.document_type?.replace("-", " ")}
            </p>
          </div>
        </div>
       
        {competency.has_document ? (
          <>
            <Separator className="bg-orange-100" />
            <div className="space-y-2">
              {competency.has_expiry && competency.expiry_date && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-orange-50 to-indigo-50 rounded-lg p-2.5 border border-orange-100">
                  <Calendar className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="font-medium text-xs">Expires:</span>
                  <span className="font-bold text-orange-700 ml-auto">{formatDate(competency.expiry_date)}</span>
                </div>
              )}
             
              {competency.description && (
                <div className="text-xs p-2 rounded bg-gray-50 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 line-clamp-2">{competency.description}</span>
                  </div>
                </div>
              )}
             
              <div className="flex items-center gap-2 text-sm flex-wrap">
                {competency.modules && competency.modules.length > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-700 bg-indigo-50 rounded-lg px-2.5 py-1.5 border border-indigo-100">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="font-bold text-xs">{competency.modules.length}</span>
                    <span className="text-xs">Module{competency.modules.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
               
                {competency.document_type === "driving-license" && (
                  <div className="flex justify-between w-full gap-2 mt-2">
                    <div className="border-gray-200 border w-full p-1 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg">
                          <IdCard className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-md text-gray-900">
                            {license_number || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  
                    <div className="border-gray-200 border w-full p-1 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg">
                          <Key className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-md text-gray-900">
                            {license_issue_number || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              
                {competency.has_document && (
                  <div className="flex items-center gap-1.5 text-gray-700 bg-green-50 rounded-lg px-2.5 py-1.5 border border-green-100 mt-2">
                    <FileCheck className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-bold text-xs">{competency.urls?.length || 0}</span>
                    <span className="text-xs">Image{competency.urls?.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full text-orange-600 hover:text-white hover:bg-gradient-to-r hover:from-orange-600 hover:to-indigo-600 font-semibold text-sm py-2 mt-2 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick(competency);
              }}
            >
              View Full Details
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </>
        ) : (
          <>
            <Separator className="bg-gray-200" />
            <div className="py-6 text-center">
              <Plus className="h-10 w-10 text-gray-400 mx-auto mb-3 group-hover:text-orange-500 group-hover:scale-110 transition-all" />
              <p className="text-sm font-semibold text-gray-600 group-hover:text-orange-700 transition-colors mb-1">
                Click to upload document
              </p>
              <p className="text-xs text-gray-500">
                {competency.has_expiry ? "📅 Requires expiry date" : "📄 No expiry required"}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

EnhancedCompetencyCard.displayName = 'EnhancedCompetencyCard';

export default function ProfessionalCompetencyTab({
  competencyData,
  formatDate,
  isPdfUrl,
  driverId,
  showToast,
  cookies,
  API_URL,
  fetchCompetencyData,
  driverName,
  licenseNumber,
  licenseIssueNumber,
  fetchDriverData,
}: ProfessionalCompetencyTabProps) {
  // Existing modal state reducer
  const [modalState, dispatchModal] = useReducer(modalReducer, {
    selectedCompetency: null,
    isModalOpen: false,
    isEditing: false,
    saving: false,
    editData: null,
    formErrors: {},
    currentImageIndex: 0,
    showStatusDescription: false,
    directStatusEditing: false,
    statusUpdateData: {
      request_status: "",
      status_reason: "",
      status_description: "",
      custom_reason: "",
    },
  });
  
  // Combined dialog state
  const [isCombinedDialogOpen, setIsCombinedDialogOpen] = useState(false);
  const [combinedLicenseData, setCombinedLicenseData] = useState<{
    driverLicenseData: any;
    dd1CategoryData: any;
  }>({
    driverLicenseData: null,
    dd1CategoryData: null,
  });
  
  // Existing states
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [uploadRequired, setUploadRequired] = useState(false)
  const [originalExpiryDate, setOriginalExpiryDate] = useState<string | null>(null)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [reminderData, setReminderData] = useState({
    title: "",
    description: "",
    priority: "medium",
    start_date: "",
    recurrence: "once",
    recurrence_interval: 1,
  })
 
  const [cardImageIndexes, setCardImageIndexes] = useState<Record<number, number>>({})
  const [driverLicenseInfo, setDriverLicenseInfo] = useState({
    license_number: licenseNumber || "",
    license_issue_number: licenseIssueNumber || "",
  })
  const [originalLicenseInfo, setOriginalLicenseInfo] = useState({
    license_number: licenseNumber || "",
    license_issue_number: licenseIssueNumber || "",
  })
  const [hasUploadedNewDocument, setHasUploadedNewDocument] = useState(false)
  const [originalDocumentUrls, setOriginalDocumentUrls] = useState<string[]>([])
  const [documentDependencies, setDocumentDependencies] = useState<{
    drivingLicenseChanged: boolean;
    dd1CategoryChanged: boolean;
    pendingSync: boolean;
    otherDocument: any | null;
  }>({
    drivingLicenseChanged: false,
    dd1CategoryChanged: false,
    pendingSync: false,
    otherDocument: null,
  });
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncAction, setSyncAction] = useState<"update" | "skip">("skip");
  
  // Function to open combined dialog
  const handleOpenCombinedDialog = useCallback((competency: any) => {
    // Find both documents from competencyData
    const driverLicenseData = competencyData.find(
      (d: any) => d.document_type === "driving-license"
    );
    const dd1CategoryData = competencyData.find(
      (d: any) => d.document_type === "d-d1-category"
    );
    
    setCombinedLicenseData({
      driverLicenseData: driverLicenseData || null,
      dd1CategoryData: dd1CategoryData || null,
    });
    
    setIsCombinedDialogOpen(true);
  }, [competencyData]);
  
  // Existing functions
  const getCompletedDocumentsList = useCallback(() => {
    const uploadedMap = new Map(competencyData.map((d) => [d.document_type, d]))
  
    return DEFAULT_DOCUMENTS.map(defaultDoc => {
      const apiDoc = uploadedMap.get(defaultDoc.document_type)
    
      if (apiDoc) {
        return apiDoc
      }
    
      return {
        ...defaultDoc,
        id: null,
        has_document: false,
        urls: [],
        modules: [],
        next_five_modules: [],
        request_status: "pending",
        status_description: "",
        status_reason: "",
        custom_reason: "",
        description: "",
        expiry_date: null,
        has_back_side: false,
        has_description: false,
        driver: null,
        created_at: null,
        updated_at: null,
      }
    })
  }, [competencyData])
  
  // Update license info when props change
  useEffect(() => {
    setDriverLicenseInfo({
      license_number: licenseNumber || "",
      license_issue_number: licenseIssueNumber || "",
    })
    setOriginalLicenseInfo({
      license_number: licenseNumber || "",
      license_issue_number: licenseIssueNumber || "",
    })
  }, [licenseNumber, licenseIssueNumber])
  
  // Modified handleCardClick to handle combined dialog
  const handleCardClick = useCallback((competency: any) => {
    // Check if this is one of the license documents
    const isLicenseDocument = 
      competency.document_type === "driving-license" || 
      competency.document_type === "d-d1-category";
    
    // If it's a license document and we're not in edit mode, open combined dialog
    if (isLicenseDocument && !modalState.isEditing) {
      handleOpenCombinedDialog(competency);
      return;
    }
    
    // Original logic for other documents or when editing
    const modules = competency.modules || [];
    let normalizedNextFiveModules: string[] = [];
    
    if (competency.next_five_modules && competency.next_five_modules.length > 0) {
      normalizedNextFiveModules = competency.next_five_modules.map((item: any) =>
        typeof item === 'string' ? item : (item.module_name || "")
      );
    } else {
      if (competency.document_type === "cpc-card") {
        normalizedNextFiveModules = ["", "", "", "", ""];
      }
    }
    
    while (normalizedNextFiveModules.length < 5) {
      normalizedNextFiveModules.push("");
    }
    
    normalizedNextFiveModules = normalizedNextFiveModules.slice(0, 5);
    
    const editData = {
      ...competency,
      modules: modules,
      next_five_modules: normalizedNextFiveModules,
      status_description: competency.status_description || "",
      status_reason: competency.status_reason || "",
      custom_reason: competency.custom_reason || "",
    };
    
    setOriginalExpiryDate(competency.expiry_date);
    setOriginalDocumentUrls(competency.urls || []);
    setHasUploadedNewDocument(false);
    setUploadRequired(false);
    setDocumentDependencies({
      drivingLicenseChanged: false,
      dd1CategoryChanged: false,
      pendingSync: false,
      otherDocument: null,
    });
    
    dispatchModal({ type: 'SET_SELECTED_COMPETENCY', payload: competency });
    dispatchModal({ type: 'SET_EDIT_DATA', payload: editData });
    dispatchModal({ type: 'SET_MODAL_OPEN', payload: true });
    dispatchModal({ type: 'SET_EDITING', payload: false });
    dispatchModal({ type: 'CLEAR_FORM_ERRORS' });
    dispatchModal({ type: 'SET_CURRENT_IMAGE_INDEX', payload: 0 });
    dispatchModal({ 
      type: 'SET_SHOW_STATUS_DESCRIPTION', 
      payload: competency.request_status === "not_approved" || competency.request_status === "pending" 
    });
    dispatchModal({ type: 'SET_DIRECT_STATUS_EDITING', payload: false });
  }, [handleOpenCombinedDialog, modalState.isEditing]);
  
  // Existing functions remain the same...
  const checkOtherDocument = useCallback(async () => {
    if (!modalState.editData) return null;
    const isDrivingLicense = modalState.editData.document_type === "driving-license";
    const isDD1Category = modalState.editData.document_type === "d-d1-category";
   
    if (!isDrivingLicense && !isDD1Category) return null;
   
    try {
      const otherDocumentType = isDrivingLicense ? "d-d1-category" : "driving-license";
    
      const response = await fetch(
        `${API_URL}/api/profiles/professional-competency/?driver=${driverId}&document_type=${otherDocumentType}`,
        {
          headers: {
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        }
      );
     
      if (response.ok) {
        const data = await response.json();
        return data.results?.[0] || data[0];
      }
    } catch (error) {
      console.error("Error checking other document:", error);
    }
    return null;
  }, [modalState.editData, driverId, API_URL, cookies]);
  
  const checkAndShowSyncDialog = useCallback(async () => {
    if (!modalState.editData) return;
  
    const isDrivingLicense = modalState.editData.document_type === "driving-license";
    const isDD1Category = modalState.editData.document_type === "d-d1-category";
  
    if (!isDrivingLicense && !isDD1Category) return;
  
    const otherDocument = await checkOtherDocument();
  
    if (otherDocument && otherDocument.has_document) {
      setDocumentDependencies({
        drivingLicenseChanged: isDrivingLicense,
        dd1CategoryChanged: isDD1Category,
        pendingSync: true,
        otherDocument: otherDocument,
      });
    
      setIsSyncDialogOpen(true);
    }
  }, [modalState.editData, checkOtherDocument]);
  
  const handleInputChange = useCallback((field: string, value: any) => {
    dispatchModal({
      type: 'SET_EDIT_DATA',
      payload: {
        ...modalState.editData,
        [field]: value
      }
    });
    if (field === "expiry_date") {
      const isExpiryDateChanged = value !== originalExpiryDate
    
      if (isExpiryDateChanged && modalState.editData.has_document && !hasUploadedNewDocument) {
        setUploadRequired(true)
      
        const isDrivingLicense = modalState.editData.document_type === "driving-license";
        const isDD1Category = modalState.editData.document_type === "d-d1-category";
        const isRelatedDocument = isDrivingLicense || isDD1Category;
      
        if (isRelatedDocument && !documentDependencies.pendingSync) {
          checkAndShowSyncDialog();
        }
      }
    }
   
    if (field === "request_status") {
      dispatchModal({
        type: 'SET_SHOW_STATUS_DESCRIPTION',
        payload: value === "not_approved" || value === "pending"
      });
    }
   
    if (field === "status_reason" && value) {
      const statusReasons = STATUS_REASONS[(modalState.editData.request_status as keyof typeof STATUS_REASONS) || "pending"]
      const selectedReason = statusReasons?.find(reason => reason.value === value)
      if (selectedReason && !modalState.editData.status_description) {
        dispatchModal({
          type: 'SET_EDIT_DATA',
          payload: {
            ...modalState.editData,
            status_description: selectedReason.label
          }
        });
      }
    }
   
    dispatchModal({
      type: 'SET_FORM_ERROR',
      payload: { field, value: "" }
    });
  }, [modalState.editData, originalExpiryDate, hasUploadedNewDocument, documentDependencies, checkAndShowSyncDialog]);
  
  const handleLicenseInfoChange = useCallback((field: string, value: string) => {
    setDriverLicenseInfo(prev => ({
      ...prev,
      [field]: value
    }))
  
    if (modalState.editData?.document_type === "driving-license" && modalState.editData?.has_document && !hasUploadedNewDocument) {
      const isLicenseChanged = field === "license_number" &&
        value !== originalLicenseInfo.license_number
      const isIssueNumberChanged = field === "license_issue_number" &&
        value !== originalLicenseInfo.license_issue_number
    
      if ((isLicenseChanged || isIssueNumberChanged) && !uploadRequired) {
        setUploadRequired(true)
      
        if (!documentDependencies.pendingSync) {
          checkAndShowSyncDialog();
        }
      }
    }
  }, [modalState.editData, originalLicenseInfo, uploadRequired, hasUploadedNewDocument, documentDependencies, checkAndShowSyncDialog]);
  
  const handleFileUpload = useCallback(
    (url: string, isBackSide: boolean) => {
      const updatedUrls = [...(modalState.editData.urls || [])]
      if (isBackSide) {
        if (updatedUrls.length > 1) {
          updatedUrls[1] = url
        } else if (updatedUrls.length === 1) {
          updatedUrls.push(url)
        } else {
          updatedUrls.push("", url)
        }
      } else {
        if (updatedUrls.length > 0) {
          updatedUrls[0] = url
        } else {
          updatedUrls[0] = url
        }
      }
    
      setHasUploadedNewDocument(true)
      setUploadRequired(false)
    
      dispatchModal({
        type: 'SET_EDIT_DATA',
        payload: {
          ...modalState.editData,
          urls: updatedUrls,
          has_document: true,
        }
      });
     
      showToast("Document uploaded successfully", "success")
    },
    [modalState.editData, showToast],
  );
  
  const handleModuleChange = useCallback((index: number, field: string, value: string) => {
    dispatchModal({
      type: 'SET_EDIT_DATA',
      payload: {
        ...modalState.editData,
        modules: modalState.editData.modules.map((m: any, i: number) =>
          i === index ? { ...m, [field]: value } : m
        ),
      }
    });
  }, [modalState.editData]);
  
  const addModule = useCallback(() => {
    dispatchModal({
      type: 'SET_EDIT_DATA',
      payload: {
        ...modalState.editData,
        modules: [...modalState.editData.modules, {
          id: null,
          module_name: "",
          description: "",
          expiry_date: ""
        }],
      }
    });
  }, [modalState.editData]);
  
  const deleteModule = useCallback((index: number) => {
    dispatchModal({
      type: 'SET_EDIT_DATA',
      payload: {
        ...modalState.editData,
        modules: modalState.editData.modules.filter((_: any, i: number) => i !== index),
      }
    });
  }, [modalState.editData]);
  
  const handleNextFiveModulesChange = useCallback((index: number, value: string) => {
    dispatchModal({
      type: 'SET_EDIT_DATA',
      payload: {
        ...modalState.editData,
        next_five_modules: modalState.editData.next_five_modules.map((m: string, i: number) =>
          i === index ? value : m
        ),
      }
    });
  }, [modalState.editData]);
  
  const updateRelatedDocument = useCallback(async () => {
    if (!modalState.editData || !documentDependencies.otherDocument) return;
   
    try {
      const updatePayload: any = {
        request_status: "pending",
        status_reason: "waiting_upload",
        status_description: `Requires updated documents after ${modalState.editData.document_type === "driving-license" ? "Driving License" : "D/D1 Category"} changes`,
        custom_reason: "",
      };
     
      if (modalState.editData.expiry_date && modalState.editData.expiry_date !== originalExpiryDate) {
        updatePayload.expiry_date = modalState.editData.expiry_date;
      }
     
      const updateResponse = await fetch(
        `${API_URL}/api/profiles/professional-competency/${documentDependencies.otherDocument.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify(updatePayload),
        }
      );
     
      if (updateResponse.ok) {
        showToast(
          `${modalState.editData.document_type === "driving-license" ? "D/D1 Category" : "Driving License"} marked for update`,
          "success"
        );
        fetchCompetencyData();
      }
    } catch (error) {
      console.error("Error updating related document:", error);
      showToast("Failed to update related document", "error");
    }
  }, [modalState.editData, documentDependencies, API_URL, cookies, showToast, fetchCompetencyData, originalExpiryDate]);
  
  const saveChanges = useCallback(async () => {
    if (!modalState.editData) return;
   
    dispatchModal({ type: 'SET_SAVING', payload: true });
   
    try {
      if (modalState.editData.document_type === "driving-license" && driverId) {
        const hasLicenseChanged = driverLicenseInfo.license_number !== originalLicenseInfo.license_number
        const hasIssueNumberChanged = driverLicenseInfo.license_issue_number !== originalLicenseInfo.license_issue_number
      
        if (hasLicenseChanged || hasIssueNumberChanged) {
          const driverPayload = {
            license_number: driverLicenseInfo.license_number,
            license_issue_number: driverLicenseInfo.license_issue_number,
          }
         
          const driverResponse = await fetch(`${API_URL}/api/profiles/driver/${driverId}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify(driverPayload),
          })
         
          if (!driverResponse.ok) {
            const driverError = await driverResponse.json()
            throw new Error(driverError.message || `Failed to save license info: ${driverResponse.statusText}`)
          }
         
          setOriginalLicenseInfo({
            license_number: driverLicenseInfo.license_number,
            license_issue_number: driverLicenseInfo.license_issue_number,
          })
        
          fetchDriverData()
        }
      }
     
      const modulesData = modalState.editData.modules.map((m: any) => ({
        ...(m.id ? { id: m.id } : {}),
        module_name: m.module_name,
        description: m.description,
        expiry_date: m.expiry_date || null,
      }))
     
      const filteredNextFiveModules = modalState.editData.next_five_modules
        .filter((m: string) => m && m.trim() !== "")
        .map((m: string, index: number) => ({
          module_name: m,
          module_number: index + 1
        }))
     
      const payload = {
        driver: driverId,
        document_name: modalState.editData.document_name,
        document_type: modalState.editData.document_type,
        has_expiry: modalState.editData.has_expiry || !!modalState.editData.expiry_date,
        description: modalState.editData.description || "",
        status_description: modalState.editData.status_description || "",
        status_reason: modalState.editData.status_reason || "",
        custom_reason: modalState.editData.custom_reason || "",
        expiry_date: modalState.editData.expiry_date || null,
        has_document: modalState.editData.has_document,
        has_back_side: modalState.editData.has_back_side,
        urls: modalState.editData.urls || [],
        request_status: modalState.editData.request_status || "pending",
        has_description: !!modalState.editData.description || !!modalState.editData.status_description,
        next_five_modules: filteredNextFiveModules,
        modules: modulesData,
      }
     
      const endpoint = modalState.editData.id
        ? `${API_URL}/api/profiles/professional-competency/${modalState.editData.id}/`
        : `${API_URL}/api/profiles/professional-competency/`
     
      const method = modalState.editData.id ? "PUT" : "POST"
     
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })
     
      const responseData = await response.json()
     
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to save: ${response.statusText}`)
      }
     
      if (responseData.success || response.status === 200 || response.status === 201) {
        showToast("Professional competency saved successfully", "success")
        dispatchModal({ type: 'RESET_MODAL' });
        setUploadRequired(false)
        setHasUploadedNewDocument(false)
        setDocumentDependencies({
          drivingLicenseChanged: false,
          dd1CategoryChanged: false,
          pendingSync: false,
          otherDocument: null,
        });
        fetchCompetencyData()
      } else {
        throw new Error(responseData.message || "Failed to save")
      }
    } catch (error) {
      console.error("Error saving competency:", error)
      showToast(error instanceof Error ? error.message : "Failed to save", "error")
    } finally {
      dispatchModal({ type: 'SET_SAVING', payload: false });
    }
  }, [modalState.editData, driverId, driverLicenseInfo, originalLicenseInfo, API_URL, cookies, showToast, fetchCompetencyData, fetchDriverData]);
  
  const handleSave = useCallback(async () => {
    if (!modalState.editData) return;
   
    if (hasUploadedNewDocument) {
      await saveChanges();
      return;
    }
   
    const isExpiryDateChanged = modalState.editData.expiry_date !== originalExpiryDate;
    const isLicenseNumberChanged = driverLicenseInfo.license_number !== originalLicenseInfo.license_number;
    const isIssueNumberChanged = driverLicenseInfo.license_issue_number !== originalLicenseInfo.license_issue_number;
  
    const isDrivingLicense = modalState.editData.document_type === "driving-license";
    const hasCriticalChanges = isExpiryDateChanged ||
      (isDrivingLicense && (isLicenseNumberChanged || isIssueNumberChanged));
  
    if (hasCriticalChanges && modalState.editData.has_document) {
      dispatchModal({
        type: 'SET_FORM_ERROR',
        payload: { field: 'expiry_date', value: "Please upload updated documents or set a reminder" }
      });
    
      if (isDrivingLicense && (isLicenseNumberChanged || isIssueNumberChanged)) {
        showToast("Please upload updated documents when changing license information", "error");
      } else {
        showToast("Please upload updated documents or set a reminder before saving", "error");
      }
      return;
    }
   
    if (modalState.isEditing && (modalState.editData.request_status === "not_approved" || modalState.editData.request_status === "pending")) {
      const hasStatusDescription =
        modalState.editData.status_description?.trim() ||
        (modalState.editData.status_reason === "other" && modalState.editData.custom_reason?.trim())
    
      if (!hasStatusDescription) {
        dispatchModal({
          type: 'SET_FORM_ERROR',
          payload: { field: 'status_description', value: "Please provide a reason for this status" }
        });
        showToast("Please provide a status description or reason", "error");
        return;
      }
    }
   
    await saveChanges();
  }, [modalState.editData, modalState.isEditing, originalExpiryDate, driverLicenseInfo, originalLicenseInfo, saveChanges, showToast, hasUploadedNewDocument]);
  
  const openReminderDialog = useCallback(() => {
    const title = modalState.editData?.document_type === "driving-license"
      ? "Upload updated Driving License documents"
      : `Upload documents for ${modalState.editData?.document_name}`
  
    const description = modalState.editData?.document_type === "driving-license"
      ? `License information has been updated. Please upload updated Driving License documents with new license number: ${driverLicenseInfo.license_number} and issue number: ${driverLicenseInfo.license_issue_number}`
      : `Upload updated documents for ${modalState.editData?.document_name} with new expiry date: ${modalState.editData?.expiry_date}`
  
    setReminderData({
      title,
      description,
      priority: "high",
      start_date: new Date().toISOString().split('T')[0],
      recurrence: "once",
      recurrence_interval: 1,
    })
    setIsReminderDialogOpen(true)
  }, [modalState.editData, driverLicenseInfo]);
  
  const handleDirectStatusUpdate = useCallback(async () => {
    if (!modalState.editData || !modalState.statusUpdateData.request_status) return
  
    dispatchModal({ type: 'SET_SAVING', payload: true });
   
    try {
      const payload = {
        ...modalState.editData,
        request_status: modalState.statusUpdateData.request_status,
        status_reason: modalState.statusUpdateData.status_reason,
        status_description: modalState.statusUpdateData.status_description || "",
        custom_reason: modalState.statusUpdateData.custom_reason || "",
      }
     
      const response = await fetch(`${API_URL}/api/profiles/professional-competency/${modalState.editData.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })
     
      const responseData = await response.json()
     
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update status: ${response.statusText}`)
      }
     
      if (responseData.success || response.status === 200) {
        showToast("Status updated successfully", "success")
        dispatchModal({ type: 'SET_DIRECT_STATUS_EDITING', payload: false });
        dispatchModal({
          type: 'SET_STATUS_UPDATE_DATA',
          payload: {
            request_status: "",
            status_reason: "",
            status_description: "",
            custom_reason: "",
          }
        });
        fetchCompetencyData()
      
        dispatchModal({
          type: 'SET_EDIT_DATA',
          payload: payload
        });
      } else {
        throw new Error(responseData.message || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      showToast(error instanceof Error ? error.message : "Failed to update status", "error")
    } finally {
      dispatchModal({ type: 'SET_SAVING', payload: false });
    }
  }, [modalState.editData, modalState.statusUpdateData, API_URL, cookies, showToast, fetchCompetencyData]);
  
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-200"
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "not_approved":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }, []);
  
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "not_approved":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }, []);
  
  const openPdfModal = useCallback((url: string) => {
    setSelectedPdfUrl(url)
    setIsPdfModalOpen(true)
  }, []);
  
  // Helper function for reminder dialog
  const handleRemindMeLater = useCallback(async () => {
    // Implementation for creating reminder
    setIsReminderDialogOpen(false);
    await saveChanges();
  }, [saveChanges]);
  
  // Memoize the documents list
  const allDocuments = useMemo(() => getCompletedDocumentsList(), [getCompletedDocumentsList])
  
  // Memoize competency cards with combined dialog integration
  const competencyCards = useMemo(() =>
    allDocuments.map((competency: any) => {
      const cardImageIndex = cardImageIndexes[competency.id || 0] || 0;
      
      return (
        <EnhancedCompetencyCard
          key={competency.id || competency.document_type}
          competency={competency}
          cardImageIndex={cardImageIndex}
          setCardImageIndexes={setCardImageIndexes}
          handleCardClick={handleCardClick} // This now handles both single and combined clicks
          isPdfUrl={isPdfUrl}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          license_number={licenseNumber}
          license_issue_number={licenseIssueNumber}
          onOpenCombinedDialog={
            (competency.document_type === "driving-license" || 
             competency.document_type === "d-d1-category") 
              ? () => handleOpenCombinedDialog(competency)
              : undefined
          }
        />
      );
    }),
    [allDocuments, cardImageIndexes, handleCardClick, handleOpenCombinedDialog, 
     isPdfUrl, formatDate, getStatusColor, getStatusIcon, licenseNumber, licenseIssueNumber]
  );

  // Check if we have license data to show the combined button
  const hasLicenseData = useMemo(() => {
    return competencyData.some((d: any) => 
      d.document_type === "driving-license" || d.document_type === "d-d1-category"
    );
  }, [competencyData]);

  return (
    <div className="space-y-6">
   

      {/* Professional Competency Documents Card */}
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
            <Badge variant="outline" className="px-4 py-2 text-orange-700 border-orange-300">
              Total Documents: {allDocuments.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {competencyCards}
          </div>
        </CardContent>
      </Card>
     
      {/* Combined License Dialog */}
      <CombinedLicenseDialog
        isOpen={isCombinedDialogOpen}
        onOpenChange={setIsCombinedDialogOpen}
        driverLicenseData={combinedLicenseData.driverLicenseData}
        dd1CategoryData={combinedLicenseData.dd1CategoryData}
        driverId={driverId}
        showToast={showToast}
        cookies={cookies}
        API_URL={API_URL}
        formatDate={formatDate}
        isPdfUrl={isPdfUrl}
        fetchCompetencyData={fetchCompetencyData}
        driverName={driverName}
        licenseNumber={licenseNumber}
        licenseIssueNumber={licenseIssueNumber}
        fetchDriverData={fetchDriverData}
      />

      {/* Enhanced Detail Modal - Optimized Dialog */}
      <Dialog open={modalState.isModalOpen} onOpenChange={(open) => {
        if (!open) {
          dispatchModal({ type: 'RESET_MODAL' });
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50/30">
          <DialogHeader className="border-b border-orange-200 pb-4 bg-white/80 backdrop-blur sticky top-0 z-50 -mx-6 px-6 -mt-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-600 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl text-orange-900 font-bold">
                    {modalState.editData?.document_name}
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">
                    {modalState.editData?.document_type?.replace("-", " ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {modalState.isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={modalState.saving}
                      className="bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      {modalState.saving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-5 w-5 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => dispatchModal({ type: 'SET_EDITING', payload: false })}
                      disabled={modalState.saving}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => dispatchModal({ type: 'SET_EDITING', payload: true })}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      {modalState.editData?.has_document ? "Edit Document" : "Add Document"}
                    </Button>
                    {modalState.editData?.has_document && (
                      <Button
                        onClick={() => {
                          dispatchModal({ type: 'SET_DIRECT_STATUS_EDITING', payload: !modalState.directStatusEditing });
                          dispatchModal({
                            type: 'SET_STATUS_UPDATE_DATA',
                            payload: {
                              request_status: modalState.editData.request_status || "pending",
                              status_reason: modalState.editData.status_reason || "",
                              status_description: modalState.editData.status_description || "",
                              custom_reason: modalState.editData.custom_reason || "",
                            }
                          });
                        }}
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      >
                        {modalState.directStatusEditing ? (
                          <>
                            <XCircle className="h-5 w-5 mr-2" />
                            Cancel Status Update
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Update Status
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
          {modalState.editData && (
            <div className="space-y-6 mt-6">
              {/* Direct Status Update Section */}
              {!modalState.isEditing && modalState.directStatusEditing && modalState.editData.has_document && (
                <Card className="border-2 border-indigo-300 shadow-lg bg-gradient-to-br from-indigo-50 to-white">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Quick Status Update
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">New Status</Label>
                        <Select
                          value={modalState.statusUpdateData.request_status}
                          onValueChange={(value) => {
                            dispatchModal({
                              type: 'SET_STATUS_UPDATE_DATA',
                              payload: {
                                request_status: value,
                                status_description: "",
                                status_reason: "",
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="border-indigo-300 focus:ring-2 focus:ring-indigo-500">
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
                      </div>
                    
                      {(modalState.statusUpdateData.request_status === "pending" || modalState.statusUpdateData.request_status === "not_approved") && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Reason for {modalState.statusUpdateData.request_status === "pending" ? "Pending" : "Rejection"}
                          </Label>
                          <Select
                            value={modalState.statusUpdateData.status_reason || ""}
                            onValueChange={(value) => {
                              const selectedReason = STATUS_REASONS[modalState.statusUpdateData.request_status as keyof typeof STATUS_REASONS]
                                ?.find(r => r.value === value)
                              dispatchModal({
                                type: 'SET_STATUS_UPDATE_DATA',
                                payload: {
                                  status_reason: value,
                                  status_description: selectedReason?.label || "",
                                  custom_reason: value === "other" ? modalState.statusUpdateData.custom_reason : "",
                                }
                              });
                            }}
                          >
                            <SelectTrigger className="border-indigo-300 focus:ring-2 focus:ring-indigo-500">
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {(STATUS_REASONS[modalState.statusUpdateData.request_status as keyof typeof STATUS_REASONS] || []).map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    
                      {(modalState.statusUpdateData.request_status === "pending" || modalState.statusUpdateData.request_status === "not_approved") && (
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Status Description</Label>
                          <Textarea
                            value={modalState.statusUpdateData.status_description || ""}
                            onChange={(e) => dispatchModal({
                              type: 'SET_STATUS_UPDATE_DATA',
                              payload: { status_description: e.target.value }
                            })}
                            className="border-indigo-300 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            placeholder={
                              modalState.statusUpdateData.request_status === "not_approved"
                                ? "Explain why this document was not approved..."
                                : "Provide details about why this document is pending..."
                            }
                          />
                        </div>
                      )}
                    
                      {modalState.statusUpdateData.status_reason === "other" && (
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Custom Reason</Label>
                          <Input
                            value={modalState.statusUpdateData.custom_reason || ""}
                            onChange={(e) => dispatchModal({
                              type: 'SET_STATUS_UPDATE_DATA',
                              payload: { custom_reason: e.target.value }
                            })}
                            className="border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Please specify the reason..."
                          />
                        </div>
                      )}
                    </div>
                  
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleDirectStatusUpdate}
                        disabled={modalState.saving || !modalState.statusUpdateData.request_status}
                        className="bg-gradient-to-r from-indigo-600 to-green-600 hover:from-indigo-700 hover:to-green-700 text-white"
                      >
                        {modalState.saving ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Check className="h-5 w-5 mr-2" />
                        )}
                        Update Status
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => dispatchModal({ type: 'SET_DIRECT_STATUS_EDITING', payload: false })}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    {modalState.isEditing ? (
                      <Input
                        value={modalState.editData.document_name}
                        onChange={(e) => handleInputChange("document_name", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="font-semibold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                        {modalState.editData.document_name}
                      </p>
                    )}
                  </div>
                
                  {(modalState.editData.has_expiry || (modalState.isEditing && modalState.editData.expiry_date)) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expiry Date
                        {(modalState.editData.expiry_date !== originalExpiryDate) && !hasUploadedNewDocument && (
                          <span className="text-red-600 text-xs ml-2">(Requires document update)</span>
                        )}
                        {hasUploadedNewDocument && (
                          <span className="text-green-600 text-xs ml-2">✓ Document updated</span>
                        )}
                      </Label>
                      {modalState.isEditing ? (
                        <div className="space-y-2">
                          <Input
                            type="date"
                            value={modalState.editData.expiry_date || ""}
                            onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                            className={`border-orange-300 focus:ring-2 focus:ring-orange-500 ${modalState.formErrors.expiry_date ? 'border-red-500' : ''}`}
                          />
                          {modalState.formErrors.expiry_date && (
                            <p className="text-sm text-red-600">{modalState.formErrors.expiry_date}</p>
                          )}
                          {modalState.editData.expiry_date !== originalExpiryDate && modalState.editData.has_document && !hasUploadedNewDocument && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-orange-900">
                                    Document Update Required
                                  </p>
                                  <p className="text-xs text-orange-700 mt-1">
                                    Changing the expiry date requires uploading updated documents.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="font-semibold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                          {modalState.editData.expiry_date ? formatDate(modalState.editData.expiry_date) : "No expiry date set"}
                        </p>
                      )}
                    </div>
                  )}
                
                  {modalState.editData.document_type === "driving-license" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          License Number
                          {(driverLicenseInfo.license_number !== originalLicenseInfo.license_number) && !hasUploadedNewDocument && (
                            <span className="text-red-600 text-xs ml-2">(Requires document update)</span>
                          )}
                          {hasUploadedNewDocument && (
                            <span className="text-green-600 text-xs ml-2">✓ Document updated</span>
                          )}
                        </Label>
                        {modalState.isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={driverLicenseInfo.license_number}
                              onChange={(e) => handleLicenseInfoChange("license_number", e.target.value)}
                              className={`border-green-300 focus:ring-2 focus:ring-green-500 ${modalState.formErrors.license_number ? 'border-red-500' : ''}`}
                              placeholder="Enter license number..."
                            />
                            {modalState.formErrors.license_number && (
                              <p className="text-sm text-red-600">{modalState.formErrors.license_number}</p>
                            )}
                            {driverLicenseInfo.license_number !== originalLicenseInfo.license_number && modalState.editData.has_document && !hasUploadedNewDocument && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-1">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-orange-700">
                                    Changing license number requires uploading updated documents.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="font-semibold text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {driverLicenseInfo.license_number || "Not provided"}
                          </p>
                        )}
                      </div>
                    
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Issue Number
                          {(driverLicenseInfo.license_issue_number !== originalLicenseInfo.license_issue_number) && !hasUploadedNewDocument && (
                            <span className="text-red-600 text-xs ml-2">(Requires document update)</span>
                          )}
                          {hasUploadedNewDocument && (
                            <span className="text-green-600 text-xs ml-2">✓ Document updated</span>
                          )}
                        </Label>
                        {modalState.isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={driverLicenseInfo.license_issue_number}
                              onChange={(e) => handleLicenseInfoChange("license_issue_number", e.target.value)}
                              className="border-blue-300 focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter issue number..."
                            />
                            {driverLicenseInfo.license_issue_number !== originalLicenseInfo.license_issue_number && modalState.editData.has_document && !hasUploadedNewDocument && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-1">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-orange-700">
                                    Changing issue number requires uploading updated documents.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="font-semibold text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {driverLicenseInfo.license_issue_number || "Not provided"}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    {modalState.isEditing ? (
                      <div className="space-y-3">
                        <Select
                          value={modalState.editData.request_status || "pending"}
                          onValueChange={(value) => {
                            handleInputChange("request_status", value)
                            dispatchModal({
                              type: 'SET_SHOW_STATUS_DESCRIPTION',
                              payload: value === "not_approved" || value === "pending"
                            });
                          }}
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
                      
                        {(modalState.editData.request_status === "pending" || modalState.editData.request_status === "not_approved") && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              Reason for {modalState.editData.request_status === "pending" ? "Pending" : "Rejection"}
                            </Label>
                            <Select
                              value={modalState.editData.status_reason || ""}
                              onValueChange={(value) => {
                                handleInputChange("status_reason", value)
                                if (value !== "other") {
                                  handleInputChange("custom_reason", "")
                                }
                              }}
                            >
                              <SelectTrigger className="border-orange-300 focus:ring-2 focus:ring-orange-500">
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {(STATUS_REASONS[modalState.editData.request_status as keyof typeof STATUS_REASONS] || []).map((reason) => (
                                  <SelectItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          
                            {modalState.editData.status_reason === "other" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">
                                  Custom Reason
                                </Label>
                                <Input
                                  value={modalState.editData.custom_reason || ""}
                                  onChange={(e) => handleInputChange("custom_reason", e.target.value)}
                                  className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                                  placeholder="Please specify the reason..."
                                />
                                {modalState.formErrors.custom_reason && (
                                  <p className="text-sm text-red-600">{modalState.formErrors.custom_reason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge
                          className={cn("px-4 py-2 text-sm font-semibold border w-fit inline-flex items-center gap-2", getStatusColor(modalState.editData.request_status || "pending"))}
                        >
                          {getStatusIcon(modalState.editData.request_status || "pending")}
                          {(modalState.editData.request_status || "pending").replace("_", " ").toUpperCase()}
                        </Badge>
                        {modalState.editData.status_reason && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            Reason: {modalState.editData.status_reason === "other"
                              ? modalState.editData.custom_reason || "Other"
                              : STATUS_REASONS[modalState.editData.request_status as keyof typeof STATUS_REASONS]?.find(r => r.value === modalState.editData.status_reason)?.label || modalState.editData.status_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                
                  {!modalState.editData.has_expiry && modalState.isEditing && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Add Expiry Date (Optional)
                      </Label>
                      <Input
                        type="date"
                        value={modalState.editData.expiry_date || ""}
                        onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                        placeholder="Set an expiry date"
                      />
                      {modalState.editData.expiry_date && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Expiry date will be saved
                        </p>
                      )}
                    </div>
                  )}
                
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Description</Label>
                    {modalState.isEditing ? (
                      <Textarea
                        value={modalState.editData.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                        placeholder="Enter document description..."
                      />
                    ) : (
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                        {modalState.editData.description || "No description provided"}
                      </p>
                    )}
                  </div>
                
                  {(modalState.showStatusDescription || modalState.editData.status_description) && (
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        {modalState.editData.request_status === "not_approved" ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Info className="h-4 w-4 text-orange-600" />
                        )}
                        Status Description
                        <span className="text-xs text-red-600">*Required</span>
                      </Label>
                      {modalState.isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={modalState.editData.status_description || ""}
                            onChange={(e) => handleInputChange("status_description", e.target.value)}
                            className={`border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[80px] ${modalState.formErrors.status_description ? 'border-red-500' : ''}`}
                            placeholder={
                              modalState.editData.request_status === "not_approved"
                                ? "Explain why this document was not approved..."
                                : "Provide details about why this document is pending..."
                            }
                          />
                          {modalState.formErrors.status_description && (
                            <p className="text-sm text-red-600">{modalState.formErrors.status_description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            This information will be visible to users and helps them understand what needs to be fixed.
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg border ${
                          modalState.editData.request_status === "not_approved"
                            ? 'bg-red-50 border-red-200'
                            : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            {modalState.editData.request_status === "not_approved" ? (
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-gray-700 leading-relaxed">
                                {modalState.editData.status_description || "No status description provided"}
                              </p>
                              {modalState.editData.status_reason && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Reason: {STATUS_REASONS[modalState.editData.request_status as keyof typeof STATUS_REASONS]?.find(r => r.value === modalState.editData.status_reason)?.label}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Documents Section */}
              {(modalState.editData.has_document || modalState.isEditing) && (
                <Card className="border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-orange-50 border-b border-indigo-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Attached Documents
                        {modalState.editData.urls?.length > 1 && (
                          <span className="text-sm text-indigo-600 ml-2">
                            ({modalState.currentImageIndex + 1}/{modalState.editData.urls.length})
                          </span>
                        )}
                      </CardTitle>
                      {modalState.editData.urls?.length > 1 && !modalState.isEditing && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatchModal({
                              type: 'SET_CURRENT_IMAGE_INDEX',
                              payload: modalState.currentImageIndex === 0 ? modalState.editData.urls.length - 1 : modalState.currentImageIndex - 1
                            })}
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatchModal({
                              type: 'SET_CURRENT_IMAGE_INDEX',
                              payload: modalState.currentImageIndex === modalState.editData.urls.length - 1 ? 0 : modalState.currentImageIndex + 1
                            })}
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {(uploadRequired || (modalState.editData.document_type === "driving-license" &&
                      (driverLicenseInfo.license_number !== originalLicenseInfo.license_number ||
                       driverLicenseInfo.license_issue_number !== originalLicenseInfo.license_issue_number))) &&
                      modalState.isEditing && !hasUploadedNewDocument && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900">
                              {modalState.editData.document_type === "driving-license" ?
                                "⚠️ Document Update Required - License Information Changed" :
                                "⚠️ Document Update Required"
                              }
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              {modalState.editData.document_type === "driving-license" ?
                                "You have changed license information. You must upload updated documents before saving changes." :
                                "You have changed the expiry date. You must upload updated documents before saving changes."
                              }
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openReminderDialog}
                                className="border-orange-300 text-orange-700 hover:bg-orange-100 whitespace-nowrap"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Remind Later
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => document.getElementById(`file-upload-front-${modalState.editData.id}`)?.click()}
                                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Upload Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {hasUploadedNewDocument && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900">
                              ✓ Document Updated Successfully
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              You have uploaded updated documents. You can now save your changes.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {modalState.isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Front Side Document
                            {(uploadRequired && !hasUploadedNewDocument) &&
                              <span className="text-red-600 text-xs">(Required)</span>
                            }
                            {hasUploadedNewDocument && (
                              <span className="text-green-600 text-xs ml-2">✓ Uploaded</span>
                            )}
                          </Label>
                          <div className={cn(
                            "border-2 border-dashed rounded-lg p-4 transition-colors",
                            (uploadRequired && !hasUploadedNewDocument)
                              ? "border-red-400 bg-red-50/50 hover:border-red-600"
                              : hasUploadedNewDocument
                              ? "border-green-400 bg-green-50/50 hover:border-green-600"
                              : "border-orange-300 bg-orange-50/50 hover:border-orange-500"
                          )}>
                            <FileUploaderLazy
                              onUploadSuccess={(url) => handleFileUpload(url, false)}
                              accept="image/*,application/pdf"
                              maxSize={5 * 1024 * 1024}
                              id={`file-upload-front-${modalState.editData.id}`}
                            />
                          </div>
                          {modalState.editData.urls?.[0] && (
                            <div className={cn(
                              "border rounded-lg p-3",
                              hasUploadedNewDocument
                                ? "bg-green-50 border-green-200"
                                : "bg-green-50 border-green-200"
                            )}>
                              <p className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle className={cn(
                                  "h-4 w-4",
                                  hasUploadedNewDocument ? "text-green-600" : "text-green-600"
                                )} />
                                Current: {modalState.editData.urls[0].split("/").pop()}
                                {hasUploadedNewDocument && (
                                  <span className="text-green-700 text-xs ml-auto">(Updated)</span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      
                        {(modalState.editData.has_back_side || modalState.isEditing) && (
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Back Side Document
                              {(uploadRequired && modalState.editData.has_back_side && !hasUploadedNewDocument) &&
                                <span className="text-red-600 text-xs">(Required)</span>
                              }
                              {hasUploadedNewDocument && (
                                <span className="text-green-600 text-xs ml-2">✓ Uploaded</span>
                              )}
                            </Label>
                            <div className={cn(
                              "border-2 border-dashed rounded-lg p-4 transition-colors",
                              (uploadRequired && modalState.editData.has_back_side && !hasUploadedNewDocument)
                                ? "border-red-400 bg-red-50/50 hover:border-red-600"
                                : hasUploadedNewDocument
                                ? "border-green-400 bg-green-50/50 hover:border-green-600"
                                : "border-indigo-300 bg-indigo-50/50 hover:border-indigo-500"
                            )}>
                              <FileUploaderLazy
                                onUploadSuccess={(url) => handleFileUpload(url, true)}
                                accept="image/*,application/pdf"
                                maxSize={5 * 1024 * 1024}
                                id={`file-upload-back-${modalState.editData.id}`}
                              />
                            </div>
                            {modalState.editData.urls?.[1] && (
                              <div className={cn(
                                "border rounded-lg p-3",
                                hasUploadedNewDocument
                                  ? "bg-green-50 border-green-200"
                                  : "bg-green-50 border-green-200"
                              )}>
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <CheckCircle className={cn(
                                    "h-4 w-4",
                                    hasUploadedNewDocument ? "text-green-600" : "text-green-600"
                                  )} />
                                  Current: {modalState.editData.urls[1].split("/").pop()}
                                  {hasUploadedNewDocument && (
                                    <span className="text-green-700 text-xs ml-auto">(Updated)</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : modalState.editData.urls?.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-indigo-200 min-h-[400px] flex items-center justify-center">
                          {isPdfUrl(modalState.editData.urls[modalState.currentImageIndex]) ? (
                            <div className="text-center p-8">
                              <FileText className="h-20 w-20 text-indigo-600 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-semibold text-gray-700">PDF Document</p>
                              <p className="text-sm text-gray-500 mt-2">Click the button below to view</p>
                              <Button
                                onClick={() => openPdfModal(modalState.editData.urls[modalState.currentImageIndex])}
                                className="mt-4 bg-gradient-to-r from-indigo-600 to-orange-600 hover:from-indigo-700 hover:to-orange-700 text-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open PDF
                              </Button>
                            </div>
                          ) : (
                            <>
                              <LazyImage
                                src={modalState.editData.urls[modalState.currentImageIndex]}
                                alt={`${modalState.editData.document_name} - ${modalState.currentImageIndex === 0 ? 'Front' : 'Back'} side`}
                                className="max-w-full max-h-[400px] object-contain p-4"
                              />
                              {modalState.editData.urls.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="pointer-events-auto bg-white/90 hover:bg-white shadow-lg"
                                    onClick={() => dispatchModal({
                                      type: 'SET_CURRENT_IMAGE_INDEX',
                                      payload: modalState.currentImageIndex === 0 ? modalState.editData.urls.length - 1 : modalState.currentImageIndex - 1
                                    })}
                                  >
                                    <ChevronLeft className="h-6 w-6" />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="pointer-events-auto bg-white/90 hover:bg-white shadow-lg"
                                    onClick={() => dispatchModal({
                                      type: 'SET_CURRENT_IMAGE_INDEX',
                                      payload: modalState.currentImageIndex === modalState.editData.urls.length - 1 ? 0 : modalState.currentImageIndex + 1
                                    })}
                                  >
                                    <ChevronRight className="h-6 w-6" />
                                  </Button>
                                </div>
                              )}
                              {modalState.editData.urls.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                  <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
                                    {modalState.editData.urls.map((_: any, index: number) => (
                                      <button
                                        key={index}
                                        onClick={() => dispatchModal({
                                          type: 'SET_CURRENT_IMAGE_INDEX',
                                          payload: index
                                        })}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                                          index === modalState.currentImageIndex
                                            ? 'bg-white'
                                            : 'bg-white/50 hover:bg-white/80'
                                        }`}
                                        aria-label={`View image ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {modalState.editData.urls.map((url: string, index: number) => (
                            url && (
                              <Button
                                key={index}
                                variant="outline"
                                onClick={() => {
                                  if (isPdfUrl(url)) {
                                    openPdfModal(url)
                                  } else {
                                    dispatchModal({
                                      type: 'SET_CURRENT_IMAGE_INDEX',
                                      payload: index
                                    });
                                  }
                                }}
                                className={`h-auto p-3 border-2 hover:border-indigo-400 hover:bg-indigo-50 justify-start group transition-all ${
                                  index === modalState.currentImageIndex
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-indigo-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`p-2 rounded-lg transition-colors ${
                                    index === modalState.currentImageIndex
                                      ? 'bg-indigo-100 group-hover:bg-indigo-200'
                                      : 'bg-gray-100 group-hover:bg-gray-200'
                                  }`}>
                                    {isPdfUrl(url) ? (
                                      <FileText className="h-5 w-5 text-indigo-600" />
                                    ) : (
                                      <ImageIcon className="h-5 w-5 text-indigo-600" />
                                    )}
                                  </div>
                                  <div className="text-left flex-1">
                                    <p className="font-semibold text-gray-900">
                                      {modalState.editData.has_back_side
                                        ? index === 0 ? "Front Side" : "Back Side"
                                        : `Document ${index + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {url.split("/").pop()}
                                    </p>
                                    {index === modalState.currentImageIndex && !isPdfUrl(url) && (
                                      <p className="text-xs text-indigo-600 font-medium mt-1">
                                        Currently viewing
                                      </p>
                                    )}
                                  </div>
                                  {isPdfUrl(url) && (
                                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                                  )}
                                </div>
                              </Button>
                            )
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No documents uploaded yet</p>
                      </div>
                    )}
                    {modalState.isEditing && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <input
                          type="checkbox"
                          checked={modalState.editData.has_back_side}
                          onChange={(e) => handleInputChange("has_back_side", e.target.checked)}
                        />
                        <label>This document has a back side</label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Modules Section - Enhanced */}
              {(modalState.editData.document_type === "cpc-card" || modalState.editData.modules.length > 0) && (
                <Card className="border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-indigo-600 text-white">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      Training Modules
                      <Badge className="ml-auto bg-white/20 text-white border-white/30 text-lg px-4 py-1">
                        {modalState.editData.modules.length} {modalState.editData.modules.length === 1 ? "Module" : "Modules"}
                      </Badge>
                      {modalState.isEditing && (
                        <Button onClick={addModule} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Module
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {modalState.editData.modules.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No modules added yet</p>
                        {modalState.isEditing && (
                          <Button onClick={addModule} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Module
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {modalState.editData.modules.map((module: any, index: number) => (
                          <Card
                            key={module.id || index}
                            className="border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-xl bg-gradient-to-br from-white to-orange-50/30 overflow-hidden group"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-indigo-400/10 rounded-bl-full transform translate-x-8 -translate-y-8"></div>
                          
                            <CardHeader className="bg-white/80 backdrop-blur border-b border-orange-200 relative z-10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-600 to-indigo-600 text-white rounded-lg font-bold text-lg shadow-md">
                                    {index + 1}
                                  </div>
                                  <CardTitle className="text-lg text-orange-900">
                                    {module.module_name || `Module ${index + 1}`}
                                  </CardTitle>
                                </div>
                                {modalState.isEditing && (
                                  <Button
                                    onClick={() => deleteModule(index)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                          
                            <CardContent className="p-5 space-y-4 relative z-10">
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">Module Name</Label>
                                {modalState.isEditing ? (
                                  <Input
                                    value={module.module_name || ""}
                                    onChange={(e) => handleModuleChange(index, "module_name", e.target.value)}
                                    className="border-orange-300 focus:ring-2 focus:ring-orange-500 font-semibold"
                                    placeholder="Enter module name..."
                                  />
                                ) : (
                                  <p className="font-bold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                                    {module.module_name || "Unnamed Module"}
                                  </p>
                                )}
                              </div>
                            
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                                {modalState.isEditing ? (
                                  <Textarea
                                    value={module.description || ""}
                                    onChange={(e) => handleModuleChange(index, "description", e.target.value)}
                                    className="border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                                    placeholder="Enter module description..."
                                  />
                                ) : (
                                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed min-h-[80px]">
                                      {module.description || "No description"}
                                  </p>
                                )}
                              </div>
                            
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-orange-600" />
                                  Expiry Date
                                </Label>
                                {modalState.isEditing ? (
                                  <Input
                                    type="date"
                                    value={module.expiry_date || ""}
                                    onChange={(e) => handleModuleChange(index, "expiry_date", e.target.value)}
                                    className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
                                      <Calendar className="h-4 w-4 text-orange-600" />
                                      <p className="font-semibold text-orange-900">
                                        {module.expiry_date ? formatDate(module.expiry_date) : "No expiry date"}
                                      </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Next Five Modules (CPC Card) - Enhanced */}
              {modalState.editData.document_type === "cpc-card" && (
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
                        {modalState.isEditing ? "Editing" : "Upcoming Training"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 bg-gradient-to-br from-white to-indigo-50/30">
                    {modalState.isEditing && (
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
                      {modalState.editData.next_five_modules.map((module: string, index: number) => (
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
                              {modalState.isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={module || ""}
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
                  
                    {!modalState.isEditing && (
                      <div className="mt-6 p-4 bg-indigo-100 border border-indigo-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-indigo-700 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-indigo-900">
                              Upcoming CPC Training Schedule
                            </p>
                            <p className="text-xs text-indigo-700 mt-1">
                              These modules represent the next five training sessions required for CPC certification maintenance. Click "Edit Document" to update.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {modalState.isEditing && (
                      <div className="mt-6 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-orange-700 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-orange-900">
                              Save Your Changes
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              Don't forget to click "Save Changes" button at the top to save your module updates.
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
     
      {/* Document Synchronization Dialog - Automatically opens when changes are made */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Document Synchronization Required
            </DialogTitle>
          </DialogHeader>
        
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <p className="font-semibold text-orange-900">
                {modalState.editData?.document_type === "driving-license"
                  ? "You've updated the Driving License"
                  : "You've updated the D/D1 Category"}
              </p>
              <p className="text-sm text-orange-700 mt-2">
                When you change the {modalState.editData?.document_type === "driving-license" ? "Driving License" : "D/D1 Category"},
                the related document ({modalState.editData?.document_type === "driving-license" ? "D/D1 Category" : "Driving License"})
                also needs to be updated.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {modalState.editData?.document_type === "driving-license"
                    ? "D/D1 Category document will be marked for update"
                    : "Driving License document will be marked for update"}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  The related document will be updated with the same changes and marked as requiring new upload.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  syncAction === "update"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSyncAction("update")}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  syncAction === "update"
                    ? "border-green-600 bg-green-600"
                    : "border-gray-400"
                }`}>
                  {syncAction === "update" && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Yes, update both documents
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Synchronize changes between related documents
                  </p>
                </div>
              </div>
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  syncAction === "skip"
                    ? "border-gray-400 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSyncAction("skip")}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  syncAction === "skip"
                    ? "border-gray-600 bg-gray-600"
                    : "border-gray-400"
                }`}>
                  {syncAction === "skip" && (
                    <X className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    No, update only this document
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Update only the current document without synchronization
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSyncDialogOpen(false);
                setDocumentDependencies({
                  drivingLicenseChanged: false,
                  dd1CategoryChanged: false,
                  pendingSync: false,
                  otherDocument: null,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setIsSyncDialogOpen(false);
              
                if (syncAction === "update") {
                  await updateRelatedDocument();
                }
              
                await saveChanges();
              }}
              className="bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-700 hover:to-indigo-700"
            >
              {syncAction === "update" ? "Synchronize & Save" : "Save Only This Document"}
            </Button>
          </DialogFooter>
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
                    {modalState.editData?.document_type === "driving-license" ?
                      "You've changed the license information but haven't uploaded the updated documents yet." :
                      "You've changed the expiry date but haven't uploaded the updated documents yet."
                    }
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
              Your changes will be saved, and you'll receive a reminder to upload the documents later.
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
  )
}