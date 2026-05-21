"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  History,
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
  Car,
  CreditCard,
  MapPin,
  Upload,
  Trash2,
  Bell,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import API_URL from "@/app/utils/ENV";
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import ImageUploader from "@/components/Media/UploadImage";
import { useAutoScroll } from "@/app/utils/useAutoScroll";
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

// Document type mapping for API
const DOCUMENT_TYPE_MAPPING = {
  mot_check_docs: 9,
  insurance_docs: 13,
  tax_docs: 12,
  pmi_inspection_docs: 10,
  pmi_certificate: 16,
  valet_check: 16,
  interiam_pmi_certificate: 17,
  loller_docs: null, // Add appropriate ID if exists
  tacho_calibration_docs: null, // Add appropriate ID if exists
  vehicle_invoice_docs: 2,
  service_records_docs: 4,
  new_vehicle_checklist_docs: 14,
  last_valet_check_docs: 14,
  logbook_docs: 1,
  COIF_technical_docs: 3,
  other_docs: 6,
  others_docs: 6,
};

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const role = cookies.get("role");
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
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const [pmiDialogOpen, setPmiDialogOpen] = useState(false);
  const [motDialogOpen, setMotDialogOpen] = useState(false);
  const [showAllCompliance, setShowAllCompliance] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [sitesOpen, setSitesOpen] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [tyreMaintenanceDialogOpen, setTyreMaintenanceDialogOpen] = useState(false);
  const [tyreExpiryDialogOpen, setTyreExpiryDialogOpen] = useState(false);
  const [vehicleDocuments, setVehicleDocuments] = useState<any[]>([]);
  const [documentsMap, setDocumentsMap] = useState<Map<string, any>>(new Map());
  const [warningsDialogOpen, setWarningsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editingDocData, setEditingDocData] = useState({
    expiryDate: "",
    isApplicable: true,
    url: "",
    doc_has_expiry: true
  });
  const [initialDocData, setInitialDocData] = useState({
    expiryDate: "",
    url: ""
  });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [draggedOverDocKey, setDraggedOverDocKey] = useState<string | null>(null);

  const openDocDetail = (docConfig: any, initialFile: File | null = null) => {
    const apiDoc = documentsMap.get(docConfig.docCode);
    const initialData = {
      expiryDate: apiDoc?.expiry_date?.split('T')[0] || "",
      isApplicable: true,
      url: apiDoc?.url || vehicle[docConfig.docCode] || vehicle[docConfig.key] || "",
      doc_has_expiry: apiDoc?.doc_has_expiry !== undefined ? apiDoc.doc_has_expiry : (docConfig.doc_has_expiry ?? true)
    };
    setEditingDocument(docConfig);
    setEditingDocData(initialData);
    setInitialDocData({
      expiryDate: initialData.expiryDate,
      url: initialData.url
    });
    setPendingFile(initialFile);
  };

  const handleDocCardDragEnter = (e: React.DragEvent, docKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverDocKey(docKey);
  };

  const handleDocCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDocCardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverDocKey(null);
  };

  const handleDocCardDrop = (e: React.DragEvent, docConfig: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverDocKey(null);

    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (docConfig.hasDialog) {
        setPendingFile(droppedFile);
        openEditDateDialog(docConfig.dateField, vehicle[docConfig.dateField]);
      } else {
        openDocDetail(docConfig, droppedFile);
      }
    }
  };

  /* ── warning helpers ── */
  const warningCount = vehicle?.warnings?.length || 0;
  const errorCount = vehicle?.warnings?.filter((w: string) => w.includes("🔴")).length || 0;
  const cautionCount = vehicle?.warnings?.filter((w: string) => w.includes("⚠️")).length || 0;
  const pendingCount = vehicle?.warnings?.filter((w: string) => w.includes("⏳")).length || 0;

  const getWarningStyle = (w: string) => {
    if (w.includes("🔴")) return { cls: "bg-red-50 text-red-800 border border-red-200", icon: <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" /> };
    if (w.includes("⚠️")) return { cls: "bg-orange-50 text-orange-800 border border-orange-200", icon: <AlertTriangle className="h-4 w-4 flex-shrink-0 text-orange-500" /> };
    if (w.includes("⏳")) return { cls: "bg-amber-50 text-amber-800 border border-amber-200", icon: <AlertTriangle className="h-4 w-4 flex-shrink-0 text-orange-500" /> };
    return { cls: "bg-emerald-50 text-emerald-800 border border-emerald-200", icon: <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" /> };
  };

  const stripEmoji = (w: string) => w.replace(/^[\p{Emoji}\s]+/u, "").trim();

  const { expandedId, handleExpandedChange } = useAutoScroll(loading, "vehicle_docs", true);

  const refreshVehicleData = useCallback(async () => {
    if (!id || !token) return;
    try {
      const vehicleRes = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const vehicleData = await vehicleRes.json();

      if (vehicleData.success) {
        const vehicleDataWithType = {
          ...vehicleData.data,
          vehicle_type: vehicleData.data.vehicle_type,
          vehicles_type: vehicleData.data.vehicle_type,
        };

        setVehicle(vehicleDataWithType);
        setEditVehicle(vehicleDataWithType);

        if (vehicleDataWithType.site_allocated) {
          const siteIds = vehicleDataWithType.site_allocated.map((site: any) => site.id);
          setSelectedSites(siteIds);
        }

        if (Array.isArray(vehicleData.data.documents)) {
          setVehicleDocuments(vehicleData.data.documents);

          // Create a map for quick document lookup by document_type code
          const docMap = new Map();
          vehicleData.data.documents.forEach((doc: any) => {
            if (doc.document_type?.code) {
              docMap.set(doc.document_type.code, doc);
            }
          });
          setDocumentsMap(docMap);
        }
      } else {
        setError("Failed to fetch vehicle data");
      }
    } catch (err) {
      setError("Error fetching data");
      console.error("Error:", err);
    }
  }, [id, token]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await refreshVehicleData();
    setLoading(false);
  }, [refreshVehicleData]);

  useEffect(() => {
    if (id && token) {
      fetchData();

      // Fetch metadata (sites and vehicle types) in parallel, non-blocking
      const fetchMetaData = async () => {
        try {
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };
          const [sitesRes, typesRes] = await Promise.all([
            fetch(`${API_URL}/api/sites/list-names/`, { headers }),
            fetch(`${API_URL}/api/vehicle-types/`, { headers }),
          ]);
          const [sitesData, typesData] = await Promise.all([
            sitesRes.json(),
            typesRes.json(),
          ]);

          if (sitesData.success) {
            setSites(sitesData.data || []);
          }
          if (typesData.success) {
            setVehicleTypes(typesData.data || []);
          }
        } catch (err) {
          console.error("Error fetching metadata:", err);
        }
      };
      fetchMetaData();
    }
  }, [id, token, fetchData]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditVehicle(vehicle);
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
        last_tyre_maintenance_check_date: editVehicle.last_tyre_maintenance_check_date,
        tyre_expiry_date: editVehicle.tyre_expiry_date,
        tyre_maintenance_check_docs: editVehicle.tyre_maintenance_check_docs,
        tyre_expiry_docs: editVehicle.tyre_expiry_docs,
        tyre_expiry_front_driver: editVehicle.tyre_expiry_front_driver,
        tyre_expiry_front_passenger: editVehicle.tyre_expiry_front_passenger,
        tyre_expiry_rear_outer_driver: editVehicle.tyre_expiry_rear_outer_driver,
        tyre_expiry_rear_outer_passenger: editVehicle.tyre_expiry_rear_outer_passenger,
        tyre_expiry_rear_inner_driver: editVehicle.tyre_expiry_rear_inner_driver,
        tyre_expiry_rear_inner_passenger: editVehicle.tyre_expiry_rear_inner_passenger,
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
        vehicle_type: editVehicle.vehicle_type?.id || editVehicle.vehicles_type?.id,
      };

      if (editVehicle.is_tacho_fitted && (!editVehicle.tacho_calibration_expiry || editVehicle.tacho_calibration_expiry === "")) {
        vehicleData.tacho_calibration_expiry = null;
        vehicleData.tacho_calibration_docs = null;
      }

      if (editVehicle.is_wheelchair_lift_fitted && (!editVehicle.loller_test_expiry_date || editVehicle.loller_test_expiry_date === "")) {
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
        const fixedUpdatedData = {
          ...updatedData.data,
          vehicle_type: updatedData.data.vehicle_type,
          vehicles_type: updatedData.data.vehicle_type,
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
      return { ...prev, [field]: value };
    });
  };

  const handleToggleFitted = async (field: "is_tacho_fitted" | "is_wheelchair_lift_fitted", value: boolean) => {
    if (!token) return;
    // Optimistically update UI
    setVehicle((prev: any) => prev ? { ...prev, [field]: value } : prev);
    setEditVehicle((prev: any) => prev ? { ...prev, [field]: value } : prev);
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(field === "is_tacho_fitted" ? `Tacho marked as ${value ? "fitted" : "not fitted"}` : `Wheelchair lift marked as ${value ? "fitted" : "not fitted"}`);

      if (value) {
        if (field === "is_tacho_fitted") {
          const tachoItem = complianceItems.find(item => item.key === "tacho");
          if (tachoItem) openDocDetail(tachoItem);
        } else if (field === "is_wheelchair_lift_fitted") {
          const lollerItem = complianceItems.find(item => item.key === "loller");
          if (lollerItem) openDocDetail(lollerItem);
        }
      }
    } catch {
      // Revert on failure
      setVehicle((prev: any) => prev ? { ...prev, [field]: !value } : prev);
      setEditVehicle((prev: any) => prev ? { ...prev, [field]: !value } : prev);
      toast.error("Failed to update. Please try again.");
    }
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
          const fixedUpdatedData = {
            ...updatedData.data,
            vehicle_type: updatedData.data.vehicle_type,
            vehicles_type: updatedData.data.vehicle_type,
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

  // PATCH API for compliance documents
  const handleComplianceDocumentUpload = async (docType: string, documentTypeId: number, fileUrl: string) => {
    if (!token) return;

    try {
      // First, check if document already exists for this vehicle and type
      const existingDoc = Array.from(documentsMap.values()).find(
        (doc: any) => doc.document_type?.id === documentTypeId
      );

      const payload = {
        vehicle_id: vehicleId,
        documents: [
          {
            document_type: documentTypeId,
            title: docType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            url: fileUrl,
            expiry_date: null,
            doc_has_expiry: existingDoc?.doc_has_expiry !== undefined ? existingDoc.doc_has_expiry : true,
            ...(existingDoc && { document_id: existingDoc.id }) // Update existing if found
          }
        ]
      };

      const url = `${API_URL}/api/documents/documents/vehicle-bulk/`;
      const method = existingDoc ? "POST" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refresh vehicle data
        await refreshVehicleData();
        toast.success(`${docType} uploaded successfully`);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to upload ${docType}`);
      }
    } catch (err: any) {
      console.error("Error uploading compliance document:", err);
      toast.error(err.message || "Failed to upload document");
    }
  };

  const handleDocumentUpload = async (docType: string, fileUrl: string) => {
    if (!token) return;

    // Check if it's a compliance document with a type ID
    const documentTypeId = DOCUMENT_TYPE_MAPPING[docType as keyof typeof DOCUMENT_TYPE_MAPPING];

    if (documentTypeId) {
      await handleComplianceDocumentUpload(docType, documentTypeId, fileUrl);
      return;
    }

    // Handle tyre documents (these don't use the document management system)
    try {
      const payload: any = { [docType]: fileUrl };

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
          const fixedUpdatedData = {
            ...updatedData.data,
            vehicle_type: updatedData.data.vehicle_type,
            vehicles_type: updatedData.data.vehicle_type,
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

  const handleDeleteDocument = async (docId: number | string, docType: string, isLegacy: boolean = false) => {
    if (!token) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete this ${docType}?`);
    if (!confirmDelete) return;

    const toastId = toast.loading("Deleting document...");

    try {
      let res;
      if (isLegacy) {
        res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [docId]: null }),
        });
      } else {
        res = await fetch(`${API_URL}/api/documents/documents/${docId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (res.ok) {
        // Refresh vehicle data
        await refreshVehicleData();
        toast.success("Document deleted successfully", { id: toastId });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete document");
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
      toast.error(err.message || "Failed to delete document", { id: toastId });
    }
  };

  const handleDirectDocumentUpload = async (docConfig: any, url: string) => {
    const toastId = toast.loading(`Saving ${docConfig.label}...`);
    try {
      const documentTypeId = docConfig.document_type;
      const apiDoc = documentsMap.get(docConfig.docCode);

      if (documentTypeId) {
        // Save document via Bulk API (Modern way)
        const payload = {
          vehicle_id: vehicleId,
          documents: [
            {
              document_type: documentTypeId,
              title: docConfig.label,
              url: url,
              expiry_date: apiDoc?.expiry_date || null,
              doc_has_expiry: apiDoc?.doc_has_expiry !== undefined ? apiDoc.doc_has_expiry : (docConfig.doc_has_expiry ?? true),
              ...(apiDoc && { document_id: apiDoc.id })
            }
          ]
        };

        const res = await fetch(`${API_URL}/api/documents/documents/vehicle-bulk/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save changes");
      } else {
        // Fallback to legacy PATCH for items without document_type (e.g. LOLLER, Tacho)
        const payload: any = {
          [docConfig.docCode]: url
        };
        if (docConfig.dateField) {
          payload[docConfig.dateField] = apiDoc?.expiry_date || null;
        }

        const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save changes");
      }

      toast.success(`${docConfig.label} uploaded and saved successfully`, { id: toastId });
      fetchData();
    } catch (err) {
      console.error("Error saving document:", err);
      toast.error(`Failed to save ${docConfig.label}. Please try again.`, { id: toastId });
    }
  };

  const handleDirectFileUpload = async (docConfig: any, file: File) => {
    const toastId = toast.loading(`Uploading ${docConfig.label}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/media/upload_media/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const result = await res.json();
      if (result.success) {
        toast.dismiss(toastId);
        await handleDirectDocumentUpload(docConfig, result.data.url);
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Upload failed: ${err.message || "Please try again."}`, { id: toastId });
    }
  };

  const handleDateSave = async (documentUrl: string | null, fieldOverride?: string) => {
    const activeField = fieldOverride || editDateField;
    if (!activeField || !tempDate) return;

    const toastId = toast.loading("Saving date...");

    try {
      const updateData: any = { [activeField]: tempDate };
      const dateToDocMap: { [key: string]: string } = {
        mot_expiry: "mot_check_docs",
        tax_expiry: "tax_docs",
        insurance_expiry: "insurance_docs",
        last_pmi_date: "valet_check",
        loller_test_expiry_date: "loller_docs",
        tacho_calibration_expiry: "tacho_calibration_docs",
        next_loller_test_date: "loller_docs",
        last_tyre_maintenance_check_date: "tyre_maintenance_check_docs",
        tyre_expiry_date: "tyre_expiry_docs",
      };
      const docField = dateToDocMap[activeField];

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
        const fixedUpdatedData = {
          ...updatedData.data,
          vehicle_type: updatedData.data.vehicle_type,
          vehicles_type: updatedData.data.vehicle_type,
        };
        setVehicle(fixedUpdatedData);
        setEditVehicle(fixedUpdatedData);
        setEditDateField(null);
        setTempDate("");
        setUploadedDoc("");
        setSkipUpload(false);
        setDocumentError(null);

        // If this was a compliance document, also update the document via PATCH
        const docTypeId = docField ? DOCUMENT_TYPE_MAPPING[docField as keyof typeof DOCUMENT_TYPE_MAPPING] : null;
        if (docField && documentUrl && docTypeId) {
          await handleComplianceDocumentUpload(docField, docTypeId, documentUrl);
        }

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
      setTempDate(currentValue ? currentValue.split("T")[0] : "");
      setTyreMaintenanceDialogOpen(true);
      return;
    }
    if (field === "tyre_expiry_date") {
      setTempDate(currentValue ? currentValue.split("T")[0] : "");
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
    label: string;
    value?: string;
    isEditing?: boolean;
    onChange?: (v: string) => void;
    type?: string;
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
        <p className="text-sm font-medium text-slate-900">{value || "-"}</p>
      )}
    </div>
  );

  const getExpiryStatus = (expiryDate: string, key?: string) => {
    if (!expiryDate) return { color: "bg-slate-100 text-slate-600", text: "Not set", icon: AlertCircle };

    if (key === "last_pmi") {
      return { color: "bg-red-50 text-red-600 border-red-200", text: "Date Passed", icon: CheckCircle };
    }

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: "bg-red-50 text-red-600 border-red-200", text: "Expired", icon: AlertTriangle };
    if (diffDays <= 30) return { color: "bg-orange-50 text-orange-600 border-orange-200", text: `${diffDays} days left`, icon: Clock };
    if (diffDays <= 60) return { color: "bg-amber-50 text-amber-600 border-amber-200", text: `${diffDays} days left`, icon: Clock };
    return { color: "bg-emerald-50 text-emerald-600 border-emerald-200", text: "Valid", icon: CheckCircle };
  };

  const hasDocument = (docUrl: string | null | undefined, docCode?: string) => {
    if (docCode && documentsMap.has(docCode)) {
      return true;
    }
    return docUrl && docUrl !== "" && docUrl !== "null" && docUrl.length > 0;
  };

  const getDocumentUrl = (docCode: string, fallbackUrl?: string | null) => {
    const doc = documentsMap.get(docCode);
    if (doc && doc.url) {
      return doc.url;
    }
    return fallbackUrl;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "unavailable":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "assigned":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "disabled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getRoadworthyBadgeColor = (status: string) => {
    switch (status) {
      case "no_defect":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "minor_defect_roadworthy":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "minor_defect_not_roadworthy":
      case "major_defect_not_roadworthy":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "unavailable":
        return "Unavailable";
      case "assigned":
        return "Assigned";
      case "disabled":
        return "Disabled";
      default:
        return status;
    }
  };

  type TyreRowProps = {
    label: string;
    unit: string;
    valueKey: string;
    type?: string;
    highlight?: boolean;
  };

  function TyreRow({ label, unit, valueKey, type = "text", highlight }: TyreRowProps) {
    const value = isEditing ? editVehicle?.[valueKey] : vehicle?.[valueKey];

    const displayValue =
      value !== null && value !== undefined && value !== ""
        ? `${value}${unit ? ` ${unit}` : ""}`
        : "N/A";

    return (
      <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <div className="flex flex-col">
          <span className="text-sm text-slate-500">{label}</span>
          {unit && !isEditing && <span className="text-xs text-slate-400">{unit}</span>}
        </div>

        <div className="min-w-[90px] text-right">
          {isEditing ? (
            <div className="relative">
              <Input
                type={type}
                value={value ?? ""}
                onChange={(e) =>
                  handleInputChange(
                    valueKey,
                    type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
                  )
                }
                className="h-8 text-sm pr-20 text-right focus:ring-2 focus:ring-blue-500"
              />
              {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>}
            </div>
          ) : (
            <span
              className={`text-sm font-semibold ${highlight ? "text-green-700 bg-green-50 px-2 py-1 rounded-md" : "text-slate-900"
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
      case "no_defect":
        return "No Defect";
      case "minor_defect_roadworthy":
        return "Minor Defect - Roadworthy";
      case "minor_defect_not_roadworthy":
        return "Minor Defect - Not Roadworthy";
      case "major_defect_not_roadworthy":
        return "Major Defect - Not Roadworthy";
      default:
        return status;
    }
  };

  const complianceItems = [
    { key: "mot", label: "MOT Certificate", icon: CheckCircle, dateField: "mot_expiry", docCode: "mot_check_docs", color: "orange", hasDialog: true, document_type: 9, doc_has_expiry: true },
    { key: "insurance", label: "Insurance", icon: Shield, dateField: "insurance_expiry", docCode: "insurance_docs", color: "purple", document_type: 13, doc_has_expiry: true },
    { key: "tax", label: "Road Tax", icon: DollarSign, dateField: "tax_expiry", docCode: "tax_docs", color: "green", document_type: 12, doc_has_expiry: true },
    { key: "last_pmi", label: "Last PMI Date", icon: Wrench, dateField: "last_pmi_date", docCode: "valet_check", color: "orange", hasDialog: true, document_type: 16, doc_has_expiry: true },
    { key: "loller", label: "LOLER Test", icon: TestTube, dateField: "loller_test_expiry_date", docCode: "loller_docs", color: "pink", requiredForWheelchair: true, document_type: null, doc_has_expiry: true },
    { key: "tacho", label: "Tacho Calibration", icon: Gauge, dateField: "tacho_calibration_expiry", docCode: "tacho_calibration_docs", color: "indigo", requiredForTacho: true, document_type: null, doc_has_expiry: true },
  ];

  const additionalDocuments = [
    { key: "vehicle_invoice_docs", label: "Vehicle Invoice", icon: FileText, document_type: 2, docCode: "vehicle_invoice_docs", doc_has_expiry: false },
    { key: "service_records_docs", label: "Service Records", icon: Wrench, document_type: 4, docCode: "service_records_docs", doc_has_expiry: false },
    { key: "last_valet_check_docs", label: "New Vehicle Checklist", icon: FileCheck, document_type: 14, docCode: "last_valet_check_docs", doc_has_expiry: false },
    { key: "logbook_docs", label: "Log Book / V5C", icon: FileText, document_type: 1, docCode: "logbook_docs", doc_has_expiry: false },
    { key: "COIF_technical_docs", label: "COIF Technical", icon: FileText, document_type: 3, docCode: "COIF_technical_docs", doc_has_expiry: false },
    { key: "others_docs", label: "Other Documents", icon: FileText, document_type: 6, docCode: "others_docs", doc_has_expiry: false },
  ];

  function TyreCard({ title, pos, ageKey }: { title: string; pos: string; ageKey: string }) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="font-medium text-slate-900 mb-3">{title}</p>
        <div className="space-y-2 text-sm">
          <TyreRow label="Pressure" unit="PSI" valueKey={`tyre_pressure_${pos}`} type="number" />
          <TyreRow label="Depth" unit="mm" valueKey={`tyre_depth_${pos}`} highlight />
          <TyreRow label="Torque" unit="NM" valueKey={`tyre_torque_${pos}`} type="number" />
          <TyreRow label="Tyre Age" unit="" valueKey={ageKey} type="text" />
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
      return isEditing ? editVehicle?.is_wheelchair_lift_fitted : vehicle?.is_wheelchair_lift_fitted;
    }
    return true;
  };

  const calculateTotalPrice = () => {
    const price = parseFloat(vehicle?.price || "0");
    const vat = parseFloat(vehicle?.vat_amount || "0");
    return price + vat;
  };

  const getCurrentMileage = () => {
    const mileage = vehicle?.last_mileage;
    const unit = vehicle?.mileage_unit === "miles" ? "mi" : "km";
    return mileage ? `${parseFloat(mileage).toLocaleString()} ${unit}` : "-";
  };

  const handleSiteToggle = (siteId: number) => {
    setSelectedSites((prev) => {
      if (prev.includes(siteId)) {
        return prev.filter((id) => id !== siteId);
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
            <div>


            </div>
            <Badge className={`${getStatusBadgeColor(vehicle.vehicle_status)} px-3 py-1`}>
              {getStatusDisplayText(vehicle.vehicle_status)}
            </Badge>
            <Badge className={`${getRoadworthyBadgeColor(vehicle.vehicle_roadworthy_status)} px-3 py-1`}>
              {getRoadworthyDisplayText(vehicle.vehicle_roadworthy_status)}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-slate-50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                Vehicle
                {warningCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setWarningsDialogOpen(true); }}
                    className="relative ml-1 group/bell"
                  >
                    <Bell className="h-4 w-4 text-gray-400 group-hover/bell:text-orange-500 transition-colors" />
                    <span className={cn(
                      "absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5",
                      errorCount > 0 ? "bg-red-500" : cautionCount > 0 ? "bg-orange-500" : "bg-amber-500"
                    )}>
                      {warningCount}
                    </span>
                  </button>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="maintenance">Tyre Maintenance</TabsTrigger>
            </TabsList>
          </div>

          <Dialog open={warningsDialogOpen} onOpenChange={setWarningsDialogOpen}>
            <DialogContent className="max-w-lg p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
              <DialogHeader className="px-6 py-5 bg-white border-b border-gray-100">
                <DialogTitle className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl",
                    errorCount > 0 ? "bg-red-50" : cautionCount > 0 ? "bg-orange-50" : "bg-amber-50"
                  )}>
                    <Bell className={cn(
                      "h-5 w-5",
                      errorCount > 0 ? "text-red-500" : cautionCount > 0 ? "text-orange-500" : "text-amber-500"
                    )} />
                  </div>
                  <div>
                    <span className="text-base font-bold text-gray-900">Vehicle Notifications</span>
                    <p className="text-xs text-gray-400 font-normal mt-0.5">
                      {warningCount} item{warningCount !== 1 ? "s" : ""} require attention
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2.5">
                  {vehicle?.warnings?.map((w: string, i: number) => {
                    const { cls, icon } = getWarningStyle(w);
                    return (
                      <div key={i} className={cn("flex items-start gap-3 p-3.5 rounded-xl text-sm font-medium transition-all hover:shadow-sm", cls)}>
                        <div className="mt-0.5">{icon}</div>
                        <span className="flex-1 leading-relaxed">{stripEmoji(w)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="rounded-lg h-9 px-6 text-sm border-gray-200 text-gray-600 hover:bg-gray-100"
                  onClick={() => setWarningsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Car className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Vehicle Details</h3>
              </div>

              <div className="flex gap-6">
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
                          onChange={(e) => handleInputChange("last_mileage", e.target.value === "" ? "" : Number(e.target.value))}
                          className="h-9 text-sm flex-1 min-w-[80px]"
                        />
                        <Select
                          value={editVehicle.mileage_unit || "miles"}
                          onValueChange={(value) => handleInputChange("mileage_unit", value)}
                        >
                          <SelectTrigger className="h-9 w-[75px] text-xs bg-slate-50 border-slate-200 focus:ring-0">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="miles">mi</SelectItem>
                            <SelectItem value="kms">km</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{getCurrentMileage()}</p>
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
                      <Badge className="bg-red-100 text-red-600">{vehicle.number_of_seats} seats</Badge>
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
                              ? `${selectedSites.length} site${selectedSites.length > 1 ? "s" : ""} selected`
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

            {/* Vehicle Features Card - always visible */}


            {role === 'superadmin' && (
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
                      <Badge className="bg-red-100 text-red-600">{vehicle.purchased_from || "-"}</Badge>
                    )}
                  </div>

                  <Field label="Purchase Mileage" value={vehicle.purchase_mileage ? `${vehicle.purchase_mileage} km` : "-"} />

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Purchased By</p>
                    <p className="text-sm font-medium text-slate-900">{vehicle.purchased_by || "-"}</p>
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
                      <Badge className="bg-red-100 text-red-600">£{Number(vehicle.price).toLocaleString()}</Badge>
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
                      <p className="text-sm font-medium text-slate-900">£{Number(vehicle.vat_amount || 0).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="space-y-1 flex-1">
                      <p className="text-xs text-slate-500">Has VAT</p>
                      {isEditing ? (
                        <Switch checked={editVehicle.has_vat} onCheckedChange={(c) => handleInputChange("has_vat", c)} />
                      ) : (
                        <Switch checked={vehicle.has_vat} disabled />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Total Price</p>
                    <Badge className="bg-emerald-100 text-emerald-700">£{calculateTotalPrice().toLocaleString()}</Badge>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <FileText className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Additional Documents – <span className="text-[#F15C5C] font-semibold">{vehicle.registration_number} - {vehicle.make} {vehicle.model}</span>
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-10 px-4"
                  onClick={() => router.push(`/dashboard/vehicles/list/${id}/document-history`)}
                >
                  <History className="w-4 h-4 mr-2" />
                  View Document History
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {additionalDocuments.filter(doc => doc.key !== 'vehicle_invoice_docs' || role === 'superadmin').map((doc) => {
                  const Icon = doc.icon;
                  const apiDoc = documentsMap.get(doc.docCode);
                  const docUrl = apiDoc ? apiDoc.url : (vehicle[doc.key as keyof typeof vehicle] as string);
                  const hasDoc = hasDocument(docUrl, doc.docCode);
                  const expiryDate = apiDoc?.expiry_date;
                  const hasExpiry = apiDoc?.doc_has_expiry !== undefined ? apiDoc.doc_has_expiry : (doc.doc_has_expiry ?? true);

                  const isDraggedOver = draggedOverDocKey === doc.docCode;

                  return (
                    <div
                      key={doc.key}
                      onClick={() => openDocDetail(doc)}
                      onDragEnter={(e) => handleDocCardDragEnter(e, doc.docCode)}
                      onDragOver={handleDocCardDragOver}
                      onDragLeave={handleDocCardDragLeave}
                      onDrop={(e) => handleDocCardDrop(e, doc)}
                      className={cn(
                        "cursor-pointer bg-white rounded-[2rem] p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300",
                        isDraggedOver && "border-orange-500 bg-orange-50/20 scale-[1.01] [&>*]:pointer-events-none"
                      )}
                    >
                      {/* Top Area: Image/Upload */}
                      <div className="relative h-56 mb-6 rounded-3xl overflow-hidden bg-[#F9FAFB] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group/upload">
                        {hasDoc ? (
                          <>
                            {docUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={docUrl} className="w-full h-full object-cover" alt={doc.label} />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <FileText className="w-16 h-16 mb-2 text-slate-300" />
                                <p className="text-xs font-medium">PDF Document</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full w-10 h-10 p-0 bg-white hover:bg-slate-50"
                                onClick={(e) => { e.stopPropagation(); setPreviewDoc(docUrl); }}
                              >
                                <Eye className="w-5 h-5 text-slate-600" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full w-10 h-10 p-0 bg-white hover:bg-slate-50"
                                onClick={(e) => { e.stopPropagation(); window.open(docUrl, "_blank"); }}
                              >
                                <Download className="w-5 h-5 text-slate-600" />
                              </Button>
                            </div>
                            {/* Delete Button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-4 right-4 rounded-full w-10 h-10 p-0 bg-[#F15C5C] hover:bg-red-600 border-none shadow-lg z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (apiDoc) {
                                  handleDeleteDocument(apiDoc.id, doc.label);
                                } else {
                                  handleDeleteDocument(doc.key, doc.label, true);
                                }
                              }}
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100/50 rounded-2xl flex items-center justify-center mb-4">
                              <Upload className="w-8 h-8 text-[#F26633]" />
                            </div>
                            <p className="font-bold text-slate-900 text-sm mb-1">Drag & Drop File Here</p>
                            <p className="text-[10px] text-slate-400">PDF, Word, Excel, PowerPoint - max 10.0MB</p>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 px-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-slate-900 text-xl">{doc.label}</p>
                        </div>

                        {!hasDoc && (
                          <Badge className="bg-slate-100 text-slate-400 hover:bg-slate-100 border-none text-[10px] font-medium px-3 py-1 rounded-full mb-4">
                            Not uploaded
                          </Badge>
                        )}

                        {hasDoc && hasExpiry && (
                          <div className="mt-4 p-4 bg-[#F8F9FA] rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Calendar className="w-4 h-4 text-orange-400" />
                              </div>
                              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Expiry Date</p>
                            </div>
                            <p className="text-sm font-bold text-[#F26633]">
                              {expiryDate ? formatDate(expiryDate) : "DD/MM/YYYY"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 flex gap-3">
                        {!hasDoc ? (
                          <>
                            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                onClick={() => openDocDetail(doc)}
                                className="w-full bg-[#F26633] hover:bg-orange-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2"
                              >
                                Upload <Upload className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              className="flex-1 bg-[#FDECEC] hover:bg-red-50 text-[#F15C5C] border-none font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                              onClick={(e) => { e.stopPropagation(); openDocDetail(doc); }}
                            >
                              Later <Clock className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="w-full" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              className="w-full bg-[#FDECEC] hover:bg-red-50 text-[#F15C5C] border-none font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                              onClick={() => openDocDetail(doc)}
                            >
                              Update <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Tyre Maintenance</h3>
                  </div>
                </div>
              </div>

              <div className="mb-8 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                      <Gauge className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 leading-none">Tyre Management</p>
                      <button
                        onClick={() => openEditDateDialog("last_tyre_maintenance_check_date", vehicle?.last_tyre_maintenance_check_date)}
                        className="text-sm text-slate-500 hover:text-orange-600 transition-colors underline decoration-dotted underline-offset-4"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 text-center px-6 border-x border-slate-100 hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">
                      Last Tyre Check Date:{" "}
                      <span className="font-normal text-slate-600 ml-1">
                        {vehicle?.last_tyre_maintenance_check_date
                          ? formatDate(vehicle.last_tyre_maintenance_check_date)
                          : "DD/MM/YYYY"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-1 justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        Document:{" "}
                        <span
                          className={vehicle?.tyre_maintenance_check_docs ? "text-emerald-600 font-medium" : "text-slate-500 font-normal"}
                        >
                          {vehicle?.tyre_maintenance_check_docs ? "Uploaded" : "Not Uploaded"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {vehicle?.tyre_maintenance_check_docs && (
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 md:hidden">
                  <p className="text-sm font-medium text-slate-900">
                    Last Tyre Check Date:{" "}
                    <span className="text-slate-600 ml-1">
                      {vehicle?.last_tyre_maintenance_check_date
                        ? formatDate(vehicle.last_tyre_maintenance_check_date)
                        : "DD/MM/YYYY"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_260px_1fr] gap-8 items-center">
                <div className="space-y-4">
                  <TyreCard title="Front Passenger" pos="front_passenger" ageKey="tyre_expiry_front_passenger" />
                  <TyreCard title="Rear Outer Passenger" pos="rear_outer_passenger" ageKey="tyre_expiry_rear_outer_passenger" />
                  <TyreCard title="Rear Inner Passenger" pos="rear_inner_passenger" ageKey="tyre_expiry_rear_inner_passenger" />
                </div>

                <div className="relative flex justify-center">
                  <img src="/vehicle-top.png" alt="Vehicle" className="w-44 z-10" />
                  <div className="absolute bottom-10 left-1/2 -translate-x-[90%] w-10 h-14 bg-red-500 rounded-md opacity-90" />
                  <div className="absolute bottom-10 left-1/2 translate-x-[10%] w-10 h-14 bg-blue-500 rounded-md opacity-90" />
                </div>

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
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                    <Shield className="w-6 h-6 text-purple-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Compliance Documents – <span className="text-[#F15C5C] font-semibold">{vehicle.registration_number} - {vehicle.make} {vehicle.model}</span>
                  </h3>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Vehicle Features</h3>
                </div>

                <div className="grid grid-cols-2 gap-6 max-w-md">
                  {/* Tacho Fitted */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Tacho Fitted</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {vehicle.is_tacho_fitted ? "Fitted" : "Not Fitted"}
                      </p>
                    </div>
                    <Switch
                      checked={vehicle.is_tacho_fitted ?? false}
                      onCheckedChange={(c) => handleToggleFitted("is_tacho_fitted", c)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  {/* Wheelchair Lift Fitted */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Wheelchair Lift</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {vehicle.is_wheelchair_lift_fitted ? "Fitted" : "Not Fitted"}
                      </p>
                    </div>
                    <Switch
                      checked={vehicle.is_wheelchair_lift_fitted ?? false}
                      onCheckedChange={(c) => handleToggleFitted("is_wheelchair_lift_fitted", c)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {complianceItems.map((item) => {
                  const Icon = item.icon;
                  const dateValue = vehicle[item.dateField as keyof typeof vehicle] as string;
                  const docFromVehicle = vehicle[item.docCode as keyof typeof vehicle] as string;
                  const docFromAPI = documentsMap.get(item.docCode);
                  const docUrl = docFromAPI?.url || docFromVehicle;
                  const hasDoc = hasDocument(docUrl, item.docCode);
                  const status = getExpiryStatus(dateValue, item.key);
                  const StatusIcon = status.icon;
                  const hasExpiry = docFromAPI?.doc_has_expiry !== undefined ? docFromAPI.doc_has_expiry : (item.doc_has_expiry ?? true);

                  const isRequired =
                    (item.requiredForTacho && (isEditing ? editVehicle.is_tacho_fitted : vehicle.is_tacho_fitted)) ||
                    (item.requiredForWheelchair && (isEditing ? editVehicle.is_wheelchair_lift_fitted : vehicle.is_wheelchair_lift_fitted));

                  if (!shouldShowComplianceItem(item)) return null;

                  const isDraggedOver = draggedOverDocKey === item.docCode;

                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        if (item.hasDialog) {
                          openEditDateDialog(item.dateField, dateValue);
                        } else {
                          openDocDetail(item);
                        }
                      }}
                      onDragEnter={(e) => handleDocCardDragEnter(e, item.docCode)}
                      onDragOver={handleDocCardDragOver}
                      onDragLeave={handleDocCardDragLeave}
                      onDrop={(e) => handleDocCardDrop(e, item)}
                      className={cn(
                        "cursor-pointer bg-white rounded-[2rem] p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300",
                        isRequired && !dateValue && "border-red-300 ring-1 ring-red-200",
                        isDraggedOver && "border-orange-500 bg-orange-50/20 scale-[1.01] [&>*]:pointer-events-none"
                      )}
                    >
                      {/* Top Area: Image/Upload */}
                      <div className="relative h-56 mb-6 rounded-3xl overflow-hidden bg-[#F9FAFB] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group/upload">
                        {hasDoc ? (
                          <>
                            {docUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={docUrl} className="w-full h-full object-cover" alt={item.label} />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <FileText className="w-16 h-16 mb-2 text-slate-300" />
                                <p className="text-xs font-medium">PDF Document</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full w-10 h-10 p-0 bg-white hover:bg-slate-50"
                                onClick={(e) => { e.stopPropagation(); setPreviewDoc(docUrl); }}
                              >
                                <Eye className="w-5 h-5 text-slate-600" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full w-10 h-10 p-0 bg-white hover:bg-slate-50"
                                onClick={(e) => { e.stopPropagation(); window.open(docUrl, "_blank"); }}
                              >
                                <Download className="w-5 h-5 text-slate-600" />
                              </Button>
                            </div>
                            {/* Delete Button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-4 right-4 rounded-full w-10 h-10 p-0 bg-[#F15C5C] hover:bg-red-600 border-none shadow-lg z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (docFromAPI) {
                                  handleDeleteDocument(docFromAPI.id, item.label);
                                } else {
                                  handleDeleteDocument(item.docCode, item.label, true);
                                }
                              }}
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100/50 rounded-2xl flex items-center justify-center mb-4">
                              <Upload className="w-8 h-8 text-[#F26633]" />
                            </div>
                            <p className="font-bold text-slate-900 text-sm mb-1">Drag & Drop File Here</p>
                            <p className="text-[10px] text-slate-400">PDF, Word, Excel, PowerPoint - max 10.0MB</p>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 px-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-slate-900 text-xl">{item.label}</p>
                          {isRequired && <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>}
                        </div>

                        {/* Fitted Toggles */}
                        {(item.key === "loller" || item.key === "tacho") && (
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">Fitted:</span>
                            {isEditing ? (
                              <Switch
                                checked={item.key === "loller" ? editVehicle.is_wheelchair_lift_fitted : editVehicle.is_tacho_fitted}
                                onCheckedChange={(c) => {
                                  const field = item.key === "loller" ? "is_wheelchair_lift_fitted" : "is_tacho_fitted";
                                  handleInputChange(field, c);
                                  if (c) {
                                    openDocDetail(item);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <Badge className={(item.key === "loller" ? vehicle.is_wheelchair_lift_fitted : vehicle.is_tacho_fitted) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                                {(item.key === "loller" ? vehicle.is_wheelchair_lift_fitted : vehicle.is_tacho_fitted) ? "Yes" : "No"}
                              </Badge>
                            )}
                          </div>
                        )}

                        {!hasDoc && !dateValue && (
                          <Badge className="bg-slate-100 text-slate-400 hover:bg-slate-100 border-none text-[10px] font-medium px-3 py-1 rounded-full mb-4">
                            Not set
                          </Badge>
                        )}

                        {hasExpiry && (
                          <div className="mt-4 p-4 bg-[#F8F9FA] rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Calendar className="w-4 h-4 text-orange-400" />
                              </div>
                              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                                {item.key === "last_pmi" ? "Last PMI" : "Expiry Date"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#F26633]">
                                {dateValue ? formatDate(dateValue) : "DD/MM/YYYY"}
                              </p>
                              <Badge className={cn("mt-1 text-[10px] h-5 border-none", status.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.text}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 flex gap-3">
                        {!hasDoc ? (
                          <>
                            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                onClick={() => {
                                  if (item.hasDialog) {
                                    openEditDateDialog(item.dateField, dateValue);
                                  } else {
                                    openDocDetail(item);
                                  }
                                }}
                                className="w-full bg-[#F26633] hover:bg-orange-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2"
                              >
                                Upload <Upload className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              className="flex-1 bg-[#FDECEC] hover:bg-red-50 text-[#F15C5C] border-none font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.hasDialog) {
                                  openEditDateDialog(item.dateField, dateValue);
                                } else {
                                  openDocDetail(item);
                                }
                              }}
                            >
                              Later <Clock className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="w-full" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              className="w-full bg-[#FDECEC] hover:bg-red-50 text-[#F15C5C] border-none font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                              onClick={() => {
                                if (item.hasDialog) {
                                  openEditDateDialog(item.dateField, dateValue);
                                } else {
                                  openDocDetail(item);
                                }
                              }}
                            >
                              Update <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
              <Button variant="outline" onClick={handleEditToggle}>
                <Edit className="w-6 h-6 mr-2" />
                Edit Details
              </Button>
            </div>
          )}
        </div>

        {/* Date Edit Dialog */}
        <Dialog open={!!editDateField} onOpenChange={(open) => {
          if (!open) {
            setEditDateField(null);
            setPendingFile(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Date & Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>
                  {editDateField === "last_pmi_date"
                    ? "Last PMI Date *"
                    : editDateField === "last_tyre_maintenance_check_date"
                      ? "Last Tyre Maintenance Check Date *"
                      : editDateField === "tyre_expiry_date"
                        ? "Tyre Expiry Date *"
                        : "Expiry Date *"}
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
                    <FileUploader
                      onUploadSuccess={(url) => setUploadedDoc(url)}
                      id={`date-${editDateField}-upload`}
                      initialFile={pendingFile}
                    />
                    <p className="text-sm mt-2">Click to upload (PDF, JPG, PNG)</p>
                  </div>
                )}
                {uploadedDoc && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm">Document uploaded</span>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedDoc("")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDateField(null);
                  setPendingFile(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handleDateSave(uploadedDoc || null)} disabled={!tempDate || (!skipUpload && !uploadedDoc)}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tyre Maintenance Dialog */}
        <Dialog open={tyreMaintenanceDialogOpen} onOpenChange={(open) => {
          setTyreMaintenanceDialogOpen(open);
          if (!open) setPendingFile(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Tyre Maintenance Check</DialogTitle>
              <DialogDescription>Record the date of the last tyre maintenance inspection</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Last Maintenance Check Date *</Label>
                <Input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
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
                      initialFile={pendingFile}
                    />
                    <p className="text-sm mt-2">Upload maintenance report (PDF, JPG, PNG)</p>
                  </div>
                )}
                {uploadedDoc && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm">Document uploaded</span>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedDoc("")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setTyreMaintenanceDialogOpen(false);
                  setPendingFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleDateSave(uploadedDoc || null, "last_tyre_maintenance_check_date");
                  setTyreMaintenanceDialogOpen(false);
                  setPendingFile(null);
                }}
                disabled={!tempDate || (!skipUpload && !uploadedDoc)}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tyre Expiry Dialog */}
        <Dialog open={tyreExpiryDialogOpen} onOpenChange={(open) => {
          setTyreExpiryDialogOpen(open);
          if (!open) setPendingFile(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Tyre Expiry Date</DialogTitle>
              <DialogDescription>Set the date when tyres need to be replaced</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Tyre Expiry Date *</Label>
                <Input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} />
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
                      initialFile={pendingFile}
                    />
                    <p className="text-sm mt-2">Upload tyre certificate or documentation</p>
                  </div>
                )}
                {uploadedDoc && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm">Document uploaded</span>
                    <Button variant="ghost" size="sm" onClick={() => setUploadedDoc("")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTyreExpiryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleDateSave(uploadedDoc || null, "tyre_expiry_date");
                  setTyreExpiryDialogOpen(false);
                }}
                disabled={!tempDate || (!skipUpload && !uploadedDoc)}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Detail Dialog */}
        <Dialog open={!!editingDocument} onOpenChange={(open) => {
          if (!open) {
            setEditingDocument(null);
            setPendingFile(null);
          }
        }}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white">
            <div className="p-10">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-4xl font-bold text-slate-900">
                  {editingDocument?.label}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12">
                {/* Left Side: Document Preview Card */}
                <div className="space-y-6">
                  <FileUploader
                    onUploadSuccess={(url) => setEditingDocData(prev => ({ ...prev, url }))}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    maxSize={10 * 1024 * 1024}
                    id="detail-upload"
                    className="w-full"
                    initialFile={pendingFile}
                    trigger={
                      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="relative h-64 mb-6 rounded-3xl overflow-hidden bg-[#F9FAFB] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                          {editingDocData.url ? (
                            <>
                              {editingDocData.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={editingDocData.url} className="w-full h-full object-cover" alt="Document preview" />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <FileText className="w-16 h-16 mb-2 text-slate-300" />
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">PDF Document</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                              <div className="w-16 h-16 bg-orange-100/50 rounded-2xl flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-[#F26633]" />
                              </div>
                              <p className="font-bold text-slate-900 text-sm mb-1">Drag & Drop File Here</p>
                              <p className="text-[10px] text-slate-400">PDF, Word, Excel, PowerPoint - max 10.0MB</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <Button type="button" className="flex-1 bg-[#F26633] hover:bg-orange-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" /> Upload
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 bg-[#FDECEC] hover:bg-red-50 text-[#F15C5C] border-none font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDocument(null);
                              setPendingFile(null);
                            }}
                          >
                            <Clock className="w-4 h-4" /> Later
                          </Button>
                        </div>
                      </div>
                    }
                  />
                </div>

                {/* Right Side: Form Fields */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Has Expiry Date</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {editingDocData.doc_has_expiry ? "Yes" : "No"}
                      </p>
                    </div>
                    <Switch
                      checked={editingDocData.doc_has_expiry}
                      onCheckedChange={(c) => setEditingDocData(prev => ({ ...prev, doc_has_expiry: c }))}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  {editingDocData.doc_has_expiry && (
                    <div className="space-y-3">
                      <Label className="text-base font-bold text-slate-900">Expiry Date</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          className="h-14 rounded-2xl border-slate-200 bg-white px-5 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          value={editingDocData.expiryDate}
                          onChange={(e) => setEditingDocData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="mt-16 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingDocument(null);
                    setPendingFile(null);
                  }}
                  className="h-14 px-10 rounded-2xl bg-[#E9E9E9] hover:bg-slate-200 border-none text-slate-600 font-bold text-lg transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!editingDocData.url) {
                      toast.error("Please upload a document before saving.");
                      return;
                    }

                    const toastId = toast.loading("Saving document changes...");
                    try {
                      const documentTypeId = editingDocument.document_type;
                      const apiDoc = documentsMap.get(editingDocument.docCode);

                      if (documentTypeId) {
                        // Save document via Bulk API (Modern way)
                        const payload = {
                          vehicle_id: vehicleId,
                          documents: [
                            {
                              document_type: documentTypeId,
                              title: editingDocument.label,
                              url: editingDocData.url,
                              expiry_date: editingDocData.doc_has_expiry ? (editingDocData.expiryDate || null) : null,
                              doc_has_expiry: editingDocData.doc_has_expiry,
                              ...(apiDoc && { document_id: apiDoc.id })
                            }
                          ]
                        };

                        const res = await fetch(`${API_URL}/api/documents/documents/vehicle-bulk/`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(payload),
                        });

                        if (!res.ok) throw new Error("Failed to save changes");
                      } else {
                        // Fallback to legacy PATCH for items without document_type (e.g. LOLLER, Tacho)
                        const payload: any = {
                          [editingDocument.docCode]: editingDocData.url
                        };
                        if (editingDocument.dateField) {
                          payload[editingDocument.dateField] = editingDocData.expiryDate || null;
                        }

                        const res = await fetch(`${API_URL}/api/vehicles/${id}/`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(payload),
                        });

                        if (!res.ok) throw new Error("Failed to save changes");
                      }

                      toast.success("Document updated successfully", { id: toastId });
                      setEditingDocument(null);
                      // Refresh data
                      fetchData();
                    } catch (err) {
                      toast.error("Failed to save changes", { id: toastId });
                    }
                  }}
                  className="h-14 px-14 rounded-2xl bg-[#FDECEC] hover:bg-[#FBDBDB] border-none text-[#F15C5C] font-bold text-lg shadow-sm transition-all"
                >
                  Save
                </Button>
              </div>
            </div>
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
          onUpdateSuccess={fetchData}
        />
        <MOTDialog
          open={motDialogOpen}
          onClose={() => {
            setMotDialogOpen(false);
            setPendingFile(null);
          }}
          currentMOTDate={vehicle.mot_expiry}
          vehicleId={vehicleId}
          vehicleRegistration={vehicle.registration_number}
          username={cookies.get("username") || "User"}
          onUpdateSuccess={fetchData}
          initialFile={pendingFile}
        />

        {previewDoc && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between p-4 border-b">
                <h3 className="font-bold">Document Preview</h3>
                <Button variant="ghost" onClick={() => setPreviewDoc(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4">
                {previewDoc.endsWith(".pdf") ? (
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