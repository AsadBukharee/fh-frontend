"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Shield, FileText, Building2, Mail, CheckCircle, XCircle, Edit, Save, X } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import { toast } from "sonner";

interface DriverData {
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
  contract: { id: number; name: string; description: string };
  role: string;
  site: Array<{ id: number; name: string; status: string; image: string }>;
  shifts_count: number;
  avatar: string;
  aggregated_permissions: {
    resources: Array<{ id: number; name: string }>;
    roles: Array<{
      id: number;
      name: string;
      permissions: Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }>;
    }>;
  };
  profile_status?: string;
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

export default function DriverDetailPage() {
  const { id } = useParams();
  const cookies = useCookies();
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    display_name: "",
    email: "",
    paid_holidays: 0,
    contractId: "",
    siteIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [assigningContract, setAssigningContract] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [assigningSites, setAssigningSites] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch driver data");
      const result = await response.json();
      if (result.success) {
        setDriverData(result.data);
        setEditFormData({
          full_name: result.data.full_name,
          display_name: result.data.display_name,
          email: result.data.email,
          paid_holidays: result.data.paid_holidays,
          contractId: result.data.contract?.id?.toString() || "",
          siteIds: result.data.site.map((site: Site) => site.id.toString()),
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

  useEffect(() => {
    if (id) fetchData();
  }, [id, cookies]);
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
  useEffect(() => {


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
        body: JSON.stringify({ user_ids: [Number(id)] }),
      });
      if (!response.ok) throw new Error("Failed to assign contract");
      const result = await response.json();
      if (result.id) {
        toast("Contract assigned successfully");
        fetchData();
        fetchContracts()
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
      const response = await fetch(`${API_URL}/users/${id}/allocate-sites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ site_ids: selectedSiteIds.map(Number) }),
      });
      if (!response.ok) throw new Error("Failed to assign sites");
      const result = await response.json();
      alert("Sites assigned successfully");
      fetchData();
    } catch (error) {
      console.error("Error assigning sites:", error);
      showToast(error instanceof Error ? error.message : "Failed to assign sites", "error");
    } finally {
      setAssigningSites(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditFormData({
        full_name: driverData?.full_name || "",
        display_name: driverData?.display_name || "",
        email: driverData?.email || "",
        paid_holidays: driverData?.paid_holidays || 0,
        contractId: driverData?.contract?.id?.toString() || "",
        siteIds: driverData?.site.map((site) => site.id.toString()) || [],
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          ...editFormData,
          siteIds: editFormData.siteIds.map((id) => Number(id)),
        }),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      const result = await response.json();
      if (result.success) {
        setDriverData((prev) =>
          prev
            ? {
              ...prev,
              ...editFormData,
              contract: contracts.find((c) => c.id.toString() === editFormData.contractId) || prev.contract,
              site: sites.filter((s) => editFormData.siteIds.includes(s.id.toString())),
            }
            : null
        );
        setIsEditing(false);
        showToast("Profile updated successfully", "success");
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveDriverClick = async (driverId: number) => {
    try {
      const response = await fetch(`${API_URL}/users/${driverId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to approve driver");
      const result = await response.json();
      if (result.success) {
        showToast("Driver approved successfully", "success");
        fetchData();
      } else {
        throw new Error(result.message || "Failed to approve driver");
      }
    } catch (error) {
      console.error("Error approving driver:", error);
      showToast(error instanceof Error ? error.message : "Failed to approve driver", "error");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => formatToDDMMYYYY(dateString);

  const getPermissionStats = () => {
    const role = driverData?.aggregated_permissions.roles[0];
    if (!role) return { total: 0, granted: 0 };
    const permissions = Object.values(role.permissions);
    const total = permissions.length * 4;
    const granted = permissions.reduce(
      (acc, perm) => acc + (perm.view ? 1 : 0) + (perm.create ? 1 : 0) + (perm.update ? 1 : 0) + (perm.delete ? 1 : 0),
      0
    );
    return { total, granted };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !driverData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-orange-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">{error || "Driver not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const permissionStats = getPermissionStats();
  const permissionPercentage = permissionStats.total > 0 ? (permissionStats.granted / permissionStats.total) * 100 : 0;

  return (
    <div className="container p-8 space-y-8 bg-gray-100 min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="sticky top-0 z-10 grid h-[70px] w-full grid-cols-3 bg-white border border-orange-200 rounded-xl p-2 shadow-sm">
          <TabsTrigger
            value="overview"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-orange-100"
          >
            Overview
            <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="contract"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-orange-100"
          >
            Contract
            <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="sites"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-orange-100"
          >
            Sites
            <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={driverData.avatar || "/placeholder.svg"} alt={driverData.full_name} />
              <AvatarFallback className="text-lg font-semibold bg-orange-100 text-orange-800">
                {getInitials(driverData.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-orange-800 text-balance">{driverData.full_name}</h1>
                <Badge
                  variant={driverData.is_active ? "default" : "secondary"}
                  className={driverData.is_active ? "bg-orange-600 text-white" : "bg-orange-200 text-orange-800"}
                >
                  {driverData.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{driverData.role}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{driverData.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-evenly items-center gap-4">
            <Card className="w-[200px] border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">Total Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{driverData.shifts_count}</div>
              </CardContent>
            </Card>
            <Card className="w-[200px] border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">Paid Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{driverData.paid_holidays}</div>
              </CardContent>
            </Card>
            <Card className="w-[200px] border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">Rota Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {driverData.parent_rota_completed && driverData.child_rota_completed ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-orange-800">Complete</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-500">Pending</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <User className="h-5 w-5 text-orange-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-orange-600">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editFormData.full_name}
                          onChange={(e) => handleInputChange("full_name", e.target.value)}
                          placeholder="Enter full name"
                          className="border-orange-300 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name" className="text-orange-600">Display Name</Label>
                        <Input
                          id="display_name"
                          value={editFormData.display_name}
                          onChange={(e) => handleInputChange("display_name", e.target.value)}
                          placeholder="Enter display name"
                          className="border-orange-300 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-orange-600">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="Enter email address"
                          className="border-orange-300 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paid_holidays" className="text-orange-600">Paid Holidays</Label>
                        <Input
                          id="paid_holidays"
                          type="number"
                          value={editFormData.paid_holidays}
                          onChange={(e) => handleInputChange("paid_holidays", Number.parseInt(e.target.value) || 0)}
                          placeholder="Enter paid holidays"
                          className="border-orange-300 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract" className="text-orange-600">Contract</Label>
                        <Select
                          value={editFormData.contractId}
                          onValueChange={(value) => handleInputChange("contractId", value)}
                          disabled={contractsLoading}
                        >
                          <SelectTrigger id="contract" className="border-orange-300 focus:ring-orange-500">
                            <SelectValue placeholder="Select a contract" />
                          </SelectTrigger>
                          <SelectContent>
                            {contracts.map((contract) => (
                              <SelectItem key={contract.id} value={contract.id.toString()}>
                                {contract.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sites" className="text-orange-600">Sites</Label>
                        <Select
                          value={editFormData.siteIds[0] || ""}
                          onValueChange={(value) => handleInputChange("siteIds", Array.isArray(value) ? value : [value])}
                          disabled={sitesLoading}
                        >
                          <SelectTrigger id="sites" className="border-orange-300 focus:ring-orange-500">
                            <SelectValue placeholder="Select sites" />
                          </SelectTrigger>
                          <SelectContent>
                            {sites.map((site) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-orange-600">Role</Label>
                      <p className="font-medium text-orange-800">{driverData.role} (Read-only)</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-black">Full Name</Label>
                      <p className="font-medium text-gray-500">{driverData.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-black">Display Name</Label>
                      <p className="font-medium text-gray-500">{driverData.display_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-black">Email</Label>
                      <p className="font-medium text-gray-500">{driverData.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-black">Role</Label>
                      <p className="font-medium text-gray-500">{driverData.role}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-black">Contract Signing Date</Label>
                  <p className="font-medium text-gray-500">{formatDate(driverData.contract_signing_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black">Rota Start Date</Label>
                  <p className="font-medium text-gray-500">{formatDate(driverData.rota_start_date)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contract" className="space-y-4">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <FileText className="h-5 w-5 text-orange-600" />
                Contract Details
              </CardTitle>
              <CardDescription className="text-gray-500">Contract information and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-800">Assign New Contract</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="assign_contract" className="text-black">Select Contract</Label>
                    <Select
                      value={selectedContractId}
                      onValueChange={setSelectedContractId}
                      disabled={contractsLoading || assigningContract}
                    >
                      <SelectTrigger id="assign_contract" className="border-orange-300 focus:ring-orange-500">
                        <SelectValue placeholder="Select a contract to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id.toString()}>
                            {contract.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAssignContract}
                    disabled={assigningContract || !selectedContractId}
                    className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300 disabled:text-orange-500"
                  >
                    {assigningContract ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-200 mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Assign Contract
                  </Button>
                </div>
              </div>
              <Separator className="bg-orange-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black">Contract ID</Label>
                  <p className="font-medium text-gray-500">{driverData.contract?.id || "Not assigned"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black">Contract Name</Label>
                  <p className="font-medium text-gray-500">{driverData.contract?.name || "Not assigned"}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-black">Description</Label>
                <p className="font-medium text-gray-500">{driverData.contract?.description || "No description available"}</p>
              </div>
              <Separator className="bg-orange-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black">Signing Date</Label>
                  <p className="font-medium text-gray-500">
                    {driverData.contract_signing_date ? formatDate(driverData.contract_signing_date) : "Not assigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black">Paid Holidays</Label>
                  <p className="font-medium text-gray-500">{driverData.paid_holidays} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites" className="space-y-4">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Building2 className="h-5 w-5 text-orange-600" />
                Assigned Sites
              </CardTitle>
              <CardDescription className="text-orange-600">Sites where this driver is authorized to work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-800">Assign New Sites</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-black">Select Sites</Label>
                    <div className="border border-orange-200 rounded-md p-2 max-h-60 overflow-y-auto">
                      {sites.map((site) => (
                        <div key={site.id} className="flex border-b border-orange-100 items-center space-x-2 p-2">
                          <input
                            type="checkbox"
                            id={`site-${site.id}`}
                            checked={selectedSiteIds.includes(site.id.toString())}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSiteIds([...selectedSiteIds, site.id.toString()]);
                              } else {
                                setSelectedSiteIds(selectedSiteIds.filter((id) => id !== site.id.toString()));
                              }
                            }}
                            disabled={sitesLoading || assigningSites}
                            className="text-orange-600"
                          />
                          <label htmlFor={`site-${site.id}`} className="text-sm text-gray-500">
                            {site.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleAssignSites}
                    disabled={assigningSites || selectedSiteIds.length === 0}
                    className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300 disabled:text-orange-500"
                  >
                    {assigningSites ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-200 mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Assign Sites
                  </Button>
                </div>
              </div>
              <Separator className="bg-orange-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {driverData.site.map((site) => (
                  <Card key={site.id} className="overflow-hidden border-orange-200">

                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-orange-800">{site.name}</h3>
                        <Badge
                          variant={site.status === "active" ? "default" : "secondary"}
                          className={site.status === "active" ? "bg-orange-600 text-white" : "bg-orange-200 text-orange-800"}
                        >
                          {site.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-600 mt-1">Site ID: {site.id}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2">
        {isEditing ? (
          <>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all w-48"
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
              className="border-orange-600 text-orange-600 hover:bg-orange-100 rounded-lg transition-all w-48"
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

          </div>
        )}
      </div>
    </div>
  );
}