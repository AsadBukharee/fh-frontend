'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCookies } from 'next-client-cookies';
import { parseISO } from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  History,
  Tag,
  AlertTriangle,
  Car,
  Clock,
  Pencil,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import API_URL from '@/app/utils/ENV';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type_name: string;
  primary_site_name?: string;
  vehicle_status: string;
}

interface TaskUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar?: string | null;
}

interface TaskType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface HistoryItem {
  id: number;
  action: string;
  user: TaskUser;
  comment: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: TaskType;
  task_type_display: string;
  assigned_to: TaskUser;
  assigned_by: TaskUser;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_viewed' | 'viewed' | 'in_progress' | 'completed' | 'rejected' | null;
  reason: string | null;
  estimated_hours: string | null;
  actual_hours: string | null;
  completion_notes: string | null;
  requires_approval: boolean;
  approved_by: TaskUser | null;
  approved_at: string | null;
  site: { id: number; name: string } | null;
  task_category: string;
  vehicle?: string;
  is_overdue: boolean;
  days_until_deadline: number;
  created_at: string;
  updated_at: string;
  history: HistoryItem[];
}

// ---------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------
const priorityConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  low: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', icon: Tag },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-100', icon: AlertCircle },
  high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', icon: AlertTriangle },
  urgent: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', icon: AlertTriangle },
};

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  not_viewed: { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: XCircle, label: 'Not Viewed' },
  viewed: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', icon: CheckCircle, label: 'Viewed' },
  in_progress: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100', icon: Clock, label: 'In Progress' },
  completed: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle, label: 'Completed' },
  rejected: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', icon: XCircle, label: 'Rejected' },
};

// ---------------------------------------------------------------------
// UK Time Formatter
// ---------------------------------------------------------------------
const formatInUKTime = (isoString: string): string => {
  try {
    const date = parseISO(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
    }).format(date);
  } catch {
    return isoString;
  }
};

const formatDateOnly = (isoString: string): string => {
  try {
    const date = parseISO(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/London',
    }).format(date);
  } catch {
    return isoString;
  }
};

// ---------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------

/** Tiny labelled field cell */
const badgeVariantMap: Record<string, string> = {
  orange: 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-50',
  pink:   'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-100 hover:bg-yellow-50',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50',
  blue:   'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50',
  gray:   'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-50',
  red:    'bg-red-50 text-red-700 border-red-100 hover:bg-red-50',
};

function FieldCell({
  label,
  value,
  highlight,
  email,
  children,
}: {
  label: string;
  value?: string | React.ReactNode;
  highlight?: 'orange' | 'pink' | 'yellow' | 'green' | 'blue' | 'gray' | 'purple' | 'red';
  email?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      {children ? (
        children
      ) : highlight ? (
        <Badge variant="outline" className={cn('w-fit text-xs font-semibold rounded-full px-2 py-0.5', badgeVariantMap[highlight])}>
          {value}
        </Badge>
      ) : email ? (
        <span className="text-sm font-medium text-orange-500 truncate">{value || '—'}</span>
      ) : (
        <span className="text-sm font-medium text-gray-800 truncate">{value || '—'}</span>
      )}
    </div>
  );
}

/** Thin vertical divider */
function VDivider() {
  return <div className="hidden md:block w-px h-8 bg-gray-100 mx-2" />;
}

/** Section card wrapper */
function SectionCard({
  title,
  onEdit,
  children,
  noPadding,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
          >
            edit
            <Pencil className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </div>
      <div className={noPadding ? '' : 'px-6 py-5'}>{children}</div>
    </div>
  );
}

