'use client'

import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// ... your existing interfaces remain the same
interface Answer {
  id: number;
  question_text: string;
  answer: string;
  is_defected: boolean;
  description: string | null;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicles_type_name: string;
  last_mileage: number | null;
  purchase_mileage: string;
  mileage_unit: string;
  mileage_in_km: number;
  mileage_in_miles: number;
  site_allocated: Array<{
    id: number;
    name: string;
    status: string;
    image: string;
  }>;
}

interface UserInfo {
  id: number;
  email: string;
  full_name: string;
  role: string;
  avatar: string | null;
}

interface WalkaroundData {
  success: boolean;
  message: string;
  data: {
    walkaround: {
      id: number;
      vehicle: Vehicle;
      conducted_by: UserInfo;
      walkaround_assignee: UserInfo;
      walkaround_step: number;
      check_type: string;
      date: string;
      time: string;
      mileage: number | null;
      signature: string;
      note: string;
      defects: string;
      walkaround_duration: number | null;
      status: string;
      created_at: string;
      updated_at: string;
      parent: null;
    };
    answers: Answer[];
    total_answers: number;
    defected_count: number;
    non_defected_count: number;
  };
}

interface VehicleInspectionDashboardProps {
  data: WalkaroundData;
}

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#ea580c',
    padding: 20,
    borderRadius: 8,
    color: 'white',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fed7aa',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#ffedd5',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  sectionTitle: {
    fontSize: 16,
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
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
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
    padding: 12,
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
    marginRight: 12,
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
    marginBottom: 6,
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    marginRight: 6,
  },
  defectBadge: {
    backgroundColor: '#fecaca',
    color: '#dc2626',
  },
  description: {
    fontSize: 8,
    color: '#dc2626',
    fontStyle: 'italic',
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
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
  },
  signatureImage: {
    width: 150,
    height: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
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
  naBadge: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
});

export default function WalkAroundPDFPrint({ data }: VehicleInspectionDashboardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data || !data.success) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-lg">No data available</div>
      </div>
    );
  }

  const { walkaround, answers, defected_count } = data.data;

  const getAnswerStatus = (answer: string, is_defected: boolean) => {
    if (!answer) return { label: "N/A", style: styles.naBadge };
    
    const answerLower = answer.toLowerCase();
    if (answerLower.includes("yes") || answerLower.includes("laboris") || answerLower.includes("voluptas"))
      return { label: "Yes", style: styles.yesBadge };
    if (answerLower.includes("no") || answerLower.includes("dolore") || answerLower.includes("animi"))
      return { label: "No", style: styles.noBadge };
    return { label: "N/A", style: styles.naBadge };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  // Safe data access with fallbacks
  const safeWalkaround = walkaround || {};
  const safeVehicle = safeWalkaround.vehicle || {};
  const safeConductedBy = safeWalkaround.conducted_by || {};
  const safeAssignee = safeWalkaround.walkaround_assignee || {};
  const safeAnswers = answers || [];
  const safeDefectedCount = defected_count || 0;

  // PDF Document Component
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.headerTitle}>Walkaround Details</Text>
              <Text style={styles.headerSubtitle}>Walkaround #{safeWalkaround.id || 'N/A'}</Text>
            </View>
            <View style={[styles.badge, safeWalkaround.status === 'completed' ? styles.completedBadge : styles.pendingBadge]}>
              <Text>{(safeWalkaround.status || 'pending').charAt(0).toUpperCase() + (safeWalkaround.status || 'pending').slice(1)}</Text>
            </View>
          </View>

          <View style={[styles.grid, { marginTop: 15 }]}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Registration No.</Text>
              <Text style={styles.value}>{safeVehicle.registration_number || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Vehicle Type</Text>
              <Text style={styles.value}>{safeVehicle.vehicles_type_name || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Current Mileage</Text>
              <Text style={styles.value}>
                {safeVehicle.mileage_in_miles || 0} miles / {safeVehicle.mileage_in_km || 0} km
              </Text>
            </View>
          </View>
        </View>

        {/* Inspection Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>INSPECTION DETAILS</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Conducted By</Text>
                <Text style={styles.value}>{safeConductedBy.full_name || 'N/A'}</Text>
                <Text style={[styles.label, { fontSize: 8 }]}>{safeConductedBy.role || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Assignee</Text>
                <Text style={styles.value}>{safeAssignee.full_name || 'N/A'}</Text>
                <Text style={[styles.label, { fontSize: 8 }]}>{safeAssignee.role || 'N/A'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Date & Time</Text>
                <Text style={styles.value}>
                  {formatDate(safeWalkaround.date)} at {safeWalkaround.time || 'N/A'}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Check Type</Text>
                <Text style={styles.value}>{safeWalkaround.check_type || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Daily Checks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>DAILY CHECKS</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.badge, styles.yesBadge]}>
                  <Text>Pass: {safeAnswers.length - safeDefectedCount}</Text>
                </View>
                <View style={[styles.badge, styles.noBadge]}>
                  <Text>Defects: {safeDefectedCount}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.sectionContent}>
            {safeAnswers.length > 0 ? (
              safeAnswers.map((item, idx) => {
                const safeItem = item || {};
                const status = getAnswerStatus(safeItem.answer || '', safeItem.is_defected || false);
                
                return (
                  <View 
                    key={safeItem.id || idx} 
                    style={[
                      styles.answerItem, 
                      safeItem.is_defected ? { backgroundColor: '#fef2f2', borderColor: '#fecaca' } : {}
                    ]}
                  >
                    <View style={[
                      styles.answerIndex,
                      safeItem.is_defected ? { backgroundColor: '#fecaca' } : {}
                    ]}>
                      <Text style={styles.answerIndexText}>
                        {safeItem.is_defected ? '!' : idx + 1}
                      </Text>
                    </View>
                    
                    <View style={styles.answerContent}>
                      <Text style={styles.questionText}>{safeItem.question_text || 'No question text available'}</Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: safeItem.is_defected ? 6 : 0 }}>
                        <View style={[styles.answerBadge, status.style]}>
                          <Text>{status.label}</Text>
                        </View>
                        
                        {safeItem.is_defected && (
                          <View style={[styles.answerBadge, styles.defectBadge]}>
                            <Text>Defect</Text>
                          </View>
                        )}
                      </View>
                      
                      {safeItem.is_defected && safeItem.description && (
                        <Text style={styles.description}>{safeItem.description}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
                No answers available
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
                  {safeWalkaround.defects || "No specific defects noted."}
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
                  {safeWalkaround.note || "No additional notes."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signature */}
        {safeWalkaround.signature && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SIGNATURE</Text>
            </View>
            <View style={[styles.sectionContent, styles.signatureContainer]}>
              <Image 
                src={safeWalkaround.signature} 
                style={styles.signatureImage}
              />
            </View>
          </View>
        )}

      
      </Page>
    </Document>
  );

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<MyDocument />).toBlob();
      saveAs(blob, `walkaround-report-${safeWalkaround.id || 'unknown'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* PDF Button */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="px-5 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>
    </>
  );
}