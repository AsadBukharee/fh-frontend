"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import Link from "next/link";
import { toast } from "sonner"; // Assuming you're using sonner for toasts

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    mot: Array<{
      vehicle: number;
      vehicle_reg: string;
      mot_expiry: string;
      book_next_mot_from: string | null;
      next_mot_booked_date: string;
      next_mot_booked_time: string;
      mot_status: string;
    }>;
    pmi: Array<{
      vehicle: number;
      vehicle_reg: string;
      pmi_expiry: string;
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
  type: 'mot_date' | 'mot_time' | 'pmi_date';
  vehicleId: number;
  originalValue: string;
};

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

  // State for inline editing
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const cookies = useCookies();

  const formatDate = (s: string | null | undefined) => {
    if (!s || s === "TBC" || s === "null" || s === "null null") return "-";
    return s;
  };

  const getStatusBadge = (text: string) => {
    if (!text || text === "TBC") 
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  text-gray-600">TBC</span>;
    if (text.includes("Expired"))
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  text-red-800">{text}</span>;
    if (text.includes("days left"))
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  text-amber-800">{text}</span>;
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
    if (statusFilter === "TBC") data = data.filter(r => r.mot?.next_mot_booked_date === "TBC");

    setFilteredData(data);
    setCurrentPage(1);
  }, [buildRows, activeFilter, searchQuery, vehicleRegFilter, statusFilter]);

  // Function to handle double click for editing
  const handleDoubleClick = (vehicleId: number, fieldType: EditableField['type'], currentValue: string) => {
    if (currentValue === "TBC" || currentValue === "-" || currentValue === "null null") {
      setEditingField({ type: fieldType, vehicleId, originalValue: "" });
      setEditValue("");
    } else {
      setEditingField({ type: fieldType, vehicleId, originalValue: currentValue });
      setEditValue(currentValue);
    }
  };

  // Function to save the edited value
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
          // Convert time to HH:MM:SS format if needed
          payload.mot_booked_time = editValue.includes(':') ? editValue : `${editValue}:00`;
          break;
        case 'pmi_date':
          payload.next_pmi_book_date = editValue;
          break;
      }

      const response = await fetch(`${API_URL}/api/vehicles/${editingField.vehicleId}/`, {
        method: 'PATCH', // Using PATCH as per your API structure
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
        // Update local state immediately for better UX
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
          }
        }
        setEditingField(null);
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update. Please try again.");
      // Revert to original value on error
      setEditValue(editingField.originalValue);
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  // Handle Enter and Escape keys for editing
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

  // Format date for input[type="date"] (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString || dateString === "TBC" || dateString === "-") return "";
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    // Try to parse the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    return date.toISOString().split('T')[0];
  };

  // Format time for input[type="time"] (HH:MM)
  const formatTimeForInput = (timeString: string) => {
    if (!timeString || timeString === "TBC" || timeString === "-") return "";
    
    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    
    // If it's in HH:MM:SS format, extract HH:MM
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString.substring(0, 5);
    }
    
    return timeString;
  };

  // Render editable cell for MOT booked date
  const renderMOTBookedDate = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'mot_date' && editingField?.vehicleId === row.vehicle;
    const value = formatDate(row.mot?.next_mot_booked_date);
    const inputValue = isEditing ? editValue : formatDateForInput(row.mot?.next_mot_booked_date || "");
    
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
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    return (
      <div
        className="px-3 py-4 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded min-h-[44px] flex items-center"
        onDoubleClick={() => handleDoubleClick(row.vehicle, 'mot_date', row.mot?.next_mot_booked_date || "")}
        title="Double-click to edit"
      >
        {value}
      </div>
    );
  };

  // Render editable cell for MOT booked time
  const renderMOTBookedTime = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'mot_time' && editingField?.vehicleId === row.vehicle;
    const value = row.mot?.next_mot_booked_time && row.mot.next_mot_booked_time !== "TBC"
      ? row.mot.next_mot_booked_time
      : "-";
    const inputValue = isEditing ? editValue : formatTimeForInput(row.mot?.next_mot_booked_time || "");
    
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
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
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
        {value}
      </div>
    );
  };

  // Render editable cell for PMI booked date
  const renderPMIBookedDate = (row: VehicleRow) => {
    const isEditing = editingField?.type === 'pmi_date' && editingField?.vehicleId === row.vehicle;
    const shouldShowDate = row.pmi?.book_next_pmi_from === "booked" && row.pmi?.next_pmi_book_date;
    const value = shouldShowDate && row.pmi ? formatDate(row.pmi.next_pmi_book_date) : "-";
    const inputValue = isEditing ? editValue : formatDateForInput(row.pmi?.next_pmi_book_date || "");
    
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
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    }
    
    // PMI date cell with hover popover for All Data view
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
              {formatDate(row.pmi.next_pmi_book_date)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-900">Booking Details</h4>
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
      <div
        className="px-3 py-4 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded min-h-[44px] flex items-center"
        onDoubleClick={() => handleDoubleClick(row.vehicle, 'pmi_date', row.pmi?.next_pmi_book_date || "")}
        title="Double-click to edit"
      >
        {value}
      </div>
    );
  };

  const getVisibleColumns = () => {
    switch (activeFilter) {
      case "MOT":
        return { showMOT: true };
      case "PMI Inspection":
        return { showPMI: true };
      case "Vehicle Tacho Download":
        return { showTacho: true };
      case "Tyre Maintenance Check":
        return { showTyre: true };
      case "Insurance & Check":
        return { showInsurance: true };
      case "Calibrations":
        return { showCalibrations: true };
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

  const visibleColumns = getVisibleColumns();
  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginated = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const uniqueRegs = ["All Registrations", ...Array.from(new Set(filteredData.map(r => r.vehicle_reg))).sort()];

  const tabs = [
    { key: "All Data", label: "All Data", icon: null, color: "gray" },
    { key: "MOT", label: "MOT", icon: Calendar, color: "orange" },
    { key: "PMI Inspection", label: "PMI Inspection", icon: Wrench, color: "rose" },
    { key: "Vehicle Tacho Download", label: "Tacho Download", icon: Download, color: "blue" },
    { key: "Tyre Maintenance Check", label: "Tyre Check", icon: Circle, color: "purple" },
    { key: "Insurance & Check", label: "Insurance", icon: Shield, color: "green" },
    { key: "Calibrations", label: "Calibrations", icon: Settings, color: "yellow" },
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
          <Button onClick={fetchData} disabled={loading || isUpdating} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || isUpdating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Improved Tabs */}
        <div className="bg-white ">
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
              <Search className=" z-10 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

        {/* Improved Table */}
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
                  {/* Category Headers */}
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th rowSpan={2} className="p-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-100 z-20 border-r-2 border-gray-300 min-w-[140px]">
                      Vehicle Reg
                    </th>

                    {visibleColumns.showMOT && (
                      <th colSpan={5} className="px-4 py-3 text-center text-sm font-semibold text-orange-500 bg-orange-100 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4" />
                          MOT
                        </div>
                      </th>
                    )}
                    
                    {visibleColumns.showPMI && (
                      <th colSpan={activeFilter === "PMI Inspection" ? 3 + (Object.keys(paginated[0]?.pmi?.hover || {}).length) : 3} className="px-4 py-3 text-center text-sm font-semibold text-rose-900 bg-rose-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Wrench className="w-4 h-4" />
                          PMI Inspection
                        </div>
                      </th>
                    )}
                    
                    {visibleColumns.showTacho && (
                      <th colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-blue-900 bg-blue-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Tacho Download
                        </div>
                      </th>
                    )}
                    
                    {visibleColumns.showTyre && (
                      <th colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-purple-900 bg-purple-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Circle className="w-4 h-4" />
                          Tyre Maintenance
                        </div>
                      </th>
                    )}
                    
                    {visibleColumns.showInsurance && (
                      <th colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-green-900 bg-green-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          Insurance & Tax
                        </div>
                      </th>
                    )}
                    
                    {visibleColumns.showCalibrations && (
                      <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-yellow-900 bg-yellow-50 border-x border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <Settings className="w-4 h-4" />
                          Calibrations
                        </div>
                      </th>
                    )}
                  </tr>

                  {/* Column Headers */}
                  <tr className="bg-white border-y-2 border-gray-300">
                    {visibleColumns.showMOT && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Status</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Expiry Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Book From</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30">Booked Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-orange-50/30">Time</th>
                      </>
                    )}

                    {visibleColumns.showPMI && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">Expiry Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">Book From</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">Booked Date</th>
                        {activeFilter === "PMI Inspection" && paginated.length > 0 && paginated[0]?.pmi?.hover && 
                          Object.keys(paginated[0].pmi.hover).map(key => (
                            <th key={key} className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30">
                              {key.replace(/_/g, " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </th>
                          ))
                        }
                      </>
                    )}

                    {visibleColumns.showTacho && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-blue-50/30">Last Download</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-blue-50/30">Next Download</th>
                      </>
                    )}

                    {visibleColumns.showTyre && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-purple-50/30">Last Check</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-purple-50/30">Next Check</th>
                      </>
                    )}

                    {visibleColumns.showInsurance && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-green-50/30">Insurance Expiry</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-green-50/30">Tax Expiry</th>
                      </>
                    )}

                    {visibleColumns.showCalibrations && (
                      <>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30">Tacho Calib Expiry</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30">Next Tacho Date</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30">Loller Expiry</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-yellow-50/30">Next Loller Date</th>
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

                      {visibleColumns.showMOT && (
                        <>
                          <td className="px-3 py-4 border-l border-gray-200">{getStatusBadge(row.mot?.mot_status || "")}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">{formatDate(row.mot?.mot_expiry)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">{formatDate(row.mot?.book_next_mot_from)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                            {renderMOTBookedDate(row)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-x border-gray-200">
                            {renderMOTBookedTime(row)}
                          </td>
                        </>
                      )}

                      {visibleColumns.showPMI && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">{formatDate(row.pmi?.pmi_expiry)}</td>
                          <td className="px-3 py-4 text-sm border-l border-gray-200">
                            {row.pmi?.book_next_pmi_from === "booked" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Booked
                              </span>
                            ) : (
                              <span className="text-gray-700">{formatDate(row.pmi?.book_next_pmi_from)}</span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm border-l border-gray-200">
                            {renderPMIBookedDate(row)}
                          </td>
                          {activeFilter === "PMI Inspection" && row.pmi?.hover && 
                            Object.entries(row.pmi.hover).map(([key, value]) => (
                              <td key={key} className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                                {value || "-"}
                              </td>
                            ))
                          }
                        </>
                      )}

                      {visibleColumns.showTacho && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">{formatDate(row.tacho?.last_download)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">{formatDate(row.tacho?.next_download)}</td>
                        </>
                      )}

                      {visibleColumns.showTyre && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">{formatDate(row.tyre?.last_check)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">{formatDate(row.tyre?.next_check)}</td>
                        </>
                      )}

                      {visibleColumns.showInsurance && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">{formatDate(row.insurance?.insurance_expiry)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">{formatDate(row.insurance?.tax_expiry)}</td>
                        </>
                      )}

                      {visibleColumns.showCalibrations && (
                        <>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">{formatDate(row.calibration?.tacho_calibration_expiry)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">{formatDate(row.calibration?.next_tacho_calibration_book_date)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">{formatDate(row.calibration?.loller_test_expiry_date)}</td>
                          <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">{formatDate(row.calibration?.next_loller_test_date)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Improved Pagination */}
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
                  className="disabled:opacity-50"
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
                        className={`w-10 ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                            : ''
                        }`}
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
                  className="disabled:opacity-50"
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