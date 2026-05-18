'use client';
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Info, Clock, Clock3 } from 'lucide-react';
import ExportButton from '@/app/utils/ExportButton';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to format decimal hours into "Xh Ym" (e.g., 8.5 → "8h 30m", 0.89 → "53m")
const formatHours = (hours: number): string => {
  if (hours <= 0) return '0m';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h === 0) parts.push(`${m}m`);
  return parts.join(' ');
};

// Parse reason to get category and details
const parseReason = (reason: string | null) => {
  if (!reason) return { category: null, details: null };

  const parts = reason.split(': ');
  if (parts.length >= 2) {
    return {
      category: parts[0],
      details: parts.slice(1).join(': ')
    };
  }
  return {
    category: reason,
    details: null
  };
};

interface ClockLog {
  id: number;
  driverName: string;
  driverId: number;
  siteName: string;
  siteId: number | null;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInReason: string | null;
  clockOutReason: string | null;
  totalHours: number;
  formatedHours: string;
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
      } | null;
      date: string;
      clock_in: string | null;
      clock_out: string | null;
      clock_in_reason: string | null;
      clock_out_reason: string | null;
      hours_worked: number;
      formated_hours: string;
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
      formated_hours: string;
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

const ClockInOutHistory = () => {
  const [logs, setLogs] = useState<ClockLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ClockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('');
  const [hoursFilter, setHoursFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalFormatedHours, setTotalFormatedHours] = useState('0m');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const cookies = useCookies();
  const token = cookies.get('access_token') || '';
  const role = cookies.get('role') || '';
  const pageSize = 20;

  const today = new Date().toISOString().split('T')[0];

  const siteBadgeColors: { [key: string]: string } = {
    'Bolton Central': 'bg-blue-100 text-blue-800',
    '35 Market Street': 'bg-purple-100 text-purple-800',
    'Any': 'bg-green-100 text-green-800',
  };

  const getHoursBadgeColor = (hours: number) => {
    if (hours === 8) return 'bg-green-100 text-green-800';
    if (hours < 8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data: ApiResponseUsers = await response.json();
      const activeDrivers = data.data.results.filter(
        (user) => user.is_active && (user.role === 'Driver' || user.role === 'mechanic')
      );
      setUsers(activeDrivers);

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

  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: driverFilter === 'all' ? '' : driverFilter,
        start_date: startDate,
        end_date: endDate || today,
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      const response = await fetch(`${API_URL}/clocking/?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch clock logs');
      const data: ApiResponseClock = await response.json();

      const mappedLogs: ClockLog[] = data.data.results.map((log) => ({
        id: log.id,
        driverName: log.user?.full_name || 'Unknown',
        driverId: log.user?.id || 0,
        siteName: log.site?.name || 'N/A',
        siteId: log.site?.id || null,
        date: log.date,
        clockIn: log.clock_in,
        clockOut: log.clock_out,
        clockInReason: log.clock_in_reason || null,
        clockOutReason: log.clock_out_reason || null,
        totalHours: log.hours_worked,
        formatedHours: log.formated_hours,
        hourlyRate: log.hourly_rate,
        earnings: log.earnings,
      }));

      setLogs(mappedLogs);
      setFilteredLogs(mappedLogs);
      setTotalPages(data.data.pagination.total_pages);
      setTotalRecords(data.data.summary.total_records);
      setTotalHours(data.data.summary.total_hours);
      setTotalFormatedHours(data.data.summary.formated_hours);
      setTotalEarnings(data.data.summary.total_earnings);

      const clockingSites = new Set<string>([
        ...sites,
        ...data.data.results.map((log) => log.site?.name || 'N/A'),
      ]);
      setSites(Array.from(clockingSites).sort());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      if (endDate && new Date(value) > new Date(endDate)) {
        setEndDate('');
      }
    } else {
      setEndDate(value);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, startDate, endDate, driverFilter, token]);

  useEffect(() => {
    let filtered = logs;

    if (siteFilter !== 'all') {
      filtered = filtered.filter((log) => log.siteName === siteFilter);
    }

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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <TooltipProvider>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clock In/Out Logs</h1>
            <p className="text-sm text-gray-500">
              Comprehensive overview of driver clock-in and clock-out times
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {totalRecords} record{totalRecords !== 1 ? 's' : ''} found |
              Total Hours: {totalFormatedHours || formatHours(totalHours)}
              {role === 'superadmin' && (
                <> | Total Earnings: £{totalEarnings.toFixed(2)}</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={role === 'superadmin' ? filteredLogs : filteredLogs.map(({ hourlyRate, earnings, ...rest }) => rest)}
              fileName="clock_logs.csv"
            />
            <Button
              onClick={() => fetchLogs(currentPage)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4  ${loading ? "animate-spin" : ""
                  }`}
              />

            </Button>
          </div>
        </div>

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
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              max={today}
              className="w-full bg-white p-1.5 border border-gray-300 rounded-sm"
            />
          </div>

          <div className="min-w-[140px]">
            <label className="text-sm font-medium block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              min={startDate}
              max={today}
              className="w-full bg-white p-1.5 border border-gray-300 rounded-sm"
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
              setStartDate('');
              setEndDate('');
              setCurrentPage(1);
            }}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Driver Name</TableHead>
            <TableHead>Site Name</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Total Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{log.driverName}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${siteBadgeColors[log.siteName] || 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {log.siteName}
                  </span>
                </TableCell>
                <TableCell>
                  {log.clockIn ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {log.clockIn.slice(0, 5)}
                        </span>
                      </div>
                      {(() => {
                        const reason = parseReason(log.clockInReason);
                        if (!reason.category) return null;
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-blue-600 cursor-help flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md w-fit hover:bg-blue-100 transition-colors">
                                <Info className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">
                                  In: {reason.category}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="w-72 p-3 bg-gray-900 text-white border-gray-800">
                              <div className="space-y-2">
                                <div className="font-semibold text-blue-300 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Clock In Reason
                                </div>
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-gray-400 text-xs">Category:</span>
                                    <span className="ml-1 text-xs font-medium text-white">
                                      {reason.category}
                                    </span>
                                  </div>
                                  {reason.details && (
                                    <div>
                                      <span className="text-gray-400 text-xs">Details:</span>
                                      <p className="mt-0.5 text-xs text-gray-100 bg-gray-800 p-2 rounded">
                                        {reason.details}
                                      </p>
                                    </div>
                                  )}
                                  <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                                    <span className="text-gray-400 text-xs">Clocked in at:</span>
                                    <span className="ml-1 text-xs font-medium">
                                      {log.clockIn.slice(0, 5)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.clockOut ? (
                    <div className="space-y-1">
                      <span className="font-medium">
                        {log.clockOut.slice(0, 5)}
                      </span>
                      {(() => {
                        const reason = parseReason(log.clockOutReason);
                        if (!reason.category) return null;
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-orange-600 cursor-help flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md w-fit hover:bg-orange-100 transition-colors">
                                <Info className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">
                                  Out: {reason.category}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="w-72 p-3 bg-gray-900 text-white border-gray-800">
                              <div className="space-y-2">
                                <div className="font-semibold text-orange-300 flex items-center gap-1">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  Clock Out Reason
                                </div>
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-gray-400 text-xs">Category:</span>
                                    <span className="ml-1 text-xs font-medium text-white">
                                      {reason.category}
                                    </span>
                                  </div>
                                  {reason.details && (
                                    <div>
                                      <span className="text-gray-400 text-xs">Details:</span>
                                      <p className="mt-0.5 text-xs text-gray-100 bg-gray-800 p-2 rounded">
                                        {reason.details}
                                      </p>
                                    </div>
                                  )}
                                  <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                                    <span className="text-gray-400 text-xs">Clocked out at:</span>
                                    <span className="ml-1 text-xs font-medium">
                                      {log.clockOut.slice(0, 5)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getHoursBadgeColor(
                      log.totalHours
                    )}`}
                  >
                    {log.formatedHours || formatHours(log.totalHours)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
    </TooltipProvider>
  );
};

export default ClockInOutHistory;