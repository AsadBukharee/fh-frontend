"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useCookies } from "next-client-cookies"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, FileText, Building2, Mail, CheckCircle, XCircle, Edit, Save, X, AlertTriangle, File } from "lucide-react"
import API_URL from "@/app/utils/ENV"

// Existing interfaces remain unchanged
interface DriverData {
  id: number
  user: {
    id: number
    email: string
    full_name: string
    display_name: string
    parent_rota_completed: boolean
    child_rota_completed: boolean
    contract_signing_date: string
    rota_start_date: string
    paid_holidays: number
    is_active: boolean
    contract: {
      id: number
      name: string
      description: string
    }
    role: string
    site: Array<{
      id: number
      name: string
      status: string
      image: string
    }>
    shifts_count: number
    avatar: string | null
  }
  warnings: string[]
  missing_attributes: string[]
  source: string
  next_step: string
  is_profile_completed: boolean
  remarks: string
  profile_status: string
  have_other_jobs: boolean
  have_other_jobs_note: string
  date_of_birth: string
  phone: string
  address: string
  account_no: string
  sort_code: string
  post_code: string
  national_insurance_no: string
  license_number: string
  license_issue_number: string
  next_of_kin_name: string
  next_of_kin_relationship: string
  next_of_kin_note: string | null
  next_of_kin_contact: string
  next_of_kin_email: string
  next_of_kin_address: string
  manager_name: string
  signup_date: string
  created_at: string
  updated_at: string
}

interface Contract {
  id: number
  name: string
  description: string
}

interface Site {
  id: number
  name: string
  status: string
  image: string
}

// New interface for Professional Competency
interface CompetencyModule {
  id: number
  module_name: string
  description: string
  expiry_date: string
}

interface ProfessionalCompetency {
  id: number
  driver: number
  document_name: string
  document_type: string
  has_expiry: boolean
  description: string
  expiry_date: string | null
  has_document: boolean
  has_back_side: boolean
  urls: string[]
  request_status: string
  has_description: boolean
  next_five_modules: CompetencyModule[]
  modules: CompetencyModule[]
  created_at: string
  updated_at: string
}

