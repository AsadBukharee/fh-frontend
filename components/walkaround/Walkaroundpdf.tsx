'use client'

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';

import { Printer, Download, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import { WalkaroundData, StepData, Answer, FollowupAnswer } from './types';

// Browser Print Styles
export const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }
    
    body {
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .no-print {
      display: none !important;
    }
    
    .print-container {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
    }

    .print-card {
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      margin-bottom: 24px !important;
      overflow: hidden !important;
      page-break-inside: avoid !important;
      box-shadow: none !important;
    }

    .print-header-bg {
      background-color: #fffaf5 !important;
      border-bottom: 1px solid #fed7aa !important;
    }

    .print-badge {
      display: inline-flex !important;
      align-items: center !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      text-transform: capitalize !important;
      border: 1px solid transparent !important;
    }

    .print-badge-completed {
      background-color: #f0fdf4 !important;
      color: #15803d !important;
      border-color: #bbf7d0 !important;
    }

    .print-badge-pending {
      background-color: #fffad1 !important;
      color: #9a3412 !important;
      border-color: #fef08a !important;
    }

    .print-badge-red {
      background-color: #fef2f2 !important;
      color: #dc2626 !important;
      border-color: #fecaca !important;
    }

    .print-badge-green {
      background-color: #f0fdf4 !important;
      color: #16a34a !important;
      border-color: #bbf7d0 !important;
    }

    .print-badge-gray {
      background-color: #f3f4f6 !important;
      color: #4b5563 !important;
      border-color: #e5e7eb !important;
    }

    .print-info-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 0 !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }

    .print-info-item {
      padding: 12px 16px !important;
    }

    .print-label {
      font-size: 10px !important;
      color: #94a3b8 !important;
      margin-bottom: 4px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.025em !important;
    }

    .print-value {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #0f172a !important;
    }

    .print-subvalue {
      font-size: 10px !important;
      color: #64748b !important;
      margin-top: 2px !important;
    }

    .print-accent-bar {
      width: 4px !important;
      height: 100% !important;
      background-color: #ef4444 !important;
      border-radius: 0 4px 4px 0 !important;
    }

    .print-answers-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
      padding: 16px !important;
    }

    .print-answer-item {
      border: 1px solid #f1f5f9 !important;
      border-radius: 10px !important;
      padding: 12px !important;
      background-color: #ffffff !important;
      display: flex !important;
      gap: 12px !important;
      align-items: flex-start !important;
      position: relative !important;
    }

    .print-answer-item-defect {
      background-color: #fef2f2 !important;
      border-color: #fee2e2 !important;
    }

    .print-status-dot {
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      flex-shrink: 0 !important;
      margin-top: 5px !important;
    }

    .print-sig-container {
      background-color: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 8px !important;
      overflow: hidden !important;
    }

    .print-sig-image {
      max-height: 48px !important;
      object-fit: contain !important;
    }

    .print-defect-box-blue {
      background-color: #eff6ff !important;
      border: 1px solid #dbeafe !important;
      color: #2563eb !important;
      padding: 8px !important;
      border-radius: 6px !important;
    }

    .print-note-box-gray {
      background-color: #f8fafc !important;
      border: 1px solid #f1f5f9 !important;
      color: #475569 !important;
      padding: 8px !important;
      border-radius: 6px !important;
      min-height: 40px !important;
    }

    .print-badge-red-solid {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      padding: 2px 8px !important;
      border-radius: 4px !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
    }

    .print-badge-orange-solid {
      background-color: #f97316 !important;
      color: #ffffff !important;
      padding: 2px 8px !important;
      border-radius: 4px !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
    }
  }
