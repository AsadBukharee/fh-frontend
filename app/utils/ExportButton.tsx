import { useState, useRef } from "react";
import { Download, BarChart3, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { pdf, Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
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

// Function to clean data - extract meaningful values from objects and remove functions
const cleanDataItem = (item: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  
  Object.keys(item).forEach(key => {
    const value = item[key];
    
    // Skip function definitions
    if (typeof value === 'string' && value.includes('=>') && value.includes('if (run.traveled_mileage')) {
      return; // Skip this field
    }
    
    // Handle objects - extract meaningful values
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // For vehicle object
      if (key === 'vehicle' && value.name) {
        cleaned[key] = value.name;
        cleaned['vehicle_id'] = value.id || '';
        cleaned['vehicle_last_mileage'] = value.last_mileage || '';
      }
      // For driver object
      else if (key === 'driver' && value.name) {
        cleaned[key] = value.name;
        cleaned['driver_id'] = value.id || '';
      }
      // For stops array
      else if (key === 'stops' && Array.isArray(value)) {
        cleaned['stop_count'] = value.length;
        cleaned['total_stop_mileage'] = value.reduce((sum, stop) => sum + (stop.mileage || 0), 0);
      }
      // For other objects, try to extract useful properties
      else {
        // Try to get string representation
        if (value.name) cleaned[`${key}_name`] = value.name;
        if (value.id) cleaned[`${key}_id`] = value.id;
        if (value.value !== undefined) cleaned[key] = value.value;
      }
    } 
    // Handle arrays (except stops which we already handled)
    else if (Array.isArray(value)) {
      cleaned[`${key}_count`] = value.length;
    }
    // Handle primitive values
    else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

// Calculate traveled mileage based on your logic
const calculateTraveledMileage = (run: Record<string, any>): number => {
  // If traveled_mileage exists and is valid
  if (run.traveled_mileage && parseFloat(run.traveled_mileage) > 0) {
    return parseFloat(run.traveled_mileage);
  }
  
  // If end_mileage and vehicle last_mileage exist
  if (run.end_mileage && run.vehicle?.last_mileage) {
    const end = parseFloat(run.end_mileage);
    const start = parseFloat(run.vehicle.last_mileage);
    if (!isNaN(end) && !isNaN(start)) {
      return end - start;
    }
  }
  
  // Calculate from stops
  if (run.stops && Array.isArray(run.stops)) {
    return run.stops.reduce((sum: number, stop: any) => {
      return sum + (parseFloat(stop.mileage) || 0);
    }, 0);
  }
  
  return 0;
};

const flattenObject = (obj: Record<string, any>, prefix = ""): Record<string, string> => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix
      ? `${prefix} ${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`
      : key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...acc, ...flattenObject(value, newKey) };
    }
    return { ...acc, [newKey]: String(value || "") };
  }, {});
};

const formatXAxisValue = (value: any) => {
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.includes("-")) {
      return date.toLocaleDateString();
    }
  }
  return value;
};

const ExportButton: React.FC<ExportChartButtonProps> = ({
  data,
  fileName = "exported_data"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Clean and prepare chart data
  const chartData = data.map(item => {
    const cleaned = cleanDataItem(item);
    
    // Add calculated mileage if not present
    if (!cleaned.traveled_mileage || parseFloat(cleaned.traveled_mileage) === 0) {
      const calculatedMileage = calculateTraveledMileage(item);
      cleaned.traveled_mileage = calculatedMileage;
    }
    
    // Format date for X-axis
    if (cleaned.created_at) {
      cleaned.formatted_date = formatXAxisValue(cleaned.created_at);
    }
    
    return cleaned;
  });

  // Get chart configuration from cleaned data
  const xAxisKey = chartData.length > 0 ? Object.keys(chartData[0]).find(key => 
    key.includes('date') || key.includes('created') || key === 'formatted_date'
  ) : 'formatted_date';

  // Find numeric fields for Y-axis (excluding IDs and boolean fields)
  const yAxisKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(key => {
    if (key.includes('id') || key.includes('is_') || key === xAxisKey) return false;
    
    const sampleValue = chartData[0][key];
    const numValue = parseFloat(sampleValue);
    return !isNaN(numValue) && typeof numValue === 'number';
  }) : [];

  // If no numeric fields found, use traveled_mileage
  if (yAxisKeys.length === 0 && chartData.length > 0) {
    yAxisKeys.push('traveled_mileage');
  }

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleExportExcel = async () => {
    try {
      // Dynamically import ExcelJS to avoid SSR issues
      const ExcelJS = (await import("exceljs")).default;
      
      // Clean data before flattening
      const cleanedData = data.map(item => cleanDataItem(item));
      const flattenedData = cleanedData.map(item => flattenObject(item));

      // Check if we have data to export
      if (flattenedData.length === 0 || Object.keys(flattenedData[0]).length === 0) {
        console.warn("No data to export");
        alert("No data available for export.");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      const headers = Object.keys(flattenedData[0]);
      worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: Math.max(header.length, ...flattenedData.map(row => String(row[header] || "").length)) + 2,
      }));

      flattenedData.forEach(row => worksheet.addRow(row));

      // Use the correct method to write buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      
      // Fallback: Create a simple CSV export
      if (data && data.length > 0) {
        const cleanedData = data.map(item => cleanDataItem(item));
        const headers = Object.keys(cleanedData[0]);
        const csvContent = [
          headers.join(","),
          ...cleanedData.map(row => 
            headers.map(header => {
              const value = row[header];
              // Handle special characters in CSV
              return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
                ? `"${value.replace(/"/g, '""')}"`
                : String(value || '');
            }).join(",")
          )
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export data. Please try again.");
      }
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    
    setIsGenerating(true);
    try {
      // Get the SVG element from recharts
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        setIsGenerating(false);
        return;
      }

      // Clone and prepare SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", "white");
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      // Create image from SVG
      const htmlImg = new window.Image();
      
      await new Promise((resolve, reject) => {
        htmlImg.onload = resolve;
        htmlImg.onerror = reject;
        htmlImg.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = htmlImg.width * 2;
      canvas.height = htmlImg.height * 2;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(htmlImg, 0, 0, canvas.width, canvas.height);

        const chartImage = canvas.toDataURL("image/png");

        // Create PDF document
        const styles = StyleSheet.create({
          page: { padding: 30, backgroundColor: "#ffffff" },
          title: { fontSize: 24, marginBottom: 20, fontWeight: "bold" },
          image: { width: "100%", height: "auto", marginBottom: 20 },
          table: { width: "100%", marginTop: 20 },
          tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
          tableHeader: { flex: 1, padding: 8, fontWeight: "bold" },
          tableCell: { flex: 1, padding: 8 }
        });

        // Create a simple data table for the PDF using cleaned data
        const cleanedData = data.map(item => cleanDataItem(item));
        const tableHeaders = cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [];
        
        const ChartDocument = () => (
          <Document>
            <Page size="A4" style={styles.page}>
              <Text style={styles.title}>{fileName} Report</Text>
              <Image src={chartImage} style={styles.image} />
              
              {cleanedData.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableRow}>
                    {tableHeaders.slice(0, 5).map((header, index) => (
                      <Text key={index} style={styles.tableHeader}>
                        {header.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </Text>
                    ))}
                  </View>
                  {cleanedData.slice(0, 10).map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.tableRow}>
                      {tableHeaders.slice(0, 5).map((header, cellIndex) => (
                        <Text key={cellIndex} style={styles.tableCell}>
                          {String(row[header] || "")}
                        </Text>
                      ))}
                    </View>
                  ))}
                  {cleanedData.length > 10 && (
                    <Text style={{ marginTop: 10 }}>
                      ... and {cleanedData.length - 10} more records
                    </Text>
                  )}
                </View>
              )}
            </Page>
          </Document>
        );

        const blob = await pdf(<ChartDocument />).toBlob();
        const pdfUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if data is available
  if (!data || data.length === 0) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <BarChart3 className="w-4 h-4" />
        No Data to Export
      </Button>
    );
  }

  // Check if we have valid chart data
  const hasValidChartData = chartData.length > 0 && 
    (yAxisKeys.length > 0 || chartData.some(item => item.traveled_mileage > 0));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl" style={{ colorScheme: "light" }}>
        <DialogHeader>
          <DialogTitle>Data Chart</DialogTitle>
        </DialogHeader>
        
        {hasValidChartData ? (
          <div 
            ref={chartRef} 
            className="mb-4" 
            style={{ 
              height: "400px", 
              width: "100%", 
              backgroundColor: "#ffffff",
              padding: "16px",
              borderRadius: "8px"
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={xAxisKey}
                  tickFormatter={formatXAxisValue}
                  stroke="#6b7280"
                />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  labelFormatter={formatXAxisValue}
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
                />
                <Legend />
                {yAxisKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    name={key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-4 p-8 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No numeric data available for chart visualization.</p>
            <p className="text-gray-400 text-sm mt-2">
              The data contains object references and function definitions that cannot be plotted.
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            className="gap-2"
            disabled={isGenerating || !hasValidChartData}
          >
            <FileText className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
          <Button onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportButton;