import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import InspectionDialog from "./expiry/InspectionDialog";
import GenericExpiryDialog from "./expiry/GenericExpiryDialog";

interface ExpiryDatesProps {
  mot_expiry: string;
  tax_expiry: string;
  insurance_expiry: string;
  inspection_expiry: string;
  vehicle_id: number;
  status_indicators: {
    [key: string]: boolean;
    mot_expiring: boolean;
    tax_expiring: boolean;
    insurance_expiring: boolean;
    inspection_due: boolean;
  };
}

// Define valid field keys
type FieldKey = "mot_expiry" | "tax_expiry" | "insurance_expiry" | "inspection_expiry";

const ExpiryDates: React.FC<ExpiryDatesProps> = ({
  mot_expiry,
  tax_expiry,
  insurance_expiry,
  inspection_expiry,
  vehicle_id,
  status_indicators,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldKey | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState("");

  const fieldMap: Record<FieldKey, { value: string | null; apiKey: string; label: string }> = {
    mot_expiry: { value: mot_expiry, apiKey: "mot_expiry", label: "MOT Expiry" },
    tax_expiry: { value: tax_expiry, apiKey: "tax_expiry", label: "Tax Expiry" },
    insurance_expiry: { value: insurance_expiry, apiKey: "insurance_expiry", label: "Insurance Expiry" },
    inspection_expiry: { value: inspection_expiry, apiKey: "inspection_expiry", label: "Inspection Expiry" },
  };

  const handleEditClick = (field: FieldKey, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedField(field);
    setNewExpiryDate(fieldMap[field].value || "");
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedField(null);
    setNewExpiryDate("");
  };

  const handleUpdateSuccess = () => {
    if (selectedField) {
      toast({
        title: "Success",
        description: `${fieldMap[selectedField].label} updated successfully`,
      });
    }
    handleDialogClose();
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Expiry Dates</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {Object.keys(fieldMap).map((field) => (
                <div
                  key={field}
                  className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                    status_indicators[(field as FieldKey).replace("_expiry", "_expiring") || "inspection_due"]
                      ? "bg-red-50 border-red-400"
                      : "bg-orange-50 border-orange-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        status_indicators[(field as FieldKey).replace("_expiry", "_expiring") || "inspection_due"]
                          ? "bg-red-400"
                          : "bg-orange-400"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-700">{fieldMap[field as FieldKey].label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {fieldMap[field as FieldKey].value || "Not assigned"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => handleEditClick(field as FieldKey, event)}
                      aria-label={`Edit ${fieldMap[field as FieldKey].label}`}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {selectedField === "inspection_expiry" ? (
        <InspectionDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          expiryDate={newExpiryDate}
          vehicleId={vehicle_id}
          onUpdateSuccess={handleUpdateSuccess}
        />
      ) : (
        selectedField && (
          <GenericExpiryDialog
            open={isDialogOpen}
            onClose={handleDialogClose}
            field={fieldMap[selectedField]}
            vehicleId={vehicle_id}
            expiryDate={newExpiryDate}
            onUpdateSuccess={handleUpdateSuccess}
          />
        )
      )}
    </div>
  );
};

export default ExpiryDates;