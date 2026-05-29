import { FC } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormData } from "./types";

interface BrakeTestStepProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: string | number | Record<string, string | number>) => void;
}

const BrakeTestStep: FC<BrakeTestStepProps> = ({ formData, handleChange }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <span className="text-orange-500">Step 5 : </span> Brake Test & Value
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brake Imbalance
          </label>
          <input
            className="w-full p-2 border border-gray-200 rounded hover:border-gray-500"
            value={formData.brake_imbalance}
            onChange={(e) => handleChange("brake_imbalance", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brake Imbalance Note
          </label>
          <input
            className="w-full p-2 border border-gray-200 rounded hover:border-gray-500"
            value={formData.brake_imbalance_note}
            onChange={(e) => handleChange("brake_imbalance_note", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brake Test Not Recorded
          </label>
          <RadioGroup
            value={formData.brake_test_not_recorded}
            onValueChange={(value) => handleChange("brake_test_not_recorded", value)}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="brake_test_not_recorded_yes" />
              <Label htmlFor="brake_test_not_recorded_yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="brake_test_not_recorded_no" />
              <Label htmlFor="brake_test_not_recorded_no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NA" id="brake_test_not_recorded_na" />
              <Label htmlFor="brake_test_not_recorded_na">NA</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brake Test Report Attached
          </label>
          <RadioGroup
            value={formData.brake_test_report_attached}
            onValueChange={(value) => handleChange("brake_test_report_attached", value)}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="brake_test_report_attached_yes" />
              <Label htmlFor="brake_test_report_attached_yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="brake_test_report_attached_no" />
              <Label htmlFor="brake_test_report_attached_no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NA" id="brake_test_report_attached_na" />
              <Label htmlFor="brake_test_report_attached_na">NA</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Error Answer
          </label>
          <RadioGroup
            value={formData.maintenance_error_answer}
            onValueChange={(value) => handleChange("maintenance_error_answer", value)}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="maintenance_error_answer_yes" />
              <Label htmlFor="maintenance_error_answer_yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="maintenance_error_answer_no" />
              <Label htmlFor="maintenance_error_answer_no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NA" id="maintenance_error_answer_na" />
              <Label htmlFor="maintenance_error_answer_na">NA</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Error Note
          </label>
          <input
            className="w-full p-2 border border-gray-200 rounded hover:border-gray-500"
            value={formData.maintenance_error_note}
            onChange={(e) => handleChange("maintenance_error_note", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BrakeTestStep;
