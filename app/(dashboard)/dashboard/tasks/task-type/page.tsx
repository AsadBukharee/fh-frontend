'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import parse from 'html-react-parser';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAutoScroll } from '@/app/utils/useAutoScroll';

const stripHtml = (html: string) => {
  if (!html) return "—";
  return html.replace(/<[^>]*>?/gm, '');
};

interface TaskType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TaskType[];
}

export default function TaskTypeList() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [filtered, setFiltered] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const { expandedId, handleExpandedChange } = useAutoScroll(loading, "task-type-list");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20); // Default page size

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<TaskType | null>(null);

  // Form States
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const token = useCookies().get('access_token') || '';

  const HOST = API_URL;
  const Header = { 
    'Content-Type': 'application/json',
    "Authorization": `Bearer ${token}`
  };

  // Fetch task types with pagination
  const fetchTaskTypes = async (url?: string) => {
    try {
      setLoading(true);
      
      // Build the URL
      let fetchUrl;
      if (url) {
        // Use the provided URL (from next/previous)
        fetchUrl = url;
      } else {
        // Build URL with current page and page size
        fetchUrl = `${HOST}/api/task-types/?page=${currentPage}&page_size=${pageSize}`;
      }
      
      const res = await fetch(fetchUrl, {
        headers: Header,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: ApiResponse = await res.json();
      
      // Sort results alphabetically by name
      const sorted = data.results.sort((a, b) => a.name.localeCompare(b.name));
      
      setTaskTypes(sorted);
      setFiltered(sorted);
      setTotalCount(data.count);
      setNextPage(data.next);
      setPreviousPage(data.previous);
      
      // Extract current page from the response URL
      if (data.next) {
        const nextUrl = new URL(data.next, HOST);
        const nextPageParam = nextUrl.searchParams.get('page');
        if (nextPageParam) {
          setCurrentPage(parseInt(nextPageParam) - 1);
        }
      } else if (data.previous) {
        const prevUrl = new URL(data.previous, HOST);
        const prevPageParam = prevUrl.searchParams.get('page');
        if (prevPageParam) {
          setCurrentPage(parseInt(prevPageParam) + 1);
        }
      } else {
        // First page
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load task types.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and fetch on page/pageSize change
  useEffect(() => {
    fetchTaskTypes();
  }, [currentPage, pageSize]);

  // Search filter (client-side for current page)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(taskTypes);
      return;
    }
    
    const lower = searchTerm.toLowerCase();
    const filtered = taskTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower)
    );
    setFiltered(filtered);
  }, [searchTerm, taskTypes]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Pagination functions
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (nextPage) {
      fetchTaskTypes(nextPage);
    }
  };

  const handlePreviousPage = () => {
    if (previousPage) {
      fetchTaskTypes(previousPage);
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Reset form
  const resetForm = () => {
    setForm({ name: '', description: '', is_active: true });
    setErrors({});
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!form.description.trim()) newErrors.description = 'Description is required';
    else if (form.description.trim().length < 5)
      newErrors.description = 'Description must be at least 5 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CREATE
  const handleCreate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${HOST}/api/task-types/`, {
        method: 'POST',
        headers: Header,
        body: JSON.stringify(form),
      });

      if (res.ok) {
        // Go back to first page to see the new item
        setCurrentPage(1);
        setIsCreateOpen(false);
        resetForm();
        toast.success('Task type created successfully.');
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to create task type.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT
  const openEdit = (type: TaskType) => {
    setSelected(type);
    setForm({
      name: type.name,
      description: type.description,
      is_active: type.is_active,
    });
    setErrors({});
    handleExpandedChange(type.id.toString());
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!validateForm() || !selected) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${HOST}/api/task-types/${selected.id}/`, {
        method: 'PUT',
        headers: Header,
        body: JSON.stringify({ ...form, id: selected.id }),
      });

      if (res.ok) {
        await fetchTaskTypes();
        setIsEditOpen(false);
        toast.success('Task type updated.');
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update task type.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE
  const openDelete = (type: TaskType) => {
    setSelected(type);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;

    try {
      const res = await fetch(`${HOST}/api/task-types/${selected.id}/`, {
        method: 'DELETE',
        headers: Header,
      });

      if (res.ok) {
        // Refresh the current page
        await fetchTaskTypes();
        setIsDeleteOpen(false);
        toast.success('Task type deleted.');
      } else {
        toast.error('Failed to delete task type.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
  };

  // TOGGLE ACTIVE
  const toggleActive = async (type: TaskType) => {
    try {
      await fetch(`${HOST}/api/task-types/${type.id}/`, {
        method: 'PATCH',
        headers: Header,
        body: JSON.stringify({ is_active: !type.is_active }),
      });
      await fetchTaskTypes();
      handleExpandedChange(type.id.toString());
      toast.success(`Task type ${!type.is_active ? 'activated' : 'deactivated'}.`);
    } catch {
      toast.error('Failed to update status.');
    }
  };

  return (
    <>
      <div className="container">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Task Types</CardTitle>
                <CardDescription>Manage task categories</CardDescription>
              </div>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Task Type
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search and Page Size Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute z-1 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  const newPageSize = parseInt(value);
                  setPageSize(newPageSize);
                  setCurrentPage(1); // Reset to first page when changing page size
                }}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No task types found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((type) => (
                          <TableRow key={type.id} id={type.id.toString()}>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell className="max-w-md truncate">{stripHtml(type.description)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleActive(type)}
                                className="h-8 w-8 p-0"
                              >
                                {type.is_active ? (
                                  <ToggleRight className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-5 w-5 text-red-600" />
                                )}
                              </Button>
                              <Badge variant={type.is_active ? 'default' : 'secondary'} className="ml-2">
                                {type.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(type)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openDelete(type)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} items
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFirstPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={!previousPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button> */}
                      
                      <div className="flex items-center gap-1">
                        <span className="text-sm">Page</span>
                        <span className="font-medium">{currentPage}</span>
                        <span className="text-sm">of</span>
                        <span className="font-medium">{totalPages}</span>
                      </div>
                      
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!nextPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLastPage}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Page Number Input (Optional) */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Go to page:</span>
                      <Input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            goToPage(page);
                          }
                        }}
                        className="w-20"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task Type</DialogTitle>
            <DialogDescription>Add a new task category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Maintenance"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-desc">Description</Label>
              <RichTextEditor
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="create-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task Type</DialogTitle>
            <DialogDescription>Update task type details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Description</Label>
              <RichTextEditor
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selected?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}