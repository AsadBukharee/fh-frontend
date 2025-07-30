"use client"
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit, X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import StartRota from "./StartRota";

// TypeScript Interfaces
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

interface UserShift {
  id: number;
  name: string;
  template: boolean;
  hours_from: string;
  hours_to: string;
  total_hours: string;
  shift_note: string;
  rate_per_hours: number;
  colors: string;
  contract: number;
  created_at: string;
  updated_at: string;
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
  shifts: UserShift[];
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
  rate_per_hours: number;
  shift_note: string;
}

interface Employee {
  id: number;
  name: string;
  status?: string;
  shifts: (EmployeeShift | "dropdown" | null)[];
  allWeeksShifts: {
    week1: (EmployeeShift | "dropdown" | null)[];
    week2: (EmployeeShift | "dropdown" | null)[];
    week3: (EmployeeShift | "dropdown" | null)[];
    week4: (EmployeeShift | "dropdown" | null)[];
  };
  availableShifts: EmployeeShift[];
}

interface TempShiftSelection {
  [employeeId: number]: {
    [week: string]: (EmployeeShift | "dropdown" | null)[];
  };
}

// Helper function to check for shift changes
const hasShiftChanges = (
  employee: Employee,
  tempSelections: TempShiftSelection,
): boolean => {
  const employeeSelections = tempSelections[employee.id] || {
    week1: [],
    week2: [],
    week3: [],
    week4: [],
  };
  const weeks = ["week1", "week2", "week3", "week4"] as const;
  for (const week of weeks) {
    const tempShifts = employeeSelections[week] || employee.allWeeksShifts[week];
    const originalShifts = employee.allWeeksShifts[week];
    if (tempShifts.length !== originalShifts.length) return true;
    for (let i = 0; i < tempShifts.length; i++) {
      const tempShift = tempShifts[i];
      const originalShift = originalShifts[i];
      if (tempShift === null && originalShift === null) continue;
      if (tempShift === "dropdown" && originalShift === "dropdown") continue;
      if (tempShift && originalShift && tempShift !== "dropdown" && originalShift !== "dropdown") {
        if (tempShift.shiftId !== originalShift.shiftId) return true;
      } else if (tempShift !== originalShift) {
        return true;
      }
    }
  }
  return false;
}

// Function to validate if Save Rota button should be enabled
const isRotaButtonEnabled = (
  employee: Employee,
  tempShiftSelections: TempShiftSelection,
): boolean => {
  const employeeSelections = tempShiftSelections[employee.id] || {
    week1: [],
    week2: [],
    week3: [],
    week4: [],
  };

  const weeks = ["week1", "week2", "week3", "week4"] as const;
  let hasOneWeekWithSevenShifts = false;
  let week4ShiftCount = 0;
  let filledWeeks = 0;

  for (const week of weeks) {
    const weekShifts = employeeSelections[week]?.length
      ? employeeSelections[week]
      : employee.allWeeksShifts[week];
    
    // Count non-null and non-dropdown shifts in the week
    const shiftCount = weekShifts.filter(
      (shift) => shift && shift !== "dropdown" && shift !== null
    ).length;

    // Check if this week has 7 shifts
    if (shiftCount === 7) {
      hasOneWeekWithSevenShifts = true;
    }

    // Track week4 shift count
    if (week === "week4") {
      week4ShiftCount = shiftCount;
    }

    // Count weeks with 7 shifts
    if (shiftCount === 7) {
      filledWeeks++;
    }
  }

  // Condition 1: At least one week must have 7 shifts
  if (!hasOneWeekWithSevenShifts) {
    return false;
  }

  // Condition 2: If all 4 weeks are not filled (7 shifts each), and week4 has exactly 5 shifts, disable until 7 shifts
  if (filledWeeks < 4 && week4ShiftCount === 5) {
    return false;
  }

  // If all conditions are met or all weeks are filled, enable the button
  return true;
};

