'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
import { format, differenceInDays, isPast, parseISO, isBefore, isAfter } from 'date-fns';
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
    night_worker_assessment_expiry: string | null;
    vehicle_familiarisation_walkaround_refresher_expiry: string | null;
    employment_start_date: string | null;
    six_months_probation_review: string | null;
    first_anniversary: string | null;
    second_anniversary: string | null;
    third_anniversary: string | null;
    
    // Add booked date fields (if they exist in your API)
    mot_booked_date?: string | null;
    pmi_booked_date?: string | null;
    next_tacho_calibration_date?: string | null;
    next_loller_calibration_date?: string | null;
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

// Field configurations for different color rules
const FIELD_CONFIG = {
  // Fields that follow: Green >90 days, Orange <=90 days, Red expired
  LICENSE_STYLE_FIELDS: [
    'driver_licence_expiry',
    'd_d1_expiry',
    'cpc_card_expiry',
    'tacho_expiry',
    'dbs_expiry_date',
    'night_worker_assessment_expiry'
  ],
  
  // Next Driver Check Due: Green >3 days, Orange <=3 days, Red expired
  NEXT_DRIVER_CHECK_DUE: 'next_driver_check_code_due',
  
  // Next Tacho Download: Green >60 days, Orange <=60 days, Red expired
  NEXT_TACHO_DOWNLOAD: 'next_driver_tacho_download',
  
  // Last Tacho Download: Just date display
  LAST_TACHO_DOWNLOAD: 'last_driver_tacho_download',
  
  // Last Driver Check Code: Just date display
  LAST_DRIVER_CHECK: 'last_driver_check_code_date',
  
  // Fields that should show "TBC" if not booked yet
  TBC_FIELDS: [
    'mot_booked_date',
    'pmi_booked_date',
    'next_tacho_calibration_date',
    'next_loller_calibration_date'
  ]
} as const;

const DriverManagementPage = () => {
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    driver_licence_expiry_filter: '', // Filter by expiry status: 'expired', 'expiring_soon', 'valid'
    cpc_card_expiry_filter: '',
    dbs_expiry_date_filter: '',
    tacho_expiry_filter: '',
  });

  const token = useCookies().get("access_token");

  // Fetch all drivers once
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/compliance/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch drivers');

      const data: ApiResponse = await response.json();
      setAllDrivers(data.data.results);
      setFilteredDrivers(data.data.results);
      setPagination(prev => ({
        ...prev,
        count: data.data.results.length,
        total_pages: Math.ceil(data.data.results.length / pageSize),
      }));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Apply frontend filtering whenever filters change
  useEffect(() => {
    if (allDrivers.length === 0) return;

    let result = [...allDrivers];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(driver =>
        driver.user.full_name.toLowerCase().includes(searchLower) ||
        driver.user.email.toLowerCase().includes(searchLower) ||
        (driver.user.license_number && driver.user.license_number.toLowerCase().includes(searchLower))
      );
    }

    // Apply profile status filter
    if (filters.profile_status && filters.profile_status !== 'all') {
      result = result.filter(driver => driver.profile_status === filters.profile_status);
    }

    // Apply date filters based on expiry status
    const applyExpiryFilter = (dateField: keyof Driver['driver_compliance'], filterValue: string) => {
      if (!filterValue) return;
      
      const today = new Date();
      
      result = result.filter(driver => {
        const dateString = driver.driver_compliance[dateField];
        if (!dateString) return false;
        
        const expiryDate = parseISO(dateString);
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        
        switch (filterValue) {
          case 'expired':
            return isPast(expiryDate);
          case 'expiring_soon':
            return !isPast(expiryDate) && daysUntilExpiry <= 90;
          case 'valid':
            return !isPast(expiryDate) && daysUntilExpiry > 90;
          default:
            return true;
        }
      });
    };

    applyExpiryFilter('driver_licence_expiry', filters.driver_licence_expiry_filter);
    applyExpiryFilter('cpc_card_expiry', filters.cpc_card_expiry_filter);
    applyExpiryFilter('dbs_expiry_date', filters.dbs_expiry_date_filter);
    applyExpiryFilter('tacho_expiry', filters.tacho_expiry_filter);

    // Update filtered drivers
    setFilteredDrivers(result);
    
    // Update pagination
    setPagination(prev => ({
      ...prev,
      count: result.length,
      total_pages: Math.ceil(result.length / pageSize),
      current_page: 1,
    }));
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters, allDrivers, pageSize]);

  // Get paginated drivers
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDrivers.slice(startIndex, endIndex);
  }, [filteredDrivers, currentPage, pageSize]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      profile_status: 'all',
      driver_licence_expiry_filter: '',
      cpc_card_expiry_filter: '',
      dbs_expiry_date_filter: '',
      tacho_expiry_filter: '',
    });
  };

  const getDateStatus = (dateString: string | null, field: string): { colorClass: string, label: string } => {
    if (!dateString) {
      return { colorClass: '', label: '' };
    }
    
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const daysUntilExpiry = differenceInDays(date, today);
      
      if (isPast(date)) {
        return { colorClass: 'bg-red-50 text-red-700', label: 'Expired' };
      }
      
      // License style fields: Green >90 days, Orange <=90 days
      if (FIELD_CONFIG.LICENSE_STYLE_FIELDS.includes(field as typeof FIELD_CONFIG.LICENSE_STYLE_FIELDS[number])) {
        if (daysUntilExpiry <= 90) {
          return { colorClass: 'bg-orange-50 text-orange-700', label: `${daysUntilExpiry} days` };
        }
        return { colorClass: 'bg-green-50 text-green-700', label: '' };
      }
      
      // Next Driver Check Due: Green >3 days, Orange <=3 days
      if (field === FIELD_CONFIG.NEXT_DRIVER_CHECK_DUE) {
        if (daysUntilExpiry <= 3) {
          return { colorClass: 'bg-orange-50 text-orange-700', label: `${daysUntilExpiry} days` };
        }
        return { colorClass: 'bg-green-50 text-green-700', label: '' };
      }
      
      // Next Tacho Download: Green >60 days, Orange <=60 days
      if (field === FIELD_CONFIG.NEXT_TACHO_DOWNLOAD) {
        if (daysUntilExpiry <= 60) {
          return { colorClass: 'bg-orange-50 text-orange-700', label: `${daysUntilExpiry} days` };
        }
        return { colorClass: 'bg-green-50 text-green-700', label: '' };
      }
      
      // Last Tacho Download: Always green (not an expiry)
      if (field === FIELD_CONFIG.LAST_TACHO_DOWNLOAD) {
        return { colorClass: 'bg-green-50 text-green-700', label: '' };
      }
      
      // Last Driver Check Code: Always green (not an expiry)
      if (field === FIELD_CONFIG.LAST_DRIVER_CHECK) {
        return { colorClass: 'bg-green-50 text-green-700', label: '' };
      }
      
      return { colorClass: '', label: '' };
    } catch {
      return { colorClass: '', label: '' };
    }
  };

  const formatDateForDisplay = (field: string, value: string | null) => {
    // Check if it's a TBC field and value is null/empty
    if (FIELD_CONFIG.TBC_FIELDS.includes(field as typeof FIELD_CONFIG.TBC_FIELDS[number])) {
      if (!value) {
        return 'TBC';
      }
    }
    
    // For regular date fields, show "NA" if empty
    if (!value) {
      return 'NA';
    }
    
    try {
      return format(parseISO(value), 'dd MMM yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const renderDateCell = (field: string, value: string | null, driver: Driver) => {
    const displayValue = formatDateForDisplay(field, value);
    
    // Special handling for TBC fields
    if (FIELD_CONFIG.TBC_FIELDS.includes(field as typeof FIELD_CONFIG.TBC_FIELDS[number])) {
      if (!value) {
        return (
          <TableCell className="bg-gray-50 text-gray-500 italic whitespace-nowrap">
            {displayValue}
          </TableCell>
        );
      }
    }
    
    // If value is null/empty and not a TBC field, show "NA" with no special styling
    if (!value) {
      return (
        <TableCell className="whitespace-nowrap text-gray-400">
          {displayValue}
        </TableCell>
      );
    }
    
    const { colorClass, label } = getDateStatus(value, field);
    
    // Special handling for Last Tacho Download (always show in green)
    if (field === FIELD_CONFIG.LAST_TACHO_DOWNLOAD || field === FIELD_CONFIG.LAST_DRIVER_CHECK) {
      return (
        <TableCell className="bg-green-50 text-green-700 whitespace-nowrap">
          {displayValue}
        </TableCell>
      );
    }
    
    return (
      <TableCell className={`whitespace-nowrap ${colorClass}`}>
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer hover:underline">
              {displayValue}
              {label && <span className="ml-2 text-xs font-semibold">({label})</span>}
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

  const renderExpiryFilter = (label: string, field: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={filters[field as keyof typeof filters] as string}
        onValueChange={(v) => handleFilterChange(field, v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by expiry" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="expiring_soon">Expiring Soon (≤90 days)</SelectItem>
          <SelectItem value="valid">Valid ({'>'}90 days)</SelectItem>
        </SelectContent>
      </Select>
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
            disabled={currentPage === 1 || loading}
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
            disabled={currentPage === pagination.total_pages || loading}
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
          <ExportButton data={filteredDrivers} fileName="driver_compliance_report" />
        </div>
      </div>

      {/* Filters Panel - Always Visible */}
      <div className="p-6 mb-6 bg-gray-50 rounded-lg shadow-sm">
        <div className="grid gap-6">
          <section>
            <h3 className="font-semibold mb-4">Search & Status</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Search Driver (Name / Email / License)</Label>
                <Input
                  placeholder="Enter name, email, or license number..."
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

          <Separator />
          
          <section>
            <h3 className="font-semibold mb-4">Filter by Expiry Status</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderExpiryFilter("Driving Licence", "driver_licence_expiry_filter")}
              {renderExpiryFilter("CPC Card", "cpc_card_expiry_filter")}
              {renderExpiryFilter("DBS", "dbs_expiry_date_filter")}
              {renderExpiryFilter("Tacho Card", "tacho_expiry_filter")}
            </div>
          </section>

          <div className="flex justify-end items-center pt-4 border-t">
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear All Filters</Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Found {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}
        {filteredDrivers.length !== allDrivers.length && ` (from ${allDrivers.length} total)`}
      </div>

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
                <TableHead>Night Worker Assessment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-gray-500">
                    No drivers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/compliance-management/driver-management/${driver.id}?name=${encodeURIComponent(driver.user.full_name)}&user_id=${driver.user.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {driver.user.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{driver.user.license_number || "NA"}</TableCell>
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