"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Save,
  X,
  Mail,
  AlertCircle,
  RefreshCw,
  User,
  Shield,
  FileText,
  Check,
  XCircle,
  Plus,
  Eye,
  EyeOff,
  UserPlus,
  Lock,
  MoreVertical,
  Filter,
  ChevronDown,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";
import Link from "next/link";
import ExportButton from "@/app/utils/ExportButton";
import AddDriver from "@/components/add-driver/page";

/* ──────────────────────── Interfaces ──────────────────────── */
interface Driver {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    display_name: string;
    parent_rota_completed: boolean;
    child_rota_completed: boolean;
    is_active: boolean;
    contract: { id: number; name: string; description: string } | null;
    role: string;
    site: Array<{ id: number; name: string; status: string; image: string }>;
    shifts_count: number;
    avatar?: string | null;
  };
  warnings: string[];
  missing_attributes: string[];
  next_step: string;
  is_profile_completed: boolean;
  remarks: string;
  profile_status: string;
  have_other_jobs: boolean;
  have_other_jobs_note: string;
  date_of_birth: string;
  phone: string;
  address: string;
  account_no: string;
  sort_code: string;
  post_code: string;
  national_insurance_no: string;
  license_number: string;
  license_issue_number: string;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_contact: string;
  next_of_kin_email: string;
  next_of_kin_address: string;
  manager_name: string;
  signup_date: string;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: number;
  name: string;
  description: string;
}

interface Site {
  id: number;
  name: string;
  status: string;
  image: string;
}

interface UserForm {
  email: string;
  full_name: string;
  password?: string;
  password_confirm?: string;
  role: string;
  contractId?: string;
  siteId?: string;
  is_active: boolean;
}

const AddUserModal = React.memo(
  ({
    isOpen,
    setIsOpen,
    formData,
    setFormData,
    formErrors,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    contracts,
    contractsLoading,
    sites,
    sitesLoading,
    editLoading,
    handleSubmit,
  }: {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    formData: UserForm;
    setFormData: (v: UserForm) => void;
    formErrors: Partial<UserForm>;
    showPassword: boolean;
    setShowPassword: (v: boolean) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (v: boolean) => void;
    contracts: Contract[];
    contractsLoading: boolean;
    sites: Site[];
    sitesLoading: boolean;
    editLoading: boolean;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white p-0">
        <div className="p-6 pb-4">
          <DialogHeader className="space-y-1 text-left p-0">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Add New Driver
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Create a new driver account. Role is automatically set to <span className="text-orange-600 font-semibold">Driver</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          <input type="hidden" name="role" value="driver" />

          {/* Personal Information */}
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User className="w-4 h-4 text-orange-600" />
              Personal Information
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-email" className="text-sm font-medium text-gray-900">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="w-4 z-1 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="add-email"
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 h-11 ${formErrors.email ? "border-red-500" : ""}`}
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-full_name" className="text-sm font-medium text-gray-900">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="w-4 z-1 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="add-full_name"
                    name="full_name"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`pl-10 h-11 ${formErrors.full_name ? "border-red-500" : ""}`}
                    required
                  />
                </div>
                {formErrors.full_name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password" className="text-sm font-medium text-gray-900">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 z-1 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="add-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`pl-10 pr-10 h-11 ${formErrors.password ? "border-red-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password ? (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                ) : (
                  <p className="text-xs text-red-500">Minimum 8 characters</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password_confirm" className="text-sm font-medium text-gray-900">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 z-1 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="add-password_confirm"
                    name="password_confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.password_confirm}
                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                    className={`pl-10 pr-10 h-11 ${formErrors.password_confirm ? "border-red-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password_confirm && (
                  <p className="text-xs text-red-500">{formErrors.password_confirm}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contract Assignment */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FileText className="w-4 h-4 text-orange-600" />
              Contract Assignment
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-contract" className="text-sm font-medium text-gray-900">
                Assigned Contract <span className="text-red-500">*</span>
              </Label>
              {contractsLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg h-11">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading contracts...</span>
                </div>
              ) : (
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <Select
                    value={formData.contractId}
                    onValueChange={(v) => setFormData({ ...formData, contractId: v })}
                  >
                    <SelectTrigger name="contract" className="pl-10 h-11">
                      <SelectValue placeholder="Assigned Contract" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Contract</SelectItem>
                      {contracts.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ChevronRight className="w-4 h-4 absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Site Assignment */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FileText className="w-4 h-4 text-orange-600" />
              Site Assignment
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-site" className="text-sm font-medium text-gray-900">
                Assigned Site <span className="text-red-500">*</span>
              </Label>
              {sitesLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg h-11">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading sites...</span>
                </div>
              ) : (
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <Select
                    value={formData.siteId}
                    onValueChange={(v) => setFormData({ ...formData, siteId: v })}
                  >
                    <SelectTrigger name="site" className="pl-10 h-11">
                      <SelectValue placeholder="Assigned Site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Site</SelectItem>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ChevronRight className="w-4 h-4 absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-6 pb-6 pt-2 space-y-3">
            <Button
              type="submit"
              disabled={editLoading}
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 h-12 text-base font-semibold"
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create New Driver
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={editLoading}
              className="w-full h-12 text-base font-semibold"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
);
AddUserModal.displayName = "AddUserModal";

/* ──────────────────────── MAIN PAGE ──────────────────────── */
export default function DriversPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverUserId, setNewDriverUserId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    contract: "all",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<UserForm>({
    email: "",
    full_name: "",
    role: "driver",
    contractId: "none",
    siteId: "none",
    is_active: true,
    password: "",
    password_confirm: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<UserForm>>({});

  const { showToast } = useToast();
  const cookies = useCookies();
  const perPage = 10;

  /* ── Filtering ── */
  const filteredDrivers = useMemo(() => {
    return allDrivers.filter((d) => {
      let ok = true;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        ok = ok && (
          d.user.full_name.toLowerCase().includes(q) ||
          d.user.display_name.toLowerCase().includes(q) ||
          d.user.email.toLowerCase().includes(q) ||
          d.license_number?.toLowerCase().includes(q)
        );
      }

      if (filters.status !== "all") {
        ok = ok && d.profile_status.toLowerCase() === filters.status;
      }

      if (filters.contract !== "all") {
        if (filters.contract === "no_contract") {
          ok = ok && !d.user.contract;
        } else {
          ok = ok && d.user.contract?.name === filters.contract;
        }
      }

      return ok;
    });
  }, [allDrivers, searchQuery, filters]);

  const totalPages = Math.ceil(filteredDrivers.length / perPage);
  const currentDrivers = filteredDrivers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const uniqueContracts = useMemo(() => {
    const contractSet = new Set<string>();
    allDrivers.forEach(d => {
      if (d.user.contract) contractSet.add(d.user.contract.name);
    });
    return Array.from(contractSet);
  }, [allDrivers]);

  /* ── Badge Helpers ── */
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") {
      return <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">Approved</Badge>;
    } else if (s === "not_approved") {
      return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">Not Approved</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600">{status}</Badge>;
  };

  const getContractBadge = (contract: any) => {
    if (!contract) {
      return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">No Contract</Badge>;
    }
    
    const contractName = contract.name.toLowerCase();
    if (contractName.includes("19/11/25")) {
      return <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">{contract.name}</Badge>;
    } else if (contractName.includes("probation")) {
      return <Badge className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50">{contract.name}</Badge>;
    }
    return <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">{contract.name}</Badge>;
  };

  // NEW: Shift Status Badge
  const getShiftStatusBadge = (shiftsCount: number) => {
    if (shiftsCount === 0) {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          Idle
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        Active Shift ({shiftsCount})
      </Badge>
    );
  };

  /* ── API: fetch drivers ── */
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    let all: Driver[] = [];
    let page = 1;
    let totalPages = 1;
    try {
      while (page <= totalPages) {
        const url = `${API_URL}/api/profiles/driver/?page=${page}&per_page=100`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message ?? "Failed");
        all = [...all, ...json.data.results];
        totalPages = json.data.pagination.total_pages ?? 1;
        page++;
      }
      setAllDrivers(all);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [cookies, showToast]);

  const fetchContracts = useCallback(async () => {
    if (contracts.length) return;
    setContractsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/staff/contracts/`, {
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      const json = await res.json();
      setContracts(json);
    } catch {
      showToast("Failed to load contracts", "error");
    } finally {
      setContractsLoading(false);
    }
  }, [contracts.length, cookies, showToast]);

  const fetchSites = useCallback(async () => {
    if (sites.length) return;
    setSitesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sites/list-names/`, {
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      const json = await res.json();
      if (json.success) setSites(json.data);
    } catch {
      showToast("Failed to load sites", "error");
    } finally {
      setSitesLoading(false);
    }
  }, [sites.length, cookies, showToast]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    if (isAddModalOpen) {
      fetchContracts();
      fetchSites();
    }
  }, [isAddModalOpen, fetchContracts, fetchSites]);

  const openAddModal = () => {
    setFormData({
      email: "",
      full_name: "",
      role: "driver",
      contractId: "none",
      siteId: "none",
      is_active: true,
      password: "",
      password_confirm: "",
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const validateAddForm = (fd: FormData): Partial<UserForm> => {
    const errs: Partial<UserForm> = {};
    const email = fd.get("email") as string;
    const full = fd.get("full_name") as string;
    const pwd = fd.get("password") as string;
    const pwdC = fd.get("password_confirm") as string;

    if (!email?.trim()) errs.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Invalid email";

    if (!full?.trim()) errs.full_name = "Full name required";
    else if (full.trim().length < 2) errs.full_name = "Too short";

    if (!pwd?.trim()) errs.password = "Password required";
    else if (pwd.length < 6) errs.password = "Min 6 chars";

    if (!pwdC?.trim()) errs.password_confirm = "Confirm password";
    else if (pwd !== pwdC) errs.password_confirm = "Passwords do not match";

    return errs;
  };

  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs = validateAddForm(fd);
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      showToast("Fix the errors above", "error");
      return;
    }

    const payload = {
      email: fd.get("email") as string,
      full_name: fd.get("full_name") as string,
      password: fd.get("password") as string,
      password_confirm: fd.get("password_confirm") as string,
      role: fd.get("role") as string,
    };

    setEditLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        showToast(json.message ?? "Failed to create user", "error");
        return;
      }

      const userId = json.data?.id;
      showToast("User created", "success");
      setIsAddModalOpen(false);
      await fetchDrivers();

      const contractId = fd.get("contract") as string | undefined;
      const siteId = fd.get("site") as string | undefined;
      const promises: Promise<any>[] = [];

      if (contractId && contractId !== "none") {
        promises.push(
          fetch(`${API_URL}/users/${userId}/assign-contract/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify({ contract_id: Number(contractId) }),
          })
        );
      }
      if (siteId && siteId !== "none") {
        promises.push(
          fetch(`${API_URL}/users/${userId}/allocate-sites/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify({ site_ids: [Number(siteId)] }),
          })
        );
      }
      await Promise.all(promises);

      if (payload.role.toLowerCase() === "driver") {
        setNewDriverUserId(userId);
        setIsAddDriverModalOpen(true);
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/profiles/driver/${driverToDelete.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cookies.get("access_token")}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`${driverToDelete.user.full_name} deleted`, "success");
        await fetchDrivers();
      } else {
        showToast(json.message ?? "Failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setDriverToDelete(null);
    }
  };

  const handleResendActivation = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/auth/resend-activation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      
      showToast("Activation email resent successfully", "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while resending activation email";
      showToast(errorMessage, "error");
    }
  };

  const handleApproveDriverClick = async (driverId: number | undefined) => {
    if (!driverId) return;
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/approve/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({ driver_id: driverId }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Driver approved successfully", "success");
        await fetchDrivers();
      } else {
        showToast(data.message || "Failed to approve driver", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to approve driver", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white ">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your Drivers and Profiles</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchDrivers}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <ExportButton data={filteredDrivers} fileName="Drivers" />
              <Button
                onClick={openAddModal}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 z-1 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-gray-200 flex items-center gap-2">
                  {filters.status === "all" ? "All" : filters.status === "approved" ? "Approved" : "Not Approved"}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilters({ ...filters, status: "all" })}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, status: "approved" })}>
                  Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, status: "not_approved" })}>
                  Not Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, status: "review" })}>
                  Review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-gray-200 flex items-center gap-2">
                  {filters.contract === "all" ? "All Contracts" : filters.contract === "no_contract" ? "No Contract" : filters.contract}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setFilters({ ...filters, contract: "all" })}>
                  All Contracts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({ ...filters, contract: "no_contract" })}>
                  No Contract
                </DropdownMenuItem>
                {uniqueContracts.map((contract) => (
                  <DropdownMenuItem key={contract} onClick={() => setFilters({ ...filters, contract })}>
                    {contract}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading drivers...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : currentDrivers.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              No drivers match the current filters.
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Index
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {/* NEW COLUMN */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shift Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Warnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDrivers.map((driver, index) => (
                    <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(currentPage - 1) * perPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          <Link 
                            href={`/dashboard/users/driver-profiles/${driver.id}?name=${driver.user.full_name}`}
                            className="hover:text-orange-600 transition-colors"
                          >
                            {driver.user.full_name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.license_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getContractBadge(driver.user.contract)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(driver.profile_status)}
                      </td>
                      {/* NEW SHIFT STATUS CELL */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getShiftStatusBadge(driver.user.shifts_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {driver.warnings.length > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 min-w-[2rem] justify-center cursor-help"
                                  >
                                    {driver.warnings.length}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-xs">Active Warnings:</p>
                                    <div className="space-y-1 max-h-48 overflow-auto">
                                      {driver.warnings.map((warning, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs">
                                          <span className="text-orange-500 mt-0.5">•</span>
                                          <span className="flex-1">{warning}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-600 border-gray-200 min-w-[2rem] justify-center">
                              0
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                              <Link 
                                href={`/dashboard/users/driver-profiles/${driver.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            
                            {driver.profile_status.toLowerCase() !== "approved" && (
                              <DropdownMenuItem 
                                onClick={() => handleApproveDriverClick(driver.id)}
                                className="flex items-center gap-2 text-green-600 focus:text-green-600"
                              >
                                <Check className="w-4 h-4" />
                                Approve Driver
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleResendActivation(driver.user.id)}
                              className="flex items-center gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              Resend Activation
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                setDriverToDelete(driver);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Driver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Row Page</span>
                    <Select value={perPage.toString()} disabled>
                      <SelectTrigger className="w-16 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {currentPage > 2 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="h-8 w-8 p-0"
                          >
                            1
                          </Button>
                          {currentPage > 3 && (
                            <span className="text-gray-400 px-1">...</span>
                          )}
                        </>
                      )}
                      
                      {currentPage > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="h-8 w-8 p-0"
                        >
                          {currentPage - 1}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-orange-500 text-white hover:bg-orange-600 hover:text-white"
                      >
                        {currentPage}
                      </Button>

                      {currentPage < totalPages && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="h-8 w-8 p-0"
                        >
                          {currentPage + 1}
                        </Button>
                      )}

                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <span className="text-gray-400 px-1">...</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="h-8 w-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        setIsOpen={setIsAddModalOpen}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        contracts={contracts}
        contractsLoading={contractsLoading}
        sites={sites}
        sitesLoading={sitesLoading}
        editLoading={editLoading}
        handleSubmit={handleAddUserSubmit}
      />

      {newDriverUserId && (
        <Dialog open={isAddDriverModalOpen} onOpenChange={setIsAddDriverModalOpen}>
          <DialogContent
            className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto z-50 bg-white"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="w-5 h-5" />
                Add Driver Details
              </DialogTitle>
              <DialogDescription>
                Provide additional details for the driver account.
              </DialogDescription>
            </DialogHeader>
            <AddDriver userId={newDriverUserId} open={isAddDriverModalOpen} onOpenChange={setIsAddDriverModalOpen} />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Driver
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{driverToDelete?.user.full_name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDriver} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}