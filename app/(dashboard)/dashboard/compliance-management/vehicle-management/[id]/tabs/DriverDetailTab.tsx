"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Save, X } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "@/components/Media/UploadImage";
import { useToast } from "@/app/Context/ToastContext";
import { cn } from "@/lib/utils";

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
  options: { value: string; label: string }[];
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
      <SelectTrigger className="w-full border-gray-300 rounded-xl h-10">
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
              <span>{option.label}</span>
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

  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assigningManager, setAssigningManager] = useState(false);
  const [assigningDate, setAssigningDate] = useState(new Date().toISOString().split("T")[0]);
  const [brightHRData, setBrightHRData] = useState<BrightHRAssignment[]>([]);
  const [brightHRLoading, setBrightHRLoading] = useState(true);

  const cookies = useCookies();
  const { showToast } = useToast();

  // ─── Helper Functions ──────────────────────────────────────────────────────
  const getFirstName = () => driverData?.user?.full_name?.split(" ")[0] ?? "—";
  const getLastName = () => {
    const parts = driverData?.user?.full_name?.split(" ") ?? [];
    return parts.length > 1 ? parts.slice(1).join(" ") : "—";
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    const today = new Date("2026-01-09"); // Current date as per your context
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

  const getFieldValue = (key: string, displayValue: string, isEditing: boolean) => {
    if (isEditing) {
      return editFormData[key] !== undefined ? editFormData[key] : displayValue;
    }
    return displayValue;
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

  return (
    <div className="max-w-7xl mx-auto p-6 pb-28 md:pb-16 space-y-8 bg-white min-h-screen">
      {/* ==================== DRIVER DETAILS ==================== */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">Driver Details</CardTitle>
          {!isEditingDriverDetails ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
              onClick={() => setIsEditingDriverDetails(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
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
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-9">
          <div className="flex flex-col sm:flex-row gap-10">
            {/* Avatar + Status */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="relative">
                <div className="w-36 h-36 rounded-full overflow-hidden ring-1 ring-gray-200/80 shadow-md">
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

                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white border-2 border-white shadow-sm px-3.5 py-1 text-xs font-medium">
                  Active
                </Badge>
              </div>
            </div>

            {/* Fields - Exact order from your image */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-7 text-sm">
              {[
                { label: "First Name", key: "first_name", value: getFirstName() },
                { label: "Last Name", key: "last_name", value: getLastName() },
                { label: "DOB", key: "date_of_birth", value: calculateAge(driverData?.date_of_birth), type: "date" },
                { label: "Address", key: "address", value: driverData?.address || "—" },
                { label: "Phone Number", key: "phone", value: driverData?.phone || "—" },
                { label: "NI Number", key: "national_insurance_no", value: driverData?.national_insurance_no || "—" },
                { label: "Post Code", key: "post_code", value: driverData?.post_code || "—" },
                { label: "Email Address", key: "email", value: driverData?.user?.email || "—", color: "text-orange-600" },
              ].map((field, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{field.label}</p>
                  {isEditingDriverDetails ? (
                    <Input
                      type={field.type || "text"}
                      value={getFieldValue(field.key, field.value, true)}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400/20 h-10"
                    />
                  ) : (
                    <p className={cn("font-medium", field.color || "text-gray-900")}>
                      {field.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== EMPLOYMENT DETAILS ==================== */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">Employment Details</CardTitle>
          {!isEditingEmployment ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
              onClick={() => setIsEditingEmployment(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
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
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-9">
          {/* Fields - Exact order from your image */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-7 text-sm mb-10">
            {[
              {
                label: "Contract Sign Date",
                value: driverData?.user?.contract_signing_date ? formatDate(driverData.user.contract_signing_date) : "—",
              },
              { label: "Contract Type", value: driverData?.user?.contract?.name || "—", color: "text-orange-600" },
              { label: "Account Number", value: driverData?.account_no || "—" },
              {
                label: "Bright HR Allocation Date",
                value: brightHRData.find((a) => a.is_active)?.assigning_date
                  ? formatDate(brightHRData.find((a) => a.is_active)?.assigning_date ?? null)
                  : "—",
              },
              {
                label: "Rota start Date",
                value: driverData?.user?.rota_start_date ? formatDate(driverData.user.rota_start_date) : "—",
              },
              { label: "Assigned Sites", value: renderAssignedSites() },
              { label: "Sort Code", value: driverData?.sort_code || "—", color: "text-orange-600" },
              {
                label: "Bright HR Manager",
                value: brightHRData.find((a) => a.is_active)?.manager_name || "Not assigned",
                color: "text-orange-600",
              },
            ].map((item, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{item.label}</p>
                <p className={cn("font-medium", item.color || "text-gray-900")}>{item.value}</p>
              </div>
            ))}
          </div>

          {isEditingEmployment && (
            <div className="space-y-10 pt-8 border-t border-gray-100">
              {/* Assign Contract */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">Assign Contract</Label>
                <div className="flex flex-col sm:flex-row gap-4">
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
                            {c.name || `Contract #${c.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-6"
                    onClick={handleAssignContract}
                    disabled={assigningContract || !selectedContractId || contracts.length === 0}
                  >
                    {assigningContract ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>

              {/* Assign Sites */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">Assign Sites</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 max-w-md">
                    {sitesLoading ? (
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    ) : sites.length === 0 ? (
                      <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm">
                        No sites available
                      </div>
                    ) : (
                      <MultiSelect
                        options={sites.map((site) => ({ value: site.id.toString(), label: site.name }))}
                        selected={selectedSiteIds}
                        onChange={setSelectedSiteIds}
                        disabled={assigningSites}
                        placeholder="Select sites"
                      />
                    )}
                  </div>

                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-6"
                    onClick={handleAssignSites}
                    disabled={assigningSites || selectedSiteIds.length === 0 || sites.length === 0}
                  >
                    {assigningSites ? "Assigning..." : "Assign Sites"}
                  </Button>
                </div>
              </div>

              {/* Assign Bright HR Manager */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">Assign Bright HR Manager</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {managersLoading ? (
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  ) : managers.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-sm col-span-2">
                      No managers available
                    </div>
                  ) : (
                    <Select value={selectedManagerId} onValueChange={setSelectedManagerId} disabled={assigningManager}>
                      <SelectTrigger className="rounded-xl border-gray-300">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.full_name} • {m.email}
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
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10"
                    onClick={handleAssignBrightHRManager}
                    disabled={assigningManager || !selectedManagerId || managers.length === 0}
                  >
                    {assigningManager ? "Assigning..." : "Assign Manager"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== NEXT OF KIN ==================== */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden bg-gray-50/70">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 px-8 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">Next of Kin</CardTitle>
          {!isEditingNextOfKin ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-50/70 rounded-full px-5"
              onClick={() => setIsEditingNextOfKin(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
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
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-9">
          {/* Fields - Exact order from your image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-7 text-sm">
            {[
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
              },
              {
                label: "Email Address",
                key: "next_of_kin_email",
                value: driverData?.next_of_kin_email || "—",
              },
              {
                label: "Address",
                key: "next_of_kin_address",
                value: driverData?.next_of_kin_address || "—",
              },
              {
                label: "Relationship",
                key: "next_of_kin_relationship",
                value: driverData?.next_of_kin_relationship || "—",
                color: "text-orange-600",
              },
            ].map((field, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{field.label}</p>
                {isEditingNextOfKin ? (
                  <Input
                    value={getFieldValue(field.key, field.value, true)}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400/20 h-10"
                  />
                ) : (
                  <p className={cn("font-medium", field.color || "text-gray-900")}>
                    {field.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}