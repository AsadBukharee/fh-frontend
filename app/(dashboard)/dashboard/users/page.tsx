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
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { useToast } from "@/app/Context/ToastContext";
import AddDriver from "@/components/add-driver/page";
import { debounce } from "lodash";

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
  role: string | null;
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
  role: string;
  contractId?: string;
  siteId?: string;
  is_active: boolean;
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
        {user.display_name}
      </TableCell>
      <TableCell>
        <Badge className={getTypeColor(user.role)}>
          {user.role
            ? roles.find((role) => role.slug === user.role)?.name || user.role
            : "Unassigned"}
        </Badge>
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
              className="text-red-600"
              onClick={() => handleDeleteUserClick(user)}
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
    formErrors: Partial<UserForm>;
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
              <Select
                name="role"
                required
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder={`Select role (default: ${selectedUserType})`} />
                </SelectTrigger>
                <SelectContent>
                  {rolesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading roles...
                      </div>
                    </SelectItem>
                  ) : roles.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No roles available
                    </SelectItem>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.slug}>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(role.slug)} variant="secondary">
                            {role.name}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
                <Select
                  name="site"
                  value={formData.siteId}
                  onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Site</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        <div className="space-y-1">
                          <div className="font-medium">{site.name}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    formErrors: Partial<UserForm>;
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
                <Label htmlFor="edit-role">User Role</Label>
                <Select
                  name="role"
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading roles...
                        </div>
                      </SelectItem>
                    ) : roles.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No roles available
                      </SelectItem>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.slug}>
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(role.slug)} variant="secondary">
                              {role.name}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                <Select
                  name="site"
                  value={formData.siteId}
                  onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Site</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        <div className="space-y-1">
                          <div className="font-medium">{site.name}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

// UsersPage Component
export default function UsersPage() {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverUserId, setNewDriverUserId] = useState<number | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<UserForm>({
    email: "",
    full_name: "",
    role: "",
    contractId: "none",
    siteId: "none",
    is_active: true,
    password: "",
    password_confirm: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<UserForm>>({});
  const perPage = 10;
  const { showToast } = useToast();
  const cookies = useCookies();

  // Debounced search handler
  const debouncedFetchUsers = useMemo(
    () =>
      debounce(async (query: string, page: number) => {
        setLoading(true);
        try {
          const url = `${API_URL}/users/?page=${page}&per_page=${perPage}${
            query ? `&q=${encodeURIComponent(query)}` : ""
          }`;
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
            setUsers(data.data);
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
    [cookies, showToast, perPage],
  );

  const fetchUsers = useCallback(() => {
    debouncedFetchUsers(searchQuery, currentPage);
  }, [debouncedFetchUsers, searchQuery, currentPage]);

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
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    if (isEditModalOpen || isModalOpen) {
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
  }, [isEditModalOpen, isModalOpen, cookies, showToast, contracts.length, sites.length]);

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

  const handleAddUserClick = useCallback((type: string) => {
    setSelectedUserType(type);
    setFormData({
      email: "",
      full_name: "",
      role: roles.find((role) => role.name.toLowerCase() === type.toLowerCase())?.slug || "",
      contractId: "none",
      siteId: "none",
      is_active: true,
      password: "",
      password_confirm: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }, [roles]);

  const handleEditUserClick = useCallback((user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role || "",
      contractId: user.contract?.id?.toString() || "none",
      siteId: user.site && user.site.length > 0 ? user.site[0].id.toString() : "none",
      is_active: user.is_active,
      password: "",
      password_confirm: "",
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteUserClick = useCallback((user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  }, []);

  const validateAddUserForm = useCallback((formData: FormData): Partial<UserForm> => {
    const errors: Partial<UserForm> = {};

    const email = formData.get("email") as string;
    const full_name = formData.get("full_name") as string;
    const password = formData.get("password") as string;
    const password_confirm = formData.get("password_confirm") as string;
    const role = formData.get("role") as string;

    if (!email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!full_name?.trim()) {
      errors.full_name = "Full name is required";
    } else if (full_name.trim().length < 2) {
      errors.full_name = "Full name must be at least 2 characters";
    }

    if (!password?.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!password_confirm?.trim()) {
      errors.password_confirm = "Password confirmation is required";
    } else if (password !== password_confirm) {
      errors.password_confirm = "Passwords do not match";
    }

    if (!role) {
      errors.role = "Role is required";
    }

    return errors;
  }, []);

  const validateEditUserForm = useCallback((data: UserForm): Partial<UserForm> => {
    const errors: Partial<UserForm> = {};

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

    if (!data.role) {
      errors.role = "Role is required";
    }

    return errors;
  }, []);

  const handleAddUserSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const errors = validateAddUserForm(formData);

      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        showToast("Please fix the form errors", "error");
        return;
      }

      const newUser = {
        email: formData.get("email") as string,
        full_name: formData.get("full_name") as string,
        password: formData.get("password") as string,
        password_confirm: formData.get("password_confirm") as string,
        role: formData.get("role") as string,
        contractId: formData.get("contract") as string | undefined,
        siteId: formData.get("site") as string | undefined,
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

            if (newUser.siteId && newUser.siteId !== "none") {
              promises.push(
                fetch(`${API_URL}/users/${userId}/allocate-sites/`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.get("access_token")}`,
                  },
                  body: JSON.stringify({ site_ids: [Number.parseInt(newUser.siteId)] }),
                }),
              );
            }

            await Promise.all(promises);

            if (newUser.role.toLowerCase() === "driver") {
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
    [cookies, fetchUsers, showToast],
  );

  const handleEditUserSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const editFormData: UserForm = {
        email: form.get("email") as string,
        full_name: form.get("full_name") as string,
        role: form.get("role") as string,
        contractId: form.get("contract") as string,
        siteId: form.get("site") as string,
        is_active: (form.get("is_active") as string) === "on",
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

        promises.push(
          fetch(`${API_URL}/users/${selectedUser.id}/allocate-sites/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.get("access_token")}`,
            },
            body: JSON.stringify({
              site_ids: editFormData.siteId && editFormData.siteId !== "none" ? [Number.parseInt(editFormData.siteId)] : [],
            }),
          }),
        );

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
    [cookies, fetchUsers, selectedUser, showToast, validateEditUserForm],
  );

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${API_URL}/users/${userToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(
          data.message || `${userToDelete.full_name} has been deleted successfully`,
          "success",
        );
        await fetchUsers();
      } else {
        showToast(data.message || "Failed to delete user", "error");
      }
    } catch {
      showToast("An error occurred while deleting the user", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }, [cookies, fetchUsers, showToast, userToDelete]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  return (
    <div className="p-6 bg-white">
      <header className="bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Manage your team members and their permissions</p>
          </div>
          <div className="space-x-2 flex">
            <button className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 border rounded flex border-gray-50 shadow justify-center items-center gap-2 text-gray-700 hover:bg-gray-100">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 border border-gray-50 shadow rounded flex justify-center items-center gap-2 text-gray-700 hover:bg-gray-100"
            >
              Refresh
            </button>
            <Button
              ref={(el) => {
                buttonRefs.current["add-user"] = el;
              }}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-white font-medium shadow-md transition-all duration-300 hover:opacity-90"
              style={{
                background: "linear-gradient(90deg, #f85032 0%, #e73827 20%, #662D8C 100%)",
              }}
              onClick={() => handleAddUserClick("driver")}
              onMouseMove={handleMouseMove("add-user")}
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <div className="mb-6">
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
              {users.map((user) => (
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
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.full_name}</strong>? This action
              cannot be undone and will permanently remove the user from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
UsersPage.displayName = "UsersPage";