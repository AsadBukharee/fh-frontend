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

  Edit,
  X,

  FileText,
  Gauge,
  Clock,

  Camera,
  Download,
  Eye,

  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Wrench,
  TestTube,
  AlertCircle,

  Shield,
  FileCheck,
  Activity,

  ShipWheelIcon,
  Car,
  CreditCard,
 
  MapPin,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import ImageUploader from "@/components/Media/UploadImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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
  const [tyreMaintenanceDialogOpen, setTyreMaintenanceDialogOpen] = useState(false);
  const [tyreExpiryDialogOpen, setTyreExpiryDialogOpen] = useState(false);

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
          // Don't map vehicle_type - use it as is from API
          const vehicleDataWithType = {
            ...vehicleData.data,
            // Keep both for backward compatibility
            vehicle_type: vehicleData.data.vehicle_type,
            // For components expecting vehicles_type
            vehicles_type: vehicleData.data.vehicle_type
          };

          setVehicle(vehicleDataWithType);
          setEditVehicle(vehicleDataWithType);

          // Set selected sites from vehicle data
          if (vehicleDataWithType.site_allocated) {
            const siteIds = vehicleDataWithType.site_allocated.map((site: any) => site.id);
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
      setEditVehicle(vehicle);
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

    setSaving(true);

    try {
      // Prepare data for API - use vehicle_type not vehicles_type
      const vehicleData: any = {
        registration_number: editVehicle.registration_number,
        vin: editVehicle.vin,
        make: editVehicle.make,
        model: editVehicle.model,
        number_of_seats: editVehicle.number_of_seats,
        mileage_unit: editVehicle.mileage_unit,
        notes: editVehicle.notes,
        is_tacho_fitted: editVehicle.is_tacho_fitted,
        is_wheelchair_lift_fitted: editVehicle.is_wheelchair_lift_fitted,
        date_of_purchase: editVehicle.date_of_purchase,
        purchased_from: editVehicle.purchased_from,
        purchased_by: editVehicle.purchased_by,
        price: editVehicle.price,
        purchase_mileage: editVehicle.purchase_mileage,
        next_mot_to_be_booked_from: editVehicle.next_mot_to_be_booked_from,
        has_vat: editVehicle.has_vat,
        vat_amount: editVehicle.vat_amount,
        last_mileage: editVehicle.last_mileage,
        mot_expiry: editVehicle.mot_expiry,
        tax_expiry: editVehicle.tax_expiry,
        insurance_expiry: editVehicle.insurance_expiry,
        loller_test_expiry_date: editVehicle.loller_test_expiry_date,
        tacho_calibration_expiry: editVehicle.tacho_calibration_expiry,
        last_pmi_date: editVehicle.last_pmi_date,
        pmi_booked_date: editVehicle.pmi_booked_date,
        next_loller_test_date: editVehicle.next_loller_test_date,
        // Tyre maintenance fields
        last_tyre_maintenance_check_date: editVehicle.last_tyre_maintenance_check_date,
        tyre_expiry_date: editVehicle.tyre_expiry_date,
        tyre_maintenance_docs: editVehicle.tyre_maintenance_docs,
        tyre_expiry_docs: editVehicle.tyre_expiry_docs,
        // Tyre age fields
        tyre_expiry_front_driver: editVehicle.tyre_expiry_front_driver,
        tyre_expiry_front_passenger: editVehicle.tyre_expiry_front_passenger,
        tyre_expiry_rear_outer_driver: editVehicle.tyre_expiry_rear_outer_driver,
        tyre_expiry_rear_outer_passenger: editVehicle.tyre_expiry_rear_outer_passenger,
        tyre_expiry_rear_inner_driver: editVehicle.tyre_expiry_rear_inner_driver,
        tyre_expiry_rear_inner_passenger: editVehicle.tyre_expiry_rear_inner_passenger,
        // Tyre pressure fields
        tyre_pressure_front_driver: editVehicle.tyre_pressure_front_driver,
        tyre_pressure_front_passenger: editVehicle.tyre_pressure_front_passenger,
        tyre_pressure_rear_outer_driver: editVehicle.tyre_pressure_rear_outer_driver,
        tyre_pressure_rear_outer_passenger: editVehicle.tyre_pressure_rear_outer_passenger,
        tyre_pressure_rear_inner_driver: editVehicle.tyre_pressure_rear_inner_driver,
        tyre_pressure_rear_inner_passenger: editVehicle.tyre_pressure_rear_inner_passenger,
        // Tyre depth fields
        tyre_depth_front_driver: editVehicle.tyre_depth_front_driver,
        tyre_depth_front_passenger: editVehicle.tyre_depth_front_passenger,
        tyre_depth_rear_outer_driver: editVehicle.tyre_depth_rear_outer_driver,
        tyre_depth_rear_outer_passenger: editVehicle.tyre_depth_rear_outer_passenger,
        tyre_depth_rear_inner_driver: editVehicle.tyre_depth_rear_inner_driver,
        tyre_depth_rear_inner_passenger: editVehicle.tyre_depth_rear_inner_passenger,
        // Tyre torque fields
        tyre_torque_front_driver: editVehicle.tyre_torque_front_driver,
        tyre_torque_front_passenger: editVehicle.tyre_torque_front_passenger,
        tyre_torque_rear_outer_driver: editVehicle.tyre_torque_rear_outer_driver,
        tyre_torque_rear_outer_passenger: editVehicle.tyre_torque_rear_outer_passenger,
        vehicle_status: editVehicle.vehicle_status,
        vehicle_roadworthy_status: editVehicle.vehicle_roadworthy_status,
        is_roadworthy: editVehicle.is_roadworthy,
        is_active: editVehicle.is_active,
        site_allocated: selectedSites,
        vehicle_type: editVehicle.vehicle_type?.id || editVehicle.vehicles_type?.id,
      };

      // If tacho fitted and tacho_calibration_expiry is empty, send tacho_calibration_expiry and tacho_calibration_docs as null
      if (
        editVehicle.is_tacho_fitted &&
        (!editVehicle.tacho_calibration_expiry || editVehicle.tacho_calibration_expiry === "")
      ) {
        vehicleData.tacho_calibration_expiry = null;
        vehicleData.tacho_calibration_docs = null;
      }

      // If wheelchair lift fitted and loller_test_expiry_date is empty, send loller_test_expiry_date and loller_docs as null
      if (
        editVehicle.is_wheelchair_lift_fitted &&
        (!editVehicle.loller_test_expiry_date || editVehicle.loller_test_expiry_date === "")
      ) {
        vehicleData.loller_test_expiry_date = null;
        vehicleData.loller_docs = null;
      }

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
        // Update state with response - maintain both fields for compatibility
        const fixedUpdatedData = {
          ...updatedData.data,
          vehicle_type: updatedData.data.vehicle_type,
          vehicles_type: updatedData.data.vehicle_type
        };
        setVehicle(fixedUpdatedData);
        setEditVehicle(fixedUpdatedData);
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
    setEditVehicle((prev: any) => {
      if (!prev) return prev;

      const updated = { ...prev, [field]: value };

      // Auto-calculate total if price or vat changes
      if (field === 'price' || field === 'vat_amount') {
        // You could add auto-calculation logic here if needed
      }

      return updated;
    });
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
          // Update both fields for compatibility
          const fixedUpdatedData = {
            ...updatedData.data,
            vehicle_type: updatedData.data.vehicle_type,
            vehicles_type: updatedData.data.vehicle_type
          };
          setVehicle(fixedUpdatedData);
          setEditVehicle(fixedUpdatedData);
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
      const payload: any = { [docType]: fileUrl };

      if (docType === "tacho_calibration_docs") {
        payload.is_tacho_fitted = isEditing ? editVehicle.is_tacho_fitted : vehicle.is_tacho_fitted;
      }
      if (docType === "loller_docs") {
        payload.is_wheelchair_lift_fitted = isEditing ? editVehicle.is_wheelchair_lift_fitted : vehicle.is_wheelchair_lift_fitted;
      }

      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updatedData = await res.json();
        if (updatedData.success) {
          // Update both fields for compatibility
          const fixedUpdatedData = {
            ...updatedData.data,
            vehicle_type: updatedData.data.vehicle_type,
            vehicles_type: updatedData.data.vehicle_type
          };
          setVehicle(fixedUpdatedData);
          setEditVehicle(fixedUpdatedData);
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
        last_pmi_date: "pmi_inspection_docs",
        loller_test_expiry_date: "loller_docs",
        tacho_calibration_expiry: "tacho_calibration_docs",
        next_loller_test_date: "loller_docs",
        // Tyre maintenance mappings
        last_tyre_maintenance_check_date: "tyre_maintenance_docs",
        tyre_expiry_date: "tyre_expiry_docs",
      };
      const docField = dateToDocMap[editDateField];
      if (docField && documentUrl) {
        updateData[docField] = documentUrl;
      }

      if (editDateField === "tacho_calibration_expiry") {
        updateData.is_tacho_fitted = isEditing ? editVehicle.is_tacho_fitted : vehicle.is_tacho_fitted;
      }
      if (editDateField === "loller_test_expiry_date" || editDateField === "next_loller_test_date") {
        updateData.is_wheelchair_lift_fitted = isEditing ? editVehicle.is_wheelchair_lift_fitted : vehicle.is_wheelchair_lift_fitted;
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
        // Update both fields for compatibility
        const fixedUpdatedData = {
          ...updatedData.data,
          vehicle_type: updatedData.data.vehicle_type,
          vehicles_type: updatedData.data.vehicle_type
        };
        setVehicle(fixedUpdatedData);
        setEditVehicle(fixedUpdatedData);
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
    if (field === "last_pmi_date") {
      setPmiDialogOpen(true);
      return;
    }
    if (field === "last_tyre_maintenance_check_date") {
      setTyreMaintenanceDialogOpen(true);
      return;
    }
    if (field === "tyre_expiry_date") {
      setTyreExpiryDialogOpen(true);
      return;
    }
    setEditDateField(field);
    setTempDate(currentValue ? currentValue.split("T")[0] : "");
    setUploadedDoc("");
    setSkipUpload(false);
    setDocumentError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return formatToDDMMYYYY(dateString);
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


  type TyreRowProps = {
    label: string;
    unit: string;
    valueKey: string;
    type?: string;
    highlight?: boolean;
  };

  function TyreRow({
  label,
  unit,
  valueKey,
  type = "text",
  highlight,
}: TyreRowProps) {
  const value = isEditing ? editVehicle?.[valueKey] : vehicle?.[valueKey];

  const displayValue =
    value !== null && value !== undefined && value !== ""
      ? `${value}${unit ? ` ${unit}` : ""}`
      : "N/A";

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      {/* Label */}
      <div className="flex flex-col">
        <span className="text-sm text-slate-500">{label}</span>
        {unit && !isEditing && (
          <span className="text-xs text-slate-400">{unit}</span>
        )}
      </div>

      {/* Value / Input */}
      <div className="min-w-[90px] text-right">
        {isEditing ? (
          <div className="relative">
            <Input
              type={type}
              value={value ?? ""}
              onChange={(e) =>
                handleInputChange(
                  valueKey,
                  type === "number"
                    ? e.target.value === ""
                      ? ""
                      : Number(e.target.value)
                    : e.target.value
                )
              }
              className="h-8 text-sm pr-20 text-right focus:ring-2 focus:ring-blue-500"
            />
            {unit && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {unit}
              </span>
            )}
          </div>
        ) : (
          <span
            className={`text-sm font-semibold ${
              highlight
                ? "text-green-700 bg-green-50 px-2 py-1 rounded-md"
                : "text-slate-900"
            }`}
          >
            {displayValue}
          </span>
        )}
      </div>
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

  // Updated complianceItems with tyre maintenance and tyre expiry
  const complianceItems = [
    { key: "mot", label: "MOT Certificate", icon: CheckCircle, dateField: "mot_expiry", docField: "mot_check_docs", color: "orange", hasDialog: true, description: undefined },
    { key: "insurance", label: "Insurance", icon: Shield, dateField: "insurance_expiry", docField: "insurance_docs", color: "purple", description: undefined },
    { key: "tax", label: "Road Tax", icon: DollarSign, dateField: "tax_expiry", docField: "tax_docs", color: "green", description: undefined },
    { key: "last_pmi", label: "Last PMI Date", icon: Wrench, dateField: "last_pmi_date", docField: "pmi_inspection_docs", color: "orange", hasDialog: true, description: undefined },
   
   
    { key: "loller", label: "LOLER Test", icon: TestTube, dateField: "loller_test_expiry_date", docField: "loller_docs", color: "pink", requiredForWheelchair: true, description: undefined },
    { key: "tacho", label: "Tacho Calibration", icon: Gauge, dateField: "tacho_calibration_expiry", docField: "tacho_calibration_docs", color: "indigo", requiredForTacho: true, description: undefined },
  ];

  const additionalDocuments = [
    { key: "vehicle_invoice_docs", label: "Vehicle Invoice", icon: FileText },
    { key: "service_records_docs", label: "Service Records", icon: Wrench },
    { key: "new_vehicle_checklist_docs", label: "New Vehicle Checklist", icon: FileCheck },
    { key: "logbook_docs", label: "Log Book / V5C", icon: FileText },
    { key: "COIF_technical_docs", label: "COIF Technical", icon: FileText },
    { key: "other_docs", label: "Other Documents", icon: FileText },
  ];

  function TyreCard({ title, pos, ageKey }: { title: string; pos: string; ageKey: string }) {
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
            type="number"
          />

          <TyreRow
            label="Tyre Age"
            unit=""
            valueKey={ageKey}
            type="text"
          />
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
        : vehicle?.is_wheelchair_lift_fitted;
    }
    // Always show tyre maintenance and expiry items
    if (item.key === "tyre_maintenance" || item.key === "tyre_expiry") {
      return true;
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
            <p className="text-slate-600">{vehicle.vehicle_type?.name || vehicle.vehicles_type?.name}</p>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-slate-50 p-1 rounded-xl">
              <TabsTrigger value="overview">Vehicle</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="maintenance">Tyre Maintenance</TabsTrigger>
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
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editVehicle.last_mileage || ""}
                          onChange={(e) => handleInputChange("last_mileage", Number(e.target.value))}
                          className="h-9 text-sm"
                        />
                        <span className="text-sm text-slate-500">
                          {editVehicle.mileage_unit === "miles" ? "mi" : "km"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">
                        {getCurrentMileage()}
                      </p>
                    )}
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
                        value={editVehicle.vehicle_type?.id?.toString() || editVehicle.vehicles_type?.id?.toString() || ""}
                        onValueChange={(value) => handleInputChange("vehicle_type", { id: Number(value) })}
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
                        {vehicle.vehicle_type?.name || vehicle.vehicles_type?.name || "No type assigned"}
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
                      {vehicle.purchased_from || "-"}
                    </Badge>
                  )}
                </div>

                <Field
                  label="Purchase Mileage"
                  value={vehicle.purchase_mileage ? `${vehicle.purchase_mileage} km` : "-"}
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

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">VAT Amount</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editVehicle.vat_amount || ""}
                      onChange={(e) => handleInputChange("vat_amount", e.target.value)}
                      className="h-9 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">
                      £{Number(vehicle.vat_amount || 0).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs text-slate-500">Has VAT</p>
                    {isEditing ? (
                      <Switch
                        checked={editVehicle.has_vat}
                        onCheckedChange={(c) => handleInputChange("has_vat", c)}
                      />
                    ) : (
                      <Switch checked={vehicle.has_vat} disabled />
                    )}
                  </div>
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
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Tyre Management
          </h3>
        </div>
      </div>
    </div>

    {/* Last Maintenance Check Card - Like Compliance Style */}
    <div className="mb-6 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Last Tyre Maintenance Check</p>
              <p className="text-xs text-slate-500">
                {vehicle?.last_tyre_maintenance_check_date 
                  ? `Last checked: ${formatDate(vehicle.last_tyre_maintenance_check_date)}` 
                  : 'No maintenance record'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDateDialog("last_tyre_maintenance_check_date", vehicle?.last_tyre_maintenance_check_date)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Update Date
          </Button>
        </div>
      </div>

      {/* Document Section - Using tyre_maintenance_check_docs */}
      <div className="p-4">
        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Maintenance Report</p>
              <p className="text-sm font-semibold text-slate-900">
                {vehicle?.tyre_maintenance_check_docs ? "Uploaded" : "Not uploaded"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {vehicle?.tyre_maintenance_check_docs ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDoc(vehicle.tyre_maintenance_check_docs)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(vehicle.tyre_maintenance_check_docs, "_blank")}
                  className="h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <FileUploader
                onUploadSuccess={(url) => handleDocumentUpload("tyre_maintenance_check_docs", url)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                maxSize={10 * 1024 * 1024}
                id="upload-tyre-maintenance"
              />
            )}
          </div>
        </div>
      </div>
    </div>

 

    {/* Main Layout - Tyre Cards */}
    <div className="grid grid-cols-[1fr_260px_1fr] gap-8 items-center">

      {/* LEFT */}
      <div className="space-y-4">
        <TyreCard title="Front Passenger" pos="front_passenger" ageKey="tyre_expiry_front_passenger" />
        <TyreCard title="Rear Outer Passenger" pos="rear_outer_passenger" ageKey="tyre_expiry_rear_outer_passenger" />
        <TyreCard title="Rear Inner Passenger" pos="rear_inner_passenger" ageKey="tyre_expiry_rear_inner_passenger" />
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
        <TyreCard title="Front Driver" pos="front_driver" ageKey="tyre_expiry_front_driver" />
        <TyreCard title="Rear Outer Driver" pos="rear_outer_driver" ageKey="tyre_expiry_rear_outer_driver" />
        <TyreCard title="Rear Inner Driver" pos="rear_inner_driver" ageKey="tyre_expiry_rear_inner_driver" />
      </div>

    </div>
  </div>
</TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6 mt-6">
            {/* Compliance Documents Accordion */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Compliance Documents</h3>
              </div>

              <Accordion type="multiple" className="space-y-3">
                {complianceItems.map((item) => {
                  const dateValue = vehicle[item.dateField as keyof typeof vehicle] as string;
                  const docValue = vehicle[item.docField as keyof typeof vehicle] as string;
                  const status = getExpiryStatus(dateValue);
                  const hasDoc = hasDocument(docValue);
                  const Icon = item.icon;
                  const StatusIcon = status.icon;

                  // Check if this item should show its content
                  const showContent = shouldShowComplianceItem(item);

                  const isRequired =
                    (item.requiredForTacho && (isEditing ? editVehicle.is_tacho_fitted : vehicle.is_tacho_fitted)) ||
                    (item.requiredForWheelchair && (isEditing ? editVehicle.is_wheelchair_lift_fitted : vehicle.is_wheelchair_lift_fitted));

                  return (
                    <AccordionItem
                      key={item.key}
                      value={item.key}
                      className={`bg-slate-50 rounded-xl border ${isRequired && !dateValue
                        ? "border-red-300 ring-1 ring-red-200"
                        : "border-slate-200"
                        } overflow-hidden`}
                    >
                      {/* Accordion Trigger — always visible */}
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-100/60 transition-colors [&>svg]:ml-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-900">{item.label}</p>
                              {item.description && (
                                <span className="text-xs text-slate-500">({item.description})</span>
                              )}
                              {isRequired && (
                                <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>
                              )}
                              {
                                item.key === "loller" && (
                                  isEditing ? (
                                    <Switch checked={editVehicle.is_wheelchair_lift_fitted} onCheckedChange={(c) => handleInputChange("is_wheelchair_lift_fitted", c)} />
                                  ) : (
                                    <Badge className={vehicle.is_wheelchair_lift_fitted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                                      {vehicle.is_wheelchair_lift_fitted ? "Fitted" : "Not Fitted"}
                                    </Badge>
                                  )
                                )
                              }
                              {
                                item.key === "tacho" && (
                                  isEditing ? (
                                    <Switch checked={editVehicle.is_tacho_fitted} onCheckedChange={(c) => handleInputChange("is_tacho_fitted", c)} />
                                  ) : (
                                    <Badge className={vehicle.is_tacho_fitted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                                      {vehicle.is_tacho_fitted ? "Fitted" : "Not Fitted"}
                                    </Badge>
                                  )
                                )
                              }
                            </div>
                            <p className="text-xs text-slate-500">
                              {dateValue ? formatDate(dateValue) : "Date not set"}
                            </p>
                          </div>
                          {/* Status badge visible in collapsed state */}
                          <Badge className={`${status.color} border text-xs shrink-0 mr-2`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.text}
                          </Badge>
                        </div>
                      </AccordionTrigger>

                      {/* Accordion Content — conditionally rendered based on showContent */}
                      {showContent && (
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 pt-2">
                            {/* Expiry Date Row */}
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-xs text-slate-500">
                                    {item.key === "last_pmi" ? "Last PMI Date" : 
                                     item.key === "tyre_maintenance" ? "Last Maintenance Check" :
                                     item.key === "tyre_expiry" ? "Tyre Expiry Date" : "Expiry Date"}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {dateValue ? formatDate(dateValue) : "Not set"}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${status.color} border`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.text}
                              </Badge>
                            </div>

                            {/* Document Row */}
                            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-xs text-slate-500">Supporting Document</p>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {hasDoc ? "Uploaded" : "Not uploaded"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {hasDoc ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setPreviewDoc(docValue)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(docValue, "_blank")}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <FileUploader
                                    onUploadSuccess={(url) => handleDocumentUpload(item.docField, url)}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    maxSize={10 * 1024 * 1024}
                                    id={`upload-compliance-${item.key}`}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Update Date Action */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDateDialog(item.dateField, dateValue)}
                              className="w-full"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              {item.key === "last_pmi" ? "Update Last PMI Date" : 
                               item.key === "tyre_maintenance" ? "Update Maintenance Check Date" :
                               item.key === "tyre_expiry" ? "Update Tyre Expiry Date" : "Update Expiry Date"}
                            </Button>
                          </div>
                        </AccordionContent>
                      )}
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
              {/* <AssignDriverDialog vehicleId={vehicleId} /> */}
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
                <Label>
                  {editDateField === "last_pmi_date" ? "Last PMI Date *" : 
                   editDateField === "last_tyre_maintenance_check_date" ? "Last Tyre Maintenance Check Date *" :
                   editDateField === "tyre_expiry_date" ? "Tyre Expiry Date *" : "Expiry Date *"}
                </Label>
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

        {/* Tyre Maintenance Dialog */}
        <Dialog open={tyreMaintenanceDialogOpen} onOpenChange={setTyreMaintenanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Tyre Maintenance Check</DialogTitle>
              <DialogDescription>
                Record the date of the last tyre maintenance inspection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Last Maintenance Check Date *</Label>
                <Input 
                  type="date" 
                  value={tempDate} 
                  onChange={(e) => setTempDate(e.target.value)} 
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Maintenance Report</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={skipUpload} onCheckedChange={(c) => setSkipUpload(c === true)} />
                    <Label>Upload later</Label>
                  </div>
                </div>
                {!skipUpload && !uploadedDoc && (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <FileUploader 
                      onUploadSuccess={(url) => setUploadedDoc(url)} 
                      id="tyre-maintenance-upload" 
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="text-sm mt-2">Upload maintenance report (PDF, JPG, PNG)</p>
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
              <Button variant="outline" onClick={() => {
                setTyreMaintenanceDialogOpen(false);
                setTempDate("");
                setUploadedDoc("");
                setSkipUpload(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  setEditDateField("last_tyre_maintenance_check_date");
                  await handleDateSave(uploadedDoc || null);
                  setTyreMaintenanceDialogOpen(false);
                }} 
                disabled={!tempDate || (!skipUpload && !uploadedDoc)}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tyre Expiry Dialog */}
        <Dialog open={tyreExpiryDialogOpen} onOpenChange={setTyreExpiryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Tyre Expiry Date</DialogTitle>
              <DialogDescription>
                Set the date when tyres need to be replaced
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Tyre Expiry Date *</Label>
                <Input 
                  type="date" 
                  value={tempDate} 
                  onChange={(e) => setTempDate(e.target.value)} 
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tyre Certificate / Documentation</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={skipUpload} onCheckedChange={(c) => setSkipUpload(c === true)} />
                    <Label>Upload later</Label>
                  </div>
                </div>
                {!skipUpload && !uploadedDoc && (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <FileUploader 
                      onUploadSuccess={(url) => setUploadedDoc(url)} 
                      id="tyre-expiry-upload" 
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="text-sm mt-2">Upload tyre certificate or documentation</p>
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
              <Button variant="outline" onClick={() => {
                setTyreExpiryDialogOpen(false);
                setTempDate("");
                setUploadedDoc("");
                setSkipUpload(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  setEditDateField("tyre_expiry_date");
                  await handleDateSave(uploadedDoc || null);
                  setTyreExpiryDialogOpen(false);
                }} 
                disabled={!tempDate || (!skipUpload && !uploadedDoc)}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Other Dialogs & Preview */}
        <InspectionDialog
          open={pmiDialogOpen}
          onClose={() => setPmiDialogOpen(false)}
          lastPMIDate={vehicle.last_pmi_date}
          vehicleId={vehicleId}
          vehicleRegistration={vehicle.registration_number}
          username={cookies.get("username") || "User"}
          onUpdateSuccess={() => location.reload()}
        />
        <MOTDialog
          open={motDialogOpen}
          onClose={() => setMotDialogOpen(false)}
          currentMOTDate={vehicle.mot_expiry}
          vehicleId={vehicleId}
          vehicleRegistration={vehicle.registration_number}
          username={cookies.get("username") || "User"}
          onUpdateSuccess={() => location.reload()}
        />

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