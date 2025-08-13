'use client';

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCookies } from 'next-client-cookies';
import API_URL from '@/app/utils/ENV';

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
}

interface FormData {
  walkaround_step: string;
  driver: string;
  walkaround_assignee: string;
  vehicle: string;
  date: string;
  time: string;
  milage: string;
  signature: string;
  note: string;
  defects: string;
  walkaround_duration: string;
  status: string;
}

interface WalkAround {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Addwalkaround: React.FC<WalkAround> = ({ setOpen }) => {
  const [formData, setFormData] = useState<FormData>({
    walkaround_step: 'one',
    driver: '',
    walkaround_assignee: 'none',
    vehicle: '',
    date: '',
    time: '',
    milage: '',
    signature: '',
    note: '',
    defects: '',
    walkaround_duration: '',
    status: 'pending',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const cookies = useCookies();
  const token = cookies.get('access_token');

  // Set current date and time on component mount
  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const formattedTime = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
    setFormData((prev) => ({
      ...prev,
      date: formattedDate,
      time: formattedTime,
    }));
  }, []);

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
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type}s: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setErrors({ [type]: result.message || `Failed to fetch ${type}s` });
        }
      } catch (err) {
        setErrors({
          [type]: err instanceof Error ? err.message : `An error occurred while fetching ${type}s`,
        });
      }
    };

    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vehicles/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
          setVehicles(
            result.data.map((vehicle: any) => ({
              id: vehicle.id,
              name: `${vehicle.vehicle_type_name} (${vehicle.registration_number})`,
            })),
          );
        } else {
          setErrors({ vehicle: result.message || 'Failed to fetch vehicles' });
        }
      } catch (err) {
        setErrors({
          vehicle: err instanceof Error ? err.message : 'An error occurred while fetching vehicles',
        });
      }
    };

    fetchProfiles('driver', setDrivers);
    fetchProfiles('manager', setManagers);
    fetchVehicles();
  }, [token]);

  const mapWalkaroundStepToInt = (step: string): number => {
    const stepMap: { [key: string]: number } = {
      one: 1,
      two: 2,
      three: 3,
    };
    return stepMap[step] || 1;
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setFormData((prev) => ({ ...prev, signature: '' }));
    setErrors((prev) => ({ ...prev, signature: undefined }));
  };

  const saveSignature = () => {
    if (sigCanvas.current) {
      const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setFormData((prev) => ({ ...prev, signature: signatureData }));
      setErrors((prev) => ({ ...prev, signature: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors: Partial<FormData> = {};
    if (!formData.driver) newErrors.driver = 'Driver is required.';
    if (!formData.vehicle) newErrors.vehicle = 'Vehicle is required.';
    if (!formData.milage) newErrors.milage = 'Mileage is required.';
    if (!formData.date) newErrors.date = 'Date is required.';
    if (!formData.time) newErrors.time = 'Time is required.';
    if (!formData.signature) newErrors.signature = 'Signature is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const payload = {
      driver: parseInt(formData.driver, 10),
      vehicle: parseInt(formData.vehicle, 10),
      status: formData.status,
      milage: parseFloat(formData.milage),
      walkaround_step: 1,
      walkaround_assignee:
        formData.walkaround_assignee && formData.walkaround_assignee !== 'none'
          ? parseInt(formData.walkaround_assignee, 10)
          : null,
      signature: formData.signature || null,
      date: formData.date,
      time: formData.time,
      note: formData.note || null,
      defects: formData.defects || null,
    };

    try {
      const response = await fetch(`${API_URL}/api/walk-around/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create walkaround: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Walkaround created:', result);

      setFormData({
        walkaround_step: 'one',
        driver: '',
        walkaround_assignee: 'none',
        vehicle: '',
        date: new Date().toISOString().split('T')[0], // Reset to current date
        time: new Date().toTimeString().split(' ')[0].slice(0, 5), // Reset to current time
        milage: '',
        signature: '',
        note: '',
        defects: '',
        walkaround_duration: '',
        status: 'pending',
      });
      sigCanvas.current?.clear();
      setOpen(false);
    } catch (err) {
      setErrors({
        //@ts-expect-error ab thk ha
        form: err instanceof Error ? err.message : 'An error occurred while creating the walkaround.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatName = (name: string): string =>
    name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {
        //@ts-expect-error ab thk ha
        errors.form && <div className="text-red-500">{errors.form}</div>
      }

      {/* Driver */}
      <div>
        <Label>Driver</Label>
        <Select
          value={formData.driver}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, driver: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id.toString()}>
                {`${formatName(driver.full_name)} (${driver.sites
                  .map((site) => site.name)
                  .join(', ')})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                {`${formatName(manager.full_name)} (${manager.sites
                  .map((site) => site.name)
                  .join(', ')})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.walkaround_assignee && (
          <div className="text-red-500 text-sm">{errors.walkaround_assignee}</div>
        )}
      </div>

      {/* Vehicle */}
      <div>
        <Label>Vehicle</Label>
        <Select
          value={formData.vehicle}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, vehicle: value }))
          }
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
        {errors.vehicle && <div className="text-red-500 text-sm">{errors.vehicle}</div>}
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
        {errors.milage && <div className="text-red-500 text-sm">{errors.milage}</div>}
      </div>

      {/* Signature */}
      <div>
        <Label>Signature</Label>
        <div className="border rounded-md">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-40',
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
        {errors.note && <div className="text-red-500 text-sm">{errors.note}</div>}
      </div>

      {/* Defects */}
      <div>
        <Label>Defects</Label>
        <Textarea
          name="defects"
          value={formData.defects}
          onChange={handleFormChange}
        />
        {errors.defects && <div className="text-red-500 text-sm">{errors.defects}</div>}
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, status: value }))
          }
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
        {errors.status && <div className="text-red-500 text-sm">{errors.status}</div>}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Walkaround'}
      </Button>
    </form>
  );
};

export default Addwalkaround;