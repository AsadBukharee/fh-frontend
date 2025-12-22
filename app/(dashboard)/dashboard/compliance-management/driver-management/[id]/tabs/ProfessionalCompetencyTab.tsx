/* eslint-disable react/no-unescaped-entities */
"use client"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import FileUploader from "@/components/Media/MediaUpload"

const DEFAULT_DOCUMENTS = [
  { id: 1, document_name: "Driving License", document_type: "driving-license", has_expiry: true },
  { id: 2, document_name: "D / D1 Category", document_type: "d-d1-category", has_expiry: true },
  { id: 3, document_name: "CPC Card", document_type: "cpc-card", has_expiry: true },
  { id: 4, document_name: "Tacho Card", document_type: "tacho-card", has_expiry: false },
  { id: 5, document_name: "Passport", document_type: "passport", has_expiry: false },
  { id: 6, document_name: "Proof of Address", document_type: "proof-of-address", has_expiry: false },
]

// Status reasons configuration
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
}

export default function ProfessionalCompetencyTab({
  competencyData,
  formatDate,
  isPdfUrl,
  driverId,
  showToast,
  cookies,
  API_URL,
  fetchCompetencyData,
}: ProfessionalCompetencyTabProps) {
  const [selectedCompetency, setSelectedCompetency] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showStatusDescription, setShowStatusDescription] = useState(false)

  const getCompletedDocumentsList = () => {
    const uploadedMap = new Map(competencyData.map((d) => [d.document_type, d]))
    return DEFAULT_DOCUMENTS.map(
      (doc) =>
        uploadedMap.get(doc.document_type) || {
          ...doc,
          id: null,
          has_document: false,
          urls: [],
          modules: [],
          next_five_modules: [],
          request_status: "pending",
          description: "",
          status_description: "",
          status_reason: "",
          expiry_date: null,
          has_back_side: false,
          has_description: false,
          driver: null,
          created_at: null,
          updated_at: null,
        },
    )
  }

  const handleCardClick = (competency: any) => {
    setSelectedCompetency(competency)
    
    // Ensure modules are properly set from API data
    const modules = competency.modules || []
    const nextFiveModules = competency.next_five_modules || []
    
    // If next_five_modules is an array of strings, use it directly
    // If it's an array of objects (from API), extract module_name
    const normalizedNextFiveModules = nextFiveModules.map((item: any) => 
      typeof item === 'string' ? item : (item.module_name || "")
    ).slice(0, 5)
    
    // Fill remaining slots with empty strings if needed
    while (normalizedNextFiveModules.length < 5) {
      normalizedNextFiveModules.push("")
    }

    setEditData({
      ...competency,
      modules: modules,
      next_five_modules: normalizedNextFiveModules,
      status_description: competency.status_description || "",
      status_reason: competency.status_reason || "",
    })
    setOriginalExpiryDate(competency.expiry_date)
    setUploadRequired(false)
    setFormErrors({})
    setCurrentImageIndex(0)
    setShowStatusDescription(false)
    setIsModalOpen(true)
    setIsEditing(false)
  }

  const handleInputChange = useCallback((field: string, value: any) => {
    setEditData((prev: any) => {
      if (!prev) return prev;
      
      // If expiry date is being changed, check if documents need to be uploaded
      if (field === "expiry_date" && value !== originalExpiryDate && prev.has_document) {
        setUploadRequired(true)
      }
      
      // If status is being changed, show status description field for not_approved or pending
      if (field === "request_status") {
        setShowStatusDescription(value === "not_approved" || value === "pending")
      }
      
      // If status reason is selected, auto-fill description
      if (field === "status_reason" && value) {
        const statusReasons = STATUS_REASONS[(prev?.request_status as keyof typeof STATUS_REASONS) || "pending"]
        const selectedReason = statusReasons?.find(reason => reason.value === value)
        if (selectedReason && !prev.status_description) {
          return {
            ...prev,
            [field]: value,
            status_description: selectedReason.label,
          }
        }
      }
      
      // If expiry date is being added for the first time
      if (field === "expiry_date" && value) {
        return {
          ...prev,
          [field]: value,
          has_expiry: true,
        }
      }
      
      return {
        ...prev,
        [field]: value,
      }
    })
    setFormErrors((prev) => ({ ...prev, [field]: "" }))
  }, [originalExpiryDate])

  const handleFileUpload = useCallback(
    (url: string, isBackSide: boolean) => {
      setEditData((prev: any) => {
        if (!prev) return prev;
        
        const updatedUrls = [...(prev.urls || [])]
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
        
        // Reset upload required flag when documents are uploaded
        const hasAllRequiredDocs = prev.has_back_side 
          ? updatedUrls[0] && updatedUrls[1]
          : updatedUrls[0]
        
        if (hasAllRequiredDocs && uploadRequired) {
          setUploadRequired(false)
        }
        
        return {
          ...prev,
          urls: updatedUrls,
          has_document: true,
        }
      })
      showToast("Document uploaded successfully", "success")
    },
    [showToast, uploadRequired],
  )

  const handleModuleChange = (index: number, field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any, i: number) => 
        i === index ? { ...m, [field]: value } : m
      ),
    }))
  }

  const addModule = () => {
    setEditData((prev: any) => ({
      ...prev,
      modules: [...prev.modules, { 
        id: null, 
        module_name: "", 
        description: "", 
        expiry_date: "" 
      }],
    }))
  }

  const deleteModule = (index: number) => {
    setEditData((prev: any) => ({
      ...prev,
      modules: prev.modules.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleNextFiveModulesChange = (index: number, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      next_five_modules: prev.next_five_modules.map((m: string, i: number) => 
        i === index ? value : m
      ),
    }))
  }

  const saveChanges = async () => {
    if (!editData) return
    setSaving(true)
    try {
      // Prepare modules data - preserve existing IDs if available
      const modulesData = editData.modules.map((m: any) => ({
        ...(m.id ? { id: m.id } : {}),
        module_name: m.module_name,
        description: m.description,
        expiry_date: m.expiry_date || null,
      }))

      // Filter out empty next five modules
      const filteredNextFiveModules = editData.next_five_modules
        .filter((m: string) => m.trim() !== "")
        .map((m: string) => ({ module_name: m }))

      const payload = {
        driver: driverId,
        document_name: editData.document_name,
        document_type: editData.document_type,
        has_expiry: editData.has_expiry || !!editData.expiry_date,
        description: editData.description || "",
        status_description: editData.status_description || "",
        status_reason: editData.status_reason || "",
        expiry_date: editData.expiry_date || null,
        has_document: editData.has_document,
        has_back_side: editData.has_back_side,
        urls: editData.urls || [],
        request_status: editData.request_status || "pending",
        has_description: !!editData.description || !!editData.status_description,
        next_five_modules: filteredNextFiveModules,
        modules: modulesData,
      }

      const endpoint = editData.id
        ? `${API_URL}/api/profiles/professional-competency/${editData.id}/`
        : `${API_URL}/api/profiles/professional-competency/`

      const method = editData.id ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to save: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.success || response.status === 200 || response.status === 201) {
        showToast("Professional competency saved successfully", "success")
        setIsModalOpen(false)
        setIsEditing(false)
        setUploadRequired(false)
        setShowStatusDescription(false)
        fetchCompetencyData()
      } else {
        throw new Error(result.message || "Failed to save")
      }
    } catch (error) {
      console.error("Error saving competency:", error)
      showToast(error instanceof Error ? error.message : "Failed to save", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!editData) return

    // Validate if documents are required when expiry date changed
    if (uploadRequired && editData.has_document) {
      const hasAllRequiredDocs = editData.has_back_side 
        ? editData.urls?.[0] && editData.urls?.[1]
        : editData.urls?.[0]
      
      if (!hasAllRequiredDocs) {
        openReminderDialog()
        return
      }
    }

    // Validate status description for rejected or pending documents
    if (isEditing && (editData.request_status === "not_approved" || editData.request_status === "pending") && !editData.status_description?.trim()) {
      setFormErrors((prev) => ({ ...prev, status_description: "Please provide a reason for this status" }))
      showToast("Please provide a status description", "error")
      return
    }

    await saveChanges()
  }

  const openReminderDialog = () => {
    setReminderData({
      title: `Upload documents for ${editData?.document_name}`,
      description: `Upload updated documents for ${editData?.document_name} with new expiry date: ${editData?.expiry_date}`,
      priority: "high",
      start_date: new Date().toISOString().split('T')[0],
      recurrence: "once",
      recurrence_interval: 1,
    })
    setIsReminderDialogOpen(true)
  }

  const handleRemindMeLater = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(reminderData),
      })

      if (!response.ok) {
        throw new Error("Failed to create reminder")
      }

      const result = await response.json()
      if (result.success || response.status === 201) {
        showToast("Reminder created successfully", "success")
        setIsReminderDialogOpen(false)
        
        // Reset reminder data
        setReminderData({
          title: "",
          description: "",
          priority: "medium",
          start_date: "",
          recurrence: "once",
          recurrence_interval: 1,
        })
        
        // Save changes without documents
        await saveChanges()
      } else {
        throw new Error(result.message || "Failed to create reminder")
      }
    } catch (error) {
      console.error("Error creating reminder:", error)
      showToast(error instanceof Error ? error.message : "Failed to create reminder", "error")
    }
  }

  const getStatusColor = (status: string) => {
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
  }

  const getStatusIcon = (status: string) => {
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
  }

  const openPdfModal = (url: string) => {
    setSelectedPdfUrl(url)
    setIsPdfModalOpen(true)
  }

  const allDocuments = getCompletedDocumentsList()

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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {allDocuments.map((competency: any) => (
              <Card
                key={competency.id || competency.document_type}
                className={cn(
                  "group cursor-pointer transition-all duration-300 border-2 relative overflow-hidden",
                  competency.has_document
                    ? "hover:shadow-2xl border-green-200 hover:border-orange-400 bg-white hover:scale-[1.02]"
                    : "border-dashed border-red-600 bg-gray-50/50 hover:border-orange-400 hover:bg-orange-50/50",
                )}
                onClick={() => handleCardClick(competency)}
              >
                {/* Document Preview Image with Navigation */}
                {competency.has_document && competency.urls?.[0] && (
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                    {isPdfUrl(competency.urls[0]) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-indigo-100">
                        <FileText className="h-20 w-20 text-orange-600 opacity-50" />
                      </div>
                    ) : (
                      <>
                        <img
                          src={competency.urls[0]}
                          alt={competency.document_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.parentElement!.innerHTML = '<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-indigo-100"><svg class="h-20 w-20 text-orange-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>'
                          }}
                        />
                        {/* Navigation dots for multiple images */}
                        {competency.urls.length > 1 && (
                          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                              {competency.urls.map((_: any, index: number) => (
                                <div
                                  key={index}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    index === 0 ? 'bg-white' : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <Badge
                      className={cn(
                        "absolute top-3 right-3 z-20 px-3 py-1.5 text-xs font-semibold border shadow-lg backdrop-blur-sm inline-flex items-center gap-1.5",
                        getStatusColor(competency.request_status),
                      )}
                    >
                      {getStatusIcon(competency.request_status)}
                      {competency.request_status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                )}

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
                        )}
                      >
                        {competency.document_name}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        {competency.document_type.replace("-", " ")}
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
                          {competency.has_document && (
                            <div className="flex items-center gap-1.5 text-gray-700 bg-green-50 rounded-lg px-2.5 py-1.5 border border-green-100">
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
                          e.stopPropagation()
                          handleCardClick(competency)
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
            ))}
          </div>
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
                    {editData?.document_type?.replace("-", " ")}
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
                    {editData?.has_document ? "Edit Document" : "Add Document"}
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
                        className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="font-semibold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                        {editData.document_name}
                      </p>
                    )}
                  </div>
                  
                  {(editData.has_expiry || (isEditing && editData.expiry_date)) && (
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
                          {editData.expiry_date ? formatDate(editData.expiry_date) : "No expiry date set"}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Status Section */}
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Select
                          value={editData.request_status || "pending"}
                          onValueChange={(value) => {
                            handleInputChange("request_status", value)
                            setShowStatusDescription(value === "not_approved" || value === "pending")
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
                        
                        {/* Status Reason Selection */}
                        {(editData.request_status === "pending" || editData.request_status === "not_approved") && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              Reason for {editData.request_status === "pending" ? "Pending" : "Rejection"}
                            </Label>
                            <Select
                              value={editData.status_reason || ""}
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
                                {(STATUS_REASONS[editData.request_status as keyof typeof STATUS_REASONS] || []).map((reason) => (
                                  <SelectItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Custom Reason Input for "other" option */}
                            {editData.status_reason === "other" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">
                                  Custom Reason
                                </Label>
                                <Input
                                  value={editData.custom_reason || ""}
                                  onChange={(e) => handleInputChange("custom_reason", e.target.value)}
                                  className="border-orange-300 focus:ring-2 focus:ring-orange-500"
                                  placeholder="Please specify the reason..."
                                />
                                {formErrors.custom_reason && (
                                  <p className="text-sm text-red-600">{formErrors.custom_reason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge 
                          className={cn("px-4 py-2 text-sm font-semibold border w-fit inline-flex items-center gap-2", getStatusColor(editData.request_status))}
                        >
                          {getStatusIcon(editData.request_status)}
                          {editData.request_status.replace("_", " ").toUpperCase()}
                        </Badge>
                        {editData.status_reason && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            Reason: {editData.status_reason === "other" 
                              ? editData.custom_reason || "Other"
                              : STATUS_REASONS[editData.request_status as keyof typeof STATUS_REASONS]?.find(r => r.value === editData.status_reason)?.label || editData.status_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
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
                  
                  {/* Status Description Field */}
                  {(showStatusDescription || editData.status_description) && (
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        {editData.request_status === "not_approved" ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Info className="h-4 w-4 text-orange-600" />
                        )}
                        Status Description
                        <span className="text-xs text-red-600">*Required</span>
                      </Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editData.status_description || ""}
                            onChange={(e) => handleInputChange("status_description", e.target.value)}
                            className={`border-orange-300 focus:ring-2 focus:ring-orange-500 min-h-[80px] ${
                              formErrors.status_description ? 'border-red-500' : ''
                            }`}
                            placeholder={
                              editData.request_status === "not_approved" 
                                ? "Explain why this document was not approved..." 
                                : "Provide details about why this document is pending..."
                            }
                          />
                          {formErrors.status_description && (
                            <p className="text-sm text-red-600">{formErrors.status_description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            This information will be visible to users and helps them understand what needs to be fixed.
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg border ${
                          editData.request_status === "not_approved" 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            {editData.request_status === "not_approved" ? (
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-gray-700 leading-relaxed">
                                {editData.status_description}
                              </p>
                              {editData.status_reason && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Reason: {STATUS_REASONS[editData.request_status as keyof typeof STATUS_REASONS]?.find(r => r.value === editData.status_reason)?.label}
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
              {(editData.has_document || isEditing) && (
                <Card className="border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-orange-50 border-b border-indigo-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Attached Documents
                        {editData.urls?.length > 1 && (
                          <span className="text-sm text-indigo-600 ml-2">
                            ({currentImageIndex + 1}/{editData.urls.length})
                          </span>
                        )}
                      </CardTitle>
                      {editData.urls?.length > 1 && !isEditing && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentImageIndex(prev => (prev === 0 ? editData.urls.length - 1 : prev - 1))}
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentImageIndex(prev => (prev === editData.urls.length - 1 ? 0 : prev + 1))}
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
                          {editData.urls?.[0] && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Current: {editData.urls[0].split("/").pop()}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {(editData.has_back_side || isEditing) && (
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
                            {editData.urls?.[1] && (
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
                    ) : editData.urls?.length > 0 ? (
                      <div className="space-y-4">
                        {/* Enhanced Image Display with Navigation */}
                        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-indigo-200 min-h-[400px] flex items-center justify-center">
                          {isPdfUrl(editData.urls[currentImageIndex]) ? (
                            <div className="text-center p-8">
                              <FileText className="h-20 w-20 text-indigo-600 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-semibold text-gray-700">PDF Document</p>
                              <p className="text-sm text-gray-500 mt-2">Click the button below to view</p>
                              <Button
                                onClick={() => openPdfModal(editData.urls[currentImageIndex])}
                                className="mt-4 bg-gradient-to-r from-indigo-600 to-orange-600 hover:from-indigo-700 hover:to-orange-700 text-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open PDF
                              </Button>
                            </div>
                          ) : (
                            <>
                              <img
                                src={editData.urls[currentImageIndex]}
                                alt={`${editData.document_name} - ${currentImageIndex === 0 ? 'Front' : 'Back'} side`}
                                className="max-w-full max-h-[400px] object-contain p-4"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement!.innerHTML = '<div class="text-center p-8"><svg class="h-20 w-20 text-orange-600 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p class="text-lg font-semibold text-gray-700">Image not available</p></div>'
                                }}
                              />
                              {/* Image Navigation Overlay */}
                              {editData.urls.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="pointer-events-auto bg-white/90 hover:bg-white shadow-lg"
                                    onClick={() => setCurrentImageIndex(prev => (prev === 0 ? editData.urls.length - 1 : prev - 1))}
                                  >
                                    <ChevronLeft className="h-6 w-6" />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="pointer-events-auto bg-white/90 hover:bg-white shadow-lg"
                                    onClick={() => setCurrentImageIndex(prev => (prev === editData.urls.length - 1 ? 0 : prev + 1))}
                                  >
                                    <ChevronRight className="h-6 w-6" />
                                  </Button>
                                </div>
                              )}
                              {/* Image Counter */}
                              {editData.urls.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                  <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
                                    {editData.urls.map((_: any, index: number) => (
                                      <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                                          index === currentImageIndex 
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

                        {/* Document List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {editData.urls.map((url: string, index: number) => (
                            url && (
                              <Button
                                key={index}
                                variant="outline"
                                onClick={() => {
                                  if (isPdfUrl(url)) {
                                    openPdfModal(url)
                                  } else {
                                    setCurrentImageIndex(index)
                                  }
                                }}
                                className={`h-auto p-3 border-2 hover:border-indigo-400 hover:bg-indigo-50 justify-start group transition-all ${
                                  index === currentImageIndex 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-indigo-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className={`p-2 rounded-lg transition-colors ${
                                    index === currentImageIndex
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
                                      {editData.has_back_side 
                                        ? index === 0 ? "Front Side" : "Back Side"
                                        : `Document ${index + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {url.split("/").pop()}
                                    </p>
                                    {index === currentImageIndex && !isPdfUrl(url) && (
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

                    {isEditing && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <input
                          type="checkbox"
                          checked={editData.has_back_side}
                          onChange={(e) => handleInputChange("has_back_side", e.target.checked)}
                        />
                        <label>This document has a back side</label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Modules Section - Enhanced */}
              {(editData.document_type === "cpc-card" || editData.modules.length > 0) && (
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
                      {isEditing && (
                        <Button onClick={addModule} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Module
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {editData.modules.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No modules added yet</p>
                        {isEditing && (
                          <Button onClick={addModule} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Module
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {editData.modules.map((module: any, index: number) => (
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
                                {isEditing && (
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
                                {isEditing ? (
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
                                {isEditing ? (
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
                                {isEditing ? (
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
                    
                    {!isEditing && (
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
                    
                    {isEditing && (
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
                    You've changed the expiry date but haven't uploaded the updated documents yet. 
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