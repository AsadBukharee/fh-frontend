'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { Textarea } from '../ui/textarea';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  display_name?: string;
  is_active?: boolean;
  role?: string | null;
}

interface TaskType {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

// NEW: Prefill interface
interface TaskPrefillData {
  title?: string;
  description?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  deadline?: string; // expected format: YYYY-MM-DDTHH:mm
  estimatedHours?: string;
  requiresApproval?: boolean;
}

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  prefill?: TaskPrefillData; // Optional prefill from reminder
}

/* -------------------------------------------------------------------------- */
/*                               Static data                                   */
/* -------------------------------------------------------------------------- */
const PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

/* -------------------------------------------------------------------------- */
/*                               Main component                                */
/* -------------------------------------------------------------------------- */
const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  prefill,
}) => {
  /* -------------------------- Form fields -------------------------- */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<number | ''>('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);

  /* -------------------------- Data fetching -------------------------- */
  const [users, setUsers] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTaskTypes, setLoadingTaskTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cookies = useCookies();
  const token = cookies.get('access_token') ?? '';
  const API_HOST = API_URL;

  /* -------------------------- Apply Prefill on Open -------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    // Apply prefill if provided
    if (prefill) {
      setTitle(prefill.title || '');
      setDescription(prefill.description || '');
      setPriority(prefill.priority || 'medium');
      setDeadline(prefill.deadline || '');
      setEstimatedHours(prefill.estimatedHours || '');
      setRequiresApproval(prefill.requiresApproval || false);
    } else {
      // Reset to empty
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadline('');
      setEstimatedHours('');
      setRequiresApproval(false);
    }

    // Always reset these (user must choose)
    setTaskType('');
    setAssignedTo('');
  }, [isOpen, prefill]);

  /* -------------------------- Load Users & Task Types -------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoadingUsers(true);
      setLoadingTaskTypes(true);
      setError(null);

      try {
        const usersRes = await fetch(`${API_HOST}/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!usersRes.ok) throw new Error('Failed to load users');
        const usersData = await usersRes.json();
        const userList = Array.isArray(usersData) ? usersData : usersData?.data?.results || [];
        setUsers(userList);
      } catch (err) {
        setError('Could not load users');
      } finally {
        setLoadingUsers(false);
      }

      try {
        const typesRes = await fetch(`${API_HOST}/api/task-types/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!typesRes.ok) throw new Error('Failed to load task types');
        const typesData = await typesRes.json();
        const raw = (typesData.results || []) as any[];

        const activeTypes: TaskType[] = raw
          .filter((t) => t.is_active !== false)
          .sort((a, b) => a.name.localeCompare(b.name));

        setTaskTypes(activeTypes);
      } catch (err) {
        setError((prev) =>
          prev ? `${prev}. Could not load task types.` : 'Could not load task types.'
        );
      } finally {
        setLoadingTaskTypes(false);
      }
    };

    fetchData();
  }, [isOpen, token, API_HOST]);

  /* -------------------------- Submit handler -------------------------- */
  const handleCreateTask = async () => {
    if (!title || !taskType || !assignedTo || !deadline) {
      alert('Please fill in all required fields: Title, Task Type, Assigned To, Deadline');
      return;
    }

    const payload = {
      title,
      description: description || undefined,
      task_type: taskType as number,
      assigned_to: assignedTo as number,
      deadline: new Date(deadline).toISOString(),
      priority,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      requires_approval: requiresApproval,
    };

    try {
      const response = await fetch(`${API_HOST}/api/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Failed to create task: ${response.status} ${txt}`);
      }

      onTaskCreated();
      handleClose();
    } catch (err) {
      console.error('Create task error:', err);
      alert('Failed to create task. See console for details.');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isFormValid = !!title && !!taskType && !!assignedTo && !!deadline;

  const filteredUsers = users
    .filter((u) => u.is_active === true && u.role !== null && u.role !== undefined)
    .sort((a, b) => {
      const nameA = (a.full_name || a.display_name || a.username || '').trim();
      const nameB = (b.full_name || b.display_name || b.username || '').trim();
      return nameA.localeCompare(nameB);
    });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Replace Brake Pads"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Task Type */}
          <div className="grid gap-2">
            <Label htmlFor="task_type">Task Type *</Label>
            {loadingTaskTypes ? (
              <p className="text-sm text-muted-foreground">Loading task types…</p>
            ) : (
              <Select
                value={taskType === '' ? '' : String(taskType)}
                onValueChange={(v) => setTaskType(v ? Number(v) : '')}
              >
                <SelectTrigger id="task_type">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {taskTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Assigned To */}
          <div className="grid gap-2">
            <Label htmlFor="assigned_to">Assigned To *</Label>
            {loadingUsers ? (
              <p className="text-sm text-muted-foreground">Loading users…</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active users with a role available.
              </p>
            ) : (
              <Select
                value={assignedTo === '' ? '' : String(assignedTo)}
                onValueChange={(v) => setAssignedTo(v ? Number(v) : '')}
              >
                <SelectTrigger id="assigned_to">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.full_name || user.display_name || user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Priority */}
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline *</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

      

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateTask} disabled={!isFormValid}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;