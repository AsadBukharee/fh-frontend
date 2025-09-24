'use client'
import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCookies } from 'next-client-cookies';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import API_URL from '@/app/utils/ENV';
import { EllipsisVertical, Gauge, Map, MapPin, Menu, UsersRound } from 'lucide-react';

type Run = {
  id: number;
  is_stopped: boolean;
  vehicle: {
    id: number;
    registration_number: string;
    vehicles_type_name: string;
    last_mileage: string;
    site_allocated: { id: number; name: string; status: string; image: string } | null;
  } | null;
  driver: { id: number; full_name: string; avatar: string | null } | null;
  direction: "in" | "out";
  created_at: string;
  run_type: string;
  mileage: number;
  stops: { id: number; location_name: string; number: number; mileage: number;su_run:string }[];
};

const FILTERS = [
  { label: "Early", type: "Early", color: "bg-red-100 text-red-600" },
  { label: "1st Shuttle", type: "1st Shuttle Run", color: "bg-green-100 text-green-600" },
  { label: "2nd Shuttle", type: "2nd Shuttle Run", color: "bg-blue-100 text-blue-600" },
  { label: "3rd Shuttle", type: "3rd Shuttle Run", color: "bg-orange-100 text-orange-600" },
  { label: "Night", type: "Night", color: "bg-purple-100 text-purple-600" },
  { label: "Maintenance", type: "Maintenance Run", color: "bg-pink-100 text-pink-600" },
];

const MileageTracker = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<Run[]>([]);
  const [activeFilter, setActiveFilter] = useState("1st Shuttle Run");
  const [loading, setLoading] = useState(true);
  const token = useCookies().get('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/activity/su-run/`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const today = new Date().toISOString().split("T")[0];
        const todayData = data?.data?.results.filter((run: Run) => run.created_at.startsWith(today)) || [];
        setRuns(todayData);

        // Apply initial filter
        if (activeFilter === "all") {
          setFilteredRuns(todayData);
        } else {
          setFilteredRuns(todayData.filter((run: { run_type: string; }) => run.run_type === activeFilter));
        }
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, activeFilter]);

  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const endTime = new Date();
  endTime.setHours(23, 59, 59, 999);
  const endTimeStr = endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Group runs by driver
  const groupedByDriver = filteredRuns.reduce((acc: Record<string, Run[]>, run) => {
    const name = run.driver?.full_name ?? "Unknown";
    acc[name] = acc[name] || [];
    acc[name].push(run);
    return acc;
  }, {});

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full border-blue-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Mileage Tracker</CardTitle>
          <div className="text-sm text-muted-foreground">Date {today}</div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTERS.map(f => (
              <Badge
                key={f.type}
                className={`cursor-pointer px-4 py-1 rounded-2xl text-sm font-medium border transition-colors ${f.color} ${activeFilter === f.type ? "bg-white border-2 border-gray-200" : ""}`}
                onClick={() => {
                  setActiveFilter(f.type);
                  if (f.type === "all") setFilteredRuns(runs);
                  else setFilteredRuns(runs.filter(run => run.run_type === f.type));
                }}
              >
                {f.label}
              </Badge>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{activeFilter === "all" ? "All Runs" : activeFilter}</span>
              <span className="text-sm text-muted-foreground">{currentTime} - {endTimeStr}</span>
            </div>

            {/* Drivers list */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drivers</TableHead>
                  <TableHead>Routes</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedByDriver).map(([driver, driverRuns]) => (
                  <TableRow key={driver}>
                    <TableCell className="font-medium">{driver}</TableCell>
                   <TableCell>
  <div className="flex flex-nowrap justify-center items-center bg-gray-100 rounded-xl overflow-x-auto gap-2 p-2">
    {driverRuns.flatMap(run => run.stops).map(stop => (
      <div className="flex justify-center items-center shrink-0" key={stop.id}>
        <div
          className={`w-[120px] h-[120px] rounded-full flex flex-col justify-center items-center`}
        >
            <div className="w-[50px] h-[50px] flex justify-center items-center rounded-full bg-rose-200">
          <MapPin className="mx-auto   text-rose-500" />

            </div>
          <div className="text-center text-sm font-medium text-gray-700">{stop.location_name}</div>
          <div className="text-center text-xs flex gap-1 text-gray-500"><UsersRound className=' ' size={14} /> ({stop.su_run} su)</div>
        </div>
        <div className="w-[50px] h-2 border-t-2 relative border-dashed border-gray-400 flex flex-col justify-center items-center">
          <span className="text-xs text-black absolute flex -top-4"><Gauge size={12} />{stop.mileage}</span>
        </div>
      </div>
    ))}
  </div>
</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={driverRuns[0].direction === "in" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}
                      >
                        {driverRuns[0].direction.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm"><EllipsisVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>View</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Internal Operations */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold">Internal Operations</h2>
              <span className="text-sm text-muted-foreground">Van early run data</span>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drivers</TableHead>
                    <TableHead>Transfers</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Total Mileage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByDriver).map(([driver, driverRuns]) => {
                    const totalTransfers = driverRuns.reduce(
                      (sum, run) => sum + run.stops.reduce((s, stop) => s + (stop.number || 0), 0), 0
                    );
                    const totalJobs = driverRuns.reduce((sum, run) => sum + run.stops.length, 0);
                    const totalMileage = driverRuns.reduce((sum, run) => sum + (run.mileage || 0), 0);

                    return (
                      <TableRow key={driver}>
                        <TableCell className="font-medium">{driver}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-200">{totalTransfers}</Badge>
                        </TableCell>
                        <TableCell>{totalJobs}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-200">{totalMileage}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MileageTracker;
