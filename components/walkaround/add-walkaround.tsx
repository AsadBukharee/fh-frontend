import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "../ui/input";

interface WalkAround {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Addwalkaround: React.FC<WalkAround> = ({ setOpen }) => {
  const [formData, setFormData] = useState({
    walkaround_step: "one",
    conducted_by: "",
    driver: "",
    walkaround_assignee: "", // Initialize as empty string
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mapWalkaroundStepToInt = (step: string): number => {
    const stepMap: { [key: string]: number } = {
      one: 1,
      two: 2,
      three: 3,
    };
    return stepMap[step] || 1;
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.driver || !formData.vehicle || !formData.milage) {
      setError("Driver, vehicle, and milage are required.");
      setLoading(false);
      return;
    }

    const payload = {
      driver: parseInt(formData.driver, 10),
      vehicle: parseInt(formData.vehicle, 10),
      status: formData.status,
      milage: parseFloat(formData.milage),
      walkaround_step: mapWalkaroundStepToInt(formData.walkaround_step),
      walkaround_assignee:
        formData.walkaround_assignee && formData.walkaround_assignee !== "none"
          ? parseInt(formData.walkaround_assignee, 10)
          : null,
      signature: formData.signature || null,
    };

    try {
      const response = await fetch("{{HOST}}/api/walk-around/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${yourToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create walkaround: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Walkaround created:", result);

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
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      {/* Walkaround Step */}
      <div>
        <Label>Walkaround Step</Label>
        <Select
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

      {/* Conducted By */}
      <div>
        <Label>Conducted By</Label>
        <Select
          value={formData.conducted_by}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, conducted_by: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">User 1</SelectItem>
            <SelectItem value="2">User 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Driver */}
      <div>
        <Label>Driver</Label>
        <Select
          value={formData.driver}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, driver: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Driver 1</SelectItem>
            <SelectItem value="2">Driver 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Walkaround Assignee */}
      <div>
        <Label>Walkaround Assignee</Label>
        <Select
          value={formData.walkaround_assignee}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, walkaround_assignee: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="1">Assignee 1</SelectItem>
            <SelectItem value="2">Assignee 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle */}
      <div>
        <Label>Vehicle</Label>
        <Select
          value={formData.vehicle}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, vehicle: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Vehicle 1</SelectItem>
            <SelectItem value="2">Vehicle 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleFormChange}
        />
      </div>

      {/* Time */}
      <div>
        <Label>Time</Label>
        <Input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleFormChange}
        />
      </div>

      {/* Milage */}
      <div>
        <Label>Milage</Label>
        <Input
          type="number"
          name="milage"
          value={formData.milage}
          onChange={handleFormChange}
          step="0.1"
          min="0"
        />
      </div>

      {/* Signature */}
      <div>
        <Label>Signature</Label>
        <Textarea
          name="signature"
          value={formData.signature}
          onChange={handleFormChange}
          placeholder="Enter signature or leave blank"
        />
      </div>

      {/* Note */}
      <div>
        <Label>Note</Label>
        <Textarea
          name="note"
          value={formData.note}
          onChange={handleFormChange}
        />
      </div>

      {/* Defects */}
      <div>
        <Label>Defects</Label>
        <Textarea
          name="defects"
          value={formData.defects}
          onChange={handleFormChange}
        />
      </div>

      {/* Walkaround Duration */}
      <div>
        <Label>Walkaround Duration</Label>
        <Input
          type="text"
          name="walkaround_duration"
          value={formData.walkaround_duration}
          onChange={handleFormChange}
        />
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Walkaround"}
      </Button>
    </form>
  );
};

export default Addwalkaround;