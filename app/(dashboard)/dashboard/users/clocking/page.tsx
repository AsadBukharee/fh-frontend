'use client';
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import ExportButton from '@/app/utils/ExportButton';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

// Define the ClockLog interface to match the API response
interface ClockLog {
  id: number;
  driverName: string;
  driverId: number;
  siteName: string;
  siteId: number;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  hourlyRate: number;
  earnings: number;
}

interface ApiResponseClock {
  success: boolean;
  message: string;
  data: {
    results: {
      id: number;
      user: {
        id: number;
        full_name: string;
        email: string;
        role: string;
        avatar: string | null;
      };
      site: {
        id: number;
        name: string;
        status: string;
        image: string;
      };
      date: string;
      clock_in: string;
      clock_out: string;
      hours_worked: number;
      hourly_rate: number;
      earnings: number;
    }[];
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      current_page: number;
      total_pages: number;
    };
    summary: {
      total_hours: number;
      total_earnings: number;
      total_records: number;
    };
  };
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string | null;
  is_active: boolean;
  site: Array<{
    id: number;
    name: string;
    status: string;
    image: string | null;
  }>;
}

interface ApiResponseUsers {
  success: boolean;
  message: string;
  data: {
    results: User[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

const Page = () => {
  const [logs, setLogs] = useState<ClockLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ClockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-10-30');
  const [hoursFilter, setHoursFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const token = useCookies().get('access_token') || '';
  const pageSize = 20;

  // Define badge colors for sites
  const siteBadgeColors: { [key: string]: string } = {
    'Bolton Central': 'bg-blue-100 text-blue-800',
    '35 Market Street': 'bg-purple-100 text-purple-800',
    'Any': 'bg-green-100 text-green-800',
  };

  // Define badge colors for total hours
  const getHoursBadgeColor = (hours: number) => {
    if (hours === 8) return 'bg-green-100 text-green-800';
    if (hours < 8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: ApiResponseUsers = await response.json();
      const activeDrivers = data.data.results.filter(
        (user) => user.is_active && (user.role === 'Driver' || user.role === 'mechanic')
      );
      setUsers(activeDrivers);

      // Extract unique site names from users
      const uniqueSites = new Set<string>();
      activeDrivers.forEach((user) => {
        user.site.forEach((s) => uniqueSites.add(s.name));
      });
      setSites(Array.from(uniqueSites).sort());
    } catch (err) {
      console.error('Error fetching users:', err);
      setError((err as Error).message);
    }
  };

  // Fetch logs from the API
  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: driverFilter === 'all' ? '' : driverFilter,
        start_date: startDate,
        end_date: endDate,
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      const response = await fetch(`${API_URL}/clocking/?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch clock logs');
      }
      const data: ApiResponseClock = await response.json();

      // Map API response to ClockLog interface
      const mappedLogs: ClockLog[] = data.data.results.map((log) => ({
        id: log.id,
        driverName: log.user.full_name,
        driverId: log.user.id,
        siteName: log.site.name,
        siteId: log.site.id,
        date: log.date,
        clockIn: log.clock_in,
        clockOut: log.clock_out,
        totalHours: log.hours_worked,
        hourlyRate: log.hourly_rate,
        earnings: log.earnings,
      }));

      setLogs(mappedLogs);
      setFilteredLogs(mappedLogs);
      setTotalPages(data.data.pagination.total_pages);
      setTotalRecords(data.data.summary.total_records);
      setTotalHours(data.data.summary.total_hours);
      setTotalEarnings(data.data.summary.total_earnings);

      // Update sites with any new site names from clocking data
      const clockingSites = new Set<string>([
        ...sites,
        ...data.data.results.map((log) => log.site.name),
      ]);
      setSites(Array.from(clockingSites).sort());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (token && users.length > 0) {
      fetchLogs(currentPage);
    }
  }, [currentPage, startDate, endDate, driverFilter, users, token]);

  // Apply client-side filters
  useEffect(() => {
    let filtered = logs;

    // Filter by site
    if (siteFilter !== 'all') {
      filtered = filtered.filter((log) => log.siteName === siteFilter);
    }

    // Filter by total hours
    if (hoursFilter !== 'all') {
      filtered = filtered.filter((log) => {
        const hours = log.totalHours;
        if (hoursFilter === 'less8') return hours < 8;
        if (hoursFilter === '8') return hours === 8;
        if (hoursFilter === 'more8') return hours > 8;
        return true;
      });
    }

    setFilteredLogs(filtered);
  }, [siteFilter, hoursFilter, logs]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clock Logs</h1>
            <p className="text-sm text-gray-500">
              Comprehensive overview of driver clock-in and clock-out times
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {totalRecords} record{totalRecords !== 1 ? 's' : ''} found | Total Hours: {totalHours} | Total Earnings: £{totalEarnings.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={filteredLogs} fileName="clock_logs.csv" />
          </div>
        </div>

        {/* Filters on screen */}
        <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium block mb-1">Search by Driver</label>
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <label className="text-sm font-medium block mb-1">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="min-w-[140px]">
            <label className="text-sm font-medium block mb-1">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="text-sm font-medium block mb-1">Hours Worked</label>
            <Select value={hoursFilter} onValueChange={setHoursFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hours</SelectItem>
                <SelectItem value="less8">Less than 8 hours</SelectItem>
                <SelectItem value="8">Exactly 8 hours</SelectItem>
                <SelectItem value="more8">More than 8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <label className="text-sm font-medium block mb-1">Site</label>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site} value={site}>
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setDriverFilter('all');
              setSiteFilter('all');
              setHoursFilter('all');
              setStartDate('2025-09-01');
              setEndDate('2025-10-30');
              setCurrentPage(1);
            }}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver Name</TableHead>
            <TableHead>Site Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.driverName}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      siteBadgeColors[log.siteName] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {log.siteName}
                  </span>
                </TableCell>
                <TableCell>{log.date}</TableCell>
                <TableCell>{log.clockIn}</TableCell>
                <TableCell>{log.clockOut}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getHoursBadgeColor(
                      log.totalHours
                    )}`}
                  >
                    {log.totalHours}
                  </span>
                </TableCell>
                <TableCell>£{log.hourlyRate.toFixed(2)}</TableCell>
                <TableCell>£{log.earnings.toFixed(2)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          variant="outline"
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Page;