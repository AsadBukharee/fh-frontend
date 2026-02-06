'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Users, DollarSign, Calendar, Clock, Loader, FileText, FileSpreadsheet } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from '@react-pdf/renderer';
import * as ExcelJS from 'exceljs';

// Register fonts for @react-pdf/renderer
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

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

// Styles for @react-pdf/renderer
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '2px solid #dc2626',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeft: '4px solid #dc2626',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 8,
  },
  filters: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  metricCard: {
    width: '48%',
    padding: 8,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
  },
  tableContainer: {
    marginTop: 15,
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#b91c1c',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#b91c1c',
    borderRightStyle: 'solid',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    minHeight: 24,
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 7.5,
    color: '#334155',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    borderRightStyle: 'solid',
    flex: 1,
  },
  tableCellDriver: {
    fontSize: 8,
    color: '#1e293b',
    textAlign: 'left',
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    borderRightStyle: 'solid',
    flex: 1,
  },
  totalsRow: {
    backgroundColor: '#fed7aa',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#fb923c',
    borderTopStyle: 'solid',
  },
  totalsCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#1e293b',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: '#fb923c',
    borderRightStyle: 'solid',
    flex: 1,
  },
  totalsDriverCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#1e293b',
    textAlign: 'left',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: '#fb923c',
    borderRightStyle: 'solid',
    flex: 1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
});

