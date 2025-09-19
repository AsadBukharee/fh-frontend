
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useCookies } from "next-client-cookies"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, FileText, Building2, Mail, CheckCircle, XCircle, Edit, Save, X, AlertTriangle, File, ExternalLink, Heart } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { formatDmy } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

interface HealthAnswer {
  id: number
  question: number
  question_text: string
  answered_by: number
  answer: boolean
  note: string
  admin_remarks: string | null
  created_at: string
  updated_at: string
}

export default function DriverDetailPage() {
  const { id } = useParams()
  const cookies = useCookies()
  const [driverData, setDriverData] = useState<DriverData | null>(null)
  const [competencyData, setCompetencyData] = useState<ProfessionalCompetency[]>([])
  const [healthData, setHealthData] = useState<HealthAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [competencyLoading, setCompetencyLoading] = useState(true)
  const [healthLoading, setHealthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competencyError, setCompetencyError] = useState<string | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingHealth, setIsEditingHealth] = useState(false)
  const [isEditingCompetency, setIsEditingCompetency] = useState(false)
  const [fullImage, setFullImage] = useState<string | null>(null);

  const handleImageClick = (url: string) => {
    setFullImage(url);
  };

  const closeFullImage = () => {
    setFullImage(null);
  };
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
  const [editHealthData, setEditHealthData] = useState<HealthAnswer[]>([])
  const [editCompetencyData, setEditCompetencyData] = useState<ProfessionalCompetency[]>([])
  const [saving, setSaving] = useState(false)
  const [savingHealth, setSavingHealth] = useState(false)
  const [savingCompetency, setSavingCompetency] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [sitesLoading, setSitesLoading] = useState(false)
  const [assigningContract, setAssigningContract] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string>("")
  const [assigningSites, setAssigningSites] = useState(false)
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  const showToast = (message: string, type: string) => {
    console.log(`${type}: ${message}`)
  }
  const isImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  };

  // Function to determine if a URL is a PDF
  const isPdfUrl = (url: string): boolean => {
    return /\.pdf$/i.test(url);
  };
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
        setEditCompetencyData(result.data)
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

  const fetchHealthData = async () => {
    setHealthLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/profiles/health-answers/?answered_by=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch health answers")
      }

      const result = await response.json()
      if (result.success) {
        setHealthData(result.data)
        setEditHealthData(result.data)
      } else {
        throw new Error(result.message || "Failed to load health answers")
      }
    } catch (error) {
      console.error("Error fetching health answers:", error)
      setHealthError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setHealthLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchData()
      fetchCompetencyData()
      fetchHealthData()
    }
  }, [id, cookies])

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
      showToast("Sites assigned successfully", "success")
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

  const handleHealthEditToggle = () => {
    if (isEditingHealth) {
      setEditHealthData(healthData)
    }
    setIsEditingHealth(!isEditingHealth)
  }

  const handleCompetencyEditToggle = () => {
    if (isEditingCompetency) {
      setEditCompetencyData(competencyData)
    }
    setIsEditingCompetency(!isEditingCompetency)
  }

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleHealthInputChange = (id: number, field: string, value: boolean | string) => {
    setEditHealthData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleCompetencyInputChange = (id: number, field: string, value: string) => {
    setEditCompetencyData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
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
            : null
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

  const handleSaveHealth = async () => {
    setSavingHealth(true)
    try {
      const updates = editHealthData.map((item) => ({
        id: item.id,
        answer: item.answer,
        note: item.note,
      }))
      const response = await fetch(`${API_URL}/api/profiles/health-answers/bulk-update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ health_answers: updates }),
      })

      if (!response.ok) {
        throw new Error("Failed to update health answers")
      }

      const result = await response.json()
      if (result.success) {
        setHealthData(editHealthData)
        setIsEditingHealth(false)
        showToast("Health answers updated successfully", "success")
        fetchHealthData() // Refresh data
      } else {
        throw new Error(result.message || "Failed to update health answers")
      }
    } catch (error) {
      console.error("Error updating health answers:", error)
      showToast(error instanceof Error ? error.message : "Failed to update health answers", "error")
    } finally {
      setSavingHealth(false)
    }
  }

  const handleSaveCompetency = async () => {
    setSavingCompetency(true)
    try {
      const updates = editCompetencyData.map((item) => ({
        id: item.id,
        request_status: item.request_status,
        expiry_date: item.expiry_date,
      }))
      const response = await fetch(`${API_URL}/api/profiles/professional-competency/bulk-update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ professional_competencies: updates }),
      })

      if (!response.ok) {
        throw new Error("Failed to update professional competencies")
      }

      const result = await response.json()
      if (result.success) {
        setCompetencyData(editCompetencyData)
        setIsEditingCompetency(false)
        showToast("Professional competencies updated successfully", "success")
        fetchCompetencyData() // Refresh data
      } else {
        throw new Error(result.message || "Failed to update professional competencies")
      }
    } catch (error) {
      console.error("Error updating professional competencies:", error)
      showToast(error instanceof Error ? error.message : "Failed to update professional competencies", "error")
    } finally {
      setSavingCompetency(false)
    }
  }

  const formatDate = (dateString: string | null) => dateString ? formatDmy(dateString) : "Not set"

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading || competencyLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600"></div>
      </div>
    )
  }

  if (error || !driverData || competencyError || healthError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md shadow-xl bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error || competencyError || healthError || "Driver not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8 bg-gray-100 min-h-screen">
      <div className="flex items-start gap-8">
        <Avatar className="h-28 w-28 ring-4 ring-purple-200">
          <AvatarImage src={driverData.user.avatar || "/placeholder.svg"} alt={driverData.user.full_name} />
          <AvatarFallback className="text-xl font-bold bg-purple-100 text-purple-800">
            {getInitials(driverData.user.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-purple-800">{driverData.user.full_name}</h1>
            <Badge className={`px-3 py-1 text-sm font-medium ${driverData.user.is_active ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 hover:bg-gray-500"} text-white rounded-full transition-colors`}>
              {driverData.user.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge
              className={`px-3 py-1 text-sm font-medium ${
                driverData.profile_status === "approved" ? "bg-purple-600 hover:bg-purple-700" : "bg-orange-600 hover:bg-orange-700"
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
              <Mail className="h-5 w-5 text-purple-600" />
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
            <p className="text-sm text-muted-foreground mt-2">
              No warnings for this driver.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
         
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
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
                className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditToggle}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-evenly items-center gap-6">
        <Card className="w-[220px] shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">Total Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{driverData.user.shifts_count}</div>
          </CardContent>
        </Card>

        <Card className="w-[220px] shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">Paid Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{driverData.user.paid_holidays}</div>
          </CardContent>
        </Card>

        <Card className="w-[220px] shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">Rota Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {driverData.user.parent_rota_completed && driverData.user.child_rota_completed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">Complete</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-600">Pending</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="sticky top-0 z-10 grid h-[70px] w-full grid-cols-5 bg-white border border-purple-200 rounded-xl p-2 shadow-sm">
          <TabsTrigger
            value="overview"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Overview
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="contract"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Contract
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="sites"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Sites
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="professional-competency"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Competency
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="relative py-3 text-sm font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all hover:bg-purple-100"
          >
            Health
            <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 data-[state=active]:block hidden transition-all"></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <User className="h-6 w-6" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {isEditing ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-sm font-semibold text-gray-600">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editFormData.full_name}
                          onChange={(e) => handleInputChange("full_name", e.target.value)}
                          placeholder="Enter full name"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name" className="text-sm font-semibold text-gray-600">Display Name</Label>
                        <Input
                          id="display_name"
                          value={editFormData.display_name}
                          onChange={(e) => handleInputChange("display_name", e.target.value)}
                          placeholder="Enter display name"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-600">Email</Label>
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
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-600">Phone</Label>
                        <Input
                          id="phone"
                          value={editFormData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="Enter phone number"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-semibold text-gray-600">Address</Label>
                        <Input
                          id="address"
                          value={editFormData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Enter address"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth" className="text-sm font-semibold text-gray-600">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={editFormData.date_of_birth}
                          onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          placeholder="Enter date of birth"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract" className="text-sm font-semibold text-gray-600">Contract</Label>
                        <Select
                          value={editFormData.contractId}
                          onValueChange={(value) => handleInputChange("contractId", value)}
                          disabled={contractsLoading}
                        >
                          <SelectTrigger id="contract" className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
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
                        <Label htmlFor="sites" className="text-sm font-semibold text-gray-600">Sites</Label>
                        <Select
                          value={editFormData.siteIds[0] ?? ""}
                          onValueChange={(value) => handleInputChange("siteIds", Array.isArray(value) ? value : [value])}
                          disabled={sitesLoading}
                        >
                          <SelectTrigger id="sites" className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
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
                      <Label className="text-sm font-semibold text-gray-600">Role</Label>
                      <p className="font-medium text-gray-700">{driverData.user.role} (Read-only)</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Full Name</Label>
                      <p className="font-medium text-purple-800">{driverData.user.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Display Name</Label>
                      <p className="font-medium text-purple-800">{driverData.user.display_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Email</Label>
                      <p className="font-medium text-purple-800">{driverData.user.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Phone</Label>
                      <p className="font-medium text-purple-800">{driverData.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Address</Label>
                      <p className="font-medium text-purple-800">{driverData.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Date of Birth</Label>
                      <p className="font-medium text-purple-800">{formatDate(driverData.date_of_birth)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Role</Label>
                      <p className="font-medium text-purple-800">{driverData.user.role}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <User className="h-6 w-6" />
                  Next of Kin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_name" className="text-sm font-semibold text-gray-600">Name</Label>
                      <Input
                        id="next_of_kin_name"
                        value={editFormData.next_of_kin_name}
                        onChange={(e) => handleInputChange("next_of_kin_name", e.target.value)}
                        placeholder="Enter next of kin name"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_relationship" className="text-sm font-semibold text-gray-600">Relationship</Label>
                      <Input
                        id="next_of_kin_relationship"
                        value={editFormData.next_of_kin_relationship}
                        onChange={(e) => handleInputChange("next_of_kin_relationship", e.target.value)}
                        placeholder="Enter relationship"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_contact" className="text-sm font-semibold text-gray-600">Contact</Label>
                      <Input
                        id="next_of_kin_contact"
                        value={editFormData.next_of_kin_contact}
                        onChange={(e) => handleInputChange("next_of_kin_contact", e.target.value)}
                        placeholder="Enter contact number"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_of_kin_email" className="text-sm font-semibold text-gray-600">Email</Label>
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
                      <Label htmlFor="next_of_kin_address" className="text-sm font-semibold text-gray-600">Address</Label>
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
                      <p className="font-medium text-purple-800">{driverData.next_of_kin_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Relationship</Label>
                      <p className="font-medium text-purple-800">{driverData.next_of_kin_relationship}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Contact</Label>
                      <p className="font-medium text-purple-800">{driverData.next_of_kin_contact}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Email</Label>
                      <p className="font-medium text-purple-800">{driverData.next_of_kin_email || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold text-gray-600">Address</Label>
                      <p className="font-medium text-purple-800">{driverData.next_of_kin_address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <Calendar className="h-6 w-6" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Contract Signing Date</Label>
                  <p className="font-medium text-purple-800">{formatDate(driverData.user.contract_signing_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Rota Start Date</Label>
                  <p className="font-medium text-purple-800">{formatDate(driverData.user.rota_start_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Signup Date</Label>
                  <p className="font-medium text-purple-800">{formatDate(driverData.signup_date)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contract">
          <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                <FileText className="h-6 w-6" />
                Contract Details
              </CardTitle>
              <CardDescription className="text-gray-600">Manage contract information and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-800">Assign New Contract</h3>
                <div className="flex items-end gap-6">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="assign_contract" className="text-sm font-semibold text-gray-600">Select Contract</Label>
                    <Select
                      value={selectedContractId}
                      onValueChange={setSelectedContractId}
                      disabled={contractsLoading || assigningContract}
                    >
                      <SelectTrigger id="assign_contract" className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
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
                  <Label className="text-sm font-semibold text-gray-600">Contract ID</Label>
                  <p className="font-medium text-purple-800">{driverData.user.contract?.id || "Not assigned"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Contract Name</Label>
                  <p className="font-medium text-purple-800">{driverData.user.contract?.name || "Not assigned"}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600">Description</Label>
                <p className="font-medium text-purple-800">{driverData.user.contract?.description || "No description available"}</p>
              </div>
              <Separator className="bg-purple-200" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Signing Date</Label>
                  <p className="font-medium text-purple-800">
                    {driverData.user.contract_signing_date
                      ? formatDate(driverData.user.contract_signing_date)
                      : "Not assigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Paid Holidays</Label>
                  <p className="font-medium text-purple-800">{driverData.user.paid_holidays} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites">
          <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                <Building2 className="h-6 w-6" />
                Assigned Sites
              </CardTitle>
              <CardDescription className="text-gray-600">Sites where this driver is authorized to work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-purple-800">Assign New Sites</h3>
                <div className="flex items-end gap-6">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">Select Sites</Label>
                    <div className="rounded-lg p-3 max-h-64 overflow-y-auto border border-purple-200 bg-white">
                      {sites.map((site) => (
                        <div key={site.id} className="flex border-b border-purple-100 items-center space-x-3 p-3 hover:bg-purple-50 transition-colors">
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
                            className="h-5 w-5 text-purple-600 focus:ring-purple-600 rounded"
                          />
                          <label htmlFor={`site-${site.id}`} className="text-sm font-medium text-purple-800">
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
              <Separator className="bg-purple-200" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {driverData.user.site.map((site) => (
                  <Card key={site.id} className="overflow-hidden shadow-lg bg-white hover:shadow-xl transition-all rounded-xl">
                    <div className="aspect-video relative">
                      <img
                        src={site.image || "/placeholder.svg"}
                        alt={site.name}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-purple-800">{site.name}</h3>
                        <Badge className={`px-3 py-1 text-sm font-medium ${site.status === "active" ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 hover:bg-gray-500"} text-white rounded-full transition-colors`}>
                          {site.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Site ID: {site.id}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional-competency">
          <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <File className="h-6 w-6" />
                  Professional Competency Details
                </CardTitle>
                <div className="flex gap-3">
                  {isEditingCompetency ? (
                    <>
                      <Button
                        onClick={handleSaveCompetency}
                        disabled={savingCompetency}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
                      >
                        {savingCompetency ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-5 w-5 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCompetencyEditToggle}
                        disabled={savingCompetency}
                        className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleCompetencyEditToggle}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      Edit Competencies
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription className="text-gray-600">Documents and certifications related to professional competency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
  {competencyData.length === 0 ? (
    <p className="text-gray-600 text-center py-4">No professional competency records found.</p>
  ) : (
    (isEditingCompetency ? editCompetencyData : competencyData).map((competency) => (
      <div key={competency.id} className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600">Document Name</Label>
            <p className="font-medium text-purple-800">{competency.document_name}</p>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600">Document Type</Label>
            <p className="font-medium text-purple-800">{competency.document_type}</p>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600">Status</Label>
            {isEditingCompetency ? (
              <Select
                value={competency.request_status}
                onValueChange={(value) => handleCompetencyInputChange(competency.id, "request_status", value)}
              >
                <SelectTrigger className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="not_approved">Not Approved</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                className={`px-2 py-0.5 text-sm font-medium rounded-full ${
                  competency.request_status === "pending"
                    ? "bg-orange-600"
                    : competency.request_status === "approved"
                    ? "bg-purple-600"
                    : "bg-red-600"
                } text-white`}
              >
                {competency.request_status.charAt(0).toUpperCase() + competency.request_status.slice(1)}
              </Badge>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600">Expiry Date</Label>
            {isEditingCompetency ? (
              <Input
                type="date"
                value={competency.expiry_date || ""}
                onChange={(e) => handleCompetencyInputChange(competency.id, "expiry_date", e.target.value)}
                className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
              />
            ) : (
              <p className="font-medium text-purple-800">{formatDate(competency.expiry_date)}</p>
            )}
          </div>
          {competency.has_description && (
            <div className="col-span-2">
              <Label className="text-sm font-semibold text-gray-600">Description</Label>
              <p className="font-medium text-purple-800">{competency.description}</p>
            </div>
          )}
        </div>

        {competency.has_document && competency.urls.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-600">Document Links</Label>
          <div className="flex gap-2 flex-wrap">
            {competency.urls.map((url, index) => {
              const label =
                competency.has_back_side && index === 0
                  ? "Front Side"
                  : competency.has_back_side && index === 1
                  ? "Back Side"
                  : `Document ${index + 1}`;

              return (
                <div key={index} className="space-y-1">
                  {/* Link to open in new tab */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 p-2 rounded-lg hover:bg-purple-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{label}</span>
                  </a>

                  {/* Display image */}
                  {isImageUrl(url) && (
                    <img
                      src={url}
                      alt={label}
                      className="max-w-[150px] h-[150px] rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleImageClick(url)}
                    />
                  )}

                  {/* Display PDF */}
                  {isPdfUrl(url) && (
                    <embed
                      src={url}
                      type="application/pdf"
                      width="100%"
                      height="250px"
                      className="rounded-lg border border-gray-200"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-screen overlay */}
      {fullImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={closeFullImage}
        >
          <img src={fullImage} alt="Full View" className="max-w-full max-h-full object-contain" />
        </div>
      )}

        {competency.modules.length > 0 && (
          <div>
            <Label className="text-sm font-semibold text-gray-600">Modules</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {competency.modules.map((module) => (
                <Card key={module.id} className="shadow-md bg-white hover:shadow-lg transition-all rounded-lg border border-purple-200">
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Module Name</Label>
                      <p className="font-medium text-purple-800">{module.module_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Description</Label>
                      <p className="font-medium text-purple-800">{module.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-600">Expiry Date</Label>
                      <p className="font-medium text-purple-800">{formatDate(module.expiry_date)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        <Separator className="bg-purple-200" />
      </div>
    ))
  )}
</CardContent>

          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <Heart className="h-6 w-6" />
                  Health Information
                </CardTitle>
                <div className="flex gap-3">
                  {isEditingHealth ? (
                    <>
                      <Button
                        onClick={handleSaveHealth}
                        disabled={savingHealth}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
                      >
                        {savingHealth ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-5 w-5 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleHealthEditToggle}
                        disabled={savingHealth}
                        className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleHealthEditToggle}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      Edit Health Answers
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription className="text-gray-600">Health-related questions and answers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {healthData.length === 0 ? (
                <p className="text-gray-600 text-center py-6">No health answers found.</p>
              ) : (
                (isEditingHealth ? editHealthData : healthData).map((health) => (
                  <div key={health.id} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Question</Label>
                        <p className="font-medium text-purple-800">{health.question_text}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Answer</Label>
                        {isEditingHealth ? (
                          <Select
                            value={health.answer.toString()}
                            onValueChange={(value) => handleHealthInputChange(health.id, "answer", value === "true")}
                          >
                            <SelectTrigger className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
                              <SelectValue placeholder="Select answer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            className={`px-3 py-1 text-sm font-medium ${
                              health.answer ? "bg-purple-600 hover:bg-purple-700" : "bg-orange-600 hover:bg-orange-700"
                            } text-white rounded-full transition-colors`}
                          >
                            {health.answer ? "Yes" : "No"}
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-semibold text-gray-600">Note</Label>
                        {isEditingHealth ? (
                          <Input
                            value={health.note}
                            onChange={(e) => handleHealthInputChange(health.id, "note", e.target.value)}
                            placeholder="Enter note"
                            className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                          />
                        ) : (
                          <p className="font-medium text-purple-800">{health.note || "No note provided"}</p>
                        )}
                      </div>
                      {health.admin_remarks && (
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold text-gray-600">Admin Remarks</Label>
                          <p className="font-medium text-purple-800">{health.admin_remarks}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Created At</Label>
                        <p className="font-medium text-purple-800">{formatDate(health.created_at)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600">Updated At</Label>
                        <p className="font-medium text-purple-800">{formatDate(health.updated_at)}</p>
                      </div>
                    </div>
                    <Separator className="bg-purple-200" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
