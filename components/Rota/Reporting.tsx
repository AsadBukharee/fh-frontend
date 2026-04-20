import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Users, DollarSign, Calendar, Clock, Loader, FileText, FileSpreadsheet, CalendarCheck } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import * as ExcelJS from 'exceljs';
import { useRouter, useSearchParams } from 'next/navigation';

interface ReportingRow {
  driver: { id: number; name: string };
  values: { [key: string]: number };
}

interface ReportingData {
  meta: {
    display_type: string;
    filters: {
      date_from: string;
      date_to: string;
      contract_id: string;
      driver_id: string;
      shift_type: string;
      status: string;
    };
    total_drivers: number;
    total_pages: number;
  };
  columns: string[];
  rows: ReportingRow[];
  grand_totals: { [key: string]: number };
}

const shiftTypeMap: { [key: string]: { name: string; color: string } } = {
  ADMIN_STAFF: { name: 'Admin Staff', color: 'bg-[#64748b]' },
  DAY: { name: 'Day', color: 'bg-[#8b5cf6]' },
  EARLY: { name: 'Early', color: 'bg-[#f59e0b]' },
  HOLIDAYP: { name: 'Holiday P', color: 'bg-[#ef4444]' },
  LATE_DAY: { name: 'Late Day', color: 'bg-[#ec4899]' },
  MANAGER: { name: 'Manager', color: 'bg-[#f97316]' },
  MIDDLE: { name: 'Middle', color: 'bg-[#06b6d4]' },
  NIGHT: { name: 'Night', color: 'bg-[#2563eb]' },
  OFF: { name: 'Off', color: 'bg-[#22c55e]' },
  SUPERVISOR_D: { name: 'Supervisor', color: 'bg-[#4f46e5]' },
  UNAUTHORISED_ABSENCE: { name: 'Unauthorised', color: 'bg-[#dc2626]' },
  SICKP: { name: 'Sick P', color: 'bg-[#fb923c]' },
  TOTAL: { name: 'Total', color: 'bg-[#eab308]' },
  MECHANIC: { name: 'Mechanic', color: 'bg-[#14b8a6]' },
  SUPERVISOR_E: { name: 'Supervisor E', color: 'bg-[#991b1b]' },
};

