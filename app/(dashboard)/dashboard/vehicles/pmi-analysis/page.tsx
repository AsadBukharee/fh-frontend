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
import {
  Search,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Trash2,
  Download,
  MoreVertical,
  Check,
  Database,
  Scale,
  Settings,
  X,
  Calendar,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import AddPMI from "@/components/pmi/AddPmi";

// API configuration
const API_CONFIG = {
  baseUrl: "https://api.example.com",
  endpoints: {
    pmi: "/activity/pmi/",
    update: "/activity/pmi/{id}/",
    delete: "/activity/pmi/{id}/",
    download: "/activity/pmi/{id}/download/",
  },
};

// Types
interface TyreData {
  [key: string]: string | number | null | undefined;
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
  created_by: number;
  tyre_pressure: TyreData;
  tyre_depth: TyreData;
  tyre_dates: TyreData;
}

interface ActionMenuProps {
  row: PmiRow;
  onEdit: (row: PmiRow) => void;
  onView: (row: PmiRow) => void;
  onDelete: (id: number | string) => void;
  onDownload: (row: PmiRow) => void;
  onApprove: (id: number | string) => void;
  onReject: (id: number | string) => void;
}

interface StatusCellProps {
  status: string | number | null | undefined;
  rowId: number | string;
  field: keyof PmiRow;
  column: string;
  onUpdate: (
    rowId: number | string,
    field: keyof PmiRow,
    column: string,
    value: string | number
  ) => void;
  isEditable?: boolean;
  type?: "status" | "number" | "date";
}

const getSafetyColor = (value: number | string | null | undefined, field: keyof PmiRow): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return "bg-gray-100 text-gray-800";

  const numValue = Number(value);

  if (field === "tyre_depth") {
    if (numValue < 1.5) return "bg-red-100 text-red-800";
    if (numValue >= 1.5 && numValue <= 2) return "bg-orange-100 text-orange-800";
    if (numValue > 2 && numValue <= 8) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }

  if (field === "tyre_pressure") {
    if (numValue < 25 || numValue > 50) return "bg-red-100 text-red-800";
    if ((numValue >= 26 && numValue <= 28) || (numValue >= 44 && numValue <= 48))
      return "bg-orange-100 text-orange-800";
    if (numValue >= 29 && numValue <= 42) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }

  return "bg-gray-100 text-gray-800";
};

const ActionMenu: FC<ActionMenuProps> = ({
  row,
  onEdit,
  onView,
  onDelete,
  onDownload,
  onApprove,
  onReject,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(row)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {row.file_url && (
          <DropdownMenuItem onClick={() => onDownload(row)}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {row.status === "pending" && (
          <>
            <DropdownMenuItem
              onClick={() => onApprove(row.id)}
              className="text-green-600"
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onReject(row.id)}
              className="text-red-600"
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(row.id)} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const StatusCell: FC<StatusCellProps> = ({
  status,
  rowId,
  field,
  column,
  onUpdate,
  isEditable = true,
  type,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(status || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleConfirm = async () => {
    if (!isEditable || isUpdating) return;

    setIsUpdating(true);
    try {
      await onUpdate(rowId, field, column, value);
      setIsEditing(false);
    } catch (error) {
      setValue(status || "");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const inputClass =
    "w-[80px] text-center border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-2 py-1";

  if (type === "status") {
    return (
      <div className="flex items-center justify-center">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Select
              onValueChange={handleChange}
              disabled={isUpdating}
              defaultValue={value as string}
            >
              <SelectTrigger className={cn(inputClass, "h-8")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="NA">NA</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirm}
              disabled={isUpdating}
              className="p-1 h-6 w-6"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
          </div>
        ) : (
          <div onDoubleClick={handleDoubleClick} className="cursor-pointer">
            {status || "N/A"}
          </div>
        )}
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="flex items-center justify-center">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isUpdating}
              className={cn(inputClass, getSafetyColor(value, field))}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirm}
              disabled={isUpdating}
              className="p-1 h-6 w-6"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
          </div>
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className={cn(
              "cursor-pointer px-2 py-1 rounded",
              getSafetyColor(status, field)
            )}
          >
            {status || "N/A"}
          </div>
        )}
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="flex items-center justify-center">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isUpdating}
              className={inputClass}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirm}
              disabled={isUpdating}
              className="p-1 h-6 w-6"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
          </div>
        ) : (
          <div onDoubleClick={handleDoubleClick} className="cursor-pointer">
            {status || "N/A"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isUpdating}
            className={inputClass}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleConfirm}
            disabled={isUpdating}
            className="p-1 h-6 w-6"
          >
            <Check className="h-4 w-4 text-green-500" />
          </Button>
        </div>
      ) : (
        <div onDoubleClick={handleDoubleClick} className="cursor-pointer">
          {status || "N/A"}
        </div>
      )}
    </div>
  );
};

const PMI: FC = () => {
  const [pmiData, setPmiData] = useState<PmiRow[]>([]);
  const [activeTab, setActiveTab] = useState<
    "All Data" | "Tyre Depth" | "Tyre Dates" | "Others"
  >("All Data");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PmiRow | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<PmiRow>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PmiRow;
    direction: "asc" | "desc";
  } | null>(null);
  const token = useCookies().get("access_token");

  const tabs = [
    { label: "All Data", icon: Database },
    { label: "Tyre Depth", icon: Scale },
    { label: "Tyre Dates", icon: CalendarDays },
    { label: "Others", icon: Settings },
  ] as const;

  // Safe state setter to prevent non-array values
  const safeSetPmiData = (newData: unknown) => {
    if (Array.isArray(newData)) {
      setPmiData(newData as PmiRow[]);
    } else {
      console.error("Attempted to set non-array data:", newData);
      setPmiData([]);
      setError("Invalid data format received");
    }
  };

  // Transform API response to match PmiRow structure
  const transformApiResponse = (apiData: any[]): PmiRow[] => {
    return apiData.map((item) => {
      const tyrePressure: TyreData = {};
      const tyreDepth: TyreData = {};
      const tyreDates: TyreData = {};

      // Extract tyre-related fields
      Object.keys(item).forEach((key) => {
        if (key.startsWith("tyre_pressure_")) {
          const tyreKey = key.replace("tyre_pressure_", "");
          tyrePressure[tyreKey] = item[key];
        } else if (key.startsWith("tyre_depth_")) {
          const tyreKey = key.replace("tyre_depth_", "");
          tyreDepth[tyreKey] = item[key];
        } else if (key.startsWith("tyre_date_")) {
          const tyreKey = key.replace("tyre_date_", "");
          tyreDates[tyreKey] = item[key];
        }
      });

      return {
        ...item,
        tyre_pressure: tyrePressure,
        tyre_depth: tyreDepth,
        tyre_dates: tyreDates,
      } as PmiRow;
    });
  };

  // Flatten tyre fields for API payload
  const flattenTyreFields = (row: Partial<PmiRow>): Record<string, any> => {
    const flattened: Record<string, any> = { ...row };
    ["tyre_pressure", "tyre_depth", "tyre_dates"].forEach((field) => {
      //@ts-expect-error ab thk ha
      if (row[field] && typeof row[field] === "object") {
        //@ts-expect-error ab thk ha
        Object.entries(row[field]!).forEach(([key, value]) => {
          flattened[`${field}_${key}`] = value;
        });
        delete flattened[field];
      }
    });
    return flattened;
  };

  // API Functions
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
 const fetchPmiData = async () => {
      setLoading(true);
      try {
        const response = await apiCall(API_CONFIG.endpoints.pmi);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const apiResponse = await response.json();
        console.log("API Response:", apiResponse); // For debugging
        if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
          console.error("API response is invalid:", apiResponse);
          safeSetPmiData([]);
          setError("Invalid API response format");
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
  useEffect(() => {
   
    fetchPmiData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Action Handlers
  const handleStatusUpdate = async (
    rowId: number | string,
    field: keyof PmiRow,
    column: string,
    value: string | number
  ) => {
    try {
      setLoading(true);
      const updateData = column ? { [`${field}_${column}`]: value } : { [field]: value };
      await apiCall(API_CONFIG.endpoints.update.replace("{id}", rowId.toString()), {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      safeSetPmiData(
        pmiData.map((row) =>
          row.id === rowId
            ? column
              ? { ...row, [field]: { ...(row[field] as TyreData), [column]: value } }
              : { ...row, [field]: value }
            : row
        )
      );
    } catch (error) {
      console.error("Failed to update:", error);
      setError("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row: PmiRow) => {
    setSelectedRow(row);
    setEditForm({
      vehicle_reg: row.vehicle_reg,
      analysis_date: row.analysis_date,
      pmi_expiry: row.pmi_expiry,
      defects: row.defects,
      notes: row.notes,
      brake_imbalance: row.brake_imbalance,
      brake_imbalance_note: row.brake_imbalance_note,
      maintenance_error_note: row.maintenance_error_note,
      Correct_DTP_Code_Used: row.Correct_DTP_Code_Used,
      brake_test_not_recorded: row.brake_test_not_recorded,
      brake_test_report_attached: row.brake_test_report_attached,
      maintenance_error_answer: row.maintenance_error_answer,
      maintenance_provider_error: row.maintenance_provider_error,
      signature: row.signature,
      vehicle: row.vehicle,
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
      setLoading(true);
      const flattenedData = flattenTyreFields(editForm);
      await apiCall(
        API_CONFIG.endpoints.update.replace("{id}", selectedRow.id.toString()),
        {
          method: "PUT",
          body: JSON.stringify(flattenedData),
        }
      );
      safeSetPmiData(
        pmiData.map((row) =>
          row.id === selectedRow.id ? { ...row, ...editForm } : row
        )
      );
      setShowModal(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update:", error);
      setError("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this PMI record?"))
      return;
    try {
      setLoading(true);
      await apiCall(API_CONFIG.endpoints.delete.replace("{id}", id.toString()), {
        method: "DELETE",
      });
      safeSetPmiData(pmiData.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
      setError("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (row: PmiRow) => {
    if (!row.file_url) return;
    try {
      const response = await apiCall(
        API_CONFIG.endpoints.download.replace("{id}", row.id.toString())
      );
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${row.vehicle_reg}-pmi-report.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to download:", error);
      setError("Failed to download report");
    }
  };

  const handleApprove = async (id: number | string) => {
    try {
      setLoading(true);
      await apiCall(API_CONFIG.endpoints.update.replace("{id}", id.toString()), {
        method: "PUT",
        body: JSON.stringify({ status: "approved" }),
      });
      safeSetPmiData(
        pmiData.map((row) =>
          row.id === id ? { ...row, status: "approved" } : row
        )
      );
    } catch (error) {
      console.error("Failed to approve:", error);
      setError("Failed to approve record");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number | string) => {
    try {
      setLoading(true);
      await apiCall(API_CONFIG.endpoints.update.replace("{id}", id.toString()), {
        method: "PUT",
        body: JSON.stringify({ status: "rejected" }),
      });
      safeSetPmiData(
        pmiData.map((row) =>
          row.id === id ? { ...row, status: "rejected" } : row
        )
      );
    } catch (error) {
      console.error("Failed to reject:", error);
      setError("Failed to reject record");
    } finally {
      setLoading(false);
    }
  };

  // Filter and Sort
  const filteredData = useMemo(() => {
    if (!Array.isArray(pmiData)) {
      return [];
    }
    return pmiData.filter(
      (item) =>
        (item.vehicle_reg?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false) ||
        (item.analysis_date?.includes(searchTerm) ?? false) ||
        (item.pmi_expiry?.includes(searchTerm) ?? false) ||
        (item.defects?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false) ||
        (item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  }, [pmiData, searchTerm]);

  const handleSort = (key: keyof PmiRow) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";
      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredData, sortConfig]);

  const tyreColumns = useMemo(() => {
    if (!Array.isArray(pmiData)) {
      return [];
    }
    const firstValidRow = pmiData.find(
      (row) => row.tyre_pressure && Object.keys(row.tyre_pressure).length > 0
    );
    return firstValidRow ? Object.keys(firstValidRow.tyre_pressure) : [];
  }, [pmiData]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = useMemo(
    () => sortedData.slice(startIndex, startIndex + rowsPerPage),
    [sortedData, startIndex, rowsPerPage]
  );

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border",
          statusStyles[status as keyof typeof statusStyles] ||
            "bg-gray-100 text-gray-800 border-gray-200"
        )}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            PMI Management System
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
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 z-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search PMI records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2 items-center">
                <RefreshCcw className="w-6 h-6 text-gray-400 mx-4 hover:text-gray-700" onClick={()=>fetchPmiData()} />
                <Button className="bg-purple-300 border-0 text-purple-900 hover:bg-purple-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Filter by Date
                </Button>
                <Button className="bg-purple-300 border-0 text-purple-900 hover:bg-purple-600">
                  <Car className="w-4 h-4 mr-2" />
                  Filter by Vehicle
                </Button>
                <AddPMI/>
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
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => {
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
                        {Object.keys(row.tyre_depth).map((col) => (
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
                  if (activeTab === "Tyre Dates" && row.tyre_dates) {
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.analysis_date}</TableCell>
                        <TableCell className="font-medium">
                          {row.vehicle_reg}
                        </TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        {Object.keys(row.tyre_dates).map((col) => (
                          <TableCell key={col} className="text-center">
                            <StatusCell
                              status={row.tyre_dates?.[col]}
                              rowId={row.id}
                              field="tyre_dates"
                              column={col}
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="date"
                            />
                          </TableCell>
                        ))}
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
                })}
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
                          value={editForm.analysis_date || ""}
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
                          value={editForm.pmi_expiry || ""}
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
                  </>
                ) : (
                  <div className="space-y-4">
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
                          {selectedRow.pmi_expiry ?? "N/A"}
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
                        {selectedRow.defects}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {selectedRow.notes}
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
                  </div>
                )}
                <div className="flex space-x-2 pt-4 border-t">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleUpdate}
                        className="bg-blue-500 hover:bg-blue-600"
                        disabled={loading}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setShowModal(false);
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {selectedRow.status === "pending" && (
                        <>
                          <Button
                            onClick={() => {
                              handleApprove(selectedRow.id);
                              setShowModal(false);
                            }}
                            className="bg-green-500 hover:bg-green-600"
                            disabled={loading}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleReject(selectedRow.id);
                              setShowModal(false);
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            disabled={loading}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {selectedRow.file_url && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleDownload(selectedRow);
                            setShowModal(false);
                          }}
                          disabled={loading}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(true);
                          setEditForm({
                            vehicle_reg: selectedRow.vehicle_reg,
                            analysis_date: selectedRow.analysis_date,
                            pmi_expiry: selectedRow.pmi_expiry,
                            defects: selectedRow.defects,
                            notes: selectedRow.notes,
                            brake_imbalance: selectedRow.brake_imbalance,
                            brake_imbalance_note: selectedRow.brake_imbalance_note,
                            maintenance_error_note:
                              selectedRow.maintenance_error_note,
                            Correct_DTP_Code_Used:
                              selectedRow.Correct_DTP_Code_Used,
                            brake_test_not_recorded: selectedRow.brake_test_not_recorded,
                            brake_test_report_attached:
                              selectedRow.brake_test_report_attached,
                            maintenance_error_answer:
                              selectedRow.maintenance_error_answer,
                            maintenance_provider_error:
                              selectedRow.maintenance_provider_error,
                            signature: selectedRow.signature,
                            vehicle: selectedRow.vehicle,
                            tyre_pressure: { ...selectedRow.tyre_pressure },
                            tyre_depth: { ...selectedRow.tyre_depth },
                            tyre_dates: { ...selectedRow.tyre_dates },
                          });
                        }}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowModal(false)}
                        disabled={loading}
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PMI;