import * as React from "react"
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { type RootState, type AppDispatch } from "./store"
import { setFormData, clearValidationError } from "./vehicleSlice"
import { DateInputWithFileUpload } from "./DateInputWithFileUpload"
import { areDateDocumentsUploaded } from "./validation"
import { type VehicleFormData } from "./types"

interface ComplianceStepProps {
  handleCreateTaskForDocument: (field: string) => void
  handleFileUploadSuccess: (field: keyof VehicleFormData) => (url: string) => void
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<any>; children: React.ReactNode }) {
  return (
    <div className="space-y-4 p-5 rounded-xl border bg-muted/20">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  )
}

export function ComplianceStep({
  handleCreateTaskForDocument,
  handleFileUploadSuccess,
}: ComplianceStepProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { formData, validationErrors } = useSelector((state: RootState) => state.vehicle)
  const dateDocsUploaded = areDateDocumentsUploaded(formData)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    dispatch(setFormData({ [name]: value }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    dispatch(setFormData({ [name]: checked }))
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
        dateDocsUploaded
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200"
          : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200"
      }`}>
        {dateDocsUploaded
          ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
        }
        {dateDocsUploaded
          ? "All compliance documents are complete"
          : "A document upload is required for every date entered"
        }
      </div>

      {/* Core compliance dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="MOT">
          <DateInputWithFileUpload
            label="MOT Expiry Date"
            name="mot_expiry"
            value={formData.mot_expiry}
            onChange={handleDateChange}
            onFileUpload={handleFileUploadSuccess("mot_check_docs")}
            error={validationErrors.mot_expiry}
            required
            docFieldName="mot_check_docs"
            docValue={formData.mot_check_docs}
            onTaskCreate={() => handleCreateTaskForDocument("mot_check_docs")}
          />
        </SectionCard>

        <SectionCard title="Insurance">
          <DateInputWithFileUpload
            label="Insurance Expiry Date"
            name="insurance_expiry"
            value={formData.insurance_expiry}
            onChange={handleDateChange}
            onFileUpload={handleFileUploadSuccess("insurance_docs")}
            error={validationErrors.insurance_expiry}
            required
            docFieldName="insurance_docs"
            docValue={formData.insurance_docs}
            onTaskCreate={() => handleCreateTaskForDocument("insurance_docs")}
          />
        </SectionCard>

        <SectionCard title="Tax">
          <DateInputWithFileUpload
            label="Tax Expiry Date"
            name="tax_expiry"
            value={formData.tax_expiry}
            onChange={handleDateChange}
            onFileUpload={handleFileUploadSuccess("tax_docs")}
            error={validationErrors.tax_expiry}
            required
            docFieldName="tax_docs"
            docValue={formData.tax_docs}
            onTaskCreate={() => handleCreateTaskForDocument("tax_docs")}
          />
        </SectionCard>

        <SectionCard title="PMI Inspection">
          <DateInputWithFileUpload
            label="Last PMI Date"
            name="last_pmi_date"
            value={formData.last_pmi_date}
            onChange={handleDateChange}
            onFileUpload={handleFileUploadSuccess("pmi_inspection_docs")}
            error={validationErrors.last_pmi_date}
            docFieldName="pmi_inspection_docs"
            docValue={formData.pmi_inspection_docs}
            onTaskCreate={() => handleCreateTaskForDocument("pmi_inspection_docs")}
          />
        </SectionCard>
      </div>

      {/* Tachograph */}
      <div className="space-y-4 p-5 rounded-xl border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <Label className="text-sm font-semibold text-foreground cursor-pointer">Tachograph Fitted</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Enable if this vehicle has a tachograph</p>
            </div>
          </div>
          <Switch
            checked={formData.is_tacho_fitted}
            onCheckedChange={(c) => handleSwitchChange("is_tacho_fitted", c)}
          />
        </div>

        {formData.is_tacho_fitted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t">
            <DateInputWithFileUpload
              label="Calibration Expiry"
              name="tacho_calibration_expiry"
              value={formData.tacho_calibration_expiry}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("tacho_calibration_docs")}
              error={validationErrors.tacho_calibration_expiry}
              docFieldName="tacho_calibration_docs"
              docValue={formData.tacho_calibration_docs}
            />
            <DateInputWithFileUpload
              label="Last Download Date"
              name="last_tacho_download_date"
              value={formData.last_tacho_download_date}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("last_tacho_download_docs")}
              error={validationErrors.last_tacho_download_date}
              docFieldName="last_tacho_download_docs"
              docValue={formData.last_tacho_download_docs}
            />
          </div>
        )}
      </div>

      {/* LOLER */}
      <div className="space-y-4 p-5 rounded-xl border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <Label className="text-sm font-semibold text-foreground cursor-pointer">Wheelchair Lift / LOLER Fitted</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Enable if this vehicle has a wheelchair lift</p>
            </div>
          </div>
          <Switch
            checked={formData.is_wheelchair_lift_fitted}
            onCheckedChange={(c) => handleSwitchChange("is_wheelchair_lift_fitted", c)}
          />
        </div>

        {formData.is_wheelchair_lift_fitted && (
          <div className="pt-1 border-t">
            <DateInputWithFileUpload
              label="LOLER Test Expiry"
              name="loller_test_expiry_date"
              value={formData.loller_test_expiry_date}
              onChange={handleDateChange}
              onFileUpload={handleFileUploadSuccess("loller_docs")}
              error={validationErrors.loller_test_expiry_date}
              docFieldName="loller_docs"
              docValue={formData.loller_docs}
            />
          </div>
        )}
      </div>
    </div>
  )
}
