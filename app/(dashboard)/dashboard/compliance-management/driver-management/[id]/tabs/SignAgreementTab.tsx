"use client";

import { useState, useEffect, useCallback } from "react";
import API_URL from "@/app/utils/ENV";
import {
  FileText,
  Upload,
  Trash2,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FileUploader from "@/components/Media/MediaUpload";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateTaskDialog from "@/components/task/CreateTaskDialog";

/* ────────────────────── CHOICES FROM DJANGO ────────────────────── */
const CATEGORY_CHOICES: Record<string, string> = {
  rules: "Rules",
  safety: "Safety",
  benefits: "Benefits",
  handbook: "Handbook",
  training: "Training",
  employment: "Employment",
  development: "Development",
};

const STATUS_CHOICES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  viewed: { label: "Viewed", variant: "outline" },
  sign_required: { label: "Sign Required", variant: "destructive" },
  complete: { label: "Complete", variant: "default" },
  available: { label: "Available", variant: "outline" },
};

const PENSION_STATUS: Record<
  string,
  { label: string; variant: string }
> = {
  uploaded: { label: "Uploaded", variant: "bg-blue-600 text-white" },
  not_uploaded: { label: "Not Uploaded", variant: "outline" },
};

/* ────────────────────── Types ────────────────────── */
type DocumentKey =
  | "nightWorker"
  | "contractOfEmployment"
  | "pensionInfo"
  | "uniformAgreement"
  | "covenantNDA"
  | "vehicleFamiliarisation"
  | "employeeHandbook"
  | "ehuForm"
  | "fhRules"
  | "crhRules";

interface BaseDoc {
  id?: number;
  link: string | null;
  uploadDate: string | null;
  isApplicable: boolean;
  status?: string;
  current_status?: string;
  isSigned?: boolean;
  signedDate?: string | null;
  viewedDate?: string | null;
  requiresSignature?: boolean;
  documentType?: string;
  priority?: number;
  categoryLabel?: string | null;
}

interface NightWorkerDoc extends BaseDoc {
  expiryDate: string | null;
  contractSigningDate?: string | null;
  contractStartDate?: string | null;
  isNightWorker?: boolean;
  driver?: { id: number; full_name: string; email: string };
  agreement_date?: string;
}

interface ContractDoc extends BaseDoc {
  signingDate: string | null;
  startDate: string | null;
}

interface PensionDoc extends BaseDoc {
  optIn: boolean;
  optOut: boolean;
  optDate: string | null;
  eligible?: boolean;
  autoEnrollment?: boolean;
}

interface ExpiryApplicableDoc extends BaseDoc {
  expiryDate: string | null;
}

type DocMap = {
  nightWorker: NightWorkerDoc;
  contractOfEmployment: ContractDoc;
  pensionInfo: PensionDoc;
  uniformAgreement: BaseDoc;
  covenantNDA: BaseDoc;
  vehicleFamiliarisation: ExpiryApplicableDoc;
  employeeHandbook: BaseDoc;
  ehuForm: BaseDoc;
  fhRules: BaseDoc;
  crhRules: BaseDoc;
};

/* ────────────────────── Document Config ────────────────────── */
const docConfig: Record<
  DocumentKey,
  {
    title: string;
    fields: ("applicable" | "expiry" | "signing" | "start" | "optIn" | "optOut")[];
    category: string;
    requiresFormOnOptOut?: boolean;
    apiKey?: string;
  }
> = {
  nightWorker: {
    title: "Night Worker Agreement",
    fields: ["applicable", "expiry"],
    category: "employment",
    apiKey: "night-worker-agreements",
  },
  contractOfEmployment: {
    title: "Contract Of Employment",
    fields: [ "start"],
    category: "employment",
  },
  pensionInfo: {
    title: "Pension Opt In/Out",
    fields: ["optIn", "optOut"],
    category: "benefits",
    requiresFormOnOptOut: true,
    apiKey: "pension-info",
  },
  uniformAgreement: {
    title: "Uniform Agreement",
    fields: ["applicable"],
    category: "employment",
  },
  covenantNDA: {
    title: "Covenant / Non-Disclosure agreement",
    fields: ["applicable"],
    category: "employment",
  },
  vehicleFamiliarisation: {
    title: "Vehicle Familiarisation and Walkaround",
    fields: ["applicable", "expiry"],
    category: "safety",
  },
  employeeHandbook: {
    title: "Employee Handbook",
    fields: ["applicable"],
    category: "handbook",
  },
  ehuForm: {
    title: "EHU Signed Form",
    fields: ["applicable"],
    category: "handbook",
  },
  fhRules: {
    title: "FH Rules",
    fields: ["applicable"],
    category: "rules",
  },
  crhRules: {
    title: "CRH Rules",
    fields: ["applicable"],
    category: "rules",
  },
};

