"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Mail
} from "lucide-react";
// Add Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import API_URL from "@/app/utils/ENV";
import { formatDmy } from "@/lib/utils";
import ProfessionalCompetencyTab from "./tabs/ProfessionalCompetencyTab";
import DriverDetailTab from "./tabs/DriverDetailTab";
import SignAgreementTab from "./tabs/SignAgreementTab";
import HealthAnswerTab from "./tabs/HealthAnswerTab";
import { User, BadgeCheck, HeartPulse, FileSignature } from "lucide-react"

interface DriverData {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    display_name: string;
    parent_rota_completed: boolean;
    child_rota_completed: boolean;
    contract_signing_date: string;
    rota_start_date: string;
    paid_holidays: number;
    is_active: boolean;
    contract: {
      id: number;
      name: string;
      description: string;
    };
    role: string;
    site: Array<{
      id: number;
      name: string;
      status: string;
      image: string;
    }>;
    shifts_count: number;
    avatar: string | null;
  };
  warnings: string[];
  missing_attributes: string[];
  source: string;
  next_step: string;
  is_profile_completed: boolean;
  remarks: string;
  profile_status: string;
  have_other_jobs: boolean;
  have_other_jobs_note: string;
  date_of_birth: string;
  phone: string;
  address: string;
  account_no: string;
  sort_code: string;
  post_code: string;
  national_insurance_no: string;
  license_number: string;
  license_issue_number: string;
  last_driver_license_check_code_date: string;
  last_driver_tacho_download: string;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_note: string | null;
  next_of_kin_contact: string;
  next_of_kin_email: string;
  next_of_kin_address: string;
  manager_name: string;
  signup_date: string;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: number;
  name: string;
  description: string;
}

interface Site {
  id: number;
  name: string;
  status: string;
  image: string;
}

interface CompetencyModule {
  id: number;
  module_name: string;
  description: string;
  expiry_date: string;
}

interface ProfessionalCompetency {
  id: number;
  driver: number;
  document_name: string;
  document_type: string;
  has_expiry: boolean;
  description: string;
  expiry_date: string | null;
  has_document: boolean;
  has_back_side: boolean;
  urls: string[];
  request_status: string;
  has_description: boolean;
  next_five_modules: string[];
  modules: CompetencyModule[];
  created_at: string;
  updated_at: string;
}

interface HealthAnswer {
  id: number;
  question: number;
  question_text: string;
  answered_by: number;
  answer: boolean;
  note: string;
  admin_remarks: string | null;
  created_at: string;
  updated_at: string;
}

