'use client'
import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Save, 
  Trash2, 
  Clock, 
  Euro, 
  FileText, 
  Building2, 

  Plus,
  X,
  Calendar,
  Settings,
  Search,

  Loader2
} from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { useToast } from '@/app/Context/ToastContext';

// Type declarations for Contract, Shift, and ShiftTemplate
interface Shift {
  id: number;
  name: string;
  hours_from: string;
  hours_to: string;
  total_hours: string;
  shift_note: string;
  rate_per_hours: number;
  colors: string;
  created_at: string;
  updated_at: string;
  contract: number | null;
}

interface Contract {
  id: number;
  name: string;
  description: string;
  updated_by: number;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
  shifts: Shift[];
}

interface ShiftTemplate {
  id: number;
  name: string;
  hours_from: string;
  hours_to: string;
  total_hours: string;
  shift_note: string;
  rate_per_hours: number;
  colors: string;
  contract: number | null;
  template: boolean;
  created_at: string;
  updated_at: string;
}

// Utility function to format time
const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hoursNum = parseInt(hours, 10);
  const period = hoursNum >= 12 ? 'PM' : 'AM';
  const formattedHours = hoursNum % 12 || 12;
  return `${formattedHours}:${minutes} ${period}`;
};

const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '';
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return `${diff}h`;
};

const ShiftManagement = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<Shift | ShiftTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const cookies = useCookies();
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch contracts
      const contractResponse = await fetch(`${API_URL}/api/staff/contracts/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get("access_token")}`
        }
      });
      if (!contractResponse.ok) throw new Error('Failed to fetch contracts');
      const contractData: Contract[] = await contractResponse.json();

      // Fetch shift templates
      const shiftResponse = await fetch(`${API_URL}/api/staff/shifts/?template_only=true`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cookies.get("access_token")}`
        }
      });
      if (!shiftResponse.ok) throw new Error('Failed to fetch shift templates');
      const shiftData: ShiftTemplate[] = await shiftResponse.json();

      setContracts(contractData);
      setShiftTemplates(shiftData);
      setError(null);
    } catch (err) {
      console.log(err)
      setError('Error fetching data. Please try again.');
      showToast('Error fetching data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch contracts and shift templates on mount
  useEffect(() => {
    fetchData();
  }, [cookies]);

  const handleEdit = (item: Shift | ShiftTemplate): void => {
    setIsEditing(item.id);
    setEditedTemplate({ ...item });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setEditedTemplate(null);
  };

  const handleSaveShift = async (shift: Shift): Promise<void> => {
    if (!editedTemplate) return;

    // Validate required fields
    if (!editedTemplate.name || !editedTemplate.hours_from || !editedTemplate.hours_to) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Ensure contract ID is present for shifts
    if (!(editedTemplate as Shift).contract) {
      showToast('Contract ID is required for shifts.', 'error');
      return;
    }

    setSaving(true);
    try {
      const endpoint = `/api/staff/shifts/${shift.id}/add-to-contract/${(editedTemplate as Shift).contract}/`;
      const payload = {
        name: editedTemplate.name,
        hours_from: editedTemplate.hours_from,
        hours_to: editedTemplate.hours_to,
        shift_note: editedTemplate.shift_note || '',
        rate_per_hours: editedTemplate.rate_per_hours || 0,
        colors: editedTemplate.colors,
        contract: (editedTemplate as Shift).contract,
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shift');
      }

      await fetchData();
      showToast('Shift updated successfully.', 'success');
      setIsEditing(null);
      setEditedTemplate(null);
    } catch (err: any) {
      console.error('Error saving shift:', err);
      showToast(err.message || 'Failed to update shift.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (template: ShiftTemplate): Promise<void> => {
    if (!editedTemplate) return;

    // Validate required fields
    if (!editedTemplate.name || !editedTemplate.hours_from || !editedTemplate.hours_to) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      const endpoint = `/api/staff/shifts/${template.id}/`;
      const payload = {
        name: editedTemplate.name,
        hours_from: editedTemplate.hours_from,
        hours_to: editedTemplate.hours_to,
        shift_note: editedTemplate.shift_note || '',
        rate_per_hours: editedTemplate.rate_per_hours || 0,
        colors: editedTemplate.colors,
        template: true,
        contract: (editedTemplate as ShiftTemplate).contract || null,
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update shift template');
      }

      await fetchData();
      showToast('Shift template updated successfully.', 'success');
      setIsEditing(null);
      setEditedTemplate(null);
    } catch (err: any) {
      console.error('Error saving template:', err);
      showToast(err.message || 'Failed to update shift template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, isShift: boolean): Promise<void> => {
    if (!confirm(`Are you sure you want to delete this ${isShift ? 'shift' : 'template'}?`)) return;
    
    setSaving(true);
    try {
      const endpoint = `/api/staff/shifts/${id}/`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${cookies.get('access_token')}`,
        },
      });

      if (!response.ok) throw new Error(`Failed to delete ${isShift ? 'shift' : 'shift template'}`);
      await fetchData();
      showToast(`${isShift ? 'Shift' : 'Shift template'} deleted successfully.`, 'success');
    } catch (err) {
      console.error('Error deleting:', err);
      showToast(`Failed to delete ${isShift ? 'shift' : 'shift template'}.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const ShiftCard = ({ shift, isTemplate = false }: { shift: Shift | ShiftTemplate, isTemplate?: boolean, contractId?: number | null }) => {
    const isEditingThis = isEditing === shift.id;
    
    return (
      <div className={`
        group relative bg-white rounded-xl shadow-sm border transition-all duration-200
        ${isTemplate ? 'border-amber-200 hover:shadow-amber-100' : 'border-gray-200 hover:shadow-md'}
        ${isEditingThis ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:border-gray-300'}
      `}>
        <div 
          className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
          style={{ backgroundColor: shift.colors }}
        />
        
        <div className="p-5 pl-6">
          {isEditingThis && editedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isTemplate ? 'Edit Template' : 'Edit Shift'}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <Input
                  placeholder="Shift name"
                  value={editedTemplate.name}
                  onChange={(e) =>
                    setEditedTemplate({ ...editedTemplate, name: e.target.value })
                  }
                  disabled={saving}
                  className="font-medium"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Start Time</label>
                    <Input
                      type="time"
                      value={editedTemplate.hours_from}
                      onChange={(e) =>
                        setEditedTemplate({ ...editedTemplate, hours_from: e.target.value })
                      }
                      disabled={saving}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">End Time</label>
                    <Input
                      type="time"
                      value={editedTemplate.hours_to}
                      onChange={(e) =>
                        setEditedTemplate({ ...editedTemplate, hours_to: e.target.value })
                      }
                      disabled={saving}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Rate per Hour</label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={editedTemplate.rate_per_hours || ''}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          rate_per_hours: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={saving}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Notes</label>
                  <Input
                    value={editedTemplate.shift_note || ''}
                    onChange={(e) =>
                      setEditedTemplate({ ...editedTemplate, shift_note: e.target.value })
                    }
                    disabled={saving}
                    placeholder="Add shift notes..."
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-500">Color</label>
                  <input
                    type="color"
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                    value={editedTemplate.colors || '#3B82F6'}
                    onChange={(e) =>
                      setEditedTemplate({ ...editedTemplate, colors: e.target.value })
                    }
                    disabled={saving}
                  />
                </div>
                
                {isTemplate && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Assign to Contract</label>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      value={editedTemplate.contract || ''}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          contract: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      disabled={saving}
                    >
                      <option value="">No Contract</option>
                      {contracts.map((contract: Contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => isTemplate ?  handleSaveShift(shift as Shift):handleSaveTemplate(shift as ShiftTemplate)}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={() => handleDelete(shift.id, !isTemplate)}
                  variant="destructive"
                  disabled={saving}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{shift.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(shift.hours_from)} - {formatTime(shift.hours_to)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {calculateDuration(shift.hours_from, shift.hours_to)}
                    </Badge>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  €{shift.rate_per_hours?.toFixed(2) || '0.00'}
                </Badge>
              </div>
              
              {shift.shift_note && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                  <span>{shift.shift_note}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: shift.colors }}
                  />
                  <span className="text-xs text-gray-500">
                    Updated {new Date(shift.updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(shift)}
                    disabled={saving}
                    className="h-8 text-gray-600 hover:text-gray-900"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading shift management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error Loading Data</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
              <p className="text-gray-600 mt-1">Manage contracts, shifts, and templates</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contracts and shifts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Contracts</option>
              {contracts.map((contract: Contract) => (
                <option key={contract.id} value={contract.id.toString()}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
              <Badge variant="secondary">{contracts.length}</Badge>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {contracts.map((contract: Contract) => (
                <AccordionItem
                  key={contract.id}
                  value={`contract-${contract.id}`}
                  className="border border-gray-200 rounded-xl bg-white shadow-sm"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline group">
                    <div className="flex items-center justify-between w-full text-left">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {contract.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{contract.description}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                          {contract.shifts.length} shifts
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="grid gap-4">
                      {contract.shifts.map((shift: Shift) => (
                        <ShiftCard 
                          key={shift.id} 
                          shift={shift} 
                          contractId={contract.id}
                        />
                      ))}
                      {contract.shifts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No shifts assigned to this contract</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {contracts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No contracts found</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shift Templates</h2>
              <Badge variant="secondary">{shiftTemplates.length}</Badge>
            </div>
            
            <div className="grid gap-4">
              {shiftTemplates.map((template: ShiftTemplate) => (
                <ShiftCard 
                  key={template.id} 
                  shift={template} 
                  isTemplate={true}
                />
              ))}
              {shiftTemplates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No templates found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;