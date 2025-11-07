'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCookies } from 'next-client-cookies';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  History,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Tag,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------
// Types (unchanged)
// ---------------------------------------------------------------------
interface TaskType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

interface HistoryItem {
  id: number;
  action: string;
  user: number;
  user_display: string | null;
  old_value: string | null;
  new_value: string | null;
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
  old_value: string | null;
  new_value: string | null;
  comment: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: TaskType;
  task_type_display: string;
  assigned_to: User;
  assigned_to_display: string | null;
  assigned_by: User;
  assigned_by_display: string | null;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_viewed' | 'viewed' | 'in_progress' | 'completed' | 'rejected';
  reason: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_notes: string | null;
  requires_approval: boolean;
  approved_by: User | null;
  approved_at: string | null;
  assignment_logs: any[];
  history: HistoryItem[];
  change_logs: ChangeLog[];
  is_overdue: boolean;
  days_until_deadline: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// Styling configs (unchanged)
// ---------------------------------------------------------------------
const priorityConfig = {
  low: { color: 'bg-blue-100 text-blue-800', icon: Tag },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const statusConfig = {
  not_viewed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Not Viewed' },
  viewed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Viewed' },
  in_progress: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
};

// ---------------------------------------------------------------------
// Helper: format ISO string in UK time (Europe/London)
// ---------------------------------------------------------------------
const formatInUKTime = (isoString: string): string => {
  const date = parseISO(isoString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(date);
};

export default function TaskDetailPage() {
  const cookies = useCookies();
  const { id } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // -----------------------------------------------------------------
  // Fetch task
  // -----------------------------------------------------------------
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
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTask();
  }, [id, cookies]);

  // -----------------------------------------------------------------
  // Avatar initials
  // -----------------------------------------------------------------
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // -----------------------------------------------------------------
  // Loading / Error UI
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error || 'Task not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const PriorityIcon = priorityConfig[task.priority]?.icon || Tag;
  const StatusIcon = statusConfig[task.status]?.icon || XCircle;

  // -----------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          <p className="mt-2 text-gray-600">{task.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Type */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Task Type</span>
                  </div>
                  <p className="font-medium text-gray-900">{task.task_type_display}</p>
                  <p className="text-sm text-gray-500">{task.task_type.description}</p>
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <StatusIcon className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      statusConfig[task.status]?.color
                    }`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[task.status]?.label || task.status}
                  </span>
                </div>

                {/* Priority */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <PriorityIcon className="w-4 h-4" />
                    <span>Priority</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      priorityConfig[task.priority]?.color
                    }`}
                  >
                    <PriorityIcon className="w-3 h-3" />
                    {task.priority}
                  </span>
                </div>

                {/* Deadline */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatInUKTime(task.deadline)}
                  </p>
                  {task.is_overdue ? (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      Overdue by {Math.abs(task.days_until_deadline)} days
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {task.days_until_deadline} days remaining
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned To */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Assigned To</p>
                  <div className="flex items-center gap-3">
                    {task.assigned_to.avatar ? (
                      <img
                        src={task.assigned_to.avatar}
                        alt={task.assigned_to.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                        {getInitials(task.assigned_to.full_name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{task.assigned_to.full_name}</p>
                      <p className="text-sm text-gray-500">{task.assigned_to.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{task.assigned_to.role}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned By */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Assigned By</p>
                  <div className="flex items-center gap-3">
                    {task.assigned_by.avatar ? (
                      <img
                        src={task.assigned_by.avatar}
                        alt={task.assigned_by.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                        {getInitials(task.assigned_by.full_name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{task.assigned_by.full_name}</p>
                      <p className="text-sm text-gray-500">{task.assigned_by.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{task.assigned_by.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(task.reason || task.completion_notes) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                {task.reason && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
                    <p className="text-gray-600">{task.reason}</p>
                  </div>
                )}
                {task.completion_notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Completion Notes</p>
                    <p className="text-gray-600">{task.completion_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium text-gray-900">{formatInUKTime(task.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium text-gray-900">{formatInUKTime(task.updated_at)}</span>
                </div>
                {task.approved_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved</span>
                    <span className="font-medium text-green-600">{formatInUKTime(task.approved_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Activity History</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {task.history.length}
                  </span>
                </div>
                {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showHistory && (
                <div className="border-t border-gray-200 p-4 space-y-3 max-h-96 overflow-y-auto">
                  {task.history.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-gray-900">{item.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatInUKTime(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Logs */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Audit Logs</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {task.change_logs.length}
                  </span>
                </div>
                {showLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showLogs && (
                <div className="border-t border-gray-200 p-4 space-y-4 max-h-96 overflow-y-auto text-xs">
                  {task.change_logs.map((log) => (
                    <div key={log.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-900">
                          {log.action_type_display}
                        </span>
                        <span className="text-gray-500">{formatInUKTime(log.created_at)}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{log.comment}</p>
                      {log.field_name && (
                        <p className="text-gray-500 mt-1">
                          <span className="font-medium">{log.field_name}:</span>{' '}
                          {log.old_value} to {log.new_value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}