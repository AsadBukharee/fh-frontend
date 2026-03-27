import * as React from "react"
import { CheckCircle2, AlertCircle, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import FileUploader from "@/components/Media/MediaUpload"

export function DocumentUploadWithTask({
  field,
  label,
  icon: Icon,
  value,
  onUploadSuccess,
  error,
  required = false,
  onTaskCreate,
  description,
}: {
  field: string
  label: string
  icon: React.ComponentType<any>
  value: string
  onUploadSuccess: (url: string) => void
  error?: string
  required?: boolean
  onTaskCreate?: () => void
  description?: string
}) {
  const state = value ? "uploaded" : error ? "error" : "idle"

  return (
    <div
      className={cn(
        "group relative space-y-3 p-4 rounded-xl border transition-all duration-200",
        state === "uploaded" && "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
        state === "error" && "bg-destructive/5 border-destructive/40",
        state === "idle" && "bg-muted/30 border-border hover:border-border/80 hover:bg-muted/50"
      )}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Icon className={cn("h-4 w-4 shrink-0", state === "uploaded" ? "text-emerald-600" : "text-muted-foreground")} />
            <span className="truncate">{label}</span>
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 ml-6">{description}</p>
          )}
          {state === "uploaded" && (
            <p className="text-xs text-emerald-600 mt-1 ml-6 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Uploaded successfully
            </p>
          )}
        </div>

        {state !== "uploaded" && onTaskCreate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onTaskCreate}
            className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-3 text-xs font-medium transition-colors flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Task
          </Button>
        )}
      </div>

      {/* Uploader */}
      {state !== "uploaded" && (
        <FileUploader onUploadSuccess={onUploadSuccess} />
      )}

      {/* Error / hint messages */}
      {state === "error" && (
        <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {state === "idle" && required && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Required — please upload this document
        </p>
      )}
    </div>
  )
}
