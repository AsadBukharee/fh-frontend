"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { format } from "date-fns";
import { FolderClosed, Plus, Save, X, Trash2, Pencil, Eye, UploadCloud, FileText } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import FileUploader from "@/components/Media/MediaUpload";
import { DatePickerField } from "@/components/ui/DatePicker";
import { toast } from "sonner";

interface ApiAuditItem {
  id: number;
  display_name: string;
  description: string;
  last_check_date: string | null;
  value: number;
  directory: string;
  created_at: string;
  updated_at: string;
}

interface AuditItem {
  id: string; // Internal UI ID (string)
  apiId?: number; // Real API ID (number, optional for new items)
  title: string;
  subtitle: string;
  days: number;
  status: "after" | "before";
  lastCheckDate: string | null;
  directory: string | null;
}

// API → UI
const transformFromApi = (data: ApiAuditItem[]): AuditItem[] => {
  return data.map((item) => ({
    id: item.id.toString(),
    apiId: item.id,
    title: item.display_name,
    subtitle: item.description, // Use description from API
    days: Math.abs(item.value || 0),
    status: item.value >= 0 ? "after" : "before",
    lastCheckDate: item.last_check_date
      ? new Date(item.last_check_date).toISOString().split("T")[0]
      : null,
    directory: item.directory || null,
  }));
};

// UI → API Payload
const transformToApiPayload = (item: AuditItem) => {
  return {
    display_name: item.title,
    description: item.subtitle,
    last_check_date: item.lastCheckDate,
    value: item.status === "before" ? -item.days : item.days,
    directory: item.directory || "",
  };
};

export default function Others() {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "upload">("view");

  // Double-click edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const token = useCookies().get("access_token");

  // Create Item State
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState<AuditItem>({
    id: "new",
    title: "",
    subtitle: "",
    days: 0,
    status: "before",
    lastCheckDate: null,
    directory: null,
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/activity/audit-expiry-others/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAuditItems(transformFromApi(json.data));
      }
    } catch (err) {
      console.error("Error fetching audit data:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const updateLocalItem = (id: string, field: keyof AuditItem, value: any) => {
    setAuditItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const toggleStatus = (item: AuditItem) => {
    const newStatus = item.status === "after" ? "before" : "after";
    updateLocalItem(item.id, "status", newStatus);
  };

  const handleFileUpload = (id: string, url: string) => {
    setUploading((prev) => ({ ...prev, [id]: true }));
    updateLocalItem(id, "directory", url);
    setViewMode("view");

    // Auto-save on upload can be added here if needed

    setTimeout(() => setUploading((prev) => ({ ...prev, [id]: false })), 600);
  };

  // CREATE (POST)
  const handleCreate = async () => {
    if (!newItem.title || !newItem.subtitle) {
      toast.error("Title and Description are required");
      return;
    }
    try {
      const payload = transformToApiPayload(newItem);
      const res = await fetch(`${API_URL}/activity/audit-expiry-others/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create");

      const json = await res.json();
      toast.success("Item created successfully");
      setIsCreating(false);

      // Reset form
      setNewItem({
        id: "new",
        title: "",
        subtitle: "",
        days: 0,
        status: "before",
        lastCheckDate: null,
        directory: null,
      });

      fetchData();
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create item");
    }
  };

  // Global Save (PUT)
  const handleGlobalSave = async () => {
    setLoading(true);
    let errorCount = 0;

    await Promise.all(auditItems.map(async (item) => {
      try {
        if (!item.apiId) return;

        await fetch(`${API_URL}/activity/audit-expiry-others/${item.apiId}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transformToApiPayload(item)),
        });
      } catch (e) {
        console.error(e);
        errorCount++;
      }
    }));

    setLoading(false);
    if (errorCount === 0) {
      toast.success("All items saved successfully");
    } else {
      toast.warning(`Saved with ${errorCount} errors`);
    }
  };

  const startEditing = (id: string, field: string) => {
    setEditingId(id);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingId(null);
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      stopEditing();
    }
  };

  const handleOpenDialog = (id: string, hasFile: boolean) => {
    setOpenDialog(id);
    setViewMode(hasFile ? "view" : "upload");
  };

  const getFilePreview = (item: AuditItem) => {
    if (!item.directory) return null;

    const isImage = item.directory.match(/\.(jpeg|jpg|gif|png|webp)$/i);

    if (isImage) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={item.directory} alt="Document Preview" className="max-w-full max-h-[70vh] object-contain mx-auto" />;
    } else {
      return <iframe src={item.directory} className="w-full h-[70vh] border-0" title="Document Preview" />;
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
        <div className="bg-green-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Others</h1>
            <p className="text-sm text-gray-600 mt-1">
              Double-tap fields to edit and click directory to upload files
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="bg-white text-green-700 hover:bg-green-50 shadow-sm border border-green-300"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
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

        {/* Create Row */}
        {isCreating && (
          <div className="grid grid-cols-12 gap-4 py-4 border-b border-blue-100 bg-blue-50/30 items-center px-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="col-span-4 space-y-2">
              <Input
                placeholder="Item Name *"
                className="h-8 bg-white border-blue-200 focus:ring-blue-200"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                autoFocus
              />
              <Input
                placeholder="Description *"
                className="h-8 bg-white text-xs border-blue-200 focus:ring-blue-200"
                value={newItem.subtitle}
                onChange={(e) => setNewItem({ ...newItem, subtitle: e.target.value })}
              />
            </div>
            <div className="col-span-3 flex justify-center text-sm text-gray-400">
              Auto-generated
            </div>
            <div className="col-span-2 flex justify-center">
              <Input
                type="number"
                className="w-16 h-8 text-center bg-white border-blue-200"
                value={newItem.days}
                onChange={(e) => setNewItem({ ...newItem, days: Math.max(0, Number(e.target.value)) })}
                min="0"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <label className="flex items-center cursor-pointer space-x-2">
                <input
                  type="checkbox"
                  checked={newItem.status === "after"}
                  onChange={() => setNewItem({ ...newItem, status: newItem.status === "before" ? "after" : "before" })}
                  className="hidden"
                />
                <div
                  className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300
                            ${newItem.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                                ${newItem.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}
                  ></div>
                </div>
              </label>
            </div>
            <div className="col-span-2 flex justify-center gap-2">
              <Button size="sm" onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Data rows */}
        <div className="space-y-0 px-3">
          {auditItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0 items-center hover:bg-gray-50 transition-colors group"
            >
              {/* Title & Description (Double-tap Editable) */}
              <div className="col-span-4 rounded p-1 -ml-1 transition-colors">
                {editingId === item.id && editingField === "title" ? (
                  <Input
                    className="font-medium text-gray-900 text-sm h-7"
                    value={item.title}
                    onChange={(e) => updateLocalItem(item.id, "title", e.target.value)}
                    onBlur={stopEditing}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    className="font-medium text-gray-900 text-sm h-7 flex items-center cursor-text group/edit"
                    onDoubleClick={() => startEditing(item.id, "title")}
                    title="Double-click to edit"
                  >
                    {item.title}
                    <Pencil className="w-3 h-3 text-gray-300 ml-2 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                  </div>
                )}

                {editingId === item.id && editingField === "subtitle" ? (
                  <Input
                    className="text-xs text-gray-500 mt-1 h-6"
                    value={item.subtitle}
                    onChange={(e) => updateLocalItem(item.id, "subtitle", e.target.value)}
                    onBlur={stopEditing}
                    onKeyDown={handleKeyDown}
                  />
                ) : (
                  <div
                    className="text-xs text-gray-500 mt-1 h-6 flex items-center cursor-text group/edit"
                    onDoubleClick={() => startEditing(item.id, "subtitle")}
                    title="Double-click to edit"
                  >
                    {item.subtitle}
                    <Pencil className="w-3 h-3 text-gray-300 ml-2 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>

              {/* Last Check Date */}
              <div className="col-span-3 flex justify-center">
                <div
                  className="w-40 h-8 flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-all"
                  onClick={() => handleOpenDialog(item.id, !!item.directory)}
                >
                  {item.lastCheckDate
                    ? format(new Date(item.lastCheckDate), "dd/MM/yyyy")
                    : "-"}
                </div>
              </div>

              {/* Days (Double-tap Editable) */}
              <div className="col-span-2 flex justify-center">
                {editingId === item.id && editingField === "days" ? (
                  <Input
                    type="number"
                    value={item.days}
                    onChange={(e) =>
                      updateLocalItem(item.id, "days", Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-16 h-8 text-center text-sm"
                    min="0"
                    onBlur={stopEditing}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    className="w-16 h-8 flex items-center justify-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded"
                    onDoubleClick={() => startEditing(item.id, "days")}
                    title="Double-click to edit"
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
                    onChange={() => toggleStatus(item)}
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
                    onClick={() => handleOpenDialog(item.id, true)}
                    className="text-blue-600 hover:underline text-sm font-medium flex items-center justify-center gap-1 group/btn"
                  >
                    <Eye className="w-3 h-3 group-hover/btn:text-blue-700" /> Open
                  </button>
                ) : (
                  <div
                    className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => handleOpenDialog(item.id, false)}
                    title="Upload document"
                  >
                    <FolderClosed className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </div>
                )}
              </div>

              {/* Dialog */}
              <Dialog.Root open={openDialog === item.id} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                  <Dialog.Content
                    className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl z-50 border border-gray-100 transition-all duration-300 flex flex-col
                    ${viewMode === 'view' ? 'w-[90vw] h-[85vh] max-w-5xl' : 'w-full max-w-md'}`}
                  >

                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <Dialog.Title className={viewMode === "view" ? "text-xl font-semibold text-gray-800" : "text-lg font-semibold text-gray-800"}>
                        {viewMode === "view" ? item.title : "Upload Document"}
                      </Dialog.Title>
                      <div className="flex items-center gap-2">
                        {viewMode === "view" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewMode("upload")}
                            className="gap-2 text-xs"
                          >
                            <UploadCloud className="w-3 h-3" /> Replace
                          </Button>
                        )}
                        {viewMode === "upload" && item.directory && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewMode("view")}
                            className="gap-2 text-xs"
                          >
                            Cancel
                          </Button>
                        )}
                        <Dialog.Close asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => setOpenDialog(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>

                    {viewMode === "upload" ? (
                      <div className="mt-2 space-y-6">
                        <Dialog.Description className="text-sm text-gray-600">
                          Upload a new document for {item.title}. This will update the Last Check Date.
                        </Dialog.Description>

                        <DatePickerField
                          label="Last Check Date"
                          value={item.lastCheckDate || ""}
                          onDateSelected={(date) =>
                            updateLocalItem(item.id, "lastCheckDate", date ? format(date, "yyyy-MM-dd") : null)
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
                            <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
                              <span className="font-medium">Note:</span> New upload will replace the current document
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 bg-gray-100 rounded-lg overflow-hidden relative flex flex-col">
                        {item.directory ? (
                          <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4">
                            {getFilePreview(item)}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>No document available preview.</p>
                          </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <a
                            href={item.directory || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded shadow-sm text-xs font-medium border border-gray-200 flex items-center gap-2 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Open in New Tab
                          </a>
                        </div>
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          ))}
        </div>

        <div className="my-8 w-full pt-6 border-t border-gray-100">
          <Button
            onClick={handleGlobalSave}
            className="bg-pink-500 w-full hover:bg-pink-600 text-white px-8 py-6 text-lg font-medium shadow-md transition-all hover:shadow-lg"
            disabled={loading}
          >
            {loading ? "Saving Changes..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}