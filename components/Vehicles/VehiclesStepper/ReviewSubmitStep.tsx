import * as React from "react"
import { CheckCircle2, Car, ShoppingCart, ShieldCheck, CircleGauge, FileCheck2 } from "lucide-react"
import { useSelector } from "react-redux"
import { Badge } from "@/components/ui/badge"
import { type RootState } from "./store"

function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right truncate">
        {value || <span className="text-muted-foreground/50 italic">Not set</span>}
      </span>
    </div>
  )
}

function ReviewSection({ title, icon: Icon, children }: {
  title: string
  icon: React.ComponentType<any>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

export function ReviewSubmitStep() {
  const { formData, vehicleTypes, sites } = useSelector((state: RootState) => state.vehicle)

  const vehicleTypeName = vehicleTypes.find((t: any) => t.id === formData.vehicle_type)?.name
  const siteNames = sites
    .filter((s: any) => formData.site_allocated.includes(s.id))
    .map((s: any) => s.name)
    .join(", ")

  const total = (
    parseFloat(formData.price || "0") + parseFloat(formData.vat_amount || "0")
  ).toFixed(2)

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        Review all information below before submitting.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle Details */}
        <ReviewSection title="Vehicle Details" icon={Car}>
          <ReviewRow label="VIN" value={formData.vin} />
          <ReviewRow label="Registration" value={formData.registration_number} />
          <ReviewRow label="Make" value={formData.make} />
          <ReviewRow label="Model" value={formData.model} />
          <ReviewRow label="Type" value={vehicleTypeName} />
          <ReviewRow label="Mileage" value={formData.last_mileage ? `${formData.last_mileage} ${formData.mileage_unit}` : null} />
          <ReviewRow label="Seats" value={formData.number_of_seats} />
          <ReviewRow label="Sites" value={siteNames || undefined} />
        </ReviewSection>

        {/* Purchase Info */}
        <ReviewSection title="Purchase Info" icon={ShoppingCart}>
          <ReviewRow label="Date" value={formData.date_of_purchase} />
          <ReviewRow label="Purchased from" value={formData.purchased_from} />
          <ReviewRow label="Purchased by" value={formData.purchased_by} />
          <ReviewRow label="Mileage at purchase" value={formData.purchase_mileage} />
          <ReviewRow label="Price" value={formData.price ? `£${formData.price}` : null} />
          {formData.has_vat && <ReviewRow label="VAT (20%)" value={`£${formData.vat_amount}`} />}
          <ReviewRow label="Total" value={`£${total}`} />
        </ReviewSection>

        {/* Compliance */}
        <ReviewSection title="Compliance" icon={ShieldCheck}>
          <ReviewRow label="MOT Expiry" value={formData.mot_expiry} />
          <ReviewRow label="Insurance Expiry" value={formData.insurance_expiry} />
          <ReviewRow label="Tax Expiry" value={formData.tax_expiry} />
          <ReviewRow label="Last PMI" value={formData.last_pmi_date} />
          {formData.is_tacho_fitted && (
            <>
              <ReviewRow label="Tacho Calibration" value={formData.tacho_calibration_expiry} />
              <ReviewRow label="Last Download" value={formData.last_tacho_download_date} />
            </>
          )}
          {formData.is_wheelchair_lift_fitted && (
            <ReviewRow label="LOLER Expiry" value={formData.loller_test_expiry_date} />
          )}
        </ReviewSection>

        {/* Tyres summary */}
        <ReviewSection title="Tyre Check" icon={CircleGauge}>
          {["front_driver", "front_passenger", "rear_outer_driver", "rear_outer_passenger", "rear_inner_driver", "rear_inner_passenger"].map((pos) => {
            const exp = (formData as any)[`tyre_expiry_${pos}`]
            const dep = (formData as any)[`tyre_depth_${pos}`]
            const label = pos
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
            return (
              <ReviewRow
                key={pos}
                label={label}
                value={exp || dep ? `${exp || "—"} exp · ${dep || "—"} mm` : null}
              />
            )
          })}
        </ReviewSection>
      </div>

      {/* Documents status */}
      <ReviewSection title="Documents" icon={FileCheck2}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-3">
          {[
            { label: "Logbook",          field: "logbook_docs" },
            { label: "COIF",             field: "COIF_technical_docs" },
            { label: "Service Records",  field: "service_records_docs" },
            { label: "Delivery Check",   field: "new_vehicle_checklist_docs" },
            { label: "Invoice",          field: "vehicle_invoice_docs" },
            { label: "Other Docs",       field: "others_docs" },
            { label: "MOT Cert",         field: "mot_check_docs" },
            { label: "Insurance Cert",   field: "insurance_docs" },
            { label: "Tax Cert",         field: "tax_docs" },
          ].map(({ label, field }) => {
            const uploaded = !!(formData as any)[field]
            return (
              <div key={field} className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${uploaded ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                <span className={uploaded ? "text-foreground" : "text-muted-foreground/50"}>{label}</span>
              </div>
            )
          })}
        </div>
      </ReviewSection>

      {/* Tachograph/LOLER badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={formData.is_tacho_fitted ? "default" : "secondary"}>
          Tachograph: {formData.is_tacho_fitted ? "Fitted" : "Not fitted"}
        </Badge>
        <Badge variant={formData.is_wheelchair_lift_fitted ? "default" : "secondary"}>
          Wheelchair Lift: {formData.is_wheelchair_lift_fitted ? "Fitted" : "Not fitted"}
        </Badge>
        <Badge variant="outline" className="capitalize">
          Status: {formData.vehicle_status}
        </Badge>
        <Badge variant="outline" className="capitalize">
          Roadworthy: {formData.vehicle_roadworthy_status?.replace(/_/g, " ")}
        </Badge>
      </div>
    </div>
  )
}
