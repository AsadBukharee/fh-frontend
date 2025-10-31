"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Search, Trash2, Plus } from "lucide-react";
import ExportButton from "@/app/utils/ExportButton";
import { Badge } from "@/components/ui/badge";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

// Dialog & Select
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Types
interface Permission {
  id: number;
  user: { id: number; full_name: string };
  target_user: { id: number; full_name: string };
  permission_level: string | null;
  task_type: { id: number; name: string } | null;
}

interface CellPermission {
  level: string | null;
  id: number | null;
}

interface MatrixRow {
  targetUserId: number;
  targetUserName: string;
  permissions: Record<number, CellPermission>; // userId → { level, id }
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

/* ------------------------------------------------------------------ */
/*                     ACTION CELL (Edit / Delete)                    */
/* ------------------------------------------------------------------ */
const ActionCell = ({
  row,
  allUsers,
  openModal,
  deletePermission,
}: {
  row: MatrixRow;
  allUsers: User[];
  openModal: (targetUserId: number, userId: number, permission?: Permission) => void;
  deletePermission: (id: number) => Promise<void>;
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {allUsers.map((user) => {
        const perm = row.permissions[user.id] ?? { level: null, id: null };
        // Show edit always (even if level is null → create new)
        return (
          <Button
            key={user.id}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() =>
              openModal(
                row.targetUserId,
                user.id,
                perm.id
                  ? {
                      id: perm.id,
                      user: { id: user.id, full_name: user.full_name },
                      target_user: { id: row.targetUserId, full_name: row.targetUserName },
                      permission_level: perm.level,
                      task_type: null,
                    }
                  : undefined
              )
            }
            title="Edit / Add"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      })}

      {/* Delete buttons (only when permission exists) */}
      {allUsers.map((user) => {
        const perm = row.permissions[user.id];
        if (!perm?.id) return null;
        return (
          <Button
            key={`${user.id}-del`}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-600 hover:text-red-800"
            onClick={() => deletePermission(perm.id!)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      })}

      {/* Add button when row has no permission at all */}
      {allUsers.every((u) => !row.permissions[u.id]?.level) && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => openModal(row.targetUserId, allUsers[0]?.id ?? 0)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*                         MAIN COMPONENT                              */
/* ------------------------------------------------------------------ */
export default function SettingDialog() {
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    targetUserId: number;
    userId: number;
    permission?: Permission;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const cookies = useCookies();

  /* -------------------------- API Calls -------------------------- */
  const loadTaskTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/task-types/`, {
        headers: { Authorization: `Bearer ${cookies.get("access_token") || ""}` },
      });
      if (!res.ok) throw new Error("Failed to load task types");
      const data = await res.json();
      setTaskTypes(data.results ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user-task-permissions/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      const permissions: Permission[] = data.results || [];

      const userMap = new Map<number, string>();
      permissions.forEach((p) => {
        userMap.set(p.user.id, p.user.full_name);
        userMap.set(p.target_user.id, p.target_user.full_name);
      });

      const uniqueUsers: User[] = Array.from(userMap.entries())
        .map(([id, full_name]) => ({ id, full_name }))
        .sort((a, b) => a.id - b.id);

      const targetMap = new Map<number, Record<number, CellPermission>>();

      permissions.forEach((p) => {
        const targetId = p.target_user.id;
        const userId = p.user.id;
        const level = p.permission_level || null;

        if (!targetMap.has(targetId)) targetMap.set(targetId, {});

        const row = targetMap.get(targetId)!;
        const priority: Record<string, number> = { all: 3, edit: 2, view: 1, none: 0 };
        const existing = row[userId]?.level || "none";

        if (!existing || priority[level!] > priority[existing]) {
          row[userId] = { level, id: p.id };
        }
      });

      const matrix: MatrixRow[] = Array.from(targetMap.entries())
        .map(([targetUserId, permissions]) => ({
          targetUserId,
          targetUserName: userMap.get(targetUserId) || `User ${targetUserId}`,
          permissions,
        }))
        .sort((a, b) => a.targetUserId - b.targetUserId);

      setMatrixData(matrix);
      setAllUsers(uniqueUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPermissions(), loadTaskTypes()]);
      setLoading(false);
    };
    init();
  }, []);

  /* -------------------------- CRUD -------------------------- */
  const savePermission = async (payload: any) => {
    const token = cookies.get("access_token") || "";
    const isEdit = !!editingCell?.permission?.id;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? `${API_URL}/api/user-task-permissions/${editingCell!.permission!.id}/`
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
      throw new Error(err.detail || err.message || "Save failed");
    }

    await fetchPermissions();
  };

  const deletePermission = async (permissionId: number) => {
    if (!confirm("Delete this permission?")) return;

    const res = await fetch(`${API_URL}/api/user-task-permissions/${permissionId}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cookies.get("access_token") || ""}` },
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Delete failed");
    } else {
      await fetchPermissions();
    }
  };

  const openModal = (targetUserId: number, userId: number, permission?: Permission) => {
    setEditingCell({ targetUserId, userId, permission });
    setShowModal(true);
  };

  /* -------------------------- Helpers -------------------------- */
  const renderPermissionBadges = (level: string | null) => {
    if (!level || level === "none")
      return <span className="text-muted-foreground text-xs">—</span>;

    const items = [];
    if (level === "all" || level === "view")
      items.push({ icon: <Eye size={12} />, color: "green", label: "View" });
    if (level === "all" || level === "edit")
      items.push({ icon: <Pencil size={12} />, color: "blue", label: "Edit" });
    if (level === "all")
      items.push({ icon: <Trash2 size={12} />, color: "red", label: "Delete" });

    return (
      <div className="flex justify-center gap-1">
        {items.map((i, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className={`bg-${i.color}-100 text-${i.color}-800 text-xs py-0.5 px-1.5`}
          >
            {i.icon}
            <span className="ml-1">{i.label}</span>
          </Badge>
        ))}
      </div>
    );
  };

  /* -------------------------- Export -------------------------- */
  const exportData = matrixData
    .filter((row) => row.targetUserName.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((row) => {
      const obj: any = { "Target User": row.targetUserName };
      allUsers.forEach((u) => {
        const p = row.permissions[u.id];
        const level = p?.level;
        obj[u.full_name] =
          level === "all"
            ? "View, Edit, Delete"
            : level === "edit"
            ? "Edit"
            : level === "view"
            ? "View"
            : "None";
      });
      return obj;
    });

  const filteredMatrix = matrixData.filter((row) =>
    row.targetUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* -------------------------- Render -------------------------- */
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-600 text-center">Error: {error}</div>;

  return (
    <div className="container mx-auto bg-white p-4 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Task List View/Edit Permissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click the pencil icon to edit / add a permission
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={exportData} fileName="task_permissions_matrix" />
          <Button size="sm" onClick={() => openModal(0, 0)}>
            <Plus className="w-4 h-4 mr-1" /> Add Permission
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 w-full max-w-xs relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="sticky left-0 bg-gray-50 z-20 w-16">#</TableHead>
              <TableHead className="sticky left-16 bg-gray-50 z-20 min-w-48">
                Target User
              </TableHead>
              {allUsers.map((user) => (
                <TableHead key={user.id} className="text-center min-w-32">
                  {user.full_name}
                </TableHead>
              ))}
              <TableHead className="text-center w-28">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredMatrix.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={allUsers.length + 3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No permissions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMatrix.map((row, idx) => (
                <TableRow key={row.targetUserId} className="hover:bg-gray-50">
                  {/* Row index */}
                  <TableCell className="sticky left-0 bg-white z-10 font-medium">
                    {idx + 1}
                  </TableCell>

                  {/* Target user name */}
                  <TableCell className="sticky left-16 bg-white z-10 font-medium text-gray-900">
                    {row.targetUserName}
                  </TableCell>

                  {/* Permission cells (badges) */}
                  {allUsers.map((user) => {
                    const perm = row.permissions[user.id] ?? { level: null, id: null };
                    return (
                      <TableCell key={user.id} className="text-center">
                        {renderPermissionBadges(perm.level)}
                      </TableCell>
                    );
                  })}

                  {/* ACTION COLUMN */}
                  <TableCell className="text-center">
                    <ActionCell
                      row={row}
                      allUsers={allUsers}
                      openModal={openModal}
                      deletePermission={deletePermission}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <PermissionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCell(null);
        }}
        cell={editingCell}
        users={allUsers}
        taskTypes={taskTypes}
        onSave={savePermission}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                              MODAL                                 */
/* ------------------------------------------------------------------ */
const PermissionModal = ({
  isOpen,
  onClose,
  cell,
  users,
  taskTypes,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  cell: { targetUserId: number; userId: number; permission?: Permission } | null;
  users: User[];
  taskTypes: TaskType[];
  onSave: (p: any) => Promise<void>;
}) => {
  const [form, setForm] = useState({
    user: cell?.userId?.toString() ?? "",
    target_user: cell?.targetUserId?.toString() ?? "",
    permission_level: cell?.permission?.permission_level ?? "none",
    task_type: cell?.permission?.task_type?.id?.toString() ?? "",
  });

  const handleSubmit = async () => {
    if (!form.user || !form.target_user) {
      alert("Select both users");
      return;
    }

    const payload = {
      user: Number(form.user),
      target_user: Number(form.target_user),
      permission_level: form.permission_level === "none" ? null : form.permission_level,
      task_type: form.task_type ? Number(form.task_type) : null,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cell?.permission ? "Edit" : "Add"} Permission</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Grantor</Label>
            <Select value={form.user} onValueChange={(v) => setForm((p) => ({ ...p, user: v }))}>
              <SelectTrigger><SelectValue placeholder="Select grantor..." /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Target User</Label>
            <Select
              value={form.target_user}
              onValueChange={(v) => setForm((p) => ({ ...p, target_user: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select target..." /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Permission Level</Label>
            <Select
              value={form.permission_level}
              onValueChange={(v) => setForm((p) => ({ ...p, permission_level: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Task Type (Optional)</Label>
            <Select
              value={form.task_type}
              onValueChange={(v) => setForm((p) => ({ ...p, task_type: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Task Type</SelectItem>
                {taskTypes.filter((t) => t.is_active).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{cell?.permission ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};