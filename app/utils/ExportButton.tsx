import { Download } from "lucide-react";
import ExcelJS from "exceljs";

interface ExportButtonProps {
  data: Array<Record<string, any>>;
  fileName?: string;
}

// Flatten nested objects and prettify keys
const flattenObject = (obj: Record<string, any>, prefix = ""): Record<string, string> => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix
      ? `${prefix} ${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`
      : key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...acc, ...flattenObject(value, newKey) };
    }
    return { ...acc, [newKey]: value };
  }, {});
};

const ExportButton: React.FC<ExportButtonProps> = ({ data, fileName = "exported_data" }) => {
  const handleExport = async () => {
    const flattenedData = data.map(item => flattenObject(item));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Add header row
    const headers = Object.keys(flattenedData[0]);
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: Math.max(header.length, ...flattenedData.map(row => String(row[header] || "").length)) + 2,
    }));

    // Add data rows
    flattenedData.forEach(row => worksheet.addRow(row));

    // Create file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 h-[45px] border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-200"
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  );
};

export default ExportButton;
