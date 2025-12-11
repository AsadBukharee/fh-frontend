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
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

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

  const cookies = useCookies();

  const formatDate = (s: string | null | undefined) => {
    if (!s || s === "TBC" || s === "null") return "-";
    return s;
  };

  const getStatusBadge = (text: string) => {
    if (!text || text === "TBC") return <span className="text-gray-400 text-xs">TBC</span>;
    if (text.includes("Expired"))
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">{text}</span>;
    if (text.includes("days left"))
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">{text}</span>;
    return <span className="text-gray-900 text-xs">{text}</span>;
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

  // Helper function to determine which columns to show based on active tab
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vehicle Maintenance & Compliance Overview</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {[
          { key: "All Data", label: "All Data" },
          { key: "MOT", label: "MOT", icon: Calendar },
          { key: "PMI Inspection", label: "PMI Inspection", icon: Wrench },
          { key: "Vehicle Tacho Download", label: "Vehicle Tacho Download", icon: Download },
          { key: "Tyre Maintenance Check", label: "Tyre Maintenance Check", icon: Circle },
          { key: "Insurance & Check", label: "Insurance & Check", icon: Shield },
          { key: "Calibrations", label: "Calibrations", icon: Settings },
        ].map(f => {
          const Icon = f.icon;
          const active = activeFilter === f.key;
          return (
            <div key={f.key} className="flex items-center group">
              <button
                onClick={() => setActiveFilter(f.key as TabType)}
                className={`flex items-center h-[30px] gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap ${
                  active ? "bg-orange-500 text-white" : "text-gray-600"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {f.label}
              </button>
              <div className={`w-0 h-0 border-b-[30px] ${active ? "border-b-orange-500" : "border-b-transparent"} border-r-[30px] border-r-transparent`} />
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search vehicles..."
            className="pl-9 w-64"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{vehicleRegFilter} <Filter className="w-4 h-4 ml-2" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {uniqueRegs.map(r => (
              <DropdownMenuItem key={r} onSelect={() => setVehicleRegFilter(r)}>{r}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{statusFilter} <Filter className="w-4 h-4 ml-2" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["All Statuses", "Expired", "Upcoming", "TBC"].map(s => (
              <DropdownMenuItem key={s} onSelect={() => setStatusFilter(s)}>{s}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th rowSpan={2} className="p-3 text-left font-medium text-gray-900 sticky left-0 bg-gray-100 z-10">
                    Vehicle Reg
                  </th>

                  {/* MOT Section - Only show if active tab is MOT or All Data */}
                  {visibleColumns.showMOT && (
                    <th colSpan={5} className="text-center text-sm font-medium text-orange-700 bg-orange-500/30">MOT</th>
                  )}
                  
                  {/* PMI Section - Only show if active tab is PMI Inspection or All Data */}
                  {visibleColumns.showPMI && (
                    <th colSpan={3} className="text-center text-sm font-medium text-rose-700 bg-rose-200">PMI Expiry Date</th>
                  )}
                  
                  {/* Tacho Section - Only show if active tab is Vehicle Tacho Download or All Data */}
                  {visibleColumns.showTacho && (
                    <th colSpan={2} className="text-center text-sm font-medium text-blue-700 bg-blue-500/30">Tacho Download</th>
                  )}
                  
                  {/* Tyre Section - Only show if active tab is Tyre Maintenance Check or All Data */}
                  {visibleColumns.showTyre && (
                    <th colSpan={2} className="text-center text-sm font-medium text-purple-700 bg-purple-500/30">Tyre Maintenance</th>
                  )}
                  
                  {/* Insurance Section - Only show if active tab is Insurance & Check or All Data */}
                  {visibleColumns.showInsurance && (
                    <th colSpan={2} className="text-center text-sm font-medium text-green-700 bg-green-500/30">Insurance & Tax</th>
                  )}
                  
                  {/* Calibrations Section - Only show if active tab is Calibrations or All Data */}
                  {visibleColumns.showCalibrations && (
                    <th colSpan={4} className="text-center text-sm font-medium text-yellow-700 bg-yellow-500/30">Calibrations</th>
                  )}
                </tr>
                <tr className="bg-gray-50">
                  {/* MOT Column Headers */}
                  {visibleColumns.showMOT && (
                    <>
                      <th className="p-2 text-xs font-medium text-orange-700 bg-orange-500/30">Status</th>
                      <th className="p-2 text-xs font-medium text-orange-700 bg-orange-500/30">Expiry</th>
                      <th className="p-2 text-xs font-medium text-orange-700 bg-orange-500/30">Book From</th>
                      <th className="p-2 text-xs font-medium text-orange-700 bg-orange-500/30">Booked Date</th>
                      <th className="p-2 text-xs font-medium text-orange-700 bg-orange-500/30">Time</th>
                    </>
                  )}

                  {/* PMI Column Headers */}
                  {visibleColumns.showPMI && (
                    <>
                      <th className="p-2 text-xs font-medium text-rose-700 bg-rose-200">PMI Expiry Date</th>
                      <th className="p-2 text-xs font-medium text-rose-700 bg-rose-200">Book Next PMI From</th>
                      <th className="p-2 text-xs font-medium text-rose-700 bg-rose-200">Next PMI Booked Date</th>
                    </>
                  )}

                  {/* Tacho Column Headers */}
                  {visibleColumns.showTacho && (
                    <>
                      <th className="p-2 text-xs font-medium text-blue-700 bg-blue-500/30">Last</th>
                      <th className="p-2 text-xs font-medium text-blue-700 bg-blue-500/30">Next</th>
                    </>
                  )}

                  {/* Tyre Column Headers */}
                  {visibleColumns.showTyre && (
                    <>
                      <th className="p-2 text-xs font-medium text-purple-700 bg-purple-500/30">Last</th>
                      <th className="p-2 text-xs font-medium text-purple-700 bg-purple-500/30">Next</th>
                    </>
                  )}

                  {/* Insurance Column Headers */}
                  {visibleColumns.showInsurance && (
                    <>
                      <th className="p-2 text-xs font-medium text-green-700 bg-green-500/30">Insurance</th>
                      <th className="p-2 text-xs font-medium text-green-700 bg-green-500/30">Tax</th>
                    </>
                  )}

                  {/* Calibrations Column Headers */}
                  {visibleColumns.showCalibrations && (
                    <>
                      <th className="p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30">Tacho Calib.</th>
                      <th className="p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30">Next Tacho Calib. Date</th>
                      <th className="p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30">Loller Calib.</th>
                      <th className="p-2 text-xs font-medium text-yellow-700 bg-yellow-500/30">Next Loller Calib. Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row.vehicle} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white z-10">{row.vehicle_reg}</td>

                    {/* MOT Data */}
                    {visibleColumns.showMOT && (
                      <>
                        <td className="p-3">{getStatusBadge(row.mot?.mot_status || "")}</td>
                        <td className="p-3">{formatDate(row.mot?.mot_expiry)}</td>
                        <td className="p-3">{formatDate(row.mot?.book_next_mot_from)}</td>
                        <td className="p-3">{formatDate(row.mot?.next_mot_booked_date)}</td>
                        <td className="p-3">
                          {row.mot?.next_mot_booked_time && row.mot.next_mot_booked_time !== "TBC"
                            ? row.mot.next_mot_booked_time
                            : "-"}
                        </td>
                      </>
                    )}

                    {/* PMI Data */}
                    {visibleColumns.showPMI && (
                      <>
                        <td className="p-3">{formatDate(row.pmi?.pmi_expiry)}</td>
                        <td className="p-3">
                          {row.pmi?.book_next_pmi_from === "booked" ? (
                            <span className="text-green-600 font-medium">
                              Booked ({row.pmi.next_pmi_book_date})
                            </span>
                          ) : (
                            formatDate(row.pmi?.book_next_pmi_from)
                          )}
                        </td>
                        <td className="p-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="cursor-pointer underline text-rose-700">
                                {row.pmi?.book_next_pmi_from === "booked" ? row.pmi.next_pmi_book_date : "-"}
                              </span>
                            </PopoverTrigger>
                            {row.pmi?.hover && (
                              <PopoverContent className="w-64">
                                <div className="text-xs space-y-1">
                                  {Object.entries(row.pmi.hover).map(([k, v]) => (
                                    <div key={k}>
                                      <strong>{k.replace(/_/g, " ")}:</strong> {v}
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            )}
                          </Popover>
                        </td>
                      </>
                    )}

                    {/* Tacho Data */}
                    {visibleColumns.showTacho && (
                      <>
                        <td className="p-3 text-center">{formatDate(row.tacho?.last_download)}</td>
                        <td className="p-3 text-center">{formatDate(row.tacho?.next_download)}</td>
                      </>
                    )}

                    {/* Tyre Data */}
                    {visibleColumns.showTyre && (
                      <>
                        <td className="p-3 text-center">{formatDate(row.tyre?.last_check)}</td>
                        <td className="p-3 text-center">{formatDate(row.tyre?.next_check)}</td>
                      </>
                    )}

                    {/* Insurance & Tax Data */}
                    {visibleColumns.showInsurance && (
                      <>
                        <td className="p-3 text-center">{formatDate(row.insurance?.insurance_expiry)}</td>
                        <td className="p-3 text-center">{formatDate(row.insurance?.tax_expiry)}</td>
                      </>
                    )}

                    {/* Calibrations Data */}
                    {visibleColumns.showCalibrations && (
                      <>
                        <td className="p-3 text-center">{formatDate(row.calibration?.tacho_calibration_expiry)}</td>
                        <td className="p-3 text-center">{formatDate(row.calibration?.next_tacho_calibration_book_date)}</td>
                        <td className="p-3 text-center">{formatDate(row.calibration?.loller_test_expiry_date)}</td>
                        <td className="p-3 text-center">{formatDate(row.calibration?.next_loller_test_date)}</td>
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
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredData.length)} of {filteredData.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}