"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Edit,
  Save,
  Trash2,
  Clock,
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
  HandCoins,
  Filter,
  LayoutGrid,
  RefreshCw,
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
import { formatToDDMMYYYY } from "@/app/utils/DateFormat"

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

const formatTime = (time: string): string => {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hoursNum = Number.parseInt(hours, 10)
  const period = hoursNum >= 12 ? "PM" : "AM"
  const formattedHours = hoursNum % 12 || 12
  return `${formattedHours}:${minutes} ${period}`
}

const ShiftCard = memo(
  ({
    shift,
    isTemplate = false,
    contracts,
    handleEdit,
    handleDelete,
    handleSaveShift,
    handleSaveTemplate,
    isEditing,
    editedTemplate,
    setEditedTemplate,
    saving,
    isSelected,
    onSelect,
    role,
  }: {
    shift: Shift | ShiftTemplate
    isTemplate?: boolean
    contracts: Contract[]
    handleEdit: (item: Shift | ShiftTemplate) => void
    handleDelete: (id: number, isShift: boolean) => Promise<void>
    handleSaveShift: (shift: Shift) => Promise<void>
    handleSaveTemplate: (template: ShiftTemplate) => Promise<void>
    isEditing: number | null
    editedTemplate: Shift | ShiftTemplate | null
    setEditedTemplate: (template: Shift | ShiftTemplate | null) => void
    saving: boolean
    isSelected?: boolean
    onSelect?: (id: number) => void
    role?: string
  }) => {
    const isEditingThis = isEditing === shift.id
    const assignedContract = shift.contract ? contracts.find((c) => c.id === shift.contract) : null

    return (
      <div
        className={`
        group relative bg-white rounded-lg shadow-sm border transition-all duration-200
        ${isTemplate ? "border-blue-100 hover:border-blue-200" : "border-gray-200"}
        ${isEditingThis ? "ring-2 ring-orange shadow-md" : "hover:shadow-md"}
        ${isSelected ? "ring-2 ring-orange border-orange" : ""}
      `}
      >
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ backgroundColor: shift.colors }} />

        <div className="p-4 pl-5">
          {isEditingThis && editedTemplate ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-orange" />}
                  {isTemplate ? "Edit Template" : "Edit Shift"}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditedTemplate(null)}
                  disabled={saving}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Shift Name</label>
                  <Input
                    placeholder="e.g., Morning Shift"
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                    disabled={saving}
                    className="h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Start Time</label>
                    <Input
                      type="time"
                      value={editedTemplate.hours_from}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, hours_from: e.target.value })}
                      disabled={saving}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">End Time</label>
                    <Input
                      type="time"
                      value={editedTemplate.hours_to}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, hours_to: e.target.value })}
                      disabled={saving}
                      className="h-9"
                    />
                  </div>
                </div>

                {role === 'superadmin' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Hourly Rate</label>
                    <div className="relative">
                      <HandCoins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                        className="pl-9 h-9"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Notes (Optional)</label>
                  <Input
                    value={editedTemplate.shift_note || ""}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, shift_note: e.target.value })}
                    disabled={saving}
                    placeholder="Add any additional details..."
                    className="h-9"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600">Color Label</label>
                  <input
                    type="color"
                    className="w-10 h-9 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    value={editedTemplate.colors || "#3B82F6"}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, colors: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <Button
                onClick={() => (isTemplate ? handleSaveTemplate(shift as ShiftTemplate) : handleSaveShift(shift as Shift))}
                disabled={saving}
                className="w-full bg-orange hover:bg-orange/90 h-9"
                size="sm"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {isTemplate && onSelect && (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(shift.id)}
                        className="h-4 w-4 text-orange border-gray-300 rounded focus:ring-2 focus:ring-orange"
                        disabled={isEditingThis || saving}
                      />
                      <span className="text-xs text-gray-500">Select for bulk action</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-1.5 truncate">{shift.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs">
                        {formatTime(shift.hours_from)} - {formatTime(shift.hours_to)}
                      </span>
                    </div>
                  </div>
                </div>
                {role === 'superadmin' && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 ml-2 shrink-0">
                    £{shift.rate_per_hours?.toFixed(2) || "0.00"}
                  </Badge>
                )}
              </div>

              {assignedContract && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-orange/10 rounded border border-orange/20">
                  <Building2 className="h-3.5 w-3.5 text-orange" />
                  <span className="text-xs font-medium text-orange">{assignedContract.name}</span>
                </div>
              )}

              {shift.shift_note && (
                <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <FileText className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                  <span className="line-clamp-2">{shift.shift_note}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: shift.colors }}
                  />
                  <span className="text-xs text-gray-500">
                    {formatToDDMMYYYY(shift.updated_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(shift)}
                        disabled={saving}
                        className="h-7 w-7 p-0 text-gray-600 hover:text-orange hover:bg-orange/10"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleDelete(shift.id, !isTemplate)}
                        variant="ghost"
                        disabled={saving}
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
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
    hours_from: "09:00",
    hours_to: "17:00",
    shift_note: "",
    rate_per_hours: 0,
    colors: "#FF6B35",
    contract: null as number | null,
  })
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([])
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState<boolean>(false)
  const [bulkContractId, setBulkContractId] = useState<number | null>(null)

  const cookies = useCookies()
  const role = cookies.get("role")
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
      if (!confirm("Are you sure you want to delete this contract? All associated shifts will also be removed.")) return

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
        hours_from: "09:00",
        hours_to: "17:00",
        shift_note: "",
        rate_per_hours: 0,
        colors: "#FF6B35",
        contract: null,
      })
    } catch (err: any) {
      console.error("Error creating template:", err)
      showToast(err.message || "Failed to create template.", "error")
    } finally {
      setSaving(false)
    }
  }, [newTemplate, cookies, showToast, fetchData])

  const handleToggleTemplate = useCallback((id: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((templateId) => templateId !== id) : [...prev, id]
    )
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    const allIds = shiftTemplates.map((t) => t.id)
    setSelectedTemplates((prev) => {
      const isAllSelected = allIds.every((id) => prev.includes(id))
      return isAllSelected ? [] : allIds
    })
  }, [shiftTemplates])

  const handleBulkAssign = useCallback(async () => {
    if (bulkContractId === null) {
      showToast("Please select a contract for assignment.", "error")
      return
    }

    if (selectedTemplates.length === 0) {
      showToast("Please select at least one template.", "error")
      return
    }

    setSaving(true)
    try {
      const assignPromises = selectedTemplates.map((templateId) =>
        fetch(`${API_URL}/api/staff/shifts/${templateId}/add-to-contract/${bulkContractId}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || `Failed to assign template ${templateId}`)
          }
          return templateId
        })
      )

      await Promise.all(assignPromises)

      await fetchData()
      const contractName = bulkContractId ? contracts.find((c) => c.id === bulkContractId)?.name : "No Contract"
      showToast(`${selectedTemplates.length} template(s) assigned to ${contractName}.`, "success")
      setSelectedTemplates([])
      setIsBulkAssignModalOpen(false)
      setBulkContractId(null)
    } catch (err: any) {
      console.error("Error assigning templates:", err)
      showToast(err.message || "Failed to assign templates.", "error")
    } finally {
      setSaving(false)
    }
  }, [selectedTemplates, bulkContractId, contracts, cookies, showToast, fetchData])

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
        const response = await fetch(`${API_URL}/api/staff/shifts/${shift.id}/`, {
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
        })

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

  const filteredTemplates = useMemo(() => {
    if (!debouncedSearchTerm) return shiftTemplates
    return shiftTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        template.shift_note?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [shiftTemplates, debouncedSearchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading shift management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md">
          <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchData} className="bg-orange hover:bg-orange/90">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contracts & Shift Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage contracts, shifts, and templates</p>
          </div>
          <div className="flex items-center gap-3">


          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
                <div className="p-3 bg-orange/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Shifts</p>
                  <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTemplates}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {role === 'superadmin' && (
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Average Rate</p>
                    <p className="text-2xl font-bold text-gray-900">£{averageRate.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <HandCoins className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 z-1 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, description, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="contracts" className="w-full">
          <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden">
            <TabsTrigger
              value="contracts"
              className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Contracts Management
              <Badge variant="secondary" className="ml-2 bg-white/50">
                {contracts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Shift Templates
              <Badge variant="secondary" className="ml-2 bg-white/50">
                {shiftTemplates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Contracts Tab Content */}
          <TabsContent value="contracts" className="mt-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Contracts</h2>
              <div className=" flex gap-2">
                <Button
                  onClick={fetchData}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw
                    className={`w-4 h-4  ${loading ? "animate-spin" : ""
                      }`}
                  />

                </Button>
                <GradientButton
                  text="New Contract"
                  onClick={() => setIsContractModalOpen(true)}
                  Icon={Plus}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {selectedContract === "all" ? "All Contracts" : contracts.find(c => c.id.toString() === selectedContract)?.name}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setSelectedContract("all")}>
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      All Contracts
                      {selectedContract === "all" && <Check className="h-4 w-4 ml-auto text-orange" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {contracts.map((contract) => (
                      <DropdownMenuItem
                        key={contract.id}
                        onClick={() => setSelectedContract(contract.id.toString())}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {contract.name}
                        {selectedContract === contract.id.toString() && (
                          <Check className="h-4 w-4 ml-auto text-orange" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {filteredContracts.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredContracts.map((contract: Contract) => (
                  <AccordionItem
                    key={contract.id}
                    value={`contract-${contract.id}`}
                    className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between w-full text-left">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {contract.name}
                            </h3>
                            <Badge className="bg-orange/10 text-orange border-0 shrink-0">
                              {contract.shifts.length} {contract.shifts.length === 1 ? 'shift' : 'shifts'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{contract.description || "No description"}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatToDDMMYYYY(contract.updated_at)}
                            </span>
                            {contract.updated_by_name && (
                              <span>• {contract.updated_by_name}</span>
                            )}
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteContract(contract.id)
                              }}
                              disabled={saving}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete contract</TooltipContent>
                        </Tooltip>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                        {contract.shifts.map((shift: Shift) => (
                          <ShiftCard
                            key={shift.id}
                            shift={shift}
                            contracts={contracts}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            handleSaveShift={handleSaveShift}
                            handleSaveTemplate={handleSaveTemplate}
                            isEditing={isEditing}
                            editedTemplate={editedTemplate}
                            setEditedTemplate={setEditedTemplate}
                            saving={saving}
                            role={role}
                          />
                        ))}
                      </div>
                      {contract.shifts.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                          <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="font-medium text-sm">No shifts assigned</p>
                          <p className="text-xs mt-1">Add shifts from templates to get started</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No contracts found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Create your first contract to get started"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsContractModalOpen(true)} className="bg-orange hover:bg-orange/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab Content */}
          <TabsContent value="templates" className="mt-6 space-y-4">
            {selectedTemplates.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange/10 border border-orange/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-orange" />
                  <span className="font-medium text-orange text-sm">
                    {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTemplates([])}
                    className="border-orange/30 text-orange hover:bg-orange/10 h-8"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsBulkAssignModalOpen(true)}
                    className="bg-orange hover:bg-orange/90 h-8"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Assign to Contract
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Templates</h2>
              <div className=" flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4  ${loading ? "animate-spin" : ""
                      }`}
                  />

                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Shift Template
                </Button>
                {shiftTemplates.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSelectAll}
                    disabled={saving}
                    className="text-orange hover:text-orange/90 hover:bg-orange/10"
                  >
                    {selectedTemplates.length === shiftTemplates.length ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map((template: ShiftTemplate) => (
                  <ShiftCard
                    key={template.id}
                    shift={template}
                    isTemplate={true}
                    contracts={contracts}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleSaveShift={handleSaveShift}
                    handleSaveTemplate={handleSaveTemplate}
                    isEditing={isEditing}
                    editedTemplate={editedTemplate}
                    setEditedTemplate={setEditedTemplate}
                    saving={saving}
                    isSelected={selectedTemplates.includes(template.id)}
                    onSelect={handleToggleTemplate}
                    role={role}
                  />
                ))}
              </div>
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No templates found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Create reusable shift templates for quick assignment"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-orange hover:bg-orange/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Shift Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Template Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Shift Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Template Name *</label>
                <Input
                  placeholder="e.g., Morning Shift, Night Shift"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  disabled={saving}
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Start Time *</label>
                  <Input
                    type="time"
                    value={newTemplate.hours_from}
                    onChange={(e) => setNewTemplate({ ...newTemplate, hours_from: e.target.value })}
                    disabled={saving}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">End Time *</label>
                  <Input
                    type="time"
                    value={newTemplate.hours_to}
                    onChange={(e) => setNewTemplate({ ...newTemplate, hours_to: e.target.value })}
                    disabled={saving}
                    className="h-10"
                  />
                </div>
              </div>
              {role === 'superadmin' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Hourly Rate</label>
                  <div className="relative">
                    <HandCoins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                      className="pl-10 h-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Notes (Optional)</label>
                <Input
                  value={newTemplate.shift_note}
                  onChange={(e) => setNewTemplate({ ...newTemplate, shift_note: e.target.value })}
                  disabled={saving}
                  placeholder="Add any additional details..."
                  className="h-10"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Color Label</label>
                <input
                  type="color"
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                  value={newTemplate.colors}
                  onChange={(e) => setNewTemplate({ ...newTemplate, colors: e.target.value })}
                  disabled={saving}
                />
                <span className="text-sm text-gray-500">{newTemplate.colors}</span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewTemplate({
                    name: "",
                    hours_from: "09:00",
                    hours_to: "17:00",
                    shift_note: "",
                    rate_per_hours: 0,
                    colors: "#FF6B35",
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
                className="bg-orange hover:bg-orange/90"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {saving ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Contract Modal */}
        <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Contract</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Contract Name *</label>
                <Input
                  placeholder="e.g., Full-Time Staff, Part-Time Workers"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  disabled={saving}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                <Input
                  placeholder="Brief description of the contract..."
                  value={newContract.description}
                  onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  disabled={saving}
                  className="h-10"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
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
                className="bg-orange hover:bg-orange/90"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {saving ? "Creating..." : "Create Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Assign Modal */}
        <Dialog open={isBulkAssignModalOpen} onOpenChange={setIsBulkAssignModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Assign Templates to Contract</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-4 bg-orange/10 rounded-lg border border-orange/20">
                <p className="text-sm font-medium text-orange">
                  {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Contract</label>
                <select
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange focus:border-orange disabled:bg-gray-100"
                  value={bulkContractId ?? ""}
                  onChange={(e) =>
                    setBulkContractId(e.target.value ? Number.parseInt(e.target.value) : null)
                  }
                  disabled={saving}
                >
                  <option value="">Select a contract...</option>
                  {contracts.map((contract: Contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.name} ({contract.shifts.length} shifts)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkAssignModalOpen(false)
                  setBulkContractId(null)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={saving || bulkContractId === null}
                className="bg-orange hover:bg-orange/90"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Building2 className="h-4 w-4 mr-2" />}
                {saving ? "Assigning..." : "Assign Templates"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default ShiftManagement