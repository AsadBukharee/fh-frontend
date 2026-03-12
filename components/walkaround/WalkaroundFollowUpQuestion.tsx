"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useCookies } from "next-client-cookies"
import { toast } from "sonner"
import { Loader2, Calendar, User } from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface FollowUpFormData {
    code: string
    text: string
    display_order: number
    severity: string
    tick_all: boolean
    follow_up_instruction: string
    // Add date fields
    created_at?: string
    updated_at?: string
    created_by?: string
    updated_by?: string
    created_by_name?: string
    updated_by_name?: string
}

const emptyFollowUp: FollowUpFormData = {
    code: "",
    text: "",
    display_order: 1,
    severity: "IMMEDIATE",
    tick_all: false,
    follow_up_instruction: "",
}

interface WalkaroundFollowUpQuestionProps {
    isOpen: boolean
    onClose: () => void
    parent_wa_question: number | null
    parent: number | null
    vehicle_type: number
    category: number
    editId?: number | null
}

const WalkaroundFollowUpQuestion = ({
    isOpen,
    onClose,
    parent_wa_question,
    parent,
    vehicle_type,
    category,
    editId = null,
}: WalkaroundFollowUpQuestionProps) => {
    const [formData, setFormData] = useState<FollowUpFormData>(emptyFollowUp)
    const [saving, setSaving] = useState(false)
    const [loadingParent, setLoadingParent] = useState(false)
    const [currentParentId, setCurrentParentId] = useState<number | null>(parent)
    const [currentParentWaId, setCurrentParentWaId] = useState<number | null>(parent_wa_question)
    const [currentEditId, setCurrentEditId] = useState<number | null>(editId)

    const cookies = useCookies()
    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
    }), [cookies])

    const fetchFollowUpForEdit = useCallback(async (id: number) => {
        setLoadingParent(true)
        try {
            const res = await fetch(`${API_URL}/api/follow-up-questions/${id}/`, { headers: authHeaders })
            const result = await res.json()
            const data = result.data || result

            // Format dates if they exist
            const formatDate = (dateString?: string) => {
                if (!dateString) return undefined
                return new Date(dateString).toLocaleString()
            }

            console.log("Fetched data:", data) // For debugging

            setFormData({
                code: data.code || "",
                text: data.text || "",
                display_order: data.display_order || 1,
                severity: data.severity || "IMMEDIATE",
                tick_all: data.tick_all || false,
                follow_up_instruction: data.follow_up_instruction || "",
                // Include date fields with formatting
                created_at: formatDate(data.created_at),
                updated_at: formatDate(data.updated_at),
                created_by: data.created_by,
                updated_by: data.updated_by,
                created_by_name: data.created_by_name || data.created_by?.username,
                updated_by_name: data.updated_by_name || data.updated_by?.username,
            })

            // Handle cases where parent/parent_wa_question might be objects
            const pId = (data.parent && typeof data.parent === 'object') ? data.parent.id : data.parent
            const pWaId = (data.parent_wa_question && typeof data.parent_wa_question === 'object') ? data.parent_wa_question.id : data.parent_wa_question

            setCurrentParentId(pId || null)
            setCurrentParentWaId(pWaId || null)
        } catch (error) {
            toast.error("Failed to load follow-up question")
        } finally {
            setLoadingParent(false)
        }
    }, [authHeaders])

    const fetchParentAndAutoFill = useCallback(async (pWaId: number | null, pId: number | null) => {
        if (!isOpen || (!pWaId && !pId)) return

        setLoadingParent(true)
        try {
            let parentCode = ""
            let childrenCount = 0

            // 1. Fetch Parent Code
            if (pWaId) {
                const res = await fetch(`${API_URL}/api/walk-around-questions/${pWaId}/`, { headers: authHeaders })
                const result = await res.json()
                parentCode = result.data?.question_code || ""
            } else if (pId) {
                const res = await fetch(`${API_URL}/api/follow-up-questions/${pId}/`, { headers: authHeaders })
                const result = await res.json()
                const pData = result.data || result
                parentCode = pData.code || ""
            }

            // 2. Fetch Existing Children to determine next order/code
            const filterParam = pWaId ? `parent_wa_question=${pWaId}` : `parent=${pId}`
            const childrenRes = await fetch(`${API_URL}/api/follow-up-questions/?${filterParam}`, { headers: authHeaders })
            const childrenResult = await childrenRes.json()
            const children = childrenResult.success ? (childrenResult.data?.results || childrenResult.data || []) : (Array.isArray(childrenResult) ? childrenResult : (childrenResult.results || []))
            childrenCount = children.length

            // 3. Auto-fill
            const nextIndex = childrenCount + 1
            const autoCode = parentCode ? `${parentCode}.${nextIndex}` : `${nextIndex}`

            setFormData(prev => ({
                ...prev,
                code: autoCode,
                display_order: nextIndex
            }))
        } catch (error) {
            console.error("Failed to auto-generate follow-up info", error)
        } finally {
            setLoadingParent(false)
        }
    }, [isOpen, authHeaders])

    // Track initialization state to prevent redundant or missing updates
    const initializedRef = useRef<string | null>(null)

    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = null
            setCurrentEditId(null)
            setFormData(emptyFollowUp)
            return
        }

        // Generate a key for the current configuration to see if we need to re-initialize
        const initKey = editId ? `edit-${editId}` : `add-${parent_wa_question}-${parent}`
        if (initializedRef.current === initKey) return

        if (editId) {
            setCurrentEditId(editId)
            // Explicitly reset form before fetching to avoid showing old data
            setFormData(emptyFollowUp)
            fetchFollowUpForEdit(editId)
        } else {
            const pId = (parent && typeof parent === 'object') ? (parent as any).id : parent
            const pWaId = (parent_wa_question && typeof parent_wa_question === 'object') ? (parent_wa_question as any).id : parent_wa_question

            setCurrentEditId(null)
            setCurrentParentWaId(pWaId || null)
            setCurrentParentId(pId || null)
            setFormData(emptyFollowUp)
            fetchParentAndAutoFill(pWaId || null, pId || null)
        }

        initializedRef.current = initKey
    }, [isOpen, editId, parent_wa_question, parent, fetchParentAndAutoFill, fetchFollowUpForEdit])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.text.trim()) return toast.error("Description is required")
        if (!formData.code.trim()) return toast.error("Code is required")
        if (formData.severity === "VARIES" && !formData.follow_up_instruction?.trim()) {
            return toast.error("Follow-up instruction is required for 'VARIES' severity")
        }

        setSaving(true)
        try {
            const payload = {
                parent_wa_question: currentParentWaId,
                parent: currentParentId,
                code: formData.code.trim(),
                text: formData.text.trim(),
                display_order: formData.display_order,
                severity: formData.severity,
                tick_all: formData.tick_all,
                follow_up_instruction: formData.follow_up_instruction.trim(),
            }

            const url = currentEditId
                ? `${API_URL}/api/follow-up-questions/${currentEditId}/`
                : `${API_URL}/api/follow-up-questions/`

            const res = await fetch(url, {
                method: currentEditId ? "PUT" : "POST",
                headers: authHeaders,
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error(`Failed to ${currentEditId ? 'update' : 'create'} follow-up question`)

            const result = await res.json()
            toast.success(`Follow-up question ${currentEditId ? 'updated' : 'created'}`)

            // If we were editing, just close
            if (currentEditId) {
                onClose()
                return
            }

            // LOOP LOGIC: Stay open and prepare for next (for initial ADD mode)
            if (formData.severity === "VARIES") {
                // MOVE DEEPER: New child level
                const newId = result.id || result.data?.id || (Array.isArray(result) ? result[0].id : result.data?.[0]?.id)
                if (newId) {
                    // Reset the ref so the useEffect doesn't block next auto-fill
                    initializedRef.current = `add-null-${newId}`
                    setCurrentEditId(null)
                    setCurrentParentId(newId)
                    setCurrentParentWaId(null)
                    setFormData(emptyFollowUp)
                    fetchParentAndAutoFill(null, newId)
                } else {
                    onClose()
                }
            } else {
                // CLOSE for non-VARIES
                onClose()
            }
        } catch (error) {
            toast.error("Failed to add follow-up question")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {currentEditId ? "Edit Follow-up Question" : (currentParentId ? "Add Nested Follow-up Question" : "Add Follow-up Question")}
                    </DialogTitle>
                    <DialogDescription>
                        {loadingParent ? "Loading data..." : "Define the details for the follow-up question."}
                    </DialogDescription>
                </DialogHeader>

                {loadingParent ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Code Field */}
                            <div className="space-y-2">
                                <Label htmlFor="fu-code">
                                    Code <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="fu-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., 1.1, 2.3, A.1, etc."
                                    disabled={loadingParent || !!currentEditId} // Disable in edit mode if you want code to be read-only
                                    className={currentEditId ? "bg-muted" : ""}
                                />
                                {currentEditId && (
                                    <p className="text-xs text-muted-foreground">Code cannot be changed after creation</p>
                                )}
                            </div>

                            {/* Question/Text Field */}
                            <div className="space-y-2">
                                <Label htmlFor="fu-text">
                                    Question / Text <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="fu-text"
                                    value={formData.text}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    placeholder="e.g., RED warning light that has not cleared"
                                    rows={3}
                                />
                            </div>

                            {/* Display Order */}
                            <div className="space-y-2">
                                <Label htmlFor="fu-order">Display Order</Label>
                                <Input
                                    id="fu-order"
                                    type="number"
                                    min="1"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                                    disabled={loadingParent}
                                />
                            </div>

                            {/* Severity Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="fu-severity">Severity</Label>
                                <Select
                                    value={formData.severity}
                                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                                >
                                    <SelectTrigger id="fu-severity">
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IMMEDIATE">IMMEDIATE</SelectItem>
                                        <SelectItem value="DELAYED">DELAYED</SelectItem>
                                        <SelectItem value="VARIES">VARIES</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-amber-600 font-medium pt-1">
                                    {formData.severity === "VARIES"
                                        ? "Stay open to add a NESTED follow-up question below this one. (Instruction required)"
                                        : "Define the severity to complete this follow-up."}
                                </p>
                            </div>

                            {/* Follow-up Instruction */}
                            <div className="space-y-2">
                                <Label htmlFor="fu-instruction">
                                    Follow-up Instruction
                                    {formData.severity === "VARIES" && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <Textarea
                                    id="fu-instruction"
                                    value={formData.follow_up_instruction}
                                    onChange={(e) => setFormData({ ...formData, follow_up_instruction: e.target.value })}
                                    placeholder={formData.severity === "VARIES"
                                        ? "Enter instructions (REQUIRED for VARIES)"
                                        : "Instructions for the user (optional)"}
                                    rows={2}
                                />
                            </div>

                            {/* Tick All Switch */}
                            <div className="flex items-center gap-3 py-2">
                                <Switch
                                    id="fu-tick-all"
                                    checked={formData.tick_all}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, tick_all: checked })
                                    }
                                />
                                <Label htmlFor="fu-tick-all" className="cursor-pointer">
                                    Tick All Applicable
                                </Label>
                            </div>
                        </div>



                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                {currentEditId ? "Cancel" : "Close"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving || loadingParent}
                                className="w-full sm:w-auto"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {currentEditId ? "Update Question" : (formData.severity === "VARIES" ? "Save & Add Nested" : "Save Question")}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default WalkaroundFollowUpQuestion