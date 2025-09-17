import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DriverTrainingStepProps {
  selectedDrivers: string[];
  setSelectedDrivers: (drivers: string[]) => void;
  handleDriverTrainingSubmit: () => void;
  isLoading: boolean;
}

const DriverTrainingStep: React.FC<DriverTrainingStepProps> = ({
  selectedDrivers,
  setSelectedDrivers,
  handleDriverTrainingSubmit,
  isLoading,
}) => {
  const removeDriver = (driverToRemove: string) => {
    setSelectedDrivers(selectedDrivers.filter(driver => driver !== driverToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <p className="font-medium mb-3 text-orange-800">Driver Walkaround Failure Training Setup</p>
        <p className="text-sm text-orange-700 mb-3">The following actions will be completed:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
          <li>Send training forms to selected drivers</li>
          <li>Message: As you have failed a walkaround, you will be required to complete the Walkaround Failure Training</li>
          <li>Create task for admin to monitor training progress</li>
          <li>Create task for supervisors to action and sign off with drivers</li>
        </ul>
      </div>
      <div>
        <Label htmlFor="drivers" className="text-sm font-medium">Select Drivers for Training</Label>
        <Select onValueChange={(value) => {
          if (!selectedDrivers.includes(value)) {
            setSelectedDrivers([...selectedDrivers, value]);
          }
        }}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select drivers who made errors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="John Smith">John Smith</SelectItem>
            <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
            <SelectItem value="Mike Williams">Mike Williams</SelectItem>
            <SelectItem value="Emma Davis">Emma Davis</SelectItem>
            <SelectItem value="David Wilson">David Wilson</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {selectedDrivers.length > 0 && (
        <div className="bg-white p-3 rounded border">
          <p className="font-medium text-sm mb-2">Selected Drivers ({selectedDrivers.length}):</p>
          <div className="space-y-1">
            {selectedDrivers.map((driver, index) => (
              <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                <span>{driver}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDriver(driver)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button onClick={handleDriverTrainingSubmit} disabled={isLoading || !selectedDrivers.length} className="w-full">
        {isLoading ? "Processing..." : "Complete Training Setup"}
      </Button>
    </div>
  );
};

export default DriverTrainingStep;