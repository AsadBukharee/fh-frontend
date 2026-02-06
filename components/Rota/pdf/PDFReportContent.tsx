'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

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

interface PDFReportContentProps {
  data: any;
  filters: any;
  viewType: string;
  getContractName: () => string;
}

export default function PDFReportContent({ 
  data, 
  filters, 
  viewType,
  getContractName 
}: PDFReportContentProps) {
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
            {data.columns.map((col: string, index: number) => (
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
          {data.rows.map((row: any, index: number) => (
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
              {data.columns.map((col: string, colIndex: number) => (
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
            {data.columns.map((col: string, index: number) => (
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
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }: { pageNumber: number, totalPages: number }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}