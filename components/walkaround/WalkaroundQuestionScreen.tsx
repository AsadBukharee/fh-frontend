"use client"

import React, { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

interface VehicleType {
    id: number
    name: string
    description: string
}

interface WalkaroundQuestion {
    id: number
    question: string
    takePicture: boolean
    note: string
    created_at: string | null
    updated_at: string | null
    vehicle_type: number
}

interface QuestionFormData {
    question: string
    takePicture: boolean
    note: string
}

const emptyForm: QuestionFormData = {
    question: "",
    takePicture: false,
    note: "",
}

const WalkaroundQuestionScreen = () => {
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
    const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<string>("")
    const [questions, setQuestions] = useState<WalkaroundQuestion[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingTypes, setLoadingTypes] = useState(true)
    const [saving, setSaving] = useState(false)

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [formData, setFormData] = useState<QuestionFormData>(emptyForm)
    const [addVehicleTypeId, setAddVehicleTypeId] = useState<string>("")

    const cookies = useCookies()

    const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
    }

    // Fetch vehicle types on mount
    useEffect(() => {
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
                        setSelectedVehicleTypeId(result.data[0].id.toString())
                    }
                }
            } catch {
                toast.error("Failed to load vehicle types")
            } finally {
                setLoadingTypes(false)
            }
        }
        fetchVehicleTypes()
    }, [])

    // Fetch questions when vehicle type changes
    useEffect(() => {
        if (selectedVehicleTypeId) {
            fetchQuestions()
        } else {
            setQuestions([])
        }
    }, [selectedVehicleTypeId])

    const fetchQuestions = async () => {
        if (!selectedVehicleTypeId) return
        setLoading(true)
        try {
            const res = await fetch(
                `${API_URL}/api/walk-around-questions/?vehicle_type_id=${selectedVehicleTypeId}`,
                { headers: authHeaders }
            )
            if (!res.ok) throw new Error("Failed to fetch questions")
            const result = await res.json()
            if (result.success) {
                setQuestions(result.data)
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
            setAddVehicleTypeId("")
        } else {
            setAddVehicleTypeId(selectedVehicleTypeId)
        }
    }, [isAddOpen])

    useEffect(() => {
        if (!isEditOpen) resetForm()
    }, [isEditOpen])

    // CREATE — POST array payload
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.question.trim()) return toast.error("Question is required")
        if (!addVehicleTypeId) return toast.error("Select a vehicle type")

        setSaving(true)
        try {
            const payload = [
                {
                    vehicle_type: Number(addVehicleTypeId),
                    question: formData.question.trim(),
                    takePicture: formData.takePicture,
                    note: formData.note.trim(),
                },
            ]
            const res = await fetch(`${API_URL}/api/walk-around-questions/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Failed to create question")
            toast.success("Question added successfully")
            setIsAddOpen(false)
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

        setSaving(true)
        try {
            const payload = {
                vehicle_type: Number(selectedVehicleTypeId),
                question: formData.question.trim(),
                takePicture: formData.takePicture,
                note: formData.note.trim(),
            }
            const res = await fetch(`${API_URL}/api/walk-around-questions/${editId}/`, {
                method: "PUT",
                headers: authHeaders,
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Failed to update question")
            toast.success("Question updated successfully")
            setIsEditOpen(false)
            fetchQuestions()
        } catch {
            toast.error("Failed to update question")
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (item: WalkaroundQuestion) => {
        setFormData({
            question: item.question,
            takePicture: item.takePicture,
            note: item.note || "",
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

    // Form fields shared between Add and Edit dialogs
    const renderFormFields = () => (
        <>
            <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g., Fuel / Oil / Coolant Leaks"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="e.g., Check for visible leaks under vehicle"
                    rows={3}
                />
            </div>
            <div className="flex items-center gap-3">
                <Switch
                    id="takePicture"
                    checked={formData.takePicture}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, takePicture: checked })
                    }
                />
                <Label htmlFor="takePicture">Require Photo</Label>
            </div>
        </>
    )

    if (loadingTypes) {
        return <div className="p-4">Loading vehicle types...</div>
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap font-semibold">Vehicle Type</Label>
                    <Select
                        value={selectedVehicleTypeId}
                        onValueChange={setSelectedVehicleTypeId}
                    >
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehicleTypes.map((vt) => (
                                <SelectItem key={vt.id} value={vt.id.toString()}>
                                    {vt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Add Question */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Walkaround Question</DialogTitle>
                            <DialogDescription>
                                Create a new walkaround check question.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Vehicle Type</Label>
                                <Select value={addVehicleTypeId} onValueChange={setAddVehicleTypeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vehicle type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicleTypes.map((vt) => (
                                            <SelectItem key={vt.id} value={vt.id.toString()}>
                                                {vt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {renderFormFields()}
                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save
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
                    {selectedVehicleTypeId
                        ? "No questions found for this vehicle type."
                        : "Select a vehicle type to view questions."}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead className="w-[100px] text-center">Photo</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.map((q, idx) => (
                            <TableRow
                                key={q.id}
                                onDoubleClick={() => handleEdit(q)}
                                className="cursor-pointer"
                                title="Double-click to edit"
                            >
                                <TableCell className="font-medium">{idx + 1}</TableCell>
                                <TableCell>{q.question}</TableCell>
                                <TableCell className="text-center">
                                    {q.takePicture ? (
                                        <Camera className="w-4 h-4 mx-auto text-orange-500" />
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 max-w-[300px] truncate">
                                    {q.note || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(q)}
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
                                                    onClick={() => setDeleteId(q.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Walkaround Question</DialogTitle>
                        <DialogDescription>
                            Update the question details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        {renderFormFields()}
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default WalkaroundQuestionScreen