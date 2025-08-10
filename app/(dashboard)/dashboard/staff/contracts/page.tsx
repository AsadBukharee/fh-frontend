
"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Edit,
  Save,
  Trash2,
  Clock,
  Euro,
  FileText,
  Building2,
  Plus,
  X,
  Calendar,
  Settings,
  Search,
  Loader2,
  ChevronDown,
  Check,
  Zap,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { useToast } from "@/app/Context/ToastContext"
import { Card, CardContent } from "@/components/ui/card"
import GradientButton from "@/app/utils/GradientButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useDebounce } from "use-debounce"

// Type declarations
interface Shift {
  id: number
  name: string
  hours_from: string
  hours_to: string
  total_hours: string
  shift_note: string
  rate_per_hours: number
  colors: string
  created_at: string
  updated_at: string
  contract: number | null
}

interface Contract {
  id: number
  name: string
  description: string
  updated_by: number
  updated_by_name: string
  created_at: string
  updated_at: string
  shifts: Shift[]
}

interface ShiftTemplate {
  id: number
  name: string
  hours_from: string
  hours_to: string
  total_hours: string
  shift_note: string
  rate_per_hours: number
  colors: string
  contract: number | null
  template: boolean
  created_at: string
  updated_at: string
}

// Utility function to format time
const formatTime = (time: string): string => {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hoursNum = Number.parseInt(hours, 10)
  const period = hoursNum >= 12 ? "PM" : "AM"
  const formattedHours = hoursNum % 12 || 12
  return `${formattedHours}:${minutes} ${period}`
}

// Memoized ShiftCard component
const ShiftCard = memo(
  ({
    shift,
    isTemplate = false,
    contracts,
    handleEdit,
    handleDelete,
    handleQuickAssign,
    handleSaveShift,
    handleSaveTemplate,
    isEditing,
    editedTemplate,
    setEditedTemplate,
    saving,
    assigningTemplate,
  }: {
    shift: Shift | ShiftTemplate
    isTemplate?: boolean
    contracts: Contract[]
    handleEdit: (item: Shift | ShiftTemplate) => void
    handleDelete: (id: number, isShift: boolean) => Promise<void>
    handleQuickAssign: (templateId: number, contractId: number | null) => Promise<void>
    handleSaveShift: (shift: Shift) => Promise<void>
    handleSaveTemplate: (template: ShiftTemplate) => Promise<void>
    isEditing: number | null
    editedTemplate: Shift | ShiftTemplate | null
    setEditedTemplate: (template: Shift | ShiftTemplate | null) => void
    saving: boolean
    assigningTemplate: number | null
  }) => {
    const isEditingThis = isEditing === shift.id
    const isAssigning = assigningTemplate === shift.id
    const assignedContract = shift.contract ? contracts.find((c) => c.id === shift.contract) : null

    return (
      <div
        className={`
        group relative bg-white rounded-xl shadow-sm border transition-all duration-200
        ${isTemplate ? "border-amber-200 hover:shadow-amber-100" : "border-gray-200 hover:shadow-md"}
        ${isEditingThis ? "ring-2 ring-blue-500 shadow-lg" : "hover:border-gray-300"}
      `}
      >
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: shift.colors }} />
        <div className="p-5 pl-6">
          {isEditingThis && editedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isTemplate ? "Edit Template" : "Edit Shift"}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditedTemplate(null)}
                  disabled={saving}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Shift name"
                  value={editedTemplate.name}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                  disabled={saving}
                  className="font-medium"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Start Time</label>
                    <Input
                      type="time"
                      value={editedTemplate.hours_from}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, hours_from: e.target.value })}
                      disabled={saving}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">End Time</label>
                    <Input
                      type="time"
                      value={editedTemplate.hours_to}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, hours_to: e.target.value })}
                      disabled={saving}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Rate per Hour</label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={editedTemplate.rate_per_hours || ""}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          rate_per_hours: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={saving}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Notes</label>
                  <Input
                    value={editedTemplate.shift_note || ""}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, shift_note: e.target.value })}
                    disabled={saving}
                    placeholder="Add shift notes..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-500">Color</label>
                  <input
                    type="color"
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                    value={editedTemplate.colors || "#3B82F6"}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, colors: e.target.value })}
                    disabled={saving}
                  />
                </div>
                {isTemplate && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Assign to Contract</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      value={editedTemplate.contract || ""}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          contract: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                      }
                      disabled={saving}
                    >
                      <option value="">No Contract</option>
                      {contracts.map((contract: Contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => (isTemplate ? handleSaveTemplate(shift as ShiftTemplate) : handleSaveShift(shift as Shift))}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{shift.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(shift.hours_from)} - {formatTime(shift.hours_to)}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  €{shift.rate_per_hours?.toFixed(2) || "0.00"}
                </Badge>
              </div>
              {isTemplate && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-sm font-medium text-amber-800">Add to contract</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add this shift to the selected contract</p>
                      </TooltipContent>
                    </Tooltip>
                    {assignedContract && (
                      <Badge variant="outline" className="text-xs">
                        {assignedContract.name}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isAssigning}
                        className="h-8 text-xs bg-white hover:bg-amber-50 border-amber-300"
                      >
                        {isAssigning ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Building2 className="h-3 w-3 mr-1" />
                        )}
                        {isAssigning ? "Assigning..." : "Assign"}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleQuickAssign(shift.id, null)} className="text-sm">
                        <X className="h-4 w-4 mr-2 text-gray-400" />
                        No Contract
                        {!shift.contract && <Check className="h-4 w-4 ml-auto text-green-600" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {contracts.map((contract) => (
                        <DropdownMenuItem
                          key={contract.id}
                          onClick={() => handleQuickAssign(shift.id, contract.id)}
                          className="text-sm"
                        >
                          <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                          <div className="flex-1">
                            <div className="font-medium">{contract.name}</div>
                            <div className="text-xs text-gray-500 truncate">{contract.shifts.length} shifts</div>
                          </div>
                          {shift.contract === contract.id && <Check className="h-4 w-4 ml-2 text-green-600" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {shift.shift_note && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                  <span>{shift.shift_note}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: shift.colors }}
                  />
                  <span className="text-xs text-gray-500">
                    Updated {new Date(shift.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(shift)}
                    disabled={saving || isAssigning}
                    className="h-8 text-gray-600 hover:text-gray-900"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    className="mx-2"
                    onClick={() => handleDelete(shift.id, !isTemplate)}
                    variant="destructive"
                    disabled={saving}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

ShiftCard.displayName = "ShiftCard"

const ShiftManagement = () => {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([])
  const [isEditing, setIsEditing] = useState<number | null>(null)
  const [editedTemplate, setEditedTemplate] = useState<Shift | ShiftTemplate | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [assigningTemplate, setAssigningTemplate] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [selectedContract, setSelectedContract] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false)
  const [newContract, setNewContract] = useState({
    name: "",
    description: "",
  })
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    hours_from: "06:00:00",
    hours_to: "14:00:00",
    shift_note: "",
    rate_per_hours: 0,
    colors: "#FFB6D1",
    contract: null as number | null,
  })

  const cookies = useCookies()
  const { showToast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [contractResponse, shiftResponse] = await Promise.all([
        fetch(`${API_URL}/api/staff/contracts/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        }),
        fetch(`${API_URL}/api/staff/shifts/?template_only=true`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        }),
      ])

      if (!contractResponse.ok) throw new Error("Failed to fetch contracts")
      if (!shiftResponse.ok) throw new Error("Failed to fetch shift templates")

      const [contractData, shiftData]: [Contract[], ShiftTemplate[]] = await Promise.all([
        contractResponse.json(),
        shiftResponse.json(),
      ])

      setContracts(contractData)
      setShiftTemplates(shiftData)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Error fetching data. Please try again.")
      showToast("Error fetching data. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }, [cookies, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddContract = useCallback(async () => {
    const { name, description } = newContract
    if (!name) {
      showToast("Please fill in the contract name.", "error")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/staff/contracts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          name,
          description: description || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create contract")
      }

      await fetchData()
      showToast("Contract created successfully.", "success")
      setIsContractModalOpen(false)
      setNewContract({
        name: "",
        description: "",
      })
    } catch (err: any) {
      console.error("Error creating contract:", err)
      showToast(err.message || "Failed to create contract.", "error")
    } finally {
      setSaving(false)
    }
  }, [newContract, cookies, showToast, fetchData])

  const handleDeleteContract = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to delete this contract?")) return

      setSaving(true)
      try {
        const response = await fetch(`${API_URL}/api/staff/contracts/${id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })

        if (!response.ok) throw new Error("Failed to delete contract")

        await fetchData()
        showToast("Contract deleted successfully.", "success")
      } catch (err: any) {
        console.error("Error deleting contract:", err)
        showToast(err.message || "Failed to delete contract.", "error")
      } finally {
        setSaving(false)
      }
    },
    [cookies, showToast, fetchData]
  )

  const handleAddTemplate = useCallback(async () => {
    const { name, hours_from, hours_to } = newTemplate
    if (!name || !hours_from || !hours_to) {
      showToast("Please fill in all required fields.", "error")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/staff/shifts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          ...newTemplate,
          template: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create template")
      }

      await fetchData()
      showToast("Shift template created successfully.", "success")
      setIsAddModalOpen(false)
      setNewTemplate({
        name: "",
        hours_from: "06:00:00",
        hours_to: "14:00:00",
        shift_note: "",
        rate_per_hours: 0,
        colors: "#FFB6D1",
        contract: null,
      })
    } catch (err: any) {
      console.error("Error creating template:", err)
      showToast(err.message || "Failed to create template.", "error")
    } finally {
      setSaving(false)
    }
  }, [newTemplate, cookies, showToast, fetchData])

  const handleQuickAssign = useCallback(
    async (templateId: number, contractId: number | null) => {
      setAssigningTemplate(templateId)
      try {
        const template = shiftTemplates.find((t) => t.id === templateId)
        if (!template) throw new Error("Template not found")

        const response = await fetch(`${API_URL}/api/staff/shifts/${templateId}/add-to-contract/${contractId}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to assign template")
        }

        await fetchData()
        const contractName = contractId ? contracts.find((c) => c.id === contractId)?.name : "No Contract"
        showToast(`Template assigned to ${contractName} successfully.`, "success")
      } catch (err: any) {
        console.error("Error assigning template:", err)
        showToast(err.message || "Failed to assign template.", "error")
      } finally {
        setAssigningTemplate(null)
      }
    },
    [shiftTemplates, contracts, cookies, showToast, fetchData]
  )

  const handleEdit = useCallback((item: Shift | ShiftTemplate) => {
    setIsEditing(item.id)
    setEditedTemplate({ ...item })
  }, [])

  const handleSaveShift = useCallback(
    async (shift: Shift) => {
      if (!editedTemplate) return

      const { name, hours_from, hours_to, contract } = editedTemplate
      if (!name || !hours_from || !hours_to) {
        showToast("Please fill in all required fields.", "error")
        return
      }

      if (!contract) {
        showToast("Contract ID is required for shifts.", "error")
        return
      }

      setSaving(true)
      try {
        const response = await fetch(
          `${API_URL}/api/staff/shifts/${shift.id}/`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify({
              name,
              hours_from,
              hours_to,
              shift_note: editedTemplate.shift_note || "",
              rate_per_hours: editedTemplate.rate_per_hours || 0,
              colors: editedTemplate.colors,
              contract,
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update shift")
        }

        await fetchData()
        showToast("Shift updated successfully.", "success")
        setIsEditing(null)
        setEditedTemplate(null)
      } catch (err: any) {
        console.error("Error saving shift:", err)
        showToast(err.message || "Failed to update shift.", "error")
      } finally {
        setSaving(false)
      }
    },
    [editedTemplate, cookies, showToast, fetchData]
  )

  const handleSaveTemplate = useCallback(
    async (template: ShiftTemplate) => {
      if (!editedTemplate) return

      const { name, hours_from, hours_to } = editedTemplate
      if (!name || !hours_from || !hours_to) {
        showToast("Please fill in all required fields.", "error")
        return
      }

      setSaving(true)
      try {
        const response = await fetch(`${API_URL}/api/staff/shifts/${template.id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            name,
            hours_from,
            hours_to,
            shift_note: editedTemplate.shift_note || "",
            rate_per_hours: editedTemplate.rate_per_hours || 0,
            colors: editedTemplate.colors,
            template: true,
            contract: (editedTemplate as ShiftTemplate).contract || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update shift template")
        }

        await fetchData()
        showToast("Shift template updated successfully.", "success")
        setIsEditing(null)
        setEditedTemplate(null)
      } catch (err: any) {
        console.error("Error saving template:", err)
        showToast(err.message || "Failed to update shift template.", "error")
      } finally {
        setSaving(false)
      }
    },
    [editedTemplate, cookies, showToast, fetchData]
  )

  const handleDelete = useCallback(
    async (id: number, isShift: boolean) => {
      if (!confirm(`Are you sure you want to delete this ${isShift ? "shift" : "template"}?`)) return

      setSaving(true)
      try {
        const response = await fetch(`${API_URL}/api/staff/shifts/${id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })

        if (!response.ok) throw new Error(`Failed to delete ${isShift ? "shift" : "shift template"}`)

        await fetchData()
        showToast(`${isShift ? "Shift" : "Shift template"} deleted successfully.`, "success")
      } catch (err: any) {
        console.error("Error deleting:", err)
        showToast(`Failed to delete ${isShift ? "shift" : "shift template"}.`, "error")
      } finally {
        setSaving(false)
      }
    },
    [cookies, showToast, fetchData]
  )

  const totalShifts = useMemo(
    () => contracts.reduce((acc, contract) => acc + contract.shifts.length, 0),
    [contracts]
  )

  const totalTemplates = useMemo(() => shiftTemplates.length, [shiftTemplates])

  const averageRate = useMemo(
    () =>
      contracts.reduce((acc, contract) => {
        const contractTotal = contract.shifts.reduce((sum, shift) => sum + (shift.rate_per_hours || 0), 0)
        return acc + contractTotal
      }, 0) / Math.max(totalShifts, 1),
    [contracts, totalShifts]
  )

  const filteredContracts = useMemo(() => {
    if (!debouncedSearchTerm && selectedContract === "all") return contracts
    return contracts.filter(
      (contract) =>
        (selectedContract === "all" || contract.id.toString() === selectedContract) &&
        (contract.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          contract.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    )
  }, [contracts, selectedContract, debouncedSearchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading shift management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error Loading Data</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
                <p className="text-gray-600 mt-1">Manage contracts, shifts, and templates</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
                <GradientButton
                  text="New Contract"
                  onClick={() => setIsContractModalOpen(true)}
                  Icon={Plus}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contracts and shifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Contracts</option>
                {contracts.map((contract: Contract) => (
                  <option key={contract.id} value={contract.id.toString()}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 mt-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-orange" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Shifts</p>
                  <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
                </div>
                <Clock className="h-8 w-8 text-magenta" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTemplates}</p>
                </div>
                <Settings className="h-8 w-8 text-rose" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Rate</p>
                  <p className="text-2xl font-bold text-gray-900">€{averageRate.toFixed(2)}</p>
                </div>
                <Euro className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-orange" />
                <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
                <Badge variant="secondary">{filteredContracts.length}</Badge>
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                {filteredContracts.map((contract: Contract) => (
                  <AccordionItem
                    key={contract.id}
                    value={`contract-${contract.id}`}
                    className="border border-gray-200 rounded-xl bg-white shadow-sm group"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full text-left">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange transition-colors">
                            {contract.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{contract.description}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                            {contract.shifts.length} shifts
                          </Badge>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent accordion toggle
                                handleDeleteContract(contract.id)
                              }}
                              disabled={saving}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="grid gap-4">
                        {contract.shifts.map((shift: Shift) => (
                          <ShiftCard
                            key={shift.id}
                            shift={shift}
                            contracts={contracts}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            handleQuickAssign={handleQuickAssign}
                            handleSaveShift={handleSaveShift}
                            handleSaveTemplate={handleSaveTemplate}
                            isEditing={isEditing}
                            editedTemplate={editedTemplate}
                            setEditedTemplate={setEditedTemplate}
                            saving={saving}
                            assigningTemplate={assigningTemplate}
                          />
                        ))}
                        {contract.shifts.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No shifts assigned to this contract</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filteredContracts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No contracts found</p>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Shift Templates</h2>
                <Badge variant="secondary">{shiftTemplates.length}</Badge>
              </div>
              <div className="grid gap-4">
                {shiftTemplates.map((template: ShiftTemplate) => (
                  <ShiftCard
                    key={template.id}
                    shift={template}
                    isTemplate={true}
                    contracts={contracts}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleQuickAssign={handleQuickAssign}
                    handleSaveShift={handleSaveShift}
                    handleSaveTemplate={handleSaveTemplate}
                    isEditing={isEditing}
                    editedTemplate={editedTemplate}
                    setEditedTemplate={setEditedTemplate}
                    saving={saving}
                    assigningTemplate={assigningTemplate}
                  />
                ))}
                {shiftTemplates.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No templates found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Shift Template Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Shift Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Template Name</label>
                <Input
                  placeholder="Enter template name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Start Time</label>
                  <Input
                    type="time"
                    value={newTemplate.hours_from}
                    onChange={(e) => setNewTemplate({ ...newTemplate, hours_from: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">End Time</label>
                  <Input
                    type="time"
                    value={newTemplate.hours_to}
                    onChange={(e) => setNewTemplate({ ...newTemplate, hours_to: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Rate per Hour</label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    value={newTemplate.rate_per_hours || ""}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        rate_per_hours: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={saving}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Notes</label>
                <Input
                  value={newTemplate.shift_note}
                  onChange={(e) => setNewTemplate({ ...newTemplate, shift_note: e.target.value })}
                  disabled={saving}
                  placeholder="Add shift notes..."
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">Color</label>
                <input
                  type="color"
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                  value={newTemplate.colors}
                  onChange={(e) => setNewTemplate({ ...newTemplate, colors: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewTemplate({
                    name: "",
                    hours_from: "06:00:00",
                    hours_to: "14:00:00",
                    shift_note: "",
                    rate_per_hours: 0,
                    colors: "#FFB6D1",
                    contract: null,
                  })
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTemplate}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Contract Modal */}
        <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Contract Name</label>
                <Input
                  placeholder="Enter contract name"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <Input
                  placeholder="Enter contract description"
                  value={newContract.description}
                  onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsContractModalOpen(false)
                  setNewContract({ name: "", description: "" })
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddContract}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Creating..." : "Create Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default ShiftManagement
