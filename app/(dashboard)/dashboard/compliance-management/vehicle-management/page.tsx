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
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { parse, differenceInDays, format, isWithinInterval, isPast } from "date-fns";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import Link from "next/link";
import ExportButton from "@/app/utils/ExportButton";

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    mot: Array<{
      vehicle: number;
      vehicle_reg: string;
      mot_expiry: string;
      book_next_mot_from: string | null;
      next_mot_booked_date: string | null;
      time_mot_booked: string;
      mot_status: string;
    }>;
    pmi: Array<{
      vehicle: number;
      vehicle_reg: string;
      last_pmi_date: string;
      book_next_pmi_from: string;
      next_pmi_date: string;
      hover: {
        second_planned: string;
        third_planned: string;
        fourth_planned: string;
        fifth_planned: string;
        sixth_planned: string;
      };
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
      expiry: string;
      tax_expiry: string;
    }>;
    calibrations: Array<{
      vehicle: number;
      vehicle_reg: string;
      tacho_expiry: string;
      loller_expiry: string | null;
    }>;
  };
}

interface Vehicle {
  id: number;
  vehicle_reg: string;
  type?: string;
  mot_expiry?: string;
  book_next_mot_from?: string | null;
  next_mot_booked_date?: string | null;
  time_mot_booked?: string;
  mot_status?: string;
  last_pmi_date?: string;
  book_next_pmi_from?: string;
  next_pmi_date?: string;
  hover?: {
    second_planned: string;
    third_planned: string;
    fourth_planned: string;
    fifth_planned: string;
    sixth_planned: string;
  };
  last_download?: string | null;
  next_download?: string | null;
  last_check?: string | null;
  next_check?: string | null;
  insurance_expiry?: string;
  tax_expiry?: string;
  tacho_expiry?: string;
  loller_expiry?: string | null;
}

export default function VehicleDashboard() {
  const [fullApiData, setFullApiData] = useState<ApiResponse | null>(null);
  const [filteredData, setFilteredData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Data");
  const [vehicleIdFilter, setVehicleIdFilter] = useState("All Registrations");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [editingField, setEditingField] = useState<{
    vehicleId: number | null;
    field: string | null;
    value: string;
  }>({ vehicleId: null, field: null, value: "" });
  const cookies = useCookies();
  const perPage = 10;

  // Date helpers
  const parseFlexibleDate = (input?: string | null): Date | null => {
    if (!input) return null;
    const trimmed = String(input).trim();
    try {
      const dmy = parse(trimmed, "dd/MM/yyyy", new Date());
      if (!isNaN(dmy.getTime()) && /\d{2}\/\d{2}\/\d{4}/.test(trimmed))
        return dmy;
    } catch {}
    return null;
  };

  const formatDateDmy = (input?: string | null): string => {
    const dt = parseFlexibleDate(input);
    return dt ? format(dt, "dd/MM/yyyy") : input ?? "-";
  };

  const getDaysInfo = (dateString: string | null | undefined, label: string) => {
    if (!dateString) {
      return (
        <div>
          <span className="font-bold">{label}</span>: No date provided
        </div>
      );
    }
    try {
      const date = parseFlexibleDate(dateString);
      if (!date) throw new Error("Invalid date");
      const daysDiff = differenceInDays(date, new Date());
      if (isPast(date)) {
        return (
          <div>
            <span className="font-bold">{label}</span>: Expired{" "}
            {Math.abs(daysDiff)} days ago
          </div>
        );
      }
      return (
        <div>
          <span className="font-bold">{label}</span>: {daysDiff} days remaining
        </div>
      );
    } catch {
      return (
        <div>
          <span className="font-bold">{label}</span>: Invalid date
        </div>
      );
    }
  };

  const filterOptions = [
    { key: "All Data", label: "All Data", icon: null },
    { key: "MOT Expiry", label: "MOT Expiry", icon: Calendar },
    { key: "Book Next MOT From", label: "Book Next MOT From", icon: Calendar },
    { key: "Next MOT Booked Date", label: "Next MOT Booked Date", icon: Calendar },
    { key: "Time MOT Booked", label: "Time MOT Booked", icon: Calendar },
    { key: "MOT Status", label: "MOT Status", icon: Calendar },
    { key: "Last PMI Date", label: "Last PMI Date", icon: Wrench },
    { key: "Next PMI Date", label: "Next PMI Date", icon: Wrench },
    { key: "Book Next PMI From", label: "Book Next PMI From", icon: Wrench },
    { key: "Last Download", label: "Last Download", icon: Download },
    { key: "Next Download", label: "Next Download", icon: Download },
    { key: "Last Check", label: "Last Check", icon: Circle },
    { key: "Next Check", label: "Next Check", icon: Circle },
    { key: "Insurance Expiry", label: "Insurance Expiry", icon: Shield },
    { key: "Tax Expiry", label: "Tax Expiry", icon: Shield },
    { key: "Tacho Expiry", label: "Tacho Expiry", icon: Settings },
    { key: "LOLER Expiry", label: "LOLER Expiry", icon: Settings },
  ];

  const statusFilterOptions = ["All Statuses", "Expired", "Upcoming", "TBC"];

  const getVehicleIds = () => {
    if (!fullApiData) return ["All Registrations"];
    const allIds = new Set<number>();
    Object.values(fullApiData.data).forEach((dataArray) => {
      dataArray.forEach((item) => allIds.add(item.vehicle));
    });
    return ["All Registrations", ...Array.from(allIds).sort((a, b) => a - b).map(String)];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/compliance/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: ApiResponse = await response.json();
      setFullApiData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error fetching vehicle data"
      );
    } finally {
      setLoading(false);
    }
  }, [cookies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getVehicleData = (vehicleId: number) => {
    if (!fullApiData) return null;
    return {
      mot: fullApiData.data.mot.find((item) => item.vehicle === vehicleId),
      pmi: fullApiData.data.pmi.find((item) => item.vehicle === vehicleId),
      tacho: fullApiData.data.tacho.find((item) => item.vehicle === vehicleId),
      tyre: fullApiData.data.tyre.find((item) => item.vehicle === vehicleId),
      insurance: fullApiData.data.insurance.find(
        (item) => item.vehicle === vehicleId
      ),
      calibrations: fullApiData.data.calibrations.find(
        (item) => item.vehicle === vehicleId
      ),
    };
  };

  const getDataForActiveFilter = useCallback((): Vehicle[] => {
    if (!fullApiData) return [];
    const deduplicateByLatest = <
      T extends {
        id: number;
        vehicle_reg: string;
        mot_expiry?: string | null;
        next_pmi_date?: string | null;
        tax_expiry?: string | null;
        tacho_expiry?: string | null;
        loller_expiry?: string | null;
      }
    >(
      items: T[]
    ): T[] => {
      const map = new Map<number, T>();
      items.forEach((item) => {
        const existing = map.get(item.id);
        const itemDate =
          item.mot_expiry ||
          item.next_pmi_date ||
          item.tax_expiry ||
          item.tacho_expiry ||
          item.loller_expiry;
        const existingDate =
          existing?.mot_expiry ||
          existing?.next_pmi_date ||
          existing?.tax_expiry ||
          existing?.tacho_expiry ||
          existing?.loller_expiry;
        if (
          !existing ||
          (itemDate &&
            existingDate &&
            (() => {
              const itemDateObj = parseFlexibleDate(itemDate);
              const existingDateObj = parseFlexibleDate(existingDate);
              if (itemDateObj && existingDateObj) {
                return itemDateObj.getTime() > existingDateObj.getTime();
              }
              return !!itemDateObj;
            })())
        ) {
          map.set(item.id, item);
        }
      });
      return Array.from(map.values());
    };

    const applyStatusAndDateFilters = (vehicles: Vehicle[]): Vehicle[] => {
      const today = new Date();
      let filtered = vehicles;
      if (statusFilter !== "All Statuses") {
        filtered = filtered.filter((vehicle) => {
          const dates = [
            vehicle.mot_expiry,
            vehicle.next_pmi_date,
            vehicle.tax_expiry,
            vehicle.tacho_expiry,
            vehicle.loller_expiry,
            vehicle.next_download,
            vehicle.next_check,
          ].filter(Boolean);
          const expiryDate = dates
            .map((d) => parseFlexibleDate(d))
            .filter((d): d is Date => d !== null)[0];
          if (statusFilter === "TBC") {
            return vehicle.time_mot_booked === "TBC";
          } else if (expiryDate) {
            const daysDiff = differenceInDays(expiryDate, today);
            if (statusFilter === "Expired") return daysDiff < 0;
            if (statusFilter === "Upcoming") return daysDiff >= 0 && daysDiff <= 30;
          }
          return true;
        });
      }
      if (dateRange.start && dateRange.end) {
        filtered = filtered.filter((vehicle) => {
          const dates = [
            vehicle.mot_expiry,
            vehicle.next_pmi_date,
            vehicle.tax_expiry,
            vehicle.tacho_expiry,
            vehicle.loller_expiry,
            vehicle.next_download,
            vehicle.next_check,
          ].filter(Boolean);
          const date = dates
            .map((d) => parseFlexibleDate(d))
            .filter((d): d is Date => d !== null)[0];
          if (!date) return false;
          return isWithinInterval(date, {
            start: dateRange.start as Date,
            end: dateRange.end as Date,
          });
        });
      }
      return filtered;
    };

    let data: Vehicle[] = [];
    switch (activeFilter) {
      case "All Data":
        const allVehicles = new Set<number>();
        Object.values(fullApiData.data).forEach((dataArray) => {
          dataArray.forEach((item) => allVehicles.add(item.vehicle));
        });
        data = Array.from(allVehicles).map((id) => {
          const vehicleData = getVehicleData(id);
          return {
            id,
            vehicle_reg: vehicleData?.mot?.vehicle_reg || vehicleData?.pmi?.vehicle_reg || "",
            type: vehicleData?.mot?.vehicle_reg?.includes("VAN") ? "16-Seater MK7" : "16-Seater MK8",
            mot_expiry: vehicleData?.mot?.mot_expiry,
            book_next_mot_from: vehicleData?.mot?.book_next_mot_from,
            next_mot_booked_date: vehicleData?.mot?.next_mot_booked_date,
            time_mot_booked: vehicleData?.mot?.time_mot_booked,
            mot_status: vehicleData?.mot?.mot_status,
            last_pmi_date: vehicleData?.pmi?.last_pmi_date,
            book_next_pmi_from: vehicleData?.pmi?.book_next_pmi_from,
            next_pmi_date: vehicleData?.pmi?.next_pmi_date,
            hover: vehicleData?.pmi?.hover,
            last_download: vehicleData?.tacho?.last_download,
            next_download: vehicleData?.tacho?.next_download,
            last_check: vehicleData?.tyre?.last_check,
            next_check: vehicleData?.tyre?.next_check,
            insurance_expiry: vehicleData?.insurance?.expiry,
            tax_expiry: vehicleData?.insurance?.tax_expiry,
            tacho_expiry: vehicleData?.calibrations?.tacho_expiry,
            loller_expiry: vehicleData?.calibrations?.loller_expiry,
          };
        });
        break;
      case "MOT Expiry":
        data = deduplicateByLatest(
          fullApiData.data.mot.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            mot_expiry: item.mot_expiry,
          }))
        );
        break;
      case "Book Next MOT From":
        data = deduplicateByLatest(
          fullApiData.data.mot.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            book_next_mot_from: item.book_next_mot_from,
          }))
        );
        break;
      case "Next MOT Booked Date":
        data = deduplicateByLatest(
          fullApiData.data.mot.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            next_mot_booked_date: item.next_mot_booked_date,
          }))
        );
        break;
      case "Time MOT Booked":
        data = deduplicateByLatest(
          fullApiData.data.mot.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            time_mot_booked: item.time_mot_booked,
          }))
        );
        break;
      case "MOT Status":
        data = deduplicateByLatest(
          fullApiData.data.mot.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            mot_status: item.mot_status,
          }))
        );
        break;
      case "Last PMI Date":
        data = deduplicateByLatest(
          fullApiData.data.pmi.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            last_pmi_date: item.last_pmi_date,
          }))
        );
        break;
      case "Next PMI Date":
        data = deduplicateByLatest(
          fullApiData.data.pmi.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            next_pmi_date: item.next_pmi_date,
          }))
        );
        break;
      case "Book Next PMI From":
        data = deduplicateByLatest(
          fullApiData.data.pmi.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            book_next_pmi_from: item.book_next_pmi_from,
          }))
        );
        break;
      case "Last Download":
        data = deduplicateByLatest(
          fullApiData.data.tacho.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            last_download: item.last_download,
          }))
        );
        break;
      case "Next Download":
        data = deduplicateByLatest(
          fullApiData.data.tacho.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            next_download: item.next_download,
          }))
        );
        break;
      case "Last Check":
        data = deduplicateByLatest(
          fullApiData.data.tyre.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            last_check: item.last_check,
          }))
        );
        break;
      case "Next Check":
        data = deduplicateByLatest(
          fullApiData.data.tyre.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            next_check: item.next_check,
          }))
        );
        break;
      case "Insurance Expiry":
        data = deduplicateByLatest(
          fullApiData.data.insurance.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            insurance_expiry: item.expiry,
          }))
        );
        break;
      case "Tax Expiry":
        data = deduplicateByLatest(
          fullApiData.data.insurance.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            tax_expiry: item.tax_expiry,
          }))
        );
        break;
      case "Tacho Expiry":
        data = deduplicateByLatest(
          fullApiData.data.calibrations.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            tacho_expiry: item.tacho_expiry,
          }))
        );
        break;
      case "LOLER Expiry":
        data = deduplicateByLatest(
          fullApiData.data.calibrations.map((item) => ({
            id: item.vehicle,
            vehicle_reg: item.vehicle_reg,
            loller_expiry: item.loller_expiry,
          }))
        );
        break;
    }
    return applyStatusAndDateFilters(data);
  }, [fullApiData, activeFilter, statusFilter, dateRange]);

  useEffect(() => {
    let data = getDataForActiveFilter();
    if (searchQuery) {
      data = data.filter((d) =>
        d.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (vehicleIdFilter !== "All Registrations") {
      data = data.filter((d) => d.id.toString() === vehicleIdFilter);
    }
    setFilteredData(data);
    setTotalPages(Math.ceil(data.length / perPage));
    setCurrentPage(1);
  }, [getDataForActiveFilter, searchQuery, vehicleIdFilter, perPage]);

  const getStatusBadge = (status?: string | null, expiry?: string | null, isMotStatus: boolean = false) => {
    if (!status && !expiry) return <span className="text-gray-400">-</span>;

    if (isMotStatus && status) {
      if (status === "TBC") {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 cursor-pointer">
                TBC
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="text-sm whitespace-pre-line">
                To Be Confirmed as of {format(new Date(), "dd/MM/yyyy HH:mm")} PKT
              </div>
            </PopoverContent>
          </Popover>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          booked
        </span>
      );
    }

    if (expiry) {
      try {
        const parsed = parseFlexibleDate(expiry);
        if (!parsed) throw new Error("Invalid date");
        const today = new Date();
        const daysDiff = differenceInDays(parsed, today);
        const isExpired = daysDiff < 0;
        const isAuditExpiry = daysDiff >= 0 && daysDiff <= 30;

        const bgColor = isExpired
          ? "bg-red-100 text-red-800"
          : isAuditExpiry
          ? "bg-amber-100 text-amber-800"
          : "bg-green-100 text-green-800";

        return (
          <Popover>
            <PopoverTrigger asChild>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${bgColor} cursor-pointer`}
              >
                {formatDateDmy(expiry)}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="text-sm whitespace-pre-line">
                {getDaysInfo(expiry, "Expiry Date")}
              </div>
            </PopoverContent>
          </Popover>
        );
      } catch {
        return <span className="text-gray-900">{formatDateDmy(expiry)}</span>;
      }
    }

    return <span className="text-gray-900">{status}</span>;
  };

  const handleEditStart = (vehicleId: number, field: string, currentValue: string) => {
    setEditingField({ vehicleId, field, value: currentValue || "" });
  };

  const handleEditChange = (value: string) => {
    setEditingField((prev) => (prev ? { ...prev, value } : prev));
  };

  const handleEditSave = async (vehicleId: number, field: string, value: string) => {
    try {
      const response = await fetch(`${API_URL}/api/vehicles/compliance/${vehicleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error("Failed to update");
      await fetchData();
      setEditingField({ vehicleId: null, field: null, value: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating data");
    }
  };

  const renderTableHeaders = () => {
    switch (activeFilter) {
      case "All Data":
        return (
          <>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                Vehicle ID
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-orange-700 bg-orange-500/30 border-orange-600"
                colSpan={5}
              >
                MOT
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-rose-700 bg-rose-200 border-rose-600"
                colSpan={3}
              >
                PMI Inspections
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-blue-700 bg-blue-500/30 border-blue-600"
                colSpan={2}
              >
                Tacho Download
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-purple-700 bg-purple-500/30 border-purple-600"
                colSpan={2}
              >
                Tyre Maintenance
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-green-700 bg-green-500/30 border-green-600"
                colSpan={2}
              >
                Insurance & Tax
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-yellow-700 bg-yellow-500/30 border-yellow-600"
                colSpan={2}
              >
                Calibrations
              </th>
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 text-xs font-medium text-gray-600 sticky left-0 z-10 bg-gray-50"></th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30 min-w-[120px]">
                MOT Expiry
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30 min-w-[140px]">
                Book Next MOT From
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30 min-w-[140px]">
                Next MOT Booked Date
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30 min-w-[120px]">
                Time MOT Booked
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30 min-w-[120px]">
                MOT Status
              </th>
              <th className="text-left p-2 text-xs font-medium text-rose-700 bg-rose-200 min-w-[130px]">
                Last PMI Date
              </th>
              <th className="text-left p-2 text-xs font-medium text-rose-700 bg-rose-200 min-w-[150px]">
                Next PMI Date
              </th>
              <th className="text-left p-2 text-xs font-medium text-rose-700 bg-rose-200 min-w-[130px]">
                Book Next PMI From
              </th>
              <th className="text-left p-2 text-xs font-medium text-blue-700 bg-blue-500/30 min-w-[130px]">
                Last Download
              </th>
              <th className="text-left p-2 text-xs font-medium text-blue-700 bg-blue-500/30 min-w-[130px]">
                Next Download
              </th>
              <th className="text-left p-2 text-xs font-medium text-purple-700 bg-purple-500/30 min-w-[120px]">
                Last Check
              </th>
              <th className="text-left p-2 text-xs font-medium text-purple-700 bg-purple-500/30 min-w-[120px]">
                Next Check
              </th>
              <th className="text-left p-2 text-xs font-medium text-green-700 bg-green-500/30 min-w-[130px]">
                Insurance Expiry
              </th>
              <th className="text-left p-2 text-xs font-medium text-green-700 bg-green-500/30 min-w-[130px]">
                Tax Expiry
              </th>
              <th className="text-left p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30 min-w-[140px]">
                Tacho Expiry
              </th>
              <th className="text-left p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30 min-w-[140px]">
                LOLER Expiry
              </th>
            </tr>
          </>
        );
      case "MOT Expiry":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">MOT Expiry</th>
          </tr>
        );
      case "Book Next MOT From":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Book Next MOT From</th>
          </tr>
        );
      case "Next MOT Booked Date":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next MOT Booked Date</th>
          </tr>
        );
      case "Time MOT Booked":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Time MOT Booked</th>
          </tr>
        );
      case "MOT Status":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">MOT Status</th>
          </tr>
        );
      case "Last PMI Date":
        return (
          <tr className="border-b border-gray-200 bg-pink-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last PMI Date</th>
          </tr>
        );
      case "Next PMI Date":
        return (
          <tr className="border-b border-gray-200 bg-pink-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next PMI Date</th>
          </tr>
        );
      case "Book Next PMI From":
        return (
          <tr className="border-b border-gray-200 bg-pink-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Book Next PMI From</th>
          </tr>
        );
      case "Last Download":
        return (
          <tr className="border-b border-gray-200 bg-blue-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last Download</th>
          </tr>
        );
      case "Next Download":
        return (
          <tr className="border-b border-gray-200 bg-blue-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Download</th>
          </tr>
        );
      case "Last Check":
        return (
          <tr className="border-b border-gray-200 bg-purple-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last Check</th>
          </tr>
        );
      case "Next Check":
        return (
          <tr className="border-b border-gray-200 bg-purple-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Check</th>
          </tr>
        );
      case "Insurance Expiry":
        return (
          <tr className="border-b border-gray-200 bg-green-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Insurance Expiry</th>
          </tr>
        );
      case "Tax Expiry":
        return (
          <tr className="border-b border-gray-200 bg-green-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Tax Expiry</th>
          </tr>
        );
      case "Tacho Expiry":
        return (
          <tr className="border-b border-gray-200 bg-yellow-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Tacho Expiry</th>
          </tr>
        );
      case "LOLER Expiry":
        return (
          <tr className="border-b border-gray-200 bg-yellow-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle ID</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">LOLER Expiry</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item: Vehicle, index: number) => {
    const vehicleData = getVehicleData(item.id);
    const motData = vehicleData?.mot;
    const pmiData = vehicleData?.pmi;
    const tachoData = vehicleData?.tacho;
    const tyreData = vehicleData?.tyre;
    const insuranceData = vehicleData?.insurance;
    const calibrationData = vehicleData?.calibrations;

    const isEditing = (field: string) => editingField.vehicleId === item.id && editingField.field === field;

    switch (activeFilter) {
      case "All Data":
        return (
          <tr
            key={`${item.id}-${index}`}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="p-3 font-medium text-gray-900 border-gray-200 sticky left-0 z-10 bg-white">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    motData?.time_mot_booked === "TBC" ? "bg-orange-500/30" : "bg-green-500/30"
                  }`}
                ></div>
                <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                  {item.vehicle_reg}
                </Link>
              </div>
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              {getStatusBadge(null, motData?.mot_expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              {formatDateDmy(motData?.book_next_mot_from)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              {isEditing("next_mot_booked_date") ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingField.value}
                    onChange={(e) => handleEditChange(e.target.value)}
                    className="w-32"
                    placeholder="dd/MM/yyyy"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(item.id, "next_mot_booked_date", editingField.value)}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <span
                  className="cursor-pointer"
                  onClick={() => handleEditStart(item.id, "next_mot_booked_date", motData?.next_mot_booked_date || "")}
                >
                  {formatDateDmy(motData?.next_mot_booked_date)}
                </span>
              )}
            </td>
            <td className="p-2 text-sm border-gray-200">
              {isEditing("time_mot_booked") ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingField.value}
                    onChange={(e) => handleEditChange(e.target.value)}
                    className="w-32"
                    placeholder="HH:mm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(item.id, "time_mot_booked", editingField.value)}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <span
                  className="cursor-pointer"
                  onClick={() => handleEditStart(item.id, "time_mot_booked", motData?.time_mot_booked || "")}
                >
                  {getStatusBadge(motData?.time_mot_booked, null, true)}
                </span>
              )}
            </td>
            <td className="p-2 text-sm border-gray-200">
              {getStatusBadge(
                motData?.next_mot_booked_date && motData?.time_mot_booked && motData?.time_mot_booked !== "TBC"
                  ? "booked"
                  : motData?.mot_expiry && parseFlexibleDate(motData.mot_expiry) && differenceInDays(parseFlexibleDate(motData.mot_expiry)!, new Date()) < 0
                  ? "Expired"
                  : "TBC",
                null,
                true
              )}
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(pmiData?.last_pmi_date)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(pmiData?.last_pmi_date, "Last PMI Date")}
                    {pmiData?.hover && (
                      <div className="mt-2">
                        <span className="font-bold">Planned PMI Dates:</span>
                        <ul className="list-disc pl-4">
                          <li>2nd: {formatDateDmy(pmiData.hover.second_planned)}</li>
                          <li>3rd: {formatDateDmy(pmiData.hover.third_planned)}</li>
                          <li>4th: {formatDateDmy(pmiData.hover.fourth_planned)}</li>
                          <li>5th: {formatDateDmy(pmiData.hover.fifth_planned)}</li>
                          <li>6th: {formatDateDmy(pmiData.hover.sixth_planned)}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm border-gray-200">
              {getStatusBadge(null, pmiData?.next_pmi_date || "TBC")}
            </td>
            <td className="p-2 text-sm border-gray-200">
              {pmiData?.next_pmi_date ? "booked" : formatDateDmy(pmiData?.book_next_pmi_from)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(tachoData?.last_download)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(tachoData?.last_download, "Last Download")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {getStatusBadge(null, tachoData?.next_download)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(tachoData?.next_download, "Next Download")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(tyreData?.last_check)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(tyreData?.last_check, "Last Check")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {getStatusBadge(null, tyreData?.next_check)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(tyreData?.next_check, "Next Check")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              {getStatusBadge(null, insuranceData?.expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              {getStatusBadge(null, insuranceData?.tax_expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-gray-200">
              {getStatusBadge(null, calibrationData?.tacho_expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900">
              {getStatusBadge(null, calibrationData?.loller_expiry)}
            </td>
          </tr>
        );
      case "MOT Expiry":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-orange-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{getStatusBadge(null, item.mot_expiry)}</td>
          </tr>
        );
      case "Book Next MOT From":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-orange-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.book_next_mot_from)}</td>
          </tr>
        );
      case "Next MOT Booked Date":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-orange-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              {isEditing("next_mot_booked_date") ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingField.value}
                    onChange={(e) => handleEditChange(e.target.value)}
                    className="w-32"
                    placeholder="dd/MM/yyyy"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(item.id, "next_mot_booked_date", editingField.value)}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <span
                  className="cursor-pointer"
                  onClick={() => handleEditStart(item.id, "next_mot_booked_date", item.next_mot_booked_date || "")}
                >
                  {formatDateDmy(item.next_mot_booked_date)}
                </span>
              )}
            </td>
          </tr>
        );
      case "Time MOT Booked":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-orange-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm">
              {isEditing("time_mot_booked") ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingField.value}
                    onChange={(e) => handleEditChange(e.target.value)}
                    className="w-32"
                    placeholder="HH:mm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(item.id, "time_mot_booked", editingField.value)}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <span
                  className="cursor-pointer"
                  onClick={() => handleEditStart(item.id, "time_mot_booked", item.time_mot_booked || "")}
                >
                  {getStatusBadge(item.time_mot_booked, null, true)}
                </span>
              )}
            </td>
          </tr>
        );
      case "MOT Status":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-orange-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm">
              {getStatusBadge(
                item.next_mot_booked_date && item.time_mot_booked && item.time_mot_booked !== "TBC"
                  ? "booked"
                  : item.mot_expiry && parseFlexibleDate(item.mot_expiry) && differenceInDays(parseFlexibleDate(item.mot_expiry)!, new Date()) < 0
                  ? "Expired"
                  : "TBC",
                null,
                true
              )}
            </td>
          </tr>
        );
      case "Last PMI Date":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-pink-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">{formatDateDmy(item.last_pmi_date)}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.last_pmi_date, "Last PMI Date")}
                    {item.hover && (
                      <div className="mt-2">
                        <span className="font-bold">Planned PMI Dates:</span>
                        <ul className="list-disc pl-4">
                          <li>2nd: {formatDateDmy(item.hover.second_planned)}</li>
                          <li>3rd: {formatDateDmy(item.hover.third_planned)}</li>
                          <li>4th: {formatDateDmy(item.hover.fourth_planned)}</li>
                          <li>5th: {formatDateDmy(item.hover.fifth_planned)}</li>
                          <li>6th: {formatDateDmy(item.hover.sixth_planned)}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        );
      case "Next PMI Date":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-pink-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{getStatusBadge(null, item.next_pmi_date || "TBC")}</td>
          </tr>
        );
      case "Book Next PMI From":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-pink-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              {item.next_pmi_date ? "booked" : formatDateDmy(item.book_next_pmi_from)}
            </td>
          </tr>
        );
      case "Last Download":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-blue-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">{formatDateDmy(item.last_download)}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.last_download, "Last Download")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        );
      case "Next Download":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-blue-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">{getStatusBadge(null, item.next_download)}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.next_download, "Next Download")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        );
      case "Last Check":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-purple-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">{formatDateDmy(item.last_check)}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.last_check, "Last Check")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        );
      case "Next Check":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-purple-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">{getStatusBadge(null, item.next_check)}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.next_check, "Next Check")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        );
      case "Insurance Expiry":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-green-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{getStatusBadge(null, item.insurance_expiry)}</td>
          </tr>
        );
      case "Tax Expiry":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-green-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{getStatusBadge(null, item.tax_expiry)}</td>
          </tr>
        );
      case "Tacho Expiry":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-yellow-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{getStatusBadge(null, item.tacho_expiry)}</td>
          </tr>
        );
      case "LOLER Expiry":
        return (
          <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-yellow-50">
            <td className="p-3 font-medium text-gray-900">
              <Link href={`/dashboard/compliance-management/vehicle-management/${item.id}`}>
                {item.vehicle_reg}
              </Link>
            </td>
            <td className="p-3 text-sm text-gray-900">{getStatusBadge(null, item.loller_expiry)}</td>
          </tr>
        );
      default:
        return null;
    }
  };

  const handlePreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const getRowRange = () => {
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, filteredData.length);
    return `${start}-${end}`;
  };
  const paginatedData = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Vehicle Maintenance & Compliance Overview
        </h1>
        <p className="text-gray-600">
          Monitor and manage vehicle compliance across all categories
        </p>
      </div>
      <div className="">
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.key;
            return (
              <div className="flex items-center group" key={filter.key}>
                <button
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center h-[30px] gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap ${
                    isActive ? "bg-orange-500 text-white" : "text-gray-600"
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {filter.label}
                </button>
                <div
                  className={`w-0 h-0 border-b-[30px] ${
                    isActive ? "border-b-orange-500" : "border-b-transparent"
                  } border-r-[30px] border-r-transparent`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 z-1 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search vehicles by ID..."
            className="pl-9 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white border-gray-300">
              {vehicleIdFilter} <Filter className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {getVehicleIds().map((id) => (
              <DropdownMenuItem
                key={id}
                onClick={() => setVehicleIdFilter(id)}
              >
                {id}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white border-gray-300">
              {statusFilter} <Filter className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {statusFilterOptions.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-64 justify-between bg-white border-gray-300"
            >
              {dateRange.start && dateRange.end
                ? `${format(dateRange.start, "dd/MM/yyyy")} - ${format(
                    dateRange.end,
                    "dd/MM/yyyy"
                  )}`
                : "Select Date Range"}
              <Calendar className="w-4 h-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="flex flex-col sm:flex-row gap-4 p-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Start Date</h3>
                <ShadcnCalendar
                  mode="single"
                  selected={dateRange.start ?? undefined}
                  onSelect={(date) =>
                    setDateRange({ ...dateRange, start: date || null })
                  }
                  className="rounded-md border"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">End Date</h3>
                <ShadcnCalendar
                  mode="single"
                  selected={dateRange.end ?? undefined}
                  onSelect={(date) =>
                    setDateRange({ ...dateRange, end: date || null })
                  }
                  disabled={(date) =>
                    dateRange.start ? date < dateRange.start : false
                  }
                  className="rounded-md border"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="">
          <ExportButton data={filteredData} fileName="Vehicle Compliance" />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12 text-gray-500/30">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading vehicle
            data...
          </div>
        ) : error ? (
          <div className="text-red-500/30 text-center py-12">
            <div className="text-lg font-medium mb-2">Error Loading Data</div>
            <div className="text-sm">{error}</div>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>{renderTableHeaders()}</thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) =>
                    renderTableRow(item, index)
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={
                        activeFilter === "All Data"
                          ? 16
                          : 2
                      }
                      className="text-center py-12 text-gray-500/30"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-lg font-medium">
                          No vehicles found
                        </div>
                        <div className="text-sm">
                          No vehicles match the current filters:{" "}
                          <span className="font-medium text-orange-600">
                            {activeFilter}, {statusFilter}, {vehicleIdFilter},
                            {dateRange.start && dateRange.end
                              ? `Date Range: ${format(
                                  dateRange.start,
                                  "dd/MM/yyyy"
                                )} to ${format(dateRange.end, "dd/MM/yyyy")}`
                              : "No Date Range"}
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            setActiveFilter("All Data");
                            setStatusFilter("All Statuses");
                            setVehicleIdFilter("All Registrations");
                            setDateRange({ start: null, end: null });
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && !error && filteredData.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500/30">
            Showing {getRowRange()} of {filteredData.length} vehicles
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="bg-white border-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(
                1,
                Math.min(currentPage - 2 + i, totalPages - 4 + i)
              );
              if (page < 1 || page > totalPages) return null;
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`${
                    currentPage === page
                      ? "bg-orange-500/30 text-white border-orange-500/30"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </Button>
              );
            }).filter(Boolean)}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-white border-gray-300"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}