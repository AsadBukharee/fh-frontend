import { FC } from "react";
import { cn } from "@/lib/utils";
import { FormData, FormErrors } from "./types";
import { getSafetyColor, tyrePositions } from "./utils";

interface TyrePressureStepProps {
  formData: FormData;
  formErrors: FormErrors;
  debouncedHandleTyreChange: (
    field: "tyre_pressure" | "tyre_depth" | "tyre_date" | "tyre_torque",
    position: string,
    value: string
  ) => void;
}

const TyrePressureStep: FC<TyrePressureStepProps> = ({
  formData,
  formErrors,
  debouncedHandleTyreChange,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 2 : </span> Tyre Pressure
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tyrePositions.map((pos) => (
          <div key={pos}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tyre Pressure {pos} (PSI)
            </label>
            <input
              type="number"
              defaultValue={formData.tyre_pressure[pos]}
              onChange={(e) =>
                debouncedHandleTyreChange("tyre_pressure", pos, e.target.value)
              }
              className={cn(
                "w-full p-2 border rounded",
                getSafetyColor(formData.tyre_pressure[pos], "tyre_pressure"),
                formErrors.tyre_pressure?.[pos] && "border-red-500"
              )}
            />
            {formErrors.tyre_pressure?.[pos] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.tyre_pressure[pos]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TyrePressureStep;
