"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ExportButton from "@/app/utils/ExportButton";

// Define types for API responses
interface Stop {
  id: number;
  su_run: number;
  location: number;
  location_name: string;
  order: number;
  number: number;
  spillover: number;
  mileage: number;
  arrival_time: string | null;
  notes: string;
}

interface StopDetailsResponse {
  success: boolean;
  message: string;
  data: {
    data: { driver_name: string; number: number; datetime: string; direction: string }[];
  };
}

interface ApiRun {
  runName: string;
  startTime: string;
  endTime: string;
  data: LocationRow[];
  internalJobsList: { name: string; Total: string }[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    runs: ApiRun[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    filters: {
      start_date: string;
      end_date: string;
      driver: string;
      location: string;
      direction: string;
    };
  };
}

interface Location {
  id: number;
  name: string;
}

interface Driver {
  id: number;
  full_name: string;
  avatar: string | null;
  email: string;
}

// Define types for your data structure
type TimeSlotId = "early" | "shuttle1" | "shuttle2" | "shuttle3" | "night";

interface LocationRow {
  location: string;
  out: number;
  in: number;
  spillover: number;
}

interface DriverRow {
  name: string;
  transfers: number;
  jobs: number;
  total: number;
}

interface SlotData {
  timeRange: string;
  data: LocationRow[];
  internalOps: { drivers: DriverRow[] };
}

type TransportData = Record<TimeSlotId, SlotData>;

// Fallback data
const fallbackTransportData: TransportData = {
  early: { timeRange: "5:00 AM - 9:20 AM", data: [], internalOps: { drivers: [] } },
  shuttle1: { timeRange: "9:21 AM - 2:00 PM", data: [], internalOps: { drivers: [] } },
  shuttle2: { timeRange: "2:01 PM - 4:30 PM", data: [], internalOps: { drivers: [] } },
  shuttle3: { timeRange: "4:31 PM - 6:59 PM", data: [], internalOps: { drivers: [] } },
  night: { timeRange: "7:00 PM - 4:59 AM", data: [], internalOps: { drivers: [] } },
};

// Fallback static lists for locations and drivers
const fallbackLocations: Location[] = [
  { id: 15, name: "Braintree Bus Station" },
  { id: 16, name: "Braintree Borno Pharmacy" },
  { id: 17, name: "Braintree Community Hospital" },
  { id: 18, name: "Braintree Police Station" },
  { id: 26, name: "Colchester Napier Road" },
];
const fallbackDrivers: Driver[] = [
  { id: 1, full_name: "John David", avatar: null, email: "john.david@example.com" },
  { id: 2, full_name: "Jane Smith", avatar: null, email: "jane.smith@example.com" },
  { id: 3, full_name: "Mike Johnson", avatar: null, email: "mike.johnson@example.com" },
];

// Map time slot IDs to API run names
const idToRunName: Record<TimeSlotId, string> = {
  early: "Early",
  shuttle1: "First Shuttle",
  shuttle2: "2nd Shuttle Run",
  shuttle3: "Third Shuttle",
  night: "Night",
};

// Map API run names to time slot IDs
const runNameToId: Record<string, TimeSlotId> = {
  Early: "early",
  "First Shuttle": "shuttle1",
  "2nd Shuttle Run": "shuttle2",
  "Third Shuttle": "shuttle3",
  Night: "night",
};

const tabs: { id: TimeSlotId; label: string; color: string; startTime: string; endTime: string }[] = [
  { id: "early", label: "Early", color: "bg-pink-100 text-pink-600 border-pink-200", startTime: "5:00 AM", endTime: "9:20 AM" },
  { id: "shuttle1", label: "1st Shuttle", color: "bg-green-100 text-green-600 border-green-200", startTime: "9:21 AM", endTime: "2:00 PM" },
  { id: "shuttle2", label: "2nd Shuttle", color: "bg-purple-100 text-purple-600 border-purple-200", startTime: "2:01 PM", endTime: "4:30 PM" },
  { id: "shuttle3", label: "3rd Shuttle", color: "bg-orange-100 text-orange-600 border-orange-200", startTime: "4:31 PM", endTime: "6:59 PM" },
  { id: "night", label: "Night", color: "bg-blue-100 text-blue-600 border-blue-200", startTime: "7:00 PM", endTime: "4:59 AM" },
];

// Helper function to parse time strings (e.g., "5:00 AM") to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  return {
    hours: period === "PM" && hours !== 12 ? hours + 12 : period === "AM" && hours === 12 ? 0 : hours,
    minutes,
  };
};

// Helper function to determine the current shift based on current time
const getCurrentShift = (currentTime: Date): TimeSlotId => {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  for (const tab of tabs) {
    const start = parseTime(tab.startTime);
    const end = parseTime(tab.endTime);
    let startMinutes = start.hours * 60 + start.minutes;
    let endMinutes = end.hours * 60 + end.minutes;

    // Handle "Night" shift crossing midnight
    if (tab.id === "night") {
      if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
        return "night";
      }
    } else {
      // For other shifts, check if current time is within start and end
      if (startMinutes <= currentMinutes && currentMinutes <= endMinutes) {
        return tab.id;
      }
    }
  }

  // Default to "early" if no shift matches
  return "early";
};

export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState<TimeSlotId>(getCurrentShift(new Date()));
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  });
  const [direction, setDirection] = useState<string>("all");
  const [transportData, setTransportData] = useState<TransportData>(fallbackTransportData);
  const [locations, setLocations] = useState<Location[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedStop, setSelectedStop] = useState<{
    location_name: string;
    data: { driver_name: string; number: number; datetime: string; direction: string }[];
  } | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(30); // Counter starts at 30 seconds
  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Clear Filters Function
  const clearFilters = () => {
    setSelectedLocation("all");
    setSelectedDriver("all");
    setDateRange({ from: new Date(), to: new Date() });
    setDirection("all");
    setPage(1);
    setRefreshCounter(30);
  };

  // Refresh API Function
  const refreshData = () => {
    fetchData();
    setRefreshCounter(30);
  };

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_URL}/activity/locations/names/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }
        const data = await response.json();
        if (data.success) {
          setLocations(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch locations");
        }
      } catch (err) {
        console.error(err);
        setLocations(fallbackLocations);
        setError("Failed to fetch locations. Using fallback data.");
      }
    };
    fetchLocations();
  }, [token]);

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch drivers");
        }
        const data = await response.json();
        if (data.success) {
          setDrivers(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch drivers");
        }
      } catch (err) {
        console.error(err);
        setDrivers(fallbackDrivers);
        setError("Failed to fetch drivers. Using fallback data.");
      }
    };
    fetchDrivers();
  }, [token]);

  // Fetch transport data based on filters and active tab
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const defaultEndDate = today;
      const defaultStartDate = new Date(today.setDate(today.getDate() - 7));

      const queryParams = new URLSearchParams({
        start_date: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : format(defaultStartDate, "yyyy-MM-dd"),
        end_date: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(defaultEndDate, "yyyy-MM-dd"),
        driver: selectedDriver !== "all" ? selectedDriver : "",
        location: selectedLocation !== "all" ? selectedLocation : "",
        direction: direction !== "all" ? direction : "",
        page: page.toString(),
        page_size: "20",
        run_type: idToRunName[activeTab], // Tab-specific run type
      });

      const response = await fetch(
        `${API_URL}/activity/su-run/data-screen/?${queryParams}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const apiData: ApiResponse = await response.json();

      const newTransportData: TransportData = { ...fallbackTransportData };
      apiData.data.runs.forEach((run) => {
        const slotId = runNameToId[run.runName] || "early";
        newTransportData[slotId] = {
          timeRange: `${run.startTime} - ${run.endTime}`,
          data: run.data,
          internalOps: {
            drivers: run.internalJobsList.map((job) => ({
              name: job.name,
              transfers: parseInt(job.Total),
              jobs: parseInt(job.Total),
              total: parseInt(job.Total),
            })),
          },
        };
      });
      setTransportData(newTransportData);
      setTotalPages(apiData.data.total_pages);
      setError(null);
    } catch (err) {
      setError("Error fetching data. Using fallback data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on filter changes, tab changes, or initial load
  useEffect(() => {
    fetchData();
  }, [dateRange.from, dateRange.to, selectedDriver, selectedLocation, direction, page, activeTab, token]);

  // Auto-refresh every 30 seconds with counter
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((prev) => {
        if (prev <= 1) {
          fetchData(); // Trigger API refresh
          return 30; // Reset counter to 30 seconds
        }
        return prev - 1; // Decrement counter
      });
    }, 1000); // Run every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const currentData = transportData[activeTab];

  const filteredData = currentData.data.filter((row: LocationRow) => {
    return selectedLocation === "all" || row.location === selectedLocation;
  });

  const filteredDrivers = currentData.internalOps.drivers.filter((driver: DriverRow) =>
    selectedDriver === "all" || driver.name === selectedDriver
  );

  const getTotalOut = () => filteredData.reduce((sum, item) => sum + item.out, 0);
  const getTotalIn = () => filteredData.reduce((sum, item) => sum + item.in, 0);
  const getTotalSpillOver = () => filteredData.reduce((sum, item) => sum + item.spillover, 0);

  const handleShowDetails = async (locationName: string) => {
    try {
      const queryParams = new URLSearchParams({
        location_name: locationName,
        run_type: idToRunName[activeTab],
        start_date: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        end_date: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      });

      const response = await fetch(
        `${API_URL}/activity/su-run/details/?${queryParams}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stop details");
      }

      const data: StopDetailsResponse = await response.json();
      if (data.success) {
        setSelectedStop({
          location_name: locationName,
          data: data.data.data,
        });
      } else {
        throw new Error(data.message || "Failed to fetch stop details");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stop details.");
      setSelectedStop(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center mb-6 justify-between">
        <div className="items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SU Data Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Last updated 12:58 PM</span>
            <span className="text-sm text-gray-500">
              Next refresh in {refreshCounter} seconds
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center mb-6 justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Badge
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1); // Reset pagination for new tab
                setRefreshCounter(30);
              }}
              className={`px-4 py-1 rounded-2xl text-sm font-medium border transition-colors cursor-pointer ${
                activeTab === tab.id ? tab.color : "text-gray-500 hover:text-gray-700 bg-white border-gray-200"
              }`}
            >
              {tab.label}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={filteredData} fileName="SU data Management" />
          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-sm"
          >
            Clear Filters
          </Button>
          <Button
            variant="outline"
            onClick={refreshData}
            className="text-sm"
          >
            Refresh 
          </Button>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-4">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
        </div>
        {/* Filter Row */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
          <Select onValueChange={setDirection} value={direction}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Select Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="in">In</SelectItem>
              <SelectItem value="out">Out</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedLocation} value={selectedLocation}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent className="h-[150px]">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedDriver} value={selectedDriver}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Select Driver" />
            </SelectTrigger>
            <SelectContent className="h-[150px]">
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id.toString()}>
                  {driver.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  {dateRange.from ? format(dateRange.from, "LLL dd, yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => {
                    setDateRange((prev) => ({ ...prev, from: date }));
                    setRefreshCounter(30); // Reset counter on date change
                  }}
                  initialFocus
                  className="rounded-md"
                  defaultMonth={dateRange.from || new Date()}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  {dateRange.to ? format(dateRange.to, "LLL dd, yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => {
                    setDateRange((prev) => ({ ...prev, to: date }));
                    setRefreshCounter(30); // Reset counter on date change
                  }}
                  initialFocus
                  className="rounded-md"
                  defaultMonth={dateRange.to || new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && <p className="text-gray-500">Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => {
              setPage((prev) => Math.max(prev - 1, 1));
              setRefreshCounter(30); // Reset counter on page change
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => {
              setPage((prev) => Math.min(prev + 1, totalPages));
              setRefreshCounter(30); // Reset counter on page change
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead className="text-left font-semibold text-gray-700 py-3">Locations</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">OUT</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">IN</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Spill Over</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <TableRow
                        className="hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => handleShowDetails(row.location)}
                      >
                        <TableCell className="font-medium text-gray-900 py-3">{row.location}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-[#FFC1CC] text-[#FF2E63]">
                            {row.out}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-[#C1E1C5] text-[#2E7D32]">
                            {row.in}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`${
                              row.spillover > 0 ? "bg-[#C1E1C5] text-[#2E7D32]" : "bg-[#FFC1CC] text-[#FF2E63]"
                            }`}
                          >
                            {row.spillover > 0 ? `+${row.spillover}` : row.spillover}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </DialogTrigger>
                    {selectedStop && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{selectedStop.location_name} Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50 border-b">
                                <TableHead className="text-left font-semibold text-gray-700 py-3">Driver Name</TableHead>
                                <TableHead className="text-center font-semibold text-gray-700">Number</TableHead>
                                <TableHead className="text-center font-semibold text-gray-700">DateTime</TableHead>
                                <TableHead className="text-center font-semibold text-gray-700">Direction</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedStop.data.length > 0 ? (
                                selectedStop.data.map((item, index) => (
                                  <TableRow
                                    key={index}
                                    className={`hover:bg-gray-50 border-b ${
                                      item.direction === "in" ? "bg-green-50" : "bg-red-50"
                                    }`}
                                  >
                                    <TableCell className="font-medium text-gray-900 py-3">
                                      {item.driver_name}
                                    </TableCell>
                                    <TableCell className="text-center">{item.number}</TableCell>
                                    <TableCell className="text-center">
                                      {new Date(item.datetime).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge
                                        variant="secondary"
                                        className={`${
                                          item.direction === "in"
                                            ? "bg-green-100 text-green-600"
                                            : "bg-red-100 text-red-600"
                                        }`}
                                      >
                                        {item.direction}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                                    No details available for this location.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                    No location data available for the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredData.length > 0 && (
                <TableRow className="bg-gray-50 font-semibold border-t-2">
                  <TableCell className="font-bold text-gray-900 py-3">Total</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#FF9DB3] text-[#FF2E63] font-bold">
                      {getTotalOut()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[#AEDBB2] text-[#2E7D32] font-bold">
                      {getTotalIn()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={`${
                        getTotalSpillOver() > 0 ? "bg-[#AEDBB2] text-[#2E7D32]" : "bg-[#FF9DB3] text-[#FF2E63]"
                      } font-bold`}
                    >
                      {getTotalSpillOver() > 0 ? `+${getTotalSpillOver()}` : getTotalSpillOver()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center"></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Internal Operations */}
      {!isLoading && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Internal Operations</h3>
            <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="text-left font-semibold text-gray-700 py-3">Drivers</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Transfers</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Jobs</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map((driver, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-medium text-gray-900 py-3">{driver.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-[#FFD54F] text-[#F57C00]">
                          {driver.transfers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-gray-900 font-medium">{driver.jobs}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-[#FFC1CC] text-[#FF2E63]">
                          {driver.total}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                      No driver data available for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}