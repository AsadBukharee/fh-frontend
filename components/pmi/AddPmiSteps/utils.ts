export const tyrePositions = [
  "OSF",
  "NSF",
  "OSR_Outer",
  "NSR_Outer",
  "OSR_Inner",
  "NSR_Inner",
];

export const getSafetyColor = (
  value: number | string | null | undefined,
  field: string
): string => {
  if (value === null || value === undefined || isNaN(Number(value)) || value === "")
    return "bg-gray-100 text-gray-800";

  const numValue = Number(value);

  if (field === "tyre_depth") {
    if (numValue < 1.5) return "bg-red-100 p-2 border border-gray-200 rounded hover:border-gray-500 text-red-800";
    if (numValue <= 2) return "bg-orange-100 p-2 border border-gray-200 rounded hover:border-gray-500 text-orange-800";
    if (numValue <= 8) return "bg-green-100 p-2 border border-gray-200 rounded hover:border-gray-500 text-green-800";
    return "bg-gray-100 text-gray-800 p-2 border border-gray-200 rounded hover:border-gray-500";
  }

  if (field === "tyre_pressure") {
    if (numValue < 25 || numValue > 50) return "bg-red-100 p-2 border border-gray-200 rounded hover:border-gray-500 text-red-800";
    if (
      (numValue >= 26 && numValue <= 28) ||
      (numValue >= 44 && numValue <= 48)
    )
      return "bg-orange-100 text-orange-800";
    if (numValue >= 29 && numValue <= 42) return "bg-green-100  p-2 border border-gray-200 rounded hover:border-gray-500 text-green-800";
    return "bg-gray-100 text-gray-800";
  }

  if (field === "tyre_torque") {
    if (numValue < 50 || numValue > 150) return "bg-red-100 p-2 border border-gray-200 rounded hover:border-gray-500 text-red-800";
    if (
      (numValue >= 50 && numValue <= 70) ||
      (numValue >= 130 && numValue <= 150)
    )
      return "bg-orange-100 text-orange-800";
    if (numValue >= 71 && numValue <= 129) return "bg-green-100 p-2 border border-gray-200 rounded hover:border-gray-500 text-green-800";
    return "bg-gray-100 text-gray-800 p-2 border border-gray-200 rounded hover:border-gray-500";
  }

  return "bg-gray-100 text-gray-800 p-2 border border-gray-200 rounded hover:border-gray-500";
};
