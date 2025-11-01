"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Save,
  Edit,
  X,
  MapPin,
  Info,
  FileText,
  Gauge,
  Clock,
  Users,
  Camera,
  Download,
  Eye,
  Upload,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import API_URL from "@/app/utils/ENV";
import ImageUploader from "@/components/Media/UploadImage";
import InspectionDialog from "@/components/Vehicles/expiry/InspectionDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Site {
  id: number;
  name: string;
  contact_name?: string;
  address?: string;
  postcode?: string;
  image?: string;
}

interface Driver {
  id: number;
  full_name: string;
  avatar: string | null;
  email: string;
  sites: Site[];
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_status: string;
  is_roadworthy: boolean;
  walkaround_count: number | null;
  last_mileage: string | null;
  vehicle_cost?: number;
  vehicle_picture?: string;
  assignee_driver: Driver | null; // <-- now null if no driver
  vehicles_type: {
    id: number;
    name: string;
    description: string;
  };
  site_allocated?: Site | Site[];
  warnings: string[];
  missing_attributes: string[];
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
  inspection_expire: string;
  tacho_calibration_expiry: string;
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
  log_book?: string;
  mot_docs?: string;
  insurance?: string;
  tax?: string;
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

const STATUS_CHOICES = [
  { value: "available", label: "Available", color: "bg-green-500" },
  { value: "unavailable", label: "Unavailable", color: "bg-red-500" },
  { value: "minor_defect", label: "Minor Defect", color: "bg-yellow-500" },
  { value: "assigned", label: "Assigned", color: "bg-blue-500" },
  { value: "disable", label: "Disabled", color: "bg-gray-500" },
];

export default function VehicleDetailPage() {
  const { id } = useParams();
  const cookies = useCookies();
  const token = cookies.get("access_token");
const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]); // <-- NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [editDateField, setEditDateField] = useState<keyof Vehicle | null>(null);
  const [tempDate, setTempDate] = useState<string>("");
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  // NEW: Driver assignment states
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehicleRes, sitesRes, driversRes] = await Promise.all([
          fetch(`${API_URL}/api/vehicles/${id}/`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/sites/list-names/`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/list-names/?role=driver`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          }),
        ]);

        const [vehicleData, sitesData, driversData] = await Promise.all([
          vehicleRes.json(),
          sitesRes.json(),
          driversRes.json(),
        ]);

        if (vehicleData.success) {
          setVehicle(vehicleData.data);
          setEditVehicle(vehicleData.data);
        }
        if (sitesData.success) setSites(sitesData.data);
        if (driversData.success) setDrivers(driversData.data);
      } catch (err) {
        setError("Error fetching data");
        showToast("Error fetching data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) fetchData();
  }, [id, token]);

  const handleEditToggle = () => {
    if (isEditing) setEditVehicle(vehicle);
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!editVehicle || !token) return;
    setSaving(true);
    try {
      const vehicleData = {
        registration_number: editVehicle.registration_number,
        vehicle_status: editVehicle.vehicle_status,
        is_roadworthy: editVehicle.is_roadworthy,
        mot_expiry: editVehicle.mot_expiry,
        tax_expiry: editVehicle.tax_expiry,
        insurance_expiry: editVehicle.insurance_expiry,
        inspection_expire: editVehicle.inspection_expire,
        tacho_calibration_expiry: editVehicle.tacho_calibration_expiry,
        walkaround_count: editVehicle.walkaround_count,
        last_mileage: editVehicle.last_mileage,
        vehicles_type: editVehicle.vehicles_type.id,
        site_allocated: (() => {
          if (!editVehicle.site_allocated) return [];
          if (Array.isArray(editVehicle.site_allocated)) return editVehicle.site_allocated.map(s => s.id);
          return [editVehicle.site_allocated.id];
        })(),
        vehicle_cost: editVehicle.vehicle_cost,
        tyre_expiry_front_driver: editVehicle.tyre_expiry_front_driver,
        tyre_expiry_front_passenger: editVehicle.tyre_expiry_front_passenger,
        tyre_expiry_rear_outer_driver: editVehicle.tyre_expiry_rear_outer_driver,
        tyre_expiry_rear_outer_passenger: editVehicle.tyre_expiry_rear_outer_passenger,
        tyre_pressure_front_driver: editVehicle.tyre_pressure_front_driver,
        tyre_pressure_front_passenger: editVehicle.tyre_pressure_front_passenger,
        tyre_pressure_rear_outer_driver: editVehicle.tyre_pressure_rear_outer_driver,
        tyre_pressure_rear_outer_passenger: editVehicle.tyre_pressure_rear_outer_passenger,
        tyre_depth_front_driver: editVehicle.tyre_depth_front_driver,
        tyre_depth_front_passenger: editVehicle.tyre_depth_front_passenger,
        tyre_depth_rear_outer_driver: editVehicle.tyre_depth_rear_outer_driver,
        tyre_depth_rear_outer_passenger: editVehicle.tyre_depth_rear_outer_passenger,
      };

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
        showToast("Vehicle updated successfully", "success");
      } else {
        showToast(updatedData.message || "Failed to update vehicle", "error");
        throw new Error(updatedData.message || "Failed to update vehicle");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Vehicle, value: any) => {
    setEditVehicle((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleImageUpload = async (imageUrl: string) => {
    if (!token) return;
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
        setVehicle((prev) => (prev ? { ...prev, vehicle_picture: imageUrl } : prev));
        setEditVehicle((prev) => (prev ? { ...prev, vehicle_picture: imageUrl } : prev));
        showToast("Image updated successfully", "success");
      }
    } catch (err) {
      showToast("Error updating image", "error");
    }
  };

  const handleDocumentUpload = async (docType: string, file: File) => {
    if (!token) return;
    setUploadingDoc(docType);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`${API_URL}/api/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [docType]: uploadData.url }),
        });

        if (res.ok) {
          const docUrl = uploadData.url;
          setVehicle((prev) => (prev ? { ...prev, [docType]: docUrl } : prev));
          setEditVehicle((prev) => (prev ? { ...prev, [docType]: docUrl } : prev));
          showToast(`${docType.replace("_", " ")} updated successfully`, "success");
        }
      }
    } catch (err) {
      showToast("Error uploading document", "error");
    } finally {
      setUploadingDoc(null);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (days: number | null) => {
    if (days === null) return { color: "bg-gray-100 text-gray-700", text: "N/A" };
    if (days < 0) return { color: "bg-red-500 text-white", text: "EXPIRED" };
    if (days <= 30) return { color: "bg-red-100 text-red-700", text: `${days} days` };
    if (days <= 60) return { color: "bg-yellow-100 text-yellow-700", text: `${days} days` };
    return { color: "bg-green-100 text-green-700", text: `${days} days` };
  };

  const getStatusBadgeColors = (status: string) => {
    const choice = STATUS_CHOICES.find((s) => s.value === status);
    return choice?.color || "bg-gray-500";
  };

  const openEditDateDialog = (field: keyof Vehicle, currentValue: string) => {
    if (field === "inspection_expire") {
      setIsInspectionDialogOpen(true);
      return;
    }
    setEditDateField(field);
    setTempDate(currentValue || "");
  };

  const handleDateSave = () => {
    if (!tempDate) {
      showToast("Please select a valid date", "error");
      return;
    }
    if (editDateField === "inspection_expire") {
      setIsInspectionDialogOpen(true);
    } else if (editDateField) {
      handleInputChange(editDateField, tempDate);
      setEditDateField(null);
      setTempDate("");
    }
  };

const assignDriver = async (driverId: number) => {
  if (!token) return;
  setAssigning(true);
  try {
    const res = await fetch(`${API_URL}/api/vehicles/${id}/assign-driver/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ driver_id: driverId }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Refresh vehicle data
      const refreshed = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedData = await refreshed.json();
      if (refreshedData.success) {
        setVehicle(refreshedData.data);
        setEditVehicle(refreshedData.data);
      }
      showToast("Driver assigned successfully", "success");
      setSelectedDriverId(""); // reset dropdown
    } else {
      // Show backend error message
      alert(data.message || "Failed to assign driver")
      showToast(data.message || "Failed to assign driver", "error");
    }
  } catch (e) {
    showToast("Network error", "error");
  } finally {
    setAssigning(false);
  }
};

  const unassignDriver = async () => {
    if (!token || !vehicle?.assignee_driver) return;
    setUnassigning(true);
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/unassign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ driver_id: vehicle.assignee_driver.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const refreshed = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshedData = await refreshed.json();
        if (refreshedData.success) {
          setVehicle(refreshedData.data);
          setEditVehicle(refreshedData.data);
        }
        showToast("Driver unassigned", "success");
      } else {
        showToast(data.message || "Failed to unassign driver", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setUnassigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle || !editVehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || "Vehicle not found"}</p>
        </Card>
      </div>
    );
  }

  const vatRate = 0.2;
  const vatAmount = (vehicle.vehicle_cost || 0) * vatRate;
  const totalAmount = (vehicle.vehicle_cost || 0) + vatAmount;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-16 rounded-full ${getStatusBadgeColors(vehicle.vehicle_status)}`}></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{vehicle.registration_number}</h1>
                <p className="text-gray-600 mt-1">{vehicle.vehicles_type.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusBadgeColors(vehicle.vehicle_status)} text-white px-4 py-2 text-sm`}>
                {STATUS_CHOICES.find((s) => s.value === vehicle.vehicle_status)?.label}
              </Badge>
              <Badge className={vehicle.is_roadworthy ? "bg-green-500 text-white px-4 py-2" : "bg-red-500 text-white px-4 py-2"}>
                {vehicle.is_roadworthy ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
                {vehicle.is_roadworthy ? "Roadworthy" : "Not Roadworthy"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Warnings & Alerts */}
        {(vehicle.warnings?.length > 0 || vehicle.missing_attributes?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicle.warnings?.length > 0 && (
              <Card className="p-5 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-600">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-red-900">Active Warnings</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-700 hover:text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Warnings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {vehicle.warnings.map((warning, idx) => (
                        <DropdownMenuItem key={idx} className="text-red-800 text-sm">
                          {warning}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )}
            {vehicle.missing_attributes?.length > 0 && (
              <Card className="p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-600">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-yellow-900">Missing Information</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-yellow-700 hover:text-yellow-600">
                        <Info className="w-5 h-5 text-yellow-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Missing Attributes</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {vehicle.missing_attributes.map((attr, idx) => (
                        <DropdownMenuItem key={idx} className="text-yellow-800 text-sm">
                          {attr}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
            <TabsTrigger value="overview" className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Info className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Clock className="w-4 h-4 mr-2" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="tyres" className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Gauge className="w-4 h-4 mr-2" />
              Tyres
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="site" className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </TabsTrigger>
            {/* NEW TAB */}
            <TabsTrigger value="driver" className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Users className="w-4 h-4 mr-2" />
              Driver
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange-600" />
                  Vehicle Image
                </h3>
                <div className="space-y-4">
                  {vehicle.vehicle_picture ? (
                    <div className="relative group">
                      <img src={vehicle.vehicle_picture} alt="Vehicle" className="w-full h-56 object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="sm" className="bg-white text-gray-900" onClick={() => window.open(vehicle.vehicle_picture, '_blank')}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center">
                      <Camera className="w-16 h-16 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No image uploaded</p>
                    </div>
                  )}
                  {isEditing && <ImageUploader onUploadSuccess={handleImageUpload} />}
                </div>
              </Card>

              <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm lg:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-orange-600" />
                  General Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration Number</Label>
                    {isEditing ? (
                      <Input
                        value={editVehicle.registration_number}
                        onChange={(e) => handleInputChange("registration_number", e.target.value)}
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-lg font-semibold text-gray-900">{vehicle.registration_number}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</Label>
                    {isEditing ? (
                      <select
                        value={editVehicle.vehicle_status}
                        onChange={(e) => handleInputChange("vehicle_status", e.target.value)}
                        className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        {STATUS_CHOICES.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-2">
                        <Badge className={`${getStatusBadgeColors(vehicle.vehicle_status)} text-white px-3 py-1`}>
                          {STATUS_CHOICES.find((s) => s.value === vehicle.vehicle_status)?.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roadworthy Status</Label>
                    {isEditing ? (
                      <div className="flex items-center space-x-3 mt-2">
                        <Switch
                          checked={editVehicle.is_roadworthy}
                          onCheckedChange={(checked) => handleInputChange("is_roadworthy", checked)}
                        />
                        <span className="text-sm font-medium">{editVehicle.is_roadworthy ? "Roadworthy" : "Not Roadworthy"}</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <Badge className={vehicle.is_roadworthy ? "bg-green-500 text-white px-3 py-1" : "bg-red-500 text-white px-3 py-1"}>
                          {vehicle.is_roadworthy ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Type</Label>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{vehicle.vehicles_type.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Mileage</Label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={editVehicle.last_mileage || ""}
                        onChange={(e) => handleInputChange("last_mileage", e.target.value)}
                        className="mt-2"
                        placeholder="e.g., 45000"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Gauge className="w-5 h-5 text-blue-500" />
                        <p className="text-lg font-semibold">{vehicle.last_mileage ? `${vehicle.last_mileage} miles` : "N/A"}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Walkarounds</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editVehicle.walkaround_count || 0}
                        onChange={(e) => handleInputChange("walkaround_count", Number(e.target.value))}
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-lg font-semibold text-gray-900">{vehicle.walkaround_count || 0}</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Cost</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.vehicle_cost || 0}
                      onChange={(e) => handleInputChange("vehicle_cost", Number(e.target.value))}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-2xl font-bold text-green-600">£{(vehicle.vehicle_cost || 0).toLocaleString()}</p>
                  )}
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">VAT (20%)</Label>
                  <p className="mt-2 text-2xl font-bold text-green-600">£{vatAmount.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg">
                  <Label className="text-xs font-semibold text-green-100 uppercase tracking-wide">Total Cost</Label>
                  <p className="mt-2 text-2xl font-bold text-white">£{totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            {/* Assigned Driver in Overview */}
            {vehicle.assignee_driver && (
              <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Assigned Driver
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{vehicle.assignee_driver.full_name}</p>
                    <p className="text-sm text-gray-600">{vehicle.assignee_driver.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={unassignDriver} disabled={unassigning}>
                    {unassigning ? "Unassigning…" : "Unassign"}
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-orange-600" />
                Compliance & Expiry Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "MOT Expiry", field: "mot_expiry", expiring: vehicle.status_indicators.mot_expiring, icon: FileText },
                  { label: "Tax Expiry", field: "tax_expiry", expiring: vehicle.status_indicators.tax_expiring, icon: DollarSign },
                  { label: "Insurance Expiry", field: "insurance_expiry", expiring: vehicle.status_indicators.insurance_expiring, icon: FileText },
                  { label: "Inspection Expiry", field: "inspection_expire", expiring: vehicle.status_indicators.inspection_due, icon: CheckCircle },
                  { label: "Tacho Calibration", field: "tacho_calibration_expiry", expiring: false, icon: Gauge },
                ].map((item) => {
                  const value = vehicle[item.field as keyof Vehicle] as string;
                  const days = getDaysUntilExpiry(value);
                  const status = getExpiryStatus(days);
                  const Icon = item.icon;

                  return (
                    <div key={item.field} className={`p-5 rounded-xl border-2 transition-all ${
                      days !== null && days < 0 ? "bg-red-50 border-red-500" :
                      days !== null && days <= 30 ? "bg-yellow-50 border-yellow-500" :
                      "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="font-semibold text-gray-900">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={status.color}>
                            {status.text}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDateDialog(item.field as keyof Vehicle, value)}
                            className="text-gray-600 hover:text-orange-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-lg font-bold text-gray-900">{value || "Not Set"}</p>
                      </div>
                      {days !== null && days >= 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                days <= 30 ? "bg-red-500" : days <= 60 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(100, (days / 365) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Date Edit Dialog */}
          <Dialog open={!!editDateField} onOpenChange={() => setEditDateField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Edit{" "}
                  {editDateField &&
                    [
                      { field: "mot_expiry", label: "MOT Expiry" },
                      { field: "tax_expiry", label: "Tax Expiry" },
                      { field: "insurance_expiry", label: "Insurance Expiry" },
                      { field: "inspection_expire", label: "Inspection Expiry" },
                      { field: "tacho_calibration_expiry", label: "Tacho Calibration" },
                    ].find((item) => item.field === editDateField)?.label}{" "}
                  Date
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label className="text-sm font-medium">Select Date</Label>
                <Input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDateField(null)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDateSave}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Inspection Dialog */}
          <InspectionDialog
            open={isInspectionDialogOpen}
            onClose={() => {
              setIsInspectionDialogOpen(false);
              setEditDateField(null);
              setTempDate("");
            }}
            lastPMIDate={vehicle?.inspection_expire || tempDate}
            vehicleId={Number(Array.isArray(id) ? id[0] : id) || 0}
            vehicleRegistration={vehicle?.registration_number || ""}
            username={username || "current_user"}
            onUpdateSuccess={() => {
              if (tempDate) {
                handleInputChange("inspection_expire", tempDate);
              }
              setIsInspectionDialogOpen(false);
              setEditDateField(null);
              setTempDate("");
              showToast("Inspection updated successfully", "success");
            }}
          />

          {/* Tyres Tab */}
          <TabsContent value="tyres" className="space-y-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Gauge className="w-6 h-6 text-orange-600" />
                Tyre Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Front Driver", key: "front_driver", expiring: vehicle.tyre_expiry_status.front_driver_expiring },
                  { label: "Front Passenger", key: "front_passenger", expiring: vehicle.tyre_expiry_status.front_passenger_expiring },
                  { label: "Rear Outer Driver", key: "rear_outer_driver", expiring: vehicle.tyre_expiry_status.rear_outer_driver_expiring },
                  { label: "Rear Outer Passenger", key: "rear_outer_passenger", expiring: vehicle.tyre_expiry_status.rear_outer_passenger_expiring },
                ].map((tyre) => {
                  const expiryField = `tyre_expiry_${tyre.key}` as keyof Vehicle;
                  const pressureField = `tyre_pressure_${tyre.key}` as keyof Vehicle;
                  const depthField = `tyre_depth_${tyre.key}` as keyof Vehicle;

                  return (
                    <div key={tyre.key} className={`p-5 rounded-xl border-2 transition-all ${
                      tyre.expiring ? "bg-red-50 border-red-500 shadow-lg" : "bg-blue-50 border-blue-200"
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-lg">{tyre.label}</h4>
                        {tyre.expiring && (
                          <Badge className="bg-red-500 text-white animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-semibold text-gray-600 uppercase">Expiry Date</Label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editVehicle[expiryField] as string || ""}
                              onChange={(e) => handleInputChange(expiryField, e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 px-3 py-2 bg-white rounded-lg text-sm font-semibold">
                              {vehicle[expiryField] as string || "Not Set"}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-600 uppercase">Pressure (PSI)</Label>
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editVehicle[pressureField] as string || ""}
                              onChange={(e) => handleInputChange(pressureField, e.target.value)}
                              className="mt-1"
                              placeholder="e.g., 32"
                            />
                          ) : (
                            <p className="mt-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                              {vehicle[pressureField] as string || "N/A"} PSI
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-600 uppercase">Tread Depth (mm)</Label>
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editVehicle[depthField] as string || ""}
                              onChange={(e) => handleInputChange(depthField, e.target.value)}
                              className="mt-1"
                              placeholder="e.g., 5.5"
                            />
                          ) : (
                            <p className="mt-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold">
                              {vehicle[depthField] as string || "N/A"} mm
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-orange-600" />
                Vehicle Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "log_book", label: "Log Book / V5C", expiryField: null, icon: FileText },
                  { key: "mot_docs", label: "MOT Certificate", expiryField: "mot_expiry", icon: CheckCircle },
                  { key: "insurance", label: "Insurance Certificate", expiryField: "insurance_expiry", icon: FileText },
                  { key: "tax", label: "Tax Document", expiryField: "tax_expiry", icon: DollarSign },
                ].map(({ key, label, expiryField, icon: Icon }) => {
                  const docUrl = vehicle[key as keyof Vehicle] as string;
                  const expiryDate = expiryField ? vehicle[expiryField as keyof Vehicle] as string : null;
                  const days = expiryDate ? getDaysUntilExpiry(expiryDate) : null;
                  const status = days ? getExpiryStatus(days) : null;

                  return (
                    <div key={key} className={`p-5 rounded-xl border-2 transition-all ${
                      docUrl ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${docUrl ? "text-green-600" : "text-gray-400"}`} />
                          <span className="font-semibold text-gray-900">{label}</span>
                        </div>
                        {docUrl ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {expiryDate && status && (
                        <div className="mb-3">
                          <Badge className={status.color}>
                            Expires: {expiryDate} ({status.text})
                          </Badge>
                        </div>
                      )}
                      {docUrl ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewDoc(docUrl)}
                              className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(docUrl, '_blank')}
                              className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          {isEditing && (
                            <div className="relative">
                              <input
                                type="file"
                                id={`upload-${key}`}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocumentUpload(key, file);
                                }}
                              />
                              <label htmlFor={`upload-${key}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                                  onClick={() => document.getElementById(`upload-${key}`)?.click()}
                                  disabled={uploadingDoc === key}
                                  type="button"
                                >
                                  {uploadingDoc === key ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Replace
                                    </>
                                  )}
                                </Button>
                              </label>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 text-center py-4">No document uploaded</p>
                          {isEditing && (
                            <div className="relative">
                              <input
                                type="file"
                                id={`upload-${key}`}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocumentUpload(key, file);
                                }}
                              />
                              <label htmlFor={`upload-${key}`}>
                                <Button
                                  size="sm"
                                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                  onClick={() => document.getElementById(`upload-${key}`)?.click()}
                                  disabled={uploadingDoc === key}
                                  type="button"
                                >
                                  {uploadingDoc === key ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Document
                                    </>
                                  )}
                                </Button>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Site Tab */}
          <TabsContent value="site" className="space-y-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-orange-600" />
                Site Allocation
              </h3>
              {vehicle.site_allocated ? (
                <div className="space-y-6">
                  {(Array.isArray(vehicle.site_allocated) ? vehicle.site_allocated[0]?.image : vehicle.site_allocated?.image) && (
                    <div className="relative group">
                      <img 
                        src={Array.isArray(vehicle.site_allocated) ? vehicle.site_allocated[0]?.image : vehicle.site_allocated?.image} 
                        alt="Site" 
                        className="w-full h-64 object-cover rounded-xl shadow-lg" 
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button 
                          size="sm" 
                          className="bg-white text-gray-900"
                          onClick={() => window.open(Array.isArray(vehicle.site_allocated) ? vehicle.site_allocated[0]?.image || "" : vehicle.site_allocated?.image || "", '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Full Image
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-5 rounded-xl">
                      <Label className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 block">Site Name</Label>
                      {isEditing ? (
                        <select
                          value={Array.isArray(vehicle.site_allocated) ? vehicle.site_allocated[0]?.id : vehicle.site_allocated?.id}
                          onChange={(e) => {
                            const site = sites.find(s => s.id === Number(e.target.value));
                            handleInputChange("site_allocated", site);
                          }}
                          className="w-full p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a site</option>
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {Array.isArray(vehicle.site_allocated) ? vehicle.site_allocated[0]?.name : vehicle.site_allocated?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No site allocated to this vehicle</p>
                  {isEditing && (
                    <select
                      value={Array.isArray(editVehicle.site_allocated) ? editVehicle.site_allocated[0]?.id : editVehicle.site_allocated?.id}
                      onChange={(e) => {
                        const site = sites.find(s => s.id === Number(e.target.value));
                        handleInputChange("site_allocated", site);
                      }}
                      className="w-full max-w-md mx-auto p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select a site</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

     {/* NEW: Driver Tab – using shadcn Select */}
{/* Driver Tab – shadcn Select + Manual Assign */}
<TabsContent value="driver" className="space-y-6">
  <Card className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
    <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <Users className="w-6 h-6 text-orange-600" />
      Driver Assignment
    </h3>

    {drivers.length === 0 ? (
      <p className="text-center text-gray-500">Loading drivers...</p>
    ) : (
      <div className="space-y-6">
        {/* Current Assigned Driver */}
        {vehicle.assignee_driver && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{vehicle.assignee_driver.full_name}</p>
                <p className="text-sm text-gray-600">{vehicle.assignee_driver.email}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={unassignDriver}
                disabled={unassigning}
              >
                {unassigning ? "Unassigning..." : "Unassign"}
              </Button>
            </div>
          </div>
        )}

        {/* Select + Assign */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-sm font-medium">
              {vehicle.assignee_driver ? "Change driver" : "Assign driver"}
            </Label>

            <Select
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
              disabled={assigning}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="-- Select a driver --" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              if (!selectedDriverId) {
                showToast("Please select a driver first", "error");
                return;
              }
              assignDriver(Number(selectedDriverId));
            }}
            disabled={assigning || !selectedDriverId}
            className="bg-orange-600 hover:bg-orange-700 min-w-[100px]"
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </div>

        {/* Optional: Show error below */}
        {/* You can add a small error message here if needed */}
      </div>
    )}
  </Card>
</TabsContent>
        </Tabs>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Document Preview</h3>
                <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {previewDoc.endsWith('.pdf') ? (
                  <iframe src={previewDoc} className="w-full h-[70vh]" />
                ) : (
                  <img src={previewDoc} alt="Document" className="w-full h-auto" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fixed Action Buttons */}
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 rounded-xl shadow-2xl transition-all transform hover:scale-105 w-56"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                <span className="font-semibold">Save Changes</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                disabled={saving}
                className="border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-6 rounded-xl shadow-xl transition-all transform hover:scale-105 w-56"
              >
                <X className="h-5 w-5 mr-2" />
                <span className="font-semibold">Cancel</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditToggle}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-6 rounded-xl shadow-2xl transition-all transform hover:scale-105 w-56"
            >
              <Edit className="h-5 w-5 mr-2" />
              <span className="font-semibold">Edit Vehicle</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}