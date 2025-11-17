'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCookies } from 'next-client-cookies';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  History,
  ChevronDown,
  ChevronUp,
  FileText,
  Tag,
  AlertTriangle,
  Save,
  X,
  Car,
} from 'lucide-react';

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

interface Task {
  id: number;
  title: string;
  description: string;
  task_type_display: string;
  assigned_to: { id: number; full_name: string; email: string; role: string; avatar?: string };
  assigned_by: { full_name: string; email: string; role: string; avatar?: string };
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_viewed' | 'viewed' | 'in_progress' | 'completed' | 'rejected' | null;
  reason: string | null;
  vehicle?: string; // registration number as string
  is_overdue: boolean;
  days_until_deadline: number;
  created_at: string;
  updated_at: string;
  history: { id: number; comment: string; created_at: string }[];
}

// ---------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------
const priorityConfig: Record<string, { color: string; icon: any }> = {
  low: { color: 'bg-blue-100 text-blue-800', icon: Tag },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  urgent: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  not_viewed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Not Viewed' },
  viewed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Viewed' },
  in_progress: { color: 'bg-purple-100 text-purple-800', icon: Calendar, label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
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

export default function TaskDetailPage() {
  const cookies = useCookies();
  const { id } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // -----------------------------------------------------------------
  // Fetch Task
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
        setOriginalTask(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTask();
  }, [id, cookies]);

  // -----------------------------------------------------------------
  // Fetch All Vehicles
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const access_token = cookies.get('access_token');
        if (!access_token) return;

        const res = await fetch(`${API_URL}/api/vehicles/`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load vehicles');
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          setVehicles(result.data);
        }
      } catch (err) {
        console.warn('Could not load vehicles:', err);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [cookies]);

  // Avatar initials
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Safe config getters
  const currentStatus = task?.status || 'not_viewed';
  const currentPriority = task?.priority || 'medium';

  const StatusIcon = statusConfig[currentStatus]?.icon || XCircle;
  const StatusColor = statusConfig[currentStatus]?.color || 'bg-gray-100 text-gray-800';
  const StatusLabel = statusConfig[currentStatus]?.label || 'Unknown';

  const PriorityIcon = priorityConfig[currentPriority]?.icon || Tag;
  const PriorityColor = priorityConfig[currentPriority]?.color || 'bg-gray-100 text-gray-800';

  // Edit Actions
  const startEditing = () => setIsEditing(true);
  const cancelEditing = () => {
    setTask(originalTask);
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!task) return;
    setSaving(true);

    try {
      const access_token = cookies.get('access_token');
      const payload: any = {
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to.id,
        deadline: task.deadline.endsWith('Z') ? task.deadline : task.deadline + 'Z',
        priority: task.priority,
      };

      if (task.vehicle?.trim()) payload.vehicle = task.vehicle.trim();
      if (task.reason?.trim()) payload.reason = task.reason.trim();
      if (task.status) payload.status = task.status;

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

      const updated = await res.json();
      setTask(updated);
      setOriginalTask(updated);
      setIsEditing(false);
      alert('Task updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Loading & Error States
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !task) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                className="text-3xl font-bold bg-transparent border-b-2 border-blue-600 outline-none w-full"
                autoFocus
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            )}

            {isEditing ? (
              <textarea
                value={task.description}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                rows={3}
                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="mt-2 text-gray-600">{task.description}</p>
            )}
          </div>

          <div className="flex gap-3 ml-6">
            {isEditing ? (
              <>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  <X className="w-5 h-5" /> Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70 transition"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <FileText className="w-5 h-5" />
                Update Task
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Task Type</span>
                  </div>
                  <p className="font-medium text-gray-900">{task.task_type_display}</p>
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <StatusIcon className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  {isEditing ? (
                    <select
                      value={currentStatus}
                      onChange={(e) => setTask({ ...task, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="not_viewed">Not Viewed</option>
                      <option value="viewed">Viewed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${StatusColor}`}>
                      <StatusIcon className="w-3 h-3" />
                      {StatusLabel}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <PriorityIcon className="w-4 h-4" />
                    <span>Priority</span>
                  </div>
                  {isEditing ? (
                    <select
                      value={currentPriority}
                      onChange={(e) => setTask({ ...task, priority: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${PriorityColor}`}>
                      <PriorityIcon className="w-3 h-3" />
                      {currentPriority}
                    </span>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={task.deadline.slice(0, 16)}
                      onChange={(e) => setTask({ ...task, deadline: e.target.value + ':00Z' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <>
                      <p className="font-medium text-gray-900">{formatInUKTime(task.deadline)}</p>
                      {task.is_overdue ? (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          Overdue by {Math.abs(task.days_until_deadline)} days
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          {task.days_until_deadline} days remaining
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Vehicle Dropdown */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Car className="w-4 h-4" />
                    <span>Vehicle</span>
                  </div>
                  {isEditing ? (
                    <select
                      value={task.vehicle || ''}
                      onChange={(e) => setTask({ ...task, vehicle: e.target.value || undefined })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.registration_number}>
                          {v.registration_number} • {v.make} {v.model} ({v.vehicle_type_name})
                          {v.primary_site_name && ` • ${v.primary_site_name}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium text-gray-900">
                      {task.vehicle || 'Not specified'}
                    </p>
                  )}
                  {loadingVehicles && isEditing && (
                    <p className="text-xs text-gray-500 mt-1">Loading vehicles...</p>
                  )}
                </div>

                {/* Reason / Notes */}
                {(task.reason || isEditing) && (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{task.status === 'completed' ? 'Completion Notes' : 'Reason'}</span>
                    </div>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={task.reason || ''}
                        onChange={(e) => setTask({ ...task, reason: e.target.value })}
                        placeholder="Enter reason or completion notes..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">{task.reason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Assigned To</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                      {getInitials(task.assigned_to.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{task.assigned_to.full_name}</p>
                      <p className="text-sm text-gray-500">{task.assigned_to.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Assigned By</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                      {getInitials(task.assigned_by.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{task.assigned_by.full_name}</p>
                      <p className="text-sm text-gray-500">{task.assigned_by.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
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
                      <p className="text-xs text-gray-500 mt-1">{formatInUKTime(item.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}