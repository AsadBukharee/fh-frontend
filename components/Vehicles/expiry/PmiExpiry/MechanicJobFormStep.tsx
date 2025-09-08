import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MechanicJobFormStepProps {
  vehicleRegistration: string;
  username: string;
  vehicleStatus: string | null;
  setVehicleStatus: (value: string) => void;
  handleMechanicJobSubmit: () => void;
  isLoading: boolean;
}

const MechanicJobFormStep: React.FC<MechanicJobFormStepProps> = ({
  vehicleRegistration,
  username,
  vehicleStatus,
  setVehicleStatus,
  handleMechanicJobSubmit,
  isLoading,
}) => (
  <div className="space-y-4">
    <div className="bg-gray-50 p-4 rounded-lg border">
      <p className="font-medium mb-3 text-gray-800">Mechanic Job Sheet (Pre-populated)</p>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        <div>Defects: <span className="font-medium">Detected during PMI</span></div>
        <div>Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></div>
        <div>Vehicle Registration: <span className="font-medium">{vehicleRegistration}</span></div>
        <div>Username: <span className="font-medium">{username}</span></div>
        <div>Time: <span className="font-medium">{new Date().toLocaleTimeString()}</span></div>
      </div>
    </div>
    <div>
      <Label htmlFor="vehicleStatus" className="text-sm font-medium">Vehicle Status</Label>
      <Select onValueChange={setVehicleStatus}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select vehicle status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Minor Defect Roadworthy">Minor Defect Roadworthy</SelectItem>
          <SelectItem value="Minor Defect Unroadworthy">Minor Defect Unroadworthy</SelectItem>
          <SelectItem value="Major Defect Unroadworthy">Major Defect Unroadworthy</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Button onClick={handleMechanicJobSubmit} disabled={isLoading || !vehicleStatus} className="w-full">
      {isLoading ? "Processing..." : "Submit Mechanic Job"}
    </Button>
  </div>
);

export default MechanicJobFormStep;