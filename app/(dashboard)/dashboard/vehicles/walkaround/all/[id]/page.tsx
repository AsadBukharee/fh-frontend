'use client'

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, AlertTriangle, ChevronDown, ChevronUp, Save, Loader2, User } from 'lucide-react';
import API_URL from '@/app/utils/ENV';

import WalkAroundPDFPrint from '@/components/walkaround/WalkaroundPage';

// Add Manager interface
interface Manager {
  id: number;
  full_name: string;
  avatar: string | null;
  email: string;
  sites: Array<{
    id: number;
    name: string;
  }>;
}

interface Answer {
  id: number;
  question_text: string;
  question_id: number;
  answer: string;
  is_defected: boolean;
  description: string | null;
  date: string;
  prove: string | null;
  motion_detected: boolean;
  user_id: number;
  user_name: string;
  vehicle_id: number | null;
  vehicle_registration: string | null;
}

interface WalkaroundData {
  success: boolean;
  message: string;
  data: {
    walkaround: {
      id: number;
      vehicle: {
        id: number;
        registration_number: string;
        vehicles_type_name: string;
        last_mileage: string | null;
        current_mileage: string;
        mileage_unit: string;
        mileage_in_km: number;
        mileage_in_miles: number;
        site_allocated: Array<{
          id: number;
          name: string;
          status: string;
          image?: string;
        }>;
      };
      conducted_by: {
        id: number;
        email: string;
        full_name: string;
        role: string;
        avatar: string | null;
      };
      walkaround_assignee: any | null;
      walkaround_step: number;
      date: string;
      time: string;
      mileage: number | null;
      signature: string | null;
      note: string | null;
      defects: string | null;
      walkaround_duration: number | null;
      status: string;
      created_at: string;
      updated_at: string;
      parent: number | null;
    };
    answers: Answer[];
    total_answers: number;
    defected_count: number;
    non_defected_count: number;
  };
}

