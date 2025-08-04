
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Filter, Download, Loader2, AlertCircle } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";

// Interface for the Number data
interface NumberData {
  id: number;
  location: {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    zip_code: string;
    address: string;
    city: string;
    state: string;
    country: string;
    created_at: string;
    updated_at: string;
  };
  location_name: string;
  vehicle: {
    id: number;
    registration_number: string;
    vehicles_type_name: string;
    site_allocated: {
      id: number;
      name: string;
      status: string;
      image: string;
    };
  };
  vehicle_registration: string;
  in_count: number;
  out_count: number;
  spillover: number;
  created_at: string;
  updated_at: string;
}

// Interface for location data
interface Location {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  zip_code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  created_at: string;
  updated_at: string;
}

// Interface for pagination
interface Pagination {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  page_size: number;
}

// Interface for filters
interface Filters {
  date_from: string;
  location_name: string;
  in_count_min: number;
  spillover_min: number;
  page: number;
  page_size: number;
}

export default function NumbersPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [numbers, setNumbers] = useState<NumberData[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 5,
  });
  const [filters, setFilters] = useState<Filters>({
    date_from: "2024-01-01",
    location_name: "London",
    in_count_min: 10,
    spillover_min: 2,
    page: 1,
    page_size: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();
  const cookies = useCookies();

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters,
        in_count_min: filters.in_count_min.toString(),
        spillover_min: filters.spillover_min.toString(),
        page: filters.page.toString(),
        page_size: filters.page_size.toString(),
        ...(searchQuery && { q: encodeURIComponent(searchQuery) }),
      }).toString();

      const response = await fetch(`${API_URL}/api/su/?${query}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setNumbers(data.data.results);
        setPagination(data.data.pagination);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch numbers");
        showToast(data.message || "Failed to fetch numbers", "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching numbers";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [cookies, showToast, filters, searchQuery]);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/locations/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setLocations(data.data);
      } else {
        showToast(data.message || "Failed to fetch locations", "error");
        setLocations([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching locations";
      showToast(errorMessage, "error");
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }, [cookies, showToast]);

  useEffect(() => {
    fetchNumbers();
    fetchLocations();
  }, [fetchNumbers, fetchLocations]);

  const handleFilterChange = (name: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleMouseMove = (key: string) => (e: React.MouseEvent) => {
    const button = buttonRefs.current[key];
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      button.style.setProperty("--mouse-x", `${x}%`);
      button.style.setProperty("--mouse-y", `${y}%`);
    }
  };

  return (
    <div className="p-6 bg-white">
      <header className="bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SU Numbers Dashboard</h1>
            <p className="text-sm text-gray-500">View and filter vehicle movement data</p>
          </div>
          <div className="space-x-2 h-[40px] flex">
            <button className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={fetchNumbers}
              disabled={loading}
              className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="date_from" className="block text-sm font-medium text-gray-700">
            Date From
          </Label>
          <Input
            id="date_from"
            name="date_from"
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange("date_from", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <Label htmlFor="location_name" className="block text-sm font-medium text-gray-700">
            Location Name
          </Label>
          {locationsLoading ? (
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading locations...</span>
            </div>
          ) : (
            <Select
              name="location_name"
              value={filters.location_name}
              onValueChange={(value) => handleFilterChange("location_name", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No locations available
                  </SelectItem>
                ) : (
                  locations.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.address} {location.city}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label htmlFor="in_count_min" className="block text-sm font-medium text-gray-700">
            Min In Count
          </Label>
          <Input
            id="in_count_min"
            name="in_count_min"
            type="number"
            value={filters.in_count_min}
            onChange={(e) => handleFilterChange("in_count_min", Number(e.target.value))}
            placeholder="Enter min in count"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <Label htmlFor="spillover_min" className="block text-sm font-medium text-gray-700">
            Min Spillover
          </Label>
          <Input
            id="spillover_min"
            name="spillover_min"
            type="number"
            value={filters.spillover_min}
            onChange={(e) => handleFilterChange("spillover_min", Number(e.target.value))}
            placeholder="Enter min spillover"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
      </div>

      <div className="mb-6">
        <div
          className="relative w-80 gradient-border cursor-glow"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
            e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
          }}
        >
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
          <Input
            placeholder="Search numbers"
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading numbers...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 gradient-border cursor-glow">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-gray-600 font-medium">ID</TableHead>
                <TableHead className="text-gray-600 font-medium">Location</TableHead>
                <TableHead className="text-gray-600 font-medium">Vehicle</TableHead>
                <TableHead className="text-gray-600 font-medium">In Count</TableHead>
                <TableHead className="text-gray-600 font-medium">Out Count</TableHead>
                <TableHead className="text-gray-600 font-medium">Spillover</TableHead>
                <TableHead className="text-gray-600 font-medium">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map((number) => (
                <TableRow key={number.id} className="border-b border-gray-100">
                  <TableCell className="font-medium">{number.id}</TableCell>
                  <TableCell>{number.location_name}</TableCell>
                  <TableCell>{number.vehicle_registration}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">{number.in_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-700">{number.out_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-700">{number.spillover}</Badge>
                  </TableCell>
                  <TableCell>{new Date(number.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Page</span>
          <Badge variant="outline" className="bg-gray-100">
            {pagination.current_page}
          </Badge>
          <span className="text-sm text-gray-600">of {pagination.total_pages}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            ref={(el) => {
              buttonRefs.current["prev"] = el;
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
            onMouseMove={handleMouseMove("prev")}
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1 relative z-10" />
            <span className="relative z-10">Previous</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["page1"] = el;
            }}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white ripple cursor-glow"
            onMouseMove={handleMouseMove("page1")}
          >
            <span className="relative z-10">{pagination.current_page}</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["next"] = el;
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
            onMouseMove={handleMouseMove("next")}
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.total_pages || loading}
          >
            <span className="relative z-10">Next</span>
            <ChevronRight className="w-4 h-4 ml-1 relative z-10" />
          </Button>
        </div>
      </div>
    </div>
  );
}
