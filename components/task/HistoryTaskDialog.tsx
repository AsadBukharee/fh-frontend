// components/task/HistoryTaskDialog.tsx

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
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// ---------- Shared User Interface ----------
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

// ---------- Interfaces ----------
interface AssignmentLog {
  id: number;
  task: number;
  assigned_to: number;
  assigned_by: number | null;
  assigned_to_display: string | null;
  reason: string | null;
  created_at: string;
}

interface HistoryItem {
  id: number;
  action: string;
  user: User;                    // Fixed: full user object
  user_display: string | null;
  old_value: any;
  new_value: any;
  comment: string;
  created_at: string;
}

interface HistoryTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
}

// Helper: safe display name
const getDisplayName = (entry: HistoryItem): string => {
  return entry.user?.full_name || entry.user_display || 'Unknown User';
};

// ---------- Main Component ----------
const HistoryTaskDialog: React.FC<HistoryTaskDialogProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const hasHistory = history.length > 0;
  const stripHtml = (html: string) => {
    if (!html) return "—";
    return html.replace(/<[^>]*>?/gm, '');
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Task History & Reassignments
          </DialogTitle>
        </DialogHeader>

        {/* ---------- General Activity Log ---------- */}
        <section className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Activity Log</h3>
          {hasHistory ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => {
                  const actionLabel = entry.action
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline">{actionLabel}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDisplayName(entry)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {stripHtml(entry.comment)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatToDDMMYYYY(entry.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              No activity recorded yet.
            </p>
          )}
        </section>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryTaskDialog;