'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, GraduationCap, Calendar, Info, RefreshCw, Play } from 'lucide-react';
import { format, differenceInDays, isPast, parseISO, isBefore, isAfter, addDays, startOfDay, differenceInCalendarDays } from 'date-fns';
import { toast } from 'sonner';
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
    license_issue_number?: string | null;
    role: string;
  };
  national_insurance_no: string | null;
  profile_status: string;
  driver_compliance: {
    driver_licence_expiry: string | null;
    last_driver_license_check_code_date: string | null;
    next_driver_check_code_due: string | null;
    cpc_card_expiry: string | null;
    cpc_modules?: Array<{
      id: number;
      module_name: string;
      description: string;
      expiry_date: string | null;
    }>;
    cpc_next_five_modules?: Array<{
      module_name: string;
      module_number: number;
    }>;
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
  // Fields that follow specific rules from requirements
  LICENSE_FIELDS: ['driver_licence_expiry', 'd_d1_expiry'],
  NEXT_DRIVER_CHECK_FIELDS: ['next_driver_check_code_due'],
  CPC_CARD_FIELDS: ['cpc_card_expiry'],
  TACHO_EXPIRY_FIELDS: ['tacho_expiry'],
  NEXT_TACHO_DL_FIELDS: ['next_driver_tacho_download'],
  DBS_FIELDS: ['dbs_expiry_date'],
  NIGHT_WORKER_FIELDS: ['night_worker_assessment_expiry'],

  // Historical fields (black background)
  LAST_TACHO_DOWNLOAD: 'last_driver_tacho_download',
  LAST_DRIVER_CHECK: 'last_driver_license_check_code_date',

  // Booked dates for PMI and other inspections
  PMI_BOOKED_DATE: 'pmi_booked_date',
  MOT_BOOKED_DATE: 'mot_booked_date',

  // Fields that should show "TBC" if not booked yet
  TBC_FIELDS: [
    'mot_booked_date',
    'pmi_booked_date',
    'next_tacho_calibration_date',
    'next_loller_calibration_date'
  ],

  // Extra compliance fields
  VEHICLE_FAMILIARISATION: 'vehicle_familiarisation_walkaround_refresher_expiry',
  EMPLOYMENT_START: 'employment_start_date',
  PROBATION_REVIEW: 'six_months_probation_review',
  ANNIVERSARY_1: 'first_anniversary',
  ANNIVERSARY_2: 'second_anniversary',
  ANNIVERSARY_3: 'third_anniversary',
} as const;

// Sticky header and name column styles
const stickyHeaderClass = "sticky top-0 bg-white z-10";
const stickyNameClass = "sticky left-0 bg-white z-20 border-r border-gray-200";

