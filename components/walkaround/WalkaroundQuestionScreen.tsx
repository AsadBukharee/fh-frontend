"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { toast } from "sonner"
import { ChevronDown, Trash2, Edit, Camera, Loader2, GripVertical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import WalkaroundFollowUpQuestion from "./WalkaroundFollowUpQuestion"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { MultiSelect } from "../ui/multi-select"
import { Badge } from "../ui/badge"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

const ItemType = {
    ROW: "row",
}

interface DraggableRowProps {
    id: number
    index: number
    moveRow: (dragIndex: number, hoverIndex: number) => void
    children: React.ReactNode
    onHover?: (isOver: boolean) => void
}

const DraggableRow = ({ id, index, moveRow, children }: DraggableRowProps) => {
    const ref = useRef<HTMLTableRowElement>(null)
    const [{ handlerId }, drop] = useDrop({
        accept: ItemType.ROW,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            }
        },
        hover(item: any, monitor) {
            if (!ref.current) return
            const dragIndex = item.index
            const hoverIndex = index

            if (dragIndex === hoverIndex) return

            const hoverBoundingRect = ref.current?.getBoundingClientRect()
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            const clientOffset = monitor.getClientOffset()
            const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

            moveRow(dragIndex, hoverIndex)
            item.index = hoverIndex
        },
    })

    const [{ isDragging }, drag] = useDrag({
        type: ItemType.ROW,
        item: () => {
            return { id, index }
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    drag(drop(ref))

    return (
        <TableRow
            ref={ref}
            data-handler-id={handlerId}
            className={`${isDragging ? "opacity-0" : "opacity-100"} cursor-move hover:bg-gray-100 transition-colors bg-white`}
        >
            {children}
        </TableRow>
    )
}

interface Category {
    id: number
    name: string
    code: string
}

interface FollowUpQuestion {
    id: number
    parent_wa_question: number | null
    parent: number | null
    code: string
    category_name: string | null
    text: string
    display_order: number
    severity: string
    tick_all: boolean
    follow_up_instruction: string | null
    follow_ups: FollowUpQuestion[]
}

interface WalkaroundQuestion {
    id: number
    question: string
    instruction: string | null
    question_code: string | null
    category: Category | number | null
    vehicle_types: number[]
    display_order: number
    take_picture_on_pass: boolean
    take_picture_on_fail: boolean
    note: string
    is_pre_check: boolean
    on_fail_blocks_walkaround: boolean
    severity: string
    tick_all: boolean
    follow_up_instruction: string | null
    follow_ups: FollowUpQuestion[]
    created_at: string | null
    updated_at: string | null
}

interface VehicleType {
    id: number
    name: string
    description: string
    created_at: string
    updated_at: string
}

interface QuestionFormData {
    question: string
    instruction: string
    question_code: string
    category_id: string
    vehicle_types: string[]
    display_order: number
    take_picture_on_pass: boolean
    take_picture_on_fail: boolean
    note: string
    is_pre_check: boolean
    on_fail_blocks_walkaround: boolean
    severity: string
    tick_all: boolean
    follow_up_instruction: string
}

const emptyForm: QuestionFormData = {
    question: "",
    instruction: "",
    question_code: "",
    category_id: "",
    vehicle_types: [],
    display_order: 0,
    take_picture_on_pass: false,
    take_picture_on_fail: false,
    note: "",
    is_pre_check: false,
    on_fail_blocks_walkaround: false,
    severity: "VARIES",
    tick_all: false,
    follow_up_instruction: "",
}

const WalkaroundQuestionScreen = () => {
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedVehicleTypeIds, setSelectedVehicleTypeIds] = useState<string[]>([])
    const [questions, setQuestions] = useState<WalkaroundQuestion[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingTypes, setLoadingTypes] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [saving, setSaving] = useState(false)

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [formData, setFormData] = useState<QuestionFormData>(emptyForm)

    // Follow-up dialog states
    const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
    const [followUpParentWaId, setFollowUpParentWaId] = useState<number | null>(null)
    const [followUpParentId, setFollowUpParentId] = useState<number | null>(null)
    const [followUpEditId, setFollowUpEditId] = useState<number | null>(null)
    const [addVehicleTypeIds, setAddVehicleTypeIds] = useState<string[]>([])

    // Expand/Collapse state
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const [deleteFollowUpId, setDeleteFollowUpId] = useState<number | null>(null)

    const cookies = useCookies()

    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
    }), [cookies])

    // Fetch vehicle types on mount
    useEffect(() => {
        fetchVehicleTypes()
        fetchCategories()
    }, [])

    const fetchVehicleTypes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/vehicle-types/`, {
                headers: authHeaders,
            })
            if (!res.ok) throw new Error("Failed to fetch vehicle types")
            const result = await res.json()
            if (result.success) {
                setVehicleTypes(result.data)
                // Auto-select first if available
                if (result.data.length > 0) {
                    setSelectedVehicleTypeIds([result.data[0].id.toString()])
                }
            }
        } catch {
            toast.error("Failed to load vehicle types")
        } finally {
            setLoadingTypes(false)
        }
    }

    const moveRow = (dragIndex: number, hoverIndex: number) => {
        const dragRow = questions[dragIndex]
        const newQuestions = [...questions]
        newQuestions.splice(dragIndex, 1)
        newQuestions.splice(hoverIndex, 0, dragRow)

        // Update display_order based on new index
        const updatedQuestions = newQuestions?.map((q, idx) => ({
            ...q,
            display_order: idx + 1
        }))

        setQuestions(updatedQuestions)
    }

    const handleDragEnd = async () => {
        setSaving(true)
        try {
            const payload = questions?.map(q => ({
                ...q,
                "category_id": (q.category && typeof q.category === 'object') ? q.category.id : q.category
            }))

            const res = await fetch(`${API_URL}/api/walk-around-questions/bulk-update-wa-fu-questions/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Failed to persist new order")
            toast.success("Order updated successfully")
            fetchQuestions()
        } catch {
            toast.error("Failed to persist new order")
        } finally {
            setSaving(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/api/walkaround-categories/`, {
                headers: authHeaders,
            })
            if (!res.ok) throw new Error("Failed to fetch categories")
            const result = await res.json()
            // Assuming paginated response
            if (result.results) {
                setCategories(result.results)
            }
        } catch {
            toast.error("Failed to load categories")
        } finally {
            setLoadingCategories(false)
        }
    }

    // Fetch questions when vehicle type changes
    useEffect(() => {
        if (selectedVehicleTypeIds.length > 0) {
            fetchQuestions()
        } else {
            setQuestions([])
        }
    }, [selectedVehicleTypeIds])

    const fetchQuestions = async () => {
        if (selectedVehicleTypeIds.length === 0) return
        setLoading(true)
        try {
            const res = await fetch(
                `${API_URL}/api/walk-around-questions/?vehicle_types=[${selectedVehicleTypeIds.join(",")}]`,
                { headers: authHeaders }
            )
            if (!res.ok) throw new Error("Failed to fetch questions")
            const result = await res.json()
            if (result.success) {
                setQuestions(result.data?.results || result.data || [])
            }
        } catch {
            toast.error("Failed to load walkaround questions")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData(emptyForm)
        setEditId(null)
    }

    // Reset form when dialogs close; pre-fill vehicle type when Add opens
    useEffect(() => {
        if (!isAddOpen) {
            resetForm()
            setAddVehicleTypeIds([])
        } else {
            setAddVehicleTypeIds(selectedVehicleTypeIds)
        }
    }, [isAddOpen])

    useEffect(() => {
        if (!isEditOpen) resetForm()
    }, [isEditOpen])

    // CREATE — POST array payload
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.question.trim()) return toast.error("Question is required")
        if (addVehicleTypeIds.length === 0) return toast.error("Select at least one vehicle type")
        if (!formData.category_id) return toast.error("Select a category")
        if (formData.severity === "VARIES" && !formData.follow_up_instruction?.trim()) {
            return toast.error("Follow-up instruction is required for 'VARIES' severity")
        }

        setSaving(true)
        try {
            const payload = [
                {
                    vehicle_types: addVehicleTypeIds.map(id => Number(id)),
                    "category_id": Number(formData.category_id),
                    question: formData.question.trim(),
                    instruction: formData.instruction.trim(),
                    question_code: formData.question_code.trim(),
                    display_order: formData.display_order,
                    take_picture_on_pass: formData.take_picture_on_pass,
                    take_picture_on_fail: formData.take_picture_on_fail,
                    note: formData.note.trim(),
                    is_pre_check: formData.is_pre_check,
                    on_fail_blocks_walkaround: formData.on_fail_blocks_walkaround,
                    severity: formData.severity,
                    tick_all: formData.tick_all,
                    follow_up_instruction: formData.follow_up_instruction.trim(),
                },
            ]
            const res = await fetch(`${API_URL}/api/walk-around-questions/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Failed to create question")
            const result = await res.json()
            toast.success("Question added successfully")
            setIsAddOpen(false)

            // Trigger follow-up if severity is VARIES
            if (formData.severity === "VARIES") {
                const createdQuestion = Array.isArray(result) ? result[0] : (result.data && Array.isArray(result.data) ? result.data[0] : result.data)
                const questionId = createdQuestion?.id
                if (questionId) {
                    setFollowUpParentWaId(questionId)
                    setFollowUpParentId(null)
                    setIsFollowUpOpen(true)
                }
            }

            fetchQuestions()
        } catch {
            toast.error("Failed to add question")
        } finally {
            setSaving(false)
        }
    }

    // UPDATE — PUT single item
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editId) return
        if (!formData.question.trim()) return toast.error("Question is required")
        if (!formData.category_id) return toast.error("Select a category")
        if (formData.severity === "VARIES" && !formData.follow_up_instruction?.trim()) {
            return toast.error("Follow-up instruction is required for 'VARIES' severity")
        }

        setSaving(true)
        try {
            const payload = {
                vehicle_types: formData.vehicle_types.map(id => Number(id)),
                "category_id": Number(formData.category_id),
                question: formData.question.trim(),
                instruction: formData.instruction.trim(),
                question_code: formData.question_code.trim(),
                display_order: formData.display_order,
                take_picture_on_pass: formData.take_picture_on_pass,
                take_picture_on_fail: formData.take_picture_on_fail,
                note: formData.note.trim(),
                is_pre_check: formData.is_pre_check,
                on_fail_blocks_walkaround: formData.on_fail_blocks_walkaround,
                severity: formData.severity,
                tick_all: formData.tick_all,
                follow_up_instruction: formData.follow_up_instruction.trim(),
            }
            const res = await fetch(`${API_URL}/api/walk-around-questions/${editId}/`, {
                method: "PUT",
                headers: authHeaders,
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Failed to update question")
            const result = await res.json()
            toast.success("Question updated successfully")
            setIsEditOpen(false)

            // Trigger follow-up if severity is VARIES
            if (formData.severity === "VARIES") {
                const questionId = result.id || result.data?.id || editId
                if (questionId) {
                    setFollowUpParentWaId(questionId)
                    setFollowUpParentId(null)
                    setIsFollowUpOpen(true)
                }
            }

            fetchQuestions()
        } catch {
            toast.error("Failed to update question")
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (item: WalkaroundQuestion) => {
        // Normalize category_id
        let categoryId = ""
        if (item.category) {
            if (typeof item.category === 'object') {
                categoryId = item.category.id.toString()
            } else {
                categoryId = item.category.toString()
            }
        }

        // Normalize vehicle_types to string array
        let vTypes: string[] = []
        if (item.vehicle_types) {
            if (Array.isArray(item.vehicle_types)) {
                vTypes = item.vehicle_types.map(vt => {
                    if (typeof vt === 'object') return (vt as any).id.toString()
                    return vt.toString()
                })
            } else {
                vTypes = [(item.vehicle_types as any).toString()]
            }
        }

        setFormData({
            question: item.question,
            instruction: item.instruction || "",
            question_code: item.question_code || "",
            category_id: categoryId,
            vehicle_types: vTypes,
            display_order: item.display_order,
            take_picture_on_pass: item.take_picture_on_pass,
            take_picture_on_fail: item.take_picture_on_fail,
            note: item.note || "",
            is_pre_check: item.is_pre_check,
            on_fail_blocks_walkaround: item.on_fail_blocks_walkaround,
            severity: item.severity,
            tick_all: item.tick_all,
            follow_up_instruction: item.follow_up_instruction || "",
        })
        setEditId(item.id)
        setIsEditOpen(true)
    }

    // DELETE
    const handleDelete = async () => {
        if (!deleteId) return
        try {
            const res = await fetch(`${API_URL}/api/walk-around-questions/${deleteId}/`, {
                method: "DELETE",
                headers: authHeaders,
            })
            if (!res.ok) throw new Error("Failed to delete question")
            toast.success("Question deleted successfully")
            setDeleteId(null)
            fetchQuestions()
        } catch {
            toast.error("Failed to delete question")
        }
    }

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    const handleEditFollowUp = (fu: FollowUpQuestion) => {
        setFollowUpEditId(fu.id)
        setFollowUpParentId(fu.parent)
        setFollowUpParentWaId(fu.parent_wa_question)
        setIsFollowUpOpen(true)
    }

    const handleDeleteFollowUp = async () => {
        if (!deleteFollowUpId) return
        try {
            const res = await fetch(`${API_URL}/api/follow-up-questions/${deleteFollowUpId}/`, {
                method: "DELETE",
                headers: authHeaders,
            })
            if (!res.ok) throw new Error("Failed to delete follow-up question")
            toast.success("Follow-up question deleted successfully")
            setDeleteFollowUpId(null)
            fetchQuestions()
        } catch {
            toast.error("Failed to delete follow-up question")
        }
    }

    const updateAutoFields = async (categoryId: string, vehicleTypeId: string) => {
        if (!categoryId || !vehicleTypeId) return

        const selectedCat = categories.find(c => c.id.toString() === categoryId)
        if (!selectedCat) return

        let targetQuestions = questions
        // If the requested vehicle type is not among the currently selected ones, fetch it specifically
        if (!selectedVehicleTypeIds.includes(vehicleTypeId)) {
            try {
                const res = await fetch(
                    `${API_URL}/api/walk-around-questions/?vehicle_types=[${vehicleTypeId}]`,
                    { headers: authHeaders }
                )
                const result = await res.json()
                if (result.success) {
                    targetQuestions = result.data?.results || result.data || []
                }
            } catch (error) {
                console.error("Failed to fetch questions for auto-generation", error)
            }
        }

        const categoryQuestions = targetQuestions.filter(q => {
            const qCatId = (q.category && typeof q.category === 'object') ? q.category.id : q.category
            const matchesCategory = qCatId?.toString() === categoryId
            const matchesVehicleType = q.vehicle_types.map(id => id.toString()).includes(vehicleTypeId)
            return matchesCategory && matchesVehicleType
        })

        const nextNumber = categoryQuestions.length + 1
        const autoCode = `${selectedCat.code}${nextNumber}`
        const maxOrder = categoryQuestions.reduce((max, q) => Math.max(max, q.display_order), 0)

        setFormData(prev => ({
            ...prev,
            category_id: categoryId,
            question_code: autoCode,
            display_order: maxOrder + 1
        }))
    }

    const vehicleTypeOptions = useMemo(() => vehicleTypes.map(vt => ({
        label: vt.name,
        value: vt.id.toString()
    })), [vehicleTypes])

    // Form fields shared between Add and Edit dialogs
    const renderFormFields = (isEdit: boolean = false) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEdit && (
                <div className="space-y-2 md:col-span-2">
                    <Label>Vehicle Types</Label>
                    <MultiSelect
                        options={vehicleTypeOptions}
                        selected={formData.vehicle_types}
                        onChange={(vals) => setFormData({ ...formData, vehicle_types: vals })}
                        placeholder="Select vehicle types"
                    />
                </div>
            )}
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="question">Question</Label>
                <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g., Dashboard Warning Lights"
                />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instruction">Instruction</Label>
                <Textarea
                    id="instruction"
                    value={formData.instruction}
                    onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                    placeholder="Instructions for the checker"
                    rows={2}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                    value={formData.category_id}
                    onValueChange={(value) => {
                        if (!editId) {
                            // Using the first vehicle type for auto-generation context if multiple are selected
                            const contextType = addVehicleTypeIds[0] || selectedVehicleTypeIds[0]
                            updateAutoFields(value, contextType)
                        } else {
                            setFormData({ ...formData, category_id: value })
                        }
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name} ({cat.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="VARIES">VARIES</SelectItem>
                        <SelectItem value="IMMEDIATE">IMMEDIATE</SelectItem>
                        <SelectItem value="DELAYED">DELAYED</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Default Note / Tooltip</Label>
                <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="e.g., Check with engine running"
                    rows={2}
                />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="follow_up_instruction">Follow-up Instruction</Label>
                <Textarea
                    id="follow_up_instruction"
                    value={formData.follow_up_instruction}
                    onChange={(e) => setFormData({ ...formData, follow_up_instruction: e.target.value })}
                    placeholder={formData.severity === "VARIES" ? "Enter instructions (REQUIRED for VARIES)" : "e.g., Tick ALL that apply:"}
                    rows={2}
                />
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    id="take_picture_on_pass"
                    checked={formData.take_picture_on_pass}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, take_picture_on_pass: checked })
                    }
                />
                <Label htmlFor="take_picture_on_pass">Photo on Pass</Label>
            </div>
            <div className="flex items-center gap-3">
                <Switch
                    id="take_picture_on_fail"
                    checked={formData.take_picture_on_fail}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, take_picture_on_fail: checked })
                    }
                />
                <Label htmlFor="take_picture_on_fail">Photo on Fail</Label>
            </div>
            <div className="flex items-center gap-3">
                <Switch
                    id="is_pre_check"
                    checked={formData.is_pre_check}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_pre_check: checked })
                    }
                />
                <Label htmlFor="is_pre_check">Pre-check Question</Label>
            </div>
            <div className="flex items-center gap-3">
                <Switch
                    id="on_fail_blocks_walkaround"
                    checked={formData.on_fail_blocks_walkaround}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, on_fail_blocks_walkaround: checked })
                    }
                />
                <Label htmlFor="on_fail_blocks_walkaround">Fail Blocks Walkaround</Label>
            </div>
            <div className="flex items-center gap-3">
                <Switch
                    id="tick_all"
                    checked={formData.tick_all}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, tick_all: checked })
                    }
                />
                <Label htmlFor="tick_all">Tick All Applicable</Label>
            </div>
        </div>
    )

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'VARIES':
                return {
                    border: 'border-blue-500',
                    bg: 'bg-white',
                    text: 'text-blue-600',
                    label: 'Varies'
                }
            case 'IMMEDIATE':
                return {
                    border: 'border-orange-500',
                    bg: 'bg-white',
                    text: 'text-red-700',
                    label: 'Immediate'
                }
            case 'DELAYED':
            default:
                return {
                    border: 'border-yellow-500',
                    bg: 'bg-white',
                    text: 'text-yellow-600',
                    label: 'Delayed'
                }
        }
    }

    const renderFollowUps = (followUps: FollowUpQuestion[], activeDepths: Set<number> = new Set(), depth: number = 1) => {
        return followUps?.map((fu, index) => {
            const styles = getSeverityStyles(fu.severity)
            const isLast = index === followUps.length - 1

            // For the next level, we only keep this depth active if there are siblings after this one
            const nextActiveDepths = new Set(activeDepths)
            if (!isLast) {
                nextActiveDepths.add(depth)
            } else {
                nextActiveDepths.delete(depth)
            }

            return (
                <React.Fragment key={`fu-group-${fu.id}`}>
                    <TableRow className="hover:bg-transparent border-none">
                        <TableCell></TableCell>
                        <TableCell className="text-center font-medium text-gray-400">
                            {fu.display_order}
                        </TableCell>
                        <TableCell className="relative p-0" colSpan={5}>
                            <div className="flex items-stretch">
                                {/* Connector Area */}
                                <div className="flex" style={{ paddingLeft: '20px' }}>
                                    {Array.from({ length: depth })?.map((_, i) => {
                                        const d = i + 1
                                        const isCurrentConnector = d === depth
                                        const isActiveParent = activeDepths.has(d)

                                        return (
                                            <div key={`depth-${d}`} className="relative w-10 flex justify-center">
                                                {/* Parent/Sibling line passing through */}
                                                {isActiveParent && !isCurrentConnector && (
                                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-300" />
                                                )}

                                                {/* Current level L-connector */}
                                                {isCurrentConnector && (
                                                    <>
                                                        <div className="absolute left-1/2 top-0 w-px bg-blue-300"
                                                            style={{ height: isLast ? '50%' : '100%' }}
                                                        />
                                                        <div className="absolute left-1/2 top-1/2 w-5 h-px bg-blue-300" />
                                                        <div className="absolute left-[calc(50%+20px)] top-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-l-[6px] border-l-blue-300" />
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* The Question Box */}
                                <div className={`my-2 flex-1 max-w-2xl rounded-xl border-2 px-6 py-3 shadow-sm transition-all hover:scale-[1.01] ${styles.border} ${styles.bg}`}>
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1" style={{ color: 'inherit' }}>
                                                {fu.code}
                                            </span>
                                            <span className={`text-lg font-semibold ${styles.text}`}>
                                                {fu.text}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col items-end mr-4">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${styles.border} ${styles.text}`}>
                                                    {fu.severity}
                                                </span>
                                            </div>

                                            <div className="flex gap-1">
                                                {fu.follow_ups && fu.follow_ups.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleRow(fu.id)}
                                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedRows.has(fu.id) ? "rotate-45" : ""}`} />
                                                    </Button>
                                                )}
                                                {fu.severity === 'VARIES' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setFollowUpParentWaId(fu.parent_wa_question);
                                                            setFollowUpParentId(fu.id);
                                                            setIsFollowUpOpen(true);
                                                        }}
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditFollowUp(fu)}
                                                    className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteFollowUpId(fu.id)}
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Follow-up Question?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete this follow-up question and all its nested children.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeleteFollowUp} className="bg-red-600 hover:bg-red-700">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                    {expandedRows.has(fu.id) && fu.follow_ups && fu.follow_ups.length > 0 && (
                        renderFollowUps(fu.follow_ups, nextActiveDepths, depth + 1)
                    )}
                </React.Fragment>
            )
        })
    }

    if (loadingTypes) {
        return <div className="p-4">Loading vehicle types...</div>
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap font-semibold">Vehicle Type Filter</Label>
                    <div className="w-[300px]">
                        <MultiSelect
                            options={vehicleTypeOptions}
                            selected={selectedVehicleTypeIds}
                            onChange={setSelectedVehicleTypeIds}
                            placeholder="All Vehicle Types"
                        />
                    </div>
                </div>

                {/* Add Question */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[600px] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Add Walkaround Question</DialogTitle>
                            <DialogDescription>
                                Create a new walkaround check question.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 ">
                            <div className="space-y-2">
                                <Label>Vehicle Types</Label>
                                <MultiSelect
                                    options={vehicleTypeOptions}
                                    selected={addVehicleTypeIds}
                                    onChange={(vals) => {
                                        setAddVehicleTypeIds(vals)
                                        if (formData.category_id) {
                                            updateAutoFields(formData.category_id, vals[0])
                                        }
                                    }}
                                    placeholder="Select vehicle types"
                                />
                            </div>
                            {renderFormFields(false)}
                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {formData.severity === "VARIES" ? "Save & Add Follow-up" : "Save"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Questions Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading questions...</span>
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {selectedVehicleTypeIds.length > 0
                        ? "No questions found for the selected vehicle types."
                        : "Select vehicle types to view questions."}
                </div>
            ) : (
                <DndProvider backend={HTML5Backend}>
                    <div className="space-y-2">
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDragEnd}
                                disabled={saving}
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Order
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead className="w-[60px]">Order</TableHead>
                                    <TableHead className="w-[80px]">Code</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Question</TableHead>
                                    <TableHead className="w-[80px] text-center">Photo</TableHead>
                                    <TableHead className="w-[100px]">Severity</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions?.map((q, index) => (
                                    <React.Fragment key={`group-${q.id}`}>
                                        <DraggableRow
                                            id={q.id}
                                            index={index}
                                            moveRow={moveRow}
                                        >
                                            <TableCell className="text-gray-400">
                                                <GripVertical className="w-4 h-4" />
                                            </TableCell>
                                            <TableCell className="font-medium text-center">{q.display_order}</TableCell>
                                            <TableCell className="font-bold">{q.question_code || "—"}</TableCell>
                                            <TableCell>
                                                {(q.category && typeof q.category === 'object') ? q.category?.name : categories.find(c => c.id === q.category)?.name || "—"}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate">{q.question}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-1">
                                                    {q.take_picture_on_pass && <Camera className="w-4 h-4 text-green-500" />}
                                                    {q.take_picture_on_fail && <Camera className="w-4 h-4 text-red-500" />}
                                                    {!q.take_picture_on_pass && !q.take_picture_on_fail && <span className="text-gray-400">—</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={q.severity === 'IMMEDIATE' ? 'destructive' : q.severity === 'ADVISORY' ? 'outline' : 'secondary'}>
                                                    {q.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {q.follow_ups && q.follow_ups.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRow(q.id);
                                                            }}
                                                            className="h-8 w-8 text-blue-600"
                                                        >
                                                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedRows.has(q.id) ? "rotate-45" : ""}`} />
                                                        </Button>
                                                    )}
                                                    {q.severity === 'VARIES' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFollowUpParentWaId(q.id);
                                                                setFollowUpParentId(null);
                                                                setIsFollowUpOpen(true);
                                                            }}
                                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(q);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>

                                                    <AlertDialog
                                                        open={deleteId === q.id}
                                                        onOpenChange={(open) => {
                                                            if (!open) setDeleteId(null)
                                                        }}
                                                    >
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteId(q.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete &quot;{q.question}&quot;? This
                                                                    action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDelete}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </DraggableRow>
                                        {expandedRows.has(q.id) && q.follow_ups && q.follow_ups.length > 0 && (
                                            renderFollowUps(q.follow_ups)
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DndProvider>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className=" max-h-[600px] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Walkaround Question</DialogTitle>
                        <DialogDescription>
                            Update the question details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        {renderFormFields(true)}
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {formData.severity === "VARIES" ? "Update & Add Follow-up" : "Update"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <WalkaroundFollowUpQuestion
                isOpen={isFollowUpOpen}
                onClose={() => {
                    setIsFollowUpOpen(false)
                    setFollowUpEditId(null)
                    fetchQuestions()
                }}
                parent_wa_question={followUpParentWaId}
                parent={followUpParentId}
                vehicle_type={Number(selectedVehicleTypeIds[0])}
                category={Number(formData.category_id)}
                editId={followUpEditId}
            />
        </div>
    )
}

export default WalkaroundQuestionScreen