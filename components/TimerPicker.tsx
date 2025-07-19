"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { format, parse, isValid } from "date-fns";

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const TimePicker = ({ value, onChange, disabled = false }: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Extract initial time values safely
  const initialDate = parse(value, "HH:mm:ss", new Date());
  const initialHours = isValid(initialDate) ? initialDate.getHours() : 0;
  const initialMinutes = isValid(initialDate) ? initialDate.getMinutes() : 0;

  const [hours, setHours] = useState<number>(
    initialHours % 12 === 0 ? 12 : initialHours % 12
  );
  const [minutes, setMinutes] = useState<number>(initialMinutes);
  const [period, setPeriod] = useState<"AM" | "PM">(initialHours >= 12 ? "PM" : "AM");

  // Format time to display in Input
  const formatDisplayTime = () => {
    if (!isValid(initialDate)) return value;
    return format(initialDate, "h:mm a");
  };

  // Update parent component on time change
  const handleConfirm = () => {
    let adjustedHours = hours % 12;
    if (period === "PM") adjustedHours += 12;
    if (period === "AM" && hours === 12) adjustedHours = 0;

    const formatted = `${adjustedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hourAngle = (hours % 12 + minutes / 60) * 30;
  const minuteAngle = minutes * 6;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          type="text"
          value={formatDisplayTime()}
          onFocus={() => !disabled && setIsOpen(true)}
          onClick={() => !disabled && setIsOpen(true)}
          readOnly
          disabled={disabled}
          className={`pr-10 cursor-pointer ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
        <Clock
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-500 cursor-pointer"
          }`}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 bg-white border border-gray-300 rounded-lg p-4 shadow-xl mt-2 w-64 animate-fade-in">
          <div className="relative w-full h-48 flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="45" stroke="#e0e0e0" strokeWidth="2" fill="none" />
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x = 50 + 40 * Math.cos(angle);
                const y = 50 + 40 * Math.sin(angle);
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    fontSize="10"
                    fill="#333"
                    dominantBaseline="middle"
                    textAnchor="middle"
                  >
                    {i + 1}
                  </text>
                );
              })}
              <line
                x1="50"
                y1="50"
                x2={50 + 30 * Math.cos(minuteAngle * (Math.PI / 180))}
                y2={50 + 30 * Math.sin(minuteAngle * (Math.PI / 180))}
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="50"
                y1="50"
                x2={50 + 20 * Math.cos(hourAngle * (Math.PI / 180))}
                y2={50 + 20 * Math.sin(hourAngle * (Math.PI / 180))}
                stroke="#000"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="2" fill="#000" />
            </svg>

            <div className="absolute bottom-4 flex w-full justify-center gap-4">
              {["AM", "PM"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as "AM" | "PM")}
                  className={`px-3 py-1 rounded font-medium ${
                    period === p
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={disabled}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4 text-sm font-medium">
            <button
              onClick={() => {
                setHours(12);
                setMinutes(0);
                setPeriod("AM");
              }}
              className="px-4 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              disabled={disabled}
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={disabled}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
