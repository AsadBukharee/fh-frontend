import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import FileUploader from "@/components/Media/MediaUpload";
import { StepType } from "./types";

interface UploadStepProps {
  handleUploadSuccess: (url: string, type: "certificate" | "interim" | "brake") => void;
  setStep: (step: StepType) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ handleUploadSuccess, setStep }) => (
  <div className="space-y-3">
    <Label htmlFor="certificate" className="text-sm font-medium">Upload PMI Certificate</Label>
    <FileUploader
      id="certificate"
      accept=".pdf,.png,.jpg,.jpeg"
      maxSize={5 * 1024 * 1024}
      onUploadSuccess={(url) => handleUploadSuccess(url, "certificate")}
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        toast({ title: "Upload Later", description: "Proceeding to interim upload process" });
        setStep("interimUpload");
      }}
      className="w-full"
    >
      Upload Later
    </Button>
  </div>
);

export default UploadStep;