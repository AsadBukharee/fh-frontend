// components/task/UpdateTaskDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string | null;
  avatar: string | null;
}

interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: User;
  assigned_to_display: string | null;
  assigned_by: User;
  assigned_by_display: string | null;
  deadline: string;
  priority: string;
  status: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdated: () => void;
}

interface UsersApiResponse {
  success: boolean;
  message: string;
  data: {
    results: User[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

const UpdateTaskDialog: React.FC<UpdateTaskDialogProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}) => {
  // ---- Form fields -------------------------------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('not_viewed');
  const [deadline, setDeadline] = useState('');
  const [reason, setReason] = useState(''); // <-- New

  // Track original status to detect change
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  // ---- Users list --------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const cookies = useCookies();
  const token = cookies.get('access_token') ?? '';
  const API_HOST = API_URL;

  // -----------------------------------------------------------------
  // Load current task data when dialog opens
  // -----------------------------------------------------------------
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssignedTo(task.assigned_to.id.toString());
      setPriority(task.priority);
      setStatus(task.status);
      setOriginalStatus(task.status); // <-- Track original
      setReason(task.reason || ''); // Pre-fill if exists

      const iso = task.deadline;
      const local = new Date(iso).toISOString().slice(0, 16);
      setDeadline(local);
    } else if (!isOpen) {
      // Reset when closed
      setOriginalStatus(null);
      setReason('');
    }
  }, [task, isOpen]);

  // -----------------------------------------------------------------
  // Fetch users when dialog opens
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      setUsers([]);
      setUsersLoading(false);
      setUsersError(null);
      return;
    }

    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const res = await fetch(`${API_HOST}/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: UsersApiResponse = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load users');

        setUsers(json.data.results);
      } catch (err: any) {
        console.error('Error loading users:', err);
        setUsersError(err.message ?? 'Could not load users');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, token, API_HOST]);

  // -----------------------------------------------------------------
  // Check if status has changed
  // -----------------------------------------------------------------
  const hasStatusChanged = originalStatus !== null && status !== originalStatus;

  // -----------------------------------------------------------------
  // Submit update
  // -----------------------------------------------------------------
  const handleUpdateTask = async () => {
    if (!task || !title || !assignedTo || !deadline) {
      alert('Please fill in all required fields.');
      return;
    }

    // If status changed, reason is required
    if (hasStatusChanged && (!reason || reason.trim() === '')) {
      alert('Please provide a reason for changing the status.');
      return;
    }

    try {
      const payload: any = {
        title,
        description: description || null,
        assigned_to: parseInt(assignedTo, 10),
        priority,
        status,
        deadline: new Date(deadline).toISOString(),
      };

      // Include reason only if status changed and reason provided
      if (hasStatusChanged && reason.trim()) {
        payload.reason = reason.trim();
      }

      const response = await fetch(`${API_HOST}/api/tasks/${task.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HTTP ${response.status}: ${err}`);
      }

      onTaskUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating task:', error);
      alert(error.message ?? 'Failed to update task');
    }
  };

  // -----------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <Input
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assigned To *
            </label>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users…</p>
            ) : usersError ? (
              <p className="text-sm text-red-600">{usersError}</p>
            ) : (
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.full_name}
                      {u.role && ` (${u.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority *
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_viewed">Not Viewed</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason - Show only if status has changed */}
          {hasStatusChanged && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason for Status Change *
              </label>
              <Textarea
                placeholder="Explain why the status is being changed (required)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-24"
                required
              />
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Deadline *
            </label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTask}
            disabled={
              !title ||
              !assignedTo ||
              !deadline ||
              (hasStatusChanged && (!reason || reason.trim() === ''))
            }
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTaskDialog;