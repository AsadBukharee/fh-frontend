import { FC } from "react";
import { cn } from "@/lib/utils";
import { FormData, FormErrors } from "./types";
import { getSafetyColor, tyrePositions } from "./utils";

interface TyreDepthStepProps {
  formData: FormData;
  formErrors: FormErrors;
  debouncedHandleTyreChange: (
    field: "tyre_pressure" | "tyre_depth" | "tyre_date" | "tyre_torque",
    position: string,
    value: string
  ) => void;
}

const TyreDepthStep: FC<TyreDepthStepProps> = ({
  formData,
  formErrors,
  debouncedHandleTyreChange,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 3 : </span> Tyre Depth
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tyrePositions.map((pos) => (
          <div key={pos}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tyre Depth {pos} (mm)
            </label>
            <input
              type="number"
              defaultValue={formData.tyre_depth[pos]}
              onChange={(e) =>
                debouncedHandleTyreChange("tyre_depth", pos, e.target.value)
              }
              className={cn(
                "w-full p-2 border rounded",
                getSafetyColor(formData.tyre_depth[pos], "tyre_depth"),
                formErrors.tyre_depth?.[pos] && "border-red-500"
              )}
            />
            {formErrors.tyre_depth?.[pos] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors.tyre_depth[pos]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TyreDepthStep;
