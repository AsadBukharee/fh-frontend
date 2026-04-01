"use client";

import { useState, useEffect, useCallback } from "react";
import API_URL from "@/app/utils/ENV";
import {
    FileText,
    Upload,
    Trash2,
    AlertCircle,
    User,
    CheckCircle2,
    Calendar,
    Edit,
    ChevronRight,
    ChevronLeft,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import FileUploader from "@/components/Media/MediaUpload";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { useStepper } from "./DriverStepper";

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

const formatDate = (d: string | null) =>
    d ? format(new Date(d), "dd-MM-yyyy") : "—";

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

        if (cfg.fields.includes("contract") && !formData.contractDate) {
            sonnerToast.error("Contract date is required");
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
                    {cfg.fields.includes("contract") && (
                        <div>
                            <Label>Contract Date *</Label>
                            <Input
                                type="date"
                                value={formData.contractDate || ""}
                                onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
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
    doc: {
        id: string
        link?: string
        driver?: { full_name: string; email: string }
        isApplicable?: boolean
        agreement_date?: string
        contractSigningDate?: string
        contractStartDate?: string
        contractDate?: string
        expiryDate?: string
        isNightWorker?: boolean
        uploadDate?: string
        current_status?: string
    }
    cfg: { title: string }
    onClose: () => void
    onDelete: () => void
    onUpdate: () => void
}

function DocumentDetailDialog({ doc, cfg, onClose, onDelete, onUpdate }: DocumentDetailDialogProps) {
    const fileUrl = doc.link
    const isImage = fileUrl && /\.(jpe?g|png|gif|webp)$/i.test(fileUrl)
    const isPdf = fileUrl && fileUrl.toLowerCase().endsWith(".pdf")

    const getStatusStyles = (status?: string) => {
        const baseClass = "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
        switch (status?.toLowerCase()) {
            case "active":
            case "approved":
                return `${baseClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50`
            case "pending":
                return `${baseClass} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50`
            case "expired":
            case "rejected":
                return `${baseClass} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50`
            default:
                return `${baseClass} bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50`
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-in fade-in zoom-in-95 duration-300">
                <DialogHeader className="relative bg-[#F15A29] p-8 pb-6 border-b border-white/10">
                    <div className="flex justify-between items-start w-full gap-4 pr-10">
                        <div className="space-y-3 flex-1">
                            <DialogTitle className="text-3xl font-bold text-white leading-tight">{cfg.title}</DialogTitle>

                            {doc.driver && (
                                <DialogDescription className="flex items-center gap-2 text-slate-300/90">
                                    <User className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium">{doc.driver.full_name}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-400">{doc.driver.email}</span>
                                </DialogDescription>
                            )}
                        </div>

                        {doc.current_status && (
                            <div className={getStatusStyles(doc.current_status)}>
                                {doc.current_status?.toLowerCase() === "active" || doc.current_status?.toLowerCase() === "approved" ? (
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                ) : doc.current_status?.toLowerCase() === "expired" ? (
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                ) : null}
                                {doc.current_status}
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-200px)]">
                    <div className="p-8 space-y-8">
                        {fileUrl && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#F15A29] rounded-full"></div>
                                    Document Preview
                                </h3>
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                    {isImage ? (
                                        <img
                                            src={fileUrl || "/placeholder.svg"}
                                            alt={cfg.title}
                                            className="w-full h-auto max-h-[400px] object-contain p-6"
                                            crossOrigin="anonymous"
                                        />
                                    ) : isPdf ? (
                                        <iframe src={fileUrl} className="w-full h-[400px] border-0" title="PDF Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                            <FileText className="h-16 w-16 mb-3 opacity-30" />
                                            <span className="text-sm font-medium">No preview available for this file type</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-4 bg-[#F15A29] rounded-full"></div>
                                Document Details
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                {[
                                    { label: "ID", value: doc.id, icon: null },
                                    { label: "Status", value: doc.current_status, icon: CheckCircle2 },
                                    { label: "Applicable", value: doc.isApplicable ? "Yes" : "No", icon: null },
                                    {
                                        label: "Agreement Date",
                                        value: doc.agreement_date && formatDate(doc.agreement_date),
                                        icon: Calendar,
                                    },
                                    {
                                        label: "Signing Date",
                                        value: doc.contractSigningDate && formatDate(doc.contractSigningDate),
                                        icon: Calendar,
                                    },
                                    {
                                        label: "Start Date",
                                        value: doc.contractStartDate && formatDate(doc.contractStartDate),
                                        icon: Calendar,
                                    },
                                    { label: "Contract Date", value: doc.contractDate && formatDate(doc.contractDate), icon: Calendar },
                                    { label: "Expiry Date", value: doc.expiryDate && formatDate(doc.expiryDate), icon: Calendar },
                                    {
                                        label: "Night Worker",
                                        value: doc.isNightWorker !== undefined ? (doc.isNightWorker ? "Yes" : "No") : null,
                                        icon: null,
                                    },
                                    { label: "Uploaded", value: doc.uploadDate && formatDate(doc.uploadDate), icon: Calendar },
                                ]
                                    .filter(item => item.value != null)
                                    .map(({ label, value, icon: Icon }) => (
                                        <div
                                            key={label}
                                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 hover:shadow-md"
                                        >
                                            <div className="flex items-start gap-2 mb-2">
                                                {Icon && <Icon className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />}
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {label}
                                                </label>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-lg border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 bg-transparent"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={onUpdate}
                        className="rounded-lg bg-[#F15A29] text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Update
                    </Button>
                    <Button
                        onClick={onDelete}
                        variant="destructive"
                        className="rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/* ────────────────────── Main Component ────────────────────── */
interface SignedAgreementsProps {
    driverId?: number | null;
    userId?: number;
    onOpenChange?: (open: boolean) => void;
}

export default function SignedAgreements({
    driverId,
    userId,
    onOpenChange,
}: SignedAgreementsProps) {
    const cookies = useCookies();
    const token = cookies.get("access_token") ?? "";
    const { goToNextStep, goToPreviousStep, disableBack } = useStepper();

    const { docs, loading: docsLoading, reload } = useDriverDocuments(String(userId ?? 0), token);
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
        driverId: number;
    }>({
        open: false,
        title: "",
        driverId: typeof driverId === "number" ? driverId : 0,
    });

    // Add state to track tasks created for documents
    const [tasksCreated, setTasksCreated] = useState<Set<DocumentKey>>(new Set());

    const openTaskDialog = (title: string, key: DocumentKey) => {
        // Add this document to tasks created set
        setTasksCreated(prev => new Set([...prev, key]));
        
        setTaskDialog({
            open: true,
            title: `Upload ${title} (Driver #${userId})`,
            driverId: typeof driverId === "number" ? driverId : 0,
        });
    };

    const [validationError, setValidationError] = useState<string | null>(null);

    // Function to check if user can proceed to next step
    const canProceedToNextStep = useCallback(() => {
        // Check each document
        for (const [key] of Object.entries(docConfig)) {
            const k = key as DocumentKey;
            const doc = docs[k];
            
            // Skip validation if document is marked as not applicable
            if (!doc.isApplicable) {
                continue;
            }
            
            // If applicable and no document is uploaded AND no task created for it, user cannot proceed
            if (!doc.link && !tasksCreated.has(k)) {
                return false;
            }
        }
        
        return true;
    }, [docs, tasksCreated]);

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
        if (cfg.fields.includes("contract")) payload.contract_date = formData.contractDate || null;

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

            if (doc.id) {
                endpoint = getEndpoint(key, doc.id);
                method = "PATCH";
                Object.assign(payload, { is_applicable: newApplicable });
            } else {
                endpoint = getEndpoint(key);
                method = "POST";

                if (key === "nightWorker") {
                    Object.assign(payload, {
                        is_night_worker: true,
                        admin_uploaded: false,
                        agreement_date: new Date().toISOString().split("T")[0],
                    });
                }

                if (key === "pensionInfo") {
                    Object.assign(payload, {
                        eligible: true,
                        auto_enrollment: true,
                        current_status: "not_uploaded",
                    });
                }

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

            await reload();

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

    const handleNext = () => {
        if (!canProceedToNextStep()) {
            setValidationError("Please upload all applicable documents or create tasks for missing documents before proceeding.");
            return;
        }
        
        // Clear any previous error
        setValidationError(null);
        
        // This is the last step, so close the dialog
        if (onOpenChange) {
            sonnerToast.success("Driver registration completed successfully!");
            onOpenChange(false);
        } else {
            goToNextStep();
        }
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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-gray-700" />
                    <h1 className="text-xl font-semibold text-gray-900">
                        Signed Agreements
                    </h1>
                </div>

            </div>

            {/* Validation Error Message */}
            {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">{validationError}</p>
                    </div>
                    <div className="mt-2 text-sm text-red-600">
                        For each applicable document, you must either:
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                            <li>Upload the document, OR</li>
                            <li>Click &quot;Later&quot; to create a task for it</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Document Grid */}
            <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
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
                            className={`overflow-hidden bg-white rounded-xl border border-gray-200 transition-all hover:shadow-lg ${!d.isApplicable ? "opacity-50" : ""
                                }`}
                        >
                            {/* Image/Preview Area */}
                            <div
                                className="h-44 bg-gray-100 relative overflow-hidden cursor-pointer group"
                                onClick={() => uploaded && setDetail({ open: true, key: k })}
                            >
                                {uploaded ? (
                                    previewUrl ? (
                                        isImage ? (
                                            <img
                                                src={previewUrl}
                                                alt={cfg.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <FileText className="h-16 w-16 text-[#F15A29]" />
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-[#F15A29]">
                                            <FileText className="h-16 w-16" />
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                                            <Upload className="h-10 w-10 text-orange-400" />
                                        </div>
                                        <span className="text-sm text-gray-500">Drag & Drop file here</span>
                                        <span className="text-xs text-gray-400 mt-1">or click upload button</span>
                                    </div>
                                )}

                                {/* Delete button overlay for uploaded docs */}
                                {uploaded && (
                                    <button
                                        className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteDoc(d.id, k);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="p-4 space-y-3">
                                {/* Title & Toggle */}
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{cfg.title}</h3>
                                    <Switch
                                        checked={d.isApplicable}
                                        onCheckedChange={() => toggleApplicable(k)}
                                    />
                                </div>

                                {/* Category Badge */}
                                {d.categoryLabel && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-gray-600">{d.categoryLabel}</span>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    {getStatusBadge(d)}

                                    {/* Date info */}
                                    {uploaded && (
                                        <div className="text-xs text-gray-500">
                                            {d.uploadDate && formatDate(d.uploadDate)}
                                        </div>
                                    )}
                                </div>

                                {/* Task Created Badge */}
                                {!uploaded && d.isApplicable && tasksCreated.has(k) && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Task Created
                                    </div>
                                )}

                                {/* Additional metadata for uploaded docs */}
                                {uploaded && (
                                    <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                                        {k === "nightWorker" && (d as NightWorkerDoc).contractSigningDate && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Contract Date:</span>
                                                <span>{formatDate((d as NightWorkerDoc).contractSigningDate ?? null)}</span>
                                            </div>
                                        )}
                                        {k === "contractOfEmployment" && (d as ContractDoc).contractDate && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Contract Date:</span>
                                                <span>{formatDate((d as ContractDoc).contractDate ?? null)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    {!uploaded ? (
                                        <>
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-[#F15A29] hover:bg-orange-600 text-white"
                                                disabled={!documentNames.length && !cfg.apiKey}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUploadDialog({ open: true, key: k });
                                                }}
                                            >
                                                <Upload className="h-4 w-4 mr-1.5" />
                                                Upload
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openTaskDialog(cfg.title, k);
                                                }}
                                            >
                                                <AlertCircle className="h-4 w-4 mr-1.5" />
                                                Later
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadDialog({
                                                    open: true,
                                                    key: k,
                                                    initial: {
                                                        applicable: d.isApplicable,
                                                        expiryDate: (d as any).expiryDate ?? "",
                                                        signingDate: (d as any).contractSigningDate ?? (d as any).signingDate ?? "",
                                                        startDate: (d as any).contractStartDate ?? (d as any).startDate ?? "",
                                                        contractDate: (d as any).contractDate ?? "",
                                                        optIn: (d as PensionDoc).optIn,
                                                        optOut: (d as PensionDoc).optOut,
                                                    },
                                                });
                                            }}
                                        >
                                            Update
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </section>

            <Separator className="my-8" />

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
                                    contractDate: (d as any).contractDate ?? "",
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
            
            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
                {/* Previous */}
                <Button
                    type="button"
                    variant="outline"
                    className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
                    onClick={goToPreviousStep}
                    disabled={disableBack}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                {/* Save & Finish */}
                <Button
                    type="button"
                    variant="outline"
                    className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
                    onClick={handleNext}
                    disabled={!canProceedToNextStep()}
                >
                    Finish
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}