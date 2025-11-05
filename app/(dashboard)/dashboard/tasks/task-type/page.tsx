'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
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
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

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
  const [searchTerm, setSearchTerm] = useState('');

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
  const token=useCookies().get('access_token')||'';

  const HOST = API_URL;
  const Header={ 'Content-Type': 'application/json' ,
    "Authorization": `Bearer ${token}`
  };

  // Fetch task types
  const fetchTaskTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${HOST}/api/task-types/`,{
        headers: Header,
      });
      const data: ApiResponse = await res.json();
      const sorted = data.results.sort((a, b) => a.name.localeCompare(b.name));
      setTaskTypes(sorted);
      setFiltered(sorted);
    } catch {
      toast.error('Failed to load task types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = taskTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower)
    );
    setFiltered(filtered);
  }, [searchTerm, taskTypes]);

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
        await fetchTaskTypes();
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
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!validateForm() || !selected) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${HOST}/api/task-types/${selected.id}/`, {
        method: 'PUT',
        headers:Header,
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
        headers:Header,
        body: JSON.stringify({ is_active: !type.is_active }),
      });
      await fetchTaskTypes();
      toast.success(`Task type ${!type.is_active ? 'activated' : 'deactivated'}.`);
    } catch {
      toast.error('Failed to update status.');
    }
  };

  return (
    <>
      <div className="container ">
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
            {/* Search */}
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute z-1 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="rounded-md ">
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
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell className="max-w-md truncate">{type.description}</TableCell>
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
              <Textarea
                id="create-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe this task type..."
                rows={3}
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
              <Textarea
                id="edit-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
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