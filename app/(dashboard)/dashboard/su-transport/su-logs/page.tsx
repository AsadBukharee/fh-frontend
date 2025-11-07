'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useCookies } from 'next-client-cookies';
import {
  Bus, Calendar, Clock, Users, ArrowRight, ArrowUpDown,
  AlertCircle, Filter, RotateCw, MapPin, Hash, MoreVertical,
  Eye, Trash2, Loader2, Check, X,
} from 'lucide-react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import API_URL from '@/app/utils/ENV';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface Stop {
  stop_id: number;
  date: string;
  time: string;
  driver_name: string;
  from: string;
  to: string;
  numbers: number;
  su_run: number;
  run_type?: string;
}
interface Location { id: number; name: string; }
interface Driver { id: number; full_name: string; }
interface ApiResponse<T> { success: boolean; message: string; data: T; }

// ──────────────────────────────────────────────────────────────
// Run-type colors
// ──────────────────────────────────────────────────────────────
const RUN_TYPE_COLORS: Record<number, { bg: string; hover: string; text: string }> = {
  1: { bg: 'bg-blue-500', hover: 'hover:bg-blue-50', text: 'text-white' },
  2: { bg: 'bg-green-500', hover: 'hover:bg-green-50', text: 'text-white' },
  3: { bg: 'bg-purple-500', hover: 'hover:bg-purple-50', text: 'text-white' },
  4: { bg: 'bg-amber-500', hover: 'hover:bg-amber-50', text: 'text-white' },
};
const getRunTypeColor = (run: number) => RUN_TYPE_COLORS[run] ?? RUN_TYPE_COLORS[1];

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export default function SURunList() {
  const cookies = useCookies();
  const token = cookies.get('access_token');

  // ────── Filters ──────
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [driver, setDriver] = useState('');
  const [runType, setRunType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // ────── Data ──────
  const [stops, setStops] = useState<Stop[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // ────── UI ──────
  const [loadingStops, setLoadingStops] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ────── Dialogs ──────
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  // ────── Sorting ──────
  const [sort, setSort] = useState<{
    key: keyof Stop | 'route';
    direction: 'asc' | 'desc';
  }>({ key: 'stop_id', direction: 'asc' });

  const requestSort = (key: keyof Stop | 'route') => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // ────── Fetch Filters ──────
  useEffect(() => {
    const fetchFilters = async () => {
      if (!token) return;
      try {
        setLoadingFilters(true);
        const [locRes, driverRes] = await Promise.all([
          fetch(`${API_URL}/activity/locations/names/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const locJson: ApiResponse<Location[]> = await locRes.json();
        const driverJson: ApiResponse<Driver[]> = await driverRes.json();

        if (locJson.success) setLocations(locJson.data);
        if (driverJson.success) setDrivers(driverJson.data);
      } catch (e) {
        console.error('Failed to load filters', e);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, [token]);

  // ────── Fetch Stops ──────
  const fetchStops = useCallback(async () => {
    if (!token) return;
    setLoadingStops(true);
    setError(null);

    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (driver) params.append('driver', driver);
    if (runType) params.append('run_type', runType);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    params.append('page', page.toString());

    try {
      const res = await fetch(
        `${API_URL}/activity/su-run/su-run-list/?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Failed to load stops');

      const json: ApiResponse<{
        results: Stop[];
        count: number;
        total_pages: number;
      }> = await res.json();

      if (json.success) {
        setStops(json.data.results);
        setTotalPages(json.data.total_pages || 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoadingStops(false);
    }
  }, [token, from, to, driver, runType, dateFrom, dateTo, page]);

  useEffect(() => { fetchStops(); }, [fetchStops]);
  useEffect(() => { setPage(1); }, [from, to, driver, runType, dateFrom, dateTo]);

  // ────── Sorted Data ──────
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sort.key === 'route') {
        aVal = `${a.from} → ${a.to}`;
        bVal = `${b.from} → ${b.to}`;
      } else {
        aVal = a[sort.key];
        bVal = b[sort.key];
      }
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stops, sort]);

  // ────── Actions ──────
  const openView = (stop: Stop) => {
    setSelectedStop(stop);
    setViewOpen(true);
  };

  const handleDelete = async (stop: Stop) => {
    if (!window.confirm(`Delete stop #${stop.stop_id} (Run #${stop.su_run})?`)) return;
    try {
      const res = await fetch(
        `${API_URL}/activity/su-run/${stop.su_run}/su_run_update/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'delete_stop',
            stop_id: stop.stop_id,
          }),
        }
      );
      if (!res.ok) throw new Error('Delete failed');
      fetchStops();
    } catch {
      alert('Failed to delete');
    }
  };

  const resetFilters = () => {
    setFrom(''); setTo(''); setDriver(''); setRunType(''); setDateFrom(''); setDateTo('');
  };

  // ────── Editable SU Number ──────
  function EditableSuNumber({ stop }: { stop: Stop }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(stop.numbers);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);

    const startEdit = () => { setValue(stop.numbers); setEditing(true); setError(false); };
    const cancelEdit = () => { setValue(stop.numbers); setEditing(false); };

    const saveEdit = async () => {
      if (value === stop.numbers) { cancelEdit(); return; }
      setSaving(true); setError(false);
      try {
        const res = await fetch(
          `${API_URL}/activity/su-run/${stop.su_run}/su_run_update/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: 'update_stop',
              stop_id: stop.stop_id,
              number: value,
            }),
          }
        );
        if (!res.ok) throw new Error('Update failed');
        setStops(prev => prev.map(s => s.stop_id === stop.stop_id ? { ...s, numbers: value } : s));
        setEditing(false);
      } catch { setError(true); } finally { setSaving(false); }
    };

    if (!editing) {
      return (
        <Badge
          variant={stop.numbers >= 0 ? 'default' : 'destructive'}
          className="w-12 justify-center text-white cursor-pointer"
          onClick={startEdit}
        >
          {stop.numbers > 0 ? '+' : ''}{stop.numbers}
        </Badge>
      );
    }

    return (
      <div className="flex items-center justify-center gap-1">
        <Input
          type="number"
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          className="w-20 text-center"
          autoFocus
          disabled={saving}
        />
        <button onClick={saveEdit} disabled={saving} className="p-1 rounded hover:bg-muted disabled:opacity-50" title="Save">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
        </button>
        <button onClick={cancelEdit} disabled={saving} className="p-1 rounded hover:bg-muted" title="Cancel">
          <X className="h-4 w-4 text-red-600" />
        </button>
        {error && <span className="text-xs text-red-600 ml-1">Failed</span>}
      </div>
    );
  }

  // ────── Render ──────
  return (
    <div className="container mx-auto p-4 space-y-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SU Data Management</h1>
          <p className="text-muted-foreground">Filter and explore all service user runs</p>
        </div>
        <Bus className="h-10 w-10 text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />From</Label>
              <Select value={from} onValueChange={setFrom} disabled={loadingFilters}>
                <SelectTrigger><SelectValue placeholder="Origin" /></SelectTrigger>
                <SelectContent className="h-[300px]">
                  {locations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />To</Label>
              <Select value={to} onValueChange={setTo} disabled={loadingFilters}>
                <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent className="h-[300px]">
                  {locations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Driver</Label>
              <Select value={driver} onValueChange={setDriver} disabled={loadingFilters}>
                <SelectTrigger><SelectValue placeholder="All drivers" /></SelectTrigger>
                <SelectContent className="h-[300px]">
                  {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />Run Type</Label>
              <Select value={runType} onValueChange={setRunType}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {[1, 2, 3, 4].map(t => (
                    <SelectItem key={t} value={t.toString()}>Type {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Date From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>

            <div>
              <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Date To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                <RotateCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading / Error */}
      {loadingStops && <TableSkeleton />}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchStops}>
            <RotateCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </Alert>
      )}

      {/* Table */}
      {!loadingStops && !error && (
        <Card>
          <CardHeader><CardTitle>Run Details</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Run" sortKey="su_run" current={sort} onClick={requestSort} />
                    <SortableHead label="Type" sortKey="su_run" current={sort} onClick={requestSort} />
                    <SortableHead label="Date" sortKey="date" current={sort} onClick={requestSort} />
                    <SortableHead label="Time" sortKey="time" current={sort} onClick={requestSort} />
                    <SortableHead label="Driver" sortKey="driver_name" current={sort} onClick={requestSort} />
                    <SortableHead label="Route" sortKey="route" current={sort} onClick={requestSort} />
                    <SortableHead label="SU #" sortKey="numbers" current={sort} onClick={requestSort} className="text-center" />
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No stops match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedStops.map(stop => {
                      const color = getRunTypeColor(stop.su_run);
                      return (
                        <TableRow key={stop.stop_id} className={color.hover}>
                          <TableCell className="font-medium">
                            <Badge variant="secondary">#{stop.su_run}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${color.bg} ${color.text}`}>
                              {stop.run_type || `Type ${stop.su_run}`}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(stop.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{stop.time}</TableCell>
                          <TableCell>{stop.driver_name}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {stop.from}<ArrowRight className="h-3 w-3 text-muted-foreground" />{stop.to}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <EditableSuNumber stop={stop} />
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openView(stop)}>
                                  <Eye className="mr-2 h-4 w-4" />View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(stop)}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => { e.preventDefault(); if (page > 1) setPage(p => p - 1); }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          href="#"
                          isActive={i + 1 === page}
                          onClick={e => { e.preventDefault(); setPage(i + 1); }}
                        >{i + 1}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={e => { e.preventDefault(); if (page < totalPages) setPage(p => p + 1); }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Run Details</DialogTitle>
            <DialogDescription>
              Run #{selectedStop?.su_run} – {selectedStop?.driver_name}
            </DialogDescription>
          </DialogHeader>
          {selectedStop && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between"><span className="font-medium">Date:</span> <span>{format(new Date(selectedStop.date), 'dd MMM yyyy')}</span></div>
              <div className="flex justify-between"><span className="font-medium">Time:</span> <span>{selectedStop.time}</span></div>
              <div className="flex justify-between"><span className="font-medium">Route:</span> <span>{selectedStop.from} → {selectedStop.to}</span></div>
              <div className="flex justify-between"><span className="font-medium">SU Number:</span>
                <Badge variant={selectedStop.numbers >= 0 ? 'default' : 'destructive'}>
                  {selectedStop.numbers > 0 ? '+' : ''}{selectedStop.numbers}
                </Badge>
              </div>
              {selectedStop.run_type && (
                <div className="flex justify-between"><span className="font-medium">Run Type:</span> <span>{selectedStop.run_type}</span></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────── SortableHead ──────
function SortableHead({
  label, sortKey, current, onClick, className = '',
}: {
  label: string;
  sortKey: keyof Stop | 'route';
  current: { key: keyof Stop | 'route'; direction: 'asc' | 'desc' };
  onClick: (key: keyof Stop | 'route') => void;
  className?: string;
}) {
  const active = current.key === sortKey;
  return (
    <TableHead className={`cursor-pointer select-none ${className}`} onClick={() => onClick(sortKey)}>
      <div className="flex items-center gap-1">
        {label}
        {active && <ArrowUpDown className={`h-3 w-3 transition-transform ${current.direction === 'desc' ? 'rotate-180' : ''}`} />}
      </div>
    </TableHead>
  );
}

// ────── Skeleton ──────
function TableSkeleton() {
  return (
    <Card>
      <CardHeader><Skeleton className="h-8 w-40" /></CardHeader>
      <CardContent className="space-y-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </CardContent>
    </Card>
  );
}