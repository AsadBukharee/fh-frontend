"use client";

import { Eye, Car, Plus, RefreshCcw, User, CalendarDays, Clock, MoveRight, Edit, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GradientButton from "@/app/utils/GradientButton";
import WalkaroundDetailsDialog from "@/components/walkaround/walkaround_detail";
import { format } from "date-fns";
import { formatDmy } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Addwalkaround from "@/components/walkaround/add-walkaround";
import PlusWalkaround from "@/components/walkaround/pluswalkaround";
import WalkaroundQuestionScreen from "@/components/walkaround/WalkaroundQuestionScreen";
import { debounce } from "lodash";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

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
    case "pending":
      return "bg-yellow-200 text-yellow-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const MAX_WALKAROUNDS_PER_CHAIN = 3;

const WalkaroundPage = () => {
  const [walkarounds, setWalkarounds] = useState<Walkaround[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openPlus, setOpenPlus] = useState(false);
  const [selectedWalkaround, setSelectedWalkaround] = useState<Walkaround | null>(null);
  const [activeTab, setActiveTab] = useState("all-check");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const cookies = useCookies();
  const router = useRouter();

  // Function to navigate to details with search params in the format: ?step_1=1&step_2=32&step_3=456
  const navigateToDetailsWithParams = (walkaround: Walkaround) => {
    // Get all walkarounds in the same chain
    const chainWalkarounds = walkarounds.filter(
      (w) => w.chain_id === walkaround.chain_id
    );

    // Sort by walkaround_step to get proper order
    const sortedChainWalkarounds = [...chainWalkarounds].sort(
      (a, b) => (a.walkaround_step || 0) - (b.walkaround_step || 0)
    );

    // Create search params
    const searchParams = new URLSearchParams();

    // Add each step with its ID
    sortedChainWalkarounds.forEach((walk, index) => {
      const stepNumber = index + 1;
      searchParams.append(`step_${stepNumber}`, walk.id.toString());
    });

    // Also add which step is currently being viewed
    const currentStepIndex = sortedChainWalkarounds.findIndex(w => w.id === walkaround.id);
    searchParams.append('current_step', (currentStepIndex + 1).toString());

    // Add total steps
    searchParams.append('total_steps', sortedChainWalkarounds.length.toString());

    // Add chain ID
    if (walkaround.chain_id) {
      searchParams.append('chain_id', walkaround.chain_id.toString());
    }

    // Navigate to details page with search params
    router.push(`/dashboard/vehicles/walkaround/all/${walkaround.id}?${searchParams.toString()}`);
  };

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
    const currentDate = new Date();
    setDateFrom(currentDate);
    setDateTo(currentDate);
    setPage(1);
    setPageSize(50);
    setError(null);
  };

  const handleViewDetails = (walkaround: Walkaround) => {
    setSelectedWalkaround(walkaround);
    setOpenDetailsDialog(true);
  };

  const handleAddChildWalkaround = (chainId: number) => {
    const chainWalkarounds = walkarounds.filter((w) => w.chain_id === chainId);
    const totalInChain = chainWalkarounds.length;

    if (totalInChain >= MAX_WALKAROUNDS_PER_CHAIN) {
      alert(`Maximum of ${MAX_WALKAROUNDS_PER_CHAIN} walkarounds allowed per vehicle chain. Cannot add more.`);
      return;
    }

    const latestWalkaround = chainWalkarounds.reduce((latest, current) => {
      return (current.walkaround_step || 0) > (latest.walkaround_step || 0) ? current : latest;
    }, chainWalkarounds[0]);

    if (latestWalkaround) {
      setSelectedWalkaround(latestWalkaround);
      setOpenPlus(true);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const groupedWalkarounds = useMemo(() => {
    const byChain = walkarounds.reduce((acc, walkaround) => {
      const chainId = walkaround.chain_id || walkaround.id;
      if (!acc[chainId]) {
        acc[chainId] = { root: null, children: [] };
      }
      if (walkaround.parent === null) {
        acc[chainId].root = walkaround;
      } else {
        acc[chainId].children.push(walkaround);
      }
      return acc;
    }, {} as Record<number, { root: Walkaround | null; children: Walkaround[] }>);
    return byChain;
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
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-gray-600">Loading...</div>
        </div>
      )}
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround</h1>
            <p className="text-sm text-gray-500 mb-4">View vehicle walkaround details</p>
          </div>
          <div className="flex gap-4 items-center">
            <Button
              onClick={debouncedFetchWalkarounds}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4  ${loading ? "animate-spin" : ""
                  }`}
              />

            </Button>

          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden mb-4">
            <TabsTrigger
              value="all-check"
              className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              All Check
            </TabsTrigger>
            <TabsTrigger
              value="walkaround-questions"
              className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              Walkaround Questions
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: All Check */}
          <TabsContent value="all-check">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      {dateFrom ? formatDmy(dateFrom) : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      {dateTo ? formatDmy(dateTo) : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      disabled={(date) => (dateFrom ? date < dateFrom : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              {error && <div className="text-red-500 self-center">{error}</div>}
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

            {/* Walkaround List */}
            <div className="space-y-6">
              {Object.entries(groupedWalkarounds).map(([chainId, { root, children }]) => {
                const vehicleInfo = root?.vehicle || children[0]?.vehicle;
                const chainWalkarounds = walkarounds.filter((w) => w.chain_id === Number(chainId));
                const canAddMore = chainWalkarounds.length < MAX_WALKAROUNDS_PER_CHAIN;

                return (
                  <div key={chainId} className="p-4 border border-gray-200 rounded-lg bg-white">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                      Vehicle: {vehicleInfo?.registration_number} ({vehicleInfo?.vehicles_type_name})
                      <Badge className="ml-2 bg-blue-100 text-blue-800">
                        {chainWalkarounds.length} of {MAX_WALKAROUNDS_PER_CHAIN} steps
                      </Badge>
                    </h2>

                    <div className="flex flex-col sm:flex-row bg-white overflow-x-auto items-start sm:items-center gap-4">
                      {/* Root (Step 1) */}
                      {root && (
                        <div className="p-4 shrink-0 rounded-lg shadow m-4 w-fit border border-gray-100 text-left sm:w-64">
                          <h3 className="text-sm font-semibold">Step <span className="text-gray-500">1</span></h3>
                          <p className="text-sm font-semibold">Checker:  <span className="text-gray-500">{root.conducted_by || "N/A"}</span></p>
                          <p className="text-sm font-semibold">
                            Status: <Badge className={getStatusClasses(root.status)}>
                              {root.status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                            </Badge>
                          </p>
                          <p className="text-sm font-semibold">Date: <span className="text-gray-500">{format(new Date(root.date), "dd/MM/yyyy")}</span></p>
                          <p className="text-sm font-semibold">Time: <span className="text-gray-500">{root.time?.slice(0, 5) || "N/A"}</span></p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigateToDetailsWithParams(root)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(root)}>
                              <Edit className="h-4 w-4 mr-1" /> Update
                            </Button>
                          </div>
                        </div>
                      )}

                      {children.length > 0 && <MoveRight className="text-gray-400 hidden sm:block" />}

                      {/* Children (Step 2, Step 3, etc.) */}
                      {children
                        .sort((a, b) => (a.walkaround_step || 0) - (b.walkaround_step || 0))
                        .map((child, idx) => (
                          <div key={child.id} className="flex items-center gap-4">
                            <div className="p-4 shrink-0 rounded-lg shadow m-4 w-fit border border-gray-100 text-left sm:w-64">
                              <h3 className="text-sm font-semibold">Step <span className="text-gray-500">{child.walkaround_step || idx + 2}</span></h3>
                              <p className="text-sm font-semibold">Checker:  <span className="text-gray-500">{child.conducted_by || "N/A"}</span></p>
                              <p className="text-sm font-semibold">
                                Status: <Badge className={getStatusClasses(child.status)}>
                                  {child.status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                </Badge>
                              </p>
                              <p className="text-sm font-semibold">Date: <span className="text-gray-500">{format(new Date(child.date), "dd/MM/yyyy")}</span></p>
                              <p className="text-sm font-semibold">Time: <span className="text-gray-500">{child.time?.slice(0, 5) || "N/A"}</span></p>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateToDetailsWithParams(child)}
                                >
                                  <Eye className="h-4 w-4 mr-1" /> Details
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(child)}>
                                  <Edit className="h-4 w-4 mr-1" /> Update
                                </Button>
                              </div>
                            </div>
                            {idx < children.length - 1 && <MoveRight className="text-gray-400 hidden sm:block" />}
                          </div>
                        ))}

                      {/* Add Button or Limit Indicator */}
                      {canAddMore ? (
                        <Dialog open={openPlus} onOpenChange={setOpenPlus}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-10 h-10 rounded-full bg-purple-700 text-white hover:bg-purple-800 shadow-lg"
                              onClick={() => handleAddChildWalkaround(Number(chainId))}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add Follow-up Walkaround</DialogTitle>
                            </DialogHeader>
                            <PlusWalkaround
                              setOpen={setOpenPlus}
                              refreshWalkarounds={debouncedFetchWalkarounds}
                              parentId={selectedWalkaround?.id || 0}
                              walkaround={selectedWalkaround}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10">
                          <div
                            className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold"
                            title="Maximum 3 walkarounds reached"
                          >
                            MAX
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} walkarounds | Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" disabled={page === totalPages || totalCount === 0} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Walkaround Questions */}
          <TabsContent value="walkaround-questions">
            <WalkaroundQuestionScreen

            />
          </TabsContent>
        </Tabs>
      </div>

      <WalkaroundDetailsDialog
        walkaround={selectedWalkaround}
        open={openDetailsDialog}
        onComplete={fetchWalkarounds}
        onOpenChange={setOpenDetailsDialog}
      />
    </div>
  );
};

export default WalkaroundPage;