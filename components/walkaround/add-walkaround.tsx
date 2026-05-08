'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useCookies } from 'next-client-cookies'
import API_URL from '@/app/utils/ENV'
import WalkaroundQuestions from './WalkaroundQuestions'
import { useRouter } from 'next/navigation'
import { Car, Gauge, User, CircleCheck, ClipboardList } from 'lucide-react'
interface Walkaround {
  id: number;
  driver: {
    id: number;
    full_name: string;
    email: string;
  };
  vehicle: {
    id: number;
    vehicles_type_name: string;
    registration_number: string;
    last_mileage: string | null;
  };
  conducted_by: string | null;
  walkaround_assignee: string | null;
  status:
  | "pending"
  | "completed"
  | "failed"
  | "minor_roadworthy_defect"
  | "minor_unroadworthy_defect"
  | "major_unroadworthy_defect"
  | "in_progress"
  | "further_work_required";

  date: string;
  time: string;
  mileage: number;
  defects?: string;
  notes?: string;
  walkaround_step?: number;
}
interface Profile {
  id: number;
  full_name: string;
  avatar: string | null;
  email: string;
  sites: { id: number; name: string }[];
}

interface Vehicle {
  id: number;
  name: string;
  vehicle_type_id: number;
  last_mileage: string | null;
}

interface FormData {
  walkaround_step: string
  driver: string
  walkaround_assignee: string
  vehicle: string
  date: string
  time: string
  mileage: string
  signature: string
  note: string
  walkaround_duration: string
  status: string
}

interface WalkAround {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  refreshWalkarounds?: () => void
}

// Updated WalkaroundQuestion Component to accept props
const WalkaroundQuestion: React.FC<{
  isOpen: boolean;
  onComplete: () => void;
  walkaroundId: number | null;
  vehicleId: number | null;
  vehicleTypeId: number | null;
  managers: Profile[];
}> = ({ isOpen, onComplete, walkaroundId, vehicleId, vehicleTypeId, managers }) => {
  if (!isOpen) return null
  return (
    <WalkaroundQuestions
      walkaroundId={walkaroundId}
      vehicleId={vehicleId}
      vehicleTypeId={vehicleTypeId}
      onComplete={onComplete}
      managers={managers}
    />
  )
}

