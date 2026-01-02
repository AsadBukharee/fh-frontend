import { useState } from "react";
import { Download, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ExcelJS from "exceljs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExportChartButtonProps {
  data: Array<Record<string, any>>;
  fileName?: string;
}

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

 export const ExportChartButton: React.FC<ExportChartButtonProps> = ({
  data,
  fileName = "exported_data"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-detect keys
  const xAxisKey = Object.keys(data[0] || {})[0];
  const yAxisKeys = Object.keys(data[0] || {}).filter(key => 
    key !== xAxisKey && typeof data[0][key] === "number"
  );

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleExport = async () => {
    const flattenedData = data.map(item => flattenObject(item));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    const headers = Object.keys(flattenedData[0]);
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: Math.max(header.length, ...flattenedData.map(row => String(row[header] || "").length)) + 2,
    }));

    flattenedData.forEach(row => worksheet.addRow(row));

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Data Chart</DialogTitle>
        </DialogHeader>
        
        <div className="h-[400px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yAxisKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