`;

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 24,
    fontFamily: 'Helvetica',
  },
  stepCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
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
  cardContent: {
    padding: 20,
  },
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
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  answerCard: {
    width: '48%',
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
  defectNote: {
    fontSize: 9,
    color: '#dc2626',
    fontStyle: 'italic',
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
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
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  column: {
    width: '48%',
  },
  defectBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  defectText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'medium',
  },
  noteBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    minHeight: 40,
  },
  noteText: {
    fontSize: 10,
    color: '#475569',
  },
  sigBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginTop: 8,
  },
  sigBadgeRed: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sigBadgeOrange: {
    backgroundColor: '#f97316',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

// Utility helpers
export const collectDefectNotes = (items: (Answer | FollowupAnswer)[]): string[] => {
  const notes: string[] = [];
  items?.forEach(item => {
    if (item.description && (('is_defected' in item && item.is_defected) || ('selected' in item && item.selected))) {
      notes.push(item.description);
    }
    if (item.followup_answers?.length > 0) {
      notes.push(...collectDefectNotes(item.followup_answers));
    }
  });
  return notes;
};

export const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  return timeString.split(':').slice(0, 2).join(':');
};

// PDF Components for @react-pdf/renderer
const FollowupAnswerPDF = ({ followup, depth = 0 }: { followup: FollowupAnswer; depth?: number }) => {
  return (
    <View style={{
      marginTop: 4,
      marginLeft: depth * 10 + 5,
      borderLeftWidth: 1,
      borderLeftColor: '#fed7aa',
      paddingLeft: 8,
      paddingVertical: 4,
      backgroundColor: '#ffffff',
      borderRadius: 4,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#4b5563', flex: 1, marginRight: 4 }}>
          {followup.followup_question_text}
        </Text>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <View style={[styles.badge, followup.selected ? styles.ldfBadge : { backgroundColor: '#9ca3af' }, { fontSize: 7, paddingVertical: 1 }]}>
            <Text>{followup.selected ? 'Selected' : 'N/A'}</Text>
          </View>
          {followup.severity && (
            <View style={[styles.badge, followup.severity === 'IMMEDIATE' ? styles.failBadge : styles.ldfBadge, { fontSize: 7, paddingVertical: 1 }]}>
              <Text>{followup.severity}</Text>
            </View>
          )}
        </View>
      </View>
      {followup.followup_answers?.length > 0 && (
        <View>
          {followup.followup_answers.map((sub) => (
            <FollowupAnswerPDF key={sub.id} followup={sub} depth={depth + 1} />
          ))}
        </View>
      )}
    </View>
  );
};

export const StepPDFDocument = ({ data, stepNumber }: { data: WalkaroundData; stepNumber: number }) => {
  const { walkaround, answers, defected_count, total_answers } = data.data;

  const motionDetectedCount = answers.filter(a => a.motion_detected).length;
  const motionNotDetectedCount = answers.length - motionDetectedCount;

  return (
    <View style={styles.stepCard}>
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>
              Walkaround Details <Text style={{ color: '#ea580c' }}>{String(stepNumber).padStart(2, "0")}</Text>
            </Text>

          </View>

          <View style={[styles.badge,
          walkaround.status === "completed" ? styles.statusBadge : styles.pendingBadge
          ]}>
            <Text>{walkaround.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Registration No.</Text>
            <Text style={styles.value}>{walkaround.vehicle?.registration_number || 'N/A'}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>Vehicle Type</Text>
            <Text style={styles.value}>{walkaround.vehicle?.vehicle_type_name || 'N/A'}</Text>
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
            <Text style={styles.value}>{walkaround.walkaround_duration ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.dailyChecksHeader}>
          <Text style={styles.dailyChecksTitle}>Daily checks</Text>
          <View style={styles.statsContainer}>
            <View style={[styles.badge, styles.failBadge]}>
              <Text>Defects: {defected_count}</Text>
            </View>
          </View>
        </View>

        <View style={styles.answersGrid}>
          {answers.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.answerCard,
                item.is_defected ? styles.answerCardDefect : {}
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
                  <Text>{item.motion_detected ? 'Motion' : 'Static'}</Text>
                </View>

                <View style={[
                  styles.badge,
                  item.is_defected ? styles.failBadge : styles.passBadge,
                  { fontSize: 8 }
                ]}>
                  <Text>{item.is_defected ? 'Fail' : 'Pass'}</Text>
                </View>

                <View style={[styles.badge, { backgroundColor: '#6b7280', fontSize: 8 }]}>
                  <Text>{item.answer || 'N/A'}</Text>
                </View>
              </View>

              {item.prove && (
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 8, color: '#2563eb' }}>📷 Image attached</Text>
                </View>
              )}

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

              {item.followup_answers?.length > 0 && (
                <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 4 }}>
                  <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase' }}>
                    Follow-up Details
                  </Text>
                  {item.followup_answers.map((f) => (
                    <FollowupAnswerPDF key={f.id} followup={f} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.twoColumn}>
          {/* Driver Column */}
          <View style={styles.column}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginRight: 8 }}>
              <Text style={styles.sectionTitle}>Driver</Text>

            </View>
            <View style={{ marginBottom: 12, marginRight: 8 }}>
              <Text style={styles.label}>Reported Defects</Text>
              <View style={styles.defectBox}>
                <Text style={styles.defectText}>
                  {collectDefectNotes(answers).join(', ') || 'No defects reported'}
                </Text>
              </View>
            </View>
            <View style={{ marginBottom: 12, marginRight: 8 }}>
              <Text style={styles.label}>Note (Required)</Text>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  {walkaround.note || 'No additional note provided'}
                </Text>
              </View>
            </View>
            {walkaround.signature && (
              <View style={{ marginRight: 8 }}>
                <Text style={styles.label}>Signature</Text>
                <View style={styles.sigBox}>
                  <Image src={walkaround.signature} style={styles.signatureImage} />
                  <Text style={styles.signatureName}>{walkaround.conducted_by?.full_name}</Text>
                  <Text style={styles.signatureInfo}>
                    {formatToDDMMYYYY(walkaround.date)} at {formatTime(walkaround.time)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* CP Column */}
          <View style={[styles.column, { paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>CP</Text>

            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Reported Defects</Text>
              <View style={styles.noteBox}>
                <Text style={[styles.noteText, { fontStyle: 'italic' }]}>
                  {defected_count > 0 ? "Defects reviewed and pending action" : "N/A - No defects detected"}
                </Text>
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Note (Required)</Text>
              <View style={[styles.noteBox, { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={[styles.noteText, { color: '#94a3b8', fontStyle: 'italic' }]}>Add a note about this update</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {data.data.cp_signature ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>CP Signature</Text>
                  <View style={styles.sigBox}>
                    <Image src={data.data.cp_signature.signature} style={{ width: 60, height: 30, objectFit: 'contain' }} />
                    <Text style={styles.signatureName}>{data.data.cp_signature.user_name}</Text>
                    <Text style={styles.signatureInfo}>{formatToDDMMYYYY(data.data.cp_signature.signed_at)}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic' }}>Awaiting CP signature</Text>
                </View>
              )}
              {walkaround.signature && !data.data.cp_signature && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>TM Sign Off</Text>
                  <View style={[styles.sigBox, { opacity: 0.5 }]}>
                    <Image src={walkaround.signature} style={{ width: 60, height: 30, objectFit: 'contain' }} />
                    <Text style={styles.signatureInfo}>{walkaround.walkaround_assignee?.full_name || 'N/A'}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

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

export const PrintReportButton = ({ stepDataList, onRefresh }: { stepDataList: StepData[], onRefresh?: () => void }) => {
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const handlePrint = (includeImages: boolean) => {
    setShowPrintDialog(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    const validSteps = stepDataList.filter(step => step.data?.success);

    const firstStep = validSteps[0];
    const walkaroundInfo = firstStep?.data?.data.walkaround;
    const vehicleReg = walkaroundInfo?.vehicle?.registration_number || 'Vehicle';
    const dateFormatted = walkaroundInfo?.date ? formatToDDMMYYYY(walkaroundInfo.date) : 'Date';
    const documentTitle = `Walkaround_${vehicleReg}_${dateFormatted}`;

    const renderFollowupsHtml = (followups: FollowupAnswer[]): string => {
      if (!followups || followups.length === 0) return '';
      return `
        <div style="margin-top: 8px; border-left: 2px solid #fed7aa; padding-left: 12px; display: flex; flex-direction: column; gap: 8px;">
          ${followups.map(f => `
            <div style="background: white; padding: 8px; border-radius: 6px; border: 1px solid #fed7aa;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <p style="font-size: 10px; font-weight: 600; margin: 0; color: #4b5563;">${f.followup_question_text}</p>
                <div style="display: flex; gap: 4px;">
                  <span class="print-badge ${f.selected ? 'print-badge-orange' : 'print-badge-gray'}" style="font-size: 8px;">
                    ${f.selected ? 'Selected' : 'N/A'}
                  </span>
                  ${f.severity ? `
                    <span class="print-badge ${f.severity === 'IMMEDIATE' ? 'print-badge-red' : 'print-badge-orange'}" style="font-size: 8px;">
                      ${f.severity}
                    </span>
                  ` : ''}
                </div>
              </div>
              ${renderFollowupsHtml(f.followup_answers)}
            </div>
          `).join('')}
        </div>
      `;
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            ${printStyles}
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
              color: #1e293b;
              line-height: 1.5;
            }
            
            .print-container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
            }
            
            p, h1, h2, h3, h4 { margin: 0; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${validSteps.map((step) => {
      const data = step.data?.data;
      if (!data) return '';

      const { walkaround, answers, defected_count, cp_signature } = data;
      const motionDetectedCount = answers.filter(a => a.motion_detected).length;
      const motionNotDetectedCount = answers.length - motionDetectedCount;
      const defectNotes = collectDefectNotes(answers);

      return `
                <div class="print-card">
                  <!-- Header Section -->
                  <div class="print-header-bg" style="padding: 16px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div>
                        <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                          Walkaround Details <span style="color: #f97316;">${String(step.stepNumber).padStart(2, '0')}</span>
                        </h2>
                    
                      </div>
                      <div style="text-align: right;">
                        <p style="font-size: 11px; color: #94a3b8;">
                          ${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style="padding: 16px;">
                    <!-- Vehicle Details Section -->
                    <div style="border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
                      <div style="padding: 10px 16px; border-bottom: 1px solid #f8fafc; display: flex; align-items: center; justify-content: space-between; background-color: #ffffff;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #f97316; font-size: 13px; font-weight: 600;">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
                            <circle cx="7.5" cy="17.5" r="2.5" />
                            <circle cx="17.5" cy="17.5" r="2.5" />
                          </svg>
                          Vehicle Details
                        </div>
                        <span class="print-badge ${walkaround.status === 'completed' ? 'print-badge-completed' : 'print-badge-pending'}">
                          ${walkaround.status}
                        </span>
                      </div>

                      <!-- Sub Row 1 -->
                      <div class="print-info-grid">
                        <div class="print-info-item" style="border-right: 1px solid #f1f5f9;">
                          <p class="print-label">Registration No.</p>
                          <p class="print-value">${walkaround.vehicle?.registration_number || 'N/A'}</p>
                        </div>
                        <div class="print-info-item" style="border-right: 1px solid #f1f5f9;">
                          <p class="print-label">Vehicle Type</p>
                          <p class="print-value">${walkaround.vehicle?.vehicle_type_name || 'N/A'}</p>
                        </div>
                        <div class="print-info-item" style="border-right: 1px solid #f1f5f9;">
                          <p class="print-label">Sites</p>
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <p class="print-value">${walkaround.vehicle?.site_allocated?.[0]?.name || 'N/A'}</p>
                            <span style="font-size: 9px; font-weight: 700; color: #15803d; background-color: #f0fdf4; padding: 1px 6px; border-radius: 9999px;">Active</span>
                          </div>
                        </div>
                        <div class="print-info-item">
                          <p class="print-label">Current Mileage</p>
                          <p class="print-value">${walkaround.vehicle?.last_mileage} ${walkaround.vehicle?.mileage_unit}</p>
                        </div>
                      </div>

                      <!-- Sub Row 2 -->
                      <div class="print-info-grid">
                        <div class="print-info-item" style="border-right: 1px solid #f1f5f9;">
                          <p class="print-label">Driver Name</p>
                          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                            <p class="print-value">${walkaround.conducted_by.full_name}</p>
                            <span style="font-size: 9px; font-weight: 700; color: #15803d; background-color: #f0fdf4; padding: 1px 6px; border-radius: 9999px;">${walkaround.conducted_by.role}</span>
                          </div>
                          <p class="print-subvalue">${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}</p>
                        </div>
                        <div class="print-info-item" style="border-right: 1px solid #f1f5f9;">
                          <p class="print-label">Manager Name</p>
                          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                            <p class="print-value">${walkaround.walkaround_assignee?.full_name ?? 'Unroad worthy'}</p>
                            ${walkaround.walkaround_assignee ? `<span style="font-size: 9px; font-weight: 700; color: #9a3412; background-color: #fffad1; padding: 1px 6px; border-radius: 9999px;">${walkaround.walkaround_assignee.role}</span>` : ''}
                          </div>
                          <p class="print-subvalue">${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}</p>
                        </div>
                        <div class="print-info-item" style="border-right: 1px solid #f1f5f9;">
                          <p class="print-label">Motion</p>
                          <div style="display: flex; gap: 6px;">
                            <span style="font-size: 11px; font-weight: 700; color: #ffffff; background-color: #22c55e; padding: 2px 8px; border-radius: 9999px;">${motionNotDetectedCount}</span>
                            <span style="font-size: 11px; font-weight: 700; color: #ffffff; background-color: #ef4444; padding: 2px 8px; border-radius: 9999px;">${motionDetectedCount}</span>
                          </div>
                        </div>
                        <div class="print-info-item">
                          <p class="print-label">Total Time</p>
                          <span style="font-size: 11px; font-weight: 700; color: #ffffff; background-color: #22c55e; padding: 2px 8px; border-radius: 9999px;">${walkaround.walkaround_duration ?? '—'}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Daily Checks Section -->
                    <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; font-weight: 600; font-size: 13px; color: #1e293b;">
                      Daily checks
                    </div>

                    <div class="print-answers-grid">
                      ${answers.map((answer, idx) => `
                        <div class="print-answer-item ${answer.is_defected ? 'print-answer-item-defect' : ''}">
                          ${answer.is_defected ? '<div class="print-accent-bar" style="position: absolute; left: 0; top: 0; height: 100%;"></div>' : ''}
                          <div class="print-status-dot" style="background-color: ${answer.is_defected ? '#ef4444' : '#22c55e'};"></div>
                          <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                              <p style="font-size: 11px; font-weight: 700; color: #334155;">${idx + 1}. ${answer.question_text}</p>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                              <span class="print-badge print-badge-gray">${answer.motion_detected ? 'Motion' : 'Static'}</span>
                              <span class="print-badge ${answer.is_defected ? 'print-badge-red' : 'print-badge-green'}">${answer.is_defected ? 'Fail' : 'Pass'}</span>
                              <span class="print-badge print-badge-gray" style="background-color: #475569; color: #ffffff;">${answer.answer || 'N/A'}</span>
                              ${answer.prove ? `
                                <span style="font-size: 9px; color: #2563eb; display: flex; align-items: center; gap: 4px;">📷 Image attached</span>
                                ${includeImages ? `<div style="margin-top: 8px; width: 100%;"><img src="${answer.prove}" style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain;" /></div>` : ''}
                              ` : ''}
                            </div>

                            ${answer.is_defected && answer.description ? `
                              <div style="margin-top: 6px; padding: 6px; background-color: #fee2e2; border-radius: 6px; font-size: 10px; color: #b91c1c;">
                                <strong>Defect Note:</strong> ${answer.description}
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      `).join('')}
                    </div>

                    <!-- Signature & Notes Section (Two Column) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid #f1f5f9; margin-top: 10px;">
                      <!-- Left Column: Driver -->
                      <div style="border-right: 1px solid #f1f5f9; padding: 20px 24px 20px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0f172a; letter-spacing: 0.025em;">Driver</p>

                        </div>
                        
                        <div style="margin-bottom: 16px;">
                          <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Reported Defects</p>
                          <div class="print-defect-box-blue" style="font-size: 11px; font-weight: 500;">
                            ${defectNotes.join(', ') || 'No defects reported'}
                          </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                          <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Note (Required)</p>
                          <div class="print-note-box-gray" style="font-size: 11px;">
                            ${walkaround.note || 'No additional note provided'}
                          </div>
                        </div>

                        ${walkaround.signature ? `
                          <div>
                            <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Signature</p>
                            <div class="print-sig-container" style="display: inline-block;">
                              <img src="${walkaround.signature}" class="print-sig-image" />
                            </div>
                            <p style="font-size: 10px; color: #475569; font-weight: 500; margin-top: 6px;">
                              ${walkaround.conducted_by.full_name}
                            </p>
                            <p style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                              ${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}
                            </p>
                          </div>
                        ` : ''}
                      </div>

                      <!-- Right Column: CP -->
                      <div style="padding: 20px 0 20px 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0f172a; letter-spacing: 0.025em;">CP</p>
                         
                        </div>

                        <div style="margin-bottom: 16px;">
                          <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Reported Defects</p>
                          <div class="print-note-box-gray" style="font-size: 11px; font-style: italic;">
                            ${defected_count > 0 ? "Defects reviewed and pending action" : "N/A - No defects detected"}
                          </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                          <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Note (Required)</p>
                          <div style="padding: 12px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center;">
                            <p style="font-size: 10px; color: #94a3b8; font-style: italic;">Add a note about this update</p>
                          </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                          ${cp_signature ? `
                            <div>
                              <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">CP Signature</p>
                              <div class="print-sig-container" style="display: inline-block;">
                                <img src="${cp_signature.signature}" class="print-sig-image" />
                              </div>
                              <p style="font-size: 10px; color: #475569; font-weight: 500; margin-top: 6px;">
                                ${cp_signature.user_name}
                              </p>
                              <p style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                                ${formatToDDMMYYYY(cp_signature.signed_at)}
                              </p>
                            </div>
                          ` : `
                            <div style="grid-column: span 2; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; text-align: center;">
                              <p style="font-size: 11px; color: #94a3b8; font-style: italic;">Awaiting CP signature</p>
                            </div>
                          `}

                          ${walkaround.signature && !cp_signature ? `
                            <div>
                              <p style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">TM Sign Off</p>
                              <div style="opacity: 0.5; filter: grayscale(1);">
                                <img src="${walkaround.signature}" style="max-height: 40px; object-fit: contain;" />
                              </div>
                              <p style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                                ${walkaround.walkaround_assignee?.full_name || 'N/A'}
                              </p>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 no-print">
        <TooltipProvider>
          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRefresh}
                  size="icon"
                  className="h-14 w-14 rounded-full bg-slate-600 hover:bg-slate-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                  <RefreshCcw className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-slate-900 text-white border-none">
                <p className="text-xs font-bold">Refresh Data</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowPrintDialog(true)}
                size="icon"
                className="h-14 w-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <Printer className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-slate-900 text-white border-none">
              <p className="text-xs font-bold">Print Report</p>
            </TooltipContent>
          </Tooltip>


        </TooltipProvider>
      </div>

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Report Options</DialogTitle>
            <DialogDescription>
              Would you like to include the inspection images in the printed report?
              Including images provides more context but will increase the document length.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => handlePrint(false)}>
              Print without Images
            </Button>
            <Button onClick={() => handlePrint(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
              Print with Images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};