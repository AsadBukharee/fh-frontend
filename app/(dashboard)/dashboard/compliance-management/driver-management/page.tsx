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
import { format, differenceInDays, isPast, parseISO, isBefore, isAfter, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import ExportButton from '@/app/utils/ExportButton';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import Link from 'next/link';
import { ExportChartButton } from '@/app/utils/ExportChartButton';

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

    // Booked dates for PMI and other inspections
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

  // Next Tacho Download: Green >10 days, Orange <=10 days, Red expired
  NEXT_TACHO_DOWNLOAD: 'next_driver_tacho_download',

  // Last Tacho Download: Black color
  LAST_TACHO_DOWNLOAD: 'last_driver_tacho_download',

  // Last Driver Check Code: Black color
  LAST_DRIVER_CHECK: 'last_driver_check_code_date',

  // Booked PMI dates
  PMI_BOOKED_DATE: 'pmi_booked_date',
  MOT_BOOKED_DATE: 'mot_booked_date',

  // Fields that should show "TBC" if not booked yet
  TBC_FIELDS: [
    'mot_booked_date',
    'pmi_booked_date',
    'next_tacho_calibration_date',
    'next_loller_calibration_date'
  ]
} as const;

// Sticky header styles
const stickyHeaderClass = "sticky top-0 bg-white z-10 shadow-sm";

const DriverManagementPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stickyName, setStickyName] = useState<string | null>(null);

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
    driver_licence_expiry_filter: '',
    cpc_card_expiry_filter: '',
    dbs_expiry_date_filter: '',
    tacho_expiry_filter: '',
  });

  const token = useCookies().get("access_token");

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();

    // Pagination params
    params.append('page', currentPage.toString());
    params.append('page_size', pageSize.toString());

    // Search filter
    if (filters.search) {
      params.append('search', filters.search);
    }

    // Profile status filter
    if (filters.profile_status && filters.profile_status !== 'all') {
      params.append('profile_status', filters.profile_status);
    }

    return params.toString();
  };

  // Fetch drivers with pagination and filters
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams();
      const url = `${API_URL}/api/profiles/driver/compliance/?${queryParams}`;

      const response = await fetch(url, {
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
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers when dependencies change
  useEffect(() => {
    fetchDrivers();
  }, [currentPage, pageSize, filters]);

  // Handle scroll for sticky name
  useEffect(() => {
    const handleScroll = () => {
      const table = document.querySelector('.driver-table');
      if (table) {
        const scrollLeft = table.scrollLeft;
        if (scrollLeft > 0) {
          setStickyName('sticky left-0 bg-white border-r border-gray-200 z-20');
        } else {
          setStickyName(null);
        }
      }
    };

    const table = document.querySelector('.driver-table');
    if (table) {
      table.addEventListener('scroll', handleScroll);
      return () => table.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    // Reset to first page when filters change
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const getDateStatus = (dateString: string | null, field: string): { colorClass: string, label: string, hoverText?: string } => {
    if (!dateString) {
      return { colorClass: '', label: '' };
    }

    try {
      const date = parseISO(dateString);
      const today = new Date();
      const daysUntilExpiry = differenceInDays(date, today);

      if (isPast(date)) {
        // Expired
        const expiredDays = Math.abs(daysUntilExpiry);
        return {
          colorClass: 'bg-red-50 text-red-700',
          label: 'Expired',
          hoverText: `Expired ${expiredDays} day${expiredDays !== 1 ? 's' : ''} ago`
        };
      }

      // License style fields: Green >90 days, Orange <=90 days
      if (FIELD_CONFIG.LICENSE_STYLE_FIELDS.includes(field as typeof FIELD_CONFIG.LICENSE_STYLE_FIELDS[number])) {
        if (daysUntilExpiry <= 120) {
          if (daysUntilExpiry <= 60) {
            return {
              colorClass: 'bg-orange-50 text-orange-700',
              label: `${daysUntilExpiry} days`,
              hoverText: `Expires in ${daysUntilExpiry} days`
            };
          }
          return {
            colorClass: 'bg-yellow-50 text-yellow-700',
            label: `${daysUntilExpiry} days`,
            hoverText: `Expires in ${daysUntilExpiry} days`
          };
        }
        return {
          colorClass: 'bg-green-50 text-green-700',
          label: '',
          hoverText: `Expires in ${daysUntilExpiry} days`
        };
      }

      // CPC Card specific rule: Green >120 days, Orange <=120 days
      if (field === 'cpc_card_expiry') {
        if (daysUntilExpiry <= 120) {
          return {
            colorClass: 'bg-orange-50 text-orange-700',
            label: `${daysUntilExpiry} days`,
            hoverText: `Expires in ${daysUntilExpiry} days`
          };
        }
        return {
          colorClass: 'bg-green-50 text-green-700',
          label: '',
          hoverText: `Expires in ${daysUntilExpiry} days`
        };
      }

      // Next Driver Check Due: Green >3 days, Orange <=3 days
      if (field === FIELD_CONFIG.NEXT_DRIVER_CHECK_DUE) {
        if (daysUntilExpiry <= 3) {
          return {
            colorClass: 'bg-orange-50 text-orange-700',
            label: `${daysUntilExpiry} days`,
            hoverText: `Due in ${daysUntilExpiry} days`
          };
        }
        return {
          colorClass: 'bg-green-50 text-green-700',
          label: '',
          hoverText: `Due in ${daysUntilExpiry} days`
        };
      }

      // Next Tacho Download: Green >10 days, Orange <=10 days, Red expired
      if (field === FIELD_CONFIG.NEXT_TACHO_DOWNLOAD) {
        if (daysUntilExpiry <= 10) {
          return {
            colorClass: 'bg-orange-50 text-orange-700',
            label: `${daysUntilExpiry} days`,
            hoverText: `Download due in ${daysUntilExpiry} days`
          };
        }
        return {
          colorClass: 'bg-green-50 text-green-700',
          label: '',
          hoverText: `Download due in ${daysUntilExpiry} days`
        };
      }

      // PMI Booked Date: Green if >=10 days left, Red if <10 days
      if (field === FIELD_CONFIG.PMI_BOOKED_DATE) {
        if (daysUntilExpiry <= 0) {
          return {
            colorClass: 'bg-red-50 text-red-700',
            label: 'Expired',
            hoverText: 'PMI expired'
          };
        } else if (daysUntilExpiry < 10) {
          return {
            colorClass: 'bg-red-50 text-red-700',
            label: `${daysUntilExpiry} days`,
            hoverText: `PMI due in ${daysUntilExpiry} days`
          };
        } else if (daysUntilExpiry <= 60) {
          return {
            colorClass: 'bg-yellow-50 text-yellow-700',
            label: `${daysUntilExpiry} days`,
            hoverText: `PMI due in ${daysUntilExpiry} days`
          };
        }
        return {
          colorClass: 'bg-green-50 text-green-700',
          label: '',
          hoverText: `PMI due in ${daysUntilExpiry} days`
        };
      }

      // Last Tacho Download: Black background
      if (field === FIELD_CONFIG.LAST_TACHO_DOWNLOAD) {
        return {
          colorClass: 'bg-gray-50 text-gray-900',
          label: '',
          hoverText: `Last downloaded ${daysUntilExpiry > 0 ? `${daysUntilExpiry} days ago` : 'today'}`
        };
      }

      // Last Driver Check Code: Black background
      if (field === FIELD_CONFIG.LAST_DRIVER_CHECK) {
        return {
          colorClass: 'bg-gray-50 text-gray-900',
          label: '',
          hoverText: `Last checked ${daysUntilExpiry > 0 ? `${daysUntilExpiry} days ago` : 'today'}`
        };
      }

      return { colorClass: '', label: '', hoverText: '' };
    } catch {
      return { colorClass: '', label: '', hoverText: '' };
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

    const { colorClass, label, hoverText } = getDateStatus(value, field);

    // Special handling for Last Tacho Download and Last Driver Check (always show in black/gray)
    if (field === FIELD_CONFIG.LAST_TACHO_DOWNLOAD || field === FIELD_CONFIG.LAST_DRIVER_CHECK) {
      return (
        <TableCell className="bg-gray-50 text-gray-900 whitespace-nowrap">
          <Popover>
            <PopoverTrigger asChild>
              <span className="cursor-pointer hover:underline">
                {displayValue}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm">
              <div className="space-y-2">
                <div className="font-medium">{hoverText}</div>
              </div>
            </PopoverContent>
          </Popover>
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
              <div className="font-medium">{hoverText || `${displayValue}`}</div>

              {/* Show additional information for relevant fields */}
              {field === 'driver_licence_expiry' && (
                <div className="text-xs text-gray-500 mt-2">
                  Hover shows:
                  <br />- 60 days left: Orange
                  <br />- 120 days left: Yellow
                  <br />- Expired: Red
                  <br />- More than 120 days: Green
                </div>
              )}

              {field === 'cpc_card_expiry' && (
                <div className="text-xs text-gray-500 mt-2">
                  CPC specific:
                  <br />- 120 days left: Orange
                  <br />- Expired: Red
                  <br />- More than 120 days: Green
                </div>
              )}

              {field === FIELD_CONFIG.NEXT_TACHO_DOWNLOAD && (
                <div className="text-xs text-gray-500 mt-2">
                  Tacho Download:
                  <br />- 10 days or less: Orange
                  <br />- More than 10 days: Green
                </div>
              )}

              {field === FIELD_CONFIG.PMI_BOOKED_DATE && (
                <div className="text-xs text-gray-500 mt-2">
                  PMI Inspection:
                  <br />- 10 days or more: Green
                  <br />- Less than 10 days: Red
                  <br />- Expired: Red
                </div>
              )}
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
          <SelectItem value="expiring_60">≤ 60 days</SelectItem>
          <SelectItem value="expiring_120">≤ 120 days</SelectItem>
          <SelectItem value="valid">{'>'} 120 days</SelectItem>
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

        <Select value={pageSize.toString()} onValueChange={(v) => {
          setPageSize(Number(v));
          setCurrentPage(1);
        }}>
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
          {/* <ExportChartButton data={drivers} fileName="driver_compliance_report" /> */}
          <ExportButton data={drivers} fileName="driver_compliance_report" />
        </div>
      </div>

      {/* Filters Panel - Always Visible */}
      <div className=" ">
        <div className="grid gap-6">
          <section>
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
        Found {pagination.count} driver{pagination.count !== 1 ? 's' : ''}
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <div className="overflow-x-auto driver-table" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} ${stickyName ? 'left-0 z-30' : ''}`}>
                  Driver Name
                </TableHead>
                <TableHead className="min-w-[150px]">License No.</TableHead>
                <TableHead className="min-w-[150px]">License Expiry</TableHead>
                <TableHead className="min-w-[150px]">D/D1 Expiry</TableHead>
                <TableHead className="min-w-[150px]">CPC Card Expiry</TableHead>
                <TableHead className="min-w-[150px]">Tacho Expiry</TableHead>
                <TableHead className="min-w-[150px]">Last Check Code</TableHead>
                <TableHead className="min-w-[150px]">Next Check Due</TableHead>
                <TableHead className="min-w-[150px]">Last Tacho DL</TableHead>
                <TableHead className="min-w-[150px]">Next Tacho DL</TableHead>
                <TableHead className="min-w-[150px]">DBS Expiry</TableHead>
                <TableHead className="min-w-[150px]">Night Worker Assessment</TableHead>
                <TableHead className="min-w-[150px]">PMI Booked Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-gray-500">
                    No drivers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className={`font-medium ${stickyName}`}>
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
                    {renderDateCell('pmi_booked_date', driver.driver_compliance.pmi_booked_date ?? null, driver)}
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