import * as React from "react"
import { CheckCircle2, AlertCircle, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import FileUploader from "@/components/Media/MediaUpload"

export function DateInputWithFileUpload({
  label,
  name,
  value,
  onChange,
  onFileUpload,
  error,
  required = false,
  docFieldName,
  docValue,
  docError,
  onTaskCreate,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (url: string) => void
  error?: string
  required?: boolean
  docFieldName: string
  docValue: string
  docError?: string
  onTaskCreate?: () => void
}) {
  const hasDateNoDoc = value && !docValue
  const hasAnyError = error || docError
  const isComplete = value && docValue

  const borderClass = isComplete
    ? "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-800"
    : hasAnyError
    ? "border-destructive/40 bg-destructive/5"
    : hasDateNoDoc
    ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800"
    : "border-border bg-muted/20 hover:bg-muted/40"

  return (
    <div className={cn("space-y-3 p-4 rounded-xl border transition-all duration-200", borderClass)}>
      {/* Title row */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <Label htmlFor={name} className="text-sm font-semibold text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {isComplete && (
            <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Complete
            </p>
          )}
        </div>
        {hasDateNoDoc && onTaskCreate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onTaskCreate}
            className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-3 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Task
          </Button>
        )}
      </div>

      {/* Date + Upload columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date column */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</span>
          <Input
            id={name}
            name={name}
            type="date"
            value={value}
            onChange={onChange}
            className={cn(
              "h-10 rounded-lg text-sm",
              error
                ? "border-destructive focus-visible:ring-destructive"
                : hasDateNoDoc && !error
                ? "border-amber-400"
                : isComplete
                ? "border-emerald-400"
                : ""
            )}
          />
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" /> {error}
            </p>
          )}
          {hasDateNoDoc && !error && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Document required for this date
            </p>
          )}
        </div>

        {/* Upload column */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Document</span>
          {!docValue ? (
            <>
              <FileUploader onUploadSuccess={onFileUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              {docError && (
                <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3 w-3" /> {docError}
                </p>
              )}
              {value && !docValue && !docError && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  Required: Upload document to proceed
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium h-10">
              <CheckCircle2 className="h-4 w-4" />
              Document uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
