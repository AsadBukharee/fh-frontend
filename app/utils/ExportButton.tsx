import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

// Define props interface
interface ExportButtonProps {
  data: Array<Record<string, any>>;
  fileName?: string;
}

// Utility function to flatten nested objects and format keys
const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix} ${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...acc, ...flattenObject(value, newKey) };
    }
    return { ...acc, [newKey]: value };
  }, {});
};

const ExportButton: React.FC<ExportButtonProps> = ({ data, fileName = 'exported_data' }) => {
  const handleExport = () => {
    // Flatten the data
    const flattenedData = data.map(item => flattenObject(item));

    // Create a new worksheet from the flattened data
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);

    // Adjust column widths (optional, for better readability)
    const colWidths = Object.keys(flattenedData[0]).map(key => ({
      wch: Math.max(key.length, ...flattenedData.map(row => String(row[key]).length))
    }));
    worksheet['!cols'] = colWidths;

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
 
      <button    onClick={handleExport} className="px-4 h-[45px] border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-200">
      <Download className="w-4 h-4" />
      Export
    </button>
  );
};

export default ExportButton;