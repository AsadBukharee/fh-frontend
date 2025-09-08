import React from "react";
import { Button } from "@/components/ui/button";

interface FHPMIStepProps {
  handleFHPMISubmit: () => void;
  isLoading: boolean;
}

const FHPMIStep: React.FC<FHPMIStepProps> = ({ handleFHPMISubmit, isLoading }) => (
  <Button onClick={handleFHPMISubmit} disabled={isLoading} className="w-full">
    {isLoading ? "Processing..." : "OK - Open FH PMI Analysis"}
  </Button>
);

export default FHPMIStep;