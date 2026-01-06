"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Calendar, Phone, MapPin, Mail, Users, Briefcase, Building2, Edit, X, CircleCheck, Save, Upload, FileText, CreditCard, AlertCircle, Contact, Circle } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "@/components/Media/UploadImage";
import { useToast } from "@/app/Context/ToastContext";
import { Stepper, StepperContent, StepperNavigation, StepperTabs } from "./stepperUIUX";

interface DriverDetailTabProps {
  driverData: any;
  editFormData: any;
  contracts: any[];
  sites: any[];
  selectedContractId: string;
  setSelectedContractId: (id: string) => void;
  selectedSiteIds: string[];
  setSelectedSiteIds: (ids: string[]) => void;
  getInitials: (name: string) => string;
  formatDate: (date: string | null) => string;
  isEditing: boolean;
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
  avatar: string | null;
  email: string;
  sites: Array<{ id: number; name: string }>;
}

interface BrightHRAssignment {
  id: number;
  manager: number;
  bright_user: number;
  is_active: boolean;
  assigning_date: string;
  created_at: string;
  updated_at: string;
  manager_name: string;
  bright_user_name: string;
  manager_email: string;
  bright_user_email: string;
}

const stepLabels = [
  "Driver Details",
  "Next of Kin",
  "Employment Details",
  "BrightHR Assignment",
];

