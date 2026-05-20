"use client";

import { cn } from "@/lib/utils";
import { PencilLine, Check } from "lucide-react";
import { useState } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
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
  onEditClick?: (data: any) => void;
}

function formatHours(hours: string | number) {
  const value = parseFloat(hours as string);
  if (isNaN(value)) return "0 Hrs";
  return `${value} ${value === 1 ? "Hr" : "Hrs"}`;
}

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
  onEditClick,
}: ShiftCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline editing state
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [inlineHours, setInlineHours] = useState<number>(total_hours);

  const cookies = useCookies();
  const role = cookies.get("role");

  // Inline editing handlers
  const handleDoubleClickHours = () => {
    setIsEditingHours(true);
    setInlineHours(total_hours);
  };

  const handleInlineHoursSave = async () => {
    if (inlineHours <= 0 || inlineHours > 24) {
      alert("Hours must be between 1 and 24");
      setIsEditingHours(false);
      setInlineHours(total_hours);
      return;
    }

    if (inlineHours === total_hours) {
      setIsEditingHours(false);
      return;
    }

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

      onShiftUpdate();
    } catch (err) {
      console.error("❌ Error updating hours:", err);
      setInlineHours(total_hours);
    } finally {
      setIsLoading(false);
      setIsEditingHours(false);
    }
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInlineHoursSave();
    } else if (e.key === "Escape") {
      setInlineHours(total_hours);
      setIsEditingHours(false);
    }
  };

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

        <PencilLine 
          className="h-4 w-4 cursor-pointer text-gray-600 hover:text-gray-800" 
          onClick={() => {
            if (onEditClick) {
              onEditClick({
                shift_cell_id,
                shift_id,
                shiftType,
                rate,
                total_hours,
                shift_list,
                staffName,
                date,
                showHourlyRate
              });
            }
          }}
        />
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
      {error && <p className="text-red-500 text-[10px] mt-1 w-full text-center">{error}</p>}
    </div>
  );
}