'use client'

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Download, 
  FileText, 
  Eye, 
  X, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Gauge,
  Signature,
  Camera,
  Printer
} from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Add print styles
const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }
    
    .print-break-inside {
      page-break-inside: avoid;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .badge {
      border: 1px solid currentColor !important;
    }
    
    .print-card {
      border: 1px solid #e5e7eb !important;
      border-radius: 12px !important;
      margin-bottom: 20px !important;
      page-break-inside: avoid !important;
    }
    
    .print-header {
      background-color: #ffedd5 !important;
      border-bottom: 1px solid #fed7aa !important;
      padding: 12px 20px !important;
    }
    
    .print-text-orange {
      color: #9a3412 !important;
    }
    
    .print-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 24px !important;
      margin-bottom: 16px !important;
    }
    
    .print-answers-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 16px !important;
      max-height: none !important;
      overflow: visible !important;
    }
    
    .print-signature {
      border: 1px solid #d1d5db !important;
      border-radius: 8px !important;
      padding: 16px !important;
      background-color: #ffffff !important;
    }
  }
`;

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
        vehicle_type_name: string;
        last_mileage: string | null;
        purchase_mileage: string | null;
        mileage_unit: string;
        mileage_in_km: number | null;
        mileage_in_miles: number | null;
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
      check_type: string;
      date: string;
      time: string;
      mileage: number | null;
      signature: string | null;
      note: string | null;
      defects: string | null;
      walkaround_duration: string | null;
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
    marginBottom: 16,
  },
  column: {
    width: '48%',
  },
});

// Print Button Component
const PrintButton = ({ stepDataList }: { stepDataList: StepData[] }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }

    const validSteps = stepDataList.filter(step => step.data?.success);
    
    const formatTime = (timeString: string) => {
      if (!timeString) return 'N/A';
      return timeString.split(':').slice(0, 2).join(':');
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Inspection Report</title>
          <style>
            ${printStyles}
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
              margin: 20px;
              background: white;
              color: #1f2937;
            }
            
            .print-container {
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: #ffedd5;
              border-radius: 12px;
            }
            
            .print-title {
              font-size: 24px;
              font-weight: bold;
              color: #9a3412;
              margin-bottom: 8px;
            }
            
            .print-subtitle {
              font-size: 14px;
              color: #92400e;
            }
            
            .print-summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin: 20px 0;
            }
            
            .print-summary-item {
              padding: 16px;
              border-radius: 8px;
              text-align: center;
            }
            
            .print-summary-steps { background: #f0f9ff; }
            .print-summary-passed { background: #f0fdf4; }
            .print-summary-defects { background: #fef2f2; }
            
            .print-summary-number {
              font-size: 32px;
              font-weight: bold;
            }
            
            .print-summary-label {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            
            .print-step {
              page-break-after: always;
            }
            
            .print-step:last-child {
              page-break-after: auto;
            }
            
            .print-info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .print-info-label {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            
            .print-info-value {
              font-size: 13px;
              font-weight: 600;
              color: #1f2937;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .print-badge {
              display: inline-flex;
              align-items: center;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 600;
            }
            
            .print-badge-green {
              background: #10b981;
              color: white;
            }
            
            .print-badge-red {
              background: #ef4444;
              color: white;
            }
            
            .print-badge-orange {
              background: #ea580c;
              color: white;
            }
            
            .print-badge-gray {
              background: #6b7280;
              color: white;
            }
            
            .print-answer-item {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              background: #f9fafb;
              margin-bottom: 12px;
            }
            
            .print-answer-item.defect {
              background: #fef2f2;
              border-color: #fecaca;
              border-left: 4px solid #ef4444;
            }
            
            .print-answer-item.pass {
              border-left: 4px solid #10b981;
            }
            
            .print-question-number {
              display: inline-flex;
              width: 20px;
              height: 20px;
              border-radius: 9999px;
              background: #f3f4f6;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 600;
              margin-right: 8px;
            }
            
            .print-question-number.defect {
              background: #fee2e2;
              color: #dc2626;
            }
            
            .print-signature-img {
              max-height: 60px;
              object-fit: contain;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 4px;
              background: white;
            }
            
            .print-footer {
              margin-top: 20px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #6b7280;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Cover Page -->
            <div class="print-step">
              <div class="print-header">
                <h1 class="print-title">Vehicle Inspection Report</h1>
                <p class="print-subtitle">Comprehensive Walkaround Details</p>
              </div>
              
              ${validSteps[0]?.data ? `
                <div style="background: #ffedd5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h2 style="font-size: 20px; color: #9a3412; margin-bottom: 8px;">
                    ${validSteps[0].data.data.walkaround.vehicle?.registration_number || 'Unknown Vehicle'}
                  </h2>
                  <p style="color: #92400e;">
                    ${validSteps[0].data.data.walkaround.vehicle?.vehicle_type_name || 'N/A'}
                  </p>
                </div>
                
                <div class="print-summary">
                  <div class="print-summary-item print-summary-steps">
                    <div class="print-summary-number" style="color: #0ea5e9;">
                      ${validSteps.length}
                    </div>
                    <div class="print-summary-label">Total Steps</div>
                  </div>
                  
                  <div class="print-summary-item print-summary-passed">
                    <div class="print-summary-number" style="color: #10b981;">
                      ${validSteps.reduce((sum, step) => sum + ((step.data?.data.total_answers || 0) - (step.data?.data.defected_count || 0)), 0)}
                    </div>
                    <div class="print-summary-label">Passed Checks</div>
                  </div>
                  
                  <div class="print-summary-item print-summary-defects">
                    <div class="print-summary-number" style="color: #ef4444;">
                      ${validSteps.reduce((sum, step) => sum + (step.data?.data.defected_count || 0), 0)}
                    </div>
                    <div class="print-summary-label">Total Defects</div>
                  </div>
                </div>
                
                <div style="margin-top: 30px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">Summary of Defect Notes:</h3>
                  ${validSteps.flatMap(step => 
                    step.data?.data.answers
                      .filter(a => a.is_defected && a.description)
                      .map(a => `<div style="font-size: 11px; color: #dc2626; margin-bottom: 4px;">• ${a.description}</div>`)
                  ).join('') || '<div style="font-size: 11px; color: #6b7280; font-style: italic;">No defect notes recorded</div>'}
                </div>
                
                <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px;">
                  Generated on ${formatToDDMMYYYY(new Date().toISOString())} at ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ` : ''}
            </div>
            
            <!-- Individual Steps -->
            ${validSteps.map((step, stepIndex) => {
              const data = step.data?.data;
              if (!data) return '';
              
              const { walkaround, answers, defected_count, total_answers } = data;
              const motionDetectedCount = answers.filter(a => a.motion_detected).length;
              
              return `
                <div class="print-step">
                  <div class="print-card">
                    <div class="print-header">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <h3 style="font-size: 14px; font-weight: bold; color: #9a3412; margin-bottom: 4px;">
                            Walkaround Details <span style="color: #ea580c;">${String(step.stepNumber).padStart(2, "0")}</span>
                          </h3>
                          <p style="font-size: 11px; color: #92400e;">
                            Chain ID: #${walkaround.parent ?? "—"} · Latest Step: ${step.stepNumber} of ${step.stepNumber}
                          </p>
                        </div>
                        
                        <span class="print-badge ${walkaround.status === "completed" ? 'print-badge-green' : 'print-badge-orange'}" style="padding: 6px 12px;">
                          ${walkaround.status}
                        </span>
                      </div>
                    </div>
                    
                    <div style="padding: 20px;">
                      <div class="print-info-grid">
                        <div>
                          <div class="print-info-label">Registration No.</div>
                          <div class="print-info-value">${walkaround.vehicle?.registration_number || 'N/A'}</div>
                        </div>
                        
                        <div>
                          <div class="print-info-label">Vehicle Type</div>
                          <div class="print-info-value">${walkaround.vehicle?.vehicle_type_name || 'N/A'}</div>
                        </div>
                        
                        <div>
                          <div class="print-info-label">Sites</div>
                          <div class="print-info-value">
                            ${walkaround.vehicle?.site_allocated?.[0]?.name || 'N/A'}
                            <span class="print-badge print-badge-green" style="font-size: 10px;">Active</span>
                          </div>
                        </div>
                        
                        <div>
                          <div class="print-info-label">Current Mileage</div>
                          <div class="print-info-value">${walkaround.vehicle?.last_mileage} ${walkaround.vehicle?.mileage_unit}</div>
                        </div>
                      </div>
                      
                      <div class="print-info-grid" style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                        <div>
                          <div class="print-info-label">Driver</div>
                          <div class="print-info-value">
                            ${walkaround.conducted_by.full_name}
                            <span class="print-badge print-badge-green">${walkaround.conducted_by.role}</span>
                          </div>
                          <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">
                            ${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}
                          </div>
                        </div>
                        
                        <div>
                          <div class="print-info-label">Manager</div>
                          <div class="print-info-value">
                            ${walkaround.walkaround_assignee?.full_name ?? "Unroad worthy"}
                            <span class="print-badge print-badge-red">${walkaround.walkaround_assignee?.role || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div class="print-info-label">Motion Status</div>
                          <div style="display: flex; gap: 8px;">
                            <span class="print-badge print-badge-green">Static: ${answers.length - motionDetectedCount}</span>
                            <span class="print-badge print-badge-red">Motion: ${motionDetectedCount}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div class="print-info-label">Duration</div>
                          <div class="print-info-value">${walkaround.walkaround_duration ?? "—"}</div>
                        </div>
                      </div>
                      
                      ${walkaround.signature ? `
                        <div style="margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                          <div style="display: flex; align-items: center; gap: 16px;">
                            <img src="data:image/png;base64,${walkaround.signature}" class="print-signature-img" />
                            <div>
                              <div style="font-weight: 600;">${walkaround.conducted_by.full_name}</div>
                              <div style="font-size: 11px; color: #6b7280;">
                                ${formatToDDMMYYYY(walkaround.date)} at ${formatTime(walkaround.time)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ` : ''}
                      
                      <div style="margin-top: 20px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0;">
                          <h4 style="font-size: 13px; font-weight: bold; color: #374151;">Daily checks</h4>
                          <span class="print-badge print-badge-orange" style="background: #ea580c;">${defected_count} defects</span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                          ${answers.map((answer, idx) => `
                            <div class="print-answer-item ${answer.is_defected ? 'defect' : ''} ${answer.is_defected ? 'fail' : (answer.answer?.toLowerCase().includes('yes') ? 'pass' : '')}">
                              <div style="display: flex; align-items: flex-start; gap: 8px;">
                                <span class="print-question-number ${answer.is_defected ? 'defect' : ''}">${idx + 1}</span>
                                <div style="flex: 1;">
                                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                    <p style="font-size: 11px; font-weight: 600; margin: 0;">${answer.question_text}</p>
                                    <div style="display: flex; gap: 4px;">
                                      <span class="print-badge ${answer.is_defected ? 'print-badge-red' : 'print-badge-green'}" style="font-size: 9px;">
                                        ${answer.is_defected ? 'Fail' : 'Pass'}
                                      </span>
                                      <span class="print-badge print-badge-orange" style="font-size: 9px;">
                                        ${answer.motion_detected ? 'Motion' : 'Static'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                    <span class="print-badge print-badge-gray" style="font-size: 9px; background: #6b7280;">
                                      ${answer.answer || 'N/A'}
                                    </span>
                                    
                                    ${answer.prove ? `
                                      <span style="font-size: 9px; color: #2563eb;">📷 Image attached</span>
                                    ` : ''}
                                  </div>
                                  
                                  ${answer.is_defected && answer.description ? `
                                    <div style="margin-top: 8px; padding: 8px; background: #fee2e2; border-radius: 4px; font-size: 10px; color: #dc2626;">
                                      <strong>Defect Note:</strong> ${answer.description}
                                    </div>
                                  ` : ''}
                                </div>
                              </div>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                      
                      <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                          <h4 style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 8px; text-transform: uppercase;">
                            Defects Reported
                          </h4>
                          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; min-height: 60px;">
                            <p style="font-size: 11px; margin: 0;">${walkaround.defects || "No specific defects noted."}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 8px; text-transform: uppercase;">
                            Additional Notes
                          </h4>
                          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; min-height: 60px;">
                            <p style="font-size: 11px; margin: 0;">${walkaround.note || "No additional notes."}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div class="print-footer">
                        <span>Total Defects: ${defected_count} / ${total_answers}</span>
                        <span>${formatToDDMMYYYY(walkaround.date)} · ${formatTime(walkaround.time)}</span>
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
    <Button
      onClick={handlePrint}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg flex items-center justify-center group overflow-hidden no-print"
    >
      <Printer className="h-5 w-5" />
      <span className="absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
        Print Report
      </span>
    </Button>
  );
};

// Individual Step PDF Document
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

        {walkaround.signature && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Signature</Text>
            <View style={styles.signatureContainer}>
              <Image
                src={`data:image/png;base64,${walkaround.signature}`}
                style={styles.signatureImage}
              />
              <Text style={styles.signatureInfo}>
                Signed by: {walkaround.conducted_by?.full_name || 'N/A'}
              </Text>
              <Text style={[styles.signatureInfo, { marginTop: 4 }]}>
                Date: {formatToDDMMYYYY(walkaround.date)} • Time: {formatTime(walkaround.time)}
              </Text>
            </View>
          </View>
        )}

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
            </View>
          ))}
        </View>

        <View style={styles.twoColumn}>
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

// All Steps PDF Document
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
      <Page size="A4" style={styles.page}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
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
                {vehicleInfo?.vehicle_type_name || 'N/A'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
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
              Generated on {formatToDDMMYYYY(new Date().toISOString())} at {new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </Page>

      {validSteps.map((step, index) => (
        <Page key={step.stepId} size="A4" style={styles.page}>
          <StepPDFDocument data={step.data!} stepNumber={step.stepNumber} />

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
      className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3 gap-2 no-print"
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
      className="fixed bottom-6 right-24 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center group overflow-hidden no-print"
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

// Image Preview Modal Component
const ImagePreviewModal = ({ 
  imageUrl, 
  isOpen, 
  onClose 
}: { 
  imageUrl: string; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95 no-print">
        <DialogHeader className="p-4 border-b border-gray-700">
          <DialogTitle className="text-white flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Image Preview
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Signature Modal Component
const SignatureModal = ({ 
  signatureData, 
  isOpen, 
  onClose,
  conductedBy,
  date,
  time
}: { 
  signatureData: string; 
  isOpen: boolean; 
  onClose: () => void;
  conductedBy: { full_name: string } | null;
  date: string;
  time: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5 text-orange-500" />
            Signature Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
            <img
              src={`data:image/png;base64,${signatureData}`}
              alt="Signature"
              className="max-w-full max-h-[200px] object-contain mb-4 border border-gray-200 rounded-lg p-4 bg-white"
            />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Signed by: {conductedBy?.full_name || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                Date: {formatToDDMMYYYY(date)} • Time: {time}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);

    extractStepsFromURL();

    return () => {
      document.head.removeChild(style);
    };
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

  const formatDate = (dateString: string) => {
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
        <div className="flex justify-center gap-4 mb-6">
          <PrintButton stepDataList={stepDataList} />
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
              formatDate={formatDate}
              formatTime={formatTime}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Step Card Component
const StepCard = ({
  stepData,
  onSaveComments,
  savingStates,
  expandedSections,
  toggleSection,
  formatDate,
  formatTime,
}: {
  stepData: StepData
  onSaveComments: (answerId: number, comments: string, stepNumber?: number) => Promise<void>
  savingStates: Record<number, boolean>
  expandedSections: Record<string, boolean>
  toggleSection: (section: string) => void
  formatDate: (dateString: string) => string
  formatTime: (timeString: string) => string
}) => {
  const { stepNumber, data, loading, error } = stepData;
  const isExpanded = expandedSections[`step-${stepNumber}`] !== false;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState<boolean>(false);

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
  const hasImages = answers.some(a => a.prove);
  const hasSignature = !!walkaround.signature;

  return (
    <>
      <Card className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow print-card">
        <div className="flex justify-between items-center px-5 py-3 bg-orange-50 border-b border-orange-100 print-header">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span>Walkaround Details</span>
                <span className="text-orange-500 font-bold">{String(stepNumber).padStart(2, "0")}</span>
                {hasImages && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Camera className="h-4 w-4 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Images available</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {hasSignature && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Signature className="h-4 w-4 text-green-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Signature available</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Chain ID: #{walkaround.parent ?? "—"} · Latest Step: {stepNumber} of {stepNumber}
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center no-print">
            <Badge
              className={
                walkaround.status === "completed"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-orange-100 text-orange-700 border-orange-200"
              }
            >
              {walkaround.status}
            </Badge>
            <StepPDFDownloadButton data={data} />
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Info 
              label="Registration No." 
              value={
                <div className="flex items-center gap-2">
                  <span className="font-bold">{walkaround.vehicle?.registration_number || 'N/A'}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {walkaround.vehicle?.vehicle_type_name || 'N/A'}
                  </Badge>
                </div>
              } 
            />
            <Info 
              label="Walkaround Date" 
              value={
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>{formatDate(walkaround.date)} at {formatTime(walkaround.time)}</span>
                </div>
              } 
            />
            <Info
              label="Sites"
              value={
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span>{walkaround.vehicle?.site_allocated?.[0]?.name || 'N/A'}</span>
                </div>
              }
              badge={<Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>}
            />
            <Info
              label="Current Mileage"
              value={
                <div className="flex items-center gap-2">
                  <Gauge className="h-3 w-3 text-gray-400" />
                  <span>{walkaround.vehicle?.last_mileage} {walkaround.vehicle?.mileage_unit}</span>
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
            <Info
              label="Driver"
              value={
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{walkaround.conducted_by.full_name}</span>
                </div>
              }
              badge={<Badge className="bg-green-100 text-green-700 border-green-200">{walkaround.conducted_by.role}</Badge>}
            />

            <Info
              label="Manager"
              value={
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{walkaround.walkaround_assignee?.full_name ?? "Unroad worthy"}</span>
                </div>
              }
              badge={<Badge className="bg-red-100 text-red-700 border-red-200">{walkaround.walkaround_assignee?.role || 'N/A'}</Badge>}
            />

            <Info
              label="Motion Status"
              value={
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {motionNotDetectedCount}
                  </Badge>
                  <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {motionDetectedCount}
                  </Badge>
                </div>
              }
            />

            <Info
              label="Duration"
              value={
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>{walkaround.walkaround_duration ?? "—"}</span>
                </div>
              }
            />
          </div>

          {walkaround.signature && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                  <Signature className="h-3 w-3" />
                  Signature
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignature(true)}
                  className="h-7 px-2 text-xs gap-1 no-print"
                >
                  <Eye className="h-3 w-3" />
                  View Signature
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-4">
                <img
                  src={`data:image/png;base64,${walkaround.signature}`}
                  alt="Signature"
                  className="h-12 object-contain bg-white rounded border border-gray-200 p-1"
                />
                <div className="text-xs text-gray-600">
                  <p className="font-medium">{walkaround.conducted_by.full_name}</p>
                  <p>{formatDate(walkaround.date)} at {formatTime(walkaround.time)}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => toggleSection(`step-${stepNumber}`)}
            className="w-full flex justify-between items-center pt-3 border-t border-gray-200 text-sm font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors no-print"
          >
            <span className="flex items-center gap-2">
              <span>Daily checks</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {defected_count} defects
              </Badge>
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          <div className={`${isExpanded ? 'block' : 'hidden'} print:block`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 print:max-h-none print:overflow-visible print-answers-grid">
              {answers.map((answer, index) => (
                <AnswerItem
                  key={answer.id}
                  answer={answer}
                  index={index}
                  stepNumber={stepNumber}
                  onSaveComments={onSaveComments}
                  isSaving={savingStates[answer.id]}
                  onImageClick={setSelectedImage}
                />
              ))}
            </div>
          </div>

          {isExpanded && (
            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  Defects: {defected_count}/{total_answers}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Passed: {total_answers - defected_count}/{total_answers}
                </span>
              </div>
              <span>{formatDate(walkaround.date)} · {formatTime(walkaround.time)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedImage && (
        <ImagePreviewModal
          imageUrl={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {showSignature && walkaround.signature && (
        <SignatureModal
          signatureData={walkaround.signature}
          isOpen={showSignature}
          onClose={() => setShowSignature(false)}
          conductedBy={walkaround.conducted_by}
          date={walkaround.date}
          time={walkaround.time}
        />
      )}
    </>
  );
};

// Info helper component
const Info = ({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <div className="text-sm text-gray-900 flex items-center gap-2 flex-wrap">
      {value}
      {badge}
    </div>
  </div>
);

// Answer Item Component
const AnswerItem = ({
  answer,
  index,
  stepNumber,
  onSaveComments,
  isSaving,
  onImageClick
}: {
  answer: Answer;
  index: number;
  stepNumber: number;
  onSaveComments: (answerId: number, comments: string, stepNumber?: number) => Promise<void>;
  isSaving: boolean;
  onImageClick: (url: string) => void;
}) => {
  const [localComments, setLocalComments] = useState<string>(answer.description || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

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
      setShowComments(false);
    }
  };

  const getStatusColor = () => {
    if (answer.is_defected) return 'border-l-4 border-l-red-500';
    if (answer.answer?.toLowerCase().includes('yes')) return 'border-l-4 border-l-green-500';
    return 'border-l-4 border-l-gray-300';
  };

  return (
    <div className={`border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow ${getStatusColor()}`}>
      <div className="flex items-start gap-2">
        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
          answer.is_defected ? 'bg-red-100' : 'bg-gray-100'
        }`}>
          <span className={`text-xs font-semibold ${
            answer.is_defected ? 'text-red-600' : 'text-gray-600'
          }`}>{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-gray-900 leading-relaxed">
              {answer.question_text}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge className={
                answer.is_defected
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-green-100 text-green-700 border-green-200"
              } style={{ fontSize: '10px', padding: '2px 6px' }}>
                {answer.is_defected ? "Fail" : "Pass"}
              </Badge>
              <Badge className="bg-orange-50 text-orange-600 border-orange-200"
                style={{ fontSize: '10px', padding: '2px 6px' }}>
                {answer.motion_detected ? "Motion" : "Static"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {answer.answer || 'N/A'}
            </Badge>
            
            {answer.prove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImageClick(answer.prove!)}
                className="h-6 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 no-print"
              >
                <Eye className="h-3 w-3" />
                View Image
              </Button>
            )}
          </div>

          {answer.is_defected && (
            <div className="mt-2 space-y-2">
              {!showComments && answer.description && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="font-medium text-gray-700 mb-1">Defect Note:</p>
                  <p>{answer.description}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(true)}
                    className="mt-1 h-6 text-xs no-print"
                  >
                    Edit
                  </Button>
                </div>
              )}

              {showComments && (
                <div className="space-y-2 no-print">
                  <Textarea
                    placeholder="Add defect notes..."
                    className="min-h-[60px] text-xs resize-none bg-white border-gray-200"
                    value={localComments}
                    onChange={(e) => handleCommentsChange(e.target.value)}
                    disabled={isSaving}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
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
                    <Button
                      onClick={() => {
                        setShowComments(false);
                        setLocalComments(answer.description || '');
                        setHasChanges(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectionDashboard;