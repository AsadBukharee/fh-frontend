"use client";

import { Eye, Car, Plus, RefreshCcw, User, CalendarDays, Clock } from "lucide-react";
import { useState, useEffect } from "react";
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

// import type { Walkaround } from "@/types/walkaround";

interface ApiResponse {
  success: boolean;
  data: {
    results: any[];
    count: number;
    next: string | null;
    previous: string | null;
  };
}
interface Walkaround {
  id: number
  driver: {
    id: number
    full_name: string
    email: string
  }
  vehicle: {
    id: number
    vehicles_type_name: string
    registration_number: string
  }
  conducted_by: string | null
  walkaround_assignee: string | null
  status: "pending" | "failed" | "completed" | "custom"
  date: string
  time: string
  mileage: number
  defects?: string
  notes?: string
  walkaround_step?: number
  signature?: string
  parent?: number | null
}

const getStatusClasses = (status: Walkaround["status"]) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-600";
    case "pending":
      return "bg-yellow-100 text-yellow-600";
    case "failed":
      return "bg-red-100 text-red-600";
    case "custom":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-100 text-gray-500";
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
        const mappedWalkarounds = result.data.results.map((step: any) => {
          const conductor = step.conducted_by || { full_name: "None None", email: "unknown" };
          const conductorName = conductor.full_name !== "None None" ? conductor.full_name : conductor.email;
          let assigneeName = null;
          if (step.walkaround_assignee) {
            assigneeName =
              step.walkaround_assignee.full_name !== "None None"
                ? step.walkaround_assignee.full_name
                : step.walkaround_assignee.email;
          }
          return {
            id: step?.id,
            driver: conductor,
            vehicle: {
              id: step.vehicle?.id,
              vehicles_type_name: step.vehicle.vehicles_type_name,
              registration_number: step.vehicle.registration_number,
              site_allocated: step.vehicle.site_allocated,
            },
            conducted_by: conductorName,
            walkaround_assignee: assigneeName,
            status: step.status,
            date: step.date,
            time: step.time,
            mileage: step.milage,
            defects: step.defects || undefined,
            note: step.note || undefined,
            walkaround_step: step.walkaround_step,
            signature: step.signature,
            created_at: step.created_at,
            updated_at: step.updated_at,
            parent: step.parent,
          };
        });
        setWalkarounds(mappedWalkarounds);
        setTotalCount(result.data.count || 0);
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

  const handleViewDetails = (walkaroundData: Walkaround) => {
    setSelectedWalkaround(walkaroundData);
    setOpenDetailsDialog(true);
  };

  const handleAddChildWalkaround = (parentWalkaround: Walkaround) => {
    setSelectedWalkaround(parentWalkaround);
    setOpenPlus(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
        <Button variant="outline" onClick={resetFilters} className="ml-4">
          Reset Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround</h1>
            <p className="text-sm text-gray-500 mb-4">View vehicle walkaround details</p>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      {dateFrom ? format(dateFrom, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      {dateTo ? format(dateTo, "PPP") : "Pick end date"}
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
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
          <div className="flex gap-4 items-center justify-center">
            <RefreshCcw
              className="text-gray-500 hover:text-gray-600 cursor-pointer"
              onClick={debouncedFetchWalkarounds}
            />
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <GradientButton text="Walkaround" Icon={Plus} />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Walkaround</DialogTitle>
                </DialogHeader>
                <Addwalkaround setOpen={setOpenAdd}  />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Walkaround List */}
        <div className="space-y-6">
          {walkarounds
            .sort((a, b) => {
              const dateA = a.date && a.time ? new Date(`${a.date} ${a.time}`) : new Date(0);
              const dateB = b.date && b.time ? new Date(`${b.date} ${b.time}`) : new Date(0);
              return dateB.getTime() - dateA.getTime(); // Descending order
            })
            .map((walkaround) => (
              <div
                key={walkaround.id}
                className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Vehicle: {walkaround.vehicle.registration_number} ({walkaround.vehicle.vehicles_type_name})
                    {walkaround.parent && (
                      <span className="text-sm text-gray-500 ml-2">(Child of Walkaround #{walkaround.parent})</span>
                    )}
                  </h2>
                  <div className="p-5 rounded-2xl w-full max-w-[300px] shadow-md bg-white border border-gray-200 flex flex-col items-center justify-center text-center transition hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-orange-600 underline mb-2">
                      Walkaround #{walkaround.id}
                    </h3>
                    <div className="space-y-1 text-gray-700 text-sm">
                      <p className="flex items-center gap-2 justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                        {walkaround.conducted_by || "N/A"}
                      </p>
                      <p className="flex items-center gap-2 justify-center">
                        <span className="font-medium text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(
                            walkaround.status
                          )}`}
                        >
                          {walkaround.status || "N/A"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2 justify-center">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        {format(new Date(walkaround.date), "dd.MM.yy")}
                      </p>
                      <p className="flex items-center gap-2 justify-center">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {walkaround.time}
                      </p>
                      {walkaround.walkaround_step && (
                        <p className="flex items-center gap-2 justify-center">
                          <span className="font-medium text-gray-600">Step:</span>
                          {walkaround.walkaround_step}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleViewDetails(walkaround)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
                <Dialog open={openPlus} onOpenChange={setOpenPlus}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-8 h-8 flex justify-center items-center bg-purple-700 text-white rounded-full"
                      onClick={() => handleAddChildWalkaround(walkaround)}
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
                      parentId={walkaround.id}
                      walkaround={walkaround}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ))}
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} walkarounds
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages || totalCount === 0}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
        {/* No Results */}
        {walkarounds.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500 mb-2">No walkarounds found.</p>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        )}
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