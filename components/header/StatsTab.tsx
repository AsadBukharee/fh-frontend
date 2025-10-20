"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WeekReference {
  current_cycle_week: number;
  requested_week_number: number;
  applied_offset_weeks: number;
  start_date: string;
  end_date: string;
}

interface DayStats {
  Total: number;
  D: number;
  S: number;
  E: number;
  M: number;
  N: number;
}

interface StatsResponse {
  week_reference: WeekReference;
  monday: DayStats;
  tuesday: DayStats;
  wednesday: DayStats;
  thursday: DayStats;
  friday: DayStats;
  saturday: DayStats;
  sunday: DayStats;
}

const StatsTab: React.FC = () => {
  const token = useCookies().get("access_token");
  const [statsData, setStatsData] = useState<Record<number, StatsResponse | null>>({});
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  const fetchData = async (week: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rota/stats/${week}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStatsData((prev) => ({ ...prev, [week]: data }));

      // Auto-select cycle week if available and no week manually selected yet
      if (!statsData[week] && data.week_reference?.current_cycle_week) {
        setCurrentWeek(data.week_reference.current_cycle_week);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    [1, 2, 3, 4].forEach((week) => fetchData(week));
  }, []);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const rows = [
    { key: "D", label: "Driver" },
    { key: "S", label: "Supervisor" },
    { key: "E", label: "Early", badge: "bg-orange-400 text-white" },
    { key: "M", label: "Middle", badge: "bg-yellow-400 text-black" },
    { key: "N", label: "Night", badge: "bg-gray-500 text-white" },
  ];

  const stats = statsData[currentWeek];

  // ✅ Error checking rules
  function isError(rowKey: string, value: number): boolean {
    if (rowKey === "D") {
      return value <= 11;
    }
    if (rowKey === "S") {
      return value === 0;
    }
    if (["E", "M", "N"].includes(rowKey)) {
      return value === 0 || value > 1;
    }
    return false;
  }

  function getCellColor(rowKey: string, value: number) {
    return isError(rowKey, value)
      ? "bg-red-500 text-white"
      : "bg-green-500 text-white";
  }

  // ✅ Count errors in current week
  let errorCount = 0;
  if (stats) {
    rows.forEach((row) => {
      days.forEach((day) => {
        const d = stats[day as keyof StatsResponse] as DayStats;
        const value = d[row.key as keyof DayStats] as number;
        if (isError(row.key, value)) {
          errorCount++;
        }
      });
    });
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Week Selector Badges */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((week) => {
          const isSelected = currentWeek === week;
          const isCycleWeek =
            statsData[week]?.week_reference?.current_cycle_week === week;

          return (
            <button
              key={week}
              onClick={() => setCurrentWeek(week)}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 transition
                ${isSelected
                  ? "bg-gray-300 text-gray-700 border-gray-300"
                  : isCycleWeek
                  ? "bg-rose text-white border-rose"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}
              `}
            >
              Week {week}
              
              {isCycleWeek && !isSelected && (
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">
            ❌ Warnings : {errorCount}
          </span>
        </div>
      </div>

      {/* Stats Table */}
      <Card className=" rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Stats for Week {currentWeek}
          </CardTitle>
          {stats && (
            <p className="text-sm text-muted-foreground">
              {stats.week_reference.start_date} → {stats.week_reference.end_date}
              {"  "}
              
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading && !stats ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : stats ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Stats</TableHead>
                    {days.map((day) => (
                      <TableHead key={day} className="capitalize text-center">
                        {day.slice(0, 3)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">
                        <span
                          className={`px-2 py-1 rounded ${
                            row.badge ? row.badge : ""
                          }`}
                        >
                          {row.label}
                        </span>
                      </TableCell>
                      {days.map((day) => {
                        const d = stats[day as keyof StatsResponse] as DayStats;
                        const value = d[row.key as keyof DayStats] as number;
                        return (
                          <TableCell key={day} className="text-center">
                            <div
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${getCellColor(
                                row.key,
                                value
                              )}`}
                            >
                              {value}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsTab;
