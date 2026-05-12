import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import FileUploader from "@/components/Media/MediaUpload";
import { StepType } from "./types";

interface UploadStepProps {
  handleUploadSuccess: (url: string, type: "certificate" | "interim" | "brake") => void;
  handleCertificateUpload: () => void;
  setStep: (step: StepType) => void;
  documentUrl: string | null;
  isLoading: boolean;
}

const UploadStep: React.FC<UploadStepProps> = ({ 
  handleUploadSuccess, 
  handleCertificateUpload,
  setStep,
  documentUrl,
  isLoading
}) => (
  <div className="space-y-3">
    <div className="space-y-2">
      <Label htmlFor="certificate" className="text-sm font-medium">Upload PMI Certificate</Label>
      <FileUploader
        id="certificate"
        accept=".pdf,.png,.jpg,.jpeg"
        maxSize={5 * 1024 * 1024}
        onUploadSuccess={(url) => handleUploadSuccess(url, "certificate")}
      />
      {documentUrl && (
        <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center gap-2">
          <span>✓ Document uploaded successfully</span>
        </div>
      )}
    </div>
  </div>
);

export default UploadStep;