// Helper function to truncate text if too long
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// React PDF Document Component with jsPDF-style table
const ReportingPDFDocument = ({ 
  data, 
  filters, 
  viewType,
  getContractName 
}: { 
  data: ReportingData;
  filters: any;
  viewType: string;
  getContractName: () => string;
}) => {
  // Shift type mapping for display names
  const shiftNames: { [key: string]: string } = {
    ADMIN_STAFF: 'Admin',
    DAY: 'Day',
    EARLY: 'Early',
    HOLIDAYP: 'Holiday P',
    LATE_DAY: 'Late Day',
    MANAGER: 'Manager',
    MIDDLE: 'Middle',
    NIGHT: 'Night',
    OFF: 'Off',
    SUPERVISOR_D: 'Supervisor',
    UNAUTHORISED_ABSENCE: 'Unauth',
    SICKP: 'Sick P',
    TOTAL: 'Total',
    MECHANIC: 'Mech',
    SUPERVISOR_E: 'Sup E',
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Driver Shift Report</Text>
          <Text style={styles.subtitle}>Foster Hartley - Driver Management System</Text>
          <Text style={styles.dateRange}>
            Report Period: {new Date(filters.dateFrom).toLocaleDateString('en-GB')} to {new Date(filters.dateTo).toLocaleDateString('en-GB')}
          </Text>
        </View>

        {/* Report Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <Text style={styles.filters}>
            • Contract: {getContractName()}
            {'\n'}• Display Type: {viewType}
            {'\n'}• Date Range: {filters.dateFrom} to {filters.dateTo}
            {'\n'}• Generated: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>

        {/* Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Metrics</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Drivers</Text>
              <Text style={styles.metricValue}>{data.meta.total_drivers}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total {viewType}</Text>
              <Text style={styles.metricValue}>{data.grand_totals.TOTAL || 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Holiday Pay</Text>
              <Text style={styles.metricValue}>{data.grand_totals.HOLIDAYP || 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Manager Hours</Text>
              <Text style={styles.metricValue}>{data.grand_totals.MANAGER || 0}</Text>
            </View>
          </View>
        </View>

        {/* Table Container */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Driver Shift Details</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { 
              flex: 2,
              textAlign: 'left',
              paddingLeft: 8 
            }]}>
              Driver Name
            </Text>
            {data.columns.map((col, index) => (
              <Text 
                key={index} 
                style={[styles.tableHeaderCell, { 
                  flex: 1,
                  borderRightWidth: index === data.columns.length - 1 ? 0 : 1
                }]}
              >
                {truncateText(shiftNames[col] || col, 8)}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          {data.rows.map((row, index) => (
            <View
              key={row.driver.id}
              style={[
                styles.tableRow,
                ...(index % 2 === 0 ? [styles.tableRowEven] : []),
                {
                  borderBottomWidth: index === data.rows.length - 1 ? 0 : 1,
                  minHeight: 20
                }
              ]}
            >
              <Text style={[styles.tableCellDriver, { 
                flex: 2,
                borderRightWidth: 1
              }]}>
                {truncateText(row.driver.name, 25)}
              </Text>
              {data.columns.map((col, colIndex) => (
                <Text 
                  key={colIndex} 
                  style={[
                    styles.tableCell, 
                    { 
                      flex: 1,
                      borderRightWidth: colIndex === data.columns.length - 1 ? 0 : 1
                    }
                  ]}
                >
                  {row.values[col] || 0}
                </Text>
              ))}
            </View>
          ))}

          {/* Totals Row */}
          <View style={[styles.totalsRow, { minHeight: 22 }]}>
            <Text style={[styles.totalsDriverCell, { 
              flex: 2,
              borderRightWidth: 1
            }]}>
              TOTALS
            </Text>
            {data.columns.map((col, index) => (
              <Text 
                key={index} 
                style={[
                  styles.totalsCell, 
                  { 
                    flex: 1,
                    borderRightWidth: index === data.columns.length - 1 ? 0 : 1
                  }
                ]}
              >
                {data.grand_totals[col] || 0}
              </Text>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Confidential - Foster Hartley Internal Use Only</Text>
          <Text>Generated by Foster Hartley Reporting System</Text>
        </View>

        {/* Page Number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default function Reporting() {
  const [filters, setFilters] = useState({
    contractType: 'ALL',
    driver: 'ALL',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    shiftType: 'ALL',
    displayType: 'DAYS',
  });

  const [viewType, setViewType] = useState('Days');
  const [apiData, setApiData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: number; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: number; name: string }[]>([]);
  const [excelDownloading, setExcelDownloading] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token") || "";
  const user_id = cookies.get("user_id") || "";

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Fetch filter data (contracts, drivers, shifts)
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const apiHost = API_URL;

        // Fetch contracts
        const contractsRes = await fetch(`${apiHost}/api/staff/contracts/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          if (Array.isArray(contractsData)) {
            const contractsList = contractsData.map((c: any) => ({
              id: c.id,
              name: c.name,
            }));
            setContracts(contractsList);
          } else if (contractsData.data && Array.isArray(contractsData.data)) {
            const contractsList = contractsData.data.map((c: any) => ({
              id: c.id,
              name: c.name,
            }));
            setContracts(contractsList);
          }
        }

        // Fetch drivers
        const driversRes = await fetch(`${apiHost}/api/profiles/list-names/?type=driver`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        if (driversRes.ok) {
          const driversData = await driversRes.json();
          const driversList = driversData.data
            ? driversData.data.map((d: any) => ({
              id: d.id,
              name: d.full_name,
            }))
            : [];
          setDrivers(driversList);
        }

        // Fetch shifts
        const shiftsRes = await fetch(`${apiHost}/api/staff/shifts/?user_id=${user_id}&scope=contract`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        if (shiftsRes.ok) {
          const shiftsData = await shiftsRes.json();
          if (Array.isArray(shiftsData)) {
            const shiftsList = shiftsData.map((s: any) => ({
              id: s.id,
              name: s.name,
            }));
            setShifts(shiftsList);
          } else if (shiftsData.data && Array.isArray(shiftsData.data)) {
            const shiftsList = shiftsData.data.map((s: any) => ({
              id: s.id,
              name: s.name,
            }));
            setShifts(shiftsList);
          }
        }
      } catch (err) {
        console.log('[v0] Error fetching filter data:', err);
      }
    };

    if (token) {
      fetchFilterData();
    }
  }, [token, user_id]);

  // Fetch reporting data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
          display_type: filters.displayType,
          contract_id: filters.contractType === 'ALL' ? '' : filters.contractType,
          driver_id: filters.driver === 'ALL' ? '' : filters.driver,
          shift_type: filters.shiftType === 'ALL' ? '' : filters.shiftType,
          status: 'ALL',
          page: '1',
          page_size: '25',
        });

        const response = await fetch(
          `${API_URL}/api/rota/child-rota/reporting/?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          throw new Error(`Failed to fetch reporting data: ${response.status} ${response.statusText}`);
        }

        const data: ReportingData = await response.json();
        setApiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching reporting data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [filters, token]);

  const handleReset = () => {
    setFilters({
      contractType: 'ALL',
      driver: 'ALL',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      shiftType: 'ALL',
      displayType: 'DAYS',
    });
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
      const headers = ['Driver Name', ...apiData.columns.map(col => shiftNames[col] || col)];
      
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
          cell.value = value;
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
        cell.value = value;
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
        
        valueCell.value = metric.value;
        valueCell.font = { size: 10, bold: true, color: { argb: 'FF1E293B' } };
        valueCell.numFmt = '#,##0';
        
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

  // Metrics data
  const metrics = [
    {
      label: 'Total Drivers',
      value: apiData?.meta.total_drivers || 0,
      icon: <Users size={20} />,
      color: 'text-pink-500',
    },
    {
      label: 'Total Days',
      value: apiData?.grand_totals.TOTAL || 0,
      icon: <DollarSign size={20} />,
      color: 'text-rose-500',
    },
    {
      label: 'Holidays Pay',
      value: apiData?.grand_totals.HOLIDAYP || 0,
      icon: <Calendar size={20} />,
      color: 'text-purple-500',
    },
    {
      label: 'Manager Hours',
      value: apiData?.grand_totals.MANAGER || 0,
      icon: <Clock size={20} />,
      color: 'text-orange-500',
    },
    {
      label: 'Day Shifts',
      value: apiData?.grand_totals.DAY || 0,
      icon: <Clock size={20} />,
      color: 'text-teal-500',
    },
  ];

  // Map column names to display names and colors
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
              {/* PDF Download Button */}
              {apiData ? (
                <PDFDownloadLink
                  document={
                    <ReportingPDFDocument
                      data={apiData}
                      filters={filters}
                      viewType={viewType}
                      getContractName={getContractName}
                    />
                  }
                  fileName={`driver-shift-report-${filters.dateFrom}-to-${filters.dateTo}.pdf`}
                  className="w-fit"
                >
                  {({ loading: pdfLoading }) => (
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 flex items-center gap-2"
                      disabled={pdfLoading}
                    >
                      {pdfLoading ? (
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
                  )}
                </PDFDownloadLink>
              ) : (
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 flex items-center gap-2"
                  disabled
                >
                  <FileText size={18} />
                  Download PDF
                </Button>
              )}

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
              options={shifts}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Display Type</label>
              <div className="flex items-center gap-2">
                <select
                  value={filters.displayType}
                  onChange={(e) => handleFilterChange('displayType', e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:border-slate-300 transition text-slate-700 text-sm"
                >
                  <option value="SALARY">Salary</option>
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
              ].map((type) => (
                <Button
                  key={`view-type-${type.value}`}
                  onClick={() => {
                    setViewType(type.label);
                    handleFilterChange('displayType', type.value);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    viewType === type.label
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
                      {filters.displayType === 'SALARY' ? '£0.00' : filters.displayType === 'DAYS' ? '0 days' : '0 hours'}
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
                        className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
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
                            {row.values[col] || 0}
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
                          {apiData.grand_totals[col] || 0}
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