"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCookies } from "next-client-cookies";
import {
  FileText,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  History,
  User,
  Calendar,
  Tag,
  Layers,
  Search,
  Filter,
  BookOpen,
  Shield,
  Wrench,
  FileCheck,
  Receipt,
  TestTube,
  Gauge,
  File,
  X,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { formatToDDMMYYYY } from "@/app/utils/DateFormat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentType {
  id: number;
  name: string;
  code: string;
  source: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentVersion {
  id: number;
  document: number;
  file: string | null;
  file_url: string | null;
  version: number;
  is_current: boolean;
  notes: string | null;
  uploaded_by: { id: number; email: string; full_name: string; role: string; avatar: string | null } | null;
  uploaded_at: string;
}

interface DocumentRecord {
  id: number;
  document_type: DocumentType;
  title: string;
  source: string;
  description: string | null;
  url: string | null;
  urls_list: string[];
  expiry_date: string | null;
  is_archived: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
  created_by: { id: number; email: string; full_name: string; role: string; avatar: string | null };
  created_at: string;
  updated_at: string;
  current_version: DocumentVersion;
}

interface HistoryItem {
  document: DocumentRecord;
  versions: DocumentVersion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  logbook_docs: BookOpen,
  vehicle_invoice_docs: Receipt,
  COIF_technical_docs: FileCheck,
  service_records_docs: Wrench,
  new_vehicle_checklist_docs: FileCheck,
  others_docs: File,
  mot_check_docs: CheckCircle,
  pmi_inspection_docs: TestTube,
  tax_docs: Shield,
  insurance_docs: Shield,
  tacho_calibration_docs: Gauge,
};

const DOC_TYPE_COLORS: Record<string, { bg: string; icon: string; badge: string }> = {
  logbook_docs:             { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700 border-blue-200" },
  vehicle_invoice_docs:     { bg: "bg-purple-50",  icon: "text-purple-600",  badge: "bg-purple-100 text-purple-700 border-purple-200" },
  COIF_technical_docs:      { bg: "bg-teal-50",    icon: "text-teal-600",    badge: "bg-teal-100 text-teal-700 border-teal-200" },
  service_records_docs:     { bg: "bg-orange-50",  icon: "text-orange-600",  badge: "bg-orange-100 text-orange-700 border-orange-200" },
  new_vehicle_checklist_docs:{ bg: "bg-green-50",  icon: "text-green-600",   badge: "bg-green-100 text-green-700 border-green-200" },
  others_docs:              { bg: "bg-slate-50",   icon: "text-slate-600",   badge: "bg-slate-100 text-slate-700 border-slate-200" },
  mot_check_docs:           { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700 border-amber-200" },
  pmi_inspection_docs:      { bg: "bg-red-50",     icon: "text-red-600",     badge: "bg-red-100 text-red-700 border-red-200" },
  tax_docs:                 { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  insurance_docs:           { bg: "bg-indigo-50",  icon: "text-indigo-600",  badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  tacho_calibration_docs:   { bg: "bg-pink-50",    icon: "text-pink-600",    badge: "bg-pink-100 text-pink-700 border-pink-200" },
};

function getTypeStyle(code: string) {
  return DOC_TYPE_COLORS[code] ?? { bg: "bg-slate-50", icon: "text-slate-600", badge: "bg-slate-100 text-slate-700 border-slate-200" };
}

function getTypeIcon(code: string): React.ElementType {
  return DOC_TYPE_ICONS[code] ?? FileText;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const date = formatToDDMMYYYY(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} at ${time}`;
}

function getFileName(url: string | null): string {
  if (!url) return "—";
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "document";
  } catch {
    return url.split("/").pop() || "document";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isPDF = url?.toLowerCase().includes(".pdf") || url?.toLowerCase().endsWith("pdf");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
            <span className="font-semibold text-slate-800 text-sm truncate max-w-sm">
              {getFileName(url)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => window.open(url, "_blank")}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {isPDF ? (
            <iframe src={url} className="w-full h-full border-0" title="Document Preview" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={url}
                alt="Document preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VersionRow({ version, isLatest }: { version: DocumentVersion; isLatest: boolean }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileUrl = version.file_url || version.file;

  return (
    <>
      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
          isLatest
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white border-slate-200 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Version badge */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isLatest ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            v{version.version}
          </div>

          {/* Meta info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isLatest && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5">
                  Current
                </Badge>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateTime(version.uploaded_at)}
              </span>
              {version.uploaded_by && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {version.uploaded_by.full_name}
                </span>
              )}
            </div>
            {version.notes && (
              <p className="text-xs text-slate-500 mt-1 italic">"{version.notes}"</p>
            )}
            {fileUrl && (
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                {getFileName(fileUrl)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {fileUrl ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                onClick={() => setPreviewUrl(fileUrl)}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                onClick={() => window.open(fileUrl, "_blank")}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic px-2">No file</span>
          )}
        </div>
      </div>
    </>
  );
}

function DocumentHistoryCard({ item, forceExpand }: { item: HistoryItem; forceExpand?: boolean }) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = forceExpand !== undefined ? forceExpand : localExpanded;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { document: doc, versions } = item;
  const code = doc.document_type.code;
  const style = getTypeStyle(code);
  const Icon = getTypeIcon(code);
  const docUrl = doc.url || doc.urls_list?.[0] || null;

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
  const currentVersion = sortedVersions.find((v) => v.is_current) || sortedVersions[0];

  return (
    <>
      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Card header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left — icon + meta */}
            <div className="flex items-start gap-4 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}
              >
                <Icon className={`w-5 h-5 ${style.icon}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-sm">{doc.title}</h3>
                  <Badge className={`text-[10px] px-2 py-0.5 border ${style.badge}`}>
                    {doc.document_type.name}
                  </Badge>
                  {doc.is_expired && (
                    <Badge className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 border-red-200">
                      Expired
                    </Badge>
                  )}
                  {doc.is_archived && (
                    <Badge className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 border-slate-200">
                      Archived
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Uploaded {formatDateTime(doc.created_at)}
                  </span>
                  {doc.created_by && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doc.created_by.full_name}
                    </span>
                  )}
                  {doc.expiry_date && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Expires {formatToDDMMYYYY(doc.expiry_date)}
                    </span>
                  )}
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                )}
              </div>
            </div>

            {/* Right — actions + version count */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 mr-2">
                <Layers className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">
                  {versions.length} version{versions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {docUrl && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
                    onClick={() => setPreviewUrl(docUrl)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
                    onClick={() => window.open(docUrl, "_blank")}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-slate-500 hover:text-slate-800"
                onClick={() => setLocalExpanded(!localExpanded)}
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="ml-1">History</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Version history (collapsed by default) */}
        {expanded && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Version History
              </span>
            </div>
            <div className="space-y-2">
              {sortedVersions.map((v) => (
                <VersionRow key={v.id} version={v} isLatest={v.is_current} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VehicleDocumentHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const cookies = useCookies();
  const token = cookies.get("access_token");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || !token) return;
      try {
        const res = await fetch(
          `${API_URL}/api/documents/documents/vehicle-history/${id}/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Failed to load document history:", err);
        setError(err.message || "Failed to load document history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [id, token]);

  // Unique document types for the filter dropdown
  const documentTypes = useMemo(() => {
    const seen = new Map<string, string>();
    history.forEach(({ document: doc }) => {
      seen.set(doc.document_type.code, doc.document_type.name);
    });
    return Array.from(seen.entries()).map(([code, name]) => ({ code, name }));
  }, [history]);

  // Filtered list
  const filtered = useMemo(() => {
    return history.filter(({ document: doc }) => {
      const matchType = filterType === "all" || doc.document_type.code === filterType;
      const matchSearch =
        !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.document_type.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [history, search, filterType]);

  // Stats
  const stats = useMemo(() => {
    const total = history.length;
    const types = new Set(history.map((h) => h.document.document_type.code)).size;
    const totalVersions = history.reduce((acc, h) => acc + h.versions.length, 0);
    const expired = history.filter((h) => h.document.is_expired).length;
    return { total, types, totalVersions, expired };
  }, [history]);

  // ── Render: loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600" />
            <History className="w-7 h-7 text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 mt-4 font-medium">Loading document history…</p>
        </div>
      </div>
    );
  }

  // ── Render: error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to Load History</h3>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: page ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-800 -ml-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Document History</h1>
                <p className="text-sm text-slate-500">Vehicle ID #{id} — All document records &amp; versions</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Documents", value: stats.total, color: "bg-blue-50 text-blue-700", icon: FileText },
            { label: "Document Types", value: stats.types, color: "bg-purple-50 text-purple-700", icon: Tag },
            { label: "Total Versions", value: stats.totalVersions, color: "bg-emerald-50 text-emerald-700", icon: Layers },
            { label: "Expired", value: stats.expired, color: "bg-red-50 text-red-700", icon: AlertTriangle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters bar ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="doc-history-search"
                placeholder="Search documents…"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearch("")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="doc-type-filter" className="h-9 text-sm w-48">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map(({ code, name }) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expand / collapse all */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs text-slate-600 border-slate-200"
              onClick={() => setExpandAll((p) => !p)}
            >
              {expandAll ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 mr-1" /> Collapse All
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mr-1" /> Expand All
                </>
              )}
            </Button>

            {/* Count indicator */}
            <span className="text-xs text-slate-400 ml-auto">
              {filtered.length} of {history.length} records
            </span>
          </div>
        </div>

        {/* ── Timeline / Cards ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No Documents Found</h3>
            <p className="text-sm text-slate-400">
              {history.length === 0
                ? "No document history available for this vehicle."
                : "No documents match your current filters."}
            </p>
            {(search || filterType !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setSearch(""); setFilterType("all"); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-orange-200 via-slate-200 to-transparent hidden md:block pointer-events-none" />

            <div className="space-y-4">
              {filtered.map((item, idx) => (
                <div key={`${item.document.id}-${idx}`} className="relative md:pl-14">
                  {/* Timeline dot */}
                  <div className="absolute left-3.5 top-6 w-3 h-3 rounded-full bg-orange-400 border-2 border-white shadow-sm hidden md:block" />
                  <DocumentHistoryCard item={item} forceExpand={expandAll || undefined} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
