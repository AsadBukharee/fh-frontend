'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import parse from 'html-react-parser';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
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

interface ViewTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const ViewTaskDialog: React.FC<ViewTaskDialogProps> = ({ isOpen, onClose, task }) => {
  if (!task) return null;

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-green-100 text-green-800';
      case 'not_viewed':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-teal-100 text-teal-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const InfoRow = ({ label, value, fullWidth }: { label: string; value: React.ReactNode; fullWidth?: boolean }) => (
    <div className={fullWidth ? "col-span-full flex flex-col" : "flex flex-col"}>
      <span className="text-sm text-muted-foreground mb-1">{label}</span>
      <div className="font-medium text-gray-900 break-words">{value || 'N/A'}</div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Task ID: #{task.id}
          </p>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow 
            label="Description" 
            fullWidth
            value={
              <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-3 bg-muted/10">
                {task.description ? parse(task.description) : <span className="text-muted-foreground italic">No description provided</span>}
              </div>
            } 
          />
          <InfoRow
            label="Assigned To"
            value={`${task.assigned_to.full_name} (${task.assigned_to.email})`}
          />
          <InfoRow
            label="Assigned By"
            value={`${task.assigned_by.full_name} (${task.assigned_by.email})`}
          />
          <InfoRow
            label="Priority"
            value={
              <Badge className={`${getPriorityBadgeClass(task.priority)} capitalize`}>
                {task.priority}
              </Badge>
            }
          />
          <InfoRow
            label="Status"
            value={
              <Badge className={`${getStatusBadgeClass(task.status)} uppercase`}>
                {task.status.replace('_', ' ')}
              </Badge>
            }
          />
          <InfoRow
            label="Deadline"
            value={new Date(task.deadline).toLocaleString()}
          />
          <InfoRow
            label="Created At"
            value={new Date(task.created_at).toLocaleString()}
          />
          <InfoRow
            label="Updated At"
            value={new Date(task.updated_at).toLocaleString()}
          />
          <InfoRow label="Reason" value={task.reason} />
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTaskDialog;
