"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Wrench,
  Download,
  Shield,
  Settings,
  Circle,
  RefreshCw,
  Check,
  X,
  Play,
  User,
  Car,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import Link from "next/link";
import { toast } from "sonner";

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    mot: Array<{
      vehicle: number;
      vehicle_reg: string;
      mot_expiry: string;
      book_next_mot_from: string;
      next_mot_booked_date: string;
      next_mot_booked_time: string;
      mot_status: string;
    }>;
    pmi: Array<{
      vehicle: number;
      vehicle_reg: string;
      pmi_expiry: string | null;
      last_pmi_date: string | null;
      book_next_pmi_from: string | null;
      next_pmi_book_date: string;
      hover: Record<string, string>;
    }>;
    tacho: Array<{
      vehicle: number;
      vehicle_reg: string;
      last_download: string | null;
      next_download: string | null;
    }>;
    tyre: Array<{
      vehicle: number;
      vehicle_reg: string;
      last_check: string | null;
      next_check: string | null;
    }>;
    insurance: Array<{
      vehicle: number;
      vehicle_reg: string;
      insurance_expiry: string;
      tax_expiry: string;
    }>;
    calibrations: Array<{
      vehicle: number;
      vehicle_reg: string;
      tacho_calibration_expiry: string | null;
      next_tacho_calibration_book_date: string | null;
      loller_test_expiry_date: string | null;
      next_loller_test_date: string | null;
    }>;
  };
}

interface VehicleRow {
  vehicle: number;
  vehicle_reg: string;
  mot?: ApiResponse["data"]["mot"][0];
  pmi?: ApiResponse["data"]["pmi"][0];
  tacho?: ApiResponse["data"]["tacho"][0];
  tyre?: ApiResponse["data"]["tyre"][0];
  insurance?: ApiResponse["data"]["insurance"][0];
  calibration?: ApiResponse["data"]["calibrations"][0];
}

type TabType = "All Data" | "MOT" | "PMI Inspection" | "Vehicle Tacho Download" | 
  "Tyre Maintenance Check" | "Insurance & Check" | "Calibrations";

type EditableField = {
  type: 'mot_date' | 'mot_time' | 'pmi_date' | 'tacho_calib_date' | 'loller_calib_date';
  vehicleId: number;
  originalValue: string;
};

// Helper function to check if value should show TBC
const shouldShowTBC = (value: string | null | undefined, fieldType?: string): boolean => {
  if (!value || value === "TBC" || value === "NA" || value === "null" || value === "null null") {
    return true;
  }
  
  // For MOT/PMI booked dates, show TBC if they're empty or invalid
  if (fieldType === 'booking' && (!value.trim() || value === "")) {
    return true;
  }
  
  return false;
};

// Date status utility function
const getDateStatus = (dateString: string | null, compareDate?: string | null): 'green' | 'yellow' | 'red' | 'gray' => {
  if (shouldShowTBC(dateString)) {
    return 'gray';
  }

  try {
    let date: Date;
    
    // Parse UK date format DD/MM/YYYY
    if (dateString && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString!);
    }
    
    if (isNaN(date.getTime())) return 'gray';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // For comparison with another date (e.g., "Book Next From" date)
    if (compareDate && !shouldShowTBC(compareDate)) {
      let compareDateObj: Date;
      
      // Parse compare date if it's in UK format
      if (compareDate.includes('/')) {
        const parts = compareDate.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          compareDateObj = new Date(year, month, day);
        } else {
          compareDateObj = new Date(compareDate);
        }
      } else {
        compareDateObj = new Date(compareDate);
      }
      
      compareDateObj.setHours(0, 0, 0, 0);
      
      const todayTime = today.getTime();
      const targetTime = targetDate.getTime();
      const compareTime = compareDateObj.getTime();
      
      // If we're past the target date (expired)
      if (targetTime < todayTime) return 'red';
      
      // If today is on or after the "book from" date
      if (todayTime >= compareTime) {
        // And target date is within 7 days
        if (diffDays <= 7) return 'yellow';
        // Just reached "book from" date but still >7 days away
        return 'green';
      }
      
      // Not yet at "book from" date
      return 'green';
    }
    
    // Standard expiry logic
    if (diffDays < 0) return 'red'; // Expired
    if (diffDays <= 7) return 'yellow'; // Within 7 days
    return 'green'; // More than 7 days away
    
  } catch (error) {
    return 'gray';
  }
};

// Date Display Component
interface DateDisplayProps {
  date: string | null;
  compareDate?: string | null;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  isEditable?: boolean;
  showTBC?: boolean;
  fieldType?: string;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ 
  date, 
  compareDate, 
  className = "", 
  children,
  onClick,
  isEditable = false,
  showTBC = true,
  fieldType
}) => {
  const status = getDateStatus(date, compareDate);
  
  const statusClasses = {
    green: 'text-green-700 bg-green-50 hover:bg-green-100',
    yellow: 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100',
    red: 'text-red-700 bg-red-50 hover:bg-red-100',
    gray: 'text-gray-500 bg-gray-50 hover:bg-gray-100'
  };

  let displayText = children;
  
  if (!children) {
    if (shouldShowTBC(date, fieldType)) {
      displayText = showTBC ? "TBC" : "NA";
    } else if (date && date.includes('/')) {
      // Keep UK format for display
      displayText = date;
    } else {
      try {
        const dateObj = new Date(date!);
        if (!isNaN(dateObj.getTime())) {
          displayText = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else {
          displayText = showTBC ? "TBC" : "NA";
        }
      } catch {
        displayText = showTBC ? "TBC" : "NA";
      }
    }
  }
  
  return (
    <div
      className={`px-3 py-4 text-sm rounded min-h-[44px] flex items-center transition-colors ${
        isEditable ? 'cursor-pointer' : 'cursor-default'
      } ${statusClasses[status]} ${className}`}
      onClick={isEditable ? onClick : undefined}
      title={isEditable ? "Double-click to edit" : ""}
    >
      {displayText}
    </div>
  );
};

// Display component for driver/vehicle related fields (shows NA)
const NAField: React.FC<{ label?: string; icon?: React.ReactNode; className?: string }> = ({ 
  label, 
  icon,
  className = "" 
}) => (
  <div className={`px-3 py-4 text-sm text-gray-500 bg-gray-50 rounded min-h-[44px] flex items-center justify-center ${className}`}>
    {icon && <span className="mr-2">{icon}</span>}
    {label || "NA"}
  </div>
);

export default function VehicleDashboard() {
  const [fullApiData, setFullApiData] = useState<ApiResponse | null>(null);
  const [filteredData, setFilteredData] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TabType>("All Data");
  const [vehicleRegFilter, setVehicleRegFilter] = useState("All Registrations");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  // Inline editing state
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Sweep Audit dialog state
  const [sweepDialogOpen, setSweepDialogOpen] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepTitle, setSweepTitle] = useState("Maintenance Notice");
  const [sweepMessage, setSweepMessage] = useState("System maintenance scheduled at midnight.");

  const cookies = useCookies();

  const formatDate = (s: string | null | undefined, showTBC: boolean = true): string => {
    if (shouldShowTBC(s)) {
      return showTBC ? "TBC" : "NA";
    }
    
    try {
      let date: Date;
      
      // Parse UK date format
      if (s && s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          date = new Date(year, month, day);
        } else {
          date = new Date(s);
        }
      } else {
        date = new Date(s!);
      }
      
      if (isNaN(date.getTime())) return showTBC ? "TBC" : "NA";
      
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return showTBC ? "TBC" : "NA";
    }
  };

  const getStatusBadge = (text: string) => {
    if (shouldShowTBC(text)) 
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600">TBC</span>;
    if (text.includes("Expired"))
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-800">{text}</span>;
    if (text.includes("days left"))
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-amber-800">{text}</span>;
    return <span className="text-gray-700 text-sm">{text}</span>;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vehicles/compliance/`, {
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data: ApiResponse = await res.json();
      setFullApiData(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [cookies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildRows = useCallback((): VehicleRow[] => {
    if (!fullApiData) return [];

    const maps = {
      mot: new Map(fullApiData.data.mot.map(i => [i.vehicle, i])),
      pmi: new Map(fullApiData.data.pmi.map(i => [i.vehicle, i])),
      tacho: new Map(fullApiData.data.tacho.map(i => [i.vehicle, i])),
      tyre: new Map(fullApiData.data.tyre.map(i => [i.vehicle, i])),
      insurance: new Map(fullApiData.data.insurance.map(i => [i.vehicle, i])),
      calibration: new Map(fullApiData.data.calibrations.map(i => [i.vehicle, i])),
    };

    const allIds = new Set([
      ...maps.mot.keys(),
      ...maps.pmi.keys(),
      ...maps.tacho.keys(),
      ...maps.tyre.keys(),
      ...maps.insurance.keys(),
      ...maps.calibration.keys(),
    ]);

    return Array.from(allIds).map(id => ({
      vehicle: id,
      vehicle_reg:
        maps.mot.get(id)?.vehicle_reg ||
        maps.pmi.get(id)?.vehicle_reg ||
        maps.insurance.get(id)?.vehicle_reg ||
        maps.tacho.get(id)?.vehicle_reg ||
        maps.tyre.get(id)?.vehicle_reg ||
        maps.calibration.get(id)?.vehicle_reg ||
        "Unknown",
      mot: maps.mot.get(id),
      pmi: maps.pmi.get(id),
      tacho: maps.tacho.get(id),
      tyre: maps.tyre.get(id),
      insurance: maps.insurance.get(id),
      calibration: maps.calibration.get(id),
    }));
  }, [fullApiData]);

  useEffect(() => {
    let data = buildRows();

    if (activeFilter !== "All Data") {
      if (activeFilter === "MOT") data = data.filter(r => r.mot);
      if (activeFilter === "PMI Inspection") data = data.filter(r => r.pmi);
      if (activeFilter === "Vehicle Tacho Download") data = data.filter(r => r.tacho);
      if (activeFilter === "Tyre Maintenance Check") data = data.filter(r => r.tyre);
      if (activeFilter === "Insurance & Check") data = data.filter(r => r.insurance);
      if (activeFilter === "Calibrations") data = data.filter(r => r.calibration);
    }

    if (searchQuery)
      data = data.filter(r => r.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()));
    if (vehicleRegFilter !== "All Registrations") data = data.filter(r => r.vehicle_reg === vehicleRegFilter);
    if (statusFilter === "Expired") data = data.filter(r => r.mot?.mot_status.includes("Expired"));
    if (statusFilter === "Upcoming") data = data.filter(r => r.mot?.mot_status.includes("days left"));
    if (statusFilter === "TBC") data = data.filter(r => shouldShowTBC(r.mot?.next_mot_booked_date, 'booking'));

    setFilteredData(data);
    setCurrentPage(1);
  }, [buildRows, activeFilter, searchQuery, vehicleRegFilter, statusFilter]);

  const handleDoubleClick = (vehicleId: number, fieldType: EditableField['type'], currentValue: string) => {
    if (shouldShowTBC(currentValue, fieldType === 'mot_date' || fieldType === 'pmi_date' || fieldType === 'tacho_calib_date' || fieldType === 'loller_calib_date' ? 'booking' : undefined)) {
      setEditingField({ type: fieldType, vehicleId, originalValue: "" });
      setEditValue("");
    } else {
      setEditingField({ type: fieldType, vehicleId, originalValue: currentValue });
      setEditValue(currentValue);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingField || editValue.trim() === "") {
      setEditingField(null);
      return;
    }

    setIsUpdating(true);
    try {
      const payload: any = {};
      
      switch (editingField.type) {
        case 'mot_date':
          payload.mot_booked_date = editValue;
          break;
        case 'mot_time':
          payload.mot_booked_time = editValue.includes(':') ? editValue : `${editValue}:00`;
          break;
        case 'pmi_date':
          payload.next_pmi_book_date = editValue;
          break;
        case 'tacho_calib_date':
          payload.next_tacho_calibration_book_date = editValue;
          break;
        case 'loller_calib_date':
          payload.next_loller_test_date = editValue;
          break;
      }

      const response = await fetch(`${API_URL}/api/vehicles/${editingField.vehicleId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || "Updated successfully");
        if (fullApiData) {
          const updatedData = { ...fullApiData };
          
          if (editingField.type === 'mot_date' || editingField.type === 'mot_time') {
            const motIndex = updatedData.data.mot.findIndex(m => m.vehicle === editingField.vehicleId);
            if (motIndex !== -1) {
              if (editingField.type === 'mot_date') {
                updatedData.data.mot[motIndex].next_mot_booked_date = editValue;
              } else {
                updatedData.data.mot[motIndex].next_mot_booked_time = editValue;
              }
              setFullApiData(updatedData);
            }
          } else if (editingField.type === 'pmi_date') {
            const pmiIndex = updatedData.data.pmi.findIndex(p => p.vehicle === editingField.vehicleId);
            if (pmiIndex !== -1) {
              updatedData.data.pmi[pmiIndex].next_pmi_book_date = editValue;
              setFullApiData(updatedData);
            }
          } else if (editingField.type === 'tacho_calib_date') {
            const calibIndex = updatedData.data.calibrations.findIndex(c => c.vehicle === editingField.vehicleId);
            if (calibIndex !== -1) {
              updatedData.data.calibrations[calibIndex].next_tacho_calibration_book_date = editValue;
              setFullApiData(updatedData);
            }
          } else if (editingField.type === 'loller_calib_date') {
            const calibIndex = updatedData.data.calibrations.findIndex(c => c.vehicle === editingField.vehicleId);
            if (calibIndex !== -1) {
              updatedData.data.calibrations[calibIndex].next_loller_test_date = editValue;
              setFullApiData(updatedData);
            }
          }
        }
        setEditingField(null);
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update.");
      setEditValue(editingField.originalValue);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingField) return;
      
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingField, editValue]);

  const renderMOTBookedDate = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'mot_date' && editingField?.vehicleId === row.vehicle;
    const value = row.mot?.next_mot_booked_date;
    
    // Show TBC for booking dates until user enters a date
    const displayValue = shouldShowTBC(value, 'booking') ? "TBC" : formatDate(value, false);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[120px]">
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm px-2 py-1"
            autoFocus
            disabled={isUpdating}
          />
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    return (
      <DateDisplay
        date={row.mot?.next_mot_booked_date || null}
        compareDate={row.mot?.book_next_mot_from}
        onClick={() => handleDoubleClick(row.vehicle, 'mot_date', row.mot?.next_mot_booked_date || "")}
        isEditable={true}
        showTBC={true}
        fieldType="booking"
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const renderMOTBookedTime = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'mot_time' && editingField?.vehicleId === row.vehicle;
    const value = row.mot?.next_mot_booked_time;
    
    // Show TBC for booking time until user enters a time
    const displayValue = shouldShowTBC(value) ? "TBC" : (value || "NA");

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[100px]">
          <Input
            type="time"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm px-2 py-1"
            autoFocus
            disabled={isUpdating}
          />
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    return (
      <div
        className="px-3 py-4 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded min-h-[44px] flex items-center"
        onDoubleClick={() => handleDoubleClick(row.vehicle, 'mot_time', row.mot?.next_mot_booked_time || "")}
        title="Double-click to edit"
      >
        {displayValue}
      </div>
    );
  };

  const renderPMIBookedDate = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'pmi_date' && editingField?.vehicleId === row.vehicle;
    const value = row.pmi?.next_pmi_book_date;
    
    // Show TBC for booking dates until user enters a date
    const displayValue = shouldShowTBC(value, 'booking') ? "TBC" : formatDate(value, false);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[120px]">
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm px-2 py-1"
            autoFocus
            disabled={isUpdating}
          />
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    if (activeFilter !== "PMI Inspection" && row.pmi?.book_next_pmi_from === "booked" && row.pmi?.hover) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer min-h-[44px] flex items-center"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(row.vehicle, 'pmi_date', row.pmi?.next_pmi_book_date || "");
              }}
              title="Double-click to edit"
            >
              <DateDisplay
                date={row.pmi?.next_pmi_book_date || null}
                compareDate={row.pmi?.book_next_pmi_from}
                className="!bg-transparent !text-rose-600 hover:!text-rose-800"
                showTBC={true}
                fieldType="booking"
              >
                {displayValue}
              </DateDisplay>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-900">Planned PMI Dates</h4>
              <div className="text-xs space-y-1">
                {Object.entries(row.pmi.hover).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{k.replace(/_/g, " ")}:</span>
                    <span className="text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }
    
    return (
      <DateDisplay
        date={row.pmi?.next_pmi_book_date || null}
        compareDate={row.pmi?.book_next_pmi_from}
        onClick={() => handleDoubleClick(row.vehicle, 'pmi_date', row.pmi?.next_pmi_book_date || "")}
        isEditable={true}
        showTBC={true}
        fieldType="booking"
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const renderTachoCalibrationDate = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'tacho_calib_date' && editingField?.vehicleId === row.vehicle;
    const value = row.calibration?.next_tacho_calibration_book_date;
    
    // Show TBC for booking dates until user enters a date
    const displayValue = shouldShowTBC(value, 'booking') ? "TBC" : formatDate(value, false);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[120px]">
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm px-2 py-1"
            autoFocus
            disabled={isUpdating}
          />
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    return (
      <DateDisplay
        date={row.calibration?.next_tacho_calibration_book_date || null}
        onClick={() => handleDoubleClick(row.vehicle, 'tacho_calib_date', row.calibration?.next_tacho_calibration_book_date || "")}
        isEditable={true}
        showTBC={true}
        fieldType="booking"
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const renderLollerCalibrationDate = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'loller_calib_date' && editingField?.vehicleId === row.vehicle;
    const value = row.calibration?.next_loller_test_date;
    
    // Show TBC for booking dates until user enters a date
    const displayValue = shouldShowTBC(value, 'booking') ? "TBC" : formatDate(value, false);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[120px]">
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm px-2 py-1"
            autoFocus
            disabled={isUpdating}
          />
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating} className="h-8 w-8 p-0">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    return (
      <DateDisplay
        date={row.calibration?.next_loller_test_date || null}
        onClick={() => handleDoubleClick(row.vehicle, 'loller_calib_date', row.calibration?.next_loller_test_date || "")}
        isEditable={true}
        showTBC={true}
        fieldType="booking"
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const getVisibleColumns = () => {
    switch (activeFilter) {
      case "MOT": return { showMOT: true };
      case "PMI Inspection": return { showPMI: true };
      case "Vehicle Tacho Download": return { showTacho: true };
      case "Tyre Maintenance Check": return { showTyre: true };
      case "Insurance & Check": return { showInsurance: true };
      case "Calibrations": return { showCalibrations: true };
      case "All Data":
      default:
        return {
          showMOT: true,
          showPMI: true,
          showTacho: true,
          showTyre: true,
          showInsurance: true,
          showCalibrations: true,
        };
    }
  };

  const performSweepAudit = async () => {
    if (!sweepTitle.trim() || !sweepMessage.trim()) {
      toast.error("Please fill in title and message");
      return;
    }

    setIsSweeping(true);
    try {
      const nowIso = new Date().toISOString();

      const response = await fetch(`${API_URL}/api/notifications/sweep-vehicle-audit-now/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          title: sweepTitle.trim(),
          message: sweepMessage.trim(),
          datetime: nowIso,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to trigger sweep audit");
      }

      const result = await response.json();
      toast.success(result.message || "Sweep audit triggered successfully!");

      setSweepDialogOpen(false);
      setSweepTitle("Maintenance Notice");
      setSweepMessage("System maintenance scheduled at midnight.");
    } catch (error) {
      console.error("Sweep audit error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to trigger sweep audit");
    } finally {
      setIsSweeping(false);
    }
  };

  const visibleColumns = getVisibleColumns();
  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginated = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const uniqueRegs = ["All Registrations", ...Array.from(new Set(filteredData.map(r => r.vehicle_reg))).sort()];

  const tabs = [
    { key: "All Data", label: "All Data", icon: null },
    { key: "MOT", label: "MOT", icon: Calendar },
    { key: "PMI Inspection", label: "PMI Inspection", icon: Wrench },
    { key: "Vehicle Tacho Download", label: "Tacho Download", icon: Download },
    { key: "Tyre Maintenance Check", label: "Tyre Check", icon: Circle },
    { key: "Insurance & Check", label: "Insurance", icon: Shield },
    { key: "Calibrations", label: "Calibrations", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Compliance</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor and manage vehicle maintenance schedules</p>
            <p className="text-xs text-gray-500 mt-1">Double-click on MOT/PMI booked dates to edit</p>
          </div>

          <div className="flex gap-3">
            <Dialog open={sweepDialogOpen} onOpenChange={setSweepDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={loading || isUpdating || isSweeping} variant="outline" className="bg-orange-500 hover:bg-orange-600 cursor-pointer text-white hover:text-white" size="sm">
                  <Play className={`w-4 h-4 mr-2 ${isSweeping ? 'animate-spin' : ''}`} />
                  Sweep Audit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Trigger Sweep Vehicle Audit</DialogTitle>
                  <DialogDescription>
                    This will immediately run a vehicle compliance sweep using the current date and time ({new Date().toLocaleString()}).
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={sweepTitle}
                      onChange={(e) => setSweepTitle(e.target.value)}
                      placeholder="e.g. Maintenance Notice"
                      disabled={isSweeping}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={sweepMessage}
                      onChange={(e) => setSweepMessage(e.target.value)}
                      placeholder="Describe the reason..."
                      rows={4}
                      disabled={isSweeping}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSweepDialogOpen(false)}
                    disabled={isSweeping}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={performSweepAudit}
                    disabled={isSweeping}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isSweeping ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Triggering...
                      </>
                    ) : (
                      "Trigger Now"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={fetchData} disabled={loading || isUpdating || isSweeping} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading || isUpdating || isSweeping ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white">
          <div className="flex flex-wrap gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as TabType)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                    ${active 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by registration..."
                className="pl-9 border-gray-300 focus:ring-2 focus:ring-orange-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  {vehicleRegFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {uniqueRegs.map(r => (
                  <DropdownMenuItem key={r} onSelect={() => setVehicleRegFilter(r)}>
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {["All Statuses", "Expired", "Upcoming", "TBC"].map(s => (
                  <DropdownMenuItem key={s} onSelect={() => setStatusFilter(s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="ml-auto text-sm text-gray-600">
              {filteredData.length} vehicle{filteredData.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
              <p className="text-gray-600">Loading vehicle data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-600 text-lg">No vehicles found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th rowSpan={2} className="p-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-100 z-20 border-r-2 border-gray-300 min-w-[140px]">
                      Vehicle Reg
                    </th>

                    {/* MOT Information Header */}
                    {visibleColumns.showMOT && (
                      <th colSpan={5} className="px-4 py-3 text-center text-sm font-semibold text-orange-500 bg-orange-100 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4" />
                          MOT Information
                        </div>
                      </th>
                    )}
                    
                    {/* PMI Information Header */}
                    {visibleColumns.showPMI && (
                      <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-rose-900 bg-rose-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Wrench className="w-4 h-4" />
                          PMI Information
                        </div>
                      </th>
                    )}
                    
                    {/* Vehicle Tacho Download Information Header */}
                    {visibleColumns.showTacho && (
                      <th colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-blue-900 bg-blue-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Vehicle Tacho Download Information
                        </div>
                      </th>
                    )}
                    
                    {/* Tyre Maintenance Information Header */}
                    {visibleColumns.showTyre && (
                      <th colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-purple-900 bg-purple-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Circle className="w-4 h-4" />
                          Tyre Maintenance Information
                        </div>
                      </th>
                    )}
                    
                    {/* Insurance & Tax Information Header */}
                    {visibleColumns.showInsurance && (
                      <th colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-green-900 bg-green-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          Insurance & Tax Information
                        </div>
                      </th>
                    )}
                    
                    {/* Vehicle Tacho & Loller Calibration Information Header */}
                    {visibleColumns.showCalibrations && (
                      <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-yellow-900 bg-yellow-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Settings className="w-4 h-4" />
                          Vehicle Tacho & Loller Calibration Information
                        </div>
                      </th>
                    )}
                  </tr>

                  <tr className="bg-white border-y-2 border-gray-300">
                    {/* MOT Sub-headers */}
                    {visibleColumns.showMOT && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Status</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">MOT Expiry Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Book Next MOT From</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Next MOT Booked Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-orange-50/30">Time</th>
                      </>
                    )}

                    {/* PMI Sub-headers */}
                    {visibleColumns.showPMI && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">Status</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">Last PMI Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">PMI Expiry Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-rose-50/30">Next PMI Booked Date</th>
                      </>
                    )}

                    {/* Vehicle Tacho Download Sub-headers */}
                    {visibleColumns.showTacho && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-blue-50/30">Last Vehicle Tacho Download</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-blue-50/30">Next Vehicle Tacho Download</th>
                      </>
                    )}

                    {/* Tyre Maintenance Sub-headers */}
                    {visibleColumns.showTyre && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-purple-50/30">Last Tyre Check</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-purple-50/30">Next Tyre Check</th>
                      </>
                    )}

                    {/* Insurance & Tax Sub-headers */}
                    {visibleColumns.showInsurance && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-green-50/30">Insurance Expiry</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-green-50/30">Tax Expiry</th>
                      </>
                    )}

                    {/* Calibration Sub-headers */}
                    {visibleColumns.showCalibrations && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30">Last Tacho Calib Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30">Next Tacho Calib Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30">Last Loller Calib Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-yellow-50/30">Next Loller Calib Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((row, idx) => (
                    <tr key={row.vehicle} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="p-4 font-semibold text-gray-900 sticky left-0 bg-inherit z-10 border-r-2 border-gray-200">
                        <Link href={`/dashboard/compliance-management/vehicle-management/${row.vehicle}`}>
                          {row.vehicle_reg}
                        </Link>
                      </td>

                      {/* MOT Information Columns */}
                      {visibleColumns.showMOT && (
                        <>
                          <td className="px-3 py-4 border-l border-gray-200">{getStatusBadge(row.mot?.mot_status || "")}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                            <DateDisplay date={row.mot?.mot_expiry ?? null}>
                              {formatDate(row.mot?.mot_expiry, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                            <DateDisplay date={row.mot?.book_next_mot_from ?? null}>
                              {formatDate(row.mot?.book_next_mot_from, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                            {renderMOTBookedDate(row)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-x border-gray-200">
                            {renderMOTBookedTime(row)}
                          </td>
                        </>
                      )}

                      {/* PMI Information Columns */}
                      {visibleColumns.showPMI && (
                        <>
                          <td className="px-3 py-4 text-sm border-l border-gray-200">
                            {row.pmi?.book_next_pmi_from === "booked" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Booked
                              </span>
                            ) : (
                              <DateDisplay date={row.pmi?.book_next_pmi_from ?? null}>
                                {formatDate(row.pmi?.book_next_pmi_from, false)}
                              </DateDisplay>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                            <DateDisplay date={row.pmi?.last_pmi_date ?? null}>
                              {formatDate(row.pmi?.last_pmi_date, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                            <DateDisplay 
                              date={row.pmi?.pmi_expiry?? null} 
                              compareDate={row.pmi?.book_next_pmi_from}
                            >
                              {formatDate(row.pmi?.pmi_expiry, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm border-l border-x border-gray-200">
                            {renderPMIBookedDate(row)}
                          </td>
                        </>
                      )}

                      {/* Vehicle Tacho Download Information Columns */}
                      {visibleColumns.showTacho && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            <DateDisplay date={row.tacho?.last_download ?? null}>
                              {formatDate(row.tacho?.last_download, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                            <DateDisplay date={row.tacho?.next_download?? null}>
                              {formatDate(row.tacho?.next_download, false)}
                            </DateDisplay>
                          </td>
                        </>
                      )}

                      {/* Tyre Maintenance Information Columns */}
                      {visibleColumns.showTyre && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            <DateDisplay date={row.tyre?.last_check ?? null}>
                              {formatDate(row.tyre?.last_check, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                            <DateDisplay date={row.tyre?.next_check?? null}>
                              {formatDate(row.tyre?.next_check, false)}
                            </DateDisplay>
                          </td>
                        </>
                      )}

                      {/* Insurance & Tax Information Columns */}
                      {visibleColumns.showInsurance && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            <DateDisplay date={row.insurance?.insurance_expiry?? null}>
                              {formatDate(row.insurance?.insurance_expiry, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                            <DateDisplay date={row.insurance?.tax_expiry?? null}>
                              {formatDate(row.insurance?.tax_expiry, false)}
                            </DateDisplay>
                          </td>
                        </>
                      )}

                      {/* Vehicle Tacho & Loller Calibration Information Columns */}
                      {visibleColumns.showCalibrations && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            <DateDisplay date={row.calibration?.tacho_calibration_expiry ?? null}>
                              {formatDate(row.calibration?.tacho_calibration_expiry, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            {renderTachoCalibrationDate(row)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                            <DateDisplay date={row.calibration?.loller_test_expiry_date?? null}>
                              {formatDate(row.calibration?.loller_test_expiry_date, false)}
                            </DateDisplay>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                            {renderLollerCalibrationDate(row)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * perPage + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * perPage, filteredData.length)}</span> of{" "}
                <span className="font-semibold text-gray-900">{filteredData.length}</span> vehicles
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 ${currentPage === pageNum ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}