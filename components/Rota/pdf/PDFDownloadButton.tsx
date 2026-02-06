'use client';

import { Button } from '@/components/ui/button';
import { FileText, Loader } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';

// Dynamically import the PDF document to avoid SSR issues
const PDFReportContent = dynamic(
  () => import('./PDFReportContent'),
  { ssr: false }
);

interface PDFDownloadButtonProps {
  data: any;
  filters: any;
  viewType: string;
  getContractName: () => string;
}

export default function PDFDownloadButton({ 
  data, 
  filters, 
  viewType,
  getContractName 
}: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={
        <PDFReportContent
          data={data}
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
  );
}