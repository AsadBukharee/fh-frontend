
'use client'
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Filter } from 'lucide-react';
import ExportButton from '@/app/utils/ExportButton';

interface ClockLog {
  driverName: string;
  driverId: string;
  siteName: string;
  siteId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: string;
}

interface ApiResponse {
  message: string;
  data: ClockLog[];
}

const Page = () => {
  const [logs, setLogs] = useState<ClockLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ClockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursFilter, setHoursFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Define badge colors for sites
  const siteBadgeColors: { [key: string]: string } = {
    'Downtown Warehouse': 'bg-blue-100 text-blue-800',
    'Eastside Depot': 'bg-purple-100 text-purple-800',
    'North Hub': 'bg-green-100 text-green-800',
    'West Terminal': 'bg-yellow-100 text-yellow-800',
    'Central Station': 'bg-indigo-100 text-indigo-800',
    'South Yard': 'bg-pink-100 text-pink-800',
  };

  // Define badge colors for total hours
  const getHoursBadgeColor = (hours: string) => {
    const hoursNum = parseFloat(hours);
    if (hoursNum === 8) return 'bg-green-100 text-green-800';
    if (hoursNum < 8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/clock-logs');
        if (!response.ok) {
          throw new Error('Failed to fetch clock logs');
        }
        const data: ApiResponse = await response.json();
        setLogs(data.data);
        setFilteredLogs(data.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Filter by driver name
    if (driverFilter) {
      filtered = filtered.filter((log) =>
        log.driverName.toLowerCase().includes(driverFilter.toLowerCase())
      );
    }

    // Filter by site
    if (siteFilter !== 'all') {
      filtered = filtered.filter((log) => log.siteName === siteFilter);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((log) => log.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((log) => log.date <= endDate);
    }

    // Filter by total hours
    if (hoursFilter !== 'all') {
      filtered = filtered.filter((log) => {
        const hours = parseFloat(log.totalHours);
        if (hoursFilter === 'less8') return hours < 8;
        if (hoursFilter === '8') return hours === 8;
        if (hoursFilter === 'more8') return hours > 8;
        return true;
      });
    }

    setFilteredLogs(filtered);
  }, [driverFilter, siteFilter, startDate, endDate, hoursFilter, logs]);

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
              {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={filteredLogs} fileName="clock_logs.csv" />
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex text-white items-center gap-2"
                  style={{
                    background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
                    width: 'auto',
                    height: 'auto',
                  }}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filter Clock Logs</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={hoursFilter} onValueChange={setHoursFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Hours</SelectItem>
                      <SelectItem value="less8">Less than 8 hours</SelectItem>
                      <SelectItem value="8">Exactly 8 hours</SelectItem>
                      <SelectItem value="more8">More than 8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={siteFilter} onValueChange={setSiteFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {[...new Set(logs.map((log) => log.siteName))].map((site) => (
                        <SelectItem key={site} value={site}>
                          {site}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="w-full max-w-md">
          <Input
            placeholder="Search by driver name..."
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="w-[300px] md:w-[400px] lg:w-[500px]"
          />
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <TableRow key={index}>
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
    </div>
  );
};

export default Page;
