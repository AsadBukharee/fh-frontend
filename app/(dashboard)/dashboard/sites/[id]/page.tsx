"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Truck, Users, MapPin, TriangleAlert, Clock, Save, Edit, X } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { format, parse } from "date-fns";


// Define the API response interface for operation hours
interface OperationHour {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
  is_open_24_hours: boolean;
}

// Define a mapping for day labels (for display purposes)
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
  position: string;
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

export default function SiteDetails() {
  const params = useParams();
  const siteId = params.id as string;
  const [site, setSite] = useState<Site | null>(null);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Initialize default operation hours
  const initializeDefaultOperationHours = (): OperationHour[] => {
    return Array.from({ length: 7 }, (_, index) => ({
      day_of_week: index,
      opens_at: "09:00",
      closes_at: "17:00",
      is_closed: false,
      is_open_24_hours: false,
    }));
  };

  // Fetch site data
  useEffect(() => {
    const fetchSite = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/sites/${siteId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch site data: ${response.statusText}`);
        }
        const data: Site = await response.json();
        // Initialize defaults for null fields
        const updatedData = {
          ...data,
          name: data.name || "",
          address: data.address || "",
          postcode: data.postcode || "",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
          position: data.position || "",
          image: data.image || "",
          notes: data.notes || "",
          radius_m: data.radius_m || 0,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          number_of_allocated_vehicles: data.number_of_allocated_vehicles || 0,
          operation_hours: data.operation_hours?.length
            ? data.operation_hours
            : initializeDefaultOperationHours(),
          presence: {
            early: data.presence?.early || "",
            middle: data.presence?.middle || "",
            night: data.presence?.night || "",
          },
          staff: {
            driver: data.staff?.driver || 0,
            admin: data.staff?.admin || 0,
            mechanic: data.staff?.mechanic || 0,
            total: data.staff?.total || 0,
          },
          warnings: data.warnings || [],
        };
        setSite(updatedData);
        setEditSite(updatedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching site data");
      } finally {
        setLoading(false);
      }
    };
    if (siteId && token) {
      fetchSite();
    } else {
      setError("Missing site ID or access token");
      setLoading(false);
    }
  }, [siteId, token]);

  // Format time for display
  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  // Handle input changes for site fields
  const handleInputChange = (field: keyof Site, value: any) => {
    setEditSite((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Handle operation hours changes
  const handleOperationHourChange = (
    index: number,
    field: keyof OperationHour,
    value: any
  ) => {
    setEditSite((prev) => {
      if (!prev) return prev;
      const updatedHours = [...prev.operation_hours];
      updatedHours[index] = { ...updatedHours[index], [field]: value };
      return { ...prev, operation_hours: updatedHours };
    });
  };

  // // Validate operation hours
  // const validateOperationHours = (hours: OperationHour[]): boolean => {
  //   return hours.every((hour) => {
  //     if (hour.is_closed || hour.is_open_24_hours) {
  //       return true; // No need to validate times if closed or 24 hours
  //     }
  //     return hour.opens_at && hour.closes_at && hour.opens_at < hour.closes_at;
  //   });
  // };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSite || !token) return;

    // Validate operation hours
    // if (!validateOperationHours(editSite.operation_hours)) {
    //   setError("Invalid operation hours: Ensure valid times for open days.");
    //   return;
    // }

    try {
      setLoading(true);
      setError(null);

      // Update main site data
      const siteData = {
        name: editSite.name,
        image: editSite.image,
        notes: editSite.notes,
        postcode: editSite.postcode,
        address: editSite.address,
        position: editSite.position,
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

      const siteResponse = await fetch(`${API_URL}/api/sites/${siteId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(siteData),
      });

      if (!siteResponse.ok) {
        throw new Error(`Failed to update site: ${siteResponse.statusText}`);
      }

      // Update operation hours with the specified payload format
      const operationHoursPayload = {
        hours: editSite.operation_hours.map((hour) => ({
          day_of_week: hour.day_of_week,
          opens_at: hour.opens_at,
          closes_at: hour.closes_at,
          is_closed: hour.is_closed,
          is_open_24_hours: hour.is_open_24_hours,
        })),
      };

      const operationHoursResponse = await fetch(
        `${API_URL}/api/sites/${siteId}/hours/bulk/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(operationHoursPayload),
        }
      );

      if (!operationHoursResponse.ok) {
        throw new Error(
          `Failed to update operation hours: ${operationHoursResponse.statusText}`
        );
      }

      const updatedSite = await siteResponse.json();
      setSite(updatedSite);
      setEditSite(updatedSite);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating site data");
    } finally {
      setLoading(false);
    }
  };

  // Badge color functions
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

  // Derive severity from warnings
  const deriveSeverity = (warnings: string[]): string => {
    if (
      warnings.some((w) =>
        ["overdue", "breach", "incidents"].some((keyword) =>
          w.toLowerCase().includes(keyword)
        )
      )
    ) {
      return "High";
    }
    if (warnings.some((w) => w.toLowerCase().includes("adequate"))) {
      return "Low";
    }
    return "Medium";
  };

  // Transform staff to breakdown format
  const getStaffBreakdown = (staff: Staff) => [
    { role: "Driver", count: staff.driver },
    { role: "Admin", count: staff.admin },
    { role: "Mechanic", count: staff.mechanic },
  ];

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!site || !editSite) return <div className="p-6">Site not found</div>;

  // Derived fields
  const status = "Active";
  const complianceStatus = site.staff.total > 20 ? "Over Capacity" : "In Compliance";
  const severity = deriveSeverity(site.warnings);
  const staffBreakdown = getStaffBreakdown(site.staff);
  const utilization = `${Math.round((site.staff.total / 20) * 100)}%`;

  return (
    <div className="p-6 bg-white min-h-screen">
      
      <h1 className="text-2xl font-bold text-gray-800">Sites Details</h1>
      <p className="text-sm text-gray-500 mb-6">See and edit site details</p>

      <div className="flex justify-end mb-4">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditSite(site); // Reset to original data
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-rose text-white px-4 py-2 rounded-md"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Site Information */}
            <Card className="p-4 border border-gray-200 rounded-lg bg-gray-100">
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
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.name}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Address</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.address}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Longitude (Geofencing)</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.0001"
                      value={editSite.longitude}
                      onChange={(e) => handleInputChange("longitude", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.longitude.toFixed(4)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Latitude (Geofencing)</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.0001"
                      value={editSite.latitude}
                      onChange={(e) => handleInputChange("latitude", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.latitude.toFixed(4)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Postcode</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.postcode}
                      onChange={(e) => handleInputChange("postcode", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.postcode}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Phone</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.contact_phone}
                      onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.contact_phone}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Email</p>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editSite.contact_email}
                      onChange={(e) => handleInputChange("contact_email", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.contact_email}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Position</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editSite.position}
                      onChange={(e) => handleInputChange("position", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.position}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Radius (m)</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editSite.radius_m}
                      onChange={(e) => handleInputChange("radius_m", parseInt(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{site.radius_m}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center mt-4 text-xs text-gray-500">
                <Badge className={`${getStatusBadgeColors(status)} text-xs font-medium mr-2`}>
                  {status}
                </Badge>
                <span>
                  Last Updated:{" "}
                  {new Date(site.updated_at).toLocaleString("en-US", {
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

            {/* Vehicle Information & Max Staff Allow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 rounded-lg text-orange-600 bg-orange-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <Truck className="w-5 h-5" />
                  <span>Pragmatic Play Authorized Vehicles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-4xl font-bold">{site.number_of_allocated_vehicles}</span>
                  <Truck className="w-12 h-12 opacity-50" />
                </div>
              </Card>
              <Card className="p-4 rounded-lg text-red-600 bg-red-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <Users className="w-5 h-5" />
                  <span>Max Staff Allow</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-4xl font-bold">20</span>
                  <Users className="w-12 h-12 opacity-50" />
                </div>
              </Card>
            </div>
            <div className="bg-gray-100 flex justify-center items-center h-16 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 text-yellow-500" />
                Authorization changes automatically adjust maximum staff limits and trigger alerts for compliance.
              </p>
            </div>

            {/* Current Staff on Site */}
            <Card className="p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Users className="w-5 h-5 text-orange-600" />
                <span>Current Staff onsite</span>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {staffBreakdown.map((role, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded-md text-center">
                    <p className="text-lg font-bold">{role.count}</p>
                    <p className="text-xs text-gray-500">{role.role}</p>
                  </div>
                ))}
              </div>
              <span className="bg-gray-400 flex w-full h-0.5 mt-2"></span>
              <div className="text-sm bg-gray-100 p-4 rounded-lg text-gray-700 mt-4">
                <p className="font-medium">Total Staff / Maximum Allowed</p>
                <p className="text-xl font-bold text-black">
                  {site.staff.total} / 20
                </p>
                <div className="flex items-center gap-2">
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
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
          <div className=" w-full h-[200px] rounded-md shadow-md  hover:shadow-lg transition-all duration-300 flex justify-center items-center">
                  <img
                  src={site.image || ""}
                  className="w-full h-full rounded-md "
                  />
                </div>
            {/* Site Alerts */}
            <Card className="p-4 border border-red-200 rounded-lg bg-red-50">
       
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
            </Card>

            {/* Operation Hours */}
            <Card className="p-4 rounded-xl space-y-4">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Operation Hours</span>
              </div>

              {editSite.operation_hours.map((hour, index) => (
                <div
                  key={index}
                  className={
                    isEditing
                      ? "border border-gray-100 rounded-xl p-4 flex flex-col space-y-4 shadow-sm"
                      : "flex flex-col"
                  }
                >
                  <div className={isEditing ? "flex flex-col" : "flex flex-row justify-between"}>
                    <div className="flex justify-start items-center w-full">
                      <span className="text-base font-semibold text-orange-400">
                        {dayLabels[hour.day_of_week]}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">Closed</span>
                          <Switch
                            checked={hour.is_closed}
                            disabled={hour.is_open_24_hours}
                            onCheckedChange={(checked) =>
                              handleOperationHourChange(index, "is_closed", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">24 hrs</span>
                          <Switch
                            checked={hour.is_open_24_hours}
                            disabled={hour.is_closed}
                            onCheckedChange={(checked) =>
                              handleOperationHourChange(index, "is_open_24_hours", checked)
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      hour.is_open_24_hours && (
                        <span className="text-sm font-medium text-orange-600">24 hrs</span>
                      )
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex gap-4">
                      <Input
                        type="time"
                        value={hour.opens_at || "09:00"}
                        onChange={(e) =>
                          handleOperationHourChange(index, "opens_at", e.target.value)
                        }
                        disabled={hour.is_open_24_hours || hour.is_closed}
                        className="flex-1 text-sm"
                      />
                      <Input
                        type="time"
                        value={hour.closes_at || "17:00"}
                        onChange={(e) =>
                          handleOperationHourChange(index, "closes_at", e.target.value)
                        }
                        disabled={hour.is_open_24_hours || hour.is_closed}
                        className="flex-1 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      {hour.is_closed ? (
                        <span className="text-sm text-gray-700">Closed</span>
                      ) : !hour.is_open_24_hours ? (
                        <div className="flex gap-4 text-sm text-gray-700">
                          <span className="px-3 py-2 rounded-lg">
                            {formatTime(hour.opens_at || "09:00")}
                          </span>
                          <span className="px-3 py-2 rounded-lg">
                            {formatTime(hour.closes_at || "17:00")}
                          </span>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </Card>

            {/* Quick Stats */}
            <Card className="p-4 border border-gray-200 rounded-lg">
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
                  <Badge
                    className={`${getComplianceBadgeColors(complianceStatus)} text-xs font-medium`}
                  >
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
                    {new Date(site.updated_at).toLocaleString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Presence */}
            <Card className="p-4 rounded-lg">
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