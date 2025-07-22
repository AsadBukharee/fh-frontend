import React, { useState, useEffect } from 'react';
import {  Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

// TypeScript Interfaces (unchanged from previous)
interface ShiftDetail {
  name: string;
  hours_from: string;
  hours_to: string;
  total_hours: string;
  rate_per_hours: number;
  shift_note: string;
  colors: string;
}

interface Shift {
  shift_id: number;
  shift_detail: ShiftDetail;
}

interface Week {
  [day: string]: Shift;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  display_name: string;
  parent_rota_completed: boolean;
  child_rota_completed: boolean;
  contract: {
    id: number;
    name: string;
    description: string;
  };
}

interface UserRota {
  user: User;
  week1: Week;
  week2: Week;
  week3: Week;
  week4: Week;
  stats: {
    current_week: number;
    started_by: number;
    started_by_name: string;
    started_at: string;
    created_at: string;
    updated_at: string;
  };
}

interface ApiResponse {
  users: UserRota[];
  total_users: number;
  total_rotas: number;
}

interface Day {
  day: string;
  date: string;
}

interface EmployeeShift {
  type: string;
  time: string;
  hours: string;
  bgColor: string;
  shiftId: number;
}

interface Employee {
  id: number;
  name: string;
  status?: string;
  shifts: (EmployeeShift | 'dropdown' | null)[];
}

const ParentTab: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<string>('week2'); // Default to week2
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openShiftIndex, setOpenShiftIndex] = useState<string | null>(null);
  const cookies = useCookies();
  const token = cookies.get('access_token');

  // Dynamic days based on selected week
  const getWeekDates = (week: string): Day[] => {
    const baseDate = new Date(2025, 6, 21); // July 21, 2025, start of week1
    const weekOffset = parseInt(week.slice(-1)) - 1;
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'][i],
        date: `${date.getMonth() + 1}/${date.getDate()}`,
      };
    });
  };

  const days = getWeekDates(selectedWeek);

  // Determine the current week based on date (overriding API stats for week2 focus)
  const getCurrentWeek = (): string => {
    const currentDate = new Date(2025, 6, 22); // July 22, 2025
    const week1Start = new Date(2025, 6, 21);
    const week2Start = new Date(2025, 6, 28);
    const week3Start = new Date(2025, 7, 4);
    const week4Start = new Date(2025, 7, 11);

    if (currentDate >= week1Start && currentDate < week2Start) return 'week1';
    if (currentDate >= week2Start && currentDate < week3Start) return 'week2';
    if (currentDate >= week3Start && currentDate < week4Start) return 'week3';
    return 'week4';
  };

  useEffect(() => {
    const fetchRota = async () => {
      try {
        setLoading(true);
        setError(null);
        const weekNumber = parseInt(selectedWeek.slice(-1));
        const response = await fetch(`${API_URL}/api/rota/parent-rota/?week=${weekNumber}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();

        if (!data.users.length) {
          throw new Error('No users found in the response');
        }

        const newEmployees = data.users.map((userRota) => {
          const weekData = userRota[selectedWeek as keyof UserRota] as Week;
          const shifts: (EmployeeShift | 'dropdown' | null)[] = days.map((day) => {
            const shift = weekData[day.day];
            if (!shift) return null;
            return {
              type: shift.shift_detail.name,
              time: `${shift.shift_detail.hours_from.slice(0, 5)}-${shift.shift_detail.hours_to.slice(0, 5)}`,
              hours: shift.shift_detail.total_hours,
              bgColor: shift.shift_detail.colors,
              shiftId: shift.shift_id,
            };
          });

          return {
            id: userRota.user.id,
            name: userRota.user.display_name || 'Unknown User',
            status: userRota.user.parent_rota_completed ? 'Completed' : 'Incomplete',
            shifts,
          };
        });

        setEmployees(newEmployees);
        setFilteredEmployees(newEmployees);
      } catch (error) {
        console.error('Error fetching rota:', error);
        setError('Failed to load schedule. Please try again.');
        setEmployees([]);
        setFilteredEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRota();
    } else {
      setError('Authentication token not found.');
      setLoading(false);
    }
  }, [selectedWeek, token]);

  // Handle user search
  useEffect(() => {
    const filtered = employees.filter((employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  // Mocked shift options (ideally fetched from API)
  const shiftOptions: EmployeeShift[] = [
    {
      type: 'Morning Shift',
      time: '06:00-14:00',
      hours: '8h',
      bgColor: '#FFFFFF',
      shiftId: 0,
    },
    {
      type: 'Split Shift',
      time: '07:00-11:00',
      hours: '4h',
      bgColor: '#90EE90',
      shiftId: 0,
    },
  ];

  const selectShift = (userIndex: number, shiftIndex: number, shift: EmployeeShift) => {
    setEmployees((prev) => {
      const newEmployees = [...prev];
      const newShifts = [...newEmployees[userIndex].shifts];
      newShifts[shiftIndex] = shift;
      newEmployees[userIndex] = { ...newEmployees[userIndex], shifts: newShifts };
      return newEmployees;
    });
    setFilteredEmployees((prev) => {
      const newEmployees = [...prev];
      if (newEmployees[userIndex]) {
        const newShifts = [...newEmployees[userIndex].shifts];
        newShifts[shiftIndex] = shift;
        newEmployees[userIndex] = { ...newEmployees[userIndex], shifts: newShifts };
      }
      return newEmployees;
    });
    setOpenShiftIndex(null);
  };

  const toggleShiftSelection = (key: string) => {
    setOpenShiftIndex(openShiftIndex === key ? null : key);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredEmployees(employees);
  };

  if (loading) {
    return <div className="p-4 text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {['week1', 'week2', 'week3', 'week4'].map((week) => (
            <Badge
              key={week}
              variant={selectedWeek === week ? 'default' : 'outline'}
              className={`cursor-pointer px-3 py-1 text-sm flex items-center space-x-1 ${
                selectedWeek === week
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : week === getCurrentWeek()
                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedWeek(week)}
              aria-label={`Select Week ${week.slice(-1)}${week === getCurrentWeek() ? ' (Current Week)' : ''}`}
            >
              <span>{`Week ${week.slice(-1)}`}</span>
              {week === getCurrentWeek() && (
                <span className="w-2 h-2 bg-green-500 rounded-full" aria-label="Current week" />
              )}
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 text-sm pr-10"
              aria-label="Search users by name"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>Authorised Vehicles 6</span>
            <span>Active Pattern 4</span>
          </div>
        </div>
      </div>

      {/* Pattern Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">Pattern 1 - Weekly Schedule</h2>
          <p className="text-sm text-gray-500">See Most One Schedule</p>
        </div>
        <Badge className="bg-pink-100 text-pink-700 px-3 py-1 text-sm font-medium hover:bg-pink-200">
          {`Week ${selectedWeek.slice(-1)}`}
        </Badge>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
          <div className="p-3 text-sm font-medium text-gray-700 border-r border-gray-200">Staff Member</div>
          {days.map((day, index) => (
            <div key={index} className="p-3 text-center border-r border-gray-200 last:border-r-0">
              <div className="text-sm font-medium text-gray-700">{day.day}</div>
              <div className="text-xs text-gray-500 mt-0.5">{day.date}</div>
            </div>
          ))}
        </div>

        {/* Employee Rows or Empty Message */}
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee, userIndex) => (
            <div key={userIndex} className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200 flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  {employee.status && (
                    <Badge
                      className={`text-xs px-2 py-0.5 mt-1 ${
                        employee.status === 'Completed' ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'
                      }`}
                    >
                      {employee.status}
                    </Badge>
                  )}
                </div>
              </div>
              {employee.shifts.map((shift, shiftIndex) => (
                <div
                  key={shiftIndex}
                  className="p-2 border-r border-gray-200 last:border-r-0 min-h-[70px] flex items-center justify-center relative"
                >
                  {shift === 'dropdown' || shift === null ? (
                    <Popover
                      open={openShiftIndex === `${userIndex}-${shiftIndex}`}
                      onOpenChange={() => toggleShiftSelection(`${userIndex}-${shiftIndex}`)}
                    >
                      <PopoverTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`w-full h-10 text-xs flex items-center justify-center cursor-pointer ${
                            shift === 'dropdown'
                              ? 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                              : 'border-dashed border-gray-300 text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          {shift === 'dropdown' ? (
                            <span>RD</span>
                          ) : (
                            <>
                              <Edit className="w-3 h-3 mr-1" />
                              Click to assign
                            </>
                          )}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        <div className="space-y-1">
                          {shiftOptions.length > 0 ? (
                            shiftOptions.map((option, optionIndex) => (
                              <Button
                                key={optionIndex}
                                variant="ghost"
                                className="w-full text-left text-xs px-2 py-1.5 hover:bg-gray-100"
                                onClick={() => selectShift(userIndex, shiftIndex, option)}
                              >
                                <div className="font-medium">{option.type}</div>
                                {option.time && <div className="text-gray-500 ml-2">{option.time}</div>}
                                {option.hours && <div className="text-gray-500 ml-2">{option.hours}</div>}
                              </Button>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-xs text-gray-500">No shift options available</div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Badge
                      className="border rounded px-2 py-1 text-center w-full"
                      style={{ backgroundColor: shift.bgColor, color: shift.bgColor === '#FFFFFF' ? '#000000' : '#000000' }}
                    >
                      <div className="text-xs font-semibold">{shift.type}</div>
                      {shift.time && <div className="text-xs mt-0.5">{shift.time}</div>}
                      {shift.hours && <div className="text-xs">{shift.hours}</div>}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-600 col-span-8">
            No matching users found.{' '}
            <Button variant="link" onClick={clearSearch} className="text-blue-600 p-0">
              Clear search
            </Button>
            .
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentTab;