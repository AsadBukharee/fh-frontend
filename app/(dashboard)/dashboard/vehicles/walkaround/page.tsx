"use client";
import { Eye, Search, Car } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Walkaround {
  id: number;
  driver: {
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
  status: "pending" | "failed" | "completed" | "custom";
  date: string;
  time: string;
  milage: number;
}

interface GroupedWalkaround {
  vehicle_id: number;
  vehicle_type: string;
  registration_number: string;
  drivers: {
    name: string;
    conducted_by: string | null;
    walkaround_assignee: string | null;
    status: string;
    date: string;
    time: string;
    milage: number;
  }[];
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "failed":
      return "bg-red-500";
    case "custom":
      return "bg-purple-700";
    default:
      return "bg-gray-300";
  }
};



const WalkaroundPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [walkarounds, setWalkarounds] = useState<Walkaround[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const cookies = useCookies();

  // Form state for the dialog
  const [formData, setFormData] = useState({
    walkaround_step: "one",
    conducted_by: "",
    driver: "",
    walkaround_assignee: "",
    vehicle: "",
    date: "",
    time: "",
    milage: "",
    signature: "",
    note: "",
    defects: "",
    walkaround_duration: "",
    status: "pending",
  });

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
          const mappedWalkarounds = result.data.results.map((item: any) => ({
            id: item.id,
            driver: item.driver,
            vehicle: {
              id: item.vehicle.id,
              vehicles_type_name: item.vehicle.vehicles_type_name,
              registration_number: item.vehicle.registration_number,
            },
            conducted_by: item.conducted_by,
            walkaround_assignee: item.walkaround_assignee,
            status: item.status,
            date: item.date,
            time: item.time,
            milage: item.milage,
          }));
          setWalkarounds(mappedWalkarounds);
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

  const groupedWalkarounds = walkarounds.reduce((acc, walkaround) => {
    const vehicleId = walkaround.vehicle.id;
    const vehicleType = walkaround.vehicle.vehicles_type_name;
    const registrationNumber = walkaround.vehicle.registration_number;
    const driverName =
      walkaround.driver.full_name === "None None"
        ? walkaround.driver.email
        : walkaround.driver.full_name;

    if (!acc[vehicleId]) {
      acc[vehicleId] = {
        vehicle_id: vehicleId,
        vehicle_type: vehicleType,
        registration_number: registrationNumber,
        drivers: [],
      };
    }
    acc[vehicleId].drivers.push({
      name: driverName,
      conducted_by: walkaround.conducted_by,
      walkaround_assignee: walkaround.walkaround_assignee,
      status: walkaround.status,
      date: walkaround.date,
      time: walkaround.time,
      milage: walkaround.milage,
    });
    return acc;
  }, {} as Record<number, GroupedWalkaround>);

  const filteredWalkarounds = Object.values(groupedWalkarounds).filter(
    (group) =>
      group.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.drivers.some((driver) =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for form submission logic
    console.log("Form submitted:", formData);
    setOpen(false);
    setFormData({
      walkaround_step: "one",
      conducted_by: "",
      driver: "",
      walkaround_assignee: "",
      vehicle: "",
      date: "",
      time: "",
      milage: "",
      signature: "",
      note: "",
      defects: "",
      walkaround_duration: "",
      status: "pending",
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround</h1>
          <p className="text-sm text-gray-500 mb-4">Dummy text</p>

          {/* Search Input for Vehicle Number */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search vehicle no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </div>

        {/* Walkaround List */}
        <div className="space-y-6">
          {filteredWalkarounds.map((group, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border-b border-gray-200">
              {/* Left: Vehicle Icon and Registration Number */}
              <div className="flex items-center space-x-3">
                <Car className="text-gray-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">
                  {group.registration_number}
                </span>
              </div>

              {/* Center: Driver Status Circles */}
              <div className="flex items-center space-x-2">
                {group.drivers.map((driver, driverIdx) => (
                  <div key={driverIdx} className="flex flex-col items-center">
                    <span className="text-xs text-gray-600 mt-1">
                      {driver.walkaround_assignee || "N/A"}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getStatusClasses(
                        driver.status
                      )}`}
                    >
                      {driverIdx + 1}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">
                      {driver.conducted_by || "Not conducted"}
                    </span>
                  </div>
                ))}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getStatusClasses(
                        "custom"
                      )} cursor-pointer`}
                    >
                      +
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto ">
                    <DialogHeader>
                      <DialogTitle>Create New Walkaround</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="walkaround_step">Walkaround Step</Label>
                        <Select
                          name="walkaround_step"
                          value={formData.walkaround_step}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, walkaround_step: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select step" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one">One</SelectItem>
                            <SelectItem value="two">Two</SelectItem>
                            <SelectItem value="three">Three</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="conducted_by">Conducted By</Label>
                        <Select
                          name="conducted_by"
                          value={formData.conducted_by}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, conducted_by: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Placeholder options */}
                            <SelectItem value="1">User 1</SelectItem>
                            <SelectItem value="2">User 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="driver">Driver</Label>
                        <Select
                          name="driver"
                          value={formData.driver}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, driver: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Placeholder options */}
                            <SelectItem value="1">Driver 1</SelectItem>
                            <SelectItem value="2">Driver 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="walkaround_assignee">Walkaround Assignee</Label>
                        <Select
                          name="walkaround_assignee"
                          value={formData.walkaround_assignee}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, walkaround_assignee: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Placeholder options */}
                            <SelectItem value="1">Assignee 1</SelectItem>
                            <SelectItem value="2">Assignee 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicle">Vehicle</Label>
                        <Select
                          name="vehicle"
                          value={formData.vehicle}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, vehicle: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Placeholder options */}
                            <SelectItem value="1">Vehicle 1</SelectItem>
                            <SelectItem value="2">Vehicle 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milage">Milage</Label>
                        <Input
                          type="number"
                          name="milage"
                          value={formData.milage}
                          onChange={handleFormChange}
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signature">Signature</Label>
                        <Textarea
                          name="signature"
                          value={formData.signature}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                          name="note"
                          value={formData.note}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="defects">Defects</Label>
                        <Textarea
                          name="defects"
                          value={formData.defects}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="walkaround_duration">Walkaround Duration</Label>
                        <Input
                          type="text"
                          name="walkaround_duration"
                          value={formData.walkaround_duration}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          name="status"
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit">Create Walkaround</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Right: View Button */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">View</span>
                <Eye className="text-gray-500 w-4 h-4 cursor-pointer hover:text-gray-700 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredWalkarounds.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No walkarounds found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkaroundPage;