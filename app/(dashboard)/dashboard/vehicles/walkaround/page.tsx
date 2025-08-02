"use client";
import { Eye, Search, Car } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface Walkaround {
  id: number;
  driver: {
    full_name: string;
  };
  vehicle: {
    registration_number: string;
  };
  status: "pending" | "failed" | "completed";
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
};

const getStatusForName = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/30";
    case "pending":
      return "bg-yellow-500/30";
    case "failed":
      return "bg-red-500/30";
    default:
      return "bg-gray-300/30";
  }
};

const WalkaroundPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [walkarounds, setWalkarounds] = useState<Walkaround[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cookies=useCookies()

  // Fetch data from API
  useEffect(() => {
    const fetchWalkarounds = async () => {
      try {
        const response = await fetch(`${API_URL}/api/walk-around/`,{
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.get("access_token")}`,
            },
        });
        const result = await response.json();
        if (result.success) {
          setWalkarounds(result.data.data);
        } else {
          setError("Failed to fetch walkarounds.");
        }
      } catch (err) {
        console.log(err);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchWalkarounds();
  }, []);

  // Filter walkarounds based on search term
  const filteredWalkarounds = walkarounds.filter(
    (walkaround) =>
      walkaround.vehicle.registration_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      walkaround.driver.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Vehicle Walkaround
          </h1>
          <p className="text-sm text-gray-500 mb-4">Vehicle Walkaround</p>

          {/* Search Input */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search vehicle or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </div>

        {/* Walkaround Cards */}
        <div className="space-y-3">
          {filteredWalkarounds.map((walkaround) => (
            <Card key={walkaround.id} className="border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3">
                {/* Left: Vehicle Icon and Plate */}
                <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
                  <Car className="text-gray-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {walkaround.vehicle.registration_number}
                  </span>
                </div>

                {/* Center: Driver Progress Step */}
                <div className="flex-1 flex justify-center">
                  <div className="flex flex-col items-center">
                    {/* Status Circle */}
                    <div
                      className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-semibold ${getStatusClasses(
                        walkaround.status
                      )}`}
                    >
                      {walkaround.id}
                    </div>
                    {/* Driver Name */}
                    <span
                      className={`text-xs text-gray-600 mt-1 py-1 px-4 rounded-2xl font-medium ${getStatusForName(
                        walkaround.status
                      )}`}
                    >
                      {walkaround.driver.full_name}
                    </span>
                  </div>
                </div>

                {/* Right: View Button */}
                <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                  <span className="text-xs text-gray-500 font-medium">View</span>
                  <Eye className="text-gray-500 w-4 h-4 cursor-pointer hover:text-gray-700 transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredWalkarounds.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500">
              No walkarounds found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkaroundPage;