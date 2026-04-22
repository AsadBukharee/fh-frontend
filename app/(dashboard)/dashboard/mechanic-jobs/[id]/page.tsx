'use client';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, ArrowLeft, Save, X, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from '@/app/Context/ToastContext';
import Link from 'next/link';

interface Part {
  id: number;
  name: string;
  brand: string;
  sku: string;
  unit: string;
  cost_price: string;
  sale_price: string;
}

interface JobData {
  id: number;
  vehicle_reg: string;
  mechanic_name: string;
  assignee_name: string;
  mechanicdefects: string | { defect_text: string }[]; // Accepts string or array of objects
  parts_used: Part[];
  notes: string;
  source: string;
  status: string;
  timestamp: string;
  vehicle?: number;
  mechanic?: number;
  assignee?: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: JobData;
}

interface User {
  id: number;
  full_name: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
}

interface MechanicJobPayload {
  vehicle: number;
  mechanic: number;
  assignee: number;
  notes: string;
  source: string;
  status: string;
}

interface MechanicDefectPayload {
  mechanic_job: number;
  priority: string;
  defect_text: string;
  color: string;
}

const MechanicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDefectDialogOpen, setIsDefectDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<MechanicJobPayload>({
    vehicle: 0,
    mechanic: 0,
    assignee: 0,
    notes: "",
    source: "",
    status: "",
  });

  // Defects state for multiple defects
  const [defects, setDefects] = useState<MechanicDefectPayload[]>([
    {
      mechanic_job: parseInt(id),
      priority: "medium",
      defect_text: "",
      color: "#00FF00",
    },
  ]);

  // Reference data
  const [managers, setManagers] = useState<User[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingRefData, setLoadingRefData] = useState(false);

  const cookies = useCookies();
  const role = cookies.get('role');
  const { showToast } = useToast();

  // Fetch reference data (managers, mechanics, vehicles)
  const fetchReferenceData = async () => {
    setLoadingRefData(true);
    try {
      const token = cookies.get('access_token');
      
      // Fetch managers
      const managersRes = await fetch(`${API_URL}/users/list-names/?role=manager`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (managersRes.ok) {
        const managersData = await managersRes.json();
        if (managersData.success) setManagers(managersData.data);
      }

      // Fetch mechanics
      const mechanicsRes = await fetch(`${API_URL}/users/list-names/?role=mechanic`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (mechanicsRes.ok) {
        const mechanicsData = await mechanicsRes.json();
        if (mechanicsData.success) setMechanics(mechanicsData.data);
      }

      // Fetch vehicles
      const vehiclesRes = await fetch(`${API_URL}/api/vehicles/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        if (vehiclesData.success) setVehicles(vehiclesData.data);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    } finally {
      setLoadingRefData(false);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/activity/mechanic-job/${id}/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cookies.get('access_token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed');
        const result: ApiResponse = await res.json();
        if (result.success) {
          setJobData(result.data);
          // Initialize form with job data
          setFormData({
            vehicle: result.data.vehicle || 0,
            mechanic: result.data.mechanic || 0,
            assignee: result.data.assignee || 0,
            notes: result.data.notes || "",
            source: result.data.source || "",
            status: result.data.status || "",
          });
          
          // Initialize defects
          const existingDefects = Array.isArray(result.data.mechanicdefects) 
            ? result.data.mechanicdefects 
            : result.data.mechanicdefects ? [result.data.mechanicdefects] : [];
          
          if (existingDefects.length > 0) {
            setDefects(existingDefects.map((defect, index) => ({
              mechanic_job: parseInt(id),
              priority: "medium", // You might want to store priority per defect
              defect_text: typeof defect === "string" ? defect : (typeof defect === "object" && "defect_text" in defect ? defect.defect_text : ""),
              color: "#00FF00",
            })));
          }
        } else setError(result.message || 'Failed to load');
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
      fetchReferenceData();
    }
  }, [id]);

  // Handle job update
  const handleUpdateJob = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/activity/mechanic-job/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(`Job ID ${id} updated successfully`, "success");
        setIsEditing(false);
        // Refresh job data
        const refreshedRes = await fetch(`${API_URL}/activity/mechanic-job/${id}/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cookies.get('access_token')}`,
          },
        });
        if (refreshedRes.ok) {
          const refreshedData = await refreshedRes.json();
          if (refreshedData.success) setJobData(refreshedData.data);
        }
      } else {
        showToast(data.message || "Failed to update job", "error");
      }
    } catch {
      showToast("An error occurred while updating the job", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle defects update
  const handleUpdateDefects = async () => {
    setIsSaving(true);
    try {
      for (const defect of defects) {
        if (!defect.defect_text) continue; // Skip empty defects

        // Note: This endpoint might need adjustment based on your API
        const response = await fetch(`${API_URL}/activity/user_activity/mechanic-defect/${id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            ...defect,
            mechanic_job: parseInt(id),
          }),
        });

        if (response.status === 401) {
          showToast("Session expired. Please log in again.", "error");
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          showToast(data.message || "Failed to update defect", "error");
          return;
        }
      }

      showToast("All defects updated successfully", "success");
      setIsDefectDialogOpen(false);
      
      // Refresh job data
      const refreshedRes = await fetch(`${API_URL}/activity/mechanic-job/${id}/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
      });
      if (refreshedRes.ok) {
        const refreshedData = await refreshedRes.json();
        if (refreshedData.success) setJobData(refreshedData.data);
      }
    } catch {
      showToast("An error occurred while updating defects", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new defect input
  const addDefect = () => {
    setDefects([
      ...defects,
      {
        mechanic_job: parseInt(id),
        priority: "medium",
        defect_text: "",
        color: "#00FF00",
      },
    ]);
  };

  // Remove defect input
  const removeDefect = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  // Update defect field
  const updateDefectField = (index: number, field: keyof MechanicDefectPayload, value: string) => {
    const newDefects = [...defects];
    newDefects[index] = { ...newDefects[index], [field]: value };
    setDefects(newDefects);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof MechanicJobPayload, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (jobData) {
      setFormData({
        vehicle: jobData.vehicle || 0,
        mechanic: jobData.mechanic || 0,
        assignee: jobData.assignee || 0,
        notes: jobData.notes || "",
        source: jobData.source || "",
        status: jobData.status || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!jobData) return <div className="p-8 text-center">No job found</div>;

  const displayDefects = Array.isArray(jobData.mechanicdefects)
    ? jobData.mechanicdefects
    : jobData.mechanicdefects ? [jobData.mechanicdefects] : [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_house":
        return "bg-orange-100 text-orange-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "work_in_progress":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-[#f5f6f8] min-h-screen p-8">
      {/* Header with back button and edit actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mechanic-jobs">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="px-2 py-1 rounded">
                Mechanic Job
              </span>{" "}
              Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              See and manage mechanic details with all data
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsDefectDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Update Defects
          </Button>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit Job
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUpdateJob}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button
                onClick={handleCancelEdit}
                disabled={isSaving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 relative">
        {/* ID Badge (Top Right) */}
        <div className="absolute top-6 right-6">
          <span className="bg-orange-100 text-orange-600 text-xs font-medium px-3 py-1 rounded-full">
            ID : {jobData.id}
          </span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-4 gap-y-10">
          {/* Row 1 */}
          <div className="pr-6 border-r border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Vehicle Reg#</p>
            {isEditing ? (
              <Select
                value={formData.vehicle.toString()}
                onValueChange={(value) => handleInputChange("vehicle", parseInt(value))}
                disabled={loadingRefData}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full">
                {jobData.vehicle_reg}
              </span>
            )}
          </div>

          <div className="px-6 border-r border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Mechanic Name</p>
            {isEditing ? (
              <Select
                value={formData.mechanic.toString()}
                onValueChange={(value) => handleInputChange("mechanic", parseInt(value))}
                disabled={loadingRefData}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mechanic" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id.toString()}>
                      {mechanic.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-800">{jobData.mechanic_name}</p>
            )}
          </div>

          <div className="px-6 border-r border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Assignee Name</p>
            {isEditing ? (
              <Select
                value={formData.assignee.toString()}
                onValueChange={(value) => handleInputChange("assignee", parseInt(value))}
                disabled={loadingRefData}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-800">{jobData.assignee_name}</p>
            )}
          </div>

          <div className="pl-6">
            <p className="text-sm text-gray-500 mb-1">Defects</p>
            <div className="flex flex-wrap gap-1">
              {displayDefects.length > 0 ? (
                displayDefects.map((defect, index) => (
                  <span key={index} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                    {typeof defect === 'string'
                      ? defect
                      : typeof defect === 'object' && 'defect_text' in defect
                        ? defect.defect_text
                        : ''}
                  </span>
                ))
              ) : (
                <p className="text-gray-800">—</p>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="pr-6 border-r border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            {isEditing ? (
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter notes"
                rows={3}
                className="text-sm"
              />
            ) : (
              <p className="text-gray-800">
                {jobData.notes || "No notes provided"}
              </p>
            )}
          </div>

          <div className="px-6 border-r border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Source</p>
            {isEditing ? (
              <Input
                value={formData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
                placeholder="Enter source"
                className="text-sm"
              />
            ) : (
              <p className="text-gray-800">{jobData.source}</p>
            )}
          </div>

          <div className="px-6 border-r border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            {isEditing ? (
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_house">In House</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="work_in_progress">Work in Progress</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={`${getStatusColor(jobData.status)} text-xs px-3 py-1 rounded-full`}>
                {jobData.status}
              </span>
            )}
          </div>

          <div className="pl-6">
            <p className="text-sm text-gray-500 mb-1">Timestamp</p>
            <p className="text-gray-800 text-sm">
              {new Date(jobData.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Parts Used Section */}
        {jobData.parts_used && jobData.parts_used.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Parts Used</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobData.parts_used.map((part) => (
                <div key={part.id} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{part.name}</p>
                  <p className="text-sm text-gray-600">Brand: {part.brand}</p>
                  <p className="text-sm text-gray-600">SKU: {part.sku}</p>
                  <p className="text-sm text-gray-600">Unit: {part.unit}</p>
                  {role === 'superadmin' && (
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Cost: ${part.cost_price}</span>
                      <span>Sale: ${part.sale_price}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Update Defects Dialog */}
      <AlertDialog open={isDefectDialogOpen} onOpenChange={setIsDefectDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-500" />
              Update Mechanic Defects
            </AlertDialogTitle>
            <AlertDialogDescription>
              Update the defect details for job ID <strong>{jobData.id}</strong> for vehicle <strong>{jobData.vehicle_reg}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto py-2">
            {defects.map((defect, index) => (
              <div key={index} className="border p-4 rounded-md space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Defect {index + 1}</h4>
                  {defects.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDefect(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <Select
                    value={defect.priority}
                    onValueChange={(value) => updateDefectField(index, "priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Defect Description</label>
                  <Textarea
                    value={defect.defect_text}
                    onChange={(e) => updateDefectField(index, "defect_text", e.target.value)}
                    placeholder="Enter defect description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <Input
                    type="color"
                    value={defect.color}
                    onChange={(e) => updateDefectField(index, "color", e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addDefect}
              className="flex items-center gap-2 w-full"
            >
              <Plus className="w-4 h-4" />
              Add Another Defect
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUpdateDefects} 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Defects
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MechanicDetail;