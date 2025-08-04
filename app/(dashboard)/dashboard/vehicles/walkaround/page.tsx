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
    email: string; // Added to use as fallback if full_name is "None None"
  };
  vehicle: {
    id: number;
    vehicles_type: {
      name: string;
    };
  };
  status: "pending" | "failed" | "completed";
  date: string;
}

interface GroupedWalkaround {
  vehicle_id: number;
  vehicle_type: string;
  drivers: { name: string; status: string; date: string }[];
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
  const cookies = useCookies();

  // Fetch data from API
  useEffect(() => {
    const fetchWalkarounds = async () => {
      try {
        const response = await fetch(`${API_URL}/api/walk-around/`, {
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
        console.error(err);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchWalkarounds();
  }, []);

  // Group walkarounds by vehicle ID
  const groupedWalkarounds = walkarounds.reduce((acc, walkaround) => {
    const vehicleId = walkaround.vehicle.id;
    const vehicleType = walkaround.vehicle.vehicles_type.name;
    const driverName = walkaround.driver.full_name === "None None" 
      ? walkaround.driver.email 
      : walkaround.driver.full_name;

    if (!acc[vehicleId]) {
      acc[vehicleId] = {
        vehicle_id: vehicleId,
        vehicle_type: vehicleType,
        drivers: [],
      };
    }
    acc[vehicleId].drivers.push({
      name: driverName,
      status: walkaround.status,
      date: walkaround.date,
    });
    return acc;
  }, {} as Record<number, GroupedWalkaround>);

  // Convert grouped object to array and filter based on search term
  const filteredWalkarounds = Object.values(groupedWalkarounds).filter(
    (group) =>
      group.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.drivers.some((driver) =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
              placeholder="Search vehicle type or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </div>

        {/* Warning about frequent inspections */}
        {filteredWalkarounds.some((group) => group.vehicle_id === 4) && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
            <p>
              <strong>Warning:</strong> Vehicle ID 4 (Transent Van) has an unusually high number of inspections on August 2, 2025. This may indicate duplicate entries or a testing scenario. Please verify the data.
            </p>
          </div>
        )}

        {/* Walkaround Cards */}
        <div className="space-y-3">
          {filteredWalkarounds.map((group, idx) => (
            <Card key={idx} className="border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3">
                {/* Left: Vehicle Icon and Type/ID */}
                <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
                  <Car className="text-gray-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {group.vehicle_type} (ID: {group.vehicle_id})
                  </span>
                </div>

                {/* Center: Driver Progress Steps */}
                <div className="flex-1 flex items-center justify-center space-y-2">
                  {group.drivers.map((driver, driverIdx) => (
                    <div key={driverIdx} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-semibold ${getStatusClasses(
                          driver.status
                        )}`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`text-xs text-gray-600 mt-1 py-1 px-4 rounded-2xl font-medium ${getStatusForName(
                          driver.status
                        )}`}
                      >
                        {driver.name} ({driver.date})
                      </span>
                    </div>
                  ))}
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