import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import FileUploader from "@/components/Media/MediaUpload";

interface GenericExpiryDialogProps {
  open: boolean;
  onClose: () => void;
  field: { value: string | null; apiKey: string; label: string };
  vehicleId: number;
  expiryDate: string;
  onUpdateSuccess?: () => void;
}

const GenericExpiryDialog: React.FC<GenericExpiryDialogProps> = ({
  open,
  onClose,
  field,
  vehicleId,
  expiryDate,
  onUpdateSuccess,
}) => {
  const [newExpiryDate, setNewExpiryDate] = useState(expiryDate);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSuccess = (url: string) => {
    setDocumentUrl(url);
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    });
  };

  const handleUpdate = async () => {
    if (!newExpiryDate) {
      toast({
        title: "Error",
        description: "Please select a valid date",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
    formData.append(field.apiKey, newExpiryDate);
    if (documentUrl) formData.append("document_url", documentUrl);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/api/vehicles/${vehicleId}/`,
        { method: "PUT", body: formData }
      );
      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update expiry date",
          variant: "destructive",
        });
        throw new Error("Failed to update expiry date");
      }

      onUpdateSuccess?.();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update expiry date",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent className="bg-white p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit {field.label}</DialogTitle>
            <DialogDescription>
              Update the expiry date for {field.label}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="expiryDate">Select New Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div>
              <Label htmlFor="document">Upload Document (Optional)</Label>
              <FileUploader
                id="document"
                accept=".pdf,.png,.jpg,.jpeg"
                maxSize={5 * 1024 * 1024}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default GenericExpiryDialog;