const Addwalkaround: React.FC<WalkAround> = ({ setOpen, refreshWalkarounds }) => {
  const [formData, setFormData] = useState<FormData>({
    walkaround_step: 'one',
    driver: '',
    walkaround_assignee: 'none',
    vehicle: '',
    date: '',
    time: '',
    mileage: '',
    signature: '',
    note: '',
    walkaround_duration: '',
    status: 'completed',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [managers, setManagers] = useState<Profile[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showQuestion, setShowQuestion] = useState(false)
  const STATUS_CHOICES: { value: Walkaround["status"]; label: string }[] = [
    // { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    // { value: "minor_roadworthy_defect", label: "Minor Roadworthy Defect" },
    // { value: "minor_unroadworthy_defect", label: "Minor Unroadworthy Defect" },
    // { value: "major_unroadworthy_defect", label: "Major Unroadworthy Defect" },
    // { value: "in_progress", label: "In Progress" },
    // { value: "further_work_required", label: "Further Work Required" },
  ]
  const [walkaroundId, setWalkaroundId] = useState<number | null>(null)
  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null)

  const cookies = useCookies()
  const token = cookies.get('access_token')

  // Set current date and time on component mount
  useEffect(() => {
    const now = new Date()
    const formattedDate = now.toISOString().split('T')[0]
    const formattedTime = now.toTimeString().split(' ')[0].slice(0, 5)
    setFormData((prev) => ({
      ...prev,
      date: formattedDate,
      time: formattedTime,
    }))
  }, [])

  useEffect(() => {
    const fetchProfiles = async (
      type: string,
      setData: React.Dispatch<React.SetStateAction<Profile[]>>,
    ) => {
      try {
        const response = await fetch(`${API_URL}/users/list-names/?role=${type}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
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
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
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
              vehicle_type_id: vehicle.vehicle_type?.id || vehicle.vehicle_type,
              last_mileage: vehicle.last_mileage ? String(vehicle.last_mileage) : "",
            })),
          )
        } else {
          setErrors({ vehicle: result.message || 'Failed to fetch vehicles' })
        }
      } catch (err) {
        setErrors({
          vehicle: err instanceof Error ? err.message : 'An error occurred while fetching vehicles',
        })
      }
    }

    fetchProfiles('driver', setDrivers)
    fetchProfiles('manager', setManagers)
    fetchVehicles()
  }, [token])

  const mapWalkaroundStepToInt = (step: string): number => {
    const stepMap: { [key: string]: number } = {
      one: 1,
      two: 2,
      three: 3,
    };
    return stepMap[step] || 1
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setLoading(true)

    const newErrors: Partial<FormData> = {}
    if (!formData.driver) newErrors.driver = 'Driver is required.'
    if (!formData.vehicle) newErrors.vehicle = 'Vehicle is required.'
    if (!formData.mileage) newErrors.mileage = 'Mileage is required.'
    if (!formData.date) newErrors.date = 'Date is required.'
    if (!formData.time) newErrors.time = 'Time is required.'
    const previousMileage = Number(vehicles.find((v) => v.id.toString() === formData.vehicle)?.last_mileage ?? 0)
    if (formData.mileage && previousMileage > 0 && Number(formData.mileage) < previousMileage) {
      newErrors.mileage = `Mileage cannot be less than previous mileage (${previousMileage}).`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const payload = {
      driver: parseInt(formData.driver, 10),
      vehicle: parseInt(formData.vehicle, 10),
      status: 'completed',
      milage: parseFloat(formData.mileage),
      walkaround_step: mapWalkaroundStepToInt(formData.walkaround_step),
      walkaround_assignee: null,
      signature: null,
      date: formData.date,
      time: formData.time,
      note: null,
    }

    try {
      const response = await fetch(`${API_URL}/api/walk-around/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to create walkaround: ${response.status} ${errText}`)
      }

      const result = await response.json()
      const createdWalkaroundId = result.data.id
      const createdVehicleId = result.data.vehicle.id

      setWalkaroundId(createdWalkaroundId)
      setVehicleId(createdVehicleId)
      setLoading(false)
      setShowQuestion(true)

    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred while creating the walkaround.')
      setLoading(false)
    }
  }

  const handleQuestionComplete = () => {
    setFormData({
      walkaround_step: 'one',
      driver: '',
      walkaround_assignee: 'none',
      vehicle: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      mileage: '',
      signature: '',
      note: '',
      walkaround_duration: '',
      status: 'completed',
    })
    setShowQuestion(false)
    if (refreshWalkarounds) refreshWalkarounds()
    router.refresh()
    setLoading(false)
    setOpen(false)
  }

  const formatName = (name: string): string =>
    name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

  const selectedVehicle = vehicles.find((v) => v.id.toString() === formData.vehicle)
  const previousMileage = Number(selectedVehicle?.last_mileage ?? 0)
  const requiredFieldsCompleted = Boolean(formData.driver && formData.vehicle && formData.mileage)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">New Walkaround</h2>
              <p className="mt-1 text-sm text-gray-500">
                Select driver, vehicle, and confirm mileage before creating the checklist.
              </p>
            </div>

          </div>
        </div>

        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <User className="h-4 w-4 text-orange-500" />
            Step 1: Choose Driver
          </div>
          <div>
            <Label>Driver</Label>
            <Select
              value={formData.driver}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, driver: value }))
                setErrors((prev) => ({ ...prev, driver: undefined }))
                setFormError(null)
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id.toString()}>
                    {formatName(driver.full_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver && <div className="text-red-500 text-sm">{errors.driver}</div>}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Car className="h-4 w-4 text-orange-500" />
            Step 2: Select Vehicle
          </div>
          <div>
            <Label>Vehicle</Label>
            <Select
              value={formData.vehicle}
              onValueChange={(value) => {
                const vehicle = vehicles.find((v) => v.id.toString() === value)
                if (vehicle) {
                  setVehicleTypeId(vehicle.vehicle_type_id)
                  setFormData((prev) => ({
                    ...prev,
                    vehicle: value,
                    mileage: vehicle.last_mileage || prev.mileage,
                  }))
                } else {
                  setFormData((prev) => ({ ...prev, vehicle: value }))
                }
                setErrors((prev) => ({ ...prev, vehicle: undefined, mileage: undefined }))
                setFormError(null)
              }}
            >
              <SelectTrigger className="h-11">
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
            {errors.vehicle && <div className="text-red-500 text-sm">{errors.vehicle}</div>}
          </div>
          {selectedVehicle?.last_mileage && (
            <p className="text-xs text-gray-500">
              Last recorded mileage for selected vehicle: <span className="font-semibold">{selectedVehicle.last_mileage}</span>
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Gauge className="h-4 w-4 text-orange-500" />
            Step 3: Confirm Mileage
          </div>
          <div>
            <Label>Mileage</Label>
            <Input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={(e) => {
                handleFormChange(e)
                if (previousMileage > 0 && Number(e.target.value) < previousMileage) {
                  setErrors((prev) => ({
                    ...prev,
                    mileage: `Mileage cannot be less than previous mileage (${previousMileage}).`,
                  }))
                }
              }}
              step="0.1"
              min={previousMileage > 0 ? previousMileage : 0}
              placeholder={selectedVehicle?.last_mileage || 'Enter mileage'}
            />
            <p className="mt-1 text-xs text-gray-500">Auto-filled when available. You can edit it.</p>
            {errors.mileage && <div className="text-red-500 text-sm">{errors.mileage}</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="h-11 min-w-44 bg-orange-600 hover:bg-orange-700">
              {loading ? 'Creating...' : 'Create Walkaround'}
            </Button>
          </div>
          {!requiredFieldsCompleted && (
            <p className="mt-2 text-right text-xs text-gray-500">Complete all required fields to continue.</p>
          )}
        </div>


      </form>

      {/* WalkaroundQuestion Dialog */}
      <WalkaroundQuestion
        isOpen={showQuestion}
        onComplete={handleQuestionComplete}
        walkaroundId={walkaroundId}
        vehicleId={vehicleId}
        vehicleTypeId={vehicleTypeId}
        managers={managers}
      />
    </>
  )
}

export default Addwalkaround