
"use client";

import React, { useState, useEffect, useMemo, FC } from "react";
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
  RefreshCcw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCookies } from "next-client-cookies";
import API_URL from "@/app/utils/ENV";

// Placeholder for AddTyreCheckDialog (to be replaced with actual implementation)
interface AddTyreCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newTyreCheck: TyreCheckRow) => void;
  tyreColumns: string[];
  vehicles: Vehicle[];
}

const AddTyreCheckDialog: FC<AddTyreCheckDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  tyreColumns,
  vehicles,
}) => {
  const [formData, setFormData] = useState<Partial<TyreCheckRow>>({
    tyre_check_date: new Date().toISOString().split("T")[0],
    depth: {},
    torque: {},
    check_date: {},
    pressure: {},
  });

  const handleSubmit = () => {
    const newTyreCheck: TyreCheckRow = {
      id: Math.max(...vehicles.map((v) => v.id), 0) + 1, // Temporary ID generation
      tyre_check_date: formData.tyre_check_date || new Date().toISOString().split("T")[0],
      depth: formData.depth || {},
      torque: formData.torque || {},
      check_date: formData.check_date || {},
      pressure: formData.pressure || {},
      physical_document: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vehicles: formData.vehicles || 0,
      vehicle_type: vehicles.find((v) => v.id === formData.vehicles)?.vehicles_type.id || 0,
      assignee: null,
      registration_number: vehicles.find((v) => v.id === formData.vehicles)?.registration_number || "",
    };
    onAdd(newTyreCheck);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Add Tyre Check</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check Date</label>
            <Input
              type="date"
              value={formData.tyre_check_date || ""}
              onChange={(e) => setFormData({ ...formData, tyre_check_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            <Select
              value={String(formData.vehicles || "")}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  vehicles: Number(value),
                  registration_number: vehicles.find((v) => v.id === Number(value))?.registration_number || "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.registration_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tyreColumns.map((col) => (
            <div key={col}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tyre Pressure {col.replace(/_/g, " ").toUpperCase()} (PSI)
              </label>
              <Input
                type="number"
                value={formData.pressure?.[col] ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pressure: { ...formData.pressure, [col]: e.target.value },
                  })
                }
              />
            </div>
          ))}
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600">
              Add
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// API configuration
const API_CONFIG = {
  baseUrl: API_URL,
  endpoints: {
    tyreCheck: "/activity/tyre-check/",
    update: "/activity/tyre-check/{id}/",
    delete: "/activity/tyre-check/{id}/",
    download: "/activity/tyre-check/{id}/download/",
    vehicles: "/api/vehicles/",
  },
};

// Types
interface TyreData {
  [key: string]: string | number | null | undefined;
}

interface TyreCheckRow {
  id: number;
  tyre_check_date: string;
  depth: TyreData;
  torque: TyreData;
  check_date: TyreData;
  pressure: TyreData;
  physical_document: string | null;
  created_at: string;
  updated_at: string;
  vehicles: number;
  vehicle_type: number;
  assignee: number | null;
  registration_number: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_name: string;
  tyre_pressure_front_driver: string | null;
  tyre_pressure_front_passenger: string | null;
  tyre_pressure_rear_outer_driver: string | null;
  tyre_pressure_rear_outer_passenger: string | null;
  tyre_depth_front_driver: string | null;
  tyre_depth_front_passenger: string | null;
  tyre_depth_rear_outer_driver: string | null;
  tyre_depth_rear_outer_passenger: string | null;
  tyre_torque_front_driver: string | null;
  tyre_torque_front_passenger: string | null;
  tyre_torque_rear_outer_driver: string | null;
  tyre_torque_rear_outer_passenger: string | null;
  tyre_expiry_front_driver: string | null;
  tyre_expiry_front_passenger: string | null;
  tyre_expiry_rear_outer_driver: string | null;
  tyre_expiry_rear_outer_passenger: string | null;
  vehicles_type: { id: number; name: string };
  assignee_driver: { id: number } | null;
  last_tyre_maintenance_check: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
  stats?: {
    available: number;
    unavailable: number;
    assigned: number;
    disabled: number;
    total: number;
  };
}

