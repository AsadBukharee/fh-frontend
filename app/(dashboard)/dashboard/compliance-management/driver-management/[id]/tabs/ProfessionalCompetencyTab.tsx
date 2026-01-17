/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useCallback, useEffect, useMemo, useRef, useReducer } from "react"
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
import { Tabs } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
import LazyImage from "./Dialog/LazyImage"
import EnhancedCompetencyModal from "./Dialog/EnhancedCompetencyModal"
import CombinedLicenseDialog from "./Dialog/CombinedDialog"



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

// Enhanced CompetencyCard with combined license option
const EnhancedCompetencyCard = ({
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
};

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
    if (!modalState.editData) return;
    
    const title = modalState.editData.document_type === "driving-license"
      ? "Upload updated Driving License documents"
      : `Upload documents for ${modalState.editData?.document_name}`
  
    const description = modalState.editData.document_type === "driving-license"
      ? `License information has been updated. Please upload updated Driving License documents with new license number: ${driverLicenseInfo.license_number} and issue number: ${driverLicenseInfo.license_issue_number}`
      : `Upload updated documents for ${modalState.editData.document_name} with new expiry date: ${modalState.editData.expiry_date}`
  
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
          handleCardClick={handleCardClick}
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
     
      {/* External Dialog Components */}
      
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

      {/* Enhanced Competency Modal */}
      <EnhancedCompetencyModal
        isOpen={modalState.isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            dispatchModal({ type: 'RESET_MODAL' });
          }
        }}
        modalState={modalState}
        dispatchModal={dispatchModal}
        driverId={driverId}
        showToast={showToast}
        cookies={cookies}
        API_URL={API_URL}
        formatDate={formatDate}
        isPdfUrl={isPdfUrl}
        fetchCompetencyData={fetchCompetencyData}
        driverLicenseInfo={driverLicenseInfo}
        originalLicenseInfo={originalLicenseInfo}
        driverLicenseData={competencyData.find((d: any) => d.document_type === "driving-license")}
        handleInputChange={handleInputChange}
        handleLicenseInfoChange={handleLicenseInfoChange}
        handleFileUpload={handleFileUpload}
        handleModuleChange={handleModuleChange}
        addModule={addModule}
        deleteModule={deleteModule}
        handleNextFiveModulesChange={handleNextFiveModulesChange}
        handleSave={handleSave}
        handleDirectStatusUpdate={handleDirectStatusUpdate}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        openPdfModal={openPdfModal}
        STATUS_REASONS={STATUS_REASONS}
        originalExpiryDate={originalExpiryDate || ""}
        hasUploadedNewDocument={hasUploadedNewDocument}
        uploadRequired={uploadRequired}
        openReminderDialog={openReminderDialog}
      />
     
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