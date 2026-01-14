// pdf-buttons.tsx
'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { StepPDFDocument, AllStepsPDFDocument } from './pdf-components';
import { WalkaroundData } from './types';

// Individual Step PDF Download Button Component
export const StepPDFDownloadButton = ({ data }: { data: WalkaroundData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const walkaround = data.data.walkaround;
      const registration = walkaround.vehicle?.registration_number || 'vehicle';
      const date = new Date(walkaround.date).toISOString().split('T')[0];
      const step = walkaround.walkaround_step;
      
      // Create individual PDF
      const IndividualPDF = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <View>
              {/* Step Header */}
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Walkaround Step {step}</Text>
                <Text style={styles.stepSubtitle}>
                  ID: {walkaround.id} • Conducted on {date}
                </Text>
              </View>
              
              <StepPDFDocument data={data} stepNumber={step} />
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(<IndividualPDF />).toBlob();
      saveAs(blob, `walkaround-step-${step}-${registration}-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      size="sm"
      className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3 gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Generating...</span>
        </>
      ) : (
        <>
          <Download className="h-3 w-3" />
          <span className="text-xs">PDF</span>
        </>
      )}
    </Button>
  );
};

// All Steps PDF Download Button Component
export const AllStepsPDFDownloadButton = ({ stepDataList }: { stepDataList: any[] }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadAllPDF = async () => {
    setIsGenerating(true);
    try {
      const validSteps = stepDataList.filter(step => step.data?.success);
      
      if (validSteps.length === 0) {
        alert('No valid walkaround data available to generate PDF.');
        return;
      }

      const firstStep = validSteps[0];
      const vehicleInfo = firstStep.data?.data.walkaround.vehicle;
      const registration = vehicleInfo?.registration_number || 'vehicle';
      const date = new Date().toISOString().split('T')[0];

      const blob = await pdf(<AllStepsPDFDocument stepDataList={validSteps} />).toBlob();
      saveAs(blob, `complete-walkaround-report-${registration}-${date}.pdf`);
    } catch (error) {
      console.error('Error generating combined PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadAllPDF}
      disabled={isGenerating}
      className="
        fixed bottom-6 right-6
        h-14 w-14 rounded-full
        bg-blue-600 hover:bg-blue-700
        text-white shadow-lg
        flex items-center justify-center
        group overflow-hidden
      "
    >
      {isGenerating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <FileText className="h-5 w-5" />
      )}

      {/* Hover Label */}
      <span
        className="
          absolute right-full mr-3
          whitespace-nowrap
          rounded-md bg-slate-900 px-3 py-1.5
          text-sm text-white
          opacity-0 scale-95
          transition-all
          group-hover:opacity-100 group-hover:scale-100
          pointer-events-none
        "
      >
        {isGenerating ? "Generating Report..." : "Download PDF"}
      </span>
    </Button>
  );
};