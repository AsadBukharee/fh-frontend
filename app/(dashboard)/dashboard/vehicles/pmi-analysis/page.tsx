
"use client";
import { useState, useEffect, useMemo, FC } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Calendar, Car, ChevronLeft, ChevronRight, Edit, Eye, Trash2, Download, MoreVertical, Check, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCookies } from "next-client-cookies";
import API_URL from "@/app/utils/ENV";

// API configuration
const API_CONFIG = {
  baseUrl: "https://api.example.com",
  endpoints: {
    pmi: "/activity/pmi/",
    update: "/activity/pmi/{id}/",
    delete: "/activity/pmi/{id}/",
    download: "/activity/pmi/{id}/download/"
  }
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
  maintenence_provider_error: string | null;
  brake_imbalance: string | null;
  brake_imbalance_note: string | null;
  maintenance_error_note: string | null;
  Correct_DTP_Code_Used: string | null;
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
  onUpdate: (rowId: number | string, field: keyof PmiRow, column: string, value: string | number) => void;
  isEditable?: boolean;
  type?: "status" | "number" | "date";
}

const ActionMenu: FC<ActionMenuProps> = ({
  row,
  onEdit,
  onView,
  onDelete,
  onDownload,
  onApprove,
  onReject
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
          <div className="py-1">
            <button
              onClick={() => { onView(row); setIsOpen(false); }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            <button
              onClick={() => { onEdit(row); setIsOpen(false); }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            {row.file_url && (
              <button
                onClick={() => { onDownload(row); setIsOpen(false); }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </button>
            )}
            <div className="border-t my-1" />
            {row.status === "pending" && (
              <>
                <button
                  onClick={() => { onApprove(row.id); setIsOpen(false); }}
                  className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => { onReject(row.id); setIsOpen(false); }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </>
            )}
            <button
              onClick={() => { onDelete(row.id); setIsOpen(false); }}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusCell: FC<StatusCellProps> = ({
  status,
  rowId,
  field,
  column,
  onUpdate,
  isEditable = false,
  type = "status"
}) => {
  const [value, setValue] = useState<string>(status?.toString() ?? "");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const getStatusStyle = (val: string): string => {
    if (type !== "status") return "text-gray-600 bg-gray-50 border-gray-200 focus:ring-gray-500";
    switch (val.toLowerCase()) {
      case "yes":
        return "text-green-600 bg-green-50 border-green-200 focus:ring-green-500";
      case "no":
        return "text-red-600 bg-red-50 border-red-200 focus:ring-red-500";
      case "":
      case "na":
      case "n/a":
        return "text-gray-600 bg-gray-50 border-gray-200 focus:ring-gray-500";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 focus:ring-gray-500";
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    setIsUpdating(true);
    const originalValue = value;
    setValue(newValue);
    let updateValue: string | number = newValue;
    if (type === "number" && newValue) {
      updateValue = parseFloat(newValue);
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onUpdate(rowId, field, column, updateValue);
    } catch (error) {
      console.error("Failed to update:", error);
      setValue(originalValue);
      
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isEditable) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-xl border",
          getStatusStyle(value)
        )}
      >
        {value || "N/A"}
      </span>
    );
  }

  const inputClass = cn(
    "px-2 py-0.5 w-[60px] text-xs font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2",
    getStatusStyle(value),
    isUpdating && "opacity-50 cursor-not-allowed"
  );

  if (type === "status") {
    return (
      <select
        value={value}
        onChange={handleChange}
        disabled={isUpdating}
        className={cn(inputClass, "appearance-none")}
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
        <option value="NA">NA</option>
      </select>
    );
  }
  if (type === "number") {
    return (
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={handleChange}
        disabled={isUpdating}
        className={inputClass}
      />
    );
  }
  if (type === "date") {
    return (
      <input
        type="date"
        value={value}
        onChange={handleChange}
        disabled={isUpdating}
        className={cn(inputClass, "w-[120px]")}
      />
    );
  }
  return null;
};

const PMI: FC = () => {
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof PmiRow; direction: 'asc' | 'desc' } | null>(null);
  const token=useCookies().get('access_token')

  const tabs: Array<"All Data" | "Tyre Depth" | "Tyre Dates" | "Others"> = [
    "All Data",
    "Tyre Depth",
    "Tyre Dates",
    "Others",
  ];

  // API Functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
    return fetch(`${API_URL}/activity/pmi/`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });
  };

  useEffect(() => {
    const fetchPmiData = async () => {
      setLoading(true);
      try {
        const response = await apiCall(API_CONFIG.endpoints.pmi);
        const data: PmiRow[] = await response.json();
        setPmiData(data);
      } catch (error) {
        console.error("Failed to fetch PMI data:", error);
        setError("Failed to load PMI records");
      } finally {
        setLoading(false);
      }
    };
    fetchPmiData();
  }, []);

  useEffect(() => {
    if (error) {
      setError(null);
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
      const originalFieldValue = pmiData.find(row => row.id === rowId)?.[field];
      const updateData = column
        ? { 
            [field]: { 
              ...(originalFieldValue && typeof originalFieldValue === 'object' && !Array.isArray(originalFieldValue)
                ? originalFieldValue as object
                : {}), 
              [column]: value 
            } 
          }
        : { [field]: value };
      await apiCall(API_CONFIG.endpoints.update.replace("{id}", rowId.toString()), {
        method: "PATCH",
        body: JSON.stringify(updateData)
      });
      setPmiData((prevData) =>
        prevData.map((row) =>
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
      Correct_DTP_Code_Used: row.Correct_DTP_Code_Used
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
      await apiCall(API_CONFIG.endpoints.update.replace("{id}", selectedRow.id.toString()), {
        method: "PATCH",
        body: JSON.stringify(editForm)
      });
      setPmiData(prev =>
        prev.map(row =>
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
    if (!window.confirm("Are you sure you want to delete this PMI record?")) return;
    try {
      setLoading(true);
      await apiCall(API_CONFIG.endpoints.delete.replace("{id}", id.toString()), { method: "DELETE" });
      setPmiData(prev => prev.filter(row => row.id !== id));
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
      const response = await apiCall(API_CONFIG.endpoints.download.replace("{id}", row.id.toString()));
      const blob = await response.blob();
      const link = document.createElement('a');
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
        method: "PATCH",
        body: JSON.stringify({ status: "approved" })
      });
      setPmiData(prev => prev.map(row =>
        row.id === id ? { ...row, status: "approved" } : row
      ));
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
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" })
      });
      setPmiData(prev => prev.map(row =>
        row.id === id ? { ...row, status: "rejected" } : row
      ));
    } catch (error) {
      console.error("Failed to reject:", error);
      setError("Failed to reject record");
    } finally {
      setLoading(false);
    }
  };

  // Filter and Sort
  const filteredData = useMemo(() =>
    pmiData.filter(
      (item) =>
        (item.vehicle_reg?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (item.analysis_date?.includes(searchTerm) ?? false) ||
        (item.pmi_expiry?.includes(searchTerm) ?? false) ||
        (item.defects?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    ),
    [pmiData, searchTerm]
  );

  const handleSort = (key: keyof PmiRow) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredData, sortConfig]);

  const tyreColumns = useMemo(() => {
    const firstValidRow = pmiData.find(row => row.tyre_pressure && Object.keys(row.tyre_pressure).length > 0);
    return firstValidRow ? Object.keys(firstValidRow.tyre_pressure) : [];
  }, [pmiData]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = useMemo(() =>
    sortedData.slice(startIndex, startIndex + rowsPerPage),
    [sortedData, startIndex, rowsPerPage]
  );

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200"
    };
    return (
      <span className={cn(
        "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border",
        statusStyles[status as keyof typeof statusStyles] || "bg-gray-100 text-gray-800 border-gray-200"
      )}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
    
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            PMI Management System
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Comprehensive vehicle inspection data with action controls
          </p>
        </div>
        <div className="flex items-end mb-0">
          {tabs.map((tab) => (
            <div key={tab} className="relative">
              <button
                className={cn(
                  "relative px-6 py-3 border rounded-t-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab
                    ? 'bg-white text-gray-700 border-gray-200 border-b-white z-10'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search PMI records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Filter by Date
                </Button>
                <Button variant="outline" size="sm">
                  <Car className="w-4 h-4 mr-2" />
                  Filter by Vehicle
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Export Data
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                {activeTab === "All Data" && (
                  <>
                    <tr>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                        onClick={() => handleSort('analysis_date')}
                      >
                        Report Date {sortConfig?.key === 'analysis_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                        onClick={() => handleSort('vehicle_reg')}
                      >
                        Vehicle No {sortConfig?.key === 'vehicle_reg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th colSpan={tyreColumns.length} className="text-center bg-blue-50 py-3 px-2 font-medium text-blue-600 border-l border-r border-blue-200">
                        Tyre Pressure (PSI)
                      </th>
                      <th colSpan={tyreColumns.length} className="text-center py-3 px-2 font-medium bg-green-50 text-green-600 border-l border-r border-green-200">
                        Tyre Depth (mm)
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                    <tr className="bg-gray-25">
                      <th></th>
                      <th></th>
                      <th></th>
                      {tyreColumns.map((col) => (
                        <th key={col} className="text-center py-2 px-2 font-medium text-gray-600 bg-blue-25 border-blue-100">
                          {col}
                        </th>
                      ))}
                      {tyreColumns.map((col) => (
                        <th key={col} className="text-center py-2 px-2 font-medium text-gray-600 bg-green-25 border-green-100">
                          {col}
                        </th>
                      ))}
                      <th></th>
                    </tr>
                  </>
                )}
                {activeTab === "Tyre Depth" && (
                  <tr>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('analysis_date')}
                    >
                      Report Date {sortConfig?.key === 'analysis_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('vehicle_reg')}
                    >
                      Vehicle No {sortConfig?.key === 'vehicle_reg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    {tyreColumns.map((col) => (
                      <th key={col} className="text-center py-2 px-2 font-medium text-gray-600">
                        {col}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                )}
                {activeTab === "Tyre Dates" && (
                  <tr>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('analysis_date')}
                    >
                      Report Date {sortConfig?.key === 'analysis_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('vehicle_reg')}
                    >
                      Vehicle No {sortConfig?.key === 'vehicle_reg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    {tyreColumns.map((col) => (
                      <th key={col} className="text-center py-2 px-2 font-medium text-gray-600">
                        {col}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                )}
                {activeTab === "Others" && (
                  <tr>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('analysis_date')}
                    >
                      Report Date {sortConfig?.key === 'analysis_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('vehicle_reg')}
                    >
                      Vehicle No {sortConfig?.key === 'vehicle_reg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600">Brake Test Not Recorded</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600">Brake Test Report Attached</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600">Maintenance Error Answer</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((row) => {
                  if (activeTab === "All Data") {
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{row.analysis_date}</td>
                        <td className="px-4 py-3 font-medium">{row.vehicle_reg}</td>
                        <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
                        {tyreColumns.map((col) => (
                          <td key={col} className="text-center py-3">
                            <StatusCell
                              status={row.tyre_pressure[col]}
                              rowId={row.id}
                              field="tyre_pressure"
                              column={col}
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="number"
                            />
                          </td>
                        ))}
                        {tyreColumns.map((col) => (
                          <td key={col} className="text-center py-3">
                            <StatusCell
                              status={row.tyre_depth[col]}
                              rowId={row.id}
                              field="tyre_depth"
                              column={col}
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="number"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <ActionMenu
                            row={row}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        </td>
                      </tr>
                    );
                  }
                  if (activeTab === "Tyre Depth") {
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{row.analysis_date}</td>
                        <td className="px-4 py-3 font-medium">{row.vehicle_reg}</td>
                        <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
                        {Object.keys(row.tyre_depth).map((col) => (
                          <td key={col} className="text-center py-3">
                            <StatusCell
                              status={row.tyre_depth[col]}
                              rowId={row.id}
                              field="tyre_depth"
                              column={col}
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="number"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <ActionMenu
                            row={row}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        </td>
                      </tr>
                    );
                  }
                  if (activeTab === "Tyre Dates" && row.tyre_dates) {
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{row.analysis_date}</td>
                        <td className="px-4 py-3 font-medium">{row.vehicle_reg}</td>
                        <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
                        {Object.keys(row.tyre_dates).map((col) => (
                          <td key={col} className="text-center py-3">
                            <StatusCell
                              status={row.tyre_dates?.[col]}
                              rowId={row.id}
                              field="tyre_dates"
                              column={col}
                              onUpdate={handleStatusUpdate}
                              isEditable={true}
                              type="date"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <ActionMenu
                            row={row}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        </td>
                      </tr>
                    );
                  }
                  if (activeTab === "Others") {
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{row.analysis_date}</td>
                        <td className="px-4 py-3 font-medium">{row.vehicle_reg}</td>
                        <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
                        <td className="text-center py-3">
                          <StatusCell
                            status={row.brake_test_not_recorded}
                            rowId={row.id}
                            field="brake_test_not_recorded"
                            column=""
                            onUpdate={handleStatusUpdate}
                            isEditable={true}
                            type="status"
                          />
                        </td>
                        <td className="text-center py-3">
                          <StatusCell
                            status={row.brake_test_report_attached}
                            rowId={row.id}
                            field="brake_test_report_attached"
                            column=""
                            onUpdate={handleStatusUpdate}
                            isEditable={true}
                            type="status"
                          />
                        </td>
                        <td className="text-center py-3">
                          <StatusCell
                            status={row.maintenance_error_answer}
                            rowId={row.id}
                            field="maintenance_error_answer"
                            column=""
                            onUpdate={handleStatusUpdate}
                            isEditable={true}
                            type="status"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ActionMenu
                            row={row}
                            onEdit={handleEdit}
                            onView={handleView}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        </td>
                      </tr>
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, sortedData.length)} of {sortedData.length} results
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        {showModal && selectedRow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{isEditing ? "Edit PMI Record" : "PMI Record Details"}</h2>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Registration</label>
                        <Input
                          value={editForm.vehicle_reg || ""}
                          onChange={(e) => setEditForm({ ...editForm, vehicle_reg: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Date</label>
                        <Input
                          type="date"
                          value={editForm.analysis_date || ""}
                          onChange={(e) => setEditForm({ ...editForm, analysis_date: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PMI Expiry</label>
                        <Input
                          type="date"
                          value={editForm.pmi_expiry || ""}
                          onChange={(e) => setEditForm({ ...editForm, pmi_expiry: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correct DTP Code Used</label>
                        <Input
                          value={editForm.Correct_DTP_Code_Used || ""}
                          onChange={(e) => setEditForm({ ...editForm, Correct_DTP_Code_Used: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brake Imbalance</label>
                        <Input
                          value={editForm.brake_imbalance || ""}
                          onChange={(e) => setEditForm({ ...editForm, brake_imbalance: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brake Imbalance Note</label>
                        <Input
                          value={editForm.brake_imbalance_note || ""}
                          onChange={(e) => setEditForm({ ...editForm, brake_imbalance_note: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defects</label>
                      <Textarea
                        value={editForm.defects || ""}
                        onChange={(e) => setEditForm({ ...editForm, defects: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Textarea
                        value={editForm.notes || ""}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Error Note</label>
                      <Textarea
                        value={editForm.maintenance_error_note || ""}
                        onChange={(e) => setEditForm({ ...editForm, maintenance_error_note: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Registration</label>
                        <div className="text-sm text-gray-900">{selectedRow.vehicle_reg}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Date</label>
                        <div className="text-sm text-gray-900">{selectedRow.analysis_date}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PMI Expiry</label>
                        <div className="text-sm text-gray-900">{selectedRow.pmi_expiry ?? "N/A"}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div>{getStatusBadge(selectedRow.status)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brake Imbalance</label>
                        <div className="text-sm text-gray-900">{selectedRow.brake_imbalance ?? "N/A"}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brake Imbalance Note</label>
                        <div className="text-sm text-gray-900">{selectedRow.brake_imbalance_note ?? "N/A"}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correct DTP Code Used</label>
                        <div className="text-sm text-gray-900">{selectedRow.Correct_DTP_Code_Used ?? "N/A"}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Error Note</label>
                        <div className="text-sm text-gray-900">{selectedRow.maintenance_error_note ?? "N/A"}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defects</label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{selectedRow.defects}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{selectedRow.notes}</div>
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
                            maintenance_error_note: selectedRow.maintenance_error_note,
                            Correct_DTP_Code_Used: selectedRow.Correct_DTP_Code_Used
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
