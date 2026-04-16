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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Search,
  Edit,

  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Save,
  X,
  Mail,

  RefreshCw,
  User,

  Plus,
  Eye,
  EyeOff,
  UserPlus,
  Lock,
  MoreVertical,
  Filter,
  ChevronDown,
  Settings,
  CheckCircle,
  AlertTriangle,
  Menu,
  Trash2,
  EllipsisVertical,
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

/* ──────────────────────── Disapprove Dialog Component ──────────────────────── */
interface DisapproveDriverDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
  onDisapprove: () => Promise<void>;
  isDisapproving: boolean;
}

const DisapproveDriverDialog = React.memo(({
  isOpen,
  onOpenChange,
  driverName,
  remarks,
  onRemarksChange,
  onDisapprove,
  isDisapproving
}: DisapproveDriverDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          Disapprove Driver
        </DialogTitle>
        <DialogDescription>
          You are about to disapprove <span className="font-semibold">{driverName}</span>. Please provide remarks for disapproval.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="disapprove-remarks">Remarks <span className="text-red-500">*</span></Label>
          <textarea
            id="disapprove-remarks"
            className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter reason for disapproval..."
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">
            Minimum 10 characters required.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isDisapproving}
        >
          Cancel
        </Button>
        <Button
          onClick={onDisapprove}
          disabled={isDisapproving || remarks.trim().length < 10}
          className="bg-rose-600 hover:bg-rose-700"
        >
          {isDisapproving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Disapproving...
            </>
          ) : (
            "Disapprove Driver"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
));
DisapproveDriverDialog.displayName = "DisapproveDriverDialog";

/* ──────────────────────── Action Menu Component ──────────────────────── */
interface DriverActionMenuProps {
  driver: Driver;
  onViewProfile: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onDisapprove: () => void;
  onResendActivation: () => void;
  onDelete: () => void;
}

const DriverActionMenu = React.memo(({
  driver,
  onViewProfile,
  onEdit,
  onApprove,
  onDisapprove,
  onResendActivation,
  onDelete,
}: DriverActionMenuProps) => {
  const isApproved = driver.profile_status?.toLowerCase() === "approved";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"           // ← better than manual size
          className="h-8 w-8 hover:bg-gray-100 data-[state=open]:bg-gray-200"
        >
          <EllipsisVertical className="h-4 w-4 text-gray-600" />
          <span className="sr-only">Open actions menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 z-50"   // ← important: good z-index
        sideOffset={5}
      >
        <DropdownMenuLabel className="font-medium text-gray-900">
          {driver.user.full_name}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onViewProfile} className="gap-2">
          <Eye className="h-4 w-4" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onEdit} className="gap-2">
          <Edit className="h-4 w-4 text-blue-600" />
          Edit Details
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {!isApproved ? (
          <DropdownMenuItem
            onClick={onApprove}
            className="text-green-600 focus:text-green-600 focus:bg-green-50 gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve Driver
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={onDisapprove}
            className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Disapprove Driver
          </DropdownMenuItem>
        )}

        {!isApproved && (
          <DropdownMenuItem
            onClick={onResendActivation}
            className="text-blue-600 focus:text-blue-600 focus:bg-blue-50 gap-2"
          >
            <Mail className="h-4 w-4" />
            Resend Activation
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Driver
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
});
DriverActionMenu.displayName = "DriverActionMenu";

/* ──────────────────────── MAIN PAGE ──────────────────────── */
export default function DriversPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverUserId, setNewDriverUserId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisapproveDialogOpen, setIsDisapproveDialogOpen] = useState(false);
  const [disapproveRemarks, setDisapproveRemarks] = useState("");
  const [isDisapproving, setIsDisapproving] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (response.ok && data.success) {
        showToast("Activation email resent successfully", "success");
      } else {
        showToast(data.message || "Failed to resend activation email", "error");
      }
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

  const handleDisapproveDriver = async (driver: Driver) => {
    if (!disapproveRemarks.trim()) {
      showToast("Please provide remarks for disapproval", "error");
      return;
    }

    setIsDisapproving(true);
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/disapprove/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          driver_id: driver.id,
          remarks: disapproveRemarks,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Driver disapproved successfully", "success");
        // Reset dialog state
        setDisapproveRemarks("");
        setIsDisapproveDialogOpen(false);
        setSelectedDriver(null);
        // Refresh driver data
        await fetchDrivers();
      } else {
        showToast(data.message || "Failed to disapprove driver", "error");
      }
    } catch (error) {
      console.error("Error disapproving driver:", error);
      showToast(error instanceof Error ? error.message : "Failed to disapprove driver", "error");
    } finally {
      setIsDisapproving(false);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    // Implement edit functionality here
    showToast("Edit functionality coming soon", "info");
    // You can navigate to an edit page or open an edit modal
    // Example: router.push(`/dashboard/drivers/edit/${driver.id}`);
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
      {/* Table Section */}
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 w-16">Index</th>
                    <th className="px-4 py-3 min-w-[180px]">Driver Name</th>
                    <th className="px-4 py-3 min-w-[160px]">License No</th>
                    <th className="px-4 py-3 min-w-[160px]">Contract Type</th>
                    <th className="px-4 py-3 min-w-[140px]">Phone No</th>
                    <th className="px-4 py-3 min-w-[110px]">Status</th>
                    <th className="px-4 py-3 min-w-[140px]">Shift Status</th>
                    <th className="px-4 py-3 min-w-[100px] text-center">Warnings</th>
                    <th className="px-4 py-3 w-20 text-right sticky right-0 bg-gray-50 z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentDrivers.map((driver, idx) => (
                    <tr key={driver.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-4 font-medium">
                        {(currentPage - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/users/driver-profiles/${driver.id}?name=${encodeURIComponent(driver.user.full_name)}&user_id=${driver.user.id}`}
                          className="text-orange-600 hover:underline font-medium"
                        >
                          {driver.user.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {driver.license_number || "—"}
                      </td>
                      <td className="px-4 py-4">
                        {/* Your contract badge component */}
                        <Badge variant="outline" className=" border-0 p-2 bg-green-100">{driver.user.contract?.name || "No Contract"}</Badge>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {driver.phone || "—"}
                      </td>
                      <td className="px-4 py-4">
                        {/* Your status badge */}
                        <Badge
                          variant={
                            driver.profile_status?.toLowerCase() === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {driver.profile_status === 'approved' ? "Approved" : "Not Approved"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {/* Shift status badge */}
                        {driver.user.shifts_count > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-800">
                            Active ({driver.user.shifts_count})
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Idle</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {driver.warnings?.length > 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                  {driver.warnings.length}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Active Warnings: {driver.warnings.join(", ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 sticky right-0 bg-white z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-end">
                          <DriverActionMenu
                            driver={driver}
                            onViewProfile={() => window.open(`/dashboard/users/driver-profiles/${driver.id}?name=${encodeURIComponent(driver.user.full_name)}&user_id=${driver.user.id}`, "_blank")}
                            onEdit={() => handleEditDriver(driver)}
                            onApprove={() => handleApproveDriverClick(driver.id)}
                            onDisapprove={() => {
                              setSelectedDriver(driver);
                              setIsDisapproveDialogOpen(true);
                            }}
                            onResendActivation={() => handleResendActivation(driver.user.id)}
                            onDelete={() => {
                              setDriverToDelete(driver);
                              setIsDeleteDialogOpen(true);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * perPage + 1}–
                {Math.min(currentPage * perPage, filteredDrivers.length)} of {filteredDrivers.length}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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

      {/* Disapprove Dialog */}
      {selectedDriver && (
        <DisapproveDriverDialog
          isOpen={isDisapproveDialogOpen}
          onOpenChange={setIsDisapproveDialogOpen}
          driverName={selectedDriver.user.full_name}
          remarks={disapproveRemarks}
          onRemarksChange={setDisapproveRemarks}
          onDisapprove={() => handleDisapproveDriver(selectedDriver)}
          isDisapproving={isDisapproving}
        />
      )}




      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the driver
              {driverToDelete ? ` ${driverToDelete.user.full_name}` : ''} and remove their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async (e) => {
                e.preventDefault();
                if (!driverToDelete) return;
                setIsDeleting(true);
                try {
                  const response = await fetch(`${API_URL}/api/profiles/driver/${driverToDelete.id}/`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${cookies.get("access_token")}`,
                    },
                  });
                  if (!response.ok) throw new Error("Failed to delete driver");
                  showToast("Driver deleted successfully", "success");
                  setIsDeleteDialogOpen(false);
                  setDriverToDelete(null);
                  fetchDrivers();
                } catch (error) {
                  showToast("Failed to delete driver", "error");
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}