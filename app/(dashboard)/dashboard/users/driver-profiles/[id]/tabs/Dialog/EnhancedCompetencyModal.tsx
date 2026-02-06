/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ImageIcon,
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  FileCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import dynamic from 'next/dynamic'
import LazyImage from "./LazyImage"

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
  showToast: (message: string, type: string) => void;
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
  handleModuleChange: (index: number, field: string, value: string) => void;
  addModule: () => void;
  deleteModule: (index: number) => void;
  handleNextFiveModulesChange: (index: number, value: string) => void;
  handleSave: () => Promise<void>;
  handleDirectStatusUpdate: () => Promise<void>;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  openPdfModal: (url: string) => void;
  STATUS_REASONS: any;
  originalExpiryDate?: string;
  hasUploadedNewDocument?: boolean;
  uploadRequired?: boolean;
  openReminderDialog?: () => void;
}

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
};

export default function EnhancedCompetencyModal({
  isOpen,
  onOpenChange,
  modalState,
  dispatchModal,
  driverId,
  showToast,
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
  STATUS_REASONS: externalStatusReasons,
  originalExpiryDate = "",
  hasUploadedNewDocument = false,
  uploadRequired = false,
  openReminderDialog,
}: EnhancedCompetencyModalProps) {

  // Use external STATUS_REASONS if provided, otherwise use internal
  const statusReasons = externalStatusReasons || STATUS_REASONS;

  // Direct Status Update Section
  const renderDirectStatusUpdate = () => {
    if (!modalState.editData || !modalState.directStatusEditing || !modalState.editData.has_document) return null;

    return (
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
                    const selectedReason = statusReasons[modalState.statusUpdateData.request_status as keyof typeof statusReasons]
                      ?.find((r: any) => r.value === value)
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
                    {(statusReasons[modalState.statusUpdateData.request_status as keyof typeof statusReasons] || []).map((reason: any) => (
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
    );
  };

  // Basic Information Section
  const renderBasicInformation = () => {
    if (!modalState.editData) return null;

    return (
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
                {modalState.editData.document_type === "last-driver-check-code"
                  ? "Last Check Code Date"
                  : modalState.editData.document_type === "last-tacho-download"
                    ? "Last Download Date"
                    : "Expiry Date"}
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
                            {modalState.editData.document_type === "last-driver-check-code" || modalState.editData.document_type === "last-tacho-download"
                              ? "Changing the date requires uploading updated documentation."
                              : "Changing the expiry date requires uploading updated documents."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-semibold text-lg text-orange-900 bg-orange-50 p-3 rounded-lg">
                  {modalState.editData.expiry_date
                    ? formatDate(modalState.editData.expiry_date)
                    : (modalState.editData.document_type === "last-driver-check-code" || modalState.editData.document_type === "last-tacho-download")
                      ? "No date set"
                      : "No expiry date set"}
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
                        {(statusReasons[modalState.editData.request_status as keyof typeof statusReasons] || []).map((reason: any) => (
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
                      : statusReasons[modalState.editData.request_status as keyof typeof statusReasons]?.find((r: any) => r.value === modalState.editData.status_reason)?.label || modalState.editData.status_reason}
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
                <div className={`p-4 rounded-lg border ${modalState.editData.request_status === "not_approved"
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
                          Reason: {statusReasons[modalState.editData.request_status as keyof typeof statusReasons]?.find((r: any) => r.value === modalState.editData.status_reason)?.label}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card >
    );
  };

  // Documents Section
  const renderDocumentsSection = () => {
    if (!modalState.editData) return null;

    if (!modalState.editData.has_document && !modalState.isEditing) return null;

    return (
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
            modalState.isEditing && !hasUploadedNewDocument && openReminderDialog && (
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
                        (modalState.editData.document_type === "last-driver-check-code" || modalState.editData.document_type === "last-tacho-download") ?
                          "You have changed the date. You must upload updated documents before saving changes." :
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
                              className={`w-2.5 h-2.5 rounded-full transition-all ${index === modalState.currentImageIndex
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
                      className={`h-auto p-3 border-2 hover:border-indigo-400 hover:bg-indigo-50 justify-start group transition-all ${index === modalState.currentImageIndex
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-indigo-200'
                        }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-lg transition-colors ${index === modalState.currentImageIndex
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
    );
  };

  // Modules Section
  const renderModulesSection = () => {
    if (!modalState.editData) return null;

    if (modalState.editData.document_type !== "cpc-card" && modalState.editData.modules.length === 0) return null;

    return (
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
    );
  };

  // Next Five Modules (CPC Card) Section
  const renderNextFiveModules = () => {
    if (!modalState.editData || modalState.editData.document_type !== "cpc-card") return null;

    return (
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
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        dispatchModal({ type: 'RESET_MODAL' });
      }
      onOpenChange(open);
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
            {renderDirectStatusUpdate()}

            {/* Basic Information */}
            {renderBasicInformation()}

            {/* Documents Section */}
            {renderDocumentsSection()}

            {/* Modules Section */}
            {renderModulesSection()}

            {/* Next Five Modules (CPC Card) */}
            {renderNextFiveModules()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}