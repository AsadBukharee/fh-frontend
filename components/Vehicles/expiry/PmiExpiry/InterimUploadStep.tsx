import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FileUploader from "@/components/Media/MediaUpload";

interface InterimUploadStepProps {
  handleUploadSuccess: (url: string, type: "certificate" | "interim" | "brake") => void;
  handleInterimUpload: () => void;
  interimCertificate: string | null;
  isLoading: boolean;
}

const InterimUploadStep: React.FC<InterimUploadStepProps> = ({
  handleUploadSuccess,
  handleInterimUpload,
  interimCertificate,
  isLoading,
}) => (
  <div>
    <Label htmlFor="interimCertificate" className="text-sm font-medium">
      Upload Interim PMI Sign Off Certificate
    </Label>
    <FileUploader
      id="interimCertificate"
      accept=".pdf,.png,.jpg,.jpeg"
      maxSize={5 * 1024 * 1024}
      onUploadSuccess={(url) => handleUploadSuccess(url, "interim")}
    />
    <Button onClick={handleInterimUpload} disabled={isLoading || !interimCertificate} className="mt-3 w-full">
      {isLoading ? "Processing..." : "Submit Interim Certificate"}
    </Button>
  </div>
);

export default InterimUploadStep;