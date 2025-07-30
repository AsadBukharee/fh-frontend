"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Truck, MapPin, TriangleAlert, Save, Edit, X, Clock } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Switch } from "@/components/ui/switch";

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_status: string;
  is_roadworthy: boolean;
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
  walkaround_count: number;
  vehicles_type: {
    name: string;
    description: string;
  };
  site_allocated: {
    name: string;
    postcode: string;
    address: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
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
          const updatedData = {
            ...data.data,
            registration_number: data.data.registration_number || "",
            vehicle_status: data.data.vehicle_status || "Active",
            mot_expiry: data.data.mot_expiry || "",
            tax_expiry: data.data.tax_expiry || "",
            insurance_expiry: data.data.insurance_expiry || "",
            vehicles_type: {
              name: data.data.vehicles_type?.name || "",
              description: data.data.vehicles_type?.description || "",
            },
            site_allocated: {
              name: data.data.site_allocated?.name || "",
              postcode: data.data.site_allocated?.postcode || "",
              address: data.data.site_allocated?.address || "",
              contact_name: data.data.site_allocated?.contact_name || "",
              contact_phone: data.data.site_allocated?.contact_phone || "",
              contact_email: data.data.site_allocated?.contact_email || "",
            },
          };
          setVehicle(updatedData);
          setEditVehicle(updatedData);
        } else {
          throw new Error("Failed to fetch vehicle data");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to fetch vehicle details");
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

  const handleSiteAllocatedChange = (field: keyof Vehicle["site_allocated"], value: any) => {
    setEditVehicle((prev) =>
      prev
        ? { ...prev, site_allocated: { ...prev.site_allocated, [field]: value } }
        : prev
    );
  };

  const handleVehicleTypeChange = (field: keyof Vehicle["vehicles_type"], value: any) => {
    setEditVehicle((prev) =>
      prev ? { ...prev, vehicles_type: { ...prev.vehicles_type, [field]: value } } : prev
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
        vehicles_type: editVehicle.vehicles_type,
        site_allocated: editVehicle.site_allocated,
      };

      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
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
      setError(err instanceof Error ? err.message : "Error updating vehicle data");
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
    return isRoadworthy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
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
      <div className="p-6 bg-white min-h-screen">
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
        <h1 className="text-2xl font-bold text-gray-800">
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
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* General Information */}
            <Card className="p-4 border border-gray-200 rounded-lg bg-gray-100">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Truck className="w-5 h-5 text-orange-600" />
                <span>General Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-500">Registration</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.registration_number}
                      onChange={(e) => handleInputChange("registration_number", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.registration_number}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Status</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.vehicle_status}
                      onChange={(e) => handleInputChange("vehicle_status", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <Badge className={`${getStatusBadgeColors(vehicle.vehicle_status)} text-xs font-medium`}>
                      {vehicle.vehicle_status}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Roadworthy</p>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Roadworthy</span>
                      <Switch
                        checked={editVehicle.is_roadworthy}
                        onCheckedChange={(checked) => handleInputChange("is_roadworthy", checked)}
                      />
                    </div>
                  ) : (
                    <Badge className={`${getRoadworthyBadgeColors(vehicle.is_roadworthy)} text-xs font-medium`}>
                      {vehicle.is_roadworthy ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Walkaround Count</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.walkaround_count}
                      onChange={(e) => handleInputChange("walkaround_count", parseInt(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.walkaround_count}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Vehicle Type */}
            <Card className="p-4 border border-orange-200 text-white rounded-lg bg-orange-400">
              <div className="flex items-center gap-2 font-semibold mb-4">
                <Truck className="w-5 h-5 text-white" />
                <span>Vehicle Type</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm ">
                <div>
                  <p className="font-medium ">Type</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.vehicles_type.name}
                      onChange={(e) => handleVehicleTypeChange("name", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.vehicles_type.name}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium ">Description</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.vehicles_type.description}
                      onChange={(e) => handleVehicleTypeChange("description", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.vehicles_type.description}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Site Allocated */}
            <Card className="p-4 border border-gray-200 rounded-lg bg-gray-100">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span>Site Allocated</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-500">Site Name</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated.name}
                      onChange={(e) => handleSiteAllocatedChange("name", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.site_allocated.name}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Postcode</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated.postcode}
                      onChange={(e) => handleSiteAllocatedChange("postcode", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.site_allocated.postcode}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-gray-500">Address</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated.address}
                      onChange={(e) => handleSiteAllocatedChange("address", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.site_allocated.address}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Name</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated.contact_name}
                      onChange={(e) => handleSiteAllocatedChange("contact_name", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.site_allocated.contact_name}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Phone</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editVehicle.site_allocated.contact_phone}
                      onChange={(e) => handleSiteAllocatedChange("contact_phone", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold">{vehicle.site_allocated.contact_phone}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-500">Contact Email</p>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editVehicle.site_allocated.contact_email}
                      onChange={(e) => handleSiteAllocatedChange("contact_email", e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold text-orange-600 hover:underline">
                      <a href={`mailto:${vehicle.site_allocated.contact_email}`}>
                        {vehicle.site_allocated.contact_email}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Expiry Dates */}
            <Card className="p-4 border border-gray-200 rounded-lg bg-gray-100">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Expiry Dates</span>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500">MOT Expiry</span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editVehicle.mot_expiry}
                      onChange={(e) => handleInputChange("mot_expiry", e.target.value)}
                      className="w-1/2"
                    />
                  ) : (
                    <span className="font-semibold">{vehicle.mot_expiry}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500">Tax Expiry</span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editVehicle.tax_expiry}
                      onChange={(e) => handleInputChange("tax_expiry", e.target.value)}
                      className="w-1/2"
                    />
                  ) : (
                    <span className="font-semibold">{vehicle.tax_expiry}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500">Insurance Expiry</span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editVehicle.insurance_expiry}
                      onChange={(e) => handleInputChange("insurance_expiry", e.target.value)}
                      className="w-1/2"
                    />
                  ) : (
                    <span className="font-semibold">{vehicle.insurance_expiry}</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-4 border border-gray-200 rounded-lg bg-gray-100">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
                <Truck className="w-5 h-5 text-orange-600" />
                <span>Quick Stats</span>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge className={`${getStatusBadgeColors(vehicle.vehicle_status)} text-xs font-medium`}>
                    {vehicle.vehicle_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Roadworthy</span>
                  <Badge className={`${getRoadworthyBadgeColors(vehicle.is_roadworthy)} text-xs font-medium`}>
                    {vehicle.is_roadworthy ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Walkaround Count</span>
                  <span className="font-semibold">{vehicle.walkaround_count}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}