
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { debounce } from "lodash";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Eye,
  Trash,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCookies } from "next-client-cookies";
import API_URL from "@/app/utils/ENV";
import BadgeList from "../BadgeList";

import { Label } from "../ui/label";
import EditPMI from "./EditPMIdriver";
import { formatDmy } from "@/lib/utils";


interface PMIRecord {
  id: number;
  pmi: number;
  notes: string;
  status: string;
  vehicle: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  action_taken: string;
  identified_by_driver: boolean;
  defect_previously_noted: boolean;
  pmi_expiry: string;
  vehicle_reg: string;
  defects: string;
  pmi_report_date: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_name: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export default function PMIDashboard() {
  const [pmiData, setPmiData] = useState<PMIRecord[]>([]);
  const [filteredData, setFilteredData] = useState<PMIRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<PMIRecord | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const cookies = useCookies();
  const yourToken = cookies.get("access_token");

  // Debounced search handler
  const debouncedSetSearchTerm = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);
 const fetchPMIData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/activity/pmi-driver/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${yourToken}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch PMI data");
        }
        const data: ApiResponse<PMIRecord[]> = await response.json();
        setPmiData(data.data);
        setFilteredData(data.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error fetching PMI data. Please try again later."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  // Fetch PMI records from API
  useEffect(() => {
   

    fetchPMIData();
  }, [yourToken]);

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      setVehiclesLoading(true);
      setVehiclesError(null);
      try {
        const response = await fetch(`${API_URL}/api/vehicles/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${yourToken}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch vehicles");
        }
        const data: ApiResponse<Vehicle[]> = await response.json();
        setVehicles(data.data);
      } catch (err) {
        setVehiclesError(
          err instanceof Error
            ? err.message
            : "Error fetching vehicles. Please try again later."
        );
        console.error(err);
      } finally {
        setVehiclesLoading(false);
      }
    };

    fetchVehicles();
  }, [yourToken]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = pmiData;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.vehicle_reg?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
          record.defects?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
          record.notes?.toLowerCase().includes(searchTerm?.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [searchTerm, statusFilter, pmiData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "created":
        return (
          <Badge variant="outline">
            <Plus className="w-3 h-3 mr-1" />
            Created
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

 
  const handleDelete = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/activity/pmi-driver/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${yourToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete PMI record");
      }
      setPmiData(pmiData.filter((item) => item.id !== id));
      setDeleteRecordId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error deleting PMI record. Please try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading PMI data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            PMI Driver Dashboard
          </h1>
          <p className="text-muted-foreground">
            Preventive Maintenance Inspection Reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PMI Reports</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {pmiData.length} reports
          </CardDescription>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative w-[300px]">
                <Search className="absolute left-3 top-3 z-4 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle reg, defects, or notes..."
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    debouncedSetSearchTerm(e.target.value)
                  }
                  className="pl-10 w-full"
                  aria-label="Search PMI reports"
                />
              </div>
            </div>
         
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Vehicle Reg</TableHead>
                  <TableHead>Defects</TableHead>
                 
                  <TableHead>Previously Noted</TableHead>
                  <TableHead>Action Required</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.pmi_report_date ? formatDmy(record.pmi_report_date) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className="shrink-0">{record.vehicle_reg}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={record.defects}>
                        <BadgeList value={record.defects} />
                      </div>
                    </TableCell>
                  
                    <TableCell>
                      <Badge
                        variant={
                          record.defect_previously_noted ? "destructive" : "default"
                        }
                      >
                        {record.defect_previously_noted ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={record.action_taken}>
                        {record.action_taken}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Open actions menu"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setViewRecord(record);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {viewRecord && (
                              <DialogContent className="h-[500px] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>PMI Report Details</DialogTitle>
                                  <DialogDescription>
                                    Record ID: {viewRecord.id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div>
                                    <Label>Vehicle Registration</Label>
                                    <p>{viewRecord.vehicle_reg}</p>
                                  </div>
                                  <div>
                                    <Label>Defects</Label>
                                    <p>
                                      <BadgeList value={viewRecord.defects} />
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Notes</Label>
                                    <p>{viewRecord.notes}</p>
                                  </div>
                                  <div>
                                    <Label>Action Taken</Label>
                                    <p>{viewRecord.action_taken}</p>
                                  </div>
                                  <div>
                                    <Label>PMI Expiry</Label>
                                    <p>
                                      {viewRecord.pmi_expiry ? formatDmy(viewRecord.pmi_expiry) : "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => setViewRecord(null)}>
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                          <EditPMI
                            record={record}
                            onEdit={()=>fetchPMIData()}
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDeleteRecordId(record.id);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {deleteRecordId === record.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this PMI report? This
                                    action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setDeleteRecordId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(record.id)}
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredData.length === 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No PMI reports found matching your search criteria.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
