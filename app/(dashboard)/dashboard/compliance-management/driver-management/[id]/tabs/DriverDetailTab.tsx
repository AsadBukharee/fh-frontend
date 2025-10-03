"use client";
import { useState, useEffect } from "react";
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
import { Save, User, Calendar, Phone, MapPin, AlertTriangle } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "@/components/Media/UploadImage";

interface DriverDetailTabProps {
  driverData: any;
  editFormData: any;
  contracts: any[];
  sites: any[];
  selectedContractId: string;
  setSelectedContractId: (id: string) => void;
  selectedSiteIds: string[];
  setSelectedSiteIds: (ids: string[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: string[];
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
}

interface Manager {
  id: number;
  full_name: string;
  avatar: string | null;
  email: string;
  sites: Array<{
    id: number;
    name: string;
  }>;
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

export default function DriverDetailTab({
  driverData,
  editFormData,
  contracts,
  sites,
  selectedContractId,
  setSelectedContractId,
  selectedSiteIds,
  setSelectedSiteIds,
  currentStep,
  setCurrentStep,
  steps,
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
}: DriverDetailTabProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [assigningManager, setAssigningManager] = useState(false);
  const [assigningDate, setAssigningDate] = useState(new Date().toISOString().split("T")[0]); // Today's date as default
  const [brightHRData, setBrightHRData] = useState<BrightHRAssignment[]>([]);
  const [brightHRLLoading, setBrightHRLLoading] = useState(true);
  const cookies = useCookies();

  // Fetch managers
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
        if (!response.ok) {
          throw new Error("Failed to fetch managers");
        }
        const data = await response.json();
        if (data.success) {
          setManagers(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching managers:", error);
      } finally {
        setManagersLoading(false);
      }
    };

    fetchManagers();
  }, [API_URL, cookies]);

  // Fetch existing BrightHR assignments for the driver
  useEffect(() => {
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
        if (!response.ok) {
          throw new Error("Failed to fetch BrightHR assignments");
        }
        const data = await response.json();
        if (data.success) {
          setBrightHRData(data.data?.results || []);
        }
      } catch (error) {
        console.error("Error fetching BrightHR assignments:", error);
      } finally {
        setBrightHRLLoading(false);
      }
    };

    fetchBrightHR();
  }, [driverData?.user?.id, API_URL, cookies]);

  // Handle BrightHR manager assignment
  const handleAssignBrightHRManager = async () => {
    if (!selectedManagerId) {
      console.error("No manager selected");
      return;
    }
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
          bright_user: driverData.user.id, // Use driverData.user.id as bright_user
          assigning_date: assigningDate,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to assign manager in BrightHR");
      }
      const data = await response.json();
      if (data.success) {
        console.log("BrightHR manager assigned successfully:", data);
        // Reset form
        setSelectedManagerId("");
        setAssigningDate(new Date().toISOString().split("T")[0]);
        // Refetch to update UI
        await fetchBrightHR(); // Reuse the fetch function from useEffect (defined above as inner function, but extracted for reuse)
      } else {
        console.error("Assignment failed:", data.message);
      }
    } catch (error) {
      console.error("Error assigning BrightHR manager:", error);
    } finally {
      setAssigningManager(false);
    }
  };

  // Handle successful image upload (for profile)
  const handleImageUploadSuccess = (url: string) => {
    handleInputChange("avatar", url); // Update editFormData with the new avatar URL
  };

  // Extract fetchBrightHR for reuse
  const fetchBrightHR = async () => {
    if (!driverData?.user?.id) return;
    setBrightHRLLoading(true);
    try {
      const response = await fetch(`${API_URL}/brighthr/?bright_user_id=${driverData.user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch BrightHR assignments");
      }
      const data = await response.json();
      if (data.success) {
        setBrightHRData(data.data?.results || []);
      }
    } catch (error) {
      console.error("Error fetching BrightHR assignments:", error);
    } finally {
      setBrightHRLLoading(false);
    }
  };

  if (brightHRLLoading) {
    return <div className="p-4 text-center">Loading BrightHR data...</div>; // Simple loader; replace with skeleton if needed
  }

  return (
    <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-purple-800">Driver Detail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex mb-8 border-b border-purple-200 pb-4">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`flex-1 text-center cursor-pointer transition-all ${
                index === currentStep ? "font-bold text-purple-800 border-b-2 border-purple-600" : "text-gray-600"
              }`}
              onClick={() => setCurrentStep(index)}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="space-y-8">
          {currentStep === 0 && (
            <div className="flex">
              <div className="space-y-6">
                <div className="flex items-start gap-8">
                  <Avatar className="h-28 w-28 ring-4 ring-purple-200">
                    <AvatarImage
                      src={isEditing ? editFormData.avatar || driverData.user.avatar || "/placeholder.svg" : driverData.user.avatar || "/placeholder.svg"}
                      alt={driverData.user.full_name}
                    />
                    <AvatarFallback className="text-xl font-bold bg-purple-100 text-purple-800">
                      {getInitials(driverData.user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <h1 className="text-4xl font-bold text-purple-800">{driverData.user.full_name}</h1>
                      <Badge
                        className={`px-3 py-1 text-sm font-medium ${
                          driverData.user.is_active
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-gray-400 hover:bg-gray-500"
                        } text-white rounded-full transition-colors`}
                      >
                        {driverData.user.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        className={`px-3 py-1 text-sm font-medium ${
                          driverData.profile_status === "approved"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-orange-600 hover:bg-orange-700"
                        } text-white rounded-full transition-colors`}
                      >
                        {driverData.profile_status.charAt(0).toUpperCase() + driverData.profile_status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        <span className="text-sm">{driverData.user.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{driverData.user.email}</span>
                      </div>
                    </div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <span>Warnings</span>
                            {driverData.warnings?.length > 0 && (
                              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                                {driverData.warnings.length}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {driverData.warnings?.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {driverData.warnings.map((warning: string, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 shadow-sm"
                                >
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                                  <span>{warning}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-2">No warnings for this driver.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
                <Separator className="bg-purple-200" />
                <div className="flex w-full gap-4">
                  {isEditing && (
                    <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 rounded-xl flex-1">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-purple-800">Account Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Image Uploader */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Profile Image</Label>
                            <ImageUploader onUploadSuccess={handleImageUploadSuccess} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="full_name" className="text-sm font-semibold text-gray-600">
                                Full Name
                              </Label>
                              <Input
                                id="full_name"
                                value={editFormData.full_name}
                                onChange={(e) => handleInputChange("full_name", e.target.value)}
                                placeholder="Enter full name"
                                className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="display_name" className="text-sm font-semibold text-gray-600">
                                Display Name
                              </Label>
                              <Input
                                id="display_name"
                                value={editFormData.display_name}
                                onChange={(e) => handleInputChange("display_name", e.target.value)}
                                placeholder="Enter display name"
                                className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-semibold text-gray-600">
                                Email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="Enter email address"
                                className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="is_active" className="text-sm font-semibold text-gray-600">
                                Active Status
                              </Label>
                              <Select
                                value={editFormData.is_active.toString()}
                                onValueChange={(value) => handleInputChange("is_active", value === "true")}
                              >
                                <SelectTrigger
                                  id="is_active"
                                  className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                                >
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Active</SelectItem>
                                  <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 rounded-xl flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-purple-800">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-600">
                              Phone
                            </Label>
                            <Input
                              id="phone"
                              type="tel" // Changed to tel for better mobile UX
                              maxLength={11}
                              value={editFormData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="Enter phone number"
                              className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-semibold text-gray-600">
                              Address
                            </Label>
                            <Input
                              id="address"
                              value={editFormData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              placeholder="Enter address"
                              className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date_of_birth" className="text-sm font-semibold text-gray-600">
                              Date of Birth
                            </Label>
                            <Input
                              id="date_of_birth"
                              type="date"
                              value={editFormData.date_of_birth}
                              onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                              className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-purple-600" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500">Phone</Label>
                              <p className="font-medium text-purple-800">{driverData.phone || "Not provided"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-purple-600" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500">Address</Label>
                              <p className="font-medium text-purple-800">{driverData.address || "Not provided"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <div>
                              <Label className="text-xs font-semibold text-gray-500">Date of Birth</Label>
                              <p className="font-medium text-purple-800">{formatDate(driverData.date_of_birth)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_name" className="text-sm font-semibold text-gray-600">
                      Name
                    </Label>
                    <Input
                      id="next_of_kin_name"
                      value={editFormData.next_of_kin_name}
                      onChange={(e) => handleInputChange("next_of_kin_name", e.target.value)}
                      placeholder="Enter next of kin name"
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_relationship" className="text-sm font-semibold text-gray-600">
                      Relationship
                    </Label>
                    <Input
                      id="next_of_kin_relationship"
                      value={editFormData.next_of_kin_relationship}
                      onChange={(e) => handleInputChange("next_of_kin_relationship", e.target.value)}
                      placeholder="Enter relationship"
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_contact" className="text-sm font-semibold text-gray-600">
                      Contact
                    </Label>
                    <Input
                      id="next_of_kin_contact"
                      type="tel"
                      value={editFormData.next_of_kin_contact}
                      onChange={(e) => handleInputChange("next_of_kin_contact", e.target.value)}
                      placeholder="Enter contact number"
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_of_kin_email" className="text-sm font-semibold text-gray-600">
                      Email
                    </Label>
                    <Input
                      id="next_of_kin_email"
                      type="email"
                      value={editFormData.next_of_kin_email}
                      onChange={(e) => handleInputChange("next_of_kin_email", e.target.value)}
                      placeholder="Enter email address"
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="next_of_kin_address" className="text-sm font-semibold text-gray-600">
                      Address
                    </Label>
                    <Input
                      id="next_of_kin_address"
                      value={editFormData.next_of_kin_address}
                      onChange={(e) => handleInputChange("next_of_kin_address", e.target.value)}
                      placeholder="Enter address"
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Name</Label>
                    <p className="font-medium text-purple-800">{driverData.next_of_kin_name || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Relationship</Label>
                    <p className="font-medium text-purple-800">{driverData.next_of_kin_relationship || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Contact</Label>
                    <p className="font-medium text-purple-800">{driverData.next_of_kin_contact || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Email</Label>
                    <p className="font-medium text-purple-800">{driverData.next_of_kin_email || "Not provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold text-gray-600">Address</Label>
                    <p className="font-medium text-purple-800">{driverData.next_of_kin_address || "Not provided"}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-800">Contract Details</h3>
                <div className="flex items-end gap-6">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="assign_contract" className="text-sm font-semibold text-gray-600">
                      Select Contract
                    </Label>
                    <Select
                      value={selectedContractId}
                      onValueChange={setSelectedContractId}
                      disabled={contractsLoading || assigningContract}
                    >
                      <SelectTrigger
                        id="assign_contract"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                      >
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
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
                  >
                    {assigningContract ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Assign Contract
                  </Button>
                </div>
              </div>
              <Separator className="bg-purple-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Contract Name</Label>
                  <p className="font-medium text-purple-800">{driverData.user.contract?.name || "Not assigned"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Contract Signing Date</Label>
                  {isEditing ? (
                    <Input
                      id="contract_signing_date"
                      type="date"
                      value={editFormData.contract_signing_date}
                      onChange={(e) => handleInputChange("contract_signing_date", e.target.value)}
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  ) : (
                    <p className="font-medium text-purple-800">{formatDate(driverData.user.contract_signing_date)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Paid Holidays</Label>
                  {isEditing ? (
                    <Input
                      id="paid_holidays"
                      type="number"
                      value={editFormData.paid_holidays || 0}
                      onChange={(e) => handleInputChange("paid_holidays", parseInt(e.target.value) || 0)}
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  ) : (
                    <p className="font-medium text-purple-800">{driverData.user.paid_holidays || 0}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Rota Start Date</Label>
                  {isEditing ? (
                    <Input
                      id="rota_start_date"
                      type="date"
                      value={editFormData.rota_start_date}
                      onChange={(e) => handleInputChange("rota_start_date", e.target.value)}
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  ) : (
                    <p className="font-medium text-purple-800">{formatDate(driverData.user.rota_start_date)}</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600">Description</Label>
                <p className="font-medium text-purple-800">
                  {driverData.user.contract?.description || "No description available"}
                </p>
              </div>
              <Separator className="bg-purple-200" />
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-800">Other Jobs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">Do you have any other job?</Label>
                    {isEditing ? (
                      <Select
                        value={editFormData.have_other_jobs.toString()}
                        onValueChange={(value) => handleInputChange("have_other_jobs", value === "true")}
                      >
                        <SelectTrigger className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-purple-800">{driverData.have_other_jobs ? "Yes" : "No"}</p>
                    )}
                    {isEditing && editFormData.have_other_jobs && (
                      <div className="space-y-2">
                        <Label htmlFor="have_other_jobs_note" className="text-sm font-semibold text-gray-600">
                          Details
                        </Label>
                        <Textarea
                          id="have_other_jobs_note"
                          value={editFormData.have_other_jobs_note || ""}
                          onChange={(e) => handleInputChange("have_other_jobs_note", e.target.value)}
                          placeholder="Enter details about other job"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                        />
                      </div>
                    )}
                    {driverData.have_other_jobs && !isEditing && (
                      <p className="text-sm text-gray-600 mt-1">{driverData.have_other_jobs_note || ""}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator className="bg-purple-200" />
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-800">Assigned Sites</h3>
                <div className="flex items-end gap-6">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">Select Sites</Label>
                    <div className="rounded-lg p-3 max-h-64 overflow-y-auto border border-purple-200 bg-white">
                      {sites.map((site) => (
                        <div
                          key={site.id}
                          className="flex border-b border-purple-100 items-center space-x-3 p-3 hover:bg-purple-50 transition-colors"
                        >
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
                            className="h-5 w-5 text-purple-600 focus:ring-purple-600 rounded"
                          />
                          <label htmlFor={`site-${site.id}`} className="text-sm font-medium text-purple-800 cursor-pointer flex-1">
                            {site.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleAssignSites}
                    disabled={assigningSites || selectedSiteIds.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
                  >
                    {assigningSites ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Assign Sites
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {driverData.user.site?.map((site: any) => (
                  <Card
                    key={site.id}
                    className="overflow-hidden shadow-lg bg-white hover:shadow-xl transition-all rounded-xl"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-purple-800">{site.name}</h3>
                        <Badge
                          className={`px-3 py-1 text-sm font-medium ${
                            site.status === "active"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-gray-400 hover:bg-gray-500"
                          } text-white rounded-full transition-colors`}
                        >
                          {site.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )) || <p className="col-span-full text-gray-500">No sites assigned.</p>}
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-purple-800">BrightHR Signup</h3>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-purple-700">Assign Manager</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="assign_manager" className="text-sm font-semibold text-gray-600">
                      Select Manager
                    </Label>
                    <Select
                      value={selectedManagerId}
                      onValueChange={setSelectedManagerId}
                      disabled={managersLoading || assigningManager}
                    >
                      <SelectTrigger
                        id="assign_manager"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                      >
                        <SelectValue placeholder={managersLoading ? "Loading managers..." : "Select a manager to assign"} />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id.toString()}>
                            {manager.full_name} ({manager.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigning_date" className="text-sm font-semibold text-gray-600">
                      Assigning Date
                    </Label>
                    <Input
                      id="assigning_date"
                      type="date"
                      value={assigningDate}
                      onChange={(e) => setAssigningDate(e.target.value)}
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                      disabled={assigningManager}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAssignBrightHRManager}
                  disabled={assigningManager || !selectedManagerId || managersLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
                >
                  {assigningManager ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Assign Manager
                    </>
                  )}
                </Button>
              </div>
              <Separator className="bg-purple-200" />
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-purple-700">Current Assignments</h4>
                {brightHRData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brightHRData.map((assignment) => (
                      <Card
                        key={assignment.id}
                        className="overflow-hidden shadow-lg bg-white hover:shadow-xl transition-all rounded-xl"
                      >
                        <CardContent className="p-5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-purple-800">{assignment.manager_name}</h4>
                              <Badge
                                className={`px-3 py-1 text-sm font-medium ${
                                  assignment.is_active
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : "bg-gray-400 hover:bg-gray-500"
                                } text-white rounded-full transition-colors`}
                              >
                                {assignment.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">Assigning Date: {formatDate(assignment.assigning_date)}</p>
                            <p className="text-sm text-gray-500">Manager Email: {assignment.manager_email}</p>
                            <p className="text-sm text-gray-500">Driver Email: {assignment.bright_user_email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No BrightHR assignments yet. Assign a manager above to get started.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            disabled={currentStep === 0}
            //@ts-expect-error ab thk ha
            onClick={() => setCurrentStep(prev=> prev - 1)}
            className="border-purple-600 text-purple-600 hover:bg-purple-100"
          >
            Previous
          </Button>
          <Button
            disabled={currentStep === steps.length - 1}
            //@ts-expect-error ab thk haacca
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}