export default function DriverDetailTab({
  driverData,
  editFormData,
  contracts,
  sites,
  selectedContractId,
  setSelectedContractId,
  selectedSiteIds,
  setSelectedSiteIds,
  getInitials,
  formatDate,
  isEditing,
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
}: DriverDetailTabProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assigningManager, setAssigningManager] = useState(false);
  const [assigningDate, setAssigningDate] = useState(new Date().toISOString().split("T")[0]);
  const [brightHRData, setBrightHRData] = useState<BrightHRAssignment[]>([]);
  const [brightHRLLoading, setBrightHRLLoading] = useState(true);
  const cookies = useCookies();
  const { showToast } = useToast();

  // Extract first and last name from full_name
  const getFirstName = () => {
    if (!driverData?.user?.full_name) return "";
    const names = driverData.user.full_name.split(" ");
    return names[0] || "";
  };

  const getLastName = () => {
    if (!driverData?.user?.full_name) return "";
    const names = driverData.user.full_name.split(" ");
    return names.slice(1).join(" ") || "";
  };

  useEffect(() => {
    const fetchManagers = async () => {
      setManagersLoading(true);
      try {
        const response = await fetch(`${API_URL}/users/list-names/?role=manager`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch managers");
        const data = await response.json();
        if (data.success) setManagers(data.data || []);
      } catch (error) {
        console.error("Error fetching managers:", error);
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, [API_URL, cookies]);

  const fetchBrightHR = async () => {
    if (!driverData?.user?.id) {
      setBrightHRLLoading(false);
      return;
    }
    setBrightHRLLoading(true);
    try {
      const response = await fetch(`${API_URL}/brighthr/?bright_user_id=${driverData.user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch BrightHR assignments");
      const data = await response.json();
      if (data.success) setBrightHRData(data.data?.results || []);
    } catch (error) {
      console.error("Error fetching BrightHR assignments:", error);
    } finally {
      setBrightHRLLoading(false);
    }
  };

  useEffect(() => {
    fetchBrightHR();
  }, [driverData?.user?.id, API_URL, cookies]);

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
      if (!response.ok) throw new Error("Failed to assign manager in BrightHR");
      const data = await response.json();
      if (data.success) {
        setSelectedManagerId("");
        setAssigningDate(new Date().toISOString().split("T")[0]);
        await fetchBrightHR();
        showToast("Manager assigned successfully", "success");
      }
    } catch (error) {
      showToast("Failed to assign manager", "error");
    } finally {
      setAssigningManager(false);
    }
  };
const EditableInfoRow = ({
  icon,
  label,
  value,
  isEditing,
  inputType = "text",
  inputValue,
  onChange,
  maxLength,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  isEditing: boolean
  inputType?: string
  inputValue?: string
  onChange?: (v: string) => void
  maxLength?: number
}) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
    <div className="flex items-center gap-2 text-gray-500 shrink-0">
      {icon}
      <span className="text-sm">{label}</span>
    </div>

    <div className="min-w-[45%] text-right">
      {isEditing ? (
        <Input
          type={inputType}
          value={inputValue || ""}
          onChange={(e) => onChange?.(e.target.value)}
          maxLength={maxLength}
          className="h-8 text-sm text-right"
        />
      ) : (
        <span className="font-medium text-gray-800 break-words">
          {value || "—"}
        </span>
      )}
    </div>
  </div>
)


  const handleImageUploadSuccess = (url: string) => {
    handleInputChange("avatar", url);
  };

  if (brightHRLLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading driver information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white shadow rounded-xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Profile</h1>
          <p className="text-gray-500">Manage driver information and assignments</p>
        </div>
      
      </div>

      {/* Warnings Section */}
      {driverData?.warnings?.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-900">Attention Required</h3>
          </div>
          <div className="space-y-1">
            {driverData.warnings.map((warning: string, index: number) => (
              <p key={index} className="text-sm text-red-700">{warning}</p>
            ))}
          </div>
        </div>
      )}

      <Stepper totalSteps={4} initialStep={0}>
        {/* Stepper Tabs */}
        <StepperTabs labels={stepLabels} className="rounded-2xl" />

        {/* Stepper Content */}
        <StepperContent>
          {/* Step 1: Driver Details */}
          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow">
                      <img
                        src={isEditing ? editFormData.avatar : driverData?.user?.avatar || "/default-avatar.png"}
                        alt={driverData?.user?.full_name || "Driver"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <div className="mt-3">
                        <ImageUploader onUploadSuccess={handleImageUploadSuccess} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{driverData?.user?.full_name || "N/A"}</h2>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{driverData?.user?.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${driverData?.profile_status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {driverData?.profile_status === "approved" ? "Approved" : "Not Approved"}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {driverData?.user?.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Details Form */}
   <Card className="border-none shadow-none">
  <CardContent className="p-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* PERSONAL INFO */}
      <div className="rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="rounded-t-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
          Personal Info
        </div>

        <div className="p-4 space-y-3 text-sm">
          <EditableInfoRow
            icon={<User size={16} />}
            label="Full Name"
            value={`${getFirstName()} ${getLastName()}`}
            isEditing={isEditing}
            inputValue={editFormData.first_name}
            onChange={(v) => handleInputChange("first_name", v)}
          />

          <EditableInfoRow
            icon={<Mail size={16} />}
            label="Email"
            value={driverData?.user?.email}
            isEditing={isEditing}
            inputType="email"
            inputValue={editFormData.email}
            onChange={(v) => handleInputChange("email", v)}
          />

          <EditableInfoRow
            icon={<Phone size={16} />}
            label="Phone"
            value={driverData?.phone}
            isEditing={isEditing}
            inputValue={editFormData.phone}
            onChange={(v) => handleInputChange("phone", v)}
          />

          <EditableInfoRow
            icon={<Calendar size={16} />}
            label="DOB"
            value={driverData?.date_of_birth ? formatDate(driverData.date_of_birth) : ""}
            isEditing={isEditing}
            inputType="date"
            inputValue={editFormData.date_of_birth}
            onChange={(v) => handleInputChange("date_of_birth", v)}
          />

          <EditableInfoRow
            icon={<MapPin size={16} />}
            label="Address"
            value={driverData?.address}
            isEditing={isEditing}
            inputValue={editFormData.address}
            onChange={(v) => handleInputChange("address", v)}
          />
        </div>
      </div>

      {/* LICENSE DETAILS */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="rounded-t-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
          License Details
        </div>

        <div className="p-4 space-y-3 text-sm">
          <EditableInfoRow
            icon={<CreditCard size={16} />}
            label="Driver License No"
            value={driverData?.license_number}
            isEditing={isEditing}
            inputValue={editFormData.license_number}
            onChange={(v) => handleInputChange("license_number", v)}
          />

          <EditableInfoRow
            icon={<Calendar size={16} />}
            label="License Issue No"
            value={
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-600">
                {driverData?.license_issue_number}
              </span>
            }
            isEditing={isEditing}
            inputValue={editFormData.license_issue_number}
            maxLength={2}
            onChange={(v) => handleInputChange("license_issue_number", v)}
          />
        </div>
      </div>

      {/* CONTACT & BANK */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="rounded-t-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
          Contact & Bank Details
        </div>

        <div className="p-4 space-y-3 text-sm">
          <EditableInfoRow
            icon={<MapPin size={16} />}
            label="Post Code"
            value={driverData?.post_code}
            isEditing={isEditing}
            inputValue={editFormData.post_code}
            onChange={(v) => handleInputChange("post_code", v)}
          />

          <EditableInfoRow
            icon={<CreditCard size={16} />}
            label="Bank Acc No"
            value={driverData?.account_no}
            isEditing={isEditing}
            inputValue={editFormData.account_no}
            onChange={(v) => handleInputChange("account_no", v)}
          />

          <EditableInfoRow
            icon={<User size={16} />}
            label="Bank Sort Code"
            value={driverData?.sort_code}
            isEditing={isEditing}
            inputValue={editFormData.sort_code}
            onChange={(v) => handleInputChange("sort_code", v)}
          />
        </div>
      </div>

    </div>
  </CardContent>
</Card>


          </div>

          {/* Step 2: Next of Kin */}
          <div className="space-y-6">
          <Card className="border-none shadow-none">
  <CardContent className="p-6">
    <div className="rounded-xl border border-gray-200 max-w-[500px] bg-white shadow-sm">
      
      {/* Header */}
      <div className="rounded-t-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 flex items-center gap-2">
        <Contact size={16} />
        Next of Kin Details
      </div>

      <div className="p-4 space-y-3 text-sm">

        <EditableInfoRow
          icon={<User size={16} />}
          label="Emergency Contact Name"
          value={driverData?.next_of_kin_name}
          isEditing={isEditing}
          inputValue={editFormData.next_of_kin_name}
          onChange={(v) => handleInputChange("next_of_kin_name", v)}
        />

        <EditableInfoRow
          icon={<Phone size={16} />}
          label="Emergency Contact Number"
          value={driverData?.next_of_kin_contact}
          isEditing={isEditing}
          inputType="tel"
          inputValue={editFormData.next_of_kin_contact}
          onChange={(v) => handleInputChange("next_of_kin_contact", v)}
        />

        <EditableInfoRow
          icon={<Mail size={16} />}
          label="Email Address"
          value={driverData?.next_of_kin_email}
          isEditing={isEditing}
          inputType="email"
          inputValue={editFormData.next_of_kin_email}
          onChange={(v) => handleInputChange("next_of_kin_email", v)}
        />

        <EditableInfoRow
          icon={<MapPin size={16} />}
          label="Address"
          value={driverData?.next_of_kin_address}
          isEditing={isEditing}
          inputValue={editFormData.next_of_kin_address}
          onChange={(v) => handleInputChange("next_of_kin_address", v)}
        />

        <EditableInfoRow
          icon={<Users size={16} />}
          label="Relationship"
          value={driverData?.next_of_kin_relationship}
          isEditing={isEditing}
          inputValue={editFormData.next_of_kin_relationship}
          onChange={(v) => handleInputChange("next_of_kin_relationship", v)}
        />

        {/* Optional Notes (read-only, still image-consistent) */}
        {driverData?.next_of_kin_note && (
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Additional Notes</div>
            <div className="text-sm font-medium text-gray-800">
              {driverData.next_of_kin_note}
            </div>
          </div>
        )}

      </div>
    </div>
  </CardContent>
</Card>

          </div>

          {/* Step 3: Employment Details */}
          <div className="space-y-6">
          <Card className="border-none shadow-none">
  <CardContent className="p-6">
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* Header */}
      <div className="rounded-t-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 flex items-center gap-2">
        <Briefcase size={16} />
        Employment Details
      </div>

      <div className="p-4 space-y-6 text-sm">

        {/* ================= CONTRACT INFO ================= */}
        <div className="space-y-3">
          <div className="font-medium text-gray-700">Contract Information</div>

          <EditableInfoRow
            icon={<Calendar size={16} />}
            label="Contract Signing Date"
            value={
              driverData?.user?.contract_signing_date
                ? formatDate(driverData.user.contract_signing_date)
                : "—"
            }
            isEditing={isEditing}
            inputType="date"
            inputValue={
              editFormData.contract_signing_date ||
              driverData?.user?.contract_signing_date?.split("T")[0] ||
              ""
            }
            onChange={(v) => handleInputChange("contract_signing_date", v)}
          />

          <EditableInfoRow
            icon={<Calendar size={16} />}
            label="Rota Start Date"
            value={
              driverData?.user?.rota_start_date
                ? formatDate(driverData.user.rota_start_date)
                : "—"
            }
            isEditing={isEditing}
            inputType="date"
            inputValue={
              editFormData.rota_start_date ||
              driverData?.user?.rota_start_date ||
              ""
            }
            onChange={(v) => handleInputChange("rota_start_date", v)}
          />

          <EditableInfoRow
            icon={<Calendar size={16} />}
            label="Paid Holidays"
            value={`${driverData?.user?.paid_holidays || 0} days`}
            isEditing={isEditing}
            inputType="number"
            inputValue={
              editFormData.paid_holidays?.toString() ??
              driverData?.user?.paid_holidays?.toString() ??
              "0"
            }
            onChange={(v) =>
              handleInputChange("paid_holidays", Number(v) || 0)
            }
          />

          <EditableInfoRow
            icon={<Briefcase size={16} />}
            label="Current Contract"
            value={driverData?.user?.contract?.name || "Not assigned"}
            isEditing={false}
          />
        </div>

        {/* ================= CONTRACT ASSIGNMENT ================= */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="font-medium text-gray-700">Contract Assignment</div>
            <span className="text-xs text-gray-500">Admin only</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Select Contract</Label>
              <Select
                value={selectedContractId}
                onValueChange={setSelectedContractId}
                disabled={contractsLoading || assigningContract}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAssignContract}
              disabled={!selectedContractId || assigningContract}
              className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-6 self-end"
            >
              {assigningContract ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Assign Contract
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ================= SITE ASSIGNMENT ================= */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="font-medium text-gray-700">Site Assignment</div>
            <span className="text-xs text-gray-500">Admin only</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Label>Select Sites</Label>
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {sites.map((site) => (
                  <label
                    key={site.id}
                    className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-orange-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.includes(site.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSiteIds([...selectedSiteIds, site.id.toString()])
                        } else {
                          setSelectedSiteIds(
                            selectedSiteIds.filter((id) => id !== site.id.toString())
                          )
                        }
                      }}
                      disabled={assigningSites || sitesLoading}
                      className="h-4 w-4 text-orange-600"
                    />
                    <span className="text-sm font-medium">{site.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAssignSites}
              disabled={assigningSites || selectedSiteIds.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-6 self-end"
            >
              {assigningSites ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Assign Sites
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ================= OTHER EMPLOYMENT ================= */}
        <div className="space-y-3">
          <div className="font-medium text-gray-700">Other Employment</div>

          {isEditing ? (
            <Select
              value={
                (editFormData.have_other_jobs ??
                  driverData?.have_other_jobs ??
                  false).toString()
              }
              onValueChange={(v) =>
                handleInputChange("have_other_jobs", v === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              {driverData?.have_other_jobs ? "Yes" : "No"}
            </div>
          )}

          {(isEditing
            ? editFormData.have_other_jobs
            : driverData?.have_other_jobs) && (
            <div className="space-y-2">
              <Label>Details</Label>
              {isEditing ? (
                <Textarea
                  value={editFormData.have_other_jobs_note || ""}
                  onChange={(e) =>
                    handleInputChange("have_other_jobs_note", e.target.value)
                  }
                  className="min-h-[100px]"
                />
              ) : (
                <div className="rounded-lg bg-gray-50 p-3">
                  {driverData?.have_other_jobs_note || "No details provided"}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  </CardContent>
</Card>

          </div>

          {/* Step 4: BrightHR Assignment */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-lg font-semibold text-gray-900">Bright HR Assignment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Assignment Form */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Assign Manager</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Select Manager</Label>
                      <Select value={selectedManagerId} onValueChange={setSelectedManagerId} disabled={managersLoading || assigningManager}>
                        <SelectTrigger><SelectValue placeholder={managersLoading ? "Loading..." : "Choose a manager"} /></SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id.toString()}>
                              {manager.full_name} - {manager.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Assignment Date</Label>
                      <Input type="date" value={assigningDate} onChange={(e) => setAssigningDate(e.target.value)} disabled={assigningManager} className="h-9" />
                    </div>
                  </div>
                  <Button
                    onClick={handleAssignBrightHRManager}
                    disabled={assigningManager || !selectedManagerId || managersLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5"
                  >
                    {assigningManager ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Assign Manager
                      </>
                    )}
                  </Button>
                </div>

                {/* Current Assignments */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Current Assignments</h3>
                  {brightHRData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {brightHRData.map((assignment) => (
                        <div key={assignment.id} className="p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Users className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{assignment.manager_name}</h4>
                                <p className="text-xs text-gray-500">{assignment.manager_email}</p>
                              </div>
                            </div>
                            <Badge className={assignment.is_active ? "bg-green-500" : "bg-gray-400"}>
                              {assignment.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <Separator className="mb-4" />
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Assigned: {formatDate(assignment.assigning_date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{assignment.bright_user_email}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-dashed border-gray-300">
                      <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto mb-4">
                        <Users className="h-8 w-8 text-orange-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</h4>
                      <p className="text-gray-500">Assign a manager above to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </StepperContent>

        {/* Navigation */}
        <StepperNavigation className="mt-8" />
      </Stepper>
    </div>
  );
}