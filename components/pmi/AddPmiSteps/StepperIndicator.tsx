import { FC } from "react";
import { cn } from "@/lib/utils";

interface StepperIndicatorProps {
  step: number;
  steps: string[];
}

const StepperIndicator: FC<StepperIndicatorProps> = ({ step, steps }) => {
  return (
    <div className="mb-8">
      {/* Stepper Circles */}
      <div className="relative flex items-center justify-between px-4 mb-8">
        {/* Connecting line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-gray-200 z-0 px-8" />
        {steps.map((label, index) => {
          const isActive = step === index + 1;
          const isCompleted = step > index + 1;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white",
                  isActive || isCompleted ? "border-red-500" : "border-gray-300"
                )}
              >
                {(isActive || isCompleted) && (
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                )}
              </div>
              <span
                className={cn(
                  "absolute top-10 text-xs font-medium whitespace-nowrap",
                  isActive || isCompleted ? "text-red-500" : "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mt-12 overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${(step / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StepperIndicator;
