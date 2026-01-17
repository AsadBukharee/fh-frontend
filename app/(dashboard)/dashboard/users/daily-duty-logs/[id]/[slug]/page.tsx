'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
// import { toast } from "@/components/ui/use-toast"; // Uncomment if you use shadcn toast

interface LogData {
  id: number;
  user_week: number;
  child_rota: number;
  shift: number;
  shift_name: string;
  vehicle: string | null;
  date: string;
  day: string;
  start_mileage: number | null;
  end_mileage: number | null;
  duty_start_time: string;
  duty_end_time: string;
  driving_duty_hours: string;
  driving_duty_hours_2: string;
  other_duty_hours: string;
  other_duty_hours_2: string;
  time_spent: string;
  total_duty_time: string;
  breaks_taken: string;
  breaks_taken_2: string;
  on_duty: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
}

const DutyTracker = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params=useParams();
  const {slug,id}=params;

  const logDataParam = searchParams.get('logData');
  const logData: LogData | null = logDataParam 
    ? JSON.parse(decodeURIComponent(logDataParam)) 
    : null;

  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [startMileage, setStartMileage] = useState<string>(logData?.start_mileage?.toString() || '');
  const [endMileage, setEndMileage] = useState<string>(logData?.end_mileage?.toString() || '');
  const [vehicleRegistration, setVehicleRegistration] = useState<string>(logData?.vehicle || '');
const yourToken=useCookies().get('access_token')
  const formatTimeForInput = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return '';
    return timeString.slice(0, 5);
  };

  const [dutyStart, setDutyStart] = useState<string>(formatTimeForInput(logData?.duty_start_time || ''));
  const [dutyEnd, setDutyEnd] = useState<string>(formatTimeForInput(logData?.duty_end_time || ''));

  const parseHoursMinutes = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return { hours: '00', minutes: '00' };
    const [hours, minutes] = timeString.split(':');
    return { hours, minutes };
  };

  const drivingTime = parseHoursMinutes(logData?.driving_duty_hours || '00:00:00');
  const otherTime = parseHoursMinutes(logData?.other_duty_hours || '00:00:00');

  const [drivingHours, setDrivingHours] = useState<string>(drivingTime.hours);
  const [drivingMinutes, setDrivingMinutes] = useState<string>(drivingTime.minutes);
  const [otherHours, setOtherHours] = useState<string>(otherTime.hours);
  const [otherMinutes, setOtherMinutes] = useState<string>(otherTime.minutes);

  const [timeSpent, setTimeSpent] = useState<string>(formatTimeForInput(logData?.time_spent || ''));
  const [breaksTaken, setBreaksTaken] = useState<string>(formatTimeForInput(logData?.breaks_taken || ''));

  // Calculations
  const calculateExtraTime = () => {
    const dutyStartTime = dutyStart || '00:00';
    const dutyEndTime = dutyEnd || '00:00';
    const [startHour, startMin] = dutyStartTime.split(':').map(Number);
    const [endHour, endMin] = dutyEndTime.split(':').map(Number);

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const drivingTotal = parseInt(drivingHours) * 60 + parseInt(drivingMinutes);
    const otherTotal = parseInt(otherHours) * 60 + parseInt(otherMinutes);
    const usedTime = drivingTotal + otherTotal;

    const extraMinutes = totalMinutes - usedTime;
    const hours = Math.floor(Math.abs(extraMinutes) / 60);
    const minutes = Math.abs(extraMinutes) % 60;

    return `${extraMinutes >= 0 ? '' : '-'}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const [extraTime, setExtraTime] = useState<string>(calculateExtraTime());

  useEffect(() => {
    setExtraTime(calculateExtraTime());
  }, [dutyStart, dutyEnd, drivingHours, drivingMinutes, otherHours, otherMinutes]);

  const calculateTotalDutyTime = () => {
    if (!dutyStart || !dutyEnd) return '00:00';

    const [startHour, startMin] = dutyStart.split(':').map(Number);
    const [endHour, endMin] = dutyEnd.split(':').map(Number);

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateWorkBreakdown = () => {
    const totalDutyTime = calculateTotalDutyTime();
    const [totalHours, totalMinutes] = totalDutyTime.split(':').map(Number);
    const totalInMinutes = totalHours * 60 + totalMinutes;

    const drivingTotal = parseInt(drivingHours) * 60 + parseInt(drivingMinutes);
    const otherTotal = parseInt(otherHours) * 60 + parseInt(otherMinutes);
    const usedTime = drivingTotal + otherTotal;

    const remainingTime = totalInMinutes - usedTime;
    const remainingHours = Math.floor(remainingTime / 60);
    const remainingMinutes = remainingTime % 60;

    const usedHours = Math.floor(usedTime / 60);
    const usedMinutes = usedTime % 60;

    return {
      totalDuty: totalDutyTime,
      remaining: `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`,
      used: `${usedHours.toString().padStart(2, '0')}:${usedMinutes.toString().padStart(2, '0')}`
    };
  };

  const workBreakdown = calculateWorkBreakdown();

  const getStatus = () => {
    if (!logData) return 'Unknown';
    if (logData.shift_name === 'OFF') return 'OFF Day';
    if (logData.total_duty_time === '00:00:00') return 'Incomplete';
    return 'Complete';
  };

  type TimeSelectorProps = {
    hours: string;
    minutes: string;
    onHoursChange: (value: string) => void;
    onMinutesChange: (value: string) => void;
    maxAvailable?: string;
  };

  const TimeSelector: React.FC<TimeSelectorProps> = ({ 
    hours, 
    minutes, 
    onHoursChange, 
    onMinutesChange, 
    maxAvailable = "05:30" 
  }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
        <span>Selected Time</span>
        <span className="text-orange-500 font-bold text-lg">{hours}:{minutes}</span>
        <span>Max Available</span>
        <span className="text-pink-500 font-bold text-lg">{maxAvailable}</span>
      </div>

      <div className="flex justify-center items-center gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Hours</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500"
              onClick={() => onHoursChange(Math.max(0, parseInt(hours) - 1).toString().padStart(2, '0'))}>
              <Minus size={14} />
            </Button>
            <div className="w-12 h-8 border rounded flex items-center justify-center bg-orange-500 text-white font-bold">
              {hours}
            </div>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500"
              onClick={() => onHoursChange(Math.min(15, parseInt(hours) + 1).toString().padStart(2, '0'))}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Mins</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500"
              onClick={() => onMinutesChange(Math.max(0, parseInt(minutes) - 5).toString().padStart(2, '0'))}>
              <Minus size={14} />
            </Button>
            <div className="w-12 h-8 border rounded flex items-center justify-center bg-gray-200 text-gray-700 font-bold">
              {minutes}
            </div>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500"
              onClick={() => onMinutesChange(Math.min(55, parseInt(minutes) + 5).toString().padStart(2, '0'))}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 mb-2">
        {['00', '05', '10', '15', '20', '25'].map(time => (
          <button key={time} className="h-8 border border-gray-300 hover:bg-gray-50 rounded text-xs text-gray-600"
            onClick={() => onMinutesChange(time)}>
            {time}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-1">
        {['30', '35', '40', '45', '50', '55'].map(time => (
          <button key={time} className="h-8 border border-gray-300 hover:bg-gray-50 rounded text-xs text-gray-600"
            onClick={() => onMinutesChange(time)}>
            {time}
          </button>
        ))}
      </div>
    </div>
  );

  const handleSave = async () => {
    if (!logData?.id) {
      alert("No log ID found");
      return;
    }

    setIsSaving(true);

    const payload = {
      user: id || undefined,
      date: logData.date,
      day: logData.day,
      vehicle: Number(logData.vehicle) || null,
      start_mileage: startMileage ? Number(startMileage) : null,
      end_mileage: endMileage ? Number(endMileage) : null,
      duty_start_time: dutyStart ? `${dutyStart}:00` : "00:00:00",
      duty_end_time: dutyEnd ? `${dutyEnd}:00` : "00:00:00",
      driving_duty_hours: `${drivingHours.padStart(2,'0')}:${drivingMinutes.padStart(2,'0')}:00`,
      other_duty_hours: `${otherHours.padStart(2,'0')}:${otherMinutes.padStart(2,'0')}:00`,
      time_spent: timeSpent ? `${timeSpent}:00` : "00:00:00",
      breaks_taken: breaksTaken ? `${breaksTaken}:00` : "00:00:00",
      total_duty_time: `${calculateTotalDutyTime()}:00`,
      // You can add more fields if your backend expects them
    };

    try {
      const response = await fetch(`${API_URL}/activity/duty-logs/${logData.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed:
          'Authorization': `Bearer ${yourToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
      }

      alert("Duty log updated successfully!");
      router.refresh();
      // or: router.push('/some-list-page')

    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!logData) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-600">No log data found</div>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-orange-600 hover:text-orange-800 p-2"
          onClick={handleBack}
        >
          <ChevronLeft size={20} /> Back
        </Button>
        <div className="ml-4">
          <h1 className="text-3xl font-bold text-gray-900">{logData.day} - {logData.date}</h1>
          <p className="text-gray-500 text-sm mt-1">Employee: {logData.user_name}</p>
          <p className="text-gray-500 text-sm">Shift: {logData.shift_name}</p>
        </div>
        <Badge className={`ml-auto text-sm font-medium 
          ${getStatus() === 'Complete' ? 'text-green-600 bg-green-100' :
          getStatus() === 'Incomplete' ? 'text-orange-600 bg-orange-100' : 'text-gray-500 bg-gray-100'}`}>
          {getStatus()}
        </Badge>
      </div>

      {/* Vehicle & Mileage */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-700 font-medium mb-3 text-sm">Vehicle Information</h3>
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 text-xs">Vehicle Registration</label>
            <Input 
              value={vehicleRegistration} 
              onChange={(e) => setVehicleRegistration(e.target.value)} 
              placeholder="Enter vehicle registration" 
              className="h-10 text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-700 font-medium mb-3 text-sm">Mileage Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Start Mileage</label>
              <Input 
                type="number" 
                value={startMileage} 
                onChange={(e) => setStartMileage(e.target.value)} 
                className="h-10 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">End Mileage</label>
              <Input 
                type="number" 
                value={endMileage} 
                onChange={(e) => setEndMileage(e.target.value)} 
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Duty Times */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-gray-700 font-medium mb-3 text-sm">Duty Times</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Duty Start Time</label>
            <Input 
              type="time" 
              value={dutyStart} 
              onChange={(e) => setDutyStart(e.target.value)} 
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Duty End Time</label>
            <Input 
              type="time" 
              value={dutyEnd} 
              onChange={(e) => setDutyEnd(e.target.value)} 
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Total Duty Time</label>
            <div className="h-10 flex items-center font-medium text-gray-800">
              {calculateTotalDutyTime()}
            </div>
          </div>
        </div>
      </div>

      {/* Work Breakdown */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
          <div className="text-orange-600 font-bold text-2xl">{workBreakdown.totalDuty}</div>
          <div className="text-xs text-orange-700 mt-1">Total Duty</div>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg text-center border border-pink-200">
          <div className="text-pink-600 font-bold text-2xl">{workBreakdown.remaining}</div>
          <div className="text-xs text-pink-700 mt-1">Remaining</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
          <div className="text-red-600 font-bold text-2xl">{workBreakdown.used}</div>
          <div className="text-xs text-red-700 mt-1">Used</div>
        </div>
      </div>

      {/* Time Selectors */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-gray-700 font-medium mb-3 text-sm">Driving Hours</h3>
          <TimeSelector 
            hours={drivingHours} 
            minutes={drivingMinutes} 
            onHoursChange={setDrivingHours} 
            onMinutesChange={setDrivingMinutes} 
            maxAvailable="15:00"
          />
        </div>
        <div>
          <h3 className="text-gray-700 font-medium mb-3 text-sm">Other Duty Hours</h3>
          <TimeSelector 
            hours={otherHours} 
            minutes={otherMinutes} 
            onHoursChange={setOtherHours} 
            onMinutesChange={setOtherMinutes} 
            maxAvailable="15:00"
          />
        </div>
      </div>

      {/* Break & Notes */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-gray-700 font-medium mb-3 text-sm">Break & Notes</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Time Spent on Duty</label>
            <Input 
              type="time" 
              value={timeSpent} 
              onChange={(e) => setTimeSpent(e.target.value)} 
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Breaks Taken</label>
            <Input 
              type="time" 
              value={breaksTaken} 
              onChange={(e) => setBreaksTaken(e.target.value)} 
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Extra Time</label>
            <Input value={extraTime} readOnly className="h-10 text-sm" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button 
        className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default DutyTracker;