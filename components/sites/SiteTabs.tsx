"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Truck, Users, MoveUpRight, RefreshCcw, Trash2 } from "lucide-react";
import GradientButton from "@/app/utils/GradientButton";
import Link from "next/link";
import AddSiteForm from "@/components/sites/add-site";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";
import ExportButton from "@/app/utils/ExportButton";

// Define interfaces
interface OperationHour {
  id: number;
  day_of_week: number;
  day_label: string;
  is_open_24_hours: boolean;
  is_closed: boolean;
  opens_at: string;
  closes_at: string;
}

interface Presence {
  early: string;
  middle: string;
  night: string;
}

interface Staff {
  driver: number;
  admin: number;
  mechanic: number;
  total: number;
}

interface Site {
  id: number;
  name: string;
  image: string | null;
  status: string;
  notes: string | null;
  postcode: string;
  address: string;
  position: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  radius_m: number;
  latitude: number;
  contact_position: string | null;
  longitude: number;
  number_of_allocated_vehicles: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  operation_hours: OperationHour[];
  warnings: string[];
  presence: Presence;
  max_staff_allowed: number;
  staff: Staff;
}

export default function SiteGrid() {
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [siteNameFilter, setSiteNameFilter] = useState<string>("all");
  const [contactPositionFilter, setContactPositionFilter] = useState<string>("all");
  const [contactNameFilter, setContactNameFilter] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");

  const cookies = useCookies();
  const token = cookies.get("access_token");
  const { showToast } = useToast();

  // Fetch sites data from API
  const fetchSites = async () => {
    if (!token) {
      setError("No access token found. Please log in.");
      setLoading(false);
      showToast("No access token found. Please log in.", "error");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/sites/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      if (!response.ok) throw new Error(`Failed to fetch sites: ${response.status}`);
      const data: Site[] = await response.json();
      setSites([...data]);
      setFilteredSites([...data]);
      showToast("Sites refreshed successfully", "success");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle site deletion
  const handleDeleteSite = async (siteId: number) => {
    if (!token) {
      showToast("No access token found.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete site: ${response.status}`);
      }

      // Remove site from state
      setSites((prev) => prev.filter((site) => site.id !== siteId));
      setFilteredSites((prev) => prev.filter((site) => site.id !== siteId));

      showToast("Site deleted successfully", "success");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete site";
      console.error("Delete error:", err);
      showToast(errorMessage, "error");
    }
  };

  // Get unique values for filter dropdowns
  const uniqueSiteNames = Array.from(new Set(sites.map(site => site.name))).sort();
  const uniqueContactPositions = Array.from(new Set(sites.map(site => site.contact_position || "N/A"))).sort();
  const uniqueContactNames = Array.from(new Set(sites.map(site => site.created_by || "N/A"))).sort();

  const handleSiteCreated = () => {
    setOpen(false);
    showToast("Site created successfully!", "success");
    fetchSites();
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...sites];

    if (searchQuery) {
      filtered = filtered.filter((site) =>
        [site.name, site.address, site.postcode]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((site) =>
        statusFilter === "active"
          ? !site.notes?.includes("Temporarily reduced")
          : site.notes?.includes("Temporarily reduced")
      );
    }

    if (shiftFilter !== "all") {
      filtered = filtered.filter((site) => site.presence[shiftFilter as keyof Presence]);
    }

    if (vehicleFilter) {
      const vehicleNum = parseInt(vehicleFilter);
      if (!isNaN(vehicleNum)) {
        filtered = filtered.filter(
          (site) => site.number_of_allocated_vehicles >= vehicleNum
        );
      }
    }

    if (siteNameFilter !== "all") {
      filtered = filtered.filter((site) => site.name === siteNameFilter);
    }

    if (contactPositionFilter !== "all") {
      filtered = filtered.filter((site) => 
        (site.contact_position || "N/A") === contactPositionFilter
      );
    }

    if (contactNameFilter !== "all") {
      filtered = filtered.filter((site) => 
        (site.created_by || "N/A") === contactNameFilter
      );
    }

    if (activeStatusFilter !== "all") {
      filtered = filtered.filter((site) => 
        site.status.toLowerCase() === activeStatusFilter.toLowerCase()
      );
    }

    setFilteredSites(filtered);
  }, [sites, statusFilter, shiftFilter, vehicleFilter, searchQuery, siteNameFilter, contactPositionFilter, contactNameFilter, activeStatusFilter]);

  useEffect(() => {
    fetchSites();
  }, []);

  if (loading && sites.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading Sites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error: {error}
        <button
          type="button"
          className="ml-4 p-2 text-blue-600 underline"
          onClick={fetchSites}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <section className="p-8 bg-white min-h-screen">
        <div className="flex flex-col gap-6 mb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
              <p className="text-sm text-muted-foreground">Browse and manage all available sites</p>
            </div>

            <div className="flex gap-2 items-center">
              <button
                type="button"
                disabled={loading}
                onClick={fetchSites}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <RefreshCcw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
              </button>

              <ExportButton data={sites} fileName="Site_data" />

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <GradientButton text="Add Site" Icon={Plus} />
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-6 rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Add New Site</DialogTitle>
                  </DialogHeader>
                  <AddSiteForm onSuccess={handleSiteCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Input
              placeholder="Search by name, address, or postcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-xs"
            />

            <Select value={siteNameFilter} onValueChange={setSiteNameFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Site Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Site Names</SelectItem>
                {uniqueSiteNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contactPositionFilter} onValueChange={setContactPositionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Contact Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {uniqueContactPositions.map((pos) => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contactNameFilter} onValueChange={setContactNameFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Contact Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Names</SelectItem>
                {uniqueContactNames.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeStatusFilter} onValueChange={setActiveStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-evenly items-center flex-wrap gap-6">
          {filteredSites.map((site) => (
            <div key={site.id} className="relative">
              {/* Site Card Link */}
              <Link
                href={`/dashboard/sites/${site.id}`}
                className="rounded-xl shadow-sm border w-[350px] h-[420px] bg-white border-gray-200 overflow-hidden p-2 block"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-delete]")) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-semibold text-sm text-gray-800">{site.name}</h2>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge
                        className={`text-xs font-medium ${
                          site.status === "inactive"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {site.status === "active" ? "Active" : "Inactive"}
                      </Badge>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center cursor-pointer bg-rose w-6 justify-center rounded-full h-6">
                            <span className="text-white text-xs font-medium">{site.warnings.length}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border-0 text-black">
                          <ul className="list-disc pl-4">
                            {site.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between px-2 items-center min-w-full text-gray-500 mt-1">
                  <div className="flex items-center text-sm w-fit">
                    <MapPin className="w-4 h-4 text-rose" />
                    {site.address.split(",")[1]?.trim() || "Unknown City"}
                  </div>
                  <div className="flex items-center w-fit">
                    <p className="text-xs w-fit text-gray-400">ZipCode: {site.postcode}</p>
                  </div>
                </div>

                <div className="px-4 mt-3 flex gap-2 flex-wrap">
                  {Object.entries(site.presence).map(([shiftName, person], idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <Badge
                          className={`text-[12px] cursor-pointer h-[20px] px-2 py-0 font-medium ${
                            person ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {shiftName.charAt(0).toUpperCase() + shiftName.slice(1)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white text-black">
                        <p>{person || "None"}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <div className="bg-[#FFF0EB] mt-3 mx-4 rounded-lg px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#F97316] font-semibold">
                    <Truck className="w-4 h-4" />
                    Authorized Vehicle
                  </div>
                  <div className="text-[#F97316] font-bold text-sm">
                    {site.number_of_allocated_vehicles}
                  </div>
                </div>

                <div className="bg-gray-100 mt-3 mx-4 rounded-lg px-4 py-3">
                  <div className="flex justify-between items-center text-sm font-semibold text-[#B91C1C]">
                    <div className="flex items-center gap-2">
                      <Users className="w-6 h-6 text-orange" />
                      <span className="text-black text-lg font-bold">Staff on Site</span>
                    </div>
                    <span>{`${site.staff.total}/${site.max_staff_allowed}`}</span>
                  </div>
                  <div className="flex gap-2 mt-2 text-xs justify-evenly items-center">
                    {[
                      { role: "Driver", count: site.staff.driver },
                      { role: "Admin", count: site.staff.admin },
                      { role: "Mechanic", count: site.staff.mechanic },
                    ].map((role, idx) => (
                      <div
                        key={idx}
                        className="text-white flex flex-col justify-center items-center px-2 py-1 rounded-full"
                      >
                        <span className="text-black text-lg font-medium">{role.count}</span>
                        <span className="text-xs w-fit text-gray-800">{role.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-4 px-4">
                  <p className="text-black text-[13px] font-semibold">
                    Contact Position: {site.contact_position || "N/A"}
                  </p>
                  <p className="mt-1">Created By: {site.created_by}</p>
                  <p className="mt-1">
                    Last Updated:{" "}
                    {new Date(site.updated_at).toLocaleString("en-GB", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>

                <div className="px-4 mt-3 flex gap-2 justify-end pb-4">
                  <button className="text-md w-full cursor-pointer py-2 rounded-sm text-orange bg-gray-100 flex items-center justify-center gap-2">
                    More Details <MoveUpRight size={16} />
                  </button>
                   <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    data-delete="true"
                    className="px-4 py-1  rounded-sm bg-red-100 hover:bg-red-200 text-red-600 transition-colors shadow-md"
                    aria-label={`Delete site ${site.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Site Permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will <strong>permanently delete</strong> the site &quot;<strong>{site.name}</strong>&quot;.<br />
                      All associated data will be lost. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteSite(site.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Delete Site
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
                </div>
              </Link>

              {/* Delete Button with Confirmation */}
             
            </div>
          ))}
        </div>
      </section>
    </TooltipProvider>
  );
}