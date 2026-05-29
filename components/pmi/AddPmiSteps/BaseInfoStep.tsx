import { FC } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { DatePickerField } from "../../ui/DatePicker";
import { FormData, FormErrors, Vehicle } from "./types";

interface BaseInfoStepProps {
  formData: FormData;
  formErrors: FormErrors;
  handleChange: (field: keyof FormData, value: string | number | Record<string, string | number>) => void;
  handleVehicleChange: (vehicleId: string) => void;
  vehiclesLoading: boolean;
  memoizedVehicles: Vehicle[];
  handleFileUploadSuccess: (url: string) => void;
}

const BaseInfoStep: FC<BaseInfoStepProps> = ({
  formData,
  formErrors,
  handleChange,
  handleVehicleChange,
  vehiclesLoading,
  memoizedVehicles,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 1 : </span> PMI Base Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehicle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle
          </label>
          <Select
            value={formData.vehicle.toString()}
            onValueChange={handleVehicleChange}
            disabled={vehiclesLoading}
            aria-required="true"
          >
            <SelectTrigger className={cn(formErrors.vehicle && "border-red-500")}>
              <SelectValue
                placeholder={vehiclesLoading ? "Loading vehicles..." : "Select a vehicle"}
              />
            </SelectTrigger>
            <SelectContent>
              {memoizedVehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.registration_number} ({vehicle.vehicle_type_name})
                  {vehicle.warnings.length > 0 && (
                    <span className="ml-2 text-red-500">
                      ⚠️ {vehicle.warnings.length} issues
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.vehicle && (
            <p className="text-red-500 text-sm mt-1">{formErrors.vehicle}</p>
          )}
        </div>

        {/* PMI Report Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PMI Report Date
          </label>
          <DatePickerField
            label="PMI Report Date"
            value={formData.analysis_date}
            onDateSelected={(date) =>
              handleChange("analysis_date", format(date, "yyyy-MM-dd"))
            }
            startDate={-36500}
            lastDate={0}
            validator={(val) => (!val ? "Enter PMI report date" : undefined)}
          />
          {formErrors.analysis_date && (
            <p className="text-red-500 text-sm mt-1">{formErrors.analysis_date}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseInfoStep;
