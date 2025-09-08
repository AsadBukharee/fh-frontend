import React from "react";
import { Button } from "@/components/ui/button";

interface DriverPMIOpenStepProps {
  vehicleRegistration: string;
  username: string;
  handleDriverPMIComplete: () => void;
}

const DriverPMIOpenStep: React.FC<DriverPMIOpenStepProps> = ({ vehicleRegistration, username, handleDriverPMIComplete }) => (
  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
    <p className="text-sm font-medium mb-3 text-green-800">Driver PMI Analysis Form</p>
    <div className="space-y-2 text-sm text-green-700">
      <div className="grid grid-cols-2 gap-2">
        <div>Vehicle Registration: <span className="font-medium">{vehicleRegistration}</span></div>
        <div>Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></div>
        <div>Username: <span className="font-medium">{username}</span></div>
        <div>Status: <span className="font-medium text-green-600">Form Ready</span></div>
      </div>
    </div>
    <Button onClick={handleDriverPMIComplete} className="mt-4 w-full" size="sm">
      Submit Driver PMI Analysis
    </Button>
  </div>
);

export default DriverPMIOpenStep;