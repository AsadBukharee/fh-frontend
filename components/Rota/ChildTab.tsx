
'use client'
import React, { useState,JSX } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';

const days: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Shift {
  name: string;
  shift: string;
}

interface Staff {
  name: string;
  role: string;
  department: string;
  status: string;
}

interface SampleShifts {
  [key: string]: Shift[];
}

const ChildTab: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2024, 1)); // February 2024
  const [activeTab, setActiveTab] = useState<'calendar' | 'staff'>('calendar');

  const monthStart: Date = startOfMonth(currentMonth);
  const monthEnd: Date = endOfMonth(currentMonth);
  const daysInMonth: Date[] = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingEmptyDays: null[] = Array(getDay(monthStart)).fill(null);

  const sampleShifts: SampleShifts = {
    '2024-02-02': [
      { name: "John Smith", shift: "Early 8h" },
      { name: "Emma Wilson", shift: "Day 8h" },
    ],
    '2024-02-06': [
      { name: "John Smith", shift: "Early 8h" },
      { name: "Emma Wilson", shift: "Day 8h" },
    ],
    '2024-02-08': [
      { name: "John Smith", shift: "Early 8h" },
      { name: "Emma Wilson", shift: "Day 8h" },
    ],
    '2024-02-14': [
      { name: "John Smith", shift: "Early 8h" },
      { name: "Emma Wilson", shift: "Day 8h" },
    ],
  };

  const staffData: Staff[] = [
    { name: "John Smith", role: "Nurse", department: "Emergency", status: "Active" },
    { name: "Emma Wilson", role: "Doctor", department: "Cardiology", status: "Active" },
  ];

  const handlePrevMonth = (): void => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = (): void => setCurrentMonth(addMonths(currentMonth, 1));

  const renderCalendarView = (): JSX.Element => (
    <>
      {/* Sub header */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-500">Showing: Last Month - Current Month - Next 10 Months</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 py-2 bg-white border">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 bg-white">
        {startingEmptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="h-20 bg-white border border-gray-200" />
        ))}
        
        {daysInMonth.map((day) => {
          const dateKey: string = format(day, 'yyyy-MM-dd');
          const shifts: Shift[] | undefined = sampleShifts[dateKey];
          const dayNumber: string = format(day, 'd');
          
          return (
            <div key={dateKey} className="h-20 bg-white border border-gray-200 p-1 relative">
              <span className="text-xs font-semibold text-gray-700 absolute top-1 left-1">
                {dayNumber}
              </span>
              <div className="mt-4 space-y-1">
                {shifts?.map((shift, idx) => (
                  <div key={idx} className="bg-green-100 text-green-800 rounded text-[9px] px-1 py-0.5 leading-tight">
                    <div className="font-semibold">{shift.name}</div>
                    <div>{shift.shift}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderStaffView = (): JSX.Element => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Staff Directory</h3>
      <div className="grid grid-cols-1 gap-4">
        {staffData.map((staff, idx) => (
          <div key={idx} className="border p-3 rounded-lg">
            <div className="font-semibold">{staff.name}</div>
            <div className="text-sm text-gray-600">Role: {staff.role}</div>
            <div className="text-sm text-gray-600">Department: {staff.department}</div>
            <div className="text-sm text-gray-600">Status: {staff.status}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">12 Month - Rota Overview</h2>
        <p className="text-gray-500 text-sm">View and edit staff schedules across 12 months. Staff appear after all 4 patterns are complete.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {activeTab === 'calendar' && (
            <div className="flex items-center space-x-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0 rounded-full bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="mx-3 text-sm font-semibold min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button 
  variant="outline" 
                size="sm" 
                onClick={handleNextMonth}
                className="h-8 w-8 p-0 rounded-full bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={activeTab === 'staff' ? 'default' : 'outline'} 
            size="sm" 
            className={`text-xs ${activeTab === 'staff' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            All Staff
          </Button>
          <Button 
            variant={activeTab === 'calendar' ? 'default' : 'outline'} 
            size="sm" 
            className={`text-xs ${activeTab === 'calendar' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </Button>
        </div>
      </div>

      {activeTab === 'calendar' ? renderCalendarView() : renderStaffView()}
    </div>
  );
};

export default ChildTab;
