import * as React from "react"
import { AlertCircle } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { type RootState, type AppDispatch } from "./store"
import { setFormData, setValidationErrors, clearValidationError } from "./vehicleSlice"
import { TyreCheckInput } from "./TyreCheckInput"
import { validateTyreExpiry } from "./validation"

const TYRE_POSITIONS = [
  { key: "front_driver", label: "Front — Driver", side: "front" },
  { key: "front_passenger", label: "Front — Passenger", side: "front" },
  { key: "rear_inner_driver", label: "Rear Inner — Driver", side: "rear" },
  { key: "rear_inner_passenger", label: "Rear Inner — Passenger", side: "rear" },
  { key: "rear_outer_driver", label: "Rear Outer — Driver", side: "rear" },
  { key: "rear_outer_passenger", label: "Rear Outer — Passenger", side: "rear" },
] as const

export function TyreStep() {
  const dispatch = useDispatch<AppDispatch>()
  const { formData, validationErrors } = useSelector((state: RootState) => state.vehicle)

  const handleTyreExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const sanitized = value.replace(/\D/g, "").slice(0, 4)
    dispatch(setFormData({ [name]: sanitized }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
    if (sanitized.length === 4) {
      const error = validateTyreExpiry(sanitized)
      if (error) dispatch(setValidationErrors({ ...validationErrors, [name]: error }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    const val = type === "number" ? (value ? parseFloat(value) : null) : value
    dispatch(setFormData({ [name]: val }))
    if (validationErrors[name]) dispatch(clearValidationError(name))
  }

  const frontPositions = TYRE_POSITIONS.filter((p) => p.side === "front")
  const rearPositions = TYRE_POSITIONS.filter((p) => p.side === "rear")

  return (
    <div className="space-y-6">
      {/* Hint */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
        <span>
          All tyre fields are required. Expiry format: <strong>WWYY</strong> (e.g., 0124). Depth ≥ 1.6 mm or enter <strong>NV</strong>.
        </span>
      </div>

      {/* Front tyres */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Front Axle</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {frontPositions.map(({ key, label }) => (
            <div key={key} className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <div className="grid grid-cols-2 gap-3">
                <TyreCheckInput
                  label="Expiry"
                  name={`tyre_expiry_${key}`}
                  value={(formData as any)[`tyre_expiry_${key}`]}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors[`tyre_expiry_${key}`]}
                  placeholder="0124"
                />
                <TyreCheckInput
                  label="Depth"
                  name={`tyre_depth_${key}`}
                  value={(formData as any)[`tyre_depth_${key}`]}
                  onChange={handleInputChange}
                  error={validationErrors[`tyre_depth_${key}`]}
                  placeholder="3.5"
                />
                <TyreCheckInput
                  label="Pressure"
                  name={`tyre_pressure_${key}`}
                  value={(formData as any)[`tyre_pressure_${key}`]}
                  onChange={handleInputChange}
                  error={validationErrors[`tyre_pressure_${key}`]}
                  type="number"
                  step="1"
                />
                <TyreCheckInput
                  label="Torque"
                  name={`tyre_torque_${key}`}
                  value={(formData as any)[`tyre_torque_${key}`]}
                  onChange={handleInputChange}
                  error={validationErrors[`tyre_torque_${key}`]}
                  type="number"
                  step="1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rear tyres */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">Rear Axle</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rearPositions.map(({ key, label }) => (
            <div key={key} className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <div className="grid grid-cols-2 gap-3">
                <TyreCheckInput
                  label="Expiry"
                  name={`tyre_expiry_${key}`}
                  value={(formData as any)[`tyre_expiry_${key}`]}
                  onChange={handleTyreExpiryChange}
                  error={validationErrors[`tyre_expiry_${key}`]}
                  placeholder="0124"
                />
                <TyreCheckInput
                  label="Depth"
                  name={`tyre_depth_${key}`}
                  value={(formData as any)[`tyre_depth_${key}`]}
                  onChange={handleInputChange}
                  error={validationErrors[`tyre_depth_${key}`]}
                  placeholder="3.5"
                />
                <TyreCheckInput
                  label="Pressure"
                  name={`tyre_pressure_${key}`}
                  value={(formData as any)[`tyre_pressure_${key}`]}
                  onChange={handleInputChange}
                  error={validationErrors[`tyre_pressure_${key}`]}
                  type="number"
                  step="1"
                />
                {/* Rear inner doesn't have torque — only outer rear */}
                {!key.includes("inner") && (
                  <TyreCheckInput
                    label="Torque"
                    name={`tyre_torque_${key}`}
                    value={(formData as any)[`tyre_torque_${key}`]}
                    onChange={handleInputChange}
                    error={validationErrors[`tyre_torque_${key}`]}
                    type="number"
                    step="1"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
