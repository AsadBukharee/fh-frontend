"use client";

import { cn } from "@/lib/utils";
import { PencilLine } from "lucide-react";
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
}: ShiftCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Editable states
  const [newShift, setNewShift] = useState<number>(shift_id);
  const [newSalary, setNewSalary] = useState<number>(rate);
  const [newHours, setNewHours] = useState<number>(total_hours);

  const cookies = useCookies();

 const handleSaveAll = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const token = cookies.get("access_token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // API calls
    const updateHours = fetch(
      `${API_URL}/api/rota/child-rota/${shift_cell_id}/`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          daily_hours: newHours,
        }),
      }
    );

    const updateSalary = fetch(
      `${API_URL}/api/rota/child-rota/${shift_cell_id}/`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          "shift": newShift,
        }),
      }
    );

    // Run both in parallel
    const [hoursRes, salaryRes] = await Promise.all([updateHours, updateSalary]);

    // Check responses
    if (!hoursRes.ok || !salaryRes.ok) {
      throw new Error("One or more updates failed");
    }

    console.log("✅ Shift & Salary updated successfully");
    onShiftUpdate();
    setOpen(false);
  } catch (err) {
    console.error("❌ Error updating:", err);
    setError("Failed to update. Please try again.");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div
      className={cn(
        "relative flex flex-col w-[200px] items-start gap-1 rounded-md border-l-4 p-2 text-sm"
      )}
      style={{
        borderLeftColor: color, // ✅ border color from API
        backgroundColor: color + "33", // ✅ lighter background (adds transparency)
      }}
    >
      <div className="flex w-full items-center justify-between">
        <span className="cursor-pointer font-semibold">{shiftType} ({formatPrice(rate)} P/H)</span>


        {/* Edit Button with Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <PencilLine className="h-4 w-4 cursor-pointer text-gray-600 hover:text-gray-800" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Shift Details</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {/* Shift Selection */}
              <div>
                <label className="text-sm font-medium">Shift</label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(Number(e.target.value))}
                  className="w-full border rounded-md p-2"
                  disabled={isLoading}
                >
                  {shift_list.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} - {shift.hours_from} to {shift.hours_to} ({shift.total_hours} Hrs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div>
                <label className="text-sm font-medium">Salary (£)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newSalary}
                  onChange={(e) => setNewSalary(parseFloat(e.target.value))}
                  readOnly
                  
                />
              </div>

              {/* Hours */}
              <div>
                <label className="text-sm font-medium">Hours</label>
                <Input
                  type="text"
                  step="0.5"
                  value={newHours||0}
                  onChange={(e) => setNewHours(parseFloat(e.target.value))}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <DialogFooter>
              <Button
                onClick={handleSaveAll}
                disabled={isLoading}
                style={{
                  background:
                    "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                  width: "auto",
                  height: "auto",
                }}
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display Info */}
      <div className="flex justify-between w-full text-xs text-gray-600">
        <span className="cursor-pointer ">Daily Pay:  ({formatPrice(shift_daily_salary)})</span>
        
        <span>{total_hours} Hr</span>
      </div>
    </div>
  );
}
