"use client";
import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, User, Calendar, Phone, MapPin, AlertTriangle, CheckCircle2, Mail, Users, Briefcase, Building2, Edit, X, CircleCheck, Upload } from "lucide-react";
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
  "Personal Information",
  "Next of Kin",
  "Contract & Sites",
  "BrightHR",
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
      <Stepper totalSteps={4} initialStep={0}>
        {/* Stepper Tabs */}
        <StepperTabs   labels={stepLabels} className="  rounded-2xl " />

        {/* Stepper Content */}
        <StepperContent>
          {/* Step 1: Personal Information */}
           <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 h-[100px]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={isEditing ? editFormData.avatar : driverData.user.avatar} 
                    alt={driverData.user.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEditing && (
                 <div className="w-full">
                    <ImageUploader onUploadSuccess={handleImageUploadSuccess} />
                  </div>
                )}
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900 mb-2">{driverData.user.full_name}</h1>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-orange-600">
                    <User className="h-3.5 w-3.5" />
                    <span>{driverData.user.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{driverData.user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-4xl text-xs font-medium bg-red-100 text-red-700">
               {driverData.profile_status==="approved"?"Approved":"Rejected"}
              </span>
              <span className="px-3 py-1 rounded-4xl text-xs font-medium bg-gray-100 text-gray-700">
                {driverData.user.is_active ? "Active" : "In Active"}
              </span>
            </div>
          </div>

         
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Warnings Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-900">Warnings</h2>
                <span className="ml-auto bg-orange-500 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                  {driverData.warnings.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {driverData.warnings.map((warning: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-yellow-500 text-sm shrink-0">⚠</span>
                  <p className="text-gray-700 text-[11px] leading-relaxed">{warning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Account Settings Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-900">Accounts Settings</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Full Name
                    </label>
                    <input 
                      type="text"
                      value={editFormData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <CircleCheck className="h-3 w-3" />
                      Status
                    </label>
                    <select 
                      value={editFormData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">In active</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      Email
                    </label>
                    <input 
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  {/* <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Display Name
                    </label>
                    <input 
                      type="text"
                      value={editFormData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div> */}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <User className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">Full Name</p>
                      <p className="text-xs text-gray-900 font-medium">{driverData.user.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleCheck className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">Status</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-orange-700">
                        {driverData.user.is_active ? "Active" : "In Active"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">Email</p>
                      <p className="text-xs text-gray-900 font-medium break-all">{driverData.user.email}</p>
                    </div>
                  </div>
                  {/* <div className="flex items-start gap-2">
                    <User className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">Display Name</p>
                      <p className="text-xs text-gray-900 font-medium">{driverData.user.display_name}</p>
                    </div>
                  </div> */}
                </>
              )}
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-900">Contact Information</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      Phone
                    </label>
                    <input 
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      DOB
                    </label>
                    <input 
                      type="date"
                      value={editFormData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-gray-600 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      Address
                    </label>
                    <input 
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">Phone</p>
                      <p className="text-xs text-gray-900 font-medium">{driverData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">DOB</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-orange-700">
                        {formatDate(driverData.date_of_birth)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-700 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 mb-0.5">Address</p>
                      <p className="text-xs text-gray-900 font-medium">{driverData.address}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

          {/* Step 2: Next of Kin */}
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveProfile} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> : <Save className="h-5 w-5 mr-2" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleEditToggle} disabled={saving} className="border-orange-600 text-orange-600 hover:bg-orange-100">
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditToggle} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Edit className="h-5 w-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Next of Kin Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={editFormData.next_of_kin_name} onChange={(e) => handleInputChange("next_of_kin_name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input value={editFormData.next_of_kin_relationship} onChange={(e) => handleInputChange("next_of_kin_relationship", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact</Label>
                      <Input type="tel" value={editFormData.next_of_kin_contact} onChange={(e) => handleInputChange("next_of_kin_contact", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={editFormData.next_of_kin_email} onChange={(e) => handleInputChange("next_of_kin_email", e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Input value={editFormData.next_of_kin_address} onChange={(e) => handleInputChange("next_of_kin_address", e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Name", value: driverData.next_of_kin_name },
                      { label: "Relationship", value: driverData.next_of_kin_relationship },
                      { label: "Contact", value: driverData.next_of_kin_contact },
                      { label: "Email", value: driverData.next_of_kin_email },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{item.value || "Not provided"}</p>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Address</p>
                      <p className="text-sm font-semibold text-gray-900">{driverData.next_of_kin_address || "Not provided"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Contract & Sites */}
          <div className="space-y-6">
            {/* Assign Contract */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Contract Assignment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                    <Button onClick={handleAssignContract} disabled={assigningContract || !selectedContractId} className="bg-orange-600 hover:bg-orange-700 text-white h-10 px-6">
                      {assigningContract ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><Save className="h-4 w-4 mr-2" /> Assign</>}
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Contract Name", value: driverData.user.contract?.name || "Not assigned" },
                    { label: "Signing Date", value: formatDate(driverData.user.contract_signing_date), editable: true, field: "contract_signing_date", type: "date" },
                    { label: "Paid Holidays", value: driverData.user.paid_holidays || 0, editable: true, field: "paid_holidays", type: "number" },
                    { label: "Rota Start Date", value: formatDate(driverData.user.rota_start_date), editable: true, field: "rota_start_date", type: "date" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-2">{item.label}</p>
                      {isEditing && item.editable ? (
                        <Input
                          type={item.type}
                          value={editFormData[item.field]}
                          onChange={(e) => handleInputChange(item.field, item.type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Other Jobs */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Other Employment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Do you have any other job?</Label>
                    {isEditing ? (
                      <Select value={editFormData.have_other_jobs.toString()} onValueChange={(v) => handleInputChange("have_other_jobs", v === "true")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{driverData.have_other_jobs ? "Yes" : "No"}</p>
                    )}
                  </div>
                  {(isEditing ? editFormData.have_other_jobs : driverData.have_other_jobs) && (
                    <div className="space-y-2">
                      <Label>Details</Label>
                      {isEditing ? (
                        <Textarea
                          value={editFormData.have_other_jobs_note || ""}
                          onChange={(e) => handleInputChange("have_other_jobs_note", e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Provide details about other employment"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">{driverData.have_other_jobs_note || "No details provided"}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assign Sites */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Site Assignment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                    <Button onClick={handleAssignSites} disabled={assigningSites || selectedSiteIds.length === 0} className="bg-orange-600 hover:bg-orange-700 text-white h-10 px-6 w-full lg:w-auto">
                      {assigningSites ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><Save className="h-4 w-4 mr-2" /> Assign Sites</>}
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Currently Assigned Sites</h4>
                  {driverData.user.site?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {driverData.user.site.map((site: any) => (
                        <div key={site.id} className="p-4 bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Building2 className="h-4 w-4 text-orange-600" />
                              </div>
                              <h5 className="font-semibold text-gray-900">{site.name}</h5>
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

          {/* Step 4: BrightHR */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-100">
                <CardTitle className="text-lg font-semibold text-gray-900">Assign Manager</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    <Input type="date" value={assigningDate} onChange={(e) => setAssigningDate(e.target.value)} disabled={assigningManager} />
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
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Current Assignments</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-dashed border-gray-300">
                    <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto mb-4">
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</h4>
                    <p className="text-gray-500">Assign a manager above to get started</p>
                  </div>
                )}
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