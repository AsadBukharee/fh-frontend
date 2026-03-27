import * as React from "react"
import { AlertCircle, BookOpen, FileText, FileCheck, CheckCircle2, Clock } from "lucide-react"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { type RootState } from "./store"
import { DocumentUploadWithTask } from "./DocumentUploadWithTask"
import { areAllDocumentsUploaded } from "./validation"
import { type VehicleFormData } from "./types"

interface VehicleDocumentsStepProps {
  handleCreateTaskForDocument: (field: string) => void
  handleFileUploadSuccess: (field: keyof VehicleFormData) => (url: string) => void
  handleCreateTasksForAllMissing: () => void
}

const DOCS = [
  { field: "logbook_docs",              label: "Logbook",                icon: BookOpen,   description: "V5 registration document" },
  { field: "COIF_technical_docs",       label: "COIF",                   icon: FileText,   description: "Technical specifications" },
  { field: "service_records_docs",      label: "Service Documents",      icon: FileText,   description: "Previous service history" },
  { field: "new_vehicle_checklist_docs",label: "Delivery Checklist",     icon: FileCheck,  description: "Mandatory delivery checklist" },
  { field: "others_docs",               label: "Other Documents",        icon: FileText,   description: "Any additional documents" },
] as const

export function VehicleDocumentsStep({
  handleCreateTaskForDocument,
  handleFileUploadSuccess,
  handleCreateTasksForAllMissing,
}: VehicleDocumentsStepProps) {
  const { formData } = useSelector((state: RootState) => state.vehicle)
  const allUploaded = areAllDocumentsUploaded(formData)
  const uploadedCount = DOCS.filter((d) => !!(formData as any)[d.field]).length

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
        allUploaded
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200"
          : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200"
      }`}>
        <div className="flex items-center gap-2.5">
          {allUploaded
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          }
          <span>
            {allUploaded
              ? "All documents uploaded — ready to proceed"
              : `${uploadedCount} of ${DOCS.length} documents uploaded`}
          </span>
        </div>

        {!allUploaded && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCreateTasksForAllMissing}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 h-8 px-3 text-xs font-semibold shrink-0 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Create Tasks
          </Button>
        )}
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DOCS.map((doc) => (
          <DocumentUploadWithTask
            key={doc.field}
            field={doc.field}
            label={doc.label}
            icon={doc.icon}
            value={(formData as any)[doc.field]}
            onUploadSuccess={handleFileUploadSuccess(doc.field as keyof VehicleFormData)}
            required
            onTaskCreate={() => handleCreateTaskForDocument(doc.field)}
            description={doc.description}
          />
        ))}
      </div>
    </div>
  )
}
