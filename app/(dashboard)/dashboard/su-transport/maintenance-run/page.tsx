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
import { ChevronDown, ChevronUp } from 'lucide-react';
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

// Helper function to parse time strings (e.g., "5:00 AM") to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  return {
    hours: period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours,
    minutes,
  };
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
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [refreshCounter, setRefreshCounter] = useState<number>(30);
  const token = useCookies().get('access_token');

  // Fetch vehicles and drivers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResponse, driversResponse] = await Promise.all([
          fetch(`${API_URL}/api/vehicles/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!vehiclesResponse.ok || !driversResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const vehiclesData: VehicleApiResponse = await vehiclesResponse.json();
        const driversData: DriverApiResponse = await driversResponse.json();

        setVehicles(vehiclesData.data || []);
        setDrivers(driversData.data || []);
      } catch (err) {
        setError((err as Error).message);
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
          refreshData();
          return 30;
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
      const [maintenanceResponse] = await Promise.all([
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
    setRefreshCounter(30);
  };

  // Clear filters
  const clearFilters = () => {
    setVehicleId('all');
    setDriverId('all');
    setRunType('all');
    setPage(1);
    setActiveTab('early');
    setRefreshCounter(30);
  };

  // Handle tab click
  const handleTabClick = (tab: { id: string; apiRunType: string }) => {
    setActiveTab(tab.id);
    setRunType(tab.apiRunType);
    setPage(1);
    setRefreshCounter(30);
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
              onClick={refreshData}
              className="text-sm"
            >
              Refresh API
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Vehicle</label>
                <Select value={vehicleId} onValueChange={(value) => {
                  setVehicleId(value);
                  setPage(1);
                  setRefreshCounter(30);
                }}>
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
                <Select value={driverId} onValueChange={(value) => {
                  setDriverId(value);
                  setPage(1);
                  setRefreshCounter(30);
                }}>
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
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full md:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
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
                setRefreshCounter(30);
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
                setRefreshCounter(30);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceRunsPage;