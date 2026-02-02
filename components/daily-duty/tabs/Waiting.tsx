import { useCookies } from "next-client-cookies";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo, lazy, Suspense, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  Search,
  BarChart3,
  Filter,
  RefreshCw,
  FileText,
  XCircle,
  Loader2,
  Trash2,
  Undo2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import API_URL from "@/app/utils/ENV";
import ExportButton from "@/app/utils/ExportButton";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";

// Lazy load signature canvas
const SignatureCanvas = lazy(() => import("react-signature-canvas"));

interface UserWeek {
  id: number;
  user: number;
  reference_period: number;
  week_number: number;
  week_hours: number;
  week_status: string;
  signature: string | null;
  is_approved: boolean;
  approver_signature: string | null;
  approver_remarks: string | null;
  week_start_date: string | null;
  week_end_date: string | null;
  allowed_hours: number;
  total_hours_worked: number;
  average_hours: number;
  wtd_hours_remaining: number;
  average_remaining: number;
}

interface Log {
  id: number;
  user_week: number;
  child_rota: number;
  shift: number;
  shift_name: string;
  vehicle: number | null;
  vehicle_registration?: string;
  date: string;
  day: string;
  start_mileage: number | null;
  end_mileage: number | null;
  duty_start_time: string;
  duty_end_time: string;
  driving_duty_hours: string;
  driving_duty_hours_2: string;
  other_duty_hours: string;
  other_duty_hours_2: string;
  time_spent: string;
  total_duty_time: string;
  breaks_taken: string;
  breaks_taken_2: string;
  on_duty: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
}

interface WeekData {
  userweek: UserWeek;
  logs: Log[];
}

const Waiting = () => {
  const { id } = useParams();
  const token = useCookies().get("access_token");
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<number | null>(null);
  const [approverName, setApproverName] = useState("");
  const [approverRemarks, setApproverRemarks] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  const signatureCanvasRef = useRef<any>(null);
  const router = useRouter();

  const handleLogClick = (log: Log) => {
    if (log.on_duty) {
      router.push(
        `/dashboard/users/daily-duty-logs/${id}/${log.day}?logData=${encodeURIComponent(JSON.stringify(log))}`,
      );
    }
  };

  useEffect(() => {
    fetchWaitingdWeeks();
  }, [id, token]);

  const fetchWaitingdWeeks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/activity/wtd?week_status=waiting&user_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch waiting weeks");
      }

      const data = await response.json();
      setWeeks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching waiting weeks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Signature functions
  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      setSignatureData(null);
    }
  };

  const undoSignature = () => {
    if (signatureCanvasRef.current) {
      const data = signatureCanvasRef.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove last stroke
        signatureCanvasRef.current.fromData(data);
        updateSignatureData();
      }
    }
  };

  const updateSignatureData = () => {
    if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
      const dataUrl = signatureCanvasRef.current.toDataURL();
      setSignatureData(dataUrl);
    } else {
      setSignatureData(null);
    }
  };

  const handleSignatureEnd = () => {
    updateSignatureData();
  };

  // API Functions
  const approveWeek = async () => {
    if (!selectedWeekId) return false;
    


    if (!signatureData) {
      setError("Please provide your signature");
      return false;
    }
    
    try {
      setActionLoading(selectedWeekId);
      const response = await fetch(
        `${API_URL}/activity/wtd/${selectedWeekId}/mark_approved/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approver_signature: signatureData,
            approver_remarks: approverRemarks,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to approve week");
      }

      // Update the week status locally
      setWeeks(prevWeeks =>
        prevWeeks.map(week =>
          week.userweek.id === selectedWeekId
            ? {
                ...week,
                userweek: {
                  ...week.userweek,
                  is_approved: true,
                  week_status: "approved",
                  approver_signature: approverName,
                  approver_remarks: approverRemarks,
                },
              }
            : week
        )
      );

      setApproveDialogOpen(null);
      setSelectedWeekId(null);
      setApproverName("");
      setApproverRemarks("");
      setSignatureData(null);
      if (signatureCanvasRef.current) {
        signatureCanvasRef.current.clear();
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve week");
      console.error("Error approving week:", err);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const rejectWeek = async () => {
    if (!selectedWeekId) return false;
    
    try {
      setActionLoading(selectedWeekId);
      const response = await fetch(
        `${API_URL}/activity/wtd/${selectedWeekId}/mark_rejected/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remarks: rejectRemarks,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reject week");
      }

      // Remove the rejected week from the list since it's no longer in waiting status
      setWeeks(prevWeeks =>
        prevWeeks.filter(week => week.userweek.id !== selectedWeekId)
      );

      setRejectDialogOpen(null);
      setSelectedWeekId(null);
      setRejectRemarks("");
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject week");
      console.error("Error rejecting week:", err);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const openApproveDialog = (weekId: number) => {
    setSelectedWeekId(weekId);
    setApproveDialogOpen(weekId);
    setApproverName("");
    setApproverRemarks("");
    setSignatureData(null);
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const openRejectDialog = (weekId: number) => {
    setSelectedWeekId(weekId);
    setRejectDialogOpen(weekId);
    setRejectRemarks("");
  };

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalWeeks = weeks.length;
    const approvedWeeks = weeks.filter((w) => w.userweek.is_approved).length;
    const pendingWeeks = totalWeeks - approvedWeeks;
    const totalHours = weeks.reduce(
      (sum, w) => sum + w.userweek.total_hours_worked,
      0,
    );
    const avgUtilization =
      totalWeeks > 0
        ? weeks.reduce(
            (sum, w) =>
              sum +
              (w.userweek.total_hours_worked / w.userweek.allowed_hours) * 100,
            0,
          ) / totalWeeks
        : 0;

    return {
      totalWeeks,
      approvedWeeks,
      pendingWeeks,
      totalHours,
      avgUtilization,
    };
  }, [weeks]);

  // Filter weeks based on search and tab
  const filteredWeeks = useMemo(() => {
    let filtered = weeks;

    if (selectedTab === "approved") {
      filtered = filtered.filter((w) => w.userweek.is_approved);
    } else if (selectedTab === "pending") {
      filtered = filtered.filter((w) => !w.userweek.is_approved);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (w) =>
          w.userweek.week_number.toString().includes(searchQuery) ||
          w.userweek.reference_period.toString().includes(searchQuery) ||
          w.userweek.week_start_date?.includes(searchQuery),
      );
    }

    return filtered;
  }, [weeks, selectedTab, searchQuery]);

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === "00:00:00") return "-";
    const [hours, minutes] = timeString.split(":");
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return formatToDDMMYYYY(dateString);
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return "Date range unavailable";
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const calculateTotalDrivingHours = (logs: Log[]) => {
    return logs.reduce((total, log) => {
      if (log.driving_duty_hours !== "00:00:00") {
        const [hours] = log.driving_duty_hours.split(":");
        return total + parseInt(hours);
      }
      return total;
    }, 0);
  };

  const calculateTotalOtherHours = (logs: Log[]) => {
    return logs.reduce((total, log) => {
      if (log.other_duty_hours !== "00:00:00") {
        const [hours] = log.other_duty_hours.split(":");
        return total + parseInt(hours);
      }
      return total;
    }, 0);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-amber-600";
    return "text-emerald-600";
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-50 border-red-200";
    if (percentage >= 75) return "bg-amber-50 border-amber-200";
    return "bg-emerald-50 border-emerald-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="border-0 shadow-lg bg-red-50">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              Unable to Load Data
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={fetchWaitingdWeeks}
            size="lg"
            className="mt-6 shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="rounded-full bg-gradient-to-br from-blue-100 to-blue-50 p-6 mb-6">
                <Calendar className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Waiting Weeks</h3>
              <p className="text-slate-600 max-w-md mb-6">
                There are no waiting weeks available yet. Waiting weeks will
                appear here once submitted and processed.
              </p>
              <Button onClick={fetchWaitingdWeeks} variant="outline" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Waiting Weeks
            </h1>
            <p className="text-slate-600 mt-2">
              Review and approve work time directive compliance
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={filteredWeeks} fileName="waiting-duty-logs" />
            <Button
              onClick={fetchWaitingdWeeks}
              variant="outline"
              size="lg"
              className="shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by week number or reference period..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-[#E63946] transition-colors"
                />
              </div>
              <Button variant="outline" className="sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen !== null} onOpenChange={(open) => {
          if (!open) {
            setApproveDialogOpen(null);
            setSelectedWeekId(null);
            setApproverName("");
            setApproverRemarks("");
            setSignatureData(null);
            if (signatureCanvasRef.current) {
              signatureCanvasRef.current.clear();
            }
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Week</DialogTitle>
              <DialogDescription>
                Approve this week&apos;s work time directive compliance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
        
              <div>
                <label className="text-sm font-medium">Signature</label>
                <div className="mt-1">
                  <div className="border border-gray-300 rounded-md p-2">
                    <Suspense fallback={
                      <div className="w-full h-32 flex items-center justify-center bg-white">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    }>
                      <SignatureCanvas
                        ref={signatureCanvasRef}
                        canvasProps={{
                          className: "w-full h-32 bg-white",
                          "aria-label": "Signature canvas",
                        }}
                        penColor="black"
                        backgroundColor="white"
                        onEnd={handleSignatureEnd}
                      />
                    </Suspense>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={undoSignature}
                      className="flex-1"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      Undo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  {signatureData && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Signature captured
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Remarks (Optional)</label>
                <Textarea
                  value={approverRemarks}
                  onChange={(e) => setApproverRemarks(e.target.value)}
                  placeholder="Add any remarks or feedback..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApproveDialogOpen(null);
                  setSelectedWeekId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={approveWeek}
                disabled={ !signatureData || actionLoading === selectedWeekId}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === selectedWeekId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen !== null} onOpenChange={(open) => {
          if (!open) {
            setRejectDialogOpen(null);
            setSelectedWeekId(null);
            setRejectRemarks("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Week</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this week&apos;s submission.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rejection Remarks</label>
                <Textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Explain why this week is being rejected..."
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(null);
                  setSelectedWeekId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={rejectWeek}
                disabled={!rejectRemarks.trim() || actionLoading === selectedWeekId}
              >
                {actionLoading === selectedWeekId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {filteredWeeks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                No weeks found
              </h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredWeeks.map((weekData) => {
              const { userweek, logs } = weekData;
              const utilizationPercentage =
                (userweek.total_hours_worked / userweek.allowed_hours) * 100;
              const totalDrivingHours = calculateTotalDrivingHours(logs);
              const totalOtherHours = calculateTotalOtherHours(logs);

              return (
                <AccordionItem
                  key={userweek.id}
                  value={`week-${userweek.id}`}
                  className="border-0 shadow-sm rounded-xl overflow-hidden bg-white"
                >
                  <AccordionTrigger className="hover:no-underline px-6 py-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#E63946]/10 rounded-lg border border-[#E63946]/20">
                            <Calendar className="h-4 w-4 text-[#E63946]" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-900">
                              Week {userweek.week_number}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDateRange(
                                userweek.week_start_date,
                                userweek.week_end_date,
                              )}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            userweek.is_approved ? "default" : "secondary"
                          }
                          className={
                            userweek.is_approved
                              ? "bg-[#F77F00] text-white hover:bg-[#F77F00] border-[#F77F00]"
                              : "bg-[#FCBF49] text-slate-800 hover:bg-[#FCBF49] border-[#FCBF49]"
                          }
                        >
                          {userweek.is_approved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>

                        <Badge variant="outline" className="border-slate-300">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          RP {userweek.reference_period}
                        </Badge>
                      </div>

                      <div className="hidden lg:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {userweek.total_hours_worked}h
                          </p>
                          <p className="text-xs text-slate-500">
                            of {userweek.allowed_hours}h
                          </p>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg border ${getUtilizationBgColor(utilizationPercentage)}`}
                        >
                          <p
                            className={`text-lg font-bold ${getUtilizationColor(utilizationPercentage)}`}
                          >
                            {utilizationPercentage.toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-600">utilized</p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      {/* Action Buttons */}
                      {!userweek.is_approved && (
                        <div className="flex gap-3 justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openRejectDialog(userweek.id)}
                            disabled={actionLoading === userweek.id}
                          >
                            {actionLoading === userweek.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </>
                            )}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openApproveDialog(userweek.id)}
                            disabled={actionLoading === userweek.id}
                          >
                            {actionLoading === userweek.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Daily Logs Table */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Daily Activity Logs
                          </h3>
                          <Badge variant="outline">
                            {logs.length} days logged
                          </Badge>
                        </div>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="font-semibold">
                                  Date
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Day
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Shift
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Vehicle
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Duty Hours
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Driving
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Other Duty
                                </TableHead>
                                <TableHead className="font-semibold">
                                  Breaks
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {logs.map((log) => (
                                <TableRow
                                  key={log.id}
                                  onClick={() => handleLogClick(log)}
                                  className="hover:bg-slate-50 cursor-pointer"
                                >
                                  <TableCell className="font-medium">
                                    {formatDate(log.date)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="font-medium"
                                    >
                                      {log.day}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <Badge
                                        variant="secondary"
                                        className="mb-1"
                                      >
                                        {log.shift_name}
                                      </Badge>
                                      <p className="text-xs text-slate-500">
                                        {log.duty_start_time} -{" "}
                                        {log.duty_end_time}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {log.vehicle_registration ? (
                                      <Badge
                                        variant="outline"
                                        className="border-[#F77F00]/30 bg-[#F77F00]/10 text-[#F77F00]"
                                      >
                                        <Truck className="h-3 w-3 mr-1" />
                                        {log.vehicle_registration}
                                      </Badge>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatTime(log.total_duty_time)}
                                  </TableCell>
                                  <TableCell className="text-[#F77F00] font-medium">
                                    {formatTime(log.driving_duty_hours)}
                                  </TableCell>
                                  <TableCell className="text-[#FCBF49] font-medium">
                                    {formatTime(log.other_duty_hours)}
                                  </TableCell>
                                  <TableCell className="text-[#E63946] font-medium">
                                    {formatTime(log.breaks_taken)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Approver Info if approved */}
                      {userweek.is_approved && userweek.approver_remarks && (
                        <Card className="border border-green-200 bg-green-50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-slate-900">
                                    Approved by: {userweek.approver_signature}
                                  </p>
                                  <Badge variant="outline" className="border-green-300 text-green-700">
                                    Approved
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700">
                                  {userweek.approver_remarks}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default Waiting;