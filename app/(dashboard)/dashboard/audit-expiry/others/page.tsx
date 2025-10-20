"use client";

import { useEffect, useState, useRef } from "react";
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

// Utility function to transform ID to title
const formatTitle = (id: string) => {
  return id
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface AuditItem {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  status: "after" | "before";
  lastCheckDate: string | null;
  directory: string | null;
  tempLastCheckDate?: string | null; // Temporary date before upload
}

const API = `${API_URL}/activity/audit-expiry-others/`;

// 🔄 API → UI
const transformFromApi = (data: any): AuditItem[] => [
  {
    id: "operator_compliance_score",
    title: formatTitle("operator_compliance_score"),
    subtitle: "Alert Before Operator Compliance Score",
    days: Math.abs(data.operator_compliance_score),
    status: data.operator_compliance_score < 0 ? "before" : "after",
    lastCheckDate: data.operator_compliance_score_reference_date,
    directory: data.operator_compliance_score_directory,
  },
  {
    id: "test_report_history",
    title: formatTitle("test_report_history"),
    subtitle: "Alert After Test Report History",
    days: Math.abs(data.test_report_history),
    status: data.test_report_history < 0 ? "before" : "after",
    lastCheckDate: data.test_report_history_reference_date,
    directory: data.test_report_history_directory,
  },
  {
    id: "vehicle_encounter_report",
    title: formatTitle("vehicle_encounter_report"),
    subtitle: "Alert Before Vehicle Encounter Report",
    days: Math.abs(data.vehicle_encounter_report),
    status: data.vehicle_encounter_report < 0 ? "before" : "after",
    lastCheckDate: data.vehicle_encounter_report_reference_date,
    directory: data.vehicle_encounter_report_directory,
  },
  {
    id: "yearly_maintenance_provider_audit",
    title: formatTitle("yearly_maintenance_provider_audit"),
    subtitle: "Alert After Yearly Maintenance Provider Audit",
    days: Math.abs(data.yearly_maintenance_provider_audit),
    status: data.yearly_maintenance_provider_audit < 0 ? "before" : "after",
    lastCheckDate: data.yearly_maintenance_provider_audit_reference_date,
    directory: data.yearly_maintenance_provider_audit_directory,
  },
  {
    id: "yearly_garage_equipment_audit",
    title: formatTitle("yearly_garage_equipment_audit"),
    subtitle: "Alert Before Yearly Garage Equipment Audit",
    days: Math.abs(data.yearly_garage_equipment_audit),
    status: data.yearly_garage_equipment_audit < 0 ? "before" : "after",
    lastCheckDate: data.yearly_garage_equipment_audit_reference_date,
    directory: data.yearly_garage_equipment_audit_directory,
  },
  {
    id: "vol_review",
    title: formatTitle("vol_review"),
    subtitle: "Alert Before VOL Review",
    days: Math.abs(data.vol_review),
    status: data.vol_review < 0 ? "before" : "after",
    lastCheckDate: data.vol_review_reference_date,
    directory: data.vol_review_directory,
  },
  {
    id: "transport_manager_refresher_check",
    title: formatTitle("transport_manager_refresher_check"),
    subtitle: "Alert After Transport Manager Refresher Check",
    days: Math.abs(data.transport_manager_refresher_check),
    status: data.transport_manager_refresher_check < 0 ? "before" : "after",
    lastCheckDate: data.transport_manager_refresher_check_reference_date,
    directory: data.transport_manager_refresher_check_directory,
  },
  {
    id: "transport_manager_cpc_card_check",
    title: formatTitle("transport_manager_cpc_card_check"),
    subtitle: "Alert After Transport Manager CPC Card Check",
    days: Math.abs(data.transport_manager_cpc_card_check),
    status: data.transport_manager_cpc_card_check < 0 ? "before" : "after",
    lastCheckDate: data.transport_manager_cpc_card_check_reference_date,
    directory: data.transport_manager_cpc_card_check_directory,
  },
];

// 🔄 UI → API
const transformToApi = (items: AuditItem[]) => {
  const getVal = (id: string) => {
    const i = items.find((x) => x.id === id);
    if (!i) return 0;
    return i.status === "before" ? -Math.abs(i.days) : Math.abs(i.days);
  };
  return {
    id: 1,
    operator_compliance_score: getVal("operator_compliance_score"),
    operator_compliance_score_reference_date:
      items.find((x) => x.id === "operator_compliance_score")?.lastCheckDate ||
      null,
    operator_compliance_score_directory:
      items.find((x) => x.id === "operator_compliance_score")?.directory ||
      null,
    test_report_history: getVal("test_report_history"),
    test_report_history_reference_date:
      items.find((x) => x.id === "test_report_history")?.lastCheckDate || null,
    test_report_history_directory:
      items.find((x) => x.id === "test_report_history")?.directory || null,
    vehicle_encounter_report: getVal("vehicle_encounter_report"),
    vehicle_encounter_report_reference_date:
      items.find((x) => x.id === "vehicle_encounter_report")?.lastCheckDate ||
      null,
    vehicle_encounter_report_directory:
      items.find((x) => x.id === "vehicle_encounter_report")?.directory || null,
    yearly_maintenance_provider_audit: getVal(
      "yearly_maintenance_provider_audit"
    ),
    yearly_maintenance_provider_audit_reference_date:
      items.find((x) => x.id === "yearly_maintenance_provider_audit")
        ?.lastCheckDate || null,
    yearly_maintenance_provider_audit_directory:
      items.find((x) => x.id === "yearly_maintenance_provider_audit")
        ?.directory || null,
    yearly_garage_equipment_audit: getVal("yearly_garage_equipment_audit"),
    yearly_garage_equipment_audit_reference_date:
      items.find((x) => x.id === "yearly_garage_equipment_audit")
        ?.lastCheckDate || null,
    yearly_garage_equipment_audit_directory:
      items.find((x) => x.id === "yearly_garage_equipment_audit")?.directory ||
      null,
    vol_review: getVal("vol_review"),
    vol_review_reference_date:
      items.find((x) => x.id === "vol_review")?.lastCheckDate || null,
    vol_review_directory:
      items.find((x) => x.id === "vol_review")?.directory || null,
    transport_manager_refresher_check: getVal(
      "transport_manager_refresher_check"
    ),
    transport_manager_refresher_check_reference_date:
      items.find((x) => x.id === "transport_manager_refresher_check")
        ?.lastCheckDate || null,
    transport_manager_refresher_check_directory:
      items.find((x) => x.id === "transport_manager_refresher_check")
        ?.directory || null,
    transport_manager_cpc_card_check: getVal(
      "transport_manager_cpc_card_check"
    ),
    transport_manager_cpc_card_check_reference_date:
      items.find((x) => x.id === "transport_manager_cpc_card_check")
        ?.lastCheckDate || null,
    transport_manager_cpc_card_check_directory:
      items.find((x) => x.id === "transport_manager_cpc_card_check")
        ?.directory || null,
  };
};
const toISODate = (dateStr: string) => {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`; // valid for <input type="date">
};

export default function Others() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableFields, setEditableFields] = useState<{
    [key: string]: { days: boolean; date: boolean };
  }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null); // Track which item's dialog is open
  const [tempDate, setTempDate] = useState<{
    id: string;
    date: string | null;
  } | null>(null); // Store temporary date
  const token = useCookies().get("access_token");
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize editable state for each item
  useEffect(() => {
    setEditableFields(
      auditItems.reduce(
        (acc, item) => ({
          ...acc,
          [item.id]: { days: false, date: false },
        }),
        {}
      )
    );
  }, [auditItems]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}1/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
    fetchData();
  }, [token]);

  // Update days or lastCheckDate
  const updateItem = (
    id: string,
    field: "days" | "lastCheckDate",
    value: number | string
  ) => {
    setAuditItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Toggle before/after
  const toggleStatus = (id: string) => {
    setAuditItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "after" ? "before" : "after" }
          : item
      )
    );
  };

  // Handle double click/tap
  const handleDoubleClick = (id: string, field: "days" | "date") => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      if (field === "date") {
        // Open dialog for date change
        setOpenDialog(id);
      } else {
        setEditableFields((prev) => ({
          ...prev,
          [id]: { ...prev[id], [field]: true },
        }));
      }
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null;
      }, 300);
    }
  };

  // Handle date change in dialog
  const handleDateChange = (id: string, value: string) => {
    setTempDate({ id, date: value || null });
  };

  // Handle file upload
  const handleFileUpload = async (id: string, url: string) => {
    setUploading((prev) => ({ ...prev, [id]: true }));
    try {
      setAuditItems((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                directory: url,
                lastCheckDate:
                  tempDate?.id === id ? tempDate.date : item.lastCheckDate,
              }
            : item
        )
      );
      setOpenDialog(null); // Close dialog on successful upload
      setTempDate(null); // Clear temporary date
    } catch (err) {
      console.error("Error processing file upload:", err);
    } finally {
      setUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Save data
  const handleSave = async () => {
    // Check for items with lastCheckDate but no directory
    const invalidItems = auditItems.filter(
      (item) => item.lastCheckDate && !item.directory
    );
    if (invalidItems.length > 0) {
      alert(
        "Cannot save: All items with a Last Check Date must have an uploaded document."
      );
      return;
    }

    setLoading(true);
    const payload = transformToApi(auditItems);
    try {
      const res = await fetch(`${API}1/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log("Saved successfully:", json);
      // Reset editable fields after save
      setEditableFields(
        auditItems.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: { days: false, date: false },
          }),
          {}
        )
      );
    } catch (err) {
      console.error("Error saving audit items:", err);
    } finally {
      setLoading(false);
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
                {editableFields[item.id]?.date ? (
                  <Input
                    type="date"
                    value={item.lastCheckDate || ""}
                    onChange={(e) => handleDateChange(item.id, e.target.value)}
                    className="w-40 h-8 text-center text-sm border-gray-300"
                    onBlur={() =>
                      setEditableFields((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], date: false },
                      }))
                    }
                    autoFocus
                  />
                ) : (
                  <div
                    className="w-40 h-8 flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleDoubleClick(item.id, "date")}
                  >
                    {item.lastCheckDate
                      ? format(new Date(item.lastCheckDate), "dd/MM/yyyy")
                      : "-"}
                  </div>
                )}
              </div>

              {/* Days */}
              <div className="col-span-2 flex justify-center">
                {editableFields[item.id]?.days ? (
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "days",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 h-8 text-center text-sm border-gray-300"
                    min="0"
                    onBlur={() =>
                      setEditableFields((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], days: false },
                      }))
                    }
                    autoFocus
                  />
                ) : (
                  <div
                    className="w-16 h-8 flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleDoubleClick(item.id, "days")}
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
                      ${
                        item.status === "before"
                          ? "bg-pink-100"
                          : "bg-orange-100"
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                        ${
                          item.status === "before"
                            ? "left-1 bg-pink-600"
                            : "right-1 bg-orange-500"
                        }`}
                    ></div>
                  </div>
                </label>
              </div>

              {/* Directory */}
              {/* Directory */}
              <div className="col-span-2 flex justify-center text-center">
                {uploading[item.id] ? (
                  <span className="text-sm text-gray-500">Uploading...</span>
                ) : item.directory ? (
                  <Link
                    href={item.directory}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Open
                  </Link>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => setOpenDialog(item.id)}
                  >
                    <FolderClosed className="hover:text-gray-400" />
                  </div>
                )}
              </div>

              {/* Dialog for document upload */}
              <Dialog.Root
                open={openDialog === item.id}
                onOpenChange={(open) => {
                  if (!open) {
                    setOpenDialog(null);
                    setTempDate(null); // Reset temp date if dialog is closed
                  }
                }}
              >
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold text-gray-800">
                      Upload Document
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600 mt-2">
                      Please upload a document to confirm the new date for{" "}
                      {item.title}.
                    </Dialog.Description>
                    <div className="mt-4 gap-4 flex flex-col">
                      <DatePickerField
                        label="Last Check Date"
                        value={
                          tempDate?.id === item.id
                            ? tempDate.date || ""
                            : item.lastCheckDate || ""
                        }
                        onDateSelected={(date) =>
                          handleDateChange(item.id, format(date, "dd/MM/yyyy"))
                        }
                        startDate={-36500} // optional, 100 years back
                        lastDate={1000} // no future dates
                      />

                      <FileUploader
                        onUploadSuccess={(url) =>
                          handleFileUpload(item.id, url)
                        }
                        accept="image/*,application/pdf"
                        maxSize={5 * 1024 * 1024} // 5MB limit
                        id={`file-upload-${item.id}`}
                      />
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                      <Dialog.Close asChild>
                        <Button
                          className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2"
                          onClick={() => {
                            setOpenDialog(null);
                            setTempDate(null); // Reset temp date on cancel
                          }}
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
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