export default function DriverDetailPage() {
  const { id } = useParams();
  const cookies = useCookies();
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [competencyData, setCompetencyData] = useState<ProfessionalCompetency[]>([]);
  const [healthData, setHealthData] = useState<HealthAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [competencyLoading, setCompetencyLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competencyError, setCompetencyError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingHealth, setIsEditingHealth] = useState(false);

  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    address: "",
    phone: "",
    national_insurance_no: "",
    post_code: "",
    email: "",
    avatar: "",
    next_of_kin_first_name: "",
    next_of_kin_last_name: "",
    next_of_kin_contact: "",
    next_of_kin_email: "",
    next_of_kin_address: "",
    next_of_kin_relationship: "",
    have_other_jobs_note: "",
    account_no: "",
    sort_code: "",
    have_other_jobs: false,
    paid_holidays: 0,
    rota_start_date: "",
    contract_signing_date: "",
    remarks: "",
    last_driver_license_check_code_date: "",
    last_driver_tacho_download: "",
  });

  const [editHealthData, setEditHealthData] = useState<HealthAnswer[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [assigningContract, setAssigningContract] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [assigningSites, setAssigningSites] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("driver-detail");
  const [disapproveRemarks, setDisapproveRemarks] = useState("");
  const [isDisapproving, setIsDisapproving] = useState(false);

  const isPdfUrl = (url: string) => url.toLowerCase().endsWith(".pdf");
  
  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`);
  };

  const formatDate = (dateString: string | null) => (dateString ? formatDmy(dateString) : "Not set");

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${id}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch driver data");
      }
      const result = await response.json();
      if (result.success) {
        setDriverData(result.data);
        const fullNameParts = result.data.user.full_name?.split(" ") || [];
        const nextOfKinParts = result.data.next_of_kin_name?.split(" ") || [];
        setEditFormData({
          first_name: fullNameParts[0] || "",
          last_name: fullNameParts.slice(1).join(" ") || "",
          date_of_birth: result.data.date_of_birth || "",
          address: result.data.address || "",
          phone: result.data.phone || "",
          national_insurance_no: result.data.national_insurance_no || "",
          post_code: result.data.post_code || "",
          email: result.data.user.email || "",
          avatar: result.data.user.avatar || "",
          next_of_kin_first_name: nextOfKinParts[0] || "",
          next_of_kin_last_name: nextOfKinParts.slice(1).join(" ") || "",
          next_of_kin_contact: result.data.next_of_kin_contact || "",
          next_of_kin_email: result.data.next_of_kin_email || "",
          next_of_kin_address: result.data.next_of_kin_address || "",
          next_of_kin_relationship: result.data.next_of_kin_relationship || "",
          account_no: result.data.account_no || "",
          sort_code: result.data.sort_code || "",
          have_other_jobs: result.data.have_other_jobs || false,
          have_other_jobs_note: result.data.have_other_jobs_note || "",
          paid_holidays: result.data.user.paid_holidays || 0,
          rota_start_date: result.data.user.rota_start_date || "",
          contract_signing_date: result.data.user.contract_signing_date || "",
          remarks: result.data.remarks || "",
          last_driver_license_check_code_date: result.data.last_driver_license_check_code_date || "",
          last_driver_tacho_download: result.data.last_driver_tacho_download || "",
        });
      } else {
        throw new Error(result.message || "Failed to load driver data");
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetencyData = async () => {
    setCompetencyLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/professional-competency/?driver_id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch professional competency data");
      }
      const result = await response.json();
      if (result.success) {
        setCompetencyData(result.data);
      } else {
        throw new Error(result.message || "Failed to load professional competency data");
      }
    } catch (error) {
      console.error("Error fetching professional competency data:", error);
      setCompetencyError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setCompetencyLoading(false);
    }
  };

  const fetchHealthData = async () => {
    if (!driverData?.user?.id) return;
    setHealthLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/health-answers/?answered_by=${driverData.user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch health answers");
      }
      const result = await response.json();
      if (result.success) {
        setHealthData(result.data);
        setEditHealthData(result.data);
      } else {
        throw new Error(result.message || "Failed to load health answers");
      }
    } catch (error) {
      console.error("Error fetching health answers:", error);
      setHealthError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      fetchCompetencyData();
    }
  }, [id, cookies]);

  useEffect(() => {
    if (driverData?.user?.id) {
      fetchHealthData();
    }
  }, [driverData?.user?.id]);

  useEffect(() => {
    const fetchContracts = async () => {
      setContractsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/staff/contracts/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (response.status === 401) {
          showToast("Session expired. Please log in again.", "error");
          return;
        }
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setContracts(data);
      } catch {
        showToast("Failed to fetch contracts", "error");
      } finally {
        setContractsLoading(false);
      }
    };
    const fetchSites = async () => {
      setSitesLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/sites/list-names/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (response.status === 401) {
          showToast("Session expired. Please log in again.", "error");
          return;
        }
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (data.success) setSites(data.data);
        else showToast(data.message || "Failed to fetch sites", "error");
      } catch {
        showToast("Failed to fetch sites", "error");
      } finally {
        setSitesLoading(false);
      }
    };
    fetchContracts();
    fetchSites();
  }, [cookies]);

  const handleAssignContract = async (contractId?: string) => {
    const idToAssign = contractId || selectedContractId;
    if (!idToAssign) {
      showToast("Please select a contract to assign.", "error");
      return;
    }
    setAssigningContract(true);
    try {
      const response = await fetch(`${API_URL}/api/staff/contracts/${idToAssign}/assign-users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          user_ids: [Number(driverData?.user.id)],
        }),
      });
      if (!response.ok) throw new Error("Failed to assign contract");
      const result = await response.json();
      if (result?.name) {
        showToast("Contract assigned successfully", "success");
        fetchData();
        setSelectedContractId("");
      } else {
        throw new Error(result.message || "Failed to assign contract");
      }
    } catch (error) {
      console.error("Error assigning contract:", error);
      showToast(error instanceof Error ? error.message : "Failed to assign contract", "error");
    } finally {
      setAssigningContract(false);
    }
  };

  const handleAssignSites = async (siteIds?: string[]) => {
    const idsToAssign = siteIds || selectedSiteIds;
    if (!idsToAssign || idsToAssign.length === 0) {
      showToast("Please select at least one site to assign.", "error");
      return;
    }
    setAssigningSites(true);
    try {
      const response = await fetch(`${API_URL}/users/${driverData?.user.id}/allocate-sites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          site_ids: idsToAssign.map(Number),
        }),
      });
      if (!response.ok) throw new Error("Failed to assign sites");
      showToast("Sites assigned successfully", "success");
      fetchData();
    } catch (error) {
      console.error("Error assigning sites:", error);
      showToast(error instanceof Error ? error.message : "Failed to assign sites", "error");
    } finally {
      setAssigningSites(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && driverData) {
      const fullNameParts = driverData.user.full_name?.split(" ") || [];
      const nextOfKinParts = driverData.next_of_kin_name?.split(" ") || [];
      setEditFormData({
        first_name: fullNameParts[0] || "",
        last_name: fullNameParts.slice(1).join(" ") || "",
        date_of_birth: driverData.date_of_birth || "",
        address: driverData.address || "",
        phone: driverData.phone || "",
        national_insurance_no: driverData.national_insurance_no || "",
        post_code: driverData.post_code || "",
        email: driverData.user.email || "",
        avatar: driverData.user.avatar || "",
        next_of_kin_first_name: nextOfKinParts[0] || "",
        next_of_kin_last_name: nextOfKinParts.slice(1).join(" ") || "",
        next_of_kin_contact: driverData.next_of_kin_contact || "",
        next_of_kin_email: driverData.next_of_kin_email || "",
        next_of_kin_address: driverData.next_of_kin_address || "",
        next_of_kin_relationship: driverData.next_of_kin_relationship || "",
        account_no: driverData.account_no || "",
        sort_code: driverData.sort_code || "",
        have_other_jobs: driverData.have_other_jobs || false,
        have_other_jobs_note: driverData.have_other_jobs_note || "",
        remarks: driverData.remarks || "",
        paid_holidays: driverData.user.paid_holidays || 0,
        rota_start_date: driverData.user.rota_start_date || "",
        contract_signing_date: driverData.user.contract_signing_date || "",
        last_driver_license_check_code_date: driverData.last_driver_license_check_code_date || "",
        last_driver_tacho_download: driverData.last_driver_tacho_download || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleHealthEditToggle = () => {
    if (isEditingHealth) setEditHealthData(healthData);
    setIsEditingHealth(!isEditingHealth);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHealthInputChange = (id: number, field: string, value: boolean | string) => {
    setEditHealthData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveProfile = async (overrideData?: Partial<typeof editFormData>) => {
    const currentData = overrideData ? { ...editFormData, ...overrideData } : editFormData;
    if (!currentData.email || !currentData.first_name || !currentData.last_name) {
      showToast("Email, first name, and last name are required", "error");
      return;
    }
    setSaving(true);
    try {
      const userPayload = {
        email: currentData.email,
        full_name: `${currentData.first_name} ${currentData.last_name}`.trim(),
        avatar: currentData.avatar || null,
        paid_holidays: currentData.paid_holidays,
        rota_start_date: currentData.rota_start_date,
        contract_signing_date: currentData.contract_signing_date,
      };
      const userResponse = await fetch(`${API_URL}/users/${driverData?.user.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cookies.get("access_token")}` },
        body: JSON.stringify(userPayload),
      });
      if (!userResponse.ok) throw new Error("Failed to update user profile");

      const driverPayload = {
        phone: currentData.phone,
        address: currentData.address,
        date_of_birth: currentData.date_of_birth,
        national_insurance_no: currentData.national_insurance_no,
        post_code: currentData.post_code,
        next_of_kin_name: `${currentData.next_of_kin_first_name} ${currentData.next_of_kin_last_name}`.trim(),
        next_of_kin_relationship: currentData.next_of_kin_relationship,
        next_of_kin_contact: currentData.next_of_kin_contact,
        next_of_kin_email: currentData.next_of_kin_email,
        next_of_kin_address: currentData.next_of_kin_address,
        account_no: currentData.account_no,
        sort_code: currentData.sort_code,
        have_other_jobs: currentData.have_other_jobs,
        have_other_jobs_note: currentData.have_other_jobs_note,
        remarks: currentData.remarks,
      };
      const driverResponse = await fetch(`${API_URL}/api/profiles/driver/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cookies.get("access_token")}` },
        body: JSON.stringify(driverPayload),
      });
      if (!driverResponse.ok) throw new Error("Failed to update driver profile");

      const userResult = await userResponse.json();
      const driverResult = await driverResponse.json();

      if (userResult.success && driverResult.success) {
        setDriverData((prev) => prev ? {
          ...prev,
          phone: currentData.phone,
          address: currentData.address,
          date_of_birth: currentData.date_of_birth,
          national_insurance_no: currentData.national_insurance_no,
          post_code: currentData.post_code,
          next_of_kin_name: `${currentData.next_of_kin_first_name} ${currentData.next_of_kin_last_name}`.trim(),
          next_of_kin_relationship: currentData.next_of_kin_relationship,
          next_of_kin_contact: currentData.next_of_kin_contact,
          next_of_kin_email: currentData.next_of_kin_email,
          next_of_kin_address: currentData.next_of_kin_address,
          account_no: currentData.account_no,
          sort_code: currentData.sort_code,
          have_other_jobs: currentData.have_other_jobs,
          have_other_jobs_note: currentData.have_other_jobs_note,
          remarks: currentData.remarks,
          user: {
            ...prev.user,
            email: currentData.email,
            full_name: `${currentData.first_name} ${currentData.last_name}`.trim(),
            avatar: currentData.avatar || prev.user.avatar,
            paid_holidays: currentData.paid_holidays,
            rota_start_date: currentData.rota_start_date,
            contract_signing_date: currentData.contract_signing_date,
          },
        } : null);
        setIsEditing(false);
        showToast("Profile updated successfully", "success");
      } else {
        throw new Error(userResult.message || driverResult.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(error instanceof Error ? error.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealth = async () => {
    setSavingHealth(true);
    try {
      const updates = editHealthData.map((item) => ({ id: item.id, answer: item.answer, note: item.note }));
      const response = await fetch(`${API_URL}/api/profiles/health-answers/bulk-update/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cookies.get("access_token")}` },
        body: JSON.stringify({ health_answers: updates }),
      });
      if (!response.ok) throw new Error("Failed to update health answers");
      const result = await response.json();
      if (result.success) {
        setHealthData(editHealthData);
        setIsEditingHealth(false);
        showToast("Health answers updated successfully", "success");
        fetchHealthData();
      } else throw new Error(result.message || "Failed to update health answers");
    } catch (error) {
      console.error("Error updating health answers:", error);
      showToast(error instanceof Error ? error.message : "Failed to update health answers", "error");
    } finally {
      setSavingHealth(false);
    }
  };

  if (loading || competencyLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-600"></div>
      </div>
    );
  }
  if (error || !driverData || competencyError || healthError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md shadow-xl bg-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-orange-600 mb-2">Error</h2>
          <p className="text-gray-700">{error || competencyError || healthError || "Driver not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-8 space-y-8 bg-white min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="flex justify-start w-full gap-8 bg-[#f9f9f9] py-8 px-6">
          <TabsTrigger value="driver-detail" className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F] transition-colors">
            <User size={16} /> Driver Details
          </TabsTrigger>
          <TabsTrigger value="professional-competency" className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F] transition-colors">
            <BadgeCheck size={16} /> Professional Details
          </TabsTrigger>
          <TabsTrigger value="health-answer" className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F] transition-colors">
            <HeartPulse size={16} /> Health Questions
          </TabsTrigger>
          <TabsTrigger value="sign-agreement" className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F] transition-colors">
            <FileSignature size={16} /> Signed Agreement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="driver-detail">
          <DriverDetailTab
            driverData={driverData}
            editFormData={editFormData}
            contracts={contracts}
            sites={sites}
            selectedContractId={selectedContractId}
            setSelectedContractId={setSelectedContractId}
            selectedSiteIds={selectedSiteIds}
            setSelectedSiteIds={setSelectedSiteIds}
            formatDate={formatDate}
            handleInputChange={handleInputChange}
            handleAssignContract={handleAssignContract}
            handleAssignSites={handleAssignSites}
            contractsLoading={contractsLoading}
            sitesLoading={sitesLoading}
            assigningContract={assigningContract}
            assigningSites={assigningSites}
            handleEditToggle={handleEditToggle}
            handleSaveProfile={handleSaveProfile}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="professional-competency">
          <ProfessionalCompetencyTab
            competencyData={competencyData}
            formatDate={formatDate}
            driverId={driverData.id}
            driverName={driverData.user.full_name}
            licenseNumber={driverData.license_number}
            licenseIssueNumber={driverData.license_issue_number}
            lastDriverLicenseCheckCodeDate={driverData.last_driver_license_check_code_date}
            lastDriverTachoDownload={driverData.last_driver_tacho_download}
            isPdfUrl={isPdfUrl}
            cookies={cookies}
            API_URL={API_URL}
            fetchCompetencyData={fetchCompetencyData}
            fetchDriverData={fetchData}
          />
        </TabsContent>
        <TabsContent value="health-answer">
          <HealthAnswerTab
            healthData={healthData}
            editHealthData={editHealthData}
            isEditingHealth={isEditingHealth}
            savingHealth={savingHealth}
            handleHealthEditToggle={handleHealthEditToggle}
            handleHealthInputChange={handleHealthInputChange}
            handleSaveHealth={handleSaveHealth}
          />
        </TabsContent>
        <TabsContent value="sign-agreement">
          <SignAgreementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}