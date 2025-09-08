import React from "react";
import { Button } from "@/components/ui/button";

interface DriverPMIStepProps {
  handleDriverPMISubmit: () => void;
  isLoading: boolean;
}

const DriverPMIStep: React.FC<DriverPMIStepProps> = ({ handleDriverPMISubmit, isLoading }) => (
  <Button onClick={handleDriverPMISubmit} disabled={isLoading} className="w-full">
    {isLoading ? "Processing..." : "OK - Open Driver PMI Analysis"}
  </Button>
);

export default DriverPMIStep;