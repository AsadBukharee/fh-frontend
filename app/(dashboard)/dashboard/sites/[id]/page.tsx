"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Separator } from "@/components/ui/separator";

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
}

interface Site {
  id: number;
  name: string;
  image: string | null;
  notes: string | null;
  postcode: string;
  address: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
  radius_m: number;
  latitude: number;
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
    case "Active":
      return "bg-green-100 text-green-700";
    case "On Hold":
      return "bg-yellow-100 text-yellow-700";
    case "Completed":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getSeverityBadgeColors = (severity: string) => {
  switch (severity) {
    case "High":
      return "bg-red-100 text-red-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Low":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getComplianceBadgeColors = (status: string) => {
  switch (status) {
    case "Over Capacity":
      return "bg-red-100 text-red-700";
    case "In Compliance":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const deriveSeverity = (warnings: string[]) => {
  if (
    warnings.some((w) =>
      ["overdue", "breach", "incidents"].some((k) => w.toLowerCase().includes(k))
    )
  ) {
    return "High";
  }
  if (warnings.some((w) => w.toLowerCase().includes("adequate"))) return "Low";
  return "Medium";
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

  const demoSite = (): Site => ({
    id: parseInt(siteId || "1"),
    name: "Manchester Depot",
    image: "",
    notes: "Main operating depot for northern region.",
    postcode: "M1 1AA",
    address: "1 Example St, Manchester",
    contact_position: "Site Manager",
    contact_phone: "+44 161 000 0000",
    contact_email: "manager@example.com",
    radius_m: 250,
    latitude: 53.4808,
    longitude: -2.2426,
    number_of_allocated_vehicles: 20,
    created_by: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    operation_hours: initializeDefaultOperationHours(),
    warnings: ["Overdue maintenance on vehicle #12", "Staff capacity nearing limit"],
    presence: { early: "5", middle: "10", night: "3" },
    staff: { driver: 15, admin: 2, mechanic: 1, total: 18 },
  });

  const fetchSite = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        console.warn("No auth token found — using demo data.");
        const data = demoSite();
        setSite(data);
        setEditSite(data);
        return;
      }

      const res = await fetch(`${API_URL}/api/sites/${siteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as Site;

      const updatedData: Site = {
        ...demoSite(),
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
        presence: data.presence || demoSite().presence,
        staff: data.staff || demoSite().staff,
      };

      setSite(updatedData);
      setEditSite(updatedData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      const data = demoSite();
      setSite(data);
      setEditSite(data);
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
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
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

  const status = "Active";
  const complianceStatus = site && site.staff.total > 20 ? "Over Capacity" : "In Compliance";
  const severity = site ? deriveSeverity(site.warnings) : "Medium";
  const staffBreakdown = site ? getStaffBreakdown(site.staff) : [];
  const utilization = site ? `${Math.round((site.staff.total / 20) * 100)}%` : "0%";

  const buildChartData = () => {
    return [
      { name: "Mon", used: 600, allocated: 1100 },
      { name: "Tue", used: 650, allocated: 1150 },
      { name: "Wed", used: 700, allocated: 1200 },
      { name: "Thu", used: 750, allocated: 1250 },
      { name: "Fri", used: 800, allocated: 1300 },
      { name: "Sat", used: 700, allocated: 1200 },
      { name: "Sun", used: 650, allocated: 1150 },
    ];
  };

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (error && !site) return <div className="p-6 text-red-600">{error}</div>;
  if (!site || !editSite) return <div className="p-6 text-gray-700">Site not found</div>;

  return (
    <div className="p-6 bg-white min-h-screen text-gray-700">
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
            <div className="flex font-bold gap-2 text-gray-800">
              <Truck className="text-orange-600" />
              <h1>Vehicle Information</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <span>Authorized Vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-4xl font-bold text-gray-800">{site.number_of_allocated_vehicles}</span>
                  <Truck className="w-12 h-12 opacity-50 text-gray-400" />
                </div>
              </Card>
              <Card className="p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <span>Max Staff Allow</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-4xl font-bold text-gray-800">20</span>
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
              <Separator className="my-4" />
              <div className="text-lg bg-gray-100 p-4 flex justify-between items-center rounded-lg">
                <p className="font-medium text-gray-700">Total Staff / Maximum Allowed</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-gray-800">{site.staff.total} / 20</p>
                  <p
                    className={
                      utilization.includes("105") || utilization.includes("107")
                        ? "text-red-600 font-medium"
                        : "text-gray-700 font-medium"
                    }
                  >
                    {utilization}
                  </p>
                </div>
              </div>
            </Card>
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
                  <p className="font-medium text-gray-500">Address</p>
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
                  <p className="font-medium text-gray-500">Longitude (Geofencing)</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(editSite.longitude)}
                      onChange={(e) => handleInputChange("longitude", parseFloat(e.target.value || "0"))}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.longitude.toFixed(4)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Latitude (Geofencing)</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.0001"
                      value={String(editSite.latitude)}
                      onChange={(e) => handleInputChange("latitude", parseFloat(e.target.value || "0"))}
                      className="w-full border-gray-300"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">{site.latitude.toFixed(4)}</p>
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
                  <p className="font-medium text-gray-500">Radius (m)</p>
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
              </div>
              <div className="flex items-center mt-4 text-xs text-gray-500">
                <Badge className={`${getStatusBadgeColors(status)} text-xs font-medium mr-2`}>
                  {status}
                </Badge>
                <span>
                  Last Updated: {new Date(site.updated_at).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </Card>
            <Card className="p-4 rounded-lg bg-white border border-gray-200 shadow">
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" /> Operational Statistics
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={buildChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="used" fill="#f97316" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="allocated" fill="#fdba74" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="w-full h-[200px] rounded-md bg-gray-50 flex justify-center items-center border border-gray-200">
              {site.image ? (
                <img src={site.image} className="w-full h-full object-cover" alt="site" />
              ) : (
                <div className="text-gray-400">No image</div>
              )}
            </div>
            <Card className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-600 font-bold">Site Alerts</span>
                </div>
                <Badge className={`${getSeverityBadgeColors(severity)} text-xs font-medium`}>
                  {severity}
                </Badge>
              </div>
              <ul className="text-sm text-gray-700 list-disc pl-4">
                {site.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Last Updated: {new Date(site.updated_at).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
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
                  </div>
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
                  <Badge className={`${getStatusBadgeColors(status)} text-xs font-medium`}>
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Compliance Status</span>
                  <Badge className={`${getComplianceBadgeColors(complianceStatus)} text-xs font-medium`}>
                    {complianceStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Active Alerts</span>
                  <Badge className="bg-red-100 text-red-700 text-xs font-medium">
                    {site.warnings.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Latest Update</span>
                  <span className="text-sm text-gray-700">
                    {new Date(site.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Users className="w-5 h-5 text-orange-600" />
                <span>Presence</span>
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
                  <span>Night Shift</span>
                  <span>{site.presence.night}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}