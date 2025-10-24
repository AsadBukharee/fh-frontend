"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Users,
  MapPin,
  TriangleAlert,
  Clock,
  Save,
  Edit,
  X,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { format, parse } from "date-fns";
import { formatDmy } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import ImageUploader from "@/components/Media/UploadImage";
import Image from "next/image";

// ---------------------- Types ----------------------
interface OperationHour {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  is_open_24_hours: boolean;
}

const dayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Staff {
  driver: number;
  admin: number;
  mechanic: number;
  total: number;
}

interface Presence {
  early: string;
  middle: string;
  night: string;
  day: string;
  supervisor: string;
}

interface Site {
  id: number;
  name: string;
  image: string | null;
  notes: string | null;
  postcode: string;
  address: string;
  max_staff_allowed: number;
  contact_position: string;
  contact_phone: string;
  contact_name:string;
  contact_email: string;
  radius_m: number;
  latitude: number;
  longitude: number;
  number_of_allocated_vehicles: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  operation_hours: OperationHour[];
  warnings: string[];
  presence: Presence;
  staff: Staff;
}

// ---------------------- Helpers ----------------------
const initializeDefaultOperationHours = (): OperationHour[] =>
  Array.from({ length: 7 }, (_, index) => ({
    day_of_week: index,
    opens_at: "09:00",
    closes_at: "17:00",
    is_closed: false,
    is_open_24_hours: false,
  }));

const formatTime = (time: string | null) => {
  if (!time) return "N/A";
  try {
    const parsed = parse(time, "HH:mm", new Date());
    return format(parsed, "h:mm a");
  } catch {
    return time;
  }
};

const getStatusBadgeColors = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getDisplayStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};






const getStaffBreakdown = (staff: Staff) => [
  { role: "Driver", count: staff.driver },
  { role: "Admin", count: staff.admin },
  { role: "Mechanic", count: staff.mechanic },
];

// ---------------------- Component ----------------------
export default function SiteDetails() {
  const params = useParams();
  const siteId = String(params?.id || "1");

  const cookies = useCookies();
  const token = cookies.get("access_token");

  const [site, setSite] = useState<Site | null>(null);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");

  const fetchSite = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/sites/${siteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as Site;

      const updatedData: Site = {
        ...data,
        operation_hours:
          data.operation_hours && data.operation_hours.length
            ? data.operation_hours.map((h) => ({
                ...h,
                opens_at: h.opens_at ?? "09:00",
                closes_at: h.closes_at ?? "17:00",
              }))
            : initializeDefaultOperationHours(),
        warnings: data.warnings || [],
        presence: data.presence,
        staff: data.staff,
      };

      setSite(updatedData);
      setEditSite(updatedData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSite();
  }, [siteId, token]);

  const handleInputChange = (field: keyof Site, value: any) => {
    setEditSite((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleStatusChange = (value: string) => {
    if (!editSite || value === editSite.status) return;
    setPendingStatus(value);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    handleInputChange("status", pendingStatus);
    setStatusDialogOpen(false);
  };

 

  const handleOperationHourChange = (
    index: number,
    field: keyof OperationHour,
    value: any
  ) => {
    setEditSite((prev) => {
      if (!prev) return prev;
      const updatedHours = [...prev.operation_hours];
      updatedHours[index] = { ...updatedHours[index], [field]: value };
      if (field === "is_closed" && value === true) {
        updatedHours[index].opens_at = null;
        updatedHours[index].closes_at = null;
        updatedHours[index].is_open_24_hours = false;
      }
      if (field === "is_open_24_hours" && value === true) {
        updatedHours[index].opens_at = null;
        updatedHours[index].closes_at = null;
        updatedHours[index].is_closed = false;
      }
      return { ...prev, operation_hours: updatedHours };
    });
  };

  const validateOperationHours = (hours: OperationHour[]) => {
    console.log(hours);
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    for (const hour of hours) {
      if (hour.is_closed || hour.is_open_24_hours) continue;
      if (!hour.opens_at || !hour.closes_at) return false;
      if (!timeRegex.test(hour.opens_at) || !timeRegex.test(hour.closes_at)) return false;
      if (hour.opens_at >= hour.closes_at) return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editSite) return;

    if (!validateOperationHours(editSite.operation_hours)) {
      window.alert("Please fix operation hours. Ensure open < close and valid times.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteData = {
        name: editSite.name,
        image: editSite.image,
        notes: editSite.notes,
        postcode: editSite.postcode,
        address: editSite.address,
        contact_position: editSite.contact_position,
        contact_phone: editSite.contact_phone,
        contact_email: editSite.contact_email,
        radius_m: editSite.radius_m,
        latitude: editSite.latitude,
        longitude: editSite.longitude,
        number_of_allocated_vehicles: editSite.number_of_allocated_vehicles,
        max_staff_allowed: editSite.max_staff_allowed,
        status: editSite.status,
        presence: editSite.presence,
        staff: editSite.staff,
        warnings: editSite.warnings,
      };

      if (!token) {
        const now = new Date().toISOString();
        const updatedLocal = { ...editSite, updated_at: now };
        setSite(updatedLocal);
        setEditSite(updatedLocal);
        setIsEditing(false);
        window.alert("Saved (demo mode)");
        return;
      }

      const patchRes = await fetch(`${API_URL}/api/sites/${siteId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(siteData),
      });

      if (!patchRes.ok) throw new Error("Failed to update site");

      const operationHoursPayload = {
        hours: editSite.operation_hours.map((hour) => ({
          day_of_week: hour.day_of_week,
          opens_at: hour.is_closed || hour.is_open_24_hours ? null : hour.opens_at,
          closes_at: hour.is_closed || hour.is_open_24_hours ? null : hour.closes_at,
          is_closed: hour.is_closed,
          is_open_24_hours: hour.is_open_24_hours,
        })),
      };

      const hoursRes = await fetch(`${API_URL}/api/sites/${siteId}/hours/bulk/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(operationHoursPayload),
      });

      if (!hoursRes.ok) throw new Error("Failed to update operation hours");

      await fetchSite();
      setIsEditing(false);
      window.alert("Saved successfully");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      window.alert("Failed to save changes: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadSuccess = (url: string) => {
    setEditSite((prev) => (prev ? { ...prev, image: url } : prev));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/logos/logo.png"; // Replace with your placeholder image path
  };

  const staffBreakdown = site ? getStaffBreakdown(site.staff) : [];


  const buildFuelData = () => {
    return [
      { month: "Jan", fuel: 1.0 },
      { month: "Feb", fuel: 1.2 },
      { month: "Mar", fuel: 1.5 },
      { month: "Apr", fuel: 2.0 },
      { month: "May", fuel: 5.67 },
      { month: "Jun", fuel: 3.0 },
      { month: "Jul", fuel: 2.8 },
      { month: "Aug", fuel: 3.2 },
      { month: "Sep", fuel: 2.9 },
      { month: "Oct", fuel: 1.8 },
      { month: "Nov", fuel: 1.5 },
    ];
  };

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (error && !site) return <div className="p-6 text-red-600">{error}</div>;
  if (!site || !editSite) return <div className="p-6 text-gray-700">Site not found</div>;

  return (
    <div className="p-6 bg-white  overflow-hidden text-gray-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sites Details</h1>
          <p className="text-sm text-gray-500">See and edit site details</p>
        </div>
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditSite(site);
                }}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
          <Card className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span>Site Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-500">Site Name</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.name}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Site Address</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.address}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Postcode</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.postcode}
                      onChange={(e) => handleInputChange("postcode", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.postcode}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Radius</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={String(editSite.radius_m)}
                      onChange={(e) => handleInputChange("radius_m", parseInt(e.target.value || "0"))}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.radius_m}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Longitude</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(editSite.longitude)}
                      onChange={(e) => handleInputChange("longitude", parseFloat(e.target.value || "0"))}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.longitude?.toFixed(4)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Latitude</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(editSite.latitude)}
                      onChange={(e) => handleInputChange("latitude", parseFloat(e.target.value || "0"))}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.latitude?.toFixed(4)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Name</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.contact_name}
                      onChange={(e) => handleInputChange("contact_name", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.contact_name}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Position</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.contact_position}
                      onChange={(e) => handleInputChange("contact_position", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.contact_position}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Email</p>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editSite.contact_email}
                      onChange={(e) => handleInputChange("contact_email", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.contact_email}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Phone</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.contact_phone}
                      onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.contact_phone}</p>
                  )}
                </div>
              </div>
         
            </Card>
            {/* <div className="flex font-bold gap-2 text-gray-800">
              <Truck className="text-orange-600" />
              <h1>Vehicle Information</h1>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <span>Authorized Vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={String(editSite.number_of_allocated_vehicles)}
                      onChange={(e) => handleInputChange("number_of_allocated_vehicles", parseInt(e.target.value || "0"))}
                      className="w-1/2 border-gray-300"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gray-800">{site.number_of_allocated_vehicles}</span>
                  )}
                  <Truck className="w-12 h-12 opacity-50 text-gray-400" />
                </div>
              </Card>
              <Card className="p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <span>Max Staff Allowed</span>
                </div>
                <div className="flex justify-between items-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={String(editSite.max_staff_allowed)}
                      onChange={(e) => handleInputChange("max_staff_allowed", parseInt(e.target.value || "0"))}
                      className="w-1/2 border-gray-300"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-gray-800">{site?.max_staff_allowed || 0}</span>
                  )}
                  <Users className="w-12 h-12 opacity-50 text-gray-400" />
                </div>
              </Card>
            </div>
            <Card className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Users className="w-5 h-5 text-orange-600" />
                <span>Current Staff onsite</span>
              </div>
              
                <div className="flex justify-evenly items-center mt-2">
                  {staffBreakdown.map((role, index) => (
                    <div key={index} className="bg-gray-100 w-[70px] h-[70px] p-2 rounded-md text-center">
                      <p className="text-lg font-bold text-gray-800">{role.count}</p>
                      <p className="text-xs text-gray-500">{role.role}</p>
                    </div>
                  ))}
                </div>
             
           
            </Card>
           
            <Card className="p-4 rounded-lg bg-white border border-gray-200 shadow">
              <h3 className="text-gray-800 font-semibold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" /> Operational Statistics
              </h3>

              {/* Top Stats: Employees and Vehicles */}
              <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-orange-50/20 rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Employees</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Total Today</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">30</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">21</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Vehicles</p>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Total Today</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">30</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">18</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
              </div>

              {/* Fuel Usage Chart */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Fuel Usage (L)</h4>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">May</p>
                    <p className="text-lg font-bold text-purple-600">5.67 L</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={buildFuelData()} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${value} L`} domain={[0, 6]} />
                    <Tooltip formatter={(value) => [`${value} L`, 'Fuel Usage']} />
                    <Bar 
                      dataKey="fuel" 
                      radius={[4, 4, 0, 0]} 
                      fill={'#ffbbed'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Week and Month Totals */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">This Week</p>
                  <p className="text-xl font-bold text-gray-800">1.250</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-xl font-bold text-gray-800">4.850</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="w-full h-[200px] rounded-md bg-gray-50 flex justify-center items-center border border-gray-200 overflow-hidden">
                {editSite.image ? (
                  <Image 
                    src={editSite.image} 
                    width={400} 
                    unoptimized
                    height={300} 
                    className="w-full h-full object-cover" 
                    alt="site"
                    
                    onError={handleImageError}
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>
              {isEditing && (
                <ImageUploader onUploadSuccess={handleImageUploadSuccess} />
              )}
            </div>
            <Card className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-600 font-bold">Site Alerts</span>
                </div>
            
              </div>
              <ul className="text-sm text-gray-700 list-disc pl-4">
                {site.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Last Updated: {new Date(site.updated_at).toLocaleDateString("en-GB")}
              </p>
            </Card>
            <Card className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Operation Hours</span>
              </div>
              {editSite.operation_hours.map((hour, index) => (
                <div
                  key={index}
                  className={isEditing ? "border border-gray-100 rounded-xl p-4 flex flex-col space-y-4 shadow-sm" : "flex flex-col"}
                >
                  <div className={isEditing ? "flex flex-col" : "flex flex-row justify-between"}>
                    <span className="text-base font-semibold text-orange-600">
                      {dayLabels[hour.day_of_week]}
                    </span>
                    {isEditing ? (
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">Closed</span>
                          <Switch
                            checked={hour.is_closed}
                            disabled={hour.is_open_24_hours}
                            onCheckedChange={(checked) => handleOperationHourChange(index, "is_closed", checked)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">24 hrs</span>
                          <Switch
                            checked={hour.is_open_24_hours}
                            disabled={hour.is_closed}
                            onCheckedChange={(checked) => handleOperationHourChange(index, "is_open_24_hours", checked)}
                          />
                        </div>
                      </div>
                    ) : hour.is_open_24_hours ? (
                      <span className="text-sm font-medium text-orange-600">24 hrs</span>
                    ) : null}
                       {isEditing ? (
                    <div className="flex gap-4">
                      <Input
                        type="time"
                        value={hour.opens_at ?? ""}
                        onChange={(e) => handleOperationHourChange(index, "opens_at", e.target.value)}
                        disabled={hour.is_open_24_hours || hour.is_closed}
                        className="flex-1 text-sm border-gray-300"
                      />
                      <Input
                        type="time"
                        value={hour.closes_at ?? ""}
                        onChange={(e) => handleOperationHourChange(index, "closes_at", e.target.value)}
                        disabled={hour.is_open_24_hours || hour.is_closed}
                        className="flex-1 text-sm border-gray-300"
                      />
                    </div>
                  ) : !hour.is_closed && !hour.is_open_24_hours ? (
                    <div className="flex gap-4 text-sm text-gray-700">
                      <span className="px-3 py-2 rounded-lg bg-gray-100">{formatTime(hour.opens_at)}</span>
                      <span className="px-3 py-2 rounded-lg bg-gray-100">{formatTime(hour.closes_at)}</span>
                    </div>
                  ) : hour.is_closed ? (
                    <span className="text-sm text-gray-700">Closed</span>
                  ) : null}
                  </div>
               
                </div>
              ))}
            </Card>
            <Card className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Quick Stats</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Site Status</span>
                  {isEditing ? (
                    <Select value={editSite.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${getStatusBadgeColors(site.status)} text-xs font-medium`}>
                      {getDisplayStatus(site.status)}
                    </Badge>
                  )}
                </div>
              
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Active Alerts</span>
                  <Badge className="bg-red-100 text-red-700 text-xs font-medium">
                    {site.warnings.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Latest Update</span>
                  <span className="text-sm text-gray-700">{formatDmy(site.updated_at)}</span>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Users className="w-5 h-5 text-orange-600" />
                <span>Today&apos;s Presence</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Early Shift</span>
                
                    <span>{site.presence.early}</span>
             
                </div>
                <div className="flex justify-between">
                  <span>Middle Shift</span>
                 
                    <span>{site.presence.middle}</span>
                
                </div>
                <div className="flex justify-between">
                  <span>Day</span>
                  
                    <span>{site.presence.day}</span>
                 
                </div>
                <div className="flex justify-between">
                  <span>Night Shift</span>
                
                    <span>{site.presence.night}</span>
                
                </div>
                <div className="flex justify-between">
                  <span>Supervisor</span>
                 
                    <span>{site.presence.supervisor}</span>
                
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the site status to {getDisplayStatus(pendingStatus)}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}