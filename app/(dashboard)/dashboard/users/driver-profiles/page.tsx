"use client";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

/* ──────────────────────── Form Types ──────────────────────── */
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto z-50 bg-white">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5" />
            Add Driver
          </DialogTitle>
          <DialogDescription>
            Create a new driver account. Role is automatically set to <strong>Driver</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="role" value="driver" />

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Personal Information
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="add-email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? "border-red-500" : ""}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="add-full_name"
                  name="full_name"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={formErrors.full_name ? "border-red-500" : ""}
                  required
                />
                {formErrors.full_name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              <div className="space Alumni-2">
                <Label htmlFor="add-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="add-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={formErrors.password ? "border-red-500" : ""}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password_confirm" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="add-password_confirm"
                    name="password_confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.password_confirm}
                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                    className={formErrors.password_confirm ? "border-red-500" : ""}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password_confirm && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.password_confirm}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contract Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Contract Assignment
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="add-contract" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Assigned Contract
              </Label>
              {contractsLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading contracts...</span>
                </div>
              ) : (
                <Select
                  value={formData.contractId}
                  onValueChange={(v) => setFormData({ ...formData, contractId: v })}
                >
                  <SelectTrigger name="contract">
                    <SelectValue placeholder="Select a contract (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Contract</SelectItem>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <div className="space-y-1">
                          <div className="font-medium">{c.name}</div>
                          {c.description && (
                            <div className="text-sm text-gray-500">{c.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Site Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Site Assignment
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="add-site" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Assigned Site
              </Label>
              {sitesLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading sites...</span>
                </div>
              ) : (
                <Select
                  value={formData.siteId}
                  onValueChange={(v) => setFormData({ ...formData, siteId: v })}
                >
                  <SelectTrigger name="site">
                    <SelectValue placeholder="Select a site (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Site</SelectItem>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        <div className="font-medium">{s.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={editLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editLoading}
              className="bg-gradient-to-r from-orange to-magenta hover:from-orange-700 hover:to-magenta-700"
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Driver
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
);
AddUserModal.displayName = "AddUserModal";

/* ──────────────────────── MAIN PAGE ──────────────────────── */
export default function DriversPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverUserId, setNewDriverUserId] = useState<number | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false);

  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [driverToDisapprove, setDriverToDisapprove] = useState<Driver | null>(null);
  const [disapproveRemarks, setDisapproveRemarks] = useState("");
  const [disapproveError, setDisapproveError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    profileStatus: [] as string[],
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

  /* ── Helper: role colour ── */
  const getTypeColor = useCallback((roleName: string | undefined | null) => {
    const n = roleName?.toLowerCase();
    switch (n) {
      case "admin": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "manager": return "bg-red-100 text-red-700 hover:bg-red-100";
      case "supervisor": return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      case "superadmin": return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "driver": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  }, []);

  /* ── Filtering (Tabs + Search) ── */
  const filteredDrivers = useMemo(() => {
    return allDrivers.filter((d) => {
      let ok = true;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        ok = ok && (
          d.user.full_name.toLowerCase().includes(q) ||
          d.user.display_name.toLowerCase().includes(q) ||
          d.user.email.toLowerCase().includes(q)
        );
      }

      // Tab Filter
      if (filters.profileStatus.length > 0) {
        ok = ok && filters.profileStatus.includes(d.profile_status.toLowerCase());
      }

      return ok;
    });
  }, [allDrivers, searchQuery, filters.profileStatus]);

  const totalPages = Math.ceil(filteredDrivers.length / perPage);
  const currentDrivers = filteredDrivers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

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

  const handleDisapproveDriver = async () => {
    if (!driverToDisapprove || !disapproveRemarks.trim()) {
      setDisapproveError("Remarks required");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/profiles/driver/disapprove/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          driver_id: driverToDisapprove.id,
          remarks: disapproveRemarks,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Driver disapproved", "success");
        await fetchDrivers();
      } else {
        setDisapproveError(json.message ?? "Failed");
        showToast(json.message ?? "Failed", "error");
      }
    } catch {
      setDisapproveError("Network error");
    } finally {
      setIsDisapproveDialogOpen(false);
      setDriverToDisapprove(null);
      setDisapproveRemarks("");
      setDisapproveError(null);
    }
  };

  const handleMouseMove = (key: string) => (e: React.MouseEvent) => {
    const btn = buttonRefs.current[key];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty("--mouse-x", `${x}%`);
    btn.style.setProperty("--mouse-y", `${y}%`);
  };

  const getProfileStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-700";
      case "review": return "bg-yellow-100 text-yellow-700";
      case "not_approved": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 bg-white">
        {/* ── Header with Tabs ── */}
        <header className="bg-white p-4 border-b">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
                <p className="text-sm text-gray-500">Manage your drivers and their profiles</p>
              </div>

              <div className="flex items-center gap-2 h-[40px]">
                <ExportButton data={filteredDrivers} fileName="Drivers" />
                <button
                  onClick={fetchDrivers}
                  disabled={loading}
                  className="px-4 border border-gray-50 shadow rounded flex items-center gap-2 text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={openAddModal}
                  className="px-6 py-2 rounded-xl text-white font-medium flex items-center gap-2"
                  style={{
                    background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  ADD
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 border-b border-gray-200 overflow-x-auto">
              {[
                { key: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
                { key: "review", label: "Review", color: "bg-yellow-100 text-yellow-700" },
                { key: "not_approved", label: "Not Approved", color: "bg-red-100 text-red-700" },
              ].map((tab) => {
                const count = allDrivers.filter((d) => d.profile_status.toLowerCase() === tab.key).length;
                const isActive = filters.profileStatus.length === 0 || filters.profileStatus.includes(tab.key);

                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        profileStatus: prev.profileStatus.includes(tab.key)
                          ? prev.profileStatus.filter((s) => s !== tab.key)
                          : prev.profileStatus.length === 1 && prev.profileStatus[0] === tab.key
                          ? []
                          : [tab.key],
                      }));
                      setCurrentPage(1);
                    }}
                    className={`relative px-5 py-2.5 font-medium text-sm rounded-t-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap
                      ${isActive
                        ? "text-gray-900 bg-white border border-gray-200 border-b-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <Badge className={`text-xs px-2 py-0.5 ${tab.color}`}>{count}</Badge>
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{
                          background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, profileStatus: [] }));
                  setCurrentPage(1);
                }}
                className={`px-5 py-2.5 font-medium text-sm rounded-t-lg transition-all duration-200 whitespace-nowrap
                  ${filters.profileStatus.length === 0
                    ? "text-gray-900 bg-white border border-gray-200 border-b-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                All
                <Badge className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-700">
                  {allDrivers.length}
                </Badge>
              </button>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="mb-6 px-4">
          <div
            className="relative w-80 gradient-border cursor-glow"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - r.left) / r.width) * 100;
              const y = ((e.clientY - r.top) / r.height) * 100;
              e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
              e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
            }}
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <Input
              ref={searchInputRef}
              placeholder="Search drivers by name"
              className="pl-10 pr-10 border-0 bg-transparent focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading / Error / Empty */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {currentDrivers.map((driver) => (
                <Link
                  key={driver.id}
                  href={`/dashboard/users/driver-profiles/${driver.id}`}
                  className="block rounded-xl"
                >
                  <div
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 group"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".dropdown-menu")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center ring-4 ring-white shadow-md">
                              {driver.user.avatar ? (
                                <img src={driver.user.avatar} alt={driver.user.display_name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-7 h-7 text-orange-600" />
                              )}
                            </div>
                            {driver.user.is_active && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-gray-900 truncate">
                              {driver.user.display_name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {driver.user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${getProfileStatusColor(driver.profile_status)} text-[9px] px-2 py-0.5`}>
                                {driver.profile_status.replace("_", " ").toUpperCase()}
                              </Badge>
                              <span className="text-[10px] text-gray-500">ID: {driver.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                        <Shield className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wide">
                            License Number
                          </p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {driver.license_number || "Not Provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                        <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">
                            Contract
                          </p>
                          {driver.user.contract ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {driver.user.contract.name}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <p className="text-sm font-semibold text-red-600">No Contract</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {driver.warnings.length ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-[10px] text-red-600 font-medium uppercase tracking-wide">
                                  Active Warnings
                                </p>
                                <p className="text-sm font-semibold text-red-700">
                                  {driver.warnings.length} Warning{driver.warnings.length > 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7">
                                {driver.warnings.length}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1 max-h-48 overflow-auto">
                              <p className="font-semibold text-xs mb-2">Warning Details:</p>
                              {driver.warnings.map((w, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-xs">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">
                              Status
                            </p>
                            <p className="text-sm font-semibold text-green-700">No Active Warnings</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page</span>
            <Badge variant="outline" className="bg-gray-100">{currentPage}</Badge>
            <span className="text-sm text-gray-600">of {totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              ref={(el) => { buttonRefs.current["prev"] = el; }}
              variant="ghost"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
              onMouseMove={handleMouseMove("prev")}
              onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1 relative z-10" />
              <span className="relative z-10">Previous</span>
            </Button>
            <Button
              ref={(el) => { buttonRefs.current["next"] = el; }}
              variant="ghost"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
              onMouseMove={handleMouseMove("next")}
              onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages || loading}
            >
              <span className="relative z-10">Next</span>
              <ChevronRight className="w-4 h-4 ml-1 relative z-10" />
            </Button>
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
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto z-50 bg-white">
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

        <AlertDialog open={isDisapproveDialogOpen} onOpenChange={setIsDisapproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Not Approve Driver
              </AlertDialogTitle>
              <AlertDialogDescription>
                Provide a reason for disapproving <span className="font-semibold">{driverToDisapprove?.user.full_name}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="disapprove-remarks">Remarks</Label>
                <Input
                  id="disapprove-remarks"
                  value={disapproveRemarks}
                  onChange={(e) => setDisapproveRemarks(e.target.value)}
                  placeholder="Enter reason"
                />
                {disapproveError && <p className="text-red-600 text-sm mt-1">{disapproveError}</p>}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisapproveDriver} className="bg-red-600 hover:bg-red-700">
                Disapprove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}