"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,

  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Clock, Clock3, Info, RefreshCw } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Clock In Reasons
const CLOCK_IN_REASONS = [
  { value: "Manual Clock In – Late", label: "Manual Clock In – Late" },
  { value: "Manual Clock In – User Phone Issue", label: "Manual Clock In – User Phone Issue" },
  { value: "Manual Clock In – System Issue", label: "Manual Clock In – System Issue" },
];

// Clock Out Reasons
const CLOCK_OUT_REASONS = [
  { value: "Manual Clock Out – Driver Needs To Leave Early", label: "Manual Clock Out – Driver Needs To Leave Early" },
  { value: "Manual Clock Out – User Phone Issue", label: "Manual Clock Out – User Phone Issue" },
  { value: "Manual Clock Out – System Issue", label: "Manual Clock Out – System Issue" },
];

// Interfaces based on your API response
interface ClockingData {
  id: number;
  clock_in: string | null;
  clock_out: string | null;
  expected_clock_out: string | null;
  is_late_clock_in: boolean;
  duration: string | null;
  clock_in_reason: string | null;
  clock_out_reason: string | null;
}

interface Shift {
  id: number;
  name: string;
  hours_from: string;
  hours_to: string;
  rate_per_hours: number;
}

interface ChildRota {
  id: number;
  date: string;
  shift: Shift;
  status: string;
  daily_hours: number;
  daily_salary: number;
}

interface Driver {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

interface DriverRota {
  user: Driver;
  child_rota: ChildRota;
  clocking: ClockingData | null;
}

interface ApiResponse {
  results: DriverRota[];
  count: number;
}

// Clock In Modal Props
interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason: string) => void;
  driverName: string;
  shiftName: string;
  scheduledTime: string;
}

// Clock Out Modal Props
interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason: string) => void;
  driverName: string;
  shiftName: string;
  clockInTime: string | null;
}

const ClockInModal = ({
  isOpen,
  onClose,
  onConfirm,
  driverName,
  shiftName,
  scheduledTime
}: ClockInModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleConfirm = () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }
    onConfirm(selectedReason, customReason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manual Clock In</DialogTitle>
          <DialogDescription>
            Record manual clock in for {driverName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Driver Information</Label>
            <div className="text-sm bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Driver:</span> {driverName}</p>
              <p><span className="font-medium">Shift:</span> {shiftName}</p>
              <p><span className="font-medium">Scheduled:</span> {scheduledTime}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Clock In Reason <span className="text-red-500">*</span></Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CLOCK_IN_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customReason">
              Detailed Reason (Optional)
            </Label>
            <Textarea
              id="customReason"
              placeholder="Please provide additional details if needed..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
            Clock In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ClockOutModal = ({
  isOpen,
  onClose,
  onConfirm,
  driverName,
  shiftName,
  clockInTime
}: ClockOutModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleConfirm = () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }
    onConfirm(selectedReason, customReason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manual Clock Out</DialogTitle>
          <DialogDescription>
            Record manual clock out for {driverName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Driver Information</Label>
            <div className="text-sm bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Driver:</span> {driverName}</p>
              <p><span className="font-medium">Shift:</span> {shiftName}</p>
              <p><span className="font-medium">Clocked In:</span> {clockInTime || "-"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Clock Out Reason <span className="text-red-500">*</span></Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CLOCK_OUT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customReason">
              Detailed Reason (Optional)
            </Label>
            <Textarea
              id="customReason"
              placeholder="Please provide additional details if needed..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-orange-600 hover:bg-orange-700">
            Clock Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DriverClockInOut = () => {
  const [drivers, setDrivers] = useState<DriverRota[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DriverRota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const cookies = useCookies();
  const token = cookies.get("access_token") || "";
  const role = cookies.get("role") || "";

  // Modal state
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<{
    id: number;
    rotaId: number;
    clockingId?: number;
    name: string;
    shiftName: string;
    scheduledTime: string;
    clockInTime: string | null;
  } | null>(null);

  // Today's date
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch drivers rota for today
  const fetchDriversRota = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: today,
        role: "driver",
      });

      const response = await fetch(
        `${API_URL}/api/rota/admin-clocking/?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch drivers rota");
      const data: ApiResponse = await response.json();

      // Filter to only show drivers with active shifts (not OFF)
      const activeDrivers = data.results.filter(
        (driver) => driver.child_rota.shift.name !== "OFF"
      );

      setDrivers(activeDrivers);
      setFilteredDrivers(activeDrivers);
    } catch (err) {
      setError((err as Error).message);
      toast.error("Failed to load drivers data");
    } finally {
      setLoading(false);
    }
  };

  // Handle Clock In - Open Modal
  const openClockInModal = (driver: DriverRota) => {
    const shift = driver.child_rota.shift;
    setSelectedDriver({
      id: driver.user.id,
      rotaId: driver.child_rota.id,
      name: driver.user.full_name,
      shiftName: shift.name,
      scheduledTime: `${shift.hours_from.substring(0, 5)} - ${shift.hours_to.substring(0, 5)}`,
      clockInTime: null,
    });
    setIsClockInModalOpen(true);
  };

  // Handle Clock Out - Open Modal
  const openClockOutModal = (driver: DriverRota) => {
    const shift = driver.child_rota.shift;
    setSelectedDriver({
      id: driver.user.id,
      rotaId: driver.child_rota.id,
      clockingId: driver.clocking?.id,
      name: driver.user.full_name,
      shiftName: shift.name,
      scheduledTime: `${shift.hours_from.substring(0, 5)} - ${shift.hours_to.substring(0, 5)}`,
      clockInTime: driver.clocking?.clock_in ? formatTime(driver.clocking.clock_in) : null,
    });
    setIsClockOutModalOpen(true);
  };

  // Handle Clock In confirmation
  const handleClockInConfirm = async (selectedReason: string, customReason: string) => {
    if (!selectedDriver) return;

    try {
      // Get current time in HH:MM format
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Combine reason with custom text only if custom text exists
      const clockInReason = customReason.trim()
        ? `${selectedReason}: ${customReason}`
        : selectedReason;

      const response = await fetch(`${API_URL}/api/rota/admin-clocking/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedDriver.id,
          clock_in_reason: clockInReason,
          clock_in: currentTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clock in");
      }

      toast.success(`${selectedDriver.name} clocked in successfully`);
      fetchDriversRota(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clock in");
    }
  };

  // Handle Clock Out confirmation
  const handleClockOutConfirm = async (selectedReason: string, customReason: string) => {
    if (!selectedDriver || !selectedDriver.clockingId) return;

    try {
      // Get current time in HH:MM format
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Combine reason with custom text only if custom text exists
      const clockOutReason = customReason.trim()
        ? `${selectedReason}: ${customReason}`
        : selectedReason;

      const response = await fetch(
        `${API_URL}/api/rota/admin-clocking/${selectedDriver.clockingId}/clock_out/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clock_out_reason: clockOutReason,
            clock_out: currentTime,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clock out");
      }

      toast.success(`${selectedDriver.name} clocked out successfully`);
      fetchDriversRota(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clock out");
    }
  };

  // Determine button state based on clocking data
  const getButtonState = (driver: DriverRota) => {
    const { clocking } = driver;

    if (!clocking) {
      // No clocking record - show Clock In
      return {
        showClockIn: true,
        showClockOut: false,
        disabled: false,
        label: "Clock In",
      };
    }

    if (clocking.clock_in && !clocking.clock_out) {
      // Clocked in but not out - show Clock Out
      return {
        showClockIn: false,
        showClockOut: true,
        disabled: false,
        label: "Clock Out",
      };
    }

    if (clocking.clock_in && clocking.clock_out) {
      // Both clock in and out exist - show Clock Out (disabled)
      return {
        showClockIn: false,
        showClockOut: true,
        disabled: true,
        label: "Completed",
      };
    }

    // Default - show Clock In
    return {
      showClockIn: true,
      showClockOut: false,
      disabled: false,
      label: "Clock In",
    };
  };

  // Get status badge
  const getStatusBadge = (driver: DriverRota) => {
    const { clocking } = driver;

    if (!clocking) {
      return <Badge variant="outline" className="bg-gray-100">Not Started</Badge>;
    }

    if (clocking.clock_in && !clocking.clock_out) {
      return <Badge className="bg-green-500">On Duty</Badge>;
    }

    if (clocking.clock_in && clocking.clock_out) {
      return <Badge variant="outline" className="bg-blue-100">Completed</Badge>;
    }

    return <Badge variant="outline">Pending</Badge>;
  };

  // Format time from ISO or time string
  const formatTime = (timeValue: string | null) => {
    if (!timeValue) return "-";

    try {
      // If it's a full ISO string
      if (timeValue.includes('T')) {
        return format(new Date(timeValue), "HH:mm");
      }
      // If it's just time string (HH:MM:SS)
      if (timeValue.includes(':')) {
        return timeValue.substring(0, 5);
      }
      return timeValue;
    } catch {
      return timeValue;
    }
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

  // Apply filters
  useEffect(() => {
    let filtered = drivers;

    if (driverFilter !== "all") {
      filtered = filtered.filter((d) => d.user.id.toString() === driverFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => {
        const status = d.clocking
          ? d.clocking.clock_out
            ? "completed"
            : d.clocking.clock_in
              ? "on_duty"
              : "pending"
          : "not_started";
        return status === statusFilter;
      });
    }

    setFilteredDrivers(filtered);
  }, [driverFilter, statusFilter, drivers]);

  useEffect(() => {
    fetchDriversRota();
  }, [today]);

  if (loading) {
    return <div className="p-6 flex justify-center">Loading drivers rota...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <TooltipProvider>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Clock In Modal */}
        {selectedDriver && (
          <ClockInModal
            isOpen={isClockInModalOpen}
            onClose={() => {
              setIsClockInModalOpen(false);
              setSelectedDriver(null);
            }}
            onConfirm={handleClockInConfirm}
            driverName={selectedDriver.name}
            shiftName={selectedDriver.shiftName}
            scheduledTime={selectedDriver.scheduledTime}
          />
        )}

        {/* Clock Out Modal */}
        {selectedDriver && (
          <ClockOutModal
            isOpen={isClockOutModalOpen}
            onClose={() => {
              setIsClockOutModalOpen(false);
              setSelectedDriver(null);
            }}
            onConfirm={handleClockOutConfirm}
            driverName={selectedDriver.name}
            shiftName={selectedDriver.shiftName}
            clockInTime={selectedDriver.clockInTime}
          />
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Driver Clock In/Out</h1>
              <p className="text-sm text-gray-500">
                {format(new Date(today), "EEEE, dd MMMM yyyy")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? "s" : ""} on duty today
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 rounded-lg">
            <div className="flex-1 flex gap-3 items-center min-w-[200px]">
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.user.id} value={driver.user.id.toString()}>
                      {driver.user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={fetchDriversRota}
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

            <div className="min-w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="on_duty">On Duty</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setDriverFilter("all");
                setStatusFilter("all");
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Drivers Table */}
        <div className=" rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Drivr</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => {
                  const buttonState = getButtonState(driver);
                  const shift = driver.child_rota.shift;
                  const clockInReason = parseReason(driver.clocking?.clock_in_reason || null);
                  const clockOutReason = parseReason(driver.clocking?.clock_out_reason || null);

                  return (
                    <TableRow key={`${driver.user.id}-${driver.child_rota.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">

                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{driver.user.full_name}</div>

                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{shift.name}</span>
                          {role === 'superadmin' && (
                            <div className="text-xs text-gray-500">
                              £{shift.rate_per_hours}/hr
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{shift.hours_from.substring(0, 5)}</div>
                          <div className="text-gray-500 text-xs">
                            to {shift.hours_to.substring(0, 5)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {driver.clocking?.clock_in ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatTime(driver.clocking.clock_in)}
                              </span>
                              {driver.clocking.is_late_clock_in && (
                                <Badge variant="destructive" className="text-xs">
                                  Late
                                </Badge>
                              )}
                            </div>
                            {/* Clock In Reason with Shadcn Tooltip */}
                            {clockInReason.category && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-blue-600 cursor-help flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md w-fit hover:bg-blue-100 transition-colors">
                                    <Info className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">
                                      In: {clockInReason.category}
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
                                          {clockInReason.category}
                                        </span>
                                      </div>
                                      {clockInReason.details && (
                                        <div>
                                          <span className="text-gray-400 text-xs">Details:</span>
                                          <p className="mt-0.5 text-xs text-gray-100 bg-gray-800 p-2 rounded">
                                            {clockInReason.details}
                                          </p>
                                        </div>
                                      )}
                                      {driver.clocking?.clock_in && (
                                        <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                                          <span className="text-gray-400 text-xs">Clocked in at:</span>
                                          <span className="ml-1 text-xs font-medium">
                                            {formatTime(driver.clocking.clock_in)}
                                          </span>
                                          {driver.clocking.is_late_clock_in && (
                                            <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                                              Late
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.clocking?.clock_out ? (
                          <div className="space-y-1">
                            <span className="font-medium">
                              {formatTime(driver.clocking.clock_out)}
                            </span>
                            {/* Clock Out Reason with Shadcn Tooltip */}
                            {clockOutReason.category && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-orange-600 cursor-help flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md w-fit hover:bg-orange-100 transition-colors">
                                    <Info className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">
                                      Out: {clockOutReason.category}
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
                                          {clockOutReason.category}
                                        </span>
                                      </div>
                                      {clockOutReason.details && (
                                        <div>
                                          <span className="text-gray-400 text-xs">Details:</span>
                                          <p className="mt-0.5 text-xs text-gray-100 bg-gray-800 p-2 rounded">
                                            {clockOutReason.details}
                                          </p>
                                        </div>
                                      )}
                                      {driver.clocking?.clock_out && (
                                        <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                                          <span className="text-gray-400 text-xs">Clocked out at:</span>
                                          <span className="ml-1 text-xs font-medium">
                                            {formatTime(driver.clocking.clock_out)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(driver)}
                      </TableCell>
                      <TableCell className="text-right">
                        {buttonState.showClockIn && (
                          <Button
                            onClick={() => openClockInModal(driver)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Clock In
                          </Button>
                        )}

                        {buttonState.showClockOut && !buttonState.disabled && (
                          <Button
                            onClick={() => openClockOutModal(driver)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Clock3 className="w-4 h-4 mr-2" />
                            Clock Out
                          </Button>
                        )}

                        {buttonState.showClockOut && buttonState.disabled && (
                          <Button
                            disabled
                            size="sm"
                            variant="outline"
                          >
                            <Clock3 className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">No drivers on duty today</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>


      </div>
    </TooltipProvider>
  );
};

export default DriverClockInOut;