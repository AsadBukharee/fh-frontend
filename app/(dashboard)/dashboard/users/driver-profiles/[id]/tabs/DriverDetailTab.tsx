"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Pencil,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "@/components/Media/UploadImage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DriverDetailTabProps {
  driverData: any;
  editFormData: any;
  contracts: any[];
  sites: any[];
  selectedContractId: string;
  setSelectedContractId: (id: string) => void;
  selectedSiteIds: string[];
  setSelectedSiteIds: (ids: string[]) => void;
  formatDate: (date: string | null) => string;
  handleInputChange: (field: string, value: any) => void;
  handleAssignContract: (contractId?: string) => void;
  handleAssignSites: (siteIds?: string[]) => void;
  contractsLoading: boolean;
  sitesLoading: boolean;
  assigningContract: boolean;
  assigningSites: boolean;
  handleEditToggle: () => void;
  handleSaveProfile: (overrideData?: any) => Promise<void>;
  saving: boolean;
  expandedId?: string | string[];
  handleExpandedChange?: (id: string) => void;
}

interface Manager {
  id: number;
  full_name: string;
  email: string;
}

interface BrightHRAssignment {
  id: number;
  manager_id: number;
  manager_name: string;
  manager_email: string;
  is_active: boolean;
  assigning_date: string;
}

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  disabled = false,
}: {
  options: { value: string; label: string; status?: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  return (
    <Select
      disabled={disabled}
      onValueChange={(value) => {
        if (selected.includes(value)) {
          onChange(selected.filter((id) => id !== value));
        } else {
          onChange([...selected, value]);
        }
      }}
    >
      <SelectTrigger className="w-full min-w-[250px] border-gray-300 rounded-xl h-10">
        <SelectValue placeholder={selected.length > 0 ? `${selected.length} selected` : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="py-2.5">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                readOnly
                className="pointer-events-none h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="flex-1">{option.label}</span>
              {option.status && (
                <Badge
                  className={cn(
                    "text-xs",
                    option.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                  )}
                >
                  {option.status}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

/** A single labelled field cell */
function FieldCell({
  label,
  value,
  highlight,
  email,
  editing,
  fieldKey,
  onChange,
  type = "text",
  children,
  truncate = false,
}: {
  label: string;
  value: string | React.ReactNode;
  highlight?: "orange" | "pink" | "yellow" | "green" | "gray";
  email?: boolean;
  editing?: boolean;
  fieldKey?: string;
  onChange?: (v: string) => void;
  type?: string;
  children?: React.ReactNode;
  truncate?: boolean;
}) {
  const badgeClasses: Record<string, string> = {
    orange: "bg-orange-100 text-orange-700 border border-orange-200",
    pink: "bg-rose-100 text-rose-700 border border-rose-200",
    yellow: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    green: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  const renderValue = () => {
    if (editing && fieldKey && onChange) {
      return (
        <Input
          type={type}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-lg border-gray-300 text-sm"
          placeholder={label}
        />
      );
    }

    if (children) return children;

    if (highlight) {
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit",
            badgeClasses[highlight]
          )}
        >
          {value}
        </span>
      );
    }

    // If value is a React element/object, render it directly
    if (typeof value !== "string" && value !== null && value !== undefined) {
      return (
        <div className="text-sm font-medium truncate text-gray-800">
          {value}
        </div>
      );
    }

    const textValue = typeof value === "string" ? value : "";
    const displayValue = textValue || "—";
    const isTruncated = truncate && textValue.length > 10;
    const finalDisplayValue = isTruncated ? textValue.substring(0, 10) + "..." : displayValue;

    const content = (
      <span className={cn(
        "text-sm font-medium truncate",
        email ? "text-orange-500" : "text-gray-800"
      )}>
        {finalDisplayValue}
      </span>
    );

    if (isTruncated) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help w-fit max-w-full overflow-hidden">
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-none">
            <p className="text-xs">{textValue}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      {renderValue()}
    </div>
  );
}

/** Thin vertical divider between grid cells */
function VDivider() {
  return <div className="hidden sm:block w-px self-stretch bg-gray-100 mx-1" />;
}

/** Section card wrapper */
function SectionCard({
  title,
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
          >
            edit
            <Pencil className="h-3 w-3 text-gray-500" />
          </button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-7 px-3 text-xs border-gray-300"
              onClick={onCancel}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-lg h-7 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white"
              onClick={onSave}
              disabled={saving}
            >
              <Save className="h-3 w-3 mr-1" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function DriverDetailTab({
  driverData,
  editFormData,
  contracts,
  sites,
  selectedContractId,
  setSelectedContractId,
  selectedSiteIds,
  setSelectedSiteIds,
  formatDate,
  handleInputChange,
  handleAssignContract,
  handleAssignSites,
  contractsLoading,
  sitesLoading,
  assigningContract,
  assigningSites,
  handleEditToggle,
  handleSaveProfile,
  saving,
  expandedId,
  handleExpandedChange,
}: DriverDetailTabProps) {
  const [isEditingDriverDetails, setIsEditingDriverDetails] = useState(false);

  const [brightHRData, setBrightHRData] = useState<BrightHRAssignment[]>([]);
  const activeBrightHR = brightHRData ? brightHRData.find((a) => a.is_active) : undefined;

  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [driverDialogForm, setDriverDialogForm] = useState<Record<string, string>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [employmentDialogOpen, setEmploymentDialogOpen] = useState(false);
  const [employmentDialogForm, setEmploymentDialogForm] = useState<Record<string, any>>({});
  const [nextOfKinDialogOpen, setNextOfKinDialogOpen] = useState(false);
  const [nextOfKinDialogForm, setNextOfKinDialogForm] = useState<Record<string, any>>({});

  const openDriverDialog = () => {
    setDriverDialogForm({
      first_name: getFirstName(),
      last_name: getLastName(),
      date_of_birth: driverData?.date_of_birth || "",
      address: driverData?.address || "",
      phone: driverData?.phone || "",
      national_insurance_no: driverData?.national_insurance_no || "",
      post_code: driverData?.post_code || "",
      email: driverData?.user?.email || "",
      avatar: driverData?.user?.avatar || "",
      license_number: driverData?.license_number || "",
      license_issue_number: driverData?.license_issue_number || "",
    });
    setDriverDialogOpen(true);
  };

  const handleDriverDialogSave = async () => {
    // 1. Sync parent state (for future use/UI)
    Object.entries(driverDialogForm).forEach(([k, v]) => handleInputChange(k, v));
    // 2. Perform save with the exact latest values from the dialog
    await handleSaveProfile(driverDialogForm);
    setDriverDialogOpen(false);
  };

  const handleEmploymentDialogSave = async () => {
    const changes: Record<string, any> = {};

    // 0. Validation: If Other Job is Yes, check for note
    if (employmentDialogForm.have_other_jobs && !employmentDialogForm.have_other_jobs_note?.trim()) {
      toast.error("Please provide details in Other Job Details field");
      return;
    }

    const fields = [
      "paid_holidays", "contract_signing_date", "rota_start_date",
      "account_no", "sort_code", "have_other_jobs",
      "have_other_jobs_note", "remarks"
    ];

    fields.forEach(field => {
      const currentVal = (driverData as any)?.[field] ?? (driverData?.user as any)?.[field];
      if (employmentDialogForm[field] !== currentVal) {
        changes[field] = employmentDialogForm[field];
        handleInputChange(field, employmentDialogForm[field]);
      }
    });

    // 2. Contract
    if (employmentDialogForm.contract_id && employmentDialogForm.contract_id !== driverData?.user?.contract?.id?.toString()) {
      setSelectedContractId(employmentDialogForm.contract_id);
      handleAssignContract(employmentDialogForm.contract_id);
    }

    // 3. Sites
    const currentSiteIds = (driverData?.user?.site?.map((s: any) => s.id.toString()) || []).sort();
    const newSiteIds = [...(employmentDialogForm.site_ids || [])].sort();
    if (JSON.stringify(currentSiteIds) !== JSON.stringify(newSiteIds)) {
      setSelectedSiteIds(employmentDialogForm.site_ids);
      handleAssignSites(employmentDialogForm.site_ids);
    }

    // 4. BrightHR Manager
    if (employmentDialogForm.manager_id && employmentDialogForm.manager_id !== activeBrightHR?.manager_id?.toString()) {
      try {
        const res = await fetch(`${API_URL}/brighthr/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            manager: parseInt(employmentDialogForm.manager_id),
            bright_user: driverData.user.id,
            assigning_date: employmentDialogForm.assigning_date,
          }),
        });
        if (res.ok) {
          toast.success("Manager assigned successfully");
        }
      } catch (err) {
        console.error("Manager assignment error:", err);
      }
    }

    // 5. Save all basic changes
    await handleSaveProfile(changes);
    setEmploymentDialogOpen(false);
  };

  const openNextOfKinDialog = () => {
    setNextOfKinDialogForm({
      next_of_kin_first_name: driverData?.next_of_kin_name?.split(" ")[0] || "",
      next_of_kin_last_name: driverData?.next_of_kin_name?.split(" ").slice(1).join(" ") || "",
      next_of_kin_contact: driverData?.next_of_kin_contact || "",
      next_of_kin_email: driverData?.next_of_kin_email || "",
      next_of_kin_address: driverData?.next_of_kin_address || "",
      next_of_kin_relationship: driverData?.next_of_kin_relationship || "",
      next_of_kin_note: driverData?.next_of_kin_note || "",
    });
    setNextOfKinDialogOpen(true);
  };

  const handleNextOfKinDialogSave = async () => {
    Object.entries(nextOfKinDialogForm).forEach(([k, v]) => handleInputChange(k, v));
    await handleSaveProfile(nextOfKinDialogForm);
    setNextOfKinDialogOpen(false);
  };

  const openEmploymentDialog = () => {
    setEmploymentDialogForm({
      paid_holidays: driverData?.user?.paid_holidays ?? 0,
      contract_signing_date: driverData?.user?.contract_signing_date ? driverData.user.contract_signing_date.split("T")[0] : "",
      rota_start_date: driverData?.user?.rota_start_date || "",
      account_no: driverData?.account_no || "",
      sort_code: driverData?.sort_code || "",
      have_other_jobs: driverData?.have_other_jobs || false,
      have_other_jobs_note: driverData?.have_other_jobs_note || "",
      remarks: driverData?.remarks || "",
      contract_id: driverData?.user?.contract?.id?.toString() || "",
      site_ids: driverData?.user?.site?.map((s: any) => s.id.toString()) || [],
      manager_id: activeBrightHR?.manager_id?.toString() || "",
      assigning_date: activeBrightHR?.assigning_date || new Date().toISOString().split("T")[0],
    });
    setEmploymentDialogOpen(true);
  };

  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assigningManager, setAssigningManager] = useState(false);
  const [assigningDate, setAssigningDate] = useState(new Date().toISOString().split("T")[0]);
  const [brightHRLoading, setBrightHRLoading] = useState(true);
  const [otherJobsNote, setOtherJobsNote] = useState(driverData?.have_other_jobs_note || "");
  const [remarks, setRemarks] = useState(driverData?.remarks || "");

  const cookies = useCookies();

  const getFirstName = () => driverData?.user?.full_name?.split(" ")[0] ?? "—";
  const getLastName = () => {
    const parts = driverData?.user?.full_name?.split(" ") ?? [];
    return parts.length > 1 ? parts.slice(1).join(" ") : "—";
  };

  const calculateAgeLabel = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    const months = ((today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth() + 12) % 12;
    return `${years}y ${months}days`;
  };

  const renderAssignedSites = () => {
    const siteData = driverData?.user?.site;
    if (Array.isArray(siteData)) {
      if (siteData.length === 0) return "None";
      return siteData.map((s: any) => s?.name || "Unnamed").join(", ");
    }
    if (typeof siteData === "string") return siteData;
    return "None";
  };

  const isActive = driverData?.user?.is_active;
  const contractType = driverData?.user?.contract?.name || null;

  useEffect(() => {
    const fetchManagers = async () => {
      setManagersLoading(true);
      try {
        const res = await fetch(`${API_URL}/users/list-names/?role=manager`, {
          headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.success) setManagers(data.data || []);
      } catch {
        toast.error("Failed to load managers");
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, [cookies]);

  useEffect(() => {
    const fetchBrightHR = async () => {
      if (!driverData?.user?.id) return;
      setBrightHRLoading(true);
      try {
        const res = await fetch(`${API_URL}/brighthr/?bright_user_id=${driverData.user.id}`, {
          headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.success) setBrightHRData(data.data?.results || []);
      } catch {
        /* silent */
      } finally {
        setBrightHRLoading(false);
      }
    };
    fetchBrightHR();
  }, [driverData?.user?.id, cookies]);

  const handleAssignBrightHRManager = async () => {
    if (!selectedManagerId) return;
    setAssigningManager(true);
    try {
      const res = await fetch(`${API_URL}/brighthr/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          manager: parseInt(selectedManagerId),
          bright_user: driverData.user.id,
          assigning_date: assigningDate,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Manager assigned successfully");
      setSelectedManagerId("");
      const refetch = await fetch(`${API_URL}/brighthr/?bright_user_id=${driverData.user.id}`, {
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      const newData = await refetch.json();
      if (newData.success) setBrightHRData(newData.data?.results || []);
    } catch {
      toast.error("Failed to assign manager");
    } finally {
      setAssigningManager(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full p-4 pb-24 space-y-5 bg-transparent">

        {/* DRIVER DETAILS */}
        <div id="section-driver-details">
          <SectionCard
            title="Driver Details"
            isEditing={false}
            saving={false}
            onEdit={() => {
              handleExpandedChange?.("section-driver-details");
              openDriverDialog();
            }}
            onCancel={() => { }}
            onSave={async () => { }}
          >
            <div className="flex gap-5">
              <div className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                    <img
                      src={driverData?.user?.avatar || "/default-avatar.png"}
                      alt="Driver"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap",
                    isActive ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                  )}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {driverData?.updated_at && (
                  <div className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-3 text-center leading-tight">
                    <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                    <span>
                      Last active {(() => {
                        const diff = Math.floor((Date.now() - new Date(driverData.updated_at).getTime()) / 60000);
                        if (diff < 1) return "just now";
                        if (diff < 60) return `${diff}m ago`;
                        const hrs = Math.floor(diff / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        const days = Math.floor(hrs / 24);
                        return `${days}d ago`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                  <div className="flex-1"><FieldCell label="First Name" value={getFirstName()} /></div>
                  <VDivider />
                  <div className="flex-1">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">DOB</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">
                          {driverData?.date_of_birth ? formatToDDMMYYYY(driverData.date_of_birth) : "—"}
                        </span>
                        {driverData?.date_of_birth && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-100 text-rose-600 border border-rose-200 whitespace-nowrap">
                            {calculateAgeLabel(driverData.date_of_birth)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="Address" value={driverData?.address || "—"} truncate /></div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="Phone Number" value={driverData?.phone || "—"} /></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                  <div className="flex-1"><FieldCell label="Last Name" value={getLastName()} truncate /></div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="NI Number" value={driverData?.national_insurance_no || "—"} highlight="pink" /></div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="Post Code" value={driverData?.post_code || "—"} highlight="pink" /></div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="Email Address" value={driverData?.user?.email || "—"} email truncate /></div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="License Number" value={driverData?.license_number || "—"} highlight="gray" /></div>
                  <VDivider />
                  <div className="flex-1"><FieldCell label="License Issue" value={driverData?.license_issue_number || "—"} highlight="gray" /></div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* EMPLOYMENT DETAILS */}
        <div id="section-employment-details">
          <SectionCard
            title="Employment Details"
            isEditing={false}
            saving={saving}
            onEdit={() => {
              handleExpandedChange?.("section-employment-details");
              openEmploymentDialog();
            }}
            onCancel={() => { }}
            onSave={() => { }}
          >
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-4 gap-8">
                <div className="flex flex-col gap-1.5 p-3 bg-orange-50/30 rounded-2xl border border-orange-100 min-w-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Paid Holidays</span>
                  <div className="flex items-baseline gap-1 pl-1">
                    <span className="text-3xl font-black text-orange-500 leading-none">{driverData?.user?.paid_holidays ?? 0}</span>
                    <span className="text-[10px] font-bold text-orange-400 uppercase">Days</span>
                  </div>
                </div>
                <FieldCell label="Contract Assigned" value={contractType ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">{contractType}</span> : "—"} />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Bright HR Manager</span>
                  {activeBrightHR ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-yellow-50 text-yellow-800 border border-yellow-100 ml-1">{activeBrightHR.manager_name}</span> : driverData?.manager_name ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-gray-50 text-gray-800 border border-gray-100 ml-1">{driverData.manager_name}</span> : <span className="text-sm text-gray-400 ml-1">—</span>}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Site(s) Assigned</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-orange-50 text-orange-700 border border-orange-200 ml-1 max-w-full truncate">{renderAssignedSites()}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-8">
                <FieldCell label="Assign Date" value={activeBrightHR?.assigning_date ? formatDate(activeBrightHR.assigning_date) : "—"} />
                <FieldCell label="Contract Sign Date" value={driverData?.user?.contract_signing_date ? formatDate(driverData.user.contract_signing_date) : "—"} />
                <FieldCell label="Account No" value={driverData?.account_no || "—"} />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Sort Code</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-rose-50 text-rose-600 border border-rose-100 ml-1">{driverData?.sort_code || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-8">
                <FieldCell label="Rota Start Date" value={driverData?.user?.rota_start_date ? formatDate(driverData.user.rota_start_date) : "—"} />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Other Jobs?</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit bg-gray-100 text-gray-700 border border-gray-200 ml-1">{driverData?.have_other_jobs ? "Yes" : "No"}</span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Other Job Details</span>
                  <span className="text-[11px] font-semibold text-gray-700 truncate ml-1">{driverData?.have_other_jobs_note || "—"}</span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Remarks</span>
                  <span className="text-[11px] font-semibold text-gray-700 truncate ml-1">{driverData?.remarks || "—"}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* NEXT OF KIN */}
        <div id="section-next-of-kin">
          <SectionCard
            title="Next of Kin"
            isEditing={false}
            saving={saving}
            onEdit={() => {
              handleExpandedChange?.("section-next-of-kin");
              openNextOfKinDialog();
            }}
            onCancel={() => { }}
            onSave={() => { }}
          >
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mb-5">
              <div className="flex-1"><FieldCell label="First Name" value={driverData?.next_of_kin_name?.split(" ")[0] || "—"} /></div>
              <VDivider />
              <div className="flex-1"><FieldCell label="Phone Number" value={driverData?.next_of_kin_contact || "—"} /></div>
              <VDivider />
              <div className="flex-1">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Relationship</span>
                  {driverData?.next_of_kin_relationship ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit bg-emerald-100 text-emerald-700 border border-emerald-200">{driverData.next_of_kin_relationship}</span> : <span className="text-sm text-gray-400">—</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
              <div className="flex-1"><FieldCell label="Second Name" value={driverData?.next_of_kin_name?.split(" ").slice(1).join(" ") || "—"} truncate /></div>
              <VDivider />
              <div className="flex-1"><FieldCell label="Email Address" value={driverData?.next_of_kin_email || "—"} email truncate /></div>
              <VDivider />
              <div className="flex-1"><FieldCell label="Address" value={driverData?.next_of_kin_address || "—"} truncate /></div>
            </div>
            {driverData?.next_of_kin_note && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Additional Notes</span>
                <p className="mt-1 text-sm text-gray-600">{driverData.next_of_kin_note}</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* DIALOGS */}
        <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
          <DialogContent className="max-w-3xl w-full rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100">
              <DialogTitle className="text-base font-bold text-gray-900">Edit Driver Detail</DialogTitle>
            </DialogHeader>
            <div className="px-8 py-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <label className="cursor-pointer group relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 shadow">
                      <img src={driverDialogForm.avatar || driverData?.user?.avatar || "/default-avatar.png"} alt="Driver" className="w-full h-full object-cover" />
                    </div>
                    <div className={cn("absolute inset-0 rounded-full bg-black/30 transition-opacity flex items-center justify-center", uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      {uploadingAvatar ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    </div>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const previewUrl = URL.createObjectURL(file);
                      setDriverDialogForm((f) => ({ ...f, avatar: previewUrl }));
                      setUploadingAvatar(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetch(`${API_URL}/media/upload_image/`, { method: "POST", headers: { Authorization: `Bearer ${cookies.get("access_token")}` }, body: formData });
                        if (!res.ok) throw new Error("Upload failed");
                        const result = await res.json();
                        if (result.success && result.data?.url) {
                          const finalUrl = result.data.url;
                          setDriverDialogForm((f) => ({ ...f, avatar: finalUrl }));
                          handleInputChange("avatar", finalUrl);
                          toast.success("Avatar uploaded successfully");
                        } else throw new Error(result.message || "Upload failed");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to upload avatar");
                        setDriverDialogForm((f) => ({ ...f, avatar: driverData?.user?.avatar || "" }));
                      } finally { setUploadingAvatar(false); }
                    }} />
                  </label>
                  <span className="text-[10px] text-gray-400">Click to change</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-5">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">First Name</label><Input value={driverDialogForm.first_name || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, first_name: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="First name" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">DOB</label><Input type="date" value={driverDialogForm.date_of_birth || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, date_of_birth: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Address</label><Input value={driverDialogForm.address || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, address: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Address" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone Number</label><Input value={driverDialogForm.phone || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, phone: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Phone" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Last Name</label><Input value={driverDialogForm.last_name || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, last_name: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Last name" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">NI Number</label><Input value={driverDialogForm.national_insurance_no || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, national_insurance_no: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="NI Number" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Post Code</label><Input value={driverDialogForm.post_code || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, post_code: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Post code" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email Address</label><Input type="email" value={driverDialogForm.email || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, email: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Email" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">License Number</label><Input value={driverDialogForm.license_number || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, license_number: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="License number" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">License Issue No</label><Input value={driverDialogForm.license_issue_number || ""} onChange={(e) => setDriverDialogForm((f) => ({ ...f, license_issue_number: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Issue number" /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-4 border-t border-gray-100 bg-gray-50/50">
              <Button variant="outline" className="rounded-lg h-9 px-6 text-sm border-gray-200 text-gray-600 hover:bg-gray-100" onClick={() => setDriverDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-lg h-9 px-6 text-sm bg-rose-400 hover:bg-rose-500 text-white border-0" onClick={handleDriverDialogSave} disabled={saving}>{saving ? "Saving…" : "Update Changes"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={employmentDialogOpen} onOpenChange={setEmploymentDialogOpen}>
          <DialogContent className="max-w-[1100px] w-full p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
            <DialogHeader className="px-8 py-6 bg-white border-b border-gray-100/50"><DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">Edit Employment Details</DialogTitle></DialogHeader>
            <div className="p-8 bg-white">
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-4 gap-8">
                  <div className="flex flex-col gap-1.5 p-3 bg-orange-50/30 rounded-2xl border border-orange-100">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Paid Holidays</label>
                    <div className="flex items-center justify-between px-2">
                      <span className="text-3xl font-black text-orange-500 leading-none">{employmentDialogForm.paid_holidays || 0}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setEmploymentDialogForm(f => ({ ...f, paid_holidays: Math.max(0, (f.paid_holidays || 0) - 1) }))} className="p-1 hover:bg-orange-100 rounded-md text-orange-600 transition-colors"><ChevronDown className="h-5 w-5" /></button>
                        <button onClick={() => setEmploymentDialogForm(f => ({ ...f, paid_holidays: (f.paid_holidays || 0) + 1 }))} className="p-1 hover:bg-orange-100 rounded-md text-orange-600 transition-colors"><ChevronUp className="h-5 w-5" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Contract Assigned</label><Select value={employmentDialogForm.contract_id} onValueChange={(v) => setEmploymentDialogForm(f => ({ ...f, contract_id: v }))}><SelectTrigger className="h-10 rounded-xl bg-gray-50/50 border-gray-200 text-gray-800 font-semibold text-xs"><SelectValue placeholder="Select Contract" /></SelectTrigger><SelectContent>{contracts.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Bright HR Manager</label><Select value={employmentDialogForm.manager_id} onValueChange={(v) => setEmploymentDialogForm(f => ({ ...f, manager_id: v }))} disabled={!!activeBrightHR}><SelectTrigger className={cn("h-10 rounded-xl border-gray-200 font-semibold text-xs", !!activeBrightHR ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50/50 text-gray-800")}><SelectValue placeholder="Select Manager" /></SelectTrigger><SelectContent>{managers.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Site(s) Assigned</label><MultiSelect options={sites.map(s => ({ value: s.id.toString(), label: s.name }))} selected={employmentDialogForm.site_ids || []} onChange={(v) => setEmploymentDialogForm(f => ({ ...f, site_ids: v }))} placeholder="Select Sites" /></div>
                </div>
                <div className="grid grid-cols-4 gap-8">
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assign Date</label><Input type="date" value={employmentDialogForm.assigning_date} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, assigning_date: e.target.value }))} disabled={!!activeBrightHR} className={cn("h-10 rounded-xl border-gray-200 font-semibold text-xs", !!activeBrightHR ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50/50")} /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Contract Sign Date</label><Input type="date" value={employmentDialogForm.contract_signing_date} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, contract_signing_date: e.target.value }))} className="h-10 rounded-xl bg-gray-50/50 border-gray-200 text-gray-800 font-semibold text-xs" /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Account No</label><Input value={employmentDialogForm.account_no} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, account_no: e.target.value }))} className="h-10 rounded-xl bg-gray-50/50 border border-gray-200 text-gray-700 font-semibold text-xs" placeholder="Account No" /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Sort Code</label><Input value={employmentDialogForm.sort_code} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, sort_code: e.target.value }))} className="h-10 rounded-xl bg-gray-50/50 border border-gray-200 text-gray-700 font-semibold text-xs" placeholder="Sort Code" /></div>
                </div>
                <div className="grid grid-cols-4 gap-8">
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Rota Start Date</label><Input type="date" value={employmentDialogForm.rota_start_date} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, rota_start_date: e.target.value }))} className="h-10 rounded-xl bg-gray-50/50 border border-gray-200 text-gray-700 font-semibold text-xs" /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Other Jobs?</label><div className="flex items-center justify-between h-10 px-4 bg-gray-50/50 border border-gray-200 rounded-xl"><span className="text-xs font-semibold text-gray-700">{employmentDialogForm.have_other_jobs ? "Yes" : "No"}</span><Switch checked={employmentDialogForm.have_other_jobs} onCheckedChange={(v) => setEmploymentDialogForm(f => ({ ...f, have_other_jobs: v }))} className="scale-75" /></div></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Other Job Details</label><Input value={employmentDialogForm.have_other_jobs_note} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, have_other_jobs_note: e.target.value }))} disabled={!employmentDialogForm.have_other_jobs} className={cn("h-10 rounded-xl border-gray-200 font-semibold text-xs", !employmentDialogForm.have_other_jobs ? "bg-gray-100 text-gray-400 cursor-not-allowed border-dashed" : "bg-gray-50/50 text-gray-700")} placeholder={employmentDialogForm.have_other_jobs ? "Details…" : "N/A"} /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Remarks</label><Input value={employmentDialogForm.remarks} onChange={(e) => setEmploymentDialogForm(f => ({ ...f, remarks: e.target.value }))} className="h-10 rounded-xl bg-gray-50/50 border border-gray-200 text-gray-700 font-semibold text-xs" placeholder="Remarks" /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-4 bg-gray-50/50 border-t border-gray-100">
              <Button variant="outline" className="rounded-lg h-9 px-6 text-xs font-bold border-none bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all shadow-sm" onClick={() => setEmploymentDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-lg h-9 px-6 text-xs font-bold bg-[#FFE4D9] hover:bg-[#FFD5C2] text-[#FF6B3D] border-none transition-all shadow-sm" onClick={handleEmploymentDialogSave}>Update Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={nextOfKinDialogOpen} onOpenChange={setNextOfKinDialogOpen}>
          <DialogContent className="max-w-3xl w-full rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100"><DialogTitle className="text-base font-bold text-gray-900">Edit Next of Kin</DialogTitle></DialogHeader>
            <div className="px-8 py-6">
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">First Name</label><Input value={nextOfKinDialogForm.next_of_kin_first_name} onChange={(e) => setNextOfKinDialogForm(f => ({ ...f, next_of_kin_first_name: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="First name" /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Last Name</label><Input value={nextOfKinDialogForm.next_of_kin_last_name} onChange={(e) => setNextOfKinDialogForm(f => ({ ...f, next_of_kin_last_name: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Last name" /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone Number</label><Input value={nextOfKinDialogForm.next_of_kin_contact} onChange={(e) => setNextOfKinDialogForm(f => ({ ...f, next_of_kin_contact: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Phone" /></div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Relationship</label><Input value={nextOfKinDialogForm.next_of_kin_relationship} onChange={(e) => setNextOfKinDialogForm(f => ({ ...f, next_of_kin_relationship: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="e.g. Spouse" /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email Address</label><Input type="email" value={nextOfKinDialogForm.next_of_kin_email} onChange={(e) => setNextOfKinDialogForm(f => ({ ...f, next_of_kin_email: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Email" /></div>
                  <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Address</label><Input value={nextOfKinDialogForm.next_of_kin_address} onChange={(e) => setNextOfKinDialogForm(f => ({ ...f, next_of_kin_address: e.target.value }))} className="h-9 rounded-lg border-gray-200 text-sm" placeholder="Address" /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-4 border-t border-gray-100 bg-gray-50/50">
              <Button variant="outline" className="rounded-lg h-9 px-6 text-sm border-gray-200 text-gray-600 hover:bg-gray-100" onClick={() => setNextOfKinDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-lg h-9 px-6 text-sm bg-rose-400 hover:bg-rose-500 text-white border-0" onClick={handleNextOfKinDialogSave} disabled={saving}>{saving ? "Saving…" : "Update Changes"}</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}
