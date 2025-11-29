'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, differenceInDays, isPast, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import ExportButton from '@/app/utils/ExportButton';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import Link from 'next/link';

interface Driver {
  id: number;
  user: {
    email: string;
    full_name: string;
    display_name: string;
    license_number: string;
    role: string;
  };
  profile_status: string;
  driver_compliance: {
    driver_licence_expiry: string;
    last_driver_check_code_date: string;
    next_driver_check_code_due: string;
    cpc_card_expiry: string;
    tacho_expiry: string;
    last_driver_tacho_download: string;
    next_driver_tacho_download: string;
    dbs_expiry_date: string;
    right_to_work_check_date: string;
    night_worker_assessment_expiry: string;
    vehicle_familiarisation_walkaround_refresher_expiry: string;
    employment_start_date: string;
    six_months_probation_review: string;
    first_anniversary: string;
    second_anniversary: string;
    third_anniversary: string;
  };
}

interface Pagination {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  page_size: number;
}

interface ApiResponse {
  data: {
    success: boolean;
    results: Driver[];
    pagination: Pagination;
    stats: {
      approved_count: number;
      review_count: number;
      not_approved_count: number;
      completed_count: number;
      incomplete_count: number;
      total: number;
    };
  };
}

const DriverManagementPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<Pagination>({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 20,
  });

  // Filters state
  const [filters, setFilters] = useState({
    full_name: '',
    profile_status: '',
    email: '',
    driver_licence_expiry: '',
    last_driver_check_code_date: '',
    next_driver_check_code_due: '',
    tacho_expiry: '',
    dbs_expiry_date: '',
    night_worker_assessment_expiry: '',
    last_driver_tacho_download: '',
    next_driver_tacho_download: '',
  });

  const token = useCookies().get("access_token");

  // Fetch drivers with pagination + filters
  const fetchDrivers = async (page: number = 1, size: number = pageSize) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: size.toString(),
      });

      // Add filters to query
      if (filters.full_name) params.append('search', filters.full_name);
      if (filters.email) params.append('search', filters.email);
      if (filters.profile_status && filters.profile_status !== 'all') {
        params.append('profile_status', filters.profile_status);
      }

      const response = await fetch(`${API_URL}/api/profiles/driver/compliance/?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data: ApiResponse = await response.json();

      setDrivers(data.data.results);
      setPagination(data.data.pagination);
      setCurrentPage(data.data.pagination.current_page);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount or when page/size/filters change
  useEffect(() => {
    fetchDrivers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Trigger refetch after filter reset to page 1
  useEffect(() => {
    if (currentPage === 1) {
      fetchDrivers(1, pageSize);
    }
  }, [currentPage, filters]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.total_pages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      full_name: '',
      profile_status: '',
      email: '',
      driver_licence_expiry: '',
      last_driver_check_code_date: '',
      next_driver_check_code_due: '',
      tacho_expiry: '',
      dbs_expiry_date: '',
      night_worker_assessment_expiry: '',
      last_driver_tacho_download: '',
      next_driver_tacho_download: '',
    });
    setShowMoreFilters(false);
  };

  const isDateExpired = (dateString: string) => {
    if (!dateString) return false;
    try {
      return isPast(parseISO(dateString));
    } catch {
      return false;
    }
  };

  const renderDateCell = (id: number, field: string, value: string, driver: Driver) => {
    const isExpired = isDateExpired(value);

    return (
      <TableCell
        className={`whitespace-nowrap ${isExpired ? 'text-red-600 bg-red-100' : ''}`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer hover:underline">
              {value ? format(new Date(value), 'dd MMM yyyy') : '-'}
              {isExpired && <span className="ml-2 text-xs font-bold">(Expired)</span>}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <div className="space-y-1">
              {[
                { key: 'driver_licence_expiry', label: 'License Expiry' },
                { key: 'dbs_expiry_date', label: 'DBS Expiry' },
                { key: 'tacho_expiry', label: 'Tacho Expiry' },
                { key: 'night_worker_assessment_expiry', label: 'DOC Expiry' },
              ].map(({ key, label }) => {
                const date = driver.driver_compliance[key as keyof typeof driver.driver_compliance];
                if (!date) return null;
                const days = differenceInDays(parseISO(date), new Date());
                const expired = days < 0;
                return (
                  <div key={key} className={expired ? 'text-red-600' : ''}>
                    <strong>{label}:</strong> {expired ? `Expired ${Math.abs(days)} days ago` : `${days} days left`}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  };

  const renderDatePicker = (label: string, field: string, value: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            {value ? format(new Date(value), "dd MMM yyyy") : "Pick a date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => handleFilterChange(field, date ? date.toISOString().split('T')[0] : "")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Pagination UI
  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;

    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(pagination.total_pages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          disabled={loading}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, pagination.count)} of {pagination.count} drivers
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.previous || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-1">
            {start > 1 && (
              <>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={loading}>1</Button>
                {start > 2 && <span className="px-2">...</span>}
              </>
            )}
            {pages}
            {end < pagination.total_pages && (
              <>
                {end < pagination.total_pages - 1 && <span className="px-2">...</span>}
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.total_pages)} disabled={loading}>
                  {pagination.total_pages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.next || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map(size => (
              <SelectItem key={size} value={size.toString()}>{size} per page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Driver Compliance</h1>
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            style={{ background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)' }}
            className="text-white hover:opacity-90"
          >
            Filters
          </Button>
          <ExportButton data={drivers} fileName="driver_compliance" />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 mb-6 bg-gray-50 rounded-lg shadow-sm ">
          <div className="grid gap-6">
            <section>
              <h3 className="font-semibold mb-4">Search & Status</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Driver Name / Email</Label>
                  <Input
                    placeholder="Search name or email..."
                    value={filters.full_name || filters.email}
                    onChange={(e) => {
                      handleFilterChange('full_name', e.target.value);
                      handleFilterChange('email', e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label>Profile Status</Label>
                  <Select value={filters.profile_status} onValueChange={(v) => handleFilterChange('profile_status', v)}>
                    <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="not_approved">Not Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {showMoreFilters && (
              <>
                <Separator />
                <section>
                  <h3 className="font-semibold mb-4">Compliance Dates</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {renderDatePicker("License Expiry", "driver_licence_expiry", filters.driver_licence_expiry)}
                    {renderDatePicker("DBS Expiry", "dbs_expiry_date", filters.dbs_expiry_date)}
                    {renderDatePicker("Tacho Expiry", "tacho_expiry", filters.tacho_expiry)}
                  </div>
                </section>
              </>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowMoreFilters(!showMoreFilters)}>
                {showMoreFilters ? "Hide" : "Show"} Advanced Filters
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear All</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver Name</TableHead>
                <TableHead>License No.</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead>Last Check Code</TableHead>
                <TableHead>Next Check Due</TableHead>
                <TableHead>Tacho Expiry</TableHead>
                <TableHead>DBS Expiry</TableHead>
                <TableHead>DOC Expiry</TableHead>
                <TableHead>Last Tacho DL</TableHead>
                <TableHead>Next Tacho DL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-gray-500">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/compliance-management/driver-management/${driver.id}`} className="text-blue-600 hover:underline">
                        {driver.user.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{driver.user.license_number || "-"}</TableCell>
                    {renderDateCell(driver.id, 'driver_licence_expiry', driver.driver_compliance.driver_licence_expiry, driver)}
                    {renderDateCell(driver.id, 'last_driver_check_code_date', driver.driver_compliance.last_driver_check_code_date, driver)}
                    {renderDateCell(driver.id, 'next_driver_check_code_due', driver.driver_compliance.next_driver_check_code_due, driver)}
                    {renderDateCell(driver.id, 'tacho_expiry', driver.driver_compliance.tacho_expiry, driver)}
                    {renderDateCell(driver.id, 'dbs_expiry_date', driver.driver_compliance.dbs_expiry_date, driver)}
                    {renderDateCell(driver.id, 'night_worker_assessment_expiry', driver.driver_compliance.night_worker_assessment_expiry, driver)}
                    {renderDateCell(driver.id, 'last_driver_tacho_download', driver.driver_compliance.last_driver_tacho_download, driver)}
                    {renderDateCell(driver.id, 'next_driver_tacho_download', driver.driver_compliance.next_driver_tacho_download, driver)}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default DriverManagementPage;