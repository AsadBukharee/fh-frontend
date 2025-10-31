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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  user: number;
  user_display: string | null;
  old_value: any;
  new_value: any;
  comment: string;
  created_at: string;
}

interface ChangeLog {
  id: number;
  action_type: string;
  action_type_display: string;
  user: number;
  user_display: string | null;
  field_name: string | null;
  old_value: any;
  new_value: any;
  comment: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface HistoryTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentLogs: AssignmentLog[];
  history: HistoryItem[];
  changeLogs?: ChangeLog[];   // optional – matches the API shape
}

// ---------- Helper: Get display name ----------
const getUserDisplay = (
  userId: number | null,
  display: string | null,
  fallback: string = 'Unknown'
): string => {
  if (display) return display;
  if (userId) return `User #${userId}`;
  return fallback;
};

// Helper: format date (same for all tables)
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ---------- Main Component ----------
const HistoryTaskDialog: React.FC<HistoryTaskDialogProps> = ({
  isOpen,
  onClose,
  assignmentLogs,
  history,
  changeLogs = [],
}) => {
  const hasReassign = assignmentLogs.length > 0;
  const hasChange = changeLogs.length > 0;
  const hasHistory = history.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Task History & Reassignments
          </DialogTitle>
        </DialogHeader>

        {/* ---------- 1. Reassignment History ---------- */}
        <section className="mt-4">
          <h3 className="font-semibold text-lg mb-2">Reassignment History</h3>
          {hasReassign ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.assigned_by !== null
                        ? getUserDisplay(log.assigned_by, null, 'System')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {getUserDisplay(log.assigned_to, log.assigned_to_display)}
                    </TableCell>
                    <TableCell>{log.reason || '—'}</TableCell>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              No reassignments recorded.
            </p>
          )}
        </section>

        <Separator className="my-6" />

        {/* ---------- 2. Change-Log History ---------- */}
        <section>
          <h3 className="font-semibold text-lg mb-2">Change Log</h3>
          {hasChange ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Old → New</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {log.action_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getUserDisplay(log.user, log.user_display)}
                    </TableCell>
                    <TableCell>{log.field_name ?? '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.old_value !== null
                        ? String(log.old_value)
                        : '—'}{' '}
                      →{' '}
                      {log.new_value !== null
                        ? String(log.new_value)
                        : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.comment}
                    </TableCell>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              No field changes recorded.
            </p>
          )}
        </section>

        <Separator className="my-6" />

        {/* ---------- 3. General Activity Log ---------- */}
        <section>
          <h3 className="font-semibold text-lg mb-2">Activity Log</h3>
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
                    .replace('_', ' ')
                    .toUpperCase();

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline">{actionLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        {getUserDisplay(entry.user, entry.user_display)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.comment || '—'}
                      </TableCell>
                      <TableCell>{formatDate(entry.created_at)}</TableCell>
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