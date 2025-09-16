"use client";
import { useState, useEffect, useMemo, type FC } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CalendarDays, Car, ChevronLeft, ChevronRight, Edit, Eye, Trash2, Download, MoreVertical, Check, Database, Scale, Settings, X, Calendar, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import BadgeList from "../BadgeList";
// API configuration
const API_CONFIG = {
  baseUrl: "https://api.example.com", // Replace with actual API host
  endpoints: {
    pmi: "/activity/pmi/history/",
    update: "/activity/pmi/{id}/",
    delete: "/activity/pmi/{id}/",
    download: "/activity/pmi/{id}/download/",
    vehicles: "/api/vehicles/", // New endpoint for fetching vehicles
  },
};
// Type definitions
interface TyreData {
  [key: string]: string | number | null | undefined;
}
// New Vehicle type
interface Vehicle {
  id?: number | string;
  vehicle_reg?: string;
  registration_number?: string;
  vehicles_type?: { id: string | number };
}
interface PmiRow {
  id: number | string;
  vehicle_reg: string;
  pmi_expiry: string | null;
  analysis_date: string;
  defects: string;
  notes: string;
  status: string;
  file_url: string | null;
  brake_test_not_recorded: string | null;
  brake_test_report_attached: string | null;
  maintenance_error_answer: string | null;
  maintenance_provider_error: string | null;
  brake_imbalance: string | null;
  brake_imbalance_note: string | null;
  maintenance_error_note: string | null;
  Correct_DTP_Code_Used: string | null;
  Correct_DTP_Code_Used_references: string | null;
  signature: string | null;
  created_at: string;
  updated_at: string;
  vehicle: number;
  created_by: number | null;
  tyre_pressure: TyreData;
  tyre_depth: TyreData;
  tyre_dates: TyreData;
  driver_info?: {
    defects: string;
    status: string;
    notes: string;
    pmi_report_date: string;
  };
}
// ActionMenu component (unchanged)
const ActionMenu: FC<{
  row: PmiRow;
  onEdit: (row: PmiRow) => void;
  onView: (row: PmiRow) => void;
  onDelete: (id: number | string) => void;
  onDownload: (id: number | string) => void;
  onApprove: (id: number | string) => void;
  onReject: (id: number | string) => void;
}> = ({ row, onEdit, onView, onDelete, onDownload, onApprove, onReject }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onView(row)}>
        <Eye className="w-4 h-4 mr-2" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(row)}>
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDownload(row.id)}>
        <Download className="w-4 h-4 mr-2" />
        Download
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onApprove(row.id)}>
        <Check className="w-4 h-4 mr-2" />
        Approve
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onReject(row.id)} className="text-red-600">
        <X className="w-4 h-4 mr-2" />
        Reject
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onDelete(row.id)} className="text-red-600">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
// StatusCell component (updated with text type)
const StatusCell: FC<{
  status: string | number | null | undefined;
  rowId: number | string;
  field: string;
  column: string;
  onUpdate: (id: number | string, field: string, column: string, value: string | number) => void;
  isEditable: boolean;
  type: "number" | "status" | "date" | "text";
}> = ({ status, rowId, field, column, onUpdate, isEditable, type }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(status ?? "");
  const handleSave = () => {
    onUpdate(rowId, field, column, value);
    setIsEditing(false);
  };
  if (!isEditable) {
    return <span>{status ?? "N/A"}</span>;
  }
  if (isEditing) {
    if (type === "status") {
      return (
        <Select
          value={value.toString()}
          onValueChange={(val) => {
            setValue(val);
            onUpdate(rowId, field, column, val);
            setIsEditing(false);
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="NA">NA</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="w-20"
        autoFocus
      />
    );
  }
  return (
    <span
      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
      onClick={() => setIsEditing(true)}
    >
      {status ?? "N/A"}
    </span>
  );
};
const getSafetyColor = (value: string | number | null | undefined, field: string): string => {
  if (value === null || value === undefined || value === "") return "";
  if (field === "tyre_pressure") {
    const num = Number(value);
    if (num < 30) return "bg-red-100 text-red-800";
    if (num < 35) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }
  if (field === "tyre_depth") {
    const num = Number(value);
    if (num < 1.6) return "bg-red-100 text-red-800";
    if (num < 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }
  return "";
};
const PMIHistory: FC = () => {
  const [pmiData, setPmiData] = useState<PmiRow[]>([]);
  const [activeTab, setActiveTab] = useState<"All Data" | "Tyre Depth" | "Tyre Dates" | "Others">("All Data");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PmiRow | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<PmiRow>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof PmiRow; direction: "asc" | "desc" } | null>(null);
  // New state for vehicle filter
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const token = useCookies().get("access_token");
  const tabs = [
    { label: "All Data", icon: Database },
    { label: "Tyre Depth", icon: Scale },
    { label: "Tyre Dates", icon: CalendarDays },
    { label: "Others", icon: Settings },
  ] as const;
  const safeSetPmiData = (newData: unknown) => {
    if (Array.isArray(newData)) {
      setPmiData(newData as PmiRow[]);
    } else {
      console.error("Attempted to set non-array data:", newData);
      setPmiData([]);
      setError("Invalid data format received");
    }
  };
  const transformApiResponse = (apiData: any[]): PmiRow[] => {
    const flatData: PmiRow[] = [];
    apiData.forEach((item) => {
      Object.entries(item).forEach(([vehicle_reg, vehicleRecords]: [string, any]) => {
        if (!vehicleRecords.pmi_analysis) return;
        vehicleRecords.pmi_analysis.forEach((record: any) => {
          if (!record.id || !record.vehicle_reg) {
            console.warn("Skipping invalid record:", record);
            return;
          }
          const tyrePressure: TyreData = {};
          const tyreDepth: TyreData = {};
          const tyreDates: TyreData = {};
          Object.keys(record).forEach((key) => {
            if (key.startsWith("tyre_pressure_")) {
              const tyreKey = key.replace("tyre_pressure_", "");
              tyrePressure[tyreKey] = record[key];
            } else if (key.startsWith("tyre_depth_")) {
              const tyreKey = key.replace("tyre_depth_", "");
              tyreDepth[tyreKey] = record[key];
            } else if (key.startsWith("tyre_date_")) {
              const tyreKey = key.replace("tyre_date_", "");
              tyreDates[tyreKey] = record[key];
            }
          });
          const matchingDriver = vehicleRecords.pmi_drivers?.find((d: any) => d.pmi === record.id);
          const driverInfo = matchingDriver ? {
            defects: matchingDriver.defects,
            status: matchingDriver.status,
            notes: matchingDriver.notes,
            pmi_report_date: matchingDriver.pmi_report_date,
          } : undefined;
          flatData.push({
            ...record,
            tyre_pressure: tyrePressure,
            tyre_depth: tyreDepth,
            tyre_dates: tyreDates,
            driver_info: driverInfo,
          } as PmiRow);
        });
      });
    });
    return flatData;
  };
  const flattenTyreFields = (row: Partial<PmiRow>): Record<string, any> => {
    const flattened: Record<string, any> = { ...row };
    ["tyre_pressure", "tyre_depth", "tyre_dates"].forEach((field) => {
      const value = (row as any)[field];
      if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, val]) => {
          flattened[`${field}_${key}`] = val;
        });
      }
    });
    return flattened;
  };
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });
  };
  // New function to fetch vehicles
  const fetchVehicles = async () => {
    try {
      const response = await apiCall(API_CONFIG.endpoints.vehicles);
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles with status ${response.status}`);
      }
      const apiResponse = await response.json();
      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        console.error("Invalid vehicles response:", apiResponse);
        setVehicles([]);
        setError(apiResponse.message || "Invalid vehicles response format");
        return;
      }
      setVehicles(apiResponse.data as Vehicle[]);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setError("Failed to load vehicle list");
    }
  };
  const fetchPmiData = async (vehicleId?: string) => {
    setLoading(true);
    try {
      // Updated to handle vehicle filter
      const endpoint = vehicleId && vehicleId !== "all"
        ? `${API_CONFIG.endpoints.pmi}${vehicleId}/`
        : API_CONFIG.endpoints.pmi;
      const response = await apiCall(endpoint);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const apiResponse = await response.json();
      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        console.error("API response is invalid:", apiResponse);
        safeSetPmiData([]);
        setError(apiResponse.message || "Invalid API response format");
        return;
      }
      const transformedData = transformApiResponse(apiResponse.data);
      safeSetPmiData(transformedData);
    } catch (error) {
      console.error("Failed to fetch PMI data:", error);
      setError("Failed to load PMI records");
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = () => {
    setSearchTerm("");
    setCurrentPage(1);
    setSelectedVehicle("all"); // Reset vehicle filter on refresh
    fetchPmiData();
  };
  const handleStatusUpdate = async (
    id: number | string,
    field: string,
    column: string,
    value: string | number
  ) => {
    try {
      const endpoint = API_CONFIG.endpoints.update.replace("{id}", id.toString());
      const updatedRow = pmiData.find((row) => row.id === id);
      if (!updatedRow) return;
      const isTyreField =
        field === "tyre_pressure" || field === "tyre_depth" || field === "tyre_dates";
      let updatedData: PmiRow | (PmiRow & Record<string, unknown>) = {
        ...updatedRow,
        ...flattenTyreFields(updatedRow),
      };
      if (isTyreField) {
        const currentNested = (updatedRow as any)[field] as TyreData;
        updatedData = {
          ...updatedData,
          [field]: { ...currentNested, [column]: value },
        } as PmiRow;
      } else {
        updatedData = {
          ...updatedData,
          [field]: value as any,
        } as PmiRow;
      }
      const flattenedData = flattenTyreFields(updatedData);
      const response = await apiCall(endpoint, {
        method: "PATCH",
        body: JSON.stringify(flattenedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update PMI record");
      }
      setPmiData((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          if (isTyreField) {
            const currentNested = (row as any)[field] as TyreData;
            return { ...row, [field]: { ...currentNested, [column]: value } } as PmiRow;
          }
          return { ...row, [field]: value } as PmiRow;
        })
      );
    } catch (error) {
      console.error("Failed to update PMI record:", error);
      setError("Failed to update PMI record");
    }
  };
  const handleEdit = (row: PmiRow) => {
    setSelectedRow(row);
    setEditForm({
      ...row,
      tyre_pressure: { ...row.tyre_pressure },
      tyre_depth: { ...row.tyre_depth },
      tyre_dates: { ...row.tyre_dates },
    });
    setIsEditing(true);
    setShowModal(true);
  };
  const handleView = (row: PmiRow) => {
    setSelectedRow(row);
    setIsEditing(false);
    setShowModal(true);
  };
  const handleUpdate = async () => {
    if (!selectedRow) return;
    try {
      const endpoint = API_CONFIG.endpoints.update.replace("{id}", selectedRow.id.toString());
      const flattenedData = flattenTyreFields(editForm);
      const response = await apiCall(endpoint, {
        method: "PATCH",
        body: JSON.stringify(flattenedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update PMI record");
      }
      setPmiData((prev) =>
        prev.map((row) => (row.id === selectedRow.id ? { ...row, ...editForm } : row))
      );
      setShowModal(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update PMI record:", error);
      setError("Failed to update PMI record");
    }
  };
  const handleDelete = async (id: number | string) => {
    try {
      const endpoint = API_CONFIG.endpoints.delete.replace("{id}", id.toString());
      const response = await apiCall(endpoint, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete PMI record");
      }
      setPmiData((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Failed to delete PMI record:", error);
      setError("Failed to delete PMI record");
    }
  };
  const handleDownload = async (id: number | string) => {
    try {
      const endpoint = API_CONFIG.endpoints.download.replace("{id}", id.toString());
      const response = await apiCall(endpoint);
      if (!response.ok) {
        throw new Error("Failed to download PMI record");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PMI_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PMI record:", error);
      setError("Failed to download PMI record");
    }
  };
  const handleApprove = async (id: number | string) => {
    try {
      const endpoint = API_CONFIG.endpoints.update.replace("{id}", id.toString());
      const response = await apiCall(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!response.ok) {
        throw new Error("Failed to approve PMI record");
      }
      setPmiData((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: "APPROVED" } : row))
      );
    } catch (error) {
      console.error("Failed to approve PMI record:", error);
      setError("Failed to approve PMI record");
    }
  };
  const handleReject = async (id: number | string) => {
    try {
      const endpoint = API_CONFIG.endpoints.update.replace("{id}", id.toString());
      const response = await apiCall(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (!response.ok) {
        throw new Error("Failed to reject PMI record");
      }
      setPmiData((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: "REJECTED" } : row))
      );
    } catch (error) {
      console.error("Failed to reject PMI record:", error);
      setError("Failed to reject PMI record");
    }
  };
  // Fetch vehicles and PMI data on component mount
  useEffect(() => {
    fetchVehicles();
    fetchPmiData();
  }, []);
  // Fetch PMI data when selected vehicle changes
  useEffect(() => {
    fetchPmiData(selectedVehicle);
  }, [selectedVehicle]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const tyreColumns = useMemo(() => {
    if (!Array.isArray(pmiData) || pmiData.length === 0) {
      return ["OSF", "NSF", "OSR_Outer", "NSR_Outer", "OSR_Inner", "NSR_Inner"];
    }
    const firstValidRow = pmiData.find(
      (row) => row.tyre_pressure && Object.keys(row.tyre_pressure).length > 0
    );
    return firstValidRow ? Object.keys(firstValidRow.tyre_pressure) : [];
  }, [pmiData]);
  const formatDateForInput = (date: string | null | undefined) => {
    if (!date) return "";
    return date.split("T")[0];
  };
  const isExpired = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };
  const filteredData = useMemo(() => {
    if (!searchTerm) return pmiData;
    return pmiData.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [pmiData, searchTerm]);
  const handleSort = (key: keyof PmiRow) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "tyre_pressure" || sortConfig.key === "tyre_depth" || sortConfig.key === "tyre_dates") {
        aValue = (a[sortConfig.key] as TyreData)?.["OSF"] ?? null;
        bValue = (b[sortConfig.key] as TyreData)?.["OSF"] ?? null;
      }
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortConfig.direction === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
  }, [filteredData, sortConfig]);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status.toUpperCase()) {
      case "APPROVED":
        return (
          <span className={cn(baseClasses, "bg-green-100 text-green-800")}>
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className={cn(baseClasses, "bg-red-100 text-red-800")}>
            Rejected
          </span>
        );
      case "PENDING":
        return (
          <span className={cn(baseClasses, "bg-yellow-100 text-yellow-800")}>
            Pending
          </span>
        );
      default:
        return (
          <span className={cn(baseClasses, "bg-gray-100 text-gray-800")}>
            {status}
          </span>
        );
    }
  };
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            PMI History
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Comprehensive vehicle inspection data with action controls
          </p>
        </div>
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={cn(
                  "relative flex items-center gap-2 px-6 py-3 text-sm justify-start font-medium transition-colors clip-tab",
                  activeTab === tab.label
                    ? "bg-white text-orange-500 border-b-2 border-orange-500"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 z-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search PMI records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* New vehicle filter dropdown */}
                <div className="relative max-w-xs">
                  <Car className="absolute left-3 z-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Select
                    value={selectedVehicle}
                    onValueChange={(value) => {
                      setSelectedVehicle(value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <SelectTrigger className="pl-10 w-[200px]">
                      <SelectValue placeholder="Filter by vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {vehicles
                        .filter((v) => (v.vehicles_type?.id ?? v.id) !== undefined)
                        .map((vehicle) => (
                          <SelectItem
                            key={String(vehicle.vehicles_type?.id ?? vehicle.id)}
                            value={String(vehicle.vehicles_type?.id ?? vehicle.id)}
                          >
                            {vehicle.registration_number ?? vehicle.vehicle_reg ?? "Unknown"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2 items-center">
                <RefreshCcw
                  className="w-6 h-6 text-gray-400 mx-4 hover:text-gray-700 cursor-pointer"
                  onClick={handleRefresh}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {activeTab === "All Data" && (
                  <>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("analysis_date")}
                      >
                        Report Date{" "}
                        {sortConfig?.key === "analysis_date" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("vehicle_reg")}
                      >
                        Vehicle No{" "}
                        {sortConfig?.key === "vehicle_reg" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        Status{" "}
                        {sortConfig?.key === "status" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        colSpan={tyreColumns.length}
                        className="text-center bg-blue-50 border-l border-r border-blue-200"
                      >
                        Tyre Pressure (PSI)
                      </TableHead>
                      <TableHead
                        colSpan={tyreColumns.length}
                        className="text-center bg-green-50 border-l border-r border-green-200"
                      >
                        Tyre Depth (mm)
                      </TableHead>
                      <TableHead>Defects</TableHead>
                      <TableHead>Driver Defects</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      {tyreColumns.map((col) => (
                        <TableHead key={col} className="text-center bg-blue-25">
                          {col}
                        </TableHead>
                      ))}
                      {tyreColumns.map((col) => (
                        <TableHead key={col} className="text-center bg-green-25">
                          {col}
                        </TableHead>
                      ))}
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </>
                )}
                {activeTab === "Tyre Depth" && (
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("analysis_date")}
                    >
                      Report Date{" "}
                      {sortConfig?.key === "analysis_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("vehicle_reg")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "vehicle_reg" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      {sortConfig?.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {tyreColumns.map((col) => (
                      <TableHead key={col} className="text-center">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead>Defects</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === "Tyre Dates" && (
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("analysis_date")}
                    >
                      Report Date{" "}
                      {sortConfig?.key === "analysis_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("vehicle_reg")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "vehicle_reg" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      {sortConfig?.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {tyreColumns.map((col) => (
                      <TableHead key={col} className="text-center">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead>Defects</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === "Others" && (
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("analysis_date")}
                    >
                      Report Date{" "}
                      {sortConfig?.key === "analysis_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("vehicle_reg")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "vehicle_reg" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      {sortConfig?.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-center">
                      Brake Test Not Recorded
                    </TableHead>
                    <TableHead className="text-center">
                      Brake Test Report Attached
                    </TableHead>
                    <TableHead className="text-center">
                      Maintenance Error Answer
                    </TableHead>
                    <TableHead>Defects</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={tyreColumns.length * 2 + 5} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tyreColumns.length * 2 + 5} className="text-center">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row) => {
                    if (activeTab === "All Data") {
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{row.analysis_date}</TableCell>
                          <TableCell className="font-medium">
                            {row.vehicle_reg}
                          </TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          {tyreColumns.map((col) => (
                            <TableCell key={col} className="text-center">
                              <StatusCell
                                status={row.tyre_pressure[col]}
                                rowId={row.id}
                                field="tyre_pressure"
                                column={col}
                                onUpdate={handleStatusUpdate}
                                isEditable={true}
                                type="number"
                              />
                            </TableCell>
                          ))}
                          {tyreColumns.map((col) => (
                            <TableCell key={col} className="text-center">
                              <StatusCell
                                status={row.tyre_depth[col]}
                                rowId={row.id}
                                field="tyre_depth"
                                column={col}
                                onUpdate={handleStatusUpdate}
                                isEditable={true}
                                type="number"
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <BadgeList value={row.defects || "N/A"} />
                          </TableCell>
                          <TableCell>
                            <BadgeList value={row.driver_info?.defects || "N/A"} />
                          </TableCell>
                          <TableCell className="text-center">
                            <ActionMenu
                              row={row}
                              onEdit={handleEdit}
                              onView={handleView}
                              onDelete={handleDelete}
                              onDownload={handleDownload}
                              onApprove={handleApprove}
                              onReject={handleReject}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (activeTab === "Tyre Depth") {
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{row.analysis_date}</TableCell>
                          <TableCell className="font-medium">
                            {row.vehicle_reg}
                          </TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          {tyreColumns.map((col) => (
                            <TableCell key={col} className="text-center">
                              <StatusCell
                                status={row.tyre_depth[col]}
                                rowId={row.id}
                                field="tyre_depth"
                                column={col}
                                onUpdate={handleStatusUpdate}
                                isEditable={true}
                                type="number"
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <BadgeList value={row.defects || "N/A"} />
                          </TableCell>
                          <TableCell className="text-center">
                            <ActionMenu
                              row={row}
                              onEdit={handleEdit}
                              onView={handleView}
                              onDelete={handleDelete}
                              onDownload={handleDownload}
                              onApprove={handleApprove}
                              onReject={handleReject}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (activeTab === "Tyre Dates") {
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{row.analysis_date}</TableCell>
                          <TableCell className="font-medium">
                            {row.vehicle_reg}
                          </TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          {tyreColumns.map((col) => (
                            <TableCell key={col} className="text-center">
                              <StatusCell
                                status={row.tyre_dates[col]}
                                rowId={row.id}
                                field="tyre_dates"
                                column={col}
                                onUpdate={handleStatusUpdate}
                                isEditable={true}
                                type="text"
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <BadgeList value={row.defects || "N/A"} />
                          </TableCell>
                          <TableCell className="text-center">
                            <ActionMenu
                              row={row}
                              onEdit={handleEdit}
                              onView={handleView}
                              onDelete={handleDelete}
                              onDownload={handleDownload}
                              onApprove={handleApprove}
                              onReject={handleReject}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (activeTab === "Others") {
                      return (
                        <TableRow key={row.id}>
                          <TableCell>{row.analysis_date}</TableCell>
                          <TableCell className="font-medium">
                            {row.vehicle_reg}
                          </TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          <TableCell className="text-center">
                            <StatusCell
                              status={row.brake_test_not_recorded}
                              rowId={row.id}
                              field="brake_test_not_recorded"
                              column=""
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="status"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusCell
                              status={row.brake_test_report_attached}
                              rowId={row.id}
                              field="brake_test_report_attached"
                              column=""
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="status"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusCell
                              status={row.maintenance_error_answer}
                              rowId={row.id}
                              field="maintenance_error_answer"
                              column=""
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="status"
                            />
                          </TableCell>
                          <TableCell>
                            <BadgeList value={row.defects || "N/A"} />
                          </TableCell>
                          <TableCell className="text-center">
                            <ActionMenu
                              row={row}
                              onEdit={handleEdit}
                              onView={handleView}
                              onDelete={handleDelete}
                              onDownload={handleDownload}
                              onApprove={handleApprove}
                              onReject={handleReject}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1}-
                {Math.min(startIndex + rowsPerPage, sortedData.length)} of{" "}
                {sortedData.length} results
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 p-0",
                    currentPage === pageNum && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {pageNum}
                </Button>
              ))}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        {showModal && selectedRow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {isEditing ? "Edit PMI Record" : "PMI Record Details"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setSelectedRow(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Registration
                        </label>
                        <Input
                          value={editForm.vehicle_reg || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              vehicle_reg: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Analysis Date
                        </label>
                        <Input
                          type="date"
                          value={formatDateForInput(editForm.analysis_date)}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              analysis_date: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PMI Expiry
                        </label>
                        <Input
                          type="date"
                          value={formatDateForInput(editForm.pmi_expiry)}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              pmi_expiry: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct DTP Code Used
                        </label>
                        <Input
                          value={editForm.Correct_DTP_Code_Used || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              Correct_DTP_Code_Used: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Imbalance
                        </label>
                        <Input
                          value={editForm.brake_imbalance || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              brake_imbalance: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Imbalance Note
                        </label>
                        <Input
                          value={editForm.brake_imbalance_note || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              brake_imbalance_note: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Test Not Recorded
                        </label>
                        <Select
                          value={editForm.brake_test_not_recorded || ""}
                          onValueChange={(value) =>
                            setEditForm({
                              ...editForm,
                              brake_test_not_recorded: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="NA">NA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Test Report Attached
                        </label>
                        <Select
                          value={editForm.brake_test_report_attached || ""}
                          onValueChange={(value) =>
                            setEditForm({
                              ...editForm,
                              brake_test_report_attached: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="NA">NA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maintenance Error Answer
                        </label>
                        <Select
                          value={editForm.maintenance_error_answer || ""}
                          onValueChange={(value) =>
                            setEditForm({
                              ...editForm,
                              maintenance_error_answer: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="NA">NA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maintenance Provider Error
                        </label>
                        <Input
                          value={editForm.maintenance_provider_error || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              maintenance_provider_error: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Defects
                      </label>
                      <Textarea
                        value={editForm.defects || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, defects: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <Textarea
                        value={editForm.notes || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maintenance Error Note
                      </label>
                      <Textarea
                        value={editForm.maintenance_error_note || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            maintenance_error_note: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tyre Pressure {col} (PSI)
                        </label>
                        <Input
                          type="number"
                          value={editForm.tyre_pressure?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              tyre_pressure: {
                                ...editForm.tyre_pressure,
                                [col]: e.target.value,
                              },
                            })
                          }
                          className={cn("w-full", getSafetyColor(editForm.tyre_pressure?.[col], "tyre_pressure"))}
                        />
                      </div>
                    ))}
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tyre Depth {col} (mm)
                        </label>
                        <Input
                          type="number"
                          value={editForm.tyre_depth?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              tyre_depth: {
                                ...editForm.tyre_depth,
                                [col]: e.target.value,
                              },
                            })
                          }
                          className={cn("w-full", getSafetyColor(editForm.tyre_depth?.[col], "tyre_depth"))}
                        />
                      </div>
                    ))}
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tyre Date {col}
                        </label>
                        <Input
                          type="text"
                          value={editForm.tyre_dates?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              tyre_dates: {
                                ...editForm.tyre_dates,
                                [col]: e.target.value,
                              },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Defects
                      </label>
                      <Textarea
                        value={editForm.driver_info?.defects || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            driver_info: {
                              ...editForm.driver_info,
                              defects: e.target.value,
                            },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowModal(false);
                          setIsEditing(false);
                          setSelectedRow(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate}>Save Changes</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Registration
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.vehicle_reg}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Analysis Date
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.analysis_date}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PMI Expiry
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.pmi_expiry ?? "N/A"}{isExpired(selectedRow.pmi_expiry) && <span className="text-red-600"> (Expired)</span>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <div>{getStatusBadge(selectedRow.status)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Imbalance
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.brake_imbalance ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Imbalance Note
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.brake_imbalance_note ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct DTP Code Used
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.Correct_DTP_Code_Used ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maintenance Error Note
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.maintenance_error_note ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Test Not Recorded
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.brake_test_not_recorded ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brake Test Report Attached
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.brake_test_report_attached ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maintenance Error Answer
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.maintenance_error_answer ?? "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maintenance Provider Error
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.maintenance_provider_error ?? "N/A"}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Defects
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {selectedRow.defects || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {selectedRow.notes || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Defects
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {selectedRow.driver_info?.defects || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Status
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {getStatusBadge(selectedRow.driver_info?.status || "N/A")}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Notes
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {selectedRow.driver_info?.notes || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Report Date
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {selectedRow.driver_info?.pmi_report_date || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tyre Pressure
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.tyre_pressure).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn("p-1 rounded", getSafetyColor(value, "tyre_pressure"))}
                          >
                            {`${key}: ${value ?? "N/A"}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tyre Depth
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.tyre_depth).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn("p-1 rounded", getSafetyColor(value, "tyre_depth"))}
                          >
                            {`${key}: ${value ?? "N/A"}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tyre Dates
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.tyre_dates).map(([key, value]) => (
                          <div key={key}>{`${key}: ${value ?? "N/A"}`}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowModal(false);
                          setSelectedRow(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default PMIHistory;