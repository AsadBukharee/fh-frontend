"use client"

import React, { useState, useEffect } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

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

interface WalkaroundCategory {
    id: number
    code: string
    name: string
    description: string
    display_order: number
    is_pre_check: boolean
    created_at: string | null
    updated_at: string | null
}

interface CategoryFormData {
    code: string
    name: string
    description: string
    display_order: number
    is_pre_check: boolean
}

const emptyForm: CategoryFormData = {
    code: "",
    name: "",
    description: "",
    display_order: 0,
    is_pre_check: false,
}

const WalkaroundCategory = () => {
    const [categories, setCategories] = useState<WalkaroundCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        pageSize: 20
    })


    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [formData, setFormData] = useState<CategoryFormData>(emptyForm)

    const cookies = useCookies()

    const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("access_token")}`,
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async (page: number = pagination.currentPage) => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/walkaround-categories/?page=${page}`, {
                headers: authHeaders,
            })
            if (!res.ok) throw new Error("Failed to fetch categories")
            const result = await res.json()
            if (result.results) {
                setCategories(result.results)
                if (result.pagination) {
                    setPagination({
                        currentPage: result.pagination.current_page,
                        totalPages: result.pagination.total_pages,
                        totalCount: result.pagination.count,
                        pageSize: result.pagination.page_size
                    })
                }
            }
        } catch {
            // Mock data for development if API fails or doesn't exist yet
            console.warn("API failed, using mock data for development")
            // toast.error("Failed to load walkaround categories")
        } finally {
            setLoading(false)
        }
    }


    const resetForm = () => {
        setFormData(emptyForm)
        setEditId(null)
    }

    useEffect(() => {
        if (!isAddOpen) resetForm()
    }, [isAddOpen])

    useEffect(() => {
        if (!isEditOpen) resetForm()
    }, [isEditOpen])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return toast.error("Category name is required")

        setSaving(true)
        try {
            const res = await fetch(`${API_URL}/api/walkaround-categories/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify(formData),
            })
            if (!res.ok) throw new Error("Failed to create category")
            toast.success("Category added successfully")
            setIsAddOpen(false)
            fetchCategories()
        } catch {
            toast.error("Failed to add category")
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editId) return
        if (!formData.name.trim()) return toast.error("Category name is required")

        setSaving(true)
        try {
            const res = await fetch(`${API_URL}/api/walkaround-categories/${editId}/`, {
                method: "PUT",
                headers: authHeaders,
                body: JSON.stringify(formData),
            })
            if (!res.ok) throw new Error("Failed to update category")
            toast.success("Category updated successfully")
            setIsEditOpen(false)
            fetchCategories()
        } catch {
            toast.error("Failed to update category")
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (item: WalkaroundCategory) => {
        setFormData({
            code: item.code,
            name: item.name,
            description: item.description || "",
            display_order: item.display_order,
            is_pre_check: item.is_pre_check,
        })
        setEditId(item.id)
        setIsEditOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            const res = await fetch(`${API_URL}/api/walkaround-categories/${deleteId}/`, {
                method: "DELETE",
                headers: authHeaders,
            })
            if (!res.ok) throw new Error("Failed to delete category")
            toast.success("Category deleted successfully")
            setDeleteId(null)
            fetchCategories()
        } catch {
            toast.error("Failed to delete category")
        }
    }

    const renderFormFields = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., A, B, C"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Engine, Tires, Interior"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the category"
                    rows={3}
                />
            </div>
            <div className="flex items-center gap-3">
                <Switch
                    id="is_pre_check"
                    checked={formData.is_pre_check}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_pre_check: checked })
                    }
                />
                <Label htmlFor="is_pre_check">Pre-Walkaround Declaration</Label>
            </div>
        </>
    )

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Categories</h2>
                    <p className="text-sm text-gray-500">Manage walkaround categories</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Walkaround Category</DialogTitle>
                            <DialogDescription>
                                Create a new category to group walkaround questions.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
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

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading categories...</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                    No categories found. Click &quot;Add Category&quot; to get started.
                </div>
            ) : (
                <>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Order</TableHead>
                            <TableHead className="w-[80px]">Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">Pre-check</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((c, idx) => (
                            <TableRow
                                key={c.id}
                                onDoubleClick={() => handleEdit(c)}
                                className="cursor-pointer"
                                title="Double-click to edit"
                            >
                                <TableCell className="font-medium text-center">{c.display_order}</TableCell>
                                <TableCell className="font-bold">{c.code}</TableCell>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell className="text-sm text-gray-600 max-w-[300px] truncate">
                                    {c.description || "—"}
                                </TableCell>
                                <TableCell className="text-center">
                                    {c.is_pre_check ? (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                            Yes
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(c)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>

                                        <AlertDialog
                                            open={deleteId === c.id}
                                            onOpenChange={(open) => {
                                                if (!open) setDeleteId(null)
                                            }}
                                        >
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setDeleteId(c.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete &quot;{c.name}&quot;? This
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

                {/* Pagination UI */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{" "}
                            <span className="font-medium">
                                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)}
                            </span>{" "}
                            of <span className="font-medium">{pagination.totalCount}</span> categories
                        </div>
                        <Pagination className="w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (pagination.currentPage > 1) fetchCategories(pagination.currentPage - 1);
                                        }}
                                        className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                                    if (
                                        page === 1 ||
                                        page === pagination.totalPages ||
                                        (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        fetchCategories(page);
                                                    }}
                                                    isActive={pagination.currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (
                                        page === pagination.currentPage - 2 ||
                                        page === pagination.currentPage + 2
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (pagination.currentPage < pagination.totalPages) fetchCategories(pagination.currentPage + 1);
                                        }}
                                        className={pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </>

            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Walkaround Category</DialogTitle>
                        <DialogDescription>
                            Update the category details.
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

export default WalkaroundCategory
