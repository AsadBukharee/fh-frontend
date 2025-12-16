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
    id: number;
    email: string;
    full_name: string;
    display_name: string;
    license_number: string | null;
    role: string;
  };
  profile_status: string;
  driver_compliance: {
    driver_licence_expiry: string | null;
    last_driver_check_code_date: string | null;
    next_driver_check_code_due: string | null;
    cpc_card_expiry: string | null;
    d_d1_expiry: string | null;
    tacho_expiry: string | null;
    last_driver_tacho_download: string | null;
    next_driver_tacho_download: string | null;
    dbs_expiry_date: string | null;
    right_to_work_check_date: string | null;
    night_worker_assessment_expiry: string | null;
    vehicle_familiarisation_walkaround_refresher_expiry: string | null;
    employment_start_date: string | null;
    six_months_probation_review: string | null;
    first_anniversary: string | null;
    second_anniversary: string | null;
    third_anniversary: string | null;
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
  success: boolean;
  message: string;
  data: {
    results: Driver[];
    pagination: Pagination;
  };
}

const EXPIRY_FIELDS = [
  'driver_licence_expiry',
  'cpc_card_expiry',
  'd_d1_expiry',
  'tacho_expiry',
  'dbs_expiry_date',
  'night_worker_assessment_expiry',
  'next_driver_check_code_due',
  'next_driver_tacho_download',
];

const DriverManagementPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);

  // Pagination
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

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    profile_status: 'all',
    driver_licence_expiry: '',
    cpc_card_expiry: '',
    dbs_expiry_date: '',
    tacho_expiry: '',
  });

  const token = useCookies().get("access_token");

  const fetchDrivers = async (page: number = 1, size: number = pageSize) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: size.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.profile_status && filters.profile_status !== 'all') {
        params.append('profile_status', filters.profile_status);
      }
      if (filters.driver_licence_expiry) params.append('driver_licence_expiry', filters.driver_licence_expiry);
      if (filters.cpc_card_expiry) params.append('cpc_card_expiry', filters.cpc_card_expiry);
      if (filters.dbs_expiry_date) params.append('dbs_expiry_date', filters.dbs_expiry_date);
      if (filters.tacho_expiry) params.append('tacho_expiry', filters.tacho_expiry);

      const response = await fetch(`${API_URL}/api/profiles/driver/compliance/?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch drivers');

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

  useEffect(() => {
    fetchDrivers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage === 1) {
      fetchDrivers(1, pageSize);
    }
  }, [currentPage]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      profile_status: 'all',
      driver_licence_expiry: '',
      cpc_card_expiry: '',
      dbs_expiry_date: '',
      tacho_expiry: '',
    });
    setShowMoreFilters(false);
  };

  const isDateExpired = (dateString: string | null): boolean => {
    if (!dateString) return false;
    try {
      return isPast(parseISO(dateString));
    } catch {
      return false;
    }
  };

  const renderDateCell = (field: string, value: string | null, driver: Driver) => {
    const isExpired = isDateExpired(value);
    const isExpiryField = EXPIRY_FIELDS.includes(field);

    return (
      <TableCell
        className={`whitespace-nowrap ${isExpired && isExpiryField ? 'text-red-600 bg-red-50 font-medium' : ''}`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer hover:underline">
              {value ? format(parseISO(value), 'dd MMM yyyy') : '-'}
              {isExpired && isExpiryField && <span className="ml-2 text-xs font-bold">(Expired)</span>}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <div className="space-y-2">
              {[
                { key: 'driver_licence_expiry', label: 'Driving Licence Expiry' },
                { key: 'cpc_card_expiry', label: 'CPC/DQC Card Expiry' },
                { key: 'd_d1_expiry', label: 'D/D1 Expiry' },
                { key: 'tacho_expiry', label: 'Tachograph Card Expiry' },
                { key: 'dbs_expiry_date', label: 'DBS Expiry' },
                { key: 'night_worker_assessment_expiry', label: 'Night Worker Assessment' },
                { key: 'next_driver_check_code_due', label: 'Next DVLA Check Due' },
                { key: 'next_driver_tacho_download', label: 'Next Tacho Download Due' },
              ].map(({ key, label }) => {
                const date = driver.driver_compliance[key as keyof typeof driver.driver_compliance] as string | null;
                if (!date) return null;
                const days = differenceInDays(parseISO(date), new Date());
                const expired = days < 0;
                return (
                  <div key={key} className={expired ? 'text-red-600 font-medium' : 'text-green-600'}>
                    <strong>{label}:</strong>{' '}
                    {expired
                      ? `Expired ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} ago`
                      : `${days} day${days !== 1 ? 's' : ''} remaining`}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  };

  const renderDatePicker = (label: string, field: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            {filters[field as keyof typeof filters] ? format(new Date(filters[field as keyof typeof filters] as string), "dd MMM yyyy") : "Pick a date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Calendar
            mode="single"
            selected={filters[field as keyof typeof filters] ? new Date(filters[field as keyof typeof filters] as string) : undefined}
            onSelect={(date) => handleFilterChange(field, date ? format(date, 'yyyy-MM-dd') : '')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

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
          onClick={() => setCurrentPage(i)}
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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!pagination.previous || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-1">
            {start > 1 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={loading}>1</Button>
                {start > 2 && <span className="px-2">...</span>}
              </>
            )}
            {pages}
            {end < pagination.total_pages && (
              <>
                {end < pagination.total_pages - 1 && <span className="px-2">...</span>}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(pagination.total_pages)} disabled={loading}>
                  {pagination.total_pages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
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
            className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
          >
            Filters
          </Button>
          <ExportButton data={drivers} fileName="driver_compliance_report" />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 mb-6 bg-gray-50 rounded-lg shadow-sm">
          <div className="grid gap-6">
            <section>
              <h3 className="font-semibold mb-4">Search & Status</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Search Driver (Name / Email)</Label>
                  <Input
                    placeholder="Enter name or email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Profile Status</Label>
                  <Select value={filters.profile_status} onValueChange={(v) => handleFilterChange('profile_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Drivers</SelectItem>
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
                  <h3 className="font-semibold mb-4">Filter by Expiry Date</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {renderDatePicker("Driving Licence Expiry", "driver_licence_expiry")}
                    {renderDatePicker("CPC Card Expiry", "cpc_card_expiry")}
                    {renderDatePicker("DBS Expiry", "dbs_expiry_date")}
                    {renderDatePicker("Tacho Card Expiry", "tacho_expiry")}
                  </div>
                </section>
              </>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowMoreFilters(!showMoreFilters)}>
                {showMoreFilters ? "Hide" : "Show"} Advanced Filters
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear All Filters</Button>
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
                <TableHead>D/D1 Expiry</TableHead>
                <TableHead>CPC Card Expiry</TableHead>
                <TableHead>Tacho Expiry</TableHead>
                <TableHead>Last Check Code</TableHead>
                <TableHead>Next Check Due</TableHead>
                <TableHead>Last Tacho DL</TableHead>
                <TableHead>Next Tacho DL</TableHead>
                <TableHead>DBS Expiry</TableHead>
                <TableHead>Night Worker Assessment </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-gray-500">
                    No drivers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/compliance-management/driver-management/${driver.id}?name=${encodeURIComponent(driver.user.full_name)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {driver.user.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{driver.user.license_number || "-"}</TableCell>
                    {renderDateCell('driver_licence_expiry', driver.driver_compliance.driver_licence_expiry, driver)}
                    {renderDateCell('d_d1_expiry', driver.driver_compliance.d_d1_expiry, driver)}
                    {renderDateCell('cpc_card_expiry', driver.driver_compliance.cpc_card_expiry, driver)}
                    {renderDateCell('tacho_expiry', driver.driver_compliance.tacho_expiry, driver)}
                    {renderDateCell('last_driver_check_code_date', driver.driver_compliance.last_driver_check_code_date, driver)}
                    {renderDateCell('next_driver_check_code_due', driver.driver_compliance.next_driver_check_code_due, driver)}
                    {renderDateCell('last_driver_tacho_download', driver.driver_compliance.last_driver_tacho_download, driver)}
                    {renderDateCell('next_driver_tacho_download', driver.driver_compliance.next_driver_tacho_download, driver)}
                    {renderDateCell('dbs_expiry_date', driver.driver_compliance.dbs_expiry_date, driver)}
                    {renderDateCell('night_worker_assessment_expiry', driver.driver_compliance.night_worker_assessment_expiry, driver)}
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