/** User avatar chip */
function UserChip({ user, color = 'blue' }: { user: TaskUser; color?: 'blue' | 'green' | 'orange' }) {
  const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorCls = {
    blue: 'bg-blue-600',
    green: 'bg-emerald-600',
    orange: 'bg-orange-500',
  }[color];

  return (
    <div className="flex items-center gap-2.5">
      <div className={cn('w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0', colorCls)}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
        <p className="text-xs text-orange-500 truncate">{user.email}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------
export default function TaskDetailPage() {
  const cookies = useCookies();
  const { id } = useParams();

  const [task, setTask] = useState<Task | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    deadline: string;
    reason: string;
    vehicle: string;
  }>({ title: '', description: '', status: 'not_viewed', priority: 'medium', deadline: '', reason: '', vehicle: '' });



  // Fetch Task + auto-mark as viewed
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const access_token = cookies.get('access_token');
        if (!access_token) throw new Error('No access token');

        const res = await fetch(`${API_URL}/api/tasks/${id}/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch task');
        const data: Task = await res.json();
        setTask(data);

        // Auto-mark as viewed if status is not_viewed
        if (data.status === 'not_viewed') {
          try {
            const patchRes = await fetch(`${API_URL}/api/tasks/${id}/`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'viewed' }),
            });
            if (patchRes.ok) {
              const updated: Task = await patchRes.json();
              setTask(updated);
            }
          } catch {
            // Silently fail — viewing the page is more important than the status update
          }
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTask();
  }, [id, cookies]);

  // Fetch Vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const access_token = cookies.get('access_token');
        if (!access_token) return;

        const res = await fetch(`${API_URL}/api/vehicles/`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!res.ok) throw new Error('Failed to load vehicles');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setVehicles(result.data);
      } catch {
        // silent
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [cookies]);

  const openEditDialog = () => {
    if (!task) return;
    setEditForm({
      title: task.title,
      description: task.description,
      status: task.status || 'not_viewed',
      priority: task.priority,
      deadline: task.deadline.slice(0, 16),
      reason: task.reason || '',
      vehicle: task.vehicle || '',
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const access_token = cookies.get('access_token');
      const payload: any = {
        title: editForm.title,
        description: editForm.description,
        deadline: editForm.deadline + ':00Z',
        priority: editForm.priority,
        status: editForm.status,
      };
      if (editForm.vehicle?.trim()) payload.vehicle = editForm.vehicle.trim();
      if (editForm.reason?.trim()) payload.reason = editForm.reason.trim();

      const res = await fetch(`${API_URL}/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update task');
      }

      const updated: Task = await res.json();
      setTask(updated);
      setEditDialogOpen(false);
      toast.success('Task updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // ----- Loading / Error states -----
  if (loading) return (
    <div className="w-full p-6 flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );

  if (error || !task) return (
    <div className="w-full p-6">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700">
        <XCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{error || 'Task not found'}</p>
      </div>
    </div>
  );

  const currentStatus = task.status || 'not_viewed';
  const currentPriority = task.priority || 'medium';
  const statusCfg = statusConfig[currentStatus] ?? statusConfig['not_viewed'];
  const priorityCfg = priorityConfig[currentPriority] ?? priorityConfig['medium'];
  const StatusIcon = statusCfg.icon;
  const PriorityIcon = priorityCfg.icon;

  return (
    <div className="w-full p-4 pb-24 space-y-5 bg-transparent">

      {/* ═══════════════ TITLE HERO CARD ═══════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Overdue / days-remaining banner */}
              <div className="flex items-center gap-2 mb-3">
                {task.is_overdue ? (
                  <Badge variant="outline" className="gap-1.5 rounded-full font-bold bg-red-50 text-red-600 border-red-100 hover:bg-red-50">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue by {Math.abs(task.days_until_deadline)} day{Math.abs(task.days_until_deadline) !== 1 ? 's' : ''}
                  </Badge>
                ) : task.days_until_deadline !== undefined ? (
                  <Badge variant="outline" className="gap-1.5 rounded-full font-bold bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50">
                    <Clock className="h-3 w-3" />
                    {task.days_until_deadline} days remaining
                  </Badge>
                ) : null}
                {task.task_category && (
                  <Badge variant="outline" className="gap-1 rounded-full font-semibold bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
                    <Layers className="h-3 w-3" />
                    {task.task_category}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight truncate">{task.title}</h1>
              {task.description && (
                <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 max-w-2xl">{task.description}</p>
              )}

              {/* Status + Priority badges */}
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <Badge variant="outline" className={cn('gap-1.5 rounded-full font-bold px-3 py-1', statusCfg.bg, statusCfg.color, statusCfg.border, 'hover:' + statusCfg.bg)}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusCfg.label}
                </Badge>
                <Badge variant="outline" className={cn('gap-1.5 rounded-full font-bold px-3 py-1 capitalize', priorityCfg.bg, priorityCfg.color, priorityCfg.border, 'hover:' + priorityCfg.bg)}>
                  <PriorityIcon className="h-3.5 w-3.5" />
                  {currentPriority}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <VDivider />
              <button
                onClick={openEditDialog}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-all shadow-sm active:scale-95"
              >
                Edit Task
                <Pencil className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ TASK DETAILS ═══════════════ */}
      <SectionCard title="Task Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
          <FieldCell label="Task Type" value={task.task_type?.name || task.task_type_display || '—'} highlight="orange" />

          <FieldCell label="Status">
            <Badge variant="outline" className={cn('gap-1.5 rounded-full font-bold w-fit px-2.5 py-0.5', statusCfg.bg, statusCfg.color, statusCfg.border, 'hover:' + statusCfg.bg)}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </Badge>
          </FieldCell>

          <FieldCell label="Priority">
            <Badge variant="outline" className={cn('gap-1.5 rounded-full font-bold capitalize w-fit px-2.5 py-0.5', priorityCfg.bg, priorityCfg.color, priorityCfg.border, 'hover:' + priorityCfg.bg)}>
              <PriorityIcon className="h-3 w-3" />
              {currentPriority}
            </Badge>
          </FieldCell>

          <FieldCell label="Deadline">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-gray-900">{formatInUKTime(task.deadline)}</span>
              <span className={cn("text-[10px] font-bold uppercase tracking-tight", task.is_overdue ? "text-red-500" : "text-emerald-500")}>
                {task.is_overdue ? `${Math.abs(task.days_until_deadline)}d overdue` : `${task.days_until_deadline}d remaining`}
              </span>
            </div>
          </FieldCell>

          <FieldCell label="Site" highlight="blue" value={task.site?.name || '—'} />

          <FieldCell label="Vehicle">
            <Badge variant="outline" className="gap-1.5 rounded-full font-bold bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100 w-fit px-2.5 py-0.5">
              <Car className="h-3 w-3" />
              {task.vehicle || 'Not assigned'}
            </Badge>
          </FieldCell>

          <FieldCell label="Est. Hours" value={task.estimated_hours ? `${task.estimated_hours}h` : '—'} highlight={task.estimated_hours ? "yellow" : "gray"} />

          <FieldCell label="Requires Approval" value={task.requires_approval ? 'Required' : 'No'} highlight={task.requires_approval ? 'orange' : 'gray'} />
        </div>

        {/* Reason / Notes */}
        {task.reason && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              {task.status === 'completed' ? 'Completion Notes' : 'Reason / Notes'}
            </span>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.reason}</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══════════════ ASSIGNMENT ═══════════════ */}
      <SectionCard title="Assignment">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assigned To</span>
            <div className="bg-blue-50/30 rounded-2xl p-4 border border-blue-50/50">
              <UserChip user={task.assigned_to} color="blue" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assigned By</span>
            <div className="bg-orange-50/30 rounded-2xl p-4 border border-orange-50/50">
              <UserChip user={task.assigned_by} color="orange" />
            </div>
          </div>

          {task.approved_by && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Approved By</span>
              <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-50/50 relative">
                <UserChip user={task.approved_by} color="green" />
                {task.approved_at && (
                  <Badge variant="outline" className="absolute top-4 right-4 text-[9px] font-bold bg-white text-emerald-600 border-emerald-100 px-1.5 h-4">
                    {formatDateOnly(task.approved_at)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ═══════════════ TIMELINE + HISTORY ═══════════════ */}
      <SectionCard title="Timeline">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <FieldCell label="Created">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="p-1.5 rounded-lg bg-gray-50 border-gray-100">
                <Clock className="h-3 w-3 text-gray-400" />
              </Badge>
              <span className="text-sm font-bold text-gray-800">{formatInUKTime(task.created_at)}</span>
            </div>
          </FieldCell>

          <FieldCell label="Last Updated">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="p-1.5 rounded-lg bg-gray-50 border-gray-100">
                <History className="h-3 w-3 text-gray-400" />
              </Badge>
              <span className="text-sm font-bold text-gray-800">{formatInUKTime(task.updated_at)}</span>
            </div>
          </FieldCell>
        </div>

        {/* Activity History collapsible */}
        {task.history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-left group hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50">
                  <History className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Activity History</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">{task.history.length} Events</span>
                    <Badge variant="secondary" className="text-[9px] rounded-full h-4 px-1.5 bg-orange-100 text-orange-700 border-none font-bold">
                      Latest: {formatInUKTime(task.history[0].created_at).split(',')[0]}
                    </Badge>
                  </div>
                </div>
              </div>
              {showHistory
                ? <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                : <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />}
            </button>

            {showHistory && (
              <div className="mt-6 space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {task.history.map((item, idx) => (
                  <div key={item.id} className="relative pl-6 pb-4 last:pb-0">
                    {/* Stealthy timeline line */}
                    {idx !== task.history.length - 1 && (
                      <div className="absolute left-[3px] top-6 bottom-0 w-0.5 bg-gray-100" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-2 w-2 h-2 rounded-full border-2 border-orange-500 bg-white" />
                    
                    <div className="min-w-0 bg-white rounded-xl p-3 border border-gray-50 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-medium text-gray-800 leading-relaxed">{item.comment}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[9px] h-4 rounded-full bg-gray-50 text-gray-500 border-gray-100 px-1.5">
                          {item.user?.full_name}
                        </Badge>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">{formatInUKTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ═══════════════ EDIT DIALOG ═══════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl w-full rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-10 py-8 bg-white border-b border-gray-100/50">
            <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">Edit Task Details</DialogTitle>
          </DialogHeader>

          <div className="p-10 bg-white space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">Task Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="h-12 rounded-2xl border-gray-200 text-base font-semibold focus:ring-orange-500 focus:border-orange-500 transition-all bg-gray-50/30"
                placeholder="What needs to be done?"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">Detailed Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="rounded-2xl border-gray-200 text-sm font-medium resize-none focus:ring-orange-500 focus:border-orange-500 transition-all bg-gray-50/30 p-4 leading-relaxed"
                placeholder="Provide more context about this task..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-2">
              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">Status</label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl bg-gray-50/50 border-gray-200 text-gray-900 font-bold px-4">
                    <SelectValue placeholder="Current Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                    <SelectItem value="not_viewed" className="rounded-xl my-1 focus:bg-gray-100">Not Viewed</SelectItem>
                    <SelectItem value="viewed" className="rounded-xl my-1 focus:bg-blue-50 focus:text-blue-700">Viewed</SelectItem>
                    <SelectItem value="in_progress" className="rounded-xl my-1 focus:bg-purple-50 focus:text-purple-700">In Progress</SelectItem>
                    <SelectItem value="completed" className="rounded-xl my-1 focus:bg-emerald-50 focus:text-emerald-700">Completed</SelectItem>
                    <SelectItem value="rejected" className="rounded-xl my-1 focus:bg-red-50 focus:text-red-700">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">Priority</label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl bg-gray-50/50 border-gray-200 text-gray-900 font-bold px-4">
                    <SelectValue placeholder="Importance Level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                    <SelectItem value="low" className="rounded-xl my-1 focus:bg-blue-50 focus:text-blue-700">Low Priority</SelectItem>
                    <SelectItem value="medium" className="rounded-xl my-1 focus:bg-yellow-50 focus:text-yellow-700">Medium Priority</SelectItem>
                    <SelectItem value="high" className="rounded-xl my-1 focus:bg-orange-50 focus:text-orange-700">High Priority</SelectItem>
                    <SelectItem value="urgent" className="rounded-xl my-1 focus:bg-red-50 focus:text-red-700 font-bold italic">URGENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">Target Deadline</label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                    className="h-11 rounded-2xl bg-rose-50/30 border-rose-100 text-rose-700 font-bold px-4 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 pointer-events-none" />
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">Associated Vehicle</label>
                <Select
                  value={editForm.vehicle || '__none__'}
                  onValueChange={(v) => setEditForm(f => ({ ...f, vehicle: v === '__none__' ? '' : v }))}
                  disabled={loadingVehicles}
                >
                  <SelectTrigger className="h-11 rounded-2xl bg-gray-50/50 border-gray-200 text-gray-900 font-bold px-4">
                    <SelectValue placeholder={loadingVehicles ? 'Loading…' : 'Select a vehicle'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                    <SelectItem value="__none__" className="rounded-xl my-1 italic">No vehicle assigned</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.registration_number} className="rounded-xl my-1">
                        <span className="font-bold">{v.registration_number}</span>
                        <span className="ml-2 text-xs text-gray-400">— {v.make} {v.model}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reason / Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] pl-1">
                {editForm.status === 'completed' ? 'Completion Notes' : 'Modification Reason / Notes'}
              </label>
              <Textarea
                value={editForm.reason}
                onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
                className="rounded-2xl border-gray-200 text-sm font-medium resize-none focus:ring-orange-500 focus:border-orange-500 transition-all bg-gray-50/30 p-4"
                placeholder="Optional notes regarding the current status change..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-4 px-10 py-6 bg-gray-50/80 border-t border-gray-100">
            <button
              className="px-6 py-2.5 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              onClick={() => setEditDialogOpen(false)}
            >
              Discard
            </button>
            <Button
              className="rounded-2xl h-11 px-8 text-sm font-bold bg-[#FFE4D9] hover:bg-[#FFD5C2] text-[#FF6B3D] border-none transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#FF6B3D]/30 border-t-[#FF6B3D] rounded-full animate-spin" />
                  Saving Updates...
                </div>
              ) : 'Update Task Details'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}