"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck,
  TriangleAlert,
  Save,
  Edit,
  X,
  Car,
  MapPin,
  Shapes,
  NotebookPen,
  Info,
  ChartLine,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import ExpiryDates from "@/components/Vehicles/VehicleEditExpiry";
import { useAutoScroll } from "@/app/utils/useAutoScroll";

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_status: string;
  is_roadworthy: boolean;
  walkaround_count: number | null;
  last_milage: string;
  assignee_driver: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  vehicles_type: {
    id: number;
    name: string;
    description: string;
  };
  site_allocated: {
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
  };
  warnings: string[];
  missing_attributes: string[];
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
  inspection_expire: string;
  tacho_calibration: string;
  tyre_expiry_front_driver: string | null;
  tyre_expiry_front_passenger: string | null;
  tyre_expiry_rear_outer_driver: string | null;
  tyre_expiry_rear_outer_passenger: string | null;
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

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token");

  const { expandedId, handleExpandedChange } = useAutoScroll(loading, "vehicle_maintenance_docs");

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
        if (data.success) {
          setVehicle(data.data);
          setEditVehicle(data.data);
        } else {
          throw new Error("Failed to fetch vehicle data");
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch vehicle details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id && token) fetchVehicle();
    else setError("Missing vehicle ID or access token");
  }, [id, token]);

  const handleInputChange = (field: keyof Vehicle, value: any) => {
    setEditVehicle((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSiteAllocatedChange = (
    field: keyof Vehicle["site_allocated"],
    value: any
  ) => {
    setEditVehicle((prev) =>
      prev
        ? {
            ...prev,
            site_allocated: { ...prev.site_allocated, [field]: value },
          }
        : prev
    );
  };

  const handleVehicleTypeChange = (
    field: keyof Vehicle["vehicles_type"],
    value: any
  ) => {
    setEditVehicle((prev) =>
      prev
        ? { ...prev, vehicles_type: { ...prev.vehicles_type, [field]: value } }
        : prev
    );
  };

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
      site_allocated: editVehicle.site_allocated.id,
      };

      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleData),
      });

      if (!res.ok) {
        throw new Error(`Failed to update vehicle: ${res.statusText}`);
      }

      const updatedVehicle = await res.json();
      setVehicle(updatedVehicle.data);
      setEditVehicle(updatedVehicle.data);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error updating vehicle data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColors = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoadworthyBadgeColors = (isRoadworthy: boolean) => {
    return isRoadworthy
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

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

  return (
    <div className="p-6 bg-white min-h-screen">
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

      {vehicle.warnings && vehicle.warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <TriangleAlert className="w-5 h-5" />
            <span>Warnings</span>
          </div>
          <ul className="space-y-1">
            {vehicle.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-red-600">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6 ">
            {/* Vehicle Type */}
            <Card className="p-6 bg-rose-50 border-l-6 border-red-800 rounded">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <MapPin className="w-7 h-7 rounded-full text-red-500" />
                <span>Vehicle Type</span>
              </div>

              <div className="grid grid-cols-2  gap-1">
                <div className="flex flex-col items-center p-4 bg-white ">
                  <Shapes className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">16-Seater Mini</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-white ">
                  <NotebookPen className="w-12 h-12 text-gray-800 mb-2" />
                  <Badge className="text-sm font-medium bg-orange-100  text-orange-700">
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

              <div className="grid grid-cols-2  gap-6">
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
                    <Input
                      type="text"
                      value={editVehicle.vehicle_status}
                      onChange={(e) =>
                        handleInputChange("vehicle_status", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <Badge className="bg-green-100 text-green-700 text-sm font-medium">
                      {vehicle.vehicle_status}
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
                      className={`text-sm font-medium ${
                        vehicle.is_roadworthy
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
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
                      value={editVehicle.walkaround_count || 1}
                      onChange={(e) =>
                        handleInputChange(
                          "walkaround_count",
                          Number.parseInt(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.walkaround_count || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Site Allocated */}
            <Card className="p-6 bg-gray-100 border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <MapPin className="w-6 h-6 rounded-full text-red-500" />
                <span>Site Allocated</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Site Name</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated?.name}
                      onChange={(e) =>
                        handleSiteAllocatedChange("name", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.name}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact Name</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated?.contact_name}
                      onChange={(e) =>
                        handleSiteAllocatedChange(
                          "contact_name",
                          e.target.value
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.contact_name}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated?.address}
                      onChange={(e) =>
                        handleSiteAllocatedChange("address", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.address || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated?.status}
                      onChange={(e) =>
                        handleSiteAllocatedChange("status", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <Badge className="bg-green-100 text-green-700 text-sm font-medium">
                      {vehicle.site_allocated.status}
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Post Code</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated?.postcode}
                      onChange={(e) =>
                        handleSiteAllocatedChange("postcode", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.postcode}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Radius</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.site_allocated?.radius_m}
                      onChange={(e) =>
                        handleSiteAllocatedChange(
                          "radius_m",
                          Number.parseInt(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.radius_m} m
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Latitude</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.site_allocated?.latitude}
                      onChange={(e) =>
                        handleSiteAllocatedChange(
                          "latitude",
                          Number.parseFloat(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.latitude}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Longitude</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.site_allocated?.longitude}
                      onChange={(e) =>
                        handleSiteAllocatedChange(
                          "longitude",
                          Number.parseFloat(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.longitude}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">No. of vehicles</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={
                        editVehicle.site_allocated?.number_of_allocated_vehicles
                      }
                      onChange={(e) =>
                        handleSiteAllocatedChange(
                          "number_of_allocated_vehicles",
                          Number.parseInt(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.number_of_allocated_vehicles}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Created By</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated?.created_by}
                      onChange={(e) =>
                        handleSiteAllocatedChange("created_by", e.target.value)
                      }
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {vehicle.site_allocated.created_by}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="px-6 py-3 bg-gray-100 rounded-lg ">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-6">
                <ChartLine className="w-6 h-6 text-orange-500" />
                <span>Quick Stats</span>
              </div>

              <div className="space-y-4 ">
                <div className="flex items-center bg-gray-50 px-1 py-2  rounded justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-700 text-sm font-medium">
                    {vehicle.vehicle_status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Road Worthy</span>
                  <Badge
                    className={`text-sm font-medium ${
                      vehicle.is_roadworthy
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {vehicle.is_roadworthy ? "Yes" : "No"}
                  </Badge>
                </div>

                <div className="flex items-center bg-gray-50 px-1 py-2  rounded  justify-between">
                  <span className="text-sm text-gray-600">
                    Walkaround Count
                  </span>
                  <span className="font-medium text-gray-900">
                    {vehicle.walkaround_count || "N/A"}
                  </span>
                </div>
              </div>
            </Card>

         <ExpiryDates
              mot_expiry={vehicle.mot_expiry}
              vehicle_id={vehicle.id}
              tax_expiry={vehicle.tax_expiry}
              insurance_expiry={vehicle.insurance_expiry}
              inspection_expiry={vehicle.inspection_expire}
              
              status_indicators={vehicle.status_indicators}
          
            />
            {/* Tyre expiry*/}
            <Card className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <Accordion 
        type="single" 
        collapsible
        value={expandedId as string}
        onValueChange={handleExpandedChange}
      >
        <AccordionItem value="tyre-expiry">
          <AccordionTrigger>
            <span className="text-lg font-semibold text-gray-800">
              Tyres Expiry
            </span>
          </AccordionTrigger>

          <AccordionContent>
            {/* Static car tyre map layout */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Passenger Side */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 ">
                <div className="flex items-center gap-2 mb-2">
              
                  <span className="font-medium text-gray-700">
                    Passenger Side
                  </span>
                </div>
                <Image
                  src="/tyre/1 (4).png"
                  alt="Passenger Side Tyre"
                  width={100}
                  height={60}
                  className="object-contain"
                />
                   <div className="mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                 {vehicle.tyre_expiry_front_passenger || "N/A"}
                </div>
              </div>

              {/* Driver Side */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 ">
                <div className="flex items-center gap-2 mb-2">
               
                  <span className="font-medium text-gray-700">
                    Driver Side
                  </span>
                </div>
                <Image
                  src="/tyre/1 (1).png"
                  alt="Driver Side Tyre"
                  width={100}
                  height={60}
                  className="object-contain"
                />
                <div className="mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                 {vehicle.tyre_expiry_front_driver || "N/A"}
                </div>
              </div>

              {/* Back Left Side */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 ">
                <div className="flex items-center gap-2 mb-2">
                 
                  <span className="font-medium text-gray-700">
                    Back Left Side
                  </span>
                </div>
                <Image
                  src="/tyre/1 (3).png"
                  alt="Back Left Side Tyre"
                  width={100}
                  height={60}
                  className="object-contain"
                />
                <div className="mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                  {vehicle.tyre_expiry_rear_outer_driver || "N/A"}
                </div>
              </div>

              {/* Back Right Side */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 ">
                <div className="flex items-center gap-2 mb-2">
                 
                  <span className="font-medium text-gray-700">
                    Back Right Side
                  </span>
                </div>
                <Image
                  src="/tyre/1 (2).png"
                  alt="Back Right Side Tyre"
                  width={100}
                  height={60}
                  className="object-contain"
                />
                <div className="mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                  {vehicle.tyre_expiry_rear_outer_passenger || "N/A"}
                </div>
              </div>
            </div>
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
