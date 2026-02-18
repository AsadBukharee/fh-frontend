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

import { formatToDDMMYYYY } from "./DateFormat";

const formatXAxisValue = (value: any) => {
  if (value instanceof Date) {
    return formatToDDMMYYYY(value);
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.includes("-")) {
      return formatToDDMMYYYY(date);
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

  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

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
      workbook.creator = "Foster Hartley";
      workbook.lastModifiedBy = "Foster Hartley Reporting System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Data", {
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
        views: [{ state: 'frozen', ySplit: 3 }] // Freeze first 3 rows
      });

      const headers = Object.keys(flattenedData[0]);

      // Title rows (Row 1)
      worksheet.mergeCells(1, 1, 1, headers.length);
      const titleRow = worksheet.getCell('A1');
      titleRow.value = `Foster Hartley - ${fileName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Report`;
      titleRow.font = { size: 16, bold: true, color: { argb: 'FF1E293B' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };

      // Generation Date (Row 2)
      worksheet.mergeCells(2, 1, 2, headers.length);
      const dateRow = worksheet.getCell('A2');
      dateRow.value = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      dateRow.font = { size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      dateRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Empty separator row (Row 3)
      worksheet.getRow(3).height = 10;

      // Header row (Row 4)
      const headerRow = worksheet.getRow(4);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDC2626' } // red-600
        };
        cell.alignment = {
          horizontal: index === 0 ? 'left' : 'center',
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB91C1C' } },
          left: { style: 'thin', color: { argb: 'FFB91C1C' } },
          bottom: { style: 'thin', color: { argb: 'FFB91C1C' } },
          right: { style: 'thin', color: { argb: 'FFB91C1C' } }
        };
      });

      // Add data rows starting from Row 5
      flattenedData.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(rowIndex + 5);
        headers.forEach((header, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          cell.value = row[header];
          cell.font = {
            size: 9,
            color: { argb: colIndex === 0 ? 'FF1E293B' : 'FF334155' },
            bold: colIndex === 0
          };
          cell.alignment = {
            horizontal: colIndex === 0 ? 'left' : 'center',
            vertical: 'middle'
          };

          // Alternate row colors
          if (rowIndex % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' } // slate-50
            };
          }

          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });

      // Add footer note
      const footerRowIndex = flattenedData.length + 7;
      worksheet.mergeCells(footerRowIndex, 1, footerRowIndex, headers.length);
      const footerCell = worksheet.getCell(footerRowIndex, 1);
      footerCell.value = 'Confidential - Foster Hartley Internal Use Only';
      footerCell.font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };
      footerCell.alignment = { horizontal: 'center' };

      // Auto-fit columns
      headers.forEach((header, index) => {
        const maxWidth = Math.max(
          header.length,
          ...flattenedData.map(row => String(row[header] || "").length)
        );
        worksheet.getColumn(index + 1).width = Math.min(Math.max(maxWidth + 2, 10), 40);
      });

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
      // Increase resolution for better PDF quality (3x)
      const scaleFactor = 3;
      canvas.width = htmlImg.width * scaleFactor;
      canvas.height = htmlImg.height * scaleFactor;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(htmlImg, 0, 0, canvas.width, canvas.height);

        const chartImage = canvas.toDataURL("image/png", 1.0);

        // Create PDF document
        const styles = StyleSheet.create({
          page: { padding: 40, backgroundColor: "#ffffff", fontFamily: 'Helvetica' },
          header: {
            marginBottom: 20,
            borderBottomWidth: 2,
            borderBottomColor: "#dc2626",
            paddingBottom: 10,
            flexDirection: 'column',
            alignItems: 'center'
          },
          title: { fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
          subtitle: { fontSize: 12, color: "#64748b", marginBottom: 8 },
          metaInfo: { fontSize: 10, color: "#475569" },

          infoSection: {
            backgroundColor: "#f8fafc",
            padding: 15,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: "#dc2626",
          },
          sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 10 },
          infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
          infoItem: { width: '50%', fontSize: 10, color: "#475569", marginBottom: 4 },

          image: { width: "100%", height: "auto", marginBottom: 20, borderRadius: 4, border: '1px solid #e5e7eb' },

          table: { width: "100%", marginTop: 10 },
          tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", minHeight: 25, alignItems: 'center' },
          tableHeaderRow: { flexDirection: "row", backgroundColor: "#dc2626", borderBottomWidth: 1, borderBottomColor: "#b91c1c", minHeight: 30, alignItems: 'center' },
          tableHeader: { flex: 1, padding: 5, color: "#ffffff", fontSize: 10, fontWeight: "bold", textAlign: 'center' },
          tableCell: { flex: 1, padding: 5, fontSize: 9, color: "#334155", textAlign: 'center' },
          tableCellFirst: { flex: 1, padding: 5, fontSize: 9, color: "#1e293b", fontWeight: 'bold', textAlign: 'left' },

          footer: {
            position: 'absolute',
            bottom: 30,
            left: 40,
            right: 40,
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            paddingTop: 10,
            textAlign: 'center',
            fontSize: 9,
            color: "#94A3B8"
          }
        });

        // Create a simple data table for the PDF using cleaned data
        const cleanedData = data.map(item => cleanDataItem(item));
        const tableHeaders = cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [];

        const ChartDocument = () => (
          <Document>
            <Page size="A4" style={styles.page}>
              <View style={styles.header}>
                <Text style={styles.title}>Foster Hartley Reports</Text>
                <Text style={styles.subtitle}>Professional Fleet Management System</Text>
                <Text style={styles.metaInfo}>Report: {fileName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Report Summary</Text>
                <View style={styles.infoGrid}>
                  <Text style={styles.infoItem}>• Generated: {new Date().toLocaleDateString()}</Text>
                  <Text style={styles.infoItem}>• Time: {new Date().toLocaleTimeString()}</Text>
                  <Text style={styles.infoItem}>• Records: {cleanedData.length}</Text>
                  <Text style={styles.infoItem}>• Format: PDF Document</Text>
                </View>
              </View>

              <Image src={chartImage} style={styles.image} />

              {cleanedData.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    {tableHeaders.slice(0, 5).map((header, index) => (
                      <Text key={index} style={styles.tableHeader}>
                        {header.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </Text>
                    ))}
                  </View>
                  {cleanedData.slice(0, 15).map((row, rowIndex) => (
                    <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 ? { backgroundColor: '#f8fafc' } : {}]}>
                      {tableHeaders.slice(0, 5).map((header, cellIndex) => (
                        <Text key={cellIndex} style={cellIndex === 0 ? styles.tableCellFirst : styles.tableCell}>
                          {String(row[header] || "")}
                        </Text>
                      ))}
                    </View>
                  ))}
                  {cleanedData.length > 15 && (
                    <Text style={{ marginTop: 10, fontSize: 9, color: '#64748b', textAlign: 'center' }}>
                      ... and {cleanedData.length - 15} more records (View Excel for full details)
                    </Text>
                  )}
                </View>
              )}

              <Text style={styles.footer}>
                Confidential - Foster Hartley Internal Use Only{"\n"}
                This report was automatically generated on {new Date().toLocaleDateString()}
              </Text>
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
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey={xAxisKey}
                  tickFormatter={formatXAxisValue}
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip
                  labelFormatter={formatXAxisValue}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                {yAxisKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    name={key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    radius={[4, 4, 0, 0]}
                    barSize={40}
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