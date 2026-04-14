'use client'

import { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  FileText,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  User,

  Signature,
  Camera,
  Printer,
  RotateCcw
} from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SignatureCanvas from 'react-signature-canvas';
import { useCookies } from 'next-client-cookies';

// Import Types and Components
import {
  Answer,
  FollowupAnswer,
  WalkaroundData,
  StepData,
  Steps
} from '@/components/walkaround/types';
import { PrintReportButton } from '@/components/walkaround/Walkaroundpdf';

// Utility helper for recursive defect note collection
const collectDefectNotes = (items: (Answer | FollowupAnswer)[]): string[] => {
  const notes: string[] = [];
  items?.forEach(item => {
    if (item.description && (('is_defected' in item && item.is_defected) || ('selected' in item && item.selected))) {
      notes.push(item.description);
    }
    if (item.followup_answers?.length > 0) {
      notes.push(...collectDefectNotes(item.followup_answers));
    }
  });
  return notes;
};

// Image Preview Modal Component
const ImagePreviewModal = ({
  imageUrl,
  isOpen,
  onClose
}: {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95 no-print">
        <DialogHeader className="p-4 border-b border-gray-700">
          <DialogTitle className="text-white flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Image Preview
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Signature Modal Component
const SignatureModal = ({
  signatureData,
  isOpen,
  onClose,
  conductedBy,
  date,
  time
}: {
  signatureData: string;
  isOpen: boolean;
  onClose: () => void;
  conductedBy: { full_name: string } | null;
  date: string;
  time: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5 text-orange-500" />
            Signature Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
            <img
              src={signatureData}
              alt="Signature"
              className="max-w-full max-h-[200px] object-contain mb-4 border border-gray-200 rounded-lg p-4 bg-white"
            />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Signed by: {conductedBy?.full_name || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                Date: {formatToDDMMYYYY(date)} • Time: {time}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// CP Signature Dialog Component
const CPSignatureDialog = ({
  isOpen,
  onClose,
  onSubmit,
  walkaroundId,
  isSubmitting
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (walkaroundId: number, signature: string, note: string) => Promise<void>;
  walkaroundId: number;
  isSubmitting: boolean;
}) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [note, setNote] = useState("");

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signatureData = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");
      onSubmit(walkaroundId, signatureData, note);
    } else {
      alert("Please provide a signature first.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5 text-orange-500" />
            Sign CP (Counterpart)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Please provide your signature below to confirm the roadworthy status of this walkaround step.
          </p>
          <div className="bg-white p-2 rounded-lg border-2 border-dashed border-gray-200">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: "w-full h-64 bg-white cursor-crosshair",
                style: { width: '100%' }
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Note (Required)</p>
            <Textarea
              placeholder="Add a note about this update..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px] border-gray-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div className="flex justify-between gap-3">
            <Button onClick={handleClear} variant="outline" disabled={isSubmitting}>
              Clear Signature
            </Button>
            <div className="flex gap-3">
              <Button onClick={onClose} variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Signature'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Activity Logs Modal Component
const ActivityLogsModal = ({
  isOpen,
  onClose,
  activityLogs,
}: {
  isOpen: boolean;
  onClose: () => void;
  activityLogs: any[];
}) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Activity Logs</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
            th, td { border: 1px solid #ddd; padding: 12px; }
            th { background-color: #f8fafc; color: #334155; }
            h2 { color: #0f172a; border-bottom: 2px solid #f97316; padding-bottom: 10px; display: inline-block; }
          </style>
        </head>
        <body>
          <h2>Activity Logs</h2>
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${activityLogs.map(log =>
      "<tr>" +
      "<td>" + new Date(log.created_at).toLocaleString() + "</td>" +
      "<td>" + log.user_name + "</td>" +
      "<td style='text-transform: capitalize; font-weight: 600;'>" + log.action + "</td>" +
      "<td>" + log.details + "</td>" +
      "</tr>"
    ).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full no-print flex flex-col max-h-[85vh]">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Activity Logs
          </DialogTitle>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 h-8 mr-6">
            <Printer className="h-4 w-4" />
            Print Logs
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
          {activityLogs && activityLogs.length > 0 ? (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{log.user_name}</p>
                      <time className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </time>
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 mb-1">
                        {log.action}
                      </span>
                      <p className="text-xs text-gray-700">{log.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No activity logs found for this inspection.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const VehicleInspectionDashboard = () => {
  const [stepDataList, setStepDataList] = useState<StepData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});
  const [steps, setSteps] = useState<Steps>({});

  // Centralized Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewSignature, setPreviewSignature] = useState<{
    signatureData: string;
    conductedBy: { full_name: string } | null;
    date: string;
    time: string;
  } | null>(null);
  const [activeLogs, setActiveLogs] = useState<any[] | null>(null);

  const cookies = useCookies();
  const [isCPSigning, setIsCPSigning] = useState(false);
  const [cpSigningStepId, setCPSigningStepId] = useState<number | null>(null);
  const [isSubmittingCP, setIsSubmittingCP] = useState(false);

  useEffect(() => {
    extractStepsFromURL();
  }, []);

  const extractStepsFromURL = () => {
    try {
      setIsLoading(true);
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);

      const extractedSteps: Steps = {
        step_1: params.get('step_1') || undefined,
        step_2: params.get('step_2') || undefined,
        step_3: params.get('step_3') || undefined,
        current_step: params.get('current_step') || undefined,
        total_steps: params.get('total_steps') || undefined,
        chain_id: params.get('chain_id') || undefined,
      };

      setSteps(extractedSteps);

      const stepList: StepData[] = [];
      if (extractedSteps.step_1) {
        stepList.push({ stepNumber: 1, stepId: extractedSteps.step_1, data: null, loading: true, error: null });
      }
      if (extractedSteps.step_2) {
        stepList.push({ stepNumber: 2, stepId: extractedSteps.step_2, data: null, loading: true, error: null });
      }
      if (extractedSteps.step_3) {
        stepList.push({ stepNumber: 3, stepId: extractedSteps.step_3, data: null, loading: true, error: null });
      }
      setStepDataList(stepList);

      fetchAllStepsData(stepList);
    } catch (error) {
      console.error('Error extracting steps from URL:', error);
      setError('Failed to parse URL parameters');
      setIsLoading(false);
    }
  };

  const fetchAllStepsData = async (stepsList: StepData[]) => {
    try {
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!accessToken) {
        const updatedSteps = stepsList.map(step => ({
          ...step,
          loading: false,
          error: "Authentication required"
        }));
        setStepDataList(updatedSteps);
        setIsLoading(false);
        return;
      }

      const fetchPromises = stepsList.map(async (step) => {
        try {
          const response = await fetch(`${API_URL}/api/walk-around/${step.stepId}/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch step ${step.stepNumber} data`);
          }

          const data = await response.json();

          if (data?.success) {
            return {
              ...step,
              data: data,
              loading: false,
              error: null
            };
          } else {
            throw new Error(data?.message || `Unknown error for step ${step.stepNumber}`);
          }
        } catch (err) {
          return {
            ...step,
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load step data'
          };
        }
      });

      const results = await Promise.all(fetchPromises);
      setStepDataList(results);
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching all steps data:', error);
      const updatedSteps = stepsList.map(step => ({
        ...step,
        loading: false,
        error: 'Failed to load step data'
      }));
      setStepDataList(updatedSteps);
      setIsLoading(false);
    }
  };

  const handleSaveComments = async (answerId: number, comments: string, stepNumber?: number): Promise<void> => {
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!accessToken) {
      alert("Authentication required");
      return;
    }

    setSavingStates(prev => ({ ...prev, [answerId]: true }));

    try {
      const response = await fetch(`${API_URL}/api/answer/${answerId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: comments }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comments');
      }

      if (stepNumber) {
        const stepIndex = stepDataList.findIndex(s => s.stepNumber === stepNumber);
        if (stepIndex !== -1 && stepDataList[stepIndex].data?.data?.answers) {
          const updatedStepDataList = [...stepDataList];
          const updatedAnswers = updatedStepDataList[stepIndex].data!.data.answers.map(answer =>
            answer.id === answerId ? { ...answer, description: comments } : answer
          );
          updatedStepDataList[stepIndex] = {
            ...updatedStepDataList[stepIndex],
            data: {
              ...updatedStepDataList[stepIndex].data!,
              data: {
                ...updatedStepDataList[stepIndex].data!.data,
                answers: updatedAnswers
              }
            }
          };
          setStepDataList(updatedStepDataList);
        }
      }

      alert('Comments saved successfully');
    } catch (error) {
      alert('Error saving comments. Please try again.');
      console.error('Error saving comments:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [answerId]: false }));
    }
  };

  const toggleSection = (section: string): void => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCPSignatureSubmit = async (walkaroundId: number, signatureBase64: string, note: string): Promise<void> => {
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!accessToken) {
      alert("Authentication required");
      return;
    }

    const userId = cookies.get('user_id');
    const role = 'manager';

    if (!userId) {
      alert("User ID not found in cookies");
      return;
    }

    setIsSubmittingCP(true);

    try {
      const response = await fetch(`${API_URL}/api/walkaround-signatures/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walkaround: walkaroundId,
          user_id: parseInt(userId),
          role: role,
          note: note,
          signature: signatureBase64
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit CP signature');
      }

      alert('CP Signature submitted successfully');
      setIsCPSigning(false);
      extractStepsFromURL(); // Refresh data
    } catch (error) {
      alert('Error submitting CP signature. Please try again.');
      console.error('Error submitting CP signature:', error);
    } finally {
      setIsSubmittingCP(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatToDDMMYYYY(dateString);
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return 'N/A';
    return timeString.split(':').slice(0, 2).join(':');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading inspection data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="w-full px-5 mx-auto">
        {/* Floating action buttons for Print/Download/Refresh are handled by PrintReportButton */}
        <PrintReportButton stepDataList={stepDataList} onRefresh={extractStepsFromURL} />

        <div className="space-y-4">
          {stepDataList.map((stepData) => (
            <StepCard
              key={stepData.stepNumber}
              stepData={stepData}
              onSaveComments={handleSaveComments}
              savingStates={savingStates}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              formatDate={formatDate}
              formatTime={formatTime}
              onImageClick={setPreviewImage}
              onSignatureClick={(sig) => setPreviewSignature(sig)}
              onSignCPClick={(stepId) => {
                setCPSigningStepId(stepId);
                setIsCPSigning(true);
              }}
              onActivityLogsClick={(logs) => setActiveLogs(logs)}
            />
          ))}
        </div>

        {/* Centralized Modals */}
        {isCPSigning && (
          <CPSignatureDialog
            isOpen={isCPSigning}
            onClose={() => setIsCPSigning(false)}
            onSubmit={handleCPSignatureSubmit}
            walkaroundId={cpSigningStepId!}
            isSubmitting={isSubmittingCP}
          />
        )}
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage}
            isOpen={!!previewImage}
            onClose={() => setPreviewImage(null)}
          />
        )}

        {previewSignature && (
          <SignatureModal
            signatureData={previewSignature.signatureData}
            isOpen={!!previewSignature}
            onClose={() => setPreviewSignature(null)}
            conductedBy={previewSignature.conductedBy}
            date={previewSignature.date}
            time={previewSignature.time}
          />
        )}

        {activeLogs && (
          <ActivityLogsModal
            isOpen={!!activeLogs}
            onClose={() => setActiveLogs(null)}
            activityLogs={activeLogs}
          />
        )}
      </div>
    </div>
  );
};

// Step Card Component
const StepCard = ({
  stepData,
  onSaveComments,
  savingStates,
  expandedSections,
  toggleSection,
  formatDate,
  formatTime,
  onImageClick,
  onSignatureClick,
  onSignCPClick,
  onActivityLogsClick,
}: {
  stepData: StepData
  onSaveComments: (answerId: number, comments: string, stepNumber?: number) => Promise<void>
  savingStates: Record<number, boolean>
  expandedSections: Record<string, boolean>
  toggleSection: (section: string) => void
  formatDate: (dateString: string) => string
  formatTime: (timeString: string) => string
  onImageClick: (url: string) => void
  onSignatureClick: (sig: {
    signatureData: string;
    conductedBy: { full_name: string } | null;
    date: string;
    time: string;
  }) => void
  onSignCPClick: (walkaroundId: number) => void
  onActivityLogsClick: (logs: any[]) => void
}) => {
  const { stepNumber, data, loading, error } = stepData;
  const isExpanded = expandedSections[`step-${stepNumber}`] !== false;

  if (loading) {
    return (
      <Card className="border border-gray-200 rounded-xl">
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.success || error) {
    return null;
  }

  const { walkaround, answers, defected_count, total_answers, cp_signature, activity_log } = data.data;
  const motionDetectedCount = answers.filter(a => a.motion_detected).length;
  const motionNotDetectedCount = answers.length - motionDetectedCount;
  const hasImages = answers.some(a => a.prove);
  const hasSignature = !!walkaround.signature;

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      <Card className="border border-gray-200 rounded-xl overflow-hidden shadow-sm print-card">
        {/* Header row */}
        <div className="flex justify-between items-start px-5 pt-4 pb-0">
          <div>
            <p className="text-base font-bold text-gray-900">
              Walkaround Details{' '}
              <span className="text-orange-500">{String(stepNumber).padStart(2, '0')}</span>
            </p>

          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {formatDate(walkaround.date)} at {formatTime(walkaround.time)}
            </p>
          </div>
        </div>

        <CardContent className="p-4 pt-3 space-y-0">
          {/* Vehicle Details section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
                Vehicle Details
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${getStatusBadgeClass(walkaround.status)}`}>
                {walkaround.status}
              </span>
            </div>

            {/* Row 1: Registration | Vehicle Type | Sites | Current Mileage */}
            <div className="grid grid-cols-4 gap-0 px-4 py-3 border-b border-gray-100">
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 mb-0.5">Registration No.</p>
                <p className="text-sm font-bold text-gray-900">{walkaround.vehicle?.registration_number || 'N/A'}</p>
              </div>
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 mb-0.5">Vehicle Type</p>
                <p className="text-sm font-semibold text-gray-900">{walkaround.vehicle?.vehicle_type_name || 'N/A'}</p>
              </div>
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 mb-0.5">Sites</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900">{walkaround.vehicle?.site_allocated?.[0]?.name || 'N/A'}</p>
                  {walkaround.vehicle?.site_allocated?.[0]?.status && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      {walkaround.vehicle.site_allocated[0].status}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Current Mileage</p>
                <p className="text-sm font-semibold text-gray-900">
                  {walkaround.vehicle?.last_mileage
                    ? `${walkaround.vehicle.last_mileage} ${walkaround.vehicle.mileage_unit || ''} `
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Row 2: Driver Name | Manager Name | Motion | Total Time */}
            <div className="grid grid-cols-4 gap-0 px-4 py-3">
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 mb-0.5">Driver Name</p>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900">{walkaround.conducted_by?.full_name || 'N/A'}</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    {walkaround.conducted_by?.role || 'Driver'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">{formatDate(walkaround.date)} at {formatTime(walkaround.time)}</p>
              </div>
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 mb-0.5">Manager Name</p>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900">
                    {walkaround.walkaround_assignee?.full_name ?? 'Unroad worthy'}
                  </p>
                  {walkaround.walkaround_assignee ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {walkaround.walkaround_assignee.role}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                      Unroad worthy
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">{formatDate(walkaround.date)} at {formatTime(walkaround.time)}</p>
              </div>
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 mb-1">Motion</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
                    {motionNotDetectedCount}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {motionDetectedCount}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Walkaround Duration</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
                    {walkaround.walkaround_duration ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily checks toggle */}
          <button
            onClick={() => toggleSection(`step-${stepNumber}`)}
            className="w-full flex justify-between items-center py-3 border-t border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50 px-1 rounded transition-colors no-print"
          >
            <span>Daily checks</span>
            {isExpanded
              ? <ChevronUp className="h-4 w-4 text-gray-400" />
              : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {/* Daily checks items */}
          {isExpanded && (
            <div className="relative">
              {/* Red accent bar on right for defects */}
              {defected_count > 0 && (
                <div className="absolute top-0 right-0 w-1 h-full bg-red-500 rounded-r-lg" />
              )}
              <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-3 print:max-h-none print:overflow-visible">
                {answers.map((answer, index) => (
                  <AnswerItem
                    key={answer.id}
                    answer={answer}
                    index={index}
                    stepNumber={stepNumber}
                    onSaveComments={onSaveComments}
                    isSaving={savingStates[answer.id]}
                    onImageClick={onImageClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom: Driver | CP two-column panel */}
          <div className="grid grid-cols-2 gap-0 mt-6 border-t border-gray-100 pt-5">
            {/* Driver column */}
            <div className="pr-6 border-r border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">Driver</p>

              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">Reported Defects</p>
                  <p className="text-xs text-blue-600 font-medium leading-relaxed bg-blue-50/50 p-2 rounded border border-blue-100/50">
                    {collectDefectNotes(answers).join(', ') || 'No defects reported'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">Note (Required)</p>
                  <p className="text-xs text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100/50 min-h-[40px]">
                    {walkaround.note || 'No additional note provided'}
                  </p>
                </div>
                {walkaround.signature && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase">Signature</p>
                    <div
                      className="cursor-pointer inline-block group"
                      onClick={() => onSignatureClick({
                        signatureData: walkaround.signature!,
                        conductedBy: walkaround.conducted_by,
                        date: walkaround.date,
                        time: walkaround.time
                      })}
                    >
                      <div className="relative">
                        <img
                          src={walkaround.signature}
                          alt="Signature"
                          className="h-12 object-contain bg-white rounded-lg border border-gray-200 p-2 mb-1 group-hover:border-orange-300 transition-all shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-orange-500" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">
                      {walkaround.conducted_by?.full_name} &bull; {formatDate(walkaround.date)} at {formatTime(walkaround.time)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CP column */}
            <div className="pl-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">CP</p>

              </div>
              <div className="space-y-4">

                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase">Note (Required)</p>
                  {
                    cp_signature?.note ? (
                      <p className="text-xs text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100/50 min-h-[40px]">
                        {cp_signature.note}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/50 min-h-[40px]">
                        No CP signature note provided
                      </p>
                    )
                  }
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {cp_signature ? (
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-tighter">CP Signature</p>
                      <div
                        className="cursor-pointer group relative inline-block"
                        onClick={() => onSignatureClick({
                          signatureData: cp_signature.signature,
                          conductedBy: { full_name: cp_signature.user_name },
                          date: cp_signature.signed_at,
                          time: formatTime(cp_signature.signed_at.split('T')[1] || '')
                        })}
                      >
                        <img
                          src={cp_signature.signature}
                          alt="CP Signature"
                          className="h-10 object-contain bg-white rounded border border-gray-200 p-1 mb-1 group-hover:border-orange-300 transition-all shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="h-3 w-3 text-orange-500" />
                        </div>
                      </div>
                      <p className="text-[9px] text-gray-600 font-medium">
                        {cp_signature.user_name}
                      </p>
                      <p className="text-[8px] text-gray-400">
                        {formatDate(cp_signature.signed_at)}
                      </p>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-[10px] h-8 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold"
                        onClick={() => onSignCPClick(walkaround.id)}
                      >
                        <Signature className="h-3 w-3 mr-1" />
                        SIGN CP
                      </Button>
                    </div>
                  )}
                  {walkaround.signature && !cp_signature && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-tighter">TM Sign Off</p>
                      <img
                        src={walkaround.signature}
                        alt="Transport Manager Signature"
                        className="h-10 object-contain bg-white rounded border border-gray-200 p-1 mb-1 opacity-50 grayscale"
                      />
                      <p className="text-[9px] text-gray-400 font-medium">
                        {walkaround.walkaround_assignee?.full_name || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onActivityLogsClick(activity_log || [])}
              className="border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 font-bold h-8 flex items-center text-xs"
            >
              <Clock className="w-3 h-3 mr-1 text-orange-500" />
              ACTIVITY LOGS
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Info helper component
const Info = ({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <div className="text-sm text-gray-900 flex items-center gap-2 flex-wrap">
      {value}
      {badge}
    </div>
  </div>
);

// Recursive Followup Answer Item Component
const FollowupAnswerItem = ({ followup, depth = 0 }: { followup: FollowupAnswer; depth?: number }) => {
  return (
    <div className={`mt-2 ml-${Math.min(depth * 2 + 2, 8)} border-l-2 border-orange-100 pl-3 py-1 bg-white/50 rounded-r-md`}>
      <div className="flex items-start gap-2">
        <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 text-[8px] font-bold ${followup.selected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${followup.selected ? 'bg-white' : 'bg-gray-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-gray-700 leading-tight mb-1">
            {followup.followup_question_text}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${followup.selected ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
              {followup.selected ? 'Selected' : 'Not Selected'}
            </span>
            {followup.severity && (
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${followup.severity === 'IMMEDIATE' ? 'bg-red-100 text-red-700' : followup.severity === 'DELAYED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                {followup.severity}
              </span>
            )}
          </div>
          {followup.followup_answers?.length > 0 && (
            <div className="space-y-1">
              {followup.followup_answers.map((subFollowup) => (
                <FollowupAnswerItem key={subFollowup.id} followup={subFollowup} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Answer Item Component
const AnswerItem = ({
  answer,
  index,
  stepNumber,
  onSaveComments,
  isSaving,
  onImageClick
}: {
  answer: Answer;
  index: number;
  stepNumber: number;
  onSaveComments: (answerId: number, comments: string, stepNumber?: number) => Promise<void>;
  isSaving: boolean;
  onImageClick: (url: string) => void;
}) => {
  const [localComments, setLocalComments] = useState<string>(answer.description || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  useEffect(() => {
    setLocalComments(answer.description || '');
    setHasChanges(false);
  }, [answer.description]);

  const handleCommentsChange = (value: string): void => {
    setLocalComments(value);
    setHasChanges(value !== (answer.description || ''));
  };

  const handleSave = async (): Promise<void> => {
    if (answer.id) {
      await onSaveComments(answer.id, localComments, stepNumber);
      setHasChanges(false);
      setShowComments(false);
    }
  };

  return (
    <div className={`border rounded-lg p-3 bg-white ${answer.is_defected ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
      }`}>
      <div className="flex items-start gap-2">
        {/* Numbered circle */}
        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-[10px] font-bold ${answer.is_defected ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Question text */}
          <p className="text-[11px] font-semibold text-gray-800 leading-snug mb-1.5">
            {answer.question_text}
          </p>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${answer.motion_detected
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600'
              }`}>
              {answer.motion_detected ? 'In-motion' : 'Static'}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${answer.answer?.toLowerCase() === 'yes'
              ? 'bg-green-100 text-green-700'
              : answer.answer?.toLowerCase() === 'no'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
              }`}>
              {answer.answer || 'N/A'}
            </span>
            {answer.prove && (
              <button
                onClick={() => onImageClick(answer.prove!)}
                className="text-[10px] text-blue-600 hover:underline no-print"
              >
                📷 View
              </button>
            )}
          </div>

          {/* Defect note */}
          {answer.is_defected && (
            <div className="mt-1.5">
              {!showComments && answer.description && (
                <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                  {answer.description}
                  <button
                    onClick={() => setShowComments(true)}
                    className="ml-2 text-gray-400 hover:text-gray-600 no-print"
                  >
                    Edit
                  </button>
                </div>
              )}
              {showComments && (
                <div className="space-y-1.5 no-print">
                  <Textarea
                    placeholder="Add defect notes..."
                    className="min-h-[50px] text-xs resize-none"
                    value={localComments}
                    onChange={(e) => handleCommentsChange(e.target.value)}
                    disabled={isSaving}
                  />
                  <div className="flex gap-1.5">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 h-6 text-[10px] px-2"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </Button>
                    <Button
                      onClick={() => { setShowComments(false); setLocalComments(answer.description || ''); setHasChanges(false); }}
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {!showComments && !answer.description && (
                <button
                  onClick={() => setShowComments(true)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 no-print"
                >
                  + Add note
                </button>
              )}
            </div>
          )}

          {/* Follow-up Answers */}
          {answer.followup_answers?.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Follow-up Details</p>
              {answer.followup_answers.map((followup) => (
                <FollowupAnswerItem key={followup.id} followup={followup} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectionDashboard;
