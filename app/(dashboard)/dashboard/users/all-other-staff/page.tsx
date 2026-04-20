"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Filter,
  Download,
  Loader2,
  Save,
  X,
  Mail,
  ToggleLeft,
  AlertCircle,
  User,
  Lock,
  Shield,
  FileText,
  EyeOff,
  Eye,
  RefreshCw,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";
import AddDriver from "@/components/add-driver/page";
import { debounce } from "lodash";
import Link from "next/link";
import ExportButton from "@/app/utils/ExportButton";
import { MultiSelect } from "@/components/ui/multi-select";

// Interfaces
interface Site {
  id: number;
  name: string;
  status?: string;
  image?: string | null;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  display_name: string;
  parent_rota_completed: boolean;
  child_rota_completed: boolean;
  is_active: boolean;
  contract: { id: number; name: string; description: string } | null;
  site: Site[] | null;
  role: string | string[] | null;
  shifts_count: number;
  avatar?: string | null;
}

interface Contract {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  slug: string;
  name: string;
  menu: {
    items: Array<{
      nav: string;
      icon: string;
      name: string;
      tooltip: string;
      children: Array<any>;
      isSelected: boolean;
    }>;
  };
}

interface UserForm {
  email: string;
  full_name: string;
  password?: string;
  password_confirm?: string;
  role: string[];
  contractId?: string;
  siteId?: string;
  siteIds?: string[];
  is_active: boolean;
}

type UserFormErrors = {
  [K in keyof UserForm]?: string;
};

interface Filters {
  role: string;
  contract: string;
  site: string;
  status: string;
}

