"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  AlertCircle, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Shield, 
  Banknote, 
  Building, 
  CreditCard,
  FileText,
  Users,
  Eye,
  EyeOff,
  Download,
  Upload,
  Clock
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "@/components/Media/UploadImage";
import { useToast } from "@/app/Context/ToastContext";
import { cn } from "@/lib/utils";
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';


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
  handleAssignContract: () => void;
  handleAssignSites: () => void;
  contractsLoading: boolean;
  sitesLoading: boolean;
  assigningContract: boolean;
  assigningSites: boolean;
  handleEditToggle: () => void;
  handleSaveProfile: () => Promise<void>;
  saving: boolean;
}

interface Manager {
  id: number;
  full_name: string;
  email: string;
}

interface BrightHRAssignment {
  id: number;
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
                <Badge className={cn(
                  "text-xs",
                  option.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                )}>
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
  handleSaveProfile,
  saving,
}: DriverDetailTabProps) {
  const [isEditingDriverDetails, setIsEditingDriverDetails] = useState(false);
  const [isEditingEmployment, setIsEditingEmployment] = useState(false);
  const [isEditingNextOfKin, setIsEditingNextOfKin] = useState(false);
  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assigningManager, setAssigningManager] = useState(false);
  const [assigningDate, setAssigningDate] = useState(new Date().toISOString().split("T")[0]);
  const [brightHRData, setBrightHRData] = useState<BrightHRAssignment[]>([]);
  const [brightHRLoading, setBrightHRLoading] = useState(true);
  const [otherJobsNote, setOtherJobsNote] = useState(driverData?.have_other_jobs_note || "");
  const [remarks, setRemarks] = useState(driverData?.remarks || "");

  const cookies = useCookies();
  const { showToast } = useToast();

  // ─── Helper Functions ──────────────────────────────────────────────────────
  const getFieldValue = (key: string, displayValue: string, isEditing: boolean) => {
    if (isEditing) {
      return editFormData[key] !== undefined ? editFormData[key] : displayValue;
    }
    return displayValue;
  };

  const getFirstName = () => driverData?.user?.full_name?.split(" ")[0] ?? "—";
  const getLastName = () => {
    const parts = driverData?.user?.full_name?.split(" ") ?? [];
    return parts.length > 1 ? parts.slice(1).join(" ") : "—";
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    const today = new Date("2026-01-09");
    let years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
    }
    return `${formatDate(dob)} (${years}y)`;
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

  const getStatusBadge = () => {
    if (driverData?.profile_status === "approved") {
      return driverData?.user?.is_active 
        ? { label: "Active", color: "bg-emerald-500", icon: CheckCircle }
        : { label: "Approved (Inactive)", color: "bg-amber-500", icon: AlertCircle };
    }
    return { label: "Pending", color: "bg-gray-500", icon: AlertCircle };
  };

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchManagers = async () => {
      setManagersLoading(true);
      try {
        const response = await fetch(`${API_URL}/users/list-names/?role=manager`, {
          headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
        });
        if (!response.ok) throw new Error("Failed to fetch managers");
        const data = await response.json();
        if (data.success) setManagers(data.data || []);
      } catch (error) {
        console.error(error);
        showToast("Failed to load managers", "error");
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, [cookies, showToast]);

  useEffect(() => {
    const fetchBrightHR = async () => {
      if (!driverData?.user?.id) return;
      setBrightHRLoading(true);
      try {
        const response = await fetch(`${API_URL}/brighthr/?bright_user_id=${driverData.user.id}`, {
          headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (data.success) setBrightHRData(data.data?.results || []);
      } catch (error) {
        console.error("BrightHR fetch error:", error);
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
      const response = await fetch(`${API_URL}/brighthr/`, {
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
      if (!response.ok) throw new Error("Failed to assign manager");
      showToast("Manager assigned successfully", "success");
      setSelectedManagerId("");

      // Refresh
      const refetch = await fetch(`${API_URL}/brighthr/?bright_user_id=${driverData.user.id}`, {
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      const newData = await refetch.json();
      if (newData.success) setBrightHRData(newData.data?.results || []);
    } catch (error) {
      showToast("Failed to assign manager", "error");
      console.error(error);
    } finally {
      setAssigningManager(false);
    }
  };

  const handleImageUploadSuccess = (url: string) => {
    handleInputChange("avatar", url);
  };

  const handleSaveAllChanges = async () => {
    // Update additional fields
    if (otherJobsNote !== driverData?.have_other_jobs_note) {
      handleInputChange("have_other_jobs_note", otherJobsNote);
    }
    if (remarks !== driverData?.remarks) {
      handleInputChange("remarks", remarks);
    }
    
    await handleSaveProfile();
  };

  const handleToggleActiveStatus = async () => {
    if (!driverData?.user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/users/${driverData.user.id}/toggle-active/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          is_active: !driverData.user.is_active
        }),
      });
      
      if (!response.ok) throw new Error("Failed to update status");
      
      const data = await response.json();
      if (data.success) {
        showToast(`Driver ${!driverData.user.is_active ? "activated" : "deactivated"} successfully`, "success");
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      showToast("Failed to update driver status", "error");
    }
  };

  // ─── Render Components ─────────────────────────────────────────────────────
  const renderWarnings = () => {
    if (!driverData?.warnings?.length) return null;
    
    return (
      <div className="mb-6 space-y-3">
        {driverData.warnings.map((warning: string, index: number) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-sm font-medium",
              warning.includes("⏳") 
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            )}
          >
            {warning.includes("⏳") ? (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{warning.replace("⏳ ", "").replace("✅ ", "")}</span>
          </div>
        ))}
      </div>
    );
  };

  

  const renderDriverDetails = () => (
    <div className="space-y-8">
      {/* Contact Info Group */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Phone", icon: Phone, value: driverData?.phone || "—", key: "phone" },
            { label: "Email", icon: Mail, value: driverData?.user?.email || "—", key: "email" },
            { label: "Address", icon: MapPin, value: driverData?.address || "—", key: "address" },
            { label: "Post Code", icon: MapPin, value: driverData?.post_code || "—", key: "post_code" },
          ].map((field, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase">{field.label}</Label>
              {isEditingDriverDetails ? (
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={getFieldValue(field.key, field.value, true)}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="pl-10 rounded-xl border-gray-300"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 min-h-[40px] p-2 rounded-lg hover:bg-gray-50">
                  <field.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <p className="font-medium truncate" title={field.value}>{field.value}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Identification Group */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Identification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: "National Insurance", 
              value: driverData?.national_insurance_no || "—", 
              key: "national_insurance_no",
              critical: true 
            },
            { 
              label: "Date of Birth", 
              value: calculateAge(driverData?.date_of_birth), 
              key: "date_of_birth",
              type: "date" 
            },
            { 
              label: "Full Name", 
              value: driverData?.user?.full_name || "—", 
              key: "full_name" 
            },
   
          ].map((field, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase">{field.label}</Label>
              {isEditingDriverDetails ? (
                <Input
                  type={field.type || "text"}
                  value={getFieldValue(field.key, field.value, true)}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={cn(
                    "rounded-xl border-gray-300",
                    field.critical && "border-amber-300 bg-amber-50"
                  )}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : (
                <p className={cn(
                  "font-medium p-2 rounded-lg truncate",
                  field.critical && "bg-amber-50 text-amber-800"
                )} title={field.value}>
                  {(field.key === "date_of_birth" ? formatToDDMMYYYY(driverData?.date_of_birth) : field.value) || "—"}
                  </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLicenseInfo = () => (
    <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
      <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-gray-700" />
          <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
            Driver License Information
          </CardTitle>
        </div>
        {!isEditingLicense ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
            onClick={() => setIsEditingLicense(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit License
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-5 border-gray-300 hover:bg-gray-50"
              onClick={() => setIsEditingLicense(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5"
              onClick={handleSaveAllChanges}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-8 pt-9">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 flex justify-between">
            <div className="space-y-3">
              <Label className="text-sm font-medium">License Number *</Label>
              {isEditingLicense ? (
                <Input
                  value={getFieldValue("license_number", driverData?.license_number || "", true)}
                  onChange={(e) => handleInputChange("license_number", e.target.value)}
                  className="rounded-xl border-gray-300 font-mono"
                  placeholder="Enter license number"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl font-mono text-sm">
                  {driverData?.license_number || "Not provided"}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Issue Number</Label>
              {isEditingLicense ? (
                <Input
                  value={getFieldValue("license_issue_number", driverData?.license_issue_number || "", true)}
                  onChange={(e) => handleInputChange("license_issue_number", e.target.value)}
                  className="rounded-xl border-gray-300"
                  placeholder="Enter issue number"
                />
              ) : (
                <div className="flex items-center justify-between p-2">
                  <p className="font-medium">{driverData?.license_issue_number || "—"}</p>
                  {driverData?.license_issue_number && (
                    <Badge variant="outline" className="text-xs">Issued</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
      
        </div>
      </CardContent>
    </Card>
  );

  const renderEmploymentDetails = () => (
    <div className="space-y-8">
      {/* Financial Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Banking Information
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAccountDetails(!showAccountDetails)}
            className="text-xs h-8"
          >
            {showAccountDetails ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showAccountDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { 
              label: "Account Number", 
              value: driverData?.account_no || "—", 
              key: "account_no", 
              secure: true,
              icon: CreditCard 
            },
            { 
              label: "Sort Code", 
              value: driverData?.sort_code || "—", 
              key: "sort_code",
              icon: Banknote 
            },
          ].map((field, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase flex items-center gap-2">
                <field.icon className="h-3 w-3" />
                {field.label}
              </Label>
              {isEditingEmployment ? (
                <Input
                  value={getFieldValue(field.key, field.value, true)}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={cn(
                    "rounded-xl border-gray-300 font-mono",
                    field.secure && "tracking-widest"
                  )}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : field.secure && !showAccountDetails ? (
                <div className="p-3 bg-gray-50 rounded-xl font-mono tracking-widest text-sm">
                  {field.value.replace(/.(?=.{4})/g, '•')}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-mono font-medium">{field.value}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dates Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Important Dates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contract Signed Date */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 uppercase">Contract Signed</Label>
            {isEditingEmployment ? (
              <Input
                type="date"
                value={getFieldValue("contract_signing_date", driverData?.user?.contract_signing_date ? driverData.user.contract_signing_date : "", true)}
                onChange={(e) => handleInputChange("contract_signing_date", e.target.value)}
                className={cn(
                  "rounded-xl border-gray-300 border-orange-300 bg-orange-50"
                )}
              />
            ) : (
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg bg-orange-50"
              )}>
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="font-medium truncate" title={driverData?.user?.contract_signing_date ? formatDate(driverData.user.contract_signing_date) : "—"}>
                  {driverData?.user?.contract_signing_date ? formatDate(driverData.user.contract_signing_date) : "—"}
                </p>
              </div>
            )}
          </div>

          {/* Rota Start Date (now editable) */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 uppercase">Rota Start</Label>
            <div className="flex items-center gap-2 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <p className="font-medium truncate" title={driverData?.user?.rota_start_date ? formatDate(driverData.user.rota_start_date) : "Not started"}>
                {driverData?.user?.rota_start_date ? formatDate(driverData.user.rota_start_date) : "Not started"}
              </p>
            </div>
          </div>

          {/* Paid Holidays */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 uppercase">Paid Holidays</Label>
            {isEditingEmployment ? (
              <Input
                type="number"
                value={getFieldValue("paid_holidays", driverData?.user?.paid_holidays || 0, true)}
                onChange={(e) => handleInputChange("paid_holidays", e.target.value)}
                className="rounded-xl border-gray-300"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="font-medium truncate" title={`${driverData?.user?.paid_holidays || 0} days`}>
                  {driverData?.user?.paid_holidays || 0} days
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Additional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Has Other Jobs</Label>
              {isEditingEmployment ? (
                <Switch
                  checked={getFieldValue("have_other_jobs", driverData?.have_other_jobs || false, true)}
                  onCheckedChange={(checked) => handleInputChange("have_other_jobs", checked)}
                />
              ) : (
                <Badge variant={driverData?.have_other_jobs ? "default" : "outline"}>
                  {driverData?.have_other_jobs ? "Yes" : "No"}
                </Badge>
              )}
            </div>
            {isEditingEmployment ? (
              <Textarea
                value={otherJobsNote}
                onChange={(e) => setOtherJobsNote(e.target.value)}
                placeholder="Notes about other jobs..."
                className="rounded-xl border-gray-300 min-h-[80px]"
              />
            ) : (
              driverData?.have_other_jobs_note && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700">{driverData.have_other_jobs_note}</p>
                </div>
              )
            )}
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Remarks</Label>
            {isEditingEmployment ? (
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional remarks or notes..."
                className="rounded-xl border-gray-300 min-h-[80px]"
              />
            ) : (
              driverData?.remarks && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800">{driverData.remarks}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNextOfKin = () => {
    const nextOfKinFields = [
      {
        label: "First Name",
        key: "next_of_kin_first_name",
        value: driverData?.next_of_kin_name?.split(" ")[0] || "—",
      },
      {
        label: "Second Name",
        key: "next_of_kin_last_name",
        value: driverData?.next_of_kin_name?.split(" ").slice(1).join(" ") || "—",
      },
      {
        label: "Phone Number",
        key: "next_of_kin_contact",
        value: driverData?.next_of_kin_contact || "—",
        icon: Phone,
      },
      {
        label: "Email Address",
        key: "next_of_kin_email",
        value: driverData?.next_of_kin_email || "—",
        icon: Mail,
      },
      {
        label: "Address",
        key: "next_of_kin_address",
        value: driverData?.next_of_kin_address || "—",
        icon: MapPin,
      },
      {
        label: "Relationship",
        key: "next_of_kin_relationship",
        value: driverData?.next_of_kin_relationship || "—",
        critical: true,
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-7 text-sm">
          {nextOfKinFields.map((field, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {field.icon && <field.icon className="inline h-3 w-3 mr-1" />}
                {field.label}
              </p>
              {isEditingNextOfKin ? (
                <Input
                  value={getFieldValue(field.key, field.value, true)}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={cn(
                    "rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400/20 h-10",
                    field.critical && "border-orange-300 bg-orange-50"
                  )}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : (
                <p className={cn(
                  "font-medium p-2 rounded-lg truncate",
                  field.critical ? "bg-orange-50 text-orange-800" : "text-gray-900"
                )} title={field.value}>
                  {field.value}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Next of Kin Notes */}
        <div className="pt-4 border-t border-gray-200">
          <Label className="text-sm font-medium">Additional Notes</Label>
          {isEditingNextOfKin ? (
            <Textarea
              value={getFieldValue("next_of_kin_note", driverData?.next_of_kin_note || "", true)}
              onChange={(e) => handleInputChange("next_of_kin_note", e.target.value)}
              className="rounded-xl border-gray-300 mt-2"
              placeholder="Any additional notes about next of kin..."
              rows={3}
            />
          ) : driverData?.next_of_kin_note ? (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700">{driverData.next_of_kin_note}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500 italic">No additional notes</p>
          )}
        </div>
      </div>
    );
  };

  const statusInfo = getStatusBadge();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-7xl mx-auto p-6 pb-28 md:pb-16 space-y-8 bg-white min-h-screen">
      {/* Warnings/Notifications */}
      {renderWarnings()}



      {/* ==================== DRIVER DETAILS ==================== */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-700" />
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              Driver Details
            </CardTitle>
          </div>
          {!isEditingDriverDetails ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
              onClick={() => setIsEditingDriverDetails(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-5 border-gray-300 hover:bg-gray-50"
                onClick={() => setIsEditingDriverDetails(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5"
                onClick={handleSaveAllChanges}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-9">
          {/* Profile Header with Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-white shadow-lg">
                <img
                  src={getFieldValue("avatar", driverData?.user?.avatar || "/default-avatar.png", isEditingDriverDetails)}
                  alt="Driver"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {isEditingDriverDetails && (
                <div className="absolute -bottom-2 -right-2">
                  <ImageUploader onUploadSuccess={handleImageUploadSuccess} />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {driverData?.user?.full_name || "Unknown Driver"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-gray-300 text-gray-700">
                  <User className="h-3 w-3 mr-1" />
                  {driverData?.user?.role || "No role"}
                </Badge>
                <Badge className={cn("text-white border-0", statusInfo.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {driverData?.user?.shifts_count || 0} shifts
                </Badge>
              </div>
              <p className="text-gray-600 text-sm">
                Driver ID: {driverData?.id || "—"} • User ID: {driverData?.user?.id || "—"}
              </p>
            </div>
          </div>

          {/* Driver Details Content */}
          {renderDriverDetails()}
        </CardContent>
      </Card>

      {/* License Information Card */}
      {renderLicenseInfo()}

      {/* ==================== EMPLOYMENT DETAILS ==================== */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-gray-700" />
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              Employment Details
            </CardTitle>
          </div>
          {!isEditingEmployment ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
              onClick={() => setIsEditingEmployment(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Employment
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-5 border-gray-300 hover:bg-gray-50"
                onClick={() => setIsEditingEmployment(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5"
                onClick={handleSaveAllChanges}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-9 space-y-8">
          {renderEmploymentDetails()}

          {/* Assignment Section */}
          {isEditingEmployment && (
            <div className="pt-8 border-t border-gray-200 space-y-10">
              {/* Contract Assignment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-900">Contract Assignment</Label>
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    Current: {driverData?.user?.contract?.name || "None"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {contractsLoading ? (
                    <div className="w-full sm:w-80 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  ) : contracts.length === 0 ? (
                    <div className="w-full sm:w-80 p-3 bg-amber-50 text-amber-800 rounded-xl text-sm">
                      No contracts available
                    </div>
                  ) : (
                    <Select value={selectedContractId} onValueChange={setSelectedContractId} disabled={assigningContract}>
                      <SelectTrigger className="w-full sm:w-80 rounded-xl border-gray-300">
                        <SelectValue placeholder="Select a contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-xs text-gray-500 truncate">{c.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-6 min-w-[120px]"
                    onClick={handleAssignContract}
                    disabled={assigningContract || !selectedContractId || contracts.length === 0}
                  >
                    {assigningContract ? "Assigning..." : "Assign Contract"}
                  </Button>
                </div>
              </div>

              {/* Site Assignment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-900">Site Assignment</Label>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {driverData?.user?.site?.length || 0} assigned
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 max-w-md">
                    {sitesLoading ? (
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    ) : sites.length === 0 ? (
                      <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm">
                        No sites available
                      </div>
                    ) : (
                      <MultiSelect
                        options={sites.map((site) => ({ 
                          value: site.id.toString(), 
                          label: site.name,
                          status: site.status 
                        }))}
                        selected={selectedSiteIds}
                        onChange={setSelectedSiteIds}
                        disabled={assigningSites}
                        placeholder="Select sites to assign"
                      />
                    )}
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 min-w-[120px]"
                    onClick={handleAssignSites}
                    disabled={assigningSites || selectedSiteIds.length === 0 || sites.length === 0}
                  >
                    {assigningSites ? "Assigning..." : "Assign Sites"}
                  </Button>
                </div>
              </div>

              {/* Bright HR Manager Assignment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-900">Bright HR Manager Assignment</Label>
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    {brightHRData.find((a) => a.is_active) ? "Assigned" : "Not Assigned"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {managersLoading ? (
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse col-span-2" />
                  ) : managers.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm col-span-2">
                      No managers available
                    </div>
                  ) : (
                    <Select 
                      value={selectedManagerId} 
                      onValueChange={setSelectedManagerId} 
                      disabled={assigningManager}
                    >
                      <SelectTrigger className="rounded-xl border-gray-300">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{m.full_name}</span>
                              <span className="text-xs text-gray-500">{m.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Input
                    type="date"
                    value={assigningDate}
                    onChange={(e) => setAssigningDate(e.target.value)}
                    className="rounded-xl border-gray-300"
                  />

                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10"
                    onClick={handleAssignBrightHRManager}
                    disabled={assigningManager || !selectedManagerId || managers.length === 0}
                  >
                    {assigningManager ? "Assigning..." : "Assign Manager"}
                  </Button>
                </div>
                
                {/* Current Bright HR Assignment */}
                {brightHRData.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-medium mb-2 block">Current Assignments</Label>
                    <div className="space-y-2">
                      {brightHRData.map((assignment) => (
                        <div 
                          key={assignment.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg",
                            assignment.is_active ? "bg-emerald-50 border border-emerald-200" : "bg-gray-100"
                          )}
                        >
                          <div>
                            <p className="font-medium">{assignment.manager_name}</p>
                            <p className="text-xs text-gray-500">{assignment.manager_email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={assignment.is_active ? "default" : "outline"}>
                              {assignment.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(assignment.assigning_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== NEXT OF KIN ==================== */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-700" />
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              Next of Kin
            </CardTitle>
          </div>
          {!isEditingNextOfKin ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
              onClick={() => setIsEditingNextOfKin(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Next of Kin
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-5 border-gray-300 hover:bg-gray-50"
                onClick={() => setIsEditingNextOfKin(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-5"
                onClick={handleSaveAllChanges}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-9">
          {renderNextOfKin()}
        </CardContent>
      </Card>

      {/* Missing Attributes (if any) */}
      {driverData?.missing_attributes?.length > 0 && (
        <Card className="border border-amber-200 bg-amber-50/50 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-amber-100 px-8 py-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Missing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-amber-800 mb-4">The following required information is missing:</p>
            <ul className="list-disc list-inside space-y-2">
              {driverData.missing_attributes.map((attr: string, index: number) => (
                <li key={index} className="text-amber-700">{attr}</li>
              ))}
            </ul>
            <Button
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setIsEditingDriverDetails(true);
                setIsEditingEmployment(true);
                setIsEditingLicense(true);
                setIsEditingNextOfKin(true);
              }}
            >
              Fill Missing Information
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}