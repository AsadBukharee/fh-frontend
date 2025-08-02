"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Truck, Users, MoveUpRight, RefreshCcw } from "lucide-react";
import GradientButton from "@/app/utils/GradientButton";
import Link from "next/link";
import AddSiteForm from "@/components/add-site";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

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
  staff: Staff;
}

export default function SiteGrid() {
  const [sites, setSites] = useState<Site[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cookies = useCookies();
  const token = cookies.get('access_token');

  // Fetch sites data from API
  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sites/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch sites");
      const data: Site[] = await response.json();
      setSites(data);
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading Sites...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <TooltipProvider>
      <section className="p-8 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sites</h1>
            <p className="text-sm text-gray-500">Browse all available sites</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="cursor-pointer" onClick={() => {
              fetchSites();
            }}>
              <RefreshCcw className="w-4 h-4 text-gray-500" />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <GradientButton text="Add Site" Icon={Plus} />
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Add New Site</DialogTitle>
                </DialogHeader>
                <AddSiteForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex justify-evenly items-center flex-wrap gap-6">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="rounded-xl shadow-sm border w-[320px] h-[420px] bg-white border-gray-200 overflow-hidden p-2"
            >
              <div className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-sm text-gray-800">{site.name}</h2>
                  </div>
                  <div className="flex gap-1">
                    <Badge
                      className={`text-xs font-medium ${
                        site.notes?.includes("Temporarily reduced")
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {site.notes?.includes("Temporarily reduced") ? "On Hold" : "Active"}
                    </Badge>
                    <div className="flex items-center cursor-pointer bg-rose w-6 justify-center rounded-full h-6 gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-white text-xs font-medium">{site.warnings.length}</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border-0 text-black">
                          <ul className="list-disc border-0 pl-4">
                            {site.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
                  <span>{`${site.staff.total}/${site.staff.total}`}</span>
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
                  Position: {site.contact_position || "N/A"}
                </p>
                <p className="mt-1">Created By: {site.created_by}</p>
                <p className="mt-1">
                  Last Updated:{" "}
                  {new Date(site.updated_at).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>

              <div className="px-4 mt-3 flex justify-end pb-4">
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="text-md w-full cursor-pointer py-2 rounded-sm text-orange bg-gray-100 flex items-center justify-center gap-2"
                >
                  More Details <MoveUpRight size={16} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </TooltipProvider>
  );
}