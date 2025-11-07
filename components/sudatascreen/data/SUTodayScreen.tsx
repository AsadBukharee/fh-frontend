"use client";
import { useState, useEffect, useCallback } from "react";
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

// Define types (unchanged)
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
    current_run_type: string;
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

type TimeSlotId = "early" | "shuttle1" | "shuttle2" | "shuttle3" | "night";

interface LocationRow {
  location: string;
  location_id: number;

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

const fallbackTransportData: TransportData = {
  early: { timeRange: "5:00 AM - 9:20 AM", data: [], internalOps: { drivers: [] } },
  shuttle1: { timeRange: "9:21 AM - 2:00 PM", data: [], internalOps: { drivers: [] } },
  shuttle2: { timeRange: "2:01 PM - 4:30 PM", data: [], internalOps: { drivers: [] } },
  shuttle3: { timeRange: "4:31 PM - 6:59 PM", data: [], internalOps: { drivers: [] } },
  night: { timeRange: "7:00 PM - 4:59 AM", data: [], internalOps: { drivers: [] } },
};

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

const runNameToId: Record<string, TimeSlotId> = {
  Early: "early",
  "First Shuttle": "shuttle1",
  "Second Shuttle": "shuttle2",
  "3rd Shuttle Run": "shuttle3",
  "Third Shuttle": "shuttle3", // Added for consistency
  Night: "night",
};

const tabs: { id: TimeSlotId; label: string; color: string; startTime: string; endTime: string }[] = [
  { id: "early", label: "Early", color: "bg-pink-100 text-pink-600 border-pink-200", startTime: "5:00 AM", endTime: "9:20 AM" },
  { id: "shuttle1", label: "1st Shuttle", color: "bg-green-100 text-green-600 border-green-200", startTime: "9:21 AM", endTime: "2:00 PM" },
  { id: "shuttle2", label: "2nd Shuttle", color: "bg-purple-100 text-purple-600 border-purple-200", startTime: "2:01 PM", endTime: "4:30 PM" },
  { id: "shuttle3", label: "3rd Shuttle", color: "bg-orange-100 text-orange-600 border-orange-200", startTime: "4:31 PM", endTime: "6:59 PM" },
  { id: "night", label: "Night", color: "bg-blue-100 text-blue-600 border-blue-200", startTime: "7:00 PM", endTime: "4:59 AM" },
];

export default function SUTodayScreen() {
  const [activeTab, setActiveTab] = useState<TimeSlotId>("early"); // Initialize to "early"
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");

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
  const [refreshCounter, setRefreshCounter] = useState<number>(60);
  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Clear Filters Function
  const clearFilters = () => {
    setSelectedLocation("all");
    setSelectedDriver("all");

    setDirection("all");
    setPage(1);
    setRefreshCounter(60);
  };

  // Refresh API Function
  const refreshData = () => {
    fetchData();
    setRefreshCounter(60);
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

  // Fetch transport data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
       
        driver: selectedDriver !== "all" ? String(Number(selectedDriver)) : "",
        location: selectedLocation !== "all" ? String(Number(selectedLocation)) : "",
        direction: direction !== "all" ? direction : "",
        page: page.toString(),
        page_size: "20",
      });

      console.log("Query Params:", queryParams.toString()); // Debug
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
      console.log("API current_run_type:", apiData.data.current_run_type); // Debug
      console.log("Mapped activeTab:", runNameToId[apiData.data.current_run_type] || "early"); // Debug

      const newTransportData: TransportData = { ...fallbackTransportData };
      apiData.data.runs.forEach((run) => {
        const slotId = runNameToId[run.runName] || "early";
        console.log(`Processing run: ${run.runName}, mapped to slotId: ${slotId}`); // Debug
        newTransportData[slotId] = {
          timeRange: `${run.startTime} - ${run.endTime}`,
          data: run.data,
          internalOps: {
            drivers: run.internalJobsList.map((job) => ({
              name: job.name,
              transfers: job.name === "Internal Transfer" ? parseInt(job.Total) : 0,
              jobs: job.name === "Internal Jobs" ? parseInt(job.Total) : 0,
              total: parseInt(job.Total),
            })),
          },
        };
      });

      setTransportData(newTransportData);
      console.log("Updated transportData:", newTransportData); // Debug
      setTotalPages(apiData.data.total_pages);
      setActiveTab(runNameToId[apiData.data.current_run_type] || "early");
      setError(null);
    } catch (err) {
      setError("Error fetching data. Using fallback data.");
      setActiveTab("early");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [ selectedDriver, selectedLocation, direction, page, token]);

  // Fetch data on filter changes or initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds with counter
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Use activeTab directly, no fallback to early
  const currentData = transportData[activeTab];

  const filteredData = currentData.data.filter((row: LocationRow) => {
    if (selectedLocation === "all") return true;
    const location = locations.find((loc) => loc.id.toString() === selectedLocation);
    return location ? row.location === location.name : false;
  });

  const filteredDrivers = currentData.internalOps.drivers.filter((driver: DriverRow) =>
    selectedDriver === "all" || driver.name === selectedDriver
  );

  const getTotalOut = () => filteredData.reduce((sum, item) => sum + item.out, 0);
  const getTotalIn = () => filteredData.reduce((sum, item) => sum + item.in, 0);
  const getTotalSpillOver = () => filteredData.reduce((sum, item) => sum + item.spillover, 0);
const tabToRunType: Record<TimeSlotId, string> = {
  early: "Early",
  shuttle1: "1st Shuttle Run",
  shuttle2: "2nd Shuttle Run",
  shuttle3: "3rd Shuttle Run",
  night: "Night",
};
 const handleShowDetails = async (locationName: number) => {
  const runType = tabToRunType[activeTab];

  const queryParams = new URLSearchParams({
    location_id: String(locationName),
    run_type: runType,
  });

  try {
    const response = await fetch(`${API_URL}/activity/su-run/details/?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Network error");
    const data: StopDetailsResponse = await response.json();

    if (data.success) {
      setSelectedStop({ location_name: String(locationName), data: data.data.data });
    } else {
      setError(data.message);
    }
  } catch (err: any) {
    setError("Failed to load details: " + err.message);
    setSelectedStop(null);
  }
};

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center mb-6 justify-between">
        <div className="items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">SU Today Reporting</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Last updated {new Date().toLocaleTimeString()}</span>
            <span className="text-sm text-gray-500">
              Next refresh in {refreshCounter} seconds
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
    

      {/* Section Header */}
      {!isLoading && (
        <div className="mb-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-500">{currentData.timeRange} data</p>
          </div>
          {/* Filter Row */}
          <div className="flex items-center gap-4 mb-6  justify-evenlytext-sm text-gray-600">
              {!isLoading && (
        <div className="flex items-center gap-4 justify-between">
          <div className="flex gap-2">
            <Select
              onValueChange={(value: TimeSlotId) => {
                setActiveTab(value);
                setPage(1);
                setRefreshCounter(60);
              }}
              value={activeTab}
            >
              <SelectTrigger className="w-[180px] border-gray-300">
                <SelectValue placeholder="Select Time Slot" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab.id} value={tab.id}>
                    {tab.label} ({tab.startTime} - {tab.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton data={filteredData} fileName="SU Data Management" />
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
      )}
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
       
          </div>
        </div>
      )}

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
              setRefreshCounter(60);
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
              setRefreshCounter(60);
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
                        onClick={() => handleShowDetails(row.location_id)}
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