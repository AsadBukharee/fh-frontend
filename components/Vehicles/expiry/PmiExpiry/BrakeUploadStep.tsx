import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FileUploader from "@/components/Media/MediaUpload";

interface BrakeUploadStepProps {
  handleUploadSuccess: (url: string, type: "certificate" | "interim" | "brake") => void;
  handleFinalUpload: (type: "pmi" | "brake") => void;
  documentUrl: string | null;
  isLoading: boolean;
}

const BrakeUploadStep: React.FC<BrakeUploadStepProps> = ({
  handleUploadSuccess,
  handleFinalUpload,
  documentUrl,
  isLoading,
}) => (
  <div>
    <Label htmlFor="brakeCertificate" className="text-sm font-medium">
      Upload New Brake Test Certificate
    </Label>
    <FileUploader
      id="brakeCertificate"
      accept=".pdf,.png,.jpg,.jpeg"
      maxSize={5 * 1024 * 1024}
      onUploadSuccess={(url) => handleUploadSuccess(url, "brake")}
    />
    <Button onClick={() => handleFinalUpload("brake")} disabled={isLoading || !documentUrl} className="mt-3 w-full">
      {isLoading ? "Processing..." : "Complete Process"}
    </Button>
  </div>
);

export default BrakeUploadStep;