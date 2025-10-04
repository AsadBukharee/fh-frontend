
"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TriangleAlert,
  Save,
  Edit,
  X,
  MapPin,
  Shapes,
  NotebookPen,
  Info,
  Baseline as ChartLine,
  DollarSign,
  FileText,
  Gauge,
  Clock,
  Users,
  Camera,
  Download,
} from "lucide-react";
import API_URL from "@/app/utils/ENV"; // Environment variable for API URL
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import ExpiryDates from "@/components/Vehicles/VehicleEditExpiry"; // Custom component for expiry dates
import ImageUploader from "@/components/Media/UploadImage"; // Custom component for image uploads

// Interface for site data structure
interface Site {
  id: number;
  name: string;
}

// Interface for vehicle data structure
interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_status: string;
  is_roadworthy: boolean;
  walkaround_count: number | null;
  last_mileage: string | null;
  vehicle_cost?: number;
  vehicle_picture?: string;
  assignee_driver: {
    id: number;
    full_name: string;
    email: string;
    display_name?: string;
    role?: string;
    shifts_count?: number;
    avatar?: string | null;
    site?: Array<{
      id: number;
      name: string;
      status: string;
      image?: string;
    }>;
  } | null;
  vehicles_type: {
    id: number;
    name: string;
    description: string;
  };
  site_allocated?: {
    id: number;
    name: string;
    status: string;
    postcode: string;
    address: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    latitude: number;
    longitude: number;
    radius_m: number;
    number_of_allocated_vehicles: number;
    created_by: string;
    image?: string;
    notes?: string;
    contact_position?: string;
    operation_hours?: Array<{
      id: number;
      day_of_week: number;
      day_label: string;
      is_open_24_hours: boolean;
      is_closed: boolean;
      opens_at: string | null;
      closes_at: string | null;
    }>;
    presence?: {
      early: string;
      middle: string;
      night: string;
      supervisor: string;
    };
    staff?: {
      driver: number;
      admin: number;
      mechanic: number;
      total: number;
    };
  } | null;
  warnings: string[];
  missing_attributes: string[];
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
  inspection_expiry: string;
  tacho_calibration: string;
  tyre_expiry_front_driver: string | null;
  tyre_expiry_front_passenger: string | null;
  tyre_expiry_rear_outer_driver: string | null;
  tyre_expiry_rear_outer_passenger: string | null;
  tyre_pressure_front_driver?: string;
  tyre_pressure_front_passenger?: string;
  tyre_pressure_rear_outer_driver?: string;
  tyre_pressure_rear_outer_passenger?: string;
  tyre_depth_front_driver?: string;
  tyre_depth_front_passenger?: string;
  tyre_depth_rear_outer_driver?: string;
  tyre_depth_rear_outer_passenger?: string;
  tyre_torque_front_driver?: string;
  tyre_torque_front_passenger?: string;
  tyre_torque_rear_outer_driver?: string;
  tyre_torque_rear_outer_passenger?: string;
  log_book?: string;
  mot_docs?: string;
  pree_mot_check_docs?: string;
  inspection?: string;
  insurance?: string;
  fitness_certificate?: string;
  route_permit?: string;
  financial?: string;
  others?: string;
  service_records?: string;
  tax?: string;
  tacho_download_docs?: string;
  tacho_calibration_docs?: string;
  status_indicators: {
    mot_expiring: boolean;
    tax_expiring: boolean;
    insurance_expiring: boolean;
    inspection_due: boolean;
  };
  tyre_expiry_status: {
    front_driver_expiring: boolean;
    front_passenger_expiring: boolean;
    rear_outer_driver_expiring: boolean;
    rear_outer_passenger_expiring: boolean;
  };
}

// Status choices for vehicle status dropdown
const STATUS_CHOICES = [
 
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "minor_defect", label: "Minor Defect" },
  { value: "assigned", label: "Assigned" },
  { value: "disable", label: "Disabled" },
];


export default function VehicleDetailPage() {
  const { id } = useParams(); // Get vehicle ID from URL
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [sites, setSites] = useState<Site[]>([]); // State for sites
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true); // Separate loading state for sites
  const [error, setError] = useState<string | null>(null);
  const [sitesError, setSitesError] = useState<string | null>(null); // Separate error state for sites
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingTyreExpiry, setIsEditingTyreExpiry] = useState(false);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempTyreExpiry, setTempTyreExpiry] = useState({
    front_driver: "",
    front_passenger: "",
    rear_outer_driver: "",
    rear_outer_passenger: "",
  });
  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Fetch vehicle data and sites on mount or when ID/token changes
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log("Vehicle API response:", data); // Debug log
        if (data.success) {
          setVehicle(data.data);
          setEditVehicle(data.data);
          setTempPrice(data.data.vehicle_cost || 0);
          setTempTyreExpiry({
            front_driver: data.data.tyre_expiry_front_driver || "",
            front_passenger: data.data.tyre_expiry_front_passenger || "",
            rear_outer_driver: data.data.tyre_expiry_rear_outer_driver || "",
            rear_outer_passenger: data.data.tyre_expiry_rear_outer_passenger || "",
          });
        } else {
          setError(data.message || "Failed to fetch vehicle data");
        }
      } catch (err) {
        setError("Error fetching vehicle data");
        console.error("Error fetching vehicle:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSites = async () => {
      try {
        setSitesLoading(true);
        const res = await fetch(`${API_URL}/api/sites/list-names/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log("Sites API response:", data); // Debug log
        if (data.success && Array.isArray(data.data)) {
          setSites(data.data);
          setSitesError(null);
        } else {
          setSitesError(data.message || "No sites returned from API");
          setSites([]);
        }
      } catch (err) {
        setSitesError("Error fetching sites: " + (err instanceof Error ? err.message : "Unknown error"));
        setSites([]);
        console.error("Error fetching sites:", err);
      } finally {
        setSitesLoading(false);
      }
    };

    if (id && token) {
      fetchVehicle();
      fetchSites();
    } else {
      setError("Missing vehicle ID or authentication token");
      setLoading(false);
      setSitesLoading(false);
    }
  }, [id, token]);

  // Update vehicle price
  const handlePriceUpdate = async () => {
    if (!vehicle || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicle_cost: tempPrice }),
      });
      const updatedData = await res.json();
      if (res.ok && updatedData.success) {
        setVehicle((prev) =>
          prev ? { ...prev, vehicle_cost: tempPrice } : prev
        );
        setIsEditingPrice(false);
      } else {
        setError(updatedData.message || "Failed to update price");
      }
    } catch (err) {
      setError("Error updating price");
      console.error("Error updating price:", err);
    }
  };

  // Update tyre expiry dates
  const handleTyreExpiryUpdate = async () => {
    if (!vehicle || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tyre_expiry_front_driver: tempTyreExpiry.front_driver,
          tyre_expiry_front_passenger: tempTyreExpiry.front_passenger,
          tyre_expiry_rear_outer_driver: tempTyreExpiry.rear_outer_driver,
          tyre_expiry_rear_outer_passenger: tempTyreExpiry.rear_outer_passenger,
        }),
      });
      if (res.ok) {
        setVehicle((prev) =>
          prev
            ? {
                ...prev,
                tyre_expiry_front_driver: tempTyreExpiry.front_driver,
                tyre_expiry_front_passenger: tempTyreExpiry.front_passenger,
                tyre_expiry_rear_outer_driver: tempTyreExpiry.rear_outer_driver,
                tyre_expiry_rear_outer_passenger:
                  tempTyreExpiry.rear_outer_passenger,
              }
            : prev
        );
        setIsEditingTyreExpiry(false);
      } else {
        const updatedData = await res.json();
        setError(updatedData.message || "Failed to update tyre expiry");
      }
    } catch (err) {
      setError("Error updating tyre expiry");
      console.error("Error updating tyre expiry:", err);
    }
  };

  // Handle image upload
  const handleImageUpload = async (imageUrl: string) => {
    if (!vehicle || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicle_picture: imageUrl }),
      });
      if (res.ok) {
        setVehicle((prev) =>
          prev ? { ...prev, vehicle_picture: imageUrl } : prev
        );
      } else {
        const updatedData = await res.json();
        setError(updatedData.message || "Failed to update image");
      }
    } catch (err) {
      setError("Error updating vehicle image");
      console.error("Error updating vehicle image:", err);
    }
  };

  // Handle input changes for vehicle fields
  const handleInputChange = (field: keyof Vehicle, value: any) => {
    setEditVehicle((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Handle input changes for site_allocated field
  const handleSiteAllocatedChange = (value: number | null) => {
    setEditVehicle((prev) =>
      prev
        ? {
            ...prev,
            site_allocated: value
              ? {
                  id: value,
                  name: sites.find((site) => site.id === value)?.name || "",
                  status: "",
                  postcode: "",
                  address: "",
                  contact_name: "",
                  contact_phone: "",
                  contact_email: "",
                  latitude: 0,
                  longitude: 0,
                  radius_m: 0,
                  number_of_allocated_vehicles: 0,
                  created_by: "",
                }
              : null,
          }
        : prev
    );
  };

  // Submit edited vehicle data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVehicle || !token) return;
    try {
      setLoading(true);
      setError(null);
      const vehicleData = {
        registration_number: editVehicle.registration_number,
        vehicle_status: editVehicle.vehicle_status,
        is_roadworthy: editVehicle.is_roadworthy,
        mot_expiry: editVehicle.mot_expiry,
        tax_expiry: editVehicle.tax_expiry,
        insurance_expiry: editVehicle.insurance_expiry,
        walkaround_count: editVehicle.walkaround_count,
        vehicles_type: editVehicle.vehicles_type.id, // Send only the ID
        site_allocated: editVehicle.site_allocated?.id ?? null, // Send the selected site ID
      };
      console.log("Submitting vehicle data:", vehicleData); // Debug log
      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleData),
      });
      const updatedData = await res.json();
      if (res.ok && updatedData.success) {
        setVehicle(updatedData.data);
        setEditVehicle(updatedData.data);
        setIsEditing(false);
      } else {
        throw new Error(updatedData.message || `Failed to update vehicle: ${res.statusText}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error updating vehicle data"
      );
      console.error("Error updating vehicle:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get badge colors based on status
  const getStatusBadgeColors = (status: string) => {
    switch (status.toLowerCase()) {
      case "no_defect":
        return "bg-green-100 text-green-700";
      case "minor_defect_roadworthy":
        return "bg-yellow-100 text-yellow-700";
      case "minor_defect_not_roadworthy":
      case "major_defect":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get badge colors based on roadworthy status
  const getRoadworthyBadgeColors = (isRoadworthy: boolean) => {
    return isRoadworthy
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  // Get badge colors based on expiry status
  const getExpiryBadgeColors = (isExpiring: boolean) => {
    return isExpiring
      ? "bg-red-100 text-red-700"
      : "bg-green-100 text-green-700";
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Error or no vehicle data
  if (error || !vehicle || !editVehicle) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <TriangleAlert className="w-5 h-5" />
          <span className="font-medium">{error || "Vehicle not found"}</span>
        </div>
      </div>
    );
  }

  const vatRate = 0.2; // Assuming 20% VAT
  const vatAmount = (vehicle.vehicle_cost || 0) * vatRate;
  const totalAmount = (vehicle.vehicle_cost || 0) + vatAmount;

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Vehicle #{vehicle.id} - {vehicle.registration_number}
        </h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditVehicle(vehicle);
                }}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
              style={{
                background:
                  "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                width: "auto",
                height: "auto",
              }}
            >
              <Edit className="w-4 h-4" /> Edit Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Sites Error */}
      {sitesError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg mb-6">
          <TriangleAlert className="w-5 h-5" />
          <span className="font-medium">{sitesError}</span>
        </div>
      )}

      {/* Warnings and Missing Attributes Accordion */}
      <Card className="mb-6 p-6 bg-gray-100 border border-gray-200 rounded-2xl shadow-sm">
        <Accordion type="single" collapsible>
          {/* Warnings */}
          {vehicle.warnings && vehicle.warnings.length > 0 && (
            <AccordionItem value="warnings">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <TriangleAlert className="w-5 h-5 text-red-500" />
                  <span className="text-lg font-semibold text-gray-800">Warnings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center justify-between gap-2 text-red-700 font-medium mb-2">
                  <span>Warnings</span>
                </div>
                <ul className="space-y-1">
                  {vehicle.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-red-600">
                      {warning}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
          {/* Missing Attributes */}
          {vehicle.missing_attributes && vehicle.missing_attributes.length > 0 && (
            <AccordionItem value="missing-attributes">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-yellow-500" />
                  <span className="text-lg font-semibold text-gray-800">Missing Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center justify-between gap-2 text-yellow-700 font-medium mb-2">
                  <span>Missing Information</span>
                </div>
                <ul className="space-y-1">
                  {vehicle.missing_attributes.map((attr, index) => (
                    <li key={index} className="text-sm text-yellow-600">
                      • {attr}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Vehicle Overview */}
            <Card className="p-6 bg-blue-50 border-l-6 border-blue-800 rounded">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <Camera className="w-7 h-7 rounded-full text-blue-500" />
                <span>Vehicle Overview</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-start">
                  {vehicle.vehicle_picture ? (
                    <img
                      src={vehicle.vehicle_picture || "/placeholder.svg"}
                      alt="Vehicle"
                      width={200}
                      height={150}
                      className="rounded-lg object-cover mb-2"
                    />
                  ) : (
                    <div className="w-[200px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <ImageUploader onUploadSuccess={handleImageUpload} />
                </div>
                <div className="flex flex-col justify-center items-start">
                  <div
                    className={`flex ${
                      isEditingPrice ? "flex-col" : ""
                    } items-center justify-center`}
                  >
                    <div
                      className={`flex w-full items-center ${
                        isEditingPrice ? "text-right" : "items-center"
                      } gap-2 text-md px-1`}
                    >
                      <span>Vehicle Cost:</span>
                    </div>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(Number(e.target.value))}
                          className="w-29"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handlePriceUpdate}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingPrice(false);
                            setTempPrice(vehicle.vehicle_cost || 0);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-md font-bold pl-2 text-green-600">
                          £{(vehicle.vehicle_cost || 0).toLocaleString()}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingPrice(!isEditingPrice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center justify-center`}>
                    <div
                      className={`flex w-full items-center gap-2 text-md px-1`}
                    >
                      <span>VAT Amount: </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-md font-bold pl-2 text-green-600">
                        £{vatAmount.toLocaleString()}
                      </p>
                      <Button type="button" variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className={`flex items-start justify-start`}>
                    <div
                      className={`flex w-full text-right gap-2 text-md px-1`}
                    >
                      <span>Total Amount:</span>
                    </div>
                    <div className="flex text-right">
                      <p className="text-md font-bold text-green-600">
                        £{totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Assigned Driver */}
            {vehicle.assignee_driver && (
              <Card className="p-6 bg-green-50 border-l-6 border-green-800 rounded">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                  <Users className="w-7 h-7 rounded-full text-green-500" />
                  <span>Assigned Driver</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {vehicle.assignee_driver.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">
                      {vehicle.assignee_driver.email}
                    </p>
                  </div>
                  {vehicle.assignee_driver.role && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Role</p>
                      <Badge className="bg-blue-100 text-blue-700">
                        {vehicle.assignee_driver.role}
                      </Badge>
                    </div>
                  )}
                  {vehicle.assignee_driver.shifts_count !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Shifts</p>
                      <p className="font-medium text-gray-900">
                        {vehicle.assignee_driver.shifts_count}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Vehicle Type */}
            <Card className="p-6 bg-rose-50 border-l-6 border-red-800 rounded">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <Shapes className="w-7 h-7 rounded-full text-red-500" />
                <span>Vehicle Type</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col items-center p-4 bg-white">
                  <NotebookPen className="w-12 h-12 text-gray-800 mb-2" />
                  <Badge className="text-sm font-medium bg-orange-100 text-orange-700">
                    {vehicle.vehicles_type.name}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* General Information */}
            <Card className="p-6 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <Info className="w-6 h-6 rounded-full text-red-500" />
                <span>General Information</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-1 rounded">
                  <p className="text-sm text-gray-500 mb-1">Registration</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.registration_number}
                      onChange={(e) =>
                        handleInputChange("registration_number", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.registration_number}
                    </p>
                    
                  )}
                </div>
                <div className="bg-gray-50 p-1 rounded">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {isEditing ? (
                    <select
                      value={editVehicle.vehicle_status}
                      onChange={(e) =>
                        handleInputChange("vehicle_status", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      {STATUS_CHOICES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge className={getStatusBadgeColors(vehicle.vehicle_status)}>
                      {STATUS_CHOICES.find(
                        (status) => status.value === vehicle.vehicle_status
                      )?.label || vehicle.vehicle_status}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Road Worthy</p>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editVehicle.is_roadworthy}
                        onCheckedChange={(checked) =>
                          handleInputChange("is_roadworthy", checked)
                        }
                      />
                      <span className="text-sm text-gray-700">Roadworthy</span>
                    </div>
                  ) : (
                    <Badge
                      className={getRoadworthyBadgeColors(vehicle.is_roadworthy)}
                    >
                      {vehicle.is_roadworthy ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Walkaround Count</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.walkaround_count || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "walkaround_count",
                          e.target.value ? Number.parseInt(e.target.value) : null
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.walkaround_count ?? "N/A"}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Last Mileage</p>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-500" />
                    <p className="font-medium text-gray-900">
                      {vehicle.last_mileage ? `${vehicle.last_mileage} miles` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="px-6 py-3 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <ChartLine className="w-6 h-6 text-orange-500" />
                <span>Quick Stats</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center bg-gray-50 px-1 py-2 rounded justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={getStatusBadgeColors(vehicle.vehicle_status)}>
                    {STATUS_CHOICES.find(
                      (status) => status.value === vehicle.vehicle_status
                    )?.label || vehicle.vehicle_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Road Worthy</span>
                  <Badge
                    className={getRoadworthyBadgeColors(vehicle.is_roadworthy)}
                  >
                    {vehicle.is_roadworthy ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center bg-gray-50 px-1 py-2 rounded justify-between">
                  <span className="text-sm text-gray-600">
                    Walkaround Count
                  </span>
                  <span className="font-medium text-gray-900">
                    {vehicle.walkaround_count ?? "N/A"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Expiry Dates */}
            <ExpiryDates
              mot_expiry={vehicle.mot_expiry}
              vehicle_id={vehicle.id}
              tax_expiry={vehicle.tax_expiry}
              insurance_expiry={vehicle.insurance_expiry}
              inspection_expiry={vehicle.inspection_expiry}
              status_indicators={vehicle.status_indicators}
            />

            {/* Accordion for Tyre Info, Documents, and Operation Hours */}
            <Card className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <Accordion type="single" collapsible>
                {/* Tyre Information */}
                <AccordionItem value="tyre-expiry">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-800">
                        Tyre Information
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTyreExpiry(!isEditingTyreExpiry);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isEditingTyreExpiry && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">
                          Edit Tyre Expiry Dates
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="front-driver-expiry">
                              Front Driver
                            </Label>
                            <Input
                              id="front-driver-expiry"
                              type="date"
                              value={tempTyreExpiry.front_driver}
                              onChange={(e) =>
                                setTempTyreExpiry((prev) => ({
                                  ...prev,
                                  front_driver: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="front-passenger-expiry">
                              Front Passenger
                            </Label>
                            <Input
                              id="front-passenger-expiry"
                              type="date"
                              value={tempTyreExpiry.front_passenger}
                              onChange={(e) =>
                                setTempTyreExpiry((prev) => ({
                                  ...prev,
                                  front_passenger: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="rear-driver-expiry">
                              Rear Outer Driver
                            </Label>
                            <Input
                              id="rear-driver-expiry"
                              type="date"
                              value={tempTyreExpiry.rear_outer_driver}
                              onChange={(e) =>
                                setTempTyreExpiry((prev) => ({
                                  ...prev,
                                  rear_outer_driver: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="rear-passenger-expiry">
                              Rear Outer Passenger
                            </Label>
                            <Input
                              id="rear-passenger-expiry"
                              type="date"
                              value={tempTyreExpiry.rear_outer_passenger}
                              onChange={(e) =>
                                setTempTyreExpiry((prev) => ({
                                  ...prev,
                                  rear_outer_passenger: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            type="button"
                            onClick={handleTyreExpiryUpdate}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsEditingTyreExpiry(false);
                              setTempTyreExpiry({
                                front_driver:
                                  vehicle.tyre_expiry_front_driver || "",
                                front_passenger:
                                  vehicle.tyre_expiry_front_passenger || "",
                                rear_outer_driver:
                                  vehicle.tyre_expiry_rear_outer_driver || "",
                                rear_outer_passenger:
                                  vehicle.tyre_expiry_rear_outer_passenger ||
                                  "",
                              });
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {/* Front Passenger */}
                      <div className={`flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 ${vehicle.tyre_expiry_status.front_passenger_expiring ? 'border-2 border-red-500' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-700">
                            Front Passenger
                          </span>
                          {vehicle.tyre_expiry_status.front_passenger_expiring && (
                            <Badge className="bg-red-100 text-red-700">Expiring</Badge>
                          )}
                        </div>
                        <img
                          src={vehicle.vehicle_picture ? vehicle.vehicle_picture : "/tyre/1 (4).png"}
                          alt="Passenger Side Tyre"
                          width={100}
                          height={60}
                          className="object-contain"
                        />
                        <div className="mt-2 space-y-1 text-center">
                          <div className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                            Expiry: {vehicle.tyre_expiry_front_passenger || "N/A"}
                          </div>
                          {vehicle.tyre_pressure_front_passenger && (
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                              Pressure: {vehicle.tyre_pressure_front_passenger} PSI
                            </div>
                          )}
                          {vehicle.tyre_depth_front_passenger && (
                            <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">
                              Depth: {vehicle.tyre_depth_front_passenger}mm
                            </div>
                          )}
                          {vehicle.tyre_torque_front_passenger && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                              Torque: {vehicle.tyre_torque_front_passenger} Nm
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Front Driver */}
                      <div className={`flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 ${vehicle.tyre_expiry_status.front_driver_expiring ? 'border-2 border-red-500' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-700">
                            Front Driver
                          </span>
                          {vehicle.tyre_expiry_status.front_driver_expiring && (
                            <Badge className="bg-red-100 text-red-700">Expiring</Badge>
                          )}
                        </div>
                        <img
                          src={vehicle.vehicle_picture ? vehicle.vehicle_picture : "/tyre/1 (1).png"}
                          alt="Driver Side Tyre"
                          width={100}
                          height={60}
                          className="object-contain"
                        />
                        <div className="mt-2 space-y-1 text-center">
                          <div className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                            Expiry: {vehicle.tyre_expiry_front_driver || "N/A"}
                          </div>
                          {vehicle.tyre_pressure_front_driver && (
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                              Pressure: {vehicle.tyre_pressure_front_driver} PSI
                            </div>
                          )}
                          {vehicle.tyre_depth_front_driver && (
                            <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">
                              Depth: {vehicle.tyre_depth_front_driver}mm
                            </div>
                          )}
                          {vehicle.tyre_torque_front_driver && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                              Torque: {vehicle.tyre_torque_front_driver} Nm
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rear Outer Driver */}
                      <div className={`flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 ${vehicle.tyre_expiry_status.rear_outer_driver_expiring ? 'border-2 border-red-500' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-700">
                            Rear Outer Driver
                          </span>
                          {vehicle.tyre_expiry_status.rear_outer_driver_expiring && (
                            <Badge className="bg-red-100 text-red-700">Expiring</Badge>
                          )}
                        </div>
                        <img
                          src={vehicle.vehicle_picture ? vehicle.vehicle_picture : "/tyre/1 (3).png"}
                          alt="Back Left Side Tyre"
                          width={100}
                          height={60}
                          className="object-contain"
                        />
                        <div className="mt-2 space-y-1 text-center">
                          <div className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                            Expiry: {vehicle.tyre_expiry_rear_outer_driver || "N/A"}
                          </div>
                          {vehicle.tyre_pressure_rear_outer_driver && (
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                              Pressure: {vehicle.tyre_pressure_rear_outer_driver} PSI
                            </div>
                          )}
                          {vehicle.tyre_depth_rear_outer_driver && (
                            <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">
                              Depth: {vehicle.tyre_depth_rear_outer_driver}mm
                            </div>
                          )}
                          {vehicle.tyre_torque_rear_outer_driver && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                              Torque: {vehicle.tyre_torque_rear_outer_driver} Nm
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rear Outer Passenger */}
                      <div className={`flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 ${vehicle.tyre_expiry_status.rear_outer_passenger_expiring ? 'border-2 border-red-500' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-700">
                            Rear Outer Passenger
                          </span>
                          {vehicle.tyre_expiry_status.rear_outer_passenger_expiring && (
                            <Badge className="bg-red-100 text-red-700">Expiring</Badge>
                          )}
                        </div>
                        <img
                          src={vehicle.vehicle_picture ? vehicle.vehicle_picture : "/tyre/1 (2).png"}
                          alt="Back Right Side Tyre"
                          width={100}
                          height={60}
                          className="object-contain"
                        />
                        <div className="mt-2 space-y-1 text-center">
                          <div className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                            Expiry: {vehicle.tyre_expiry_rear_outer_passenger || "N/A"}
                          </div>
                          {vehicle.tyre_pressure_rear_outer_passenger && (
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                              Pressure: {vehicle.tyre_pressure_rear_outer_passenger} PSI
                            </div>
                          )}
                          {vehicle.tyre_depth_rear_outer_passenger && (
                            <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">
                              Depth: {vehicle.tyre_depth_rear_outer_passenger}mm
                            </div>
                          )}
                          {vehicle.tyre_torque_rear_outer_passenger && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                              Torque: {vehicle.tyre_torque_rear_outer_passenger} Nm
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Vehicle Documents */}
                <AccordionItem value="documents">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="text-lg font-semibold text-gray-800">
                        Vehicle Documents
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {[
                        { key: "log_book", label: "Log Book", icon: FileText },
                        {
                          key: "mot_docs",
                          label: "MOT Certificate",
                          icon: FileText,
                        },
                        {
                          key: "pree_mot_check_docs",
                          label: "Pre-MOT Check Docs",
                          icon: FileText,
                        },
                        {
                          key: "inspection",
                          label: "Inspection Report",
                          icon: FileText,
                        },
                        {
                          key: "insurance",
                          label: "Insurance Document",
                          icon: FileText,
                        },
                        {
                          key: "fitness_certificate",
                          label: "Fitness Certificate",
                          icon: FileText,
                        },
                        {
                          key: "route_permit",
                          label: "Route Permit",
                          icon: FileText,
                        },
                        {
                          key: "financial",
                          label: "Financial Document",
                          icon: FileText,
                        },
                        {
                          key: "service_records",
                          label: "Service Records",
                          icon: FileText,
                        },
                        { key: "tax", label: "Tax Document", icon: FileText },
                        {
                          key: "tacho_download_docs",
                          label: "Tacho Download",
                          icon: Download,
                        },
                        {
                          key: "tacho_calibration_docs",
                          label: "Tacho Calibration",
                          icon: Download,
                        },
                        {
                          key: "others",
                          label: "Other Documents",
                          icon: FileText,
                        },
                      ].map(({ key, label, icon: Icon }) => {
                        const docUrl = vehicle[key as keyof Vehicle] as string;
                        return docUrl ? (
                          <a
                            key={key}
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Icon className="w-5 h-5 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {label}
                            </span>
                          </a>
                        ) : null;
                      }).filter(Boolean)}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Site Operation Hours */}
                <AccordionItem value="operation-hours">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-semibold text-gray-800">
                        Site Operation Hours
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-4">
                      {vehicle?.site_allocated?.operation_hours?.length ? (
                        vehicle.site_allocated.operation_hours.map((hour) => (
                          <div
                            key={hour.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="font-medium text-gray-700">
                              {hour.day_label}
                            </span>
                            <div className="text-sm">
                              {hour.is_closed ? (
                                <Badge className="bg-red-100 text-red-700">
                                  Closed
                                </Badge>
                              ) : hour.is_open_24_hours ? (
                                <Badge className="bg-green-100 text-green-700">
                                  24 Hours
                                </Badge>
                              ) : (
                                <span className="text-gray-600">
                                  {hour.opens_at ?? "N/A"} -{" "}
                                  {hour.closes_at ?? "N/A"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-600">
                          No operation hours available
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Site Allocated */}
                <AccordionItem value="site-allocated">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <MapPin className="w-6 h-6 rounded-full text-red-500" />
                      <span>Site Allocated</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {vehicle.site_allocated ? (
                      <>
                        {vehicle.site_allocated.image && (
                          <div className="mb-4">
                            <img
                              src={vehicle.site_allocated.image || "/placeholder.svg"}
                              alt="Site"
                              width={300}
                              height={150}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Site Name</p>
                            {isEditing ? (
                              sitesLoading ? (
                                <p className="text-sm text-gray-600">Loading sites...</p>
                              ) : sites.length === 0 ? (
                                <p className="text-sm text-red-600">No sites available</p>
                              ) : (
                                <select
                                  value={editVehicle.site_allocated?.id?.toString() || ""}
                                  onChange={(e) =>
                                    handleSiteAllocatedChange(
                                      e.target.value ? Number(e.target.value) : null
                                    )
                                  }
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="">Select a site</option>
                                  {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                      {site.name}
                                    </option>
                                  ))}
                                </select>
                              )
                            ) : (
                              <p className="font-medium text-gray-900">
                                {vehicle.site_allocated.name || "Not provided"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Contact Name
                            </p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.contact_name || "Not provided"}
                            </p>
                          </div>
                          {vehicle.site_allocated.contact_position && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Contact Position
                              </p>
                              <p className="font-medium text-gray-900">
                                {vehicle.site_allocated.contact_position}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Contact Phone
                            </p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.contact_phone || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Address</p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.address || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <Badge className={getStatusBadgeColors(vehicle.site_allocated.status)}>
                              {vehicle.site_allocated.status || "N/A"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Post Code</p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.postcode || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Radius</p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.radius_m ? `${vehicle.site_allocated.radius_m} m` : "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Latitude</p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.latitude || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Longitude</p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.longitude || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              No. of vehicles
                            </p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.number_of_allocated_vehicles || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Created By</p>
                            <p className="font-medium text-gray-900">
                              {vehicle.site_allocated.created_by || "Not provided"}
                            </p>
                          </div>
                        </div>
                        {/* Staff Information */}
                        {vehicle.site_allocated.staff && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-3">
                              Staff Information
                            </h4>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                  {vehicle.site_allocated.staff.driver}
                                </p>
                                <p className="text-sm text-gray-600">Drivers</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                  {vehicle.site_allocated.staff.admin}
                                </p>
                                <p className="text-sm text-gray-600">Admin</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">
                                  {vehicle.site_allocated.staff.mechanic}
                                </p>
                                <p className="text-sm text-gray-600">Mechanics</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                  {vehicle.site_allocated.staff.total}
                                </p>
                                <p className="text-sm text-gray-600">Total</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Site Presence */}
                        {vehicle.site_allocated.presence && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-3">
                              Site Presence
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Early Shift</p>
                                <p className="font-medium">
                                  {vehicle.site_allocated.presence.early}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Middle Shift
                                </p>
                                <p className="font-medium">
                                  {vehicle.site_allocated.presence.middle}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Night Shift</p>
                                <p className="font-medium">
                                  {vehicle.site_allocated.presence.night}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Supervisor</p>
                                <p className="font-medium">
                                  {vehicle.site_allocated.presence.supervisor}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-600">
                        No site allocated to this vehicle. Please select a site in edit mode.
                             {isEditing ? (
                              sitesLoading ? (
                                <p className="text-sm text-gray-600">Loading sites...</p>
                              ) : sites.length === 0 ? (
                                <p className="text-sm text-red-600">No sites available</p>
                              ) : (
                                <select
                                  value={editVehicle.site_allocated?.id?.toString() || ""}
                                  onChange={(e) =>
                                    handleSiteAllocatedChange(
                                      e.target.value ? Number(e.target.value) : null
                                    )
                                  }
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="">Select a site</option>
                                  {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                      {site.name}
                                    </option>
                                  ))}
                                </select>
                              )
                            ): null}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}