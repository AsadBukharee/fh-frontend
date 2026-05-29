import { FC } from "react";
import { cn } from "@/lib/utils";
import { FormData, FormErrors } from "./types";
import { getSafetyColor, tyrePositions } from "./utils";

interface TyreDateStepProps {
  formData: FormData;
  formErrors: FormErrors;
  debouncedHandleTyreChange: (
    field: "tyre_pressure" | "tyre_depth" | "tyre_date" | "tyre_torque",
    position: string,
    value: string
  ) => void;
}

const TyreDateStep: FC<TyreDateStepProps> = ({
  formData,
  formErrors,
  debouncedHandleTyreChange,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 4 : </span> Tyre Date & Torque
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tyrePositions.map((pos) => (
          <div key={pos}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tyre Date {pos} (YYWW)
            </label>
            <input
              defaultValue={formData.tyre_date[pos]}
              onChange={(e) =>
                debouncedHandleTyreChange("tyre_date", pos, e.target.value)
              }
              placeholder="e.g., 2325"
              className={cn(
                "w-full p-2 border rounded hover:border-gray-500",
                formErrors.tyre_date?.[pos] && "border-red-500"
              )}
            />
            {formErrors.tyre_date?.[pos] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.tyre_date[pos]}
              </p>
            )}
          </div>
        ))}
        {tyrePositions?.map((pos) => (
          <div key={pos}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tyre Torque {pos} (Nm)
            </label>
            <input
              type="number"
              defaultValue={formData?.tyre_torque[pos]}
              onChange={(e) =>
                debouncedHandleTyreChange("tyre_torque", pos, e.target.value)
              }
              className={cn(
                "w-full p-2 border rounded hover:border-gray-500",
                getSafetyColor(formData.tyre_torque[pos], "tyre_torque"),
                formErrors.tyre_torque?.[pos] && "border-red-500"
              )}
            />
            {formErrors.tyre_torque?.[pos] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.tyre_torque[pos]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TyreDateStep;
