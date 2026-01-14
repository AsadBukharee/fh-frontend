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
  Car,
  CreditCard,
  Home,
  User,
  MapPin,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [sitesOpen, setSitesOpen] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicle data
        const vehicleRes = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const vehicleData = await vehicleRes.json();
        
        // Fetch sites list
        const sitesRes = await fetch(`${API_URL}/api/sites/list-names/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const sitesData = await sitesRes.json();
        
        // Fetch vehicle types
        const typesRes = await fetch(`${API_URL}/api/vehicle-types/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const typesData = await typesRes.json();
        
        if (vehicleData.success) {
          setVehicle(vehicleData.data);
          const formattedData = {
            ...vehicleData.data,
            is_wheelchair_lift_fitted: vehicleData.data.is_wheelchair_lift_fitted === "Yes",
          };
          setEditVehicle(formattedData);
          
          // Set selected sites from vehicle data
          if (vehicleData.data.site_allocated) {
            const siteIds = vehicleData.data.site_allocated.map((site: any) => site.id);
            setSelectedSites(siteIds);
          }
        } else {
          setError("Failed to fetch vehicle data");
        }
        
        if (sitesData.success) {
          setSites(sitesData.data || []);
        } else {
          console.error("Failed to fetch sites:", sitesData.message);
        }
        
        if (typesData.success) {
          setVehicleTypes(typesData.data || []);
        } else {
          console.error("Failed to fetch vehicle types:", typesData.message);
        }
      } catch (err) {
        setError("Error fetching data");
        console.error("Error:", err);
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
      // Reset selected sites to current vehicle sites
      if (vehicle?.site_allocated) {
        const siteIds = vehicle.site_allocated.map((site: any) => site.id);
        setSelectedSites(siteIds);
      }
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
        site_allocated: selectedSites,
        vehicles_type: editVehicle.vehicles_type, // Add vehicle type to payload
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

  const Field = ({
    label,
    value,
    isEditing,
    onChange,
    type = "text",
  }: {
    label: string
    value?: string
    isEditing?: boolean
    onChange?: (v: string) => void
    type?: string
  }) => (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      {isEditing ? (
        <Input
          value={value || ""}
          type={type}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 text-sm"
        />
      ) : (
        <p className="text-sm font-medium text-slate-900">
          {value || "-"}
        </p>
      )}
    </div>
  );

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
function StaticRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
type TyreRowProps = {
  label: string;
  unit: string;
  valueKey: string;
  type?: string;
  highlight?: boolean;
};

function TyreRow({ label, unit, valueKey, type = "text", highlight }: TyreRowProps) {
  const value = isEditing ? editVehicle[valueKey] : vehicle[valueKey];

  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-600">{label}</span>

      {isEditing ? (
        <Input
          type={type}
          value={value ?? ""}
          onChange={(e) =>
            handleInputChange(
              valueKey,
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          className="w-20 h-7 text-xs"
        />
      ) : (
        <span
          className={`font-semibold ${
            highlight
              ? "text-green-600 bg-green-100 px-2 rounded-md"
              : "text-slate-900"
          }`}
        >
          {value ?? "N/A"} {unit}
        </span>
      )}
    </div>
  );
}

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
function TyreCard({ title, pos }: { title: string; pos: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="font-medium text-slate-900 mb-3">{title}</p>

      <div className="space-y-2 text-sm">
        <TyreRow
          label="Pressure"
          unit="PSI"
          valueKey={`tyre_pressure_${pos}`}
          type="number"
        />

        <TyreRow
          label="Depth"
          unit="mm"
          valueKey={`tyre_depth_${pos}`}
          highlight
        />

        <TyreRow
          label="Torque"
          unit="NM"
          valueKey={`tyre_torque_${pos}`}
          type="number" highlight={undefined}        />

        <StaticRow label="Tyre Age" value="" />
      </div>
    </div>
  );
}

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

  // Calculate total price
  const calculateTotalPrice = () => {
    const price = parseFloat(vehicle?.price || "0");
    const vat = parseFloat(vehicle?.vat_amount || "0");
    return price + vat;
  };

  // Get current mileage display
  const getCurrentMileage = () => {
    const mileage = vehicle?.last_mileage;
    const unit = vehicle?.mileage_unit === "miles" ? "mi" : "km";
    return mileage ? `${parseFloat(mileage).toLocaleString()} ${unit}` : "-";
  };

  // Handle site selection
  const handleSiteToggle = (siteId: number) => {
    setSelectedSites(prev => {
      if (prev.includes(siteId)) {
        return prev.filter(id => id !== siteId);
      } else {
        return [...prev, siteId];
      }
    });
  };

  // Get selected site names
  const getSelectedSiteNames = () => {
    return selectedSites
      .map(id => sites.find(site => site.id === id)?.name)
      .filter(Boolean)
      .join(", ");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {vehicle.registration_number} - {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-slate-600">{vehicle.vehicles_type?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusBadgeColor(vehicle.vehicle_status)} px-3 py-1`}>
              {getStatusDisplayText(vehicle.vehicle_status)}
            </Badge>
            <Badge className={`${getRoadworthyBadgeColor(vehicle.vehicle_roadworthy_status)} px-3 py-1`}>
              {getRoadworthyDisplayText(vehicle.vehicle_roadworthy_status)}
            </Badge>
          </div>
        </div>

        {/* Driver Assignment Banner */}
        {/* {vehicle.assignee_driver && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white">
                  {vehicle.assignee_driver.avatar ? (
                    <img src={vehicle.assignee_driver.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-100">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">Assigned to Driver</p>
                  <p className="text-orange-700">{vehicle.assignee_driver.full_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Site</p>
                <p className="font-semibold">{vehicle.assignee_driver.site?.[0]?.name || "No site"}</p>
              </div>
            </div>
          </div>
        )} */}

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
            {/* ================= VEHICLE DETAILS ================= */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Car className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Vehicle Details</h3>
              </div>

              <div className="flex gap-6">
                {/* Image */}
                <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 group">
                  {vehicle.vehicle_picture ? (
                    <>
                      <img
                        src={vehicle.vehicle_picture}
                        className="w-full h-full object-cover"
                        alt={`${vehicle.make} ${vehicle.model}`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageUploader onUploadSuccess={handleImageUpload} />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6 mb-2" />
                      <p className="text-xs">No Image</p>
                      <ImageUploader onUploadSuccess={handleImageUpload} />
                    </div>
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-x-10 gap-y-6 flex-1">
                  <Field
                    label="Make"
                    value={isEditing ? editVehicle.make : vehicle.make}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange("make", v)}
                  />

                  <Field
                    label="Model"
                    value={isEditing ? editVehicle.model : vehicle.model}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange("model", v)}
                  />

                  <Field
                    label="Registration"
                    value={isEditing ? editVehicle.registration_number : vehicle.registration_number}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange("registration_number", v)}
                  />

                  <Field label="VIN Number" value={vehicle.vin} />

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Latest Mileage</p>
                    <p className="text-sm font-medium text-slate-900">
                      {getCurrentMileage()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">No of Seats</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editVehicle.number_of_seats || ""}
                        onChange={(e) => handleInputChange("number_of_seats", Number(e.target.value))}
                        className="h-9 text-sm"
                      />
                    ) : (
                      <Badge className="bg-red-100 text-red-600">
                        {vehicle.number_of_seats} seats
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Vehicle Type</p>
                    {isEditing ? (
                      <Select
                        value={editVehicle.vehicles_type?.toString() || ""}
                        onValueChange={(value) => handleInputChange("vehicles_type", Number(value))}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-600">
                        {vehicle?.vehicles_type?.name || "No type assigned"}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Allocated Sites</p>
                    {isEditing ? (
                      <Popover open={sitesOpen} onOpenChange={setSitesOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={sitesOpen}
                            className="w-full justify-between h-9 text-sm"
                          >
                            {selectedSites.length > 0
                              ? `${selectedSites.length} site${selectedSites.length > 1 ? 's' : ''} selected`
                              : "Select sites..."}
                            <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search sites..." />
                            <CommandList>
                              <CommandEmpty>No sites found.</CommandEmpty>
                              <CommandGroup>
                                {sites.map((site) => (
                                  <CommandItem
                                    key={site.id}
                                    value={site.name}
                                    onSelect={() => {
                                      handleSiteToggle(site.id);
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedSites.includes(site.id)}
                                      onCheckedChange={() => handleSiteToggle(site.id)}
                                      className="mr-2"
                                    />
                                    {site.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {vehicle.site_allocated?.map((site: any) => (
                          <Badge key={site.id} className="bg-blue-100 text-blue-700">
                            {site.name}
                          </Badge>
                        ))}
                        {(!vehicle.site_allocated || vehicle.site_allocated.length === 0) && (
                          <span className="text-sm text-slate-500">No sites allocated</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= PURCHASE INFO ================= */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Purchase Info</h3>
              </div>

              <div className="grid grid-cols-4 gap-x-10 gap-y-6">
                <Field
                  label="Purchase Date"
                  type="date"
                  value={isEditing ? editVehicle.date_of_purchase : formatDate(vehicle.date_of_purchase)}
                  isEditing={isEditing}
                  onChange={(v) => handleInputChange("date_of_purchase", v)}
                />

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Purchased From</p>
                  {isEditing ? (
                    <Input
                      value={editVehicle.purchased_from || ""}
                      onChange={(e) => handleInputChange("purchased_from", e.target.value)}
                      className="h-9 text-sm"
                    />
                  ) : (
                    <Badge className="bg-red-100 text-red-600">
                      {vehicle.purchased_from}
                    </Badge>
                  )}
                </div>

                <Field
                  label="Purchase Mileage"
                  value={`${vehicle.purchase_mileage || "-"} km`}
                />

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Purchased By</p>
                  <p className="text-sm font-medium text-slate-900">
                    {vehicle.purchased_by || "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Purchase Price</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.price || ""}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className="h-9 text-sm"
                    />
                  ) : (
                    <Badge className="bg-red-100 text-red-600">
                      £{Number(vehicle.price).toLocaleString()}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs text-slate-500">VAT Amount</p>
                    <p className="text-sm font-medium text-slate-900">
                      £{Number(vehicle.vat_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={editVehicle.has_vat}
                      onCheckedChange={(c) => handleInputChange("has_vat", c)}
                    />
                  ) : (
                    <Switch checked={vehicle.has_vat} disabled />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Total Price</p>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    £{calculateTotalPrice().toLocaleString()}
                  </Badge>
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
<TabsContent value="maintenance" className="mt-6">
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

    {/* Header */}
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Tyre Management
        </h3>
      </div>

    
    </div>

    {/* Main Layout */}
    <div className="grid grid-cols-[1fr_260px_1fr] gap-8 items-center">

      {/* LEFT */}
      <div className="space-y-4">
        <TyreCard title="Front Passenger" pos="front_passenger" />
        <TyreCard title="Rear Outer Passenger" pos="rear_outer_passenger" />
        <TyreCard title="Rear Inner Passenger" pos="rear_inner_passenger" />
      </div>

      {/* CENTER VEHICLE */}
      <div className="relative flex justify-center">
        <img
          src="/vehicle-top.png"
          alt="Vehicle"
          className="w-44 z-10"
        />

        {/* Highlight rear tyres */}
        <div className="absolute bottom-10 left-1/2 -translate-x-[90%] w-10 h-14 bg-red-500 rounded-md opacity-90" />
        <div className="absolute bottom-10 left-1/2 translate-x-[10%] w-10 h-14 bg-blue-500 rounded-md opacity-90" />
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        <TyreCard title="Front Driver" pos="front_driver" />
        <TyreCard title="Rear Outer Driver" pos="rear_outer_driver" />
        <TyreCard title="Rear Inner Driver" pos="rear_inner_driver" />
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

        {/* Fixed Action Buttons */}
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
            <div className="flex gap-4 flex-col">
              <AssignDriverDialog vehicleId={vehicleId} />
              <Button variant="outline" onClick={handleEditToggle}>
                <Edit className="w-6 h-6 mr-2" />
                Edit Details
              </Button>
            </div>
          )}
        </div>

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