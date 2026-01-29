// pdf-components.tsx
'use client'

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { WalkaroundData } from './types';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';

// PDF Styles (extracted from original)
export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#ea580c',
    padding: 20,
    borderRadius: 8,
    color: 'white',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fed7aa',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#ffedd5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9a3412',
  },
  sectionContent: {
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  gridItem: {
    width: '50%',
    marginBottom: 10,
    paddingRight: 10,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: 'medium',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  answerItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  answerIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  answerIndexText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  answerContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 6,
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: '#dc2626',
    fontStyle: 'italic',
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  column: {
    width: '48%',
  },
  signatureContainer: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  userDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  pendingBadge: {
    backgroundColor: '#fef9c3',
    color: '#ca8a04',
  },
  yesBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  noBadge: {
    backgroundColor: '#fecaca',
    color: '#dc2626',
  },
  passBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  failBadge: {
    backgroundColor: '#fecaca',
    color: '#dc2626',
  },
  ldfBadge: {
    backgroundColor: '#ffedd5',
    color: '#ea580c',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col: {
    width: '50%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ea580c',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 15,
  },
  stepHeader: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    color: 'white',
    marginBottom: 15,
    marginTop: 10,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#bae6fd',
  },
});

// Helper functions for formatting
export const formatDate = (dateString: string): string => {
  return formatToDDMMYYYY(dateString, 'N/A');
};

export const formatTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  return timeString.split(':').slice(0, 2).join(':');
};

// Individual Step PDF Component
export const StepPDFDocument = ({ data, stepNumber }: { data: WalkaroundData; stepNumber: number }) => {
  const { walkaround, answers, defected_count, total_answers } = data.data;
  const hasMotionDetected = answers?.some(a => a.motion_detected) || false;

  return (
    <View style={{ marginBottom: 25 }}>
      {/* Step Header */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Walkaround Step {stepNumber}</Text>
        <Text style={styles.stepSubtitle}>
          ID: {walkaround.id} • Conducted on {formatDate(walkaround.date)} at {formatTime(walkaround.time)}
        </Text>
      </View>

      {/* Vehicle Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>VEHICLE INFORMATION</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Registration Number</Text>
              <Text style={styles.value}>{walkaround.vehicle?.registration_number || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Vehicle Type</Text>
              <Text style={styles.value}>{walkaround.vehicle?.vehicles_type_name || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Current Mileage</Text>
              <Text style={styles.value}>
                {walkaround.vehicle?.last_mileage || '0'} {walkaround.vehicle?.mileage_unit || 'miles'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Status</Text>
              <View style={[styles.answerBadge,
              walkaround.status === 'completed' ? styles.completedBadge :
                walkaround.status === 'pending' ? styles.pendingBadge :
                  styles.pendingBadge
              ]}>
                <Text>{walkaround.status?.toUpperCase() || 'PENDING'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Personnel Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PERSONNEL DETAILS</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Conducted By (Driver)</Text>
              <Text style={styles.value}>{walkaround.conducted_by?.full_name || 'N/A'}</Text>
              <Text style={[styles.label, { fontSize: 9 }]}>
                {walkaround.conducted_by?.role || 'N/A'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Assigned To (Manager)</Text>
              <Text style={styles.value}>{walkaround.walkaround_assignee?.full_name || 'Unassigned'}</Text>
              <Text style={[styles.label, { fontSize: 9 }]}>
                {walkaround.walkaround_assignee?.role || 'N/A'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Motion Detected</Text>
              <View style={[styles.answerBadge, hasMotionDetected ? styles.yesBadge : styles.noBadge]}>
                <Text>{hasMotionDetected ? 'YES' : 'NO'}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Inspection Duration</Text>
              <Text style={styles.value}>{walkaround.walkaround_duration || 'N/A'} minutes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Daily Checks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>DAILY CHECKS</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={[styles.badge, styles.passBadge]}>
                <Text>Pass: {total_answers - defected_count}</Text>
              </View>
              <View style={[styles.badge, styles.failBadge]}>
                <Text>Fail: {defected_count}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.sectionContent}>
          {answers && answers.length > 0 ? (
            answers.map((item, idx) => (
              <View
                key={item.id || idx}
                style={[
                  styles.answerItem,
                  item.is_defected ? { backgroundColor: '#fef2f2', borderColor: '#fecaca' } : {}
                ]}
              >
                <View style={[
                  styles.answerIndex,
                  item.is_defected ? { backgroundColor: '#fecaca' } : {}
                ]}>
                  <Text style={styles.answerIndexText}>
                    {item.is_defected ? '!' : idx + 1}
                  </Text>
                </View>

                <View style={styles.answerContent}>
                  <Text style={styles.questionText}>{item.question_text || 'No question text available'}</Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    <View style={[styles.answerBadge,
                    item.answer?.toLowerCase().includes('yes') || item.answer?.toLowerCase().includes('laboris') ? styles.yesBadge :
                      item.answer?.toLowerCase().includes('no') || item.answer?.toLowerCase().includes('dolore') ? styles.noBadge :
                        styles.noBadge
                    ]}>
                      <Text>{item.answer || 'No'}</Text>
                    </View>

                    <View style={[styles.answerBadge,
                    item.is_defected ? styles.failBadge : styles.passBadge
                    ]}>
                      <Text>{item.is_defected ? "FAIL" : "PASS"}</Text>
                    </View>

                    <View style={[styles.answerBadge, styles.ldfBadge]}>
                      <Text>LDF</Text>
                    </View>

                    {item.motion_detected && (
                      <View style={[styles.answerBadge, styles.yesBadge]}>
                        <Text>MOTION</Text>
                      </View>
                    )}
                  </View>

                  {item.is_defected && item.description && (
                    <Text style={styles.description}>
                      Defect Note: {item.description}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
              No checks performed
            </Text>
          )}
        </View>
      </View>

      {/* Defects & Notes */}
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DEFECTS REPORTED</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={{ fontSize: 10, lineHeight: 1.4 }}>
                {walkaround.defects || "No specific defects noted."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ADDITIONAL NOTES</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={{ fontSize: 10, lineHeight: 1.4 }}>
                {walkaround.note || "No additional notes."}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Signature Section */}
      {walkaround.signature && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SIGNATURE</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.signatureContainer}>
              <Image
                src={walkaround.signature}
                style={styles.signatureImage}
              />
              <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 5 }}>
                Signed by: {walkaround.conducted_by?.full_name || 'N/A'}
              </Text>
              <Text style={{ fontSize: 9, color: '#9ca3af' }}>
                Date: {formatDate(walkaround.date)} Time: {formatTime(walkaround.time)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 20 }} />
    </View>
  );
};

// Combined All Steps PDF Document
export const AllStepsPDFDocument = ({ stepDataList }: { stepDataList: any[] }) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover Page */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.title}>Vehicle Inspection Report</Text>
          <Text style={styles.subtitle}>Comprehensive Walkaround Details</Text>

          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#374151', marginBottom: 10 }}>
              {registration}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>
              {vehicleInfo?.vehicles_type_name || 'N/A'}
            </Text>

            <View style={[styles.statsContainer, { marginTop: 30, width: '80%' }]}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalSteps}</Text>
                <Text style={styles.statLabel}>Steps</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalDefects}</Text>
                <Text style={styles.statLabel}>Total Defects</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalChecks}</Text>
                <Text style={styles.statLabel}>Total Checks</Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 40 }}>
              Generated on {formatToDDMMYYYY(new Date())} at {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </Page>

      {/* Individual Steps */}
      {validSteps.map((step, index) => (
        <Page key={step.stepId} size="A4" style={styles.page}>
          <StepPDFDocument data={step.data!} stepNumber={step.stepNumber} />

          {/* Footer for each step page */}
          <View style={styles.footer}>
            <View>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Page {index + 2} of {validSteps.length + 1}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Step {step.stepNumber} of {validSteps.length}
              </Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};