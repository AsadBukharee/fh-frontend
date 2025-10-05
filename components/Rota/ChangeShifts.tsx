import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Calendar, Clock, User, MessageSquare, ArrowRight, AlertCircle, Check, X } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

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

interface ActionDialogState {
  isOpen: boolean;
  requestId: number | null;
  shiftChangeIds: number[];
  action: 'approved' | 'rejected' | null;
  driverName: string;
  isBulkAction: boolean;
}

const ChangeShifts: React.FC = () => {
  const [requests, setRequests] = useState<ChangeShiftRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogState, setDialogState] = useState<ActionDialogState>({
    isOpen: false,
    requestId: null,
    shiftChangeIds: [],
    action: null,
    driverName: '',
    isBulkAction: false,
  });
  const [adminResponse, setAdminResponse] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const cookies = useCookies();

  useEffect(() => {
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

    fetchShiftRequests();
  }, []);

  const openActionDialog = (request: ChangeShiftRequest, action: 'approved' | 'rejected', shiftChangeId?: number) => {
    setDialogState({
      isOpen: true,
      requestId: request.id,
      shiftChangeIds: shiftChangeId ? [shiftChangeId] : request.shift_changes.map(sc => sc.id),
      action,
      driverName: request.driver_name,
      isBulkAction: !shiftChangeId,
    });
    setAdminResponse('');
  };

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      requestId: null,
      shiftChangeIds: [],
      action: null,
      driverName: '',
      isBulkAction: false,
    });
    setAdminResponse('');
  };

  const handleSubmitAction = async () => {
    if (!dialogState.action || dialogState.shiftChangeIds.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        requests: dialogState.shiftChangeIds.map(id => ({
          change_shift_id: id,
          approval: dialogState.action,
        })),
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

      // Refresh the requests list
      const updatedResponse = await fetch(`${API_URL}/api/staff/change-shift-requests/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
      });
      
      if (updatedResponse.ok) {
        const data: ChangeShiftRequest[] = await updatedResponse.json();
        setRequests(data);
      }

      closeDialog();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'approved') return req.status === 'approved' || req.status === 'approved';
    return req.status === filterStatus;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Shift Change Requests
          </h1>
          <p className="text-slate-600">
            Manage and track all shift modification requests
          </p>
        </div>

        {/* Filter Tabs */}
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
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterStatus === key
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

        {/* Requests List */}
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
            {filteredRequests.map((request) => (
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
                      <Badge
                        className={`${getStatusColor(request.status)} border px-4 py-1.5 font-semibold text-sm`}
                      >
                        {request.status === 'approved' ? 'Approved' :(request.status=='partial_accepted'?"Partial Accepted": request.status.charAt(0).toUpperCase() + request.status.slice(1))}
                      </Badge>
                     
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Request Info */}
                  <div className="mb-6 space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                            Request Reason
                          </p>
                          <p className="text-slate-700">
                            {request.request_reason}
                          </p>
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
                            <p className="text-slate-700">
                              {request.admin_response}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shift Changes Table */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Requested Shift Changes
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            <TableHead className="font-semibold text-slate-700">Current Shift</TableHead>
                            <TableHead className="font-semibold text-slate-700"></TableHead>
                            <TableHead className="font-semibold text-slate-700">New Shift</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-center">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {request.shift_changes.map((shift) => (
                            <TableRow key={shift.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium text-slate-700">
                                {new Date(shift.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium">
                                  {shift.old_shift_name}
                                </span>
                              </TableCell>
                              <TableCell>
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-3 py-1 rounded-md bg-orange-100 text-orange-700 text-sm font-medium">
                                  {shift.new_shift_name}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getStatusColor(shift.approval)} border font-medium`}
                                >
                                  {shift.approval === 'approved' ? 'Approved' : shift.approval.charAt(0).toUpperCase() + shift.approval.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {shift.approval === 'pending' && (
                                  <div className="flex gap-1.5 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={() => openActionDialog(request, 'approved', shift.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => openActionDialog(request, 'rejected', shift.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white h-8 px-3"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                                {shift.approval !== 'pending' && (
                                  <div className="text-center text-slate-400 text-sm">—</div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogState.action === 'approved' ? (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  Approve Shift Change Request
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  Reject Shift Change Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogState.isBulkAction ? (
                dialogState.action === 'approved' 
                  ? `You are approving all ${dialogState.shiftChangeIds.length} shift change(s) for ${dialogState.driverName}.`
                  : `You are rejecting all ${dialogState.shiftChangeIds.length} shift change(s) for ${dialogState.driverName}.`
              ) : (
                dialogState.action === 'approved' 
                  ? `You are approving this individual shift change for ${dialogState.driverName}.`
                  : `You are rejecting this individual shift change for ${dialogState.driverName}.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="admin-response" className="text-sm font-medium text-slate-700 mb-2 block">
                Admin Response {dialogState.action === 'rejected' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                id="admin-response"
                placeholder={dialogState.action === 'approved' 
                  ? "Add an optional message (e.g., 'Approved as per company policy')"
                  : "Please provide a reason for rejection"}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={submitting || (dialogState.action === 'rejected' && !adminResponse.trim())}
              className={dialogState.action === 'approved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting ? 'Processing...' : `Confirm ${dialogState.action === 'approved' ? 'Approval' : 'Rejection'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeShifts;