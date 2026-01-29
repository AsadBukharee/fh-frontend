'use client'

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, Download, FileText, Check, X, AlertCircle } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';

// Interfaces
interface Steps {
  step_1?: string;
  step_2?: string;
  step_3?: string;
  current_step?: string;
  total_steps?: string;
  chain_id?: string;
}

interface Answer {
  id: number;
  question_text: string;
  question_id: number;
  answer: string;
  is_defected: boolean;
  description: string | null;
  date: string;
  prove: string | null;
  motion_detected: boolean;
  user_id: number;
  user_name: string;
  vehicle_id: number | null;
  vehicle_registration: string | null;
}

interface WalkaroundData {
  success: boolean;
  message: string;
  data: {
    walkaround: {
      id: number;
      vehicle: {
        id: number;
        registration_number: string;
        vehicles_type_name: string;
        last_mileage: string | null;
        current_mileage: string;
        mileage_unit: string;
        mileage_in_km: number;
        mileage_in_miles: number;
        site_allocated: Array<{
          id: number;
          name: string;
          status: string;
          image?: string;
        }>;
      };
      conducted_by: {
        id: number;
        email: string;
        full_name: string;
        role: string;
        avatar: string | null;
      };
      walkaround_assignee: {
        id: number;
        email: string;
        full_name: string;
        role: string;
        avatar: string | null;
      } | null;
      walkaround_step: number;
      date: string;
      time: string;
      mileage: number | null;
      signature: string | null;
      note: string | null;
      defects: string | null;
      walkaround_duration: number | null;
      status: string;
      created_at: string;
      updated_at: string;
      parent: number | null;
    };
    answers: Answer[];
    total_answers: number;
    defected_count: number;
    non_defected_count: number;
  };
}

interface StepData {
  stepNumber: number;
  stepId: string;
  data: WalkaroundData | null;
  loading: boolean;
  error: string | null;
}

// PDF Styles - Updated to match StepCard UI
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 24,
    fontFamily: 'Helvetica',
  },
  // Step Card Container
  stepCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },

  // Header Section - Orange background like StepCard
  headerSection: {
    backgroundColor: '#ffedd5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9a3412',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#92400e',
  },

  // Card Content
  cardContent: {
    padding: 20,
  },

  // Grid Layout like StepCard
  gridRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 10,
    color: '#9ca3af',
  },

  // Badge styles matching StepCard
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 6,
  },
  statusBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
  },
  motionYesBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  motionNoBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  passBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
  },
  failBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  ldfBadge: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
  },

  // Daily Checks Section
  dailyChecksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 16,
  },
  dailyChecksTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  // Answer Items matching StepCard grid
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  answerCard: {
    width: '100%',
    marginRight: '4%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  answerCardDefect: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  answerBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defectNote: {
    fontSize: 9,
    color: '#dc2626',
    fontStyle: 'italic',
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },

  // Notes and Defects Section
  notesSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesContent: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 12,
    minHeight: 60,
  },
  notesText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },

  // Signature Section
  signatureSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  signatureContainer: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginBottom: 12,
    objectFit: 'contain',
  },
  signatureInfo: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  signatureName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },

  // Footer matching StepCard
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 20,
  },
  footerLeft: {
    fontSize: 10,
    color: '#6b7280',
  },
  footerRight: {
    fontSize: 10,
    color: '#6b7280',
  },

  // Two column layout for notes and defects
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  column: {
    width: '48%',
  },
});