const VehicleInspectionDashboard = () => {
  const [walkaroundData, setWalkaroundData] = useState<WalkaroundData | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingManagers, setIsLoadingManagers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ dailyChecks: true });
  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isUpdatingManager, setIsUpdatingManager] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');

  useEffect(() => {
    fetchWalkaroundData();
    fetchManagers();
  }, []);

  // Update selectedStatus and selectedManager when walkaroundData is loaded
  useEffect(() => {
    if (walkaroundData) {
      setSelectedStatus(walkaroundData.data.walkaround.status);
      setSelectedManager(walkaroundData.data.walkaround.walkaround_assignee?.id?.toString() || '');
    }
  }, [walkaroundData]);

  const fetchWalkaroundData = async () => {
    try {
      setIsLoading(true);
      
      // Get access token from cookie
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!accessToken) {
        setError("Please log in to view inspection data");
        setIsLoading(false);
        return;
      }

      // Get walkaround ID from URL
      const walkaroundId = window.location.pathname.split('/').pop();
      
      const response = await fetch(`${API_URL}/api/walk-around/${walkaroundId}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch walkaround data');
      }

      const data = await response.json();
      
      if (data.success) {
        setWalkaroundData(data);
      } else {
        setError(data.message || 'Unknown error');
      }
    } catch (err) {
      setError('Failed to load inspection data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      setIsLoadingManagers(true);
      
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      const response = await fetch(`${API_URL}/users/list-names/?role=manager`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }

      const data = await response.json();
      
      if (data.success) {
        setManagers(data.data || []);
      } else {
        console.error('Failed to fetch managers:', data.message);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const handleSaveComments = async (answerId: number, comments: string): Promise<void> => {
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

      // Update local state
      if (walkaroundData) {
        const updatedAnswers = walkaroundData.data.answers.map(answer =>
          answer.id === answerId ? { ...answer, description: comments } : answer
        );
        setWalkaroundData({
          ...walkaroundData,
          data: { ...walkaroundData.data, answers: updatedAnswers }
        });
      }

      alert('Comments saved successfully');
    } catch (error) {
      alert('Error saving comments. Please try again.');
      console.error('Error saving comments:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [answerId]: false }));
    }
  };

  const handleUpdateStatus = async (newStatus: string): Promise<void> => {
    if (!walkaroundData) return;

    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!accessToken) {
      alert("Authentication required");
      return;
    }

    setIsUpdatingStatus(true);
    
    try {
      const walkaroundId = walkaroundData.data.walkaround.id;
      
      const response = await fetch(`${API_URL}/api/walk-around/${walkaroundId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedData = await response.json();
      
      if (updatedData.success) {
        fetchWalkaroundData();
        alert(`Status updated to ${getStatusDisplayName(newStatus)} successfully`);
      } else {
        throw new Error(updatedData.message || 'Failed to update status');
      }
    } catch (error) {
      alert('Error updating status. Please try again.');
      console.error('Error updating status:', error);
      // Revert selectedStatus to current walkaround status if update fails
      setSelectedStatus(walkaroundData.data.walkaround.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateManager = async (managerId: string): Promise<void> => {
    if (!walkaroundData) return;

    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!accessToken) {
      alert("Authentication required");
      return;
    }

    setIsUpdatingManager(true);
    
    try {
      const walkaroundId = walkaroundData.data.walkaround.id;
      
      const response = await fetch(`${API_URL}/api/walk-around/${walkaroundId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walkaround_assignee: managerId ? parseInt(managerId) : null 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update manager');
      }

      const updatedData = await response.json();
      
      if (updatedData.success) {
        fetchWalkaroundData();
        const managerName = managers.find(m => m.id.toString() === managerId)?.full_name || 'None';
        alert(`Manager updated to ${managerName} successfully`);
      } else {
        throw new Error(updatedData.message || 'Failed to update manager');
      }
    } catch (error) {
      alert('Error updating manager. Please try again.');
      console.error('Error updating manager:', error);
      // Revert selectedManager to current manager if update fails
      setSelectedManager(walkaroundData.data.walkaround.walkaround_assignee?.id?.toString() || '');
    } finally {
      setIsUpdatingManager(false);
    }
  };

  const handleStatusChange = (value: string): void => {
    setSelectedStatus(value);
    handleUpdateStatus(value);
  };

  const handleManagerChange = (value: string): void => {
    setSelectedManager(value);
    handleUpdateManager(value);
  };

  const toggleSection = (section: string): void => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  const getStatusDisplayName = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      custom: 'Custom',
    };
    return statusMap[status] || status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "default", className: "bg-orange-500 hover:bg-orange-600 text-white" },
      completed: { variant: "default", className: "bg-green-500 hover:bg-green-600 text-white" },
      failed: { variant: "destructive", className: "bg-red-500 hover:bg-red-600 text-white" },
      custom: { variant: "outline", className: "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-300" }
    };

    const config = statusConfig[status.toLowerCase()] || { variant: "default", className: "bg-gray-500 hover:bg-gray-600 text-white" };

    return (
      <Badge variant={config.variant} className={config.className}>
        {getStatusDisplayName(status)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading inspection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={fetchWalkaroundData}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!walkaroundData) {
    return null;
  }

  const { walkaround, answers } = walkaroundData.data;

  return (
    <div className="min-h-screen bg-white p-6">
      <WalkAroundPDFPrint data={walkaroundData as any}/>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Walkaround Details <span className='text-orange-600'>{walkaround.id}</span>
            </h1>
            <p className="text-sm text-gray-500">
              Channel #{walkaround.id} / Latest Step 1 of 1
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              {formatDate(walkaround.created_at)} at {formatTime(walkaround.time)}
            </p>
          </div>
        </div>

        {/* Vehicle Details Card */}
        <Card className="border-none bg-gray-50 shadow-sm">
          <CardHeader className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className=" bg-orange-100 w-10 h-10 rounded-xl flex justify-center items-center">
                <Car className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-base font-semibold text-orange-500">
                  Vehicle Details
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(walkaround.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Registration No.</p>
                <p className="font-semibold text-gray-900">
                  {walkaround.vehicle.registration_number}
                </p>
              </div>
              <div className="border-l pl-6">
                <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
                <p className="font-semibold text-gray-900">
                  {walkaround.vehicle.vehicles_type_name}
                </p>
              </div>
              <div className="border-l pl-6">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  Sites <Badge className="bg-green-500 text-white text-[10px] px-1.5">Active</Badge>
                </p>
                <p className="font-semibold text-gray-900">
                  {walkaround.vehicle.site_allocated?.[0]?.name || 'N/A'}
                </p>
              </div>
              <div className="border-l pl-6">
                <p className="text-xs text-gray-500 mb-1">Current Mileage</p>
                <p className="font-semibold text-gray-900">
                  {walkaround.vehicle.mileage_in_miles.toFixed(2)} miles / {walkaround.vehicle.mileage_in_km.toFixed(2)} km
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  Driver Name <Badge className="bg-green-500 text-white text-[10px] px-1.5">Passed</Badge>
                </p>
                <p className="font-semibold text-gray-900">
                  {walkaround.conducted_by.full_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(walkaround.date)} at {formatTime(walkaround.time)}
                </p>
              </div>
              <div className="border-l pl-6">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  Manager Name 
                </p>
                <p className="font-semibold text-gray-900">{walkaround.walkaround_assignee?.full_name || "Not assigned"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(walkaround.date)} at {formatTime(walkaround.time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Update Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Walkaround Status</h3>
                <p className="text-sm text-gray-600">Select a new status for this walkaround inspection</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status...">
                        {isUpdatingStatus ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          getStatusDisplayName(selectedStatus)
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isUpdatingStatus && (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current Status:</strong> {getStatusDisplayName(walkaround.status)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Status will update automatically when you select a new value from the dropdown.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manager Update Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assign Manager</h3>
                <p className="text-sm text-gray-600">Select a manager for this walkaround inspection</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Select
                    value={selectedManager}
                    onValueChange={handleManagerChange}
                    disabled={isUpdatingManager || isLoadingManagers}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select manager...">
                        {isUpdatingManager ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating...</span>
                          </div>
                        ) : isLoadingManagers ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading managers...</span>
                          </div>
                        ) : (
                          selectedManager ? 
                            managers.find(m => m.id.toString() === selectedManager)?.full_name || 'Select manager' 
                            : 'No manager assigned'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">No manager</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{manager.full_name}</span>
                            {manager.sites.length > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {manager.sites[0].name}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(isUpdatingManager || isLoadingManagers) && (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Current Manager:</strong> {walkaround.walkaround_assignee?.full_name || 'Not assigned'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Manager will update automatically when you select a new value from the dropdown.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daily Checks Card */}
        <Card className="border-none shadow-sm">
          <CardHeader 
            className="cursor-pointer bg-gray-50 my-2 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('dailyChecks')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                Daily checks
              </CardTitle>
              {expandedSections.dailyChecks ? 
                <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                <ChevronDown className="h-5 w-5 text-gray-400" />
              }
            </div>
          </CardHeader>
          {expandedSections.dailyChecks && (
            <CardContent className="pt-0 bg-gray-50 border-2 border-gray-200 py-2">
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-2 gap-4 pr-4">
                  {answers.map((answer, index) => (
                    <InspectionItem
                      key={answer.id}
                      answer={answer}
                      index={index}
                      onSaveComments={handleSaveComments}
                      isSaving={savingStates[answer.id] || false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

// ... Keep the InspectionItem component the same as in your original code ...

const InspectionItem = ({ 
  answer, 
  index, 
  onSaveComments, 
  isSaving 
}: {
  answer: Answer;
  index: number;
  onSaveComments: (answerId: number, comments: string) => Promise<void>;
  isSaving: boolean;
}) => {
  const [localComments, setLocalComments] = useState<string>(answer.description || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setLocalComments(answer.description || '');
    setHasChanges(false);
  }, [answer.description]);

  const handleCommentsChange = (value: string): void => {
    setLocalComments(value);
    setHasChanges(value !== (answer.description || ''));
  };

  const handleSave = async (): Promise<void> => {
    await onSaveComments(answer.id, localComments);
    setHasChanges(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {index + 1}. {answer.question_text}
          </p>
          <div className="flex items-center gap-2">
            <Badge 
              variant={answer.is_defected ? "destructive" : "default"}
              className={answer.is_defected ? 
                "bg-green-100 text-green-700 hover:bg-green-100":
                "bg-red-100 text-red-700 hover:bg-red-100" 
              }
            >
              {answer.is_defected ? "Yes" : "No"}
            </Badge>
            <Badge variant="outline" 
              className={answer.is_defected ? 
                "bg-orange-100 text-orange-700 hover:bg-orange-100" : 
                "bg-gray-100 text-gray-700 hover:bg-gray-100"
              }
            >
               In-motion
            </Badge>
          </div>
        </div>
      </div>
      
      {answer.is_defected && (
        <div className="mt-3 space-y-3">
          <Textarea
            placeholder="Add comments about this defect..."
            className="min-h-[80px] text-sm resize-none"
            value={localComments}
            onChange={(e) => handleCommentsChange(e.target.value)}
            disabled={isSaving}
          />

          {hasChanges && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 h-9 text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save Comment
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleInspectionDashboard;