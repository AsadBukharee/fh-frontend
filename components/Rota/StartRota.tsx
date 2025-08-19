"use client";
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { addMonths, isBefore, isValid } from "date-fns";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";

interface User {
  id: number;
  display_name: string;
}

interface StartRotaProps {
  users: User[];
}

const StartRota: React.FC<StartRotaProps> = ({ users }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const { showToast } = useToast();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxEndDate = startDate ? addMonths(startDate, 3) : undefined;

  const handleStartDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date ) {
        setStartDate(date);
        if (
          endDate &&
          (isBefore(endDate, date) ||
            (maxEndDate && isBefore(maxEndDate, endDate)))
        ) {
          setEndDate(undefined);
        }
      } else {
        setStartDate(undefined);
      }
    },
    [endDate, maxEndDate, today]
  );

  const handleEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (
        date &&
        isValid(date) &&
        startDate &&
        !isBefore(date, startDate) &&
        maxEndDate &&
        !isBefore(maxEndDate, date)
      ) {
        setEndDate(date);
      } else {
        setEndDate(undefined);
      }
    },
    [startDate, maxEndDate]
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedUserId || !startDate || !endDate) {
      showToast("Missing Information", "info");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        user_id: selectedUserId,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      };

      const response = await fetch(
        `${API_URL}/api/rota/child-rota/start-rota/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
         showToast(
        error?.error,
        "error"
      );
        throw new Error(`HTTP error! status: ${response.status} - ${error}`);
        


      }

      showToast(
         "Rota started successfully.",
        "success"
        
      );

      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedUserId(null);
    } catch (error) {
      console.error("Error starting rota:", error);
     
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId, startDate, endDate, token, showToast]);

  return (
    <div className="flex  gap-4 p-4  items-end w-fit bg-white   mx-auto">
      <div className="flex w-[100px] flex-col gap-1">
        <Label
          htmlFor="user-select"
          className="text-sm font-medium text-gray-600"
        >
          Select User
        </Label>
        <Select
          onValueChange={(value) => setSelectedUserId(Number(value))}
          value={selectedUserId?.toString() || ""}
        >
          <SelectTrigger
            id="user-select"
            className="h-9 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500"
            aria-label="Select a user"
          >
            <SelectValue placeholder="Choose a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="start-date"
          className="text-sm font-medium text-gray-600"
        >
          Start Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="start-date"
              variant="outline"
              className="h-9 text-sm justify-start border-gray-300 hover:bg-gray-50"
              aria-label="Select start date"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              {startDate ? (
                format(startDate, "PPP")
              ) : (
                <span className="text-gray-500">Pick a start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateSelect}
              // disabled={(date) => isBefore(date, today)}
              initialFocus
              className="text-sm"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="end-date" className="text-sm font-medium text-gray-600">
          End Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="end-date"
              variant="outline"
              className="h-9 text-sm justify-start border-gray-300 hover:bg-gray-50"
              disabled={!startDate}
              aria-label="Select end date"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              {endDate ? (
                format(endDate, "PPP")
              ) : (
                <span className="text-gray-500">Pick an end date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateSelect}
              disabled={(date) => {
                if (!startDate) return true;
                if (isBefore(date, startDate)) return true;
                if (maxEndDate && isBefore(maxEndDate, date)) return true;
                return false;
              }}
              initialFocus
              className="text-sm"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        onClick={handleSubmit}
        className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
        disabled={isLoading}
        aria-label="Start rota"
        style={{
          background:
            "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
          width: "auto",
          height: "auto",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          "Start Rota"
        )}
      </Button>
    </div>
  );
};

export default StartRota;
