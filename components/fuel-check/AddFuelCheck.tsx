"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import FileUploader from "../Media/MediaUpload";

interface Vehicle {
  id: number;
  registration_number: string;
}
interface Driver {
  id: number
  full_name: string
}
interface Card {
  id: number;
  title: string;
  card_number: string;
}

interface FuelLog {
  driver_data: object;
  vehicle_data: { id: number; registration_number: string; vehicles_type_name: string; last_mileage: string; purchase_mileage: string | null; mileage_unit: string; mileage_in_km: number | null; mileage_in_miles: number | null; site_allocated: { id: number; name: string; status: string; image: string; }[]; };
  id: number;
  vehicle: {
    id: number;
    registration_number: string;
    vehicles_type_name: string;
    last_mileage: string;
    site_allocated: { id: number; name: string; status: string; image: string } | null;
  } | null;
  date: string;
  time: string;
  vehicle_photo: string | null;
  driver: number;
  card: number | null;
  card_data: { title: string; card_number: string } | null;
  amount: number;
  cost: number;
  receipt: string | null;
  notes: string;
}

interface AddFuelLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newLog: FuelLog) => void;
  initialData?: FuelLog | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  cards: Card[];
}

export default function AddFuelLogDialog({
  isOpen,
  onClose,
  onAdd,
  initialData,
  vehicles,
  drivers,
  cards,
}: AddFuelLogDialogProps) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    date: "",
    time: "",
    amount: "",
    cost: "",
    notes: "",
    card_id: "none",
    driver_id: "none",
    vehicle_photo: null as string | null, // Changed to store URL
    receipt: null as string | null, // Changed to store URL
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cookies = useCookies();

  // Initialize formData with initialData if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        vehicle_id:
          initialData.vehicle && typeof initialData.vehicle.id !== "undefined"
            ? initialData.vehicle.id.toString()
            : "",
        date: initialData.date.split("T")[0],
        time: initialData.time.slice(0, 5),
        amount: initialData.amount.toString(),
        cost: initialData.cost.toString(),
        notes: initialData.notes,
        card_id: initialData.card ? initialData.card.toString() : "none",
        driver_id: initialData.driver ? initialData.driver.toString() : "none",
        vehicle_photo: initialData.vehicle_photo,
        receipt: initialData.receipt,
      });
    } else {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      setFormData({
        vehicle_id: "",
        date: currentDate,
        time: currentTime,
        amount: "",
        cost: "",
        notes: "",
        card_id: "none",
        driver_id: "none",
        vehicle_photo: null,
        receipt: null,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      setError("No access token found. Please log in again.");
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.vehicle_id) {
      setError("Vehicle is required");
      setLoading(false);
      return;
    }
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      setError("Valid amount is required");
      setLoading(false);
      return;
    }
    if (!formData.cost || isNaN(parseFloat(formData.cost))) {
      setError("Valid cost is required");
      setLoading(false);
      return;
    }

    try {
      const method = initialData ? "PUT" : "POST";
      const url = initialData ? `${API_URL}/activity/fuel-log/${initialData.id}/` : `${API_URL}/activity/fuel-log/`;
      const formDataToSend = new FormData();
      formDataToSend.append("vehicle", formData.vehicle_id);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("time", formData.time);
      formDataToSend.append("amount", formData.amount);
      formDataToSend.append("cost", formData.cost);
      formDataToSend.append("notes", formData.notes);
      if (formData.card_id !== "none") {
        formDataToSend.append("card", formData.card_id);
      }
      if (formData.driver_id !== "none") {
        formDataToSend.append("driver", formData.driver_id);
      }
      if (formData.vehicle_photo) {
        formDataToSend.append("vehicle_photo", formData.vehicle_photo);
      }
      if (formData.receipt) {
        formDataToSend.append("receipt", formData.receipt);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Error submitting fuel log: ${response.status} ${response.statusText}`, text.slice(0, 100));
        throw new Error(`Failed to ${initialData ? "update" : "add"} fuel log: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        onAdd(data.data);
        setFormData({
          vehicle_id: "",
          date: "",
          time: "",
          amount: "",
          cost: "",
          notes: "",
          card_id: "none",
          driver_id: "none",
          vehicle_photo: null,
          receipt: null,
        });
        onClose();
      } else {
        setError(data.message || `Failed to ${initialData ? "update" : "add"} fuel log`);
      }
    } catch (error: any) {
      console.error(`Error ${initialData ? "updating" : "adding"} fuel log:`, error);
      setError(error.message || `An error occurred while ${initialData ? "updating" : "adding"} the fuel log`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVehiclePhotoUpload = (url: string) => {
    handleChange("vehicle_photo", url);
  };

  const handleReceiptUpload = (url: string) => {
    handleChange("receipt", url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Fuel Log" : "Add Fuel Log"}</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicle_id">Vehicle *</Label>
            <Select
              value={formData.vehicle_id}
              onValueChange={(value) => handleChange("vehicle_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.registration_number}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No vehicles available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="driver_id">Driver (Required)</Label>
            <Select
              value={formData.driver_id}
              onValueChange={(value) => handleChange("driver_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.full_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No drivers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="card_id">Card Used (Required)</Label>
            <Select
              value={formData.card_id}
              onValueChange={(value) => handleChange("card_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {cards.length > 0 ? (
                  cards.map((card) => (
                    <SelectItem key={card.id} value={card.id.toString()}>
                      {card.title} ({card.card_number})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No cards available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount (Liters) *</Label>
            <Input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              step="0.01"
              required
            />
          </div>
          <div>
            <Label htmlFor="cost">Cost (£) *</Label>
            <Input
              type="number"
              id="cost"
              value={formData.cost}
              onChange={(e) => handleChange("cost", e.target.value)}
              step="0.01"
              required
            />
          </div>
          <div>
            <Label htmlFor="vehicle_photo">Vehicle Photo (Required)</Label>
            <FileUploader
              id="vehicle_photo"
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              onUploadSuccess={handleVehiclePhotoUpload}
            />
          </div>
          <div>
            <Label htmlFor="receipt">Receipt (Required)</Label>
            <FileUploader
              id="receipt"
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              onUploadSuccess={handleReceiptUpload}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (Required)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Log" : "Add Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}