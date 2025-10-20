"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  label: string;
  value?: string;
  onDateSelected: (date: Date) => void;
  validator?: (value: string) => string | undefined;
  startDate?: number;
  lastDate?: number;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onDateSelected,
  validator,
  startDate,
  lastDate = 0,
}) => {
  const [selected, setSelected] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [error, setError] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(selected || new Date());

  const now = new Date();
  const firstDate = startDate ? new Date(now.getTime() + startDate * 86400000) : new Date(1910, 0, 1);
  const lastAllowed = new Date(now.getTime() + lastDate * 86400000);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelected(date);
    const formatted = format(date, "dd/MM/yyyy");
    onDateSelected(date);
    if (validator) setError(validator(formatted));
    setOpen(false);
  };

  // Generate year options dynamically
  const years = [];
  for (let y = 1910; y <= now.getFullYear(); y++) years.push(y);

  return (
    <div className="flex flex-col gap-1 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? format(selected, "dd/MM/yyyy") : "Select date"}
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          {/* Custom header for month + year selection */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={month.getMonth()}
                onChange={(e) =>
                  setMonth(new Date(month.getFullYear(), +e.target.value))
                }
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2000, i, 1), "MMMM")}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-2 py-1 text-sm"
                value={month.getFullYear()}
                onChange={(e) =>
                  setMonth(new Date(+e.target.value, month.getMonth()))
                }
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Main calendar */}
          <Calendar
            month={month}
            onMonthChange={setMonth}
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={(date) => date < firstDate || date > lastAllowed}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
