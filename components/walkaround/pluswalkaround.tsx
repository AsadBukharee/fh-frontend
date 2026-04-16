"use client";

import { useState, useEffect, useCallback } from "react";
import { useCookies } from "next-client-cookies";
import API_URL from "@/app/utils/ENV";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import WalkaroundQuestions from "./WalkaroundQuestions"; // Import WalkaroundQuestions (assumed to be in the same directory)
import { Car, Gauge, User, CircleCheck } from "lucide-react";

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
    last_mileage: string | null;
  };
  conducted_by: string | null;
  walkaround_assignee: string | null;
  status:
  | "pending"
  | "completed"
  | "failed"
  | "minor_roadworthy_defect"
  | "minor_unroadworthy_defect"
  | "major_unroadworthy_defect"
  | "in_progress"
  | "further_work_required";

  date: string;
  time: string;
  mileage: number;
  notes?: string;
  walkaround_step?: number;
}

interface Profile {
  id: number;
  full_name: string;
  avatar: string | null;
  email: string;
  sites: { id: number; name: string }[];
}



interface PlusWalkaroundProps {
  setOpen: (open: boolean) => void;
  refreshWalkarounds: () => void;
  parentId: number;
  walkaround: Walkaround | null;
}

// Reused WalkaroundQuestion component from Addwalkaround
const WalkaroundQuestion: React.FC<{
  isOpen: boolean;
  onComplete: () => void;
  walkaroundId: number | null;
  vehicleId: number | null;
  vehicleTypeId: number | null;
  managers: Profile[];
}> = ({ isOpen, onComplete, walkaroundId, vehicleId, vehicleTypeId, managers }) => {
  if (!isOpen) return null;
  return (
    <WalkaroundQuestions
      walkaroundId={walkaroundId}
      vehicleId={vehicleId}
      vehicleTypeId={vehicleTypeId}
      onComplete={onComplete}
      managers={managers}
    />
  );
};

