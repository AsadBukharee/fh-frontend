"use client";

import { Eye, Car, Plus, RefreshCcw, User, CalendarDays, Clock, MoveRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import GradientButton from "@/app/utils/GradientButton";
import WalkaroundDetailsDialog from "@/components/walkaround/walkaround_detail";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Addwalkaround from "@/components/walkaround/add-walkaround";
import PlusWalkaround from "@/components/walkaround/pluswalkaround";
import { debounce } from "lodash";

interface Walkaround {
  id: number;
  driver: {
    id: number;
    full_name: string;
    email: string;
  };
  vehicle: {
    id: number;
    vehicles_type_name: string;
    registration_number: string;
  };
  conducted_by: string | null;
  walkaround_assignee: string | null;
  status: "pending" | "failed" | "completed";
  date: string;
  time: string;
  mileage: number;
  defects?: string;
  notes?: string;
  walkaround_step?: number;
  signature?: string;
  parent?: number | null;
  chain_id?: number;
  total_steps?: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    results: {
      root: any;
      children: any[];
      total_steps: number;
      latest_step: number;
      chain_id: number;
      vehicle_id: number;
      conducted_by_id: number;
      status: string;
      date: string;
      created_at: string;
      updated_at: string;
    }[];
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      current_page: number;
      total_pages: number;
      page_size: number;
    };
  };
}

const getStatusClasses = (status: Walkaround["status"]) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-200 text-green-800";
    case "pending":
      return "bg-yellow-200 text-yellow-800";
    case "failed":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const WalkaroundPage = () => {
  const [walkarounds, setWalkarounds] = useState<Walkaround[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openPlus, setOpenPlus] = useState(false);
  const [selectedWalkaround, setSelectedWalkaround] = useState<Walkaround | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const cookies = useCookies();

  const fetchWalkarounds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(dateFrom && { date_from: format(dateFrom, "yyyy-MM-dd") }),
        ...(dateTo && { date_to: format(dateTo, "yyyy-MM-dd") }),
      });

      const response = await fetch(`${API_URL}/api/walk-around/?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });

      const result: ApiResponse = await response.json();
      if (result.success && result.data) {
        const mappedWalkarounds = result.data.results.flatMap((item) => {
          const root = item.root;
          const conductor = root.conducted_by || { full_name: "None None", email: "unknown" };
          const conductorName = conductor.full_name !== "None None" ? conductor.full_name : conductor.email;
          let assigneeName = null;
          if (root.walkaround_assignee) {
            assigneeName =
              root.walkaround_assignee.full_name !== "None None"
                ? root.walkaround_assignee.full_name
                : root.walkaround_assignee.email;
          }

          const rootWalkaround: Walkaround = {
            id: root.id,
            driver: conductor,
            vehicle: {
              id: root.vehicle.id,
              vehicles_type_name: root.vehicle.vehicles_type_name,
              registration_number: root.vehicle.registration_number,
            },
            conducted_by: conductorName,
            walkaround_assignee: assigneeName,
            status: root.status,
            date: root.date,
            time: root.time,
            mileage: root.milage,
            defects: root.defects === "no" || root.defects === "non" ? "None" : root.defects || "None",
            notes: root.note === "no" || root.note === "non" ? "None" : root.note || "None",
            walkaround_step: root.walkaround_step,
            signature: root.signature,
            parent: root.parent || null,
            chain_id: item.chain_id,
            total_steps: item.total_steps,
          };

          const childWalkarounds = item.children.map((child) => {
            const childConductor = child.conducted_by || { full_name: "None None", email: "unknown" };
            const childConductorName =
              childConductor.full_name !== "None None" ? childConductor.full_name : childConductor.email;
            let childAssigneeName = null;
            if (child.walkaround_assignee) {
              childAssigneeName =
                child.walkaround_assignee.full_name !== "None None"
                  ? child.walkaround_assignee.full_name
                  : child.walkaround_assignee.email;
            }
            return {
              id: child.id,
              driver: childConductor,
              vehicle: {
                id: child.vehicle.id,
                vehicles_type_name: child.vehicle.vehicles_type_name,
                registration_number: child.vehicle.registration_number,
              },
              conducted_by: childConductorName,
              walkaround_assignee: childAssigneeName,
              status: child.status,
              date: child.date,
              time: child.time,
              mileage: child.milage,
              defects: child.defects === "no" || child.defects === "non" ? "None" : child.defects || "None",
              notes: child.note === "no" || child.note === "non" ? "None" : child.note || "None",
              walkaround_step: child.walkaround_step,
              signature: child.signature,
              parent: child.parent || null,
              chain_id: item.chain_id,
              total_steps: item.total_steps,
            };
          });

          return [rootWalkaround, ...childWalkarounds];
        });

        setWalkarounds(mappedWalkarounds);
        setTotalCount(result.data.pagination.count || 0);
      } else {
        setError("Failed to fetch walkarounds.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchWalkarounds = debounce(fetchWalkarounds, 300);

  useEffect(() => {
    debouncedFetchWalkarounds();
  }, [page, pageSize, dateFrom, dateTo]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      if (dateFrom > dateTo) {
        setError("Start date cannot be later than end date.");
      } else {
        setError(null);
      }
    } else {
      setError("Please select both start and end dates.");
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!openPlus && !openDetailsDialog) {
      setSelectedWalkaround(null);
    }
  }, [openPlus, openDetailsDialog]);

  const resetFilters = () => {
    setDateFrom(new Date());
    setDateTo(new Date());
    setPage(1);
    setPageSize(50);
    setError(null);
  };

  const handleViewDetails = (walkaround: Walkaround) => {
    setSelectedWalkaround(walkaround);
    setOpenDetailsDialog(true);
  };

  const handleAddChildWalkaround = (chainId: number) => {
    // Find all walkarounds in the same chain
    const chainWalkarounds = walkarounds.filter((w) => w.chain_id === chainId);
    // Find the walkaround with the highest walkaround_step
    const latestWalkaround = chainWalkarounds.reduce((latest, current) => {
      return (current.walkaround_step || 0) > (latest.walkaround_step || 0) ? current : latest;
    }, chainWalkarounds[0]);

    if (latestWalkaround) {
      setSelectedWalkaround(latestWalkaround);
      setOpenPlus(true);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Group walkarounds by vehicle_id and chain_id
  const groupedWalkarounds = useMemo(() => {
    const byVehicle = walkarounds.reduce((acc, walkaround) => {
      const vehicleId = walkaround.vehicle.id;
      if (!acc[vehicleId]) {
        acc[vehicleId] = {};
      }
      const chainId = walkaround.chain_id || walkaround.id;
      if (!acc[vehicleId][chainId]) {
        acc[vehicleId][chainId] = { root: null, children: [] };
      }
      if (walkaround.parent === null) {
        acc[vehicleId][chainId].root = walkaround;
      } else {
        acc[vehicleId][chainId].children.push(walkaround);
      }
      return acc;
    }, {} as Record<number, Record<number, { root: Walkaround | null; children: Walkaround[] }>>);
    return byVehicle;
  }, [walkarounds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround</h1>
            <p className="text-sm text-gray-500 mb-4">View vehicle walkaround details</p>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[150px] justify-start text-left font-normal"
                      aria-label="Select start date"
                    >
                      {dateFrom ? format(dateFrom, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date);
                        if (date && dateTo && date > dateTo) {
                          setError("Start date cannot be later than end date.");
                        } else {
                          setError(null);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[150px] justify-start text-left font-normal"
                      aria-label="Select end date"
                    >
                      {dateTo ? format(dateTo, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date);
                        if (dateFrom && date && dateFrom > date) {
                          setError("Start date cannot be later than end date.");
                        } else {
                          setError(null);
                        }
                      }}
                      initialFocus
                      disabled={(date) => (dateFrom ? date < dateFrom : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[100px]" aria-label="Select page size">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetFilters} aria-label="Reset filters">
                Reset Filters
              </Button>
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
          <div className="flex gap-4 items-center justify-center">
            <RefreshCcw
              className="text-gray-500 hover:text-gray-600 cursor-pointer"
              onClick={debouncedFetchWalkarounds}
              aria-label="Refresh walkarounds"
            />
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <GradientButton text="Walkaround" Icon={Plus} />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Walkaround</DialogTitle>
                </DialogHeader>
                <Addwalkaround setOpen={setOpenAdd} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Walkaround List */}
        <div className="space-y-6">
          {Object.entries(groupedWalkarounds).map(([vehicleId, chains]) => {
            const chainKeys = Object.keys(chains).map(Number) as Array<keyof typeof chains>;
            const firstChain = chains[chainKeys[0]];
            return (
              <div key={vehicleId} className="p-4 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Vehicle: {firstChain.root?.vehicle.registration_number ||
                    firstChain.children[0]?.vehicle.registration_number} (
                  {firstChain.root?.vehicle.vehicles_type_name ||
                    firstChain.children[0]?.vehicle.vehicles_type_name})
                </h2>
                <div className="space-y-4">
                  {Object.entries(chains).map(([chainId, { root, children }]) => (
                    <div key={chainId} className="flex flex-col sm:flex-row  w-full overflow-y-auto items-start sm:items-center gap-4">
                      {root && (
                        <>
                          <div className={`p-4 shrink-0 rounded-lg ${getStatusClasses(root.status)} text-center w-full sm:w-64`}>
                            <h3 className="text-sm font-semibold">Step {root.walkaround_step}</h3>
                            <p className="text-sm">Driver: {root.conducted_by || "N/A"}</p>
                            <p className="text-sm">Status: {root.status.charAt(0).toUpperCase() + root.status.slice(1)}</p>
                            <p className="text-sm">Date: {format(new Date(root.date), "dd.MM.yy")}</p>
                            <p className="text-sm">Time: {root.time}</p>
                            <Button
                              variant="outline"
                              className="text-xs mt-2"
                              onClick={() => handleViewDetails(root)}
                              aria-label={`View details for walkaround ${root.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Details
                            </Button>
                          </div>
                          {children.length > 0 && (
                            <MoveRight className="text-gray-500 hidden sm:block" aria-hidden="true" />
                          )}
                        </>
                      )}
                      {children
                        .sort((a, b) => (a.walkaround_step || 0) - (b.walkaround_step || 0))
                        .map((child, idx) => (
                          <div key={child.id} className="flex items-center gap-4">
                            <div className={`p-4 rounded-lg ${getStatusClasses(child.status)} text-center w-full sm:w-64`}>
                              <h3 className="text-sm font-semibold">Step {child.walkaround_step}</h3>
                              <p className="text-sm">Driver: {child.conducted_by || "N/A"}</p>
                              <p className="text-sm">Status: {child.status.charAt(0).toUpperCase() + child.status.slice(1)}</p>
                              <p className="text-sm">Date: {format(new Date(child.date), "dd.MM.yy")}</p>
                              <p className="text-sm">Time: {child.time}</p>
                              <Button
                                variant="outline"
                                className="text-xs mt-2"
                                onClick={() => handleViewDetails(child)}
                                aria-label={`View details for walkaround ${child.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Details
                              </Button>
                            </div>
                            {idx < children.length - 1 && (
                              <MoveRight className="text-gray-500 hidden sm:block" aria-hidden="true" />
                            )}
                          </div>
                        ))}
                      <MoveRight className="text-gray-500 hidden sm:block" aria-hidden="true" />
                      <Dialog open={openPlus} onOpenChange={setOpenPlus}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-8 h-8 flex justify-center items-center bg-purple-700 text-white rounded-full"
                            onClick={() => handleAddChildWalkaround(Number(chainId))}
                            aria-label={`Add child walkaround for chain ${chainId}`}
                          >
                            +
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Child Walkaround</DialogTitle>
                          </DialogHeader>
                          <PlusWalkaround
                            setOpen={setOpenPlus}
                            refreshWalkarounds={debouncedFetchWalkarounds}
                            parentId={selectedWalkaround?.id || 0}
                            walkaround={selectedWalkaround}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} walkarounds | Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages || totalCount === 0}
              onClick={() => setPage((prev) => prev + 1)}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <WalkaroundDetailsDialog
        walkaround={selectedWalkaround}
        open={openDetailsDialog}
        onOpenChange={setOpenDetailsDialog}
      />
    </div>
  );
};

export default WalkaroundPage;