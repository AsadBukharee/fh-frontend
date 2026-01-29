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

  // FIXED: Updated editFormData structure to match DriverDetailTab expectations
  const [editFormData, setEditFormData] = useState({
    // Basic driver info
    first_name: "",
    last_name: "",
    date_of_birth: "",
    address: "",
    phone: "",
    national_insurance_no: "",
    post_code: "",
    email: "",
    avatar: "",

    // Next of kin
    next_of_kin_first_name: "",
    next_of_kin_last_name: "",
    next_of_kin_contact: "",
    next_of_kin_email: "",
    next_of_kin_address: "",
    next_of_kin_relationship: "",

    // Other fields
    account_no: "",
    sort_code: "",
    have_other_jobs: false,
    have_other_jobs_note: "",
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

  // Add state for disapproval dialog
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false);
  const [disapproveRemarks, setDisapproveRemarks] = useState("");
  const [isDisapproving, setIsDisapproving] = useState(false);

  const isPdfUrl = (url: string) => url.toLowerCase().endsWith(".pdf");
  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`);
    // You can replace this with your actual toast implementation
    alert(`${type.toUpperCase()}: ${message}`);
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

        // FIXED: Initialize editFormData with proper structure
        const fullNameParts = result.data.user.full_name?.split(" ") || [];
        const nextOfKinParts = result.data.next_of_kin_name?.split(" ") || [];

        setEditFormData({
          // Basic driver info
          first_name: fullNameParts[0] || "",
          last_name: fullNameParts.slice(1).join(" ") || "",
          date_of_birth: result.data.date_of_birth || "",
          address: result.data.address || "",
          phone: result.data.phone || "",
          national_insurance_no: result.data.national_insurance_no || "",
          post_code: result.data.post_code || "",
          email: result.data.user.email || "",
          avatar: result.data.user.avatar || "",

          // Next of kin
          next_of_kin_first_name: nextOfKinParts[0] || "",
          next_of_kin_last_name: nextOfKinParts.slice(1).join(" ") || "",
          next_of_kin_contact: result.data.next_of_kin_contact || "",
          next_of_kin_email: result.data.next_of_kin_email || "",
          next_of_kin_address: result.data.next_of_kin_address || "",
          next_of_kin_relationship: result.data.next_of_kin_relationship || "",

          // Other fields
          account_no: result.data.account_no || "",
          sort_code: result.data.sort_code || "",
          have_other_jobs: result.data.have_other_jobs || false,
          have_other_jobs_note: result.data.have_other_jobs_note || "",
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

  const handleResendActivation = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/auth/resend-activation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        return;
      }

      if (response.ok && data.success) {
        showToast("Activation email resent successfully", "success");
      } else {
        showToast(data.message || "Failed to resend activation email", "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while resending activation email";
      showToast(errorMessage, "error");
    }
  };

  // Add disapproval handler function
  const handleDisapproveDriver = async () => {
    if (!disapproveRemarks.trim()) {
      showToast("Please provide remarks for disapproval", "error");
      return;
    }

    setIsDisapproving(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/disapprove/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          driver_id: driverData?.id,
          remarks: disapproveRemarks,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Driver disapproved successfully", "success");
        // Reset dialog state
        setDisapproveRemarks("");
        setIsDisapproveDialogOpen(false);
        // Refresh driver data
        await fetchData();
      } else {
        showToast(data.message || "Failed to disapprove driver", "error");
      }
    } catch (error) {
      console.error("Error disapproving driver:", error);
      showToast(error instanceof Error ? error.message : "Failed to disapprove driver", "error");
    } finally {
      setIsDisapproving(false);
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
  }, [cookies]);

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

  const handleApproveDriverClick = async (driverId: number | undefined) => {
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
    if (!isEditing) {
      // Entering edit mode - populate form with current data
      if (driverData) {
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
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleHealthEditToggle = () => {
    if (isEditingHealth) {
      setEditHealthData(healthData);
    }
    setIsEditingHealth(!isEditingHealth);
  };

  // FIXED: Updated handleInputChange to work with the new editFormData structure
  const handleInputChange = (field: string, value: string | number | boolean) => {
    console.log(`Input changed: ${field} = ${value}`); // Debug log
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

  // FIXED: Updated handleSaveProfile to use the new structure
  const handleSaveProfile = async () => {
    if (!editFormData.email || !editFormData.first_name || !editFormData.last_name) {
      showToast("Email, first name, and last name are required", "error");
      return;
    }

    setSaving(true);
    try {
      // Prepare user payload
      const userPayload = {
        email: editFormData.email,
        full_name: `${editFormData.first_name} ${editFormData.last_name}`.trim(),
        avatar: editFormData.avatar || null,
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

      // Prepare driver payload
      const driverPayload = {
        phone: editFormData.phone,
        address: editFormData.address,
        date_of_birth: editFormData.date_of_birth,
        national_insurance_no: editFormData.national_insurance_no,
        post_code: editFormData.post_code,
        next_of_kin_name: `${editFormData.next_of_kin_first_name} ${editFormData.next_of_kin_last_name}`.trim(),
        next_of_kin_relationship: editFormData.next_of_kin_relationship,
        next_of_kin_contact: editFormData.next_of_kin_contact,
        next_of_kin_email: editFormData.next_of_kin_email,
        next_of_kin_address: editFormData.next_of_kin_address,
        account_no: editFormData.account_no,
        sort_code: editFormData.sort_code,
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
                full_name: `${editFormData.first_name} ${editFormData.last_name}`.trim(),
                avatar: editFormData.avatar || prev.user.avatar,
              },
              phone: editFormData.phone,
              address: editFormData.address,
              date_of_birth: editFormData.date_of_birth,
              national_insurance_no: editFormData.national_insurance_no,
              post_code: editFormData.post_code,
              next_of_kin_name: `${editFormData.next_of_kin_first_name} ${editFormData.next_of_kin_last_name}`.trim(),
              next_of_kin_relationship: editFormData.next_of_kin_relationship,
              next_of_kin_contact: editFormData.next_of_kin_contact,
              next_of_kin_email: editFormData.next_of_kin_email,
              next_of_kin_address: editFormData.next_of_kin_address,
              account_no: editFormData.account_no,
              sort_code: editFormData.sort_code,
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
        <div className="w-full max-w-md shadow-xl bg-white rounded-xl">
          <h2 className="text-2xl text-orange-600">Error</h2>
          <p className="text-gray-700">{error || competencyError || healthError || "Driver not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-8 space-y-8 bg-white min-h-screen">
      {/* Disapprove Driver Dialog */}
      <Dialog open={isDisapproveDialogOpen} onOpenChange={setIsDisapproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Disapprove Driver
            </DialogTitle>
            <DialogDescription>
              Please provide remarks for disapproving this driver. This action will be recorded and the driver will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks *</Label>
              <Textarea
                id="remarks"
                placeholder="Enter the reason for disapproval..."
                value={disapproveRemarks}
                onChange={(e) => setDisapproveRemarks(e.target.value)}
                className="min-h-[120px]"
                required
              />
              <p className="text-sm text-gray-500">
                Example: &quot;Rejected, because the provided documents are unclear.&quot;
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDisapproveDialogOpen(false);
                setDisapproveRemarks("");
              }}
              disabled={isDisapproving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleDisapproveDriver}
              disabled={isDisapproving || !disapproveRemarks.trim()}
            >
              {isDisapproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Disapproving...
                </>
              ) : (
                "Disapprove Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="flex justify-start w-full gap-8 bg-[#f9f9f9] py-8 px-6">
          <TabsTrigger
            value="driver-detail"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 
              data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F]
              transition-colors"
          >
            <User size={16} className="text-gray-400  data-[state=active]:text-[#F15A29] " />
            Driver Details
          </TabsTrigger>

          <TabsTrigger
            value="professional-competency"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 
              data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F]
              transition-colors"
          >
            <BadgeCheck size={16} className="text-gray-400 data-[state=active]:text-orange-600" />
            Professional Details
          </TabsTrigger>

          <TabsTrigger
            value="health-answer"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 
              data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F]
              transition-colors"
          >
            <HeartPulse size={16} className="text-gray-400 data-[state=active]:text-orange-600" />
            Health Questions
          </TabsTrigger>

          <TabsTrigger
            value="sign-agreement"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 
              data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F]
              transition-colors"
          >
            <FileSignature size={16} className="text-gray-400 data-[state=active]:text-orange-600" />
            Signed Agreement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="driver-detail">

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
              handleEditToggle={handleEditToggle} // <-- Add this line
              handleSaveProfile={handleSaveProfile}
              saving={saving}
            />
          </TabsContent>
        </TabsContent>
        <TabsContent value="professional-competency">
          <ProfessionalCompetencyTab
            competencyData={competencyData}
            formatDate={formatDate}
            driverId={driverData.id}
            driverName={driverData.user.full_name}
            licenseNumber={driverData.license_number}
            licenseIssueNumber={driverData.license_issue_number}
            isPdfUrl={isPdfUrl}
            showToast={showToast}
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

      <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2">
        {isEditing ? null : (
          <div className="flex flex-col gap-2">

            {driverData.profile_status === "approved" && (
              <Button
                onClick={() => setIsDisapproveDialogOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg transition-all w-48"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Disapprove Driver
              </Button>
            )}
            {driverData.profile_status !== "approved" && (
              <Button
                onClick={() => handleApproveDriverClick(driverData.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all w-48"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Driver
              </Button>
            )}
            {driverData.profile_status !== "approved" && (
              <Button
                onClick={() => handleResendActivation(driverData.user.id as unknown as number)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all w-48"
              >
                <Mail className="h-5 w-5 mr-2" />
                Resend Email
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}