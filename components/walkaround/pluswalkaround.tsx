"use client"

import { useState, useEffect, useRef } from "react"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SignatureCanvas from "react-signature-canvas"
import { useToast } from "@/components/ui/use-toast"

interface Walkaround {
  id: number
  driver: {
    id: number
    full_name: string
    email: string
  }
  vehicle: {
    id: number
    vehicles_type_name: string
    registration_number: string
  }
  conducted_by: string | null
  walkaround_assignee: string | null
  status: "pending" | "failed" | "completed" | "custom"
  date: string
  time: string
  mileage: number
  defects?: string
  notes?: string
  walkaround_step?: number
}

interface Profile {
  id: number
  full_name: string
  avatar: string | null
  email: string
  sites: { id: number; name: string }[]
}

interface Vehicle {
  id: number
  name: string
}

interface PlusWalkaroundProps {
  setOpen: (open: boolean) => void
  refreshWalkarounds: () => void
  parentId: number
  walkaround: Walkaround
}

const PlusWalkaround = ({ setOpen, refreshWalkarounds, parentId, walkaround }: PlusWalkaroundProps) => {
  const [formData, setFormData] = useState({
    driver: walkaround.driver.id.toString(),
    walkaround_assignee: walkaround.walkaround_assignee ? walkaround.walkaround_assignee : "none",
    vehicle: walkaround.vehicle.id.toString(),
    date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    time: new Date().toTimeString().split(" ")[0].slice(0, 5), // Current time in HH:MM format
    milage: "",
    signature: "",
    note: "",
    defects: "",
    status: "pending",
    walkaround_step: (walkaround.walkaround_step || 1).toString(),
  })
  const [errors, setErrors] = useState<Partial<typeof formData>>({})
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [managers, setManagers] = useState<Profile[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const sigCanvas = useRef<SignatureCanvas>(null)
  const cookies = useCookies()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfiles = async (
      type: string,
      setData: React.Dispatch<React.SetStateAction<Profile[]>>,
    ) => {
      try {
        const response = await fetch(`${API_URL}/users/list-names/?role=${type}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type}s: ${response.statusText}`)
        }
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          setErrors({ [type]: result.message || `Failed to fetch ${type}s` })
        }
      } catch (err) {
        setErrors({
          [type]: err instanceof Error ? err.message : `An error occurred while fetching ${type}s`,
        })
      }
    }

    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vehicles/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.statusText}`)
        }
        const result = await response.json()
        if (result.success) {
          setVehicles(
            result.data.map((vehicle: any) => ({
              id: vehicle.id,
              name: `${vehicle.vehicle_type_name} (${vehicle.registration_number})`,
            })),
          )
        } else {
          setErrors({ vehicle: result.message || "Failed to fetch vehicles" })
        }
      } catch (err) {
        setErrors({
          vehicle: err instanceof Error ? err.message : "An error occurred while fetching vehicles",
        })
      }
    }

    fetchProfiles("driver", setDrivers)
    fetchProfiles("manager", setManagers)
    fetchVehicles()
  }, [cookies])

  const formatName = (name: string): string =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const clearSignature = () => {
    sigCanvas.current?.clear()
    setFormData((prev) => ({ ...prev, signature: "" }))
    setErrors((prev) => ({ ...prev, signature: undefined }))
  }

  const saveSignature = () => {
    if (sigCanvas.current) {
      const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
      setFormData((prev) => ({ ...prev, signature: signatureData }))
      setErrors((prev) => ({ ...prev, signature: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const newErrors: Partial<typeof formData> = {}
    if (!formData.driver) newErrors.driver = "Driver is required."
    if (!formData.vehicle) newErrors.vehicle = "Vehicle is required."
    if (!formData.milage) newErrors.milage = "Mileage is required."
    if (!formData.date) newErrors.date = "Date is required."
    if (!formData.time) newErrors.time = "Time is required."
    if (!formData.signature) newErrors.signature = "Signature is required."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const payload = {
      driver: parseInt(formData.driver, 10),
      vehicle: parseInt(formData.vehicle, 10),
      status: formData.status,
      milage: parseFloat(formData.milage),
      walkaround_step: (walkaround.walkaround_step || 1) + 1,
      walkaround_assignee:
        formData.walkaround_assignee && formData.walkaround_assignee !== "none"
          ? parseInt(formData.walkaround_assignee, 10)
          : null,
      conducted_by: parseInt(formData.driver, 10),
      parent: parentId,
      signature: formData.signature || null,
      date: formData.date,
      time: formData.time,
      note: formData.note || null,
      defects: formData.defects || null,
    }

    try {
      const response = await fetch(`${API_URL}/api/walk-around/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Child walkaround added successfully",
        })
        refreshWalkarounds()
        setOpen(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description:
            errorData.message.vehicle?.[0] ||
            errorData.message.driver?.[0] ||
            "Failed to add child walkaround",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "An error occurred while adding the child walkaround",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Vehicle */}
      <div>
        <Label>Vehicle</Label>
        <Select
          value={formData.vehicle}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicle: value }))}
          disabled
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                {vehicle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Current: {walkaround.vehicle.registration_number} ({walkaround.vehicle.vehicles_type_name})
        </p>
        {errors.vehicle && <div className="text-red-500 text-sm">{errors.vehicle}</div>}
      </div>

      {/* Driver */}
      <div>
        <Label>Driver</Label>
        <Select
          value={formData.driver}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, driver: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id.toString()}>
                {`${formatName(driver.full_name)} (${driver.sites.map((site) => site.name).join(", ")})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Current: {walkaround.driver.full_name || walkaround.driver.email}
        </p>
        {errors.driver && <div className="text-red-500 text-sm">{errors.driver}</div>}
      </div>

      {/* Walkaround Assignee */}
      <div>
        <Label>Walkaround Assignee</Label>
        <Select
          value={formData.walkaround_assignee}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, walkaround_assignee: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id.toString()}>
                {`${formatName(manager.full_name)} (${manager.sites.map((site) => site.name).join(", ")})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">Current: {walkaround.walkaround_assignee || "None"}</p>
        {errors.walkaround_assignee && (
          <div className="text-red-500 text-sm">{errors.walkaround_assignee}</div>
        )}
      </div>

      {/* Mileage */}
      <div>
        <Label>Mileage</Label>
        <Input
          type="number"
          name="milage"
          value={formData.milage}
          onChange={handleFormChange}
          step="0.1"
          min="0"
        />
        <p className="text-sm text-gray-500 mt-1">Previous: {walkaround.mileage}</p>
        {errors.milage && <div className="text-red-500 text-sm">{errors.milage}</div>}
      </div>

      {/* Signature */}
      <div>
        <Label>Signature</Label>
        <div className="border rounded-md">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "w-full h-40",
            }}
            onEnd={saveSignature}
          />
        </div>
        <div className="mt-2">
          <Button type="button" variant="outline" onClick={clearSignature} className="mr-2">
            Clear Signature
          </Button>
        </div>
        {errors.signature && <div className="text-red-500 text-sm">{errors.signature}</div>}
      </div>

      {/* Note */}
      <div>
        <Label>Note</Label>
        <Textarea name="note" value={formData.note} onChange={handleFormChange} />
        <p className="text-sm text-gray-500 mt-1">Previous: {walkaround.notes || "None"}</p>
        {errors.note && <div className="text-red-500 text-sm">{errors.note}</div>}
      </div>

      {/* Defects */}
      <div>
        <Label>Defects</Label>
        <Textarea name="defects" value={formData.defects} onChange={handleFormChange} />
        <p className="text-sm text-gray-500 mt-1">Previous: {walkaround.defects || "None"}</p>
        {errors.defects && <div className="text-red-500 text-sm">{errors.defects}</div>}
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">Previous: {walkaround.status}</p>
        {errors.status && <div className="text-red-500 text-sm">{errors.status}</div>}
      </div>

      {/* Walkaround Step */}
      <div>
        <Label>Walkaround Step</Label>
        <Input
          type="number"
          value={(walkaround.walkaround_step || 1) + 1}
          disabled
          className="bg-gray-100"
        />
        <p className="text-sm text-gray-500 mt-1">Previous: {walkaround.walkaround_step || 1}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Child Walkaround"}
        </Button>
      </div>
    </form>
  )
}

export default PlusWalkaround