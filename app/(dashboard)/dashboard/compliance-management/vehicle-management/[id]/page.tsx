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
  Wrench,
  TestTube,
  ChevronRight,
  Plus,
  AlertCircle,
  FileWarning,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import ImageUploader from "@/components/Media/UploadImage";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { format } from "date-fns";
import MOTDialog from "@/components/Vehicles/expiry/MOTexpiry/MOTdialog";
import { toast } from "sonner";

interface VehicleFormData {
  vin: string
  registration_number: string
  make: string
  model: string
  vehicles_type: number
  site_allocated: number[]
  number_of_seats: number | null
  mileage_unit: "kms" | "miles"
  vehicle_picture: string
  notes: string
  is_tacho_fitted: boolean
  is_wheelchair_lift_fitted: boolean
  date_of_purchase: string
  purchased_from: string
  purchased_by: string
  price: string
  has_vat: boolean
  vat_amount: string
  last_pmi_date: string
  pmi_booked_date: string
  pmi_cycle: number | null
  vehicle_status: "available" | "unavailable" | "assigned" | "disabled"
  vehicle_roadworthy_status: "no_defect" | "minor_defect_roadworthy" | "minor_defect_not_roadworthy" | "major_defect_not_roadworthy"
  is_roadworthy: boolean
  is_active: boolean
  mot_expiry: string
  insurance_expiry: string
  tax_expiry: string
  loller_test_expiry_date: string
  next_loller_test_date: string
  tacho_calibration_expiry: string
  next_techo_calibration_book_date: string
  last_tacho_download_date: string
  next_tacho_download_date: string
  tacho_notes: string
  last_tyre_maintenance_check_date: string
  next_tyre_maintenance_check_date: string
  last_valet_check_date: string
  next_valet_check_date: string
  last_equipment_check_date: string
  next_equipment_check_date: string
  tyre_expiry_front_driver: string
  tyre_expiry_front_passenger: string
  tyre_expiry_rear_inner_driver: string
  tyre_expiry_rear_inner_passenger: string
  tyre_expiry_rear_outer_driver: string
  tyre_expiry_rear_outer_passenger: string
  tyre_pressure_front_driver: number | null
  tyre_pressure_front_passenger: number | null
  tyre_pressure_rear_outer_driver: number | null
  tyre_pressure_rear_outer_passenger: number | null
  tyre_pressure_rear_inner_driver: number | null
  tyre_pressure_rear_inner_passenger: number | null
  tyre_depth_front_driver: string
  tyre_depth_front_passenger: string
  tyre_depth_rear_outer_driver: string
  tyre_depth_rear_outer_passenger: string
  tyre_depth_rear_inner_driver: string
  tyre_depth_rear_inner_passenger: string
  tyre_torque_front_driver: number | null
  tyre_torque_front_passenger: number | null
  tyre_torque_rear_outer_driver: number | null
  tyre_torque_rear_outer_passenger: number | null
  vehicle_invoice_docs: string
  mot_check_docs: string
  pmi_inspection_docs: string
  others_docs: string
  tacho_calibration_docs: string
  tax_docs: string
  loller_docs: string
  insurance_docs: string
  service_records_docs: string
  new_vehicle_checklist_docs: string
  logbook_docs: string
  COIF_technical_docs: string
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const cookies = useCookies();
  const token = cookies.get("access_token");
  // normalize id (string | string[] | undefined) to a number for usages that require a numeric id
  const vehicleId = Array.isArray(id) ? Number(id[0]) : Number(id);
  const [vehicle, setVehicle] = useState<any>(null);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [editDateField, setEditDateField] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>("");
  const [uploadedDoc, setUploadedDoc] = useState<string>("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [pmiDialogOpen, setPmiDialogOpen] = useState(false);
  const [motDialogOpen, setMotDialogOpen] = useState(false);
  const [skipUpload, setSkipUpload] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
        });

        const vehicleData = await vehicleRes.json();

        if (vehicleData.success) {
          setVehicle(vehicleData.data);
          setEditVehicle(vehicleData.data);
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
      setEditVehicle(vehicle);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!editVehicle || !token) return;
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
        is_wheelchair_lift_fitted: editVehicle.is_wheelchair_lift_fitted,
        date_of_purchase: editVehicle.date_of_purchase,
        purchased_from: editVehicle.purchased_from,
        purchased_by: editVehicle.purchased_by,
        price: editVehicle.price,
        purchase_mileage: editVehicle.purchase_mileage,
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
        setVehicle(updatedData.data);
        setEditVehicle(updatedData.data);
        setIsEditing(false);
        toast.success("Vehicle updated successfully");
      } else {
        throw new Error(updatedData.message || "Failed to update vehicle");
      }
    } catch (err) {
      console.error("Error updating vehicle:", err);
      toast.error("Failed to update vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditVehicle((prev: any) => (prev ? { ...prev, [field]: value } : prev));
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
          setEditVehicle(updatedData.data);
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
      const res = await fetch(`${API_URL}/api/vehicles/${id}/}`, {
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
          setEditVehicle(updatedData.data);
          toast.success("Document uploaded successfully");
          
          // If this document was in missing_attributes, refresh data to update the list
          const missingDocMap = {
            "Insurance documents": "insurance_docs",
            "Tax documents": "tax_docs",
            "MOT documents": "mot_check_docs",
            "PMI documents": "pmi_inspection_docs",
            "LOLER documents": "loller_docs",
            "Tacho documents": "tacho_calibration_docs",
            "Vehicle invoice": "vehicle_invoice_docs",
            "Service records": "service_records_docs",
            "New vehicle checklist": "new_vehicle_checklist_docs",
            "Logbook": "logbook_docs",
            "COIF technical": "COIF_technical_docs",
          };
          
          const missingKeys = Object.entries(missingDocMap).find(([key, value]) => value === docType);
          if (missingKeys) {
            setTimeout(() => {
              handleUpdateSuccess();
            }, 500);
          }
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
      // Prepare the data to send
      const updateData: any = {
        [editDateField]: tempDate
      };

      // Map the date field to corresponding document field
      const dateToDocMap: { [key: string]: string } = {
        "mot_expiry": "mot_check_docs",
        "tax_expiry": "tax_docs",
        "insurance_expiry": "insurance_docs",
        "pmi_expiry": "pmi_inspection_docs",
        "loller_test_expiry_date": "loller_docs",
        "tacho_calibration_expiry": "tacho_calibration_docs",
        "next_loller_test_date": "loller_docs",
        "last_pmi_date": "pmi_inspection_docs"
      };

      // Add the corresponding document field only if we have a document URL
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
        setEditVehicle(updatedData.data);
        setEditDateField(null);
        setTempDate("");
        setUploadedDoc("");
        setSkipUpload(false);
        setDocumentError(null);
        
        // Show success message based on whether document was uploaded
        if (documentUrl) {
          toast.success("Date and document updated successfully", { id: toastId });
        } else {
          toast.success("Date updated successfully. Remember to upload the document later.", { id: toastId });
        }
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
    setEditDateField(field);
    setTempDate(currentValue ? currentValue.split("T")[0] : "");
    setUploadedDoc("");
    setSkipUpload(false);
    setDocumentError(null);
  };

  const handleUpdateSuccess = () => {
    // Refresh vehicle data after any update
    const fetchData = async () => {
      const toastId = toast.loading("Refreshing vehicle data...");
      try {
        const vehicleRes = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
        });

        const vehicleData = await vehicleRes.json();

        if (vehicleData.success) {
          setVehicle(vehicleData.data);
          setEditVehicle(vehicleData.data);
          toast.success("Vehicle data refreshed successfully", { id: toastId });
        }
      } catch (err) {
        console.error("Error refreshing vehicle data:", err);
        toast.error("Failed to refresh vehicle data", { id: toastId });
      }
    };

    if (id && token) fetchData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { color: "bg-gray-100 text-gray-600", text: "Not set", days: null };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: "bg-red-100 text-red-600", text: "Expired", days: diffDays };
    if (diffDays <= 30) return { color: "bg-red-100 text-red-600", text: `${Math.abs(diffDays)} Days ago`, days: diffDays };
    if (diffDays <= 60) return { color: "bg-orange-100 text-orange-600", text: `${diffDays} Days`, days: diffDays };
    return { color: "bg-emerald-100 text-emerald-600", text: "Valid", days: diffDays };
  };

  const hasDocument = (docUrl: string) => {
    return docUrl && docUrl !== "" && docUrl !== "null" && docUrl.length > 0;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700';
      case 'unavailable': return 'bg-gray-100 text-gray-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'disabled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoadworthyBadgeColor = (status: string) => {
    switch (status) {
      case 'no_defect': return 'bg-emerald-100 text-emerald-700';
      case 'minor_defect_roadworthy': return 'bg-orange-100 text-orange-700';
      case 'minor_defect_not_roadworthy': return 'bg-red-100 text-red-700';
      case 'major_defect_not_roadworthy': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'unavailable': return 'Unavailable';
      case 'assigned': return 'Assigned';
      case 'disabled': return 'Disabled';
      default: return status;
    }
  };

  const getRoadworthyDisplayText = (status: string) => {
    switch (status) {
      case 'no_defect': return 'No Defect';
      case 'minor_defect_roadworthy': return 'Minor Defect - Roadworthy';
      case 'minor_defect_not_roadworthy': return 'Minor Defect - Not Roadworthy';
      case 'major_defect_not_roadworthy': return 'Major Defect - Not Roadworthy';
      default: return status;
    }
  };

  const getMissingDataIcon = (item: string) => {
    switch (item.toLowerCase()) {
      case "insurance documents":
        return FileText;
      case "tax documents":
        return DollarSign;
      case "mot documents":
        return CheckCircle;
      case "pmi documents":
        return Wrench;
      case "loler documents":
        return TestTube;
      case "tacho documents":
        return Gauge;
      default:
        return FileWarning;
    }
  };

  const navigateToDocument = (item: string) => {
    // Map missing items to document fields
    const missingDocMap: { [key: string]: { tab: string, field: string } } = {
      "Insurance documents": { tab: "documents", field: "insurance_docs" },
      "Tax documents": { tab: "documents", field: "tax_docs" },
      "MOT documents": { tab: "documents", field: "mot_check_docs" },
      "PMI documents": { tab: "documents", field: "pmi_inspection_docs" },
      "LOLER documents": { tab: "documents", field: "loller_docs" },
      "Tacho calibration documents": { tab: "documents", field: "tacho_calibration_docs" },
      "Vehicle invoice": { tab: "documents", field: "vehicle_invoice_docs" },
      "Service records": { tab: "documents", field: "service_records_docs" },
      "New vehicle checklist": { tab: "documents", field: "new_vehicle_checklist_docs" },
      "Logbook": { tab: "documents", field: "logbook_docs" },
      "COIF technical": { tab: "documents", field: "COIF_technical_docs" },
    };

    const docInfo = missingDocMap[item];
    if (docInfo) {
      setActiveTab(docInfo.tab);
      // Scroll to the specific document element after tab switch
      setTimeout(() => {
        const element = document.getElementById(`document-${docInfo.field}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('bg-amber-50', 'border-amber-200', 'border-2');
          setTimeout(() => {
            element.classList.remove('bg-amber-50', 'border-amber-200', 'border-2');
          }, 3000);
        }
      }, 300);
    }
  };

  const documentTypes = [
    { key: "vehicle_invoice_docs", label: "Vehicle Invoice", icon: FileText },
    { key: "mot_check_docs", label: "MOT Check", icon: CheckCircle },
    { key: "pmi_inspection_docs", label: "PMI Inspection", icon: CheckCircle },
    { key: "others_docs", label: "Other Documents", icon: FileText },
    { key: "tacho_calibration_docs", label: "Tacho Calibration", icon: Gauge },
    { key: "tax_docs", label: "Tax Document", icon: DollarSign },
    { key: "loller_docs", label: "LOLER Certificate", icon: TestTube },
    { key: "insurance_docs", label: "Insurance Certificate", icon: FileText },
    { key: "service_records_docs", label: "Service Records", icon: Wrench },
    { key: "new_vehicle_checklist_docs", label: "New Vehicle Checklist", icon: CheckCircle },
    { key: "logbook_docs", label: "Log Book / V5C", icon: FileText },
    { key: "COIF_technical_docs", label: "COIF Technical", icon: FileText },
  ];

  const dateFields = [
    { key: "mot_expiry", label: "MOT Expiry", icon: CheckCircle },
    { key: "tax_expiry", label: "Tax Expiry", icon: DollarSign },
    { key: "insurance_expiry", label: "Insurance Expiry", icon: FileText },
    { key: "pmi_expiry", label: "PMI Expiry", icon: Wrench },
    { key: "loller_test_expiry_date", label: "LOLLER Test", icon: TestTube },
    { key: "tacho_calibration_expiry", label: "Tacho Calibration", icon: Gauge },
    { key: "next_loller_test_date", label: "Next LOLER Test", icon: Calendar },
    { key: "last_pmi_date", label: "Last PMI Date", icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle || !editVehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || "Vehicle not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Vehicle Profile</h1>
            {isEditing && activeTab === "details" ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={saving}
                  className="text-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : activeTab === "details" ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditToggle}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">See all vehicle profile here</p>

          <div className="mt-6 flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {vehicle.vehicle_picture ? (
                <img 
                  src={vehicle.vehicle_picture} 
                  alt="Vehicle" 
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <span className="text-red-600 font-bold text-xl">V</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {isEditing && activeTab === "details" ? (
                  <Input
                    value={editVehicle.registration_number}
                    onChange={(e) => handleInputChange("registration_number", e.target.value)}
                    className="text-lg font-bold max-w-xs"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-gray-900">{vehicle.registration_number}</h2>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {isEditing && activeTab === "details" ? (
                  <Input
                    value={editVehicle.vin}
                    onChange={(e) => handleInputChange("vin", e.target.value)}
                    placeholder="VIN"
                    className="max-w-xs"
                  />
                ) : (
                  <>VIN: {vehicle.vin}</>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Mileage</p>
                {isEditing && activeTab === "details" ? (
                  <Input
                    value={editVehicle.last_mileage || ""}
                    onChange={(e) => handleInputChange("last_mileage", e.target.value)}
                    className="font-semibold"
                  />
                ) : (
                  <p className="font-semibold text-gray-900">
                    {vehicle.last_mileage ? `${vehicle.last_mileage} ${vehicle.mileage_unit}` : "Not set"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Capacity</p>
                {isEditing && activeTab === "details" ? (
                  <Input
                    type="number"
                    value={editVehicle.number_of_seats}
                    onChange={(e) => handleInputChange("number_of_seats", parseInt(e.target.value))}
                    className="font-semibold"
                  />
                ) : (
                  <p className="font-semibold text-gray-900">{vehicle.number_of_seats} seats</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warnings Card - Show if there are warnings */}
        {vehicle.warnings && vehicle.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Vehicle Warnings</h3>
            </div>
            <div className="space-y-2">
              {vehicle.warnings.map((warning: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-amber-100">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${warning.includes('🚨') ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                  <span className="text-sm text-gray-700">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Vehicle Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Details Tab */}
          <TabsContent value="details" className="space-y-5">
            {/* Missing Data Card - Show if there are missing attributes */}
            {vehicle.missing_attributes && vehicle.missing_attributes.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-5">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-bold text-gray-900">Missing Information</h3>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-3">
                    The following documents or information are missing for this vehicle:
                  </p>
                  
                  <div className="space-y-3">
                    {vehicle.missing_attributes.map((item: string, index: number) => {
                      const Icon = getMissingDataIcon(item);
                      return (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-100 hover:bg-red-50 transition-colors cursor-pointer"
                          onClick={() => navigateToDocument(item)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item}</p>
                              <p className="text-xs text-red-500 mt-0.5">
                                Required document missing
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-700 border-0 rounded-full px-3 text-xs">
                              Missing
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-red-200">
                  <p className="text-sm text-gray-600">
                    Upload missing documents to complete vehicle profile
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("documents")}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Go to Documents
                  </Button>
                </div>
              </div>
            )}

            {/* Status Management Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-bold text-gray-900">Vehicle Status</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Vehicle Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Vehicle Status</Label>
                  <div className="space-y-2">
                    {isEditing ? (
                      <Select
                        value={editVehicle.vehicle_status}
                        onValueChange={(value) => handleInputChange("vehicle_status", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select vehicle status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusBadgeColor(vehicle.vehicle_status)} border-0 rounded-full px-3`}>
                          {getStatusDisplayText(vehicle.vehicle_status)}
                        </Badge>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Current operational status of the vehicle
                    </p>
                  </div>
                </div>

                {/* Roadworthy Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Roadworthy Status</Label>
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Select
                          value={editVehicle.vehicle_roadworthy_status}
                          onValueChange={(value) => handleInputChange("vehicle_roadworthy_status", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select roadworthy status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_defect">No Defect</SelectItem>
                            <SelectItem value="minor_defect_roadworthy">Minor Defect - Roadworthy</SelectItem>
                            <SelectItem value="minor_defect_not_roadworthy">Minor Defect - Not Roadworthy</SelectItem>
                            <SelectItem value="major_defect_not_roadworthy">Major Defect - Not Roadworthy</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="is_roadworthy"
                            checked={editVehicle.is_roadworthy}
                            onChange={(e) => handleInputChange("is_roadworthy", e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <Label htmlFor="is_roadworthy" className="text-sm text-gray-700">
                            Mark as roadworthy
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRoadworthyBadgeColor(vehicle.vehicle_roadworthy_status)} border-0 rounded-full px-3`}>
                            {getRoadworthyDisplayText(vehicle.vehicle_roadworthy_status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${vehicle.is_roadworthy ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className="text-xs text-gray-600">
                            {vehicle.is_roadworthy ? 'Vehicle is roadworthy' : 'Vehicle is not roadworthy'}
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Roadworthiness and defect status
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Active Status</Label>
                    <p className="text-xs text-gray-500">
                      {vehicle.is_active ? 'Vehicle is active in the fleet' : 'Vehicle is inactive'}
                    </p>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={editVehicle.is_active}
                        onChange={(e) => handleInputChange("is_active", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="is_active" className="text-sm text-gray-700">
                        Active Vehicle
                      </Label>
                    </div>
                  ) : (
                    <Badge className={`
                      ${vehicle.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}
                      border-0 rounded-full px-3
                    `}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="flex-1 ml-3 text-lg font-bold text-gray-900">Purchase Info</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">24 Nov 2025</span>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4">
                    View Details
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-4">
                <div className="border-r border-gray-100 pr-6">
                  <p className="text-sm text-gray-500 mb-2">Purchase From</p>
                  {isEditing ? (
                    <Input
                      value={editVehicle.purchased_from}
                      onChange={(e) => handleInputChange("purchased_from", e.target.value)}
                    />
                  ) : (
                    <p className="font-semibold text-gray-900">{vehicle.purchased_from || "Not specified"}</p>
                  )}
                </div>
                <div className="border-r border-gray-100 pr-6">
                  <p className="text-sm text-gray-500 mb-2">Purchase Price</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editVehicle.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                    />
                  ) : (
                    <p className="font-semibold text-gray-900">
                      {vehicle.price ? `£${parseFloat(vehicle.price).toLocaleString()}` : "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Purchase Mileage</p>
                  {isEditing ? (
                    <Input
                      value={editVehicle.purchase_mileage || ""}
                      onChange={(e) => handleInputChange("purchase_mileage", e.target.value)}
                    />
                  ) : (
                    <p className="font-semibold text-gray-900">
                      {vehicle.purchase_mileage ? `${vehicle.purchase_mileage} ${vehicle.mileage_unit}` : "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Maintenance Schedule Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-bold text-gray-900">Maintenance Schedule</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {dateFields.map((item) => {
                  const value = vehicle[item.key as keyof typeof vehicle] as string;
                  const status = getExpiryStatus(value);
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {value ? formatDate(value) : "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.days !== null && status.days < 0 ? (
                          <Badge className={`${status.color} border-0 rounded-full px-3 text-xs`}>
                            Expired
                          </Badge>
                        ) : status.days !== null && status.days <= 30 ? (
                          <Badge className={`${status.color} border-0 rounded-full px-3 text-xs`}>
                            {Math.abs(status.days)} Days ago
                          </Badge>
                        ) : status.days !== null ? (
                          <Badge className={`${status.color} border-0 rounded-full px-3 text-xs`}>
                            Valid
                          </Badge>
                        ) : (
                          <Badge className={`${status.color} border-0 rounded-full px-3 text-xs`}>
                            Not set
                          </Badge>
                        )}
                        {item.key === "pmi_expiry" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPmiDialogOpen(true)}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Button>
                        ) : item.key === "mot_expiry" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMotDialogOpen(true)}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDateDialog(item.key, value)}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Features Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-bold text-gray-900">Vehicle Features</h3>
              </div>

              <div className="space-y-4">
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  {isEditing ? (
                    <Textarea
                      value={editVehicle.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {vehicle.notes || "Vehicle was added on fleet"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tyre Management Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-bold text-gray-900">Tyre Management</h3>
              </div>

              {/* Front Axle */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Front Axle</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Front Driver</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Pressure</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_pressure_front_driver || ""}
                            onChange={(e) => handleInputChange("tyre_pressure_front_driver", parseFloat(e.target.value))}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${vehicle.tyre_pressure_front_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_pressure_front_driver ? `${vehicle.tyre_pressure_front_driver} PSI` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Depth</span>
                        {isEditing ? (
                          <Input
                            value={editVehicle.tyre_depth_front_driver || ""}
                            onChange={(e) => handleInputChange("tyre_depth_front_driver", e.target.value)}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${vehicle.tyre_depth_front_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_depth_front_driver ? `${vehicle.tyre_depth_front_driver} mm` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Torque</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_torque_front_driver || ""}
                            onChange={(e) => handleInputChange("tyre_torque_front_driver", parseFloat(e.target.value))}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${vehicle.tyre_torque_front_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_torque_front_driver ? `${vehicle.tyre_torque_front_driver} NM` : 'NO NM'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Front Passenger</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Pressure</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_pressure_front_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_pressure_front_passenger", parseFloat(e.target.value))}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${vehicle.tyre_pressure_front_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_pressure_front_passenger ? `${vehicle.tyre_pressure_front_passenger} PSI` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Depth</span>
                        {isEditing ? (
                          <Input
                            value={editVehicle.tyre_depth_front_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_depth_front_passenger", e.target.value)}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${vehicle.tyre_depth_front_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_depth_front_passenger ? `${vehicle.tyre_depth_front_passenger} mm` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Torque</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_torque_front_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_torque_front_passenger", parseFloat(e.target.value))}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold ${vehicle.tyre_torque_front_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_torque_front_passenger ? `${vehicle.tyre_torque_front_passenger} NM` : 'NO NM'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rear Axle */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Rear Axle</h4>
                <div className="grid grid-cols-4 gap-4">
                  {/* Rear Outer Driver */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Rear Outer Driver</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Pressure</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_pressure_rear_outer_driver || ""}
                            onChange={(e) => handleInputChange("tyre_pressure_rear_outer_driver", parseFloat(e.target.value))}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_pressure_rear_outer_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_pressure_rear_outer_driver ? `${vehicle.tyre_pressure_rear_outer_driver} PSI` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Depth</span>
                        {isEditing ? (
                          <Input
                            value={editVehicle.tyre_depth_rear_outer_driver || ""}
                            onChange={(e) => handleInputChange("tyre_depth_rear_outer_driver", e.target.value)}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_depth_rear_outer_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_depth_rear_outer_driver ? `${vehicle.tyre_depth_rear_outer_driver} mm` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Torque</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_torque_rear_outer_driver || ""}
                            onChange={(e) => handleInputChange("tyre_torque_rear_outer_driver", parseFloat(e.target.value))}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_torque_rear_outer_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_torque_rear_outer_driver ? `${vehicle.tyre_torque_rear_outer_driver} NM` : 'NO NM'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rear Outer Passenger */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Rear Outer Passenger</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Pressure</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_pressure_rear_outer_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_pressure_rear_outer_passenger", parseFloat(e.target.value))}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_pressure_rear_outer_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_pressure_rear_outer_passenger ? `${vehicle.tyre_pressure_rear_outer_passenger} PSI` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Depth</span>
                        {isEditing ? (
                          <Input
                            value={editVehicle.tyre_depth_rear_outer_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_depth_rear_outer_passenger", e.target.value)}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_depth_rear_outer_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_depth_rear_outer_passenger ? `${vehicle.tyre_depth_rear_outer_passenger} mm` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Torque</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_torque_rear_outer_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_torque_rear_outer_passenger", parseFloat(e.target.value))}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_torque_rear_outer_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_torque_rear_outer_passenger ? `${vehicle.tyre_torque_rear_outer_passenger} NM` : 'NO NM'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rear Inner Driver */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Rear Inner Driver</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Pressure</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_pressure_rear_inner_driver || ""}
                            onChange={(e) => handleInputChange("tyre_pressure_rear_inner_driver", parseFloat(e.target.value))}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_pressure_rear_inner_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_pressure_rear_inner_driver ? `${vehicle.tyre_pressure_rear_inner_driver} PSI` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Depth</span>
                        {isEditing ? (
                          <Input
                            value={editVehicle.tyre_depth_rear_inner_driver || ""}
                            onChange={(e) => handleInputChange("tyre_depth_rear_inner_driver", e.target.value)}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_depth_rear_inner_driver ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_depth_rear_inner_driver ? `${vehicle.tyre_depth_rear_inner_driver} mm` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Torque</span>
                        <span className="text-sm font-semibold text-gray-400 block">NO NM</span>
                      </div>
                    </div>
                  </div>

                  {/* Rear Inner Passenger */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Rear Inner Passenger</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Pressure</span>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editVehicle.tyre_pressure_rear_inner_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_pressure_rear_inner_passenger", parseFloat(e.target.value))}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_pressure_rear_inner_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_pressure_rear_inner_passenger ? `${vehicle.tyre_pressure_rear_inner_passenger} PSI` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Depth</span>
                        {isEditing ? (
                          <Input
                            value={editVehicle.tyre_depth_rear_inner_passenger || ""}
                            onChange={(e) => handleInputChange("tyre_depth_rear_inner_passenger", e.target.value)}
                            className="w-full h-7 text-xs"
                          />
                        ) : (
                          <span className={`text-sm font-semibold block ${vehicle.tyre_depth_rear_inner_passenger ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {vehicle.tyre_depth_rear_inner_passenger ? `${vehicle.tyre_depth_rear_inner_passenger} mm` : 'No data'}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Torque</span>
                        <span className="text-sm font-semibold text-gray-400 block">NO NM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-5">
            {/* Missing Documents Alert - If any missing attributes are document-related */}
            {vehicle.missing_attributes && vehicle.missing_attributes.some((item: string) => 
              item.toLowerCase().includes('documents') || 
              item === 'Insurance documents' || 
              item === 'Tax documents'
            ) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Missing Documents Required</p>
                    <p className="text-xs text-amber-700">
                      Some documents are missing. Please upload them below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-bold text-gray-900">Vehicle Documents</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {documentTypes.map((doc) => {
                  const Icon = doc.icon;
                  const docUrl = vehicle[doc.key as keyof typeof vehicle] as string;
                  const hasDoc = hasDocument(docUrl);
                  
                  // Check if this document is in missing_attributes
                  const isMissing = vehicle.missing_attributes?.some((item: string) => {
                    const missingDocMap: { [key: string]: string } = {
                      "Insurance documents": "insurance_docs",
                      "Tax documents": "tax_docs",
                      "MOT documents": "mot_check_docs",
                      "PMI documents": "pmi_inspection_docs",
                      "LOLER documents": "loller_docs",
                      "Tacho calibration documents": "tacho_calibration_docs",
                      "Vehicle invoice": "vehicle_invoice_docs",
                      "Service records": "service_records_docs",
                      "New vehicle checklist": "new_vehicle_checklist_docs",
                      "Logbook": "logbook_docs",
                      "COIF technical": "COIF_technical_docs",
                    };
                    return missingDocMap[item] === doc.key;
                  });
                  
                  return (
                    <div 
                      key={doc.key} 
                      id={`document-${doc.key}`}
                      className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 transition-colors ${
                        isMissing ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className={`w-5 h-5 ${isMissing ? 'text-red-500' : 'text-gray-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${isMissing ? 'text-red-700' : 'text-gray-900'}`}>
                              {doc.label}
                            </p>
                            {isMissing && (
                              <Badge className="bg-red-100 text-red-700 border-0 rounded-full px-2 text-xs">
                                Missing
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs ${isMissing ? 'text-red-500' : 'text-gray-500'} mt-0.5`}>
                            {hasDoc ? "Document uploaded" : "No document"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasDoc ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewDoc(docUrl)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(docUrl, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="w-4 h-4 text-gray-400" />
                            </Button>
                          </>
                        ) : (
                          <FileUploader
                            onUploadSuccess={(url) => handleDocumentUpload(doc.key, url)}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                            maxSize={10 * 1024 * 1024} // 10MB
                            id={`upload-${doc.key}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Date Edit Dialog with Optional Document Upload */}
      <Dialog open={!!editDateField} onOpenChange={() => {
        setEditDateField(null);
        setUploadedDoc("");
        setDocumentError(null);
        setSkipUpload(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editDateField ? `Edit ${dateFields.find(f => f.key === editDateField)?.label || editDateField}` : 'Edit Date'}
            </DialogTitle>
            <DialogDescription>
              Update the date. You can upload a document now or skip to upload later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Date Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Date *</Label>
              <Input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            {/* Document Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Supporting Document</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skip-upload" 
                    checked={skipUpload}
                    onCheckedChange={(checked) => setSkipUpload(checked === true)}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor="skip-upload" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Upload later
                  </Label>
                </div>
              </div>
              
              {!skipUpload ? (
                <>
                  {uploadedDoc ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm truncate">
                          Document uploaded
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(uploadedDoc, '_blank')}
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedDoc("")}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <div 
                        onClick={() => document.getElementById(`date-${editDateField}-upload`)?.click()}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-2">
                          {isUploadingDoc ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                              <p className="text-sm text-gray-600">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">Click to upload</p>
                                <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC (max 10MB)</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <FileUploader
                        onUploadSuccess={(url) => {
                          setUploadedDoc(url);
                          setIsUploadingDoc(false);
                          setDocumentError(null);
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                        maxSize={10 * 1024 * 1024}
                        id={`date-${editDateField}-upload`}
                      />
                    </div>
                  )}
                  
                  {documentError && (
                    <p className="text-sm text-red-500">{documentError}</p>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Document will be uploaded later</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        You can upload the supporting document from the Documents tab later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDateField(null);
                setUploadedDoc("");
                setDocumentError(null);
                setSkipUpload(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!tempDate) {
                  toast.error("Please select a date");
                  return;
                }
                
                if (!skipUpload && !uploadedDoc) {
                  toast.error("Please upload a document or select 'Upload later'");
                  return;
                }
                
                handleDateSave(uploadedDoc || null);
              }}
              disabled={isUploadingDoc || !tempDate || (!skipUpload && !uploadedDoc)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {skipUpload ? "Save Date Only" : "Save Date & Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PMI Inspection Dialog */}
      <InspectionDialog
        open={pmiDialogOpen}
        onClose={() => setPmiDialogOpen(false)}
        lastPMIDate={vehicle.last_pmi_date}
        vehicleId={vehicleId}
        vehicleRegistration={vehicle.registration_number}
        username={cookies.get("username") || "User"}
        onUpdateSuccess={handleUpdateSuccess}
      />

      {/* MOT Dialog */}
      <MOTDialog 
        open={motDialogOpen}
        onClose={() => setMotDialogOpen(false)}
        currentMOTDate={vehicle.mot_expiry}
        vehicleId={vehicleId}
        vehicleRegistration={vehicle.registration_number}
        username={cookies.get("username") || "User"}
        onUpdateSuccess={handleUpdateSuccess}
      />

      {/* Document Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" 
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Document Preview</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewDoc.endsWith('.pdf') ? (
                <iframe 
                  src={previewDoc} 
                  className="w-full h-[70vh] border-0" 
                  title="Document Preview" 
                />
              ) : (
                <img 
                  src={previewDoc} 
                  alt="Document" 
                  className="w-full h-auto max-h-[70vh] object-contain" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}