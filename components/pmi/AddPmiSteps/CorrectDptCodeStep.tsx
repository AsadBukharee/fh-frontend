import { FC } from "react";
import { FormData } from "./types";

interface CorrectDptCodeStepProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: string | number | Record<string, string | number>) => void;
}

const CorrectDptCodeStep: FC<CorrectDptCodeStepProps> = ({ formData, handleChange }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 6 : </span> Correct DPT Code
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct DTP Code Used
          </label>
          <input
            className="w-full p-2 border border-gray-200 rounded hover:border-gray-500"
            value={formData.Correct_DTP_Code_Used}
            onChange={(e) => handleChange("Correct_DTP_Code_Used", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default CorrectDptCodeStep;
