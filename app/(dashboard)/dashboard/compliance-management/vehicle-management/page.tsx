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
import {
  parse,
  differenceInDays,
  format,
  isWithinInterval,
} from "date-fns";
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
      time_mot_booked: string;
      mot_status: string;
    }>;
    pmi: Array<{
      vehicle: number;
      vehicle_reg: string;
      last_pmi_date: string | null;
      book_next_pmi_from: string | null;
      next_pmi_date: string;
      hover: Record<string, string>;
    }>;
    tacho: Array<{ vehicle: number; vehicle_reg: string; last_download: string | null; next_download: string | null }>;
    tyre: Array<{ vehicle: number; vehicle_reg: string; last_check: string | null; next_check: string | null }>;
    insurance: Array<{ vehicle: number; vehicle_reg: string; expiry: string; tax_expiry: string }>;
    calibrations: Array<{ vehicle: number; vehicle_reg: string; tacho_expiry: string | null; loller_expiry: string | null }>;
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

export default function VehicleDashboard() {
  const [fullApiData, setFullApiData] = useState<ApiResponse | null>(null);
  const [filteredData, setFilteredData] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Data");
  const [vehicleRegFilter, setVehicleRegFilter] = useState("All Registrations");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const cookies = useCookies();

  const parseDate = (s: string | null | undefined): Date | null => {
    if (!s || s === "TBC" || s === "null") return null;
    const d = parse(s.trim(), "dd/MM/yyyy", new Date());
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (s: string | null | undefined) => (s && s !== "TBC" ? s : "-");

  const getStatusBadge = (text: string) => {
    if (!text || text === "TBC") return <span className="text-gray-400 text-xs">TBC</span>;
    if (text.includes("Expired")) return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">{text}</span>;
    if (text.includes("days left") || text.includes("days remaining")) return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">{text}</span>;
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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [cookies]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build rows by vehicle ID
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
      vehicle_reg: maps.mot.get(id)?.vehicle_reg || maps.pmi.get(id)?.vehicle_reg || "Unknown",
      mot: maps.mot.get(id),
      pmi: maps.pmi.get(id),
      tacho: maps.tacho.get(id),
      tyre: maps.tyre.get(id),
      insurance: maps.insurance.get(id),
      calibration: maps.calibration.get(id),
    }));
  }, [fullApiData]);

  // Filter logic
  useEffect(() => {
    let data = buildRows();

    // Active tab filter
    if (activeFilter === "MOT") data = data.filter(r => r.mot);
    if (activeFilter === "PMI Inspection") data = data.filter(r => r.pmi);
    if (activeFilter === "Vehicle Tacho Download") data = data.filter(r => r.tacho);
    if (activeFilter === "Tyre Maintenance Check") data = data.filter(r => r.tyre);
    if (activeFilter === "Insurance & Check") data = data.filter(r => r.insurance);
    if (activeFilter === "Calibrations") data = data.filter(r => r.calibration);

    // Search & filters
    if (searchQuery) data = data.filter(r => r.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()));
    if (vehicleRegFilter !== "All Registrations") data = data.filter(r => r.vehicle_reg === vehicleRegFilter);
    if (statusFilter === "Expired") data = data.filter(r => r.mot?.mot_status.includes("Expired"));
    if (statusFilter === "Upcoming") data = data.filter(r => r.mot?.mot_status.includes("days left"));
    if (statusFilter === "TBC") data = data.filter(r => r.mot?.time_mot_booked === "TBC");

    setFilteredData(data);
    setCurrentPage(1);
  }, [buildRows, activeFilter, searchQuery, vehicleRegFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginated = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const uniqueRegs = ["All Registrations", ...Array.from(new Set(filteredData.map(r => r.vehicle_reg))).sort()];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Maintenance & Compliance Overview</h1>
        <p className="text-gray-600">Monitor and manage vehicle compliance across all categories</p>
      </div>

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
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center h-[30px] gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap ${active ? "bg-orange-500 text-white" : "text-gray-600"}`}
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
          <Input placeholder="Search vehicles..." className="pl-9 w-64" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{vehicleRegFilter} <Filter className="w-4 h-4 ml-2" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {uniqueRegs.map(r => <DropdownMenuItem key={r} onSelect={() => setVehicleRegFilter(r)}>{r}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{statusFilter} <Filter className="w-4 h-4 ml-2" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["All Statuses", "Expired", "Upcoming", "TBC"].map(s => <DropdownMenuItem key={s} onSelect={() => setStatusFilter(s)}>{s}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {activeFilter === "All Data" && (
                  <>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">Vehicle Reg</th>
                      <th colSpan={5} className="text-center p-3 text-sm font-medium text-orange-700 bg-orange-500/30">MOT</th>
                      <th className="text-center p-3 text-sm font-medium text-rose-700 bg-rose-200">PMI</th>
                      <th colSpan={2} className="text-center p-3 text-sm font-medium text-blue-700 bg-blue-500/30">Tacho</th>
                      <th colSpan={2} className="text-center p-3 text-sm font-medium text-purple-700 bg-purple-500/30">Tyres</th>
                      <th colSpan={2} className="text-center p-3 text-sm font-medium text-green-700 bg-green-500/30">Insurance & Tax</th>
                      <th className="text-center p-3 text-sm font-medium text-yellow-700 bg-yellow-500/30">Calibration</th>
                    </tr>
                    <tr className="bg-gray-50 border-b">
                      <th className="sticky left-0 z-10 bg-gray-50 p-3 text-xs"></th>
                      <th className="p-2 text-xs text-orange-700 bg-orange-500/30">Status</th>
                      <th className="p-2 text-xs text-orange-700 bg-orange-500/30">Expiry</th>
                      <th className="p-2 text-xs text-orange-700 bg-orange-500/30">Book From</th>
                      <th className="p-2 text-xs text-orange-700 bg-orange-500/30">Booked Date</th>
                      <th className="p-2 text-xs text-orange-700 bg-orange-500/30">Time</th>
                      <th className="p-2 text-xs text-rose-700 bg-rose-200">Next Book From</th>
                      <th className="p-2 text-xs text-blue-700 bg-blue-500/30">Last</th>
                      <th className="p-2 text-xs text-blue-700 bg-blue-500/30">Next</th>
                      <th className="p-2 text-xs text-purple-700 bg-purple-500/30">Last</th>
                      <th className="p-2 text-xs text-purple-700 bg-purple-500/30">Next</th>
                      <th className="p-2 text-xs text-green-700 bg-green-500/30">Insurance</th>
                      <th className="p-2 text-xs text-green-700 bg-green-500/30">Tax</th>
                      <th className="p-2 text-xs text-yellow-700 bg-yellow-500/30">Tacho Calib.</th>
                    </tr>
                  </>
                )}
                {activeFilter === "MOT" && (
                  <tr className="bg-orange-50">
                    <th className="p-3 text-left">Vehicle Reg</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Expiry</th>
                    <th className="p-3 text-left">Book From</th>
                    <th className="p-3 text-left">Booked Date</th>
                    <th className="p-3 text-left">Time</th>
                  </tr>
                )}
                {activeFilter === "PMI Inspection" && (
                  <tr className="bg-pink-50">
                    <th className="p-3 text-left">Vehicle Reg</th>
                    <th className="p-3 text-left">Next Book From</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row.vehicle} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white z-10">{row.vehicle_reg}</td>

                    {activeFilter === "All Data" && (
                      <>
                        <td className="p-3">{getStatusBadge(row.mot?.mot_status || "")}</td>
                        <td className="p-3">{formatDate(row.mot?.mot_expiry)}</td>
                        <td className="p-3">{formatDate(row.mot?.book_next_mot_from)}</td>
                        <td className="p-3">{formatDate(row.mot?.next_mot_booked_date)}</td>
                        <td className="p-3">{getStatusBadge(row.mot?.time_mot_booked || "")}</td>

                        <td className="p-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="cursor-pointer underline text-rose-700">
                                {formatDate(row.pmi?.book_next_pmi_from) || "TBC"}
                              </span>
                            </PopoverTrigger>
                            {row.pmi?.hover && (
                              <PopoverContent className="w-64">
                                <div className="text-xs space-y-1">
                                  {Object.entries(row.pmi.hover).map(([k, v]) => (
                                    <div key={k}><strong>{k.replace(/_/g, " ")}:</strong> {v}</div>
                                  ))}
                                </div>
                              </PopoverContent>
                            )}
                          </Popover>
                        </td>

                        <td className="p-3">{formatDate(row.tacho?.last_download)}</td>
                        <td className="p-3">{formatDate(row.tacho?.next_download)}</td>
                        <td className="p-3">{formatDate(row.tyre?.last_check)}</td>
                        <td className="p-3">{formatDate(row.tyre?.next_check)}</td>
                        <td className="p-3">{formatDate(row.insurance?.expiry)}</td>
                        <td className="p-3">{formatDate(row.insurance?.tax_expiry)}</td>
                        <td className="p-3">{formatDate(row.calibration?.tacho_expiry)}</td>
                      </>
                    )}

                    {activeFilter === "MOT" && row.mot && (
                      <>
                        <td className="p-3">{getStatusBadge(row.mot.mot_status)}</td>
                        <td className="p-3">{formatDate(row.mot.mot_expiry)}</td>
                        <td className="p-3">{formatDate(row.mot.book_next_mot_from)}</td>
                        <td className="p-3">{formatDate(row.mot.next_mot_booked_date)}</td>
                        <td className="p-3">{getStatusBadge(row.mot.time_mot_booked)}</td>
                      </>
                    )}

                    {activeFilter === "PMI Inspection" && row.pmi && (
                      <td className="p-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <span className="cursor-pointer underline text-rose-700">
                              {formatDate(row.pmi.book_next_pmi_from) || "TBC"}
                            </span>
                          </PopoverTrigger>
                          {row.pmi.hover && (
                            <PopoverContent className="w-64">
                              <div className="text-xs space-y-1">
                                {Object.entries(row.pmi.hover).map(([k, v]) => (
                                  <div key={k}><strong>{k.replace(/_/g, " ")}:</strong> {v}</div>
                                ))}
                              </div>
                            </PopoverContent>
                          )}
                        </Popover>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i + 1)}>
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