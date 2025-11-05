"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X } from "lucide-react";
import ExportButton from "@/app/utils/ExportButton";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { toast } from "@/components/ui/use-toast";
import { PermissionDialog } from "./PermissionDialog";
import { PermissionTable } from "./PermissionTable";
import { PermissionSkeleton } from "./PermissionSkeleton";

interface Permission {
  id: number;
  user: { id: number; full_name: string };
  target_user: { id: number; full_name: string };
  permission_level: string | null;
  task_type: { id: number; name: string } | null;
}

interface MatrixRow {
  targetUserId: number;
  targetUserName: string;
  permissions: Record<number, { level: string; id: number } | null>;
}

interface User {
  id: number;
  full_name: string;
}

interface TaskType {
  id: number;
  name: string;
  is_active: boolean;
}

export default function PermissionMatrix() {
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsersForDropdown, setAllUsersForDropdown] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedGrantor, setSelectedGrantor] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("view");
  const [selectedTaskType, setSelectedTaskType] = useState<number | null>(null);
  const [editingPermId, setEditingPermId] = useState<number | null>(null);

  const cookies = useCookies();
  const token = cookies.get("access_token") ?? "";

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load users");
    const { data } = await res.json();
    return data.results
      .filter((u: any) => u.is_active)
      .map((u: any) => ({ id: u.id, full_name: u.full_name }))
      .sort((a: User, b: User) => a.full_name.localeCompare(b.full_name));
  };

  const fetchPermissions = async () => {
    const res = await fetch(`${API_URL}/api/user-task-permissions/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load permissions");
    const { results }: { results: Permission[] } = await res.json();

    const userMap = new Map<number, string>();
    const grantorSet = new Set<number>();
    const targetSet = new Set<number>();

    results.forEach((p) => {
      if (p.user) {
        userMap.set(p.user.id, p.user.full_name);
        grantorSet.add(p.user.id);
      }
      if (p.target_user) {
        userMap.set(p.target_user.id, p.target_user.full_name);
        targetSet.add(p.target_user.id);
      }
    });

    const permissionUsers = Array.from(grantorSet)
      .map((id) => ({ id, full_name: userMap.get(id) ?? `User ${id}` }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    setUsers(permissionUsers);

    const targetMap = new Map<number, Record<number, { level: string; id: number } | null>>();
    results.forEach((p) => {
      if (!p.permission_level) return;
      const tId = p.target_user.id;
      const uId = p.user.id;
      const lvl = p.permission_level as "all" | "edit" | "view";

      if (!targetMap.has(tId)) targetMap.set(tId, {});
      const row = targetMap.get(tId)!;
      const priority = { all: 3, edit: 2, view: 1 };
      const cur = row[uId]?.level as keyof typeof priority | undefined;

      if (!cur || priority[lvl] > priority[cur]) {
        row[uId] = { level: lvl, id: p.id };
      }
    });

    const built: MatrixRow[] = Array.from(targetMap.entries())
      .map(([targetUserId, permissions]) => ({
        targetUserId,
        targetUserName: userMap.get(targetUserId) ?? `User ${targetUserId}`,
        permissions,
      }))
      .sort((a, b) => a.targetUserName.localeCompare(b.targetUserName));

    setMatrix(built);
  };

  const loadTaskTypes = async () => {
    const res = await fetch(`${API_URL}/api/task-types/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load task types");
    const { results } = await res.json();
    setTaskTypes(results?.filter((t: TaskType) => t.is_active) ?? []);
  };

  const savePermission = async () => {
    if (!selectedGrantor || !selectedTarget || !selectedLevel) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user: selectedGrantor,
        target_user: selectedTarget,
        permission_level: selectedLevel,
        task_type: selectedTaskType,
      };

      const method = editMode ? "PATCH" : "POST";
      const url = editMode
        ? `${API_URL}/api/user-task-permissions/${editingPermId}/`
        : `${API_URL}/api/user-task-permissions/`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Save failed");
      }

      toast({ title: editMode ? "Updated" : "Created", description: `Permission ${editMode ? "updated" : "created"} successfully` });
      await fetchPermissions();
      closeDialog();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deletePermission = async (permId: number) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;
    try {
      const res = await fetch(`${API_URL}/api/user-task-permissions/${permId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Deleted", description: "Permission deleted successfully" });
      await fetchPermissions();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const openAddDialog = () => {
    setEditMode(false);
    setSelectedGrantor(null);
    setSelectedTarget(null);
    setSelectedLevel("view");
    setSelectedTaskType(null);
    setEditingPermId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (targetId: number, grantorId: number) => {
    const row = matrix.find((r) => r.targetUserId === targetId);
    const perm = row?.permissions[grantorId];
    if (!perm) return;

    setEditMode(true);
    setSelectedGrantor(grantorId);
    setSelectedTarget(targetId);
    setSelectedLevel(perm.level);
    setSelectedTaskType(null);
    setEditingPermId(perm.id);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedGrantor(null);
    setSelectedTarget(null);
    setSelectedLevel("view");
    setSelectedTaskType(null);
    setEditingPermId(null);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const allUsers = await fetchUsers();
        await fetchPermissions();
        await loadTaskTypes();
        setAllUsersForDropdown(allUsers);
      } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const filtered = useMemo(() => {
    if (!search) return matrix;
    const q = search.toLowerCase();
    return matrix.filter((r) => r.targetUserName.toLowerCase().includes(q));
  }, [matrix, search]);

  const exportData = filtered.map((row) => {
    const o: any = { "Target User": row.targetUserName };
    users.forEach((u) => {
      const p = row.permissions[u.id];
      o[u.full_name] =
        p?.level === "all"
          ? "View, Edit, Delete"
          : p?.level === "edit"
          ? "Edit"
          : p?.level === "view"
          ? "View"
          : "None";
    });
    return o;
  });

  if (loading) return <PermissionSkeleton />;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Permission Matrix</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage task list view and edit permissions for all users
          </p>
        </div>

        <div className="bg-white">
          <div className="p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by target user name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <ExportButton data={exportData} fileName="permission_matrix" />
                <Button onClick={openAddDialog} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Permission
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto py-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="sticky left-0 bg-gray-50 z-20 font-semibold text-gray-900 w-12">
                    #
                  </TableHead>
                  <TableHead className="sticky left-12 bg-gray-50 z-20 font-semibold text-gray-900 min-w-48">
                    Target User
                  </TableHead>
                  {users.map((u) => (
                    <TableHead key={u.id} className="text-center min-w-40 font-semibold text-gray-900">
                      <div className="flex flex-col items-center gap-1">
                        <span>{u.full_name}</span>
                        <span className="text-xs font-normal text-gray-500">Grantor</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <PermissionTable
                  filtered={filtered}
                  users={users}
                  matrix={matrix}
                  onEdit={openEditDialog}
                  onDelete={deletePermission}
                />
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <PermissionDialog
        open={dialogOpen}
        editMode={editMode}
        submitting={submitting}
        selectedGrantor={selectedGrantor}
        selectedTarget={selectedTarget}
        selectedLevel={selectedLevel}
        selectedTaskType={selectedTaskType}
        taskTypes={taskTypes}
        onClose={closeDialog}
        onSave={savePermission}
        onGrantorChange={setSelectedGrantor}
        onTargetChange={setSelectedTarget}
        onLevelChange={setSelectedLevel}
        onTaskTypeChange={setSelectedTaskType}
      />
    </div>
  );
}