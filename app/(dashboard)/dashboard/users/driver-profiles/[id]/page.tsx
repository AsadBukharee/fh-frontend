"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Save, X, CheckCircle } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { formatDmy } from "@/lib/utils";
import ProfessionalCompetencyTab from "./tabs/ProfessionalCompetencyTab";
import DriverDetailTab from "./tabs/DriverDetailTab";
import SignAgreementTab from "./tabs/SignAgreementTab";
import HealthAnswerTab from "./tabs/HealthAnswerTab";

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
  const [isEditingCompetency, setIsEditingCompetency] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    display_name: "",
    email: "",
    role: "",
    is_active: true,
    paid_holidays: 0,
    contractId: "",
    siteIds: [] as string[],
    phone: "",
    address: "",
    date_of_birth: "",
    next_of_kin_name: "",
    next_of_kin_relationship: "",
    next_of_kin_contact: "",
    next_of_kin_email: "",
    next_of_kin_address: "",
    contract_signing_date: "",
    rota_start_date: "",
    have_other_jobs: false,
    have_other_jobs_note: "",
    avatar: "", // Added avatar field
  });
  const [editHealthData, setEditHealthData] = useState<HealthAnswer[]>([]);
  const [editCompetencyData, setEditCompetencyData] = useState<ProfessionalCompetency[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  const [savingCompetency, setSavingCompetency] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [assigningContract, setAssigningContract] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [assigningSites, setAssigningSites] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("driver-detail");
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const isPdfUrl = (url: string) => url.toLowerCase().endsWith(".pdf");
  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`);
  };
  const steps = ["Personal Information", "Next of Kin", "Job Detail", "Bright HR Signup"];
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
        setEditFormData({
          full_name: result.data.user.full_name,
          display_name: result.data.user.display_name,
          email: result.data.user.email,
          role: result.data.user.role,
          is_active: result.data.user.is_active,
          paid_holidays: result.data.user.paid_holidays,
          contractId: result.data.user.contract?.id?.toString() || "",
          siteIds: result.data.user.site.map((site: Site) => site.id.toString()),
          phone: result.data.phone,
          address: result.data.address,
          date_of_birth: result.data.date_of_birth,
          next_of_kin_name: result.data.next_of_kin_name,
          next_of_kin_relationship: result.data.next_of_kin_relationship,
          next_of_kin_contact: result.data.next_of_kin_contact,
          next_of_kin_email: result.data.next_of_kin_email,
          next_of_kin_address: result.data.next_of_kin_address,
          contract_signing_date: result.data.user.contract_signing_date || "",
          rota_start_date: result.data.user.rota_start_date || "",
          have_other_jobs: result.data.have_other_jobs || false,
          have_other_jobs_note: result.data.have_other_jobs_note || "",
          avatar: result.data.user.avatar || "", // Initialize avatar
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
        setEditCompetencyData(result.data);
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
    setHealthLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/health-answers/?answered_by=${id}`, {
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
      fetchHealthData();
    }
  }, [id, cookies]);

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
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setContracts(data);
      } catch {
        showToast("Failed to fetch contracts", "error");
      } finally {
        setContractsLoading(false);
      }
    };
    const fetchSites = async () => {
      if (sites.length > 0) return;
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
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setSites(data.data);
        } else {
          showToast(data.message || "Failed to fetch sites", "error");
        }
      } catch {
        showToast("Failed to fetch sites", "error");
      } finally {
        setSitesLoading(false);
      }
    };
    fetchContracts();
    fetchSites();
  }, [cookies, sites.length]);

  const handleFileUpload = (competencyId: number, url: string, isBackSide: boolean) => {
    setEditCompetencyData((prev) =>
      prev.map((item) => {
        if (item.id === competencyId) {
          let updatedUrls = [...item.urls];
          const hasBackSide = item.has_back_side;

          if (hasBackSide) {
            if (isBackSide) {
              updatedUrls[1] = url;
            } else {
              updatedUrls[0] = url;
            }
          } else {
            updatedUrls = updatedUrls.length > 0 ? [url] : [url];
          }

          return {
            ...item,
            urls: updatedUrls,
            has_document: true,
            has_back_side: hasBackSide,
          };
        }
        return item;
      })
    );
    showToast("Document uploaded successfully", "success");
  };

  const handleAssignContract = async () => {
    if (!selectedContractId) {
      showToast("Please select a contract to assign.", "error");
      return;
    }
    setAssigningContract(true);
    try {
      const response = await fetch(`${API_URL}/api/staff/contracts/${selectedContractId}/assign-users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          user_ids: [Number(driverData?.user.id)],
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to assign contract");
      }
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

  const handleAssignSites = async () => {
    if (!selectedSiteIds || selectedSiteIds.length === 0) {
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
          site_ids: selectedSiteIds.map(Number),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to assign sites");
      }
      const result = await response.json();
      showToast("Sites assigned successfully", "success");
      fetchData();
    } catch (error) {
      console.error("Error assigning sites:", error);
      showToast(error instanceof Error ? error.message : "Failed to assign sites", "error");
    } finally {
      setAssigningSites(false);
    }
  };

  const handleApproveDriverClick = async (driverId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/approve/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ driver_id: driverId }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Driver approved successfully", "success");
        await fetchData();
      } else {
        showToast(data.message || "Failed to approve driver", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to approve driver", "error");
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditFormData({
        full_name: driverData?.user.full_name || "",
        display_name: driverData?.user.display_name || "",
        email: driverData?.user.email || "",
        role: driverData?.user.role || "",
        is_active: driverData?.user.is_active || true,
        paid_holidays: driverData?.user.paid_holidays || 0,
        contractId: driverData?.user.contract?.id?.toString() || "",
        siteIds: driverData?.user.site.map((site) => site.id.toString()) || [],
        phone: driverData?.phone || "",
        address: driverData?.address || "",
        date_of_birth: driverData?.date_of_birth || "",
        next_of_kin_name: driverData?.next_of_kin_name || "",
        next_of_kin_relationship: driverData?.next_of_kin_relationship || "",
        next_of_kin_contact: driverData?.next_of_kin_contact || "",
        next_of_kin_email: driverData?.next_of_kin_email || "",
        next_of_kin_address: driverData?.next_of_kin_address || "",
        contract_signing_date: driverData?.user.contract_signing_date || "",
        rota_start_date: driverData?.user.rota_start_date || "",
        have_other_jobs: driverData?.have_other_jobs || false,
        have_other_jobs_note: driverData?.have_other_jobs_note || "",
        avatar: driverData?.user.avatar || "", // Reset avatar
      });
    }
    setIsEditing(!isEditing);
  };

  const handleHealthEditToggle = () => {
    if (isEditingHealth) {
      setEditHealthData(healthData);
    }
    setIsEditingHealth(!isEditingHealth);
  };

  const handleCompetencyEditToggle = () => {
    if (isEditingCompetency) {
      setEditCompetencyData(competencyData);
    }
    setIsEditingCompetency(!isEditingCompetency);
  };

  const handleInputChange = (field: string, value: string | number | string[] | boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHealthInputChange = (id: number, field: string, value: boolean | string) => {
    setEditHealthData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCompetencyInputChange = (id: number, field: string, value: string) => {
    setEditCompetencyData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleModuleInputChange = (competencyId: number, moduleId: number, field: string, value: string) => {
    setEditCompetencyData((prev) =>
      prev.map((competency) =>
        competency.id === competencyId
          ? {
              ...competency,
              modules: competency.modules.map((module) =>
                module.id === moduleId ? { ...module, [field]: value } : module
              ),
            }
          : competency
      )
    );
  };

  const handleNextFiveModulesChange = (competencyId: number, index: number, value: string) => {
    setEditCompetencyData((prev) =>
      prev.map((competency) =>
        competency.id === competencyId
          ? {
              ...competency,
              next_five_modules: competency.next_five_modules.map((module, i) =>
                i === index ? value : module
              ),
            }
          : competency
      )
    );
  };

  const handleSaveProfile = async () => {
    if (!editFormData.email || !editFormData.full_name) {
      showToast("Email and full name are required", "error");
      return;
    }
    setSaving(true);
    try {
      const userPayload = {
        email: editFormData.email,
        full_name: editFormData.full_name,
        role: editFormData.role,
        is_active: editFormData.is_active,
        paid_holidays: editFormData.paid_holidays,
        contract_signing_date: editFormData.contract_signing_date || null,
        rota_start_date: editFormData.rota_start_date || null,
        avatar: editFormData.avatar || null, // Include avatar in userPayload
      };
      const userResponse = await fetch(`${API_URL}/users/${driverData?.user.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(userPayload),
      });
      if (!userResponse.ok) {
        throw new Error("Failed to update user profile");
      }
      const driverPayload = {
        user_id: driverData?.user.id,
        phone: editFormData.phone,
        address: editFormData.address,
        date_of_birth: editFormData.date_of_birth,
        next_of_kin_name: editFormData.next_of_kin_name,
        next_of_kin_relationship: editFormData.next_of_kin_relationship,
        next_of_kin_contact: editFormData.next_of_kin_contact,
        next_of_kin_email: editFormData.next_of_kin_email,
        next_of_kin_address: editFormData.next_of_kin_address,
        have_other_jobs: editFormData.have_other_jobs,
        have_other_jobs_note: editFormData.have_other_jobs_note,
      };
      const driverResponse = await fetch(`${API_URL}/api/profiles/driver/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(driverPayload),
      });
      if (!driverResponse.ok) {
        throw new Error("Failed to update driver profile");
      }
      const userResult = await userResponse.json();
      const driverResult = await driverResponse.json();
      if (userResult.success && driverResult.success) {
        setDriverData((prev) =>
          prev
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  email: editFormData.email,
                  full_name: editFormData.full_name,
                  role: editFormData.role,
                  is_active: editFormData.is_active,
                  paid_holidays: editFormData.paid_holidays,
                  contract_signing_date: editFormData.contract_signing_date,
                  rota_start_date: editFormData.rota_start_date,
                  contract: contracts.find((c) => c.id.toString() === editFormData.contractId) || prev.user.contract,
                  site: sites.filter((s) => editFormData.siteIds.includes(s.id.toString())),
                  avatar: editFormData.avatar || prev.user.avatar, // Update avatar in driverData
                },
                phone: editFormData.phone,
                address: editFormData.address,
                date_of_birth: editFormData.date_of_birth,
                next_of_kin_name: editFormData.next_of_kin_name,
                next_of_kin_relationship: editFormData.next_of_kin_relationship,
                next_of_kin_contact: editFormData.next_of_kin_contact,
                next_of_kin_email: editFormData.next_of_kin_email,
                next_of_kin_address: editFormData.next_of_kin_address,
                have_other_jobs: editFormData.have_other_jobs,
                have_other_jobs_note: editFormData.have_other_jobs_note,
              }
            : null
        );
        setIsEditing(false);
        showToast("Profile updated successfully", "success");
      } else {
        throw new Error(userResult.message || driverResult.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error instanceof Error ? error.message : "Failed to update profile");
      showToast(error instanceof Error ? error.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealth = async () => {
    setSavingHealth(true);
    try {
      const updates = editHealthData.map((item) => ({
        id: item.id,
        answer: item.answer,
        note: item.note,
      }));
      const response = await fetch(`${API_URL}/api/profiles/health-answers/bulk-update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ health_answers: updates }),
      });
      if (!response.ok) {
        throw new Error("Failed to update health answers");
      }
      const result = await response.json();
      if (result.success) {
        setHealthData(editHealthData);
        setIsEditingHealth(false);
        showToast("Health answers updated successfully", "success");
        fetchHealthData();
      } else {
        throw new Error(result.message || "Failed to update health answers");
      }
    } catch (error) {
      console.error("Error updating health answers:", error);
      showToast(error instanceof Error ? error.message : "Failed to update health answers", "error");
    } finally {
      setSavingHealth(false);
    }
  };

  const handleSaveCompetency = async () => {
    setSavingCompetency(true);
    try {
      const updates = editCompetencyData.map((item) => ({
        id: item.id,
        request_status: item.request_status,
        expiry_date: item.expiry_date,
        description: item.description,
        urls: item.urls,
        has_document: item.has_document,
        has_back_side: item.has_back_side,
        next_five_modules: item.next_five_modules,
        modules: item.modules.map((module) => ({
          id: module.id,
          module_name: module.module_name,
          description: module.description,
          expiry_date: module.expiry_date,
        })),
      }));
      const response = await fetch(`${API_URL}/api/profiles/professional-competency/bulk-update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ professional_competencies: updates }),
      });
      if (!response.ok) {
        throw new Error("Failed to update professional competencies");
      }
      const result = await response.json();
      if (result.success) {
        setCompetencyData(editCompetencyData);
        setIsEditingCompetency(false);
        showToast("Professional competencies updated successfully", "success");
        fetchCompetencyData();
      } else {
        throw new Error(result.message || "Failed to update professional competencies");
      }
    } catch (error) {
      console.error("Error updating professional competencies:", error);
      showToast(error instanceof Error ? error.message : "Failed to update professional competencies", "error");
    } finally {
      setSavingCompetency(false);
    }
  };

  if (loading || competencyLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600"></div>
      </div>
    );
  }
  if (error || !driverData || competencyError || healthError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md shadow-xl bg-white rounded-xl">
          <h2 className="text-2xl text-orange-600">Error</h2>
          <p className="text-gray-700">{error || competencyError || healthError || "Driver not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-8 space-y-8 bg-gray-100 min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="sticky top-0 z-10 grid h-[70px] w-full grid-cols-4 bg-white border border-purple-200 rounded-xl p-2 shadow-sm">
          <TabsTrigger
            value="driver-detail"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Driver Detail
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="professional-competency"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Professional Competency
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="health-answer"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Health Answer
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="sign-agreement"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Sign Agreement
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
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
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            steps={steps}
            getInitials={getInitials}
            formatDate={formatDate}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
            handleAssignContract={handleAssignContract}
            handleAssignSites={handleAssignSites}
            contractsLoading={contractsLoading}
            sitesLoading={sitesLoading}
            assigningContract={assigningContract}
            assigningSites={assigningSites}
          />
        </TabsContent>
        <TabsContent value="professional-competency">
          <ProfessionalCompetencyTab
            competencyData={competencyData}
            editCompetencyData={editCompetencyData}
            isEditingCompetency={isEditingCompetency}
            savingCompetency={savingCompetency}
            formatDate={formatDate}
            isPdfUrl={isPdfUrl}
            selectedPdfUrl={selectedPdfUrl}
            setSelectedPdfUrl={setSelectedPdfUrl}
            handleCompetencyEditToggle={handleCompetencyEditToggle}
            handleCompetencyInputChange={handleCompetencyInputChange}
            handleModuleInputChange={handleModuleInputChange}
            handleFileUpload={handleFileUpload}
            handleSaveCompetency={handleSaveCompetency}
            handleNextFiveModulesChange={handleNextFiveModulesChange}
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
          <SignAgreementTab
            driverData={driverData}
            formatDate={formatDate}
            showToast={showToast}
          />
        </TabsContent>
      </Tabs>
      <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2">
        {isEditing ? (
          <>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all w-48"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleEditToggle}
              disabled={saving}
              className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg transition-all w-48"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleEditToggle}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all w-48"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
            {driverData.profile_status !== "approved" && (
              <Button
                onClick={() => handleApproveDriverClick(driverData.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all w-48"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Driver
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}