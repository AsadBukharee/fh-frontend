'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

interface User {
  id: number;
  email: string;
  full_name: string;
  avatar: string | null;
  sites: { id: number; name: string }[];
}

interface Role {
  id: number;
  slug: string;
  name: string;
}

interface ReassignTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  onTaskReassigned: () => void;
}

const ReassignTaskDialog: React.FC<ReassignTaskDialogProps> = ({ isOpen, onClose, taskId, onTaskReassigned }) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cookies = useCookies();
  const yourToken = cookies.get('access_token') ?? '';

  const API_HOST = API_URL;

  // Fetch roles
  const fetchRoles = async () => {
    setLoadingRoles(true);
    setError(null);
    try {
      const response = await fetch(`${API_HOST}/roles/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to load roles. Please try again.');
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch users for the selected role
  const fetchUsersByRole = async (roleSlug: string) => {
    setLoadingUsers(true);
    setError(null);
    setUsers([]); // Clear previous users
    setSelectedUserId(''); // Reset user selection
    try {
      const response = await fetch(`${API_HOST}/users/list-names/?role=${roleSlug}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle task reassignment
  const handleReassignSubmit = async () => {
    if (!taskId || !selectedUserId) {
      alert('Please select a role and a user.');
      return;
    }

    try {
      const response = await fetch(`${API_HOST}/api/tasks/${taskId}/reassign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourToken}`,
        },
        body: JSON.stringify({
          assigned_to: parseInt(selectedUserId),
          reason: reassignReason || 'No reason provided', // Ensure reason is sent, even if empty
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.id) {
        onTaskReassigned();
        onClose();
        setSelectedRole('');
        setSelectedUserId('');
        setReassignReason('');
      } else {
        throw new Error(data.message || 'Failed to reassign task');
      }
    } catch (error) {
      console.error('Error reassigning task:', error);
      alert('Failed to reassign task. Please try again.');
    }
  };

  // Fetch roles when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  // Fetch users when a role is selected
  useEffect(() => {
    if (selectedRole) {
      fetchUsersByRole(selectedRole);
    }
  }, [selectedRole]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Task</DialogTitle>
        </DialogHeader>
        {loadingRoles && <p>Loading roles...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loadingRoles && !error && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Role</label>
              <Select onValueChange={setSelectedRole} value={selectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.slug}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Select User</label>
              <Select onValueChange={setSelectedUserId} value={selectedUserId} disabled={!selectedRole || loadingUsers}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? 'Loading users...' : 'Select a user'} />
                </SelectTrigger>
                <SelectContent>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No users available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason for Reassignment</label>
              <Input
                placeholder="Enter reason (optional)"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReassignSubmit} disabled={!selectedUserId || loadingRoles || loadingUsers}>
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignTaskDialog;