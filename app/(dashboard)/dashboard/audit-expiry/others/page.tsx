"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { format } from "date-fns";
import { FolderClosed } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import FileUploader from "@/components/Media/MediaUpload";
import { DatePickerField } from "@/components/ui/DatePicker";

interface AuditItem {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  status: "after" | "before";
  lastCheckDate: string | null;
  directory: string | null;
}

const API = `${API_URL}/activity/audit-expiry-others/`;

// API → UI
const transformFromApi = (data: any): AuditItem[] => {
  const toISO = (date: string | null) => (date ? new Date(date).toISOString().split("T")[0] : null);

  return [
    {
      id: "operator_compliance_score",
      title: "Operator Compliance Score",
      subtitle: "Alert Before Operator Compliance Score",
      days: Math.abs(data.operator_compliance_score || 0),
      status: data.operator_compliance_score < 0 ? "before" : "after",
      lastCheckDate: toISO(data.operator_compliance_score_reference_date),
      directory: data.operator_compliance_score_directory,
    },
    {
      id: "test_report_history",
      title: "Test Report History",
      subtitle: "Alert After Test Report History",
      days: Math.abs(data.test_report_history || 0),
      status: data.test_report_history < 0 ? "before" : "after",
      lastCheckDate: toISO(data.test_report_history_reference_date),
      directory: data.test_report_history_directory,
    },
    {
      id: "vehicle_encounter_report",
      title: "Vehicle Encounter Report",
      subtitle: "Alert Before Vehicle Encounter Report",
      days: Math.abs(data.vehicle_encounter_report || 0),
      status: data.vehicle_encounter_report < 0 ? "before" : "after",
      lastCheckDate: toISO(data.vehicle_encounter_report_reference_date),
      directory: data.vehicle_encounter_report_directory,
    },
    {
      id: "yearly_maintenance_provider_audit",
      title: "Yearly Maintenance Provider Audit",
      subtitle: "Alert After Yearly Maintenance Provider Audit",
      days: Math.abs(data.yearly_maintenance_provider_audit || 0),
      status: data.yearly_maintenance_provider_audit < 0 ? "before" : "after",
      lastCheckDate: toISO(data.yearly_maintenance_provider_audit_reference_date),
      directory: data.yearly_maintenance_provider_audit_directory,
    },
    {
      id: "yearly_garage_equipment_audit",
      title: "Yearly Garage Equipment Audit",
      subtitle: "Alert Before Yearly Garage Equipment Audit",
      days: Math.abs(data.yearly_garage_equipment_audit || 0),
      status: data.yearly_garage_equipment_audit < 0 ? "before" : "after",
      lastCheckDate: toISO(data.yearly_garage_equipment_audit_reference_date),
      directory: data.yearly_garage_equipment_audit_directory,
    },
    {
      id: "vol_review",
      title: "VOL Review",
      subtitle: "Alert Before VOL Review",
      days: Math.abs(data.vol_review || 0),
      status: data.vol_review < 0 ? "before" : "after",
      lastCheckDate: toISO(data.vol_review_reference_date),
      directory: data.vol_review_directory,
    },
    {
      id: "transport_manager_refresher_check",
      title: "Transport Manager Refresher Check",
      subtitle: "Alert After Transport Manager Refresher Check",
      days: Math.abs(data.transport_manager_refresher_check || 0),
      status: data.transport_manager_refresher_check < 0 ? "before" : "after",
      lastCheckDate: toISO(data.transport_manager_refresher_check_reference_date),
      directory: data.transport_manager_refresher_check_directory,
    },
    {
      id: "transport_manager_cpc_card_check",
      title: "Transport Manager CPC Card Check",
      subtitle: "Alert After Transport Manager CPC Card Check",
      days: Math.abs(data.transport_manager_cpc_card_check || 0),
      status: data.transport_manager_cpc_card_check < 0 ? "before" : "after",
      lastCheckDate: toISO(data.transport_manager_cpc_card_check_reference_date),
      directory: data.transport_manager_cpc_card_check_directory,
    },
    // ADDED: Torque Wrench Calibration
    {
      id: "torque_wrench_calibration",
      title: "Torque Wrench Calibration",
      subtitle: "Alert After Calibration Due",
      days: data.torque_wrench_calibration === null ? 0 : Math.abs(data.torque_wrench_calibration),
      status: data.torque_wrench_calibration === null || data.torque_wrench_calibration >= 0 ? "after" : "before",
      lastCheckDate: toISO(data.torque_wrench_calibration_reference_date ?? null),
      directory: data.torque_wrench_calibration_directory ?? null,
    },
  ];
};

// UI → API
const transformToApi = (items: AuditItem[]) => {
  const getVal = (id: string) => {
    const item = items.find((x) => x.id === id);
    if (!item) return 0;
    return item.status === "before" ? -item.days : item.days;
  };
  const get = (id: string) => items.find((x) => x.id === id);

  return {
    id: 1,
    operator_compliance_score: getVal("operator_compliance_score"),
    operator_compliance_score_reference_date: get("operator_compliance_score")?.lastCheckDate || null,
    operator_compliance_score_directory: get("operator_compliance_score")?.directory || null,

    test_report_history: getVal("test_report_history"),
    test_report_history_reference_date: get("test_report_history")?.lastCheckDate || null,
    test_report_history_directory: get("test_report_history")?.directory || null,

    vehicle_encounter_report: getVal("vehicle_encounter_report"),
    vehicle_encounter_report_reference_date: get("vehicle_encounter_report")?.lastCheckDate || null,
    vehicle_encounter_report_directory: get("vehicle_encounter_report")?.directory || null,

    yearly_maintenance_provider_audit: getVal("yearly_maintenance_provider_audit"),
    yearly_maintenance_provider_audit_reference_date: get("yearly_maintenance_provider_audit")?.lastCheckDate || null,
    yearly_maintenance_provider_audit_directory: get("yearly_maintenance_provider_audit")?.directory || null,

    yearly_garage_equipment_audit: getVal("yearly_garage_equipment_audit"),
    yearly_garage_equipment_audit_reference_date: get("yearly_garage_equipment_audit")?.lastCheckDate || null,
    yearly_garage_equipment_audit_directory: get("yearly_garage_equipment_audit")?.directory || null,

    vol_review: getVal("vol_review"),
    vol_review_reference_date: get("vol_review")?.lastCheckDate || null,
    vol_review_directory: get("vol_review")?.directory || null,

    transport_manager_refresher_check: getVal("transport_manager_refresher_check"),
    transport_manager_refresher_check_reference_date: get("transport_manager_refresher_check")?.lastCheckDate || null,
    transport_manager_refresher_check_directory: get("transport_manager_refresher_check")?.directory || null,

    transport_manager_cpc_card_check: getVal("transport_manager_cpc_card_check"),
    transport_manager_cpc_card_check_reference_date: get("transport_manager_cpc_card_check")?.lastCheckDate || null,
    transport_manager_cpc_card_check_directory: get("transport_manager_cpc_card_check")?.directory || null,

    // Torque Wrench
    torque_wrench_calibration: getVal("torque_wrench_calibration"),
    torque_wrench_calibration_reference_date: get("torque_wrench_calibration")?.lastCheckDate || null,
    torque_wrench_calibration_directory: get("torque_wrench_calibration")?.directory || null,
  };
};

export default function Others() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editableDays, setEditableDays] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const token = useCookies().get("access_token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}1/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setAuditItems(transformFromApi(json.data));
        }
      } catch (err) {
        console.error("Error fetching audit data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const updateItem = (id: string, field: keyof AuditItem, value: any) => {
    setAuditItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleStatus = (id: string) => {
    setAuditItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "after" ? "before" : "after" }
          : item
      )
    );
  };

  const handleFileUpload = (id: string, url: string) => {
    setUploading((prev) => ({ ...prev, [id]: true }));
    updateItem(id, "directory", url);
    setTimeout(() => setUploading((prev) => ({ ...prev, [id]: false })), 600);
  };

  const handleSave = async () => {
    const invalid = auditItems.some((item) => item.lastCheckDate && !item.directory);
    if (invalid) {
      alert("Cannot save: All items with a Last Check Date must have an uploaded document.");
      return;
    }

    setSaving(true);
    try {
      const payload = transformToApi(auditItems);
      await fetch(`${API}1/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      alert("Saved successfully!");
    } catch (err) {
      alert("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-3 relative bg-white">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
      )}

      <div className="mx-auto bg-white mb-2">
        <div className="bg-green-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-800">Others</h1>
          <p className="text-sm text-gray-600 mt-1">
            Double-tap fields to edit and click directory to upload files
          </p>
        </div>

        {/* Header row */}
        <div className="grid px-3 py-4 grid-cols-12 gap-4 pb-4 border-b bg-gray-100 border-gray-200">
          <div className="col-span-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
            AUDIT ITEM
          </div>
          <div className="col-span-3 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">
            LAST CHECK DATE
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">
            DAYS
          </div>
          <div className="col-span-1 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">
            STATUS
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-500 uppercase tracking-wide text-center">
            DIRECTORY
          </div>
        </div>

        {/* Data rows */}
        <div className="space-y-0 px-3">
          {auditItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0 items-center"
            >
              {/* Title */}
              <div className="col-span-4">
                <div className="font-medium text-gray-900 text-sm">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.subtitle}
                </div>
              </div>

              {/* Last Check Date */}
              <div className="col-span-3 flex justify-center">
                <div
                  className="w-40 h-8 flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded"
                  onClick={() => setOpenDialog(item.id)}
                >
                  {item.lastCheckDate
                    ? format(new Date(item.lastCheckDate), "dd/MM/yyyy")
                    : "-"}
                </div>
              </div>

              {/* Days */}
              <div className="col-span-2 flex justify-center">
                {editableDays.has(item.id) ? (
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) =>
                      updateItem(item.id, "days", Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-16 h-8 text-center text-sm border-gray-300"
                    min="0"
                    onBlur={() =>
                      setEditableDays((s) => {
                        const n = new Set(s);
                        n.delete(item.id);
                        return n;
                      })
                    }
                    autoFocus
                  />
                ) : (
                  <div
                    className="w-16 h-8 flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded"
                    onDoubleClick={() => setEditableDays((s) => new Set(s).add(item.id))}
                  >
                    {item.days}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <label className="flex items-center cursor-pointer space-x-2">
                  <input
                    type="checkbox"
                    checked={item.status === "after"}
                    onChange={() => toggleStatus(item.id)}
                    className="hidden"
                  />
                  <div
                    className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300 
                      ${item.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                        ${item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium capitalize transition-colors duration-300 ${item.status === "before" ? "text-pink-600" : "text-orange-600"}`}>
                    {item.status}
                  </span>
                </label>
              </div>

              {/* Directory */}
              <div className="col-span-2 flex justify-center text-center">
                {uploading[item.id] ? (
                  <span className="text-sm text-gray-500">Uploading...</span>
                ) : item.directory ? (
                  <button
                    onClick={() => setOpenDialog(item.id)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Open
                  </button>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => setOpenDialog(item.id)}
                  >
                    <FolderClosed className="hover:text-gray-400" />
                  </div>
                )}
              </div>

              {/* DIALOG - 100% YOUR ORIGINAL STYLE */}
              <Dialog.Root open={openDialog === item.id} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold text-gray-800">
                      Upload Document
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600 mt-2">
                      Please upload a document to confirm the new date for {item.title}.
                    </Dialog.Description>

                    <div className="mt-6 space-y-6">
                      {/* Current Document Preview */}
                      {item.directory && (
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <p className="text-xs font-medium text-gray-600 mb-3">Current Document</p>
                          {item.directory.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={item.directory}
                              alt="Current document"
                              className="max-w-full h-auto rounded mx-auto"
                              style={{ maxHeight: "280px "}}
                            />
                          ) : item.directory.endsWith(".pdf") ? (
                            <iframe
                              src={`${item.directory}#toolbar=0&navpanes=0`}
                              className="w-full h-64 border rounded"
                              title="PDF Preview"
                            />
                          ) : (
                            <div className="text-center py-8">
                              <FolderClosed size={48} className="mx-auto text-gray-400 mb-2" />
                              <Link href={item.directory} target="_blank" className="text-blue-600 text-sm hover:underline">
                                Open Current File
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      <DatePickerField
                        label="Last Check Date"
                        value={item.lastCheckDate || ""}
                        onDateSelected={(date) =>
                          updateItem(item.id, "lastCheckDate", date ? format(date, "yyyy-MM-dd") : null)
                        }
                        lastDate={0}
                      />

                      <div>
                        <FileUploader
                          onUploadSuccess={(url) => handleFileUpload(item.id, url)}
                          accept="image/*,application/pdf"
                          maxSize={10 * 1024 * 1024}
                          id={`file-upload-${item.id}`}
                        />
                        {item.directory && (
                          <p className="text-xs text-amber-600 mt-2">
                            New upload will replace the current document
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-2">
                      <Dialog.Close asChild>
                        <Button
                          className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
                          onClick={() => setOpenDialog(null)}
                        >
                          Cancel
                        </Button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          ))}
        </div>

        <div className="my-8 w-full pt-6 border-t border-white">
          <Button
            onClick={handleSave}
            className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-2"
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}