'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Pencil, AlertTriangle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

interface LogData {
  id: number;
  date: string;
  day: string;
  user_name: string;
  shift_name: string;
  vehicle: number | null;
  start_mileage: number | null;
  end_mileage: number | null;
  duty_start_time: string;
  duty_end_time: string;
  driving_duty_hours: string;
  other_duty_hours: string;
  breaks_taken: string;
  total_duty_time: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type_name: string;
  assignee_driver_name: string | null;
  vehicle_status: string;
}

const toMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === '00:00:00') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const fromMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const DutyTracker = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { id } = params;

  const logDataParam = searchParams.get('logData');
  const logData: LogData | null = logDataParam ? JSON.parse(decodeURIComponent(logDataParam)) : null;

  const token = useCookies().get('access_token');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vehicle selection
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(logData?.vehicle || null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Form fields
  const [startMileage, setStartMileage] = useState(logData?.start_mileage?.toString() || '1265');
  const [endMileage, setEndMileage] = useState(logData?.end_mileage?.toString() || '1100');

  const [dutyStart, setDutyStart] = useState(logData?.duty_start_time?.slice(0, 5) || '09:00');
  const [dutyEnd, setDutyEnd] = useState(logData?.duty_end_time?.slice(0, 5) || '18:00');

  // Time values (HH:MM string)
  const initialDrivingTime = fromMinutes(toMinutes(logData?.driving_duty_hours || '08:00:00'));
  const initialOtherTime = fromMinutes(toMinutes(logData?.other_duty_hours || '08:00:00'));

  const [drivingTime, setDrivingTime] = useState(initialDrivingTime);
  const [otherTime, setOtherTime] = useState(initialOtherTime);

  // Edit mode for each time field
  const [editDriving, setEditDriving] = useState(false);
  const [editOther, setEditOther] = useState(false);

  const drivingMin = timeToMinutes(drivingTime);
  const otherMin = timeToMinutes(otherTime);

  const totalDutyMinutes = useMemo(() => {
    if (!dutyStart || !dutyEnd) return 0;
    const [sh, sm] = dutyStart.split(':').map(Number);
    const [eh, em] = dutyEnd.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 1440;
    return diff;
  }, [dutyStart, dutyEnd]);

  const usedMinutes = drivingMin + otherMin;
  const remainingMinutes = Math.max(totalDutyMinutes - usedMinutes, 0);

  useEffect(() => {
    if (usedMinutes > totalDutyMinutes) {
      setError(`Used time (${minutesToTime(usedMinutes)}) exceeds total duty time (${minutesToTime(totalDutyMinutes)})`);
    } else {
      setError(null);
    }
  }, [usedMinutes, totalDutyMinutes]);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/vehicles/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch vehicles');
        const json = await res.json();
        if (json.success && json.data) {
          setVehicles(json.data);
          const current = json.data.find((v: Vehicle) => v.id === logData?.vehicle);
          if (current) setSelectedVehicleId(current.id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load vehicles');
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, [token, logData?.vehicle]);

  const handleSave = async () => {
    if (!logData?.id) return alert('No log ID found');
    if (error) return alert('Please fix time validation first');

    setIsSaving(true);

    const payload = {
      vehicle: selectedVehicleId,
      start_mileage: startMileage ? Number(startMileage) : null,
      end_mileage: endMileage ? Number(endMileage) : null,
      duty_start_time: dutyStart ? `${dutyStart}:00` : '00:00:00',
      duty_end_time: dutyEnd ? `${dutyEnd}:00` : '00:00:00',
      driving_duty_hours: `${drivingTime}:00`,
      other_duty_hours: `${otherTime}:00`,
      breaks_taken: `${minutesToTime(remainingMinutes)}:00`,
      total_duty_time: `${minutesToTime(totalDutyMinutes)}:00`,
    };

    try {
      const res = await fetch(`${API_URL}/activity/duty-logs/${logData.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.vehicle?.[0] || errData.end_mileage || 'Save failed');
      }

      alert('Saved successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!logData) return <div className="p-8 text-center">No data</div>;

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b px-5 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{logData.day} - {logData.date}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Employee ID: {id || 'EMP001'} • {logData.user_name}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-1 text-base">
          Complete
        </Badge>
      </div>

      <div className="p-5 max-w-5xl mx-auto space-y-6">
        {/* Vehicle + Mileage */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Vehicle Information</h2>
            {loadingVehicles ? (
              <p>Loading vehicles...</p>
            ) : (
              <div className="space-y-4">
                {selectedVehicle && (
                  <div className="bg-blue-50 p-3 rounded-lg text-sm">
                    <span className="font-medium">Currently assigned: </span>
                    <strong>{selectedVehicle.registration_number}</strong> 
                    {' '}({selectedVehicle.make} {selectedVehicle.model})
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500 block mb-2">
                    {selectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}
                  </label>
                  <select
                    value={selectedVehicleId ?? ''}
                    onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-11 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">-- Select a vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.make} {v.model} - {v.vehicle_type_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Mileage Info</h2>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Start Mileage</label>
                <Input type="number" value={startMileage} onChange={e => setStartMileage(e.target.value)} className="h-11" />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">End Mileage</label>
                <Input type="number" value={endMileage} onChange={e => setEndMileage(e.target.value)} className="h-11" />
              </div>
            </div>
          </div>
        </div>

        {/* Duty Times */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Duty Times</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="text-sm text-gray-500 block mb-2">Duty Start Time</label>
              <Input type="time" value={dutyStart} onChange={e => setDutyStart(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-2">Duty End Time</label>
              <Input type="time" value={dutyEnd} onChange={e => setDutyEnd(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-2">Total Duty Time</label>
              <div className="h-11 flex items-center text-xl font-semibold">
                {minutesToTime(totalDutyMinutes)}
              </div>
            </div>
          </div>
        </div>

        {/* Shift Hours Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Shift Hours Breakdown</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Driving Hours */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 text-center relative">
              <div className="text-sm text-orange-800 mb-2">Driving Hours</div>
              {editDriving ? (
                <div className="relative">
                  <Input
                    type="time"
                    value={drivingTime}
                    onChange={(e) => setDrivingTime(e.target.value)}
                    className="text-4xl font-bold text-center text-orange-600 bg-transparent border-none focus:ring-0 h-16 w-full"
                    step="300"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setEditDriving(false)}
                  >
                    <Check size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-4xl font-bold text-orange-600">{drivingTime}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setEditDriving(true)}
                  >
                    <Pencil size={18} />
                  </Button>
                </div>
              )}
            </div>

            {/* Other Duty Hours */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 text-center relative">
              <div className="text-sm text-orange-800 mb-2">Others Duty Hrs (walkaround etc)</div>
              {editOther ? (
                <div className="relative">
                  <Input
                    type="time"
                    value={otherTime}
                    onChange={(e) => setOtherTime(e.target.value)}
                    className="text-4xl font-bold text-center text-orange-600 bg-transparent border-none focus:ring-0 h-16 w-full"
                    step="300"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setEditOther(false)}
                  >
                    <Check size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-4xl font-bold text-orange-600">{otherTime}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setEditOther(true)}
                  >
                    <Pencil size={18} />
                  </Button>
                </div>
              )}
            </div>

            {/* Max Hours Available */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-5 text-center">
              <div className="text-sm text-pink-800 mb-2">Max Hours Available</div>
              <div className="text-4xl font-bold text-pink-600">00:00</div>
            </div>
          </div>
        </div>

        {/* Total Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Total Breakdown</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500 block mb-2">Total Driving Hours</label>
              <div className="h-11 flex items-center text-xl font-medium bg-gray-50 rounded px-4">
                {drivingTime}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-2">Other Hours</label>
              <div className="h-11 flex items-center text-xl font-medium bg-gray-50 rounded px-4">
                {otherTime}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-2">Breaks Taken</label>
              <div className="h-11 flex items-center text-xl font-medium bg-green-50 rounded px-4">
                {minutesToTime(remainingMinutes)}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 text-red-800">
            <AlertTriangle size={24} className="mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Invalid time combination</p>
              <p>{error}</p>
              <p className="mt-2 text-sm">Please reduce Driving or Other Duty hours.</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving || !!error || loadingVehicles}
          className={`w-full h-14 text-lg font-semibold rounded-xl shadow-lg ${
            error || loadingVehicles ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'
          }`}
        >
          {isSaving ? 'Saving...' : error ? 'Fix Error First' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default DutyTracker;