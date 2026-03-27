import * as React from "react"
import { AlertCircle, FileText, ShoppingCart, Calendar, User, Hash, DollarSign, ToggleRight } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { type RootState, type AppDispatch } from "./store"
import { setFormData, clearValidationError } from "./vehicleSlice"
import { DocumentUploadWithTask } from "./DocumentUploadWithTask"
import { type VehicleFormData } from "./types"

interface PurchaseInfoStepProps {
  handleCreateTaskForDocument: (field: string) => void
  handleFileUploadSuccess: (field: keyof VehicleFormData) => (url: string) => void
}

function FieldGroup({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
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

export function PurchaseInfoStep({
  handleCreateTaskForDocument,
  handleFileUploadSuccess,
}: PurchaseInfoStepProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { formData, validationErrors } = useSelector((state: RootState) => state.vehicle)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value

    const updated: any = { ...formData, [name]: newValue }

    if (name === "price") {
      if (updated.has_vat) {
        const p = parseFloat(value) || 0
        updated.vat_amount = (p * 0.2).toFixed(2)
      }
    }

    if (name === "has_vat") {
      if (newValue) {
        const p = parseFloat(formData.price || "0") || 0
        updated.vat_amount = (p * 0.2).toFixed(2)
      } else {
        updated.vat_amount = ""
      }
    }

    dispatch(setFormData(updated))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value }))
    if (validationErrors[name]) {
      dispatch(clearValidationError(name))
    }
  }

  const total = (parseFloat(formData.price || "0") + parseFloat(formData.vat_amount || "0")).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Purchase Details card */}
      <div className="space-y-5 p-5 rounded-xl border bg-muted/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Purchase Details</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Date of Purchase */}
          <FieldGroup label="Date of Purchase">
            <Input
              id="date_of_purchase"
              name="date_of_purchase"
              type="date"
              value={formData.date_of_purchase}
              onChange={handleDateChange}
              className="h-11 rounded-xl"
            />
          </FieldGroup>

          {/* Purchased From */}
          <FieldGroup label="Purchased From">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="purchased_from"
                name="purchased_from"
                placeholder="e.g., ABC Motors"
                value={formData.purchased_from}
                onChange={handleInputChange}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </FieldGroup>

          {/* Purchased By */}
          <FieldGroup label="Purchased By">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="purchased_by"
                name="purchased_by"
                placeholder="e.g., Fleet Manager"
                value={formData.purchased_by}
                onChange={handleInputChange}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </FieldGroup>

          {/* Purchase Price */}
          <FieldGroup label="Purchase Price (£)">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={handleInputChange}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </FieldGroup>

          {/* Purchase Mileage */}
          <FieldGroup label="Purchase Mileage" required error={validationErrors.purchase_mileage}>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="purchase_mileage"
                name="purchase_mileage"
                placeholder="e.g., 12000"
                value={formData.purchase_mileage}
                onChange={handleInputChange}
                className={cn(
                  "h-11 rounded-xl pl-10",
                  validationErrors.purchase_mileage && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
          </FieldGroup>

          {/* VAT Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-background">
            <div>
              <Label htmlFor="has_vat" className="text-sm font-semibold cursor-pointer">Include VAT (20%)</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically calculated</p>
            </div>
            <Switch
              id="has_vat"
              checked={formData.has_vat}
              onCheckedChange={(checked) =>
                handleInputChange({ target: { name: "has_vat", type: "checkbox", checked } } as any)
              }
            />
          </div>
        </div>

        {/* VAT + Total row */}
        {formData.has_vat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <FieldGroup label="VAT Amount">
              <Input
                id="vat_amount"
                name="vat_amount"
                value={formData.vat_amount ? `£${formData.vat_amount}` : ""}
                readOnly
                disabled
                className="h-11 rounded-xl font-mono bg-muted/60"
              />
            </FieldGroup>

            <FieldGroup label="Total (incl. VAT)">
              <Input
                id="total_price"
                value={`£${total}`}
                readOnly
                disabled
                className="h-11 rounded-xl font-mono font-semibold bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200"
              />
            </FieldGroup>
          </div>
        )}

        {!formData.has_vat && formData.price && (
          <FieldGroup label="Total">
            <Input
              value={`£${total}`}
              readOnly
              disabled
              className="h-11 rounded-xl font-mono font-semibold bg-muted/60"
            />
          </FieldGroup>
        )}
      </div>

      {/* Invoice upload */}
      <DocumentUploadWithTask
        field="vehicle_invoice_docs"
        label="Purchase Invoice"
        icon={FileText}
        value={formData.vehicle_invoice_docs}
        onUploadSuccess={handleFileUploadSuccess("vehicle_invoice_docs")}
        error={validationErrors.vehicle_invoice_docs}
        required
        onTaskCreate={() => handleCreateTaskForDocument("vehicle_invoice_docs")}
        description="Attach the purchase invoice or receipt"
      />
    </div>
  )
}
