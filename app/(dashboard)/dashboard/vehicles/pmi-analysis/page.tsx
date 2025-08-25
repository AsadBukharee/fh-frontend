"use client";

import { useState, useEffect, FC, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

// Types
interface TyreData {
  [key: string]: string | number | null | undefined;
}

interface PmiRow {
  id: number | string;
  analysis_date: string;
  vehicle_reg: string;
  pmi_expiry?: string;
  tyre_pressure: TyreData;
  tyre_depth: TyreData;
  tyre_dates?: TyreData;
  brake_test_not_recorded?: string | null;
  brake_test_report_attached?: string | null;
  maintenance_error_answer?: string | null;
  defects: string;
  notes: string;
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

const StatusCell: FC<StatusCellProps> = ({ 
  status, 
  rowId, 
  field, 
  column, 
  onUpdate, 
  isEditable = false, 
  type = "status" 
}) => {
  const [value, setValue] = useState<string>(status?.toString() ?? "NA");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const cookies = useCookies();

  const getStatusStyle = (val: string): string => {
    if (type !== "status") return "text-gray-600 bg-gray-50 border-gray-200 focus:ring-gray-500";
    switch (val.toLowerCase()) {
      case "yes":
        return "text-green-600 bg-green-50 border-green-200 focus:ring-green-500";
      case "no":
        return "text-red-600 bg-red-50 border-red-200 focus:ring-red-500";
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
    setValue(newValue); // Optimistic update

    let updateValue: string | number = newValue;
    if (type === "number" && newValue) {
      updateValue = parseFloat(newValue);
    }

    try {
      const body = column
        ? { [field]: { [column]: updateValue } }
        : { [field]: updateValue };

      const response = await fetch(`${API_URL}/activity/pmi/${rowId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to update");
      onUpdate(rowId, field, column, updateValue);
    } catch (error) {
      console.error("Failed to update:", error);
      setValue(originalValue); // Revert on failure
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
        {value}
      </span>
    );
  }

  const inputClass = cn(
    "px-2 py-0.5 w-[50px] text-xs font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2",
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
        className={inputClass}
      />
    );
  }

  return null;
};

const PMI: FC = () => {
  const [pmiData, setPmiData] = useState<PmiRow[]>([]);
  const [activeTab, setActiveTab] = useState<
    "All Data" | "Tyre Depth" | "Tyre Dates" | "Others"
  >("All Data");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cookies = useCookies();

  const tabs: Array<"All Data" | "Tyre Depth" | "Tyre Dates" | "Others"> = [
    "All Data",
    "Tyre Depth",
    "Tyre Dates",
    "Others",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/activity/pmi/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch PMI data");
        }
        const data: PmiRow[] = await response.json();
        setPmiData(data);
      } catch (error: any) {
        console.error("Failed to fetch PMI data:", error);
        setError(error.message || "Failed to load PMI data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = (
    rowId: number | string,
    field: keyof PmiRow,
    column: string,
    value: string | number
  ) => {
    setPmiData((prevData) =>
      prevData.map((row) =>
        row.id === rowId
          ? column
            ? {
                ...row,
                [field]: {
                  ...(row[field] as TyreData),
                  [column]: value,
                },
              }
            : { ...row, [field]: value }
          : row
      )
    );
  };

  // Filter data
  const filteredData = useMemo(() => 
    pmiData.filter(
      (item) =>
        item.vehicle_reg.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.analysis_date.includes(searchTerm) ||
        (item.pmi_expiry?.includes(searchTerm) ?? false) ||
        item.defects.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [pmiData, searchTerm]
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = useMemo(() => 
    filteredData.slice(startIndex, startIndex + rowsPerPage),
    [filteredData, startIndex, rowsPerPage]
  );

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (paginatedData.length === 0) return <div>No results found.</div>;

  const tyreColumns = pmiData[0]?.tyre_pressure ? Object.keys(pmiData[0].tyre_pressure) : [];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Complete PMI Reports
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Comprehensive vehicle inspection data including both tyre pressure
            and depth measurements
          </p>
        </div>
        {/* Tabs */}
        <div className="flex items-end mb-0">
          {tabs.map((tab) => (
            <div key={tab} className="relative">
              <button
                className={`
                  relative px-6 py-3 border rounded border-gray-100  text-sm font-medium transition-all duration-200
                  ${activeTab === tab 
                    ? 'bg-white text-gray-700 z-10' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                `}
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%)',
                  marginRight: '5px'
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border border-gray-200 shadow">
          {/* Search */}
          <div className="items-center mb-2 justify-between flex">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 z-1 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <button className="flex items-center px-3 py-1.5 text-sm rounded-md border border-pink-300 bg-pink-50 text-pink-600 hover:bg-pink-100">
                <Calendar className="w-4 h-4 mr-2" />
                Filter by Date
              </button>
              <button className="flex items-center px-3 py-1.5 text-sm rounded-md border border-pink-300 bg-pink-50 text-pink-600 hover:bg-pink-100">
                <Car className="w-4 h-4 mr-2" />
                Filter by Vehicle
              </button>
            </div>
          </div>

          {/* Table */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {activeTab === "All Data" && (
                      <>
                        <tr>
                          <th
                            scope="col"
                            className="text-left py-3 px-4 font-medium text-gray-700 "
                          >
                            Report Date
                          </th>
                          <th
                            scope="col"
                            className="text-left py-3 px-4 font-medium text-sm text-gray-700 "
                          >
                            Vehicle No
                          </th>
                          <th
                            colSpan={tyreColumns.length}
                            className="text-center bg-orange-200 py-3 px-2 font-medium text-orange-600 "
                          >
                            Tyre Pressure
                          </th>
                          <th
                            colSpan={tyreColumns.length}
                            className="text-center py-3 px-2 font-medium bg-orange-200 text-orange-600 "
                          >
                            Tyre Depth
                          </th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th></th>
                          <th></th>
                          {tyreColumns.map((col) => (
                            <th
                              key={col}
                              scope="col"
                              className="text-center py-2 px-2 font-medium text-gray-600 bg-orange-100"
                            >
                              {col}
                            </th>
                          ))}
                          {tyreColumns.map((col) => (
                            <th
                              key={col}
                              scope="col"
                              className="text-center py-2 px-2 font-medium text-gray-600 bg-orange-100"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </>
                    )}
                    {activeTab === "Tyre Depth" && pmiData[0] && (
                      <tr>
                        <th
                          scope="col"
                          className="text-left py-3 px-4 font-medium text-gray-700 "
                        >
                          Report Date
                        </th>
                        <th
                          scope="col"
                          className="text-left py-3 px-4 font-medium text-gray-700 "
                        >
                          Vehicle No
                        </th>
                        {Object.keys(pmiData[0].tyre_depth).map((col) => (
                          <th
                            key={col}
                            scope="col"
                            className="text-center py-2 px-2 font-medium text-gray-600 "
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    )}
                    {activeTab === "Tyre Dates" && pmiData[0] && (
                      <tr>
                        <th
                          scope="col"
                          className="text-left py-3 px-4 font-medium text-gray-700 "
                        >
                          Report Date
                        </th>
                        <th
                          scope="col"
                          className="text-left py-3 px-4 font-medium text-gray-700 "
                        >
                          Vehicle No
                        </th>
                        {Object.keys(pmiData[0].tyre_dates || {}).map((col) => (
                          <th
                            key={col}
                            scope="col"
                            className="text-center py-2 px-2 font-medium text-gray-600 "
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    )}
                    {activeTab === "Others" && (
                      <tr>
                        <th
                          scope="col"
                          className="text-left py-3 px-4 font-medium text-gray-700 "
                        >
                          Report Date
                        </th>
                        <th
                          scope="col"
                          className="text-left py-3 px-4 font-medium text-gray-700 "
                        >
                          Vehicle No
                        </th>
                        <th
                          scope="col"
                          className="text-center py-2 px-2 font-medium text-gray-600 "
                        >
                          Brake Test Not Recorded
                        </th>
                        <th
                          scope="col"
                          className="text-center py-2 px-2 font-medium text-gray-600 "
                        >
                          Brake Test Report Attached
                        </th>
                        <th
                          scope="col"
                          className="text-center py-2 px-2 font-medium text-gray-600 "
                        >
                          Maintenance Error Answer
                        </th>
                      </tr>
                    )}
                  </thead>

                  <tbody>
                    {paginatedData.map((row) => {
                      if (activeTab === "All Data") {
                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3">{row.analysis_date}</td>
                            <td className="px-4 py-3">{row.vehicle_reg}</td>
                            {tyreColumns.map((col) => (
                              <td key={col} className="text-center">
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
                              <td key={col} className="text-center">
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
                          </tr>
                        );
                      }
                      if (activeTab === "Tyre Depth") {
                        return (
                          <tr key={row.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{row.analysis_date}</td>
                            <td className="px-4 py-3">{row.vehicle_reg}</td>
                            {Object.keys(row.tyre_depth).map((col) => (
                              <td key={col} className="text-center">
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
                          </tr>
                        );
                      }
                      if (activeTab === "Tyre Dates") {
                        if (!row.tyre_dates) return null;
                        return (
                          <tr key={row.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{row.analysis_date}</td>
                            <td className="px-4 py-3">{row.vehicle_reg}</td>
                            {Object.keys(row.tyre_dates).map((col) => (
                              <td key={col} className="text-center">
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
                          </tr>
                        );
                      }
                      if (activeTab === "Others") {
                        return (
                          <tr key={row.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{row.analysis_date}</td>
                            <td className="px-4 py-3">{row.vehicle_reg}</td>
                            <td className="text-center">
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
                            <td className="text-center">
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
                            <td className="text-center">
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
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Rows Page:</span>
                  <span className="text-sm font-medium">{rowsPerPage}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center border rounded text-sm",
                        currentPage === pageNum
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 flex items-center justify-center border rounded text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PMI;