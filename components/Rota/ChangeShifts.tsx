import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, MessageSquare, ArrowRight, AlertCircle, Save } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';

interface ShiftChange {
  id: number;
  old_shift_name: string;
  new_shift_name: string;
  date: string;
  approval: string;
  change_shift_request_id: number;
}

interface ChangeShiftRequest {
  id: number;
  driver_name: string;
  request_date: string;
  status: string;
  request_reason: string;
  admin_response: string | null;
  shift_changes: ShiftChange[];
}

interface ShiftDecision {
  change_shift_id: number;
  approval: 'approved' | 'rejected';
}

const ChangeShifts: React.FC = () => {
  const [requests, setRequests] = useState<ChangeShiftRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [shiftDecisions, setShiftDecisions] = useState<Record<number, ShiftDecision>>({});
  const [adminResponse, setAdminResponse] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const cookies = useCookies();

  useEffect(() => {
    fetchShiftRequests();
  }, []);

  const fetchShiftRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff/change-shift-requests/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch shift change requests');
      }
      const data: ChangeShiftRequest[] = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (requestId: number, shifts: ShiftChange[]) => {
    setEditingRequestId(requestId);
    const decisions: Record<number, ShiftDecision> = {};
    shifts.forEach(shift => {
      if (shift.approval === 'pending') {
        decisions[shift.id] = {
          change_shift_id: shift.id,
          approval: 'approved'
        };
      }
    });
    setShiftDecisions(decisions);
    setAdminResponse('');
  };

  const cancelEditing = () => {
    setEditingRequestId(null);
    setShiftDecisions({});
    setAdminResponse('');
  };

  const toggleShiftDecision = (shiftId: number) => {
    setShiftDecisions(prev => ({
      ...prev,
      [shiftId]: {
        change_shift_id: shiftId,
        approval: prev[shiftId]?.approval === 'approved' ? 'rejected' : 'approved'
      }
    }));
  };

  const handleSaveChanges = async () => {
    if (Object.keys(shiftDecisions).length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        requests: Object.values(shiftDecisions),
        admin_response: adminResponse.trim() || undefined,
      };

      const response = await fetch(`${API_URL}/api/staff/change-shift-requests/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      await fetchShiftRequests();
      cancelEditing();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'approved') return req.status === 'approved' || req.status === 'accepted';
    return req.status === filterStatus;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'partial_accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'accepted') return 'Approved';
    if (status === 'partial_accepted') return 'Partial Accepted';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading shift requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Data</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Shift Change Requests
          </h1>
          <p className="text-slate-600">
            Manage and track all shift modification requests
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${filterStatus === key
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
            >
              {label}
              <span className="ml-2 text-sm opacity-80">
                ({statusCounts[key as keyof typeof statusCounts]})
              </span>
            </button>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 text-lg font-medium mb-1">
                No requests found
              </p>
              <p className="text-slate-500 text-sm">
                {filterStatus === 'all'
                  ? 'There are no shift change requests at the moment.'
                  : `No ${filterStatus} requests available.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const isEditing = editingRequestId === request.id;
              const hasPendingShifts = request.shift_changes.some(s => s.approval === 'pending');

              return (
                <Card key={request.id} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-800">
                            {request.driver_name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {new Date(request.request_date).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                                timeZone: 'Asia/Karachi',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(request.status)} border px-4 py-1.5 font-semibold text-sm`}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        {!isEditing && hasPendingShifts && (
                          <Button
                            size="sm"
                            onClick={() => startEditing(request.id, request.shift_changes)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            Review Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="mb-6 space-y-3">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-slate-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                              Request Reason
                            </p>
                            <p className="text-slate-700">{request.request_reason}</p>
                          </div>
                        </div>
                      </div>

                      {request.admin_response && (
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">
                                Admin Response
                              </p>
                              <p className="text-slate-700">{request.admin_response}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Requested Shift Changes
                      </h3>

                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Date</th>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Current Shift</th>
                              <th className="px-4 py-3"></th>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">New Shift</th>
                              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                              {isEditing && <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Decision</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {request.shift_changes.map((shift) => {
                              const decision = shiftDecisions[shift.id];
                              const isApproved = decision?.approval === 'approved';

                              return (
                                <tr key={shift.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium text-slate-700">
                                    {formatToDDMMYYYY(shift.date)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium">
                                      {shift.old_shift_name}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-orange-100 text-orange-700 text-sm font-medium">
                                      {shift.new_shift_name}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={`${getStatusColor(shift.approval)} border font-medium`}>
                                      {getStatusLabel(shift.approval)}
                                    </Badge>
                                  </td>
                                  {isEditing && shift.approval === 'pending' && (
                                    <td className="px-4 py-3">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => toggleShiftDecision(shift.id)}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isApproved ? 'bg-green-600' : 'bg-red-600'
                                            }`}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isApproved ? 'translate-x-6' : 'translate-x-1'
                                              }`}
                                          />
                                        </button>
                                        <span className={`text-sm font-medium ${isApproved ? 'text-green-700' : 'text-red-700'}`}>
                                          {isApproved ? 'Approve' : 'Reject'}
                                        </span>
                                      </div>
                                    </td>
                                  )}
                                  {isEditing && shift.approval !== 'pending' && (
                                    <td className="px-4 py-3 text-center text-slate-400 text-sm">—</td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {isEditing && (
                        <div className="mt-6 space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">
                              Admin Response
                            </label>
                            <Textarea
                              placeholder="Add your response or notes about this decision..."
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              rows={3}
                              className="resize-none bg-white"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={submitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveChanges}
                              disabled={submitting || Object.keys(shiftDecisions).length === 0}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              {submitting ? (
                                <>Processing...</>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save All Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeShifts;