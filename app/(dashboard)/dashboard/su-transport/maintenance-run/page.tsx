'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import ExportButton from '@/app/utils/ExportButton';

// Define TypeScript interfaces based on API responses
interface Site {
  id: number;
  name: string;
  status: string;
  image: string;
}

interface VehicleType {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_name: string;
  last_mileage: string | null;
  site_allocated: Site | null;
}

interface Person {
  id: number;
  email: string;
  full_name: string;
  avatar: string | null;
}

interface Stop {
  id: number;
  maintenance_run: number;
  location: number;
  order: number;
  location_name: string;
  mileage: number;
  arrival_time: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceRun {
  id: number;
  date: string;
  time: string | null;
  vehicle: Vehicle;
  driver: Person;
  assignee: Person | null;
  notes: string | null;
  run_type: string | null;
  mileage: number | null;
  stops: Stop[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    results: MaintenanceRun[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface DriverApiResponse {
  success: boolean;
  message: string;
  data: Person[];
}

interface VehicleApiResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
  stats: {
    available: number;
    unavailable: number;
    assigned: number;
    disabled: number;
    total: number;
  };
}

interface CurrentRunApiResponse {
  success: boolean;
  message: string;
  data: {
    curent_run_type: string;
    runs: { runName: string; startTime: string; endTime: string }[];
  };
}

// Tab configuration
const tabs = [
  { id: 'early', label: 'Early', apiRunType: 'Early', color: 'bg-red-500/20 text-red-500 border-red-500/70', startTime: '5:00 AM', endTime: '9:20 AM' },
  { id: 'shuttle1', label: 'First Shuttle', apiRunType: 'First Shuttle', color: 'bg-green-500/20 text-green-500 border-green-500/70', startTime: '9:21 AM', endTime: '2:00 PM' },
  { id: 'shuttle2', label: 'Second Shuttle', apiRunType: 'Second Shuttle', color: 'bg-pink-500/20 text-pink-500 border-pink-500/70', startTime: '2:01 PM', endTime: '4:30 PM' },
  { id: 'shuttle3', label: 'Third Shuttle', apiRunType: 'Third Shuttle', color: 'bg-orange-500/20 text-orange-500 border-orange-500/70', startTime: '4:31 PM', endTime: '6:59 PM' },
  { id: 'night', label: 'Night', apiRunType: 'Night', color: 'bg-purple-500/20 text-purple-500 border-purple-500/70', startTime: '7:00 PM', endTime: '4:59 AM' },
];

// Map API run names to TabKey
const runNameToId: Record<string, string> = {
  Early: 'early',
  'First Shuttle': 'shuttle1',
  '1st Shuttle Run': 'shuttle1', // Handle API typo
  'Second Shuttle': 'shuttle2',
  'Third Shuttle': 'shuttle3',
  '3rd Shuttle Run': 'shuttle3',
  Night: 'night',
};

// Helper function to parse time strings (e.g., "5:00 AM") to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  return {
    hours: period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours,
    minutes,
  };
};

// Helper function to determine the current shift based on current time (fallback)
const getCurrentShiftByTime = (currentTime: Date): string => {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  for (const tab of tabs) {
    const start = parseTime(tab.startTime);
    const end = parseTime(tab.endTime);
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    // Handle "Night" shift crossing midnight
    if (tab.id === 'night') {
      if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
        return 'night';
      }
    } else {
      if (startMinutes <= currentMinutes && currentMinutes <= endMinutes) {
        return tab.id;
      }
    }
  }

  // Default to "early" if no shift matches
  return 'early';
};

