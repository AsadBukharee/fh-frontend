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
import { parse, differenceInDays, format, isWithinInterval, isPast, parseISO } from "date-fns";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ExportButton from "@/app/utils/ExportButton";

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    mot: Array<{
      vehicle_reg: string;
      mot_expiry: string;
      next_mot_booked_from: string | null;
      next_mot_booked_date: string | null;
      time_mot_booked: string;
    }>;
    pmi: Array<{
      vehicle_reg: string;
      next_inspection_book_date: string;
    }>;
    tacho: Array<{
      vehicle_reg: string;
      last_download: string | null;
      next_download: string | null;
    }>;
    tyre: Array<{
      vehicle_reg: string;
      last_check: string | null;
      next_check: string | null;
    }>;
    insurance: Array<{
      vehicle_reg: string;
      expiry: string;
    }>;
    calibrations: Array<{
      vehicle_reg: string;
      expiry: string;
    }>;
  };
}

interface Vehicle {
  vehicle_reg: string;
  type?: string;
  mot_expiry?: string;
  next_mot_booked_from?: string | null;
  next_mot_booked_date?: string | null;
  time_mot_booked?: string;
  next_inspection_book_date?: string;
  last_download?: string | null;
  next_download?: string | null;
  last_check?: string | null;
  next_check?: string | null;
  expiry?: string;
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
  const [vehicleRegFilter, setVehicleRegFilter] = useState("All Registrations");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
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
    const candidateFormats = [
      "yyyy-MM-dd'T'HH:mm:ssXXX",
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
      "yyyy-MM-dd'T'HH:mm:ss'Z'",
      "yyyy-MM-dd",
      "dd-MM-yyyy",
      "MM/dd/yyyy",
    ];
    for (const fmt of candidateFormats) {
      try {
        const dt = parse(trimmed, fmt, new Date());
        if (!isNaN(dt.getTime())) return dt;
      } catch {}
    }
    const dt = new Date(trimmed);
    return isNaN(dt.getTime()) ? null : dt;
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
      const date = parseFlexibleDate(dateString) || parseISO(dateString);
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
    { key: "MOT", label: "MOT", icon: Calendar },
    { key: "PMI Inspection", label: "PMI Inspection", icon: Wrench },
    {
      key: "Vehicle Tacho Download",
      label: "Vehicle Tacho Download",
      icon: Download,
    },
    {
      key: "Tyre Maintenance Check",
      label: "Tyre Maintenance Check",
      icon: Circle,
    },
    { key: "Insurance & Check", label: "Insurance & Check", icon: Shield },
    { key: "Calibrations", label: "Calibrations", icon: Settings },
  ];

  const statusFilterOptions = ["All Statuses", "Expired", "Upcoming", "TBC"];

  // Get unique vehicle registrations for the dropdown
  const getVehicleRegistrations = () => {
    if (!fullApiData) return ["All Registrations"];
    const allRegs = new Set<string>();
    Object.values(fullApiData.data).forEach((dataArray) => {
      dataArray.forEach((item) => allRegs.add(item.vehicle_reg));
    });
    return ["All Registrations", ...Array.from(allRegs).sort()];
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

  const getDataForActiveFilter = useCallback((): Vehicle[] => {
    if (!fullApiData) return [];

    const deduplicateByLatest = <
      T extends { vehicle_reg: string; mot_expiry?: string; expiry?: string }
    >(
      items: T[]
    ): T[] => {
      const map = new Map<string, T>();
      items.forEach((item) => {
        const existing = map.get(item.vehicle_reg);
        const itemDate = item.mot_expiry || item.expiry;
        const existingDate = existing?.mot_expiry || existing?.expiry;
        if (
          !existing ||
          (itemDate &&
            existingDate &&
            !!parseFlexibleDate(itemDate) &&
!!parseFlexibleDate(existingDate) &&
parseFlexibleDate(itemDate)!.getTime() > parseFlexibleDate(existingDate)!.getTime()

            )
        ) {
          map.set(item.vehicle_reg, item);
        }
      });
      return Array.from(map.values());
    };

    const applyStatusAndDateFilters = (vehicles: Vehicle[]): Vehicle[] => {
      const today = new Date("2025-09-22T22:45:00"); // Updated to current date and time (10:45 PM PKT)
      let filtered = vehicles;

      // Status filter
      if (statusFilter !== "All Statuses") {
        filtered = filtered.filter((vehicle) => {
          const dates = [
            vehicle.mot_expiry,
            vehicle.expiry,
            vehicle.next_inspection_book_date,
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
            if (statusFilter === "Upcoming")
              return daysDiff >= 0 && daysDiff <= 30;
          }
          return true;
        });
      }

      // Date range filter
      if (dateRange.start && dateRange.end) {
        filtered = filtered.filter((vehicle) => {
          const dates = [
            vehicle.mot_expiry,
            vehicle.expiry,
            vehicle.next_inspection_book_date,
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
        const allVehicles = new Set<string>();
        Object.values(fullApiData.data).forEach((dataArray) => {
          dataArray.forEach((item) => allVehicles.add(item.vehicle_reg));
        });
        data = Array.from(allVehicles).map((reg) => {
          const vehicleData = getVehicleData(reg);
          return {
            vehicle_reg: reg,
            type: reg.includes("VAN") ? "16-Seater MK7" : "16-Seater MK8",
            mot_expiry: vehicleData?.mot?.mot_expiry,
            next_mot_booked_from: vehicleData?.mot?.next_mot_booked_from,
            next_mot_booked_date: vehicleData?.mot?.next_mot_booked_date,
            time_mot_booked: vehicleData?.mot?.time_mot_booked,
            next_inspection_book_date: vehicleData?.pmi?.next_inspection_book_date,
            last_download: vehicleData?.tacho?.last_download,
            next_download: vehicleData?.tacho?.next_download,
            last_check: vehicleData?.tyre?.last_check,
            next_check: vehicleData?.tyre?.next_check,
            expiry: vehicleData?.insurance?.expiry || vehicleData?.calibrations?.expiry,
          };
        });
        break;
      case "MOT":
        data = deduplicateByLatest(fullApiData.data.mot);
        break;
      case "PMI Inspection":
        data = deduplicateByLatest(fullApiData.data.pmi);
        break;
      case "Vehicle Tacho Download":
        data = deduplicateByLatest(fullApiData.data.tacho);
        break;
      case "Tyre Maintenance Check":
        data = deduplicateByLatest(fullApiData.data.tyre);
        break;
      case "Insurance & Check":
        data = deduplicateByLatest(fullApiData.data.insurance);
        break;
      case "Calibrations":
        data = deduplicateByLatest(fullApiData.data.calibrations);
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
    if (vehicleRegFilter !== "All Registrations") {
      data = data.filter((d) => d.vehicle_reg === vehicleRegFilter);
    }
    setFilteredData(data);
    setTotalPages(Math.ceil(data.length / perPage));
    setCurrentPage(1);
  }, [getDataForActiveFilter, searchQuery, vehicleRegFilter, perPage]);

  const getStatusBadge = (status?: string | null, expiry?: string) => {
    if (!status && !expiry) return <span className="text-gray-400">-</span>;

    if (expiry) {
      try {
        const parsed = parseFlexibleDate(expiry);
        const expiryDate = parsed ?? parse(expiry, "dd/MM/yyyy", new Date());
        const today = new Date("2025-09-22T22:45:00");
        const daysDiff = differenceInDays(expiryDate, today);
        if (daysDiff < 0) {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 cursor-pointer">
                  Expired {Math.abs(daysDiff)} days ago
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="text-sm whitespace-pre-line">
                  {getDaysInfo(expiry, "Expiry Date")}
                </div>
              </PopoverContent>
            </Popover>
          );
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 cursor-pointer">
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

    if (typeof status === "string" && status === "TBC") {
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
    return <span className="text-gray-900">{status}</span>;
  };

  const renderTableHeaders = () => {
    switch (activeFilter) {
      case "All Data":
        return (
          <>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                Vehicle Reg
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-orange-700 bg-orange-500/30  border-orange-600"
                colSpan={4}
              >
                MOT
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-rose-700 bg-rose-200  ose-500/30"
                colSpan={1}
              >
                PMI Inspections
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-blue-700 bg-blue-500/30  border-blue-600"
                colSpan={2}
              >
                Tacho Download
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-purple-700 bg-purple-500/30  border-purple-600"
                colSpan={2}
              >
                Tyre Maintenance
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-green-700 bg-green-500/30  border-green-600"
                colSpan={1}
              >
                Insurance & Tax
              </th>
              <th
                className="text-center p-3 text-sm font-medium text-yellow-700 bg-yellow-500/30"
                colSpan={1}
              >
                Calibrations
              </th>
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 text-xs font-medium text-gray-600 sticky left-0 z-10 bg-gray-50"></th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30  min-w-[120px]">
                MOT Expiry
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30  min-w-[140px]">
                Next MOT Booked From
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30  min-w-[140px]">
                Next MOT Booked Date
              </th>
              <th className="text-left p-2 text-xs font-medium text-orange-700 bg-orange-500/30  min-w-[120px]">
                Time MOT Booked
              </th>
              <th className="text-left p-2 text-xs font-medium text-rose-700 bg-rose-200 min-w-[150px]">
                Next Inspection Book Date
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
              <th className="text-left p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30 min-w-[140px]">
                Calibration Expiry
              </th>
            </tr>
          </>
        );
      case "MOT":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Vehicle Reg
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              MOT Expiry
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Next MOT Booked From
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Next MOT Booked Date
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Time MOT Booked
            </th>
          </tr>
        );
      case "PMI Inspection":
        return (
          <tr className="border-b border-gray-200 bg-pink-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Vehicle Reg
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Next Inspection Book Date
            </th>
          </tr>
        );
      case "Vehicle Tacho Download":
        return (
          <tr className="border-b border-gray-200 bg-blue-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Vehicle Reg
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Last Download
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Next Download
            </th>
          </tr>
        );
      case "Tyre Maintenance Check":
        return (
          <tr className="border-b border-gray-200 bg-purple-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Vehicle Reg
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Last Check
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Next Check
            </th>
          </tr>
        );
      case "Insurance & Check":
        return (
          <tr className="border-b border-gray-200 bg-green-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Vehicle Reg
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Insurance Expiry
            </th>
          </tr>
        );
      case "Calibrations":
        return (
          <tr className="border-b border-gray-200 bg-yellow-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Vehicle Reg
            </th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">
              Calibration Expiry
            </th>
          </tr>
        );
      default:
        return null;
    }
  };

  const getVehicleData = (vehicleReg: string) => {
    if (!fullApiData) return null;
    return {
      mot: fullApiData.data.mot.find((item) => item.vehicle_reg === vehicleReg),
      pmi: fullApiData.data.pmi.find((item) => item.vehicle_reg === vehicleReg),
      tacho: fullApiData.data.tacho.find(
        (item) => item.vehicle_reg === vehicleReg
      ),
      tyre: fullApiData.data.tyre.find(
        (item) => item.vehicle_reg === vehicleReg
      ),
      insurance: fullApiData.data.insurance.find(
        (item) => item.vehicle_reg === vehicleReg
      ),
      calibrations: fullApiData.data.calibrations.find(
        (item) => item.vehicle_reg === vehicleReg
      ),
    };
  };

  const renderTableRow = (item: Vehicle, index: number) => {
    const vehicleData = getVehicleData(item.vehicle_reg);
    const motData = vehicleData?.mot;
    const pmiData = vehicleData?.pmi;
    const tachoData = vehicleData?.tacho;
    const tyreData = vehicleData?.tyre;
    const insuranceData = vehicleData?.insurance;
    const calibrationData = vehicleData?.calibrations;

    switch (activeFilter) {
      case "All Data":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="p-3 font-medium text-gray-900  border-gray-200 sticky left-0 z-10 bg-white">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    motData?.time_mot_booked === "TBC"
                      ? "bg-orange-500/30"
                      : "bg-green-500/30"
                  }`}
                ></div>
                {item.vehicle_reg}
              </div>
            </td>
            <td className="p-2 text-sm text-gray-900  border-gray-200">
              {getStatusBadge(null, motData?.mot_expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900  border-gray-200">
              {formatDateDmy(motData?.next_mot_booked_from)}
            </td>
            <td className="p-2 text-sm text-gray-900  border-gray-200">
              {formatDateDmy(motData?.next_mot_booked_date)}
            </td>
            <td className="p-2 text-sm  border-gray-200">
              {getStatusBadge(motData?.time_mot_booked)}
            </td>
            <td className="p-2 text-sm  border-gray-200">
              {getStatusBadge(pmiData?.next_inspection_book_date)}
            </td>
            <td className="p-2 text-sm text-gray-900  border-gray-200">
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
            <td className="p-2 text-sm text-gray-900  border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(tachoData?.next_download)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(tachoData?.next_download, "Next Download")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm text-gray-900  border-gray-200">
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
            <td className="p-2 text-sm text-gray-900  border-gray-200">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(tyreData?.next_check)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(tyreData?.next_check, "Next Check")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-2 text-sm text-gray-900  border-gray-200">
              {getStatusBadge(null, insuranceData?.expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900">
              {getStatusBadge(null, calibrationData?.expiry)}
            </td>
          </tr>
        );
      case "MOT":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-orange-50"
          >
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">
              {getStatusBadge(null, item.mot_expiry)}
            </td>
            <td className="p-3 text-sm text-gray-900">
              {formatDateDmy(item.next_mot_booked_from)}
            </td>
            <td className="p-3 text-sm text-gray-900">
              {formatDateDmy(item.next_mot_booked_date)}
            </td>
            <td className="p-3 text-sm">{getStatusBadge(item.time_mot_booked)}</td>
          </tr>
        );
      case "PMI Inspection":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-pink-50"
          >
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">
              {getStatusBadge(item.next_inspection_book_date)}
            </td>
          </tr>
        );
      case "Vehicle Tacho Download":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-blue-50"
          >
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(item.last_download)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.last_download, "Last Download")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(item.next_download)}
                  </span>
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
      case "Tyre Maintenance Check":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-purple-50"
          >
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(item.last_check)}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="text-sm whitespace-pre-line">
                    {getDaysInfo(item.last_check, "Last Check")}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
            <td className="p-3 text-sm text-gray-900">
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer">
                    {formatDateDmy(item.next_check)}
                  </span>
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
      case "Insurance & Check":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-green-50"
          >
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">
              {getStatusBadge(null, item.expiry)}
            </td>
          </tr>
        );
      case "Calibrations":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-yellow-50"
          >
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">
              {getStatusBadge(null, item.expiry)}
            </td>
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
                  key={filter.key}
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
            placeholder="Search vehicles..."
            className="pl-9 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white border-gray-300">
              {vehicleRegFilter} <Filter className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {getVehicleRegistrations().map((reg) => (
              <DropdownMenuItem
                key={reg}
                onClick={() => setVehicleRegFilter(reg)}
              >
                {reg}
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
        {/* <ExportButton fileName="Vehicle Managements Data" data={fullApiData} /> */}
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
                          ? 11
                          : activeFilter === "MOT"
                          ? 5
                          : activeFilter === "PMI Inspection"
                          ? 2
                          : 3
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
                            {activeFilter}, {statusFilter}, {vehicleRegFilter},
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
                            setVehicleRegFilter("All Registrations");
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