// CPC Modules Dialog Component
const CPCModulesDialog = ({ driver }: { driver: Driver }) => {
  const currentModules = driver.driver_compliance.cpc_modules || [];
  const nextFiveModules = driver.driver_compliance.cpc_next_five_modules || [];
  const hasModules = currentModules.length > 0 || nextFiveModules.length > 0;

  // Helper to get status for future modules
  const getModuleStatus = (expiryDateString: string | null) => {
    if (!expiryDateString) return { status: 'NA', color: 'text-gray-500', bg: 'bg-gray-50' };
    const today = startOfDay(new Date());
    const expiryDate = startOfDay(parseISO(expiryDateString));
    const daysLeft = differenceInCalendarDays(expiryDate, today);

    if (daysLeft > 90) return { status: `${daysLeft} days left to complete module`, color: 'text-green-700', bg: 'bg-green-50' };
    if (daysLeft > 45) return { status: `${daysLeft} days left to complete module`, color: 'text-amber-700', bg: 'bg-amber-50' };
    if (daysLeft > 0) return { status: `${daysLeft} days left to complete module`, color: 'text-red-700', bg: 'bg-red-50' };
    if (daysLeft === 0) return { status: 'Module completion due today', color: 'text-red-700', bg: 'bg-red-100' };
    return { status: `CPC overdue by ${Math.abs(daysLeft)} days`, color: 'text-red-700', bg: 'bg-red-200' };
  };

  if (!hasModules) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="ml-2 inline-flex items-center justify-start text-blue-600 hover:text-blue-800 focus:outline-none transition-colors">
          <GraduationCap className="h-4 w-4" />
          <span className="sr-only">View CPC modules</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            CPC Modules - {driver.user.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="overflow-x-auto">
            <h3 className="font-semibold text-gray-900 mb-2">Current Modules</h3>
            <table className="min-w-full border text-sm text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left w-12">No</th>
                  <th className="border px-2 py-1 text-left">Module Name</th>
                  <th className="border px-2 py-1 text-left">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(i => {
                  const current = currentModules[i];
                  return (
                    <tr key={`current-${i}`} className="bg-white">
                      <td className="border px-2 py-1 text-left">{i + 1}</td>
                      <td className="border px-2 py-1 text-left">{current ? current.module_name : ''}</td>
                      <td className="border px-2 py-1 text-left">{current && current.expiry_date ? new Date(current.expiry_date).toLocaleDateString('en-GB') : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <h3 className="font-semibold text-gray-900 mb-2">Future Modules</h3>
            <table className="min-w-full border text-sm text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left w-12">No</th>
                  <th className="border px-2 py-1 text-left">Module Name</th>
                  <th className="border px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(i => {
                  const current = currentModules[i];
                  const future = nextFiveModules[i];
                  const expiryDate = current ? current.expiry_date : null;
                  const statusObj = getModuleStatus(expiryDate);
                  return (
                    <tr key={`future-${i}`} className={future ? statusObj.bg : 'bg-white'}>
                      <td className="border px-2 py-1 text-left">{i + 1}</td>
                      <td className="border px-2 py-1 text-left">{future ? future.module_name : ''}</td>
                      <td className={`border px-2 py-1 text-left ${statusObj.color}`}>{future ? statusObj.status : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-500">Status dates are linked to the expiry dates of current CPC modules</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DriverManagementPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

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
    next_driver_check_filter: '',
    night_worker_filter: '',
    next_tacho_dl_filter: '',
    d_d1_expiry_filter: '',
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

    // Expiry filters - send to backend
    if (filters.driver_licence_expiry_filter && filters.driver_licence_expiry_filter !== 'all') {
      params.append('driver_licence_expiry_filter', filters.driver_licence_expiry_filter);
    }
    if (filters.d_d1_expiry_filter && filters.d_d1_expiry_filter !== 'all') {
      params.append('d_d1_expiry_filter', filters.d_d1_expiry_filter);
    }
    if (filters.next_driver_check_filter && filters.next_driver_check_filter !== 'all') {
      params.append('next_driver_check_filter', filters.next_driver_check_filter);
    }
    if (filters.cpc_card_expiry_filter && filters.cpc_card_expiry_filter !== 'all') {
      params.append('cpc_card_expiry_filter', filters.cpc_card_expiry_filter);
    }
    if (filters.tacho_expiry_filter && filters.tacho_expiry_filter !== 'all') {
      params.append('tacho_expiry_filter', filters.tacho_expiry_filter);
    }
    if (filters.next_tacho_dl_filter && filters.next_tacho_dl_filter !== 'all') {
      params.append('next_tacho_dl_filter', filters.next_tacho_dl_filter);
    }
    if (filters.dbs_expiry_date_filter && filters.dbs_expiry_date_filter !== 'all') {
      params.append('dbs_expiry_date_filter', filters.dbs_expiry_date_filter);
    }
    if (filters.night_worker_filter && filters.night_worker_filter !== 'all') {
      params.append('night_worker_filter', filters.night_worker_filter);
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

  const performSweepAudit = async () => {
    setIsSweeping(true);
    try {
      const nowIso = new Date().toISOString();

      const response = await fetch(
        `${API_URL}/api/notifications/sweep-driver-audit-now/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Driver Audit Notice",
            message: "Driver compliance audit triggered manually.",
            datetime: nowIso,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to trigger sweep audit");
      }

      const result = await response.json();
      toast.success(result.message || "Sweep audit triggered successfully!");
    } catch (error) {
      console.error("Sweep audit error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to trigger sweep audit",
      );
    } finally {
      setIsSweeping(false);
    }
  };

  // Handle scroll for fixed header and name column
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const scrollLeft = tableContainerRef.current.scrollLeft;
        const scrollTop = tableContainerRef.current.scrollTop;

        // Apply shadow to header when scrolled vertically
        const headerCells = document.querySelectorAll('thead th');
        headerCells.forEach(cell => {
          if (scrollTop > 0) {
            cell.classList.add('shadow-sm');
          } else {
            cell.classList.remove('shadow-sm');
          }
        });
      }
    };

    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      return () => tableContainer.removeEventListener('scroll', handleScroll);
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
      next_driver_check_filter: '',
      night_worker_filter: '',
      next_tacho_dl_filter: '',
      d_d1_expiry_filter: '',
    });
    setCurrentPage(1);
  };

  const getDateStatus = (dateString: string | null, field: string): { colorClass: string, label: string, hoverText?: string } => {
    if (!dateString) {
      return { colorClass: '', label: '' };
    }

    try {
      const today = startOfDay(new Date());
      const expiryDate = startOfDay(parseISO(dateString));
      const daysUntilExpiry = differenceInCalendarDays(expiryDate, today);

      // Check if expired
      if (daysUntilExpiry < 0) {
        const expiredDays = Math.abs(daysUntilExpiry);
        return {
          colorClass: 'bg-red-50 text-red-700',
          label: 'Expired',
          hoverText: expiredDays === 0 ? 'Expired' : `Expiry = ${expiredDays} Days Ago`
        };
      }

      // License / D D1 category
      if (field === 'driver_licence_expiry' || field === 'd_d1_expiry') {
        if (daysUntilExpiry >= 90) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 60) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // Next Driver Check Code Due
      if (field === 'next_driver_check_code_due') {
        if (daysUntilExpiry >= 15) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 3) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // CPC Card Expiry
      if (field === 'cpc_card_expiry') {
        if (daysUntilExpiry >= 90) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 60) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // Tacho Expiry
      if (field === 'tacho_expiry') {
        if (daysUntilExpiry >= 60) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 30) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // Next Tacho DL
      if (field === 'next_driver_tacho_download') {
        if (daysUntilExpiry >= 10) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 2) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // DBS Expiry
      if (field === 'dbs_expiry_date') {
        if (daysUntilExpiry >= 120) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 60) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // Night Worker Assessment
      if (field === 'night_worker_assessment_expiry') {
        if (daysUntilExpiry >= 10) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 2) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // Vehicle Familiarisation Refresher
      if (field === 'vehicle_familiarisation_walkaround_refresher_expiry') {
        if (daysUntilExpiry >= 90) {
          return { colorClass: 'bg-green-50 text-green-700', label: '', hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else if (daysUntilExpiry >= 45) {
          return { colorClass: 'bg-amber-50 text-amber-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        } else {
          return { colorClass: 'bg-red-50 text-red-700', label: `${daysUntilExpiry} days`, hoverText: `Expiry = ${daysUntilExpiry} Days Left` };
        }
      }

      // Last Tacho Download: Light gray background
      if (field === 'last_driver_tacho_download') {
        const daysAgo = Math.abs(daysUntilExpiry);
        return {
          colorClass: 'bg-gray-50 text-gray-900',
          label: '',
          hoverText: `Last downloaded ${daysAgo > 0 ? `${daysAgo} days ago` : 'today'}`
        };
      }

      // Last Driver Check Code: Light gray background
      if (field === 'last_driver_license_check_code_date') {
        const daysAgo = Math.abs(daysUntilExpiry);
        return {
          colorClass: 'bg-gray-50 text-gray-900',
          label: '',
          hoverText: `Last checked ${daysAgo > 0 ? `${daysAgo} days ago` : 'today'}`
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
          <TableCell className="bg-gray-50 text-gray-500 italic whitespace-nowrap text-left">
            {displayValue}
          </TableCell>
        );
      }
    }

    // If value is null/empty and not a TBC field, show "NA" with no special styling
    if (!value) {
      return (
        <TableCell className="whitespace-nowrap text-gray-400 text-left">
          {displayValue}
        </TableCell>
      );
    }

    const { colorClass, label, hoverText } = getDateStatus(value, field);

    // Special handling for Last Tacho Download and Last Driver Check (always show in gray)
    if (field === FIELD_CONFIG.LAST_TACHO_DOWNLOAD || field === FIELD_CONFIG.LAST_DRIVER_CHECK) {
      return (
        <TableCell className="bg-gray-50 text-gray-900 whitespace-nowrap text-left">
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

    // Special handling for CPC Card Expiry - Add icon and dialog
    if (field === 'cpc_card_expiry') {
      return (
        <TableCell className={`whitespace-nowrap ${colorClass} text-left`}>
          <div className="flex items-center justify-start">
            <Popover>
              <PopoverTrigger asChild>
                <span className="cursor-pointer hover:underline flex items-center justify-start">
                  {displayValue}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">{hoverText || `${displayValue}`}</div>

                  {/* Show rules for CPC card */}
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    <strong>CPC Card Rules:</strong>
                    <br />- 90+ days: Green
                    <br />- 45-89 days: Amber
                    <br />- Under 45 days: Red
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Add CPC Modules Dialog */}
            <CPCModulesDialog driver={driver} />
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell className={`whitespace-nowrap ${colorClass} text-left`}>
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer hover:underline flex items-center justify-start">
              {displayValue}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <div className="space-y-2">
              <div className="font-medium">{hoverText || `${displayValue}`}</div>

              {/* Show rules for each field */}
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                {field === 'driver_licence_expiry' || field === 'd_d1_expiry' ? (
                  <>
                    <strong>License Rules:</strong>
                    <br />- 90+ days: Green
                    <br />- 60-89 days: Amber
                    <br />- Under 60 days: Red
                  </>
                ) : field === 'next_driver_check_code_due' ? (
                  <>
                    <strong>Check Code Rules:</strong>
                    <br />- 15+ days: Green
                    <br />- 3-14 days: Amber
                    <br />- Under 3 days: Red
                  </>
                ) : field === 'tacho_expiry' ? (
                  <>
                    <strong>Tacho Rules:</strong>
                    <br />- 60+ days: Green
                    <br />- 30-59 days: Amber
                    <br />- Under 30 days: Red
                  </>
                ) : field === 'next_driver_tacho_download' ? (
                  <>
                    <strong>Next Tacho DL Rules:</strong>
                    <br />- 10+ days: Green
                    <br />- 2-9 days: Amber
                    <br />- Under 2 days: Red
                  </>
                ) : field === 'dbs_expiry_date' ? (
                  <>
                    <strong>DBS Rules:</strong>
                    <br />- 120+ days: Green
                    <br />- 60-119 days: Amber
                    <br />- Under 60 days: Red
                  </>
                ) : field === 'night_worker_assessment_expiry' ? (
                  <>
                    <strong>Night Worker Rules:</strong>
                    <br />- 10+ days: Green
                    <br />- 2-9 days: Amber
                    <br />- Under 2 days: Red
                  </>
                ) : field === 'vehicle_familiarisation_walkaround_refresher_expiry' ? (
                  <>
                    <strong>Vehicle Fam Rules:</strong>
                    <br />- 90+ days: Green
                    <br />- 45-89 days: Amber
                    <br />- Under 45 days: Red
                  </>
                ) : null}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  };

  const renderExpiryFilter = (label: string, field: string, options: { value: string; label: string }[] = []) => {
    const defaultOptions = [
      { value: 'all', label: 'All' },
      { value: 'expired', label: 'Expired' },
      { value: 'expiring_soon', label: 'Expiring Soon' },
      { value: 'valid', label: 'Valid' },
    ];

    const filterOptions = options.length > 0 ? options : defaultOptions;

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select
          value={filters[field as keyof typeof filters] as string}
          onValueChange={(v) => handleFilterChange(field, v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

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
      <div className="flex flex-col sm:flex-row items-center justify-start mt-6 gap-8">
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
          <Button
            onClick={performSweepAudit}
            disabled={loading || isSweeping}
            variant="outline"
            className="bg-orange-500 hover:bg-orange-600 cursor-pointer text-white hover:text-white"
            size="sm"
          >
            <Play
              className={`w-4 h-4 mr-2 ${isSweeping ? "animate-spin" : ""}`}
            />
            Sweep Audit
          </Button>
          <ExportButton data={drivers} fileName="driver_compliance_report" />
          <Button
            onClick={fetchDrivers}
            disabled={loading || isSweeping}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4  ${loading || isSweeping ? "animate-spin" : ""
                }`}
            />
          </Button>
        </div>
      </div>

      {/* Filters Panel - Search and Profile Status always visible, Expiry Status in Dialog */}
      <div className="mb-6">
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

          {/* Expiry Status Filters in Dialog */}
          <section>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mb-2">Filter by Expiry Status</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Filter by Expiry Status</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {renderExpiryFilter("Driving Licence", "driver_licence_expiry_filter")}
                  {renderExpiryFilter("D/D1 Expiry", "d_d1_expiry_filter")}
                  {renderExpiryFilter("Next Driver Check", "next_driver_check_filter")}
                  {renderExpiryFilter("CPC Card", "cpc_card_expiry_filter")}
                  {renderExpiryFilter("Tacho Expiry", "tacho_expiry_filter")}
                  {renderExpiryFilter("Next Tacho DL", "next_tacho_dl_filter")}
                  {renderExpiryFilter("DBS Expiry", "dbs_expiry_date_filter")}
                  {renderExpiryFilter("Night Worker", "night_worker_filter")}
                </div>
                <div className="flex justify-end items-center pt-4 border-t mt-4">
                  <Button variant="outline" size="sm" onClick={clearFilters}>Clear All Filters</Button>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Found {pagination.count} driver{pagination.count !== 1 ? 's' : ''}
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{
            maxHeight: 'calc(100vh - 350px)',
            position: 'relative'
          }}
        >
          <Table ref={tableRef} className="border-collapse text-left">
            <TableHeader>
              <TableRow className="bg-gray-50">
                {/* Fixed Header Cells */}
                <TableHead className={`min-w-[200px] ${stickyHeaderClass} ${stickyNameClass} font-semibold text-left`}>Driver Name</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>License No.</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>License Issue No</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>License Expiry</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>D/D1 Expiry</TableHead>
                <TableHead className={`min-w-[180px] ${stickyHeaderClass} font-semibold text-left`}>Last Driver Check Code</TableHead>
                <TableHead className={`min-w-[180px] ${stickyHeaderClass} font-semibold text-left`}>Next Driver Check Code Due</TableHead>
                <TableHead className={`min-w-[200px] ${stickyHeaderClass} font-semibold text-left`}>CPC Card Expiry</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>Tacho Expiry</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>Last Tacho DL</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>Next Tacho DL</TableHead>
                <TableHead className={`min-w-[150px] ${stickyHeaderClass} font-semibold text-left`}>DBS Expiry</TableHead>
                <TableHead className={`min-w-[180px] ${stickyHeaderClass} font-semibold text-left`}>Night Worker Assessment</TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={19} className="text-left py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-0 text-blue-600" />
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={19} className="text-left py-12 text-gray-500">
                    No drivers found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id} className="hover:bg-gray-50 text-left">
                    {/* Fixed Driver Name Column */}
                    <TableCell className={`font-medium ${stickyNameClass} bg-white text-left`}>
                      <Link
                        href={`/dashboard/compliance-management/driver-management/${driver.id}?name=${encodeURIComponent(driver.user.full_name)}&user_id=${driver.user.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {driver.user.full_name}
                      </Link>
                    </TableCell>

                    {/* Regular Cells */}
                    <TableCell className="whitespace-nowrap text-left">
                      {driver.user.license_number || "NA"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-left">
                      {driver.user?.license_issue_number || "NA"}
                    </TableCell>
                    {renderDateCell('driver_licence_expiry', driver.driver_compliance.driver_licence_expiry, driver)}
                    {renderDateCell('d_d1_expiry', driver.driver_compliance.d_d1_expiry, driver)}
                    {renderDateCell('last_driver_license_check_code_date', driver.driver_compliance.last_driver_license_check_code_date, driver)}
                    {renderDateCell('next_driver_check_code_due', driver.driver_compliance.next_driver_check_code_due, driver)}
                    {renderDateCell('cpc_card_expiry', driver.driver_compliance.cpc_card_expiry, driver)}
                    {renderDateCell('tacho_expiry', driver.driver_compliance.tacho_expiry, driver)}
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