"use client";

import { useState, useEffect, useCallback } from "react";
import API_URL from "@/app/utils/ENV";
import {
  FileText,
  Upload,
  Trash2,
  AlertCircle,
  X,
  User,
  CheckCircle2,
  Calendar,
  Edit,
  Briefcase,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
import { useParams, useSearchParams } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { toast as sonnerToast, toast } from "sonner";
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
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
  contractDate?: string | null; // NEW
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

const docConfig: Record<
  DocumentKey,
  {
    title: string;
    fields: ("applicable" | "expiry" | "signing" | "start" | "optIn" | "optOut" | "contract")[];
    category: string;
    requiresFormOnOptOut?: boolean;
    apiKey?: string;
  }
> = {
  nightWorker: {
    title: "Night Worker Agreement",
    fields: ["applicable", "expiry"], // Keep existing
    category: "employment",
    apiKey: "night-worker-agreements",
  },
  contractOfEmployment: {
    title: "Contract of Employment",
    fields: ["applicable", "start", "contract"], // Added "applicable"
    category: "employment",
  },
  pensionInfo: {
    title: "Pension Opt In/Out",
    fields: ["applicable", "optIn", "optOut"], // Added "applicable"
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
    title: "Covenant/ Non-Disclosure Agreement",
    fields: ["applicable"],
    category: "employment",
  },
  vehicleFamiliarisation: {
    title: "Vehicle Familiarisation & Walkaround",
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

const formatDate = (d: string | null | undefined) =>
  formatToDDMMYYYY(d);

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

  // NEW: Night worker has no status → show "Uploaded" if link exists
  if (doc.link) {
    return <Badge variant="outline">Uploaded</Badge>;
  }

  return <Badge variant="outline">Not uploaded</Badge>;
};

/* ────────────────────── Hook: Load Document Names ────────────────────── */
function useDocumentNames(token: string) {
  const [names, setNames] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/profiles/document-name/`, {
          headers: getHeaders(token),
        });
        if (!r.ok) throw new Error("Failed to load document-name list");
        const data = await r.json();
        setNames(data.results);
      } catch (e: any) {
        sonnerToast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return { names, loading };
}

/* ────────────────────── Load Documents Hook ────────────────────── */
function useDriverDocuments(userId: string, token: string) {
  const [docs, setDocs] = useState<DocMap>({
    nightWorker: {
      link: null,
      uploadDate: null,
      isApplicable: true,
      expiryDate: null,
      isNightWorker: true,
    },
    contractOfEmployment: {
      link: null,
      uploadDate: null,
      isApplicable: true,
      signingDate: null,
      startDate: null,
      contractDate: null,
    },
    pensionInfo: {
      link: null,
      uploadDate: null,
      isApplicable: true,
      optIn: false,
      optOut: false,
      optDate: null,
    },
    uniformAgreement: { link: null, uploadDate: null, isApplicable: true },
    covenantNDA: { link: null, uploadDate: null, isApplicable: true },
    vehicleFamiliarisation: {
      link: null,
      uploadDate: null,
      isApplicable: true,
      expiryDate: null,
    },
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

      // NEW: Extract all three arrays
      const signedAgreements: any[] = json.signed_agreements ?? [];
      const pensionInfo: any[] = json.pension_info ?? [];
      const nightWorkerAgreements: any[] = json.night_worker_agreements ?? [];

      // Helper: find by stable document_name_id
      const findById = (arr: any[], id: number) =>
        arr.find((d) => d.document_name_id === id);

      const map: Partial<DocMap> = {};

      Object.entries(docConfig).forEach(([key, cfg]) => {
        const k = key as DocumentKey;
        let apiDoc: any = null;

        // NEW: Dedicated API sections
        if (cfg.apiKey === "night-worker-agreements") {
          apiDoc = nightWorkerAgreements[0];
        } else if (cfg.apiKey === "pension-info") {
          apiDoc = pensionInfo[0];
        }
        // Signable docs
        else if (!cfg.apiKey) {
          const knownIdMap: Partial<Record<DocumentKey, number>> = {
            contractOfEmployment: 1,
            covenantNDA: 2,
            uniformAgreement: 3,
            vehicleFamiliarisation: 4,
            employeeHandbook: 5,
            ehuForm: 6,
            fhRules: 7,
            crhRules: 8,
          };

          const knownId = knownIdMap[k];

          if (knownId !== undefined) {
            apiDoc = findById(signedAgreements, knownId);
          }
          if (!apiDoc) {
            apiDoc = signedAgreements.find((d: any) => d.document_name === cfg.title);
          }
        }

        const base = {
          id: apiDoc?.id ?? null,
          link: apiDoc?.link ?? apiDoc?.document_link ?? null,
          uploadDate:
            apiDoc?.upload_date ??
            apiDoc?.last_updated ??
            apiDoc?.agreement_date ??
            null,
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
            contractDate: apiDoc?.contract_date ?? null, // NEW
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


/* ────────────────────── Shared Document Detail Dialog ────────────────────── */
interface DocumentDetailDialogProps {
  doc: {
    id?: number
    link?: string | null
    driver?: { full_name: string; email: string }
    isApplicable?: boolean
    agreement_date?: string | null
    contractSigningDate?: string | null
    contractStartDate?: string | null
    contractDate?: string | null
    expiryDate?: string | null
    isNightWorker?: boolean
    uploadDate?: string | null
    current_status?: string
    [key: string]: any
  }
  cfg: {
    title: string
    fields: ("applicable" | "expiry" | "signing" | "start" | "optIn" | "optOut" | "contract")[]
  }
  onClose: () => void
  onSave: (formData: any, fileUrl: string | null) => Promise<void>
  onLater?: () => void
  onDelete?: () => void
}




function DocumentDetailDialog({ doc, cfg, onClose, onSave, onLater, onDelete }: DocumentDetailDialogProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(doc.link ?? null);
  const [formData, setFormData] = useState<Record<string, any>>({
    applicable: doc.isApplicable ?? true,
    expiryDate: doc.expiryDate ?? "",
    signingDate: doc.contractSigningDate ?? doc.signingDate ?? "",
    startDate: doc.contractStartDate ?? doc.startDate ?? "",
    contractDate: doc.contractDate ?? "",
    optIn: doc.optIn ?? false,
    optOut: doc.optOut ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const isImage = fileUrl && /\.(jpe?g|png|gif|webp)$/i.test(fileUrl);
  const isPdf = fileUrl && fileUrl.toLowerCase().endsWith(".pdf");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData, fileUrl);
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSuccess = (url: string) => {
    setFileUrl(url);
    setShowUploader(false);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-[2rem] border-none shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[550px]">
            {/* Left Column: Image Preview Style from Reference */}
            <div className="p-8 flex flex-col items-center bg-white border-r border-gray-50 overflow-y-auto custom-scrollbar">
              <div className="w-full text-left mb-6">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">{cfg.title}</h2>
                <p className="text-sm text-gray-400 mt-1 font-medium">Review and update document details</p>
              </div>

              <div className="w-full relative group/carousel h-[380px] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-sm p-4">
                <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
                  {fileUrl ? (
                    isImage ? (
                      <div className="relative w-full h-full cursor-pointer group/img">
                        <img src={fileUrl} alt={cfg.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="text-white h-12 w-12" />
                        </div>
                      </div>
                    ) : isPdf ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#FDE4E7]">
                        <FileText className="h-16 w-16 text-[#E11D48] opacity-50" />
                        <span className="font-bold text-[#E11D48] uppercase tracking-widest text-xs">PDF DOCUMENT</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-50">
                        <FileText className="h-16 w-16 text-gray-200" />
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8 bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
                      <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-10 w-10 text-gray-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-900">Document Missing</p>
                        <p className="text-sm font-medium text-gray-400 leading-tight px-4">Click the upload icon to add a document</p>
                      </div>
                    </div>
                  )}

                  {/* Upload Action overlay */}
                  <div className="absolute top-6 right-6 z-20">
                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUploader(true);
                      }}
                      className="h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-none text-[#F15A29] hover:bg-white hover:scale-110 active:scale-95 transition-all"
                    >
                      <Upload className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form Fields from Reference Style */}
            <div className="p-10 bg-white border-l border-gray-50 flex flex-col justify-between">
              <div className="space-y-8">
                {/* Conditional Fields based on cfg.fields */}
                {cfg.fields.includes("start") && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Employment Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate || ""}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#F15A29] focus:border-[#F15A29] font-medium px-4 bg-white"
                    />
                  </div>
                )}

                {cfg.fields.includes("contract") && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Contract Date</Label>
                    <Input
                      type="date"
                      value={formData.contractDate || ""}
                      onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#F15A29] focus:border-[#F15A29] font-medium px-4 bg-white"
                    />
                  </div>
                )}

                {cfg.fields.includes("expiry") && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.expiryDate || ""}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="h-12 border-gray-100 rounded-xl focus:ring-[#F15A29] focus:border-[#F15A29] font-medium px-4 bg-white"
                    />
                  </div>
                )}

                {/* Status Section mimicking reference logic */}
                {(cfg.fields.includes("optIn") || cfg.fields.includes("optOut")) && (
                  <div className="space-y-3">
                    <Label className="text-[13px] font-bold text-gray-800 ml-1">Pension Status</Label>
                    <div className="flex gap-3">
                      {[
                        { val: "in", label: "Opt In", check: formData.optIn },
                        { val: "out", label: "Opt Out", check: formData.optOut }
                      ].map((s) => (
                        <button
                          key={s.val}
                          onClick={() => setFormData({ ...formData, optIn: s.val === "in", optOut: s.val === "out" })}
                          type="button"
                          className={cn(
                            "flex-1 py-3 rounded-full text-sm font-bold transition-all border outline-none",
                            s.check
                              ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                              : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applicable Toggle matching reference */}
                {cfg.fields.includes("applicable") && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="space-y-0.5">
                      <Label className="text-[13px] font-bold text-gray-800">Is Applicable</Label>
                      <p className="text-[10px] text-gray-400 font-medium">Toggle if this document applies</p>
                    </div>
                    <Switch
                      checked={formData.applicable}
                      onCheckedChange={(checked) => setFormData({ ...formData, applicable: checked })}
                      className="data-[state=checked]:bg-[#F15A29] scale-90"
                    />
                  </div>
                )}
              </div>

              {/* Footer Buttons Style from Reference */}
              <div className="flex gap-4 pt-6 mt-8">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-14 bg-[#FFD8CD] hover:bg-[#FFC9BB] text-[#F15A29] font-bold rounded-2xl shadow-sm transform active:scale-[0.98] transition-all"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Upload Modal Overlay - Same style as reference */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="w-fit bg-white rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold">Upload Document</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please upload a clear image of the {cfg.title}.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-100">
            <FileUploader
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


/* ────────────────────── Main Component ────────────────────── */
export default function SignAgreementAdminTab() {
  const { id } = useParams();
  const driver_id = id as string;
  // const searchParams=useSearchParams();

  // alert(user_id)
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id")
  const name = searchParams.get("name");
  const cookies = useCookies();
  const token = cookies.get("access_token") ?? "";

  const { docs, loading: docsLoading, reload } = useDriverDocuments(userId ?? "", token);
  const { names: documentNames, loading: namesLoading } = useDocumentNames(token);

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
    driverId: driver_id,
  });

  const openTaskDialog = (title: string) => {
    setTaskDialog({
      open: true,
      title: `Upload ${title} (Driver #${userId})`,
      driverId: driver_id,
    });
  };

  const uploadDocument = async (key: DocumentKey, url: string, formData: any) => {
    const cfg = docConfig[key];
    const doc = docs[key];
    const isEdit = !!doc.id;
    const endpoint = getEndpoint(key, isEdit ? doc.id : undefined);
    const method = isEdit ? "PATCH" : "POST";

    const payload: any = {
      driver_id: Number(userId),
      link: url,
      document_link: url,
      is_applicable: formData.applicable ?? true,
    };

    if (cfg.fields.includes("expiry")) payload.expiry_date = formData.expiryDate || null;
    if (cfg.fields.includes("signing")) payload.contract_signing_date = formData.signingDate || null;
    if (cfg.fields.includes("start")) payload.contract_start_date = formData.startDate || null;
    if (cfg.fields.includes("contract")) payload.contract_date = formData.contractDate || null; // NEW

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

    if (!cfg.apiKey) {
      if (!isEdit) {
        const docNameInfo = documentNames.find(d => d.name === cfg.title);
        if (!docNameInfo) {
          throw new Error(`Document name "${cfg.title}" not found in /document-name/`);
        }

        Object.assign(payload, {
          document_name_id: docNameInfo.id,
          name: cfg.title,
          category: cfg.category,
          status: "pending",
          priority: 1,
          document_type: "signable",
          requires_signature: true,
          is_signed: false,
          is_viewed: false,
          signed_date: null,
          viewed_date: null,
          contract_date: formData.contractDate || null,
        });
      }

      if (isEdit) {
        const patch: Partial<typeof payload> = {
          link: url,
          document_link: url,
          is_applicable: formData.applicable ?? true,
        };
        if (cfg.fields.includes("expiry")) patch.expiry_date = formData.expiryDate || null;
        if (cfg.fields.includes("signing")) patch.contract_signing_date = formData.signingDate || null;
        if (cfg.fields.includes("start")) patch.contract_start_date = formData.startDate || null;
        if (cfg.fields.includes("contract")) patch.contract_date = formData.contractDate || null;

        Object.assign(payload, patch);
      }
    }

    const res = await fetch(endpoint, {
      method,
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API error ${res.status}: ${txt}`);
    }

    await reload();
    sonnerToast.success(`${cfg.title} ${isEdit ? "updated" : "uploaded"}`);
  };

  const toggleApplicable = async (key: DocumentKey) => {
    const doc = docs[key];
    const cfg = docConfig[key];
    const newApplicable = !doc.isApplicable;

    try {
      let endpoint = "";
      let method = "";
      const payload: any = {
        driver_id: Number(userId),
        is_applicable: newApplicable,
      };

      // Case 1: Document already exists → simple PATCH
      if (doc.id) {
        endpoint = getEndpoint(key, doc.id);
        method = "PATCH";
        // Only send what we need
        Object.assign(payload, { is_applicable: newApplicable });
      }
      // Case 2: No document yet → we CREATE one just to save applicability
      else {
        endpoint = getEndpoint(key); // list/create endpoint
        method = "POST";

        // Add minimal required fields depending on document type
        if (key === "nightWorker") {
          Object.assign(payload, {
            is_night_worker: true,
            admin_uploaded: false,
            agreement_date: new Date().toISOString().split("T")[0], // today
          });
        }

        if (key === "pensionInfo") {
          Object.assign(payload, {
            eligible: true,
            auto_enrollment: true,
            current_status: "not_uploaded", // since no file yet
          });
        }

        // For normal signed agreements (contract, NDA, handbook, etc.)
        if (!cfg.apiKey) {
          const docName = documentNames.find((d) => d.name === cfg.title);
          if (!docName) {
            sonnerToast.error(`Document "${cfg.title}" not found in system`);
            return;
          }

          Object.assign(payload, {
            document_name_id: docName.id,
            name: cfg.title,
            category: cfg.category,
            status: "pending",
            priority: 1,
            document_type: "signable",
            requires_signature: true,
            is_signed: false,
            link: null,
            document_link: null,
          });
        }
      }

      const res = await fetch(endpoint, {
        method,
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save: ${errorText || res.statusText}`);
      }

      await reload(); // Refresh all documents

      sonnerToast.success(
        `${cfg.title} is now ${newApplicable ? "Applicable" : "Not Applicable"}`
      );
    } catch (err: any) {
      console.error("toggleApplicable error:", err);
      sonnerToast.error(err.message || "Failed to update applicability");
    }
  };

  const deleteDoc = async (id?: number, key?: DocumentKey) => {
    if (!id || !key) return;
    const endpoint = getEndpoint(key, id);
    await fetch(endpoint, { method: "DELETE", headers: getHeaders(token) });
    reload();
    sonnerToast.success("Document deleted");
  };

  if (docsLoading || namesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F15A29] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">
          Signed Agreements – <span className="text-orange-600"><span className="text-black">Driver </span>{name ? name : `# ${userId}`}</span>
        </h1>
      </div>

      {/* Document Grid */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
              className={`overflow-hidden bg-white rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col h-full ${!d.isApplicable ? "opacity-50" : ""}`}
            >
              {/* Top Section: Photo / Placeholder */}
              <div className="p-4 pb-2">
                <div className="relative overflow-hidden rounded-2xl h-[170px]">
                  {uploaded ? (
                    <>
                      <div
                        className="w-full h-full cursor-pointer"
                        onClick={() => setDetail({ open: true, key: k })}
                      >
                        {isImage ? (
                          <img
                            src={fileUrl!}
                            alt={cfg.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-gray-50 border border-gray-100">
                            <FileText className="h-12 w-12 text-gray-200" />
                          </div>
                        )}
                      </div>
                      {/* Trash Overlay */}
                      <button
                        className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDoc(d.id, k);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </>
                  ) : (
                    /* Not uploaded: Dashed border area */
                    <div className="flex flex-col items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                      <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                        <Upload className="h-7 w-7 text-orange-500" />
                      </div>
                      <span className="text-[15px] font-semibold text-gray-900 leading-tight">Drag & Drop file here</span>
                      <span className="text-xs text-gray-400 mt-1">or click upload button</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="px-5 pb-5 pt-2 flex-1 flex flex-col space-y-4">
                {/* Header: Title + Switch */}
                <div className="flex justify-between items-center gap-2">
                  <h3 className="font-bold text-[15px] text-gray-900 leading-tight">{cfg.title}</h3>
                  <Switch
                    checked={d.isApplicable}
                    onCheckedChange={() => toggleApplicable(k)}
                    className="data-[state=checked]:bg-green-500 flex-shrink-0"
                  />
                </div>

                {/* Not uploaded status pill */}
                {!uploaded && (
                  <div className="mt-[-8px]">
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-[11px] font-semibold border border-gray-50">
                      Not uploaded
                    </span>
                  </div>
                )}

                {/* Metadata Rows (Uploaded State) */}
                {uploaded && (
                  <div className="space-y-4 pt-1">
                    {/* Contract Date Pill */}
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-50 text-[13px]">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Contract Date</span>
                      </div>
                      <span className="font-bold text-orange-500">
                        {formatDate(
                          (k === "contractOfEmployment") ? (d as ContractDoc).contractDate :
                            (k === "nightWorker") ? (d as NightWorkerDoc).expiryDate :
                              (k === "vehicleFamiliarisation") ? (d as ExpiryApplicableDoc).expiryDate :
                                (d.uploadDate)
                        )}
                      </span>
                    </div>

                    {/* Employment Row */}
                    <div className="flex items-center justify-between text-[13px] px-1">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Briefcase className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Employment</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-500 text-[10px] font-bold border border-orange-100">
                        Pending
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 mt-auto">
                  {!uploaded ? (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#F15A29] hover:bg-orange-600 text-white rounded-xl h-12 text-sm font-bold shadow-sm transition-all active:scale-95"
                        disabled={!documentNames.length && !cfg.apiKey}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetail({ open: true, key: k });
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-50/50 hover:bg-red-50 text-red-500 rounded-xl h-12 text-sm font-semibold transition-all active:scale-95 border-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskDialog(cfg.title);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Later
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 bg-red-50/50 hover:bg-red-50 text-red-500 rounded-xl h-12 text-sm font-bold transition-all active:scale-95 border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetail({ open: true, key: k });
                      }}
                    >
                      Update <Edit className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <Separator className="my-8" />

      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Add internal notes…" className="min-h-32" />
          <Button className="mt-2" onClick={() => sonnerToast.success("Saved")}>
            Save Notes
          </Button>
        </CardContent>
      </Card> */}

      {/* Shared Dialogs */}
      {detail.open && detail.key && (
        <DocumentDetailDialog
          doc={docs[detail.key] as any}
          cfg={docConfig[detail.key]}
          onClose={() => setDetail({ open: false, key: null })}
          onSave={(formData, fileUrl) => uploadDocument(detail.key!, fileUrl || "", formData)}
          onLater={() => {
            if (detail.key) {
              openTaskDialog(docConfig[detail.key].title);
              setDetail({ open: false, key: null });
            }
          }}
          onDelete={() => {
            if (detail.key !== null) {
              deleteDoc(docs[detail.key].id, detail.key);
            }
            setDetail({ open: false, key: null });
          }}
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