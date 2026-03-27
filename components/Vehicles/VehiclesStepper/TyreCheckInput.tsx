import * as React from "react"
import { Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function TyreCheckInput({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  step,
  placeholder,
  tooltip,
  required = true,
}: {
  label: string
  name: string
  value: string | number | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  type?: string
  step?: string
  placeholder?: string
  tooltip?: string
  required?: boolean
}) {
  const hasValue = value !== null && value !== ""

  return (
    <div className="space-y-1.5">
      <Label
        className={cn(
          "text-xs font-semibold uppercase tracking-wide flex items-center gap-2",
          error ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {label}
        {required && <span className="text-destructive">*</span>}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help hover:text-muted-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      <Input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        className={cn(
          "h-10 rounded-lg text-sm transition-colors",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : hasValue
            ? "border-emerald-400 focus-visible:ring-emerald-500/30"
            : ""
        )}
      />
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