const MaintenanceRunsPage = () => {
  const [maintenanceRuns, setMaintenanceRuns] = useState<MaintenanceRun[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [vehicleId, setVehicleId] = useState<string>('all');
  const [driverId, setDriverId] = useState<string>('all');
  const [runType, setRunType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('early');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [tempVehicleId, setTempVehicleId] = useState<string>('all');
  const [tempDriverId, setTempDriverId] = useState<string>('all');
  const [tempRunType, setTempRunType] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [refreshCounter, setRefreshCounter] = useState<number>(30); // Auto-refresh counter
  const token = useCookies().get('access_token');

  // Fetch vehicles, drivers, and current run type
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, driversResponse, currentRunResponse] = await Promise.all([
          fetch(`${API_URL}/api/vehicles/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/activity/su-run/overview/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!vehiclesResponse.ok || !driversResponse.ok || !currentRunResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const vehiclesData: VehicleApiResponse = await vehiclesResponse.json();
        const driversData: DriverApiResponse = await driversResponse.json();
        const currentRunData: CurrentRunApiResponse = await currentRunResponse.json();

        setVehicles(vehiclesData.data || []);
        setDrivers(driversData.data || []);

        // Set active tab based on curent_run_type, or fall back to time-based logic
        const runType = currentRunData.data.curent_run_type;
        if (runType && runNameToId[runType]) {
          setActiveTab(runNameToId[runType]);
          setRunType(tabs.find((tab) => tab.id === runNameToId[runType])?.apiRunType || 'all');
          setTempRunType(tabs.find((tab) => tab.id === runNameToId[runType])?.apiRunType || 'all');
        } else {
          const timeBasedShift = getCurrentShiftByTime(new Date());
          setActiveTab(timeBasedShift);
          setRunType(tabs.find((tab) => tab.id === timeBasedShift)?.apiRunType || 'all');
          setTempRunType(tabs.find((tab) => tab.id === timeBasedShift)?.apiRunType || 'all');
        }
      } catch (err) {
        setError((err as Error).message);
        // Fallback to time-based shift selection on error
        setActiveTab(getCurrentShiftByTime(new Date()));
      }
    };
    fetchData();
  }, [token]);

  // Fetch maintenance runs with filters and pagination
  useEffect(() => {
    const fetchMaintenanceRuns = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...(vehicleId !== 'all' && { vehicle: vehicleId }),
          ...(driverId !== 'all' && { driver: driverId }),
          ...(runType !== 'all' && { run_type: runType }),
          page: page.toString(),
          page_size: '20',
        });
        const response = await fetch(`${API_URL}/activity/maintenance-run/?${queryParams}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch maintenance runs');
        }
        const data: ApiResponse = await response.json();
        setMaintenanceRuns(data.data.results || []);
        setTotalPages(data.data.total_pages || 1);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenanceRuns();
  }, [vehicleId, driverId, runType, page, token]);

  // Auto-refresh every 30 seconds with counter
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((prev) => {
        if (prev <= 1) {
          refreshData(); // Trigger data refresh
          return 30; // Reset counter
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refreshData = async () => {
    setLoading(true);
    try {
      const [currentRunResponse, maintenanceResponse] = await Promise.all([
        fetch(`${API_URL}/activity/su-run/overview/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/activity/maintenance-run/?${new URLSearchParams({
          ...(vehicleId !== 'all' && { vehicle: vehicleId }),
          ...(driverId !== 'all' && { driver: driverId }),
          ...(runType !== 'all' && { run_type: runType }),
          page: page.toString(),
          page_size: '20',
        })}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (currentRunResponse.ok) {
        const currentRunData: CurrentRunApiResponse = await currentRunResponse.json();
        const newRunType = currentRunData.data.curent_run_type;
        if (newRunType && runNameToId[newRunType]) {
          const newTabId = runNameToId[newRunType];
          if (activeTab !== newTabId) {
            setActiveTab(newTabId);
            setRunType(tabs.find((tab) => tab.id === newTabId)?.apiRunType || 'all');
            setTempRunType(tabs.find((tab) => tab.id === newTabId)?.apiRunType || 'all');
            setPage(1);
          }
        }
      }

      if (maintenanceResponse.ok) {
        const data: ApiResponse = await maintenanceResponse.json();
        setMaintenanceRuns(data.data.results || []);
        setTotalPages(data.data.total_pages || 1);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion for stops
  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
    setRefreshCounter(30); // Reset counter on interaction
  };

  // Apply filters from modal
  const applyFilters = () => {
    setVehicleId(tempVehicleId);
    setDriverId(tempDriverId);
    setRunType(tempRunType);
    setPage(1);
    const selectedTab = tabs.find((tab) => tab.apiRunType === tempRunType) || tabs[0];
    setActiveTab(tempRunType === 'all' ? 'early' : selectedTab.id);
    setIsFilterModalOpen(false);
    setRefreshCounter(30); // Reset counter on filter apply
  };

  // Clear filters
  const clearFilters = () => {
    setVehicleId('all');
    setDriverId('all');
    setRunType('all');
    setTempVehicleId('all');
    setTempDriverId('all');
    setTempRunType('all');
    setPage(1);
    setActiveTab('early');
    setRefreshCounter(30); // Reset counter on clear filters
  };

  // Handle tab click
  const handleTabClick = (tab: { id: string; apiRunType: string }) => {
    setActiveTab(tab.id);
    setRunType(tab.apiRunType);
    setTempRunType(tab.apiRunType);
    setPage(1);
    setRefreshCounter(30); // Reset counter on tab change
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Runs</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Last updated: {new Date().toLocaleTimeString()}
              <span className="ml-4">Next refresh in {refreshCounter} seconds</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              onClick={refreshData}
              className="text-sm"
            >
              Refresh API
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <Badge
                key={tab.id}
                variant="outline"
                onClick={() => handleTabClick(tab)}
                className={`flex items-center px-4 py-1 rounded-2xl text-sm font-medium border transition-colors cursor-pointer gap-2 ${
                  activeTab === tab.id
                    ? tab.color
                    : 'bg-white text-gray-600/50 border-gray-500/50'
                }`}
              >
                {tab.label}
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-red-600 border-red-200"
          >
            Clear Filters
          </Button>
        </div>

        {/* Active Filters Display */}
        <div className="flex items-center gap-4 mb-4">
          <p className="text-sm text-gray-600">
            Active Filters:
            <span className="ml-2">
              {vehicleId !== 'all'
                ? `Vehicle: ${
                    vehicles.find((v) => v.id.toString() === vehicleId)?.registration_number || 'Unknown'
                  }`
                : 'All Vehicles'}
            </span>
            <span className="ml-2">
              {driverId !== 'all'
                ? `Driver: ${drivers.find((d) => d.id.toString() === driverId)?.full_name || 'Unknown'}`
                : 'All Drivers'}
            </span>
            <span className="ml-2">
              {runType !== 'all' ? `Run Type: ${runType}` : 'All Run Types'}
            </span>
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find((tab) => tab.id === activeTab)?.label} Run
              </h2>
              <p className="text-sm text-gray-500">Maintenance run data</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                Page {page} of {totalPages}
              </Badge>
              <ExportButton data={maintenanceRuns} fileName="Maintenance Run" />
            </div>
          </div>

          {/* Data Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left font-semibold text-gray-900">Date</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900">Vehicle</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900">Driver</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900">Assignee</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900">Notes</TableHead>
                  <TableHead className="text-center font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRuns.length > 0 ? (
                  maintenanceRuns.map((run) => (
                    <React.Fragment key={run.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>
                          <div className="text-blue-800 px-3 py-1 rounded-md text-sm font-medium inline-block">
                            {format(new Date(run.date), 'PPP p')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-800 px-3 py-1 rounded-md text-sm font-medium inline-block">
                            {run.vehicle.registration_number} ({run.vehicle.vehicle_type_name})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-purple-800 px-3 py-1 rounded-md text-sm font-medium inline-block">
                            {run.driver.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-orange-800 px-3 py-1 rounded-md text-sm font-medium inline-block">
                            {run.assignee?.full_name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-red-800 px-3 py-1 rounded-md text-sm font-medium inline-block min-w-[40px]">
                            {run.notes || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(run.id)}
                          >
                            {expandedRows.includes(run.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows.includes(run.id) && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="pl-8">
                              <h4 className="font-semibold mb-2">Stops</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold text-gray-900">Location</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Mileage</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {run.stops.map((stop) => (
                                    <TableRow key={stop.id} className="hover:bg-gray-50">
                                      <TableCell>{stop.location_name}</TableCell>
                                      <TableCell>{stop.mileage}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
                {maintenanceRuns.length > 0 && (
                  <TableRow className="bg-gray-100 font-semibold">
                    <TableCell colSpan={5} className="font-bold text-gray-900">
                      Total
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="bg-red-200 text-red-900 px-3 py-1 rounded-md text-sm font-bold inline-block min-w-[40px]">
                        {maintenanceRuns.reduce((sum, run) => sum + run.stops.length, 0)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => {
                setPage((prev) => prev - 1);
                setRefreshCounter(30); // Reset counter on pagination
              }}
            >
              Previous
            </Button>
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
              Page {page} of {totalPages}
            </Badge>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => {
                setPage((prev) => prev + 1);
                setRefreshCounter(30); // Reset counter on pagination
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Maintenance Runs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900">Vehicle</label>
              <Select value={tempVehicleId} onValueChange={setTempVehicleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.registration_number} ({vehicle.vehicle_type_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Driver</label>
              <Select value={tempDriverId} onValueChange={setTempDriverId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Run Type</label>
              <Select value={tempRunType} onValueChange={setTempRunType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Run Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Run Types</SelectItem>
                  {tabs.map((tab) => (
                    <SelectItem key={tab.id} value={tab.apiRunType}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceRunsPage;