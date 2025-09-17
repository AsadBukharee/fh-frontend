import React, { useState } from "react";

// Shadcn components (assumes you have shadcn/ui set up in your project)
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WeekYearPickerProps = {
  value?: string; // initial value in wwyy format (e.g. "0125" for week 01 of 2025)
  onChange?: (wwyy: string | null) => void; // emits wwyy or null when cleared
  label?: string;
  placeholder?: string;
  id?: string;
};

/**
 * WeekYearPicker
 * - UI: uses a shadcn Popover with a native <input type="week"> inside
 * - Output format: "wwyy" (2-digit ISO week number + last 2 digits of year, e.g. "3625")
 * - Props:
 *    value: optional initial wwyy string
 *    onChange: callback receiving wwyy or null
 */
export default function WeekYearPicker({ value, onChange, label = "Week & Year", placeholder = "Select week", id = "week-year-picker" }: WeekYearPickerProps) {
  // internal state stores the native input value (YYYY-Www) or empty string
  const [nativeWeek, setNativeWeek] = useState<string>(() => {
    if (!value) return "";
    // convert initial wwyy -> native week (YYYY-Www). We'll assume yy refers to 2-digit year in 2000-2099 range.
    if (!/^[0-9]{4}$/.test(value)) return "";
    const ww = value.slice(0, 2);
    const yy = value.slice(2, 4);
    const year = 2000 + parseInt(yy, 10);
    return `${year}-W${ww}`; // example: "2025-W36"
  });

  // helper: convert native input (YYYY-Www) -> wwyy
  const nativeToWwyy = (native: string) => {
    if (!native) return null;
    // native format is like "2025-W36" (from input[type=week])
    const match = native.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;
    const year = match[1];
    const week = match[2];
    const yy = year.slice(2); // last two digits
    return `${week}${yy}`; // e.g. "3625"
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; // e.g. "2025-W36"
    setNativeWeek(v);
    const out = nativeToWwyy(v);
    onChange?.(out);
  };

  const clear = () => {
    setNativeWeek("");
    onChange?.(null);
  };

  // display label on button: fallback to placeholder
  const displayLabel = nativeToWwyy(nativeWeek) ?? placeholder;

  return (
    <div className="w-full max-w-xs">
      <Label htmlFor={id} className="mb-1 block text-sm">
        {label}
      </Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className="w-full justify-between">
            <span className="truncate">{displayLabel}</span>
            <span className="text-xs opacity-70">▾</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64">
          <div className="flex flex-col gap-2">
            <div>
              <Label className="text-xs">Choose week</Label>
              {/* native <input type="week"> — works well and gives YYYY-Www */}
              <Input
                type="week"
                value={nativeWeek}
                onChange={handleNativeChange}
                className="mt-1"
                aria-label="Choose week and year"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" onClick={clear} className="flex-1">
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // close popover by focusing away — consumer popover handles closing automatically on focus loss
                  // we still ensure onChange is emitted for current value
                  onChange?.(nativeToWwyy(nativeWeek));
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}


/*
Example usage:

import WeekYearPicker from '@/components/WeekYearPicker';

function Example() {
  const [wwyy, setWwyy] = useState<string | null>(null);

  return (
    <div>
      <WeekYearPicker
        value={wwyy ?? undefined}
        onChange={(val) => {
          // val will be like "3625" (week 36, year 2025 -> last two digits 25)
          setWwyy(val);
        }}
      />

      <p>Selected wwyy: {wwyy ?? '—'}</p>
    </div>
  );
}

Notes / caveats:
- input[type=week] behavior depends slightly on browser locale, but the format it exposes is standardized (YYYY-Www).
- This component emits a 4-digit string: two digits for week (01-53) + two digits for year (00-99). If you need a full year or ISO-week edge cases (week 01 that belongs to previous/next year), consider using a dedicated ISO-week library like date-fns or dayjs with isoWeek plugin to compute exact ISO week/year boundaries.
*/