export default function Reporting({ 
  refreshKey,
  initialData,
  contracts = [],
  drivers = [],
  shifts = [],
  role = ""
}: { 
  refreshKey?: number,
  initialData?: ReportingData | null,
  contracts?: { id: number; name: string }[],
  drivers?: { id: number; name: string }[],
  shifts?: { id: number; name: string }[],
  role?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(() => ({
    contractType: searchParams.get('contractType') || 'ALL',
    driver: searchParams.get('driver') || 'ALL',
    dateFrom: searchParams.get('dateFrom') || '2026-01-01',
    dateTo: searchParams.get('dateTo') || '2026-01-31',
    shiftType: searchParams.get('shiftType') || 'ALL',
    displayType: searchParams.get('displayType') || 'DAYS',
  }), [searchParams]);

  const viewType = useMemo(() => {
    const type = filters.displayType;
    if (type === 'SALARY') return 'Salary';
    if (type === 'DAYS') return 'Days';
    if (type === 'HOURS') return 'Hours';
    return 'Days';
  }, [filters.displayType]);

  const [apiData, setApiData] = useState<ReportingData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [excelDownloading, setExcelDownloading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token") || "";
  const user_id = cookies.get("user_id") || "";

  // Update apiData when initialData changes (e.g. on SSR refresh)
  useEffect(() => {
    if (initialData) {
      setApiData(initialData);
    }
  }, [initialData]);

  // Security check: Redirect non-admins away from Salary view
  useEffect(() => {
    if (role !== 'superadmin' && filters.displayType === 'SALARY') {
      handleFilterChange('displayType', 'DAYS');
    }
  }, [role, filters.displayType]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Removed client-side fetch in favor of SSR and URL-driven state
  const handleReset = () => {
    router.push('?', { scroll: false });
  };

  // Handle PDF download (simple implementation that opens a new window with HTML)
  const handleDownloadPDF = () => {
    if (!apiData) {
      alert('No data available to download');
      return;
    }

    setPdfDownloading(true);
    try {
      // Create HTML content for the PDF
      const formatValue = (val: number) => {
        if (filters.displayType === 'SALARY') return `£${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (filters.displayType === 'DAYS') return `${val} days`;
        if (filters.displayType === 'HOURS') return `${val} hours`;
        return val.toString();
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Driver Shift Report - ${filters.dateFrom} to ${filters.dateTo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #dc2626;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 15px;
            }
            .info-section {
              background: #f8fafc;
              padding: 20px;
              margin-bottom: 30px;
              border-left: 4px solid #dc2626;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .info-item {
              font-size: 14px;
              color: #475569;
            }
            .metrics {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .metric-card {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            }
            .metric-label {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #dc2626;
              color: white;
              padding: 12px;
              text-align: center;
              font-weight: bold;
              border: 1px solid #b91c1c;
            }
            td {
              padding: 10px;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            .driver-name {
              text-align: left;
              font-weight: 600;
            }
            .even-row {
              background: #f8fafc;
            }
            .totals-row {
              background: #fed7aa;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              body {
                margin: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Driver Shift Report</div>
            <div class="subtitle">Foster Hartley - Driver Management System</div>
            <div>Report Period: ${filters.dateFrom} to ${filters.dateTo}</div>
          </div>

          <div class="info-section">
            <div class="section-title">Report Details</div>
            <div class="info-grid">
              <div class="info-item">• Contract: ${getContractName()}</div>
              <div class="info-item">• Display Type: ${viewType}</div>
              <div class="info-item">• Date Range: ${filters.dateFrom} to ${filters.dateTo}</div>
              <div class="info-item">• Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div class="metrics">
            <div class="metric-card">
              <div class="metric-label">Total Drivers</div>
              <div class="metric-value">${apiData.meta.total_drivers}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total ${viewType}</div>
              <div class="metric-value">${apiData.grand_totals.TOTAL || 0}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Holiday Pay</div>
              <div class="metric-value">${apiData.grand_totals.HOLIDAYP || 0}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Manager Hours</div>
              <div class="metric-value">${apiData.grand_totals.MANAGER || 0}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Day Shifts</div>
              <div class="metric-value">${apiData.grand_totals.DAY || 0}</div>
            </div>
          </div>

          <div class="section-title">Driver Shift Details</div>
          <table>
            <thead>
              <tr>
                <th>Driver Name</th>
                ${apiData.columns.map(col => `<th>${shiftTypeMap[col]?.name || col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${apiData.rows.map((row, index) => `
                <tr class="${index % 2 === 0 ? 'even-row' : ''}">
                  <td class="driver-name">${row.driver.name}</td>
                  ${apiData.columns.map(col => `<td>${formatValue(row.values[col] || 0)}</td>`).join('')}
                </tr>
              `).join('')}
              <tr class="totals-row">
                <td class="driver-name">TOTALS</td>
                ${apiData.columns.map(col => `<td>${formatValue(apiData.grand_totals[col] || 0)}</td>`).join('')}
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div>Confidential - Foster Hartley Internal Use Only</div>
            <div>Generated by Foster Hartley Reporting System</div>
            <div class="no-print">
              <br>
              <button onclick="window.print()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Print / Save as PDF
              </button>
              <p style="font-size: 11px; margin-top: 10px;">
                Click the button above to print or save as PDF. In the print dialog, select "Save as PDF" as the destination.
              </p>
            </div>
          </div>

          <script>
            // Auto-trigger print dialog when page loads
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `;

      // Open HTML in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again or use the Excel export.');
    } finally {
      setPdfDownloading(false);
    }
  };

  // Handle Excel download
  const handleDownloadExcel = async () => {
    if (!apiData) {
      alert('No data available to download');
      return;
    }

    setExcelDownloading(true);
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Foster Hartley';
      workbook.lastModifiedBy = 'Foster Hartley Reporting System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Add a worksheet
      const worksheet = workbook.addWorksheet('Driver Shift Report', {
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
        views: [
          { state: 'frozen', ySplit: 3 } // Freeze first 3 rows
        ]
      });

      // Shift type mapping for display names
      const shiftNames: { [key: string]: string } = {
        ADMIN_STAFF: 'Admin Staff',
        DAY: 'Day',
        EARLY: 'Early',
        HOLIDAYP: 'Holiday P',
        LATE_DAY: 'Late Day',
        MANAGER: 'Manager',
        MIDDLE: 'Middle',
        NIGHT: 'Night',
        OFF: 'Off',
        SUPERVISOR_D: 'Supervisor',
        UNAUTHORISED_ABSENCE: 'Unauthorised Absence',
        SICKP: 'Sick P',
        TOTAL: 'Total',
        MECHANIC: 'Mechanic',
        SUPERVISOR_E: 'Supervisor E',
      };

      // Title rows
      worksheet.mergeCells('A1:Z1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = 'Foster Hartley - Driver Shift Report';
      titleRow.font = { size: 16, bold: true, color: { argb: 'FF1E293B' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };

      worksheet.mergeCells('A2:Z2');
      const subtitleRow = worksheet.getCell('A2');
      subtitleRow.value = `Report Period: ${filters.dateFrom} to ${filters.dateTo} | Contract: ${getContractName()} | Display Type: ${viewType}`;
      subtitleRow.font = { size: 11, color: { argb: 'FF64748B' } };
      subtitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A3:Z3');
      const dateRow = worksheet.getCell('A3');
      dateRow.value = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      dateRow.font = { size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      dateRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Column headers
      const headers = ['Driver Name', ...apiData.columns.map(col => shiftTypeMap[col]?.name || col)];

      // Add header row
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

      // Add data rows
      apiData.rows.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(rowIndex + 5);
        const values = [row.driver.name, ...apiData.columns.map(col => row.values[col] || 0)];

        values.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          
          if (colIndex === 0) {
            cell.value = value;
          } else {
            const numValue = Number(value) || 0;
            if (filters.displayType === 'SALARY') {
              cell.value = numValue;
              cell.numFmt = '£#,##0.00';
            } else if (filters.displayType === 'DAYS') {
              cell.value = `${numValue} days`;
            } else if (filters.displayType === 'HOURS') {
              cell.value = `${numValue} hours`;
            } else {
              cell.value = numValue;
            }
          }

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

      // Add totals row
      const totalsRowIndex = apiData.rows.length + 5;
      const totalsRow = worksheet.getRow(totalsRowIndex);
      const totalsValues = ['TOTALS', ...apiData.columns.map(col => apiData.grand_totals[col] || 0)];

      totalsValues.forEach((value, colIndex) => {
        const cell = totalsRow.getCell(colIndex + 1);
        
        if (colIndex === 0) {
          cell.value = value;
        } else {
          const numValue = Number(value) || 0;
          if (filters.displayType === 'SALARY') {
            cell.value = numValue;
            cell.numFmt = '£#,##0.00';
          } else if (filters.displayType === 'DAYS') {
            cell.value = `${numValue} days`;
          } else if (filters.displayType === 'HOURS') {
            cell.value = `${numValue} hours`;
          } else {
            cell.value = numValue;
          }
        }

        cell.font = {
          bold: true,
          size: 10,
          color: { argb: 'FF1E293B' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFED7AA' } // orange-200
        };
        cell.alignment = {
          horizontal: colIndex === 0 ? 'left' : 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FFFB923C' } },
          left: { style: 'thin', color: { argb: 'FFFB923C' } },
          bottom: { style: 'thin', color: { argb: 'FFFB923C' } },
          right: { style: 'thin', color: { argb: 'FFFB923C' } }
        };
      });

      // Add summary section
      const summaryRowIndex = totalsRowIndex + 2;
      const summaryStartCol = 1;
      const summaryEndCol = 4;

      worksheet.mergeCells(summaryRowIndex, summaryStartCol, summaryRowIndex, summaryEndCol);
      const summaryTitle = worksheet.getCell(summaryRowIndex, summaryStartCol);
      summaryTitle.value = 'Summary Metrics';
      summaryTitle.font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
      summaryTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      };
      summaryTitle.border = {
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      // Add metrics
      const metrics = [
        { label: 'Total Drivers', value: apiData.meta.total_drivers },
        { label: `Total ${viewType}`, value: apiData.grand_totals.TOTAL || 0 },
        { label: 'Holiday Pay', value: apiData.grand_totals.HOLIDAYP || 0 },
        { label: 'Manager Hours', value: apiData.grand_totals.MANAGER || 0 },
        { label: 'Day Shifts', value: apiData.grand_totals.DAY || 0 },
      ];

      metrics.forEach((metric, index) => {
        const metricRowIndex = summaryRowIndex + index + 1;
        const labelCell = worksheet.getCell(metricRowIndex, summaryStartCol);
        const valueCell = worksheet.getCell(metricRowIndex, summaryStartCol + 1);

        labelCell.value = metric.label;
        labelCell.font = { size: 10, color: { argb: 'FF475569' } };

        const numValue = Number(metric.value) || 0;
        valueCell.value = numValue;
        valueCell.font = { size: 10, bold: true, color: { argb: 'FF1E293B' } };
        
        if (metric.label.toLowerCase().includes('salary') || (filters.displayType === 'SALARY' && (metric.label.toLowerCase().includes('total') || metric.label.toLowerCase().includes('pay') || metric.label.toLowerCase().includes('shifts')))) {
          valueCell.numFmt = '£#,##0.00';
        } else {
          valueCell.numFmt = '#,##0';
        }

        if (index % 2 === 0) {
          labelCell.fill = valueCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });

      // Add footer note
      const footerRowIndex = summaryRowIndex + metrics.length + 2;
      worksheet.mergeCells(footerRowIndex, summaryStartCol, footerRowIndex, summaryEndCol);
      const footerCell = worksheet.getCell(footerRowIndex, summaryStartCol);
      footerCell.value = 'Confidential - Foster Hartley Internal Use Only';
      footerCell.font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };
      footerCell.alignment = { horizontal: 'center' };

      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        if (index === 0) {
          column.width = 25; // Driver name column wider
        } else {
          column.width = 12; // Shift columns
        }
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Create download link
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `driver-shift-report-${filters.dateFrom}-to-${filters.dateTo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Error generating Excel file. Please try again.');
    } finally {
      setExcelDownloading(false);
    }
  };

  const formatValue = (val: number) => {
    if (filters.displayType === 'SALARY') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }).format(val);
    }
    if (filters.displayType === 'DAYS') return `${val} days`;
    if (filters.displayType === 'HOURS') return `${val} hours`;
    return val.toString();
  };

  // Metrics data
  const metrics = [
    {
      label: 'Total Drivers',
      value: apiData?.meta.total_drivers || 0,
      icon: <Users size={20} />,
      color: 'text-pink-500',
    },
    {
      label: `Total ${viewType}`,
      value: formatValue(apiData?.grand_totals.TOTAL || 0),
      icon: <CalendarCheck size={20} />,
      color: 'text-rose-500',
    },
    {
      label: filters.displayType === 'SALARY' ? 'Holiday Pay' : 'Holiday Days',
      value: formatValue(apiData?.grand_totals.HOLIDAYP || 0),
      icon: <Calendar size={20} />,
      color: 'text-purple-500',
    },
    {
      label: 'Manager Hours',
      value: formatValue(apiData?.grand_totals.MANAGER || 0),
      icon: <Clock size={20} />,
      color: 'text-orange-500',
    },
    {
      label: 'Day Shifts',
      value: formatValue(apiData?.grand_totals.DAY || 0),
      icon: <Clock size={20} />,
      color: 'text-teal-500',
    },
  ];

  // Filter dropdown component
  const FilterDropdown = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { id: string | number; name: string }[];
  }) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-slate-300 transition text-slate-700 text-sm"
        >
          <option value="ALL">All</option>
          {options.map((option) => (
            <option key={`${label}-${option.id}`} value={String(option.id)}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Get current contract name for display
  const getContractName = () => {
    if (filters.contractType === 'ALL') return 'All';
    const contract = contracts.find(c => String(c.id) === filters.contractType);
    return contract ? contract.name : 'All';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Driver Shift Reports</h1>
            <p className="text-slate-600">Track hours, days, and salary by shift type</p>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {/* PDF Download Button - Simple HTML/Print version */}
              <Button
                onClick={handleDownloadPDF}
                disabled={!apiData || pdfDownloading}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 flex items-center gap-2"
              >
                {pdfDownloading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Download PDF
                  </>
                )}
              </Button>

              {/* Excel Download Button */}
              <Button
                onClick={handleDownloadExcel}
                disabled={!apiData || excelDownloading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-4 py-2 flex items-center gap-2"
              >
                {excelDownloading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={18} />
                    Download Excel
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Export reports in PDF or Excel format
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="bg-white shadow-sm border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <FilterDropdown
              label="Contract Type"
              value={filters.contractType}
              onChange={(val) => handleFilterChange('contractType', val)}
              options={contracts}
            />
            <FilterDropdown
              label="Driver"
              value={filters.driver}
              onChange={(val) => handleFilterChange('driver', val)}
              options={drivers}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm"
              />
            </div>
            <FilterDropdown
              label="Shift Type"
              value={filters.shiftType}
              onChange={(val) => handleFilterChange('shiftType', val)}
              options={[
                { id: 'ALL', name: 'All' },
                ...shifts.map(shift => ({ id: shift.name, name: shift.name }))
              ]}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Display Type</label>
              <div className="flex items-center gap-2">
                <select
                  value={filters.displayType}
                  onChange={(e) => handleFilterChange('displayType', e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-slate-300 transition text-slate-700 text-sm"
                >
                  {role === 'superadmin' && <option value="SALARY">Salary</option>}
                  <option value="DAYS">Days</option>
                  <option value="HOURS">Hours</option>
                </select>
                <Button
                  onClick={handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {metrics.map((metric, idx) => (
            <Card
              key={`metric-${idx}`}
              className="bg-white shadow-sm border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition"
            >
              <div className={`${metric.color} bg-slate-50 p-3 rounded-lg`}>
                {metric.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-600 font-medium">{metric.label}</p>
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Report Data Section */}
        <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-200 p-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Report Data</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 font-medium">View:</span>
              {[
                { label: 'Salary', value: 'SALARY' },
                { label: 'Days', value: 'DAYS' },
                { label: 'Hours', value: 'HOURS' },
              ].filter(type => type.value !== 'SALARY' || role === 'superadmin').map((type) => (
                <Button
                  key={`view-type-${type.value}`}
                  onClick={() => {
                    handleFilterChange('displayType', type.value);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filters.displayType === type.value
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Shift Type Labels and Table Combined */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            {/* Header with Shift Type Label and Contract Button */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Shift Type</span>
              <Button className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1">
                Contract: {getContractName()}
              </Button>
            </div>

            <table className="w-full">
              {/* Shift Type Badges as First Header Row */}
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="px-6 py-3 text-left sticky left-0 bg-white w-32"></th>
                  {apiData?.columns.map((col, index) => {
                    const shift = shiftTypeMap[col] || { name: col, color: 'bg-gray-500' };
                    return (
                      <th
                        key={`${col}-${index}`}
                        className="px-4 py-3 text-center min-w-[110px]"
                      >
                        <Badge className={`${shift.color} text-white border-0 whitespace-nowrap text-xs`}>
                          {shift.name}
                        </Badge>
                      </th>
                    );
                  })}
                </tr>
                {/* Second Header Row with £0.00 */}
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 sticky left-0 bg-slate-50">
                    Driver Name
                  </th>
                  {apiData?.columns.map((col, index) => (
                      <th
                        key={`header-${col}-${index}`}
                        className="px-4 py-4 text-center text-xs font-bold text-slate-700 whitespace-nowrap min-w-[110px]"
                      >
                        {filters.displayType === 'SALARY' ? 'Value (£)' : filters.displayType === 'DAYS' ? 'Days' : 'Hours'}
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={(apiData?.columns.length || 0) + 1}
                      className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2"
                    >
                      <Loader size={20} className="animate-spin" />
                      Loading data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={(apiData?.columns.length || 0) + 1}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      Error: {error}
                    </td>
                  </tr>
                ) : apiData?.rows && apiData.rows.length > 0 ? (
                  <>
                    {apiData.rows.map((row, idx) => (
                      <tr
                        key={`driver-${row.driver.id}-${idx}`}
                        className={`border-b border-slate-200 hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }`}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {row.driver.name}
                        </td>
                        {apiData.columns.map((col, colIndex) => (
                          <td
                            key={`${row.driver.id}-${col}-${colIndex}`}
                            className="px-4 py-4 text-center text-slate-700"
                          >
                            {formatValue(row.values[col] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-orange-50 border-t border-slate-200">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        Totals
                      </td>
                      {apiData.columns.map((col, index) => (
                        <td
                          key={`total-${col}-${index}`}
                          className="px-4 py-4 text-center font-bold text-slate-900"
                        >
                          {formatValue(apiData.grand_totals[col] || 0)}
                        </td>
                      ))}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={(apiData?.columns.length || 0) + 1}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}