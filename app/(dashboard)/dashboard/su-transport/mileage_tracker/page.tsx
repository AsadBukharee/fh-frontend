'use client'
import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useCookies } from 'next-client-cookies';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import API_URL from '@/app/utils/ENV';
import { EllipsisVertical, Gauge, MapPin, UsersRound, Eye, Edit, Trash2 } from 'lucide-react';

type Stop = {
  id: number;
  location_name: string;
  su_run: number;
  mileage: number;
  order: number;
};

type Run = {
  id: number;
  is_stopped: boolean;
  vehicle: {
    id: number;
    registration_number: string;
    vehicles_type_name: string;
  } | null;
  driver: { id: number; full_name: string } | null;
  direction: "in" | "out";
  created_at: string;
  run_type: string;
  mileage: number;
  notes: string | null;
  stops: Stop[];
};

const FILTERS = [
  { label: "Early", type: "Early", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  { label: "1st Shuttle", type: "1st Shuttle Run", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  { label: "2nd Shuttle", type: "2nd Shuttle Run", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { label: "3rd Shuttle", type: "3rd Shuttle Run", color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
  { label: "Night", type: "Night", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  { label: "Maintenance Run", type: "Maintenance Run", color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
];

const MileageTracker = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<Run[]>([]);
  const [activeFilter, setActiveFilter] = useState("1st Shuttle Run");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit form states
  const [editMileage, setEditMileage] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");

  const token = useCookies().get('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/activity/su-run/`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const today = "2025-12-25";
        const todayData = data?.data?.results.filter((run: Run) => run.created_at.startsWith(today)) || [];
        setRuns(todayData);
        applyFilter(todayData, activeFilter);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const applyFilter = (allRuns: Run[], filter: string) => {
    const filtered = filter === "all" ? allRuns : allRuns.filter(run => run.run_type === filter);
    setFilteredRuns(filtered);
    setActiveFilter(filter);
  };

  const groupedByDriver = filteredRuns.reduce((acc: Record<string, Run[]>, run) => {
    const name = run.driver?.full_name ?? "Unknown Driver";
    acc[name] = acc[name] || [];
    acc[name].push(run);
    return acc;
  }, {});

  // Dialog handlers
  const handleView = (run: Run) => {
    setSelectedRun(run);
    setViewOpen(true);
  };

  const handleEdit = (run: Run) => {
    setSelectedRun(run);
    setEditMileage(run.mileage);
    setEditNotes(run.notes || "");
    setEditOpen(true);
  };

  const handleDelete = (run: Run) => {
    setSelectedRun(run);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRun) return;
    try {
      await fetch(`${API_URL}/activity/su-run/${selectedRun.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRuns(prev => prev.filter(r => r.id !== selectedRun.id));
      setFilteredRuns(prev => prev.filter(r => r.id !== selectedRun.id));
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleteOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedRun) return;
    try {
      const res = await fetch(`${API_URL}/activity/su-run/${selectedRun.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mileage: Number(editMileage),
          notes: editNotes.trim() || null
        })
      });
      if (res.ok) {
        const updatedRun = { ...selectedRun, mileage: Number(editMileage), notes: editNotes.trim() || null };
        setRuns(prev => prev.map(r => r.id === selectedRun.id ? updatedRun : r));
        setFilteredRuns(prev => prev.map(r => r.id === selectedRun.id ? updatedRun : r));
        setEditOpen(false);
      }
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  const formatDate = new Date().toLocaleDateString('en-GB');
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <>
      <div className="container mx-auto p-4">
        <Card className="w-full  ">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-2xl font-bold">Mileage Tracker</CardTitle>
            <div className="text-sm text-muted-foreground">Date {formatDate}</div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {FILTERS.map(f => (
                <Badge
                  key={f.type}
                  className={`cursor-pointer px-5 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                    activeFilter === f.type
                      ? "bg-white border-gray-800 shadow-md text-gray-900 font-bold"
                      : f.color + " border-transparent"
                  }`}
                  onClick={() => applyFilter(runs, f.type)}
                >
                  {f.label}
                </Badge>
              ))}
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{activeFilter}</h2>
                <span className="text-sm text-muted-foreground">{currentTime} - 11:59 PM</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Drivers</TableHead>
                    <TableHead className="font-bold">Routes</TableHead>
                    <TableHead className="font-bold text-center">Direction</TableHead>
                    <TableHead className="font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByDriver).map(([driver, driverRuns]) => {
                    const latestRun = driverRuns
                      .filter(r => r.run_type === activeFilter)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                    if (!latestRun) return null;

                    const sortedStops = [...latestRun.stops].sort((a, b) => a.order - b.order);

                    return (
                      <TableRow key={driver} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-lg">{driver}</TableCell>
                        <TableCell className="py-6">
                          <div className="flex items-center gap-6 bg-gray-100 rounded-xl p-4 overflow-x-auto min-w-max">
                            {sortedStops.map((stop, idx) => (
                              <React.Fragment key={stop.id}>
                                {idx > 0 && (
                                  <div className="flex flex-col items-center">
                                    <div className="w-32 h-1 border-t-4 border-dashed border-gray-400"></div>
                                    <span className="absolute mt-8 text-xs font-medium text-gray-700 flex items-center gap-1 bg-white px-2 rounded">
                                      <Gauge size={14} />
                                      {stop.mileage.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-col items-center min-w-32">
                                  <div className={`w-10 h-10 rounded-full flex flex-col justify-center items-center shadow-lg ${
                                    latestRun.direction === "out" ? "bg-pink-100" : "bg-green-100"
                                  }`}>
                                    <MapPin size={14} className={latestRun.direction === "out" ? "text-pink-600" : "text-green-600"} />
                                  </div>
                                  <div className="mt-3 text-center">
                                    <div className="font-semibold text-sm text-gray-800">
                                      {stop.location_name.replace("Wethersfield MDP", "Wethersfield")}
                                    </div>
                                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                                      <UsersRound size={12} />
                                      ({stop.su_run} su)
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`px-4 py-1 text-sm font-bold border-2 ${
                            latestRun.direction === "in"
                              ? "bg-green-100 text-green-700 border-green-400"
                              : "bg-red-100 text-red-700 border-red-400"
                          }`}>
                            {latestRun.direction.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EllipsisVertical size={20} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(latestRun)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(latestRun)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(latestRun)} className="cursor-pointer text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Internal Operations */}
              <div className="mt-10">
                <h2 className="text-xl font-bold mb-2">Internal Operations</h2>
                <span className="text-sm text-muted-foreground">Van early run data</span>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Drivers</TableHead>
                      <TableHead className="font-bold">Transfers</TableHead>
                      <TableHead className="font-bold">Jobs</TableHead>
                      <TableHead className="font-bold">Total Mileage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedByDriver).map(([driver, driverRuns]) => {
                      const relevantRuns = driverRuns.filter(r => r.run_type === activeFilter);
                      const totalTransfers = relevantRuns.reduce((sum, run) => sum + run.stops.reduce((s, stop) => s + stop.su_run, 0), 0);
                      const totalJobs = relevantRuns.reduce((sum, run) => sum + run.stops.length, 0);
                      const totalMileage = relevantRuns.reduce((sum, run) => sum + run.mileage, 0);

                      return (
                        <TableRow key={driver}>
                          <TableCell className="font-medium">{driver}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 text-lg px-4 py-1">
                              {totalTransfers} +
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">{totalJobs}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-pink-100 text-pink-700 text-lg px-4 py-1">
                              {totalMileage.toFixed(1)}
                            </Badge>
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

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Run Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4 text-sm">
              <div><strong>Driver:</strong> {selectedRun.driver?.full_name}</div>
              <div><strong>Vehicle:</strong> {selectedRun.vehicle?.registration_number} ({selectedRun.vehicle?.vehicles_type_name})</div>
              <div><strong>Type:</strong> {selectedRun.run_type}</div>
              <div><strong>Direction:</strong> {selectedRun.direction.toUpperCase()}</div>
              <div><strong>Total Mileage:</strong> {selectedRun.mileage.toFixed(1)} mi</div>
              <div><strong>Notes:</strong> {selectedRun.notes || "No notes"}</div>
              <div className="mt-4">
                <strong>Stops:</strong>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  {selectedRun.stops.sort((a, b) => a.order - b.order).map(stop => (
                    <li key={stop.id}>
                      {stop.location_name} — <strong>{stop.su_run} SU</strong>
                      {stop.mileage > 0 && ` (+${stop.mileage.toFixed(1)} mi)`}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Run</DialogTitle>
            <DialogDescription>
              Update the mileage and notes for this run.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-mileage">Total Mileage</Label>
              <Input
                id="edit-mileage"
                type="number"
                step="0.1"
                value={editMileage}
                onChange={(e) => setEditMileage(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Run?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the run for{" "}
              <strong>{selectedRun?.driver?.full_name}</strong> ({selectedRun?.run_type}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MileageTracker;