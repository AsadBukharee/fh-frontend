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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import Link from "next/link";
import { toast } from "sonner";
import DateDisplay, {
  formatDate,
  getDateStatus,
  shouldShowTBC,
} from "./DateDisplay";

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
      mot_status_color: string;
    }>;
    pmi: Array<{
      vehicle: number;
      vehicle_reg: string;
      pmi_expiry: string | null;
      last_pmi_date: string | null;
      book_next_pmi_from: string | null;
      next_pmi_book_date: string;
      hover: Record<string, string>;
      pmi_status: string;
      pmi_status_color: string;
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

type TabType =
  | "All Data"
  | "MOT"
  | "PMI Inspection"
  | "Vehicle Tacho Download"
  | "Tyre Maintenance Check"
  | "Insurance & Check"
  | "Calibrations";

type EditableField = {
  type:
  | "mot_date"
  | "mot_time"
  | "pmi_date"
  | "tacho_calib_date"
  | "loller_calib_date";
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

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [pendingDateUpdate, setPendingDateUpdate] = useState<{
    vehicleId: number;
    newDate: string;
    vehicleReg: string;
    currentTime?: string;
    isFirstTime: boolean;
  } | null>(null);
  const [newTimeValue, setNewTimeValue] = useState("09:00");

  const [sweepDialogOpen, setSweepDialogOpen] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepTitle, setSweepTitle] = useState("Maintenance Notice");
  const [sweepMessage, setSweepMessage] = useState(
    "System maintenance scheduled at midnight.",
  );

  const cookies = useCookies();

  const getStatusBadge = (text: string, color?: string) => {
    if (shouldShowTBC(text))
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600">
          TBC
        </span>
      );

    // Use the color from API if provided
    if (color) {
      const colorClasses = {
        red: "bg-red-100 text-red-800",
        green: "bg-green-100 text-green-800",
        amber: "bg-amber-100 text-amber-800",
        orange: "bg-orange-100 text-orange-800",
        yellow: "bg-yellow-100 text-yellow-800",
        blue: "bg-blue-100 text-blue-800",
        purple: "bg-purple-100 text-purple-800",
        gray: "bg-gray-100 text-gray-800"
      };

      const bgColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
          {text}
        </span>
      );
    }

    // Fallback to old logic if no color provided
    if (text.includes("Expired") || text.includes("Expires today"))
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {text}
        </span>
      );
    if (text.includes("Expiring in") || text.includes("days left"))
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          {text}
        </span>
      );
    if (text === "Booked")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {text}
        </span>
      );
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
      mot: new Map(fullApiData.data.mot.map((i) => [i.vehicle, i])),
      pmi: new Map(fullApiData.data.pmi.map((i) => [i.vehicle, i])),
      tacho: new Map(fullApiData.data.tacho.map((i) => [i.vehicle, i])),
      tyre: new Map(fullApiData.data.tyre.map((i) => [i.vehicle, i])),
      insurance: new Map(fullApiData.data.insurance.map((i) => [i.vehicle, i])),
      calibration: new Map(
        fullApiData.data.calibrations.map((i) => [i.vehicle, i]),
      ),
    };

    const allIds = new Set([
      ...maps.mot.keys(),
      ...maps.pmi.keys(),
      ...maps.tacho.keys(),
      ...maps.tyre.keys(),
      ...maps.insurance.keys(),
      ...maps.calibration.keys(),
    ]);

    return Array.from(allIds).map((id) => ({
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
      if (activeFilter === "MOT") data = data.filter((r) => r.mot);
      if (activeFilter === "PMI Inspection") data = data.filter((r) => r.pmi);
      if (activeFilter === "Vehicle Tacho Download")
        data = data.filter((r) => r.tacho);
      if (activeFilter === "Tyre Maintenance Check")
        data = data.filter((r) => r.tyre);
      if (activeFilter === "Insurance & Check")
        data = data.filter((r) => r.insurance);
      if (activeFilter === "Calibrations")
        data = data.filter((r) => r.calibration);
    }

    if (searchQuery)
      data = data.filter((r) =>
        r.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    if (vehicleRegFilter !== "All Registrations")
      data = data.filter((r) => r.vehicle_reg === vehicleRegFilter);
    if (statusFilter === "Expired")
      data = data.filter((r) => r.mot?.mot_status.includes("Expired"));
    if (statusFilter === "Upcoming")
      data = data.filter((r) => r.mot?.mot_status.includes("days left"));
    if (statusFilter === "TBC")
      data = data.filter((r) =>
        shouldShowTBC(r.mot?.next_mot_booked_date, "booking"),
      );

    setFilteredData(data);
    setCurrentPage(1);
  }, [buildRows, activeFilter, searchQuery, vehicleRegFilter, statusFilter]);

  const handleDoubleClick = (
    vehicleId: number,
    fieldType: EditableField["type"],
    currentValue: string,
  ) => {
    if (fieldType === "mot_time") {
      const row = filteredData.find((r) => r.vehicle === vehicleId);
      if (row && shouldShowTBC(row.mot?.next_mot_booked_date, "booking")) {
        toast.error("Please set a date first before setting time");
        return;
      }
      setEditingField({
        type: fieldType,
        vehicleId,
        originalValue: currentValue,
      });
      setEditValue(currentValue || "");
    } else {
      setEditingField({
        type: fieldType,
        vehicleId,
        originalValue: currentValue,
      });
      setEditValue(currentValue || "");
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
        case "mot_date":
          const motItem = fullApiData?.data.mot.find(
            (m) => m.vehicle === editingField.vehicleId,
          );
          const hasExistingTime =
            motItem?.next_mot_booked_time &&
            !shouldShowTBC(motItem.next_mot_booked_time);

          setPendingDateUpdate({
            vehicleId: editingField.vehicleId,
            newDate: editValue,
            vehicleReg: motItem?.vehicle_reg || "Unknown",
            currentTime: motItem?.next_mot_booked_time,
            isFirstTime: !hasExistingTime,
          });

          if (hasExistingTime) {
            setNewTimeValue(motItem.next_mot_booked_time);
          } else {
            setNewTimeValue("09:00");
          }

          setTimeDialogOpen(true);
          setIsUpdating(false);
          return;

        case "mot_time":
          const motItemForTime = fullApiData?.data.mot.find(
            (m) => m.vehicle === editingField.vehicleId,
          );
          if (shouldShowTBC(motItemForTime?.next_mot_booked_date, "booking")) {
            toast.error("Please set a date first before setting time");
            setIsUpdating(false);
            return;
          }
          payload.mot_booked_time = editValue.includes(":")
            ? editValue
            : `${editValue}:00`;
          break;

        case "pmi_date":
          payload.next_pmi_book_date = editValue;
          break;
        case "tacho_calib_date":
          payload.next_tacho_calibration_book_date = editValue;
          break;
        case "loller_calib_date":
          payload.next_loller_test_date = editValue;
          break;
      }

      if (
        editingField.type === "mot_time" ||
        editingField.type === "pmi_date" ||
        editingField.type === "tacho_calib_date" ||
        editingField.type === "loller_calib_date"
      ) {
        const response = await fetch(
          `${API_URL}/api/vehicles/${editingField.vehicleId}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Update failed");
        }

        const result = await response.json();

        if (result.success) {
          toast.success(result.message || "Updated successfully");
          updateLocalData(editingField.vehicleId, editingField.type, editValue);
          setEditingField(null);
        } else {
          throw new Error(result.message || "Update failed");
        }
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update.");
      setEditValue(editingField.originalValue);
    } finally {
      setIsUpdating(false);
    }
  };

  const saveDateAndTime = async (
    vehicleId: number,
    date: string,
    time: string | null,
  ) => {
    setIsUpdating(true);
    try {
      const payload: any = {
        mot_booked_date: date,
      };

      if (time) {
        payload.mot_booked_time = time.includes(":") ? time : `${time}:00`;
      } else {
        payload.mot_booked_time = null;
      }

      const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      const result = await response.json();

      if (result.success) {
        const successMessage = time
          ? "Date and time updated successfully"
          : "Date updated successfully (time cleared)";
        toast.success(successMessage);

        if (fullApiData) {
          const updatedData = { ...fullApiData };
          const motIndex = updatedData.data.mot.findIndex(
            (m) => m.vehicle === vehicleId,
          );
          if (motIndex !== -1) {
            updatedData.data.mot[motIndex].next_mot_booked_date = date;
            updatedData.data.mot[motIndex].next_mot_booked_time = time || "";
            setFullApiData(updatedData);
          }
        }

        setEditingField(null);
        setTimeDialogOpen(false);
        setPendingDateUpdate(null);
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTimeDialogSave = () => {
    if (pendingDateUpdate) {
      saveDateAndTime(
        pendingDateUpdate.vehicleId,
        pendingDateUpdate.newDate,
        newTimeValue,
      );
    }
  };

  const handleTimeDialogSkip = () => {
    if (pendingDateUpdate) {
      if (pendingDateUpdate.isFirstTime) {
        toast.error("Please set a time for the booking");
        return;
      }

      saveDateAndTime(
        pendingDateUpdate.vehicleId,
        pendingDateUpdate.newDate,
        null,
      );
    }
  };

  const handleTimeDialogCancel = () => {
    setTimeDialogOpen(false);
    setPendingDateUpdate(null);
    setEditingField(null);
    toast.info("Date change cancelled");
  };

  const updateLocalData = (
    vehicleId: number,
    fieldType: EditableField["type"],
    value: string,
  ) => {
    if (!fullApiData) return;

    const updatedData = { ...fullApiData };

    if (fieldType === "mot_date") {
      const motIndex = updatedData.data.mot.findIndex(
        (m) => m.vehicle === vehicleId,
      );
      if (motIndex !== -1) {
        updatedData.data.mot[motIndex].next_mot_booked_date = value;
        setFullApiData(updatedData);
      }
    } else if (fieldType === "mot_time") {
      const motIndex = updatedData.data.mot.findIndex(
        (m) => m.vehicle === vehicleId,
      );
      if (motIndex !== -1) {
        updatedData.data.mot[motIndex].next_mot_booked_time = value;
        setFullApiData(updatedData);
      }
    } else if (fieldType === "pmi_date") {
      const pmiIndex = updatedData.data.pmi.findIndex(
        (p) => p.vehicle === vehicleId,
      );
      if (pmiIndex !== -1) {
        updatedData.data.pmi[pmiIndex].next_pmi_book_date = value;
        setFullApiData(updatedData);
      }
    } else if (fieldType === "tacho_calib_date") {
      const calibIndex = updatedData.data.calibrations.findIndex(
        (c) => c.vehicle === vehicleId,
      );
      if (calibIndex !== -1) {
        updatedData.data.calibrations[
          calibIndex
        ].next_tacho_calibration_book_date = value;
        setFullApiData(updatedData);
      }
    } else if (fieldType === "loller_calib_date") {
      const calibIndex = updatedData.data.calibrations.findIndex(
        (c) => c.vehicle === vehicleId,
      );
      if (calibIndex !== -1) {
        updatedData.data.calibrations[calibIndex].next_loller_test_date = value;
        setFullApiData(updatedData);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingField) return;

      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingField, editValue]);

  // Planned date keys in order
  const plannedDateKeys = [
    "second_planned",
    "third_planned",
    "fourth_planned",
    "fifth_planned",
    "sixth_planned"
  ];

  const renderMOTBookedDate = (row: VehicleRow) => {
    const isEditing =
      editingField?.type === "mot_date" &&
      editingField?.vehicleId === row.vehicle;
    const value = row.mot?.next_mot_booked_date;

    const displayValue = shouldShowTBC(value, "booking")
      ? "TBC"
      : formatDate(value, false);

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
      <DateDisplay
        date={row.mot?.next_mot_booked_date || null}
        compareDate={row.mot?.book_next_mot_from}
        onClick={() =>
          handleDoubleClick(
            row.vehicle,
            "mot_date",
            row.mot?.next_mot_booked_date || "",
          )
        }
        isEditable={true}
        showTBC={true}
        fieldType="booking"
        showBookedText={
          !shouldShowTBC(row.mot?.next_mot_booked_date, "booking")
        }
        isBooking={!shouldShowTBC(row.mot?.next_mot_booked_date, "booking")}
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const renderMOTBookedTime = (row: VehicleRow) => {
    const isEditing =
      editingField?.type === "mot_time" &&
      editingField?.vehicleId === row.vehicle;
    const value = row.mot?.next_mot_booked_time;
    const hasValidDate = !shouldShowTBC(
      row.mot?.next_mot_booked_date,
      "booking",
    );

    if (!hasValidDate && !isEditing) {
      return (
        <div
          className="px-3 py-4 text-sm text-gray-400 bg-gray-50 rounded min-h-[44px] flex items-center cursor-not-allowed"
          title="Set date first to add time"
        >
          TBC
        </div>
      );
    }

    const displayValue = shouldShowTBC(value) ? "TBC" : value || "NA";

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
        onDoubleClick={() => {
          if (hasValidDate) {
            handleDoubleClick(
              row.vehicle,
              "mot_time",
              row.mot?.next_mot_booked_time || "",
            );
          }
        }}
        title={
          hasValidDate ? "Double-click to edit" : "Set date first to add time"
        }
      >
        {displayValue}
      </div>
    );
  };

  const renderPMIBookedDate = (row: VehicleRow) => {
    const isEditing =
      editingField?.type === "pmi_date" &&
      editingField?.vehicleId === row.vehicle;
    const value = row.pmi?.next_pmi_book_date;

    const displayValue = shouldShowTBC(value, "booking")
      ? "TBC"
      : formatDate(value, false);

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

    // Show popover for non-PMI tabs or when hover data exists
    if (row.pmi?.hover && Object.keys(row.pmi.hover).length > 0) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer min-h-[44px] flex items-center gap-1"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(
                  row.vehicle,
                  "pmi_date",
                  row.pmi?.next_pmi_book_date || "",
                );
              }}
              title="Double-click to edit, hover for planned dates"
            >
              <DateDisplay
                date={row.pmi?.next_pmi_book_date || null}
                compareDate={row.pmi?.book_next_pmi_from}
                className="!bg-transparent !text-rose-600 hover:!text-rose-800"
                showTBC={true}
                fieldType="booking"
                showBookedText={
                  !shouldShowTBC(row.pmi?.next_pmi_book_date, "booking")
                }
                isBooking={
                  !shouldShowTBC(row.pmi?.next_pmi_book_date, "booking")
                }
              >
                {displayValue}
              </DateDisplay>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-80 overflow-y-auto">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-900">
                Planned PMI Dates for {row.vehicle_reg}
              </h4>
              <div className="text-xs">
                <div className="grid grid-cols-2 gap-1 mb-2 pb-2 border-b border-gray-200">
                  <div className="font-semibold text-gray-700">Period</div>
                  <div className="font-semibold text-gray-700">Planned Date</div>
                </div>
                {Object.entries(row.pmi.hover).map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 gap-1 py-1 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, " ")}:
                    </div>
                    <div className="text-gray-900">{value}</div>
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
        onClick={() =>
          handleDoubleClick(
            row.vehicle,
            "pmi_date",
            row.pmi?.next_pmi_book_date || "",
          )
        }
        isEditable={true}
        showTBC={true}
        fieldType="booking"
        showBookedText={!shouldShowTBC(row.pmi?.next_pmi_book_date, "booking")}
        isBooking={!shouldShowTBC(row.pmi?.next_pmi_book_date, "booking")}
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const renderTachoCalibrationDate = (row: VehicleRow) => {
    const isEditing =
      editingField?.type === "tacho_calib_date" &&
      editingField?.vehicleId === row.vehicle;
    const value = row.calibration?.next_tacho_calibration_book_date;

    const displayValue = shouldShowTBC(value, "booking")
      ? "TBC"
      : formatDate(value, false);

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
      <DateDisplay
        date={row.calibration?.next_tacho_calibration_book_date || null}
        onClick={() =>
          handleDoubleClick(
            row.vehicle,
            "tacho_calib_date",
            row.calibration?.next_tacho_calibration_book_date || "",
          )
        }
        isEditable={true}
        showTBC={true}
        fieldType="booking"
        showBookedText={
          !shouldShowTBC(
            row.calibration?.next_tacho_calibration_book_date,
            "booking",
          )
        }
        isBooking={
          !shouldShowTBC(
            row.calibration?.next_tacho_calibration_book_date,
            "booking",
          )
        }
      >
        {displayValue}
      </DateDisplay>
    );
  };

  const renderLollerCalibrationDate = (row: VehicleRow) => {
    const isEditing =
      editingField?.type === "loller_calib_date" &&
      editingField?.vehicleId === row.vehicle;
    const value = row.calibration?.next_loller_test_date;

    const displayValue = shouldShowTBC(value, "booking")
      ? "TBC"
      : formatDate(value, false);

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
      <DateDisplay
        date={row.calibration?.next_loller_test_date || null}
        onClick={() =>
          handleDoubleClick(
            row.vehicle,
            "loller_calib_date",
            row.calibration?.next_loller_test_date || "",
          )
        }
        isEditable={true}
        showTBC={true}
        fieldType="booking"
        showBookedText={
          !shouldShowTBC(row.calibration?.next_loller_test_date, "booking")
        }
        isBooking={
          !shouldShowTBC(row.calibration?.next_loller_test_date, "booking")
        }
      >
        {displayValue}
      </DateDisplay>
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

  const performSweepAudit = async () => {
    if (!sweepTitle.trim() || !sweepMessage.trim()) {
      toast.error("Please fill in title and message");
      return;
    }

    setIsSweeping(true);
    try {
      const nowIso = new Date().toISOString();

      const response = await fetch(
        `${API_URL}/api/notifications/sweep-vehicle-audit-now/`,
        {
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
        },
      );

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
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to trigger sweep audit",
      );
    } finally {
      setIsSweeping(false);
    }
  };

  const visibleColumns = getVisibleColumns();
  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginated = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const uniqueRegs = [
    "All Registrations",
    ...Array.from(new Set(filteredData.map((r) => r.vehicle_reg))).sort(),
  ];

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
      <AlertDialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDateUpdate?.isFirstTime
                ? "Set Booking Time"
                : "Update Booking Time"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDateUpdate?.isFirstTime ? (
                <>
                  You&apos;re setting a new MOT date for{" "}
                  <span className="font-semibold text-orange-600">
                    {pendingDateUpdate?.vehicleReg}
                  </span>
                  . Please select a booking time for{" "}
                  {pendingDateUpdate?.newDate}.
                </>
              ) : (
                <>
                  You&apos;ve changed the MOT date for{" "}
                  <span className="font-semibold text-orange-600">
                    {pendingDateUpdate?.vehicleReg}
                  </span>
                  . Please update the booking time for{" "}
                  {pendingDateUpdate?.newDate}.
                  {pendingDateUpdate?.currentTime && (
                    <div className="mt-2 text-sm">
                      Current time:{" "}
                      <span className="font-medium">
                        {pendingDateUpdate.currentTime}
                      </span>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="time-input" className="block mb-2">
              {pendingDateUpdate?.isFirstTime
                ? "Booking Time"
                : "New Booking Time"}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="time-input"
              type="time"
              value={newTimeValue}
              onChange={(e) => setNewTimeValue(e.target.value)}
              className="w-full"
              disabled={isUpdating}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Select the time for the MOT appointment on{" "}
              {pendingDateUpdate?.newDate}
            </p>
          </div>

          <AlertDialogFooter>
            {!pendingDateUpdate?.isFirstTime && (
              <AlertDialogCancel
                onClick={handleTimeDialogCancel}
                disabled={isUpdating}
              >
                Cancel
              </AlertDialogCancel>
            )}
            {pendingDateUpdate?.isFirstTime ? (
              <div className="flex gap-2 w-full">
                <AlertDialogCancel
                  onClick={handleTimeDialogCancel}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  Cancel
                </AlertDialogCancel>
                <Button
                  onClick={handleTimeDialogSave}
                  disabled={isUpdating || !newTimeValue}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Date & Time"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTimeDialogSkip}
                  disabled={isUpdating}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  Clear Time
                </Button>
                <Button
                  onClick={handleTimeDialogSave}
                  disabled={isUpdating || !newTimeValue}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Time"
                  )}
                </Button>
              </div>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vehicle Compliance
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor and manage vehicle maintenance schedules
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Double-click on MOT/PMI booked dates to edit
            </p>
            <p className="text-xs text-orange-500 mt-1">
              ⚠️ Time selection required when setting/updating MOT dates
            </p>
          </div>

          <div className="flex gap-3">
            <Dialog open={sweepDialogOpen} onOpenChange={setSweepDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={loading || isUpdating || isSweeping}
                  variant="outline"
                  className="bg-orange-500 hover:bg-orange-600 cursor-pointer text-white hover:text-white"
                  size="sm"
                >
                  <Play
                    className={`w-4 h-4 mr-2 ${isSweeping ? "animate-spin" : ""}`}
                  />
                  Sweep Audit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Trigger Sweep Vehicle Audit</DialogTitle>
                  <DialogDescription>
                    This will immediately run a vehicle compliance sweep using
                    the current date and time ({new Date().toLocaleString()}).
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

            <Button
              onClick={fetchData}
              disabled={loading || isUpdating || isSweeping}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading || isUpdating || isSweeping ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="bg-white">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as TabType)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all
                    ${active
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
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

        <div className="bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by registration..."
                className="pl-9 border-gray-300 focus:ring-2 focus:ring-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  {vehicleRegFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-64 overflow-y-auto"
              >
                {uniqueRegs.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onSelect={() => setVehicleRegFilter(r)}
                  >
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
                {["All Statuses", "Expired", "Upcoming", "TBC"].map((s) => (
                  <DropdownMenuItem key={s} onSelect={() => setStatusFilter(s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="ml-auto text-sm text-gray-600">
              {filteredData.length} vehicle
              {filteredData.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
              <p className="text-gray-600">Loading vehicle data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-600 text-lg">No vehicles found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 z-50">
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th
                        rowSpan={2}
                        className="p-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-100 z-50 border-r-2 border-gray-300 min-w-[140px]"
                      >
                        Vehicle Reg
                      </th>

                      {visibleColumns.showMOT && (
                        <th
                          colSpan={5}
                          className="min-w-[240px] px-4 py-3 text-center text-sm font-semibold text-orange-500 bg-orange-100 border-x border-gray-200 sticky top-0 z-40"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            MOT Information
                          </div>
                        </th>
                      )}

                      {visibleColumns.showPMI && (
                        <th
                          colSpan={activeFilter === "PMI Inspection" ? 10 : 4}
                          className="min-w-[240px] px-4 py-3 text-center text-sm font-semibold text-rose-900 bg-rose-50 border-x border-gray-200 sticky top-0 z-40"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Wrench className="w-4 h-4" />
                            PMI Information
                          </div>
                        </th>
                      )}

                      {visibleColumns.showTacho && (
                        <th
                          colSpan={2}
                          className="min-w-[240px] px-4 py-3 text-center text-sm font-semibold text-blue-900 bg-blue-50 border-x border-gray-200 sticky top-0 z-40"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Vehicle Tacho Download Information
                          </div>
                        </th>
                      )}

                      {visibleColumns.showTyre && (
                        <th
                          colSpan={2}
                          className="min-w-[240px] px-4 py-3 text-center text-sm font-semibold text-purple-900 bg-purple-50 border-x border-gray-200 sticky top-0 z-40"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Circle className="w-4 h-4" />
                            Tyre Maintenance Information
                          </div>
                        </th>
                      )}

                      {visibleColumns.showInsurance && (
                        <th
                          colSpan={2}
                          className="min-w-[240px] px-4 py-3 text-center text-sm font-semibold text-green-900 bg-green-50 border-x border-gray-200 sticky top-0 z-40"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            Insurance & Tax Information
                          </div>
                        </th>
                      )}

                      {visibleColumns.showCalibrations && (
                        <th
                          colSpan={4}
                          className="min-w-[240px] px-4 py-3 text-center text-sm font-semibold text-yellow-900 bg-yellow-50 border-x border-gray-200 sticky top-0 z-40"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Settings className="w-4 h-4" />
                            Vehicle Tacho & Loller Calibration Information
                          </div>
                        </th>
                      )}
                    </tr>

                    <tr className="bg-white border-y-2 border-gray-300 sticky top-[61px] z-40">
                      {visibleColumns.showMOT && (
                        <>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30 sticky top-[61px]">
                            MOT Status
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30 sticky top-[61px]">
                            MOT Expiry Date
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30 sticky top-[61px]">
                            Book Next MOT From
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-orange-50/30 sticky top-[61px]">
                            Next MOT Booked Date
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-orange-50/30 sticky top-[61px]">
                            Time
                          </th>
                        </>
                      )}

                      {visibleColumns.showPMI && (
                        <>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30 sticky top-[61px]">
                            PMI Status
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30 sticky top-[61px]">
                            Last PMI Date
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30 sticky top-[61px]">
                            PMI Expiry Date
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-rose-50/30 sticky top-[61px]">
                            Next PMI Booked Date
                          </th>

                          {/* Planned Dates Columns - Only show when PMI tab is active */}
                          {activeFilter === "PMI Inspection" && (
                            <>
                              {plannedDateKeys.map((key, index) => (
                                <th
                                  key={key}
                                  className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-rose-50/30 sticky top-[61px]"
                                >
                                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </th>
                              ))}
                            </>
                          )}
                        </>
                      )}

                      {visibleColumns.showTacho && (
                        <>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-blue-50/30 sticky top-[61px]">
                            Last Vehicle Tacho Download
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-blue-50/30 sticky top-[61px]">
                            Next Vehicle Tacho Download
                          </th>
                        </>
                      )}

                      {visibleColumns.showTyre && (
                        <>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-purple-50/30 sticky top-[61px]">
                            Last Tyre Check
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-purple-50/30 sticky top-[61px]">
                            Next Tyre Check
                          </th>
                        </>
                      )}

                      {visibleColumns.showInsurance && (
                        <>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-green-50/30 sticky top-[61px]">
                            Insurance Expiry
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-green-50/30 sticky top-[61px]">
                            Tax Expiry
                          </th>
                        </>
                      )}

                      {visibleColumns.showCalibrations && (
                        <>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30 sticky top-[61px]">
                            Tacho Calibration Expiry
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30 sticky top-[61px]">
                            Next Tacho Calib Date
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-gray-200 bg-yellow-50/30 sticky top-[61px]">
                            Loller Calibration Expiry
                          </th>
                          <th className="min-w-[150px] px-3 py-3 text-xs font-medium text-gray-700 border-l border-x border-gray-200 bg-yellow-50/30 sticky top-[61px]">
                            Next Loller Calib Date
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map((row, idx) => (
                      <tr
                        key={row.vehicle}
                        className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="p-4 font-semibold text-gray-900 sticky left-0 bg-inherit z-30 border-r-2 border-gray-200">
                          <Link
                            href={`/dashboard/compliance-management/vehicle-management/${row.vehicle}`}
                          >
                            {row.vehicle_reg}
                          </Link>
                        </td>

                        {visibleColumns.showMOT && (
                          <>
                            <td className="px-3 py-4 border-l border-gray-200">
                              {getStatusBadge(
                                row.mot?.mot_status || "",
                                row.mot?.mot_status_color
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm text-black border-l border-gray-200">
                              {formatDate(row.mot?.mot_expiry, false)}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                              <DateDisplay
                                date={row.mot?.book_next_mot_from ?? null}
                                compareDate={row.mot?.next_mot_booked_date}
                                isNextMOTFrom={true}
                              >
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

                        {visibleColumns.showPMI && (
                          <>
                            <td className="px-3 py-4 text-sm border-l border-gray-200">
                              {getStatusBadge(
                                row.pmi?.pmi_status || "",
                                row.pmi?.pmi_status_color
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                              <DateDisplay
                                date={row.pmi?.last_pmi_date ?? null}
                                isBlackText={true}
                              >
                                {formatDate(row.pmi?.last_pmi_date, false)}
                              </DateDisplay>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 border-l border-gray-200">
                              <DateDisplay
                                date={row.pmi?.pmi_expiry ?? null}
                                compareDate={row.pmi?.book_next_pmi_from}
                                fieldType="pmi_expiry"
                                warningDays={10}
                                showExpiryText={true}
                              >
                                {formatDate(row.pmi?.pmi_expiry, false)}
                              </DateDisplay>
                            </td>
                            <td className="px-3 py-4 text-sm border-l border-x border-gray-200">
                              {renderPMIBookedDate(row)}
                            </td>

                            {/* Planned Dates Cells - Only show when PMI tab is active */}
                            {activeFilter === "PMI Inspection" && (
                              <>
                                {plannedDateKeys.map((key) => (
                                  <td
                                    key={key}
                                    className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200 bg-rose-50/30"
                                  >
                                    <DateDisplay
                                      date={row.pmi?.hover?.[key] || null}
                                      isBlackText={true}
                                      showTBC={false}
                                    >
                                      {row.pmi?.hover?.[key] || "-"}
                                    </DateDisplay>
                                  </td>
                                ))}
                              </>
                            )}
                          </>
                        )}

                        {visibleColumns.showTacho && (
                          <>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                              <DateDisplay
                                date={row.tacho?.last_download ?? null}
                                isBlackText={true}
                              >
                                {formatDate(row.tacho?.last_download, false)}
                              </DateDisplay>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                              <DateDisplay
                                date={row.tacho?.next_download ?? null}
                                fieldType="booking"
                                showBookedText={
                                  !shouldShowTBC(row.tacho?.next_download)
                                }
                                isBooking={
                                  !shouldShowTBC(row.tacho?.next_download)
                                }
                              >
                                {formatDate(row.tacho?.next_download, false)}
                              </DateDisplay>
                            </td>
                          </>
                        )}

                        {visibleColumns.showTyre && (
                          <>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                              <DateDisplay
                                date={row.tyre?.last_check ?? null}
                                isBlackText={true}
                              >
                                {formatDate(row.tyre?.last_check, false)}
                              </DateDisplay>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                              <DateDisplay
                                date={row.tyre?.next_check ?? null}
                                fieldType="booking"
                                showBookedText={
                                  !shouldShowTBC(row.tyre?.next_check)
                                }
                                isBooking={!shouldShowTBC(row.tyre?.next_check)}
                              >
                                {formatDate(row.tyre?.next_check, false)}
                              </DateDisplay>
                            </td>
                          </>
                        )}

                        {visibleColumns.showInsurance && (
                          <>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                              <DateDisplay
                                date={row.insurance?.insurance_expiry ?? null}
                                fieldType="insurance_expiry"
                                warningDays={60}
                                showExpiryText={true}
                                hoverText={
                                  row.insurance?.insurance_expiry
                                    ? getDateStatus(
                                      row.insurance.insurance_expiry,
                                    ) === "red"
                                      ? "Insurance expired"
                                      : "5 days to insurance expiry"
                                    : "No expiry date"
                                }
                              >
                                {formatDate(
                                  row.insurance?.insurance_expiry,
                                  false,
                                )}
                              </DateDisplay>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-x border-gray-200">
                              <DateDisplay
                                date={row.insurance?.tax_expiry ?? null}
                                fieldType="tax_expiry"
                                warningDays={45}
                                showExpiryText={true}
                                hoverText={
                                  row.insurance?.tax_expiry
                                    ? getDateStatus(row.insurance.tax_expiry) ===
                                      "red"
                                      ? "Tax expired"
                                      : "5 days to tax expiry"
                                    : "No expiry date"
                                }
                              >
                                {formatDate(row.insurance?.tax_expiry, false)}
                              </DateDisplay>
                            </td>
                          </>
                        )}

                        {visibleColumns.showCalibrations && (
                          <>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                              <DateDisplay
                                date={
                                  row.calibration?.tacho_calibration_expiry ??
                                  null
                                }
                                isBlackText={true}
                              >
                                {formatDate(
                                  row.calibration?.tacho_calibration_expiry,
                                  false,
                                )}
                              </DateDisplay>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                              {renderTachoCalibrationDate(row)}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 text-center border-l border-gray-200">
                              <DateDisplay
                                date={
                                  row.calibration?.loller_test_expiry_date ?? null
                                }
                                isBlackText={true}
                              >
                                {formatDate(
                                  row.calibration?.loller_test_expiry_date,
                                  false,
                                )}
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
            </div>
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {(currentPage - 1) * perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * perPage, filteredData.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredData.length}
                </span>{" "}
                vehicles
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
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
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 ${currentPage === pageNum ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" : ""}`}
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
                  onClick={() => setCurrentPage((p) => p + 1)}
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