// Individual Step PDF Component - Updated to match StepCard UI
const StepPDFDocument = ({ data, stepNumber }: { data: WalkaroundData; stepNumber: number }) => {
  const { walkaround, answers, defected_count, total_answers } = data.data;

  const motionDetectedCount = answers.filter(a => a.motion_detected).length;
  const motionNotDetectedCount = answers.length - motionDetectedCount;



  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString.split(':').slice(0, 2).join(':');
  };

  return (
    <View style={styles.stepCard}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>
              Walkaround Details <Text style={{ color: '#ea580c' }}>{String(stepNumber).padStart(2, "0")}</Text>
            </Text>
            <Text style={styles.headerSubtitle}>
              Chain ID: #{walkaround.parent ?? "—"} · Latest Step: {stepNumber} of {stepNumber}
            </Text>
          </View>

          <View style={[styles.badge,
          walkaround.status === "completed" ? styles.statusBadge : styles.pendingBadge
          ]}>
            <Text>{walkaround.status}</Text>
          </View>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Vehicle Row */}
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Registration No.</Text>
            <Text style={styles.value}>{walkaround.vehicle?.registration_number || 'N/A'}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Vehicle Type</Text>
            <Text style={styles.value}>{walkaround.vehicle?.vehicles_type_name || 'N/A'}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Sites</Text>
            <Text style={styles.value}>
              {walkaround.vehicle?.site_allocated?.[0]?.name || 'N/A'}
            </Text>
            <Text style={[styles.badge, styles.statusBadge, { fontSize: 9, paddingHorizontal: 6 }]}>
              Active
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Current Mileage</Text>
            <Text style={styles.value}>
              {walkaround.vehicle?.last_mileage} {walkaround.vehicle?.mileage_unit}
            </Text>
          </View>
        </View>

        {/* Personnel Row */}
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Driver Name</Text>
            <Text style={styles.value}>{walkaround.conducted_by?.full_name || 'N/A'}</Text>
            <Text style={styles.subValue}>
              {formatToDDMMYYYY(walkaround.date)} at {formatTime(walkaround.time)}
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Manager Name</Text>
            <Text style={styles.value}>
              {walkaround.walkaround_assignee?.full_name || 'Unroad worthy'}
            </Text>
            <Text style={styles.subValue}>
              {formatToDDMMYYYY(walkaround.date)} at {formatTime(walkaround.time)}
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Motion</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={[styles.badge, styles.motionNoBadge, { fontSize: 9 }]}>
                <Text>{motionNotDetectedCount}</Text>
              </View>
              <View style={[styles.badge, styles.motionYesBadge, { fontSize: 9 }]}>
                <Text>{motionDetectedCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Total Time</Text>
            <Text style={styles.value}>{walkaround.walkaround_duration ?? "—"} s</Text>
          </View>
        </View>

        {/* Daily Checks Header */}
        <View style={styles.dailyChecksHeader}>
          <Text style={styles.dailyChecksTitle}>Daily checks</Text>

        </View>

        {/* Answers Grid */}
        <View style={styles.answersGrid}>
          {answers.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.answerCard,
                ...(item.is_defected ? [styles.answerCardDefect] : [])
              ]}
            >
              <View style={styles.answerHeader}>
                <Text style={styles.questionText}>
                  {idx + 1}. {item.question_text}
                </Text>
                <View style={[
                  styles.statusDot,
                  item.is_defected
                    ? { backgroundColor: '#ef4444' }
                    : { backgroundColor: '#10b981' }
                ]} />
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, styles.ldfBadge, { fontSize: 8 }]}>
                  <Text>In-motion</Text>
                </View>

                <View style={[
                  styles.badge,
                  item.answer?.toLowerCase().includes('yes') ? styles.passBadge : styles.failBadge,
                  { fontSize: 8 }
                ]}>
                  <Text>{item.answer}</Text>
                </View>
              </View>

              {/* Defect Note in PDF */}
              {item.is_defected && item.description && (
                <View style={styles.defectNote}>
                  <Text style={{ fontSize: 8, color: '#dc2626', fontWeight: 'bold', marginBottom: 2 }}>
                    Defect Note:
                  </Text>
                  <Text style={{ fontSize: 8, color: '#dc2626' }}>
                    {item.description}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Notes and Defects Section - Two Column Layout */}
        <View style={styles.twoColumn}>
          {/* Defects Column */}
          <View style={styles.column}>
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Defects Reported</Text>
              <View style={styles.notesContent}>
                <Text style={styles.notesText}>
                  {walkaround.defects || "No specific defects noted."}
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Notes Column */}
          <View style={styles.column}>
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <View style={styles.notesContent}>
                <Text style={styles.notesText}>
                  {walkaround.note || "No additional notes."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        {walkaround.signature && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Signature</Text>
            <View style={styles.signatureContainer}>
              <Image
                src={walkaround.signature}
                style={styles.signatureImage}
              />
              <Text style={styles.signatureInfo}>
                Signed by:
              </Text>
              <Text style={styles.signatureName}>
                {walkaround.conducted_by?.full_name || 'N/A'}
              </Text>
              <Text style={[styles.signatureInfo, { marginTop: 4 }]}>
                Date: {formatToDDMMYYYY(walkaround.date)} • Time: {formatTime(walkaround.time)}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            Total Defects: {defected_count} / {total_answers}
          </Text>
          <Text style={styles.footerRight}>
            {formatToDDMMYYYY(walkaround.date)} · {formatTime(walkaround.time)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// All Steps PDF Document - Cover page with StepCard styling
const AllStepsPDFDocument = ({ stepDataList }: { stepDataList: StepData[] }) => {
  const validSteps = stepDataList.filter(step => step.data?.success);

  if (validSteps.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No valid walkaround data available</Text>
        </Page>
      </Document>
    );
  }

  const firstStep = validSteps[0];
  const vehicleInfo = firstStep.data?.data.walkaround.vehicle;
  const registration = vehicleInfo?.registration_number || 'Unknown Vehicle';
  const totalDefects = validSteps.reduce((sum, step) => sum + (step.data?.data.defected_count || 0), 0);
  const totalChecks = validSteps.reduce((sum, step) => sum + (step.data?.data.total_answers || 0), 0);
  const totalSteps = validSteps.length;

  // Collect all defect notes from all steps
  const allDefectNotes: string[] = [];
  validSteps.forEach(step => {
    step.data?.data.answers.forEach(answer => {
      if (answer.is_defected && answer.description) {
        allDefectNotes.push(answer.description);
      }
    });
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          {/* Title Card */}
          <View style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            padding: 32,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#ea580c',
              marginBottom: 8,
            }}>
              Vehicle Inspection Report
            </Text>

            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              marginBottom: 32,
            }}>
              Comprehensive Walkaround Details
            </Text>

            <View style={{
              backgroundColor: '#ffedd5',
              padding: 16,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#9a3412',
                marginBottom: 4,
              }}>
                {registration}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#92400e',
              }}>
                {vehicleInfo?.vehicles_type_name || 'N/A'}
              </Text>
            </View>

            <View style={[styles.statsContainer, { marginBottom: 24 }]}>
              <View style={{
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#f0f9ff',
                borderRadius: 8,
                minWidth: 80,
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#0ea5e9',
                }}>
                  {totalSteps}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginTop: 4,
                }}>
                  Steps
                </Text>
              </View>

              <View style={{
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#f0fdf4',
                borderRadius: 8,
                minWidth: 80,
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#10b981',
                }}>
                  {totalChecks - totalDefects}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginTop: 4,
                }}>
                  Passed
                </Text>
              </View>

              <View style={{
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#fef2f2',
                borderRadius: 8,
                minWidth: 80,
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#ef4444',
                }}>
                  {totalDefects}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginTop: 4,
                }}>
                  Defects
                </Text>
              </View>
            </View>

            <View style={{
              width: '100%',
              marginTop: 16,
              padding: 12,
              backgroundColor: '#f9fafb',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: 8,
              }}>
                Summary of Defect Notes:
              </Text>
              {allDefectNotes.length > 0 ? (
                allDefectNotes.map((note, index) => (
                  <Text key={index} style={{
                    fontSize: 9,
                    color: '#dc2626',
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}>
                    • {note}
                  </Text>
                ))
              ) : (
                <Text style={{
                  fontSize: 9,
                  color: '#6b7280',
                  fontStyle: 'italic',
                }}>
                  No defect notes recorded
                </Text>
              )}
            </View>

            <Text style={{
              fontSize: 10,
              color: '#9ca3af',
              marginTop: 32,
              textAlign: 'center',
            }}>
              Generated on {formatToDDMMYYYY(new Date())} at {new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </Page>

      {/* Individual Steps */}
      {validSteps.map((step, index) => (
        <Page key={step.stepId} size="A4" style={styles.page}>
          <StepPDFDocument data={step.data!} stepNumber={step.stepNumber} />

          {/* Page footer */}
          <View style={{
            position: 'absolute',
            bottom: 20,
            left: 24,
            right: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingTop: 12,
          }}>
            <Text style={{
              fontSize: 9,
              color: '#6b7280',
            }}>
              Page {index + 2} of {validSteps.length + 1}
            </Text>
            <Text style={{
              fontSize: 9,
              color: '#6b7280',
            }}>
              Vehicle: {step.data?.data.walkaround.vehicle?.registration_number || 'N/A'}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

// Individual Step PDF Download Button
const StepPDFDownloadButton = ({ data }: { data: WalkaroundData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const walkaround = data.data.walkaround;
      const registration = walkaround.vehicle?.registration_number || 'vehicle';
      const date = new Date(walkaround.date).toISOString().split('T')[0];
      const step = walkaround.walkaround_step;

      const IndividualPDF = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <StepPDFDocument data={data} stepNumber={step} />
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

// All Steps PDF Download Button
const AllStepsPDFDownloadButton = ({ stepDataList }: { stepDataList: StepData[] }) => {
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
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center group overflow-hidden"
    >
      {isGenerating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <FileText className="h-5 w-5" />
      )}
      <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
        {isGenerating ? "Generating Report..." : "Download PDF"}
      </span>
    </Button>
  );
};

// Main Component
const VehicleInspectionDashboard = () => {
  const [stepDataList, setStepDataList] = useState<StepData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});
  const [steps, setSteps] = useState<Steps>({});

  useEffect(() => {
    extractStepsFromURL();
  }, []);

  const extractStepsFromURL = () => {
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);

      const extractedSteps: Steps = {
        step_1: params.get('step_1') || undefined,
        step_2: params.get('step_2') || undefined,
        step_3: params.get('step_3') || undefined,
        current_step: params.get('current_step') || undefined,
        total_steps: params.get('total_steps') || undefined,
        chain_id: params.get('chain_id') || undefined,
      };

      setSteps(extractedSteps);

      const stepList: StepData[] = [];
      if (extractedSteps.step_1) {
        stepList.push({ stepNumber: 1, stepId: extractedSteps.step_1, data: null, loading: true, error: null });
      }
      if (extractedSteps.step_2) {
        stepList.push({ stepNumber: 2, stepId: extractedSteps.step_2, data: null, loading: true, error: null });
      }
      if (extractedSteps.step_3) {
        stepList.push({ stepNumber: 3, stepId: extractedSteps.step_3, data: null, loading: true, error: null });
      }
      setStepDataList(stepList);

      fetchAllStepsData(stepList);
    } catch (error) {
      console.error('Error extracting steps from URL:', error);
      setError('Failed to parse URL parameters');
      setIsLoading(false);
    }
  };

  const fetchAllStepsData = async (stepsList: StepData[]) => {
    try {
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!accessToken) {
        const updatedSteps = stepsList.map(step => ({
          ...step,
          loading: false,
          error: "Authentication required"
        }));
        setStepDataList(updatedSteps);
        setIsLoading(false);
        return;
      }

      const fetchPromises = stepsList.map(async (step) => {
        try {
          const response = await fetch(`${API_URL}/api/walk-around/${step.stepId}/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch step ${step.stepNumber} data`);
          }

          const data = await response.json();

          if (data?.success) {
            return {
              ...step,
              data: data,
              loading: false,
              error: null
            };
          } else {
            throw new Error(data?.message || `Unknown error for step ${step.stepNumber}`);
          }
        } catch (err) {
          return {
            ...step,
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load step data'
          };
        }
      });

      const results = await Promise.all(fetchPromises);
      setStepDataList(results);
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching all steps data:', error);
      const updatedSteps = stepsList.map(step => ({
        ...step,
        loading: false,
        error: 'Failed to load step data'
      }));
      setStepDataList(updatedSteps);
      setIsLoading(false);
    }
  };

  const handleSaveComments = async (answerId: number, comments: string, stepNumber?: number): Promise<void> => {
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!accessToken) {
      alert("Authentication required");
      return;
    }

    setSavingStates(prev => ({ ...prev, [answerId]: true }));

    try {
      const response = await fetch(`${API_URL}/api/answer/${answerId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: comments }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comments');
      }

      if (stepNumber) {
        const stepIndex = stepDataList.findIndex(s => s.stepNumber === stepNumber);
        if (stepIndex !== -1 && stepDataList[stepIndex].data?.data?.answers) {
          const updatedStepDataList = [...stepDataList];
          const updatedAnswers = updatedStepDataList[stepIndex].data!.data.answers.map(answer =>
            answer.id === answerId ? { ...answer, description: comments } : answer
          );
          updatedStepDataList[stepIndex] = {
            ...updatedStepDataList[stepIndex],
            data: {
              ...updatedStepDataList[stepIndex].data!,
              data: {
                ...updatedStepDataList[stepIndex].data!.data,
                answers: updatedAnswers
              }
            }
          };
          setStepDataList(updatedStepDataList);
        }
      }

      alert('Comments saved successfully');
    } catch (error) {
      alert('Error saving comments. Please try again.');
      console.error('Error saving comments:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [answerId]: false }));
    }
  };

  const toggleSection = (section: string): void => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Format date using the standardized utility
  const formatToDDMMYYYY = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatToDDMMYYYY(dateString);
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return 'N/A';
    return timeString.split(':').slice(0, 2).join(':');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading inspection data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="w-full px-5 mx-auto">
        {/* All Steps Download Button */}
        <div className="flex justify-center mb-6">
          <AllStepsPDFDownloadButton stepDataList={stepDataList} />
        </div>

        <div className="space-y-4">
          {stepDataList.map((stepData) => (
            <StepCard
              key={stepData.stepNumber}
              stepData={stepData}
              onSaveComments={handleSaveComments}
              savingStates={savingStates}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              formatToDDMMYYYY={formatToDDMMYYYY}
              formatTime={formatTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StepCard = ({
  stepData,
  onSaveComments,
  savingStates,
  expandedSections,
  toggleSection,
  formatToDDMMYYYY,
  formatTime,
}: {
  stepData: StepData
  onSaveComments: (answerId: number, comments: string, stepNumber?: number) => Promise<void>
  savingStates: Record<number, boolean>
  expandedSections: Record<string, boolean>
  toggleSection: (section: string) => void
  formatToDDMMYYYY: (dateString: string) => string
  formatTime: (timeString: string) => string
}) => {
  const { stepNumber, data, loading, error } = stepData;
  const isExpanded = expandedSections[`step-${stepNumber}`] !== false;

  if (loading) {
    return (
      <Card className="border border-gray-200 rounded-xl">
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.success || error) {
    return null;
  }

  const { walkaround, answers, defected_count, total_answers } = data.data;
  const motionDetectedCount = answers.filter(a => a.motion_detected).length;
  const motionNotDetectedCount = answers.length - motionDetectedCount;

  return (
    <Card className="border border-gray-200 rounded-xl overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center px-5 py-3 bg-orange-50 border-b border-orange-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Walkaround Details <span className="text-orange-500">{String(stepNumber).padStart(2, "0")}</span>
          </p>
          <p className="text-xs text-gray-500">
            Chain ID: #{walkaround.parent ?? "—"} · Latest Step: {stepNumber} of {stepNumber}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Badge
            className={
              walkaround.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }
          >
            {walkaround.status}
          </Badge>
          <StepPDFDownloadButton data={data} />
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* VEHICLE ROW */}
        <div className="grid grid-cols-4 gap-6">
          <Info label="Registration No." value={walkaround.vehicle?.registration_number} />
          <Info label="Vehicle Type" value={walkaround.vehicle?.vehicles_type_name} />
          <Info
            label="Sites"
            value={<Badge className="bg-green-100 text-green-700">Active</Badge>}
            sub={walkaround.vehicle?.site_allocated?.[0]?.name}
          />
          <Info
            label="Current Mileage"
            value={`${walkaround.vehicle?.last_mileage} ${walkaround.vehicle?.mileage_unit}`}
          />
        </div>

        {/* PERSONNEL ROW */}
        <div className="grid grid-cols-4 gap-6">
          <Info
            label="Driver Name"
            value={<Badge className="bg-green-100 text-green-700">{walkaround.conducted_by.full_name}</Badge>}
            sub={`${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}`}
          />

          <Info
            label="Manager Name"
            value={
              <Badge className="bg-red-100 text-red-700">
                {walkaround.walkaround_assignee?.full_name ?? "Unroad worthy"}
              </Badge>
            }
            sub={`${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}`}
          />

          <Info
            label="Motion"
            value={
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700">
                  {motionNotDetectedCount}
                </Badge>
                <Badge className="bg-red-100 text-red-700">
                  {motionDetectedCount}
                </Badge>
              </div>
            }
          />

          <Info
            label="Total Time"
            value={<Badge className="bg-green-100 text-green-700">{walkaround.walkaround_duration ?? "—"} s</Badge>}
          />
        </div>

        {/* DAILY CHECKS TOGGLE */}
        <button
          onClick={() => toggleSection(`step-${stepNumber}`)}
          className="w-full flex justify-between items-center pt-3 border-t border-gray-200 text-sm font-medium"
        >
          Daily checks
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* DAILY CHECKS */}
        {isExpanded && (
          <div className="grid grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-2">
            {answers.map((a, i) => (
              <TooltipProvider key={a.id}>
                <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        border rounded-lg p-3 bg-white flex justify-between cursor-pointer
                        transition
                        ${a.is_defected
                          ? "border-red-200 hover:bg-red-50"
                          : "border-gray-200 hover:bg-gray-50"}
                      `}
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          {i + 1}. {a.question_text}
                        </p>

                        <div className="flex gap-2">
                          <Badge className="bg-gray-100 text-gray-700 text-xs">
                            In-motion
                          </Badge>

                          <Badge
                            className={
                              a.answer?.toLowerCase().includes("yes")
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {a.answer}
                          </Badge>
                        </div>
                      </div>

                      {/* status dot */}
                      <span
                        className={`w-2 h-2 rounded-full mt-1 ${a.is_defected ? "bg-red-500" : "bg-green-500"
                          }`}
                      />
                    </div>
                  </TooltipTrigger>

                  {/* DEFECT TOOLTIP */}
                  {a.is_defected && a.description && (
                    <TooltipContent
                      side="right"
                      align="start"
                      className="max-w-xs bg-red-600 text-white text-xs leading-relaxed shadow-lg"
                    >
                      <p className="font-semibold mb-1">Defect Note</p>
                      <p>{a.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* FOOTER */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>Total Defects: {defected_count} / {total_answers}</span>
            <span>{formatToDDMMYYYY(walkaround.date)} · {formatTime(walkaround.time)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* Info helper */
const Info = ({ label, value, sub }: { label: string; value: any; sub?: string }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <div className="text-sm font-medium text-gray-900">{value}</div>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const DefectItem = ({
  answer,
  index,
  stepNumber,
  onSaveComments,
  isSaving
}: {
  answer: Answer;
  index: number;
  stepNumber: number;
  onSaveComments: (answerId: number, comments: string, stepNumber?: number) => Promise<void>;
  isSaving: boolean;
}) => {
  const [localComments, setLocalComments] = useState<string>(answer.description || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setLocalComments(answer.description || '');
    setHasChanges(false);
  }, [answer.description]);

  const handleCommentsChange = (value: string): void => {
    setLocalComments(value);
    setHasChanges(value !== (answer.description || ''));
  };

  const handleSave = async (): Promise<void> => {
    if (answer.id) {
      await onSaveComments(answer.id, localComments, stepNumber);
      setHasChanges(false);
    }
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
        <span className="text-xs font-semibold text-red-600">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-gray-900 leading-relaxed">
            {answer.question_text || 'No question text'}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge className={answer.is_defected ?
              "bg-red-100 text-red-700 hover:bg-red-100" :
              "bg-green-100 text-green-700 hover:bg-green-100"
            } style={{ fontSize: '10px', padding: '2px 6px', fontWeight: 600 }}>
              {answer.is_defected ? "Fail" : "Pass"}
            </Badge>
            <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border border-orange-200"
              style={{ fontSize: '10px', padding: '2px 6px' }}>
              LDF
            </Badge>
            {answer.motion_detected && (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                style={{ fontSize: '10px', padding: '2px 6px' }}>
                Motion
              </Badge>
            )}
          </div>
        </div>

        {answer.is_defected && (
          <div className="space-y-2">
            <Textarea
              placeholder="No defects"
              className="min-h-[50px] text-xs resize-none bg-white border-gray-200"
              value={localComments}
              onChange={(e) => handleCommentsChange(e.target.value)}
              disabled={isSaving}
            />

            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 h-7 text-xs px-3"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInspectionDashboard;