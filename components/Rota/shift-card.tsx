"use client";

import { cn } from "@/lib/utils";
import { PencilLine, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Shift {
  id: number;
  name: string;
  template: boolean;
  hours_from: string;
  hours_to: string;
  total_hours: string;
  shift_note: string;
  rate_per_hours: number;
  colors: string;
  contract: number | null;
  created_at: string;
  updated_at: string;
}

interface ShiftCardProps {
  shiftType: string;
  shift_cell_id: number;
  shift_id: number;
  color: string;
  rate: number;
  shift_daily_salary: number;
  total_hours: number;
  shift_list: Shift[];
  onShiftUpdate: () => void;
  staffName?: string;
  date?: string;
  showHourlyRate?: boolean;
}

// ✅ Format hours like "1 Hour", "10.5 Hours"
function formatHours(hours: string | number) {
  const value = parseFloat(hours as string);
  if (isNaN(value)) return "0 Hrs";
  return `${value} ${value === 1 ? "Hr" : "Hrs"}`;
}

// ✅ Format salary globally as "£X.00"
function formatPrice(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function ShiftCard({
  shiftType,
  shift_cell_id,
  shift_id,
  color,
  rate,
  shift_daily_salary,
  total_hours,
  shift_list,
  onShiftUpdate,
  staffName = "Unknown Staff",
  date = "Unknown Date",
  showHourlyRate = false,
}: ShiftCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Editable states
  const [newShift, setNewShift] = useState<number>(shift_id);
  const [newSalary, setNewSalary] = useState<number>(rate);
  const [newHours, setNewHours] = useState<number>(total_hours);
  const [hoursError, setHoursError] = useState<string | null>(null);

  // Inline editing state
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [inlineHours, setInlineHours] = useState<number>(total_hours);

  const cookies = useCookies();
  const role = cookies.get("role");

  // Validate hours input
  const validateHours = (hours: number): boolean => {
    if (hours <= 0) {
      setHoursError("Hours must be greater than 0");
      return false;
    }
    if (hours > 24) {
      setHoursError("Hours cannot exceed 24 hours");
      return false;
    }
    setHoursError(null);
    return true;
  };



  // Inline editing handlers
  const handleDoubleClickHours = () => {
    setIsEditingHours(true);
    setInlineHours(total_hours);
  };

  const handleInlineHoursSave = async () => {
    console.log("🔵 handleInlineHoursSave called", { inlineHours, total_hours });

    if (inlineHours <= 0 || inlineHours > 24) {
      alert("Hours must be between 1 and 24");
      console.log("❌ Validation failed: hours out of range");
      setIsEditingHours(false);
      setInlineHours(total_hours);
      return;
    }

    // Don't make API call if value hasn't changed
    if (inlineHours === total_hours) {
      console.log("⚠️ No changes detected, skipping API call");
      setIsEditingHours(false);
      return;
    }

    console.log("🚀 Making API call to update hours");
    setIsLoading(true);
    try {
      const token = cookies.get("access_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(
        `${API_URL}/api/rota/child-rota/${shift_cell_id}/`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            daily_hours: inlineHours,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update hours");
        throw new Error("Failed to update hours");
      }

      console.log("✅ Hours updated successfully");
      onShiftUpdate();
    } catch (err) {
      console.error("❌ Error updating hours:", err);
      setInlineHours(total_hours); // Revert on error
    } finally {
      setIsLoading(false);
      setIsEditingHours(false);
    }
  };

  const handleHoursBlur = () => {
    handleInlineHoursSave();
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInlineHoursSave();
    } else if (e.key === "Escape") {
      setInlineHours(total_hours);
      setIsEditingHours(false);
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = cookies.get("access_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Update shift type only
      const response = await fetch(
        `${API_URL}/api/rota/child-rota/${shift_cell_id}/`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            shift: newShift,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update shift type");
        throw new Error("Failed to update shift type");
      }

      console.log("✅ Shift type updated successfully");
      onShiftUpdate();
      setOpen(false);
    } catch (err) {
      console.error("❌ Error updating shift type:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  let formattedDate = "Unknown Date";
  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      formattedDate = format(parsedDate, "dd/MM/yyyy");
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col w-[200px] items-start gap-1 rounded-md border-l-4 p-2 text-sm"
      )}
      style={{
        borderLeftColor: color,
        backgroundColor: color + "33",
      }}
    >
      <div className="flex w-full items-center justify-between">
        <span className="cursor-pointer font-semibold">
          {shiftType} {role === "superadmin" ? `(${formatPrice(rate)} P/H)` : null}
        </span>

        {/* Edit Button with Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <PencilLine className="h-4 w-4 cursor-pointer text-gray-600 hover:text-gray-800" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Shift Details</DialogTitle>
            </DialogHeader>

            {/* Read-only information at the top */}
            <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Staff Name:</p>
                  <p className="text-sm font-semibold">{staffName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date:</p>
                  <p className="text-sm font-semibold">{formattedDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Shift Type:</p>
                  <p className="text-sm font-semibold">{shiftType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Hours:</p>
                  <p className="text-sm font-semibold">{total_hours} Hrs</p>
                </div>
              </div>
              {showHourlyRate && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">Hourly Rate:</p>
                  <p className="text-sm font-semibold">{formatPrice(rate)}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {/* Shift Selection */}
              <div>
                <label className="text-sm font-medium">Change Shift Type</label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(Number(e.target.value))}
                  className="w-full border rounded-md p-2"
                  disabled={isLoading}
                >
                  {shift_list.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} - {shift.hours_from?.slice(0, 5)} to {shift.hours_to?.slice(0, 5)} ({shift.total_hours} Hrs)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <DialogFooter>
              <Button
                onClick={handleSaveAll}
                disabled={isLoading}
                style={{
                  background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                  width: "auto",
                  height: "auto",
                }}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display Info */}
      <div className="flex justify-between w-full text-xs text-gray-600">
        {role === "superadmin" ? (
          <span className="cursor-pointer">Daily Pay: ({formatPrice(shift_daily_salary)})</span>
        ) : null}
        {isEditingHours ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={inlineHours}
              onChange={(e) => setInlineHours(parseFloat(e.target.value) || 0)}
              onKeyDown={handleHoursKeyDown}
              className="w-14 h-6 text-xs p-1 border rounded"
              autoFocus
              disabled={isLoading}
            />
            <Check
              className={`h-4 w-4 cursor-pointer ${isLoading ? 'text-gray-400 animate-pulse' : 'text-green-600 hover:text-green-800'}`}
              onClick={isLoading ? undefined : handleInlineHoursSave}
              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            />
          </div>
        ) : (
          <span
            onDoubleClick={handleDoubleClickHours}
            className="cursor-pointer hover:bg-gray-100 px-1 rounded transition-colors"
            title="Double-click to edit hours"
          >
            {total_hours} Hr
          </span>
        )}
      </div>
    </div>
  );
}