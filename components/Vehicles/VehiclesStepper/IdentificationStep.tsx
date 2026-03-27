import * as React from "react"
import { Car, Settings, Users, Gauge, Bus, ImageIcon, LucideX, AlertCircle } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { type RootState, type AppDispatch } from "./store"
import { setFormData, clearValidationError } from "./vehicleSlice"
import { MultiSelect } from "./MultiSelect"
import { DocumentUploadWithTask } from "./DocumentUploadWithTask"
import { type VehicleFormData, type VehicleType } from "./types"

interface IdentificationStepProps {
  handleCreateTaskForDocument: (field: string) => void
  handleFileUploadSuccess: (field: keyof VehicleFormData) => (url: string) => void
}

function FieldGroup({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

export function IdentificationStep({
  handleCreateTaskForDocument,
  handleFileUploadSuccess,
}: IdentificationStepProps) {
  const dispatch = useDispatch<AppDispatch>()
  const {
    formData,
    sites,
    vehicleTypes,
    vehicleTypesLoading,
    validationErrors,
  } = useSelector((state: RootState) => state.vehicle)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
  }

  const handleSelectChange = (name: string, value: string) => {
    dispatch(setFormData({ [name]: name === "vehicle_type" ? Number(value) : value }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value ? Number.parseFloat(value) : null }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
  }

  const handleMultiSelectChange = (name: string, values: number[]) => {
    dispatch(setFormData({ [name]: values }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
  }

  return (
    <div className="space-y-6">
      {/* ── Vehicle Photo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FieldGroup label="Vehicle Photo" required error={validationErrors.vehicle_picture}>
          <DocumentUploadWithTask
            field="vehicle_picture"
            label=""
            icon={ImageIcon}
            value={formData.vehicle_picture}
            onUploadSuccess={handleFileUploadSuccess("vehicle_picture")}
            error={validationErrors.vehicle_picture}
            required
            onTaskCreate={() => handleCreateTaskForDocument("vehicle_picture")}
            description="Clear photos — front, back, and sides"
          />
        </FieldGroup>

        {/* Photo Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</Label>
          {formData.vehicle_picture ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
              <img
                src={formData.vehicle_picture}
                alt="Vehicle preview"
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 shadow"
                onClick={() => dispatch(setFormData({ vehicle_picture: "" }))}
              >
                <LucideX className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Preview appears here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Core identification ── */}
      <div className="space-y-5 p-5 rounded-xl border bg-muted/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identification</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FieldGroup label="Make" required error={validationErrors.make}>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="make" name="make" placeholder="e.g., Mercedes"
                value={formData.make} onChange={handleInputChange}
                className={cn("h-11 rounded-xl pl-10", validationErrors.make && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Model" required error={validationErrors.model}>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="model" name="model" placeholder="e.g., Sprinter"
                value={formData.model} onChange={handleInputChange}
                className={cn("h-11 rounded-xl pl-10", validationErrors.model && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Registration Number" required error={validationErrors.registration_number}>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="registration_number" name="registration_number" placeholder="e.g., AB12 CDE"
                value={formData.registration_number} onChange={handleInputChange}
                className={cn("h-11 rounded-xl pl-10", validationErrors.registration_number && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="VIN Number" required error={validationErrors.vin}>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="vin" name="vin" placeholder="e.g., VF3ABC12345678901"
                value={formData.vin} onChange={handleInputChange}
                className={cn("h-11 rounded-xl pl-10", validationErrors.vin && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
          </FieldGroup>
        </div>
      </div>

      {/* ── Classification ── */}
      <div className="space-y-5 p-5 rounded-xl border bg-muted/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classification</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FieldGroup label="Vehicle Type" required error={validationErrors.vehicle_type}>
            <Select
              value={formData.vehicle_type.toString()}
              onValueChange={(v) => handleSelectChange("vehicle_type", v)}
              disabled={vehicleTypesLoading}
            >
              <SelectTrigger className={cn("h-11 rounded-xl", validationErrors.vehicle_type && "border-destructive")}>
                <SelectValue placeholder={vehicleTypesLoading ? "Loading..." : "Select type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" disabled>Select type</SelectItem>
                {vehicleTypes.map((type: VehicleType) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Number of Seats">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="number_of_seats" name="number_of_seats" type="number" placeholder="e.g., 16"
                value={formData.number_of_seats || ""}
                onChange={handleNumberInputChange}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Last Mileage" required error={validationErrors.last_mileage}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="last_mileage" name="last_mileage" placeholder="Mileage"
                  value={formData.last_mileage} onChange={handleInputChange}
                  className={cn("h-11 rounded-xl pl-10", validationErrors.last_mileage && "border-destructive")}
                />
              </div>
              <Select value={formData.mileage_unit} onValueChange={(v) => handleSelectChange("mileage_unit", v)}>
                <SelectTrigger className="w-24 h-11 rounded-xl shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kms">KMS</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FieldGroup>

          <FieldGroup label="Status">
            <Select value={formData.vehicle_status} onValueChange={(v) => handleSelectChange("vehicle_status", v)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Roadworthy Status">
            <Select value={formData.vehicle_roadworthy_status} onValueChange={(v) => handleSelectChange("vehicle_roadworthy_status", v)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no_defect">No Defect</SelectItem>
                <SelectItem value="minor_defect_roadworthy">Minor — Roadworthy</SelectItem>
                <SelectItem value="minor_defect_not_roadworthy">Minor — Not Roadworthy</SelectItem>
                <SelectItem value="major_defect_not_roadworthy">Major — Not Roadworthy</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </div>

      {/* ── Site allocation ── */}
      <FieldGroup label="Allocated Site(s)" required error={validationErrors.site_allocated}>
        <MultiSelect
          options={sites}
          selected={formData.site_allocated}
          onChange={(values) => handleMultiSelectChange("site_allocated", values)}
          placeholder="Select one or more sites"
          error={!!validationErrors.site_allocated}
        />
      </FieldGroup>

      {/* ── Notes ── */}
      <FieldGroup label="Notes">
        <Textarea
          id="notes" name="notes" placeholder="Any additional notes…"
          value={formData.notes} onChange={handleInputChange}
          rows={3}
          className="rounded-xl resize-none"
        />
      </FieldGroup>
    </div>
  )
}
