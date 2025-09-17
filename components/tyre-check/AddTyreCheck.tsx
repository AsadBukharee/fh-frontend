import React, { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface TyreData {
  [key: string]: string | number | null | undefined;
}

interface TyreCheckRow {
  id: number;
  tyre_check_date: string;
  depth: TyreData;
  torque: TyreData;
  check_date: TyreData;
  pressure: TyreData;
  physical_document: string | null;
  created_at: string;
  updated_at: string;
  vehicles: number;
  vehicle_type: number;
  assignee: number;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicles_type: { id: number; name: string };
}

interface Manager {
  id: number;
  full_name: string;
}

interface AddTyreCheckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newTyreCheck: TyreCheckRow) => void;
  tyreColumns: string[];
}

const AddTyreCheckDialog: FC<AddTyreCheckDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  tyreColumns,
}) => {
  const token = useCookies().get("access_token");
  const [formData, setFormData] = useState<Partial<TyreCheckRow>>({
    tyre_check_date: "",
    vehicles: undefined,
    vehicle_type: undefined,
    assignee: undefined,
    depth: {},
    pressure: {},
    torque: {},
    check_date: {},
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- fetch vehicles/managers
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const vehiclesRes = await fetch(`${API_URL}/api/vehicles/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const managersRes = await fetch(`${API_URL}/users/list-names/?role=manager`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!vehiclesRes.ok || !managersRes.ok) throw new Error("Failed to load data");

        const vData = await vehiclesRes.json();
        const mData = await managersRes.json();
        setVehicles(vData.data);
        setManagers(mData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, token]);

  // --- auto-set vehicle_type
  useEffect(() => {
    if (formData.vehicles) {
      const selected = vehicles.find((v) => v.id === formData.vehicles);
      if (selected) {
        setFormData((prev) => ({ ...prev, vehicle_type: selected.vehicles_type.id }));
      }
    }
  }, [formData.vehicles, vehicles]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/activity/tyre-check/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to create tyre check");

      const newTyreCheck: TyreCheckRow = await response.json();
      onAdd(newTyreCheck);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Tyre Check</DialogTitle>
          
        </DialogHeader>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="animate-spin h-5 w-5 mr-2" /> Loading...
          </div>
        ) : (
          <div className="space-y-6">
            {/* General Info Section */}
            <Card>
              <CardContent className="grid gap-4 p-4">
                <h3 className="text-lg font-semibold">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={formData.tyre_check_date || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, tyre_check_date: e.target.value })
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <Select
                    value={formData.vehicles?.toString() || ""}
                    onValueChange={(v) => setFormData({ ...formData, vehicles: Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.registration_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.vehicle_type?.toString() || ""}
                    onValueChange={(v) => setFormData({ ...formData, vehicle_type: Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Vehicle Type" /></SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(vehicles.map((v) => v.vehicles_type.id))).map((id) => {
                        const type = vehicles.find((v) => v.vehicles_type.id === id)?.vehicles_type;
                        return <SelectItem key={id} value={id.toString()}>{type?.name}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.assignee?.toString() || ""}
                    onValueChange={(v) => setFormData({ ...formData, assignee: Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Assign To" /></SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tyre Data Section */}
            <Card>
              <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold">Tyre Measurements</h3>
                <div className="space-y-4">
                  {tyreColumns.map((col) => (
                    <div key={col} className="grid grid-cols-4 gap-4 items-center border-b pb-2">
                      <span className="font-medium">{col}</span>
                      <Input
                        type="number"
                        placeholder="Pressure PSI"
                        value={formData.pressure?.[col] ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, pressure: { ...formData.pressure, [col]: e.target.value } })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Depth mm"
                        value={formData.depth?.[col] ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, depth: { ...formData.depth, [col]: e.target.value } })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Torque Nm"
                        value={formData.torque?.[col] ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, torque: { ...formData.torque, [col]: e.target.value } })
                        }
                      />
                      <Input
                        type="date"
                        value={formData.check_date?.[col] ?? ""}
                        max={formData.tyre_check_date || new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setFormData({ ...formData, check_date: { ...formData.check_date, [col]: e.target.value } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white">
            {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />} Add Tyre Check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTyreCheckDialog;
