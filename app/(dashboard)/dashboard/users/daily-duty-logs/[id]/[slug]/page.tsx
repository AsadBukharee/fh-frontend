'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DutyTracker = () => {
  const [startMileage, setStartMileage] = useState('1000');
  const [endMileage, setEndMileage] = useState('1100');
  const [dutyStart, setDutyStart] = useState('09:00');
  const [dutyEnd, setDutyEnd] = useState('18:00');
  const [drivingHours, setDrivingHours] = useState('08');
  const [drivingMinutes, setDrivingMinutes] = useState('00');
  const [otherHours, setOtherHours] = useState('08');
  const [otherMinutes, setOtherMinutes] = useState('00');
  const [timeSpent, setTimeSpent] = useState('09:00');
  const [breaksTaken, setBreaksTaken] = useState('18:00');
  const [extraTime, setExtraTime] = useState('8:00');

  type TimeSelectorProps = {
    hours: string;
    minutes: string;
    onHoursChange: (value: string) => void;
    onMinutesChange: (value: string) => void;
    maxAvailable?: string;
  };

  const TimeSelector: React.FC<TimeSelectorProps> = ({ hours, minutes, onHoursChange, onMinutesChange, maxAvailable = "05:30" }) => (
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
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500">
              <Minus size={14} />
            </Button>
            <div className="w-12 h-8 border rounded flex items-center justify-center bg-orange-500 text-white font-bold">
              {hours}
            </div>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500">
              <Plus size={14} />
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Mins</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500">
              <Minus size={14} />
            </Button>
            <div className="w-12 h-8 border rounded flex items-center justify-center bg-gray-200 text-gray-700 font-bold">
              {minutes}
            </div>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-gray-500">
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Time grid - first row */}
      <div className="grid grid-cols-6 gap-1 mb-2">
        {['00', '05', '10', '15', '20', '25'].map(time => (
          <button key={time} className="h-8 border border-gray-300 hover:bg-gray-50 rounded text-xs text-gray-600">
            {time}
          </button>
        ))}
      </div>
      
      {/* Time grid - second row */}
      <div className="grid grid-cols-6 gap-1">
        {['30', '35', '40', '45', '50', '55'].map(time => (
          <button key={time} className="h-8 border border-gray-300 hover:bg-gray-50 rounded text-xs text-gray-600">
            {time}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
       <Button variant="ghost" className=" mt-10 ml-10 bg-orange-600/10 rounded-none text-orange-600 w-[80px] h-[40px] p-0  hover:text-blue-100">
            <ChevronLeft size={20} className="mr-1" />
            Back
          </Button>
      <div className="bg-white p-4">
        <div className="flex items-center justify-between text-white">
         
          <div className="text-left">
            <div className="font-medium  text-4xl text-black">Monday - 1/15/2024</div>
            <div className="text-md text-gray-500">Employee: EMP001</div>
          </div>
          <Badge className="text-green-400 bg-green-100 text-sm font-medium">Complete</Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Vehicle Information & Mileage */}
        <div className="flex w-full justify-evenly items-center gap-4">
          <div className="bg-white rounded-lg  flex w-full p-4 shadow-sm">
         <div className="">
             <h3 className="font-medium text-sm mb-3 text-gray-700">Vehicle Information</h3>
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Vehicle Registration</div>
               <Input 
                  value="AB12 CDE" 
                  onChange={(e) => setStartMileage(e.target.value)}
                  className="h-8 text-sm"
                />
            </div>
         </div>
            <div className="">
               <h3 className="font-medium text-sm mb-3 text-gray-700">Mileage Info</h3>
            <div className="space-y-2 flex">
              <div>
                <div className="text-xs text-gray-500 mb-1">Start Mileage</div>
                <Input 
                  value={startMileage} 
                  onChange={(e) => setStartMileage(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">End Mileage</div>
                <Input 
                  value={endMileage} 
                  onChange={(e) => setEndMileage(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            </div>
          </div>
          
         
        </div>

        {/* Duty Times */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-sm mb-3 text-gray-700">Duty Times</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Duty Start Time</div>
              <Input 
                value={dutyStart} 
                onChange={(e) => setDutyStart(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Duty End Time</div>
              <Input 
                value={dutyEnd} 
                onChange={(e) => setDutyEnd(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Duty Time</div>
              <div className="h-8 flex items-center font-medium text-gray-800">8:00</div>
            </div>
          </div>
        </div>

        {/* Work Breakdown */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-sm mb-3 text-gray-700">Work Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-100 p-4 rounded-lg text-center border border-orange-200">
              <div className="font-bold text-2xl text-orange-600">08:00</div>
              <div className="text-xs text-orange-700 mt-1">Total Duty</div>
            </div>
            <div className="bg-pink-100 p-4 rounded-lg text-center border border-pink-200">
              <div className="font-bold text-2xl text-pink-600">00:30</div>
              <div className="text-xs text-pink-700 mt-1">Remaining</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center border border-red-200">
              <div className="font-bold text-2xl text-red-600">07:30</div>
              <div className="text-xs text-red-700 mt-1">Used</div>
            </div>
          </div>
        </div>

        {/* Driving Hours */}
        <div>
          <h3 className="font-medium text-sm mb-3 text-gray-700">Driving Hours</h3>
          <TimeSelector
            hours={drivingHours}
            minutes={drivingMinutes}
            onHoursChange={setDrivingHours}
            onMinutesChange={setDrivingMinutes}
          />
        </div>

        {/* Others Duty Hours */}
        <div>
          <h3 className="font-medium text-sm mb-3 text-gray-700">Others Duty Hrs (walkaround etc)</h3>
          <TimeSelector
            hours={otherHours}
            minutes={otherMinutes}
            onHoursChange={setOtherHours}
            onMinutesChange={setOtherMinutes}
          />
        </div>

        {/* Break & Notes */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-sm mb-3 text-gray-700">Break & Notes</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Time spent on Duty</div>
              <Input 
                value={timeSpent} 
                onChange={(e) => setTimeSpent(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Breaks Taken</div>
              <Input 
                value={breaksTaken} 
                onChange={(e) => setBreaksTaken(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Extra Time</div>
              <Input 
                value={extraTime} 
                onChange={(e) => setExtraTime(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button className="w-full bg-pink-300 text-gray-800 hover:bg-pink-400 h-12 text-base font-medium rounded-lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default DutyTracker;