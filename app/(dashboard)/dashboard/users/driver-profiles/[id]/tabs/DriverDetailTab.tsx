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
import { User, Calendar, Phone, MapPin, Mail, Users, Briefcase, Building2, Edit, X, CircleCheck, Save, Upload, FileText, CreditCard, AlertCircle, Contact } from "lucide-react";
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
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Details
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          First Name
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.first_name || getFirstName()}
                            onChange={(e) => handleInputChange("first_name", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {getFirstName() || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Last Name
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.last_name || getLastName()}
                            onChange={(e) => handleInputChange("last_name", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {getLastName() || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          DOB
                        </Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editFormData.date_of_birth || driverData?.date_of_birth || ""}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.date_of_birth ? formatDate(driverData.date_of_birth) : "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          NI Number
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.national_insurance_no || driverData?.national_insurance_no || ""}
                            onChange={(e) => handleInputChange("national_insurance_no", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.national_insurance_no || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* License Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      License Details
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Driver License Number</Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.license_number || driverData?.license_number || ""}
                            onChange={(e) => handleInputChange("license_number", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.license_number || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">License Issue Number</Label>
                        {isEditing ? (
                          <div>
                            <Input
                              type="text"
                              value={editFormData.license_issue_number || driverData?.license_issue_number || ""}
                              onChange={(e) => handleInputChange("license_issue_number", e.target.value)}
                              className="h-9 text-sm"
                              maxLength={2}
                            />
                            <p className="text-xs text-gray-400 mt-1">Only 2 characters</p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.license_issue_number || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Bank Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact & Banking
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Address
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.address || driverData?.address || ""}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded break-words">
                            {driverData?.address || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Post Code
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.post_code || driverData?.post_code || ""}
                            onChange={(e) => handleInputChange("post_code", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.post_code || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Contact Number
                        </Label>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={editFormData.phone || driverData?.phone || ""}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.phone || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          Email Address
                        </Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editFormData.email || driverData?.user?.email || ""}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded break-words">
                            {driverData?.user?.email || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          Bank Account Number
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.account_no || driverData?.account_no || ""}
                            onChange={(e) => handleInputChange("account_no", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.account_no || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          Bank Sort Code
                        </Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.sort_code || driverData?.sort_code || ""}
                            onChange={(e) => handleInputChange("sort_code", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.sort_code || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Next of Kin */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Contact className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-lg font-semibold text-gray-900">Next of Kin Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Emergency Contact</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Emergency Contact Name</Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.next_of_kin_name || driverData?.next_of_kin_name || ""}
                            onChange={(e) => handleInputChange("next_of_kin_name", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.next_of_kin_name || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Emergency Contact Number</Label>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={editFormData.next_of_kin_contact || driverData?.next_of_kin_contact || ""}
                            onChange={(e) => handleInputChange("next_of_kin_contact", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.next_of_kin_contact || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Email Address</Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editFormData.next_of_kin_email || driverData?.next_of_kin_email || ""}
                            onChange={(e) => handleInputChange("next_of_kin_email", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded break-words">
                            {driverData?.next_of_kin_email || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Additional Information</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Address</Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.next_of_kin_address || driverData?.next_of_kin_address || ""}
                            onChange={(e) => handleInputChange("next_of_kin_address", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.next_of_kin_address || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Relationship</Label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={editFormData.next_of_kin_relationship || driverData?.next_of_kin_relationship || ""}
                            onChange={(e) => handleInputChange("next_of_kin_relationship", e.target.value)}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData?.next_of_kin_relationship || "Not provided"}
                          </p>
                        )}
                      </div>
                      {driverData?.next_of_kin_note && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Additional Notes</Label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                            {driverData.next_of_kin_note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Employment Details */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-lg font-semibold text-gray-900">Employment Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Contract Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Contract Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Contract Signing Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editFormData.contract_signing_date || driverData?.user?.contract_signing_date?.split('T')[0] || ""}
                          onChange={(e) => handleInputChange("contract_signing_date", e.target.value)}
                          className="h-9 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                          {driverData?.user?.contract_signing_date ? formatDate(driverData.user.contract_signing_date) : "Not provided"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Rota Start Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editFormData.rota_start_date || driverData?.user?.rota_start_date || ""}
                          onChange={(e) => handleInputChange("rota_start_date", e.target.value)}
                          className="h-9 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                          {driverData?.user?.rota_start_date ? formatDate(driverData.user.rota_start_date) : "Not provided"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Paid Holidays</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editFormData.paid_holidays || driverData?.user?.paid_holidays || 0}
                          onChange={(e) => handleInputChange("paid_holidays", parseInt(e.target.value) || 0)}
                          className="h-9 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                          {driverData?.user?.paid_holidays || 0} days
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Current Contract</Label>
                      <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                        {driverData?.user?.contract?.name || "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contract Assignment Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Contract Assignment</h3>
                    <span className="text-xs text-gray-500">Admin to assign contract</span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Select Contract</Label>
                      <Select value={selectedContractId} onValueChange={setSelectedContractId} disabled={contractsLoading || assigningContract}>
                        <SelectTrigger><SelectValue placeholder="Choose a contract" /></SelectTrigger>
                        <SelectContent>
                          {contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id.toString()}>{contract.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAssignContract} disabled={assigningContract || !selectedContractId} className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-6">
                        {assigningContract ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><Save className="h-4 w-4 mr-2" /> Assign Contract</>}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Site Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Site Assignment</h3>
                    <span className="text-xs text-gray-500">Admin to assign sites</span>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <Label className="mb-3 block">Select Sites</Label>
                      <div className="border border-gray-300 rounded-lg max-h-80 overflow-y-auto bg-white">
                        {sites.map((site) => (
                          <label key={site.id} className="flex items-center gap-3 p-4 hover:bg-orange-50 border-b last:border-0 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedSiteIds.includes(site.id.toString())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSiteIds([...selectedSiteIds, site.id.toString()]);
                                } else {
                                  setSelectedSiteIds(selectedSiteIds.filter((id) => id !== site.id.toString()));
                                }
                              }}
                              disabled={sitesLoading || assigningSites}
                              className="h-5 w-5 text-orange-600 focus:ring-orange-500 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-900">{site.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start lg:items-end">
                      <Button onClick={handleAssignSites} disabled={assigningSites || selectedSiteIds.length === 0} className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-6 w-full lg:w-auto">
                        {assigningSites ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><Save className="h-4 w-4 mr-2" /> Assign Sites</>}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Other Employment */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Other Employment</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Do you have any other Jobs?</Label>
                      {isEditing ? (
                        <Select 
                          value={editFormData.have_other_jobs?.toString() || driverData?.have_other_jobs?.toString() || "false"} 
                          onValueChange={(v) => handleInputChange("have_other_jobs", v === "true")}
                        >
                          <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 p-2 bg-gray-50 rounded">
                          {driverData?.have_other_jobs ? "Yes" : "No"}
                        </p>
                      )}
                    </div>
                    {(isEditing ? editFormData.have_other_jobs : driverData?.have_other_jobs) && (
                      <div className="space-y-2">
                        <Label>Details (Mandatory if Yes)</Label>
                        {isEditing ? (
                          <Textarea
                            value={editFormData.have_other_jobs_note || driverData?.have_other_jobs_note || ""}
                            onChange={(e) => handleInputChange("have_other_jobs_note", e.target.value)}
                            className="min-h-[100px] text-sm"
                            placeholder="Provide details about other employment"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                            {driverData?.have_other_jobs_note || "No details provided"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Currently Assigned Sites */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Currently Assigned Sites</h3>
                  {driverData?.user?.site?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {driverData.user.site.map((site: any) => (
                        <div key={site.id} className="p-4 bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {site.image ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden">
                                  <img src={site.image} alt={site.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="p-2 bg-orange-100 rounded-lg">
                                  <Building2 className="h-4 w-4 text-orange-600" />
                                </div>
                              )}
                              <div>
                                <h5 className="font-semibold text-gray-900">{site.name}</h5>
                                <p className="text-xs text-gray-500">{site.status}</p>
                              </div>
                            </div>
                            <Badge className={site.status === "active" ? "bg-green-500" : "bg-gray-400"}>{site.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No sites assigned yet</p>
                    </div>
                  )}
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