// UserRow Component
const UserRow = React.memo(
  ({
    user,
    roles,
    getTypeColor,
    getStatusColor,
    handleEditUserClick,
    handleDeleteUserClick,
    buttonRefs,
    handleMouseMove,
  }: {
    user: User;
    roles: Role[];
    getTypeColor: (roleName: string | undefined | null) => string;
    getStatusColor: (isActive: boolean) => string;
    handleEditUserClick: (user: User) => void;
    handleDeleteUserClick: (user: User) => void;
    buttonRefs: React.MutableRefObject<{ [key: string]: HTMLButtonElement | null }>;
    handleMouseMove: (key: string) => (e: React.MouseEvent) => void;
  }) => (
    <TableRow key={user.id} className="border-b border-gray-100">
      <TableCell className="font-medium">{user.id}</TableCell>
      <TableCell className="font-medium">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.display_name}
            className="w-8 h-8 rounded-full inline-block mr-2"
          />
        ) : (
          <User className="w-8 h-8 inline-block mr-2" />
        )}
        <Link href={`/dashboard/users/all-other-staff/${user.id}`} className="hover:underline">
          {user.display_name || user.full_name || user.email}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.role ? (
            Array.isArray(user.role) ? (
              user.role.map((roleSlug) => (
                <Badge key={roleSlug} className={getTypeColor(roleSlug)}>
                  {roles.find((r) => r.slug === roleSlug)?.name || roleSlug}
                </Badge>
              ))
            ) : (
              <Badge className={getTypeColor(user.role)}>
                {roles.find((role) => role.slug === user.role)?.name || user.role}
              </Badge>
            )
          ) : (
            <Badge className="bg-gray-100 text-gray-700">Unassigned</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {user.contract ? (
          <Badge className="bg-green-100 text-green-500">{user.contract.name}</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-600">No Contract</Badge>
        )}
      </TableCell>
      <TableCell>
        {user.site && user.site.length > 0 ? (
          user.site.map((s) => (
            <Badge key={s.id} className="bg-blue-100 text-blue-500 mr-1">
              {s.name}
            </Badge>
          ))
        ) : (
          <Badge className="bg-red-100 text-red-600">No Site</Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge className="bg-orange-100 text-orange-600 border border-orange-600">
          {user.shifts_count || 0} shifts
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(user.is_active)}>
          {user.is_active ? "Active" : "In-Active"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={(el) => {
                buttonRefs.current[`action-${user.id}`] = el;
              }}
              variant="ghost"
              size="sm"
              className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
              onMouseMove={handleMouseMove(`action-${user.id}`)}
            >
              <MoreHorizontal className="w-4 h-4 relative z-10" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem onClick={() => handleEditUserClick(user)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteUserClick(user)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  ),
);
UserRow.displayName = "UserRow";

// AddUserModal Component
const AddUserModal = React.memo(
  ({
    isModalOpen,
    setIsModalOpen,
    selectedUserType,
    formData,
    setFormData,
    formErrors,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    roles,
    rolesLoading,
    contracts,
    contractsLoading,
    sites,
    sitesLoading,
    editLoading,
    getTypeColor,
    handleAddUserSubmit,
  }: {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    selectedUserType: string | null;
    formData: UserForm;
    setFormData: (data: UserForm) => void;
    formErrors: UserFormErrors;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    showConfirmPassword: boolean;
    setShowConfirmPassword: (show: boolean) => void;
    roles: Role[];
    rolesLoading: boolean;
    contracts: Contract[];
    contractsLoading: boolean;
    sites: Site[];
    sitesLoading: boolean;
    editLoading: boolean;
    getTypeColor: (roleName: string | undefined | null) => string;
    handleAddUserSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto z-50 bg-white">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5" />
            Add User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with the specified role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddUserSubmit} className="space-y-6">
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

              <div className="space-y-2">
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    onChange={(e) =>
                      setFormData({ ...formData, password_confirm: e.target.value })
                    }
                    className={formErrors.password_confirm ? "border-red-500" : ""}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Role & Permissions
            </div>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="add-role" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                User Role *
              </Label>
              <MultiSelect
                options={roles.map((role) => ({ 
                  label: role.name, 
                  value: role.slug
                }))}
                selected={formData.role}
                onChange={(selected: string[]) => setFormData({ ...formData, role: selected })}
                placeholder="Select user roles"
                error={!!formErrors.role}
              />
              {formErrors.role && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.role}
                </p>
              )}
            </div>
          </div>

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
                  name="contract"
                  value={formData.contractId}
                  onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contract (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Contract</SelectItem>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        <div className="space-y-1">
                          <div className="font-medium">{contract.name}</div>
                          {contract.description && (
                            <div className="text-sm text-gray-500">{contract.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-gray-500">
                Assign a contract to define user responsibilities and access levels
              </p>
            </div>
          </div>

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
                <MultiSelect
                  options={sites.map((site) => ({ label: site.name, value: site.id.toString() }))}
                  selected={formData.siteIds || []}
                  onChange={(selected: string[]) => setFormData({ ...formData, siteIds: selected })}
                  placeholder="Select sites (optional)"
                />
              )}
              <p className="text-sm text-gray-500">
                Assign a site to define user location or operational area
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={editLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editLoading || rolesLoading}
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
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
);
AddUserModal.displayName = "AddUserModal";

// EditUserModal Component
const EditUserModal = React.memo(
  ({
    isEditModalOpen,
    setIsEditModalOpen,
    formData,
    setFormData,
    formErrors,
    roles,
    rolesLoading,
    contracts,
    contractsLoading,
    sites,
    sitesLoading,
    editLoading,
    getTypeColor,
    handleEditUserSubmit,
  }: {
    isEditModalOpen: boolean;
    setIsEditModalOpen: (open: boolean) => void;
    formData: UserForm;
    setFormData: (data: UserForm) => void;
    formErrors: UserFormErrors;
    roles: Role[];
    rolesLoading: boolean;
    contracts: Contract[];
    contractsLoading: boolean;
    sites: Site[];
    sitesLoading: boolean;
    editLoading: boolean;
    getTypeColor: (roleName: string | undefined | null) => string;
    handleEditUserSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit className="w-5 h-5" />
            Edit User Details
          </DialogTitle>
          <DialogDescription>
            Update user information and permissions. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEditUserSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Personal Information
            </div>
            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-full_name">Full Name</Label>
                <Input
                  id="edit-full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  className={formErrors.full_name ? "border-red-500" : ""}
                />
                {formErrors.full_name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.full_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Role & Permissions
            </div>
            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <MultiSelect
                  options={roles.map((role) => ({ 
                    label: role.name, 
                    value: role.slug
                  }))}
                  selected={formData.role || []}
                  onChange={(selected: string[]) => setFormData({ ...formData, role: selected })}
                  placeholder="Select user roles"
                  error={!!formErrors.role}
                />
                {formErrors.role && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.role}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <ToggleLeft className="w-4 h-4" />
                    Account Status
                  </Label>
                  <p className="text-sm text-gray-500">
                    {formData.is_active ? "User can access the system" : "User access is disabled"}
                  </p>
                </div>
                <Switch
                  name="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Contract Assignment
            </div>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-contract">Assigned Contract</Label>
              {contractsLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading contracts...</span>
                </div>
              ) : (
                <Select
                  name="contract"
                  value={formData.contractId}
                  onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contract (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Contract</SelectItem>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        <div className="space-y-1">
                          <div className="font-medium">{contract.name}</div>
                          {contract.description && (
                            <div className="text-sm text-gray-500">{contract.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-gray-500">
                Assign a contract to define user responsibilities and access levels
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Site Assignment
            </div>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-site">Assigned Site</Label>
              {sitesLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading sites...</span>
                </div>
              ) : (
                <MultiSelect
                  options={sites.map((site) => ({ label: site.name, value: site.id.toString() }))}
                  selected={formData.siteIds || []}
                  onChange={(selected: string[]) => setFormData({ ...formData, siteIds: selected })}
                  placeholder="Select sites (optional)"
                />
              )}
              <p className="text-sm text-gray-500">
                Assign a site to define user location or operational area
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={editLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editLoading || rolesLoading}
              className="bg-gradient-to-r from-orange-500 to-magenta hover:from-orange-700 hover:to-purple-700"
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
);
EditUserModal.displayName = "EditUserModal";

// FilterModal Component
const FilterModal = React.memo(
  ({
    isFilterModalOpen,
    setIsFilterModalOpen,
    filters,
    setFilters,
    roles,
    contracts,
    sites,
    applyFilters,
  }: {
    isFilterModalOpen: boolean;
    setIsFilterModalOpen: (open: boolean) => void;
    filters: Filters;
    setFilters: (filters: Filters) => void;
    roles: Role[];
    contracts: Contract[];
    sites: Site[];
    applyFilters: () => void;
  }) => (
    <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto z-50 bg-white">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Filter className="w-5 h-5" />
            Filter Users
          </DialogTitle>
          <DialogDescription>
            Apply filters to narrow down the user list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="filter-role" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role
            </Label>
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters({ ...filters, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.slug}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label htmlFor="filter-contract" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contract
            </Label>
            <Select
              value={filters.contract}
              onValueChange={(value) => setFilters({ ...filters, contract: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Contracts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="none">No Contract</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id.toString()}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label htmlFor="filter-site" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Site
            </Label>
            <Select
              value={filters.site}
              onValueChange={(value) => setFilters({ ...filters, site: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                <SelectItem value="none">No Site</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id.toString()}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label htmlFor="filter-status" className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4" />
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">In-Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFilters({ role: "all", contract: "all", site: "all", status: "all" });
              applyFilters();
            }}
          >
            Clear Filters
          </Button>
          <Button
            type="button"
            onClick={() => {
              applyFilters();
              setIsFilterModalOpen(false);
            }}
            className="bg-gradient-to-r from-orange to-magenta hover:from-orange-700 hover:to-magenta-700"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
);
FilterModal.displayName = "FilterModal";

// UsersPage Component
export default function UsersPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [newDriverUserId, setNewDriverUserId] = useState<number | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [rawUsers, setRawUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    role: "all",
    contract: "all",
    site: "all",
    status: "all",
  });
  const [activeTab, setActiveTab] = useState("assigned");
  const [formData, setFormData] = useState<UserForm>({
    email: "",
    full_name: "",
    role: [],
    contractId: "none",
    siteId: "none",
    siteIds: [],
    is_active: true,
    password: "",
    password_confirm: "",
  });
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const perPage = 10;
  const { showToast } = useToast();
  const cookies = useCookies();

  // Frontend filtering function
  const filterUsers = useCallback(
    (users: User[], filters: Filters, query: string): User[] => {
      let filteredUsers = [...users];

      // Apply search query filter
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.full_name.toLowerCase().includes(lowerQuery) ||
            user.email.toLowerCase().includes(lowerQuery) ||
            user.display_name.toLowerCase().includes(lowerQuery),
        );
      }

      // Apply role filter
      if (filters.role !== "all") {
        filteredUsers = filteredUsers.filter((user) => 
          Array.isArray(user.role) 
            ? user.role.includes(filters.role) 
            : user.role === filters.role
        );
      }

      // Apply contract filter
      if (filters.contract !== "all") {
        if (filters.contract === "none") {
          filteredUsers = filteredUsers.filter((user) => !user.contract);
        } else {
          filteredUsers = filteredUsers.filter(
            (user) => user.contract?.id.toString() === filters.contract,
          );
        }
      }

      // Apply site filter
      if (filters.site !== "all") {
        if (filters.site === "none") {
          filteredUsers = filteredUsers.filter((user) => !user.site || user.site.length === 0);
        } else {
          filteredUsers = filteredUsers.filter((user) =>
            user.site?.some((site) => site.id.toString() === filters.site),
          );
        }
      }

      // Apply status filter
      if (filters.status !== "all") {
        filteredUsers = filteredUsers.filter(
          (user) => user.is_active === (filters.status === "active"),
        );
      }

      return filteredUsers;
    },
    [],
  );

  // Debounced fetch users
  const debouncedFetchUsers = useMemo(
    () =>
      debounce(async (query: string, page: number, tab: string) => {
        setLoading(true);
        try {
          let url = "";
          if (tab === "unassigned") {
            url = `${API_URL}/users/no-site/?page=${page}&per_page=${perPage}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          } else {
            url = `${API_URL}/users/?drivers=false&page=${page}&per_page=${perPage}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          }

          const response = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
          });
          if (response.status === 401) {
            showToast("Session expired. Please log in again.", "error");
            return;
          }
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          if (data.success) {
            setRawUsers(data?.data?.results);
            const filteredUsers = filterUsers(data?.data?.results, filters, query);
            setUsers(filteredUsers);
            setTotalPages(data.total_pages || Math.ceil(data.data.length / perPage));
            setError(null);
          } else {
            setError(data.message || "Failed to fetch users");
            showToast(data.message || "Failed to fetch users", "error");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred while fetching users";
          setError(errorMessage);
          showToast(errorMessage, "error");
        } finally {
          setLoading(false);
        }
      }, 300),
    [cookies, showToast, perPage, filters, filterUsers],
  );

  const applyFilters = useCallback(() => {
    setCurrentPage(1); // Reset to first page when applying filters
    const filteredUsers = filterUsers(rawUsers, filters, searchQuery);
    setUsers(filteredUsers);
    setTotalPages(Math.ceil(filteredUsers.length / perPage) || 1);
  }, [rawUsers, filters, searchQuery, perPage, filterUsers]);

  const fetchUsers = useCallback(() => {
    debouncedFetchUsers(searchQuery, currentPage, activeTab);
  }, [debouncedFetchUsers, searchQuery, currentPage, activeTab]);

  const fetchRoles = useCallback(async () => {
    if (roles.length > 0) return; // Cache roles
    setRolesLoading(true);
    try {
      const response = await fetch(`${API_URL}/roles/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      } else {
        showToast(data.message || "Failed to fetch roles", "error");
        setRoles([]);
      }
    } catch (error) {
      showToast("Failed to fetch roles", "error");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [cookies, showToast, roles.length]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles, activeTab]);

  useEffect(() => {
    if (isEditModalOpen || isModalOpen || isFilterModalOpen) {
      const fetchContracts = async () => {
        if (contracts.length > 0) return; // Cache contracts
        setContractsLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/staff/contracts/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
          });
          if (response.status === 401) {
            showToast("Session expired. Please log in again.", "error");
            return;
          }
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          setContracts(data);
        } catch {
          showToast("Failed to fetch contracts", "error");
        } finally {
          setContractsLoading(false);
        }
      };

      const fetchSites = async () => {
        if (sites.length > 0) return; // Cache sites
        setSitesLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/sites/list-names/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
          });
          if (response.status === 401) {
            showToast("Session expired. Please log in again.", "error");
            return;
          }
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          if (data.success) {
            setSites(data.data);
          } else {
            showToast(data.message || "Failed to fetch sites", "error");
          }
        } catch {
          showToast("Failed to fetch sites", "error");
        } finally {
          setSitesLoading(false);
        }
      };

      fetchContracts();
      fetchSites();
    }
  }, [isEditModalOpen, isModalOpen, isFilterModalOpen, cookies, showToast, contracts.length, sites.length]);

  const handleMouseMove = useCallback(
    (key: string) => (e: React.MouseEvent) => {
      const button = buttonRefs.current[key];
      if (button) {
        const rect = button.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        button.style.setProperty("--mouse-x", `${x}%`);
        button.style.setProperty("--mouse-y", `${y}%`);
      }
    },
    [],
  );

  const getTypeColor = useCallback((roleName: string | undefined | null) => {
    const normalizedRole = roleName?.toLowerCase();
    switch (normalizedRole) {
      case "admin":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "manager":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "supervisor":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      case "superadmin":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "shahwar":
        return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100";
      case "accounts":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "crh":
        return "bg-teal-100 text-teal-700 hover:bg-teal-100";
      case "dvsa":
        return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100";
      case "mechanic":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
      case "driver":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  }, []);

  const getStatusColor = useCallback((isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-700 hover:bg-green-100"
      : "bg-red-100 text-red-700 hover:bg-red-100";
  }, []);

  const handleAddUserClick = useCallback(
    (type: string) => {
      setSelectedUserType(type);
      const defaultRole = roles.find((role) => role.name.toLowerCase() === type.toLowerCase())?.slug;
      setFormData({
        email: "",
        full_name: "",
        role: defaultRole ? [defaultRole] : [],
        contractId: "none",
        siteId: "none",
        siteIds: [],
        is_active: true,
        password: "",
        password_confirm: "",
      });
      setFormErrors({});
      setIsModalOpen(true);
    },
    [roles],
  );

  const handleEditUserClick = useCallback((user: User) => {
    setSelectedUser(user);
    
    let rolesArray: string[] = [];
    if (Array.isArray(user.role)) {
      rolesArray = user.role;
    } else if (user.role) {
      // Find matching role slug, handling case-insensitivity
      const resolvedRole = roles.find(
          (r) =>
            r.slug.toLowerCase() === user.role?.toString().toLowerCase() ||
            r.name.toLowerCase() === user.role?.toString().toLowerCase()
        )?.slug || user.role.toString().toLowerCase();
        rolesArray = [resolvedRole];
    }

    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: rolesArray,
      contractId: user.contract?.id?.toString() || "none",
      siteId: user.site && user.site.length > 0 ? user.site[0].id.toString() : "none",
      siteIds: user.site ? user.site.map((s) => s.id.toString()) : [],
      is_active: user.is_active,
      password: "",
      password_confirm: "",
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  }, [roles]);

  const handleDeleteUserClick = useCallback((user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/users/${userToDelete.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      showToast("User deleted successfully", "success");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      showToast("Failed to delete user", "error");
    } finally {
      setIsDeleting(false);
    }
  };



  const validateAddUserForm = useCallback((data: UserForm): UserFormErrors => {
    const errors: UserFormErrors = {};

    if (!data.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!data.full_name?.trim()) {
      errors.full_name = "Full name is required";
    } else if (data.full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters";
    }

    if (!data.password?.trim()) {
      errors.password = "Password is required";
    } else if (data.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!data.password_confirm?.trim()) {
      errors.password_confirm = "Password confirmation is required";
    } else if (data.password !== data.password_confirm) {
      errors.password_confirm = "Passwords do not match";
    }

    if (!data.role || data.role.length === 0) {
      errors.role = "Role is required";
    }

    return errors;
  }, []);

  const validateEditUserForm = useCallback((data: UserForm): UserFormErrors => {
    const errors: UserFormErrors = {};

    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!data.full_name.trim()) {
      errors.full_name = "Full name is required";
    } else if (data.full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters";
    }

    if (!data.role || data.role.length === 0) {
      errors.role = "Role is required";
    }

    return errors;
  }, []);

  const handleAddUserSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const errors = validateAddUserForm(formData);

      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        showToast("Please fix the form errors", "error");
        return;
      }

      const newUser = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: formData.role,
        contractId: formData.contractId,
        siteIds: formData.siteIds || [],
      };

      setEditLoading(true);

      try {
        const payload = {
          email: newUser.email,
          full_name: newUser.full_name,
          password: newUser.password,
          password_confirm: newUser.password_confirm,
          role: newUser.role,
        };

        const response = await fetch(`${API_URL}/users/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (response.status !== 200) {
          alert(data.message);
          return;
        }

        if (data.success) {
          showToast(data.message || "User created successfully", "success");
          setIsModalOpen(false);
          await fetchUsers();

          const userId = data.data?.id;
          if (userId) {
            const promises = [];
            if (newUser.contractId && newUser.contractId !== "none") {
              promises.push(
                fetch(`${API_URL}/users/${userId}/assign-contract/`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.get("access_token")}`,
                  },
                  body: JSON.stringify({ contract_id: Number.parseInt(newUser.contractId) }),
                }),
              );
            }

            if (newUser.siteIds && newUser.siteIds.length > 0) {
              promises.push(
                fetch(`${API_URL}/users/${userId}/allocate-sites/`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.get("access_token")}`,
                  },
                  body: JSON.stringify({ site_ids: newUser.siteIds.map((id) => Number.parseInt(id)) }),
                }),
              );
            }

            await Promise.all(promises);

            if (newUser.role.some(r => r.toLowerCase() === "driver")) {
              setNewDriverUserId(userId);
              setIsAddDriverModalOpen(true);
            }
          }
        } else {
          showToast(data.message || "Failed to create user", "error");
        }
      } catch (err) {
        showToast("An error occurred while creating the user", "error");
      } finally {
        setEditLoading(false);
      }
    },
    [cookies, fetchUsers, showToast, validateAddUserForm, formData],
  );

  const handleEditUserSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const editFormData: UserForm = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        contractId: formData.contractId || "none",
        siteId: formData.siteId || "none",
        siteIds: formData.siteIds || [],
        is_active: formData.is_active,
      };

      const errors = validateEditUserForm(editFormData);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        showToast("Please fix the form errors", "error");
        return;
      }

      if (!selectedUser) return;

      setEditLoading(true);

      try {
        const promises = [
          fetch(`${API_URL}/users/${selectedUser.id}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify({
              email: editFormData.email,
              full_name: editFormData.full_name,
              role: editFormData.role,
              is_active: editFormData.is_active,
            }),
          }),
        ];

        if (editFormData.contractId && editFormData.contractId !== "none") {
          promises.push(
            fetch(`${API_URL}/users/${selectedUser.id}/assign-contract/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.get("access_token")}`,
              },
              body: JSON.stringify({ contract_id: Number.parseInt(editFormData.contractId) }),
            }),
          );
        }

        if (editFormData.siteIds && editFormData.siteIds.length > 0) {
          promises.push(
            fetch(`${API_URL}/users/${selectedUser.id}/allocate-sites/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.get("access_token")}`,
              },
              body: JSON.stringify({
                site_ids: editFormData.siteIds.map((id) => Number.parseInt(id)),
              }),
            }),
          );
        }

        const responses = await Promise.all(promises);

        for (const response of responses) {
          if (response.status === 401) {
            showToast("Session expired. Please log in again.", "error");
            return;
          }
          if (!response.ok) {
            const data = await response.json();
            showToast(data.message || "Failed to update user details", "error");
            return;
          }
        }

        showToast("User updated successfully", "success");
        setIsEditModalOpen(false);
        setSelectedUser(null);
        await fetchUsers();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "An error occurred while updating the user",
          "error",
        );
      } finally {
        setEditLoading(false);
      }
    },
    [cookies, fetchUsers, selectedUser, showToast, validateEditUserForm, formData],
  );


  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  return (
    <div className="p-6 bg-white">
      <header className="bg-white ">
        <div className="container mx-auto flex flex-col gap-6">
          {/* Page Title + Action Buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500">Manage your team members and their permissions</p>
            </div>

            <div className="flex items-center gap-3">
              <ExportButton data={users} fileName="Other Staff" />

              <Button
                onClick={fetchUsers}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`w-4 h-4  ${loading ? "animate-spin" : ""
                    }`}
                />

              </Button>

              <Button
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-white font-medium shadow-md"
                style={{
                  background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
                }}
                onClick={() => handleAddUserClick("driver")}
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>

          {/* ==== FILTERS — ALWAYS VISIBLE ON SCREEN ==== */}
          <div className=" p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ role: "all", contract: "all", site: "all", status: "all" });
                  applyFilters();
                }}
              >
                Clear All Filters
              </Button>
            </div>

            {/* Filter Dropdowns – Always Open */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Role */}
              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <Shield className="w-4 h-4" />
                  Role
                </Label>
                <Select value={filters.role} onValueChange={(v) => { setFilters(prev => ({ ...prev, role: v })); applyFilters(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.slug}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contract */}
              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <FileText className="w-4 h-4" />
                  Contract
                </Label>
                <Select value={filters.contract} onValueChange={(v) => { setFilters(prev => ({ ...prev, contract: v })); applyFilters(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Contracts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contracts</SelectItem>
                    <SelectItem value="none">No Contract</SelectItem>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site */}
              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <FileText className="w-4 h-4" />
                  Site
                </Label>
                <Select value={filters.site} onValueChange={(v) => { setFilters(prev => ({ ...prev, site: v })); applyFilters(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    <SelectItem value="none">No Site</SelectItem>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label className="flex items-center gap-2 mb-2 text-gray-700">
                  <ToggleLeft className="w-4 h-4" />
                  Status
                </Label>
                <Select value={filters.status} onValueChange={(v) => { setFilters(prev => ({ ...prev, status: v })); applyFilters(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">In-Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Tabs 
        defaultValue="assigned" 
        value={activeTab} 
        onValueChange={(val) => { 
          setActiveTab(val); 
          setCurrentPage(1); 
        }} 
        className="w-full"
      >
        <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden mb-6">
          <TabsTrigger 
            value="assigned" 
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 font-medium"
          >
            Assigned Sites
          </TabsTrigger>
          <TabsTrigger 
            value="unassigned" 
            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 font-medium"
          >
            Unassigned Sites
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-between mb-6">
          <div
            className="relative w-80 gradient-border cursor-glow"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
            e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
          }}
        >
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
          <Input
            placeholder="Search users"
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const filteredUsers = filterUsers(rawUsers, filters, e.target.value);
              setUsers(filteredUsers);
              setTotalPages(Math.ceil(filteredUsers.length / perPage) || 1);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading users...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 gradient-border cursor-glow">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-gray-600 font-medium">Sr No.</TableHead>
                <TableHead className="text-gray-600 font-medium">Name</TableHead>
                <TableHead className="text-gray-600 font-medium">Role</TableHead>
                <TableHead className="text-gray-600 font-medium">Contract</TableHead>
                <TableHead className="text-gray-600 w-[200px] font-medium">Site</TableHead>
                <TableHead className="text-gray-600 font-medium">Shifts</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                <TableHead className="text-gray-600 font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users
                ?.slice((currentPage - 1) * perPage, currentPage * perPage)
                .map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    roles={roles}
                    getTypeColor={getTypeColor}
                    getStatusColor={getStatusColor}
                    handleEditUserClick={handleEditUserClick}
                    handleDeleteUserClick={handleDeleteUserClick}
                    buttonRefs={buttonRefs}
                    handleMouseMove={handleMouseMove}
                  />
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Page</span>
          <Badge variant="outline" className="bg-gray-100">
            {currentPage}
          </Badge>
          <span className="text-sm text-gray-600">of {totalPages}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            ref={(el) => {
              buttonRefs.current["prev"] = el;
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
            onMouseMove={handleMouseMove("prev")}
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1 relative z-10" />
            <span className="relative z-10">Previous</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["page1"] = el;
            }}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white ripple cursor-glow"
            onMouseMove={handleMouseMove("page1")}
          >
            <span className="relative z-10">{currentPage}</span>
          </Button>
          <Button
            ref={(el) => {
              buttonRefs.current["next"] = el;
            }}
            variant="ghost"
            size="sm"
            className="ripple cursor-glow bg-gray-100 hover:bg-gray-200"
            onMouseMove={handleMouseMove("next")}
            onClick={handleNextPage}
            disabled={currentPage === totalPages || loading}
          >
            <span className="relative z-10">Next</span>
            <ChevronRight className="w-4 h-4 ml-1 relative z-10" />
          </Button>
        </div>
      </div>

      </Tabs>

      <AddUserModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedUserType={selectedUserType}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        roles={roles}
        rolesLoading={rolesLoading}
        contracts={contracts}
        contractsLoading={contractsLoading}
        sites={sites}
        sitesLoading={sitesLoading}
        editLoading={editLoading}
        getTypeColor={getTypeColor}
        handleAddUserSubmit={handleAddUserSubmit}
      />

      <EditUserModal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        roles={roles}
        rolesLoading={rolesLoading}
        contracts={contracts}
        contractsLoading={contractsLoading}
        sites={sites}
        sitesLoading={sitesLoading}
        editLoading={editLoading}
        getTypeColor={getTypeColor}
        handleEditUserSubmit={handleEditUserSubmit}
      />

      <FilterModal
        isFilterModalOpen={isFilterModalOpen}
        setIsFilterModalOpen={setIsFilterModalOpen}
        filters={filters}
        setFilters={setFilters}
        roles={roles}
        contracts={contracts}
        sites={sites}
        applyFilters={applyFilters}
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
            <AddDriver
              userId={newDriverUserId}
              open={isAddDriverModalOpen}
              onOpenChange={setIsAddDriverModalOpen}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              {userToDelete ? ` ${userToDelete.full_name}` : ''} and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteUser();
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
UsersPage.displayName = "UsersPage";