const PlusWalkaround = ({
  setOpen,
  refreshWalkarounds,
  parentId,
  walkaround,
}: PlusWalkaroundProps) => {
  const previousMileageBaseline = Math.max(
    Number(walkaround?.mileage ?? 0),
    Number(walkaround?.vehicle.last_mileage ?? 0)
  );

  const [formData, setFormData] = useState({
    driver: walkaround?.driver.id.toString() || "",
    vehicle: walkaround?.vehicle.id.toString() || "",
    mileage: walkaround?.vehicle.last_mileage || "",
    walkaround_step: ((walkaround?.walkaround_step || 0) + 1).toString(),
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [showQuestion, setShowQuestion] = useState(false); // State for WalkaroundQuestions dialog
  const [walkaroundId, setWalkaroundId] = useState<number | null>(null); // Store created walkaround ID
  const [vehicleId, setVehicleId] = useState<number | null>(null); // Store vehicle ID
  // FIX 5: vehicleTypeId is derived from the walkaround prop — no vehicle API needed
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null);
  const cookies = useCookies();
  const { toast } = useToast();

  // FIX 5: Only fetch drivers and managers — vehicle is pre-known from the walkaround prop
  const fetchProfiles = useCallback(async (
    type: string,
    setData: React.Dispatch<React.SetStateAction<Profile[]>>
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/users/list-names/?role=${type}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}s: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setErrors({ [type]: result.message || `Failed to fetch ${type}s` });
      }
    } catch (err) {
      setErrors({
        [type]:
          err instanceof Error
            ? err.message
            : `An error occurred while fetching ${type}s`,
      });
    }
  }, [cookies]);

  useEffect(() => {
    fetchProfiles("driver", setDrivers);
    fetchProfiles("manager", setManagers);
  }, [fetchProfiles]);

  // FIX 5: Derive vehicleTypeId from the walkaround prop directly (no vehicles list needed)
  useEffect(() => {
    if (walkaround) {
      // vehicle_type_id is not in the Walkaround interface — set to null and let the
      // WalkaroundQuestions component handle fetching by vehicleId instead
      setVehicleTypeId(null);
    }
  }, [walkaround]);

  const formatName = (name: string): string =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setLoading(true);

    const newErrors: Partial<typeof formData> = {};
    if (!formData.driver) newErrors.driver = "Driver is required.";
    if (!formData.vehicle) newErrors.vehicle = "Vehicle is required.";
    if (!formData.mileage) newErrors.mileage = "Mileage is required.";
    if (
      formData.mileage &&
      previousMileageBaseline > 0 &&
      Number(formData.mileage) < previousMileageBaseline
    ) {
      newErrors.mileage = `Mileage cannot be less than previous mileage (${previousMileageBaseline}).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const now = new Date();
    const payload = {
      driver: parseInt(formData.driver, 10),
      vehicle: parseInt(formData.vehicle, 10),
      status: "completed",
      mileage: parseFloat(formData.mileage),
      walkaround_step: parseInt(formData.walkaround_step, 10),
      walkaround_assignee: null,
      conducted_by: parseInt(formData.driver, 10),
      parent: parentId,
      signature: null,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0].slice(0, 5),
      note: null,
    };

    try {
      const response = await fetch(`${API_URL}/api/walk-around/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Child walkaround added successfully",
        });

        // Extract walkaround ID and vehicle ID from the response
        const createdWalkaroundId = result.data.id;
        const createdVehicleId = result.data.vehicle.id;

        // Set the data for the questions component
        setWalkaroundId(createdWalkaroundId);
        setVehicleId(createdVehicleId);

        // Show the question dialog
        setShowQuestion(true);
      } else {
        const errorData = await response.json();
        setFormError(
          errorData.message?.vehicle?.[0] ||
          errorData.message?.driver?.[0] ||
          "Failed to add child walkaround"
        );
        toast({
          title: "Error",
          description:
            errorData.message?.vehicle?.[0] ||
            errorData.message?.driver?.[0] ||
            "Failed to add child walkaround",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      setFormError("An error occurred while adding the child walkaround");
      toast({
        title: "Error",
        description: "An error occurred while adding the child walkaround",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionComplete = () => {
    // Reset form and close everything after questions are completed
    setFormData({
      driver: walkaround?.driver.id.toString() || "",
      vehicle: walkaround?.vehicle.id.toString() || "",
      mileage: walkaround?.vehicle.last_mileage || "",
      walkaround_step: ((walkaround?.walkaround_step || 0) + 1).toString(),
    });
    setShowQuestion(false);
    refreshWalkarounds();
    setOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Plus Walkaround</h2>
              <p className="mt-1 text-sm text-gray-500">
                Continue with the same guided flow: setup, questions, summary.
              </p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-orange-700">Progress</p>
              <p className="text-sm font-semibold text-orange-800">
                {[Boolean(formData.driver), Boolean(formData.vehicle), Boolean(formData.mileage)].filter(Boolean).length}/3
              </p>
            </div>
          </div>
        </div>

        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Car className="h-4 w-4 text-orange-500" />
            Step 1: Vehicle
          </div>
          <Label>Vehicle</Label>
          <div className="flex h-11 w-full items-center rounded-md border border-input bg-gray-100 px-3 text-sm">
            {walkaround?.vehicle.registration_number || "N/A"} ({walkaround?.vehicle.vehicles_type_name || "N/A"})
          </div>
          {errors.vehicle && <div className="text-red-500 text-sm">{errors.vehicle}</div>}
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <User className="h-4 w-4 text-orange-500" />
            Step 2: Driver
          </div>
          <Label>Driver</Label>
          <Select
            value={formData.driver}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, driver: value }));
              setErrors((prev) => ({ ...prev, driver: undefined }));
              setFormError(null);
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id.toString()}>
                  {`${formatName(driver.full_name)} (${driver.sites
                    .map((site) => site.name)
                    .join(", ")})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Current:{" "}
            {walkaround?.driver.full_name || walkaround?.driver.email || "N/A"}
          </p>
          {errors.driver && <div className="text-red-500 text-sm">{errors.driver}</div>}
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Gauge className="h-4 w-4 text-orange-500" />
            Step 3: Mileage
          </div>
          <Label>Mileage</Label>
          <Input
            type="number"
            name="mileage"
            value={formData.mileage}
            onChange={(e) => {
              handleFormChange(e);
              if (previousMileageBaseline > 0 && Number(e.target.value) < previousMileageBaseline) {
                setErrors((prev) => ({
                  ...prev,
                  mileage: `Mileage cannot be less than previous mileage (${previousMileageBaseline}).`,
                }));
              }
            }}
            step="0.1"
            min={previousMileageBaseline > 0 ? previousMileageBaseline : 0}
          />
          <p className="text-sm text-gray-500 mt-1">
            Previous walkaround: {walkaround?.mileage || "N/A"} | Vehicle&apos;s last recorded: {walkaround?.vehicle.last_mileage || "N/A"}
          </p>
          {errors.mileage && <div className="text-red-500 text-sm">{errors.mileage}</div>}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Next: Questions -&gt; Summary -&gt; Optional Mechanic Job.</p>
          <p className="mt-1 text-xs text-gray-500">Assignee, signature, and defect notes are completed in summary.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            {loading ? "Adding..." : "Add Child Walkaround"}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <CircleCheck className="h-4 w-4 text-green-500" />
          Same flow as Add Walkaround
        </div>
      </form>

      {/* WalkaroundQuestion Dialog */}
      <WalkaroundQuestion
        isOpen={showQuestion}
        onComplete={handleQuestionComplete}
        walkaroundId={walkaroundId}
        vehicleId={vehicleId}
        vehicleTypeId={vehicleTypeId}
        managers={managers}
      />
    </>
  );
};

export default PlusWalkaround;
