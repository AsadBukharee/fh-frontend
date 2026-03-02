/* eslint-disable react/no-unescaped-entities */
// components/assign-driver-dialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Car,
  Calendar,
  User,
  CheckCircle,
  Shield,
  AlertCircle,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useToast } from "@/app/Context/ToastContext";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

// Define TypeScript interfaces based on your API response
interface UserType {
  id: number;
  email: string;
  full_name: string;
  display_name: string;
  parent_rota_completed: boolean;
  child_rota_completed: boolean;
  contract_signing_date: string | null;
  rota_start_date: string | null;
  paid_holidays: number;
  is_active: boolean;
  contract: {
    id: number;
    name: string;
    description: string;
  } | null;
  role: string;
  site: Array<{
    id: number;
    name: string;
    status: string;
    image: string;
  }>;
  shifts_count: number;
  avatar: string | null;
}

interface Driver {
  id: number; // This is the profile ID
  user: UserType;
  warnings: string[];
  missing_attributes: string[];
  source: string;
  next_step: string;
  is_profile_completed: boolean;
  remarks: string;
  profile_status: "approved" | "review" | "not_approved";
  have_other_jobs: boolean;
  have_other_jobs_note: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  account_no: string | null;
  sort_code: string | null;
  post_code: string | null;
  national_insurance_no: string | null;
  license_number: string | null;
  license_issue_number: string | null;
  last_driver_license_check_code_date: string | null;
  next_driver_check_code: string | null;
  last_tacho_download: string | null;
  next_tacho_download: string | null;
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_note: string | null;
  next_of_kin_contact: string | null;
  next_of_kin_email: string | null;
  next_of_kin_address: string | null;
  manager_name: string | null;
  signup_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AssignDriverDialogProps {
  vehicleId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
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

export default function AssignDriverDialog({
  vehicleId,
  open,
  onOpenChange,
  onSuccess,
}: AssignDriverDialogProps) {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();
  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Fetch drivers when dialog opens
  useEffect(() => {
    if (open) {
      fetchDrivers();
      // Reset state when dialog opens
      setSelectedDriver(null);
      setSearchQuery("");
    }
  }, [open]);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/profiles/driver/?profile_status=approved`,
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
        }
      );

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data.results) {
        setDrivers(data.data.results);
      } else {
        throw new Error(data.message || "Failed to fetch drivers");
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      showToast("Failed to load drivers. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter drivers based on search query
  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) {
      return drivers.filter(
        (driver) =>
          driver.user.is_active &&
          driver.profile_status === "approved" &&
          driver.user.role === "Driver"
      );
    }

    const query = searchQuery.toLowerCase().trim();
    return drivers.filter((driver) => {
      const fullName = driver.user.full_name?.toLowerCase() || "";
      const email = driver.user.email?.toLowerCase() || "";
      const phone = driver.phone?.toLowerCase() || "";
      const license = driver.license_number?.toLowerCase() || "";
      const siteNames = driver.user.site.map(s => s.name.toLowerCase()).join(" ");
      const contractName = driver.user.contract?.name.toLowerCase() || "";

      return (
        driver.user.is_active &&
        driver.profile_status === "approved" &&
        driver.user.role === "Driver" &&
        (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          license.includes(query) ||
          siteNames.includes(query) ||
          contractName.includes(query)
        )
      );
    });
  }, [drivers, searchQuery]);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-gray-500";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Active" : "Inactive";
  };

  const getProfileCompletionStatus = (isCompleted: boolean) => {
    return isCompleted ? "Complete" : "Incomplete";
  };

  const getProfileCompletionColor = (isCompleted: boolean) => {
    return isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  const handleDriverSelect = (driverId: number) => {
    setSelectedDriver(selectedDriver === driverId ? null : driverId);
  };

  const handleAssign = async () => {
    if (!selectedDriver) return;

    const selectedDriverData = drivers.find(driver => driver.id === selectedDriver);
    if (!selectedDriverData) {
      showToast("Selected driver not found", "error");
      return;
    }

    setIsAssigning(selectedDriver);

    try {
      const payload = {
        driver_id: selectedDriverData.user.id
      };

      const response = await fetch(
        `${API_URL}/api/vehicles/${vehicleId}/assign-driver/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showToast(
          `Vehicle assigned to ${selectedDriverData.user.full_name} successfully!`,
          "success"
        );

        if (onSuccess) {
          onSuccess();
        }

        onOpenChange(false);
      } else {
        throw new Error(result.message || "Assignment failed");
      }
    } catch (error: any) {
      console.error("Error assigning driver:", error);
      showToast(error.message || "Failed to assign driver. Please try again.", "error");
    } finally {
      setIsAssigning(null);
    }
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Driver to Vehicle</DialogTitle>
          <DialogDescription>
            Select a driver to assign to vehicle{" "}
            <span className="font-semibold">{vehicleId}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute z-10 left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search drivers by name, email, phone, license, or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {searchQuery && (
            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
              <Search className="h-3 w-3" />
              <span>
                Found {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-gray-600">Loading available drivers...</span>
            </div>
          ) : (
            <>
              {/* Available Drivers Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Available Drivers
                    <Badge variant="outline" className="ml-2">
                      {filteredDrivers.length} available
                    </Badge>
                    {searchQuery && filteredDrivers.length === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="ml-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchDrivers}
                      disabled={isLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                {filteredDrivers.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      {searchQuery ? (
                        <>
                          <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500 font-medium">No drivers found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            No drivers match your search for "{searchQuery}"
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSearch}
                            className="mt-4"
                          >
                            Clear search
                          </Button>
                        </>
                      ) : (
                        <>
                          <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500 font-medium">No approved drivers available</p>
                          <p className="text-sm text-gray-400 mt-1">
                            All drivers might be inactive or not approved.
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredDrivers.map((driver) => (
                      <Card
                        key={driver.id}
                        className={`transition-all hover:shadow-md cursor-pointer ${
                          selectedDriver === driver.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => handleDriverSelect(driver.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-3">
                            {/* Driver Info Row */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  {driver.user.avatar ? (
                                    <AvatarImage
                                      src={driver.user.avatar}
                                      alt={driver.user.full_name}
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(driver.user.full_name)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold truncate">
                                      {driver.user.full_name}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={`${getStatusColor(
                                        driver.user.is_active
                                      )} border-transparent text-white text-xs`}
                                    >
                                      {getStatusText(driver.user.is_active)}
                                    </Badge>
                                    {driver.user.contract && (
                                      <Badge variant="secondary" className="text-xs">
                                        {driver.user.contract.name}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 truncate">
                                    {driver.user.email}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    {driver.phone && (
                                      <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {driver.phone}
                                      </p>
                                    )}
                                    {driver.user.shifts_count > 0 && (
                                      <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {driver.user.shifts_count} shifts
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Selection Checkbox */}
                              <Checkbox
                                checked={selectedDriver === driver.id}
                                onCheckedChange={() => handleDriverSelect(driver.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Details Section */}
                            <div className="space-y-2 pl-16">
                              {/* Sites */}
                              {driver.user.site.length > 0 && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {driver.user.site.map(s => s.name).join(", ")}
                                  </span>
                                </div>
                              )}

                              {/* License Info */}
                              {(driver.license_number || driver.national_insurance_no) && (
                                <div className="flex items-center gap-4 text-sm flex-wrap">
                                  {driver.license_number && (
                                    <span className="flex items-center gap-1 text-gray-600">
                                      <Shield className="h-3 w-3" />
                                      License: {driver.license_number}
                                    </span>
                                  )}
                                  {driver.national_insurance_no && (
                                    <span className="flex items-center gap-1 text-gray-600">
                                      <Shield className="h-3 w-3" />
                                      NI: {driver.national_insurance_no}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Warnings */}
                              {driver.warnings.length > 0 && (
                                <div className="space-y-1">
                                  {driver.warnings.slice(0, 2).map((warning, index) => (
                                    <div
                                      key={index}
                                      className={`flex items-center gap-1 text-xs ${
                                        warning.includes("✅")
                                          ? "text-green-600"
                                          : warning.includes("⏳")
                                          ? "text-amber-600"
                                          : warning.includes("⚠️")
                                          ? "text-red-600"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {warning.includes("✅") ? (
                                        <CheckCircle className="h-3 w-3" />
                                      ) : warning.includes("⏳") ? (
                                        <AlertCircle className="h-3 w-3" />
                                      ) : warning.includes("⚠️") ? (
                                        <AlertCircle className="h-3 w-3" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3" />
                                      )}
                                      <span className="truncate">
                                        {warning.replace(/[✅⏳⚠️]/g, "").trim()}
                                      </span>
                                    </div>
                                  ))}
                                  {driver.warnings.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{driver.warnings.length - 2} more warnings
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Profile Completion Status */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <Badge
                                  variant="outline"
                                  className={`${getProfileCompletionColor(
                                    driver.is_profile_completed
                                  )} border-transparent`}
                                >
                                  {getProfileCompletionStatus(driver.is_profile_completed)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              {drivers.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm flex-1">
                        <div className="text-center">
                          <div className="font-semibold">{drivers.length}</div>
                          <div className="text-gray-600 text-xs">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">
                            {filteredDrivers.length}
                          </div>
                          <div className="text-gray-600 text-xs">Filtered</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {drivers.filter(d => d.is_profile_completed).length}
                          </div>
                          <div className="text-gray-600 text-xs">Complete</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {drivers.filter(d => d.user.is_active).length}
                          </div>
                          <div className="text-gray-600 text-xs">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {drivers.filter(d => d.user.shifts_count > 100).length}
                          </div>
                          <div className="text-gray-600 text-xs">Experienced</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {drivers.filter(d => d.user.contract?.name.includes("Probation")).length}
                          </div>
                          <div className="text-gray-600 text-xs">Probation</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer with assign option */}
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex-1 text-sm text-gray-500">
            {selectedDriver ? (
              <span>
                Selected:{" "}
                <span className="font-semibold">
                  {drivers.find(d => d.id === selectedDriver)?.user.full_name}
                </span>
              </span>
            ) : searchQuery ? (
              <span>Searching drivers for "{searchQuery}"</span>
            ) : (
              <span>Select a driver to assign</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={!!isAssigning}
            >
              Cancel
            </Button>

            <Button
              onClick={handleAssign}
              disabled={!selectedDriver || isAssigning !== null}
              className="gap-2"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Assign Selected Driver
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}