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
      Upload Interiam PMI Certificate
    </Label>
    <FileUploader
      id="interimCertificate"
      accept=".pdf,.png,.jpg,.jpeg"
      maxSize={10 * 1024 * 1024}
      onUploadSuccess={(url) => handleUploadSuccess(url, "interim")}
    />
    {interimCertificate && (
      <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100 mt-2">
        ✓ Interiam PMI Certificate uploaded successfully
      </div>
    )}
  </div>
);

export default InterimUploadStep;