/* ────────────────────── Helpers ────────────────────── */
const getHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const formatDate = (d: string | null) =>
  d ? format(new Date(d), "dd MMM yyyy") : "—";

const getEndpoint = (key: DocumentKey, id?: number): string => {
  const cfg = docConfig[key];
  const base = cfg.apiKey
    ? `${API_URL}/api/profiles/${cfg.apiKey}/`
    : `${API_URL}/api/profiles/signed_agreements/`;
  return id ? `${base}${id}/` : base;
};

const getStatusBadge = (doc: any) => {
  if (doc.current_status && PENSION_STATUS[doc.current_status]) {
    const { label, variant } = PENSION_STATUS[doc.current_status];
    return <Badge className={variant}>{label}</Badge>;
  }

  if (doc.status && STATUS_CHOICES[doc.status]) {
    const { label, variant } = STATUS_CHOICES[doc.status];
    return <Badge variant={variant}>{label}</Badge>;
  }

  return <Badge variant="outline">Not uploaded</Badge>;
};

/* ────────────────────── Load Documents Hook ────────────────────── */
function useDriverDocuments(userId: string, token: string) {
  const [docs, setDocs] = useState<DocMap>({
    nightWorker: { link: null, uploadDate: null, isApplicable: true, expiryDate: null },
    contractOfEmployment: { link: null, uploadDate: null, isApplicable: true, signingDate: null, startDate: null },
    pensionInfo: { link: null, uploadDate: null, isApplicable: true, optIn: false, optOut: false, optDate: null },
    uniformAgreement: { link: null, uploadDate: null, isApplicable: true },
    covenantNDA: { link: null, uploadDate: null, isApplicable: true },
    vehicleFamiliarisation: { link: null, uploadDate: null, isApplicable: true, expiryDate: null },
    employeeHandbook: { link: null, uploadDate: null, isApplicable: true },
    ehuForm: { link: null, uploadDate: null, isApplicable: true },
    fhRules: { link: null, uploadDate: null, isApplicable: true },
    crhRules: { link: null, uploadDate: null, isApplicable: true },
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);

      const allRes = await fetch(
        `${API_URL}/api/profiles/get_all_signed_agreements/?user_id=${userId}`,
        { headers: getHeaders(token) }
      );
      if (!allRes.ok) throw new Error("Failed to load documents");
      const json = await allRes.json();

      const dedicated: Record<string, any> = {};

   
      const map: Partial<DocMap> = {};

      Object.entries(docConfig).forEach(([key, cfg]) => {
        const k = key as DocumentKey;
        let apiDoc: any = null;

        if (cfg.apiKey && dedicated[cfg.apiKey]) {
          apiDoc = dedicated[cfg.apiKey];
        } else if (!cfg.apiKey) {
          apiDoc = json.signed_agreements?.find((d: any) => d.name === cfg.title);
        }

        const base = {
          id: apiDoc?.id,
          link: apiDoc?.link ?? apiDoc?.document_link ?? null,
          uploadDate: apiDoc?.upload_date ?? apiDoc?.last_updated ?? apiDoc?.agreement_date ?? null,
          isApplicable: apiDoc?.is_applicable ?? true,
          status: apiDoc?.status,
          current_status: apiDoc?.current_status,
          isSigned: apiDoc?.is_signed,
          signedDate: apiDoc?.signed_date,
          viewedDate: apiDoc?.viewed_date,
          requiresSignature: apiDoc?.requires_signature,
          documentType: apiDoc?.document_type,
          priority: apiDoc?.priority,
          categoryLabel: apiDoc?.category ? CATEGORY_CHOICES[apiDoc.category] : null,
        };

        if (k === "nightWorker") {
          map[k] = {
            ...base,
            expiryDate: apiDoc?.expiry_date ?? null,
            contractSigningDate: apiDoc?.contract_signing_date ?? null,
            contractStartDate: apiDoc?.contract_start_date ?? null,
            isNightWorker: apiDoc?.is_night_worker ?? true,
            driver: apiDoc?.driver ?? null,
            agreement_date: apiDoc?.agreement_date ?? null,
          } as any;
        } else if (k === "contractOfEmployment") {
          map[k] = {
            ...base,
            signingDate: apiDoc?.contract_signing_date ?? null,
            startDate: apiDoc?.contract_start_date ?? null,
          } as any;
        } else if (k === "pensionInfo") {
          map[k] = {
            ...base,
            optIn: apiDoc?.current_status === "uploaded",
            optOut: apiDoc?.current_status === "not_uploaded",
            optDate: apiDoc?.opt_date ?? null,
            eligible: apiDoc?.eligible,
            autoEnrollment: apiDoc?.auto_enrollment,
          } as any;
        } else {
          map[k] = base as any;
        }
      });

      setDocs((prev) => ({ ...prev, ...map }) as DocMap);
    } catch (e: any) {
      sonnerToast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { docs, loading, reload };
}

/* ────────────────────── Dynamic Upload Dialog ────────────────────── */
interface DynamicUploadDialogProps {
  keyName: DocumentKey;
  onUpload: (key: DocumentKey, url: string, formData: any) => Promise<void>;
  open: boolean;
  onClose: () => void;
  docs: DocMap;
  initialValues?: Record<string, any>;
}

function DynamicUploadDialog({
  keyName,
  onUpload,
  open,
  onClose,
  docs,
  initialValues,
}: DynamicUploadDialogProps) {
  const cfg = docConfig[keyName];
  const [fileUrl, setFileUrl] = useState<string | null>(docs[keyName].link ?? null);
  const [formData, setFormData] = useState<Record<string, any>>(initialValues ?? {});

  useEffect(() => {
    setFileUrl(docs[keyName].link ?? null);
    setFormData(initialValues ?? {});
  }, [keyName, docs, initialValues]);

  const handleSubmit = async () => {
    if (!fileUrl && cfg.requiresFormOnOptOut !== true) {
      sonnerToast.error("Please upload a document");
      return;
    }

    if (keyName === "pensionInfo" && formData.optOut && !fileUrl) {
      sonnerToast.error("Opt Out requires form upload");
      return;
    }

    if (cfg.fields.includes("signing") && !formData.signingDate) {
      sonnerToast.error("Contract signing date is required");
      return;
    }

    if (cfg.fields.includes("start") && !formData.startDate) {
      sonnerToast.error("Employment start date is required");
      return;
    }

    await onUpload(keyName, fileUrl || "", formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{docs[keyName].id ? "Update" : "Upload"} {cfg.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Document *</Label>
            <FileUploader
              id={`upload-${keyName}`}
              onUploadSuccess={(url) => setFileUrl(url)}
            />
            {fileUrl && (
              <p className="text-xs text-green-600 mt-1">File ready: {fileUrl.split("/").pop()}</p>
            )}
          </div>

          {cfg.fields.includes("applicable") && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applicable"
                checked={formData.applicable ?? true}
                onCheckedChange={(v) => setFormData({ ...formData, applicable: v })}
              />
              <Label htmlFor="applicable">Applicable</Label>
            </div>
          )}
          {cfg.fields.includes("expiry") && (
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiryDate || ""}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          )}
          {cfg.fields.includes("signing") && (
            <div>
              <Label>Contract Signing Date *</Label>
              <Input
                type="date"
                value={formData.signingDate || ""}
                onChange={(e) => setFormData({ ...formData, signingDate: e.target.value })}
              />
            </div>
          )}
          {cfg.fields.includes("start") && (
            <div>
              <Label>Employment Start Date *</Label>
              <Input
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          )}
          {keyName === "pensionInfo" && (
            <div className="space-y-3">
              <Label>Pension Status *</Label>
              <div className="flex gap-6 p-3 border rounded-md">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pension"
                    checked={formData.optIn === true}
                    onChange={() => setFormData({ optIn: true, optOut: false })}
                  />
                  <span>Opt In</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pension"
                    checked={formData.optOut === true}
                    onChange={() => setFormData({ optIn: false, optOut: true })}
                  />
                  <span>Opt Out (requires form)</span>
                </label>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────── Shared Document Detail Dialog ────────────────────── */
interface DocumentDetailDialogProps {
  doc: any;
  cfg: typeof docConfig[DocumentKey];
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

function DocumentDetailDialog({
  doc,
  cfg,
  onClose,
  onDelete,
  onUpdate,
}: DocumentDetailDialogProps) {
  const fileUrl = doc.link;
  const isImage = fileUrl && /\.(jpe?g|png|gif|webp)$/i.test(fileUrl);
  const isPdf = fileUrl && fileUrl.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 border-b flex justify-between items-start">
          <div>
            <DialogTitle className="text-xl">{cfg.title}</DialogTitle>
            {doc.driver && (
              <DialogDescription className="mt-1">
                <strong>{doc.driver.full_name}</strong> • {doc.driver.email}
              </DialogDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onUpdate}>
              Update
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] p-6">
          {fileUrl && (
            <div className="mb-6 rounded-lg overflow-hidden bg-gray-50 border">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={cfg.title}
                  className="w-full h-auto max-h-96 object-contain"
                  crossOrigin="anonymous"
                />
              ) : isPdf ? (
                <iframe src={fileUrl} className="w-full h-96 border-0" title="PDF Preview" />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <FileText className="h-12 w-12 mr-2" />
                  <span>Preview not available</span>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 text-sm md:grid-cols-2">
            {doc.id && <div><strong>ID:</strong> {doc.id}</div>}
            <div><strong>Applicable:</strong> {doc.isApplicable ? "Yes" : "No"}</div>
            {doc.agreement_date && <div><strong>Agreement Date:</strong> {formatDate(doc.agreement_date)}</div>}
            {doc.contractSigningDate && <div><strong>Signing Date:</strong> {formatDate(doc.contractSigningDate)}</div>}
            {doc.contractStartDate && <div><strong>Start Date:</strong> {formatDate(doc.contractStartDate)}</div>}
            {doc.expiryDate && <div><strong>Expiry Date:</strong> {formatDate(doc.expiryDate)}</div>}
            {doc.isNightWorker !== undefined && <div><strong>Night Worker:</strong> {doc.isNightWorker ? "Yes" : "No"}</div>}
            {doc.uploadDate && <div><strong>Uploaded:</strong> {formatDate(doc.uploadDate)}</div>}
            {doc.current_status && <div><strong>Status:</strong> {doc.current_status}</div>}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────── Main Component ────────────────────── */
export default function SignAgreementAdminTab() {
  const { id } = useParams();
  const userId = id as string;
  const cookies = useCookies();
  const token = cookies.get("access_token") ?? "";

  const { docs, loading, reload } = useDriverDocuments(userId, token);

  const [detail, setDetail] = useState<{ open: boolean; key: DocumentKey | null }>({
    open: false,
    key: null,
  });

  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    key: DocumentKey | null;
    initial?: Record<string, any>;
  }>({ open: false, key: null });

  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    title: string;
    driverId: string;
  }>({
    open: false,
    title: "",
    driverId: userId,
  });

  const openTaskDialog = (title: string) => {
    setTaskDialog({
      open: true,
      title: `Upload ${title} (Driver #${userId})`,
      driverId: userId,
    });
  };

 const uploadDocument = async (key: DocumentKey, url: string, formData: any) => {
  const cfg = docConfig[key];
  const doc = docs[key];
  const isEdit = !!doc.id;
  const endpoint = getEndpoint(key, isEdit ? doc.id : undefined);

  // ────── BASE PAYLOAD (common for every document) ──────
  const payload: any = {
    driver_id: Number(userId),
    link: url,
    document_link: url,
    is_applicable: formData.applicable ?? true,
  };

  // ────── FIELD MAPPING FROM docConfig.fields ──────
  if (cfg.fields.includes("expiry")) {
    payload.expiry_date = formData.expiryDate || null;
  }
  if (cfg.fields.includes("signing")) {
    payload.contract_signing_date = formData.signingDate || null;
  }
  if (cfg.fields.includes("start")) {
    payload.contract_start_date = formData.startDate || null;
  }

  // ────── SPECIAL CASES (Night Worker, Pension) ──────
  if (key === "nightWorker") {
    Object.assign(payload, {
      is_night_worker: true,
      admin_uploaded: false,
      agreement_date: new Date().toISOString(),
    });
  }

  if (key === "pensionInfo") {
    Object.assign(payload, {
      eligible: true,
      auto_enrollment: true,
      current_status: formData.optIn ? "uploaded" : "not_uploaded",
      opt_date: formData.optIn ? new Date().toISOString() : null,
    });
  }

  // ────── GENERIC SIGNED-AGREEMENT FIELDS (only for new docs) ──────
  if (!cfg.apiKey && !isEdit) {
    Object.assign(payload, {
      name: cfg.title,
      category: cfg.category,
      status: "pending",
      priority: 1,
      document_type: "signable",
      requires_signature: true,
      is_signed: false,
      is_viewed: false,
      is_applicable: formData.applicable ?? true,
      signed_date: null,
      viewed_date: null,
      contract_date: formData.contractDate || null,
    });
  }

  // ────── FOR EDIT (PATCH): only send fields that changed or are required ──────
  if (isEdit && !cfg.apiKey) {
    // Only include fields that exist in the original payload
    const patchFields: Partial<typeof payload> = {
      link: url,
      document_link: url,
      is_applicable: formData.applicable ?? true,
    };

    // Optional dates
    if (cfg.fields.includes("signing")) patchFields.contract_signing_date = formData.signingDate || null;
    if (cfg.fields.includes("start")) patchFields.contract_start_date = formData.startDate || null;
    if (cfg.fields.includes("expiry")) patchFields.expiry_date = formData.expiryDate || null;

    // Generic fields that can be updated
    if (cfg.title === "Contract Of Employment") {
      patchFields.contract_date = formData.contractDate || null;
    }

    Object.assign(payload, patchFields);
  }

  const method = isEdit ? "PATCH" : "POST";
  const res = await fetch(endpoint, {
    method,
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed: ${err}`);
  }

  await reload();
  sonnerToast.success(`${cfg.title} ${isEdit ? "updated" : "uploaded"}`);
};

  const toggleApplicable = async (key: DocumentKey) => {
    const doc = docs[key];
    if (!doc.id) return;

    const endpoint = getEndpoint(key, doc.id);
    await fetch(endpoint, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify({ is_applicable: !doc.isApplicable }),
    });
    reload();
  };

  const deleteDoc = async (id?: number, key?: DocumentKey) => {
    if (!id || !key) return;
    const endpoint = getEndpoint(key, id);
    await fetch(endpoint, { method: "DELETE", headers: getHeaders(token) });
    reload();
    sonnerToast.success("Document deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white rounded-2xl shadow p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-orange-800">
            <FileText className="h-6 w-6" />
            Signed Agreements – Driver #{userId}
          </CardTitle>
        </CardHeader>
      </Card>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(docConfig).map(([key, cfg]) => {
          const k = key as DocumentKey;
          const d = docs[k];
          const uploaded = !!d.link;
          const fileUrl = d.link;

          const isImage = fileUrl && /\.(jpe?g|png|gif|webp)$/i.test(fileUrl);
          const previewUrl = uploaded
            ? isImage
              ? fileUrl
              : fileUrl?.endsWith(".pdf")
              ? `https://api.dicebear.com/7.x/shapes/svg?seed=pdf&backgroundColor=ff6b35`
              : null
            : null;

          return (
            <Card
              key={key}
              className={`overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
                !d.isApplicable ? "opacity-60 grayscale" : ""
              }`}
              onClick={() => uploaded && setDetail({ open: true, key: k })}
            >
              <div className="h-40 bg-gradient-to-br from-orange-50 to-orange-100 border-b relative overflow-hidden">
                {uploaded ? (
                  previewUrl ? (
                    isImage ? (
                      <img src={previewUrl} alt={cfg.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full p-4">
                        <img src={previewUrl} alt="PDF" className="h-20 w-20 drop-shadow-md" />
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-orange-600">
                      <FileText className="h-12 w-12 mb-2" />
                      <span className="text-xs font-medium">Document</span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Upload className="h-12 w-12 mb-2" />
                    <span className="text-xs font-medium">No file</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm line-clamp-2">{cfg.title}</h3>
                  {cfg.fields.includes("applicable") && (
                    <div className="flex items-center gap-1 text-xs">
                      <Switch
                        checked={d.isApplicable}
                        onCheckedChange={() => toggleApplicable(k)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs">{d.isApplicable ? "Yes" : "No"}</span>
                    </div>
                  )}
                </div>

                {d.categoryLabel && <div className="text-xs text-muted-foreground">{d.categoryLabel}</div>}
                <div>{getStatusBadge(d)}</div>

                {uploaded && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {d.signedDate && <div><strong>Signed:</strong> {formatDate(d.signedDate)}</div>}
                    {k === "nightWorker" && (d as NightWorkerDoc).expiryDate && (
                      <div><strong>Expiry:</strong> {formatDate((d as NightWorkerDoc).expiryDate)}</div>
                    )}
                    {k === "nightWorker" && (d as NightWorkerDoc).contractSigningDate && (
                      <div><strong>Signed:</strong> {formatDate((d as NightWorkerDoc).contractSigningDate ?? null)}</div>
                    )}
                    {k === "nightWorker" && (d as NightWorkerDoc).contractStartDate && (
                      <div><strong>Start:</strong> {formatDate((d as NightWorkerDoc).contractStartDate ?? null)}</div>
                    )}
                    {k === "pensionInfo" && (d as PensionDoc).optDate && (
                      <div><strong>Opt date:</strong> {formatDate((d as PensionDoc).optDate)}</div>
                    )}
                    {d.uploadDate && <div><strong>Uploaded:</strong> {formatDate(d.uploadDate)}</div>}
                  </div>
                )}

                <div className="flex gap-1.5 pt-2">
                  {!uploaded ? (
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadDialog({ open: true, key: k });
                        }}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskDialog(cfg.title);
                        }}
                      >
                        Later
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDoc(d.id, k);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Add internal notes…" className="min-h-32" />
          <Button className="mt-2" onClick={() => sonnerToast.success("Saved")}>
            Save Notes
          </Button>
        </CardContent>
      </Card>

      {/* Shared Dialogs */}
      {detail.open && detail.key && (
        <DocumentDetailDialog
          doc={docs[detail.key] as any}
          cfg={docConfig[detail.key]}
          onClose={() => setDetail({ open: false, key: null })}
          onDelete={() => {
            if (detail.key !== null) {
              deleteDoc(docs[detail.key].id, detail.key);
            }
            setDetail({ open: false, key: null });
          }}
          onUpdate={() => {
            if (detail.key !== null) {
              const d = docs[detail.key];
              setUploadDialog({
                open: true,
                key: detail.key,
                initial: {
                  applicable: d.isApplicable,
                  expiryDate: (d as any).expiryDate ?? "",
                  signingDate: (d as any).contractSigningDate ?? (d as any).signingDate ?? "",
                  startDate: (d as any).contractStartDate ?? (d as any).startDate ?? "",
                  optIn: (d as PensionDoc).optIn,
                  optOut: (d as PensionDoc).optOut,
                },
              });
            }
            setDetail({ open: false, key: null });
          }}
        />
      )}

      {uploadDialog.open && uploadDialog.key && (
        <DynamicUploadDialog
          keyName={uploadDialog.key}
          onUpload={uploadDocument}
          open={uploadDialog.open}
          onClose={() => setUploadDialog({ open: false, key: null, initial: undefined })}
          docs={docs}
          initialValues={uploadDialog.initial}
        />
      )}

      <CreateTaskDialog
        isOpen={taskDialog.open}
        onClose={() => setTaskDialog({ ...taskDialog, open: false })}
        onTaskCreated={() => {
          sonnerToast.success("Task created");
          setTaskDialog({ ...taskDialog, open: false });
        }}
      />
    </div>
  );
}