interface ActionMenuProps {
  row: TyreCheckRow;
  onEdit: (row: TyreCheckRow) => void;
  onView: (row: TyreCheckRow) => void;
  onDelete: (id: number) => void;
  onDownload: (row: TyreCheckRow) => void;
}

interface StatusCellProps {
  status: string | number | null | undefined;
  rowId: number;
  field: keyof TyreCheckRow;
  column: string;
  onUpdate: (
    rowId: number,
    field: keyof TyreCheckRow,
    column: string,
    value: string | number
  ) => void;
  isEditable?: boolean;
  type?: "number" | "date";
}

const getSafetyColor = (
  value: number | string | null | undefined,
  field: keyof TyreCheckRow
): string => {
  if (value === null || value === undefined || isNaN(Number(value)))
    return "bg-gray-100 text-gray-800";
  const numValue = Number(value);
  if (field === "depth") {
    if (numValue < 1.5) return "bg-red-100 text-red-800";
    if (numValue >= 1.5 && numValue <= 2) return "bg-orange-100 text-orange-800";
    if (numValue > 2 && numValue <= 8) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }
  if (field === "pressure") {
    if (numValue < 25 || numValue > 50) return "bg-red-100 text-red-800";
    if ((numValue >= 26 && numValue <= 28) || (numValue >= 44 && numValue <= 48))
      return "bg-orange-100 text-orange-800";
    if (numValue >= 29 && numValue <= 42) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }
  if (field === "torque") {
    if (numValue < 110 || numValue > 130) return "bg-red-100 text-red-800";
    if ((numValue >= 110 && numValue <= 115) || (numValue >= 125 && numValue <= 130))
      return "bg-orange-100 text-orange-800";
    if (numValue > 115 && numValue < 125) return "bg-green-100 text-green-800";
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
        {row.physical_document && (
          <DropdownMenuItem onClick={() => onDownload(row)}>
            <Download className="mr-2 h-4 w-4" />
            Download Document
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(row.id)}
          className="text-red-600"
        >
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
    "w-[80px] text-center border-0 bg-transparent focus:ring-1 focus:ring-orange-500 rounded px-2 py-1";

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

const TyreCheck: FC = () => {
  const [tyreData, setTyreData] = useState<TyreCheckRow[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState<
    "All Data" | "Tyre Depth" | "Tyre Pressure" | "Tyre Dates" | "Tyre Torque"
  >("All Data");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TyreCheckRow | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<TyreCheckRow>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TyreCheckRow;
    direction: "asc" | "desc";
  } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const token = useCookies().get("access_token");

  const tabs = [
    { label: "All Data", icon: Database },
    { label: "Tyre Depth", icon: Scale },
    { label: "Tyre Pressure", icon: Car },
    { label: "Tyre Dates", icon: CalendarDays },
    { label: "Tyre Torque", icon: Settings },
  ] as const;

  // Safe state setter
  const safeSetTyreData = (newData: unknown) => {
    if (Array.isArray(newData)) {
      setTyreData(newData as TyreCheckRow[]);
    } else {
      console.error("Attempted to set non-array data:", newData);
      setTyreData([]);
      setError("Invalid data format received");
    }
  };

  // API Functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await apiCall(API_CONFIG.endpoints.vehicles);
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }
      const apiResponse: ApiResponse = await response.json();
      if (!apiResponse.success || !Array.isArray(apiResponse.data)) {
        throw new Error("Invalid API response format");
      }
      setVehicles(apiResponse.data);
      const transformedData: TyreCheckRow[] = apiResponse.data.map((vehicle) => {
        const row = {
          id: vehicle.id,
          tyre_check_date: vehicle.last_tyre_maintenance_check || new Date().toISOString().split("T")[0],
          depth: {
            front_driver: vehicle.tyre_depth_front_driver,
            front_passenger: vehicle.tyre_depth_front_passenger,
            rear_outer_driver: vehicle.tyre_depth_rear_outer_driver,
            rear_outer_passenger: vehicle.tyre_depth_rear_outer_passenger,
          },
          torque: {
            front_driver: vehicle.tyre_torque_front_driver,
            front_passenger: vehicle.tyre_torque_front_passenger,
            rear_outer_driver: vehicle.tyre_torque_rear_outer_driver,
            rear_outer_passenger: vehicle.tyre_torque_rear_outer_passenger,
          },
          check_date: {
            front_driver: vehicle.tyre_expiry_front_driver,
            front_passenger: vehicle.tyre_expiry_front_passenger,
            rear_outer_driver: vehicle.tyre_expiry_rear_outer_driver,
            rear_outer_passenger: vehicle.tyre_expiry_rear_outer_passenger,
          },
          pressure: {
            front_driver: vehicle.tyre_pressure_front_driver,
            front_passenger: vehicle.tyre_pressure_front_passenger,
            rear_outer_driver: vehicle.tyre_pressure_rear_outer_driver,
            rear_outer_passenger: vehicle.tyre_pressure_rear_outer_passenger,
          },
          physical_document: null, // Map to an appropriate field if available
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          vehicles: vehicle.id,
          vehicle_type: vehicle.vehicles_type.id,
          assignee: vehicle.assignee_driver?.id || null,
          registration_number: vehicle.registration_number,
        };
        return row;
      });
      console.log("Transformed tyre data:", transformedData);
      safeSetTyreData(transformedData);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setError("Failed to load vehicle list");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTyreCheck = (newTyreCheck: TyreCheckRow) => {
    safeSetTyreData([...tyreData, newTyreCheck]);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Action Handlers
  const handleStatusUpdate = async (
    rowId: number,
    field: keyof TyreCheckRow,
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
      safeSetTyreData(
        tyreData.map((row) =>
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

  const handleEdit = (row: TyreCheckRow) => {
    setSelectedRow(row);
    setEditForm({
      tyre_check_date: row.tyre_check_date,
      depth: { ...row.depth },
      torque: { ...row.torque },
      check_date: { ...row.check_date },
      pressure: { ...row.pressure },
      vehicles: row.vehicles,
      vehicle_type: row.vehicle_type,
      assignee: row.assignee,
      registration_number: row.registration_number,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (row: TyreCheckRow) => {
    setSelectedRow(row);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedRow) return;
    try {
      setLoading(true);
      const flattenedData: Record<string, any> = { ...editForm };
      ["depth", "torque", "check_date", "pressure"].forEach((field) => {
        if (editForm[field as keyof typeof editForm] && typeof editForm[field as keyof typeof editForm] === "object") {
          Object.entries(editForm[field as keyof typeof editForm]!).forEach(([key, value]) => {
            flattenedData[`${field}_${key}`] = value;
          });
          delete flattenedData[field];
        }
      });
      await apiCall(
        API_CONFIG.endpoints.update.replace("{id}", selectedRow.id.toString()),
        {
          method: "PUT",
          body: JSON.stringify(flattenedData),
        }
      );
      safeSetTyreData(
        tyreData.map((row) =>
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tyre check record?"))
      return;
    try {
      setLoading(true);
      await apiCall(API_CONFIG.endpoints.delete.replace("{id}", id.toString()), {
        method: "DELETE",
      });
      safeSetTyreData(tyreData.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
      setError("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (row: TyreCheckRow) => {
    if (!row.physical_document) return;
    try {
      const response = await apiCall(
        API_CONFIG.endpoints.download.replace("{id}", row.id.toString())
      );
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `tyre-check-${row.id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to download:", error);
      setError("Failed to download document");
    }
  };

  // Filter and Sort
  const filteredData = useMemo(() => {
    if (!Array.isArray(tyreData)) {
      console.log("tyreData is not an array:", tyreData);
      return [];
    }
    const filtered = tyreData.filter((item) => {
      const matchesSearchTerm =
        (item.tyre_check_date || "").includes(searchTerm) ||
        (item.registration_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.vehicles || "").includes(searchTerm) ||
        String(item.assignee || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDateRange =
        (!startDate || new Date(item.tyre_check_date || new Date()).getTime() >= new Date(startDate).getTime()) &&
        (!endDate || new Date(item.tyre_check_date || new Date()).getTime() <= new Date(endDate).getTime());
      
      const matchesVehicle = selectedVehicle === "" || String(item.vehicles) === selectedVehicle;

      console.log(`Item ${item.id}:`, {
        matchesSearchTerm,
        matchesDateRange,
        matchesVehicle,
        tyre_check_date: item.tyre_check_date,
        registration_number: item.registration_number,
        vehicles: item.vehicles,
        selectedVehicle,
        searchTerm,
        startDate,
        endDate,
      });

      return matchesSearchTerm && matchesDateRange && matchesVehicle;
    });
    console.log("Filtered data length:", filtered.length);
    return filtered;
  }, [tyreData, searchTerm, startDate, endDate, selectedVehicle]);

  const handleSort = (key: keyof TyreCheckRow) => {
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
    return [
      "front_driver",
      "front_passenger",
      "rear_outer_driver",
      "rear_outer_passenger",
    ];
  }, []);

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

  if (loading) return <div className="flex justify-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Tyre Check Analysis
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Comprehensive tyre inspection data with action controls
            </p>
          </div>
          <div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tyre Check
            </Button>
          </div>
        </div>
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={cn(
  "relative flex items-center h-[30px] gap-2 px-10 py-4 text-xs font-medium whitespace-nowrap justify-start transition-colors clip-tab",
  activeTab === tab.label
    ? "bg-orange-500 text-white border-b-2 border-orange-500"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 z-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tyre check records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2 items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="w-[150px]"
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End Date"
                      className="w-[150px]"
                    />
                  </div>
                </div>
                <Select
                  value={selectedVehicle}
                  onValueChange={(value) => {
                    console.log("Selected vehicle:", value);
                    setSelectedVehicle(value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Vehicles</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                        {vehicle.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStartDate("");
                    setEndDate("");
                    setSelectedVehicle("");
                  }}
                >
                  Clear Filters
                </Button>
                <RefreshCcw
                  className="w-6 h-6 text-gray-400 hover:text-gray-700"
                  onClick={() => fetchVehicles()}
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
                        onClick={() => handleSort("tyre_check_date")}
                      >
                        Check Date{" "}
                        {sortConfig?.key === "tyre_check_date" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("registration_number")}
                      >
                        Vehicle No{" "}
                        {sortConfig?.key === "registration_number" &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        colSpan={tyreColumns.length}
                        className="text-center bg-orange-50 border-l border-r border-orange-200"
                      >
                        Tyre Pressure (PSI)
                      </TableHead>
                      <TableHead
                        colSpan={tyreColumns.length}
                        className="text-center bg-green-50 border-l border-r border-green-200"
                      >
                        Tyre Depth (mm)
                      </TableHead>
                      <TableHead
                        colSpan={tyreColumns.length}
                        className="text-center bg-yellow-50 border-l border-r border-yellow-200"
                      >
                        Torque (Nm)
                      </TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      {tyreColumns.map((col) => (
                        <TableHead key={col} className="text-center bg-orange-25">
                          {col.replace(/_/g, " ").toUpperCase()}
                        </TableHead>
                      ))}
                      {tyreColumns.map((col) => (
                        <TableHead key={col} className="text-center bg-green-25">
                          {col.replace(/_/g, " ").toUpperCase()}
                        </TableHead>
                      ))}
                      {tyreColumns.map((col) => (
                        <TableHead key={col} className="text-center bg-yellow-25">
                          {col.replace(/_/g, " ").toUpperCase()}
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
                      onClick={() => handleSort("tyre_check_date")}
                    >
                      Check Date{" "}
                      {sortConfig?.key === "tyre_check_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("registration_number")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "registration_number" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {tyreColumns.map((col) => (
                      <TableHead key={col} className="text-center">
                        {col.replace(/_/g, " ").toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === "Tyre Pressure" && (
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("tyre_check_date")}
                    >
                      Check Date{" "}
                      {sortConfig?.key === "tyre_check_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("registration_number")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "registration_number" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {tyreColumns.map((col) => (
                      <TableHead key={col} className="text-center">
                        {col.replace(/_/g, " ").toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === "Tyre Dates" && (
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("tyre_check_date")}
                    >
                      Check Date{" "}
                      {sortConfig?.key === "tyre_check_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("registration_number")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "registration_number" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {tyreColumns.map((col) => (
                      <TableHead key={col} className="text-center">
                        {col.replace(/_/g, " ").toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
                {activeTab === "Tyre Torque" && (
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("tyre_check_date")}
                    >
                      Check Date{" "}
                      {sortConfig?.key === "tyre_check_date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("registration_number")}
                    >
                      Vehicle No{" "}
                      {sortConfig?.key === "registration_number" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {tyreColumns.map((col) => (
                      <TableHead key={col} className="text-center">
                        {col.replace(/_/g, " ").toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => {
                  if (activeTab === "All Data") {
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.tyre_check_date}</TableCell>
                        <TableCell className="font-medium">
                          {row.registration_number}
                        </TableCell>
                        {tyreColumns.map((col) => (
                          <TableCell key={col} className="text-center">
                            <StatusCell
                              status={row.pressure[col]}
                              rowId={row.id}
                              field="pressure"
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
                              status={row.depth[col]}
                              rowId={row.id}
                              field="depth"
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
                              status={row.torque[col]}
                              rowId={row.id}
                              field="torque"
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
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeTab === "Tyre Depth") {
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.tyre_check_date}</TableCell>
                        <TableCell className="font-medium">
                          {row.registration_number}
                        </TableCell>
                        {tyreColumns.map((col) => (
                          <TableCell key={col} className="text-center">
                            <StatusCell
                              status={row.depth[col]}
                              rowId={row.id}
                              field="depth"
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
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeTab === "Tyre Pressure") {
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.tyre_check_date}</TableCell>
                        <TableCell className="font-medium">
                          {row.registration_number}
                        </TableCell>
                        {tyreColumns.map((col) => (
                          <TableCell key={col} className="text-center">
                            <StatusCell
                              status={row.pressure[col]}
                              rowId={row.id}
                              field="pressure"
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
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeTab === "Tyre Dates") {
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.tyre_check_date}</TableCell>
                        <TableCell className="font-medium">
                          {row.registration_number}
                        </TableCell>
                        {tyreColumns.map((col) => (
                          <TableCell key={col} className="text-center">
                            <StatusCell
                              status={row.check_date[col]}
                              rowId={row.id}
                              field="check_date"
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
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                  if (activeTab === "Tyre Torque") {
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.tyre_check_date}</TableCell>
                        <TableCell className="font-medium">
                          {row.registration_number}
                        </TableCell>
                        {tyreColumns.map((col) => (
                          <TableCell key={col} className="text-center">
                            <StatusCell
                              status={row.torque[col]}
                              rowId={row.id}
                              field="torque"
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
                  {isEditing ? "Edit Tyre Check Record" : "Tyre Check Record Details"}
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
                          Check Date
                        </label>
                        <Input
                          type="date"
                          value={editForm.tyre_check_date || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              tyre_check_date: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle
                        </label>
                        <Select
                          value={String(editForm.vehicles || "")}
                          onValueChange={(value) =>
                            setEditForm({
                              ...editForm,
                              vehicles: Number(value),
                              registration_number: vehicles.find((v) => v.id === Number(value))?.registration_number || "",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                                {vehicle.registration_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Type
                        </label>
                        <Input
                          type="number"
                          value={editForm.vehicle_type || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              vehicle_type: Number(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assignee
                        </label>
                        <Input
                          type="number"
                          value={editForm.assignee || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              assignee: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tyre Pressure {col.replace(/_/g, " ").toUpperCase()} (PSI)
                        </label>
                        <Input
                          type="number"
                          value={editForm.pressure?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              pressure: {
                                ...editForm.pressure,
                                [col]: e.target.value,
                              },
                            })
                          }
                          className={cn("w-full", getSafetyColor(editForm.pressure?.[col], "pressure"))}
                        />
                      </div>
                    ))}
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tyre Depth {col.replace(/_/g, " ").toUpperCase()} (mm)
                        </label>
                        <Input
                          type="number"
                          value={editForm.depth?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              depth: {
                                ...editForm.depth,
                                [col]: e.target.value,
                              },
                            })
                          }
                          className={cn("w-full", getSafetyColor(editForm.depth?.[col], "depth"))}
                        />
                      </div>
                    ))}
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Torque {col.replace(/_/g, " ").toUpperCase()} (Nm)
                        </label>
                        <Input
                          type="number"
                          value={editForm.torque?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              torque: {
                                ...editForm.torque,
                                [col]: e.target.value,
                              },
                            })
                          }
                          className={cn("w-full", getSafetyColor(editForm.torque?.[col], "torque"))}
                        />
                      </div>
                    ))}
                    {tyreColumns.map((col) => (
                      <div key={col}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check Date {col.replace(/_/g, " ").toUpperCase()}
                        </label>
                        <Input
                          type="date"
                          value={editForm.check_date?.[col] ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              check_date: {
                                ...editForm.check_date,
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
                          Check Date
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.tyre_check_date}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.registration_number}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Type
                        </label>
                        <div className="text-sm text-gray-900">
                          {vehicles.find((v) => v.id === selectedRow.vehicles)?.vehicle_type_name || selectedRow.vehicle_type}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assignee
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedRow.assignee || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tyre Pressure
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.pressure).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn("p-1 rounded", getSafetyColor(value, "pressure"))}
                          >
                            {`${key.replace(/_/g, " ").toUpperCase()}: ${value ?? "N/A"}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tyre Depth
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.depth).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn("p-1 rounded", getSafetyColor(value, "depth"))}
                          >
                            {`${key.replace(/_/g, " ").toUpperCase()}: ${value ?? "N/A"}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Torque
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.torque).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn("p-1 rounded", getSafetyColor(value, "torque"))}
                          >
                            {`${key.replace(/_/g, " ").toUpperCase()}: ${value ?? "N/A"}`}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check Dates
                      </label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                        {Object.entries(selectedRow.check_date).map(([key, value]) => (
                          <div key={key}>{`${key.replace(/_/g, " ").toUpperCase()}: ${value ?? "N/A"}`}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Physical Document
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedRow.physical_document ?? "N/A"}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex space-x-2 pt-4 border-t">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleUpdate}
                        className="bg-orange-500 hover:bg-orange-600"
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
                      {selectedRow.physical_document && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleDownload(selectedRow);
                            setShowModal(false);
                          }}
                          disabled={loading}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Document
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(true);
                          setEditForm({
                            tyre_check_date: selectedRow.tyre_check_date,
                            depth: { ...selectedRow.depth },
                            torque: { ...selectedRow.torque },
                            check_date: { ...selectedRow.check_date },
                            pressure: { ...selectedRow.pressure },
                            vehicles: selectedRow.vehicles,
                            vehicle_type: selectedRow.vehicle_type,
                            assignee: selectedRow.assignee,
                            registration_number: selectedRow.registration_number,
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
        <AddTyreCheckDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddTyreCheck}
          tyreColumns={tyreColumns}
          vehicles={vehicles}
        />
      </div>
    </div>
  );
};

export default TyreCheck;
