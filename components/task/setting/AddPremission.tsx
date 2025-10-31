"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Plus, Eye, Pencil, Shield } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface User {
  id: number;
  full_name: string;
}
interface TaskType {
  id: number;
  name: string;
  is_active: boolean;
}

interface AddPermissionButtonProps {
  onSuccess?: () => void;
  defaultGrantorId?: number;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export default function AddPermissionButton({
  onSuccess,
  defaultGrantorId,
  variant = "default",
  size = "default",
  label = "Add Permission",
}: AddPermissionButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [grantor, setGrantor] = useState<number | null>(defaultGrantorId ?? null);
  const [target, setTarget] = useState<number | null>(null);
  const [level, setLevel] = useState<"view" | "edit" | "all">("view");
  const [taskType, setTaskType] = useState<number | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  const cookies = useCookies();
  const token = cookies.get("access_token") ?? "";

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load users");
    const { data } = await res.json();
    const list = data.results
      .filter((u: any) => u.is_active)
      .map((u: any) => ({ id: u.id, full_name: u.full_name }))
      .sort((a: User, b: User) => a.full_name.localeCompare(b.full_name));
    setUsers(list);
  };

  const fetchTaskTypes = async () => {
    const res = await fetch(`${API_URL}/api/task-types/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load task types");
    const { results } = await res.json();
    setTaskTypes(results?.filter((t: TaskType) => t.is_active) ?? []);
  };

  useEffect(() => {
    if (open && users.length === 0) {
      Promise.all([fetchUsers(), fetchTaskTypes()]).catch((e) => {
        toast({
          title: "Error",
          description: (e as Error).message,
          variant: "destructive",
        });
      });
    }
  }, [open, users.length, token]);

  const closeDialog = () => {
    setOpen(false);
    setGrantor(defaultGrantorId ?? null);
    setTarget(null);
    setLevel("view");
    setTaskType(null);
  };

  const save = async () => {
    if (!grantor || !target) {
      toast({
        title: "Validation",
        description: "Grantor and Target user are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user: grantor,
        target_user: target,
        permission_level: level,
        task_type: taskType,
      };

      const res = await fetch(`${API_URL}/api/user-task-permissions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create permission");
      }

      toast({
        title: "Success",
        description: "Permission created",
      });

      onSuccess?.();
      closeDialog();
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>
              Grant a user access to another user’s tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grantor">Grantor User *</Label>
              <Select
                value={grantor?.toString() ?? ""}
                onValueChange={(v) => setGrantor(Number(v))}
                disabled={!!defaultGrantorId}
              >
                <SelectTrigger id="grantor">
                  <SelectValue placeholder="Select grantor" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target User *</Label>
              <Select
                value={target?.toString() ?? ""}
                onValueChange={(v) => setTarget(Number(v))}
              >
                <SelectTrigger id="target">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Permission Level *</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      View Only
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-orange-600" />
                      View & Edit
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Full Access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type (optional)</Label>
              <Select
                value={taskType?.toString() ?? "null"}
                onValueChange={(v) =>
                  setTaskType(v === "null" ? null : Number(v))
                }
              >
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="All task types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">All task types</SelectItem>
                  {taskTypes.map((tt) => (
                    <SelectItem key={tt.id} value={tt.id.toString()}>
                      {tt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}