export default function DriverDetailPage() {
  const { id } = useParams()
  const cookies = useCookies()
  const [driverData, setDriverData] = useState<DriverData | null>(null)
  const [competencyData, setCompetencyData] = useState<ProfessionalCompetency[]>([]) // New state for competency data
  const [loading, setLoading] = useState(true)
  const [competencyLoading, setCompetencyLoading] = useState(true) // New state for competency loading
  const [error, setError] = useState<string | null>(null)
  const [competencyError, setCompetencyError] = useState<string | null>(null) // New state for competency error
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    display_name: "",
    email: "",
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
  })
  const [saving, setSaving] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [sitesLoading, setSitesLoading] = useState(false)
  const [assigningContract, setAssigningContract] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string>("")
  const [assigningSites, setAssigningSites] = useState(false)
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])

  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`)
  }

  // Existing fetchData function remains unchanged
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${id}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch driver data")
      }

      const result = await response.json()
      if (result.success) {
        setDriverData(result.data)
        setEditFormData({
          full_name: result.data.user.full_name,
          display_name: result.data.user.display_name,
          email: result.data.user.email,
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
        })
      } else {
        throw new Error(result.message || "Failed to load driver data")
      }
    } catch (error) {
      console.error("Error fetching driver data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // New function to fetch professional competency data
  const fetchCompetencyData = async () => {
    setCompetencyLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/profiles/professional-competency/?driver_id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch professional competency data")
      }

      const result = await response.json()
      if (result.success) {
        setCompetencyData(result.data)
      } else {
        throw new Error(result.message || "Failed to load professional competency data")
      }
    } catch (error) {
      console.error("Error fetching professional competency data:", error)
      setCompetencyError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setCompetencyLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchData()
      fetchCompetencyData() // Fetch competency data on mount
    }
  }, [id, cookies])

  // Existing useEffect for contracts and sites remains unchanged
  useEffect(() => {
    const fetchContracts = async () => {
      setContractsLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/staff/contracts/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (response.status === 401) {
          showToast("Session expired. Please log in again.", "error")
          return
        }
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        setContracts(data)
      } catch {
        showToast("Failed to fetch contracts", "error")
      } finally {
        setContractsLoading(false)
      }
    }

    const fetchSites = async () => {
      if (sites.length > 0) return
      setSitesLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/sites/list-names/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (response.status === 401) {
          showToast("Session expired. Please log in again.", "error")
          return
        }
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        if (data.success) {
          setSites(data.data)
        } else {
          showToast(data.message || "Failed to fetch sites", "error")
        }
      } catch {
        showToast("Failed to fetch sites", "error")
      } finally {
        setSitesLoading(false)
      }
    }

    fetchContracts()
    fetchSites()
  }, [cookies])

  // Existing handleAssignContract, handleAssignSites, handleEditToggle, handleInputChange, and handleSaveProfile functions remain unchanged
  const handleAssignContract = async () => {
    if (!selectedContractId) {
      showToast("Please select a contract to assign.", "error")
      return
    }

    setAssigningContract(true)
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
      })

      if (!response.ok) {
        throw new Error("Failed to assign contract")
      }

      const result = await response.json()
      if (result.success) {
        showToast("Contract assigned successfully", "success")
        fetchData()
        setSelectedContractId("")
      } else {
        throw new Error(result.message || "Failed to assign contract")
      }
    } catch (error) {
      console.error("Error assigning contract:", error)
      showToast(error instanceof Error ? error.message : "Failed to assign contract", "error")
    } finally {
      setAssigningContract(false)
    }
  }

  const handleAssignSites = async () => {
    if (!selectedSiteIds || selectedSiteIds.length === 0) {
      showToast("Please select at least one site to assign.", "error")
      return
    }

    setAssigningSites(true)
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
      })

      if (!response.ok) {
        throw new Error("Failed to assign sites")
      }

      const result = await response.json()
      alert("Sites assigned successfully")
      fetchData()
    } catch (error) {
      console.error("Error assigning sites:", error)
      showToast(error instanceof Error ? error.message : "Failed to assign sites", "error")
    } finally {
      setAssigningSites(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setEditFormData({
        full_name: driverData?.user.full_name || "",
        display_name: driverData?.user.display_name || "",
        email: driverData?.user.email || "",
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
      })
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          user: {
            full_name: editFormData.full_name,
            display_name: editFormData.display_name,
            email: editFormData.email,
            paid_holidays: editFormData.paid_holidays,
            contract_id: Number(editFormData.contractId),
            site_ids: editFormData.siteIds.map(Number),
          },
          phone: editFormData.phone,
          address: editFormData.address,
          date_of_birth: editFormData.date_of_birth,
          next_of_kin_name: editFormData.next_of_kin_name,
          next_of_kin_relationship: editFormData.next_of_kin_relationship,
          next_of_kin_contact: editFormData.next_of_kin_contact,
          next_of_kin_email: editFormData.next_of_kin_email,
          next_of_kin_address: editFormData.next_of_kin_address,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const result = await response.json()
      if (result.success) {
        setDriverData((prev) =>
          prev
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  full_name: editFormData.full_name,
                  display_name: editFormData.display_name,
                  email: editFormData.email,
                  paid_holidays: editFormData.paid_holidays,
                  contract: contracts.find((c) => c.id.toString() === editFormData.contractId) || prev.user.contract,
                  site: sites.filter((s) => editFormData.siteIds.includes(s.id.toString())),
                },
                phone: editFormData.phone,
                address: editFormData.address,
                date_of_birth: editFormData.date_of_birth,
                next_of_kin_name: editFormData.next_of_kin_name,
                next_of_kin_relationship: editFormData.next_of_kin_relationship,
                next_of_kin_contact: editFormData.next_of_kin_contact,
                next_of_kin_email: editFormData.next_of_kin_email,
                next_of_kin_address: editFormData.next_of_kin_address,
              }
            : null,
        )
        setIsEditing(false)
        showToast("Profile updated successfully", "success")
      } else {
        throw new Error(result.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  // New function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading || competencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !driverData || competencyError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || competencyError || "Driver not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={driverData.user.avatar || "/placeholder.svg"} alt={driverData.user.full_name} />
          <AvatarFallback className="text-lg font-semibold">{getInitials(driverData.user.full_name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-balance">{driverData.user.full_name}</h1>
            <Badge variant={driverData.user.is_active ? "default" : "secondary"} className="ml-2">
              {driverData.user.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={driverData.profile_status === "approved" ? "default" : "destructive"} className="ml-2">
              {driverData.profile_status.charAt(0).toUpperCase() + driverData.profile_status.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{driverData.user.role}</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{driverData.user.email}</span>
            </div>
          </div>

          {driverData.warnings.length > 0 && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{driverData.warnings.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleEditToggle} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button className="bg-orange-600" onClick={handleEditToggle}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-evenly items-center gap-4">
        <Card className="w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverData.user.shifts_count}</div>
          </CardContent>
        </Card>

        <Card className="w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverData.user.paid_holidays}</div>
          </CardContent>
        </Card>

        <Card className="w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rota Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {driverData.user.parent_rota_completed && driverData.user.child_rota_completed ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Complete</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Pending</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="overview">
          <AccordionTrigger>Overview</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={editFormData.full_name}
                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="display_name">Display Name</Label>
                          <Input
                            id="display_name"
                            value={editFormData.display_name}
                            onChange={(e) => handleInputChange("display_name", e.target.value)}
                            placeholder="Enter display name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={editFormData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={editFormData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Enter address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth">Date of Birth</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={editFormData.date_of_birth}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                            placeholder="Enter date of birth"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contract">Contract</Label>
                          <Select
                            value={editFormData.contractId}
                            onValueChange={(value) => handleInputChange("contractId", value)}
                            disabled={contractsLoading}
                          >
                            <SelectTrigger id="contract">
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
                          <Label htmlFor="sites">Sites</Label>
                          <Select
                            value={editFormData.siteIds[0] ?? ""}
                            onValueChange={(value) => handleInputChange("siteIds", Array.isArray(value) ? value : [value])}
                            disabled={sitesLoading}
                          >
                            <SelectTrigger id="sites">
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
                        <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                        <p className="font-medium text-muted-foreground">{driverData.user.role} (Read-only)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{driverData.user.full_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                        <p className="font-medium">{driverData.user.display_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-medium">{driverData.user.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="font-medium">{driverData.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                        <p className="font-medium">{driverData.address}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                        <p className="font-medium">{formatDate(driverData.date_of_birth)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                        <p className="font-medium">{driverData.user.role}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Next of Kin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="next_of_kin_name">Name</Label>
                        <Input
                          id="next_of_kin_name"
                          value={editFormData.next_of_kin_name}
                          onChange={(e) => handleInputChange("next_of_kin_name", e.target.value)}
                          placeholder="Enter next of kin name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                        <Input
                          id="next_of_kin_relationship"
                          value={editFormData.next_of_kin_relationship}
                          onChange={(e) => handleInputChange("next_of_kin_relationship", e.target.value)}
                          placeholder="Enter relationship"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next_of_kin_contact">Contact</Label>
                        <Input
                          id="next_of_kin_contact"
                          value={editFormData.next_of_kin_contact}
                          onChange={(e) => handleInputChange("next_of_kin_contact", e.target.value)}
                          placeholder="Enter contact number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next_of_kin_email">Email</Label>
                        <Input
                          id="next_of_kin_email"
                          type="email"
                          value={editFormData.next_of_kin_email}
                          onChange={(e) => handleInputChange("next_of_kin_email", e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="next_of_kin_address">Address</Label>
                        <Input
                          id="next_of_kin_address"
                          value={editFormData.next_of_kin_address}
                          onChange={(e) => handleInputChange("next_of_kin_address", e.target.value)}
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                        <p className="font-medium">{driverData.next_of_kin_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Relationship</Label>
                        <p className="font-medium">{driverData.next_of_kin_relationship}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                        <p className="font-medium">{driverData.next_of_kin_contact}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-medium">{driverData.next_of_kin_email || "Not provided"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                        <p className="font-medium">{driverData.next_of_kin_address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contract Signing Date</Label>
                    <p className="font-medium">{formatDate(driverData.user.contract_signing_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Rota Start Date</Label>
                    <p className="font-medium">{formatDate(driverData.user.rota_start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Signup Date</Label>
                    <p className="font-medium">{formatDate(driverData.signup_date)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contract">
          <AccordionTrigger>Contract</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Details
                </CardTitle>
                <CardDescription>Contract information and terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Assign New Contract</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="assign_contract">Select Contract</Label>
                      <Select
                        value={selectedContractId}
                        onValueChange={setSelectedContractId}
                        disabled={contractsLoading || assigningContract}
                      >
                        <SelectTrigger id="assign_contract">
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
                    <Button onClick={handleAssignContract} disabled={assigningContract || !selectedContractId}>
                      {assigningContract ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Assign Contract
                    </Button>
                  </div>
                </div>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contract ID</Label>
                    <p className="font-medium">{driverData.user.contract?.id || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contract Name</Label>
                    <p className="font-medium">{driverData.user.contract?.name || "Not assigned"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="font-medium">{driverData.user.contract?.description || "No description available"}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Signing Date</Label>
                    <p className="font-medium">
                      {driverData.user.contract_signing_date
                        ? formatDate(driverData.user.contract_signing_date)
                        : "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Paid Holidays</Label>
                    <p className="font-medium">{driverData.user.paid_holidays} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sites">
          <AccordionTrigger>Sites</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Assigned Sites
                </CardTitle>
                <CardDescription>Sites where this driver is authorized to work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Assign New Sites</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Select Sites</Label>
                      <div className="rounded-md p-2 max-h-60 overflow-y-auto">
                        {sites.map((site) => (
                          <div key={site.id} className="flex border-b border-gray-100 items-center space-x-2 p-2">
                            <input
                              type="checkbox"
                              id={`site-${site.id}`}
                              checked={selectedSiteIds.includes(site.id.toString())}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSiteIds([...selectedSiteIds, site.id.toString()])
                                } else {
                                  setSelectedSiteIds(selectedSiteIds.filter((id) => id !== site.id.toString()))
                                }
                              }}
                              disabled={sitesLoading || assigningSites}
                            />
                            <label htmlFor={`site-${site.id}`} className="text-sm">
                              {site.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAssignSites} disabled={assigningSites || selectedSiteIds.length === 0}>
                      {assigningSites ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Assign Sites
                    </Button>
                  </div>
                </div>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driverData.user.site.map((site) => (
                    <Card key={site.id} className="overflow-hidden">
                      <div className="aspect-video relative">
                        <img
                          src={site.image || "/placeholder.svg"}
                          alt={site.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{site.name}</h3>
                          <Badge variant={site.status === "active" ? "default" : "secondary"}>{site.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Site ID: {site.id}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* New Accordion Item for Professional Competency */}
        <AccordionItem value="professional-competency">
          <AccordionTrigger>Professional Competency</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Professional Competency Details
                </CardTitle>
                <CardDescription>Documents and certifications related to professional competency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {competencyData.length === 0 ? (
                  <p className="text-muted-foreground">No professional competency records found.</p>
                ) : (
                  competencyData.map((competency) => (
                    <div key={competency.id} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Document Name</Label>
                          <p className="font-medium">{competency.document_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Document Type</Label>
                          <p className="font-medium">{competency.document_type}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                          <Badge
                            variant={
                              competency.request_status === "pending"
                                ? "secondary"
                                : competency.request_status === "approved"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {competency.request_status.charAt(0).toUpperCase() + competency.request_status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                          <p className="font-medium">{formatDate(competency.expiry_date)}</p>
                        </div>
                        {competency.has_description && (
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <p className="font-medium">{competency.description}</p>
                          </div>
                        )}
                      </div>
                      {competency.has_document && competency.urls.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Document Links</Label>
                          <div className="flex flex-col gap-2">
                            {competency.urls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {competency.has_back_side && index === 0
                                  ? "Front Side"
                                  : competency.has_back_side && index === 1
                                  ? "Back Side"
                                  : `Document ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {competency.modules.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Modules</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {competency.modules.map((module) => (
                              <Card key={module.id}>
                                <CardContent className="p-4">
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Module Name</Label>
                                      <p className="font-medium">{module.module_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                                      <p className="font-medium">{module.description}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                                      <p className="font-medium">{formatDate(module.expiry_date)}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      <Separator />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}