'use client'
import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useCookies } from 'next-client-cookies';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import API_URL from '@/app/utils/ENV';
import {
  EllipsisVertical, Gauge, MapPin, UsersRound, Eye, Edit, Trash2,
  Calendar, Filter, User, CalendarDays, ChevronLeft, ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ExportButton from '@/app/utils/ExportButton';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';

type Stop = {
  id: number;
  location_name: string;
  su_run: number;
  mileage: number;
  order: number;
  number: number;
  spillover: number;
};

type Run = {
  id: number;
  is_stopped: boolean;
  vehicle: {
    id: number;
    registration_number: string;
    vehicles_type_name: string;
    last_mileage: string;
  } | null;
  driver: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  direction: "in" | "out";
  created_at: string;
  updated_at: string;
  notes: string | null;
  run_type: string;
  end_mileage: string | null;
  traveled_mileage: string | null;
  stops: Stop[];
};

type Driver = {
  id: number;
  full_name: string;
  email: string;
};

// Updated RUN_TYPE_MAP to handle both display and numeric mapping
const DISPLAY_RUN_TYPES: Record<string, string> = {
  '1': 'Early Run',
  '2': '1st Shuttle Run',
  '3': '2nd Shuttle Run',
  '4': '3rd Shuttle Run',
  '5': 'Night Run',
  '6': 'Maintenance Run',
  'Early Run': 'Early Run',
  '1st Shuttle Run': '1st Shuttle Run',
  '2nd Shuttle Run': '2nd Shuttle Run',
  '3rd Shuttle Run': '3rd Shuttle Run',
  'Night Run': 'Night Run',
  'Maintenance Run': 'Maintenance Run',
};

// Reverse mapping for API requests
const RUN_TYPE_TO_NUMERIC: Record<string, string> = {
  'Early Run': '1',
  '1st Shuttle Run': '2',
  '2nd Shuttle Run': '3',
  '3rd Shuttle Run': '4',
  'Night Run': '5',
  'Maintenance Run': '6',
};

const SHUTTLE_TYPES = [
  { id: '2', label: "1st Shuttle", color: "bg-green-100 text-green-700 hover:bg-green-200", display: "1st Shuttle Run" },
  { id: '3', label: "2nd Shuttle", color: "bg-blue-100 text-blue-700 hover:bg-blue-200", display: "2nd Shuttle Run" },
  { id: '4', label: "3rd Shuttle", color: "bg-orange-100 text-orange-700 hover:bg-orange-200", display: "3rd Shuttle Run" },
];

const OTHER_RUN_TYPES = [
  { id: '1', label: "Early", color: "bg-red-100 text-red-700 hover:bg-red-200", display: "Early Run" },
  { id: '5', label: "Night", color: "bg-purple-100 text-purple-700 hover:bg-purple-200", display: "Night Run" },
  { id: '6', label: "Maintenance", color: "bg-pink-100 text-pink-700 hover:bg-pink-200", display: "Maintenance Run" },
  { id: 'all', label: "All Runs", color: "bg-gray-100 text-gray-700 hover:bg-gray-200", display: "All Runs" },
];

const ALL_RUN_TYPES = [
  ...OTHER_RUN_TYPES.filter(rt => rt.id !== 'all'),
  ...SHUTTLE_TYPES
];

const MileageTracker = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [activeRunType, setActiveRunType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today;
  });
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Advanced filter dialog
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dialog states
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit form states
  const [editMileage, setEditMileage] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  const token = useCookies().get('access_token');

  // Fetch drivers list
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch(`${API_URL}/users/?role=Driver`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
        });
        const data = await res.json();
        if (data?.data?.results) {
          setDrivers(data.data.results);
        }
      } catch (err) {
        console.error("Failed to fetch drivers", err);
      }
    };
    fetchDrivers();
  }, [token]);
  const fetchData = async () => {
    try {
      setLoading(true);
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('page_size', pageSize.toString());

      if (dateFrom) {
        params.append('date_from', format(dateFrom, 'yyyy-MM-dd'));
      }
      if (dateTo) {
        params.append('date_to', format(dateTo, 'yyyy-MM-dd'));
      }
      if (selectedDriver !== "all") {
        params.append('driver', selectedDriver);
      }
      // Send numeric run_type values
      if (activeRunType !== "all") {
        params.append('run_type', activeRunType);
      }

      const apiUrl = `${API_URL}/activity/su-run/?${params.toString()}`;
      console.log('Fetching from:', apiUrl);

      const res = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (data?.data?.results) {
        // Process the data
        const processedData = data.data.results.map((run: Run) => ({
          ...run,
          // Ensure driver name is handled properly
          driver: {
            ...run.driver,
            full_name: run.driver?.full_name || (run.driver?.email === "AnonymousUser" ? "Anonymous" : run.driver?.email || "Unknown")
          },
          // Calculate total mileage for display
          totalMileage: () => {
            if (run.traveled_mileage && parseFloat(run.traveled_mileage) > 0) {
              return parseFloat(run.traveled_mileage);
            }
            if (run.end_mileage && run.vehicle?.last_mileage) {
              const end = parseFloat(run.end_mileage);
              const start = parseFloat(run.vehicle.last_mileage);
              return end - start;
            }
            // Calculate from stops
            return run.stops.reduce((sum, stop) => sum + stop.mileage, 0);
          }
        }));

        const sortedData = processedData.sort((a: Run, b: Run) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log('Processed runs:', sortedData);
        setRuns(sortedData);
        setFilteredRuns(sortedData);
        setTotalPages(data.data.total_pages || 1);
        setTotalCount(data.data.count || 0);
      } else {
        console.log('No data results found');
        setRuns([]);
        setFilteredRuns([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch error", err);
      setRuns([]);
      setFilteredRuns([]);
    } finally {
      setLoading(false);
    }
  };
  // Fetch runs with filters
  useEffect(() => {

    fetchData();
  }, [token, currentPage, pageSize, dateFrom, dateTo, selectedDriver, activeRunType]);

  // Helper function to calculate total mileage for a run
  const calculateTotalMileage = (run: Run): number => {
    if (run.traveled_mileage && parseFloat(run.traveled_mileage) > 0) {
      return parseFloat(run.traveled_mileage);
    }
    if (run.end_mileage && run.vehicle?.last_mileage) {
      const end = parseFloat(run.end_mileage);
      const start = parseFloat(run.vehicle.last_mileage);
      return Math.max(0, end - start);
    }
    // Calculate from stops
    return run.stops.reduce((sum, stop) => sum + stop.mileage, 0);
  };

  // Helper function to get driver display name
  const getDriverDisplayName = (run: Run): string => {
    if (run.driver?.full_name && run.driver.full_name.trim()) {
      return run.driver.full_name;
    }
    if (run.driver?.email === "AnonymousUser") {
      return "Anonymous";
    }
    if (run.driver?.email) {
      return run.driver.email;
    }
    return "Unknown";
  };

  // Reset filters
  const resetFilters = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    setDateFrom(weekAgo);
    setDateTo(today);
    setSelectedDriver("all");
    setActiveRunType("all");
    setCurrentPage(1);
  };

  // Format date range display
  const getDateRangeDisplay = () => {
    if (!dateFrom || !dateTo) return "Select date range";
    return `${format(dateFrom, 'MMM dd, yyyy')} - ${format(dateTo, 'MMM dd, yyyy')}`;
  };

  // Get the current active run type display name
  const getActiveRunTypeDisplay = () => {
    if (activeRunType === "all") return "All Runs";

    const runTypeObj = ALL_RUN_TYPES.find(rt => rt.id === activeRunType);
    if (!runTypeObj) return activeRunType;

    return runTypeObj.display;
  };

  // Get driver totals for summary
  const getDriverTotals = (driverName: string) => {
    const driverRuns = filteredRuns.filter(run => getDriverDisplayName(run) === driverName);

    const totalTransfers = driverRuns.reduce((sum, run) =>
      sum + run.stops.reduce((s, stop) => s + Math.abs(stop.number), 0), 0
    );

    const totalJobs = driverRuns.reduce((sum, run) => sum + run.stops.length, 0);
    const totalMileage = driverRuns.reduce((sum, run) => sum + calculateTotalMileage(run), 0);

    return { totalTransfers, totalJobs, totalMileage };
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Dialog handlers
  const handleView = (run: Run) => {
    setSelectedRun(run);
    setViewOpen(true);
  };

  const handleEdit = (run: Run) => {
    setSelectedRun(run)
    setEditMileage(run.traveled_mileage || "");
    setEditNotes(run.notes || "");
    setEditOpen(true);
  };

  const handleDelete = (run: Run) => {
    setSelectedRun(run);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRun) return;
    try {
      await fetch(`${API_URL}/activity/su-run/${selectedRun.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh data after deletion
      setCurrentPage(1);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleteOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedRun) return;
    try {
      const res = await fetch(`${API_URL}/activity/su-run/${selectedRun.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          traveled_mileage: editMileage ? parseFloat(editMileage) : null,
          notes: editNotes.trim() || null
        })
      });
      if (res.ok) {
        setEditOpen(false);
        // Refresh data
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  // Get unique drivers for the current filter
  const uniqueDrivers = Array.from(new Set(filteredRuns.map(run => getDriverDisplayName(run)))).filter(Boolean);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <>
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex flex-col space-y-2">
              <CardTitle className="text-2xl font-bold">Mileage Tracker</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  <span>{getDateRangeDisplay()}</span>
                </div>
                {selectedDriver !== "all" && (
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{drivers.find(d => d.id.toString() === selectedDriver)?.full_name}</span>
                  </div>
                )}
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {filteredRuns.length} of {totalCount} runs
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />

              </Button>
              <ExportButton
                data={runs}
                fileName='Mileage_tracker'
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(true)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                Advanced Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Run Type Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">RUN TYPES</h3>
              <div className="flex flex-wrap gap-3">
                {OTHER_RUN_TYPES.filter(rt => rt.id !== 'all').map(f => (
                  <Badge
                    key={f.id}
                    className={`cursor-pointer px-5 py-2 rounded-full text-sm font-semibold transition-all border-2 ${activeRunType === f.id
                      ? "bg-white border-gray-800 shadow-md text-gray-900 font-bold"
                      : f.color + " border-transparent"
                      }`}
                    onClick={() => setActiveRunType(f.id)}
                  >
                    {f.label}
                  </Badge>
                ))}
                {SHUTTLE_TYPES.map(f => (
                  <Badge
                    key={f.id}
                    className={`cursor-pointer px-5 py-2 rounded-full text-sm font-semibold transition-all border-2 ${activeRunType === f.id
                      ? "bg-white border-gray-800 shadow-md text-gray-900 font-bold"
                      : f.color + " border-transparent"
                      }`}
                    onClick={() => setActiveRunType(f.id)}
                  >
                    {f.label}
                  </Badge>
                ))}
                <Badge
                  key="all"
                  className={`cursor-pointer px-5 py-2 rounded-full text-sm font-semibold transition-all border-2 ${activeRunType === "all"
                    ? "bg-white border-gray-800 shadow-md text-gray-900 font-bold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
                    }`}
                  onClick={() => setActiveRunType("all")}
                >
                  All Runs
                </Badge>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {getActiveRunTypeDisplay()}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredRuns.length} of {totalCount} total runs
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Table */}
            {filteredRuns.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Driver</TableHead>
                      <TableHead className="font-bold">Time & Date</TableHead>
                      <TableHead className="font-bold">Run Type</TableHead>
                      <TableHead className="font-bold">Route</TableHead>
                      <TableHead className="font-bold text-center">Direction</TableHead>
                      <TableHead className="font-bold text-center">Mileage</TableHead>
                      <TableHead className="font-bold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRuns.map((run) => {
                      const sortedStops = [...run.stops].sort((a, b) => a.order - b.order);
                      const runDate = new Date(run.created_at);
                      const runTime = runDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      const runDateStr = formatToDDMMYYYY(run.created_at);

                      // Determine badge color based on run type
                      let badgeColor = "bg-gray-100 text-gray-700";
                      if (run.run_type === "Early Run") badgeColor = "bg-red-100 text-red-700";
                      else if (run.run_type === "1st Shuttle Run") badgeColor = "bg-green-100 text-green-700";
                      else if (run.run_type === "2nd Shuttle Run") badgeColor = "bg-blue-100 text-blue-700";
                      else if (run.run_type === "3rd Shuttle Run") badgeColor = "bg-orange-100 text-orange-700";
                      else if (run.run_type === "Night Run") badgeColor = "bg-purple-100 text-purple-700";
                      else if (run.run_type === "Maintenance Run") badgeColor = "bg-pink-100 text-pink-700";

                      const totalMileage = calculateTotalMileage(run);

                      return (
                        <TableRow key={run.id} className="hover:bg-gray-50">
                          <TableCell className="font-semibold">
                            {getDriverDisplayName(run)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{runTime}</span>
                              <span className="text-sm text-gray-600">{runDateStr}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={badgeColor}>
                              {run.run_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-3 overflow-x-auto max-w-[600px]">
                              {sortedStops.map((stop, idx) => (
                                <React.Fragment key={stop.id}>
                                  {idx > 0 && (
                                    <div className="flex flex-col items-center relative">
                                      <div className="w-24 h-1 border-t-4 border-dashed border-gray-400"></div>
                                      {/* <span className="absolute mt-6 text-xs font-medium text-gray-700 flex items-center gap-1 bg-white px-2 rounded">
                                        <Gauge size={12} />
                                        {stop.mileage > 0 ? `${stop.mileage.toFixed(1)} mi` : '0 mi'}
                                      </span> */}
                                    </div>
                                  )}
                                  <div className="flex flex-col items-center min-w-28">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${run.direction === "out" ? "bg-pink-100" : "bg-green-100"
                                      }`}>
                                      <MapPin size={14} className={
                                        run.direction === "out" ? "text-pink-600" : "text-green-600"
                                      } />
                                    </div>
                                    <div className="mt-2 text-center">
                                      <div className="font-semibold text-sm text-gray-800 line-clamp-1">
                                        {stop.location_name}
                                      </div>
                                      {/* <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                                        <UsersRound size={12} />
                                        SU: {stop.number}
                                        {stop.spillover !== 0 && (
                                          <span className={stop.spillover > 0 ? "text-green-600" : "text-red-600"}>
                                            ({stop.spillover > 0 ? '+' : ''}{stop.spillover})
                                          </span>
                                        )}
                                      </div> */}
                                    </div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`px-4 py-1 text-sm font-bold border-2 ${run.direction === "in"
                              ? "bg-green-100 text-green-700 border-green-400"
                              : "bg-red-100 text-red-700 border-red-400"
                              }`}>
                              {run.direction.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {totalMileage.toFixed(1)} mi
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <EllipsisVertical size={20} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(run)} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(run)} className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(run)} className="cursor-pointer text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-12">
                <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No runs found</h3>
                <p className="text-gray-500 mt-2">
                  {activeRunType === "all"
                    ? "No runs found for the selected date range and filters."
                    : `No ${getActiveRunTypeDisplay()} runs found for the selected date range and filters.`}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            )}

            {/* Driver Summary Table */}
            {filteredRuns.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold mb-2">Driver Summary</h2>
                <p className="text-sm text-muted-foreground mb-4">Total operations for selected filter</p>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Driver</TableHead>
                      <TableHead className="font-bold">Total Runs</TableHead>
                      <TableHead className="font-bold">Total Transfers</TableHead>
                      <TableHead className="font-bold">Total Stops</TableHead>
                      <TableHead className="font-bold">Total Mileage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueDrivers.map(driverName => {
                      if (!driverName) return null;

                      const driverRuns = filteredRuns.filter(run => getDriverDisplayName(run) === driverName);
                      const totals = getDriverTotals(driverName);

                      return (
                        <TableRow key={driverName}>
                          <TableCell className="font-medium">{driverName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 px-4 py-1">
                              {driverRuns.length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 px-4 py-1">
                              {totals.totalTransfers}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {totals.totalJobs}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-pink-100 text-pink-700 px-4 py-1">
                              {totals.totalMileage.toFixed(1)} mi
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters Dialog */}
      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Filter runs by date range, driver, and other criteria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range</Label>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-gray-500">to</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Driver Filter */}
            <div className="space-y-3">
              <Label>Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.full_name || driver.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Run Type Filter */}
            <div className="space-y-3">
              <Label>Run Type</Label>
              <Select value={activeRunType} onValueChange={setActiveRunType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select run type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Runs</SelectItem>
                  {ALL_RUN_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Size */}
            <div className="space-y-3">
              <Label>Results per page</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Presets */}
            <div className="space-y-3">
              <Label>Quick Date Presets</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date();
                    weekAgo.setDate(today.getDate() - 7);
                    setDateFrom(weekAgo);
                    setDateTo(today);
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date();
                    monthAgo.setDate(today.getDate() - 30);
                    setDateFrom(monthAgo);
                    setDateTo(today);
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    setDateFrom(yesterday);
                    setDateTo(yesterday);
                  }}
                >
                  Yesterday
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset All
            </Button>
            <Button onClick={() => setShowAdvancedFilters(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Run Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Driver:</strong> {getDriverDisplayName(selectedRun)}</div>
                <div><strong>Vehicle:</strong> {selectedRun.vehicle?.registration_number || 'N/A'}</div>
                <div><strong>Type:</strong> {selectedRun.vehicle?.vehicles_type_name || 'N/A'}</div>
                <div><strong>Run Type:</strong> {selectedRun.run_type}</div>
                <div><strong>Direction:</strong> {selectedRun.direction.toUpperCase()}</div>
                <div><strong>Status:</strong> {selectedRun.is_stopped ? 'Stopped' : 'Active'}</div>
                <div><strong>Total Mileage:</strong> {calculateTotalMileage(selectedRun).toFixed(1)} mi</div>
                <div><strong>Traveled Mileage:</strong> {selectedRun.traveled_mileage || '0.00'} mi</div>
                <div><strong>End Mileage:</strong> {selectedRun.end_mileage || 'N/A'}</div>
                <div><strong>Date & Time:</strong> {new Date(selectedRun.created_at).toLocaleString()}</div>
              </div>
              <div><strong>Notes:</strong> {selectedRun.notes || "No notes"}</div>
              <div className="mt-4">
                <strong>Stops ({selectedRun.stops.length}):</strong>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  {selectedRun.stops.sort((a, b) => a.order - b.order).map(stop => (
                    <li key={stop.id} className="pb-2 border-b last:border-b-0">
                      <div className="font-medium">{stop.location_name}</div>
                      <div className="text-sm text-gray-600">
                        Order: {stop.order} | SU: {stop.number} | Spillover: {stop.spillover} | Mileage: {stop.mileage.toFixed(1)} mi
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Run</DialogTitle>
            <DialogDescription>
              Update the mileage and notes for this run.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-mileage">Traveled Mileage</Label>
              <Input
                id="edit-mileage"
                type="number"
                step="0.01"
                value={editMileage}
                onChange={(e) => setEditMileage(e.target.value)}
                placeholder="Enter traveled mileage"
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Run?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the run for{" "}
              <strong>{selectedRun && getDriverDisplayName(selectedRun)}</strong> ({selectedRun?.run_type}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MileageTracker;