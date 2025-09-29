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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { CalendarIcon } from 'lucide-react';
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

interface ApiResponse {
  data: {
    success: boolean;
    results: Driver[];
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      current_page: number;
      total_pages: number;
      page_size: number;
    };
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
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [tempFilters, setTempFilters] = useState({
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
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const token = useCookies().get("access_token");

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profiles/driver/compliance/`,{
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await response.json();
        setDrivers(data.data.results);
        setFilteredDrivers(data.data.results);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      const filtered = drivers.filter((driver) =>
        Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          if (key === 'full_name') {
            return driver.user.full_name.toLowerCase().includes(value.toLowerCase());
          }
          if (key === 'profile_status') {
            return driver.profile_status.toLowerCase() === value.toLowerCase();
          }
          if (key === 'email') {
            return driver.user.email.toLowerCase().includes(value.toLowerCase());
          }
          if (key in driver.driver_compliance) {
            return driver.driver_compliance[key as keyof Driver['driver_compliance']]
              .toLowerCase()
              .includes(value.toLowerCase());
          }
          return true;
        })
      );
      setFilteredDrivers(filtered);
    };

    applyFilters();
  }, [filters, drivers]);

  const handleFilterChange = (field: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFiltersFromModal = () => {
    setFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setTempFilters({
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
    setIsFilterModalOpen(false);
  };

  const handleDoubleClick = (id: number, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditSave = (id: number, field: string) => {
    setDrivers((prev) =>
      prev.map((driver) => {
        if (driver.id === id) {
          if (field === 'full_name' || field === 'email') {
            return {
              ...driver,
              user: { ...driver.user, [field]: editValue },
            };
          } else if (field in driver.driver_compliance) {
            return {
              ...driver,
              driver_compliance: {
                ...driver.driver_compliance,
                [field]: editValue,
              },
            };
          }
        }
        return driver;
      })
    );
    setEditingCell(null);
    setEditValue('');
  };

  const renderDatePicker = (label: string, field: string, value: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {value ? format(new Date(value), "dd MMM yyyy") : "Pick a date"}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) =>
              handleFilterChange(field, date ? date.toISOString() : "")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const handleKeyPress = (e: React.KeyboardEvent, id: number, field: string) => {
    if (e.key === 'Enter') {
      handleEditSave(id, field);
    }
  };

  const isDateExpired = (dateString: string) => {
    if (!dateString) return false;
    try {
      const date = parseISO(dateString);
      return isPast(date);
    } catch {
      return false;
    }
  };

const getDaysInfo = (dateString: string, label: string) => {
  if (!dateString) return (
    <div>
      <span className="font-bold">{label}</span>: No date provided
    </div>
  );

  try {
    const date = parseISO(dateString);
    const daysDiff = differenceInDays(date, new Date());

    if (isPast(date)) {
      return (
        <div>
          <span className="font-bold">{label}</span>: Expired {Math.abs(daysDiff)} days ago
        </div>
      );
    }

    return (
      <div>
        <span className="font-bold">{label}</span>: {daysDiff} days remaining
      </div>
    );
  } catch {
    return (
      <div>
        <span className="font-bold">{label}</span>: Invalid date
      </div>
    );
  }
};

  const renderDateCell = (id: number, field: string, value: string, driver: Driver) => {
    const isExpired = isDateExpired(value);
    const dateFields = [
      { key: 'driver_licence_expiry', label: 'Driver License Expiry' },
      { key: 'last_driver_check_code_date', label: 'Last Driver Check Code' },
      { key: 'next_driver_check_code_due', label: 'Next Driver Check Code' },
      { key: 'tacho_expiry', label: 'Tacho Expiry' },
      { key: 'dbs_expiry_date', label: 'DBS Expiry' },
      { key: 'night_worker_assessment_expiry', label: 'DOC Expiry' },
      { key: 'last_driver_tacho_download', label: 'Last Tacho Download' },
      { key: 'next_driver_tacho_download', label: 'Next Tacho Download' },
    ];
const tooltipContent = dateFields.map(({ key, label }) =>
  getDaysInfo(
    driver.driver_compliance[key as keyof Driver['driver_compliance']],
    label
  )
);

    return (
      <TableCell
        className={`whitespace-nowrap ${isExpired ? 'text-red-600 bg-red-100' : ''}`}
        onDoubleClick={() => handleDoubleClick(id, field, value)}
      >
        {editingCell?.id === id && editingCell?.field === field ? (
          <Input
            value={editValue}
            onChange={handleEditChange}
            onBlur={() => handleEditSave(id, field)}
            onKeyPress={(e) => handleKeyPress(e, id, field)}
            autoFocus
          />
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <span className="cursor-pointer">
                {value ? format(new Date(value), 'dd MMM yyyy') : '-'}
                {isExpired && <span className="ml-2 text-xs">(Expired)</span>}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="text-sm whitespace-pre-line">
                {tooltipContent}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </TableCell>
    );
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Driver Compliance</h1>
     <div className=" gap-2 flex">
         <Button
          variant="outline"
          style={{
            background: 'linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)',
            width: 'auto',
            height: 'auto',
          }}
          className='text-white'
          onClick={() => setIsFilterModalOpen(true)}
        >
          Filter Drivers
        </Button>
        <ExportButton data={filteredDrivers} fileName="driver_data" />
     </div>
      </div>

      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Drivers</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Identity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Driver Name</Label>
                <Input
                  placeholder="Enter name"
                  value={tempFilters.full_name}
                  onChange={(e) => handleFilterChange("full_name", e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  placeholder="Enter email"
                  value={tempFilters.email}
                  onChange={(e) => handleFilterChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label>Profile Status</Label>
                <Select
                  value={tempFilters.profile_status}
                  onValueChange={(value) =>
                    handleFilterChange("profile_status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="not_approved">Not Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              License & Compliance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {renderDatePicker("License Expiry", "driver_licence_expiry", tempFilters.driver_licence_expiry)}
              {renderDatePicker("DBS Expiry", "dbs_expiry_date", tempFilters.dbs_expiry_date)}
              {renderDatePicker("DOC Expiry", "night_worker_assessment_expiry", tempFilters.night_worker_assessment_expiry)}
              {renderDatePicker("Tacho Expiry", "tacho_expiry", tempFilters.tacho_expiry)}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Checks</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderDatePicker("Last Check", "last_driver_check_code_date", tempFilters.last_driver_check_code_date)}
              {renderDatePicker("Next Check", "next_driver_check_code_due", tempFilters.next_driver_check_code_due)}
              {renderDatePicker("Last Tacho", "last_driver_tacho_download", tempFilters.last_driver_tacho_download)}
              {renderDatePicker("Next Tacho", "next_driver_tacho_download", tempFilters.next_driver_tacho_download)}
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button
              onClick={applyFiltersFromModal}
              disabled={Object.values(tempFilters).every((val) => !val)}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver Name</TableHead>
              <TableHead>License No.</TableHead>
              <TableHead>Driver License Expiry</TableHead>
              <TableHead>Last Driver Check Code</TableHead>
              <TableHead>Next Driver Check Code</TableHead>
              <TableHead>Tacho Expiry</TableHead>
              <TableHead>DBS Expiry</TableHead>
              <TableHead>DOC Expiry</TableHead>
              <TableHead>Last Tacho Download</TableHead>
              <TableHead>Next Driver Tacho Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrivers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  No Data Available
                </TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell
                    className="font-medium whitespace-nowrap"
                    onDoubleClick={() => handleDoubleClick(driver.id, 'full_name', driver.user.full_name)}
                  >
                  
                     <Link href={`/dashboard/compliance-management/driver-management/${driver.id}`} className="text-blue-600 hover:underline"> 
                     {driver.user.full_name} </Link>
                    
                  </TableCell>
             
                
                  <TableCell className="whitespace-nowrap">{driver.user.license_number || "-"}</TableCell>
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
  );
};

export default DriverManagementPage;