// Memoized ShiftCell component
const ShiftCell = memo(({
  shift,
  isOpen,
  onToggle,
  onSelect,
  onClear,
  onEdit,
  availableShifts,
}: {
  shift: EmployeeShift | "dropdown" | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (shift: EmployeeShift) => void;
  onClear: () => void;
  onEdit: (shift: EmployeeShift) => void;
  availableShifts: EmployeeShift[];
}) => {
  return (
    <div className="min-h-[50px] flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={onToggle}>
        <PopoverTrigger asChild>
          {shift === "dropdown" || shift === null ? (
            <Badge
              variant="outline"
              className={`w-full max-w-[110px] h-12 text-xs flex items-center justify-center cursor-pointer ${
                shift === "dropdown"
                  ? "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  : "border-dashed border-gray-300 text-gray-400 hover:border-gray-400"
              }`}
            >
              {shift === "dropdown" ? (
                <span>RD</span>
              ) : (
                <div className="flex flex-col items-center">
                  <Edit className="w-3 h-3 mb-1" />
                  <span className="text-xs">Assign</span>
                </div>
              )}
            </Badge>
          ) : (
            <div
              className="border-dotted rounded-lg flex flex-col justify-center items-center px-2 py-2 text-center w-full max-w-[120px] h-[60px] cursor-pointer hover:opacity-80 transition-opacity relative group text-xs"
              style={{
                backgroundColor: shift.bgColor,
                color: shift.bgColor === "#FFFFFF" || shift.bgColor === "#ffffff" ? "#000000" : "#000000",
                borderColor: shift.bgColor === "#FFFFFF" || shift.bgColor === "#ffffff" ? "#e5e7eb" : shift.bgColor,
              }}
            >
              <div className="font-semibold flex items-center text-xs leading-tight mb-1" title={shift.type}>
                {shift.type.length > 8 ? shift.type.substring(0, 8) + "..." : shift.type}
                <ChevronDown className="w-4 h-4 ml-1" />
              </div>
              <div className="text-xs leading-tight" title={shift.time}>
                {shift.time}
              </div>
              <Edit className="w-3 h-3 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="text-xs font-medium text-gray-700">Available Shifts ({availableShifts.length})</div>
              {shift && shift !== "dropdown" && shift !== null && (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(shift)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 h-auto text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 h-auto text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
            {availableShifts.length > 0 ? (
              availableShifts.map((option, optionIndex) => (
                <Button
                  key={optionIndex}
                  variant="ghost"
                  className={`w-full text-left text-xs px-2 py-2 hover:bg-gray-100 h-auto ${
                    shift && shift !== "dropdown" && shift !== null && shift.shiftId === option.shiftId
                      ? "bg-blue-50 border border-blue-200"
                      : ""
                  }`}
                  onClick={() => onSelect(option)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{option.type}</div>
                      <div className="text-gray-500 truncate">
                        {option.time} • {option.hours}
                      </div>
                      <div className="text-gray-400 text-xs">£{option.rate_per_hours}/hr</div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: option.bgColor }} />
                      {shift && shift !== "dropdown" && shift !== null && shift.shiftId === option.shiftId && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))
            ) : (
              <div className="px-2 py-1.5 text-xs text-gray-500">No shift options available</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
ShiftCell.displayName = "ShiftCell";

// Modified EmployeeRow component
const EmployeeRow = memo(
  ({
    employee,
    userIndex,
    openShiftIndex,
    onToggleShift,
    onSelectShift,
    onClearShift,
    onEditShift,
    onStartRota,
    generatingRota,
    rotaGenerated,
    tempShiftSelections,
  }: {
    employee: Employee;
    userIndex: number;
    openShiftIndex: string | null;
    onToggleShift: (key: string) => void;
    onSelectShift: (userIndex: number, shiftIndex: number, shift: EmployeeShift) => void;
    onClearShift: (userIndex: number, shiftIndex: number) => void;
    onEditShift: (shift: EmployeeShift) => void;
    onStartRota: (employeeId: number) => void;
    generatingRota: boolean;
    rotaGenerated: { [key: number]: boolean };
    tempShiftSelections: TempShiftSelection;
  }) => {
    const handleSelectShift = useCallback(
      (shiftIndex: number, shift: EmployeeShift) => {
        onSelectShift(userIndex, shiftIndex, shift);
      },
      [userIndex, onSelectShift],
    );
    const handleClearShift = useCallback(
      (shiftIndex: number) => {
        onClearShift(userIndex, shiftIndex);
      },
      [userIndex, onClearShift],
    );
    const handleStartRota = useCallback(() => {
      onStartRota(employee.id);
    }, [employee.id, onStartRota]);

    // Check if there are shift changes for this employee
    const hasChanges = hasShiftChanges(employee, tempShiftSelections);

    // Check if the Save Rota button should be enabled
    const isButtonEnabled = isRotaButtonEnabled(employee, tempShiftSelections);

    return (
      <TableRow key={employee.id}>
        <TableCell className="w-[200px] min-w-[200px]">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium" title={employee.name}>
                {employee.name.length > 20 ? employee.name.substring(0, 20) + "..." : employee.name}
              </div>
              {employee.status && (
                <Badge
                  className={`text-xs px-2 py-0.5 mt-1 ${
                    employee.status === "Completed" ? "text-green-600 bg-green-100" : "text-orange-600 bg-orange-100"
                  }`}
                >
                  {employee.status}
                </Badge>
              )}
            </div>
          </div>
        </TableCell>
        {employee.shifts.map((shift, shiftIndex) => (
          <TableCell key={shiftIndex} className="w-[130px] min-w-[130px] p-2">
            <ShiftCell
              shift={shift}
              isOpen={openShiftIndex === `${userIndex}-${shiftIndex}`}
              onToggle={() => onToggleShift(`${userIndex}-${shiftIndex}`)}
              onSelect={(shift) => handleSelectShift(shiftIndex, shift)}
              onClear={() => handleClearShift(shiftIndex)}
              onEdit={onEditShift}
              availableShifts={employee.availableShifts}
            />
          </TableCell>
        ))}
        <TableCell className="w-[120px] min-w-[120px] text-center">
          <Button
            size="sm"
            onClick={handleStartRota}
            disabled={generatingRota || rotaGenerated[employee.id] || !hasChanges || !isButtonEnabled}
            style={{
              background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
              width: 'auto',
              height: 'auto',
            }}
            className="px-3 cursor-pointer py-2"
          >
            Save Rota
          </Button>
        </TableCell>
      </TableRow>
    );
  },
);
EmployeeRow.displayName = "EmployeeRow";

// Debounce hook
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const ParentTab: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<string>("week2");
  const [cachedApiData, setCachedApiData] = useState<UserRota[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openShiftIndex, setOpenShiftIndex] = useState<string | null>(null);
  const [tempShiftSelections, setTempShiftSelections] = useState<TempShiftSelection>({});
  const [showRotaModal, setShowRotaModal] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedWeekForApply, setSelectedWeekForApply] = useState<string>("week1");
  const [applyToAll, setApplyToAll] = useState<boolean>(false);
  const [generatingRota, setGeneratingRota] = useState<boolean>(false);
  const [rotaGenerated, setRotaGenerated] = useState<{ [key: number]: boolean }>({});
  console.log(setRotaGenerated)
  // State for edit shift modal
  const [showEditShiftModal, setShowEditShiftModal] = useState<boolean>(false);
  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null);
  const [editShiftForm, setEditShiftForm] = useState({
    name: "",
    template: true,
    hours_from: "",
    hours_to: "",
    shift_note: "",
    rate_per_hours: 0,
    colors: "#FFFFFF",
  });
  const [editShiftLoading, setEditShiftLoading] = useState<boolean>(false);

  const cookies = useCookies();
  const token = cookies.get("access_token");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized date calculations
  const getWeekDates = useCallback((week: string): Day[] => {
    const baseDate = new Date(2025, 6, 21);
    const weekOffset = Number.parseInt(week.slice(-1)) - 1;
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return {
        day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i],
        date: `${date.getMonth() + 1}/${date.getDate()}`,
      };
    });
  }, []);

  const getCurrentWeek = useCallback((): string => {
    const currentDate = new Date(2025, 6, 22);
    const week1Start = new Date(2025, 6, 21);
    const week2Start = new Date(2025, 6, 28);
    const week3Start = new Date(2025, 7, 4);
    const week4Start = new Date(2025, 7, 11);
    if (currentDate >= week1Start && currentDate < week2Start) return "week1";
    if (currentDate >= week2Start && currentDate < week3Start) return "week2";
    if (currentDate >= week3Start && currentDate < week4Start) return "week3";
    return "week4";
  }, []);

  const convertUserShiftsToEmployeeShifts = useCallback((userShifts: UserShift[]): EmployeeShift[] => {
    return userShifts.map((shift) => ({
      type: shift.name,
      time: `${shift.hours_from.slice(0, 5)}-${shift.hours_to.slice(0, 5)}`,
      hours: shift.total_hours,
      bgColor: shift.colors,
      shiftId: shift.id,
      rate_per_hours: shift.rate_per_hours,
      shift_note: shift.shift_note,
    }));
  }, []);

  const employees = useMemo(() => {
    if (cachedApiData.length === 0) return [];
    const days = getWeekDates(selectedWeek);
    return cachedApiData.map((userRota: UserRota) => {
      const availableShifts = convertUserShiftsToEmployeeShifts(userRota.user.shifts);
      const allWeeksShifts = {
        week1: getWeekDates("week1").map((day: Day, index: number) => {
          const tempShift = tempShiftSelections[userRota.user.id]?.week1?.[index];
          if (tempShift !== undefined) return tempShift;
          const shift = userRota.week1[day.day];
          if (!shift) return null;
          return {
            type: shift.shift_detail.name,
            time: `${shift.shift_detail.hours_from.slice(0, 5)}-${shift.shift_detail.hours_to.slice(0, 5)}`,
            hours: shift.shift_detail.total_hours,
            bgColor: shift.shift_detail.colors,
            shiftId: shift.shift_id,
            rate_per_hours: shift.shift_detail.rate_per_hours,
            shift_note: shift.shift_detail.shift_note,
          };
        }),
        week2: getWeekDates("week2").map((day: Day, index: number) => {
          const tempShift = tempShiftSelections[userRota.user.id]?.week2?.[index];
          if (tempShift !== undefined) return tempShift;
          const shift = userRota.week2[day.day];
          if (!shift) return null;
          return {
            type: shift.shift_detail.name,
            time: `${shift.shift_detail.hours_from.slice(0, 5)}-${shift.shift_detail.hours_to.slice(0, 5)}`,
            hours: shift.shift_detail.total_hours,
            bgColor: shift.shift_detail.colors,
            shiftId: shift.shift_id,
            rate_per_hours: shift.shift_detail.rate_per_hours,
            shift_note: shift.shift_detail.shift_note,
          };
        }),
        week3: getWeekDates("week3").map((day: Day, index: number) => {
          const tempShift = tempShiftSelections[userRota.user.id]?.week3?.[index];
          if (tempShift !== undefined) return tempShift;
          const shift = userRota.week3[day.day];
          if (!shift) return null;
          return {
            type: shift.shift_detail.name,
            time: `${shift.shift_detail.hours_from.slice(0, 5)}-${shift.shift_detail.hours_to.slice(0, 5)}`,
            hours: shift.shift_detail.total_hours,
            bgColor: shift.shift_detail.colors,
            shiftId: shift.shift_id,
            rate_per_hours: shift.shift_detail.rate_per_hours,
            shift_note: shift.shift_detail.shift_note,
          };
        }),
        week4: getWeekDates("week4").map((day: Day, index: number) => {
          const tempShift = tempShiftSelections[userRota.user.id]?.week4?.[index];
          if (tempShift !== undefined) return tempShift;
          const shift = userRota.week4[day.day];
          if (!shift) return null;
          return {
            type: shift.shift_detail.name,
            time: `${shift.shift_detail.hours_from.slice(0, 5)}-${shift.shift_detail.hours_to.slice(0, 5)}`,
            hours: shift.shift_detail.total_hours,
            bgColor: shift.shift_detail.colors,
            shiftId: shift.shift_id,
            rate_per_hours: shift.shift_detail.rate_per_hours,
            shift_note: shift.shift_detail.shift_note,
          };
        }),
      };
      const weekData = userRota[selectedWeek as keyof UserRota] as Week;
      const shifts: (EmployeeShift | "dropdown" | null)[] = days.map((day, index) => {
        const tempShift = tempShiftSelections[userRota.user.id]?.[selectedWeek]?.[index];
        if (tempShift !== undefined) return tempShift;
        const shift = weekData[day.day];
        if (!shift) return null;
        return {
          type: shift.shift_detail.name,
          time: `${shift.shift_detail.hours_from.slice(0, 5)}-${shift.shift_detail.hours_to.slice(0, 5)}`,
          hours: shift.shift_detail.total_hours,
          bgColor: shift.shift_detail.colors,
          shiftId: shift.shift_id,
          rate_per_hours: shift.shift_detail.rate_per_hours,
          shift_note: shift.shift_detail.shift_note,
        };
      });
      return {
        id: userRota.user.id,
        name: userRota.user.display_name || "Unknown User",
        status: userRota.user.parent_rota_completed ? "Completed" : "Incomplete",
        shifts,
        allWeeksShifts,
        availableShifts,
      };
    });
  }, [cachedApiData, selectedWeek, tempShiftSelections, getWeekDates, convertUserShiftsToEmployeeShifts]);

  const filteredEmployees = useMemo(() => {
    if (!debouncedSearchQuery) return employees;
    return employees.filter((employee: Employee) => employee.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
  }, [employees, debouncedSearchQuery]);

  const days = useMemo(() => getWeekDates(selectedWeek), [selectedWeek, getWeekDates]);
  const currentWeek = useMemo(() => getCurrentWeek(), [getCurrentWeek]);

  const hasAll28DaysShifts = useCallback((employee: Employee): boolean => {
    const allWeeks = [
      employee.allWeeksShifts.week1,
      employee.allWeeksShifts.week2,
      employee.allWeeksShifts.week3,
      employee.allWeeksShifts.week4,
    ];
    let totalShifts = 0;
    allWeeks.forEach((week) => {
      week.forEach((shift) => {
        if (shift && shift !== "dropdown" && shift !== null) {
          totalShifts++;
        }
      });
    });
    return totalShifts === 28;
  }, []);

  const fetchRota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/rota/parent-rota/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (!data.users.length) {
        throw new Error("No users found in the response");
      }
      setCachedApiData(data.users);
    } catch (error) {
      console.error("Error fetching rota:", error);
      setError("Failed to load schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const generateRota = useCallback(
    async (employee: Employee) => {
      try {
        setGeneratingRota(true);
        const rotation = {
          week1: {} as { [key: string]: number },
          week2: {} as { [key: string]: number },
          week3: {} as { [key: string]: number },
          week4: {} as { [key: string]: number },
        };
        const dayMapping = {
          Monday: "monday",
          Tuesday: "tuesday",
          Wednesday: "wednesday",
          Thursday: "thursday",
          Friday: "friday",
          Saturday: "saturday",
          Sunday: "sunday",
        };
        Object.keys(rotation).forEach((weekKey) => {
          const weekShifts = employee.allWeeksShifts[weekKey as keyof typeof employee.allWeeksShifts];
          weekShifts.forEach((shift, dayIndex) => {
            const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayIndex];
            const apiDayName = dayMapping[dayName as keyof typeof dayMapping];
            if (shift && shift !== "dropdown" && shift !== null) {
              rotation[weekKey as keyof typeof rotation][apiDayName] = shift.shiftId;
            }
          });
        });
        const payload = {
          userid: employee.id,
          apply_to_all: true,
          rotation: rotation,
        };
        const response = await fetch(`${API_URL}/api/rota/parent-rota/generate/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result);
        
        await fetchRota();
      } catch (error) {
        console.error("Error generating rota:", error);
        alert("Failed to generate rota. Please try again.");
      } finally {
        setGeneratingRota(false);
      }
    },
    [token, fetchRota],
  );

  const handleStartRota = useCallback(
    async (employeeId: number) => {
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) return;
      if (hasAll28DaysShifts(employee)) {
        await generateRota(employee);
      } else {
        setSelectedEmployeeId(employeeId);
        setShowRotaModal(true);
      }
    },
    [employees, hasAll28DaysShifts, generateRota],
  );

  const selectShift = useCallback(
    (userIndex: number, shiftIndex: number, shift: EmployeeShift) => {
      const employeeId = employees[userIndex].id;
      setTempShiftSelections((prev) => {
        const employeeSelections = prev[employeeId] || { week1: [], week2: [], week3: [], week4: [] };
        const weekSelections = [...(employeeSelections[selectedWeek] || employees[userIndex].shifts)];
        weekSelections[shiftIndex] = shift;
        return {
          ...prev,
          [employeeId]: {
            ...employeeSelections,
            [selectedWeek]: weekSelections,
          },
        };
      });
      setOpenShiftIndex(null);
    },
    [employees, selectedWeek],
  );

  const clearShift = useCallback(
    (userIndex: number, shiftIndex: number) => {
      const employeeId = employees[userIndex].id;
      setTempShiftSelections((prev) => {
        const employeeSelections = prev[employeeId] || { week1: [], week2: [], week3: [], week4: [] };
        const weekSelections = [...(employeeSelections[selectedWeek] || employees[userIndex].shifts)];
        weekSelections[shiftIndex] = null;
        return {
          ...prev,
          [employeeId]: {
            ...employeeSelections,
            [selectedWeek]: weekSelections,
          },
        };
      });
      setOpenShiftIndex(null);
    },
    [employees, selectedWeek],
  );

  const toggleShiftSelection = useCallback(
    (key: string) => {
      setOpenShiftIndex(openShiftIndex === key ? null : key);
    },
    [openShiftIndex],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const openEditShiftModal = useCallback((shift: EmployeeShift) => {
    setSelectedShift(shift);
    setEditShiftForm({
      name: shift.type,
      template: true,
      hours_from: shift.time.split("-")[0] + ":00",
      hours_to: shift.time.split("-")[1] + ":00",
      shift_note: shift.shift_note,
      rate_per_hours: shift.rate_per_hours,
      colors: shift.bgColor,
    });
    setShowEditShiftModal(true);
  }, []);

  const handleEditShiftChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditShiftForm((prev) => ({
      ...prev,
      [name]: name === "rate_per_hours" ? Number.parseFloat(value) || 0 : value,
    }));
  }, []);

  const updateShift = useCallback(async () => {
    if (!selectedShift) return;
    if (!editShiftForm.name || !editShiftForm.hours_from || !editShiftForm.hours_to) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      setEditShiftLoading(true);
      const response = await fetch(`${API_URL}/api/staff/shifts/${selectedShift.shiftId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editShiftForm),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchRota();
      setShowEditShiftModal(false);
      setSelectedShift(null);
    } catch (error) {
      console.error("Error updating shift:", error);
      alert("Failed to update shift. Please try again.");
    } finally {
      setEditShiftLoading(false);
    }
  }, [selectedShift, editShiftForm, token, fetchRota]);

  const applyWeekToAll = useCallback(async () => {
    if (!selectedEmployeeId) return;
    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!employee) return;
    const sourceWeekShifts =
      tempShiftSelections[selectedEmployeeId]?.[selectedWeekForApply] ||
      employee.allWeeksShifts[selectedWeekForApply as keyof typeof employee.allWeeksShifts];
    setTempShiftSelections((prev) => {
      const employeeSelections = prev[selectedEmployeeId] || { week1: [], week2: [], week3: [], week4: [] };
      if (applyToAll) {
        return {
          ...prev,
          [selectedEmployeeId]: {
            week1: [...sourceWeekShifts],
            week2: [...sourceWeekShifts],
            week3: [...sourceWeekShifts],
            week4: [...sourceWeekShifts],
          },
        };
      } else {
        return {
          ...prev,
          [selectedEmployeeId]: {
            ...employeeSelections,
            [selectedWeekForApply]: [...sourceWeekShifts],
          },
        };
      }
    });
    setShowRotaModal(false);
    setSelectedEmployeeId(null);
    setApplyToAll(false);
    const updatedEmployee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (updatedEmployee) {
      const employeeWithUpdatedShifts = {
        ...updatedEmployee,
        allWeeksShifts: {
          week1: applyToAll ? [...sourceWeekShifts] : updatedEmployee.allWeeksShifts.week1,
          week2: applyToAll ? [...sourceWeekShifts] : updatedEmployee.allWeeksShifts.week2,
          week3: applyToAll ? [...sourceWeekShifts] : updatedEmployee.allWeeksShifts.week3,
          week4: applyToAll ? [...sourceWeekShifts] : updatedEmployee.allWeeksShifts.week4,
        },
      };
      await generateRota(employeeWithUpdatedShifts);
    }
  }, [selectedEmployeeId, employees, tempShiftSelections, selectedWeekForApply, applyToAll, generateRota]);

  useEffect(() => {
    if (token) {
      fetchRota();
    } else {
      setError("Authentication token not found.");
      setLoading(false);
    }
  }, [token, fetchRota]);

  // Extract unique users for the RotaScheduler dropdown
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<number, User>();
    cachedApiData.forEach((userRota: UserRota) => {
      if (!userMap.has(userRota.user.id)) {
        userMap.set(userRota.user.id, userRota.user);
      }
    });
    return Array.from(userMap.values());
  }, [cachedApiData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading rota...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-between space-x-1">
          <StartRota users={uniqueUsers}/>
        </div>
      </div>
      {/* Pattern Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">Pattern 1 - Weekly Schedule</h2>
          <p className="text-sm text-gray-500">User-specific shifts only</p>
        </div>
        <div className="flex space-x-2">
          {["week1", "week2", "week3", "week4"].map((week) => (
            <Badge
              key={week}
              variant={selectedWeek === week ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 text-sm flex items-center space-x-1 ${
                selectedWeek === week
                  ? "bg-rose-700 border text-white"
                  : week === currentWeek
                  ? "bg-green-100 text-green-700  hover:bg-green-200"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => setSelectedWeek(week)}
              aria-label={`Select Week ${week.slice(-1)}${week === currentWeek ? " (Current Week)" : ""}`}
            >
              <span>Week {week.slice(-1)}</span>
              {week === currentWeek && <span className="w-2 h-2 bg-green-500 rounded-full" aria-label="Current week" />}
            </Badge>
          ))}
        </div>
      </div>
      {/* Schedule Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] min-w-[200px]">Staff Member</TableHead>
                {days.map((day, index) => (
                  <TableHead key={index} className="text-center w-[130px] min-w-[130px]">
                    <div className="text-sm font-medium">{day.day.slice(0, 3)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {day.date}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center w-[120px] min-w-[120px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee: Employee, userIndex: number) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    userIndex={userIndex}
                    openShiftIndex={openShiftIndex}
                    onToggleShift={toggleShiftSelection}
                    onSelectShift={selectShift}
                    onClearShift={clearShift}
                    onEditShift={openEditShiftModal}
                    onStartRota={handleStartRota}
                    generatingRota={generatingRota}
                    rotaGenerated={rotaGenerated}
                    tempShiftSelections={tempShiftSelections}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-600 py-8">
                    No matching users found.{" "}
                    <Button variant="link" onClick={clearSearch} className="text-blue-600 p-0">
                      Clear search
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Start Rota Modal */}
      <Dialog open={showRotaModal} onOpenChange={setShowRotaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete 28-Day Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please select all 28 days (4 weeks) before starting the rota. You can select a week pattern and apply it
              to all weeks.
            </p>
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Select Week Pattern:</div>
              <div className="flex flex-wrap gap-2">
                {["week1", "week2", "week3", "week4"].map((week) => (
                  <Badge
                    key={week}
                    variant={selectedWeekForApply === week ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 text-sm ${
                      selectedWeekForApply === week
                        ? "bg-orange-100 border-orange border text-orange"
                        : "bg-white text-gray-500 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedWeekForApply(week)}
                  >
                    Week {week.slice(-1)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="apply-all"
                checked={applyToAll}
                onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
              />
              <label htmlFor="apply-all" className="text-sm text-gray-700 cursor-pointer">
                Apply this pattern to all 4 weeks
              </label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRotaModal(false)}>
              Cancel
            </Button>
            <Button onClick={applyWeekToAll}
             style={{
              background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
              width: 'auto',
              height: 'auto',
            }}
            className="px-3 cursor-pointer py-2"
            >
              Apply Pattern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Shift Modal */}
      <Dialog open={showEditShiftModal} onOpenChange={setShowEditShiftModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Shift Name
              </Label>
              <Input
                id="name"
                name="name"
                value={editShiftForm.name}
                onChange={handleEditShiftChange}
                className="mt-1"
                placeholder="Enter shift name"
                required
              />
            </div>
            <div>
              <Label htmlFor="hours_from" className="text-sm font-medium text-gray-700">
                Start Time
              </Label>
              <Input
                id="hours_from"
                name="hours_from"
                type="time"
                value={editShiftForm.hours_from.slice(0, 5)}
                onChange={handleEditShiftChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="hours_to" className="text-sm font-medium text-gray-700">
                End Time
              </Label>
              <Input
                id="hours_to"
                name="hours_to"
                type="time"
                value={editShiftForm.hours_to.slice(0, 5)}
                onChange={handleEditShiftChange}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="shift_note" className="text-sm font-medium text-gray-700">
                Shift Note
              </Label>
              <Input
                id="shift_note"
                name="shift_note"
                value={editShiftForm.shift_note}
                onChange={handleEditShiftChange}
                className="mt-1"
                placeholder="Enter shift note"
              />
            </div>
            <div>
              <Label htmlFor="rate_per_hours" className="text-sm font-medium text-gray-700">
                Rate per Hour
              </Label>
              <Input
                id="rate_per_hours"
                name="rate_per_hours"
                type="number"
                step="0.01"
                value={editShiftForm.rate_per_hours}
                onChange={handleEditShiftChange}
                className="mt-1"
                placeholder="Enter rate per hour"
                required
              />
            </div>
            <div>
              <Label htmlFor="colors" className="text-sm font-medium text-gray-700">
                Color
              </Label>
              <Input
                id="colors"
                name="colors"
                type="color"
                value={editShiftForm.colors}
                onChange={handleEditShiftChange}
                className="mt-1 h-10"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditShiftModal(false);
                setSelectedShift(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={updateShift} className="bg-blue-600 hover:bg-blue-700" disabled={editShiftLoading}>
              {editShiftLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ParentTab);