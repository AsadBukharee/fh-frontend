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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Save,
  Edit,
  X,
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
  Wrench,
  TestTube,
  AlertCircle,
  FileWarning,
  Shield,
  FileCheck,
  Activity,
  Settings,
  ShipWheelIcon,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import ImageUploader from "@/components/Media/UploadImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/components/Media/MediaUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import InspectionDialog from "@/components/Vehicles/expiry/InspectionDialog";
import MOTDialog from "@/components/Vehicles/expiry/MOTexpiry/MOTdialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { AssignDriverDialog } from "@/components/AssignDriverDialog";

export default function VehicleDetailPage() {
  const { id } = useParams();
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const vehicleId = Array.isArray(id) ? Number(id[0]) : Number(id);
  const [vehicle, setVehicle] = useState<any>(null);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [editDateField, setEditDateField] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>("");
  const [uploadedDoc, setUploadedDoc] = useState<string>("");
  const [skipUpload, setSkipUpload] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [pmiDialogOpen, setPmiDialogOpen] = useState(false);
  const [motDialogOpen, setMotDialogOpen] = useState(false);
  const [showAllCompliance, setShowAllCompliance] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const vehicleData = await vehicleRes.json();
        if (vehicleData.success) {
          setVehicle(vehicleData.data);
          const formattedData = {
            ...vehicleData.data,
            is_wheelchair_lift_fitted: vehicleData.data.is_wheelchair_lift_fitted === "Yes",
          };
          setEditVehicle(formattedData);
        } else {
          setError("Failed to fetch vehicle data");
        }
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchData();
  }, [id, token]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditVehicle({
        ...vehicle,
        is_wheelchair_lift_fitted: vehicle.is_wheelchair_lift_fitted === "Yes",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!editVehicle || !token) return;

    if (editVehicle.is_tacho_fitted && !editVehicle.tacho_calibration_expiry) {
      toast.error("Tacho calibration expiry date is required when tacho is fitted");
      return;
    }

    if (editVehicle.is_wheelchair_lift_fitted && !editVehicle.loller_test_expiry_date) {
      toast.error("LOLER test expiry date is required when wheelchair lift is fitted");
      return;
    }

    setSaving(true);

    try {
      const vehicleData = {
        registration_number: editVehicle.registration_number,
        vin: editVehicle.vin,
        make: editVehicle.make,
        model: editVehicle.model,
        number_of_seats: editVehicle.number_of_seats,
        mileage_unit: editVehicle.mileage_unit,
        notes: editVehicle.notes,
        is_tacho_fitted: editVehicle.is_tacho_fitted,
        is_wheelchair_lift_fitted: editVehicle.is_wheelchair_lift_fitted ? "Yes" : "No",
        date_of_purchase: editVehicle.date_of_purchase,
        purchased_from: editVehicle.purchased_from,
        purchased_by: editVehicle.purchased_by,
        price: editVehicle.price,
        purchase_mileage: editVehicle.purchase_mileage,
        next_mot_to_be_booked_from: editVehicle.next_mot_to_be_booked_from,
        has_vat: editVehicle.has_vat,
        last_mileage: editVehicle.last_mileage,
        mot_expiry: editVehicle.mot_expiry,
        tax_expiry: editVehicle.tax_expiry,
        insurance_expiry: editVehicle.insurance_expiry,
        pmi_expiry: editVehicle.pmi_expiry,
        loller_test_expiry_date: editVehicle.loller_test_expiry_date,
        tacho_calibration_expiry: editVehicle.tacho_calibration_expiry,
        last_pmi_date: editVehicle.last_pmi_date,
        pmi_booked_date: editVehicle.pmi_booked_date,
        next_loller_test_date: editVehicle.next_loller_test_date,
        tyre_pressure_front_driver: editVehicle.tyre_pressure_front_driver,
        tyre_pressure_front_passenger: editVehicle.tyre_pressure_front_passenger,
        tyre_pressure_rear_outer_driver: editVehicle.tyre_pressure_rear_outer_driver,
        tyre_pressure_rear_outer_passenger: editVehicle.tyre_pressure_rear_outer_passenger,
        tyre_pressure_rear_inner_driver: editVehicle.tyre_pressure_rear_inner_driver,
        tyre_pressure_rear_inner_passenger: editVehicle.tyre_pressure_rear_inner_passenger,
        tyre_depth_front_driver: editVehicle.tyre_depth_front_driver,
        tyre_depth_front_passenger: editVehicle.tyre_depth_front_passenger,
        tyre_depth_rear_outer_driver: editVehicle.tyre_depth_rear_outer_driver,
        tyre_depth_rear_outer_passenger: editVehicle.tyre_depth_rear_outer_passenger,
        tyre_depth_rear_inner_driver: editVehicle.tyre_depth_rear_inner_driver,
        tyre_depth_rear_inner_passenger: editVehicle.tyre_depth_rear_inner_passenger,
        tyre_torque_front_driver: editVehicle.tyre_torque_front_driver,
        tyre_torque_front_passenger: editVehicle.tyre_torque_front_passenger,
        tyre_torque_rear_outer_driver: editVehicle.tyre_torque_rear_outer_driver,
        tyre_torque_rear_outer_passenger: editVehicle.tyre_torque_rear_outer_passenger,
        vehicle_status: editVehicle.vehicle_status,
        vehicle_roadworthy_status: editVehicle.vehicle_roadworthy_status,
        is_roadworthy: editVehicle.is_roadworthy,
        is_active: editVehicle.is_active,
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
        const formattedData = {
          ...updatedData.data,
          is_wheelchair_lift_fitted: updatedData.data.is_wheelchair_lift_fitted === "Yes",
        };
        setVehicle(updatedData.data);
        setEditVehicle(formattedData);
        setIsEditing(false);
        toast.success("Vehicle updated successfully");
      } else {
        throw new Error(updatedData.message || "Failed to update vehicle");
      }
    } catch (err: any) {
      console.error("Error updating vehicle:", err);
      toast.error(err.message || "Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditVehicle((prev: any) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleStatusChange = (field: string, value: any) => {
    const newEditVehicle = { ...editVehicle, [field]: value };
    if (field === "vehicle_roadworthy_status") {
      newEditVehicle.is_roadworthy =
        value === "no_defect" || value === "minor_defect_roadworthy";
    }
    setEditVehicle(newEditVehicle);
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
        const updatedData = await res.json();
        if (updatedData.success) {
          setVehicle(updatedData.data);
          setEditVehicle({
            ...updatedData.data,
            is_wheelchair_lift_fitted: updatedData.data.is_wheelchair_lift_fitted === "Yes",
          });
          toast.success("Vehicle image updated");
        }
      }
    } catch (err) {
      console.error("Error updating image:", err);
      toast.error("Failed to update image");
    }
  };

  const handleDocumentUpload = async (docType: string, fileUrl: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [docType]: fileUrl }),
      });
      if (res.ok) {
        const updatedData = await res.json();
        if (updatedData.success) {
          setVehicle(updatedData.data);
          setEditVehicle({
            ...updatedData.data,
            is_wheelchair_lift_fitted: updatedData.data.is_wheelchair_lift_fitted === "Yes",
          });
          toast.success("Document uploaded successfully");
        }
      }
    } catch (err) {
      console.error("Error updating document:", err);
      toast.error("Failed to upload document");
    }
  };

  const handleDateSave = async (documentUrl: string | null) => {
    if (!editDateField || !tempDate) return;

    const toastId = toast.loading("Saving date...");

    try {
      const updateData: any = { [editDateField]: tempDate };
      const dateToDocMap: { [key: string]: string } = {
        mot_expiry: "mot_check_docs",
        tax_expiry: "tax_docs",
        insurance_expiry: "insurance_docs",
        pmi_expiry: "pmi_inspection_docs",
        loller_test_expiry_date: "loller_docs",
        tacho_calibration_expiry: "tacho_calibration_docs",
        next_loller_test_date: "loller_docs",
        last_pmi_date: "pmi_inspection_docs",
      };
      const docField = dateToDocMap[editDateField];
      if (docField && documentUrl) {
        updateData[docField] = documentUrl;
      }

      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      const updatedData = await res.json();

      if (res.ok && updatedData.success) {
        setVehicle(updatedData.data);
        setEditVehicle({
          ...updatedData.data,
          is_wheelchair_lift_fitted: updatedData.data.is_wheelchair_lift_fitted === "Yes",
        });
        setEditDateField(null);
        setTempDate("");
        setUploadedDoc("");
        setSkipUpload(false);
        setDocumentError(null);

        toast.success(
          documentUrl
            ? "Date and document updated successfully"
            : "Date updated successfully. Remember to upload the document later.",
          { id: toastId }
        );
      } else {
        throw new Error(updatedData.message || "Failed to update date");
      }
    } catch (err) {
      console.error("Error updating date:", err);
      setDocumentError("Failed to save. Please try again.");
      toast.error("Failed to update. Please try again.", { id: toastId });
    }
  };

  const openEditDateDialog = (field: string, currentValue: string = "") => {
    if (field === "mot_expiry") {
      setMotDialogOpen(true);
      return;
    }
    if (field === "pmi_expiry") {
      setPmiDialogOpen(true);
      return;
    }
    setEditDateField(field);
    setTempDate(currentValue ? currentValue.split("T")[0] : "");
    setUploadedDoc("");
    setSkipUpload(false);
    setDocumentError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { color: "bg-slate-100 text-slate-600", text: "Not set", icon: AlertCircle };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: "bg-red-50 text-red-600 border-red-200", text: "Expired", icon: AlertTriangle };
    if (diffDays <= 30) return { color: "bg-orange-50 text-orange-600 border-orange-200", text: `${diffDays} days left`, icon: Clock };
    if (diffDays <= 60) return { color: "bg-amber-50 text-amber-600 border-amber-200", text: `${diffDays} days left`, icon: Clock };
    return { color: "bg-emerald-50 text-emerald-600 border-emerald-200", text: "Valid", icon: CheckCircle };
  };

  const hasDocument = (docUrl: string) => {
    return docUrl && docUrl !== "" && docUrl !== "null" && docUrl.length > 0;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "unavailable": return "bg-slate-100 text-slate-700 border-slate-200";
      case "assigned": return "bg-orange-50 text-orange-700 border-orange-200";
      case "disabled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getRoadworthyBadgeColor = (status: string) => {
    switch (status) {
      case "no_defect": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "minor_defect_roadworthy": return "bg-orange-50 text-orange-700 border-orange-200";
      case "minor_defect_not_roadworthy":
      case "major_defect_not_roadworthy": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "unavailable": return "Unavailable";
      case "assigned": return "Assigned";
      case "disabled": return "Disabled";
      default: return status;
    }
  };

  const getRoadworthyDisplayText = (status: string) => {
    switch (status) {
      case "no_defect": return "No Defect";
      case "minor_defect_roadworthy": return "Minor Defect - Roadworthy";
      case "minor_defect_not_roadworthy": return "Minor Defect - Not Roadworthy";
      case "major_defect_not_roadworthy": return "Major Defect - Not Roadworthy";
      default: return status;
    }
  };

  const complianceItems = [
    { key: "mot", label: "MOT Certificate", icon: CheckCircle, dateField: "mot_expiry", docField: "mot_check_docs", color: "orange", hasDialog: true },
    { key: "insurance", label: "Insurance", icon: Shield, dateField: "insurance_expiry", docField: "insurance_docs", color: "purple" },
    { key: "tax", label: "Road Tax", icon: DollarSign, dateField: "tax_expiry", docField: "tax_docs", color: "green" },
    { key: "pmi", label: "PMI Inspection", icon: Wrench, dateField: "pmi_expiry", docField: "pmi_inspection_docs", color: "orange", hasDialog: true },
    { key: "loller", label: "LOLER Test", icon: TestTube, dateField: "loller_test_expiry_date", docField: "loller_docs", color: "pink", requiredForWheelchair: true },
    { key: "tacho", label: "Tacho Calibration", icon: Gauge, dateField: "tacho_calibration_expiry", docField: "tacho_calibration_docs", color: "indigo", requiredForTacho: true },
  ];

  const additionalDocuments = [
    { key: "vehicle_invoice_docs", label: "Vehicle Invoice", icon: FileText },
    { key: "service_records_docs", label: "Service Records", icon: Wrench },
    { key: "new_vehicle_checklist_docs", label: "New Vehicle Checklist", icon: FileCheck },
    { key: "logbook_docs", label: "Log Book / V5C", icon: FileText },
    { key: "COIF_technical_docs", label: "COIF Technical", icon: FileText },
    { key: "others_docs", label: "Other Documents", icon: FileText },
  ];

  const shouldShowComplianceItem = (item: typeof complianceItems[0]) => {
    if (showAllCompliance) return true;

    if (item.key === "tacho") {
      return isEditing ? editVehicle?.is_tacho_fitted : vehicle?.is_tacho_fitted;
    }
    if (item.key === "loller") {
      return isEditing
        ? editVehicle?.is_wheelchair_lift_fitted
        : vehicle?.is_wheelchair_lift_fitted === "Yes";
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto"></div>
            <Activity className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 mt-4 font-medium">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle || !editVehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Vehicle</h3>
          <p className="text-slate-600">{error || "Vehicle not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Vehicle Management</h1>
                  <p className="text-orange-100 text-sm">Complete vehicle profile & compliance</p>
                </div>
              </div>
              <div className="fixed bottom-6 right-6 z-50">
                {isEditing ? (
                  <div className="flex gap-2 rounded-xl bg-white backdrop-blur-md p-3 shadow-lg">
                    <Button variant="outline" onClick={handleEditToggle} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                ) : (
             <div className=" flex gap-4 flex-col">
                  <AssignDriverDialog vehicleId={vehicleId}/>
                  <Button variant="outline" onClick={handleEditToggle}>
                    <Edit className="w-6 h-6 mr-2" />
                    Edit Details
                  </Button>
             </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-6">
                {/* Vehicle Photo Upload */}
                <div className="relative group">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {vehicle.vehicle_picture ? (
                      <img src={vehicle.vehicle_picture} alt="Vehicle" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl font-bold text-slate-400">V</div>
                    )}
                  </div>

                  {(isEditing || !vehicle.vehicle_picture) && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageUploader
                        onUploadSuccess={handleImageUpload}
                        // accept="image/*"
                        // maxSize={5 * 1024 * 1024}
                        // id="vehicle-photo-upload"
                     />
                    </div>
                  )}

                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-md">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {isEditing && activeTab === "overview" ? (
                      <Input
                        value={editVehicle.registration_number}
                        onChange={(e) => handleInputChange("registration_number", e.target.value)}
                        className="text-2xl font-bold h-auto py-1 max-w-xs"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-slate-900">{vehicle.registration_number}</h2>
                    )}
                 
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>VIN: {vehicle.vin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      <span>{vehicle.last_mileage ? `${vehicle.last_mileage} ${vehicle.mileage_unit}` : "No mileage data"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{vehicle.number_of_seats} seats</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-slate-50 p-1 rounded-xl">
              <TabsTrigger value="overview">Vehicle</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Vehicle Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="mr-2">Vehicle Status</Label>
                  {isEditing ? (
                    <Select value={editVehicle.vehicle_status} onValueChange={(v) => handleStatusChange("vehicle_status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${getStatusBadgeColor(vehicle.vehicle_status)} text-sm border text-base`}>
                      {getStatusDisplayText(vehicle.vehicle_status)}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="mr-2">Roadworthy Status</Label>
                  {isEditing ? (
                    <Select value={editVehicle.vehicle_roadworthy_status} onValueChange={(v) => handleStatusChange("vehicle_roadworthy_status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_defect">No Defect</SelectItem>
                        <SelectItem value="minor_defect_roadworthy">Minor Defect - Roadworthy</SelectItem>
                        <SelectItem value="minor_defect_not_roadworthy">Minor Defect - Not Roadworthy</SelectItem>
                        <SelectItem value="major_defect_not_roadworthy">Major Defect - Not Roadworthy</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${getRoadworthyBadgeColor(vehicle.vehicle_roadworthy_status)} border text-base`}>
                      {getRoadworthyDisplayText(vehicle.vehicle_roadworthy_status)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label>Make</Label>
                  {isEditing ? <Input value={editVehicle.make} onChange={(e) => handleInputChange("make", e.target.value)} /> : <p className="font-semibold">{vehicle.make || "Not specified"}</p>}
                </div>
                <div>
                  <Label>Model</Label>
                  {isEditing ? <Input value={editVehicle.model} onChange={(e) => handleInputChange("model", e.target.value)} /> : <p className="font-semibold">{vehicle.model || "Not specified"}</p>}
                </div>
                <div>
                  <Label>Purchase Date</Label>
                  {isEditing ? <Input type="date" value={editVehicle.date_of_purchase || ""} onChange={(e) => handleInputChange("date_of_purchase", e.target.value)} /> : <p className="font-semibold">{vehicle.date_of_purchase ? formatDate(vehicle.date_of_purchase) : "Not specified"}</p>}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <Label>Notes</Label>
                {isEditing ? <Textarea value={editVehicle.notes} onChange={(e) => handleInputChange("notes", e.target.value)} rows={3} /> : <p className="text-sm">{vehicle.notes || "No notes"}</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Purchase Information</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label>Purchased From</Label>
                  {isEditing ? <Input value={editVehicle.purchased_from || ""} onChange={(e) => handleInputChange("purchased_from", e.target.value)} /> : <p className="font-semibold">{vehicle.purchased_from || "Not specified"}</p>}
                </div>
                <div>
                  <Label>Purchase Price</Label>
                  {isEditing ? <Input type="number" value={editVehicle.price || ""} onChange={(e) => handleInputChange("price", e.target.value)} /> : <p className="font-semibold">{vehicle.price ? `£${parseFloat(vehicle.price).toLocaleString()}` : "Not specified"}</p>}
                </div>
                <div>
                  <Label>Purchase Mileage</Label>
                  {isEditing ? <Input type="number" value={editVehicle.purchase_mileage || ""} onChange={(e) => handleInputChange("purchase_mileage", e.target.value)} /> : <p className="font-semibold">{vehicle.purchase_mileage ? `${vehicle.purchase_mileage} ${vehicle.mileage_unit}` : "Not specified"}</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Additional Documents</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalDocuments.map((doc) => {
                  const Icon = doc.icon;
                  const docUrl = vehicle[doc.key as keyof typeof vehicle] as string;
                  const hasDoc = hasDocument(docUrl);
                  return (
                    <div key={doc.key} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{doc.label}</p>
                            <p className="text-xs text-slate-600">{hasDoc ? "Uploaded" : "Not uploaded"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDoc ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(docUrl)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(docUrl, "_blank")}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <FileUploader
                              onUploadSuccess={(url) => handleDocumentUpload(doc.key, url)}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              maxSize={10 * 1024 * 1024}
                              id={`upload-${doc.key}`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tyre Management</h3>
              </div>

              <div className="mb-8">
                <h4 className="font-semibold mb-4">Front Axle</h4>
                <div className="grid grid-cols-2 gap-4">
                  {["front_driver", "front_passenger"].map((pos) => (
                    <div key={pos} className="bg-slate-50 rounded-xl p-4 border">
                      <p className="font-medium capitalize mb-3">{pos.replace("_", " ")}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Pressure</span>
                          {isEditing ? (
                            <Input type="number" value={editVehicle[`tyre_pressure_${pos}`] || ""} onChange={(e) => handleInputChange(`tyre_pressure_${pos}`, e.target.value ? Number(e.target.value) : null)} className="w-20 h-8" />
                          ) : (
                            <span className="font-semibold">{vehicle[`tyre_pressure_${pos}`] || "N/A"} PSI</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span>Depth</span>
                          {isEditing ? (
                            <Input value={editVehicle[`tyre_depth_${pos}`] || ""} onChange={(e) => handleInputChange(`tyre_depth_${pos}`, e.target.value)} className="w-20 h-8" />
                          ) : (
                            <span className="font-semibold">{vehicle[`tyre_depth_${pos}`] || "N/A"} mm</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span>Torque</span>
                          {isEditing ? (
                            <Input type="number" value={editVehicle[`tyre_torque_${pos}`] || ""} onChange={(e) => handleInputChange(`tyre_torque_${pos}`, e.target.value ? Number(e.target.value) : null)} className="w-20 h-8" />
                          ) : (
                            <span className="font-semibold">{vehicle[`tyre_torque_${pos}`] || "N/A"} NM</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Rear Axle</h4>
                <div className="grid grid-cols-4 gap-4">
                  {["rear_outer_driver", "rear_outer_passenger", "rear_inner_driver", "rear_inner_passenger"].map((pos) => (
                    <div key={pos} className="bg-slate-50 rounded-xl p-4 border">
                      <p className="text-xs font-medium capitalize mb-2">{pos.replace(/_/g, " ")}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Pressure</span>
                          {isEditing ? (
                            <Input type="number" value={editVehicle[`tyre_pressure_${pos}`] || ""} onChange={(e) => handleInputChange(`tyre_pressure_${pos}`, e.target.value ? Number(e.target.value) : null)} className="w-16 h-7 text-xs" />
                          ) : (
                            <span className="font-semibold text-xs">{vehicle[`tyre_pressure_${pos}`] || "N/A"} PSI</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span>Depth</span>
                          {isEditing ? (
                            <Input value={editVehicle[`tyre_depth_${pos}`] || ""} onChange={(e) => handleInputChange(`tyre_depth_${pos}`, e.target.value)} className="w-16 h-7 text-xs" />
                          ) : (
                            <span className="font-semibold text-xs">{vehicle[`tyre_depth_${pos}`] || "N/A"} mm</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6 mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Equipment Status</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-xl p-5 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Tacho Fitted</h4>
                        <p className="text-xs text-slate-600">Digital tachograph</p>
                      </div>
                    </div>
                    {isEditing ? (
                      <Switch checked={editVehicle.is_tacho_fitted} onCheckedChange={(c) => handleInputChange("is_tacho_fitted", c)} />
                    ) : (
                      <Badge className={vehicle.is_tacho_fitted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"}>
                        {vehicle.is_tacho_fitted ? "Yes" : "No"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShipWheelIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Wheelchair Lift</h4>
                        <p className="text-xs text-slate-600">Accessibility equipment</p>
                      </div>
                    </div>
                    {isEditing ? (
                      <Switch checked={editVehicle.is_wheelchair_lift_fitted} onCheckedChange={(c) => handleInputChange("is_wheelchair_lift_fitted", c)} />
                    ) : (
                      <Badge className={vehicle.is_wheelchair_lift_fitted === "Yes" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"}>
                        {vehicle.is_wheelchair_lift_fitted}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium">Show All Compliance Items</p>
                  <p className="text-xs text-slate-600">Toggle to show/hide equipment-specific items</p>
                </div>
              </div>
              <Switch checked={showAllCompliance} onCheckedChange={setShowAllCompliance} />
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceItems.map((item) => {
                if (!shouldShowComplianceItem(item)) return null;

                const dateValue = vehicle[item.dateField as keyof typeof vehicle] as string;
                const docValue = vehicle[item.docField as keyof typeof vehicle] as string;
                const status = getExpiryStatus(dateValue);
                const hasDoc = hasDocument(docValue);
                const Icon = item.icon;
                const StatusIcon = status.icon;

                const isRequired =
                  (item.requiredForTacho && (isEditing ? editVehicle.is_tacho_fitted : vehicle.is_tacho_fitted)) ||
                  (item.requiredForWheelchair && (isEditing ? editVehicle.is_wheelchair_lift_fitted : vehicle.is_wheelchair_lift_fitted === "Yes"));

                return (
                  <div
                    key={item.key}
                    className={`bg-white rounded-2xl shadow-sm border ${isRequired && !dateValue ? "border-red-400 ring-2 ring-red-200" : "border-slate-200"} overflow-hidden`}
                  >
                    <div className={`bg-gradient-to-r from-${item.color}-50 to-${item.color}-100/50 p-4 border-b ${isRequired && !dateValue ? "border-red-200" : `border-${item.color}-200`}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 text-${item.color}-600`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{item.label}</h4>
                              {isRequired && <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>}
                            </div>
                            <p className="text-xs text-slate-600">Expiry & Documentation</p>
                          </div>
                        </div>
                        {item.hasDialog && (
                          <Button size="sm" variant="ghost" onClick={() => item.key === "pmi" ? setPmiDialogOpen(true) : setMotDialogOpen(true)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600">Expiry Date</span>
                          </div>
                          <p className="text-sm font-semibold ml-6">{dateValue ? formatDate(dateValue) : "Not set"}</p>
                        </div>
                        <Badge className={`${status.color} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.text}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600">Document</span>
                          </div>
                          <p className="text-sm font-semibold ml-6">{hasDoc ? "Uploaded" : "Not uploaded"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDoc ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(docValue)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(docValue, "_blank")}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <FileUploader onUploadSuccess={(url) => handleDocumentUpload(item.docField, url)} />
                          )}
                        </div>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => openEditDateDialog(item.dateField, dateValue)} className="w-full">
                        <Calendar className="w-4 h-4 mr-2" />
                        Update Date
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Date Edit Dialog */}
        <Dialog open={!!editDateField} onOpenChange={() => {
          setEditDateField(null);
          setTempDate("");
          setUploadedDoc("");
          setSkipUpload(false);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Date & Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Expiry Date *</Label>
                <Input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Supporting Document</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={skipUpload} onCheckedChange={(c) => setSkipUpload(c === true)} />
                    <Label>Upload later</Label>
                  </div>
                </div>
                {!skipUpload && !uploadedDoc && (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <FileUploader onUploadSuccess={(url) => setUploadedDoc(url)} id={`date-${editDateField}-upload`} />
                    <p className="text-sm mt-2">Click to upload (PDF, JPG, PNG)</p>
                  </div>
                )}
                {uploadedDoc && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm">Document uploaded</span>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedDoc("")}><X className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDateField(null)}>Cancel</Button>
              <Button onClick={() => handleDateSave(uploadedDoc || null)} disabled={!tempDate || (!skipUpload && !uploadedDoc)}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Other Dialogs & Preview */}
        <InspectionDialog open={pmiDialogOpen} onClose={() => setPmiDialogOpen(false)} lastPMIDate={vehicle.last_pmi_date} vehicleId={vehicleId} vehicleRegistration={vehicle.registration_number} username={cookies.get("username") || "User"} onUpdateSuccess={() => location.reload()} />
        <MOTDialog open={motDialogOpen} onClose={() => setMotDialogOpen(false)} currentMOTDate={vehicle.mot_expiry} vehicleId={vehicleId} vehicleRegistration={vehicle.registration_number} username={cookies.get("username") || "User"} onUpdateSuccess={() => location.reload()} />

        {previewDoc && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between p-4 border-b">
                <h3 className="font-bold">Document Preview</h3>
                <Button variant="ghost" onClick={() => setPreviewDoc(null)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="p-4">
                {previewDoc.endsWith('.pdf') ? (
                  <iframe src={previewDoc} className="w-full h-[70vh]" />
                ) : (
                  <img src={previewDoc} className="max-w-full max-h-[70vh]" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}